# Plan: Issue #158 — Blazor Tests B14: CreateContactServerErrorTests

> **Issue:** [#158](https://github.com/askrinnik/AddressBook2025/issues/158) — «Blazor Tests B14: CreateContactServerErrorTests» (Phase 2)
> **Mode:** test-authoring plus one production fix found while testing (`GetErrors()` crash, see §3).

## 1. Requirement

`Tests/Pages/CreateContactServerErrorTests.cs` — bUnit page-level tests of the error path of `Pages/CreateContact.razor`:
the mocked `CreateContact` throws `ProblemDetailsException` with `errors` → the messages land on the matching form
fields (`ValidationMessageStore`).

## 2. Acceptance

- [x] `ProblemDetailsException` with `errors` for `FirstName` → message shown for that field; no navigation.
- [x] `errors` for several fields (`FirstName` + `LastName`) → a message on each field (MudBlazor shows the first message per field).
- [x] `ProblemDetailsException` with `null` problem details → no crash, no messages, no navigation, submit re-enabled.
- [x] Non-problem exception (e.g. `HttpRequestException`) → its message shown as a general (model-level) error; no navigation.
- [x] Server errors are cleared on the next submit (a successful retry navigates and shows no old messages).
- [x] After any failure the submit button is enabled again (`_isLoading` reset).
- [x] Problem details without an `errors` extension → no crash; `Detail` (or `Title`) shown as a general error; no navigation.
- [x] Only `MudTestContext` + `ContactFormHarness` + xUnit `Assert`; no `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx` without new warnings; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

- `src/AddressBook.Web.Tests/Tests/Pages/CreateContactServerErrorTests.cs` — new.
- `src/AddressBook.Web.Tests/Infrastructure/ApiServiceMock.cs` — `ThrowsOnCreate` helper (mirrors `ThrowsOnDelete`) + a case in `ApiServiceMockTests`.
- `src/AddressBook.Web/ErrorHandling/ProblemDetailsExtensions.cs` — `GetErrors()` returns an empty dictionary when `errors` is absent (was `KeyNotFoundException`/`NullReferenceException` thrown out of the catch block).
- `src/AddressBook.Web/Pages/CreateContact.razor`, `EditContact.razor` — no field errors → show `Detail ?? Title` as a general error.
- `src/AddressBook.Web.Tests/Tests/ErrorHandling/ProblemDetailsExtensionsTests.cs` — new.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B14 done.

## 4. Tests

bUnit page-level scenarios (see Acceptance). ProblemDetails are built from RFC 7807 JSON via `ToProblemDetails()`,
the same path as the real `ProblemDetailsHandler`. Playwright API/UI not needed — behaviour does not change.

## 5. Out of scope

Happy path / client validation (B13), edit page (B15), model-level summary component (B16).
