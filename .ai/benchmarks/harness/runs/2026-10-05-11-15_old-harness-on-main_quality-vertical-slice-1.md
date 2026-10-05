I haven't edited anything. Email would follow the same path as `Birthday`, the existing optional field. It touches the contract, API, database, Web UI, tests and docs.

## Design decisions

- **Type and storage:** `string?`, `NVARCHAR(254) NULL`. 254 is the practical maximum length of an email address.
- **Validation (API):** `EmailAddress()` and `MaximumLength(254)`, both applied only when a value is present. These go in both the create and update validators, which duplicate their rules.
- **Empty values:** the handlers will trim the value and store an empty or whitespace string as `null`. This keeps "no email" to one representation. I'd also lowercase nothing, so what the user typed is preserved.
- **Search:** unchanged. The filter stays on first and last name. Adding Email would be a separate product decision.
- **Uniqueness:** none. The spec doesn't ask for it, and multiple contacts can share an address, such as a family or a team inbox.

## Changes by layer

**Contracts (`src/AddressBook.Contracts`)**
- `CreateContactCommand.cs` and `UpdateContactCommand.cs`: add `string? Email { get; set; }`.
- `Models/ContactModel.cs`: add `string? Email` as the last positional parameter.
  - This is a breaking change for every `new ContactModel(...)` call. I'd give the parameter a default of `null` to limit the churn. The main callers are the three API handlers and the Web.Tests builder and harness code.

**API (`src/AddressBook.Api`)**
- `Domain/Contact.cs`: add `public string? Email { get; set; }`.
- `DataAccess/ContactConfiguration.cs`: add `builder.Property(e => e.Email).HasMaxLength(254).IsRequired(false);`.
- **Migration:** run `dotnet ef migrations add ContactEmail`. It adds a nullable column, so existing rows are safe, and the model snapshot updates with it. The migration applies automatically on startup.
- `DataAccess/AddressBookRepository.cs:48`: add `.SetProperty(c => c.Email, item.Email)` to `UpdateAsync`. This is the easiest place to miss it. `ExecuteUpdateAsync` doesn't use change tracking, so without this line edits would silently not save.
- `Application/CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: map and normalise `Email`.
- `Application/GetContactByIdQueryHandler.cs:17` and `GetFilteredContactsQueryHandler.cs`: include `Email` in the `ContactModel` mapping.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add the email rules above.
  - The rules are `RuleFor(x => x.Email).EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email))`.
  - Errors use the existing RFC 7807 path, so the Web form's `AddCustomError` shows them without extra work.

**Web (`src/AddressBook.Web`)**
- `Models/CreateContactModel.cs`: add `[EmailAddress] [MaxLength(254)] public string? Email { get; set; }`, so the form validates on the client.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor:24`: add a `MudTextField` for Email with `data-testid="contact-form-email"`, matching the existing test ids.
  - `EditContact.razor` also needs `Email = contact.Email` in the model initialiser at line 58.
- `AddressBookApiService.cs:32-37` and `:69-74`: pass `Email = model.Email` in both commands.
- `Pages/Contacts.razor`: optionally show an Email column in the list. I'd include it, because otherwise the field is invisible after saving. I'd confirm with you first.

**Tests**

Per `CLAUDE.md`, new API behaviour ships with Playwright tests.
- **`src/ApiTests`:**
  - Add `email` to `contact.schema.ts` and to the data factory.
  - Happy path: create with email, then GET returns it. Update changes it. Omitting it gives `null`.
  - Boundaries: 254 characters is accepted and 255 is rejected.
  - Negatives: a malformed address returns 400 with an `Email` key in `errors`, on both POST and PUT.
- **`src/AddressBook.Web.Tests`:** extend `ContactBuilder`, `ContactFormHarness` and `TestIds` for the email field. Add Create and Edit cases for entering, pre-filling and showing a server error.
- **`src/UiTests`:** add the field to `contact-form.component.ts`, `testids.ts` and `contact.factory.ts`. Extend the create and edit specs.

**Docs**

Update the specs below, which you can do with the `update-docs` skill.
- `AddressBook.Contracts.md`: commands, `ContactModel` and the file table.
- `AddressBook.Api.md`: the `Contact` entity, validation rules, repository update columns and the schema block.
- `AddressBook.Web.md`.
- Optionally the FRS.

## Order of work

1. Contracts, domain and EF configuration, then the migration.
2. Repository, handlers and validators.
3. API tests. Run them against the API before touching the UI.
4. Web model, service and pages, then the Blazor and UI tests.
5. Docs.

## Questions for you

1. Should the list page show an Email column?
2. Do you want the 254-character limit, or a shorter one such as 100 to match `Phone.Comment`?
3. Should email be searchable?

I'd go with yes, 254, and no. I can start on that basis. I won't commit or push unless you ask.
