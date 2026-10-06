# Plan: Issue #193 — AddressBookApiService.CreateContact silently returns 0 on a failed response

> **Issue:** [#193](https://github.com/askrinnik/AddressBook2025/issues/193) — «Blazor Tests B25: AddressBookApiService.CreateContact молча возвращает 0 при неуспешном ответе»
> **Lane:** Bug · **Complexity:** S

## 1. Bug and root cause

`CreateContact` returns `0` for a non-success status. `UpdateContact` calls `EnsureSuccessStatusCode()` and `DeleteContact` throws `HttpRequestException`, so the service is inconsistent. In the app `ProblemDetailsHandler` throws first and hides the gap, but without it a failed create looks like a success with id `0`.

## 2. Acceptance

- [x] `CreateContact` throws on a non-success status (`EnsureSuccessStatusCode()`), like `UpdateContact`.
- [x] `NonSuccessWithoutProblemDetailsHandler_ReturnsZero` is replaced by `..._ThrowsHttpRequestException`.
- [x] "Success without `Location`" and "non-numeric last segment" still return `0`, covered by the existing tests.

## 3. Affected files

- `src/AddressBook.Web/AddressBookApiService.cs`
- `src/AddressBook.Web.Tests/Tests/Services/AddressBookApiServiceTests.cs`
- `docs/specs/AddressBook.Web.md` — service table.

## 4. Approach

Call `response.EnsureSuccessStatusCode()` before reading `Location`; the success path is unchanged.

## 5. Tests

Replace the `ReturnsZero` test with one asserting `HttpRequestException` when the pipeline has no `ProblemDetailsHandler`.

## 6. Verification

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. No browser walk: the production path goes through `ProblemDetailsHandler`, which throws before this line.

## 7. Out of scope

Changing how `CreateContact` pages handle exceptions (already covered by `CreateContactServerErrorTests`).

## 8. Decisions

None beyond the issue.
