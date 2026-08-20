# Issue #104 (U13) — `tests/contacts/create.spec.ts`

**Mode:** Test-authoring (Phase 2). Contact creation already works in `AddressBook.Web`; the
Playwright UI specs are the deliverable. **No production code changes.**

## Requirement

Cover the Create Contact page (`/create-contact`) through the UI:

- Create a contact **with** a birthday → it appears in the contacts list.
- Create a contact **without** a birthday → it appears in the contacts list.
- **Cancel** on the form → navigates back to `/contacts` and creates nothing.

## How the app behaves (verified in `CreateContact.razor`)

- `EditForm` with First name / Last Name (`MudTextField`), Birthday (`MudDatePicker`,
  read-only input — date chosen via the popover), a `Create` submit and a `Cancel` button.
- **Create** (`HandleCreateContact`): validates, POSTs via `AddressBookApiService.CreateContact`,
  then `Navigation.NavigateTo("/contacts")` on success.
- **Cancel**: `Navigation.NavigateTo("/contacts")` — no API call, nothing created.
- API round-trip: `POST /api/Contacts` → `GET /api/Contacts?search=` returns
  `{ rows, totalRows }`; `ContactModel.birthday` is a `yyyy-MM-dd` string or `null`.

## Reusing existing infrastructure

- **Page/components (U7/U8):** `CreateContactPage.create(command)` already fills the form
  (`ContactForm` + `DatePicker`) and submits; `ContactForm.cancel()` clicks Cancel. Reused as-is.
- **List assertion (U9):** `ContactsTable.search()` + `expectContactRow()` to confirm the row shows.
- **Seeding/cleanup fixture (U9):** the `contactsApi` fixture auto-cleans contacts **it** created.
  A contact created through the **UI** is not tracked, so this spec looks its id up via the API and
  deletes it in a `finally` (see below).

## Test-infra additions (test code, not production)

- `src/UiTests/src/api/contacts-api.ts` — add `getFilteredContacts(search): Promise<ContactRow[]>`
  (`GET /api/Contacts?search=`, returns `rows`). Needed to (a) look up the id of a UI-created
  contact for a precise, culture-independent birthday assertion and (b) delete it in teardown.
  Reusable by the later UI CRUD specs (U14/U15/U17).
- `src/UiTests/src/data/contact.factory.ts` — add `ContactFactory.tokenized(token, overrides?)`, the
  single builder for token-isolated contacts (`overrides.firstName`/`lastName` set the PREFIX before
  the token, default `First`/`Last`). This removes the duplicated ad-hoc builders that had grown in
  the specs: the identical `tokenNamedContact` in `list-search.spec.ts` and (the new) `create.spec.ts`,
  and the `named` helper in `sort-paginate.spec.ts` (now a thin wrapper delegating to `tokenized`).

No change to the fixture or any page/component object.

## Refactor (remove duplication, approved in review)

Consolidating the token-named-contact construction onto `ContactFactory.tokenized` also touches two
already-merged specs; this is a deliberate DRY cleanup shipped with U13:

- `tests/contacts/list-search.spec.ts` (U11) — drop local `tokenNamedContact`, use `data.tokenized`.
- `tests/contacts/sort-paginate.spec.ts` (U12) — `named` now delegates to `data.tokenized`.

## Isolation & cleanup (shared SQL Server DB)

Each test mints `newTestToken()` and creates a contact whose first/last names embed the token, so
`getFilteredContacts(token)` / `search(token)` isolate exactly this test's row. Because the row is
created through the UI (untracked), each create test wraps its body in `try/finally` and deletes the
looked-up id via `contactsApi.deleteContact(id)` (tolerates 404) — so a mid-test failure never leaks
data. The Cancel test creates nothing, so there is nothing to clean up (it asserts zero rows).

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/contacts/create.spec.ts` | **New** spec — the deliverable. |
| `src/UiTests/src/api/contacts-api.ts` | Add `getFilteredContacts(search)` + `ContactRow` type (test infra). |
| `src/UiTests/src/data/contact.factory.ts` | Add `tokenized(token, overrides?)` — the shared token-contact builder. |
| `src/UiTests/tests/contacts/list-search.spec.ts` | Refactor onto `data.tokenized` (drop local helper). |
| `src/UiTests/tests/contacts/sort-paginate.spec.ts` | `named` delegates to `data.tokenized`. |

## Test plan — `create.spec.ts`

1. **creates a contact with a birthday** — `data.validContact({firstName:First-<token>, lastName:Last-<token>, birthday:'1990-06-15'})`. `goto()` → `create()` → assert URL is `/contacts`. Look up by token: exactly 1 row; assert `firstName`/`lastName` match and `birthday === '1990-06-15'` (culture-independent). Then `search(token)` and `expectContactRow(id, …)` to prove it shows in the list. `finally` deletes the id.
2. **creates a contact without a birthday** — `data.validContactWithoutBirthday({…token names})`. Same flow; assert the looked-up row's `birthday === null`, and the row shows in the list. `finally` deletes the id.
3. **Cancel does not create the contact** — `goto()`, fill first/last (+ pick a birthday to prove even entered data is discarded), click **Cancel** → assert URL is `/contacts`. Assert `getFilteredContacts(token)` returns `[]` (nothing persisted) and the list `search(token)` shows the empty state. No cleanup needed.

All assertions are web-first (`expect(locator)` / `toHaveURL`); the birthday value is asserted via
the API (not the culture-formatted table cell). No fixed delays.

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Create with birthday persists and shows in the list | test 1 (API birthday check + visible row) |
| 2 | Create without birthday persists (birthday null) and shows in the list | test 2 |
| 3 | Cancel returns to `/contacts` and creates nothing | test 3 (empty API result + empty-state) |

## Out of scope

- Client/server validation (empty names, over-length, future date) → U16 (`validation.spec.ts`).
- Edit / delete / full CRUD lifecycle → U14 / U15 / U17.
- No production Blazor/API/contract changes (behaviour already exists).

## Verification

Test-authoring mode: start the API (`run-api`); the Playwright `webServer` also starts Web. Run the
new spec (`run-tests`, chromium). Every test must pass and exercise the behaviour. `npm run lint` and
`tsc --noEmit` clean. No browser UI walk.
