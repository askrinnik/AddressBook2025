# Writes reports/<Run>_harness-report.md from run-history.csv. The report is generic per fixture: a plain-language
# summary first, then context and cost for every fixture, a score and a verdict for judged fixtures, start-context
# detail for fixtures flagged "startContext", and a comparison of each fixture with the previous run that contains it.
$script:rinv = [Globalization.CultureInfo]::InvariantCulture

function RNum($x) { if ([string]::IsNullOrWhiteSpace([string]$x)) { $null } else { [double]::Parse(([string]$x), $script:rinv) } }
function RFmt($x) {
  if ($null -eq $x) { '' }
  elseif ([Math]::Abs([double]$x) -ge 100) { [Math]::Round([double]$x).ToString('0', $script:rinv) }   # token-sized values are whole numbers
  else { ([double]$x).ToString('0.##', $script:rinv) }
}
function RSgn($x) { if ($null -eq $x) { '' } elseif ($x -gt 0) { '+' + (RFmt $x) } else { RFmt $x } }
function RMean($rows, $col) {
  $v = @($rows | ForEach-Object { RNum $_.$col } | Where-Object { $null -ne $_ })
  if ($v.Count) { ($v | Measure-Object -Average).Average } else { $null }
}
function RDelta($cur, $prev) { if ($null -eq $cur -or $null -eq $prev) { $null } else { $cur - $prev } }
function RDlt($d) { if ($null -eq $d) { '' } else { " (Δ $(RSgn $d))" } }   # " (Δ +25)" appended to a value
function RMcp($x) { if ([string]::IsNullOrEmpty([string]$x)) { 'environment' } else { [string]$x } }

# values of a per-session number (or a difference of two columns) over the repetitions, as @(...)
function RValues($rows, $col, $minus = $null) {
  @($rows | ForEach-Object { $a = RNum $_.$col; if ($minus) { $b = RNum $_.$minus; if ($null -ne $a -and $null -ne $b) { $a - $b } } else { $a } } | Where-Object { $null -ne $_ })
}
# "mean (min-max)" when there are several repetitions, the value itself otherwise
function RRange($vals) {
  if (-not $vals.Count) { return '' }
  $m = ($vals | Measure-Object -Average).Average
  if ($vals.Count -eq 1) { return (RFmt $m) }
  "$(RFmt $m) ($(RFmt ($vals | Measure-Object -Minimum).Minimum)-$(RFmt ($vals | Measure-Object -Maximum).Maximum))"
}
function RRulesText($rows) { $h = RRules $rows; if (-not $h.Count) { 'none' } else { (($h.Keys | Sort-Object | ForEach-Object { "$_=$($h[$_])" }) -join '<br>') } }   # one rule per line inside a table cell

# "a=1; b=2" -> @{ a = 1; b = 2 }, taking the largest size of a rule over the given rows
function RRules($rows) {
  $h = @{}
  foreach ($r in $rows) {
    foreach ($e in @(([string]$r.RulesLoaded) -split '; ' | Where-Object { $_ })) {
      if ($e -match '^(.+?)=(\d+)$') { $n = $Matches[1]; $v = [int]$Matches[2]; if (-not $h.ContainsKey($n) -or $h[$n] -lt $v) { $h[$n] = $v } }
    }
  }
  $h
}

# how the rules loaded by a fixture differ from the previous run: added, removed and resized rules
function RRuleChanges($curRows, $prevRows) {
  $c = RRules $curRows; $p = RRules $prevRows; $out = @()
  foreach ($n in ($c.Keys | Sort-Object)) { if (-not $p.ContainsKey($n)) { $out += "+$n ($($c[$n]))" } elseif ([Math]::Abs($c[$n] - $p[$n]) -gt 50) { $out += "$n $($p[$n])->$($c[$n])" } }
  foreach ($n in ($p.Keys | Sort-Object)) { if (-not $c.ContainsKey($n)) { $out += "-$n ($($p[$n]))" } }
  $out
}

function Write-HarnessReport($all, $run, $reportsDir, $repoRoot, $fixturesDir) {
  $cur = @($all | Where-Object { $_.Run -eq $run })
  if (-not $cur) { throw "Run '$run' has no rows in the history" }
  $c0 = $cur[0]
  $earlier = @($all | ForEach-Object { $_.Run } | Select-Object -Unique | Where-Object { [string]::CompareOrdinal($_, $run) -lt 0 } | Sort-Object)
  $prevRunId = $earlier | Select-Object -Last 1
  $p0 = if ($prevRunId) { @($all | Where-Object { $_.Run -eq $prevRunId })[0] } else { $null }
  $tests = @($cur | ForEach-Object { $_.Test } | Select-Object -Unique | Sort-Object)
  $areaParts = [ordered]@{ 'Built-in tool definitions' = 'BuiltinToolTok'; 'MCP tool definitions (loaded)' = 'McpToolTok'; 'System prompt' = 'SystemTok'; 'CLAUDE.md' = 'ClaudeMdTok'; 'Memory index' = 'MemoryTok'; 'Skill list' = 'SkillTok'; 'Agent list' = 'AgentTok'; 'Deferred tool names' = 'DeferredTok'; 'MCP server instructions' = 'McpInstrTok' }

  # previous run that contains a fixture, and its rows
  function PrevRows($test) {
    foreach ($id in ($earlier | Sort-Object -Descending)) {
      $r = @($all | Where-Object { $_.Run -eq $id -and $_.Test -eq $test })
      if ($r.Count) { return $r }
    }
    return @()
  }
  # tools a fixture's sessions had: the fixture's --tools list, or "all built-in" (with the size of their definitions) when it sets none
  function ToolsText($test, $rows) {
    $fx = Join-Path $fixturesDir "$test/fixture.json"
    $list = if (Test-Path $fx) { [string](Get-Content $fx -Raw | ConvertFrom-Json).tools } else { '' }
    if ($list) { return (($list -split ',' | ForEach-Object { $_.Trim() }) -join '<br>') }
    $n = RMean $rows 'Tools'; $tok = RMean $rows 'BuiltinToolTok'
    if ($n -and $tok) { "all built-in<br>($(RFmt $n) tools, $(RFmt $tok) tokens)" } else { 'all built-in' }
  }
  function StartsContext($test) {
    $f = Join-Path $fixturesDir "$test/fixture.json"
    (Test-Path $f) -and [bool](Get-Content $f -Raw | ConvertFrom-Json).startContext
  }

  # ---- gather per-fixture facts once; the summary and the tables both use them
  $facts = @{}
  foreach ($t in $tests) {
    $cr = @($cur | Where-Object { $_.Test -eq $t }); $pr = @(PrevRows $t)
    $cf = RMean $cr 'FirstCtx'; $cl = RMean $cr 'LastCtx'; $pf = RMean $pr 'FirstCtx'; $pl = RMean $pr 'LastCtx'
    $f = [ordered]@{ Cur = $cr; Prev = $pr; PrevRun = $(if ($pr.Count) { $pr[0].Run } else { '' }); CF = $cf; CL = $cl; PF = $pf; PL = $pl
      Read = $(if ($null -ne $cf -and $null -ne $cl) { $cl - $cf }); PRead = $(if ($null -ne $pf -and $null -ne $pl) { $pl - $pf })
      McpNotReady = (@($cr | Where-Object { [int](RNum $_.McpNotReady) -gt 0 }).Count -gt 0) -or (@($pr | Where-Object { [int](RNum $_.McpNotReady) -gt 0 }).Count -gt 0)
      RuleChanges = @(); Score = $null; Verdict = '' }
    if ($pr.Count -and ($pr | Where-Object { $_.RulesLoaded -ne '' -or $_.FirstCtx -ne '' })) { $f.RuleChanges = @(RRuleChanges $cr $pr) }
    $crs = @($cr | Where-Object { $_.Score -ne '' })
    if ($crs.Count) {
      $prs = @($pr | Where-Object { $_.Score -ne '' })
      $cs = @($crs | ForEach-Object { RNum $_.Score }); $max = RNum $crs[0].Max
      $mean = ($cs | Measure-Object -Average).Average
      $f.Score = [ordered]@{ Mean = $mean; Min = ($cs | Measure-Object -Minimum).Minimum; Max = ($cs | Measure-Object -Maximum).Maximum; OutOf = $max
        FP = [int](($crs | ForEach-Object { [int]$_.FalsePositives } | Measure-Object -Sum).Sum); PrevMean = $null; PrevFP = $null; Delta = $null }
      if ($prs.Count) {
        $ps = @($prs | ForEach-Object { RNum $_.Score }); $pmean = ($ps | Measure-Object -Average).Average
        $tol = [Math]::Max((($ps | Measure-Object -Maximum).Maximum - ($ps | Measure-Object -Minimum).Minimum), 0.5)
        $delta = $mean - $pmean; $pfp = [int](($prs | ForEach-Object { [int]$_.FalsePositives } | Measure-Object -Sum).Sum); $fpUp = $f.Score.FP - $pfp
        $verdict = if ($delta -lt -$tol) { 'REGRESSION' } elseif ($fpUp -ge 2) { 'REGRESSION (false positives)' } elseif ($delta -gt $tol) { 'improvement' } else { 'within noise' }
        if ($fpUp -eq 1 -and $verdict -notlike 'REGRESSION*') { $verdict += ' (false positives +1)' }
        $f.Score.PrevMean = $pmean; $f.Score.PrevFP = $pfp; $f.Score.Delta = $delta; $f.Verdict = $verdict
      } else { $f.Verdict = 'no previous run' }
    }
    $facts[$t] = $f
  }

  $sb = New-Object System.Text.StringBuilder
  function Line($t = '') { [void]$sb.AppendLine($t) }
  # ---- per-fixture summary sentences and conclusions (computed first: the overall line at the top needs them)
  $sumLines = @(); $worse = @(); $better = @(); $same = @()
  foreach ($t in $tests) {
    $f = $facts[$t]; $bits = @(); $tok = ''
    $pn = if ($f.PrevRun -eq $prevRunId) { '' } else { " (``$($f.PrevRun)``)" }
    $isStart = StartsContext $t
    $ruleNames = @((RRules $f.Cur).Keys | Sort-Object)
    if ($isStart -and $null -ne $f.CF) {
      $d = RDelta $f.CF $f.PF
      $bits += "**start context**: $(RFmt $f.CF) tokens in the first model call, before any work (tools, system prompt, CLAUDE.md, memory index, skill list); every later call re-reads it."
      if ($null -eq $d) { $bits += 'No earlier run to compare with.' }
      elseif ([Math]::Abs($d) -le 50) { $bits += "Previous run${pn}: $(RFmt $f.PF) ($(RSgn $d)); a difference of up to 50 tokens counts as unchanged."; $tok = 'no change' }
      else {
        $why = @()
        $prevBase = @($f.Prev | Where-Object { $_.Client -eq $f.Cur[0].Client }) | Select-Object -First 1
        if ($prevBase) {
          $sumAreas = 0
          foreach ($k in $areaParts.Keys) { $ad = RDelta (RNum $f.Cur[0].($areaParts[$k])) (RNum $prevBase.($areaParts[$k])); if ($null -ne $ad) { $sumAreas += $ad; if ([Math]::Abs($ad) -gt 20) { $why += "$($k.ToLower()) $(RSgn $ad)" } } }
          $rest = $d - $sumAreas
          if ([Math]::Abs($rest) -gt 100) { $why += "not attributable to any area (reminders, environment, git status) $(RSgn $rest)" }
        }
        $prevDirty = if ($prevBase) { $prevBase.Dirty } else { $f.Prev[0].Dirty }
        if ($f.Cur[0].Dirty -eq 'yes' -and $prevDirty -ne 'yes') { $why += 'this run had uncommitted changes, whose file list is part of the start context and part of the unattributed difference (about 700 tokens per 30 files)' }
        elseif ($f.Cur[0].Dirty -ne 'yes' -and $prevDirty -eq 'yes') { $why += 'the previous run had uncommitted changes, whose file list was part of its start context and part of the unattributed difference (about 700 tokens per 30 files); this run had none' }
        $bits += "Previous run${pn}: $(RFmt $f.PF), so $(RSgn $d). Where it moved: $(if ($why) { $why -join '; ' } else { 'no single area explains it' })."
        $tok = if ($d -gt 0) { 'worse' } else { 'better' }
      }
    } elseif ($f.Cur.Count -gt 1 -and $null -ne $f.Read) {
      # several repetitions: the model decides which files to read, so the amount varies; compare it as a range
      $cv = RValues $f.Cur 'LastCtx' 'FirstCtx'; $pv = RValues $f.Prev 'LastCtx' 'FirstCtx'
      $bits += "one session adds $(RRange $cv) tokens on average (range over $($f.Cur.Count) repeats) in $(RFmt (RMean $f.Cur 'Calls')) model calls on average; this covers the files the model chose to read, the rules loaded for them and its answer."
      if ($pv.Count) {
        $pm = ($pv | Measure-Object -Average).Average; $pspread = ($pv | Measure-Object -Maximum).Maximum - ($pv | Measure-Object -Minimum).Minimum
        $dd = (($cv | Measure-Object -Average).Average) - $pm; $tol = [Math]::Max($pspread, 1000)
        $bits += "Previous run${pn}: $(RRange $pv). Allowed difference: $(RFmt $tol) (the larger of that run's own range and 1000); actual difference: $(RSgn $dd)."
        if ([Math]::Abs($dd) -le $tol) { $tok = 'no change' } else { $tok = if ($dd -gt 0) { 'worse' } else { 'better' } }
      } else { $bits += 'No earlier run to compare with.' }
      if ($f.RuleChanges.Count) { $bits += "Rules loaded changed: $($f.RuleChanges -join ', ')." }
    } elseif ($null -ne $f.Read) {
      $d = RDelta $f.Read $f.PRead
      $bits += "reading one file adds $(RFmt $f.Read) tokens, which is the file plus the rules loaded for that file type ($(if ($ruleNames) { $ruleNames -join ', ' } else { 'none' })) and the answer."
      if ($null -eq $d) { $bits += 'No earlier run to compare with.' }
      elseif ([Math]::Abs($d) -le 50) { $bits += "Previous run${pn}: $(RFmt $f.PRead) ($(RSgn $d)); a difference of up to 50 tokens counts as unchanged."; $tok = 'no change' }
      else {
        $why = if ($f.RuleChanges.Count) { "rules loaded changed: $($f.RuleChanges -join ', ')" }
               elseif ($f.McpNotReady) { 'the same rules were loaded, so it is not a rule change; MCP servers were not ready when a session started and their names and instructions can arrive during the session (about 1000 tokens), the likely cause' }
               else { 'the same rules were loaded and no cause is known; check the answer and the file that was read' }
        $bits += "Previous run${pn}: $(RFmt $f.PRead), so $(RSgn $d). Why: $why."
        $tok = if ($d -gt 0) { 'worse' } else { 'better' }
      }
    }
    $q = ''
    if ($f.Score) {
      $s = $f.Score
      $judge = "Judge: $(RFmt $s.Mean) of $(RFmt $s.OutOf) checklist items found$(if ($s.Min -ne $s.Max) { " (lowest repeat $(RFmt $s.Min))" })$(if ($null -ne $s.PrevMean) { " (previous run $(RFmt $s.PrevMean))" }), $($s.FP) false positive(s)."
      $bits += $judge
      $q = if ($f.Verdict -like 'REGRESSION*') { 'worse' } elseif ($f.Verdict -like 'improvement*') { 'better' } elseif ($f.Verdict -like 'within noise*') { 'no change' } else { '' }
    }
    $words = @()
    if ($tok) { $words += "tokens $(switch ($tok) { 'no change' { 'unchanged' } 'worse' { 'worse (more tokens)' } 'better' { 'better (fewer tokens)' } })" }
    if ($q) { $words += "quality $(switch ($q) { 'no change' { 'unchanged (within noise)' } 'worse' { 'REGRESSION' } 'better' { 'improvement' } })$(if ($f.Verdict -match '\(false positives \+1\)') { ', one extra false positive noted' })" }
    $concl = if ($words) { " **-> $($words -join '; ').**" } else { '' }
    $sumLines += "- **$t**: $($bits -join ' ')$concl"
    if ($tok -eq 'worse' -or $q -eq 'worse') { $worse += $t } elseif ($tok -eq 'better' -or $q -eq 'better') { $better += $t } else { $same += $t }
  }

  # ---- header, overall line and reading guide
  Line "# Harness report: $run"
  Line
  $overall = if (-not $p0) { 'First run in the history: nothing to compare with.' }
             elseif ($worse) { "**Overall: worse in $($worse -join ', ')** (see Summary for what moved and why)." + $(if ($better) { " Better in $($better -join ', ')." }) }
             elseif ($better) { "**Overall: no regressions; better in $($better -join ', ').**" }
             else { "**Overall: no regressions.** $($same.Count) of $($tests.Count) fixtures were compared with ``$prevRunId`` and none changed beyond the noise." }
  Line $overall
  Line
  Line "- **Note:** $(if ($c0.Note) { $c0.Note } else { '(none)' })"
  Line "- **Setup:** commit $($c0.Commit), uncommitted changes at start: $($c0.Dirty); Claude Code $($c0.Version), model $($c0.Model), effort $($c0.Effort), harness $($c0.Harness), MCP servers: $(RMcp $c0.Mcp)."
  Line "- **Fixtures** (one test each): $($tests -join ', ')."
  Line "- **Compared with:** $(if ($p0) { "the most recent earlier run, ``$prevRunId`` (commit $($p0.Commit)); each fixture is compared with the previous run that contains it" } else { 'nothing (first run)' })."
  Line
  Line '## How to read this report'
  Line
  Line @'
Every fixture is one scripted Claude Code session, or several repeats of it. All token numbers come from the session transcript. The columns of the first table are explained below from left to right, one paragraph per column; the terms of the Quality table and the `~` mark follow.

**Fixture (Repeats).** The name of the test, and in brackets how many times its session was run. `bench-*` fixtures measure cost (what a session loads and what reading a file adds); `quality-*` fixtures also have a judge that scores the answer. Where the number of repeats is more than 1, the other numbers are averages, shown as "mean (min-max)": the average followed by the lowest and the highest repeat.

**Start ctx (`FirstCtx`).** Tokens in the very first model call, before any work: tool definitions, system prompt, CLAUDE.md, memory index, skill and agent lists. Every later call of the session re-reads it. It depends on the tools loaded, so compare it only between runs of the same fixture. The bracket `(Δ +25)` is the change against the previous run of this fixture; up to 50 tokens counts as unchanged.

**End ctx (`LastCtx`).** Tokens in the last model call: the start context plus everything the task added. The bracket is the change against the previous run.

**Added by task (`Read`).** End ctx minus Start ctx: the tokens the task put into the context, that is the file or files read, the rules loaded for them and the model's answer. This is the number that shows what the instructions cost per task. The bracket is the change against the previous run; for fixtures with repeats, a change is noise when it is at most the larger of the previous run's own range and 1000 tokens ("within the spread").

**Model calls.** How many requests the session sent to the model. Each call re-reads the whole context, so more calls cost more.

**Output tokens.** Tokens the model wrote (answers and tool calls).

**Cost units.** The price of the session in relative units, where one new input token costs 1. Output is dearer and cached input is cheaper, so the session's tokens are counted by kind and multiplied by a weight: `cost units = new input x 1 + cache read x 0.1 + cache write x 1.25 + output x 5`. *New input* is context that was not cached, *cache read* is context taken from the prompt cache (the whole context is re-read on every model call), *cache write* is context stored into the cache the first time, *output* is what the model wrote. The sums are over all model calls of the session. Use it to compare sessions by cost, not by size. The token counts and the weights of every session are stored in `run-history.csv` (`InputTok`, `CacheReadTok`, `CacheWriteTok`, `OutTok`, `WInput`, `WCacheRead`, `WCacheWrite`, `WOutput`), so the value can be recomputed from the row; the breakdown is under the context table. The weights are relative prices assumed by the skill, not amounts of money.

**Tools loaded.** The tools the session was given. A fixture that sets none gets every built-in tool, and their definitions (about 17000 tokens) are part of its start context; fixtures limited to `Read` or a few tools carry almost none, which is why their start context is much smaller.

**Rules loaded.** Instruction files pulled in when a file of a matching type is read, as name=tokens. A change here is a real change to the instructions. A "Rules vs previous run" column appears only when some fixture's rules changed.

**Quality table.** *Score* is the number of checklist items the judge found, with the lowest and highest repeat, out of *Maximum*. *False positives* are findings the judge rejected as not real problems, summed over the repeats (previous run in brackets). The *Verdict* is `within noise` (no real change), `REGRESSION` (the mean score fell by more than the larger of the previous run's range and 0.5, or there are two or more extra false positives), `improvement` (the same, upward) or `no previous run`. One extra false positive is only noted, because the judge varies by that much.

**`~` after a number.** MCP servers were not ready when the session started, so the number can be about 1000 tokens off (see Caveats).
'@
  Line

  # ---- context and cost
  $anyRuleChg = @($tests | Where-Object { $facts[$_].RuleChanges.Count }).Count -gt 0
  Line '## Context and cost per fixture'
  Line
  Line 'The value in brackets after a number, (Δ ...), is the change against the previous run (0 or a few tens of tokens is noise). Values are averages over the repeats; "mean (min-max)" is shown for fixtures that ran more than once. Start context depends on the tools loaded (see the Tools loaded column), so compare it only between runs of the same fixture, never between fixtures with different tools.'
  Line
  Line ('| Fixture<br>(Repeats) | Start ctx (`FirstCtx`) | End ctx (`LastCtx`) | Added by task (`Read`) | Model calls | Output tokens | Cost units | Tools loaded | Rules loaded |' + $(if ($anyRuleChg) { ' Rules vs previous run |' } else { '' }))
  Line ('|---|---|---|---|---|---|---|---|---|' + $(if ($anyRuleChg) { '---|' } else { '' }))
  foreach ($t in $tests) {
    $f = $facts[$t]; $cr = $f.Cur
    $rules = RRulesText $cr
    $readText = if ($cr.Count -gt 1) { RRange (RValues $cr 'LastCtx' 'FirstCtx') } else { RFmt $f.Read }
    $chg = if (-not $f.Prev.Count -or -not ($f.Prev | Where-Object { $_.RulesLoaded -ne '' -or $_.FirstCtx -ne '' })) { 'n/a' } elseif ($f.RuleChanges.Count) { $f.RuleChanges -join ', ' } else { 'unchanged' }
    $mcp = @($cr | Where-Object { [int](RNum $_.McpNotReady) -gt 0 }).Count -gt 0
    Line "| $t ($($cr.Count)) | $(RFmt $f.CF)$(RDlt (RDelta $f.CF $f.PF)) | $(RFmt $f.CL)$(RDlt (RDelta $f.CL $f.PL)) | $(if ($mcp -and $null -ne $f.Read) { '~' })$readText$(RDlt (RDelta $f.Read $f.PRead)) | $(RRange (RValues $cr 'Calls')) | $(RRange (RValues $cr 'OutTok')) | $(RRange (RValues $cr 'CostUnits')) | $(ToolsText $t $cr) | $rules |$(if ($anyRuleChg) { " $chg |" })"
  }
  Line

  # ---- how cost units were calculated, from the token counts stored in the history
  $costRows = @($tests | Where-Object { @($facts[$_].Cur | Where-Object { $_.InputTok -ne '' }).Count })
  if ($costRows) {
    $w = @{}; foreach ($k in 'WInput', 'WCacheRead', 'WCacheWrite', 'WOutput') { $w[$k] = RNum $facts[$costRows[0]].Cur[0].$k }
    Line '<details><summary>How the cost units were calculated</summary>'
    Line
    Line "Tokens by kind (averages over the repeats) multiplied by their weight. Weights: new input $(RFmt $w.WInput), cache read $(RFmt $w.WCacheRead), cache write $(RFmt $w.WCacheWrite), output $(RFmt $w.WOutput) per token."
    Line
    Line "| Fixture | New input (x $(RFmt $w.WInput)) | Cache read (x $(RFmt $w.WCacheRead)) | Cache write (x $(RFmt $w.WCacheWrite)) | Output (x $(RFmt $w.WOutput)) | Cost units (recomputed) | Cost units (stored) |"
    Line '|---|---|---|---|---|---|---|'
    foreach ($t in $costRows) {
      $cr = $facts[$t].Cur
      $a = RMean $cr 'InputTok'; $b = RMean $cr 'CacheReadTok'; $c = RMean $cr 'CacheWriteTok'; $d = RMean $cr 'OutTok'
      Line "| $t | $(RFmt $a) | $(RFmt $b) | $(RFmt $c) | $(RFmt $d) | $(RFmt ($a * $w.WInput + $b * $w.WCacheRead + $c * $w.WCacheWrite + $d * $w.WOutput)) | $(RFmt (RMean $cr 'CostUnits')) |"
    }
    $t0 = $costRows[0]; $c0r = $facts[$t0].Cur[0]
    Line
    Line "Example, $t0 (first repeat): $(RFmt (RNum $c0r.InputTok)) x $(RFmt $w.WInput) + $(RFmt (RNum $c0r.CacheReadTok)) x $(RFmt $w.WCacheRead) + $(RFmt (RNum $c0r.CacheWriteTok)) x $(RFmt $w.WCacheWrite) + $(RFmt (RNum $c0r.OutTok)) x $(RFmt $w.WOutput) = $(RFmt ((RNum $c0r.InputTok) * $w.WInput + (RNum $c0r.CacheReadTok) * $w.WCacheRead + (RNum $c0r.CacheWriteTok) * $w.WCacheWrite + (RNum $c0r.OutTok) * $w.WOutput))."
    Line
    Line '</details>'
    Line
  }

  # ---- summary in plain language
  Line '## Summary'
  Line
  Line 'One line per fixture: what was measured, the comparison with the previous run, and the conclusion after the arrow.'
  Line
  foreach ($l in $sumLines) { Line $l }
  Line

  # ---- quality
  $judged = @($tests | Where-Object { $facts[$_].Score })
  $attention = @($cur | Where-Object { $_.Score -ne '' } | Sort-Object Test, { [int]$_.Rep } | Where-Object { (RNum $_.Score) -lt (RNum $_.Max) -or [int]$_.FalsePositives -gt 0 })
  if ($judged) {
    Line '## Quality (judged fixtures)'
    Line
    Line 'Look at Verdict: `within noise` means the review quality did not change. Score is the average number of checklist items the judge found, with the lowest and highest repeat; false positives are summed over the repeats.'
    Line
    Line '| Fixture | Score (mean, min-max) | Maximum | False positives (previous run) | Previous mean score | Δ | Verdict |'
    Line '|---|---|---|---|---|---|---|'
    foreach ($t in $judged) {
      $s = $facts[$t].Score
      if ($null -ne $s.PrevMean) { Line "| $t | $(RFmt $s.Mean) ($(RFmt $s.Min)-$(RFmt $s.Max)) | $(RFmt $s.OutOf) | $($s.FP) ($($s.PrevFP)) | $(RFmt $s.PrevMean) | $(RSgn $s.Delta) | $($facts[$t].Verdict) |" }
      else { Line "| $t | $(RFmt $s.Mean) ($(RFmt $s.Min)-$(RFmt $s.Max)) | $(RFmt $s.OutOf) | $($s.FP) | | | no previous run |" }
    }
    Line
    Line '### Repeats that need a look'
    Line
    if ($attention) {
      Line 'Repeats that scored below the maximum or raised a false positive; read the answer before repeating a judge verdict as fact.'
      Line
      foreach ($r in $attention) { Line "- $($r.Test) repeat $($r.Rep): $($r.Score)/$($r.Max), $($r.FalsePositives) false positive(s). $($r.JudgeNotes)" }
    } else { Line 'None: every repeat scored the maximum with no false positives.' }
    Line
    Line '<details><summary>Every repeat with the judge''s notes and a link to the answer</summary>'
    Line
    Line '| Fixture | Repeat | Score | False positives | Judge notes | Answer |'
    Line '|---|---|---|---|---|---|'
    foreach ($r in ($cur | Where-Object { $_.Score -ne '' } | Sort-Object Test, { [int]$_.Rep })) {
      $leaf = if ($r.Transcript) { Split-Path $r.Transcript -Leaf } else { '' }
      Line "| $($r.Test) | $($r.Rep) | $($r.Score)/$($r.Max) | $($r.FalsePositives) | $(($r.JudgeNotes -replace '\|', '/' -replace '\r?\n', ' ')) | $(if ($leaf) { "[answer](../runs/$leaf)" }) |"
    }
    Line
    Line '</details>'
    Line
  }

  # ---- instruction files that differ
  Line '## Instruction files that differ from the most recent earlier run'
  Line
  if (-not $p0) { Line 'Not applicable (first run).' }
  elseif ($p0.Dirty -eq 'yes') { Line 'Not available: the earlier run had uncommitted changes, so the exact instruction files it used are unknown.' }
  else {
    & git -C $repoRoot cat-file -e "$($p0.Commit)^{commit}" 2>$null
    if ($LASTEXITCODE -ne 0) { Line "Not available: commit $($p0.Commit) is not in this repository." }
    else {
      $paths = @('.claude/rules', '.claude/agents', '.claude/skills', '.claude/commands', '.github/instructions', '.github/prompts', '.ai/prompts', 'CLAUDE.md', '.mcp.json', '.claude/settings.json')
      $stat = if ($c0.Dirty -eq 'no') { @(& git -C $repoRoot diff --stat $p0.Commit $c0.Commit -- @paths) } else { @(& git -C $repoRoot diff --stat $p0.Commit -- @paths) }
      $what = if ($c0.Dirty -eq 'no') { "``$($p0.Commit)`` to ``$($c0.Commit)``" } else { "``$($p0.Commit)`` to the working tree at report time (this run had uncommitted changes)" }
      if ($stat.Count) { Line "Changes in rules, agents, skills, ``CLAUDE.md`` and settings from $what :"; Line; Line '```'; foreach ($l in $stat) { Line $l }; Line '```' }
      else { Line "No difference in rules, agents, skills, ``CLAUDE.md`` or settings between $what." }
    }
  }
  Line

  # ---- start context detail for fixtures flagged startContext
  foreach ($t in $tests) {
    if (-not (StartsContext $t)) { continue }
    $base = $facts[$t].Cur[0]
    $prevBase = $null
    foreach ($id in ($earlier | Sort-Object -Descending)) {
      $r = @($all | Where-Object { $_.Run -eq $id -and $_.Test -eq $t -and $_.Client -eq $base.Client })
      if ($r.Count) { $prevBase = $r; break }
    }
    Line "## Start context by area ($t, client $($base.Client))"
    Line
    Line 'What the first model call consists of, so a change in start context can be traced to an area. Token sizes are estimates; the last row is the exact figure reported by the API.'
    Line
    Line '<details><summary>Area table, MCP servers, skills and instruction files</summary>'
    Line
    Line '| Area | Tokens (est.) | Share of start context | Δ vs previous run |'
    Line '|---|---|---|---|'
    $sum = 0; $first = RNum $base.FirstCtx
    foreach ($k in $areaParts.Keys) {
      $v = RNum $base.($areaParts[$k]); $sum += $v
      $pv = if ($prevBase) { RNum $prevBase[0].($areaParts[$k]) } else { $null }
      Line "| $k | $(RFmt $v) | $(if ($first) { '{0:P0}' -f ($v / $first) }) | $(RSgn (RDelta $v $pv)) |"
    }
    Line "| Not accounted for (reminders, environment, git status, estimate error) | $(RFmt ($first - $sum)) | $(if ($first) { '{0:P0}' -f (($first - $sum) / $first) }) | |"
    Line "| **FirstCtx (API)** | **$(RFmt $first)** | 100% | $(if ($prevBase) { RSgn (RDelta $first (RNum $prevBase[0].FirstCtx)) }) |"
    Line
    Line "Largest tool definitions: $($base.ToolTop)"
    Line
    Line '### MCP servers'
    Line
    if ((RMcp $base.Mcp) -eq 'none') { Line 'None: the run started its sessions without MCP servers, so this start context is what the repository itself loads.' }
    else {
      Line "Deferred tool names and server instructions per server (a server only costs its names and instructions until a tool is loaded). Servers not ready: $($base.McpNotReady)."
      Line
      Line '| Server | Deferred tool names | Instruction tokens (est.) |'
      Line '|---|---|---|'
      foreach ($e in @($base.McpServers -split '; ' | Where-Object { $_ })) { if ($e -match '^(.+?):names=(\d+),instr=(\d+)$') { Line "| $($Matches[1]) | $($Matches[2]) | $($Matches[3]) |" } }
    }
    Line
    Line '### Skills, agents and instruction files'
    Line
    Line "- Skills listed: $($base.Skills), $($base.SkillTok) tokens. By source (count/tokens): $($base.SkillsBySource). Largest: $($base.SkillTop)."
    Line "- Agent types listed: $($base.Agents), $($base.AgentTok) tokens."
    Line "- Instruction files loaded at start (tokens, est.): $($base.InstrFiles) (CLAUDE.md $($base.ClaudeMdLines) lines, memory index $($base.MemoryLines) lines)."
    Line
    Line '</details>'
    Line
  }

  # ---- history per fixture
  Line '## History'
  Line
  Line 'Start context, end context, added tokens and score of each fixture over the latest 8 runs that contain it; use it to see whether a number is stable over time.'
  Line
  Line '<details><summary>History tables per fixture</summary>'
  Line
  foreach ($t in $tests) {
    Line "### $t"
    Line
    Line '| Run | Commit | Uncommitted | Harness | Start ctx | End ctx | Added by task | Score |'
    Line '|---|---|---|---|---|---|---|---|'
    $runs = @($all | Where-Object { $_.Test -eq $t } | ForEach-Object { $_.Run } | Select-Object -Unique | Sort-Object | Select-Object -Last 8)
    foreach ($id in $runs) {
      $rr = @($all | Where-Object { $_.Run -eq $id -and $_.Test -eq $t })
      $fm = RMean $rr 'FirstCtx'; $lm = RMean $rr 'LastCtx'; $sm = RMean $rr 'Score'
      Line "| $id | $($rr[0].Commit) | $($rr[0].Dirty) | $($rr[0].Harness) | $(RFmt $fm) | $(RFmt $lm) | $(if ($null -ne $fm -and $null -ne $lm) { RFmt ($lm - $fm) }) | $(if ($null -ne $sm) { "$(RFmt $sm)/$($rr[0].Max)" }) |"
    }
    Line
  }
  Line '</details>'
  Line

  # ---- caveats: identical texts are grouped over the fixtures they apply to
  $cav = [ordered]@{}
  function AddCaveat($text, $test) { if (-not $cav.Contains($text)) { $cav[$text] = New-Object System.Collections.Generic.List[string] }; $cav[$text].Add($test) }
  foreach ($t in $tests) {
    $cr = $facts[$t].Cur; $pr = $facts[$t].Prev
    if (-not $pr.Count) { continue }
    if ($pr[0].Harness -ne $cr[0].Harness) { AddCaveat "The previous run used harness $($pr[0].Harness), this run harness $($cr[0].Harness) (the runner or parser differ), so the comparison is indicative only." $t }
    if ($cr[0].FixtureHash -and $pr[0].FixtureHash -and $pr[0].FixtureHash -ne $cr[0].FixtureHash) { AddCaveat 'The fixture changed since the previous run, so the comparison is indicative only.' $t }
    elseif (-not $pr[0].FixtureHash) { AddCaveat 'The previous run recorded no fixture hash, so an unchanged fixture cannot be confirmed.' $t }
    if ($pr[0].Scorer -ne $cr[0].Scorer -and ($cr[0].Scorer -or $pr[0].Scorer)) { AddCaveat "Scored differently ($($pr[0].Scorer) before, $($cr[0].Scorer) now)." $t }
    if ((RMcp $pr[0].Mcp) -ne (RMcp $cr[0].Mcp)) { AddCaveat "The previous run used MCP servers: $(RMcp $pr[0].Mcp), this run: $(RMcp $cr[0].Mcp). Start context and tool definitions are not comparable; only Read of a fixture that loads no MCP tools is." $t }
    if ($pr[0].Client -and $cr[0].Client -and $pr[0].Client -ne $cr[0].Client) { AddCaveat "Different client ($($pr[0].Client) before, $($cr[0].Client) now); compare FirstCtx with care." $t }
  }
  $notReady = @($tests | Where-Object { @($facts[$_].Cur | Where-Object { [int](RNum $_.McpNotReady) -gt 0 }).Count -gt 0 })
  foreach ($t in $notReady) { AddCaveat 'MCP servers were not ready when the session started: their names and instructions can arrive during the session, so FirstCtx can be too low and Read too high by about a thousand tokens (marked with ~). Compare Read within runs where the servers were ready, or between fixtures of the same run.' $t }
  if ($c0.Dirty -eq 'yes') { foreach ($t in $tests) { AddCaveat 'The run had uncommitted changes: their file list is part of the start context and the commit id alone does not identify the instructions that were tested.' $t } }
  if ($cav.Count) {
    Line '## Caveats'
    Line
    foreach ($text in $cav.Keys) {
      $who = @($cav[$text] | Select-Object -Unique)
      Line "- $text Applies to: $(if ($who.Count -eq $tests.Count) { 'all fixtures' } else { $who -join ', ' })."
    }
  }

  $file = Join-Path $reportsDir "${run}_harness-report.md"
  Set-Content -Path $file -Value $sb.ToString() -Encoding utf8
  return $file
}
