# Issue #195 — UI texts: quotes in the empty table state and field names in validation messages

- Issue: https://github.com/askrinnik/AddressBook2025/issues/195
- Title: Blazor Tests B27: Тексты UI: кавычки в пустом состоянии таблицы и имена полей в сообщениях валидации
- Lane: Feature
- Complexity: S

## Requirement

The empty contacts table shows `No matching records found` without quotation marks. The required-field messages on the Create and Edit forms use display names (`The First name field is required.`, `The Last name field is required.`), and the field labels of both forms read `First name` and `Last name`. Today `Contacts.razor` prints literal quotes, `CreateContactModel` has no `[Display]` attribute, and the labels differ in case.

## Acceptance

- [x] The empty table state text has no quotes.
- [x] Validation messages use the display names; the `Label` of the Create and Edit fields matches them.
- [x] bUnit tests are updated: `CreateContactTests`, `EditContactTests`, `ContactsTableHarness.IsNoRecordsShown`.
- [x] UI E2E is checked and updated: `contacts-table.component.ts` `NO_RECORDS_TEXT`, validation message checks.
- [x] `IsNoRecordsShown` and the UI `noRecords` locator match the exact text, so a return of the quotes is caught.
- [x] A bUnit check shows that the Create and Edit forms render the labels `First name` and `Last name`.
- [x] `docs/specs/AddressBook.Web.md` matches the new labels and display names.

## Affected files

- `src/AddressBook.Web/Pages/Contacts.razor` — remove the quotes in the empty state.
- `src/AddressBook.Web/Models/CreateContactModel.cs` — `[Display(Name = "First name")]`, `[Display(Name = "Last name")]`.
- `src/AddressBook.Web/Pages/CreateContact.razor`, `EditContact.razor` — `Label="Last name"`. Both pages use `CreateContactModel`.
- `src/AddressBook.Web.Tests/Harnesses/ContactsTableHarness.cs` — exact-text `IsNoRecordsShown`.
- `src/AddressBook.Web.Tests/Harnesses/ContactFormHarness.cs` — `FieldLabels`.
- `src/AddressBook.Web.Tests/Tests/Pages/CreateContactTests.cs`, `EditContactTests.cs` — exact display-name messages and a label test each.
- `src/UiTests/src/components/contacts-table.component.ts` — exact match for `NO_RECORDS_TEXT`.
- `src/UiTests/tests/contacts/validation.spec.ts` — display-name message matchers.
- `docs/specs/AddressBook.Web.md` — empty-state text, labels, `[Display]` notes.

## Approach

- Labels stay explicit as `Label="..."` on each `MudTextField`; MudBlazor does not take them from `[Display]` by default.
- Messages keep the standard DataAnnotations wording with the `[Display]` name; no custom `ErrorMessage`.
- `FieldIdentifier.FieldName` stays `FirstName` / `LastName`, so server-error mapping is unaffected.
- `IsNoRecordsShown` checks the text of the empty-row typography elements for an exact match instead of `Markup.Contains`.
- Table column headers `First Name` / `Last Name` stay as they are.

## Tests

- bUnit: exact `The First name field is required.` / `The Last name field is required.` in the Create and Edit tests; `Render_ShowsSentenceCaseFieldLabels` in both; existing empty-state tests run against the exact-match harness.
- UI E2E: matchers `/The First name field is required/`, `/The Last name field is required/`; exact-match `noRecords` locator.

## Verification

- `dotnet test --project src/AddressBook.Web.Tests` is green.
- UI E2E: `validation.spec.ts` and `list-search.spec.ts` (full UI suite at the end of the batch).

## Out of scope

- Table column headers in Title Case (their sort locators depend on them).
- Custom `ErrorMessage` text, client length, whitespace and date rules (#196), test-code rework (#197).

## Decisions

- Display names `First name` / `Last name` and standard DataAnnotations messages (chosen by the user).
- Labels stay explicit rather than inferred from `[Display]`.
- Table headers are not changed.
