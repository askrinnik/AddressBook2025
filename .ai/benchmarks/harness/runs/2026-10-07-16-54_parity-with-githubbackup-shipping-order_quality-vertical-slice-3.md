I read the API, contracts and Web model code but not the Razor pages or the API tests. Those parts of the plan are inferred from file names. I haven't edited anything.

## Decisions I need from you

`CLAUDE.md` says to settle these before implementing. My proposed defaults are in bold.

| Question | Proposal |
|---|---|
| Format | **Syntax check only** (`EmailAddress()` on the API, `[EmailAddress]` on the Web). No deliverability check. |
| Max length | **254**, the RFC limit, as `ContactRules.EmailMaxLength`. |
| Required or optional | **Optional.** `null` and empty/whitespace both mean "no email", stored as `null`. |
| Uniqueness | **Not unique.** Two contacts can share an address, and there is no index. |
| Shown in the list | **A new column in the contacts table.** |
| Searchable | **Yes, add it to the search filter** in `AddressBookRepository.RetrieveManyAsync`. This is the choice most worth confirming. |
| Existing rows | **Nullable column, no backfill.** |
| Normalisation | **Trim only.** Don't lower-case, to keep what the user typed. |

## What I would change

**Contracts**
- `ContactRules.cs`: add `EmailMaxLength = 254`.
- `CreateContactCommand` and `UpdateContactCommand`: add `string? Email { get; set; }`.
- `Models/ContactModel.cs`: add `string? Email` as the last positional parameter. This breaks every `new ContactModel(...)` call, which the compiler will flag. Callers are `GetContactByIdQueryHandler`, probably `GetFilteredContactsQueryHandler`, and the test builders.

**API**
- `Domain/Contact.cs`: add `string? Email`.
- `DataAccess/ContactConfiguration.cs`: add `HasMaxLength(ContactRules.EmailMaxLength)` and `IsRequired(false)`.
- Migration: add an `AddEmail` migration with a nullable `nvarchar(254)` column. I'd generate it with `dotnet ef migrations add AddEmail`, not write it by hand, so the snapshot updates too.
- `AddressBookRepository.UpdateAsync`: add `.SetProperty(c => c.Email, item.Email)`. This is easy to miss. Without it, edits silently drop the email because the update uses `ExecuteUpdateAsync`.
- `CreateContactCommandValidator` and `UpdateContactCommandValidator`: add a rule that runs only when the value is non-empty, using `EmailAddress()` and `MaximumLength(ContactRules.EmailMaxLength)`.
- Create and Update handlers: map `Email`, trimmed, with blank becoming `null`.
- Query handlers: pass `Email` into `ContactModel`.
- `ContactsController`: probably no change, since it passes the commands through.

**Web**
- `Models/CreateContactModel.cs`: add `[EmailAddress]`, `[StringLength(ContactRules.EmailMaxLength)]` and `[Display(Name = "Email")]`.
- `CreateContact.razor` and `EditContact.razor`: add a `MudTextField` bound to `Email`. I'd check how the code-behind maps the form model to the command and from `ContactModel`.
- `Contacts.razor`: add the column.

**Tests**
- `src/ApiTests`, as `CLAUDE.md` requires:
  - Happy path: create with an email, read it back, update it, clear it.
  - Boundaries: 254 characters passes, 255 fails.
  - Negatives: a malformed address returns a 400 RFC 7807 response.
  - Search by email, if you approve that.
- `src/AddressBook.Web.Tests` (bUnit): the form field, validation messages, and the list column. This also covers `ContactBuilder` and the harnesses.

**Docs, in the same change**
- `docs/specs/AddressBook.Contracts.md`: the command snippets, `ContactModel`, and the `ContactRules` table.
- `docs/specs/AddressBook.Api.md`: the endpoint shapes, validation rules and data access.
- `docs/specs/AddressBook.Web.md`: the form and the list.

## Process notes
- I'd leave committing, pushing and the PR until you ask for them. If you want an issue and PR flow, `/implement-issue` is the entry point.
- Once you confirm or change the defaults, I'll implement it. I'd split the work into the API, Web and tests steps above, and run a build and both test suites at the end.
