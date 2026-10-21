# Issue #214 — Vue V2: Run the UI E2E suite src/UiTests against both frontends

> **Issue:** [#214](https://github.com/askrinnik/AddressBook/issues/214)
> **Lane:** Feature (test infrastructure)
> **Complexity:** L
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V2

## Requirement

`src/UiTests` runs as two Playwright projects, `blazor` and `vue`, each with its own `baseURL` and a typed `frontend` option. Specs import only shared page and component objects; a fixture supplies the frontend-specific implementation — MudBlazor markup in `src/components/blazor/*`, Vuetify implementations in `src/components/vue/*` (stubs until the page tasks fill them). Readiness is a per-frontend `waitForAppReady`. `webServer` also builds and serves the Vue app. `--project=blazor` stays green with unchanged assertions; `--project=vue` passes an app-boot smoke spec.

## Acceptance

- [x] Projects `blazor` and `vue` exist, each with its own `baseURL` (`BASE_URL`, default `https://localhost:7187/`; `VUE_BASE_URL`, default `http://localhost:4173/`)
- [x] Frontend-specific component objects are chosen by fixture; no spec imports a `blazor/` or `vue/` object
- [x] A per-frontend `waitForAppReady` replaces `src/utils/blazor.ts` (removed)
- [x] `webServer` starts the API, the Blazor app and the Vue app
- [x] `vue` runs a restricted `testMatch` list that later tasks extend
- [x] No spec changes what it asserts; `npx playwright test --project=blazor` is green
- [x] `npx playwright test --project=vue` exits 0, running `tests/smoke/app-boot.spec.ts` (an empty project exits 1 with "No tests found")
- [x] `ui-tests.yml` runs `npm ci` in `src/AddressBook.Vue`, because every run now also starts the Vue server
- [x] `npm run lint` and a new `npm run type-check` (`tsc --noEmit`) pass in `src/UiTests`
- [x] README, `CLAUDE.md`, the UI section of the Playwright conventions and `Architecture.md` describe both projects, `VUE_BASE_URL` and the `npm ci` step of the Vue project

## Affected files (under `src/UiTests` unless stated)

- `playwright.config.ts` — `defineConfig<UiOptions>`; projects `blazor` and `vue` replace `chromium`; `baseURL` per project; a third `webServer` entry for Vue
- `src/config/env.ts`, `.env.example` — `VUE_BASE_URL` with the trailing-slash check
- New `src/frontends/frontend.ts` (`FrontendName`, `Frontend` interface: `name`, `waitForAppReady(page)`, factories `appShell`, `contactsTable`, `confirmDialog`, `contactForm`), `src/frontends/blazor.ts`, `src/frontends/vue.ts`, `src/frontends/index.ts`
- Deleted `src/utils/blazor.ts` (its body moves into `src/frontends/blazor.ts`)
- `src/components/*.component.ts` become abstract shared bases; new `src/components/blazor/*` (the `.mud-*` code, moved verbatim) and `src/components/vue/*` stubs with `not-implemented.ts`
- `src/pages/*.page.ts` — build their components through the frontend
- `src/fixtures/test-fixtures.ts` — option `frontend: ['blazor', { option: true }]`, fixture `app: Frontend`
- `tests/fixtures/test-fixtures.spec.ts` — readiness through `app`; same assertions
- New `tests/smoke/app-boot.spec.ts`
- `package.json` — `type-check` script; `test:remote` runs `--project=blazor`
- `README.md` (Russian, keeps its language), `CLAUDE.md`
- `.github/instructions/playwright-conventions.instructions.md` (UI section)
- `.github/workflows/ui-tests.yml` — `npm ci` in `src/AddressBook.Vue` before the test step
- `docs/specs/Architecture.md` — UI suite covers both frontends; CI paragraph
- `docs/tasks/vue-frontend-plan.md` — section 4 names the preview build

## Approach

1. **Option fixture, not the project name.** Each project sets `use: { ...devices['Desktop Chrome'], baseURL, frontend }`; the `app` fixture resolves `frontends[frontend]`. Fixtures stay lazy, so a Vue test that never touches a stubbed member never throws.
2. **Minimal split by today's code.** No spec uses `.mud-*` directly; only the component objects and the readiness helper carry markup knowledge, and the pages stay shared.

   | Object | Shared base | Per frontend |
   |---|---|---|
   | AppShell | toggles, nav links, `isDarkMode`, click flows | `appBarTitle`, `drawer`, `isDrawerOpen` |
   | ContactsTable | testid locators, `noRecords`, `bodyRows`, `firstNameColumn`, pager buttons by aria-label, `waitForLoaded`, `pageRangeText`, `totalRows` | `sortLabel`, `setRowsPerPage`, `paginationInfo` |
   | ConfirmDialog | dialog role, message, confirm testid, Cancel, waits | `title` |
   | ContactForm | fields, submit, cancel, fill flows, `summaryErrors` | `validationSummary`, `errorFor` |
   | DatePicker | `input`, `value()`, ISO parsing | `open`, `selectDate`, `enabledDays`, `disabledDays` |

3. **Vue stubs** throw `Error('<Class>.<member> is not implemented for the vue frontend')` from one helper; the page tasks replace them and extend `testMatch`.
4. **Vue `testMatch`** is a named list (`vueSpecs`) starting with the app-boot spec; `blazor` keeps the default match.
5. **webServer for Vue: production build plus `vite preview`** — `npm run build && npm run preview` in `../AddressBook.Vue`, url `env.vueBaseURL`, `reuseExistingServer: !isCI`. The dev server answers 504 "Outdated Optimize Dep" on the first load while it re-optimises Vuetify's lazily imported components, which would make tests flaky. The build falls back to `http://localhost:5000/api/`; the API allows any origin in development; `vite preview` serves the SPA fallback.
6. **Every run starts all three servers** (Playwright starts all `webServer` entries whatever `--project` is), hence the `npm ci` step in CI. CI's `npm test` runs both projects. Separate CI steps, caching and pinning are V9.

## Tests

- New `tests/smoke/app-boot.spec.ts` (both projects): boots on `/`; boots on the deep link `/contacts` (guards the history-mode fallback).
- `test-fixtures.spec.ts`: readiness through `app`; the page-object checks still hold because the Blazor classes extend the shared bases.
- All other specs are unchanged and are the regression net for the move.

## Verification

- Baseline before the change: `npx playwright test --list` — 48 tests in 12 files.
- After: `--project=blazor --list` shows 50 (48 + 2 app-boot); `--project=blazor` passes; `--project=vue` passes 2; `npm run lint` and `npm run type-check` pass.
- No spec imports `components/blazor` or `components/vue`; no `.mud-` outside `src/components/blazor` and `src/frontends/blazor.ts`.
- Needs: `npm ci` in `src/UiTests` and `src/AddressBook.Vue`, Chromium, .NET 10, SQL Server for the API, free ports 5000, 7187 and 4173.

## Out of scope

- Real Vue component objects and enabling specs for `vue` (V3, V5–V7).
- CI steps per project, npm caching, pinning, the Vue workflow, `security.yml` (V9).
- A conditional Vue `webServer` for Blazor-only or `test:remote` runs.
- Firefox and WebKit projects.

## Decisions

- Vue is served for tests from `vite preview` on 4173, not the dev server.
- CI `npm test` already runs the `vue` project (the two app-boot tests).
- Fixture name `app`; the Vue readiness marker is the mounted `.v-application`, tightened in V3.
- The `blazor` count grows from 48 to 50 with the app-boot spec.
- `src/UiTests/package.json` gets a `type-check` script.
