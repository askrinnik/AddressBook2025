# Issue #194 — Contacts: the error banner is not cleared after a successful reload

- Issue: https://github.com/askrinnik/AddressBook2025/issues/194
- Title: Blazor Tests B26: Contacts: баннер Error не очищается после успешной перезагрузки
- Lane: Feature
- Complexity: S

## Requirement

On `/contacts`, a failed list load shows its message in the top `Error` banner ("Woops!") and in the inline `MudAlert`. After a later successful load (search, sort, page change, rows per page) both must be gone. Today only `_errorText` (the `MudAlert`) is reset, because the success branch of `Contacts.ServerReload` never calls `Error.Clear()`. A banner raised by a failed delete must still survive the reload that follows the delete.

## Acceptance

- [x] The banner is cleared after a successful load that follows an error.
- [x] `ContactsErrorTests` checks the banner state (`ContactsTableHarness.ErrorBannerText`) after a successful load that follows an error.
- [x] A failed delete still shows its message in the banner after the table reload that follows it (`ContactsDeleteTests.Confirm_ServerError_*` and `Confirm_NetworkError_*` stay green).
- [x] `docs/specs/AddressBook.Web.md` ("Error handling in page") describes the clearing.

## Affected files

- `src/AddressBook.Web/Pages/Contacts.razor.cs` — `ServerReload`, `DeleteContactAsync`, one private field.
- `src/AddressBook.Web.Tests/Tests/Pages/ContactsErrorTests.cs` — one new test; the harness does not change.
- `docs/specs/AddressBook.Web.md` — "Error handling in page".

## Approach

1. Add `private bool _loadErrorShown;` — true while the banner shows a list-load failure.
2. `ServerReload` catch: after `Error.ProcessError(ex.Message)` set `_loadErrorShown = true`.
3. `ServerReload` success branch, next to `_errorText = ""`: `if (_loadErrorShown) { Error.Clear(); _loadErrorShown = false; }`.
4. `DeleteContactAsync` generic catch: after `Error.ProcessError(...)` set `_loadErrorShown = false`, so the delete failure banner survives the reload that follows.
5. Comments in English, present tense, stating why the flag exists.

## Tests

`ContactsErrorTests.SuccessfulSearchAfterFailure_ClearsErrorBanner`: `ThrowsOnGetContacts` → render → assert banner equals the error message → `ReturnsContactsFor("nobody")` → `Search("nobody")` → `WaitForLoaded()` → assert `ErrorBannerText` is null. Regression guard: the existing `ContactsDeleteTests` banner tests.

## Verification

- `dotnet test --project src/AddressBook.Web.Tests --filter-class "*ContactsErrorTests"` and `"*ContactsDeleteTests"`, then the full suite.
- Browser walk (final verification): stop the API, open `/contacts` (banner), start the API, search (banner and alert disappear).

## Out of scope

- A banner raised on another page and still visible after navigating to `/contacts`.
- Clearing a delete-failure banner on a later successful load.
- Changes to `Error.razor`, `ContactsTableHarness`, `TestIds`.

## Decisions

- Variant A (chosen by the user): clear the banner after a successful load.
- Refinement: a successful load clears only a banner raised by a failed load, not one raised by a failed delete. An unconditional `Error.Clear()` would erase the delete failure at once, because the delete handler reloads the table right after reporting the error, and would break two existing tests. Alternative considered: unconditional clear plus reordering the delete handler; rejected as a larger behavioural change.
