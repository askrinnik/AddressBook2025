# Plan: Issue #159 — Blazor Tests B15: EditContactTests + EditContactNotFoundTests

> **Issue:** [#159](https://github.com/askrinnik/AddressBook2025/issues/159) — Phase 2
> **Mode:** test-authoring (bUnit); no production code changes.

## 1. Requirement

bUnit page-level tests of `Pages/EditContact.razor`: prefill from `GetContactByIdAsync`, Save → `UpdateContact` + navigation,
Cancel; `null` contact → `_notFound` branch (`MudAlert` "Contact not found." + "Back to Contacts" button).

## 2. Acceptance

- [x] Existing contact → first name, last name and birthday are prefilled; the submit button reads "Save".
- [x] Contact without birthday → birthday is empty.
- [x] Save with unchanged values → `UpdateContact(id, model)` with the prefilled values; navigates to `/contacts`.
- [x] Save after editing fields → `UpdateContact` receives the edited values.
- [x] Birthday cleared → `UpdateContact` receives a `null` birthday.
- [x] Cleared first/last name → submit blocked, "required" messages, no `UpdateContact`, no navigation.
- [x] Cancel → navigates to `/contacts`, no `UpdateContact`.
- [x] While `UpdateContact` is pending the submit button is disabled; navigates after completion.
- [x] Contact not found (`null`) → "Contact not found." alert and "Back to Contacts" button; no form.
- [x] "Back to Contacts" → navigates to `/contacts`.
- [x] Only `MudTestContext` + `ContactFormHarness` + xUnit `Assert`; no `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx` clean; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

- `src/AddressBook.Web.Tests/Tests/Pages/EditContactTests.cs` — new.
- `src/AddressBook.Web.Tests/Tests/Pages/EditContactNotFoundTests.cs` — new.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B15 done.

## 4. Tests

Playwright API/UI not needed — behaviour does not change.

## 5. Out of scope

Server error handling on edit (the shared logic is covered by B14 on the create page); model-level summary component (B16).
