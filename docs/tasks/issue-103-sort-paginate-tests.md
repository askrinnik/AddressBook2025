# Issue #103 (U12) — `tests/contacts/sort-paginate.spec.ts`

**Mode:** Test-authoring (Phase 2). The behaviour already exists in `AddressBook.Web`; the
Playwright UI specs are the deliverable. **No production code changes.**

## Requirement

Cover the Contacts list (`/contacts`) sorting, pagination and total-row plumbing with UI E2E tests:

- Sorting by **First Name**, **Last Name** and **Birthday** (ascending + descending).
- Pagination: **rows-per-page**, **next/prev** navigation.
- **TotalRows** shown by the pager.

## How the app behaves (verified in `Contacts.razor` / `Contacts.razor.cs`)

- `MudTable` with `ServerData="ServerReload"`. On every reload it fetches the **filtered** rows
  (`GetFilteredContactsAsync(_searchString)`), then **client-side** sorts the full filtered set by
  `state.SortLabel` (`fn_field` / `ln_field` / `bd_field`) in `state.SortDirection`, then pages it
  with `Skip(Page*PageSize).Take(PageSize)`.
- `TableData.TotalItems = response.TotalRows` → rendered by `MudTablePager` as the `X-Y of Z`
  caption. Because the fetch is filtered by the search string, `TotalRows` equals the count of rows
  matching the current search — this is what makes it deterministic per test.
- `MudTablePager` (MudBlazor 9.7.0) default: `RowsPerPage = 10`, options `{10, 25, 50, 100}`.
  Sort labels cycle unsorted → **ascending** (1st click) → **descending** (2nd click).

## Isolation strategy (shared SQL Server DB)

Same pattern as U11: each test mints `newTestToken()`, seeds contacts whose names embed the token
via the hybrid REST `contactsApi` fixture (auto-cleaned in teardown), then `table.search(token)` so
the list, `TotalRows`, sort and paging all operate on exactly this test's rows — immune to seed data
and parallel workers. Because the minimum page size is 10, the pagination tests seed **12** rows to
force a second page.

Sort order is asserted against the **First Name column** (values we fully control), never by parsing
the culture-formatted Birthday cell. For the birthday test the first names are deliberately *not* in
birthday order, so a correct result proves it sorted by birthday and not by name/id.

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/contacts/sort-paginate.spec.ts` | **New** spec — the deliverable. |
| `src/UiTests/src/components/contacts-table.component.ts` | Add read-only helpers (test code): `firstNameColumn()` (ordered First-Name cell texts), `paginationInfo` locator + `totalRows()` / `pageRangeText()` parsed from the pager caption, and `nextButton` / `previousButton` getters so specs can assert enabled/disabled. Existing `sortBy*` / `nextPage` / `previousPage` / `setRowsPerPage` are reused as-is. |

No changes to page objects, fixtures, factory or any production Blazor/API code.

## Test plan — `sort-paginate.spec.ts`

Seed helper builds token-named contacts with explicit `firstName` / `lastName` / `birthday`.

**Sorting** (seed 3 rows, `search(token)`, all on one page):

1. `sort by First Name asc/desc` — first names `Anna/Bella/Cara` (+token). 1 click → `Anna,Bella,Cara`; 2nd click → `Cara,Bella,Anna`.
2. `sort by Last Name asc/desc` — last names `Alpha/Bravo/Charlie` (+token), first names fixed & distinct. Assert First-Name column follows the last-name order both directions.
3. `sort by Birthday asc/desc` — first names `Xavier(1999)/Yolanda(1980)/Zach(1990)`; asc → `Yolanda,Zach,Xavier`, desc → `Xavier,Zach,Yolanda` (proves birthday, not name, drives the order).

**Pagination** (seed 12 rows `P00..P11`+token, `search(token)`, `sortByFirstName` for deterministic order):

4. `default page size + next/prev` — page 1: `rowCount = 10`, `totalRows = 12`, range `1-10 of 12`, last row `P11` absent, **Previous disabled**. `nextPage()` → `rowCount = 2`, range `11-12 of 12`, `P11` present. `previousPage()` → back to `rowCount = 10`, `P11` absent.
5. `rows-per-page shows all on one page` — `setRowsPerPage(25)` → `rowCount = 12`, range `1-12 of 12`, `totalRows = 12`, **Next disabled**.

**TotalRows** — asserted explicitly via `totalRows()` in the pagination tests (and reflects the filtered count).

All assertions are web-first (locator matchers / `expect.poll`); reloads settle via the component's
`waitForLoaded()`; no fixed delays. Every test is self-contained and torn down by the fixture.

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Sort by First Name (asc + desc) reorders rows | test 1 |
| 2 | Sort by Last Name (asc + desc) reorders rows | test 2 |
| 3 | Sort by Birthday (asc + desc) reorders rows by date, not name | test 3 |
| 4 | Rows-per-page limits rows shown per page | tests 4 & 5 |
| 5 | Next / Previous navigate between pages | test 4 |
| 6 | Prev disabled on first page, Next disabled on last page | tests 4 & 5 |
| 7 | Pager shows the correct TotalRows (`of N`) | tests 4 & 5 |

## Out of scope

- No production Blazor/API/contract changes (behaviour already exists).
- Server-side sorting/paging is not in scope — the app sorts/pages client-side over the filtered set.
- Empty-state, search and CRUD are covered by their own U-tasks (U11, U13–U17).

## Verification

Test-authoring mode: start the API (`run-api`) — the Playwright `webServer` also starts Web — and run
the new spec (`run-tests`, chromium). Every test must pass and actually exercise the behaviour. No
browser UI walk. `npm run lint` clean.
