# Issue #213 — Vue V1: Scaffold the Vue.js frontend src/AddressBook.Vue

> **Issue:** [#213](https://github.com/askrinnik/AddressBook/issues/213)
> **Lane:** Feature
> **Complexity:** M
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V1

## Requirement

`src/AddressBook.Vue` is a standalone npm project, not part of `src/AddressBook.slnx`: Vue 3.5 (`<script setup>`, TypeScript), Vite 8, Vue Router 5 in history mode, Vuetify 4, ESLint flat config and Prettier, with a committed `package-lock.json`. It builds, lints and type-checks cleanly, and its dev server starts non-interactively on a fixed port so that the Playwright `webServer` of V2 can rely on it. It renders a Vuetify placeholder page on any route, deep links included, and reads the API base URL from `VITE_API_PREFIX`, falling back to `http://localhost:5000/api/` like `AddressBook.Web/Program.cs`.

## Acceptance

- [x] Builds with `npm run build`; `npm run dev` starts on a fixed dev-server port
- [x] `npm run lint` and `npm run type-check` (`vue-tsc`) pass
- [x] The API base URL comes from `VITE_API_PREFIX`; the development value is `http://localhost:5000/api/`
- [x] History-mode router; a refresh on a deep link (for example `/contacts`) serves the app
- [x] Vuetify renders a placeholder page
- [x] `src/AddressBook.Vue/README.md` describes prerequisites, build and run
- [x] The dev port is `5173` with `strictPort: true` (fails instead of moving); preview runs on `4173`, also strict
- [x] Without `VITE_API_PREFIX`, `apiPrefix` falls back to `http://localhost:5000/api/`
- [x] `npm run format:check` passes; the Prettier options match `src/UiTests/.prettierrc.json`
- [x] `node_modules/`, `dist/` and `.env*.local` are git-ignored; `package-lock.json` and `.env.development` are committed
- [x] The project tree in `docs/specs/Architecture.md` lists `AddressBook.Vue/`

## Affected files

All new under `src/AddressBook.Vue/`:

- `package.json` — scripts `dev`, `build` (`vue-tsc --build && vite build`), `preview`, `type-check`, `lint`, `format`, `format:check`; `"type": "module"`, `"private": true`, `engines.node`
- `package-lock.json`
- `index.html` — `<div id="app">`, entry `/src/main.ts`
- `vite.config.ts` — `vue()`, `vuetify({ autoImport: true })`, `@` alias, `server: { port: 5173, strictPort: true }`, `preview: { port: 4173, strictPort: true }`
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- `env.d.ts` — Vite client types and a typed `ImportMetaEnv { readonly VITE_API_PREFIX?: string }`
- `.env.development` — `VITE_API_PREFIX=http://localhost:5000/api/`
- `eslint.config.ts` — `eslint-plugin-vue` flat `essential`, `@vue/eslint-config-typescript`, `@vue/eslint-config-prettier/skip-formatting`
- `.prettierrc.json`, `.prettierignore`, `.gitignore`
- `src/main.ts`, `src/App.vue`, `src/router/index.ts`, `src/plugins/vuetify.ts`, `src/config.ts`, `src/pages/PlaceholderPage.vue`
- empty folders with `.gitkeep`: `src/components/`, `src/layouts/`, `src/api/`, `src/composables/`
- `README.md`

Documentation: `docs/specs/Architecture.md` (one tree line), `docs/tasks/vue-frontend-plan.md` (V1 ticked).

## Approach

1. Write the files by hand instead of `npm create vue@latest`, which prompts interactively and adds sample components; follow its layout (tsconfig split, `env.d.ts`, ESLint config shape).
2. Install with `npm install` to produce the lockfile — dependencies `vue@^3.5`, `vue-router@^5`, `vuetify@^4.2`, `@mdi/font`; dev dependencies `vite@^8`, `@vitejs/plugin-vue`, `vite-plugin-vuetify`, `typescript`, `vue-tsc`, `@vue/tsconfig`, `@tsconfig/node24`, `@types/node`, `eslint@^9`, `eslint-plugin-vue`, `@vue/eslint-config-typescript`, `@vue/eslint-config-prettier`, `jiti` if ESLint needs it for a TS config, `prettier`, `prettier-plugin-organize-imports`. No Vitest (V8), no Pinia.
3. Icons through `@mdi/font` (icon by name, closest to MudBlazor's `Icons.Material.*`).
4. Router: explicit `createRouter` + `createWebHistory`, no file-based routing, so routes map one to one onto Blazor `@page`. Vite's default `appType: 'spa'` serves `index.html` for unknown paths in `dev` and `preview`; a catch-all route renders the placeholder until V3 adds the not-found view.
5. CORS: no API change — `AllowedOrigins` is empty in development, so every origin is allowed.
6. The root `.gitignore` covers neither `node_modules` nor `dist`; the project gets its own `.gitignore`, like `src/UiTests`.

## Tests

No automated tests in V1: Vitest arrives in V8 and the Playwright `vue` project in V2. The gates are `npm run lint`, `npm run type-check`, `npm run format:check` and `npm run build`, plus the manual checks below. The .NET build and the existing suites are unaffected.

## Verification

- `npm ci`, `npm run build`, `npm run lint`, `npm run type-check`, `npm run format:check` exit 0.
- `npm run dev` serves on `http://localhost:5173`; a second instance fails with the port in use.
- Browser: `/` shows the Vuetify placeholder card with an mdi icon; opening and refreshing `/contacts` loads the app; the card shows the API prefix.
- `npm run preview` on `4173` serves `/contacts` on refresh.
- `git status` lists no `node_modules` or `dist`.

## Out of scope

- V2 UiTests projects; V3 shell and not-found view; V4 API client; V8 Vitest; V9 CI (`security.yml` scans npm projects in a matrix `suite: [ApiTests, UiTests]` — V9 adds `AddressBook.Vue`; there is no Dependabot config); V10 spec, instruction file and guide.
- No production env file and no deployment.

## Decisions

- Dev port `5173` and preview port `4173`, both strict.
- Fallback API prefix `http://localhost:5000/api/`, the same as Blazor.
- Folder `src/pages` instead of `views`, mirroring Blazor `Pages/`.
- `prettier-plugin-organize-imports` kept for parity with UiTests; dropped in this project only if it breaks `.vue` formatting.
- ESLint config as `eslint.config.ts` (the create-vue default), type-checked.
