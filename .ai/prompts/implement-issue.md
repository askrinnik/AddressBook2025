Implement the GitHub issue you were given (its number is referred to below as `<issue>`) end to end: understand the requirement, plan, get plan approval, implement the full vertical slice, verify against the acceptance criteria, get acceptance approval, record an implementation comment on the issue, and offer to ship it as a pull request.

This workflow orchestrates existing skills instead of re-deriving their mechanics:
- **`github-issue`** — read the issue (body, comments, related issues), determine type, establish acceptance criteria, and post the implementation comment at the end.
- **`verify-feature`** — start the API + Web, run Playwright E2E, and walk each acceptance criterion in the browser (it invokes `run-api` and `run-tests`).
- **`open-pr`** — commit onto the issue branch (via `git-commit`), include the plan, and open the PR into `main`.

Also follow the `api-architecture`, `blazor.project-specific`, `aspnet-rest-apis`, `csharp` and `playwright-conventions` instruction files for the file types you touch.

## Work modes

Decide the mode from the issue before planning:

- **Feature mode** (default) — the issue asks for new or changed behaviour. Build the full vertical slice and verify at both the API and UI level.
- **Test-authoring mode** — the issue asks only to add or extend Playwright API/UI tests for behaviour that **already exists** (for example the `testing`-labelled framework tasks). No production code is expected. In this mode the tests themselves are the deliverable: skip the vertical-slice wiring and the browser UI walk. If, while writing the tests, you discover the API is actually broken, stop and tell me — that becomes a separate defect, not part of this task.

The steps below apply to both modes; where they differ, the mode is called out.

## 1. Read the issue and establish acceptance criteria

- Use the **`github-issue`** skill to read issue `<issue>` (body, comments, parent/sub-issues). Requirements are often refined in the **comments** rather than the body — read them.
- If the issue has a parent or sub-issues, fetch them too so the scope boundary is clear: implement **this** issue, not the whole parent.
- Confirm it is feature-type by its labels (if labelled `bug`, stop and report that `/fix-bug-issue` should be used instead — that is the defect-fix flow, not this one).
- Turn the requirement into an explicit, checkable acceptance list (one line per observable behaviour). Flag any material gaps to me before planning; do not invent them. Make routine UI/naming calls yourself.
- Take ownership before doing anything else: if you have write access, assign the issue to yourself (`gh issue edit <issue> --add-assignee @me`).

## 2. Understand the current code

- Locate the code the change touches:
  - **API**: command/query handlers and validators in `src/AddressBook.Api/Application/`, the controller in `src/AddressBook.Api/Controllers/`, the repository in `src/AddressBook.Api/DataAccess/`, domain types in `src/AddressBook.Api/Domain/`.
  - **Contracts / DTOs**: `src/AddressBook.Contracts/` (commands, queries, `Models/`).
  - **Web (Blazor WASM + MudBlazor)**: pages in `src/AddressBook.Web/Pages/`, components in `Components/`, the API layer `AddressBookApiService.cs` / `IAddressBookApiService.cs`, models in `Models/`.
  - **Tests**: API E2E tests live in `src/ApiTests` (Playwright); UI E2E tests live in `src/UiTests` (Playwright), when that suite exists.
- Find the closest existing feature that already does something similar and follow its shape — reuse existing abstractions (the CQRS handler/validator pattern, `ApiClient` and the DTO factories in the tests, the shared Blazor components) instead of inventing new ones.
- Follow `api-architecture.instructions.md` for anything under `src/AddressBook.Api/**` and `blazor.project-specific.instructions.md` for anything under the Web project.

## 3. Draft an implementation plan

- Draft a concise plan covering: the requirement, the acceptance list from step 1, the affected layers and files/methods, the approach (**domain → data → contracts → API → Web → tests**, in that order), any EF Core migration needed, and how each acceptance item will be verified.
- The plan must include a **Tests** section listing the Playwright E2E cases to add or update for every new or changed API behaviour (happy path, boundaries, and negatives). If a change genuinely needs no new test (for example a pure UI tweak with no API change), state that explicitly and say why.
- Call out anything deliberately **out of scope** and any follow-up left for a separate issue.
- For a large or multi-layer change you may use the `create-implementation-plan` skill or the `Architect` agent to shape it — but keep the final plan in the format below.

## 4. Save the plan and get it reviewed

- **The required deliverable is a Markdown file in this repository** under `docs/tasks/` (create the folder if needed), named `issue-<issue>-<short-slug>.md`. This repo file is mandatory: a plan-mode / harness scratch plan file (e.g. one under `~/.claude/plans/`) is **not** a substitute for it and does not satisfy this step.
- If your environment blocks repository writes while planning (e.g. an agent "plan mode" that only permits editing its own plan file), the requirement still stands: write the plan to `docs/tasks/issue-<issue>-<short-slug>.md` **the moment repository write access is granted** — immediately after the plan is approved / you exit plan mode, and before making any code changes — and state explicitly that you have done so.
- Open the file for viewing and ask me to review it before any implementation starts. Do not write or edit application code yet.

## 5. Revise on feedback

- If I give feedback on the plan, update the same plan file and return to step 4. Repeat until the plan is approved.

## 6. Implement

- Once the plan is approved, implement it. Keep changes focused and consistent with `CLAUDE.md` and the relevant instruction files for the file types touched.
- **Feature mode:** wire the whole vertical slice: domain/repository, CQRS handler + validator, the DTOs in `AddressBook.Contracts`, the controller endpoint, and the MudBlazor UI — a half-wired feature is not done. New or changed API behaviour must ship with Playwright API tests in `src/ApiTests`; skip tests only for the explicitly-justified no-API-change case recorded in the plan.
- **Test-authoring mode:** the Playwright tests are the deliverable — add or extend the API specs in `src/ApiTests` (or the UI E2E specs in `src/UiTests`) for the existing behaviour and do not touch production code.
- All Playwright tests, in either mode, follow `playwright-conventions.instructions.md` (route calls through the API client, use the data factories, Create → Verify → Delete isolation) and cover the happy path, boundaries, and the negatives.
- If the plan turns out to be wrong once you are in the code, say so, update the plan file, and confirm with me before diverging materially from it.

## 7. Build

- Build the solution: `dotnet build src/AddressBook.sln`.
- Fix build warnings introduced by this change; do not leave the tree noisier than you found it.

## 8. Verify against the acceptance criteria

- **Feature mode:** use the **`verify-feature`** skill — start the API + Web, run the Playwright E2E suite, and walk **every** acceptance item from step 1 in the browser (screenshots, console/network checks, negatives).
- **Test-authoring mode:** start the API with the **`run-api`** skill and run the new/changed specs with the **`run-tests`** skill; the browser UI walk does not apply. Every test must pass and must actually exercise the intended behaviour (a test that passes without asserting anything is not done).
- Keep iterating until every acceptance item and every test passes, then re-verify the whole list. Stop the background servers before any rebuild.

## 9. Ask me to confirm

- Present the acceptance list as a checked table (item → how it was verified → result) and report anything not covered or left out, explicitly.
- Ask me to confirm the implementation is acceptable.

## 10. Handle rejection

- If I don't confirm, go back to step 6 (or step 3 if the approach itself needs to change) and keep iterating until I confirm.

## 11. Post the implementation comment

Once confirmed, use the **`github-issue`** skill to add the implementation comment to issue `<issue>` (`## Implementation` with a Changes list + Key note, `## Acceptance Criteria` table, `## Verification`; no screenshots or local paths).

## 12. Offer to ship

Do not commit, push, or open a PR without my explicit go-ahead — each is its own gate:

- **Commit.** Ask me to confirm; only then create the commit(s) via the `git-commit` skill, onto branch `<issue>-<short-slug>` (never `main`), including the `docs/tasks/issue-<issue>-<short-slug>.md` plan.
- **Push.** Ask me to confirm; only then push the branch.
- **Open the pull request.** Ask me to confirm; only then use the **`open-pr`** skill to open the PR into `main`.

> Note: implementation and verification require dev tooling (browser automation via the Playwright MCP server, `gh` for GitHub access) to be available in your session. If none is configured, produce the plan and the implementation-comment text so they can be applied/posted manually.
