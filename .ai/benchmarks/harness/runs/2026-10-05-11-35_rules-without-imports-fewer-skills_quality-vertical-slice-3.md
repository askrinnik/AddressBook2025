Ignoring 72 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["C:/dev/AddressBook2025"].hasTrustDialogAccepted: true in C:\Users\Sanya\.claude.json.
Nothing has been edited. Below is how I'd implement it, based on how `Birthday` flows through the code today.

## Decisions I need from you first

`CLAUDE.md` asks me to confirm these before implementing. My proposed defaults are in the table.

| Decision | Proposal |
|---|---|
| Required or optional | Optional. `null` and empty are both stored as `NULL`. |
| Max length | 254 characters, the usual email limit. The existing name fields use 30. |
| Format | The FluentValidation `.EmailAddress()` rule, applied only when a value is present. |
| Normalisation | Trim whitespace. Keep the case the user typed. |
| Uniqueness | None. Two contacts may share an address. |
| Shown in the contacts list | Not shown in the table. It appears only on the create and edit forms. |
| Searchable | No. Search stays on first and last name. |
| Existing rows | The new column is nullable, so existing rows get `NULL`. No backfill. |

Say so if any of these should differ. The biggest effects are searchability, which touches `AddressBookRepository.cs:21`, and the list column.

## What I would change

**Contracts** (`src/AddressBook.Contracts`)
- Add `string? Email { get; set; }` to `CreateContactCommand` and `UpdateContactCommand`.
- Add `string? Email` to the `ContactModel` record, after `Birthday`.
- This is a breaking change for anything that constructs `ContactModel` positionally. That includes `GetContactByIdQueryHandler`, `GetFilteredContactsQueryHandler`, the Web test builders and the harnesses.

**API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `string? Email { get; set; }` with an XML doc comment.
- `DataAccess/ContactConfiguration.cs`: add `HasMaxLength(254)` and `IsRequired(false)`.
- New EF Core migration that adds a nullable `Email` column. I'd generate it with `dotnet ef migrations add` rather than write it by hand. The model snapshot updates with it.
- `DataAccess/AddressBookRepository.cs`: add `.SetProperty(c => c.Email, item.Email)` to the `ExecuteUpdateAsync` call in `UpdateAsync`. `ExecuteUpdate` writes only listed properties, so without this an edit would silently drop the email.
- `CreateContactCommandHandler` and `UpdateContactCommandHandler`: map `Email` with a trim, turning blank into `null`.
- `GetContactByIdQueryHandler` and `GetFilteredContactsQueryHandler`: pass `Email` into `ContactModel`.
- `CreateContactCommandValidator` and `UpdateContactCommandValidator`: add the same rule to both, with `.MaximumLength(254).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))`. Failures come back as the existing RFC 7807 validation errors.

**Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `string? Email` with `[EmailAddress]` and `[MaxLength(254)]`, so the form validates before the request is sent.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add a `MudTextField Label="Email"` with `data-testid="contact-form-email"`. In `EditContact`, also copy `contact.Email` into the model.
- `AddressBookApiService.cs`: map `Email` onto the create and update commands. I haven't read this file yet, so I'd confirm where `Birthday` is mapped there.
- Server-side validation errors for `Email` should show on the field through the existing `AddCustomError` path. I'd verify that.

**Tests**
- `src/ApiTests` (Playwright, required for new API behaviour):
  - Update `contact.schema.ts` and `contact.factory.ts`.
  - Create and update with and without an email.
  - Boundaries at 254 and 255 characters.
  - Negatives: a malformed address, and an email field sent as a non-string.
  - Update clears the email when `null` is sent.
  - Read-back through GET by id.
  - A schema contract check and a problem-details check for the invalid email.
- `src/AddressBook.Web.Tests` (bUnit): add `Email` to `ContactBuilder` and `ContactFormHarness`, plus the `TestIds` entry. Cover typing an email on create, prefilling it on edit, and a client-side error for an invalid address.
- `src/UiTests` (Playwright UI): add the test id in `testids.ts` and the field in `contact-form.component.ts`. Add one edit or lifecycle assertion.

**Docs** (updated in the same change)
- `docs/specs/AddressBook.Contracts.md`: the command and `ContactModel` snippets.
- `docs/specs/AddressBook.Api.md`: the validation rules, the domain and the endpoint shapes.
- `docs/specs/AddressBook.Web.md`: the form fields.

## Order of work
1. Contracts and domain, with the migration.
2. Repository, handlers and validators.
3. API Playwright tests, run against the API.
4. Web model, pages and service.
5. bUnit and UI tests.
6. Docs.

I'd build `src/AddressBook.slnx` after step 1 to catch every positional `ContactModel` call site. Nothing will be committed or pushed unless you ask.

Once you confirm or adjust the decisions above, I can start.
