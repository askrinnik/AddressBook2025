# Implementation plan — Issue #98 (UI Tests U7)

**Title:** UI Tests U7: component objects для MudBlazor
**Phase:** 1 — Инфраструктура (framework build-out, see [ui-tests-framework-plan.md](ui-tests-framework-plan.md))
**Mode:** Test-authoring (infrastructure). **No production code.** The behaviour these objects drive already exists in `AddressBook.Web`; U7 delivers the reusable component wrappers, exactly as U5/U6 delivered the API wrapper and data factories.

## 1. Requirement

Add the `components/*` layer of the UI-test framework: thin, reusable **component objects** that encapsulate the fragile parts of the MudBlazor markup so page objects (U8), fixtures (U9), and specs (U10+) can drive the UI without touching Material-specific selectors. Five components, per the issue body and §4 of the framework plan:

| File | Wraps | Drives (Razor source) |
|---|---|---|
| `app-shell.component.ts` | `MudAppBar` + `MudDrawer` + `NavMenu` | `Layout/MainLayout.razor`, `Layout/NavMenu.razor` |
| `contacts-table.component.ts` | `MudTable` (server-reload) | `Pages/Contacts.razor` |
| `contact-form.component.ts` | `EditForm` + `MudTextField`s + validation | `Pages/CreateContact.razor`, `Pages/EditContact.razor` |
| `date-picker.component.ts` | `MudDatePicker` (popover calendar) | the `Birthday` field of the form |
| `confirm-dialog.component.ts` | `MudMessageBox` (delete confirmation) | the delete dialog in `Pages/Contacts.razor` |

## 2. Acceptance criteria

One line per observable behaviour the deliverable must satisfy:

1. **AC1 — app-shell**: exposes lazy locators + actions for the app bar title, drawer toggle, theme toggle, and Home/Contacts nav links; `toggleDrawer`/`toggleTheme`/`gotoHome`/`gotoContacts` work against the running app; drawer-open and dark-mode state are readable via a method that hides the MudBlazor detail.
2. **AC2 — contacts-table**: exposes create button, search field, per-row (id-suffixed) row/edit/delete locators, column sort, and pager; `search`/`clearSearch`, `clickCreate`, `clickEdit(id)`/`clickDelete(id)`, `sortBy(...)`, pager next/prev/rows-per-page, and a server-reload-aware `waitForLoaded()` all work; "no matching records" state is detectable (matching the literal quoted text the page renders).
3. **AC3 — contact-form**: fills First/Last name, sets Birthday (delegating to the date-picker component), submits and cancels; reads per-field validation errors and the validation-summary list; a single `fill(command)` accepts a `CreateContactCommand` (with `birthday: string | null`).
4. **AC4 — date-picker**: opens the popover and selects an arbitrary ISO date (`YYYY-MM-DD`) via the calendar (year → month → day), reads the displayed value, and encapsulates every MudDatePicker-specific selector in this one file.
5. **AC5 — confirm-dialog**: exposes the Warning title, the confirmation message, and Yes/Cancel; `confirm()`/`cancel()` and open/closed waits work against the real `MudMessageBox`.
6. **AC6 — conventions**: lazy locators only (no stored raw selector strings passed around; `getByRole`/`getByLabel` → `getByTestId` → CSS-as-last-resort priority per the plan); reuses `TestIds`/`contactRow`/`contactEditButton`/`contactDeleteButton` from `utils/testids.ts`; no `waitForTimeout`; web-first assertions/auto-waiting locators.
7. **AC7 — quality gate**: `npx tsc --noEmit` clean and `npm run lint` exit 0; each component is proven to resolve its locators and perform its actions against the live API+Web via a **throwaway** spec that is removed afterwards (no `tests/` committed) — matching the U5/U6 verification bar.

## 3. Affected files

All new, under `src/UiTests/src/components/` (folder is new):

- `app-shell.component.ts` — `AppShell`
- `contacts-table.component.ts` — `ContactsTable`
- `contact-form.component.ts` — `ContactForm` (composes `DatePicker`)
- `date-picker.component.ts` — `DatePicker`
- `confirm-dialog.component.ts` — `ConfirmDialog`

Docs:

- `docs/tasks/ui-tests-framework-plan.md` — tick the **U7** checkbox `[x]`.
- `docs/tasks/issue-98-component-objects.md` — this plan.

No production code, no `src/ApiTests` changes, no `tests/` files committed.

## 4. Approach

Test-authoring mode, so the order is: **verify DOM → components → prove → clean up**. There is no domain/data/contracts/API/Web slice.

**Shared shape.** Every component takes `constructor(private readonly page: Page)` and exposes:
- `readonly` lazy-locator **getters** returning `Locator` (built fresh each access — no stored resolved elements), and
- `async` **action** methods (auto-waiting, web-first; no `waitForTimeout`).

Locator priority follows the plan: role/label first, then `getByTestId(...)` (the U4 constants), CSS class only where MudBlazor exposes nothing else (calendar popover internals, drawer-open class, theme signal). Any MudBlazor CSS class used lives as a documented `const` inside the one component that owns it, so Material fragility stays in a single place (the plan's core goal).

**`AppShell`** — getters: `appBarTitle`, `drawerToggle`, `themeToggle`, `homeLink`, `contactsLink`, `drawer`. Actions: `toggleDrawer()`, `toggleTheme()`, `gotoHome()`, `gotoContacts()`. State: `isDrawerOpen()` (MudDrawer open class), `isDarkMode()` (MudBlazor dark-mode signal). Uses `TestIds.drawerToggle/themeToggle/navHome/navContacts`. The exact drawer-open class and the dark-mode signal are confirmed empirically (step 6) and encapsulated here.

**`ContactsTable`** — root `getByTestId(TestIds.contactsTable)`. Getters: `createButton`, `searchInput` (inner `input` of the search field), `noRecords` (substring match — the page renders the label wrapped in literal quotes `"No matching records found"`), `bodyRows`. Row helpers reuse the U4 id-suffixed constants: `rowById(id)` (the `<tr>` that contains `getByTestId(contactRow(id))`), `editButton(id)`, `deleteButton(id)`. Actions: `clickCreate()`, `search(term)`, `clearSearch()` (the field is `Clearable`), `clickEdit(id)`, `clickDelete(id)`, `sortByFirstName()/sortByLastName()/sortByBirthday()` (MudTableSortLabel), `nextPage()/previousPage()/setRowsPerPage(n)` (MudTablePager), `waitForLoaded()` (waits the `Loading...` content to detach — the server-reload race guard), `rowCount()`.

**`ContactForm`** — getters: `firstName`/`lastName` (inner `input` of the id-suffixed text fields), `submitButton`, `cancelButton`, `validationSummary` (`.validation-errors` list). Composes `DatePicker` for Birthday. Actions: `fillFirstName(v)`, `fillLastName(v)`, `setBirthday(iso)`, `submit()`, `cancel()`, `fill(command)` (fills names, sets birthday when non-null). Reads: `errorFor('firstName'|'lastName')` (the field's `.mud-input-error` helper text) and `summaryErrors()` (the `.validation-message` items).

**`DatePicker`** — `constructor(page, triggerTestId = TestIds.contactFormBirthday)`. Getters: `input` (the picker's value input), `popover` (page-level, rendered by `MudPopoverProvider`). Actions: `open()`, `selectDate(iso)` (open → toolbar year → target year → month → day, all via encapsulated `.mud-picker-*`/`.mud-day` selectors confirmed empirically), `value()` (displayed text). This is the single home for all MudDatePicker fragility.

**`ConfirmDialog`** — getters: `dialog` (the `MudMessageBox`/`MudDialog` surface), `title` (`Warning`), `message` (`Are you sure you want to delete this contact?`), `confirmButton` (`getByTestId(TestIds.contactDeleteConfirm)` = the destructive `Yes`), `cancelButton` (by accessible name `Cancel`). Actions: `confirm()`, `cancel()`, `waitUntilOpen()`, `waitUntilClosed()`.

**EF Core migration:** none (no schema/data change).

## 5. Tests

Per the workflow's test-authoring mode: **the component objects themselves are the deliverable; no permanent spec is added in U7** (specs are U10–U17). Consistent with U5/U6, correctness is proven with a **throwaway** spec that drives each component against the live API+Web and is deleted before commit — nothing under `tests/` is committed. This is stated explicitly rather than skipped silently.

The throwaway spec will, at minimum:
- **app-shell**: load the app, toggle drawer (assert open-state flips), toggle theme (assert dark-mode flips), navigate Home↔Contacts (assert URL).
- **contacts-table**: seed a contact via `ContactsApi`, `search(token)`, assert its `rowById(id)` visible, `sortBy*`, pager present, `clearSearch()`, then assert absence after cleanup.
- **contact-form**: open `/create-contact`, `fill(validContact())` incl. birthday via date-picker, assert the input value; trigger `[Required]` and read `errorFor('firstName')`.
- **date-picker**: `selectDate('1985-03-12')`, assert displayed value.
- **confirm-dialog**: seed a contact, `clickDelete(id)`, assert title/message, `cancel()` (still present), `clickDelete(id)` again, `confirm()`, assert row gone.

Every seeded contact is deleted via `ContactsApi` in teardown (Create → Verify → Delete isolation, unique run-token names).

## 6. Verification (how each AC is checked)

1. `npx tsc --noEmit` — clean (AC7).
2. `npm run lint` — exit 0 (AC7).
3. Start API (`run-api`) + Web (`https` profile) and run the throwaway spec (`run-tests` style) — all pass, each component exercised (AC1–AC5). This run is also where the empirically-confirmed DOM details (drawer-open class, dark-mode signal, MudDatePicker popover selectors, MudMessageBox surface, sort-label/pager locators, and where `data-testid` lands vs. the inner `input`) are locked in.
4. Manual read-through confirms lazy locators, `TestIds` reuse, no `waitForTimeout`, locator priority (AC6).
5. Delete the throwaway spec; re-run `tsc`/`lint` on the final state; confirm no `tests/` committed (AC7).

## 7. Out of scope / follow-ups

- **No production `.razor`/`.cs` changes** — all `data-testid`s needed already exist (added in U4).
- **Page objects** that compose these components — **U8** (#99).
- **Fixtures** (`test.extend`, `contactsApi`, `data`, auto-cleanup) and `utils/assertions.ts` / `utils/blazor.ts` — **U9** (#100).
- **Permanent specs** — **U10–U17**.
- **a11y**, **README**, **CI** — U18–U21.
- Optional `MudTextField` standalone wrapper mentioned in plan §2 is **not** broken out separately — text-field interaction is small and lives inline in `ContactForm`/`ContactsTable`; a separate wrapper would be indirection without reuse. Called out here so the deviation from the plan's prose is explicit.
