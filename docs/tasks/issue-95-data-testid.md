# Implementation plan — Issue #95: UI Tests U4: add `data-testid` to AddressBook.Web + `utils/testids.ts`

- **Issue:** [#95](https://github.com/askrinnik/AddressBook2025/issues/95) — *UI Tests U4: добавить data-testid в AddressBook.Web + utils/testids.ts*
- **Parent plan:** [docs/tasks/ui-tests-framework-plan.md](ui-tests-framework-plan.md) — Фаза 1 (U4, enabler)
- **Depends on:** U1–U3 (merged)
- **Type:** enabler — **first task touching production code** (Blazor markup) + a test-side constants module
- **Labels:** none

## 1. Requirement

MudBlazor renders the icon-only Edit/Delete buttons with **no accessible name and no stable
selector**, which makes them (and several other controls) hard to target reliably from Playwright.
Add unobtrusive `data-testid` attributes (via MudBlazor `UserAttributes` pass-through) to the key
interactive controls, and centralise the matching constants in `src/UiTests/src/utils/testids.ts`.

## 2. Acceptance criteria

| # | Control | File | testid |
|---|---|---|---|
| 1 | Edit icon button (per row) | `Pages/Contacts.razor` | `contact-edit-{id}` |
| 2 | Delete icon button (per row) | `Pages/Contacts.razor` | `contact-delete-{id}` |
| 3 | Row anchor (first cell, per row) | `Pages/Contacts.razor` | `contact-row-{id}` |
| 4 | Contacts table | `Pages/Contacts.razor` | `contacts-table` |
| 5 | Search field | `Pages/Contacts.razor` | `contacts-search` |
| 6 | "Create Contact" toolbar button | `Pages/Contacts.razor` | `contacts-create` |
| 7 | Delete-confirm "Yes" button | `Pages/Contacts.razor` (MudMessageBox) | `contact-delete-confirm` |
| 8 | First name / Last Name / Birthday fields | `Pages/CreateContact.razor`, `Pages/EditContact.razor` | `contact-form-first-name`, `contact-form-last-name`, `contact-form-birthday` |
| 9 | Submit (Create/Save) + Cancel | `Pages/CreateContact.razor`, `Pages/EditContact.razor` | `contact-form-submit`, `contact-form-cancel` |
| 10 | Drawer (hamburger) + theme toggles | `Layout/MainLayout.razor` | `app-drawer-toggle`, `app-theme-toggle` |
| 11 | Nav links Home / Contacts | `Layout/NavMenu.razor` | `nav-home`, `nav-contacts` |
| 12 | Centralised constants + id-helpers | `src/UiTests/src/utils/testids.ts` | — |
| 13 | Web builds clean; testids render in the running app | — | verified in browser |

## 3. Naming convention

- kebab-case, hierarchical `{area}-{control}` (`app-*`, `nav-*`, `contacts-*`, `contact-form-*`).
- Per-row controls are **id-suffixed** (`contact-edit-{id}`) so each row's control is unique on a
  shared DB with parallel runs.
- The **form submit** uses one testid (`contact-form-submit`) for both the create "Create" and the
  edit "Save" buttons: they are the same control in the shared form the U7 component object will
  wrap, and only one is ever on screen. Which page you are on is asserted by URL, not by this id.
- The delete dialog's **Cancel** keeps its visible text "Cancel" (MudMessageBox auto-renders it
  with no template slot to attach an attribute cleanly); tests locate it by accessible name. Only
  the destructive **Yes** button — which is already a custom template — gets a testid.

## 4. Approach

MudBlazor components capture unmatched attributes into `UserAttributes` and splat them onto their
root rendered element (`<button>`, `<a>`, `<td>`, table root, input wrapper). So adding a literal
`data-testid="…"` attribute directly on `<MudButton>`, `<MudIconButton>`, `<MudNavLink>`,
`<MudTextField>`, `<MudDatePicker>`, `<MudTable>`, `<MudTd>` is enough — no code-behind changes.

Order: Web markup only (no domain/data/contracts/API), then the test-side constants module.

- **`Layout/MainLayout.razor`** — add `data-testid` to the hamburger `MudIconButton` and the
  dark/light `MudIconButton`.
- **`Layout/NavMenu.razor`** — add `data-testid` to both `MudNavLink`s.
- **`Pages/Contacts.razor`** — add `data-testid` to: the delete `MudMessageBox` Yes `MudButton`;
  the "Create Contact" `MudButton`; the search `MudTextField`; the `MudTable`; the first-cell
  `MudTd` (`contact-row-{id}`); the Edit and Delete `MudButton`s (`contact-edit/delete-{id}`),
  using `@($"contact-edit-{context.Id}")` interpolation.
- **`Pages/CreateContact.razor`** and **`Pages/EditContact.razor`** — add `data-testid` to the two
  `MudTextField`s, the `MudDatePicker`, and the submit/cancel `MudButton`s.
- **`src/UiTests/src/utils/testids.ts`** — export a `TestIds` const object for the static ids and
  helper functions `contactRow(id)`, `contactEditButton(id)`, `contactDeleteButton(id)` for the
  id-suffixed ones, with a header comment noting the Razor markup is the counterpart and the two
  must be kept in sync.

No new MudBlazor components, no behaviour change, no EF migration.

## 5. Tests

**No Playwright specs in this task.** The specs that consume these testids are U10–U17; the shared
component/page objects that reference `testids.ts` are U7–U8. Adding specs now would be
out-of-scope for the enabler. `testids.ts` is authored here but not yet imported anywhere — that
is expected and is why the file is verified by `tsc`/lint, not by a spec.

This is a UI-only change with **no API change**, so no `src/ApiTests` additions are needed
(explicitly-justified no-API-test case per the workflow).

## 6. Build

`dotnet build src/AddressBook.slnx` — must succeed with no new warnings.

## 7. Verification (feature mode — browser walk, adapted)

Start the API + Web (via `run-api` + `dotnet run` for Web, or the `verify-feature` skill) and
inspect the live DOM for each testid:

| Group | How verified |
|---|---|
| App shell (drawer, theme, nav Home/Contacts) | Load any page; read DOM; confirm each `data-testid` is on the intended `<button>`/`<a>` |
| Contacts page (table, search, create button) | Load `/contacts`; confirm the three testids render |
| Create form (fields, submit, cancel) | Load `/create-contact`; confirm five testids render |
| Edit form (fields, submit, cancel) | Load `/edit-contact/{id}` for a seeded contact; confirm five testids render |
| Row controls (row anchor, edit, delete) + delete dialog Yes | Seed one contact via the API, load `/contacts`, confirm `contact-row/edit/delete-{id}` render; click Delete and confirm `contact-delete-confirm` renders in the dialog |
| `testids.ts` | `npx tsc --noEmit` + `npm run lint` in `src/UiTests` clean |

**Environment caveat:** the row/edit/delete/dialog checks need a running API (SQL Server). If the
API cannot start in this environment, those five testids are verified by markup inspection instead
and that fallback is flagged explicitly; the static-page testids are still verified live in the
browser.

## 8. Out of scope / follow-ups

Component/page objects that reference `testids.ts` (U7–U8), specs (U10–U17), any C#-side testid
constants (not requested — Razor uses literals kept in sync with `testids.ts`). No refactor of the
existing inline `@code` blocks in the pages (pre-existing; not in scope).
