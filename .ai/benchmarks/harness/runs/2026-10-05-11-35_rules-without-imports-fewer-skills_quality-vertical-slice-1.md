Ignoring 72 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["C:/dev/AddressBook2025"].hasTrustDialogAccepted: true in C:\Users\Sanya\.claude.json.
Email follows the same path as `Birthday`, so I'd add it at every layer where `Birthday` appears. I haven't edited anything.

## What I'd change

**Contracts** (`src/AddressBook.Contracts`)
- Add `string? Email { get; set; }` to `CreateContactCommand` and `UpdateContactCommand`.
- Add `string? Email` to the `ContactModel` record, as a new last parameter. Every `new ContactModel(...)` call, including those in the Web tests, needs the extra argument.

**API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `public string? Email { get; set; }` with an XML doc comment.
- `DataAccess/ContactConfiguration.cs`: map it with `.HasMaxLength(254).IsRequired(false)`.
- `DataAccess/AddressBookRepository.cs`: add `.SetProperty(c => c.Email, item.Email)` to `UpdateAsync`. This is the easiest line to forget, and without it edits would silently not save.
- A new EF migration, for example `AddContactEmail`, adding a nullable `nvarchar(254)` column. Existing rows get `NULL`. The model snapshot updates with it.
- `Application/CreateContactCommandHandler`, `UpdateContactCommandHandler`, `GetContactByIdQueryHandler` and `GetFilteredContactsQueryHandler`: map `Email` in and out.
- `CreateContactCommandValidator` and `UpdateContactCommandValidator`: `RuleFor(x => x.Email).EmailAddress().MaximumLength(254).When(x => !string.IsNullOrEmpty(x.Email))`. Errors come back as RFC 7807 through the existing pipeline.

**Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `Email`.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add an optional `MudTextField` with `MaxLength="254"`, mirroring the existing fields and the client-side validation approach they use.
- `AddressBookApiService.cs`: pass `Email` through on create and update.
- `Pages/Contacts.razor` and `Contacts.razor.cs`: only if you want it in the list (decision 3).

**Tests**
- `src/ApiTests` (Playwright): create and update with and without an email, then read it back. Boundaries are 254 characters accepted and 255 rejected. Negatives are a malformed address (400 with a problem-details body) and a missing field (still succeeds). I'd also test that update can clear the email.
- `src/AddressBook.Web.Tests`: add `Email` to `ContactBuilder`, `ContactFormHarness` and `TestIds`. Add form tests in `CreateContactTests` and `EditContactTests`.

**Docs**, updated in the same change per `update-docs-on-code-change`:
- `docs/specs/AddressBook.Api.md`
- `docs/specs/AddressBook.Contracts.md`
- `docs/specs/AddressBook.Web.md`

**Verify:** build `src/AddressBook.slnx`, apply the migration, run the ApiTests and Web.Tests suites, then check the create and edit forms in a browser.

## Decisions I need from you

`CLAUDE.md` says to confirm these before implementing. My proposed default is in bold.

1. **Format and length:** **valid email syntax (FluentValidation `EmailAddress`), maximum 254 characters.** The alternative is a looser length-only check.
2. **Empty value:** **optional, and an empty or whitespace string is stored as `NULL`.** The alternative is to keep `""` as is.
3. **Contacts list:** **show it in the contacts table or the contact details, and don't search by it.** The alternative is to leave the table alone, or to extend the search to `Email` too.
4. **Uniqueness:** **not unique.** Family members often share an address. The alternative is a unique index, which changes the migration and adds a 409 case.
5. **Existing data:** **leave existing contacts' Email as `NULL`.** The seeded contacts get no email values.
6. **Normalization:** **trim whitespace and keep the case as entered.** The alternative is to lowercase on save.

Reply "go with the defaults" or list your changes. I'll then implement it. I won't commit or push unless you ask.
