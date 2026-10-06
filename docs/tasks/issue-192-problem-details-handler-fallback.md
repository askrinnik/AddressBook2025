# Plan: Issue #192 — ProblemDetailsHandler: empty or non-JSON response body breaks error handling

> **Issue:** [#192](https://github.com/askrinnik/AddressBook2025/issues/192) — «Blazor Tests B24: ProblemDetailsHandler: пустое или не-JSON тело ответа ломает обработку ошибок»
> **Lane:** Bug · **Complexity:** S

## 1. Bug and root cause

`ProblemDetailsHandler` passes every non-success body to `ToProblemDetails()` (`JsonSerializer.Deserialize`). An empty, HTML or plain-text body (502/504 from a gateway, 401/405 without body, 404 without problem+json) throws `JsonException` instead of `ProblemDetailsException`. Consequences: forms show the parser message, `GetContactByIdAsync` does not recognise a 404 and the exception escapes.

## 2. Acceptance

- [x] `ProblemDetailsHandler` does not throw `JsonException` on an empty or non-JSON body.
- [x] `Tests/ErrorHandling/ProblemDetailsHandlerTests.cs`: empty body, HTML body, `text/plain`, valid problem+json — always `ProblemDetailsException` with the right `Status`.
- [x] `AddressBookApiServiceTests.GetContactById`: 404 with an empty body → `null`.
- [x] `CreateContactServerErrorTests`: 502 with an HTML body → general message with the status title, not the `JsonException` text.

## 3. Affected files

- `src/AddressBook.Web/ErrorHandling/ProblemDetailsHandler.cs` — fallback problem details.
- `src/AddressBook.Web.Tests/Infrastructure/FakeHttpMessageHandler.cs` — `RespondBody` helper.
- `src/AddressBook.Web.Tests/Tests/ErrorHandling/ProblemDetailsHandlerTests.cs` (new), `Tests/Services/AddressBookApiServiceTests.cs`, `Tests/Pages/CreateContactServerErrorTests.cs`.
- `docs/specs/AddressBook.Web.md` — section 5.1.

## 4. Approach

The handler parses the body inside `try/catch (JsonException)`. When parsing fails or yields `null`, it creates a `ClientProblemDetails` with `Title` = reason phrase (status name when blank) and `Status` = response status. A parsed problem that has no `status` takes the response status. `ProblemDetailsExtensions.ToProblemDetails` is unchanged.

## 5. Tests

Handler: success passthrough, valid problem+json, empty body (several statuses), HTML, `text/plain`, JSON that is not an object (`null`, `[]`, string), JSON object without status. Service: 404 with empty body → `null`. Page: 502 with HTML through the real service shows "Bad Gateway".

## 6. Verification

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. No browser walk: the change is a handler fully exercised through `HttpClient` in the component tests.

## 7. Out of scope

Reading a non-problem+json body into `Detail`; changes to the API's error format.

## 8. Decisions

- A parsed JSON problem without `status` takes the response status (small hardening, keeps `Status` reliable for the 404 check).
- Fallback title is the response reason phrase, as the issue specifies.
