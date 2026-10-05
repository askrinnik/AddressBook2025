# Plan: Issue #184 — Harness Improvement

> **Issue:** [#184](https://github.com/askrinnik/AddressBook2025/issues/184)
> **Scope of this plan:** Phase 1 — merge `fix-bug-issue` into a single lane-based `implement-issue` command. Phase 2 — delegate the workflow stages to subagents with per-stage models.
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

- A real dry run of the workflow on a bug and a feature issue — done after merge, tracked on #184.

## 6. Phase 2 — subagents and models

### Acceptance

- [x] New Claude agents in `.claude/agents/`: `issue-planner` (Opus, read-only, plan + S/M/L), `issue-developer` (Sonnet, Opus per call for `L`; never commits or posts), `issue-verifier` (Sonnet, browser reproduce/verify, evidence table), `security-reviewer` (Opus, read-only), `skill-runner` (Haiku, text only).
- [x] Copilot mirrors in `.github/agents/<name>.agent.md` with the same body and Copilot front matter (model, tools); skill paths point to `.github/skills/`.
- [x] `implement-issue.md` has a *Delegation* table (role → Claude agent → Copilot agent → model → steps), the model-by-complexity rule, an inline fallback, and a *Context budget* section with three `/compact` milestones.
- [x] Delegation is wired into the steps: reproduce (3), plan (4), implement (7), security review (8), browser verify (9), comment/commit/PR text (11–12); every gate stays in the main session.
- [x] `_local.open-pr` accepts a pre-composed commit message and PR text and states the PR title and `Closes #<issue>` convention (source + mirror).
- [x] `CLAUDE.md` and `docs/specs/Architecture.md` list the workflow agents.
- [x] `check.ps1` audit passes.

### Decisions

- Main-session gates are unchanged: the build and the test suites are always re-run by the main session; `issue-verifier` only does the browser walk.
- The Playwright suites start and stop the API/Web through their `webServer` config, so `issue-developer` runs specs without managing servers.
- `issue-verifier` has no `tools` restriction (it needs the Playwright MCP tools); its read-only role is a hard rule in the body.
- Copilot cannot override a subagent's model per call: an `L` plan is implemented in the main session there.
- Copilot model names follow the ones already used in `.github/agents/`; `Claude Haiku 4.5 (copilot)` for `skill-runner` is new and should be checked in the Copilot model picker.

### Affected files

- `.claude/agents/{issue-planner,issue-developer,issue-verifier,security-reviewer,skill-runner}.md` — new.
- `.github/agents/{issue-planner,issue-developer,issue-verifier,security-reviewer,skill-runner}.agent.md` — new.
- `.ai/prompts/implement-issue.md` — Delegation, Context budget, per-step delegation.
- `.github/skills/_local.open-pr/SKILL.md` + mirror — pre-composed text, title and `Closes` convention.
- `CLAUDE.md`, `docs/specs/Architecture.md` — agent lists.
