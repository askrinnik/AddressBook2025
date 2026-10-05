Ignoring 45 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["C:/dev/AddressBook2025"].hasTrustDialogAccepted: true in C:\Users\Sanya\.claude.json.
I changed no files. This plan follows how `Birthday` already flows through the code. I read the domain, EF configuration, validator, repository, list handler, Web model, API service and Contracts spec. I only matched the other files (handlers, Razor pages, tests) by name, so I haven't read them yet.

## Design decisions

- **Optional means nullable.** I'd use `string? Email` everywhere. A blank value from the UI is normalised to `null`, so there is one "no email" representation. The column is nullable with `HasMaxLength(254)`, the practical RFC 5321 limit.
- **Validation.** FluentValidation rule: `EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email))`. The message is a 400 ProblemDetails keyed on `Email`, which the Web form already maps through `ValidationMessageStore`.
- **Trimming.** The handlers trim after validation, as the architecture rules require, and store `null` when the value is blank.
- **Search.** I'd leave search unchanged. You didn't ask for it, and searching by email is a separate decision.

## Changes

**Contracts** (`src/AddressBook.Contracts`)
- Add `string? Email { get; set; }` to `CreateContactCommand.cs` and `UpdateContactCommand.cs`.
- Add `string? Email` to the `ContactModel` record in `Models/ContactModel.cs`. I'd append it last so positional construction elsewhere only needs the extra argument.

**API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `string? Email`.
- `DataAccess/ContactConfiguration.cs`: `builder.Property(e => e.Email).HasMaxLength(254).IsRequired(false);`
- `DataAccess/AddressBookRepository.cs`: add `.SetProperty(c => c.Email, item.Email)` to `UpdateAsync`. This is easy to miss, because `ExecuteUpdateAsync` won't pick up new properties by itself.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add the email rule to both.
- `Application/CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: map and trim `Email`.
- `Application/GetContactByIdQueryHandler.cs` and `GetFilteredContactsQueryHandler.cs`: pass `c.Email` into `new ContactModel(...)`.
- **Migration:** run `dotnet ef migrations add ContactEmail` from `src/AddressBook.Api`. It adds a nullable `nvarchar(254)` column, so existing rows are unaffected. The snapshot and designer files are generated, so I wouldn't hand-edit them.

**Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `string? Email`.
- `AddressBookApiService.cs`: map `Email` in both `CreateContact` and `UpdateContact`.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add a `MudTextField` for Email with `InputType.Email`, a label, and a `data-testid` like the existing fields.
- `Pages/EditContact.razor.cs`: populate the model's `Email` from the loaded `ContactModel`. I'd confirm how it copies fields.
- `Pages/Contacts.razor`: optionally add an Email column to the table. I'd ask you about this one.

**Tests**
- **API (`src/ApiTests`)**, as `CLAUDE.md` requires for API changes:
  - Update `contact.schema.ts`, the DTO in `tests/dtos/`, and `contact.factory.ts`. The factory gets a valid email and invalid-email variants.
  - Extend `create.spec.ts` and `update.spec.ts` to cover:
    - the happy path (create, read back, delete);
    - email omitted or `null`;
    - a 254-character email accepted and a 255-character one rejected;
    - a malformed email returning a 400 with an `Email` error;
    - clearing an email on update.
  - Check `problem-details.spec.ts` and `schema.spec.ts` for assertions that pin the full model shape.
- **Web component tests (`src/AddressBook.Web.Tests`)**: update `ContactBuilder`, `ContactFormHarness`, `TestIds`, and the Create and Edit page tests.
- **UI E2E (`src/UiTests`)**: add the test id in `testids.ts`, a field in `contact-form.component.ts`, and the factory. Add an email assertion to the edit or lifecycle spec.

**Docs**, updated in the same change per `update-docs-on-code-change.md`
- `docs/specs/AddressBook.Contracts.md`: the code snippets in sections 3.1, 3.2 and 5.1, plus the file-structure table descriptions.
- `docs/specs/AddressBook.Api.md`: the endpoint payloads, the validation rules and the domain model.
- `docs/specs/AddressBook.Web.md`: the form fields.
- A new `docs/tasks/issue-<n>-contact-email.md` plan if this goes through `/implement-issue`.

## Verification

1. `dotnet build src/AddressBook.slnx`.
2. Apply the migration against a local DB.
3. Run the Web component tests, the API Playwright suite and the UI suite.

## Questions for you

- Should the contacts list show an Email column, or only the create and edit forms?
- Should search also match email?
- Is the standard `EmailAddress()` check strict enough, or do you want a regex?

I won't commit or push unless you ask.
