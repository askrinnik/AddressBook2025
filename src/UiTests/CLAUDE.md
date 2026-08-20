# CLAUDE.md — `src/UiTests`

UI E2E tests for `AddressBook.Web` (Blazor WASM + MudBlazor) on Playwright + TypeScript. Hybrid
E2E: seed/clean data fast over the REST API, assert through the real UI.

The **authoritative conventions** live in
[`.github/instructions/playwright-conventions.instructions.md`](../../.github/instructions/playwright-conventions.instructions.md)
(section **UI E2E tests (`src/UiTests`)**) — read it before writing tests. Claude Code does not
apply `applyTo`, so this file is the pointer. Full design & task list:
[`docs/tasks/ui-tests-framework-plan.md`](../../docs/tasks/ui-tests-framework-plan.md).

Non-negotiables when adding/changing specs here:

- Import `test` / `expect` from `src/fixtures/test-fixtures.js`; declare needed fixtures in the test
  signature — never `new` up page/component objects in a spec.
- Build data only via `ContactFactory`; for search-isolated contacts use
  `ContactFactory.tokenized(token, overrides?)` — do not add per-spec builders.
- Seed/clean over REST via `contactsApi` (auto-cleaned). A **UI-created** contact is untracked —
  look its id up with `contactsApi.getFilteredContacts(token)` and delete it in a `finally`.
- Web-first assertions only (`expect` / `expect.poll`); never `waitForTimeout`. Locator priority
  `getByRole`/`getByLabel` → `getByTestId` (`src/utils/testids.ts`) → CSS last.
- Assert dates against the API's `yyyy-MM-dd` value, not the culture-formatted table cell.
- Russian comments are fine — keep the language of nearby comments.
