<#
.SYNOPSIS
	Prepares a clean working tree for the nuget-package-update skill.

.DESCRIPTION
	Refuses to start when the repository has any tracked or untracked change, so the package
	update is the only change in the working tree. When the tree is clean, removes the bin and
	obj folders of every .NET project under src so the following restore and rebuild start from
	scratch.

	Only the bin and obj folders next to a .csproj are removed: node_modules of the Playwright
	suites, local appsettings overrides and test results stay where they are.

.EXAMPLE
	pwsh -NoProfile -File .github/skills/_local.nuget-package-update/scripts/Prepare-PackageUpdate.ps1

.EXAMPLE
	pwsh -NoProfile -File .github/skills/_local.nuget-package-update/scripts/Prepare-PackageUpdate.ps1 -WhatIf
#>
[CmdletBinding()]
param(
	[switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = ((& git -C $PSScriptRoot rev-parse --show-toplevel) | Select-Object -First 1).Trim()
if ($LASTEXITCODE -ne 0 -or -not $repositoryRoot) {
	throw 'Unable to locate the repository root.'
}

$status = @(git -C $repositoryRoot status --porcelain=v1 --untracked-files=all)
if ($LASTEXITCODE -ne 0) {
	throw 'Unable to read git working-tree status.'
}
if ($status.Count -gt 0) {
	Write-Error "Package update refused: the working tree is not clean. Commit or stash these changes first:`n$($status -join [Environment]::NewLine)"
	exit 1
}

$sourceRoot = Join-Path $repositoryRoot 'src'
if (-not (Test-Path $sourceRoot)) {
	throw "No src folder under $repositoryRoot."
}

$projectFolders = @(Get-ChildItem -Path $sourceRoot -Filter '*.csproj' -File -Recurse -Force |
	Where-Object { $_.FullName -notmatch '[\/]node_modules[\/]' } |
	ForEach-Object { $_.DirectoryName } |
	Sort-Object -Unique)

$buildFolders = @(foreach ($projectFolder in $projectFolders) {
		foreach ($name in 'bin', 'obj') {
			$path = Join-Path $projectFolder $name
			if (Test-Path -LiteralPath $path -PathType Container) { $path }
		}
	})

foreach ($folder in $buildFolders) {
	if ($WhatIf) {
		Write-Output "Would remove $folder"
	}
	else {
		Remove-Item -LiteralPath $folder -Recurse -Force
	}
}

if ($WhatIf) {
	Write-Output 'Package update preflight passed in WhatIf mode; nothing was removed.'
}
else {
	Write-Output "Package update preflight passed: working tree clean, $($buildFolders.Count) bin/obj folders removed."
}
