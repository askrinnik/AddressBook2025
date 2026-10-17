# Plan: Vue.js frontend `src/AddressBook.Vue`

> **Status:** all tasks done, shipped in [#223](https://github.com/askrinnik/AddressBook2025/pull/223); issues [#213](https://github.com/askrinnik/AddressBook2025/issues/213)–[#222](https://github.com/askrinnik/AddressBook2025/issues/222)
> **Target folder:** `src/AddressBook.Vue` (new npm project, not part of `src/AddressBook.slnx`)
> **Reference frontend:** `src/AddressBook.Web` — Blazor WebAssembly + MudBlazor ([spec](../specs/AddressBook.Web.md))
> **Progress is tracked by the check boxes in [Task list](#5-task-list).**

## 1. Goal

Build a second, independent frontend for the AddressBook API on Vue.js whose UI is functionally
identical to `AddressBook.Web`. The Blazor frontend stays as it is; both frontends talk to the
same API.

The project is also learning material for a developer who knows Blazor but not Vue. The code
follows the repository's normal conventions; the Vue concepts are explained in a separate guide
that points to the project's files.

## 2. Decisions

| Topic | Decision |
|---|---|
| Framework | Vue 3, Composition API with `<script setup>` |
| Language | TypeScript, type-checked with `vue-tsc` |
| Build tool | Vite |
| Routing | Vue Router |
| State | No store library; page state lives in components, shared state in composables (`provide`/`inject`) |
| UI library | Vuetify 4 (Material Design, closest to MudBlazor) |
| Client validation | Vuetify `rules` on the fields, backed by `contactRules.ts` that mirrors `ContactRules` in `AddressBook.Contracts` |
| Parity | Strict — see [section 3](#3-parity-contract) |
| E2E tests | The existing suite `src/UiTests` runs against both frontends; only the page and component objects differ per frontend |
| Component tests | Vitest + `@vue/test-utils` + jsdom, the API service mocked (the counterpart of bUnit in `src/AddressBook.Web.Tests`) |
| CI | A path-filtered workflow for the Vue app; `ui-tests.yml` runs both frontends |
| Deployment | Out of scope (no Azure Static Web App for Vue) |
| Comments | Normal project density, in English, per `CLAUDE.md` |
| Learning guide | Concepts mapped to their Blazor counterparts, with links to this project's files |

## 3. Parity contract

The Vue frontend reproduces the behaviour described in [AddressBook.Web.md](../specs/AddressBook.Web.md),
including the details where Vuetify behaves differently out of the box:

- **Texts:** app bar `Contact Book`, nav links `Home` / `Contacts`, page titles, column headers
  `First name` / `Last name` / `Birthday` / `Actions`, `Create Contact`, `Loading...`,
  `No matching records found`, the delete dialog (`Warning`, `Are you sure you want to delete this contact?`,
  `Yes`, `Cancel`), `Back to Contacts`, every validation and error message.
- **Selectors:** every `data-testid` in [`src/UiTests/src/utils/testids.ts`](../../src/UiTests/src/utils/testids.ts)
  and the aria-labels `Edit contact`, `Delete contact`, `Rows per page`.
- **Contacts table:** search commits on blur and on clear, not while typing; sorting and paging
  happen on the client over the loaded rows; `TotalItems` comes from `TotalRows`; the pager
  caption reads `X-Y of Z`; Birthday shows as `M/D/YYYY`.
- **Errors:** the inline alert and the top banner follow the same rules — a successful reload
  clears both, a failed delete raises the banner and the following reload does not clear it,
  a 404 on delete only reloads the table.
- **Form:** Birthday is chosen only from the calendar (read-only input); the picker disables the
  days after the UTC today; the birthday rule compares with the UTC date; server field errors
  from RFC 7807 `errors` show on their fields; submit is disabled while the call runs.
- **Problem details:** at most 64 KB of an error body is read; an empty, non-JSON or non-problem
  body yields a fallback with the reason phrase as title and the status code.

Where a component's markup differs (Vuetify classes instead of `.mud-*`), only the Vue component
objects of `src/UiTests` know it; the specs stay the same.

## 4. Shared E2E suite design

- `playwright.config.ts` defines two projects, `blazor` and `vue`, each with its own `baseURL`;
  `webServer` starts the API, the Blazor app and the Vue preview build (`vite preview`).
- The page and component objects split into a shared part and frontend-specific parts
  (`src/components/blazor/*`, `src/components/vue/*`). A fixture picks the implementation from
  the running project, so specs keep importing `test` / `expect` from `src/fixtures/test-fixtures.js`.
- The Blazor-only WASM readiness helper (`src/utils/blazor.ts`) becomes a per-frontend
  `waitForAppReady`.
- The `vue` project starts with an app-boot smoke spec in its `testMatch` list; each page task adds the specs of the
  feature it delivers, so the suite stays green at every step. When V7 is done, both projects
  run the same specs.

## 5. Task list

Each task is one GitHub issue; "Blocked by" becomes the issue relation.

- [x] [#213](https://github.com/askrinnik/AddressBook2025/issues/213) **V1 — Scaffold `src/AddressBook.Vue`.** Vite + Vue 3 + TypeScript + Vue Router + Vuetify 4,
  ESLint and Prettier, `vue-tsc`, `VITE_API_PREFIX` (development value `http://localhost:5000/api/`),
  a fixed dev-server port, history-mode routing that survives a refresh on a deep link, README
  with prerequisites, build and run. Blocked by: —
- [x] [#214](https://github.com/askrinnik/AddressBook2025/issues/214) **V2 — Run `src/UiTests` against several frontends.** Projects `blazor` and `vue`,
  frontend-specific component objects chosen by fixture, per-frontend `waitForAppReady`, the
  Vue preview build in `webServer`, an app-boot smoke spec for `vue`. No spec changes its behaviour;
  `--project=blazor` stays green. Blocked by: V1
- [x] [#215](https://github.com/askrinnik/AddressBook2025/issues/215) **V3 — App shell.** App bar with title, drawer toggle and dark-mode toggle; nav drawer with
  Home and Contacts; Home page; not-found view; page titles; a global error banner provided to
  pages through a composable (the counterpart of the cascading `Error` component). Enables the
  shell smoke spec for `vue`. Blocked by: V2
- [x] [#216](https://github.com/askrinnik/AddressBook2025/issues/216) **V4 — API client.** TypeScript types mirroring `AddressBook.Contracts`
  (`ContactModel`, `GetFilteredContactsResponse`, create and update commands); a `fetch`
  wrapper with problem-details parsing and fallback; `ProblemDetailsError`; `getErrors()`;
  service functions mirroring `IAddressBookApiService` (percent-encoded `search` only for a
  non-blank term, new id from the `Location` header, `null` on 404 for get-by-id). Blocked by: V1
- [x] [#217](https://github.com/askrinnik/AddressBook2025/issues/217) **V5 — Contacts page.** Server-reloading table, search, sorting, paging with a labelled
  rows-per-page select, loading and empty states, inline alert and banner rules, Edit and Delete
  buttons, delete confirmation dialog, 404-on-delete handling. Enables the list, search,
  sort-paginate, delete and shell-navigation specs for `vue`. Blocked by: V3, V4
- [x] [#218](https://github.com/askrinnik/AddressBook2025/issues/218) **V6 — Contact form and Create page.** `contactRules.ts`; read-only Birthday picker with the
  UTC maximum date; server field-error mapping; general error; submit disabled while saving;
  Cancel. Enables the create, validation and a11y specs for `vue`. Blocked by: V5
- [x] [#219](https://github.com/askrinnik/AddressBook2025/issues/219) **V7 — Edit page.** Loading progress, not-found warning, load-error alert,
  `Back to Contacts`, save. Enables the edit, edit-not-found and crud-lifecycle specs for `vue`.
  Blocked by: V6
- [x] [#220](https://github.com/askrinnik/AddressBook2025/issues/220) **V8 — Component tests.** Vitest + `@vue/test-utils` + jsdom for the pages, the form, the
  shell and the API client, with the API service mocked; coverage thresholds 85 % lines and
  70 % branches, as in `web-tests.yml`. Blocked by: V7
- [x] [#221](https://github.com/askrinnik/AddressBook2025/issues/221) **V9 — CI.** A path-filtered workflow for `src/AddressBook.Vue` (lint, type-check, build,
  Vitest with coverage; actions pinned to commit SHAs); `ui-tests.yml` runs both Playwright
  projects; `security.yml` scans the new npm project. Blocked by: V8
- [x] [#222](https://github.com/askrinnik/AddressBook2025/issues/222) **V10 — Documentation, harness and learning guide.** `docs/specs/AddressBook.Vue.md`;
  `Architecture.md`; `src/UiTests/README.md` and the Playwright conventions (frontend projects);
  a pointer in `CLAUDE.md`; `.github/instructions/vue.instructions.md` with the matching
  `.claude/rules/vue.md`; `docs/ai/README.md`; the learning guide. Blocked by: V7

Each task updates the documents its change affects (see `.claude/rules/update-docs-on-code-change.md`);
V10 adds the cross-cutting documents and the guide.

## 6. Open points

- **Guide location (settled in V10).** `docs/guides/vue-for-blazor-developers.md`, written in
  Russian at the user's decision; `.claude/rules/docs.md` names `docs/guides/` and this language exception.
- **Date picker component (settled in V6).** `v-date-input`, part of Vuetify 4 core: with `update-on` empty it keeps the input read-only, and it supports `max`.

## 7. Verification

- In `src/AddressBook.Vue`: `npm run lint`, `npm run type-check`, `npm run build`, `npm test`.
- In `src/UiTests`: `npx playwright test --project=blazor` and `npx playwright test --project=vue`.
- A side-by-side walk of both frontends in the browser against the local API.
