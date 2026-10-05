<#
.SYNOPSIS
	Recommends the next GitHub issue to implement.

.DESCRIPTION
	Reads every open issue of the repository with one GraphQL query: title, milestone, labels, the issues
	that block it (GitHub "blocked by" relations) and the open pull requests that will close it. An issue is
	ready when it has no open pull request of its own and every issue blocking it is closed. Ready issues are
	ordered by issue number, because issues are created in the order of their plan in docs/tasks.

	-AssumeClosed treats the given issues as already closed: the implement-issue workflow passes the issue it
	has just shipped, because that issue closes only when its pull request is merged.

.PARAMETER Repo
	owner/name; defaults to the repository of the current directory.

.PARAMETER AssumeClosed
	Issue numbers to treat as closed.

.PARAMETER Top
	How many ready issues to list (the first one is the recommendation).

.PARAMETER Json
	Emit JSON instead of text.

.EXAMPLE
	pwsh -NoProfile -File .github/skills/_local.next-issue/scripts/Get-NextIssue.ps1

.EXAMPLE
	pwsh -NoProfile -File .github/skills/_local.next-issue/scripts/Get-NextIssue.ps1 -AssumeClosed 2
#>
[CmdletBinding()]
param(
	[string]$Repo,
	[int[]]$AssumeClosed = @(),
	[int]$Top = 3,
	[switch]$Json
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

if (-not $Repo) {
	$Repo = (gh repo view --json nameWithOwner --jq .nameWithOwner)
	if ($LASTEXITCODE -ne 0) { throw 'Unable to determine the repository; pass -Repo owner/name.' }
}
$owner, $name = $Repo.Split('/')

$query = @'
query($owner: String!, $name: String!, $cursor: String) {
  repository(owner: $owner, name: $name) {
    issues(first: 100, after: $cursor, states: OPEN) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number
        title
        url
        milestone { title }
        labels(first: 20) { nodes { name } }
        assignees(first: 5) { nodes { login } }
        blockedBy(first: 50) { nodes { number title state } }
        closedByPullRequestsReferences(first: 5, includeClosedPrs: false) { nodes { number url } }
      }
    }
  }
}
'@

$issues = [System.Collections.Generic.List[object]]::new()
$cursor = $null
do {
	$arguments = @('api', 'graphql', '-f', "query=$query", '-f', "owner=$owner", '-f', "name=$name")
	if ($cursor) { $arguments += @('-f', "cursor=$cursor") }
	$page = (gh @arguments | ConvertFrom-Json).data.repository.issues
	if ($LASTEXITCODE -ne 0) { throw 'GitHub query failed.' }
	$page.nodes | ForEach-Object { $issues.Add($_) }
	$cursor = $page.pageInfo.endCursor
} while ($page.pageInfo.hasNextPage)

function Get-SortKey([object]$issue) {
	# Issues of one plan are created in plan order, so the issue number is the order.
	return '{0:D6}' -f [int]$issue.number
}

$assumed = [System.Collections.Generic.HashSet[int]]::new([int[]]$AssumeClosed)
$open = @($issues | Where-Object { -not $assumed.Contains([int]$_.number) })
$withOpenPr = @{}
foreach ($issue in $open) {
	if ($issue.closedByPullRequestsReferences.nodes.Count -gt 0) { $withOpenPr[[int]$issue.number] = $issue.closedByPullRequestsReferences.nodes[0] }
}

$ready = [System.Collections.Generic.List[object]]::new()
$afterMerge = [System.Collections.Generic.List[object]]::new()
foreach ($issue in $open) {
	if ($withOpenPr.ContainsKey([int]$issue.number)) { continue }
	$blockers = @($issue.blockedBy.nodes | Where-Object { $_.state -eq 'OPEN' -and -not $assumed.Contains([int]$_.number) })
	$entry = [pscustomobject]@{
		number    = [int]$issue.number
		title     = $issue.title
		url       = $issue.url
		milestone = $issue.milestone.title
		labels    = @($issue.labels.nodes | ForEach-Object { $_.name })
		assignees = @($issue.assignees.nodes | ForEach-Object { $_.login })
		waitsFor  = @($blockers | ForEach-Object { [int]$_.number })
		sortKey   = Get-SortKey $issue
	}
	if ($blockers.Count -eq 0) {
		$ready.Add($entry)
	}
	elseif (@($blockers | Where-Object { -not $withOpenPr.ContainsKey([int]$_.number) }).Count -eq 0) {
		# Every remaining blocker already has an open pull request: the issue becomes ready once those merge.
		$entry | Add-Member -NotePropertyName pullRequests -NotePropertyValue @($blockers | ForEach-Object { $withOpenPr[[int]$_.number].number })
		$afterMerge.Add($entry)
	}
}

$ready = @($ready | Sort-Object sortKey)
$afterMerge = @($afterMerge | Sort-Object sortKey)
$inProgress = @($open | Where-Object { $withOpenPr.ContainsKey([int]$_.number) } | ForEach-Object {
		[pscustomobject]@{ number = [int]$_.number; title = $_.title; pullRequest = $withOpenPr[[int]$_.number].number }
	})

if ($Json) {
	[pscustomobject]@{
		recommended = $ready | Select-Object -First 1
		ready       = $ready | Select-Object -First $Top
		afterMerge  = $afterMerge | Select-Object -First $Top
		inProgress  = $inProgress
		openCount   = $open.Count
	} | ConvertTo-Json -Depth 5
	exit 0
}

if ($assumed.Count) { Write-Output "Treated as closed: $(($AssumeClosed | ForEach-Object { "#$_" }) -join ', ')" }
Write-Output "Open issues: $($open.Count); ready: $($ready.Count); in progress (open PR): $($inProgress.Count)"
Write-Output ''
if ($ready.Count) {
	Write-Output 'Ready to start (recommended first):'
	$ready | Select-Object -First $Top | ForEach-Object {
		$who = if ($_.assignees.Count) { " [assigned: $($_.assignees -join ', ')]" } else { '' }
		$ms = if ($_.milestone) { " — $($_.milestone)" } else { '' }
		Write-Output "  #$($_.number) $($_.title)$ms$who"
	}
}
else {
	Write-Output 'No issue is ready: every open issue is blocked or already has an open pull request.'
}
if ($afterMerge.Count) {
	Write-Output ''
	Write-Output 'Ready once these pull requests merge:'
	$afterMerge | Select-Object -First $Top | ForEach-Object {
		Write-Output "  #$($_.number) $($_.title) — after PR $(($_.pullRequests | ForEach-Object { "#$_" }) -join ', ')"
	}
}
if ($inProgress.Count) {
	Write-Output ''
	Write-Output 'In progress:'
	$inProgress | ForEach-Object { Write-Output "  #$($_.number) $($_.title) — PR #$($_.pullRequest)" }
}
