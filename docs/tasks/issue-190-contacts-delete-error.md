# Plan: Issue #190 — Contacts: unhandled contact delete error

> **Issue:** [#190](https://github.com/askrinnik/AddressBook2025/issues/190) — «Blazor Tests B22: Contacts: необработанная ошибка удаления контакта»
> **Lane:** Bug · **Complexity:** S

## 1. Bug and root cause

`Contacts.DeleteContactAsync` (`src/AddressBook.Web/Pages/Contacts.razor.cs`) awaits `AddressBookApiService.DeleteContact(id)` without `try/catch`. A failed delete (`ProblemDetailsException` for 404/500, `HttpRequestException` for a network failure) escapes the click handler, and Blazor WASM drops into the "An unhandled error has occurred" state until the page is reloaded.

## 2. Acceptance

- [x] A `DeleteContact` failure is caught on the `Contacts` page and the user sees a message.
- [x] After a failure the table stays usable (search and a repeated delete work).
- [x] Regression bUnit test in `Tests/Pages/ContactsDeleteTests.cs`: `ApiService.ThrowsOnDelete(...)` → confirm "Yes" → message shown, no exception propagates.
- [x] A 404 (`ProblemDetailsException` with status 404) behaves as decided below and is covered by a test.

## 3. Affected files

- `src/AddressBook.Web/Pages/Contacts.razor.cs` — catch the delete failure.
- `src/AddressBook.Web.Tests/Tests/Pages/ContactsDeleteTests.cs` — regression tests.
- `docs/specs/AddressBook.Web.md` — only if it describes the delete flow.

## 4. Approach

`DeleteContactAsync` wraps the delete call in `try/catch`:

- **Any failure except 404:** `Error.ProcessError(message)` — the same top banner the list-load failure uses. The table is reloaded afterwards, so it reflects the server state and stays usable.
- **404:** the contact is already gone, which is the state the user asked for. No error is shown; the table is reloaded.
- The message is the problem `Detail`, then `Title`, falling back to `Exception.Message`.

## 5. Tests

In `ContactsDeleteTests` (the `ThrowsOnDelete` helper already exists):

- Delete fails with a 500 `ProblemDetailsException` → banner shows the detail, rows still shown, no exception.
- Delete fails with `HttpRequestException` → banner shows its message.
- Delete fails with a 404 `ProblemDetailsException` → no banner, table reloaded and shows the server's current rows.
- After a failure a second delete succeeds and the table updates.

## 6. Verification

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. A browser walk is not needed: the change is a page-level `catch` fully exercised by the component tests.

## 7. Out of scope

Snackbar or inline alert presentation; clearing the banner after a later success (unchanged behaviour for the list-load error).

## 8. Decisions

- Where to show: the top `Error` banner, consistent with the list-load failure.
- 404: silent table reload, not an error.
