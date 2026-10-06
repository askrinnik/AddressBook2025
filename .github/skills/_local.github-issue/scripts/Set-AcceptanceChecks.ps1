<#
.SYNOPSIS
	Ticks verified acceptance criteria in the body of a GitHub issue.

.DESCRIPTION
	Reads the issue body, finds the acceptance section — the first "## Критерии приёмки",
	"## Acceptance criteria" or "## Acceptance" heading, optionally followed by a note in parentheses — and
	turns "- [ ]" into "- [x]" for the checkbox items given by their position in that section (1-based, in
	document order, nested items included). Nothing else in the body changes: before writing, the script compares the old and the new
	body line by line and refuses to write if any other line differs. Items that are already ticked stay
	ticked; the script never unticks anything.

	The output lists every checkbox of the section with its state, so the caller sees what was ticked and
	what is left unticked without reading the issue again.

.PARAMETER Issue
	The issue number.

.PARAMETER Items
	Positions of the checkbox items to tick, 1-based, counted within the acceptance section, as one
	comma-separated string ("1,2,4"). A string rather than an array, because "pwsh -File" passes "1,2,4"
	as a single argument.

.PARAMETER Repo
	owner/name; defaults to the repository of the current directory.

.PARAMETER DryRun
	Show the result without editing the issue.

.EXAMPLE
	pwsh -NoProfile -File .github/skills/_local.github-issue/scripts/Set-AcceptanceChecks.ps1 -Issue 12 -Items 1,2,4

.EXAMPLE
	pwsh -NoProfile -File .github/skills/_local.github-issue/scripts/Set-AcceptanceChecks.ps1 -Issue 12 -Items 1,2 -DryRun
#>
[CmdletBinding()]
param(
	[Parameter(Mandatory)][int]$Issue,
	[Parameter(Mandatory)][string]$Items,
	[string]$Repo,
	[switch]$DryRun
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$positions = foreach ($token in ($Items -split '[,\s]+' | Where-Object { $_ })) {
	if ($token -notmatch '^\d+$') { throw "Invalid item '$token': expected positions such as '1,2,4'." }
	[int]$token
}
if (-not $positions) { throw 'No items given.' }

$repoArgs = if ($Repo) { @('--repo', $Repo) } else { @() }

$json = gh issue view $Issue @repoArgs --json body,state
if ($LASTEXITCODE -ne 0) { throw "Unable to read issue #$Issue." }
$data = $json | ConvertFrom-Json
$body = [string]$data.body

$newline = if ($body.Contains("`r`n")) { "`r`n" } else { "`n" }
$lines = $body -split '\r?\n'

$sectionPattern = '^##\s+(Критерии\s+при[её]мки|Acceptance(\s+criteria)?)(\s*\(.*\))?\s*$'
$checkboxPattern = '^(\s*[-*+]\s+\[)([ xX])(\]\s.*)$'

$start = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
	if ($lines[$i] -match $sectionPattern) { $start = $i; break }
}
if ($start -lt 0) { throw "Issue #$Issue has no '## Критерии приёмки', '## Acceptance criteria' or '## Acceptance' section." }

$end = $lines.Count
for ($i = $start + 1; $i -lt $lines.Count; $i++) {
	if ($lines[$i] -match '^##\s') { $end = $i; break }
}

$boxes = [System.Collections.Generic.List[int]]::new()
for ($i = $start + 1; $i -lt $end; $i++) {
	if ($lines[$i] -match $checkboxPattern) { $boxes.Add($i) }
}
if ($boxes.Count -eq 0) { throw "The acceptance section of issue #$Issue has no checkbox items." }

$invalid = $positions | Where-Object { $_ -lt 1 -or $_ -gt $boxes.Count }
if ($invalid) { throw "Item(s) $($invalid -join ', ') out of range: the section has $($boxes.Count) checkbox items." }

$targets = [System.Collections.Generic.HashSet[int]]::new()
foreach ($item in $positions) { [void]$targets.Add($boxes[$item - 1]) }

$newLines = [string[]]$lines.Clone()
foreach ($index in $targets) {
	$newLines[$index] = $lines[$index] -replace $checkboxPattern, '${1}x${3}'
}

# Guard: only the targeted lines may differ, and only in the checkbox mark.
for ($i = 0; $i -lt $lines.Count; $i++) {
	if ($lines[$i] -ceq $newLines[$i]) { continue }
	$expected = $lines[$i] -replace $checkboxPattern, '${1}x${3}'
	if (-not $targets.Contains($i) -or $newLines[$i] -cne $expected) {
		throw "Refusing to write: line $($i + 1) would change beyond its checkbox."
	}
}

$changed = @(0..($lines.Count - 1) | Where-Object { $lines[$_] -cne $newLines[$_] }).Count

for ($n = 0; $n -lt $boxes.Count; $n++) {
	$index = $boxes[$n]
	$state = if ($lines[$index] -ne $newLines[$index]) { 'ticked now' }
		elseif ($newLines[$index] -match '^\s*[-*+]\s+\[[xX]\]') { 'already ticked' }
		else { 'left unticked' }
	$text = ($newLines[$index] -replace '^\s*[-*+]\s+', '')
	Write-Output ("{0,2}. {1}  ({2})" -f ($n + 1), $text, $state)
}

if ($changed -eq 0) {
	Write-Output "Issue #${Issue}: nothing to change."
	return
}
if ($DryRun) {
	Write-Output "Issue #${Issue}: dry run, $changed item(s) would be ticked; the issue is unchanged."
	return
}

$file = [System.IO.Path]::GetTempFileName()
try {
	[System.IO.File]::WriteAllText($file, ($newLines -join $newline), [System.Text.UTF8Encoding]::new($false))
	gh issue edit $Issue @repoArgs --body-file $file | Out-Null
	if ($LASTEXITCODE -ne 0) { throw "Unable to edit issue #$Issue." }
}
finally {
	Remove-Item -LiteralPath $file -ErrorAction SilentlyContinue
}
Write-Output "Issue #${Issue}: ticked $changed item(s)."
