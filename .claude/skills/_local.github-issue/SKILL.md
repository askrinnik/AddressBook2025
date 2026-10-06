---
name: github-issue
description: >
  Read a GitHub issue for AddressBook2025 (body, comments, related issues)
  and post a structured implementation/fix comment back to it. Use whenever
  a workflow starts from a GitHub issue number or needs to record the result
  of the work on that issue.
---

# Work With a GitHub Issue

> Local skill note: This skill is intentionally repository-specific for AddressBook2025 and does not map to a canonical upstream skill in github/awesome-copilot.

Repository: **`askrinnik/AddressBook2025`**. Issue reads and writes go through `gh` in Claude Code and through the GitHub MCP server in Copilot.

## When to Use

- A workflow is driven by an issue number (for example `/implement-issue 56`).
- You need to record what was done back on the issue as a comment.

## Reading an issue

Given an issue number `<issue>`:

1. If no issue number was provided, ask the user for it before doing anything else.
2. Fetch the issue: **title, body, labels, state**.
3. Fetch the **comments** — requirements are frequently refined there, not in the body.
4. If the issue links a parent/tracking issue or has sub-issues, fetch them too so the scope boundary is clear: work on **this** issue only, not the whole epic.
5. If the issue is **closed**, stop and confirm with the user before doing anything.

### Determining the lane by label

The labels select the lane of the `implement-issue` workflow:

- **Bug lane** — labelled `bug`: a defect to reproduce and fix at its root cause.
- **Test-authoring lane** — the issue asks only for tests of behaviour that already exists, typically labelled `testing`.
- **Feature lane** — everything else (`api`, `ui`, `enhancement`, or an unlabelled task).

If the labels and the issue text disagree, stop and confirm the lane with the user.

### Establishing the acceptance criteria

- Restate the requirement in your own words: what a user (or API consumer) should be able to do when this is done.
- Turn it into an explicit, checkable list — one line per observable behaviour. If the issue body already has a checklist (`- [ ]`) or acceptance criteria, use them verbatim as the base and only add what is missing.
- **Flag gaps rather than inventing them.** If something material is undefined (validation rules, empty/error states, endpoint or page, response shape, status codes, permissions), ask the user before proceeding. Make routine naming/UI calls yourself.

## Posting the result comment

When the work is confirmed, add an English comment to issue `<issue>`. Keep it factual and technical, based only on what was actually done. The headings depend on the lane.

**Feature lane and Test-authoring lane:**

- `## Implementation` — a short intro sentence, then a **Changes** bullet list naming each modified/added file in backticks with a one-line description of what changed there. Add a short **Key note** paragraph for any non-obvious decision or gotcha worth recording.
- `## Acceptance Criteria` — a table of each acceptance item and how it was satisfied.
- `## Verification` — Playwright API scenarios run, UI scenarios walked, other tests run, and the build result.

**Bug lane:**

- `## Root Cause` — what was actually wrong, in which layer, and why it produced the reported symptom.
- `## Resolution` — a short intro sentence, then a **Changes** bullet list naming each modified/added file in backticks with a one-line description, including the regression test that now covers the bug.
- `## Verification` — the repro before and after the fix, the tests run (the regression case and the full suite), and the build result.

Rules:

- Write in English, Markdown, imperative and concise.
- Do **not** include screenshots or local file paths.
- Do not restate the full issue; report only the outcome.
- Take every number, name and list from the facts you work from, verbatim: do not recount, merge, reattribute or extend them. If something looks inconsistent, keep it as given and point it out instead of correcting it.
- The *Acceptance Criteria* table has one row per acceptance item of the issue — exactly those items, in their order; never add rows.

Post it in Claude Code by writing the body to a scratch file outside the repository (the session's scratch directory, or the system temp folder) and running:

```
gh issue comment <issue> --body-file <file>
```

In Copilot, add the comment with the GitHub MCP server. Either way the result is the comment URL — report it; that is the confirmation. Do not re-read the issue to verify. Once the comment is posted, delete the scratch file (`rm <file>`); if posting failed, keep it and say where it is.

## Acceptance boxes

After the comment, and after the user's go-ahead, tick the verified items of the issue's acceptance section in the issue body with the script — one call, no reading or rewriting of the body by hand:

```
pwsh -NoProfile -File .github/skills/_local.github-issue/scripts/Set-AcceptanceChecks.ps1 -Issue <issue> -Items 1,2,4
```

- The acceptance section is the first `## Критерии приёмки`, `## Acceptance criteria` or `## Acceptance` heading; a note in parentheses after the heading is allowed.
- `-Items` are the positions of the verified checkboxes within that section, 1-based, in document order, as one comma-separated value.
- The script changes only those `- [ ]` marks and refuses to write if anything else in the body would differ; it never unticks.
- Its output lists every checkbox with `ticked now`, `already ticked` or `left unticked` — name the unticked ones to the user. `-DryRun` shows the result without editing.
- Skip this when the body has no checklist.

## Inline or delegated

Run this skill inline when the user asks for a comment directly. Inside `/implement-issue` and `/implement-issues`, after the user's go-ahead, *Posting the result comment* — composing and posting — runs in the `skill-runner` agent: the caller hands it this skill's name, the compact facts (issue number and title, lane, changed files with one line each, the acceptance items with how each was verified or the root cause, build and test results, the PR URL if it exists) and a scratch file path for the body; it posts the comment and returns its URL. Reading the issue and ticking the acceptance boxes stay with the caller. If you *are* the skill-runner, do not delegate again.
