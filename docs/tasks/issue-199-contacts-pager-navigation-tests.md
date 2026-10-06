# Issue #199 — Blazor Tests B31: ContactsListTests: навигация по страницам через MudTablePager

- Issue: https://github.com/askrinnik/AddressBook2025/issues/199
- Lane: Test-authoring (tests only, no production code)
- Complexity: S

## Requirement

`ContactsListTests` covers the page size (`RowsPerPage_*`) but not moving between pages with `MudTablePager`. Paging in `Contacts.ServerReload` is client-side (`Skip(state.Page * state.PageSize).Take(state.PageSize)`) and `TotalItems` comes from `response.TotalRows`. The tests drive the pager through new `ContactsTableHarness` members.

## Acceptance

- [x] 12 contacts, 10 per page: "next page" shows the last 2 in source order; "previous page" returns the first 10.
- [x] The pager text ("1-10 of 12", "11-12 of 12") matches the state.
- [x] Sorting on the second page applies to the whole set, not only to the current page.
- [x] Changing rows per page on the second page returns the table to a correct state.
- [x] Production code is unchanged. A discrepancy found (for example `TotalRows` ≠ `Rows.Count`) becomes a separate issue.

## Affected files

- `src/AddressBook.Web.Tests/Harnesses/ContactsTableHarness.cs` — add `PagerInfo`, `NextPage()`, `PreviousPage()`.
- `src/AddressBook.Web.Tests/Specs/Pages/ContactsListTests.cs` — new paging cases.
- `src/AddressBook.Web.Tests/Specs/Harnesses/ContactsTableHarnessTests.cs` — cover the new harness members.
- `docs/tasks/blazor-component-tests-framework-plan.md` — tick B31.

## Approach

1. Harness: `PagerInfo` reads the trimmed text of the pager's `.mud-table-page-number-information`; `NextPage` / `PreviousPage` click the pager's next/previous buttons (located by their `aria-label`), then the caller calls `WaitForLoaded()`.
2. Tests use `ContactBuilder.Existing.List(12)` and `ReturnsContacts` (so `TotalRows` = 12), shaped like the existing `RowsPerPage_*` tests.
3. Sort on page 2: contacts whose first names sort in the reverse of the source order, so the sorted first page differs from the source's first page.

## Tests

| Test | Asserts |
|---|---|
| `NextPage_ShowsLastTwoRows_InSourceOrder` | ids of rows 11–12; pager "11-12 of 12" |
| `PreviousPage_ReturnsFirstTenRows` | ids of rows 1–10; pager "1-10 of 12" |
| `PagerInfo_OnFirstPage_ShowsRangeAndTotal` | "1-10 of 12" |
| `SortBy_OnSecondPage_SortsWholeSet` | page-2 rows are the 2 smallest/largest of all 12, not of the page |
| `RowsPerPage_ChangeOnSecondPage_ShowsConsistentTable` | all 12 rows, pager "1-12 of 12" |

## Verification

Run the new tests, then `build-runner` with scope `full`. No production change, so both Playwright suites stay green.

## Out of scope

- Server-side paging (the API returns all rows; paging is client-side).
- Pager button disabled states beyond what the scenarios need.

## Tasks

- [x] Add `PagerInfo`, `NextPage`, `PreviousPage` to `ContactsTableHarness`.
- [x] Cover them in `ContactsTableHarnessTests`.
- [x] Add the paging cases to `ContactsListTests`.
- [x] Run the whole bUnit suite, the build and both Playwright suites.
- [x] Tick B31 in `docs/tasks/blazor-component-tests-framework-plan.md`.
