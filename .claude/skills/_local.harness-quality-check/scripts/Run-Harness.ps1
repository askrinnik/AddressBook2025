<#
.SYNOPSIS
  Runs harness fixtures against the current repository state, then scores and records the sessions.
.DESCRIPTION
  A fixture is a folder under .ai/benchmarks/harness/fixtures with a prompt.txt and optionally a fixture.json
  (repetitions, tools), a seed.patch (applied in place for the length of one session, then reverted) and a
  ground-truth.md (the answer is scored by an LLM judge). Every selected fixture runs sequentially, once per
  repetition, as a fresh `claude -p` session from the repository root with a fixed model and effort. The answer is saved
  as runs/<RunId>_<fixture>-<rep>.md, then Collect-Harness.ps1 parses the session transcripts, judges the answers,
  appends one row per session to run-history.csv and writes reports/<RunId>_harness-report.md, which compares each
  fixture with its previous run. The working tree is tested as it is (committed and uncommitted changes); Commit and
  Dirty are recorded. RunId is the start time (yyyy-MM-dd-HH-mm) plus a slug of the note and prefixes every file of the run.
.PARAMETER Fixture      Fixture names or masks (bench-*); comma separated. Empty runs every fixture.
.PARAMETER Note         Title of the run: what changed since the previous run (stored with every row; slug in the file names).
.PARAMETER Repetitions  Override the repetitions of every selected fixture (default: the fixture's own).
.PARAMETER Model        Model id for the test sessions (default claude-sonnet-5-5).
.PARAMETER Effort       Effort level for the test sessions (default medium).
.PARAMETER JudgeModel   Model id for the judge (default claude-sonnet-5-5).
.PARAMETER JudgeEffort  Effort level for the judge (default medium).
.PARAMETER Mcp          none (default): sessions start with no MCP servers (--strict-mcp-config), so the start context and the
                        tools do not depend on which of the user's MCP servers happen to be connected in time.
                        environment: sessions load the user's MCP servers as they are (start context varies by a few
                        thousand tokens between runs; for quality fixtures that restrict tools, by tens of thousands).
.PARAMETER ResultsDir   Where runs, reports and the history live (default: .ai/benchmarks/harness in the repository).
.PARAMETER DryRun       Print the plan and check the patches; start nothing and change nothing.
.EXAMPLE
  pwsh .github/skills/_local.harness-quality-check/scripts/Run-Harness.ps1 -Fixture 'bench-*' -Note "after: CLAUDE.md trimmed"
#>
param(
  [string[]]$Fixture = @(),
  [string]$Note = '',
  [int]$Repetitions = 0,
  [string]$Model = 'claude-sonnet-5-5',
  [string]$Effort = 'medium',
  [string]$JudgeModel = 'claude-sonnet-5-5',
  [string]$JudgeEffort = 'medium',
  [ValidateSet('none', 'environment')][string]$Mcp = 'none',
  [string]$ResultsDir,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$Harness = '3'   # bump when the runner or the session parser changes in a way that makes runs incomparable
# `pwsh -File` passes "a,b" as one string, so accept comma separated values as well as real arrays
$Fixture = @($Fixture | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })

$repoRoot = [IO.Path]::GetFullPath(((& git -C $PSScriptRoot rev-parse --show-toplevel) | Select-Object -First 1).Trim())
$harnessDir = Join-Path $repoRoot '.ai/benchmarks/harness'
$fixturesDir = Join-Path $harnessDir 'fixtures'
if (-not $ResultsDir) { $ResultsDir = $harnessDir }
$runsDir = Join-Path $ResultsDir 'runs'
if (-not $DryRun -and -not (Get-Command claude -ErrorAction SilentlyContinue)) { throw "The 'claude' command was not found on PATH." }

# ---------------------------------------------------------------- fixtures
$available = @(Get-ChildItem $fixturesDir -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'prompt.txt') } | Sort-Object Name)
if (-not $available) { throw "No fixtures with a prompt.txt under $fixturesDir" }
$selected = if ($Fixture.Count) {
  foreach ($f in $Fixture) {
    $hit = @($available | Where-Object { $_.Name -like $f })
    if (-not $hit) { throw "No fixture matches '$f'. Available: $(($available | ForEach-Object Name) -join ', ')" }
    $hit
  }
} else { $available }
$selected = @($selected | Sort-Object Name -Unique)

function Get-FixtureHash($dir) {
  $sb = New-Object System.Text.StringBuilder
  foreach ($f in (Get-ChildItem $dir -File | Sort-Object Name)) { [void]$sb.Append($f.Name).Append("`n").Append(((Get-Content $f.FullName -Raw) -replace "`r`n", "`n")).Append("`n") }
  $bytes = [Text.Encoding]::UTF8.GetBytes($sb.ToString())
  (([Security.Cryptography.SHA256]::Create().ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '').Substring(0, 8)
}

$plan = foreach ($d in $selected) {
  $cfg = [pscustomobject]@{ repetitions = 1; tools = ''; allowedTools = ''; startContext = $false }
  $cfgFile = Join-Path $d.FullName 'fixture.json'
  if (Test-Path $cfgFile) { $j = Get-Content $cfgFile -Raw | ConvertFrom-Json; foreach ($p in $cfg.PSObject.Properties.Name) { if ($null -ne $j.$p) { $cfg.$p = $j.$p } } }
  $patch = Join-Path $d.FullName 'seed.patch'
  $files = @()
  if (Test-Path $patch) {
    & git -C $repoRoot apply --check $patch 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "$($d.Name): seed.patch does not apply to the current tree (already applied by an interrupted run? try: git apply -R '$patch'). Otherwise the code it patches has changed and the fixture needs updating." }
    $files = @(& git -C $repoRoot apply --numstat $patch | ForEach-Object { ($_ -split "`t")[2] })
    $modified = @(& git -C $repoRoot status --porcelain -- $files)
    if ($modified.Count) { throw "$($d.Name): files patched by the fixture have uncommitted changes; commit or stash them first:`n$($modified -join "`n")" }
  }
  [pscustomobject]@{
    Name = $d.Name; Reps = $(if ($Repetitions -gt 0) { $Repetitions } else { [int]$cfg.repetitions }); Tools = [string]$cfg.tools; AllowedTools = [string]$cfg.allowedTools
    Patch = $(if ($files.Count) { $patch }); Files = $files; Judged = (Test-Path (Join-Path $d.FullName 'ground-truth.md')); Hash = (Get-FixtureHash $d.FullName)
    Prompt = ((Get-Content (Join-Path $d.FullName 'prompt.txt') -Raw).Replace('{{PATCH_FILES}}', ($files -join ' ')).Trim())
  }
}

# ---------------------------------------------------------------- run identity
$slug = ($Note.ToLowerInvariant() -replace '[^a-z0-9]+', '-').Trim('-')
if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40).Trim('-') }
$stamp = Get-Date -Format 'yyyy-MM-dd-HH-mm'
$runId = if ($slug) { "${stamp}_$slug" } else { $stamp }
# The harness folder is excluded: its results are outputs of the benchmark, its fixtures are covered by FixtureHash.
$dirty = if (@(git -C $repoRoot status --porcelain -- . ':(exclude).ai/benchmarks/harness').Count -gt 0) { 'yes' } else { 'no' }
$commit = ((& git -C $repoRoot rev-parse --short=8 HEAD) | Select-Object -First 1).Trim()
$sessionCount = ($plan | Measure-Object Reps -Sum).Sum

"Run $runId  (commit $commit, uncommitted changes: $dirty, harness $Harness, MCP servers: $Mcp)"
"Note: $(if ($Note) { $Note } else { '(none)' })"
"Fixtures: $(($plan | ForEach-Object { "$($_.Name) x$($_.Reps)" }) -join ', ')  =  $sessionCount sessions, plus $([int](($plan | Where-Object Judged | Measure-Object Reps -Sum).Sum)) judge sessions."
if ($plan | Where-Object Patch) { 'Do not edit files in the repository while this runs: some fixtures patch working-tree files in place for the length of one session.' }
if ($DryRun) {
  foreach ($p in $plan) { "  $($p.Name): patch=$(if ($p.Patch) { $p.Files -join ', ' } else { 'none' }) judged=$($p.Judged) tools='$($p.Tools)' allowed='$($p.AllowedTools)' hash=$($p.Hash)" }
  'Dry run finished; nothing was started, applied or written.'
  return
}

# Answers and the manifest are held outside the repository until every session is done: a file that appears in the
# working tree shows up in the next session's git status and would add a few tokens to its start context.
$stage = Join-Path ([IO.Path]::GetTempPath()) "harness-$runId"
New-Item -ItemType Directory -Force $stage | Out-Null
$runStarted = (Get-Date).ToString('yyyy-MM-dd HH:mm')
$sessions = New-Object System.Collections.Generic.List[object]
$n = 0
foreach ($p in $plan) {
  for ($rep = 1; $rep -le $p.Reps; $rep++) {
    $n++
    "[$n/$sessionCount] $($p.Name) rep $rep"
    $guid = [guid]::NewGuid().ToString()
    $claudeArgs = @('-p', '--model', $Model, '--effort', $Effort, '--session-id', $guid)
    if ($Mcp -eq 'none') { $claudeArgs += '--strict-mcp-config' }
    if ($p.Tools) { $claudeArgs += @('--tools', $p.Tools) }
    if ($p.AllowedTools) { $claudeArgs += @('--allowedTools', $p.AllowedTools) }
    if ($p.Patch) { & git -C $repoRoot apply $p.Patch; if ($LASTEXITCODE -ne 0) { throw "git apply failed for $($p.Name)" } }
    try {
      Push-Location $repoRoot
      try {
        $output = $p.Prompt | & claude @claudeArgs 2>&1
        if ($LASTEXITCODE -ne 0) { throw "claude failed with exit code $LASTEXITCODE for $($p.Name) rep ${rep}:`n$($output | Out-String)" }
      } finally { Pop-Location }
    } finally {
      if ($p.Patch) {
        & git -C $repoRoot apply -R $p.Patch 2>&1 | Out-Null
        $left = @(& git -C $repoRoot status --porcelain -- $p.Files)
        if ($left.Count) { throw "The fixture patch of $($p.Name) could not be reverted; run: git apply -R '$($p.Patch)'`n$($left -join "`n")" }
      }
    }
    Set-Content (Join-Path $stage "${runId}_$($p.Name)-$rep.md") -Value ($output | Out-String).TrimEnd() -Encoding utf8
    $sessions.Add([ordered]@{ test = $p.Name; rep = $rep; session = $guid; hash = $p.Hash; judged = $p.Judged })
  }
}
[ordered]@{
  run = $runId; note = $Note; harness = $Harness; mcp = $Mcp; started = $runStarted; commit = $commit; dirty = $dirty
  model = $Model; effort = $Effort; sessions = $sessions
} | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $stage "${runId}_manifest.json") -Encoding utf8
New-Item -ItemType Directory -Force $runsDir | Out-Null
Get-ChildItem $stage -File | ForEach-Object { Copy-Item $_.FullName (Join-Path $runsDir $_.Name) -Force }

''
'Parsing sessions, scoring and collecting results...'
& (Join-Path $PSScriptRoot 'Collect-Harness.ps1') -Run $runId -ResultsDir $ResultsDir -JudgeModel $JudgeModel -JudgeEffort $JudgeEffort
