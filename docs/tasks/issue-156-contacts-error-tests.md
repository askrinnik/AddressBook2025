# Plan: Issue #156 — Blazor Tests B12: ContactsErrorTests

> **Issue:** [#156](https://github.com/askrinnik/AddressBook2025/issues/156) — «Blazor Tests B12: ContactsErrorTests» (Phase 2)
> **Mode:** test-authoring — **no production code (`AddressBook.Web`) changes**, no new `data-testid`.

## 1. Requirement

`Tests/Pages/ContactsErrorTests.cs` — bUnit tests of the load-error path of `Pages/Contacts.razor`:
the service mock throws → the top `Error` banner and the `MudAlert` in `NoRecordsContent` show the message.

## 2. Acceptance

- [ ] Load failure → `Error` banner shows the exception message.
- [ ] Load failure → `MudAlert` shows the same message, the table has no rows and shows "No matching records found".
- [ ] Load failure → the alert is visible (not the `invisible` class).
- [ ] A later successful search (empty result) clears the alert text and hides it again.
- [ ] Only `MudTestContext` + `ContactsTableHarness` + xUnit `Assert`; no `Task.Delay`/`Sleep`.
- [ ] `dotnet build src/AddressBook.slnx` without new warnings; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

- `src/AddressBook.Web.Tests/Tests/Pages/ContactsErrorTests.cs` — new.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B12 done.

## 4. Tests

bUnit page-level scenarios (see Acceptance); Playwright API/UI not needed — behaviour does not change.

## 5. Out of scope

Delete failure, banner clearing on recovery (the page never calls `Error.Clear`), harness self-tests (already exist).
