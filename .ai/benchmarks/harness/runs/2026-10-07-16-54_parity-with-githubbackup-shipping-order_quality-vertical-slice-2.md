Email follows the same path as `Birthday`, which is the existing optional field. It goes through Contracts, the API, the database and the Web UI, with tests and docs alongside. I haven't edited anything.

## Decisions to confirm first

CLAUDE.md asks me to settle these with you before I implement. My proposed defaults are in brackets.

1. **Max length** [254, the practical RFC limit]. It would be a new `ContactRules.EmailMaxLength` constant. The validators, the EF column and the Web model would all read it, as they do for `NameMaxLength`.
2. **Format** [a basic "looks like an email" check]. This would be FluentValidation's `EmailAddress()` on the API and `[EmailAddress]` on the Web model. The message would be a shared `ContactRules` constant, like `BirthdayInFutureMessage`, so client and server errors match.
3. **Empty value** [an empty or whitespace string is stored as `null`; the value is trimmed]. That gives one representation of "no email" and keeps an empty string from failing the format check.
4. **Uniqueness** [none]. The same email can appear on several contacts.
5. **Search and list** [show it in the contacts table and make it sortable, but don't add it to the search]. The search currently covers only first name and last name in `AddressBookRepository.cs:21`. Say if you want email searchable too.
6. **Existing rows and seed data** [existing rows get `NULL`, and the two seeded contacts stay without an email].
7. **Case** [stored as entered]. Forcing lowercase is the alternative.

## Changes

**Contracts** (`src/AddressBook.Contracts`)
- `ContactRules.cs`: add `EmailMaxLength` and the invalid-format message.
- `CreateContactCommand.cs` and `UpdateContactCommand.cs`: add `string? Email`.
- `Models/ContactModel.cs`: add `string? Email` as the last positional parameter. This is a wire-contract addition, and a missing property reads as `null`.

**API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `string? Email`.
- `DataAccess/ContactConfiguration.cs`: add `HasMaxLength(ContactRules.EmailMaxLength).IsRequired(false)`.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add an `Email` rule that applies only when a value is present, with the max length and the format.
- `CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: trim the email and map empty to `null`.
- `DataAccess/AddressBookRepository.cs:43-48`: add `.SetProperty(c => c.Email, item.Email)` to the `ExecuteUpdateAsync` call. This one is easy to miss, because without it an edit would silently not save the email.
- `GetContactByIdQueryHandler.cs` and `GetFilteredContactsQueryHandler.cs`: pass `Email` into `new ContactModel(...)`.
- Migration `AddContactEmail`, generated with `dotnet ef migrations add`. It adds a nullable `nvarchar(254)` column and updates the model snapshot. I wouldn't touch `HasData`.

**Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `Email` with `[StringLength(ContactRules.EmailMaxLength)]` and `[EmailAddress]`.
- `Pages/CreateContact.razor` and `EditContact.razor`: add a `MudTextField` with `data-testid="contact-form-email"`, bound with `For=`.
- `EditContact.razor:94`: load the existing email into the model.
- `AddressBookApiService.cs:36` and `:70`: send `Email` in the create and update commands.
- `Pages/Contacts.razor` and `Contacts.razor.cs`: add an Email column and a sort case.

**Tests** (new API behaviour needs Playwright tests per CLAUDE.md)
- `src/ApiTests`:
  - Extend `contact.factory.ts` and `contact.schema.ts`.
  - Add create and update tests for a valid email, a missing email, an empty email stored as `null`, a trimmed email, the max length (254 passes, 255 fails), a bad format, and `errors.Email` in the ProblemDetails.
  - Add a GET round-trip test.
- `src/AddressBook.Web.Tests`: update `ContactBuilder`, `ContactFormHarness` and `TestIds`. Add form tests for the email field, plus service tests that email is sent and loaded.
- `src/UiTests`: update `contact.factory.ts`, `contact-form.component.ts`, `contacts-table.component.ts` and `testids.ts`. Add an email step to the CRUD lifecycle and edit specs.

**Docs**, as the update-docs rule requires
- `docs/specs/AddressBook.Api.md`: the request and response shape, the validation rules and the column.
- `docs/specs/AddressBook.Contracts.md`: the changed commands and model.
- `docs/specs/AddressBook.Web.md`: the form field and the table column.

## Order and verification

1. Contracts.
2. API and migration.
3. API tests.
4. Web and bUnit tests.
5. UI tests.
6. Docs.
7. Run the build, bUnit and both Playwright suites via the `build-runner` agent.

I'd use `/implement-issue` for this. I won't commit or push unless you ask.

Please confirm or adjust the seven decisions, especially search, the format check and the length. Then I'll start.
