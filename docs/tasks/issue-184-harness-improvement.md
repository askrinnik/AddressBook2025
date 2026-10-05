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

## 7. Phase 3 — the rest of the GitHubBackup harness

### Acceptance

- [x] `implement-issue`: dependency check (blocked-by relations and body), docs updated in the same change, comment-hygiene review, ticking verified acceptance boxes, one CI check after the PR, step 13 *Recommend the next issue*; `next-issue` when no number is given (body and both wrappers).
- [x] `CLAUDE.md`: comment-hygiene rule, entry points, `.claude/rules` loading of the file-type standards.
- [x] `.claude/rules/`: `api-architecture.md`, `csharp.md`, `blazor.md`, `playwright.md` — `paths:` mirroring `applyTo` and importing the `.github/instructions` file; `update-docs-on-code-change.md` with this repository's docs table.
- [x] New skills (source + mirror): `_local.next-issue` (+ `Get-NextIssue.ps1`, order by issue number), `_local.write-tests` (Playwright API / bUnit / Playwright UI layers), `_local.debug-issue`, `_local.refactor-code`, `_local.harness-quality-check` (+ scripts).
- [x] Benchmark `.ai/benchmarks/harness/` with fixtures `bench-base` and `quality-vertical-slice` (ground truth for an "add Email to contacts" request); `-DryRun` passes.
- [x] `docs/ai-harness.md` describes the harness; `docs/specs/Architecture.md` updated.
- [x] Issue forms `bug.yml` and `task.yml` (acceptance checklist, dependencies) replace `bug_report.md`; `pull_request_template.md` added.
- [x] Shared `.claude/settings.json` (permissions allow/ask/deny, empty attribution, MCP servers enabled) — created by the user (the auto-mode classifier blocks the assistant from writing its own permissions); commit, push, PR and issue writes are in `ask`.

### Decisions

- `dotnet format --verify-no-changes` is not added as a gate: the repository has no `.editorconfig` yet (#173).
- Rules import the instruction files (`@../../.github/instructions/…`) instead of copying them, so `.github/instructions` stays the single source of truth; each rule also says to read the file if the import did not load.
- `next-issue` orders ready issues by number (no F-codes here); dependencies count only as GitHub "blocked by" relations, a body-only dependency is reported as a mismatch.
- The benchmark scripts are ported unchanged except the script path and the list of instruction paths the report diffs (adds `.github/instructions`, `.ai/prompts`).

## 8. Phase 4 — remaining useful parts

### Acceptance

- [x] MCP servers `context7`, `microsoft-learn`, `nuget`: new `.mcp.json` (Claude Code) and added to `.vscode/mcp.json` (Copilot); `issue-planner` and `issue-developer` get the documentation tools on both sides.
- [x] `_local.nuget-package-update` (+ `Prepare-PackageUpdate.ps1`) adapted to `src/Directory.Packages.props`: current pins (MediatR), families of this stack, lock files, bUnit and Playwright gates; the preflight removes only `bin`/`obj` next to a `.csproj`, never `node_modules`.
- [x] `.claude/rules/github-actions.md` describing this repository's four workflows and the rules for workflows added or changed.
- [x] `.claude/rules/docs.md`: language, where documents go, issue-plan format, style.
- [x] Generic skills `test-anti-patterns`, `coverage-analysis`, `directory-build-organization`, and `run-tests` renamed to `dotnet-run-tests` (name clash with `_local.run-tests`).
- [x] `docs/ai-harness.md` updated (MCP servers, rules, skills); `check.ps1` passes.

### Decisions

- The existing workflows keep their tag-pinned actions; the rule asks for SHA pins only on lines a change adds or touches, and the migration is its own change.
- `.mcp.json` does not include a GitHub server: it needs a token, and Claude Code here uses `gh`.
