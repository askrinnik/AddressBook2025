# Issue #101 (U10) — `tests/smoke/app-shell.spec.ts`

> **Type:** Test-authoring (UI E2E). Part of the `src/UiTests` framework plan, Phase 2.
> **Mode:** Test-authoring — the Playwright spec is the deliverable; **no production code** changes.
> **Deliverable:** `src/UiTests/tests/smoke/app-shell.spec.ts` + this plan file.

## 1. Requirement

Add the first smoke spec for `AddressBook.Web`, exercising the application shell (`MainLayout` +
`NavMenu`) through the real browser:

- Application loading (Blazor WASM boots and the shell renders).
- Navigation Home ↔ Contacts.
- Theme switching (light ↔ dark).
- Drawer toggle (open ↔ closed).
- Page titles (Home / Contacts).

All behaviour under test **already exists** in `AddressBook.Web`; U4 already added the required
`data-testid`s and U7/U8/U9 already built the component/page objects and fixtures. This task only
authors the spec on top of that infrastructure.

## 2. Facts the spec relies on (from the source)

- `MainLayout.razor`: app bar shows **"Contact Book"**; drawer starts **open** (`_drawerOpen = true`);
  theme starts **light** (`_isDarkMode = false`); toggles are the `app-drawer-toggle` and
  `app-theme-toggle` icon buttons; drawer is `#nav-drawer` with `ClipMode.Always` (stays open across
  navigation).
- `NavMenu.razor`: **Home** (`nav-home`, `Href=""` → `/`) and **Contacts** (`nav-contacts`,
  `Href="/contacts"`).
- `Home.razor`: `<PageTitle>Home</PageTitle>`, heading `Contacts application`.
- `Contacts.razor`: `<PageTitle>Contacts</PageTitle>`.

## 3. Reused infrastructure (no new production or framework code)

- **Fixtures** (`src/fixtures/test-fixtures.ts`): `homePage`, `contactsPage`, `appShell`, plus the base
  `page`.
- **AppShell component** (`components/app-shell.component.ts`): `appBarTitle`, `homeLink`,
  `contactsLink`, `drawerToggle`, `themeToggle`, `toggleDrawer()`, `toggleTheme()`, `gotoHome()`,
  `gotoContacts()`, `isDrawerOpen()`, `isDarkMode()`.
- **Page objects**: `HomePage.goto()` / `HomePage.heading`; `ContactsPage.goto()`.
- **Blazor readiness**: handled inside `BasePage.open()` → `waitForBlazorReady`.

No `data-testid`, component, page, or fixture changes are needed — if any prove missing while writing
the spec, I will stop and report it as a separate gap rather than adding it here.

## 4. Acceptance criteria

| # | Criterion | How verified |
|---|---|---|
| 1 | The app loads: the shell renders (app bar "Contact Book" + Home content visible) | Spec: `homePage.goto()` then assert `appShell.appBarTitle` and `homePage.heading` visible |
| 2 | Home page title is **Home** | Spec: `expect(page).toHaveTitle('Home')` on `/` |
| 3 | Contacts page title is **Contacts** | Spec: `expect(page).toHaveTitle('Contacts')` on `/contacts` |
| 4 | Navigate Home → Contacts via the nav link | Spec: from Home, `appShell.gotoContacts()`, assert URL `/contacts` + title `Contacts` |
| 5 | Navigate Contacts → Home via the nav link | Spec: from Contacts, `appShell.gotoHome()`, assert URL `/` + Home heading visible |
| 6 | Drawer toggles closed then open | Spec: drawer starts open; toggle → `isDrawerOpen()` false; toggle → true (polled) |
| 7 | Theme toggles dark then light | Spec: theme starts light; toggle → `isDarkMode()` true; toggle → false (polled) |

## 5. Tests (the deliverable)

New file `src/UiTests/tests/smoke/app-shell.spec.ts`, importing `{ expect, test }` from the U9
fixtures. Structure with `test.describe('smoke — app shell', …)` and clear scenario names.

Cases:

1. **loads the app shell** — `homePage.goto()`; assert `appShell.appBarTitle` visible and
   `homePage.heading` ("Contacts application") visible. (AC 1)
2. **Home has the "Home" page title** — on `/`, `await expect(page).toHaveTitle('Home')`. (AC 2)
3. **Contacts has the "Contacts" page title** — `contactsPage.goto()`,
   `await expect(page).toHaveTitle('Contacts')`. (AC 3)
4. **navigates Home → Contacts** — `homePage.goto()`, `appShell.gotoContacts()`; assert URL matches
   `/contacts$` and title is `Contacts`. (AC 4)
5. **navigates Contacts → Home** — `contactsPage.goto()`, `appShell.gotoHome()`; assert URL is the
   app root and `homePage.heading` visible. (AC 5)
6. **toggles the navigation drawer** — `homePage.goto()`; drawer starts open; `toggleDrawer()` →
   `expect.poll(isDrawerOpen)` false; `toggleDrawer()` → true. (AC 6)
7. **toggles the theme** — `homePage.goto()`; theme starts light; `toggleTheme()` →
   `expect.poll(isDarkMode)` true; `toggleTheme()` → false. (AC 7)

Conventions followed (`playwright-conventions`): web-first, auto-waiting assertions only
(`toBeVisible`, `toHaveURL`, `toHaveTitle`); the two boolean shell signals wrapped in `expect.poll`
(no `waitForTimeout`); scenarios grouped in a `describe`; no data seeding (the shell is static, so
`contactsApi` / Create→Verify→Delete does not apply here).

## 6. Out of scope

- Contacts list/search/sort/paginate/CRUD/validation — covered by U11–U17.
- Accessibility (axe-core) — U18.
- Any production or framework (`src/UiTests/src/**`) change — none expected.

## 7. Verification

1. Start the API (`run-api`) — the Web dev config points at `http://localhost:5000/api/`; the
   `webServer` block also starts both servers if not already running.
2. `npm run lint` in `src/UiTests` — clean.
3. `npm test -- tests/smoke/app-shell.spec.ts` — all cases green.
4. `dotnet build src/AddressBook.sln` — unaffected (no C# change), confirmed green.
