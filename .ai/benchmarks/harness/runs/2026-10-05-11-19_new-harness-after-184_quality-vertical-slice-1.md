Ignoring 45 permissions.allow entries from .claude/settings.json: this workspace has not been trusted. Run Claude Code interactively here once and accept the trust dialog, or set projects["C:/dev/AddressBook2025"].hasTrustDialogAccepted: true in C:\Users\Sanya\.claude.json.
I haven't edited anything. Here is the plan, based on how `FirstName`, `LastName` and `Birthday` flow through the code today.

## Design decisions

- **Type:** `string? Email`. It is optional and nullable end to end, so there is no backfill and existing rows get `NULL`.
- **Validation:** the maximum length is 254, the usual email limit. It is checked with FluentValidation `.EmailAddress()`, and only when a value is supplied.
- **Normalization:** the handler trims the value and stores `null` when it is empty or whitespace. That way `""` and `null` mean the same thing.
- **PUT semantics:** `PUT` replaces the whole contact, as it does for `Birthday`. A request that omits `Email` clears it. I'd document this in the spec and cover it with a test.
- **Out of scope:** search stays on first and last name. I wouldn't add a column to the contacts list unless you want one.

## Changes by layer

**Contracts (`src/AddressBook.Contracts`)**
- `CreateContactCommand.cs` and `UpdateContactCommand.cs`: add `string? Email { get; set; }`.
- `Models/ContactModel.cs`: add `string? Email` as the last positional parameter, plus the `<param>` doc. This is a breaking change for every `new ContactModel(...)` call site (see Tests).

**API (`src/AddressBook.Api`)**
- `Domain/Contact.cs`: add `public string? Email { get; set; }`.
- `DataAccess/ContactConfiguration.cs`: add `builder.Property(e => e.Email).HasMaxLength(254).IsRequired(false);`.
- **Migration:** add a new EF migration, e.g. `AddContactEmail`, with a nullable `nvarchar(254)` column. The snapshot updates with it. I'd generate it with `dotnet ef migrations add` rather than writing it by hand.
- `Application/CreateContactCommandValidator.cs` and `UpdateContactCommandValidator.cs`: add `RuleFor(x => x.Email).MaximumLength(254).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email))`. The two validators are already duplicates, so I'd mirror the existing style rather than refactor them.
- `CreateContactCommandHandler.cs` and `UpdateContactCommandHandler.cs`: set `Email = NormalizeEmail(request.Email)`, which trims and maps blank to `null`.
- `DataAccess/AddressBookRepository.cs`: add `.SetProperty(c => c.Email, item.Email)` in `UpdateAsync`. This is easy to miss, because `ExecuteUpdateAsync` only writes the listed properties.
- `GetContactByIdQueryHandler.cs` and `GetFilteredContactsQueryHandler.cs`: pass `contact.Email` into `ContactModel`.
- The controller needs no change, since it passes commands straight to `ISender`.

**Web (`src/AddressBook.Web`)**
- `Models/CreateContactModel.cs`: add `string? Email` with `[EmailAddress]` and `[MaxLength(254)]`. The model is shared by create and edit.
- `Pages/CreateContact.razor` and `Pages/EditContact.razor`: add a `MudTextField Label="Email" InputType="InputType.Email"`. It is bound with `For=` and carries `data-testid="contact-form-email"`. I'd place it after Last name. `EditContact` also gets `Email = contact.Email` when it builds the model.
- `AddressBookApiService.cs`: map `Email` in both `CreateContact` and `UpdateContact`.
- Server-side field errors reach the field automatically through the existing `ValidationMessageStore` mapping.
- The blazor instructions say code-behind with no `@code` blocks, but these pages already use `@code`. I'd stay consistent with the surrounding code and not refactor.

## Tests

- **`src/ApiTests`** (required by CLAUDE.md):
  - Extend `contact.factory.ts` and the DTOs with `email`.
  - `create.spec.ts`: happy path with email, no email, whitespace-only email (stored as null), and the 254-character boundary.
  - Negatives: 255 characters and a malformed address, both returning 400 ProblemDetails with errors under `Email`.
  - `update.spec.ts`: set, change, and clear an email, and check that it round-trips through GET.
  - `contract/schema.spec.ts`: add the new field.
- **`src/AddressBook.Web.Tests`:**
  - Fix `ContactBuilder`, since `ContactModel` gains a parameter.
  - Add `ContactFormHarness` and `TestIds` entries for the email field.
  - Add cases to `CreateContactTests`, `EditContactTests` and `CreateContactServerErrorTests`.
- **`src/UiTests`:**
  - Add the testid to `src/utils/testids.ts`.
  - Add `email` to `contact-form.component.ts` and `contact.factory.ts`.
  - Add a spec in `crud-lifecycle` or `edit` that enters an email and verifies it persists, and one in `validation` for an invalid email.

## Docs (same change, per `update-docs-on-code-change.md`)

- `docs/specs/AddressBook.Api.md`: the field, the validation rule, and the PUT-clears behaviour.
- `docs/specs/AddressBook.Contracts.md`: the updated command and model shapes.
- `docs/specs/AddressBook.Web.md`: the form field.

## Order and verification

1. Contracts, then domain and EF configuration, then the migration.
2. Validators, handlers and repository.
3. Web.
4. API tests, then Web.Tests, then UiTests.
5. Docs.

For verification I'd build `src/AddressBook.slnx`, run the API suite and the Web.Tests, and run the UI E2E specs against a local stack.

**Open question:** should the contacts list also display the email? I've assumed no, since you only mentioned entering it and API read/write.

Nothing will be committed or pushed unless you ask.
