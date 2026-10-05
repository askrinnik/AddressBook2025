Ignoring 45 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["C:/dev/AddressBook2025"].hasTrustDialogAccepted: true in C:\Users\Sanya\.claude.json.
I haven't edited anything. Email is an additive, nullable column, and it touches every layer that already carries `Birthday`. I read the domain, contracts, handlers, repository and Web models. I only grepped `GetContactByIdQueryHandler.cs` and the Blazor edit page, so check those two when implementing.

## Design decisions

- **Type:** `string?`. `null` means no email. The API normalizes an empty or whitespace string to `null`, so a client can clear the field on update.
- **Validation:** a FluentValidation rule applied only when a value is present: `.EmailAddress().MaximumLength(254)`. 254 is the practical limit for email addresses, and it is used for both the validator and the DB column.
- **Search:** no change. The filter stays on first and last name. Say so if you want email searchable.
- **Uniqueness:** none. The spec doesn't ask for it, and it would add a conflict case.

## Changes by layer

**Contracts** (`src/AddressBook.Contracts`)
- Add `string? Email { get; set; }` to `CreateContactCommand.cs` and `UpdateContactCommand.cs`, with XML docs.
- Add `string? Email` to the `ContactModel` record and its `<param>` docs. Put it last so positional construction stays easy to update.

**API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `public string? Email { get; set; }`.
- `DataAccess/ContactConfiguration.cs`: add `builder.Property(e => e.Email).HasMaxLength(254).IsRequired(false);`.
- **Migration:** add one with `dotnet ef migrations add ContactEmail`. It creates a nullable `nvarchar(254)` column, so existing rows are unaffected. The model snapshot updates with it.
- `Create/UpdateContactCommandValidator.cs`: add the conditional email rule (`.When(x => !string.IsNullOrWhiteSpace(x.Email))`).
- `Create/UpdateContactCommandHandler.cs`: set `Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim()`. Trim happens after validation, per the architecture rules.
- `DataAccess/AddressBookRepository.cs`: add `.SetProperty(c => c.Email, item.Email)` to `UpdateAsync`. The bulk `ExecuteUpdateAsync` is easy to miss, and without this line updates would silently ignore email.
- `GetFilteredContactsQueryHandler.cs` and `GetContactByIdQueryHandler.cs`: pass `c.Email` into `ContactModel`.
- Controllers need no change, since they only pass through to `ISender`.

**Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `Email` with `[EmailAddress]` and `[StringLength(254)]`, so the form gives instant feedback. The API still validates.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add a `MudTextField Label="Email"` with `For=...` and `data-testid="contact-form-email"`. Server-side field errors already map onto fields through `ValidationMessageStore`.
- `EditContact.razor` (around line 60): map `contact.Email` into the model.
- `AddressBookApiService.cs` (the create and update mappings, around lines 36 and 73): copy `Email` into the commands.
- `Pages/Contacts.razor`: optionally add an Email column. I'd add it as a plain, non-sortable column. Sorting would also need the `Contacts.razor.cs` sort switch.

## Tests

Per `CLAUDE.md`, API behaviour changes ship with Playwright API tests.
- **`src/ApiTests`:**
  - Add `email` to `contact.schema.ts` and the contact DTO and factory.
  - Add create and update cases:
    - happy path (create, read back, update, clear to `null`);
    - boundaries (254 characters passes, 255 fails);
    - negatives (malformed address returns a 400 with `messagesFor('email')`);
    - omitted and empty-string email both read back as `null`.
  - Update the contract and problem-details specs if they enumerate fields.
- **`src/UiTests`:**
  - Add the testid to `src/utils/testids.ts` and a method on `contact-form.component.ts`.
  - Add a create and edit round-trip assertion that fills in an email and checks it after saving.
- **`src/AddressBook.Web.Tests`:**
  - Update `ContactFormHarness`, `TestIds` and `ContactBuilder`, plus the Create and Edit page tests.

## Docs (same change, per `update-docs-on-code-change.md`)
- `docs/specs/AddressBook.Api.md`: the field, the validation rule, and the null normalization.
- `docs/specs/AddressBook.Contracts.md`: the commands and `ContactModel`.
- `docs/specs/AddressBook.Web.md`: the form fields.
- `src/ApiTests/README.md`, only if it lists fields.

## Things to watch
- **Existing `@code` blocks:** `CreateContact.razor` has an inline `@code { }` block, which the Blazor conventions forbid. I'd leave it alone to keep the diff focused, unless you want it moved to code-behind while I'm in there.
- **Comments:** new comments must be in English, present tense, and must not narrate the change.
- **Order of work:** contracts, then API plus migration, then Web, then tests, then docs. I'd run the API tests against a local DB before touching the UI tests.
- **Git:** I won't commit or push unless you ask.

Do you want email searchable, and should the list show an Email column? Otherwise I'll go with the defaults above.
