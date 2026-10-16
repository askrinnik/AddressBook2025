---
description: "Playwright TypeScript E2E test conventions for AddressBook2025. Use when writing, modifying, or reviewing the API (src/ApiTests) and UI (src/UiTests) end-to-end tests."
applyTo: "src/ApiTests/**, src/UiTests/**"
---
# Playwright E2E Test Conventions

> The sections up to **UI E2E tests** describe the **API** test suite (`src/ApiTests`). The UI
> E2E suite (`src/UiTests`) has a different architecture — see the dedicated section at the end.

## API Client Pattern

- All API interactions go through the `ApiClient` singleton — never use raw `request` calls directly in tests
- Get instance via `ApiClient.getInstance(request)` in each test
- Positive-path methods assert status and return typed payloads
- Negative-path methods (e.g., `createInvalidContact`, `getContactByWrongId`) return raw `APIResponse` for caller-driven assertions

## Assertions

- Use `expect.soft()` for non-critical assertions — allows tests to continue and report multiple failures
- Use strict `expect()` only for assertions that must halt the test on failure

## Test Structure

- Group tests using `test.describe('VERB /api/Endpoint', () => { ... })` per endpoint
- Test names should describe the scenario clearly (e.g., `'create, verify, and delete contact with birthday data'`)

## Test Data & Isolation

- Follow **Create → Verify → Delete** pattern to ensure test isolation and cleanup
- Use factory methods on DTO classes for test data (`Contact.createCorrectContactWithBirthday()`, etc.)
- Never rely on auto-increment IDs from previous test runs — always create and clean up your own data

## DTOs

- Mirror backend models in TypeScript classes under `tests/dtos/`
- Include static factory methods for common test scenarios (valid, invalid, edge cases)
- `ProblemDetails` DTO includes helper methods: `hasErrors()`, `messagesFor(propertyName)`

## Comments

- All code comments must be written in English (see the English-comments rule in `CLAUDE.md`)
- Use comments to explain **why** two similar tests exist (e.g., demonstrating different testing approaches)

→ Full specification: [`src/ApiTests/README.md`](../../src/ApiTests/README.md)

# UI E2E tests (`src/UiTests`)

A separate, hybrid-E2E suite for both frontends, `AddressBook.Web` (Blazor WASM + MudBlazor) and
`AddressBook.Vue` (Vue + Vuetify): data is seeded/cleaned fast over the REST API, assertions run
through the real UI. It does **not** use the API-suite patterns above (`ApiClient` singleton,
`tests/dtos/`, `expect.soft`).

## Frontends

- Two Playwright projects: `blazor` (`baseURL` = `BASE_URL`, default `https://localhost:7187/`,
  runs every spec) and `vue` (`baseURL` = `VUE_BASE_URL`, default `http://localhost:4173/`, runs
  every spec too). Each project sets the typed `frontend`
  option.
- The `app` fixture resolves `frontend` to a `Frontend` (`src/frontends/`): its
  `waitForAppReady(page)` is the only readiness signal, and its factories build the component
  objects. Page objects take the `Frontend` and stay shared.
- `src/components/*.component.ts` are abstract shared bases (testids, roles, aria-labels, flows);
  UI-library markup lives only in `src/components/blazor/*` (MudBlazor) and
  `src/components/vue/*` (Vuetify). Specs and pages never import a `blazor/` or `vue/` object.
- Both projects run every spec, so a new spec needs the member implemented in both `blazor/` and `vue/`.
- `webServer` starts the API, the Blazor app and the Vue production build (`vite preview`) on every
  run, whatever `--project` selects, so `src/AddressBook.Vue` needs `npm ci`.

## Fixtures & structure

- Import `test` / `expect` from `src/fixtures/test-fixtures.js` — **not** from `@playwright/test`
  directly. A spec declares only the fixtures it needs in the test signature
  (`{ contactsPage, contactsApi, data }`) — never `new` up page/component objects in the test.
- Fixture-composed Page Object Model: thin **page objects** (`src/pages/`) and **component objects**
  (`src/components/`) with lazy locators. UI-library markup fragility (table, date-picker, pager,
  confirm dialog) is encapsulated **only** inside its frontend-specific component object, never in
  a spec.
- Group with `test.describe('contacts — <feature>', …)`; name tests by observable behaviour.

## Test data & isolation (shared SQL Server DB)

- Build contacts **only** through `ContactFactory` (`src/data/`). For a search-isolated contact use
  **`ContactFactory.tokenized(token, overrides?)`** — the single builder (`overrides.firstName` /
  `overrides.lastName` set the *prefix* before the token; other overrides apply as-is). Do **not**
  reintroduce per-spec ad-hoc builders.
- Mint a fresh `newTestToken()` per test; the token rides in the names so `search(token)` /
  `getFilteredContacts(token)` isolate exactly this test's rows under parallel workers.
- Seed/clean over REST via the `contactsApi` fixture — contacts **it** creates are auto-deleted in
  teardown. A contact created **through the UI** is *not* tracked: look its id up with
  `contactsApi.getFilteredContacts(token)` and delete it in a `finally` so a mid-test failure never
  leaks data.

## Assertions & locators

- **Web-first only:** auto-waiting `expect(locator)` / `expect.poll`; **never** `waitForTimeout`.
  Let the table component's `waitForLoaded()` settle the table's server-reload ("Loading…").
- Locator priority: `getByRole` / `getByLabel` → `getByTestId` (constants in `src/utils/testids.ts`,
  mirroring the Razor `data-testid`s) → CSS only as a last resort.
- Assert dates against the **API** value (`yyyy-MM-dd`), not the culture-formatted table cell.
- Cover happy path, boundaries, and negatives; keep every test self-contained (create → verify →
  clean up its own data).

→ Full design, directory layout & task list: [`docs/tasks/ui-tests-framework-plan.md`](../../docs/tasks/ui-tests-framework-plan.md)
