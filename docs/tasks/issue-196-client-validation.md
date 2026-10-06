# Issue #196 — Client-side validation of the contact form per the API rules

- Issue: https://github.com/askrinnik/AddressBook2025/issues/196
- Title: Blazor Tests B28: Клиентская валидация формы контакта по правилам API (длина, пробелы, будущая дата)
- Lane: Feature
- Complexity: M

## Requirement

The Create and Edit forms both bind `CreateContactModel`. Their client-side validation rejects the same input as the API, so an invalid form never calls the service:

- first and last name are not empty or whitespace-only;
- first and last name are at most 30 characters;
- the birthday is not later than today.

The API rules are in `CreateContactCommandValidator` and `UpdateContactCommandValidator`: `NotEmpty()` and `MaximumLength(30)` for the names, and `LessThanOrEqualTo(today)` with the message `Birthday cannot be in the future` for the birthday. The birthday rule is the only one with an explicit server message; the client uses that text.

Whitespace-only names are already rejected on the client: `RequiredAttribute` with the default `AllowEmptyStrings = false` uses `string.IsNullOrWhiteSpace`. That part needs tests only.

## Acceptance

- [x] Client validation matches the API rules: length ≤ 30, whitespace-only names rejected, birthday ≤ today.
- [x] bUnit tests for Create and Edit cover the boundaries with the existing `ContactBuilder` variants: 30 characters passes, 31 fails; whitespace fails; today passes, tomorrow fails. The service is not called when the form is invalid.
- [x] `docs/specs/AddressBook.Web.md` is updated.
- [x] On both pages the `MudDatePicker` has `MaxDate = DateTime.Today`.
- [x] On Edit, a loaded contact that already breaks a rule cannot be saved unchanged; the field shows the message.
- [x] `src/UiTests/tests/contacts/validation.spec.ts` matches the new behaviour.

## Affected files

- `src/AddressBook.Web/Models/NotInFutureAttribute.cs` (new) — field-level `ValidationAttribute`, default message `"{0} cannot be in the future"`, null is valid.
- `src/AddressBook.Web/Models/CreateContactModel.cs` — `[StringLength(30)]` on both names, `[NotInFuture]` on `Birthday`.
- `src/AddressBook.Web/Pages/CreateContact.razor`, `EditContact.razor` — `MaxDate="DateTime.Today"` on the `MudDatePicker`.
- `src/AddressBook.Web.Tests/Harnesses/ContactFormHarness.cs` — `BirthdayMaxDate`.
- `src/AddressBook.Web.Tests/Tests/Pages/CreateContactTests.cs`, `EditContactTests.cs` — boundary tests.
- `src/UiTests/tests/contacts/validation.spec.ts`, `src/UiTests/src/components/date-picker.component.ts` — updated cases and a read-only day helper.
- `docs/specs/AddressBook.Web.md` — client rules, messages, `MaxDate`, the model table.

## Approach

- The date rule is a field-level attribute, not `IValidatableObject`: `DataAnnotationsValidator` validates a single field through `TryValidateProperty`, so the message shows under the date picker.
- `[StringLength(30)]` keeps the DataAnnotations default message, because the server has no explicit length text. `[Display]` names feed `{0}`.
- `[Required]` stays as it is.
- `MaxDate` is a UX limit only; the attribute still validates a value that arrives another way.
- Server-error mapping is unchanged and stays covered by `CreateContactServerErrorTests`.

## Tests

- bUnit Create: 30 characters creates (first and last name), 31 blocks with the length message, whitespace blocks with the required message, birthday today creates, birthday in the future blocks with `Birthday cannot be in the future`, `MaxDate` equals today. Blocked cases assert `DidNotReceiveCreate()`.
- bUnit Edit: a loaded 31-character name and a loaded future birthday block submission; filled 30 characters, today, whitespace and 31 characters behave as above; `MaxDate` equals today. Blocked cases assert `DidNotReceiveUpdate()`.
- UI E2E: the 31-character cases move to the client group with exact messages; the future-birthday case becomes a check that the picker disables future days; a whitespace case is added.
- No API tests: the API does not change.

## Verification

- `dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`.
- UI E2E `validation.spec.ts` against the running app (full UI suite at the end of the batch).
- Browser walk of the picker and messages at the end of the batch.

## Out of scope

- Sharing the limit 30 through Contracts or a shared constant.
- Rewording the client length message to match FluentValidation's default.
- Agreeing on the time zone between the browser's `DateTime.Today` and the server's.
- The Web.Tests rework of #197.

## Decisions

- Duplicate the API rules on the client with DataAnnotations; use the server text where the server has one (chosen by the user).
- Length message keeps the DataAnnotations default `The field First name must be a string with a maximum length of 30.`; the alternative was a custom `First name must be 30 characters or fewer.`
- The future-birthday UI E2E is rewritten as a picker check, not deleted.
- No new attribute for whitespace names; tests lock in the behaviour of `[Required]`.
