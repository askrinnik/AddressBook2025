<#
.SYNOPSIS
  Parses the sessions of one harness run, scores the judged answers, appends the rows to the history and writes the report.
.DESCRIPTION
  Reads runs/<Run>_manifest.json (written by Run-Harness.ps1), finds every session transcript by its id in
  ~/.claude/projects/<repository key>, and builds one history row per session. Answers of fixtures that have a
  ground-truth.md are scored by a separate `claude -p` session. If any session cannot be parsed or scored nothing
  is written, so run-history.csv stays append-only and this script can simply be run again. On success the rows are
  appended (existing lines are never changed) and reports/<Run>_harness-report.md is written.
.PARAMETER Run          RunId of the run to collect (the file name prefix, for example 2026-09-30-11-13_my-note).
.PARAMETER ResultsDir   Where runs, reports and the history live (default: .ai/benchmarks/harness in the repository).
.PARAMETER JudgeModel   Model id for the judge (default claude-sonnet-5-5).
.PARAMETER JudgeEffort  Effort level for the judge (default medium).
.PARAMETER ReportOnly   Do not parse, judge or append; regenerate the report of a run that is already in the history.
#>
param(
  [Parameter(Mandatory)][string]$Run,
  [string]$ResultsDir,
  [string]$JudgeModel = 'claude-sonnet-5-5',
  [string]$JudgeEffort = 'medium',
  [switch]$ReportOnly
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
. (Join-Path $PSScriptRoot 'lib/Read-Session.ps1')
. (Join-Path $PSScriptRoot 'lib/Judge.ps1')
. (Join-Path $PSScriptRoot 'lib/Report.ps1')

$repoRoot = [IO.Path]::GetFullPath(((& git -C $PSScriptRoot rev-parse --show-toplevel) | Select-Object -First 1).Trim())
$harnessDir = Join-Path $repoRoot '.ai/benchmarks/harness'
$fixturesDir = Join-Path $harnessDir 'fixtures'
if (-not $ResultsDir) { $ResultsDir = $harnessDir }
$runsDir = Join-Path $ResultsDir 'runs'
$csv = Join-Path $ResultsDir 'run-history.csv'
New-Item -ItemType Directory -Force (Join-Path $ResultsDir 'reports') | Out-Null
$projDir = Join-Path (Join-Path $HOME '.claude') (Join-Path 'projects' ($repoRoot -replace '[^A-Za-z0-9]', '-'))

$columns = @('Run', 'Test', 'Rep', 'Collected', 'Started', 'Note', 'Harness', 'FixtureHash',
  'Session', 'Author', 'Branch', 'Commit', 'Dirty', 'Version', 'Client', 'Model', 'Effort', 'Mcp',
  'Calls', 'OutTok', 'CostUnits', 'InputTok', 'CacheReadTok', 'CacheWriteTok', 'WInput', 'WCacheRead', 'WCacheWrite', 'WOutput', 'FirstCtx', 'LastCtx', 'RulesTok', 'Tools', 'Artifact',
  'ToolDefTok', 'BuiltinToolTok', 'McpToolTok', 'ToolTop', 'SystemTok', 'ClaudeMdTok', 'ClaudeMdLines', 'MemoryTok', 'MemoryLines', 'InstrFiles',
  'SkillTok', 'Skills', 'SkillsBySource', 'SkillTop', 'AgentTok', 'Agents', 'DeferredTok', 'DeferredNames', 'McpInstrTok', 'McpServers', 'McpNotReady',
  'RulesLoaded', 'Score', 'Max', 'FalsePositives', 'Scorer', 'Transcript', 'JudgeNotes')

if (-not $ReportOnly) {
  $manifestFile = Join-Path $runsDir "${Run}_manifest.json"
  if (-not (Test-Path $manifestFile)) { throw "No manifest for run '$Run' at $manifestFile" }
  $mf = Get-Content $manifestFile -Raw | ConvertFrom-Json
  if ((Test-Path $csv) -and @(Import-Csv $csv | Where-Object { $_.Run -eq $Run }).Count) { throw "Run '$Run' is already in $csv. Use -ReportOnly to regenerate its report." }
  $sessions = @($mf.sessions)
  if (@($sessions | Where-Object { $_.judged }).Count -and -not (Get-Command claude -ErrorAction SilentlyContinue)) { throw "The 'claude' command was not found on PATH." }
  Start-Sleep -Seconds 3   # let the last session finish writing its transcript

  $rows = @(); $failed = @()
  foreach ($s in $sessions) {
    $label = "$($s.test) rep $($s.rep)"
    $file = Get-Item (Join-Path $projDir "$($s.session).jsonl") -ErrorAction SilentlyContinue
    if (-not $file) { $failed += "${label}: no session transcript for id $($s.session) in $projDir"; continue }
    $answerFile = Join-Path $runsDir "${Run}_$($s.test)-$($s.rep).md"
    $row = [ordered]@{}; foreach ($c in $columns) { $row[$c] = '' }
    foreach ($p in (Read-Session $file).PSObject.Properties) { if ($row.Contains($p.Name)) { $row[$p.Name] = $p.Value } }
    $row['Run'] = $Run; $row['Test'] = $s.test; $row['Rep'] = $s.rep; $row['Collected'] = $mf.started; $row['Note'] = $mf.note
    $row['Harness'] = $mf.harness; $row['FixtureHash'] = $s.hash; $row['Commit'] = $mf.commit; $row['Dirty'] = $mf.dirty; $row['Effort'] = $mf.effort; $row['Mcp'] = $(if ($mf.mcp) { $mf.mcp } else { 'environment' })
    $row['Transcript'] = ".ai/benchmarks/harness/runs/$([IO.Path]::GetFileName($answerFile))"
    if ($s.judged) {
      "Judging $label"
      $r = if (Test-Path $answerFile) { Invoke-Judge (Join-Path $fixturesDir $s.test) (Get-Content $answerFile -Raw) $JudgeModel $JudgeEffort } else { $null }
      if (-not $r) { $failed += "${label}: judge returned no valid score"; continue }
      $row['Score'] = $r.Score.ToString('0.##', [Globalization.CultureInfo]::InvariantCulture); $row['Max'] = $r.Max.ToString('0.##', [Globalization.CultureInfo]::InvariantCulture)
      $row['FalsePositives'] = $r.FalsePositives; $row['Scorer'] = "judge:$JudgeModel/$JudgeEffort"; $row['JudgeNotes'] = $r.Notes
    }
    $rows += [pscustomobject]$row
  }
  if ($failed) { throw "Nothing was written to the history because collecting failed for:`n  $($failed -join "`n  ")`nFix the cause and run Collect-Harness.ps1 -Run $Run again." }

  $expectedHeader = '"' + ($columns -join '","') + '"'
  $header = if (Test-Path $csv) { Get-Content $csv -TotalCount 1 } else { $null }
  if ($header -eq $expectedHeader) {
    $rows | Select-Object $columns | ConvertTo-Csv -NoTypeInformation | Select-Object -Skip 1 | Add-Content -Path $csv -Encoding utf8
  } else {
    # the set of columns changed: rewrite once, padding missing columns of old rows with empty values
    $old = @(); if (Test-Path $csv) { $old = @(Import-Csv $csv) }
    $all = @($old | ForEach-Object { $x = $_; $o = [ordered]@{}; foreach ($c in $columns) { $o[$c] = if ($x.PSObject.Properties.Name -contains $c) { $x.$c } else { '' } }; [pscustomobject]$o }) + $rows
    $all | Select-Object $columns | Export-Csv $csv -NoTypeInformation -Encoding utf8
  }
  "Appended $($rows.Count) rows to $csv."
}

if (-not (Test-Path $csv)) { throw "No history at $csv" }
$reportFile = Write-HarnessReport @(Import-Csv $csv) $Run (Join-Path $ResultsDir 'reports') $repoRoot $fixturesDir
''
Get-Content $reportFile -Raw
"Files: $csv (append-only history), $reportFile (report)"
