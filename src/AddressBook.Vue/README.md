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

| Path                        | Content                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.vue`               | Root: provides the global error banner and hosts the layout and the router view.                                                                                                                                                |
| `src/layouts/`              | `MainLayout.vue`: app bar, clipped drawer, theme toggle, banner and page slot.                                                                                                                                                  |
| `src/components/`           | `NavMenu.vue` (Home, Contacts) and `ErrorBanner.vue`.                                                                                                                                                                           |
| `src/composables/`          | `useErrorBanner.ts`: `processError`, `processProblem` and `clear` of the error banner.                                                                                                                                          |
| `src/pages/`                | `HomePage.vue` and `NotFoundPage.vue`.                                                                                                                                                                                          |
| `src/router/`               | Routes; `meta.title` sets the document title (`AddressBook` when a route has none).                                                                                                                                             |
| `src/api/`                  | `types.ts`: contract types and date helpers; `problemDetails.ts`: RFC 7807 parsing, `getErrors`, `ProblemDetailsError`; `http.ts`: `request()` with the problem-details pipeline; `contactsApi.ts`: the five service functions. |
| `src/plugins`, `src/styles` | Vuetify setup (light theme by default) and the global stylesheet.                                                                                                                                                               |

## Configuration

| Variable          | Default                      | Purpose              |
| ----------------- | ---------------------------- | -------------------- |
| `VITE_API_PREFIX` | `http://localhost:5000/api/` | Base URL of the API. |

`.env.development` sets the development value. Put overrides in `.env.local` or `.env.development.local`; both are git-ignored.
