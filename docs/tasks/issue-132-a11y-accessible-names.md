# Issue #132 (bug) — Icon buttons and MudTable rows-per-page select lack accessible names

**Issue:** [#132](https://github.com/askrinnik/AddressBook2025/issues/132) — labelled `bug`, `ui`.
**Discovered by:** the U18 a11y scans ([#109](https://github.com/askrinnik/AddressBook2025/issues/109) / PR #133).

## Reproduced failure

`@axe-core/playwright` scans (WCAG 2.0/2.1 A & AA) of the running app report, per page:

| Page | Rule | Impact | Offending nodes |
|---|---|---|---|
| `/` | `button-name` | critical | app-drawer-toggle, app-theme-toggle, more-options (`.mud-icon-button-edge-end`) |
| `/create-contact` | `button-name` | critical | same three app-bar buttons |
| `/contacts` | `button-name` | critical | the three app-bar buttons + per-row Edit + Delete |
| `/contacts` | `aria-input-field-name` | serious | `MudTablePager` rows-per-page select (`div[role=combobox]`) |

## Root cause

- **`button-name`** — MudBlazor **icon-only buttons** render a `<button>` whose only child is an SVG, with no text and no `aria-label`, so they expose no accessible name (WCAG 4.1.2). In our markup:
  - `Layout/MainLayout.razor` — the app-bar drawer toggle, theme toggle, and a (currently non-functional) `MoreVert` button, present on **every** page via the layout.
  - `Pages/Contacts.razor` — the per-row Edit/Delete `MudButton`s carry only a `StartIcon` and empty content.
- **`aria-input-field-name`** — the rows-per-page `<MudSelect>` **inside** `MudTablePager` renders a `role="combobox"` with no `aria-label`/`aria-labelledby`. In MudBlazor **9.7.0** this select has **no public parameter** to set an accessible name (confirmed against `MudTablePager` members and the component's markup — see the Contingency section). This is an upstream framework limitation, not our markup.

## Fix approach (Web only — root cause)

Add `aria-label` to the icon-only buttons (MudBlazor forwards unmatched attributes to the rendered element, exactly as the existing `data-testid`s do):

| File | Element | `aria-label` |
|---|---|---|
| `Layout/MainLayout.razor` | drawer toggle | `Toggle navigation drawer` |
| `Layout/MainLayout.razor` | theme toggle | `Toggle dark/light mode` |
| `Layout/MainLayout.razor` | more-options | `More options` |
| `Pages/Contacts.razor` | row Edit button | `Edit contact` |
| `Pages/Contacts.razor` | row Delete button | `Delete contact` |

Markup-only additions — no code-behind, DI, or behaviour changes. The `MoreVert` button stays (removing UI is a product decision out of this defect's scope); naming it resolves the violation. Its lack of an action is noted as a possible separate cleanup.

## Tests (regression guard)

The U18 suite `src/UiTests/tests/a11y/accessibility.spec.ts` is the regression guard — **tighten its `KNOWN_VIOLATIONS` baseline** so the scans now *enforce* what the fix delivers:

- `home` → `[]` (strict zero).
- `create` → `[]` (strict zero).
- `contacts` → `['aria-input-field-name']` only (see Contingency).

After the fix, a future re-introduction of any `button-name` violation fails the scan. No new spec file is needed — the a11y specs already exercise all three pages.

## Verification

- Stop dev servers, then `dotnet build src/AddressBook.slnx`.
- Run the a11y suite (`tests/a11y`) and the full UI suite via the webServer — all green; Home/Create now report zero, Contacts reports only the baselined pager rule.
- Re-walk `/`, `/contacts`, `/create-contact` in the browser; app-bar and row controls behave exactly as before.

## Contingency — `aria-input-field-name` (MudTablePager)

`MudTablePager` 9.7.0 exposes no parameter to label its rows-per-page select, and the select is created internally (we cannot pass attributes to it). The available "closures" are all worse than the defect:

- `HideRowsPerPage="true"` removes the control — a functional/UX regression.
- A JS-interop `aria-label` poke is fragile against MudTable's server-reload re-renders and violates the project's "MudBlazor components exclusively / no ad-hoc JS DOM poking" convention.

**Decision:** leave this single rule baselined for `/contacts` only, with an in-code note pointing here, and treat the real fix as upstream (MudBlazor) or a future MudBlazor upgrade. This is scoped to one rule on one page — every other page/rule is enforced at zero.

## Out of scope

- Removing or wiring up the non-functional `MoreVert` app-bar button.
- Upgrading MudBlazor or forking `MudTablePager` to fix the pager select.
- Broader a11y work beyond the accessible-name violations named in #132.
