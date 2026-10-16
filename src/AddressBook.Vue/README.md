# AddressBook.Vue

Vue.js frontend for the Address Book. It is a standalone npm project and is not part of `src/AddressBook.slnx`.

Stack: Vue 3.5 (`<script setup>`, TypeScript), Vite 8, Vue Router 5 (history mode), Vuetify 4, ESLint (flat config) and Prettier.

| Document                                                                       | Content                                                                                               |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [AddressBook.Vue.md](../../docs/specs/AddressBook.Vue.md)                      | Specification: pages, API client, validation, layout, tests, differences from the Blazor frontend     |
| [vue.instructions.md](../../.github/instructions/vue.instructions.md)          | Coding standard of this project                                                                       |
| [vue-for-blazor-developers.md](../../docs/guides/vue-for-blazor-developers.md) | Learning guide (in Russian): Vue explained on this project's files, next to their Blazor counterparts |

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`, with npm.
- The API running on `http://localhost:5000` (see [AddressBook.Api](../../docs/specs/AddressBook.Api.md)) for pages that call it.

## Install

```
npm ci
```

## Run

| Command                                   | What it does                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`                             | Dev server on `http://localhost:5173`; fails if the port is taken (`strictPort`). |
| `npm run build`                           | Type-checks with `vue-tsc` and builds to `dist/`.                                 |
| `npm run preview`                         | Serves the build on `http://localhost:4173`; fails if the port is taken.          |
| `npm run type-check`                      | `vue-tsc --build`.                                                                |
| `npm run lint`                            | ESLint.                                                                           |
| `npm test`                                | Runs the tests once (see [Tests](#tests)).                                        |
| `npm run format` / `npm run format:check` | Prettier write / check.                                                           |

Any route, including a refresh on a deep link such as `/contacts`, serves the app.

## Structure

| Path                        | Content                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.vue`               | Root: provides the global error banner and hosts the layout and the router view.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/layouts/`              | `MainLayout.vue`: app bar, clipped drawer, theme toggle, banner and page slot.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/components/`           | `NavMenu.vue` (Home, Contacts), `ErrorBanner.vue`, `TablePager.vue` (rows per page, `X-Y of Z`, First/Previous/Next/Last page), `ContactForm.vue` (the contact form of the Create and Edit pages: fields, rules, submit label, `save` callback, field and general server errors, submit disabled while saving), `contactFormErrors.ts` (maps a save error to field and general messages) and `BirthdayPicker.vue` (read-only `v-date-input` with the UTC today as the latest day and `M/D/YYYY` display). |
| `src/composables/`          | `useErrorBanner.ts`: `processError`, `processProblem` and `clear` of the error banner.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/directives/`           | `inputTestId.ts`: `v-input-test-id` puts a `data-testid` on the native `<input>` of a Vuetify field.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/rules/`                | `contactRules.ts`: the contact rules mirroring `ContactRules` of `AddressBook.Contracts` (name required and at most 30 characters, birthday not after the UTC today) as Vuetify field rules.                                                                                                                                                                                                                                                                                                              |
| `src/pages/`                | `HomePage.vue`, `ContactsPage.vue` (`/contacts`: server-reloading table with search, client-side sort and paging, delete with confirmation), `CreateContactPage.vue` (`/create-contact`: `ContactForm` with Create, back to `/contacts` on success and Cancel), `EditContactPage.vue` (`/edit-contact/:id` with an integer id: loads the contact with a progress bar, an alert with `Back to Contacts` for an unknown id or a failed load, otherwise `ContactForm` with Save) and `NotFoundPage.vue`.     |
| `src/router/`               | Routes; `meta.title` sets the document title (`AddressBook` when a route has none).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/api/`                  | `types.ts`: contract types and date helpers (`toShortDateString` formats `M/D/YYYY`); `problemDetails.ts`: RFC 7807 parsing, `getErrors`, `ProblemDetailsError`; `http.ts`: `request()` with the problem-details pipeline; `contactsApi.ts`: the five service functions.                                                                                                                                                                                                                                  |
| `src/plugins`, `src/styles` | Vuetify setup (light theme by default, with a medium-emphasis opacity that gives field labels AA contrast) and the global stylesheet.                                                                                                                                                                                                                                                                                                                                                                     |

## Tests

Component and unit tests run on Vitest, `@vue/test-utils` and jsdom. They need no browser and no running API: the API module is mocked, and the API client runs against a stubbed `fetch`. This is the counterpart of `src/AddressBook.Web.Tests`.

| Command                 | What it does                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm test`              | Runs all tests once.                                                                                         |
| `npm run test:watch`    | Re-runs the tests on every change.                                                                           |
| `npm run test:coverage` | Runs the tests with V8 coverage; fails below 85 % lines or 70 % branches. The HTML report is in `coverage/`. |

Tests live in `tests/`, in the folder layout of `src/`, as `*.spec.ts`. `tests/setup.ts` adds the browser APIs jsdom lacks and Vuetify needs (`ResizeObserver`, `IntersectionObserver`, `matchMedia`, `visualViewport`). `tests/helpers/` has `mountWithApp()`, which mounts a component with Vuetify, a memory-history router and the error banner, and the `Response` factories for `fetch` stubs. Components are mounted with the real Vuetify, so tests read the rendered markup. Time-dependent rules use fake timers with a fixed system time.

## Configuration

| Variable          | Default                      | Purpose              |
| ----------------- | ---------------------------- | -------------------- |
| `VITE_API_PREFIX` | `http://localhost:5000/api/` | Base URL of the API. |

`.env.development` sets the development value. Put overrides in `.env.local` or `.env.development.local`; both are git-ignored.
