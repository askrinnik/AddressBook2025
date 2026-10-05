Take the GitHub issue you were given (its number is referred to below as `<issue>`) end to end: read it, pick the lane, plan, get plan approval, implement, verify, get result approval, record the outcome on the issue, and offer to ship it as a pull request. There are two checkpoints with me — the plan review and the result confirmation — and every outward action (commit, push, PR) needs my explicit go-ahead.

The issue's labels select the **lane** at step 2. Steps marked **Bug lane**, **Feature lane** or **Test-authoring lane** apply only to that lane; unmarked steps apply to all of them.

This workflow orchestrates existing skills instead of re-deriving their mechanics:
- **`github-issue`** — read the issue (body, comments, related issues), establish acceptance criteria, and post the result comment at the end.
- **`run-api`** / **`run-tests`** — start the API and run the Playwright E2E suite.
- **`verify-feature`** — start the API + Web, run Playwright E2E, and walk each acceptance item (or the bug repro) in a real browser.
- **`open-pr`** — commit onto the issue branch (via `git-commit`), include the plan, and open the PR into `main`.

Also follow the `api-architecture`, `blazor.project-specific`, `csharp` and `playwright-conventions` instruction files for the file types you touch.

## 0. Start from an up-to-date `main`

**Skip this step ONLY if I explicitly told you to stay on the current branch** (in the command arguments or in chat — for example a follow-up change to the same issue). Then state in one line that you are staying, pull the current branch if it tracks a remote, note that the base may be stale, and continue to step 1. **Silence is not permission.**

- Check the working tree (`git status --short`) and the current branch (`git branch --show-current`).
- **Uncommitted changes** → stop and report them; ask whether to commit, stash or discard them. Never switch branches with a dirty tree, never discard or stash changes on your own.
- **Clean tree** → `git switch main` and `git pull --ff-only`, even when you are already on `main`.
  - If the branch you left has commits that are not in `main` (`git log main..<branch> --oneline` after the pull), mention it: its PR is probably not merged yet.
  - If the fast-forward fails, stop and report; never merge, reset or force.
- Do not create the issue branch now — it is created at the commit gate (step 12), from the latest `main`.

## 1. Read the issue

- If no issue number was provided, ask for it before doing anything else.
- Use the **`github-issue`** skill to read issue `<issue>` (body, comments, parent/sub-issues). Requirements and repro details are often refined in the **comments** — read them.
- If the issue has a parent or sub-issues, the scope is **this** issue, not the whole parent.
- If the issue is closed, stop and say so.
- Take ownership: if you have write access, assign the issue to yourself (`gh issue edit <issue> --add-assignee @me`).

## 2. Determine the lane

- **Bug lane** — labelled `bug`: reproduce, fix the root cause, guard it with a regression test, post a root-cause comment.
- **Test-authoring lane** — the issue asks only to add or extend tests (Playwright API/UI specs, bUnit tests) for behaviour that **already exists**, typically labelled `testing`. No production code is expected; the tests are the deliverable.
- **Feature lane** — everything else (default): new or changed behaviour, built as a full vertical slice and verified at both the API and UI level.

State the lane and why in one line. If the labels and the issue text disagree (for example a `bug` label on what reads as a new feature), ask before going further.

## 3. Understand the problem

**Bug lane — reproduce:**
- Read the repro steps from the issue.
- Start the **API** with the **`run-api`** skill (`http://localhost:5000`) and the **Web** app with `dotnet run --project src/AddressBook.Web` (profile `https` → `https://localhost:7187`, `http://localhost:5156`). Run each as a background task you control, and shut it down through that same handle later.
- Walk the repro steps in a real browser with the Playwright MCP server. Capture what actually happens (screenshot, console errors, failed network requests) so the plan is grounded in an observed failure, not just the issue text. For an API-only defect, a failing Playwright API spec is an equally good reproduction.
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

Every plan has: the requirement (or the bug and its root cause), the acceptance list, the affected layers and files/methods, the approach, a **Tests** section, how each item will be verified, and what is **out of scope** (with any follow-up left for a separate issue).

- **Bug lane:** the root cause, the files/methods to change, the regression risk, and the Playwright case(s) that reproduce the bug and will keep it fixed (API specs in `src/ApiTests`, and/or UI E2E specs in `src/UiTests` for a user-facing flow). A behaviour worth fixing is worth a test that keeps it fixed.
- **Feature lane:** the work order **domain → data → contracts → API → Web → tests**, any EF Core migration, and Playwright API cases for every new or changed API behaviour (happy path, boundaries, negatives). If a change genuinely needs no new test (for example a pure UI tweak with no API change), state that explicitly and say why.
- **Test-authoring lane:** the test classes and cases to add, the fixtures/factories they reuse, and confirmation that no production code changes.
- **Feature and Test-authoring lanes — cross-check coverage against the code, not only the issue text.** For every component, page or endpoint the plan touches or tests, list its inputs/fields and code branches (required vs optional fields, success/error/empty/loading states, boundary values) and compare them with the issue's scenarios. Each gap is either added to the plan (and the acceptance list) or named explicitly under out of scope — never silently skipped. Small, obviously in-scope additions are made without asking.
- For a large or multi-layer change you may use the `create-implementation-plan` skill or the `architect` agent to shape it — but keep the final plan in the shape above.

## 5. Save the plan and get it reviewed

- **The required deliverable is a Markdown file in this repository** under `docs/tasks/` (create the folder if needed), named `issue-<issue>-<short-slug>.md`. A plan-mode / harness scratch plan file (e.g. one under `~/.claude/plans/`) is **not** a substitute for it.
- If your environment blocks repository writes while planning, the requirement still stands: write the plan file **the moment repository write access is granted** — immediately after the plan is approved / you exit plan mode, and before any code changes — and say that you have done so.
- Header of the file: issue link, title, lane.
- Open the file for viewing and ask me to review it. Do not write or edit application code yet.

## 6. Revise on feedback

- Apply feedback to the same plan file and return to step 5. Repeat until the plan is approved; record decisions made during the review in the plan.

## 7. Implement

- Keep changes focused and consistent with `CLAUDE.md` and the instruction files for the file types touched.
- **Bug lane:** fix the root cause, not the symptom. The regression test from the plan is part of the change.
- **Feature lane:** wire the whole vertical slice — domain/repository, CQRS handler + validator, the DTOs in `AddressBook.Contracts`, the controller endpoint, and the MudBlazor UI. A half-wired feature is not done. New or changed API behaviour ships with Playwright API tests in `src/ApiTests`, except the explicitly justified no-API-change case recorded in the plan.
- **Test-authoring lane:** the tests are the deliverable; do not touch production code. If, while writing them, you discover the behaviour is actually broken, stop and tell me — that becomes a separate defect, not part of this issue.
- All Playwright tests follow `playwright-conventions.instructions.md` (route calls through the API client, use the data factories, Create → Verify → Delete isolation) and cover the happy path, boundaries and negatives.
- If the plan turns out to be wrong once you are in the code, say so, update the plan file, and confirm with me before diverging materially from it.

## 8. Build

- Stop any background servers you started before building — a running instance locks its binaries and the build's copy step fails. Never go hunting for a stray `dotnet` process to kill; use the task handle you kept.
- `dotnet build src/AddressBook.slnx`. Fix build warnings introduced by this change; do not leave the tree noisier than you found it.
- Check that every comment the change adds is in English (`CLAUDE.md` rule).

## 9. Verify

- **Bug lane:** run the suite with the **`run-tests`** skill — the new regression case passes and nothing that passed before regresses. Then restart the app as in step 3 and re-walk the original repro (for a user-facing fix, with the **`verify-feature`** skill): the failure is gone and the console/network are clean.
- **Feature lane:** use the **`verify-feature`** skill — start the API + Web, run the Playwright E2E suite, and walk **every** acceptance item in the browser (screenshots, console/network checks, negatives).
- **Test-authoring lane:** start the API with **`run-api`** (when the tests need it) and run the new/changed tests with **`run-tests`** (or `dotnet test` for bUnit); the browser walk does not apply. Every test passes and actually asserts the intended behaviour — a test that passes without asserting anything is not done.
- If anything fails, go back to step 7 (or step 4 if the approach must change), then re-run steps 8–9. Stop the background servers before any rebuild.

## 10. Ask me to confirm

- **Bug lane:** the root cause, what was fixed, and how it was verified (repro before/after, tests run, build result).
- **Feature and Test-authoring lanes:** the acceptance list as a table (item → how verified → result). State explicitly anything not covered or left out.
- Ask me whether the result is acceptable. If not, go back to step 7 (or step 4) and iterate until I confirm.

## 11. Post the result comment

Once confirmed, use the **`github-issue`** skill to post the comment for the lane on issue `<issue>` (Bug: *Root Cause / Resolution / Verification*; Feature and Test-authoring: *Implementation / Acceptance Criteria / Verification*) — English, factual, based only on what was actually done; no screenshots or local paths.

## 12. Offer to ship

Do not commit, push, or open a PR without my explicit go-ahead — each is its own gate:

- **Re-sync the base.** `git fetch origin`; if `origin/main` moved since step 0, `git pull --ff-only` (the uncommitted changes travel with you) and re-run steps 8–9 so nothing regressed against the newer base. Otherwise say it is unchanged.
- **Tick the plan.** Update the checklist in `docs/tasks/issue-<issue>-<short-slug>.md` to match the work.
- **Commit.** Ask me to confirm; only then create the commit(s) via the `git-commit` skill, onto branch `<issue>-<short-slug>` (never `main`), including the plan file.
- **Push.** Ask me to confirm; only then push the branch.
- **Open the pull request.** Ask me to confirm; only then use the **`open-pr`** skill to open the PR into `main`.

> Note: this workflow needs dev tooling (browser automation via the Playwright MCP server, `gh` for GitHub access). If it is not available in your session, produce the plan, the change and the comment text so they can be applied/posted manually, and say which steps were skipped.
