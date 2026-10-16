# CLAUDE.md — `src/UiTests`

UI E2E tests for both frontends — `AddressBook.Web` (Blazor WASM + MudBlazor, project `blazor`,
`BASE_URL`) and `AddressBook.Vue` (Vue + Vuetify, project `vue`, `VUE_BASE_URL`) — on Playwright +
TypeScript. Hybrid E2E: seed/clean data fast over the REST API, assert through the real UI. Every
run also builds and serves the Vue app, so run `npm ci` in `src/AddressBook.Vue` once.

The **authoritative conventions** live in
[`.github/instructions/playwright-conventions.instructions.md`](../../.github/instructions/playwright-conventions.instructions.md)
(section **UI E2E tests (`src/UiTests`)**) — read it before writing tests. Claude Code does not
apply `applyTo`, so this file is the pointer. Full design & task list:
[`docs/tasks/ui-tests-framework-plan.md`](../../docs/tasks/ui-tests-framework-plan.md).

Non-negotiables when adding/changing specs here:

- Import `test` / `expect` from `src/fixtures/test-fixtures.js`; declare needed fixtures in the test
  signature — never `new` up page/component objects in a spec.
- Specs import only the shared page and component objects — never `src/components/blazor/*` or
  `src/components/vue/*`; the `app` fixture supplies the frontend's implementation. A spec joins
  the `vue` project through the `vueSpecs` list in `playwright.config.ts`.
- Build data only via `ContactFactory`; for search-isolated contacts use
  `ContactFactory.tokenized(token, overrides?)` — do not add per-spec builders.
- Seed/clean over REST via `contactsApi` (auto-cleaned). A **UI-created** contact is untracked —
  look its id up with `contactsApi.getFilteredContacts(token)` and delete it in a `finally`.
- Web-first assertions only (`expect` / `expect.poll`); never `waitForTimeout`. Locator priority
  `getByRole`/`getByLabel` → `getByTestId` (`src/utils/testids.ts`) → CSS last.
- Assert dates against the API's `yyyy-MM-dd` value, not the culture-formatted table cell.
- Comments in source code must be in English.
