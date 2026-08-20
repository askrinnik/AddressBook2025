# Issue #100 (U9) — `fixtures/test-fixtures.ts` + `utils/{assertions,blazor}.ts`

> Plan for the `/implement-issue U9` workflow. **Review before any code is written.**

## Requirement

Phase 1, framework infrastructure for the `src/UiTests` suite:

- `fixtures/test-fixtures.ts` — a `test.extend` that injects the U8 page objects and U7
  component objects, the U5 `contactsApi` (hybrid REST seed/cleanup), and the U6 `data`
  factory, and **auto-cleans** every contact created through the fixture in teardown.
- `utils/assertions.ts` — domain assertions (table row present/absent, empty state, form
  field error / summary error).
- `utils/blazor.ts` — Blazor WASM readiness helper.

This is **test-authoring / framework mode**: the deliverable is test-project code only. There
is **no production or API change** (all `data-testid`s were added in U4). No EF Core migration.

### Scope boundary

Implement **U9 only** — the fixtures and utils. The consuming specs (U10–U17) are separate
issues and are **not** written here. The one existing spec
(`tests/contacts/edit-not-found.spec.ts`) deliberately news up its objects directly and is
left untouched.

## Acceptance criteria

| # | Criterion |
|---|---|
| 1 | `src/UiTests/src/fixtures/test-fixtures.ts` exists, extends Playwright `test`, and re-exports `expect`. |
| 2 | It injects page-object fixtures: `homePage`, `contactsPage`, `createContactPage`, `editContactPage`, and an `appShell` component fixture. Each is a fresh instance per test. |
| 3 | A `contactsApi` fixture provides a `ContactsApi` bound to `env.apiURL` via its own `APIRequestContext` (`ignoreHTTPSErrors: true`), disposed in teardown. |
| 4 | A `data` fixture provides the `ContactFactory`. |
| 5 | Auto-cleanup: every contact created through the injected `contactsApi` is deleted in teardown, tolerating 404; a delete failure does not abort cleanup of the rest. |
| 6 | `src/UiTests/src/utils/blazor.ts` exports `waitForBlazorReady(page)`, and `base.page.ts` delegates its readiness wait to it (removing the inline "stand-in"). |
| 7 | `src/UiTests/src/utils/assertions.ts` exports web-first domain assertions: contact row present (by id, with expected names), row absent, empty state, field error, no field error, summary error. |
| 8 | `npm run lint` is clean, TypeScript compiles, and the whole `npm test` run (existing spec + new self-tests) is green. |

## Affected files

**New (test-framework code):**
- `src/UiTests/src/utils/blazor.ts` — `waitForBlazorReady(page)`.
- `src/UiTests/src/utils/assertions.ts` — domain assertions.
- `src/UiTests/src/fixtures/test-fixtures.ts` — `test.extend` + auto-cleanup, re-export `expect`.

**Edited (test-framework code):**
- `src/UiTests/src/pages/base.page.ts` — `waitUntilReady()` delegates to `waitForBlazorReady`.
- `src/UiTests/src/components/contact-form.component.ts` — (a) export the `NamedField` type so
  `assertions.ts` can type the field parameter; (b) fix the `validationSummary` / `summaryErrors`
  selector (see finding below) so `expectSummaryError` can read the summary.

**New self-test specs (the verification deliverable — mirrors `src/ApiTests/tests/{fixtures,utils}`):**
- `src/UiTests/tests/fixtures/test-fixtures.spec.ts`
- `src/UiTests/tests/utils/assertions.spec.ts`

## Approach

Framework task, so the API-first ordering collapses to **infra → self-tests**. Mirror the
established `src/ApiTests` shapes (`src/fixtures/api.fixtures.ts`, `src/utils/assertions.ts`,
`tests/fixtures/…`, `tests/utils/…`).

1. **`utils/blazor.ts`** — `waitForBlazorReady(page)` waits for the app-bar title
   ("Contact Book") to be visible: it renders only after Blazor WASM boots and `MainLayout`
   renders, and it also holds on the edit not-found branch. Leaf util, no component imports.
2. **`base.page.ts`** — replace the inline `appBarTitle.waitFor(...)` in `waitUntilReady()`
   with `waitForBlazorReady(this.page)`; drop the "stand-in until U9" note.
3. **`utils/assertions.ts`** — web-first (auto-waiting) domain assertions built on the public
   component/page surface:
   - `expectContactRow(table, id, { firstName, lastName })` → row visible + contains names.
   - `expectNoContactRow(table, id)` → `toHaveCount(0)`.
   - `expectNoRecords(table)` → empty-state visible.
   - `expectFieldError(form, field, message?)` / `expectNoFieldError(form, field)` →
     `expect.poll` over `form.errorFor(field)` (auto-retries the async validation).
   - `expectSummaryError(form, message)` → `expect.poll` over `form.summaryErrors()`.
4. **`contact-form.component.ts`** — export the existing `NamedField` union for the assertions'
   `field` parameter.
5. **`fixtures/test-fixtures.ts`** — `base.extend<UiFixtures>` with:
   - zero-dep `data` → `ContactFactory`; page/`appShell` fixtures → `new …(page)`.
   - `contactsApi` → create an `APIRequestContext` at `env.apiURL`; wrap `ContactsApi` in a
     tracking subclass that registers each created id; `use`; teardown deletes tracked ids
     (best-effort, tolerating 404, continuing past failures) then disposes the context —
     the same pattern as `TrackedContactsClient` in `api.fixtures.ts`.
   - re-export `expect`.

## Tests

Self-test specs verify the infrastructure (there are no U10+ specs yet to consume it). This
matches how `src/ApiTests` verifies its own fixtures/utils.

- **`tests/fixtures/test-fixtures.spec.ts`**
  - injection smoke: `data` is `ContactFactory`; page/`appShell` fixtures are the right types.
  - `waitForBlazorReady`: after `homePage.goto()` the shell is ready (title visible).
  - auto-cleanup (`describe.serial`): test A seeds **two** contacts via `contactsApi` **without**
    manual delete and records their ids; test B confirms both are 404 via a fresh API context →
    proves teardown cleaned every tracked id up.
  - teardown tolerates an id already deleted inside the test (delete it in-test; teardown's
    second delete must not throw). The fixture also swallows/logs a non-404 delete failure and
    continues (structural — the cleanup loop is wrapped per-id), but that path is not injected
    by a self-test because the fixture deliberately does not expose its id tracker.
- **`tests/utils/assertions.spec.ts`** (drives the real UI via the fixtures)
  - seed a contact, `contactsPage.goto()`, search by its first name → `expectContactRow`.
  - search a random token with no matches → `expectNoRecords`; and `expectNoContactRow` for
    a seeded id not on the filtered page.
  - fresh `createContactPage` form → `expectNoFieldError`.
  - submit empty → `expectFieldError(form, 'firstName', /required/i)` (client `[Required]`,
    inline helper text).
  - `expectSummaryError`: abort the create `POST /api/Contacts` via `page.route` so the WASM
    client throws a non-ProblemDetails error → the page's `AddGeneralError` path writes a
    model-level message into `<ValidationSummary>` → assert it.

  **UI-behaviour finding (verification):** the create form's `<ValidationSummary Model="_model">`
  is model-scoped, so it renders **only model-level "general" messages** (the `AddGeneralError`
  path). **All field errors** — client `[Required]` *and* server 400 (`AddCustomError`, keyed by
  field) — render **inline** as MudBlazor helper text, not in the summary. Hence `expectFieldError`
  (inline) covers the field-error cases and `expectSummaryError` is exercised via a forced
  general error, as above.

  **Component fix (found via the summary self-test):** the U7 `contact-form` component read the
  summary as `.validation-errors .validation-message`, but the page renders
  `<ValidationSummary class="mt-4">` and Blazor splats that `class` over the built-in
  `validation-errors` class on the `<ul>` — so the wrapper class is lost and the old selector
  matched nothing. Fixed to match the `<li class="validation-message">` items directly (field
  errors use `.mud-input-helper-text.mud-input-error`, so there is no collision).

## Verification

Per test-authoring mode: start the API (`run-api`) + Web, run the specs (`run-tests`); no
browser acceptance walk. `npm run lint` clean; `npm test` green (existing spec + new
self-tests). Servers stopped before any rebuild.

## Out of scope / follow-ups

- The U10–U17 feature specs (they consume these fixtures).
- The optional a11y helpers (U18) and README/CI (U19–U21).
- No production, API, contracts, or DB changes.
