# Issue #102 — UI Tests U11: `tests/contacts/list-search.spec.ts`

**Type:** testing (Phase 2 UI E2E). **Mode:** test-authoring — no production code.
**Deliverable:** `src/UiTests/tests/contacts/list-search.spec.ts`.

## Requirement (from the issue)

> Фаза 2. Отображение созданных контактов, поиск по токену, пустой результат
> (No matching records found), очистка поиска.

Add the Playwright UI E2E spec that covers, against the running Blazor UI, the Contacts list
display + search flows. The behaviour already exists; this task only writes the tests.

## Acceptance criteria

| # | Observable behaviour |
|---|----------------------|
| 1 | Contacts created via the API are displayed in the list (found by searching their token). |
| 2 | Searching by a token narrows the list to the matching contact(s); non-matching rows disappear. |
| 3 | A search that matches nothing shows the empty state **"No matching records found"**. |
| 4 | Clearing the search restores the list (the empty state disappears and rows return). |

## Current behaviour reused (no production change)

- **Server search** (`AddressBookRepository.RetrieveManyAsync`): when `SearchText` is non-blank,
  `FirstName.Contains(term) OR LastName.Contains(term)`. So a token embedded in a contact's names
  isolates that contact on the shared SQL Server DB.
- **UI**: `Contacts.razor` `MudTable` with `ServerData` + a `Clearable` Search box
  (`OnSearch → ReloadServerData`); empty state renders "No matching records found".

## Approach

Follow the two committed specs' shape (`tests/smoke/app-shell.spec.ts`,
`tests/utils/assertions.spec.ts`) and `playwright-conventions`:

- Drive through the **U9 fixtures** (`test`/`expect` from `src/fixtures/test-fixtures.js`):
  `contactsApi` (hybrid REST seed, **auto-cleaned in teardown**), `contactsPage`, `data`.
- **Per-test isolation via a unique token.** Each test generates `newTestToken()` and seeds
  contacts whose first/last names embed it (via `data.validContact({ firstName, lastName })`,
  kept ≤ 30 chars to satisfy the API validator). Searching that token returns exactly this
  test's rows — deterministic under parallel workers on the shared DB.
- **Web-first assertions only** via the existing domain helpers (`expectContactRow`,
  `expectNoContactRow`, `expectNoRecords`) and the table component (`search`, `clearSearch`,
  `rowCount`). No `waitForTimeout`.

## Tests (the deliverable)

`src/UiTests/tests/contacts/list-search.spec.ts`, `describe('contacts — list & search')`:

1. **displays created contacts** — seed two contacts sharing one unique token; `goto`, search the
   token; assert both rows visible (`expectContactRow`) and `rowCount() === 2`. → AC1
2. **search by token narrows the list** — seed contact A (tokenA) and contact B (tokenB); search
   tokenA; assert A visible, B absent (`expectNoContactRow`), empty state not shown. → AC2
3. **non-matching search shows the empty state** — seed one contact; search a fresh
   non-matching token; assert `expectNoRecords` and the seeded row absent. → AC3
4. **clearing the search restores the list** — seed one contact; search a non-matching token
   (empty state shown); `clearSearch`; assert the empty state is gone and `rowCount() > 0`. → AC4

No boundary/negative API cases apply (pure UI test over existing behaviour, no API change).

## Out of scope

Sorting & pagination (U12), create/edit/delete/validation flows (U13–U17). No changes to
production code, page/component/fixture objects, or other specs.

## Verification

`run-api` (API on `:5000`) + Web, then `run-tests` in `src/UiTests` running this spec; every
test green and actually asserting. Browser UI walk does not apply in test-authoring mode.
