# Issue #215 — Vue V3: Application shell of the Vue frontend

> **Issue:** [#215](https://github.com/askrinnik/AddressBook/issues/215)
> **Lane:** Feature
> **Complexity:** M
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V3

## Requirement

`src/AddressBook.Vue` renders the same shell as `AddressBook.Web` (`Layout/MainLayout.razor`, `NavMenu.razor`, `Error.razor`, `App.razor`, `Pages/Home.razor`): an app bar with `Contact Book`, a drawer toggle and a theme toggle; a clipped drawer, open by default, with Home and Contacts; a Home page; a not-found view; per-route document titles; and a global error banner that pages reach through `useErrorBanner()`. The placeholder page goes away. The `vue` project of `src/UiTests` runs the shell smoke tests.

## Acceptance

- [x] The app bar shows `Contact Book`, a drawer toggle and a dark/light toggle with the testids `app-drawer-toggle` and `app-theme-toggle`
- [x] The collapsible drawer holds `Home` (`/`) and `Contacts` (`/contacts`) with the testids `nav-home` and `nav-contacts`
- [x] Home and an unknown route render like in the Blazor app, and the page titles match
- [x] A global error banner is available to every page through a composable with `processError`, `processProblem` and `clear`
- [x] The shell smoke spec runs for the `vue` project and passes (see Decisions for the a11y spec)
- [x] The app starts in light mode, not the system theme (Vuetify defaults to `system`, MudBlazor to light)
- [x] The toggles carry `aria-label="Toggle navigation drawer"` and `aria-label="Toggle dark/light mode"`; the theme icon is a moon in light mode and "auto" in dark mode
- [x] The drawer starts open under a full-width app bar; Home is active only on `/`, Contacts on `/contacts` and its subpaths
- [x] The default document title is `AddressBook`, as in Blazor's `index.html`
- [x] The not-found route shows `<p role="alert">Sorry, there's nothing at this address.</p>` inside the layout, titled `Not found`
- [x] The Vue `waitForAppReady` waits for the app-bar title, like Blazor

## Affected files

`src/AddressBook.Vue`: `index.html` (title), `src/plugins/vuetify.ts` (`defaultTheme: 'light'`), new `src/styles/main.css` (body background follows the theme), `src/App.vue` (provides the banner, hosts the layout), new `src/layouts/MainLayout.vue`, `src/components/NavMenu.vue`, `src/components/ErrorBanner.vue`, `src/composables/useErrorBanner.ts`, `src/api/problemDetails.ts` (`ClientProblemDetails`, reused by V4), `src/pages/HomePage.vue`, `src/pages/NotFoundPage.vue`; `src/router/index.ts` (meta titles, `afterEach`), router meta typing; `README.md` (structure). `PlaceholderPage.vue` and the obsolete `.gitkeep` files are removed.

`src/UiTests`: `src/components/vue/app-shell.component.ts`, `src/frontends/vue.ts`, `tests/smoke/app-shell.spec.ts` (shell-only tests plus a not-found test), new `tests/smoke/app-shell-navigation.spec.ts` (the three tests that need the Contacts page, moved unchanged), `playwright.config.ts` (`vueSpecs`), `README.md`.

## Approach

1. **Theme.** `defaultTheme: 'light'`; the layout toggles with `useTheme()`. The smoke test reads the `document.body` luminance, so the body background follows the theme.
2. **Layout.** `v-app-bar` before `v-navigation-drawer` (clipped drawer); `v-app-bar-nav-icon` and the theme `v-btn` carry the aria-labels and testids; `drawerOpen = ref(true)`. Below Vuetify's mobile breakpoint the drawer becomes an overlay (tests run at desktop width).
3. **NavMenu.** `v-list-item` links with `to`, `exact` for Home, icons `mdi-home` and `mdi-account-supervisor`.
4. **Pages.** Home: `Contacts application` heading and `Welcome to your Contacts app.`; not-found: the alert paragraph on the catch-all route.
5. **Error banner** (the counterpart of the cascading `Error`). `provideErrorBanner()` keeps `message` and offers `processError(msg)`, `processProblem(p)` (indented JSON of the problem's extensions, `null` for no problem, like `Error.razor`) and `clear()`; `useErrorBanner()` injects it. `ErrorBanner.vue` renders the same markup and texts as `Error.razor` (`Woops!`).
6. **UiTests.** `VueAppShell` implements `appBarTitle`, `drawer` and `isDrawerOpen`; readiness waits for the app-bar title. The three tests that open the Contacts page move unchanged to `app-shell-navigation.spec.ts`, so `vueSpecs` keeps whole files; they join `vue` with the Contacts page.

## Tests

- `tests/smoke/app-shell.spec.ts` (both projects): shell loads, Home title, no "More options" control, drawer toggle, theme toggle, new not-found test.
- `tests/smoke/app-shell-navigation.spec.ts`: the three Contacts tests, `blazor` only until the Contacts page exists.
- `tests/smoke/app-boot.spec.ts` stays green with the tighter readiness.
- Vitest arrives later; it covers the shell, the composable and the banner.

## Verification

- `npm run lint`, `npm run type-check`, `npm run build` in `src/AddressBook.Vue`.
- `npx playwright test --project=vue` and `--project=blazor` in `src/UiTests`.
- Side-by-side browser walk against Blazor: title, icons, aria-labels, drawer and theme toggles, nav highlighting, Home text, not-found view, tab titles.
- An ad-hoc axe scan of the Vue Home page.

## Out of scope

- The Contacts, Create and Edit pages and their titles.
- Blazor's WASM boot spinner and the `#blazor-error-ui` reload bar (WASM-host specific).
- `FocusOnNavigate` (focus on the `h1` after navigation).

## Decisions

- The a11y spec scans Home, Contacts and Create Contact, so it joins the `vue` project together with the Create page rather than now; the Home page gets an ad-hoc scan here.
- The three Contacts-dependent smoke tests move to their own file instead of using grep tags.
- `ClientProblemDetails` lives in `src/api/problemDetails.ts` for the API client to reuse.
- The banner shows at the top of the main area, below the app bar; in Blazor it renders outside the layout, behind the fixed app bar.
- The default document title is `AddressBook`, as in Blazor.
