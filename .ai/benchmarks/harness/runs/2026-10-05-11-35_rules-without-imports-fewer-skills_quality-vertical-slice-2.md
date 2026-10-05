Ignoring 72 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["C:/dev/AddressBook2025"].hasTrustDialogAccepted: true in C:\Users\Sanya\.claude.json.
I haven't edited anything. Per `CLAUDE.md`, a feature request needs a few open decisions confirmed before I implement, so those come first, then the plan.

## Decisions to confirm

My recommendation is in bold.

| # | Decision | Recommendation |
|---|---|---|
| 1 | Max length | **254**, the practical email limit. It would be set in the validator and in `HasMaxLength` on the column. |
| 2 | Format check | **FluentValidation `.EmailAddress()`, applied only when a value is given.** I would also add `[EmailAddress]` on the Web model so the form shows the error before the round trip. |
| 3 | Optional semantics | **Null or blank is stored as `null`.** I would trim the value, as the handlers already do for names. |
| 4 | Uniqueness | **None.** Two contacts can share an email, and no index is needed. |
| 5 | Searchable? | **Yes.** I would add `Email` to the `Contains` filter in `AddressBookRepository.RetrieveManyAsync`, but only if you want email lookup. Say no if you want the change kept small. |
| 6 | Shown in the contacts list? | **Yes, as a column in `Contacts.razor`.** The edit and create forms get the field regardless. |
| 7 | Existing rows | **Email is `NULL` for them.** The migration adds a nullable column, so there is no backfill. |

## What I would change

**Contracts** (`src/AddressBook.Contracts`)
- Add `string? Email { get; set; }` to `CreateContactCommand` and `UpdateContactCommand`.
- Add `string? Email` to the `ContactModel` record as a new last positional parameter. Every `new ContactModel(...)` call site must then be updated. `GetContactByIdQueryHandler` and `GetFilteredContactsQueryHandler` are two, and I would grep for the rest.

**API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `public string? Email { get; set; }` with an XML doc comment, matching the other properties.
- `DataAccess/ContactConfiguration.cs`: add `builder.Property(e => e.Email).HasMaxLength(254).IsRequired(false);`.
- `DataAccess/AddressBookRepository.cs`:
  - Add `.SetProperty(c => c.Email, item.Email)` to `UpdateAsync`. This is easy to miss, because the update uses `ExecuteUpdateAsync` and skips unmapped fields without any error.
  - Optionally extend the search filter (decision 5).
- `Application/CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: map `Email` to the entity, trimmed and normalised to `null` when blank.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add `RuleFor(x => x.Email).MaximumLength(254).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))`.
- Both query handlers: pass `contact.Email` into `ContactModel`.
- Migration: run `dotnet ef migrations add ContactEmail` in `src/AddressBook.Api`. It adds a nullable `nvarchar(254)` column and updates `ApplicationDbContextModelSnapshot.cs`.
- `ContactsController`: probably no change, since the commands bind from the body. I would confirm that when implementing.

**Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `[EmailAddress] [MaxLength(254)] public string? Email`.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`:
  - Add a `MudTextField Label="Email"` with `data-testid="contact-form-email"`, following the existing field pattern.
  - Copy `Email` from the loaded contact in `EditContact`'s `OnInitializedAsync`.
- API service: I haven't opened it yet. I would check that `CreateContact` and `UpdateContact` copy every field from the form model to the command, and add `Email` there.
- `Pages/Contacts.razor`: add an Email column (decision 6).

**Tests** (`src/ApiTests`, Playwright)
- Happy path: create with an email, then GET it back. Update it, then GET it back. Create without an email, which returns `null`.
- Boundaries: exactly 254 characters is accepted, and 255 is rejected with a 400 problem-details response.
- Negatives: a malformed address such as `not-an-email` gives a 400 with the error keyed on `Email`.
- Blank or whitespace is treated as no email.
- Search by email, if decision 5 is yes.
- I would read `playwright-conventions.instructions.md` first and follow its naming and structure.

**Docs**, in the same change as the code:
- `docs/specs/AddressBook.Api.md`: request/response shapes, the validation rule, and the domain and data-access notes.
- `docs/specs/AddressBook.Contracts.md`: sections 3.1, 3.2, 5.1 and the file table.
- `docs/specs/AddressBook.Web.md`: the form fields and the list column.

## Order of work and verification
1. Contracts, domain, configuration and migration.
2. Handlers, validators and repository.
3. Web.
4. Tests and docs.

Then I would run `dotnet build src/AddressBook.slnx` and the ApiTests suite, and check the create and edit forms in a browser.

I won't commit or push unless you ask. Tell me which of the seven decisions you want changed, or say "go with the recommendations", and I'll start.
