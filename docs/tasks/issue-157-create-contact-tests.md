# Plan: Issue #157 — Blazor Tests B13: CreateContactTests

> **Issue:** [#157](https://github.com/askrinnik/AddressBook2025/issues/157) — «Blazor Tests B13: CreateContactTests» (Phase 2)
> **Mode:** test-authoring — **no production code (`AddressBook.Web`) changes**, no new `data-testid`.

## 1. Requirement

`Tests/Pages/CreateContactTests.cs` — bUnit page-level tests of `Pages/CreateContact.razor`: validation blocks submit,
a valid form calls `CreateContact` and navigates, Cancel navigates without a call, and `_isLoading` disables submit.

## 2. Acceptance

- [x] Empty First/Last name → submit does not call `CreateContact`; the required messages for both fields are visible; no navigation.
- [x] Only one name empty → still blocked, message for that field only.
- [x] Valid form → `CreateContact` called once with the entered values → navigation to `/contacts`.
- [x] Valid form without birthday (optional field) → `CreateContact` called with `Birthday == null` → navigation to `/contacts`.
- [x] Cancel → navigation to `/contacts`, `CreateContact` not called.
- [x] While `CreateContact` is pending, the submit button is disabled; after it completes it is enabled again / navigation done.
- [x] Only `MudTestContext` + `ContactFormHarness` + xUnit `Assert`; no `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx` without new warnings; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

- `src/AddressBook.Web.Tests/Tests/Pages/CreateContactTests.cs` — new.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B13 done.

## 4. Tests

bUnit page-level scenarios (see Acceptance); Playwright API/UI not needed — behaviour does not change.

## 5. Out of scope

Server-side errors / `ProblemDetailsException` mapping (B14), edit page (B15).
