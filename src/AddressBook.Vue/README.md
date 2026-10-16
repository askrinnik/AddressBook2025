# AddressBook.Vue

Vue.js frontend for the Address Book. It is a standalone npm project and is not part of `src/AddressBook.slnx`.

Stack: Vue 3.5 (`<script setup>`, TypeScript), Vite 8, Vue Router 5 (history mode), Vuetify 4, ESLint (flat config) and Prettier.

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
| `src/pages/`                | `HomePage.vue`, `ContactsPage.vue` (`/contacts`: server-reloading table with search, client-side sort and paging, delete with confirmation), `CreateContactPage.vue` (`/create-contact`: `ContactForm` with Create, back to `/contacts` on success and Cancel) and `NotFoundPage.vue`.                                                                                                                                                                                                                    |
| `src/router/`               | Routes; `meta.title` sets the document title (`AddressBook` when a route has none).                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/api/`                  | `types.ts`: contract types and date helpers (`toShortDateString` formats `M/D/YYYY`); `problemDetails.ts`: RFC 7807 parsing, `getErrors`, `ProblemDetailsError`; `http.ts`: `request()` with the problem-details pipeline; `contactsApi.ts`: the five service functions.                                                                                                                                                                                                                                  |
| `src/plugins`, `src/styles` | Vuetify setup (light theme by default, with a medium-emphasis opacity that gives field labels AA contrast) and the global stylesheet.                                                                                                                                                                                                                                                                                                                                                                     |

## Configuration

| Variable          | Default                      | Purpose              |
| ----------------- | ---------------------------- | -------------------- |
| `VITE_API_PREFIX` | `http://localhost:5000/api/` | Base URL of the API. |

`.env.development` sets the development value. Put overrides in `.env.local` or `.env.development.local`; both are git-ignored.
