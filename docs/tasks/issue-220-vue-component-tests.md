# Issue #220 — Vue V8: Component tests of the Vue frontend with Vitest

> **Issue:** [#220](https://github.com/askrinnik/AddressBook2025/issues/220)
> **Lane:** Test-authoring (tests for existing behaviour; test tooling only, no production change)
> **Complexity:** M
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V8

## Requirement

`src/AddressBook.Vue` gets component and unit tests on Vitest + `@vue/test-utils` + jsdom — the counterpart of the bUnit suite `src/AddressBook.Web.Tests`. The API is mocked, so the tests need no browser and no running API. Coverage is collected and the run fails below 85 % lines or 70 % branches, as in `web-tests.yml`.

## Acceptance

- [x] `npm test` in `src/AddressBook.Vue` runs the tests (`vitest run`); `npm run test:coverage` adds coverage with the thresholds
- [x] The tests cover the shell, the Contacts page, the contact form with the Create and Edit pages, the error banner and the API client (problem-details parsing and fallback)
- [x] The run fails below 85 % lines or 70 % branches
- [x] `npm run lint` and `npm run type-check` include the test files
- [x] `src/AddressBook.Vue/README.md` describes how to run the tests

## Affected files (under `src/AddressBook.Vue`)

- `package.json` — dev dependencies `vitest`, `@vitest/coverage-v8`, `@vue/test-utils`, `jsdom`; scripts `test`, `test:watch`, `test:coverage`
- `vitest.config.ts` — merges `vite.config.ts`; `environment: 'jsdom'`; Vuetify inlined for transformation; setup file; coverage over `src/**` without `main.ts` and type-only files; thresholds
- `tests/setup.ts` — jsdom gaps Vuetify needs (`ResizeObserver`, `matchMedia`, `IntersectionObserver`, `visualViewport` where required)
- `tests/helpers/` — `mountWithApp()` that installs Vuetify, a memory-history router with the app routes and the error-banner provider; a `Response` factory for `fetch` stubs
- `tests/**/*.spec.ts` — one file per unit:
  - `api/problemDetails.spec.ts` — parse matrix (case-insensitive keys, extensions, `null`/array/primitive/HTML, wrong-typed members), `getErrors` shapes, `ProblemDetailsError`
  - `api/http.spec.ts` — success pass-through, the 64 KB limit (truncated body does not parse), fallback title from `statusText` or `HTTP <status>`, missing status, abort and network errors pass through
  - `api/contactsApi.spec.ts` — search encoding (blank, whitespace, `a b&c!'()*`), `Location` parsing (missing, trailing slash, non-numeric, overflow), `null` on 404, other errors rethrown, update and delete requests
  - `api/types.spec.ts` — `toDateOnly`, `fromDateOnly`, `toShortDateString`
  - `rules/contactRules.spec.ts` — required, whitespace, 30/31 characters, `todayUtc` and the birthday rule at fixed clocks east and west of UTC
  - `components/contactFormErrors.spec.ts` — field keys, other keys, problem without errors, other errors
  - `composables/useErrorBanner.spec.ts` and `components/ErrorBanner.spec.ts`
  - `layouts/MainLayout.spec.ts` — title, drawer toggle, theme toggle, nav links
  - `components/TablePager.spec.ts` — caption, disabled buttons at the ends, page and size events
  - `pages/ContactsPage.spec.ts` — rows and birthday format, search commit on blur and clear only, sorting and paging, loading and empty states, load error with inline alert and banner and the clearing on success, delete confirm and cancel, 404 on delete, failed delete keeps the banner
  - `components/ContactForm.spec.ts`, `pages/CreateContactPage.spec.ts`, `pages/EditContactPage.spec.ts` — validation blocks the API call, server field errors and summary, busy submit, navigation; Edit load states (progress, not found, problem error, generic error)
  - `router.spec.ts` — titles and the numeric id constraint
- `tsconfig.vitest.json` (referenced from `tsconfig.json`) so `vue-tsc --build` type-checks the tests; ESLint covers `tests/`
- `README.md` — the test section

## Approach

- The API module is mocked with `vi.mock('@/api/contactsApi')` in page tests; the API client itself is tested against a stubbed global `fetch`.
- Time-dependent rules use `vi.useFakeTimers()` / `vi.setSystemTime()`, the counterpart of the fixed `TimeProvider` in bUnit.
- Components are mounted with the real Vuetify so the tests read the rendered markup; asynchronous updates are awaited with `flushPromises()`.
- No production code changes; if a test finds a real defect, it is reported, not silently fixed.

## Verification

- `npm test` and `npm run test:coverage` pass with the thresholds; `npm run lint`, `npm run type-check`, `npm run build` stay clean.

## Out of scope

- The CI workflow that runs these tests (the CI task).

## Decisions

- Coverage thresholds 85 % lines and 70 % branches, as the bUnit suite.
- Tests live in `tests/` next to `src/`, mirroring its folders.
