#requires -Version 5.1
<#
.SYNOPSIS
    Audit the repository's cross-tool AI customizations (GitHub Copilot + Claude Code)
    against the policy in .ai/customizations.policy.json. Report-only; makes no changes.
.PARAMETER RepoRoot
    Repository root. Defaults to the nearest ancestor of this script that contains .git or .github.
.PARAMETER Json
    Emit findings as JSON instead of a human-readable report.
#>
[CmdletBinding()]
param(
    [string]$RepoRoot,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'

function Find-RepoRoot {
    param([string]$Start)
    $dir = (Get-Item -LiteralPath $Start).FullName
    while ($dir) {
        if ((Test-Path (Join-Path $dir '.git')) -or (Test-Path (Join-Path $dir '.github'))) { return $dir }
        $parent = Split-Path $dir -Parent
        if (-not $parent -or $parent -eq $dir) { break }
        $dir = $parent
    }
    return (Get-Location).Path
}

if (-not $RepoRoot) { $RepoRoot = Find-RepoRoot -Start $PSScriptRoot }
$RepoRoot = (Get-Item -LiteralPath $RepoRoot).FullName

$defaultPolicyJson = @'
{
  "skills": {
    "sourceOfTruth": ".github/skills",
    "mirror": ".claude/skills",
    "excludedFromMirror": ["generate-docs"]
  },
  "prompts": {
    "sharedBodyDir": ".ai/prompts",
    "copilotWrapperDir": ".github/prompts",
    "copilotWrapperSuffix": ".prompt.md",
    "claudeWrapperDir": ".claude/commands",
    "claudeWrapperSuffix": ".md",
    "maxWrapperBodyLines": 12
  },
  "naming": {
    "kebabPattern": "^[a-z0-9]+(-[a-z0-9]+)*$",
    "localPrefix": "_local."
  }
}
'@

$policyPath = Join-Path $RepoRoot '.ai/customizations.policy.json'
if (Test-Path $policyPath) {
    $policy = Get-Content -LiteralPath $policyPath -Raw | ConvertFrom-Json
} else {
    $policy = $defaultPolicyJson | ConvertFrom-Json
}

$findings = [System.Collections.Generic.List[object]]::new()
function Add-Finding {
    param([ValidateSet('Error', 'Warning', 'Info')][string]$Severity, [string]$Category, [string]$Message)
    $findings.Add([pscustomobject]@{ Severity = $Severity; Category = $Category; Message = $Message })
}

function Resolve-RepoPath { param([string]$Rel) return (Join-Path $RepoRoot $Rel) }

function Get-SubdirNames {
    param([string]$Rel)
    $p = Resolve-RepoPath $Rel
    if (-not (Test-Path $p)) { return @() }
    return @(Get-ChildItem -LiteralPath $p -Directory | Select-Object -ExpandProperty Name)
}

function Get-DirFileHashes {
    param([string]$AbsDir)
    $result = @{}
    if (-not (Test-Path $AbsDir)) { return $result }
    $base = (Get-Item -LiteralPath $AbsDir).FullName
    foreach ($f in Get-ChildItem -LiteralPath $AbsDir -Recurse -File) {
        $rel = $f.FullName.Substring($base.Length).TrimStart('\', '/').Replace('\', '/')
        $result[$rel] = (Get-FileHash -LiteralPath $f.FullName -Algorithm SHA256).Hash
    }
    return $result
}

function Get-SkillName {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return @{ name = $null; hasFrontmatter = $false } }
    $lines = @(Get-Content -LiteralPath $Path)
    if ($lines.Count -lt 1 -or $lines[0].Trim() -ne '---') { return @{ name = $null; hasFrontmatter = $false } }
    $name = $null
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i].Trim() -eq '---') { break }
        if ($lines[$i] -match '^\s*name\s*:\s*(.+?)\s*$') { $name = $Matches[1].Trim().Trim("'").Trim('"') }
    }
    return @{ name = $name; hasFrontmatter = $true }
}

function Get-WrapperBodyLineCount {
    param([string]$Path)
    $lines = @(Get-Content -LiteralPath $Path)
    $idx = 0
    if ($lines.Count -ge 1 -and $lines[0].Trim() -eq '---') {
        for ($i = 1; $i -lt $lines.Count; $i++) { if ($lines[$i].Trim() -eq '---') { $idx = $i + 1; break } }
    }
    if ($idx -ge $lines.Count) { return 0 }
    return @($lines[$idx..($lines.Count - 1)] | Where-Object { $_.Trim() -ne '' }).Count
}

# ---- Skill parity ----
$src = $policy.skills.sourceOfTruth
$mir = $policy.skills.mirror
$excluded = @($policy.skills.excludedFromMirror)
$srcNames = Get-SubdirNames $src
$mirNames = Get-SubdirNames $mir

foreach ($name in $srcNames) {
    if ($excluded -contains $name) {
        if ($mirNames -contains $name) {
            Add-Finding Warning 'skill-parity' "$src/$name is marked excluded but is also present in $mir (expected Copilot-only)."
        }
        continue
    }
    if ($mirNames -notcontains $name) {
        Add-Finding Error 'skill-parity' "Skill '$name' exists in $src but is missing from $mir."
        continue
    }
    $a = Get-DirFileHashes (Resolve-RepoPath "$src/$name")
    $b = Get-DirFileHashes (Resolve-RepoPath "$mir/$name")
    $allKeys = @($a.Keys + $b.Keys) | Sort-Object -Unique
    foreach ($k in $allKeys) {
        if (-not $a.ContainsKey($k)) { Add-Finding Error 'skill-parity' "Skill '$name': '$k' exists in $mir but not in $src."; continue }
        if (-not $b.ContainsKey($k)) { Add-Finding Error 'skill-parity' "Skill '$name': '$k' exists in $src but not in $mir."; continue }
        if ($a[$k] -ne $b[$k]) { Add-Finding Error 'skill-parity' "Skill '$name': '$k' differs between $src and $mir (content drift)." }
    }
}
foreach ($name in $mirNames) {
    if ($srcNames -notcontains $name) {
        Add-Finding Warning 'skill-parity' "Skill '$name' exists in $mir but has no source in $src."
    }
}
foreach ($name in $excluded) {
    if ($srcNames -notcontains $name) {
        Add-Finding Info 'skill-parity' "Excluded skill '$name' is listed in policy but not found in $src."
    }
}

# ---- Skill format / naming ----
$kebab = $policy.naming.kebabPattern
$localPrefix = $policy.naming.localPrefix
foreach ($loc in @($src, $mir)) {
    foreach ($name in (Get-SubdirNames $loc)) {
        $skillMd = Resolve-RepoPath "$loc/$name/SKILL.md"
        if (-not (Test-Path $skillMd)) {
            Add-Finding Error 'skill-format' "$loc/$name is missing SKILL.md."
            continue
        }
        $fm = Get-SkillName $skillMd
        $expectedNames = @($name)
        if ($localPrefix -and $name.StartsWith($localPrefix)) { $expectedNames += $name.Substring($localPrefix.Length) }
        if (-not $fm.hasFrontmatter) {
            Add-Finding Error 'skill-format' "$loc/$name/SKILL.md has no YAML frontmatter."
        } elseif (-not $fm.name) {
            Add-Finding Warning 'skill-format' "$loc/$name/SKILL.md has no 'name' field."
        } elseif ($expectedNames -notcontains $fm.name) {
            Add-Finding Error 'skill-format' "$loc/$name/SKILL.md 'name' ('$($fm.name)') does not match its directory name."
        }
        $checkName = $name
        if ($localPrefix -and $checkName.StartsWith($localPrefix)) { $checkName = $checkName.Substring($localPrefix.Length) }
        if ($checkName -notmatch $kebab) {
            Add-Finding Warning 'skill-format' "Skill directory '$name' is not kebab-case."
        }
    }
}

# ---- Prompt structure ----
$bodyDir = $policy.prompts.sharedBodyDir
$coDir = $policy.prompts.copilotWrapperDir
$coSuf = $policy.prompts.copilotWrapperSuffix
$clDir = $policy.prompts.claudeWrapperDir
$clSuf = $policy.prompts.claudeWrapperSuffix
$maxBody = [int]$policy.prompts.maxWrapperBodyLines

$bodyBase = @()
$bodyAbs = Resolve-RepoPath $bodyDir
if (Test-Path $bodyAbs) {
    $bodyBase = @(Get-ChildItem -LiteralPath $bodyAbs -File -Filter '*.md' | ForEach-Object { $_.BaseName })
}

foreach ($base in $bodyBase) {
    $co = Resolve-RepoPath "$coDir/$base$coSuf"
    $cl = Resolve-RepoPath "$clDir/$base$clSuf"
    $bodyRel = "$bodyDir/$base.md"

    if (-not (Test-Path $co)) {
        Add-Finding Error 'prompt-structure' "Shared body '$bodyRel' has no Copilot wrapper at $coDir/$base$coSuf."
    } else {
        $txt = Get-Content -LiteralPath $co -Raw
        if ($txt -notmatch [regex]::Escape("$base.md")) {
            Add-Finding Warning 'prompt-structure' "Copilot wrapper '$coDir/$base$coSuf' does not reference the shared body '$bodyRel'."
        }
        if ((Get-WrapperBodyLineCount $co) -gt $maxBody) {
            Add-Finding Warning 'prompt-structure' "Copilot wrapper '$coDir/$base$coSuf' body exceeds $maxBody lines - should be a thin wrapper."
        }
    }
    if (-not (Test-Path $cl)) {
        Add-Finding Error 'prompt-structure' "Shared body '$bodyRel' has no Claude wrapper at $clDir/$base$clSuf."
    } else {
        $txt = Get-Content -LiteralPath $cl -Raw
        if ($txt -notmatch [regex]::Escape("$bodyDir/$base.md")) {
            Add-Finding Warning 'prompt-structure' "Claude wrapper '$clDir/$base$clSuf' does not reference the shared body '$bodyRel'."
        }
        if ((Get-WrapperBodyLineCount $cl) -gt $maxBody) {
            Add-Finding Warning 'prompt-structure' "Claude wrapper '$clDir/$base$clSuf' body exceeds $maxBody lines - should be a thin wrapper."
        }
    }
}

function Test-WrapperBodies {
    param([string]$Dir, [string]$Suffix)
    $abs = Resolve-RepoPath $Dir
    if (-not (Test-Path $abs)) { return }
    foreach ($f in Get-ChildItem -LiteralPath $abs -File -Filter "*$Suffix") {
        $txt = Get-Content -LiteralPath $f.FullName -Raw
        if ($txt -match ([regex]::Escape($bodyDir + '/') + '([A-Za-z0-9._-]+)\.md')) {
            $ref = $Matches[1]
            if (-not (Test-Path (Resolve-RepoPath "$bodyDir/$ref.md"))) {
                Add-Finding Error 'prompt-structure' "$Dir/$($f.Name) references a missing shared body '$bodyDir/$ref.md'."
            }
        }
    }
}
Test-WrapperBodies $coDir $coSuf
Test-WrapperBodies $clDir $clSuf

# ---- Slash-command collisions (prompt name == skill name) ----
$promptNames = @()
$promptNames += $bodyBase
foreach ($pair in @(, @($coDir, $coSuf)) + @(, @($clDir, $clSuf))) {
    $abs = Resolve-RepoPath $pair[0]
    if (Test-Path $abs) {
        $promptNames += @(Get-ChildItem -LiteralPath $abs -File -Filter "*$($pair[1])" |
            ForEach-Object { $_.Name.Substring(0, $_.Name.Length - $pair[1].Length) })
    }
}
$promptNames = @($promptNames | Sort-Object -Unique)
$skillNames = @(($srcNames + $mirNames) | Sort-Object -Unique)
foreach ($n in $promptNames) {
    if ($skillNames -contains $n) {
        Add-Finding Error 'collision' "Name '$n' is used by both a prompt/command and a skill - slash-command collision."
    }
}

# ---- Output ----
if ($Json) {
    $findings | ConvertTo-Json -Depth 4
} else {
    $errors = @($findings | Where-Object Severity -eq 'Error')
    $warnings = @($findings | Where-Object Severity -eq 'Warning')
    $infos = @($findings | Where-Object Severity -eq 'Info')
    Write-Host "AI customizations audit - repo root: $RepoRoot"
    Write-Host ("Errors: {0}  Warnings: {1}  Info: {2}" -f $errors.Count, $warnings.Count, $infos.Count)
    Write-Host ''
    foreach ($grp in @(, @('Error', $errors)) + @(, @('Warning', $warnings)) + @(, @('Info', $infos))) {
        if ($grp[1].Count -gt 0) {
            Write-Host "== $($grp[0]) =="
            foreach ($f in $grp[1]) { Write-Host ("[{0}] {1}" -f $f.Category, $f.Message) }
            Write-Host ''
        }
    }
    if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
        Write-Host 'All checks passed - layout is in sync with policy.'
    }
}

exit ([int]((@($findings | Where-Object Severity -eq 'Error')).Count -gt 0))
