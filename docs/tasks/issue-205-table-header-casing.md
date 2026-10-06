# Issue #205 — Use one casing for table column headers and form labels of contacts

- Issue: https://github.com/askrinnik/AddressBook2025/issues/205
- Title: Use one casing for table column headers and form labels of contacts
- Lane: Feature
- Complexity: S

## Requirement

The contact form labels and validation messages use sentence case (`First name`, `Last name`), while the column headers of the contacts table use title case (`First Name`, `Last Name`). The same field has two names on adjacent screens.

## Acceptance

- [x] The table column headers and the form labels use the same casing.
- [x] bUnit tests (`ContactsTableHarness` sort helpers, `ContactsListTests`) and UI E2E (`src/UiTests` sort locators) are updated.
- [x] `docs/specs/AddressBook.Web.md` matches the new headers.

## Affected files

- `src/AddressBook.Web/Pages/Contacts.razor` — sort labels and `DataLabel` of the first and last name columns.
- `src/AddressBook.Web.Tests/Harnesses/ContactsTableHarness.cs` — doc comments naming the headers.
- `src/AddressBook.Web.Tests/Specs/Pages/ContactsListTests.cs` — `SortBy("First name")` / `SortBy("Last name")`.
- `src/UiTests/src/components/contacts-table.component.ts` — `sortLabel` arguments.
- `src/UiTests/tests/contacts/sort-paginate.spec.ts` — test titles and comment.
- `docs/specs/AddressBook.Web.md` — column header text.

## Approach

Rename the visible header text to sentence case and keep the sort labels (`fn_field`, `ln_field`), so sorting logic is unchanged. The mobile `DataLabel` values follow the headers.

## Tests

Existing bUnit and UI E2E sort tests run against the new header text; they fail if the header and the locator differ.

## Verification

Full build, bUnit suite, API suite and UI E2E suite are green; the sort tests exercise the renamed headers.

## Out of scope

- Validation messages and form labels, which already use sentence case.
- The API-side FluentValidation messages (`'First Name' must not be empty.`), which come from the API and not from the table.

## Decisions

- Sentence case (`First name`, `Last name`), as in the form (chosen by the user).
