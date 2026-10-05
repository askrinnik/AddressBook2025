# Parses one Claude Code session transcript (~/.claude/projects/<repo key>/<session id>.jsonl) into one history row.
# Sizes come from the text that was really injected into the session, so old rows stay valid after the repository
# changes. Token values are estimates (characters / 3.76) except FirstCtx and LastCtx, which come from API usage.
$script:tokPerChar = 1 / 3.76
# Relative price of one token of each kind, with new input as 1. CostUnits = sum of tokens x weight over all model calls;
# the weights are stored in every history row so the value can be recomputed from the row alone.
$script:costWeights = [ordered]@{ Input = 1; CacheRead = 0.1; CacheWrite = 1.25; Output = 5 }

function Get-Tok($chars) { [int]([double]$chars * $script:tokPerChar) }

# weights are written with a decimal point whatever the culture, so the CSV reads the same everywhere
function Format-Weight($w) { ([double]$w).ToString('0.##', [Globalization.CultureInfo]::InvariantCulture) }

function Get-CostUnits($inTok, $cacheRead, $cacheWrite, $outTok) {
  $w = $script:costWeights
  $inTok * $w.Input + $cacheRead * $w.CacheRead + $cacheWrite * $w.CacheWrite + $outTok * $w.Output
}

function Read-Session($file) {
  $calls = 0; $seen = @{}; $firstCtx = 0; $lastCtx = 0; $outTok = 0; $inTok = 0; $cacheRead = 0; $cacheWrite = 0
  $version = ''; $entry = ''; $model = ''
  $snap = $null; $ins = $null; $skill = $null; $agent = $null; $deferred = $null; $mcp = $null; $sessionCtx = $null
  $rules = New-Object System.Collections.Generic.List[object]
  foreach ($l in [IO.File]::ReadLines($file.FullName)) {
    $o = $l | ConvertFrom-Json
    if (-not $version -and $o.version) { $version = $o.version; $entry = $o.entrypoint }
    if ($o.type -eq 'attachment') {
      $a = $o.attachment
      switch ($a.type) {
        'model' { if (-not $model) { $model = $a.identity.marketingName } }
        'prompt_snapshot' { if (@($a.tools).Count -gt 5) { $snap = $a } }
        'instructions' { if (-not $ins) { $ins = $a } }
        'skill_listing' { if (-not $skill) { $skill = $a } }
        'agent_listing_delta' { if (-not $agent) { $agent = $a } }
        'deferred_tools_delta' { if (-not $deferred) { $deferred = $a } }
        'mcp_instructions_delta' { if (-not $mcp) { $mcp = $a } }
        'session_context' { if (-not $sessionCtx) { $sessionCtx = $a } }
        'nested_memory' {
          if ($calls -gt 0) {
            $len = if ($a.content -and $a.content.content) { ([string]$a.content.content).Length } else { 0 }
            $rules.Add([pscustomobject]@{ Name = ((Split-Path $a.path -Leaf) -replace '\.md$', ''); Chars = $len })
          }
        }
      }
    }
    if ($o.type -eq 'assistant' -and $o.message.usage) {
      $u = $o.message.usage
      $ctx = [int64]$u.input_tokens + [int64]$u.cache_read_input_tokens + [int64]$u.cache_creation_input_tokens
      $k = "$($o.message.id)|$($o.requestId)"
      if ($ctx -gt 0 -and -not $seen.ContainsKey($k)) {
        $seen[$k] = 1; $calls++; if (-not $firstCtx) { $firstCtx = $ctx }; $lastCtx = $ctx
        $outTok += [int64]$u.output_tokens; $inTok += [int64]$u.input_tokens
        $cacheRead += [int64]$u.cache_read_input_tokens; $cacheWrite += [int64]$u.cache_creation_input_tokens
      }
    }
  }

  # git state at the start of the session, as the session itself saw it
  $branch = ''; $commit = ''; $dirty = ''; $author = ''
  if ($sessionCtx) {
    $g = [string]$sessionCtx.context.gitStatus
    if ($g -match 'Current branch:\s*(.+)') { $branch = $Matches[1].Trim() }
    if ($g -match 'Git user:\s*(.+)') { $author = $Matches[1].Trim() }
    if ($g -match 'Recent commits:\s*\r?\n\s*([0-9a-f]{7,40})') { $commit = $Matches[1].Substring(0, [Math]::Min(8, $Matches[1].Length)) }
    if ($g -match 'Status:\s*\r?\n\s*\(clean\)') { $dirty = 'no' } elseif ($g -match 'Status:') { $dirty = 'yes' }
  }

  # tool definitions
  $toolRows = @()
  if ($snap) { $toolRows = @($snap.tools | ForEach-Object { [pscustomobject]@{ Name = [string]$_.name; Tok = (Get-Tok (($_ | ConvertTo-Json -Depth 30 -Compress).Length)) } }) }
  $mcpTools = @($toolRows | Where-Object { $_.Name -like 'mcp__*' })
  $builtin = @($toolRows | Where-Object { $_.Name -notlike 'mcp__*' })
  $toolTop = (($toolRows | Sort-Object Tok -Descending | Select-Object -First 6 | ForEach-Object { "$($_.Name)=$($_.Tok)" }) -join '; ')

  # instruction files loaded at start
  $instr = @(); $claudeMd = 0; $claudeMdLines = 0; $memory = 0; $memLines = 0
  if ($ins) {
    foreach ($f in $ins.files) {
      $len = ([string]$f.content).Length
      $instr += "$((Split-Path $f.path -Leaf))=$(Get-Tok $len)"
      if ($f.type -eq 'Project' -and (Split-Path $f.path -Leaf) -eq 'CLAUDE.md') { $claudeMd += $len; $claudeMdLines += @(([string]$f.content) -split "`n").Count }
      if ($f.type -eq 'AutoMem') { $memory += $len; $memLines += @(([string]$f.content) -split "`n").Count }
    }
  }

  # skills
  $skillLines = @(); $bySource = ''; $skillTop = ''
  if ($skill) {
    $skillLines = @($skill.content -split "`n" | Where-Object { $_ -match '^- ' } | ForEach-Object {
        $t = $_ -replace '^- ', ''
        $name = if ($t -match '^(anthropic-skills:[^:]+):') { $Matches[1] } else { $t.Substring(0, [Math]::Max(0, $t.IndexOf(':'))) }
        $src = if ($name -like '_local.*') { 'local' } elseif ($name -like '*:*') { 'plugin' } else { 'other' }
        [pscustomobject]@{ Name = $name; Src = $src; Chars = $_.Length + 1 } })
    $bySource = (($skillLines | Group-Object Src | ForEach-Object { "$($_.Name)=$($_.Count)/$(Get-Tok (($_.Group | Measure-Object Chars -Sum).Sum))" }) -join '; ')
    $skillTop = (($skillLines | Sort-Object Chars -Descending | Select-Object -First 5 | ForEach-Object { "$($_.Name)=$(Get-Tok $_.Chars)" }) -join '; ')
  }

  # deferred tool names (per MCP server) and MCP instructions
  $mcpDetail = @{}
  $deferredNames = @(); if ($deferred) { $deferredNames = @($deferred.addedNames) }
  foreach ($n in $deferredNames) {
    $srv = if ($n -like 'mcp__*') { ($n -split '__')[1] } else { '(core)' }
    if (-not $mcpDetail.ContainsKey($srv)) { $mcpDetail[$srv] = @{ Names = 0; Instr = 0 } }
    $mcpDetail[$srv].Names++
  }
  $mcpInstrTotal = 0
  if ($mcp) {
    $names = @($mcp.addedNames); $blocks = @($mcp.addedBlocks)
    for ($i = 0; $i -lt $blocks.Count; $i++) {
      $len = ($blocks[$i] | ConvertTo-Json -Depth 6 -Compress).Length
      $mcpInstrTotal += $len
      $srv = if ($i -lt $names.Count) { ([string]$names[$i]) -replace '[^A-Za-z0-9]', '_' } else { "server$i" }   # same spelling as in the deferred tool names
      if (-not $mcpDetail.ContainsKey($srv)) { $mcpDetail[$srv] = @{ Names = 0; Instr = 0 } }
      $mcpDetail[$srv].Instr += $len
    }
  }
  $mcpText = (($mcpDetail.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Key):names=$($_.Value.Names),instr=$(Get-Tok $_.Value.Instr)" }) -join '; ')
  $notReady = 0
  if ($deferred) { foreach ($p in 'needsAuthMcpServers', 'failedMcpServers', 'pendingMcpServers') { $notReady += @($deferred.$p).Count } }

  [pscustomobject][ordered]@{
    Session = $file.BaseName.Substring(0, 8)
    Started = $file.CreationTime.ToString('yyyy-MM-dd HH:mm'); Author = $author; Branch = $branch; Commit = $commit; Dirty = $dirty
    Version = $version; Client = $entry; Model = $model; Calls = $calls; OutTok = $outTok; CostUnits = [int](Get-CostUnits $inTok $cacheRead $cacheWrite $outTok)
    InputTok = $inTok; CacheReadTok = $cacheRead; CacheWriteTok = $cacheWrite
    WInput = (Format-Weight $script:costWeights.Input); WCacheRead = (Format-Weight $script:costWeights.CacheRead); WCacheWrite = (Format-Weight $script:costWeights.CacheWrite); WOutput = (Format-Weight $script:costWeights.Output)
    FirstCtx = $firstCtx; LastCtx = $lastCtx; RulesTok = (Get-Tok (($rules | Measure-Object Chars -Sum).Sum)); Tools = $toolRows.Count
    Artifact = (@($toolRows | Where-Object { $_.Name -eq 'Artifact' }).Count -gt 0)
    ToolDefTok = [int](($toolRows | Measure-Object Tok -Sum).Sum); BuiltinToolTok = [int](($builtin | Measure-Object Tok -Sum).Sum); McpToolTok = [int](($mcpTools | Measure-Object Tok -Sum).Sum); ToolTop = $toolTop
    SystemTok = $(if ($snap) { Get-Tok (($snap.systemPrompt | Measure-Object -Property Length -Sum).Sum) } else { 0 })
    ClaudeMdTok = (Get-Tok $claudeMd); ClaudeMdLines = $claudeMdLines; MemoryTok = (Get-Tok $memory); MemoryLines = $memLines; InstrFiles = ($instr -join '; ')
    SkillTok = $(if ($skill) { Get-Tok $skill.content.Length } else { 0 }); Skills = $skillLines.Count; SkillsBySource = $bySource; SkillTop = $skillTop
    AgentTok = $(if ($agent) { Get-Tok (($agent.addedLines | Out-String).Length) } else { 0 }); Agents = $(if ($agent) { @($agent.addedTypes).Count } else { 0 })
    DeferredTok = $(if ($deferred) { Get-Tok (($deferred.addedNames | Out-String).Length) } else { 0 }); DeferredNames = $deferredNames.Count
    McpInstrTok = (Get-Tok $mcpInstrTotal); McpServers = $mcpText; McpNotReady = $notReady
    RulesLoaded = (($rules | ForEach-Object { "$($_.Name)=$(Get-Tok $_.Chars)" }) -join '; ')
  }
}
