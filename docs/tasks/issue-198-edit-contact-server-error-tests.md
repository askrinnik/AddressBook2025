# Issue #198 — Blazor Tests B30: EditContactServerErrorTests: серверные ошибки при сохранении контакта

- Issue: https://github.com/askrinnik/AddressBook2025/issues/198
- Lane: Test-authoring (tests only, no production code)
- Complexity: S

## Requirement

When saving through `IAddressBookApiService.UpdateContact` fails, the error path of `src/AddressBook.Web/Pages/EditContact.razor` (`HandleUpdateContact` → `AddCustomError` / `AddGeneralError`) is covered by bUnit tests, matching what `CreateContactServerErrorTests` gives `CreateContact.razor`. A new `ApiServiceMock.ThrowsOnUpdate(Exception)` helper makes the update call fail; `CompletesUpdate()` makes a later update succeed for the retry case.

Since B29 (#197) page specs live under `Specs/Pages/`; the new file goes to `src/AddressBook.Web.Tests/Specs/Pages/EditContactServerErrorTests.cs` (namespace `AddressBook.Web.Tests.Specs.Pages`).

## Acceptance

- [x] An error on one field shows its message at that field; the page stays on `/edit-contact/{id}`.
- [x] Errors on several fields show a message at each field.
- [x] Problem details with `detail` but no `errors` show a general message with the detail text.
- [x] Problem details with only `title` show a general message with the title text.
- [x] `ProblemDetailsException(null)` shows no messages; the page does not change.
- [x] An unexpected exception shows its text as a general message.
- [x] After an error, Save is enabled again; a successful resubmit clears the messages and navigates to `/contacts`.
- [x] `EditContact` coverage is not lower than `CreateContact`.
- [x] (added) Problem details with no `errors`, `detail` or `title` show the fallback "The request failed.".
- [x] (added) A 502 with an HTML body through the real `ProblemDetailsHandler` shows "Bad Gateway", not a JSON parser error.
- [x] (added) The failing submit really calls `UpdateContact` with the page's `Id`.

## Affected files

- `src/AddressBook.Web.Tests/Specs/Pages/EditContactServerErrorTests.cs` — new.
- `src/AddressBook.Web.Tests/Infrastructure/ApiServiceMock.cs` — add `ThrowsOnUpdate(Exception)` and `CompletesUpdate()`.
- `src/AddressBook.Web.Tests/Specs/Infrastructure/ApiServiceMockTests.cs` — cover the update helpers.
- `src/AddressBook.Web.Tests/README.md` — add the class to the structure tree.
- `docs/tasks/blazor-component-tests-framework-plan.md` — tick B30.

## Approach

1. Helpers after `ThrowsOnCreate`, faulted-task form (`Task.FromException`), one-line English XML summary each.
2. `EditContactServerErrorTests : MudTestContext`, shaped like `CreateContactServerErrorTests`: `RenderLoadedForm(ContactModel)` (ReturnsContact, RenderProviders, NavigateTo, render with `Id`, `ContactFormHarness`), contact from `ContactBuilder.Existing.Valid()`, private `ValidationProblem(string)` helper, throw configured after render, then `form.Submit()` and assert via `ValidationMessages`, `IsSubmitDisabled`, `CurrentPath`.
3. Gateway case: `FakeHttpMessageHandler.CreateService()` registered before render; enqueue a 200 JSON contact for the GET, default 502 HTML for the PUT.
4. Conventions: data only from `ContactBuilder`, xUnit `Assert` only, no `Task.Delay`.

## Tests

| Test | Asserts |
|---|---|
| `Submit_ServerReturnsFieldError_ShowsMessageOnThatField_AndStaysOnPage` | message; `CurrentPath == PathFor(id)`; `UpdateContact` received for id |
| `Submit_ServerReturnsErrorsForSeveralFields_ShowsMessageOnEachField` | both messages; still on page |
| `Submit_ServerReturnsError_EnablesSubmitButtonAgain` | `IsSubmitDisabled` false |
| `Submit_ProblemDetailsWithoutErrors_ShowsDetailAsGeneralError_AndStaysOnPage` | detail text; on page; Save enabled |
| `Submit_ProblemDetailsWithTitleOnly_ShowsTitleAsGeneralError` | title text; on page |
| `Submit_ProblemDetailsWithoutTitleOrDetail_ShowsFallbackGeneralError` | `["The request failed."]` |
| `Submit_ProblemDetailsWithoutBody_ShowsNoMessages_AndStaysOnPage` | no messages; on page; Save enabled |
| `Submit_UnexpectedException_ShowsItsMessageAsGeneralError_AndStaysOnPage` | message; on page; Save enabled |
| `Submit_RetryAfterServerError_ClearsOldMessages_AndNavigates` | no messages; `/contacts`; update received twice |
| `Submit_GatewayReturnsHtmlBody_ShowsStatusTitle_NotJsonParserError` | `["Bad Gateway"]`; on page; Save enabled |

`ApiServiceMockTests`: extend the throws test with `ThrowsOnUpdate`; add `CompletesUpdate_OverridesThrowsOnUpdate`.

## Verification

Run the new class, then the whole bUnit suite; compare `EditContact` and `CreateContact` line/branch rates in a Cobertura report. Build and both Playwright suites stay green (no production change).

## Out of scope

- Load errors of `EditContact` (covered by `EditContactLoadTests`, `EditContactNotFoundTests`).
- Malformed `errors` member (covered in `ProblemDetailsExtensionsTests`).
- Dedicated UX for a 404 on update.
- A `{"status":500}` fallback test for `CreateContact`.
- A shared server-error test base for Create and Edit (B32, #200).

## Tasks

- [x] Add `ThrowsOnUpdate` and `CompletesUpdate` to `ApiServiceMock`.
- [x] Extend `ApiServiceMockTests`.
- [x] Create `EditContactServerErrorTests` with the ten cases.
- [x] Update the README structure tree.
- [x] Run the whole suite and check coverage parity.
- [x] Tick B30 in `docs/tasks/blazor-component-tests-framework-plan.md`.
