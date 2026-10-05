Take the GitHub issue you were given (its number is referred to below as `<issue>`) end to end: read it, pick the lane, plan, get plan approval, implement, verify, get result approval, record the outcome on the issue, and offer to ship it as a pull request. There are two checkpoints with me — the plan review and the result confirmation — and every outward action (commit, push, PR) needs my explicit go-ahead.

The issue's labels select the **lane** at step 2. Steps marked **Bug lane**, **Feature lane** or **Test-authoring lane** apply only to that lane; unmarked steps apply to all of them.

This workflow orchestrates existing skills instead of re-deriving their mechanics:
- **`github-issue`** — read the issue (body, comments, related issues), establish acceptance criteria, and post the result comment at the end.
- **`run-api`** / **`run-tests`** — start the API and run the Playwright E2E suite.
- **`verify-feature`** — start the API + Web, run Playwright E2E, and walk each acceptance item (or the bug repro) in a real browser.
- **`open-pr`** — commit onto the issue branch (via `git-commit`), include the plan, and open the PR into `main`.
- **`next-issue`** — recommend what to take when no issue number is given, and what comes next after shipping.
- **`debug-issue`** / **`write-tests`** — reproduce and diagnose a defect; pick the test layer and write the tests.

Also follow the `api-architecture`, `blazor.project-specific`, `csharp` and `playwright-conventions` instruction files for the file types you touch.

## Delegation

Noisy or specialised work goes to subagents so their raw output stays out of this conversation. Each role runs on the model that fits it:

| Role | Claude Code (`subagent_type`) | Copilot agent | Model | Steps |
|---|---|---|---|---|
| Plan | `issue-planner` | Issue Planner | Opus | 4 |
| Design of a cross-layer change | `architect` | Architect | Opus | 4 (optional) |
| Implement — Bug / Feature lane | `issue-developer` | Issue Developer | Sonnet; Opus for complexity `L` | 7 |
| Implement — Test-authoring lane | `playwright-tester` (Playwright specs); `issue-developer` (bUnit) | Playwright Tester / Issue Developer | Sonnet | 7 |
| Browser reproduce / verify | `issue-verifier` | Issue Verifier | Sonnet | 3, 9 |
| Security review (when triggered) | `security-reviewer` | Security Reviewer | Opus | 8 |
| Commit message, issue comment, PR text | `skill-runner` | Skill Runner | Haiku | 11, 12 |
| Broad code search | `Explore` (summary ≤ 30 lines) | — | default | 3 |

- **You keep every gate:** the plan review, the build, the test-suite run, both confirmations with me, and every `git` / GitHub action. A subagent's "passed" is input, not proof — re-run the build and the suite yourself.
- Hand each subagent only the compact facts it needs (issue number and exact title, lane, plan file path, acceptance list, decisions), not this conversation.
- **Model choice:** pass `model: "opus"` to `issue-developer` when the plan's complexity is `L`; otherwise use the agent's default. If your tool cannot override the model per call (Copilot), implement an `L` plan in the main session instead.
- For a trivial change (a few lines, one file) you may plan or implement inline instead of delegating.
- If your tool cannot run subagents, do the step inline, following the same agent's instructions (`.claude/agents/<name>.md` / `.github/agents/<name>.agent.md`).

## Context budget

Every model call re-reads the whole conversation, so cost is roughly calls × context size. Keep it small:

1. **Compact at milestones** (Claude Code). You cannot run slash commands yourself: at each milestone, give me the ready-to-paste `/compact` command below and continue once I have run it or told you to go on without it. Whatever a later step needs must already be on disk or in the focus text. Skip a milestone while the conversation is still short (under about 40 tool calls).
   - **Plan approved (end of step 6):** `/compact keep: issue number and exact title, lane, acceptance list, plan file path, decisions made during plan review, complexity`
   - **Build and tests green (end of step 9):** `/compact keep: issue number and exact title, lane, acceptance list, plan file path, list of changed files, build and test results, verification table`
   - **Result confirmed (end of step 10):** `/compact keep: issue number and exact title, lane, git diff --stat, one line per changed file, acceptance table with results or root cause, verification summary`
2. **Runaway guard.** If one turn passes about 100 tool calls without reaching a milestone (repeated build-and-fix loops), stop at the next natural pause and offer `/compact` with a focus text of the same kind.
3. **One issue per session.** After step 13, recommend a new session for the next issue instead of continuing in this one.
4. **Read narrowly.** Grep first, then read around the match; never re-read a file you just edited.
5. **Small tool output at the source.** `dotnet build … -clp:ErrorsOnly`; Playwright with `--reporter=line`, captured to a file, reading only the summary and the first failures; `git diff --stat` before any full diff; `gh … --json <fields> --jq …`.

## 0. Start from an up-to-date `main`

**Skip this step ONLY if I explicitly told you to stay on the current branch** (in the command arguments or in chat — for example a follow-up change to the same issue). Then state in one line that you are staying, pull the current branch if it tracks a remote, note that the base may be stale, and continue to step 1. **Silence is not permission.**

- Check the working tree (`git status --short`) and the current branch (`git branch --show-current`).
- **Uncommitted changes** → stop and report them; ask whether to commit, stash or discard them. Never switch branches with a dirty tree, never discard or stash changes on your own.
- **Clean tree** → `git switch main` and `git pull --ff-only`, even when you are already on `main`.
  - If the branch you left has commits that are not in `main` (`git log main..<branch> --oneline` after the pull), mention it: its PR is probably not merged yet.
  - If the fast-forward fails, stop and report; never merge, reset or force.
- Do not create the issue branch now — it is created at the commit gate (step 12), from the latest `main`.

## 1. Read the issue

- If no issue number was provided, run the **`next-issue`** skill, present its recommendation and ask which issue to take. Do nothing else until I pick one.
- Use the **`github-issue`** skill to read issue `<issue>` (body, comments, parent/sub-issues). Requirements and repro details are often refined in the **comments** — read them.
- If the issue has a parent or sub-issues, the scope is **this** issue, not the whole parent.
- If the issue is closed, stop and say so.
- **Dependencies.** Read the issues that block it — the GitHub "blocked by" relations (`gh api graphql` for `blockedBy`) and any dependency the body names ("Depends on #n", a `## Dependencies` / `## Зависимости` section). If a blocker is still open, stop: name it, say whether it has an open PR, and ask how to proceed. Do not start on top of unmerged work unless I explicitly say so. If the body and the relations disagree, mention it.
- Take ownership: if you have write access, assign the issue to yourself (`gh issue edit <issue> --add-assignee @me`).

## 2. Determine the lane

- **Bug lane** — labelled `bug`: reproduce, fix the root cause, guard it with a regression test, post a root-cause comment.
- **Test-authoring lane** — the issue asks only to add or extend tests (Playwright API/UI specs, bUnit tests) for behaviour that **already exists**, typically labelled `testing`. No production code is expected; the tests are the deliverable.
- **Feature lane** — everything else (default): new or changed behaviour, built as a full vertical slice and verified at both the API and UI level.

State the lane and why in one line. If the labels and the issue text disagree (for example a `bug` label on what reads as a new feature), ask before going further.

## 3. Understand the problem

**Bug lane — reproduce:**
- Read the repro steps from the issue and follow the **`debug-issue`** skill.
- If you reproduce inline rather than through `issue-verifier`: start the **API** with the **`run-api`** skill (`http://localhost:5000`) and the **Web** app with `dotnet run --project src/AddressBook.Web` (`http://localhost:5156`) as background tasks you control, and shut them down through the same handles later.
- Walk the repro steps in a real browser with the Playwright MCP server — delegate this to `issue-verifier` in `reproduce` mode (it starts and stops the servers itself) and keep only its result table. Capture what actually happens (console errors, failed network requests) so the plan is grounded in an observed failure, not just the issue text. For an API-only defect, a failing Playwright API spec is an equally good reproduction.
- If the bug cannot be reproduced as described, report what was tried and ask how to proceed.

**Feature lane and Test-authoring lane — acceptance:**
- Use the **`github-issue`** skill to turn the requirement into an explicit, checkable acceptance list (one line per observable behaviour).
- Flag material gaps to me before planning; do not invent them. Make routine UI/naming calls yourself.

**All lanes — locate the code:**
- **API**: command/query handlers and validators in `src/AddressBook.Api/Application/`, the controller in `src/AddressBook.Api/Controllers/`, the repository in `src/AddressBook.Api/DataAccess/`, domain types in `src/AddressBook.Api/Domain/`.
- **Contracts / DTOs**: `src/AddressBook.Contracts/` (commands, queries, `Models/`).
- **Web (Blazor WASM + MudBlazor)**: pages in `src/AddressBook.Web/Pages/`, components in `Components/`, the API layer `AddressBookApiService.cs` / `IAddressBookApiService.cs`, models in `Models/`.
- **Tests**: API E2E in `src/ApiTests` (Playwright), UI E2E in `src/UiTests` (Playwright), component tests in `src/AddressBook.Web.Tests` (bUnit).
- Find the closest existing code that already does something similar and follow its shape — reuse existing abstractions (the CQRS handler/validator pattern, `ApiClient` and the DTO factories in the tests, the shared Blazor components) instead of inventing new ones.
- **Bug lane:** trace the observed failure to its **root cause** across the layers (Web → Contracts → API handler/validator/controller/repository), not just the symptom.

## 4. Draft the plan

Delegate the research to `issue-planner`: hand it the issue number and exact title, the lane, the acceptance list (or the reproduction result), the relevant issue comments and any decisions already made with me. It returns the plan text in the shape below, including a **complexity** of `S`, `M` or `L`. Check the plan against what you know of the issue before saving it; fix obvious misses yourself.

Every plan has: the requirement (or the bug and its root cause), the acceptance list, the affected layers and files/methods, the approach, a **Tests** section, how each item will be verified, and what is **out of scope** (with any follow-up left for a separate issue).

- **Bug lane:** the root cause, the files/methods to change, the regression risk, and the Playwright case(s) that reproduce the bug and will keep it fixed (API specs in `src/ApiTests`, and/or UI E2E specs in `src/UiTests` for a user-facing flow). A behaviour worth fixing is worth a test that keeps it fixed.
- **Feature lane:** the work order **domain → data → contracts → API → Web → tests**, any EF Core migration, and Playwright API cases for every new or changed API behaviour (happy path, boundaries, negatives). If a change genuinely needs no new test (for example a pure UI tweak with no API change), state that explicitly and say why.
- **Test-authoring lane:** the test classes and cases to add, the fixtures/factories they reuse, and confirmation that no production code changes.
- **Feature and Test-authoring lanes — cross-check coverage against the code, not only the issue text.** For every component, page or endpoint the plan touches or tests, list its inputs/fields and code branches (required vs optional fields, success/error/empty/loading states, boundary values) and compare them with the issue's scenarios. Each gap is either added to the plan (and the acceptance list) or named explicitly under out of scope — never silently skipped. Small, obviously in-scope additions are made without asking.
- For a large or multi-layer change you may use the `create-implementation-plan` skill or the `architect` agent to shape it — but keep the final plan in the shape above.

## 5. Save the plan and get it reviewed

- **The required deliverable is a Markdown file in this repository** under `docs/tasks/` (create the folder if needed), named `issue-<issue>-<short-slug>.md`. A plan-mode / harness scratch plan file (e.g. one under `~/.claude/plans/`) is **not** a substitute for it.
- If your environment blocks repository writes while planning, the requirement still stands: write the plan file **the moment repository write access is granted** — immediately after the plan is approved / you exit plan mode, and before any code changes — and say that you have done so.
- Header of the file: issue link, title, lane, complexity.
- Open the file for viewing and ask me to review it. Do not write or edit application code yet.

## 6. Revise on feedback

- Apply feedback to the same plan file and return to step 5. Repeat until the plan is approved; record decisions made during the review in the plan.
- **Milestone:** once approved, hand me the plan-approved `/compact` command.

## 7. Implement

- Delegate to the implementer for the lane (see *Delegation*): `issue-developer` for Bug and Feature, with `model: "opus"` when the complexity is `L`; `playwright-tester` for Playwright specs in the Test-authoring lane. Hand it the plan file path, the acceptance list and the review decisions. It returns a change summary and never commits, pushes or posts.
- Keep changes focused and consistent with `CLAUDE.md` and the instruction files for the file types touched.
- **Bug lane:** fix the root cause, not the symptom. The regression test from the plan is part of the change.
- **Feature lane:** wire the whole vertical slice — domain/repository, CQRS handler + validator, the DTOs in `AddressBook.Contracts`, the controller endpoint, and the MudBlazor UI. A half-wired feature is not done. New or changed API behaviour ships with Playwright API tests in `src/ApiTests`, except the explicitly justified no-API-change case recorded in the plan.
- **Test-authoring lane:** the tests are the deliverable; do not touch production code. If, while writing them, you discover the behaviour is actually broken, stop and tell me — that becomes a separate defect, not part of this issue.
- Pick the test layer and write the tests with the **`write-tests`** skill.
- All Playwright tests follow `playwright-conventions.instructions.md` (route calls through the API client, use the data factories, Create → Verify → Delete isolation) and cover the happy path, boundaries and negatives.
- If the plan turns out to be wrong once you are in the code, say so, update the plan file, and confirm with me before diverging materially from it.
- Update the documentation the change affects **in the same change** — the table in `.claude/rules/update-docs-on-code-change.md` says where (`docs/specs/*.md`, test-suite READMEs, `docs/ai-harness.md`); the `update-docs` skill has the mechanics.

## 8. Build

- Stop any background servers you started before building — a running instance locks its binaries and the build's copy step fails. Never go hunting for a stray `dotnet` process to kill; use the task handle you kept.
- Run these yourself, even if the implementer reported success.
- `dotnet build src/AddressBook.slnx -clp:ErrorsOnly`. Fix build warnings introduced by this change; do not leave the tree noisier than you found it.
- **Review the comments this change adds**, including those a subagent wrote: the `+` lines of `git diff -U0` that contain `//`, `///`, `<!--` or `@*`. Check each against the comment rules in `CLAUDE.md` (English; no change narration, no issue references, no line numbers, no repetition of the code) and fix what fails.
- **Security review** — run `security-reviewer` on the working tree when the change touches API controllers, validators, data access, `Program.cs`, configuration/CORS, or adds or updates a package. Fix CRITICAL and IMPORTANT findings.

## 9. Verify

The test-suite run is yours; the browser walk goes to `issue-verifier`, which follows the **`verify-feature`** skill, starts and stops the servers itself, and returns an evidence table.

- **Bug lane:** run the suite with the **`run-tests`** skill — the new regression case passes and nothing that passed before regresses. Then re-walk the original repro with `issue-verifier` in `verify` mode: the failure is gone and the console/network are clean.
- **Feature lane:** run the Playwright E2E suites with **`run-tests`** (and `dotnet test --project src/AddressBook.Web.Tests` when the Web project changed), then hand **every** acceptance item to `issue-verifier` in `verify` mode (console/network checks, negatives).
- **Test-authoring lane:** start the API with **`run-api`** (when the tests need it) and run the new/changed tests with **`run-tests`** (or `dotnet test` for bUnit); the browser walk does not apply. Every test passes and actually asserts the intended behaviour — a test that passes without asserting anything is not done.
- If anything fails, go back to step 7 (or step 4 if the approach must change), then re-run steps 8–9. Stop the background servers before any rebuild.
- **Milestone:** once everything is green, hand me the build-and-tests `/compact` command.

## 10. Ask me to confirm

- **Bug lane:** the root cause, what was fixed, and how it was verified (repro before/after, tests run, build result).
- **Feature and Test-authoring lanes:** the acceptance list as a table (item → how verified → result). State explicitly anything not covered or left out.
- Ask me whether the result is acceptable. If not, go back to step 7 (or step 4) and iterate until I confirm.
- **Milestone:** once confirmed, hand me the result-confirmed `/compact` command.

## 11. Post the result comment

**Delegate the text, keep the action.** The commit message, the issue comment and the PR text are composed by `skill-runner` from the compact facts you already hold (issue number and exact title, lane, `git diff --stat` with one line per changed file, the acceptance table or root cause, build and test results, and for the PR the posted comment). You post, commit, push and open the PR yourself, each after my go-ahead.

Once confirmed, use the **`github-issue`** skill to post the comment for the lane on issue `<issue>` (Bug: *Root Cause / Resolution / Verification*; Feature and Test-authoring: *Implementation / Acceptance Criteria / Verification*) — English, factual, based only on what was actually done; no screenshots or local paths.

- **Acceptance boxes.** After my go-ahead, tick in the issue body the `- [ ]` items that were verified (`gh issue view <issue> --json body` → replace `- [ ]` with `- [x]` for those items only → `gh issue edit <issue> --body-file <file>`). Leave unverified items unticked and name them. Skip this when the body has no checklist.

## 12. Offer to ship

Do not commit, push, or open a PR without my explicit go-ahead — each is its own gate:

- **Re-sync the base.** `git fetch origin`; if `origin/main` moved since step 0, `git pull --ff-only` (the uncommitted changes travel with you) and re-run steps 8–9 so nothing regressed against the newer base. Otherwise say it is unchanged.
- **Tick the plan.** Update the checklist in `docs/tasks/issue-<issue>-<short-slug>.md` to match the work.
- **Commit.** Ask me to confirm; only then create the commit(s) with the message `skill-runner` composed by the `git-commit` skill, onto branch `<issue>-<short-slug>` (never `main`), including the plan file.
- **Push.** Ask me to confirm; only then push the branch.
- **Open the pull request.** Ask me to confirm; only then use the **`open-pr`** skill to open the PR into `main` with the title and description `skill-runner` composed. Report the PR URL.
- **CI.** Check once with `gh pr checks <pr>`. If checks are still running, say so — the desktop app can watch CI; do not poll in a loop. If a check fails, report the failing job and its first error, and fix it on the same branch after I agree.
- I merge the PR. Do not merge unless asked.

## 13. Recommend the next issue

- Run the **`next-issue`** skill with `-AssumeClosed <issue>` (this issue closes when its PR merges).
- End with a short, ready-to-act message:
  1. Merge PR #<pr> (after CI is green).
  2. Start a new session (`/clear` or a new chat).
  3. Run `/implement-issue <next>` — <title>. Step 0 of that run switches to `main` and pulls the merge.
- Mention up to two alternatives and anything that waits for this PR.

> Note: this workflow needs dev tooling (browser automation via the Playwright MCP server, `gh` for GitHub access). If it is not available in your session, produce the plan, the change and the comment text so they can be applied/posted manually, and say which steps were skipped.
