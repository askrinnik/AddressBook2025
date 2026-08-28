Fix the GitHub issue you were given (its number is referred to below as `<issue>`) end to end: reproduce, plan, get plan approval, implement the fix, verify, get fix approval, record a resolution comment on the issue, and offer to ship it as a pull request.

This workflow orchestrates existing skills instead of re-deriving their mechanics:
- **`github-issue`** — read the issue (body, comments, related issues) and post the resolution comment at the end.
- **`run-api`** / **`run-tests`** — start the API and run the Playwright E2E suite (regression guard).
- **`verify-feature`** — start the API + Web and re-walk the repro in a real browser.
- **`open-pr`** — commit onto the issue branch (via `git-commit`), include the plan, and open the PR into `main`.

Also follow the `api-architecture`, `blazor.project-specific`, `aspnet-rest-apis`, `csharp` and `playwright-conventions` instruction files for the file types you touch.

## 1. Read the issue

- Use the **`github-issue`** skill to read issue `<issue>` (body, comments, related issues). Repro details and clarifications are often in the **comments** — read them.
- If no issue number was provided, ask for it before doing anything else.
- Take ownership: if you have write access, assign the issue to yourself (`gh issue edit <issue> --add-assignee @me`).

## 2. Confirm it is a bug

- Confirm the issue is a defect by its labels (expected: `bug`). If it is a feature/task-type issue, stop immediately: report the actual labels and title, say `/implement-issue` should be used instead, and do not proceed to reproduction, planning, or any code changes.

## 3. Reproduce the bug

- Read the repro steps / description from the issue.
- Start the app and use browser automation (the Playwright MCP server) to walk through the repro steps in a real browser:
  - Start the **API** with the **`run-api`** skill (`dotnet run --project src/AddressBook.Api`, listening on `http://localhost:5000`).
  - Start the **Web** app with `dotnet run --project src/AddressBook.Web` (profile `https` → `https://localhost:7187`, `http://localhost:5156`). Run each as a background task you control, and shut it down through that same handle later.
- Capture what actually happens (screenshot, console errors, failed network requests) so the plan is grounded in an observed failure, not just the issue text.
- If the bug cannot be reproduced as described, report what was tried and ask how to proceed before continuing.

## 4. Draft a fix plan

- Based on the reproduced failure, identify the **root cause** in the code (not just the symptom). Trace it across the layers where relevant: Web (`src/AddressBook.Web`), Contracts (`src/AddressBook.Contracts`), API handlers/validators/controller/repository (`src/AddressBook.Api`).
- Draft a concise plan: root cause, files/methods to change, the approach, the regression risk, and how the fix will be verified.
- The plan must include a **Tests** section: the Playwright case(s) that reproduce the bug and will keep it fixed (API specs in `src/ApiTests`, and/or UI E2E specs in `src/UiTests` for a user-facing flow). A behaviour worth fixing is worth a test that keeps it fixed.

## 5. Save the plan and get it reviewed

- **The required deliverable is a Markdown file in this repository** under `docs/tasks/` (create the folder if needed), named `issue-<issue>-<short-slug>.md`. This repo file is mandatory: a plan-mode / harness scratch plan file (e.g. one under `~/.claude/plans/`) is **not** a substitute for it and does not satisfy this step.
- If your environment blocks repository writes while planning, the requirement still stands: write the plan to `docs/tasks/issue-<issue>-<short-slug>.md` **the moment repository write access is granted** — immediately after the plan is approved / you exit plan mode, and before making any code changes — and state explicitly that you have done so.
- Open the file for viewing and ask me to review it before any implementation starts. Do not write or edit application code yet.

## 6. Revise on feedback

- If I give feedback on the plan, update the same plan file and return to step 5. Repeat until the plan is approved.

## 7. Implement the fix

- Once the plan is approved, implement it. Keep changes focused and consistent with `CLAUDE.md` and the relevant instruction files for the file types touched. Fix the root cause, not the symptom.

## 8. Verify the fix works

- Stop the background servers started in step 3 before building — a running instance locks its binaries and the build's copy step will fail. Never go hunting for a stray `dotnet` process to kill; use the task handle you kept.
- Build the solution: `dotnet build src/AddressBook.slnx`.
- **Guard against regressions — this is mandatory, not optional.** Add or extend the Playwright case(s) from the plan, then run the suite with the **`run-tests`** skill (API specs in `src/ApiTests`; UI specs in `src/UiTests` when present). The whole suite must be green: the new case passes and no spec that passed before regresses.
- Restart the app the same way as step 3 and re-run the original repro steps against the fixed app; confirm the failure is gone and the console/network are clean. For a user-facing fix, use the **`verify-feature`** skill for the browser walk.
- If the bug still reproduces or any existing test regresses, keep iterating on the fix (adjust the plan if the root-cause understanding changes) until it is resolved, then re-verify the repro and re-run the suite.

## 9. Ask me to confirm

- Summarize what was fixed and how it was verified (repro before/after, tests run, build result), and ask me to confirm the fix is acceptable.

## 10. Handle rejection

- If I don't confirm, go back to step 7 (or step 4 if the approach itself needs to change) and keep iterating until I confirm.

## 11. Post the resolution comment

Once confirmed, use the **`github-issue`** skill to add the resolution comment to issue `<issue>` — `## Root Cause`, `## Resolution` (a Changes list naming each modified file in backticks with a one-line description), `## Verification` — English, factual, based only on what was actually done; no screenshots or local paths.

## 12. Offer to ship

Do not commit, push, or open a PR without my explicit go-ahead — each is its own gate:

- **Commit.** Ask me to confirm; only then create the commit(s) via the `git-commit` skill, onto branch `<issue>-<short-slug>` (never `main`), including the `docs/tasks/issue-<issue>-<short-slug>.md` plan.
- **Push.** Ask me to confirm; only then push the branch.
- **Open the pull request.** Ask me to confirm; only then use the **`open-pr`** skill to open the PR into `main`.

> Note: reproduction and fixing require dev tooling (browser automation via the Playwright MCP server, `gh` for GitHub access) to be available in your session. If none is configured, produce the plan and resolution-comment text so they can be applied/posted manually.
