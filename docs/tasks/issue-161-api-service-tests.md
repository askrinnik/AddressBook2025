# Plan: Issue #161 — Blazor Tests B17: AddressBookApiServiceTests

> **Issue:** [#161](https://github.com/askrinnik/AddressBook2025/issues/161) — Phase 2
> **Lane:** test-authoring (bUnit project, plain xUnit — no component rendering), extended during plan review with a fix of the search-term escaping (see Decisions).
> **Complexity:** S

## 1. Requirement

Tests of `AddressBookApiService` (`src/AddressBook.Web/AddressBookApiService.cs`) through `FakeHttpMessageHandler`:
URL building (`?search=` only for a non-empty term), id parsing from `Location` (and `0` on failure), `404 → null`
(through `ProblemDetailsException`), `DateTime → DateOnly`, and exceptions on non-success for `Delete`/`Update`.

### Defect found while planning

`GetFilteredContactsAsync` appends the search term to the URL raw (`?search={searchTerm}`). A term containing
`&`, `#`, `+` or `%` is corrupted: `a&b` reaches the API as `search=a` plus a stray `b` parameter, and everything
after `#` is dropped.

**Root cause:** the term is interpolated into the query string without escaping.
**Fix:** `requestUri += $"?search={Uri.EscapeDataString(searchTerm)}"`.

## 2. Acceptance

`GetFilteredContactsAsync`

- [x] Empty, `null`-like and whitespace-only terms → request URI is `contacts` with no query string.
- [x] A non-empty term → request URI is `contacts?search=<term>`.
- [x] A term with reserved characters (`a&b`, `a#b`, `a+b`, `100%`, `a b`) is percent-encoded, so the query has exactly one `search` parameter that decodes back to the original term.
- [x] The JSON body is deserialised into `GetFilteredContactsResponse` (rows and `TotalRows`).
- [x] A non-success response → `ProblemDetailsException` (through the real `ProblemDetailsHandler`).

`CreateContact`

- [x] Sends `POST contacts` with a body carrying first name, last name and the birthday as `DateOnly` (`yyyy-MM-dd`, no time part).
- [x] A `null` birthday is sent as `null`.
- [x] `201` with `Location: .../contacts/42` → returns `42`.
- [x] `2xx` without `Location`, with a non-numeric last segment, or with a trailing slash → returns `0`.
- [x] Without the problem-details handler, a non-success response → returns `0`.
- [x] With the problem-details handler, a `400` problem → `ProblemDetailsException` carrying the field errors.

`GetContactByIdAsync`

- [x] `200` JSON → the `ContactModel` (including `DateOnly` birthday and a `null` birthday); request URI is `contacts/{id}`.
- [x] `404` problem+json → `null`.
- [x] A non-404 problem (`500`) → `ProblemDetailsException` is not swallowed.

`DeleteContact`

- [x] Sends `DELETE contacts/{id}`; a success status completes without throwing.
- [x] A non-success status → `ProblemDetailsException` with the handler, `HttpRequestException` without it.

`UpdateContact`

- [x] Sends `PUT contacts/{id}` with a body carrying the names and the `DateOnly` birthday; a success status completes.
- [x] A non-success status → `ProblemDetailsException` with the handler, `HttpRequestException` without it.

Both:

- [x] Only `FakeHttpMessageHandler` + xUnit `Assert`; data through `ContactBuilder`; no `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx -clp:ErrorsOnly` clean; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

- `src/AddressBook.Web/AddressBookApiService.cs` — escape the search term.
- `src/AddressBook.Web.Tests/Tests/Services/AddressBookApiServiceTests.cs` — new.
- `docs/specs/AddressBook.Web.md` — only if it describes how the search request is built.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B17 done.
- `docs/tasks/issue-161-api-service-tests.md` — this plan, checklist ticked.

## 4. Approach

- One test class, one `[Fact]`/`[Theory]` per behaviour, grouped by service method; each test builds its own
  `FakeHttpMessageHandler` and calls `handler.CreateService()` (real `ProblemDetailsHandler` in the pipeline) or
  `CreateService(withProblemDetails: false)` for the paths the handler hides.
- Requests are asserted through `handler.LastRequest` (`Method`, `Uri`, `Body`); the body is parsed with
  `System.Text.Json` and the `birthday` property compared as a string, so the `DateOnly` format is pinned
  without depending on the serialiser configuration of the production code.
- Models come from `ContactBuilder` (`New.Valid()`, `New.WithoutBirthday()`, `Existing.Valid(id)`); the expected
  `DateOnly` is derived from the model's `DateTime`.
- Whitespace-only terms use a `[Theory]` (`""`, `" "`, `"\t"`).

## 5. Tests

The tests above are the deliverable and also guard the fix. Playwright API tests are not needed — the API contract
is unchanged (ASP.NET decodes the query). No UI E2E spec: the escaping is fully observable at the service level.

## 6. Verification

`dotnet build src/AddressBook.slnx -clp:ErrorsOnly`; `dotnet test --project src/AddressBook.Web.Tests`. No browser
walk — the service is exercised against a fake handler. Each test must fail when the line it covers is broken
(spot-check by mutating the service temporarily and reverting).

## 7. Out of scope

- Any change to `AddressBookApiService` other than the search-term escaping.

## 8. Decisions

- The search-term escaping defect is fixed on this branch, with tests that confirm the new behaviour (chosen in plan review).
- The rest of the plan is approved as written.
