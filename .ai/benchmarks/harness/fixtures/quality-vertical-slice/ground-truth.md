# Ground truth — vertical slice

`Contact` has no email today (`src/AddressBook.Api/Domain/Contact.cs`). The repository rules (`CLAUDE.md`, *Working
style*; `.github/instructions/api-architecture.instructions.md`) require a change that spans the API and the Web
frontend to be wired on both sides, validated with FluentValidation, and shipped with Playwright API tests in
`src/ApiTests` (happy path, boundaries, negatives).

| # | Item |
|---|---|
| 1 | Names the whole slice with the real locations: the domain entity and its EF Core configuration (`Domain/Contact.cs`, `DataAccess/ContactConfiguration.cs`) **and** a new EF Core migration; the contracts (`CreateContactCommand`, `UpdateContactCommand`, `Models/ContactModel`); the Web pages (`CreateContact.razor`, `EditContact.razor`) |
| 2 | Validation in **both** `CreateContactCommandValidator` and `UpdateContactCommandValidator` (email format and a maximum length that matches the column), with the errors returned as RFC 7807 validation problem details and shown on the form |
| 3 | Playwright API tests in `src/ApiTests`: create and update with an email, the optional case without one, the length boundary, an invalid format rejected with 400; reusing `contact.factory.ts` (and updating the response schema/model the tests check) |
| 4 | Raises at least two decisions instead of silently inventing them — for example the maximum length, uniqueness, whether the list page shows or searches it, how existing rows migrate — and asks the user to confirm them (or proposes a plan for review) before implementing |

## Scoring

Max score: 4

- **Score** = items satisfied. A partly satisfied item counts 0.5 (for example item 1 without the migration, item 2
  with only one of the two validators, item 3 naming tests without a negative or boundary case).
- **False positives** = statements about the repository that are false: files, types or projects that do not exist,
  claiming the field already exists, or a test framework the repository does not use. A clearly marked proposal is
  not a false positive.
