I haven't edited anything. This plan comes from the specs and from a search of every place `Birthday` is used. `Birthday` is the closest existing optional field, so I'd copy its path through the stack.

## Decisions to confirm
- **Validation:** `MaximumLength(254)` plus FluentValidation's `EmailAddress()`, applied only when a value is present. The validators already use a `When(HasValue)` pattern for `Birthday`.
- **Normalization:** trim the value, and store an empty or whitespace-only string as `null`. Without this, an API client could send `""` and get a 400, and the Blazor form would have to handle that case itself.
- **Search:** leave it unchanged. Filtering stays on first and last name, and adding Email would change behaviour you didn't ask for.

## Changes by layer

**1. Contracts** (`src/AddressBook.Contracts`)
- Add `string? Email { get; set; }` to `CreateContactCommand` and `UpdateContactCommand`.
- Add `string? Email` as a trailing parameter on the `ContactModel` record. The trailing position keeps positional construction compatible.

**2. API** (`src/AddressBook.Api`)
- `Domain/Contact.cs`: add `string? Email`.
- `DataAccess/ContactConfiguration.cs`: `HasMaxLength(254)`, optional.
- **Migration:** add one with `dotnet ef migrations add ContactEmail`. It adds a nullable `Email NVARCHAR(254)` column, so existing rows are unaffected. The seed data needs no change.
- `Application/CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: apply the trim and empty-to-null normalization, then map `Email`.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add the rule to both, since they duplicate each other today.
- `DataAccess/AddressBookRepository.cs`: add `Email` to the `ExecuteUpdateAsync` property set. This is the easy one to miss, because without it PUT silently drops the value.
- `GetContactByIdQueryHandler.cs` and `GetFilteredContactsQueryHandler.cs`: map `Email` into `ContactModel`.
- `ContactsController.cs` needs no change.

**3. Web** (`src/AddressBook.Web`)
- `Models/CreateContactModel.cs`: add `Email`.
- `AddressBookApiService.cs`: map `Email` in the create and update calls.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add a `MudTextField` for Email with `MaxLength="254"` and a `data-testid`, following the existing field conventions. Check the form validation approach against `blazor.project-specific.instructions.md`.
- `Pages/Contacts.razor` and `Contacts.razor.cs`: show an Email column only if you want it in the list. I'd skip it for now.

**4. Tests** (required by `CLAUDE.md`)
- **`src/ApiTests`:**
  - Update `contact.schema.ts` and `contact.factory.ts`.
  - Add cases to `create.spec.ts` and `update.spec.ts`. Happy path covers with and without an email, and a round trip through GET. Boundaries are 254 and 255 characters. Negatives are an invalid format, and `""` or whitespace becoming `null`.
  - Check `schema.spec.ts` and `problem-details.spec.ts`.
- **`src/AddressBook.Web.Tests` (bUnit):**
  - Update `ContactBuilder.cs`, `ContactFormHarness.cs` and `TestIds.cs`.
  - Extend `CreateContactTests` and `EditContactTests`.
- **`src/UiTests` (Playwright UI):**
  - Add the field to `contact-form.component.ts`, `testids.ts` and `contact.factory.ts`.
  - Extend `edit.spec.ts` and `crud-lifecycle.spec.ts`.

**5. Docs**
- Update `AddressBook.Contracts.md` (sections 3, 5.1 and 7) and `AddressBook.Api.md` (Contact entity, validation rules, repository update, DB schema). The `update-docs` skill covers this.
- Check `docs/03_FRS.md` for a contact-fields section.

## Order of work
1. Contracts and domain.
2. Migration.
3. Handlers, validators and repository.
4. API tests, run until green.
5. Web pages and service.
6. Web and UI tests.
7. Docs.

I'd read the three instruction files first (`api-architecture`, `csharp`, `playwright-conventions`, plus the Blazor one) and run `dotnet build src/AddressBook.slnx` and the test suites as I go. I'd stop before any commit or push and ask you.

Should I go ahead with this, and are the 254-character limit and the "don't search by email" choice what you want?
