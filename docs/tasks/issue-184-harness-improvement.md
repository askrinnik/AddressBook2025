# Plan: Issue #184 — Harness Improvement

> **Issue:** [#184](https://github.com/askrinnik/AddressBook2025/issues/184)
> **Scope of this plan:** Phase 1 — merge `fix-bug-issue` into a single lane-based `implement-issue` command. Phase 2 (subagents and models) is a separate change.
> **Mode:** harness/docs only; no production code changes.

## 1. Requirement

One `/implement-issue` command drives every issue type. The issue's labels select a lane — **Bug**, **Feature** or **Test-authoring** — and the shared steps (branch sync, plan, review, build, confirmation, comment, shipping gates) are written once. `fix-bug-issue` disappears from both tools. The bug-comment template is defined once, in the `github-issue` skill.

## 2. Acceptance

- [x] `.ai/prompts/implement-issue.md` covers the Bug, Feature and Test-authoring lanes; lane-specific steps are marked, shared steps are written once.
- [x] Bug lane keeps everything `fix-bug-issue` did: browser reproduction, root-cause plan with a regression test, fix verification against the original repro, RCA comment.
- [x] Step 0 starts from an up-to-date `main`: a dirty tree stops the workflow, `git pull --ff-only`, no force; the base is re-synced before the commit.
- [x] `fix-bug-issue` is removed from `.ai/prompts/`, `.claude/commands/` and `.github/prompts/`; the `implement-issue` wrappers describe all issue types.
- [x] `_local.github-issue` (source and mirror) routes `bug` to the Bug lane and has one comment template per lane (Bug: *Root Cause / Resolution / Verification*; Feature and Test-authoring: *Implementation / Acceptance Criteria / Verification*).
- [x] `docs/specs/Architecture.md` lists only `implement-issue` as a command.
- [x] `check.ps1` audit passes.

## 3. Affected files

- `.ai/prompts/implement-issue.md` — rewritten as a lane-based workflow.
- `.ai/prompts/fix-bug-issue.md`, `.claude/commands/fix-bug-issue.md`, `.github/prompts/fix-bug-issue.prompt.md` — deleted.
- `.claude/commands/implement-issue.md`, `.github/prompts/implement-issue.prompt.md` — descriptions cover bug, feature and test issues.
- `.github/skills/_local.github-issue/SKILL.md` + `.claude/skills/_local.github-issue/SKILL.md` — lane routing and per-lane comment templates.
- `docs/specs/Architecture.md` — Commands bullet.

## 4. Verification

- `pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1` passes.
- `grep -r fix-bug-issue` finds no live references (only this plan and the issue).
- A real dry run on one bug issue and one feature issue is part of the issue's acceptance and happens after merge.

## 5. Out of scope

- Subagents, per-stage models, the Context budget section — Phase 2 of #184.
