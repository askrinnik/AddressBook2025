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

Repository: **`askrinnik/AddressBook2025`**. All issue reads and writes go through the GitHub MCP server.

## When to Use

- A workflow is driven by an issue number (for example `/implement-issue 56` or a defect-fix flow).
- You need to record what was done back on the issue as a comment.

## Reading an issue

Given an issue number `<issue>`:

1. If no issue number was provided, ask the user for it before doing anything else.
2. Fetch the issue: **title, body, labels, state**.
3. Fetch the **comments** — requirements are frequently refined there, not in the body.
4. If the issue links a parent/tracking issue or has sub-issues, fetch them too so the scope boundary is clear: work on **this** issue only, not the whole epic.
5. If the issue is **closed**, stop and confirm with the user before doing anything.

### Determining the issue type by label

- Feature-type work: labels such as `api`, `enhancement`, `feature`, `testing`, or an unlabelled task.
- If the issue is labelled `bug`, it is a defect — follow the defect-fix flow, not the feature flow. If the current workflow is the wrong one for the label, stop and confirm with the user.

### Establishing the acceptance criteria

- Restate the requirement in your own words: what a user (or API consumer) should be able to do when this is done.
- Turn it into an explicit, checkable list — one line per observable behaviour. If the issue body already has a checklist (`- [ ]`) or acceptance criteria, use them verbatim as the base and only add what is missing.
- **Flag gaps rather than inventing them.** If something material is undefined (validation rules, empty/error states, endpoint or page, response shape, status codes, permissions), ask the user before proceeding. Make routine naming/UI calls yourself.

## Posting the result comment

When the work is confirmed, add an English comment to issue `<issue>` via the GitHub MCP server. Keep it factual and technical, based only on what was actually done, with these headings:

- `## Implementation` (or `## Fix` for a defect) — a short intro sentence, then a **Changes** bullet list naming each modified/added file in backticks with a one-line description of what changed there. Add a short **Key note** paragraph for any non-obvious decision or gotcha worth recording.
- `## Acceptance Criteria` — a table of each acceptance item and how it was satisfied. For a defect, state the root cause and the regression test that now covers it.
- `## Verification` — Playwright API scenarios run, UI scenarios walked, and the build result.

Rules:

- Write in English, Markdown, imperative and concise.
- Do **not** include screenshots or local file paths.
- Do not restate the full issue; report only the outcome.
