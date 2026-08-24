# Issue #136 (bug) — MudTablePager rows-per-page select has no accessible name

**Issue:** [#136](https://github.com/askrinnik/AddressBook2025/issues/136) — labelled `bug`, `ui`, `dependencies`.
Follow-up to [#132](https://github.com/askrinnik/AddressBook2025/issues/132) (PR #134) for the one a11y
violation that could not be fixed in our markup at the time.

## Reproduced failure

Made the Contacts a11y baseline strict (`contacts: new Set<string>()`) and ran
`tests/a11y/accessibility.spec.ts` against the running app:

```
[serious] aria-input-field-name: ARIA input fields must have an accessible name
  node: <div class="mud-input-slot …" role="combobox" aria-haspopup="listbox" …>
```

The offending node is the rows-per-page `<MudSelect>` combobox rendered **inside** MudBlazor's
`MudTablePager` on `/contacts`. WCAG 4.1.2, axe rule `aria-input-field-name`.

## Root cause

`MudTablePager` builds its rows-per-page `<MudSelect>` internally with a fixed set of attributes and
**no** `aria-label` / `aria-labelledby` / `Label`, and exposes **no parameter** to set one. The
`role="combobox"` element therefore has no accessible name.

**The issue's suggested resolution path — "upgrade MudBlazor" — is not available.** Verified
empirically:

- Bumped `AddressBook.Web` to **MudBlazor 9.8.0** (latest), rebuilt, re-ran the strict scan → the
  violation is **identical**; the upgrade does not fix it.
- The unreleased **`dev`** branch of `MudTablePager.razor` still renders the same `<MudSelect>` with
  no accessible-name attribute.

So there is no released or pending MudBlazor version that labels the pager select. The fix must live
in our markup. MudBlazor stays at **9.7.0** (the upgrade is not the fix and is out of scope here).

## Fix approach (Web only — root cause)

Replace the pager's unlabeled built-in rows-per-page control with our own, labeled one — the option
#132 rejected as "removes the control" is only a regression when nothing replaces it; pairing
`HideRowsPerPage` with our own labeled select keeps full functionality **and** gives the combobox an
accessible name. MudBlazor components only, no JS interop.

**`src/AddressBook.Web/Pages/Contacts.razor`** — in `PagerContent`:

- Set `<MudTablePager HideRowsPerPage="true" />` so the built-in (unlabeled) select is gone; the
  pager keeps its `X-Y of Z` caption and the first/prev/next/last nav buttons.
- Add our own rows-per-page control ahead of the pager, right-aligned to mimic the stock layout:
  - a visible caption `Rows per page:` (reuse MudBlazor's `mud-table-pagination-caption` class);
  - `<MudSelect T="int" aria-label="Rows per page" Class="mud-table-pagination-select" Dense="true"
    Underline="false" …>` with items `10, 25, 50, 100` (the stock `PageSizeOptions` default).
  - `aria-label` is the accessible name that clears the axe rule (verified — see Verification). The
    `mud-table-pagination-select` class is kept so styling **and** the existing UI-test locator keep
    working unchanged.

**`src/AddressBook.Web/Pages/Contacts.razor.cs`**:

- `private int _rowsPerPage = 10;` and `private static readonly int[] PageSizeOptions = [10, 25, 50, 100];`.
- `OnRowsPerPageChanged(int rows)` → set `_rowsPerPage`, call `_contactTable.SetRowsPerPage(rows)`
  (public `MudTableBase` API; it updates the page size and triggers `ServerReload`).

Why not the other closures (unchanged from #132): a JS-interop `aria-label` poke is fragile against
MudTable's server-reload re-renders and violates the project's "MudBlazor-only / no ad-hoc JS DOM
poking" convention; bare `HideRowsPerPage` removes the control (UX regression).

## Tests (regression guard)

- **A11y (the fix):** tighten the Contacts baseline in
  `src/UiTests/tests/a11y/accessibility.spec.ts` from `new Set(['aria-input-field-name'])` to
  `new Set<string>()` (strict zero, like Home/Create), and update the file's header/`KNOWN_VIOLATIONS`
  comments so they describe the resolved state instead of the upstream tolerance. The existing
  `Contacts (populated) …` scan then enforces **zero** WCAG A/AA violations on `/contacts`.
- **Functionality (no regression):** the existing
  `src/UiTests/tests/contacts/sort-paginate.spec.ts` test *"rows-per-page can show every matching row
  on one page"* already drives this control via `.mud-table-pagination-select` (page object
  `ContactsTable.setRowsPerPage`). Keeping that class means it exercises the new select unchanged and
  must stay green; the rest of `sort-paginate` confirms the pager caption / Next-Prev still work.
- **Accessible-name lock (added):** extend that same functional test with one explicit assertion —
  `expect(page.getByRole('combobox', { name: 'Rows per page' })).toBeVisible()` — so the accessible
  name is pinned by a role+name query, not only by the generic axe scan.

## Verification

1. Spike already confirmed (on a throwaway edit, since reverted) that `aria-label="Rows per page"`
   alone flips the strict Contacts scan from **1 failed** to **1 passed** — the labeled select clears
   `aria-input-field-name`.
2. Stop dev servers, `dotnet build src/AddressBook.sln` (clean).
3. Run the UI suite (`src/UiTests`) via its Playwright `webServer`: the whole suite green — the
   Contacts a11y scan now reports zero, and `sort-paginate` (incl. the rows-per-page test) passes.
4. Re-walk `/contacts` in a real browser (`verify-feature`): the rows-per-page dropdown is present,
   labeled, changes the page size, and the console/network are clean.

## Out of scope

- Upgrading MudBlazor (does not fix this; a separate concern).
- Any a11y work beyond the `aria-input-field-name` violation on `/contacts`.
