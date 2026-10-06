# Plan: Issue #191 — EditContact: unhandled load error and blank page while loading

> **Issue:** [#191](https://github.com/askrinnik/AddressBook2025/issues/191) — «Blazor Tests B23: EditContact: необработанная ошибка загрузки и пустая страница во время загрузки»
> **Lane:** Bug · **Complexity:** S

## 1. Bug and root cause

`EditContact.OnInitializedAsync` (`src/AddressBook.Web/Pages/EditContact.razor`) handles only a `null` result of `GetContactByIdAsync` (404). Any other failure — a 500 `ProblemDetailsException`, a network error — escapes the lifecycle method and Blazor WASM drops into the "An unhandled error has occurred" state. While the request is pending, `_notFound` is `false` and `_model` is `null`, so the page renders neither the form nor a loading indicator.

## 2. Acceptance

- [x] A load failure other than 404 is caught and shown to the user, with a way back to the list.
- [x] A loading indicator is shown while the contact is being loaded.
- [x] bUnit test: `GetContactByIdAsync` throws → message shown, no form, `UpdateContact` not called.
- [x] bUnit test: `GetContactByIdAsync` pending (`TaskCompletionSource`) → indicator shown, no form; after completion the form is prefilled.

## 3. Affected files

- `src/AddressBook.Web/Pages/EditContact.razor` — catch the load failure, render the error alert and the indicator.
- `src/AddressBook.Web.Tests/Infrastructure/ApiServiceMock.cs` — `ThrowsOnGetContact`, `HoldsContactRequest` helpers.
- `src/AddressBook.Web.Tests/Tests/Pages/EditContactLoadTests.cs` — new tests.
- `docs/specs/AddressBook.Web.md` — edit page section.

## 4. Approach

`OnInitializedAsync` wraps the load in `try/catch`. On failure it stores a message in `_loadError`: the problem `Detail`, then `Title`, then `Exception.Message`. The markup renders, in order: not found (warning alert), load error (error `MudAlert` plus the existing "Back to Contacts" button), loading (`MudProgressLinear`, indeterminate), the form.

## 5. Tests

`EditContactLoadTests`: 500 problem details (detail shown, error severity, back button), title fallback, network error message, no form and no `UpdateContact` after a failure, back button navigates to `/contacts`, indicator and no form while pending, form prefilled and indicator gone after completion.

## 6. Verification

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. A browser walk is not needed: the change is page-level markup and a `catch` fully exercised by the component tests.

## 7. Out of scope

Retry button; cancelling the request when the page is disposed.

## 8. Decisions

- Error presentation: inline `MudAlert` (error) with "Back to Contacts", consistent with the not-found branch — not the top `Error` banner, because the page has nothing else to show.
- Loading indicator: indeterminate `MudProgressLinear` with an accessible name.
