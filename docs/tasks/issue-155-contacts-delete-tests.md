# Plan: Issue #155 — Blazor Tests B11: ContactsDeleteTests

> **Issue:** [#155](https://github.com/askrinnik/AddressBook2025/issues/155) — «Blazor Tests B11: ContactsDeleteTests» (Phase 2)
> **Mode:** test-authoring — **no production code (`AddressBook.Web`) changes**, no new `data-testid`.

## 1. Requirement

`Tests/Pages/ContactsDeleteTests.cs` — bUnit tests of the delete flow on `Pages/Contacts.razor`:
opening the `MudMessageBox`; Cancel → `DeleteContact` not called; Yes → called and the table reloaded (`Received`).

## 2. Acceptance

- [ ] Delete click opens the confirmation dialog; nothing is deleted while it is open.
- [ ] Cancel → `DeleteContact` not called, no table reload, rows unchanged, dialog closed.
- [ ] Yes → `DeleteContact` called with the clicked row's id (not another row), the table is reloaded and shows the remaining rows, dialog closed.
- [ ] Only `MudTestContext` + `ContactsTableHarness` + `DeleteDialogHarness` + xUnit `Assert`; no `Task.Delay`/`Sleep`.
- [ ] `dotnet build src/AddressBook.slnx` without new warnings; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

- `src/AddressBook.Web.Tests/Tests/Pages/ContactsDeleteTests.cs` — new.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B11 done.

## 4. Tests

bUnit page-level scenarios (see Acceptance); Playwright API/UI not needed — behaviour does not change.

## 5. Out of scope

Delete failure (B12), harness self-tests (already exist).
