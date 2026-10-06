# Issue #200 — Blazor Tests B32: trim harness meta-tests and remove unused helpers

- Issue: https://github.com/askrinnik/AddressBook2025/issues/200
- Lane: Test-authoring (tests only, `src/AddressBook.Web.Tests`; no production code)
- Complexity: M

## Requirement

`src/AddressBook.Web.Tests` keeps only three harness self-tests (`TestIdsTests`, `MudTestContextTests`, `FakeHttpMessageHandlerTests`) plus two guard tests in `ContactBuilderTests`. The self-tests of the harnesses, `ApiServiceMock` and `RenderedComponentExtensions` are removed. `ContactBuilder`, `ApiServiceMock` and `RenderedComponentExtensions` have no member that no remaining test uses. Web behaviour that only the deleted tests checked moves into the page specs, so `AddressBook.Web` coverage does not drop.

## Acceptance

- [x] Meta-tests reduced to `TestIdsTests`, `MudTestContextTests`, `FakeHttpMessageHandlerTests` and the two `ContactBuilderTests` guards (id uniqueness, name-length limit).
- [x] No unused members in `ContactBuilder`, `ApiServiceMock`, `RenderedComponentExtensions`.
- [x] `AddressBook.Web` coverage not reduced; suite green.
- [x] Web behaviours only the deleted tests checked are covered by page specs: Create button navigation, Edit button navigation, delete dialog closed before click and its title/message, Create submit button enabled and labelled "Create".
- [x] Harness members that become unused are removed (`AppShellHarness` nav members, `ContactsTableHarness.SearchText`).
- [x] README, `bunit-conventions.instructions.md` and the B32 item in `docs/tasks/blazor-component-tests-framework-plan.md` are updated.

## Affected files

Delete (`src/AddressBook.Web.Tests/Specs/`): `Harnesses/{ContactsTable,DeleteDialog,AppShell,ContactForm}HarnessTests.cs`, `Infrastructure/ApiServiceMockTests.cs`, `Infrastructure/RenderedComponentExtensionsTests.cs`.

Helpers:
- `Data/ContactBuilder.cs`: remove `New.EmptyFirstName/EmptyLastName` and `Existing.{FirstName30Chars, LastName30Chars, LastName31Chars, EmptyFirstName, EmptyLastName, WhitespaceFirstName, WhitespaceLastName, BirthdayToday}`.
- `Infrastructure/ApiServiceMock.cs`: remove `DidNotReceiveSearch`, `ReceivedCreate`; fold the `ReturnsContacts(collection, totalRows)` overload into the `params` one.
- `Infrastructure/RenderedComponentExtensions.cs`: remove `FindAllByTestId`, `TryFindByTestId`, `HasTestId`, `TryFindByAriaLabel`.
- `Harnesses/AppShellHarness.cs`: remove `NavHomeHref`, `NavContactsHref`, `IsNavHomeActive`, `IsNavContactsActive`.
- `Harnesses/ContactsTableHarness.cs`: remove `SearchText`.

Tests: trim `Specs/Data/ContactBuilderTests.cs` to the two guards; add to `ContactsListTests`, `ContactsDeleteTests`, `CreateContactTests`.

Docs: `src/AddressBook.Web.Tests/README.md`, `.github/instructions/bunit-conventions.instructions.md` (no `.claude` content mirror exists for instruction files; the pointer rule is unchanged), `docs/tasks/blazor-component-tests-framework-plan.md`.

## Approach and Tests

1. Add the Web checks first: `ContactsListTests.ClickCreate_NavigatesToCreateContact`, `ClickEdit_NavigatesToEditContactOfThatRow` (non-first row), extend `ContactsDeleteTests.ClickDelete_OpensConfirmationDialog_WithoutDeleting` (closed before click, title "Warning", message), `CreateContactTests.Render_SubmitButton_IsEnabledAndLabelledCreate`.
2. Delete the six meta-test files; trim `ContactBuilderTests`.
3. Remove the unused helper and harness members; update XML docs.
4. Update the docs.

## Verification

Build and the bUnit suite via `build-runner`; grep finds no remaining references to removed members; coverage of `AddressBook.Web` compared before (main) and after.

## Out of scope

Renaming or restructuring harnesses, dead-code sweeps beyond the named classes, `src/UiTests`, `src/ApiTests`, the CI coverage threshold (#201).

## Decisions

- The two `ContactBuilderTests` guards stay (the issue allows it).
- Dead harness members are removed too.

## Tasks

- [x] New/extended page tests
- [x] Delete meta-test files, trim `ContactBuilderTests`
- [x] Remove unused `ContactBuilder`, `ApiServiceMock`, `RenderedComponentExtensions`, harness members
- [x] Update README and `bunit-conventions.instructions.md`
- [x] Build, suite green, coverage not reduced
- [x] Tick B32 in `blazor-component-tests-framework-plan.md`
