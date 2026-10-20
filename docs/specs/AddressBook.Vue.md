# AddressBook.Vue Technical Specification

## 1. Project Overview

AddressBook.Vue is a second, standalone frontend for the AddressBook API, written in Vue.js. Its UI is functionally identical to the Blazor frontend ([AddressBook.Web.md](AddressBook.Web.md)); [section 10](#10-deliberate-differences-from-the-blazor-frontend) lists where it deliberately differs.

| Item | Value |
|---|---|
| Framework | Vue 3.5, Composition API with `<script setup lang="ts">` |
| Language | TypeScript, type-checked with `vue-tsc` |
| Build tool | Vite 8 |
| Routing | Vue Router 5, history mode |
| UI library | [Vuetify](https://vuetifyjs.com/) 4 (Material Design components), Material Design Icons (`@mdi/font`) |
| API access | `fetch` through one `request()` function |
| HTTP error pipeline | `request()` turns every non-success response into a `ProblemDetailsError` |
| API base URL config | `VITE_API_PREFIX` (fallback: `http://localhost:5000/api/`) |
| State | No store library: page state lives in components, shared state in a composable (`provide` / `inject`) |
| Deployment target | None; the app runs locally and in CI only |

It is an npm project and is not part of `src/AddressBook.slnx`. It does not reference `AddressBook.Contracts`; `src/api/types.ts` mirrors the contract types in TypeScript.

The [learning guide](../guides/vue-for-blazor-developers.md) (in Russian) explains the Vue concepts on this project's files, each next to its Blazor counterpart.

### Vuetify References

- Documentation: https://vuetifyjs.com/
- Source code: https://github.com/vuetifyjs/vuetify

Vuetify components used in this project:

| Component | Usage | MudBlazor counterpart |
|---|---|---|
| `v-app` | Application root in `App.vue` | `MudLayout` |
| `v-app-bar` / `v-app-bar-nav-icon` / `v-app-bar-title` | App bar in `MainLayout.vue` | `MudAppBar` / `MudIconButton` / `MudText` |
| `v-navigation-drawer` | Side drawer | `MudDrawer` |
| `v-main` / `v-container` | Content area | `MudMainContent` |
| `v-list` / `v-list-item` | Side navigation | `MudNavMenu` / `MudNavLink` |
| `v-data-table-server` | Server-reloading contacts table | `MudTable<T>` with `ServerData` |
| `v-select` | Rows-per-page select in `TablePager.vue` | `MudSelect` |
| `v-text-field` | Name fields, search field | `MudTextField` |
| `v-date-input` | Birthday picker | `MudDatePicker` |
| `v-form` | Contact form validation | `EditForm` + `DataAnnotationsValidator` |
| `v-card` / `v-card-title` / `v-card-text` / `v-card-actions` | Form card, delete dialog | `MudCard` / `MudCardContent` / `MudCardActions` |
| `v-dialog` | Delete confirmation | `MudMessageBox` |
| `v-btn` / `v-icon` | Actions | `MudButton` / `MudIconButton` |
| `v-alert` | Error banner, inline alerts | `MudAlert`, the Bootstrap alert of `Error.razor` |
| `v-progress-linear` | Edit page loading | `MudProgressLinear` |
| `v-row` / `v-col` | Form grid | `MudGrid` / `MudItem` |
| `v-toolbar` / `v-spacer` / `v-divider` | Table toolbar | `ToolBarContent` / `MudSpacer` |

## 1a. Prerequisites, Build, and Run

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` (the `engines` field of `package.json`), with npm.
- The API on `http://localhost:5000` ([AddressBook.Api.md](AddressBook.Api.md)) for the pages that call it.

### Install and run

All commands run in `src/AddressBook.Vue`; `npm ci` installs the dependencies once.

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot module replacement on `http://localhost:5173` |
| `npm run build` | `vue-tsc --build` (app, tests and config), then `vite build` to `dist/` |
| `npm run preview` | Serves `dist/` on `http://localhost:4173` |
| `npm run type-check` | `vue-tsc --build` only |
| `npm run lint` | ESLint (flat config `eslint.config.ts`) |
| `npm test` | Vitest, one run ([section 9](#9-tests)) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with V8 coverage and thresholds |
| `npm run format` / `npm run format:check` | Prettier write / check |

### Ports

| Server | Port | Notes |
|---|---|---|
| Dev server (`vite`) | 5173 | `strictPort`: fails instead of moving to another port |
| Preview server (`vite preview`) | 4173 | `strictPort`; the UI E2E suite serves the app this way |

Both servers answer every unknown path with `index.html`, so a refresh on a deep link such as `/contacts` works.

### Dependencies

| Package | Version range |
|---|---|
| `vue` | `^3.5.44` |
| `vue-router` | `^5.4.0` |
| `vuetify` | `^4.2.6` |
| `@mdi/font` | `^7.4.47` |

The development dependencies (Vite, `vite-plugin-vuetify`, TypeScript, `vue-tsc`, ESLint, Prettier, Vitest, `@vue/test-utils`, jsdom) are listed in `package.json`; `package-lock.json` pins them.

## 2. Startup

Source: `src/AddressBook.Vue/src/main.ts`

```ts
createApp(App).use(router).use(vuetify).mount('#app');
```

| Step | Source | Purpose |
|---|---|---|
| `index.html` | `index.html` | Host page with `<div id="app">` and the module script `/src/main.ts`; title `AddressBook` |
| `createApp(App)` | `src/App.vue` | Root component: calls `provideErrorBanner()`, renders `v-app` > `MainLayout` > `router-view` |
| `.use(router)` | `src/router/index.ts` | Routes and document titles ([section 5](#5-routing-and-pages)) |
| `.use(vuetify)` | `src/plugins/vuetify.ts` | Vuetify with the `mdi` icon set and the light theme by default |
| `./styles/main.css` | `src/styles/main.css` | The page background follows the active theme |

`vite.config.ts` registers `@vitejs/plugin-vue` and `vite-plugin-vuetify` with `autoImport: true`, so templates use Vuetify components without importing them. The alias `@` points to `src/`.

## 3. Configuration

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_PREFIX` | `http://localhost:5000/api/` | Base URL of the API |

- `src/config.ts` exports `apiPrefix` from `import.meta.env.VITE_API_PREFIX`, falling back to `http://localhost:5000/api/`.
- `.env.development` sets the development value. Overrides go to `.env.local` or `.env.development.local`; both are git-ignored.
- Vite replaces `import.meta.env.*` when it builds, so the value is fixed in the bundle. The Blazor frontend reads `API_Prefix` from `wwwroot/appsettings.json` at run time.

## 4. API Client

Folder: `src/AddressBook.Vue/src/api`

### 4.1 Types (`types.ts`)

| Type | Mirrors | Notes |
|---|---|---|
| `ContactModel` | `ContactModel` | `birthday` is a `yyyy-MM-dd` string or `null` |
| `GetFilteredContactsResponse` | `GetFilteredContactsResponse` | `totalRows`, `rows` |
| `CreateContactCommand` | `CreateContactCommand` | Body of `POST contacts` |
| `UpdateContactCommand` | `UpdateContactCommand` | Body of `PUT contacts/{id}` |
| `ContactFormModel` | `CreateContactModel` (Web) | `birthday` is a local `Date` or `null` |

Date helpers:

| Function | Behaviour |
|---|---|
| `toDateOnly(date)` | Formats the local date parts as `yyyy-MM-dd`, without a time-zone shift |
| `fromDateOnly(value)` | Parses `yyyy-MM-dd` to a `Date` at local midnight; `null` for a string that is not a real date |
| `toShortDateString(value)` | Formats `yyyy-MM-dd` as `M/D/YYYY` from the string's parts, independent of the browser's locale and time zone; any other string is returned unchanged |

### 4.2 Request pipeline (`http.ts`)

`request(path, { method, body?, signal? })` is the only place that calls `fetch`. It is the counterpart of the typed `HttpClient` with `ProblemDetailsHandler`.

- The URL is `new URL(path, apiPrefix)`.
- A `body` is sent as JSON with `Content-Type: application/json`; without a body no headers are set.
- A success response is returned unchanged.
- A non-success response throws a `ProblemDetailsError`:
  - at most 64 KB of the body is read as text (a longer body is cut off, so it does not parse);
  - the text is parsed with `parseProblemDetails`;
  - an empty, non-JSON or non-problem body yields an empty problem;
  - a problem without a non-blank `title` takes the response's status text, else `HTTP <status>`;
  - a problem without `status` takes the response status.
- An abort or a network failure passes through unchanged (it is not a `ProblemDetailsError`).

### 4.3 Problem details (`problemDetails.ts`)

| Member | Behaviour |
|---|---|
| `ClientProblemDetails` | `type`, `title`, `status`, `detail`, `instance`, `extensions` |
| `ProblemDetailsError` | `Error` subclass with `problem` and a `status` getter; its `message` is the detail, else the title |
| `parseProblemDetails(text)` | Matches the standard member names case-insensitively and puts every other member into `extensions`. Returns `null` when the text is not a JSON object or a standard member has the wrong type |
| `getErrors(problem)` | Returns `extensions.errors` as `Record<string, string[]>`; an empty map when it is missing or has another shape |

### 4.4 Service functions (`contactsApi.ts`)

The five functions mirror `IAddressBookApiService`.

| Function | HTTP call | Behaviour |
|---|---|---|
| `getFilteredContacts(searchTerm, signal?)` | GET `contacts` or `contacts?search={term}` | Adds `?search=` only for a non-blank term, percent-encoded like `Uri.EscapeDataString` (which also escapes `!'()*`) |
| `deleteContact(id)` | DELETE `contacts/{id}` | A non-success status throws `ProblemDetailsError` |
| `createContact(model)` | POST `contacts` | Sends `CreateContactCommand`; returns the id from the last path segment of `Location`, or 0 when it is missing or not an integer |
| `getContactById(id, signal?)` | GET `contacts/{id}` | Returns `null` on 404; other failures throw |
| `updateContact(id, model, signal?)` | PUT `contacts/{id}` | Sends `UpdateContactCommand` |

The birthday of `ContactFormModel` is sent as `toDateOnly(birthday)`, or `null`.

## 5. Routing and Pages

Source: `src/AddressBook.Vue/src/router/index.ts`

| Path | Name | Page | Document title |
|---|---|---|---|
| `/` | `home` | `HomePage.vue` | `Home` |
| `/contacts` | `contacts` | `ContactsPage.vue` | `Contacts` |
| `/create-contact` | `create-contact` | `CreateContactPage.vue` | `AddressBook` (no title of its own, as in Blazor) |
| `/edit-contact/:id(\\d+)` | `edit-contact` | `EditContactPage.vue`, prop `id: number` | `Edit Contact` |
| `/:pathMatch(.*)*` | `not-found` | `NotFoundPage.vue` | `Not found` |

- `createWebHistory(import.meta.env.BASE_URL)` gives clean URLs.
- Every page is loaded lazily (`() => import(...)`), so it is a separate chunk.
- `meta.title` is typed by a `RouteMeta` augmentation; `router.afterEach` sets `document.title` to it, or `AddressBook`.
- Only an integer id matches the edit route; any other path falls through to the not-found route. The route's `props` function passes `Number(route.params.id)`.

### 5.1 Home page (`/`)

Source: `src/pages/HomePage.vue`. Static: heading `Contacts application` and the text `Welcome to your Contacts app.`

### 5.2 Not-found view

Source: `src/pages/NotFoundPage.vue`. `<p role="alert">Sorry, there's nothing at this address.</p>` inside the layout.

### 5.3 Contacts page (`/contacts`)

Source: `src/pages/ContactsPage.vue`

#### UI and data loading

- Heading `Contacts`, then a `v-data-table-server` (`data-testid="contacts-table"`, compact, hover).
- Columns `First name`, `Last name`, `Birthday` (sortable) and `Actions`. Birthday shows as `M/D/YYYY`.
- The toolbar holds `Create Contact` (navigates to `/create-contact`) and a clearable search field (`aria-label="Search"`).
- The `loading` slot shows `Loading...`; the `no-data` slot shows `No matching records found`, plus an inline error alert after a failed load.
- The table state is the search term, the sort, the page and the rows per page. A `watch` on these four (with `immediate: true`) calls `loadContacts()`, which fetches all matching rows from the API.

#### Search

- The text in the field becomes the search term when the field loses focus, on Enter and on clear — not while typing.
- A commit with unchanged text does nothing; a changed term goes back to page 1.

#### Sorting and pagination

- Sorting is client-side over the loaded rows: names with `Intl.Collator('en-US')`, the birthday by its `yyyy-MM-dd` string, a missing birthday before every date. The sort is stable, so equal values keep the API order. Unsorted keeps the API order.
- Paging is client-side: a slice of the sorted rows. `totalRows` of the response feeds the pager.
- When the current page is past the end (for example after its last row was deleted), the page goes back to 1, which loads again.
- `TablePager.vue` renders the pager: `Rows per page:` with a select (`aria-label="Rows per page"`, options 10, 25, 50, 100), the caption `X-Y of Z` (`0-0 of 0` when empty) and the First/Previous/Next/Last page buttons. A change of rows per page goes back to page 1.

#### Loads in flight

- A new load aborts the one in flight (`AbortController`); an aborted load changes nothing.
- Leaving the page aborts the load in flight (`onBeforeUnmount`).

#### Row actions

- Edit (primary, pencil icon, `aria-label="Edit contact"`) navigates to `/edit-contact/{id}`.
- Delete (error colour, delete icon, `aria-label="Delete contact"`) opens a `v-dialog`: title `Warning`, text `Are you sure you want to delete this contact?`, buttons `Cancel` and `Yes` (`data-testid="contact-delete-confirm"`).
- On `Yes` the page calls `deleteContact` and then reloads the table. A failed delete raises the banner with the problem's detail or title, else the error's message. A 404 means the contact is already gone; it raises nothing and only reloads.

#### Error handling

- A failed load shows its text in the global banner and in the inline alert, and empties the table. The text is the problem's detail, else its title, else the error's message.
- A successful load after a failed one clears the inline alert and the banner.
- A banner raised by a failed delete is not cleared by the reload that follows the delete.

### 5.4 Create page (`/create-contact`)

Source: `src/pages/CreateContactPage.vue`

- Owns the model `{ firstName: '', lastName: '', birthday: null }` and renders `ContactForm` with the submit label `Create`.
- Its `save` calls `createContact` and navigates to `/contacts`; an error thrown by `save` shows on the form ([section 7.6](#76-contactformvue)).
- Cancel navigates to `/contacts`.

### 5.5 Edit page (`/edit-contact/:id`)

Source: `src/pages/EditContactPage.vue`

- Takes `id: number` as a prop from the route and loads the contact in `onMounted`.
- While loading: an indeterminate `v-progress-linear` with `aria-label="Loading contact"`.
- Unknown id (`getContactById` returns `null`): a warning alert `Contact not found.` and `Back to Contacts`.
- Any other load failure: an error alert and `Back to Contacts`. A `ProblemDetailsError` shows its detail, else its title, else `Could not load the contact.`; any other error shows `Could not load the contact.`. The error is written to `console.error`.
- Loaded: `ContactForm` pre-filled with the contact (the birthday through `fromDateOnly`) and the submit label `Save`. Its `save` calls `updateContact` and navigates to `/contacts`. Cancel and `Back to Contacts` navigate to `/contacts`.
- Leaving the page aborts the load (`onBeforeUnmount`).

## 6. Validation Rules

Source: `src/AddressBook.Vue/src/rules/contactRules.ts`

The rules mirror `ContactRules` in `AddressBook.Contracts` ([Contracts spec, section 6](AddressBook.Contracts.md#6-shared-validation-rules)) and the data annotations of the Blazor form model, so both frontends and the API accept the same values and show the same messages. A rule is a Vuetify field rule: a function that returns `true` or the message.

| Field | Rule | Message |
|---|---|---|
| First name, Last name | not empty or whitespace-only | `The First name field is required.` / `The Last name field is required.` |
| First name, Last name | at most `NAME_MAX_LENGTH` (30) characters as typed | `The field First name must be a string with a maximum length of 30.` (same form for Last name) |
| Birthday | empty, or not later than the current UTC date | `Birthday cannot be in the future` (`BIRTHDAY_IN_FUTURE_MESSAGE`) |

| Export | Behaviour |
|---|---|
| `nameRules(displayName)` | The two name rules with the field name in the messages |
| `birthdayRules` | The birthday rule |
| `todayUtc(now?)` | The current UTC calendar date as a `Date` at local midnight |
| `isBirthdayNotInFuture(birthday, now?)` | Compares `yyyy-MM-dd` strings of the birthday and `todayUtc` |

The birthday rule compares with the **UTC** date, like the API. East of UTC, between local midnight and UTC midnight, the local "today" is refused.

## 7. Layout and Shared UI

### 7.1 `App.vue`

Calls `provideErrorBanner()` and renders `v-app` > `MainLayout` > `router-view`.

### 7.2 `layouts/MainLayout.vue`

- `v-app-bar` (elevation 1) with the drawer toggle (`aria-label="Toggle navigation drawer"`, `data-testid="app-drawer-toggle"`), the title `Contact Book` and the theme toggle (`aria-label="Toggle dark/light mode"`, `data-testid="app-theme-toggle"`).
- The theme toggle switches the Vuetify theme between `light` and `dark`; its icon is `mdi-weather-night` in light mode and `mdi-theme-light-dark` in dark mode.
- `v-navigation-drawer` (`id="nav-drawer"`, open by default) hosts `NavMenu`. The app bar comes first in the template, so the drawer is clipped under it.
- `v-main` > `v-container` renders `ErrorBanner` and then the page (`<slot />`).

### 7.3 `components/NavMenu.vue`

A `v-list nav role="group"` with the links `Home` (`/`, exact match, `data-testid="nav-home"`) and `Contacts` (`/contacts`, `data-testid="nav-contacts"`).

### 7.4 Error banner (`composables/useErrorBanner.ts`, `components/ErrorBanner.vue`)

The counterpart of the cascading `Error` component.

| Member | Behaviour |
|---|---|
| `provideErrorBanner()` | Creates the banner state and provides it to the descendants of the caller (`App.vue`) |
| `useErrorBanner()` | Injects the banner; throws when no ancestor provides it |
| `message` | Read-only text of the banner; empty hides it |
| `processError(message)` | Shows a plain message |
| `processProblem(problem)` | Shows the problem's `extensions` as indented JSON; `null` for no problem |
| `clear()` | Hides the banner |

`ErrorBanner.vue` renders a flat error `v-alert` (`data-testid="error-banner"`) with the heading `Woops!` and the message in a `<pre>`, only while `message` is not empty.

### 7.5 `directives/inputTestId.ts`

`v-input-test-id="'id'"` puts `data-testid` on the native `<input>` inside a Vuetify field. Vuetify keeps `data-*` attributes on the field's root element, while the tests type into and blur the `<input>`.

### 7.6 `ContactForm.vue`

The contact form of the Create and Edit pages; the Blazor frontend repeats this markup in both pages.

| API | Type | Purpose |
|---|---|---|
| `v-model` (`defineModel`) | `ContactFormModel` | The edited contact, owned by the page |
| `submitLabel` | `string` | Text of the submit button |
| `save` | `(model) => Promise<void>` | Saves the valid model; throwing shows the error on the form |
| `cancel` event | — | Emitted by Cancel |

- Layout: `v-row` > `v-col cols="12" sm="7"` > `v-card` with `First name`, `Last name`, `BirthdayPicker`, the error summary, and the submit and Cancel buttons.
- `v-form validate-on="blur"`: a field validates when it loses focus; submit validates all fields and calls `save` only when every field is valid.
- The submit button is disabled while `save` runs.
- An error thrown by `save` is mapped by `toContactFormErrors` (`contactFormErrors.ts`):

  | Error | Shown as |
  |---|---|
  | Problem with an `errors` map | Each `FirstName` / `LastName` / `Birthday` entry (key matched case-insensitively) under its field; every other entry in the summary |
  | Problem without `errors` | One summary message: its detail, else its title, else `The request failed.` |
  | Any other error | One summary message: the error's message |

- The server errors stay until the next submit.
- Test ids: `contact-form-first-name`, `contact-form-last-name`, `contact-form-birthday` (on the inputs), `contact-form-submit`, `contact-form-cancel`.

### 7.7 `BirthdayPicker.vue`

A `v-date-input`, the counterpart of `MudDatePicker`:

- `update-on` is empty, so the input is read-only and a date comes only from the calendar; clicking the input or pressing Enter opens it.
- `max` is `todayUtc()`: the days after the UTC today are disabled.
- The value shows as `M/D/YYYY`, the placeholder of the focused empty input.
- It applies `birthdayRules` and shows the server errors passed in `errorMessages`.

### 7.8 Theme and styles

- `plugins/vuetify.ts` starts in the `light` theme and sets its `medium-emphasis-opacity` to 0.7; the default 0.6 leaves field labels below the WCAG AA contrast ratio of 4.5:1 on white.
- `styles/main.css` sets the body background and text colour from the active theme.
- Component styles are `<style scoped>`.

## 8. Accessibility

The a11y spec of the UI E2E suite (`src/UiTests/tests/a11y/accessibility.spec.ts`) runs for this frontend too. The code carries three fixes for Vuetify's default markup:

| Fix | Source | Reason |
|---|---|---|
| `role="group"` on the nav list | `NavMenu.vue` | Vuetify gives the list `role="list"` and its link items `role="link"`; a list must contain list items |
| The calendar menu's `aria-haspopup`, `aria-expanded`, `aria-controls` and `aria-owns` removed from the field wrapper | `BirthdayPicker.vue` (`menu-props`) | The wrapper `<div>`'s role does not support them |
| Light-theme `medium-emphasis-opacity` 0.7 | `plugins/vuetify.ts` | Field labels reach AA contrast |

The icon-only buttons carry `aria-label`s (`Edit contact`, `Delete contact`, the pager buttons, the app-bar toggles).

## 9. Tests

### 9.1 Component and unit tests (Vitest)

The counterpart of `src/AddressBook.Web.Tests` (bUnit). The tests run on Vitest, `@vue/test-utils` and jsdom; they need no browser and no API.

| Item | Value |
|---|---|
| Location | `tests/`, in the folder layout of `src/`, as `*.spec.ts` |
| Config | `vitest.config.ts` (merges `vite.config.ts`): `environment: 'jsdom'`, `setupFiles: ['tests/setup.ts']`, `css: false`, `testTimeout: 20000`, Vuetify inlined |
| Setup | `tests/setup.ts` stubs `ResizeObserver`, `IntersectionObserver`, `matchMedia`, `visualViewport` and `scrollTo` |
| Mounting | `tests/helpers/mountWithApp.ts`: `mountWithApp()` mounts a component with the real Vuetify, a memory-history router and the error banner; `createTestRouter()`; `waitForRoute()` |
| API | Page tests mock `@/api/contactsApi` with `vi.mock`; API-client tests stub `fetch` with the `Response` factories of `tests/helpers/responses.ts` |
| Time | Time-dependent rules use fake timers with a fixed system time |
| Coverage | `npm run test:coverage`: V8 over `src/**` (without `main.ts` and declaration files); fails below 85 % lines or 70 % branches |

Run and conventions: [src/AddressBook.Vue/README.md](../../src/AddressBook.Vue/README.md#tests); coding standard: [vue.instructions.md](../../.github/instructions/vue.instructions.md).

### 9.2 UI E2E tests (Playwright)

The shared suite `src/UiTests` runs every spec against this frontend as the Playwright project `vue` (`VUE_BASE_URL`, default `http://localhost:4173/`). Its `webServer` builds the app and serves it with `vite preview` (`npm run build && npm run preview`), so `npm ci` in `src/AddressBook.Vue` is needed once. Only the component objects in `src/UiTests/src/components/vue/` know the Vuetify markup. See [src/UiTests/README.md](../../src/UiTests/README.md).

### 9.3 CI

| Workflow | Runs |
|---|---|
| `.github/workflows/vue-tests.yml` | `npm ci`, lint, format check, build, Vitest with coverage; on pull requests and pushes to `main` that touch the app or the workflow |
| `.github/workflows/ui-tests.yml` | The Playwright UI suite, both projects |
| `.github/workflows/security.yml` | `npm audit` of this project among the others |

Details: [Architecture.md, CI/CD](Architecture.md#7-cicd).

## 10. Deliberate Differences from the Blazor Frontend

These differences were decided; the rest of the behaviour matches [AddressBook.Web.md](AddressBook.Web.md).

| Topic | Vue | Blazor |
|---|---|---|
| Text of a failed list load | The problem's detail, else its title, else the error's message | The exception's message |
| Position of the error banner | Top of the main area, under the app bar | Above the whole layout (`Error` wraps the app) |
| Server error keys that are not form fields | Shown in the form's summary | Stored under their key, where no field and not the summary shows them |
| Search commit | On blur, on Enter and on clear | On blur and on clear |
| Serving for E2E | Production build through `vite preview`; the dev server answers 504 "Outdated Optimize Dep" on a first load while it re-optimises Vuetify's lazily imported components | `dotnet run --launch-profile https` |
| Accessibility fixes | Nav list `role="group"`, picker wrapper without popup ARIA, light-theme medium-emphasis opacity 0.7 ([section 8](#8-accessibility)) | MudBlazor's markup |

Other differences follow from the stack:

| Topic | Vue | Blazor |
|---|---|---|
| Fallback problem title when the status text is empty | `HTTP <status>` | The `HttpStatusCode` name |
| Contact form | One `ContactForm.vue` used by both pages | The markup is repeated in `CreateContact.razor` and `EditContact.razor` |
| API base URL | Fixed at build time (`VITE_API_PREFIX`) | Read at run time (`API_Prefix` in `appsettings.json`) |
| Load-error log | `console.error` | `ILogger` |

## 11. File Structure Reference

### Root and startup
- `src/AddressBook.Vue/index.html`
- `src/AddressBook.Vue/src/main.ts`
- `src/AddressBook.Vue/src/App.vue`
- `src/AddressBook.Vue/src/config.ts`
- `src/AddressBook.Vue/src/plugins/vuetify.ts`
- `src/AddressBook.Vue/src/styles/main.css`
- `src/AddressBook.Vue/env.d.ts`

### Build and tooling
- `src/AddressBook.Vue/package.json`
- `src/AddressBook.Vue/vite.config.ts`
- `src/AddressBook.Vue/vitest.config.ts`
- `src/AddressBook.Vue/eslint.config.ts`
- `src/AddressBook.Vue/.prettierrc.json`
- `src/AddressBook.Vue/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tsconfig.vitest.json`
- `src/AddressBook.Vue/.env.development`

### Routing
- `src/AddressBook.Vue/src/router/index.ts`

### Pages
- `src/AddressBook.Vue/src/pages/HomePage.vue`
- `src/AddressBook.Vue/src/pages/ContactsPage.vue`
- `src/AddressBook.Vue/src/pages/CreateContactPage.vue`
- `src/AddressBook.Vue/src/pages/EditContactPage.vue`
- `src/AddressBook.Vue/src/pages/NotFoundPage.vue`

### Layout and components
- `src/AddressBook.Vue/src/layouts/MainLayout.vue`
- `src/AddressBook.Vue/src/components/NavMenu.vue`
- `src/AddressBook.Vue/src/components/ErrorBanner.vue`
- `src/AddressBook.Vue/src/components/TablePager.vue`
- `src/AddressBook.Vue/src/components/ContactForm.vue`
- `src/AddressBook.Vue/src/components/contactFormErrors.ts`
- `src/AddressBook.Vue/src/components/BirthdayPicker.vue`

### Shared state, directives and rules
- `src/AddressBook.Vue/src/composables/useErrorBanner.ts`
- `src/AddressBook.Vue/src/directives/inputTestId.ts`
- `src/AddressBook.Vue/src/rules/contactRules.ts`

### API client
- `src/AddressBook.Vue/src/api/types.ts`
- `src/AddressBook.Vue/src/api/problemDetails.ts`
- `src/AddressBook.Vue/src/api/http.ts`
- `src/AddressBook.Vue/src/api/contactsApi.ts`

### Tests
- `src/AddressBook.Vue/tests/setup.ts`
- `src/AddressBook.Vue/tests/helpers/mountWithApp.ts`, `responses.ts`
- `src/AddressBook.Vue/tests/**/*.spec.ts`
