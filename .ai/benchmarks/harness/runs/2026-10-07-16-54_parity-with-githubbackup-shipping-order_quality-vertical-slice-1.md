Nothing was edited. Email follows the same path as `Birthday`, which is an optional scalar on `Contact`. It needs changes in the contracts, the API, the Web project, the tests and the docs. First, per CLAUDE.md, a few decisions need your confirmation.

## Decisions I need from you

1. **Length limit.** I propose 254, the practical maximum for an email address. It would be a new `ContactRules.EmailMaxLength`, read by the validators, the EF column and the Web model, like `NameMaxLength`.
2. **Format.** I propose FluentValidation's `.EmailAddress()` on the API and `[EmailAddress]` on the Web model. Both would be applied only when the value is non-empty.
3. **Empty values.** I propose trimming the value and storing blank as `null`. The API would accept both `null` and `""`.
4. **Uniqueness.** I propose none, because several contacts can share an address, such as a family mailbox.
5. **Search.** Should the `SearchText` filter also match the email? The repository currently searches first and last name only. I propose yes, because it is a one-line change. Say if you want to keep it name-only.
6. **List display.** Should the contacts table get an Email column? I propose yes. The edit and create forms get the field either way.
7. **Existing rows.** The column is nullable, so existing contacts get `NULL` and no backfill is needed.

## Planned changes

**Contracts (`src/AddressBook.Contracts`)**
- `ContactRules.cs`: add `EmailMaxLength`.
- `CreateContactCommand` and `UpdateContactCommand`: add `string? Email`.
- `ContactModel`: add `string? Email`. It is a positional record, so every constructor call needs updating.

**API (`src/AddressBook.Api`)**
- `Domain/Contact.cs`: add `string? Email`.
- `DataAccess/ContactConfiguration.cs`: add `HasMaxLength(ContactRules.EmailMaxLength)` and `IsRequired(false)`.
- Migration: add a nullable `Email` `nvarchar(254)` column with `dotnet ef migrations add ContactEmail`. The snapshot updates with it.
- `CreateContactCommandValidator` and `UpdateContactCommandValidator`: add a rule that runs only when the email is non-empty, with `MaximumLength` and `EmailAddress`.
- `CreateContactCommandHandler` and `UpdateContactCommandHandler`: trim the email and map blank to `null`.
- `AddressBookRepository.UpdateAsync`: add `.SetProperty(c => c.Email, item.Email)`. This is easy to miss, because it uses `ExecuteUpdate` and not change tracking. Without it, edits would silently not persist.
- `GetFilteredContactsQueryHandler` and `GetContactByIdQueryHandler`: pass `Email` into `ContactModel`.
- If you agree to decision 5, `RetrieveManyAsync` also matches `c.Email`.

**Web (`src/AddressBook.Web`)**
- `Models/CreateContactModel.cs` and the edit model: add `Email` with `[StringLength(ContactRules.EmailMaxLength)]`, `[EmailAddress]` and `[Display(Name = "Email")]`.
- `Pages/CreateContact.razor` and `EditContact.razor`: add `<MudTextField Label="Email" … data-testid="contact-form-email" />`.
- `AddressBookApiService.cs`: map `Email` when building the create and update commands and when reading contacts.
- `Pages/Contacts.razor` and `Contacts.razor.cs`: add the Email column, if you agree to decision 6.

**Tests**
- `src/ApiTests` (Playwright): create and update with a valid email, with no email, and with a blank email. Boundary cases at 254 and 255 characters. Negative cases for a malformed address and for a status 400 whose ProblemDetails has `errors.Email`. Read back through GET by id and the list. Search by email if it is in scope.
- `src/AddressBook.Web.Tests` (bUnit): update `ContactFormHarness`, `ContactBuilder` and `ContactsTableHarness`. Add a new `TestIds` entry. Cover the create and edit pages, the service mapping, and model validation.

**Docs, in the same change**
- `docs/specs/AddressBook.Api.md`: the validation rules, the response shape and the data model.
- `docs/specs/AddressBook.Contracts.md`: the commands and models.
- `docs/specs/AddressBook.Web.md`: the pages and the API service.

## Risks
- `ContactModel` is a positional record, so a missed call site fails to compile. That is the safe kind of failure.
- The `UpdateAsync` `SetProperty` omission described above is the one risk that would fail silently.
- Adding the migration is a schema change. Check the generated migration before it is applied anywhere.

Tell me which decisions to change (the defaults above apply otherwise), and whether to implement it directly or through `/implement-issue`.
