The change follows the same path as `Birthday`, the existing optional field. I read the code only and edited nothing. This is how I'd do it.

## Design decisions

- **Type and storage:** `string? Email`, stored as nullable `NVARCHAR(254)`. 254 is the practical RFC maximum for an address.
- **Blank input:** the handler trims the value and turns empty or whitespace into `null`. The API then never returns `""`, and the Web form can post an untouched field as-is.
- **Validation:** when a value is present, it must pass FluentValidation `.EmailAddress()` and `MaximumLength(254)`. The Web form also has a `[EmailAddress]` annotation, so users get instant feedback. The API stays the authority.
- **Out of scope unless you want them:** an Email column in the contacts list, and Email in the search filter. The search filter is the `Contains` in `AddressBookRepository.RetrieveManyAsync`.

## Changes by layer

**Contracts (`src/AddressBook.Contracts`)**
- Add `public string? Email { get; set; }` to `CreateContactCommand.cs` and `UpdateContactCommand.cs`.
- Add `string? Email = null` as the last parameter of the `ContactModel` record in `Models/ContactModel.cs`. The default value means existing `new ContactModel(...)` calls, such as `ContactBuilder` in `AddressBook.Web.Tests`, keep compiling.

**API (`src/AddressBook.Api`)**
- `Domain/Contact.cs`: add `string? Email`.
- `DataAccess/ContactConfiguration.cs`: add `builder.Property(e => e.Email).HasMaxLength(254).IsRequired(false);`.
- **Migration:** add `AddContactEmail` with `dotnet ef migrations add AddContactEmail`. It adds a nullable column, so existing rows and the seed data are unaffected. Migrations run automatically on startup. I'd check the generated `Up`/`Down` and the model snapshot diff.
- `DataAccess/AddressBookRepository.cs`: add `.SetProperty(c => c.Email, item.Email)` to the `ExecuteUpdateAsync` in `UpdateAsync`. This is the easy one to miss, because update bypasses change tracking. Without it, PUT would silently ignore the email.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add the email rule to both, `.EmailAddress().MaximumLength(254).When(x => !string.IsNullOrWhiteSpace(x.Email))`.
- `Application/CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: set `Email` using a trim-and-null-if-blank helper. I'd reuse one shared helper rather than duplicate it.
- `Application/GetContactByIdQueryHandler.cs` and `GetFilteredContactsQueryHandler.cs`: pass `Email` into the `ContactModel` mapping.

**Web (`src/AddressBook.Web`)**
- `Models/CreateContactModel.cs`: add `[EmailAddress] public string? Email { get; set; }`.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add `<MudTextField Label="Email" @bind-Value="_model.Email" For="..." data-testid="contact-form-email" />`. In `EditContact`, also set `Email = contact.Email` when building `_model`.
- `AddressBookApiService.cs`: set `Email = model.Email` in both `CreateContact` and `UpdateContact`.
- Server-side validation errors already show through the existing `AddCustomError` path, keyed by property name, so no extra error handling is needed.

**Tests (required by CLAUDE.md for new API behaviour)**
- `src/ApiTests`:
  - Update `contact.schema.ts` and `contact.factory.ts`.
  - Add create, update and get-by-id cases covering a valid email, no email, a blank email stored as null and a 254-character boundary.
  - Add negatives for an invalid format and 255 characters, asserting the RFC 7807 `errors.Email` entry.
- `src/AddressBook.Web.Tests`:
  - Add Email to `ContactBuilder`, `ContactFormHarness` and `TestIds.cs`.
  - Extend `CreateContactTests` and `EditContactTests` to cover entering an email, preloading it on edit, and an invalid format.
- `src/UiTests`: add `contact-form-email` to `testids.ts` and the `contact-form.component.ts` page object. Add it to the factory and the edit/CRUD specs if you want end-to-end coverage.

**Docs**
- Update `AddressBook.Contracts.md`, `AddressBook.Api.md` (domain, validation rules, repository update, schema) and `AddressBook.Web.md`.
- Source comments will be in English, per CLAUDE.md.

## Order of work
1. Contracts, then domain, config and migration.
2. Repository, validators and handlers.
3. API tests.
4. Web models, pages and service.
5. Web and UI tests, then docs.
6. Build `src/AddressBook.slnx` and run the API and Web test suites.

I'd stop before committing or pushing, since CLAUDE.md requires an explicit request for that. If you ask for it later, I'd use the `git-commit` and `open-pr` skills.

**Decision for you:** should Email also be searchable and shown as a column in the contacts list? I'd leave both out of the first change to keep it small.
