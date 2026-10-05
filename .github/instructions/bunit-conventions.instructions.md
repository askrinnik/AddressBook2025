---
description: "bUnit component test conventions for AddressBook2025. Use when writing, modifying, or reviewing the Blazor component tests in src/AddressBook.Web.Tests."
applyTo: "src/AddressBook.Web.Tests/**"
---
# bUnit Component Test Conventions

The suite (`src/AddressBook.Web.Tests`) renders the real `AddressBook.Web` components in memory on
**bUnit + xUnit v3**, without a browser. `IAddressBookApiService`, `NavigationManager` and JSInterop are
substituted.

## Scope

- Component and page logic belongs here: rendering, validation messages, navigation, dialogs, error states.
- API contracts belong in `src/ApiTests`; browser flows belong in `src/UiTests`. Do not duplicate them here.
- For the decision of which layer a test belongs to, see the `write-tests` skill.

## Test context

- Derive every test class from `MudTestContext`. It calls `AddMudServices()`, puts `JSInterop` in loose
  mode and registers a substituted `IAddressBookApiService` (the `ApiService` property). Do not repeat that
  setup in a test.
- Call `RenderProviders()` before rendering anything that opens an overlay: dialogs, `MudSelect`,
  `MudDatePicker`, popovers, menus.
- Check navigation through the `CurrentPath` property of the context, not through the raw `NavigationManager`.
- Add missing MudBlazor JS stubs to `MudBlazorJsInterop`, not to an individual test.

## Layout and naming

- Tests live in `Tests/<Area>/<Subject>Tests.cs` (`Components`, `ErrorHandling`, `Layout`, `Pages`, `Services`);
  the self-tests of the test infrastructure live in `Tests/Infrastructure`, `Tests/Data`, `Tests/Harnesses`.
- Name a test `Action_Condition_Outcome`. One behaviour per test.
- Use `[Theory]` with `[InlineData]` or `[MemberData]` instead of copy-pasted tests.
- Pass `Xunit.TestContext.Current.CancellationToken` to asynchronous calls.

## Test data

- Build data only through `ContactBuilder`: `ContactBuilder.New.*` for contacts to create,
  `ContactBuilder.Existing.*` for contacts that already have an id, `ContactBuilder.Existing.List(n)` for collections.
- Add a new boundary variant to the builder; do not create per-test builders or inline object graphs.

## Mocks

- Configure and verify `IAddressBookApiService` through the `ApiServiceMock` extension methods first;
  extend that class when a needed setup or check is missing.
- Tests of `AddressBookApiService` itself use `FakeHttpMessageHandler`. Never make live HTTP calls.

## Harnesses

- `ContactFormHarness`, `ContactsTableHarness`, `DeleteDialogHarness` and `AppShellHarness` wrap the
  rendered components. Tests use them instead of raw selectors.
- When an interaction is missing, add it to the harness. Do not put selectors into a test.

## Locators

- Priority: role or `aria-label`, then `data-testid` (constants in `Infrastructure/TestIds.cs`, helpers
  in `RenderedComponentExtensions`), then CSS as a last resort.
- Do not add new `data-testid` attributes to `src/AddressBook.Web`. `TestIdsTests` keeps the constants in
  step with `src/UiTests/src/utils/testids.ts`.

## Assertions and async

- Use bUnit (`Find`, `FindAll`, `MarkupMatches`) and xUnit `Assert` only. No third-party assertion
  libraries (FluentAssertions v8 is commercial).
- Wait for asynchronous rendering with `cut.WaitForState` or `cut.WaitForAssertion`. Never use
  `Task.Delay` or `Thread.Sleep`.

## Running

- `dotnet test --project src/AddressBook.Web.Tests`. The suite runs on Microsoft.Testing.Platform, enabled
  through `global.json`; a bare positional project path is rejected on .NET 10 SDK.
- Filter with `--filter-class`, `--filter-method`, `--filter-namespace`; never the VSTest `--filter`.

## Comments

- All code comments must be written in English (see the English-comments rule in `CLAUDE.md`).

→ Run commands, architecture and structure: [`src/AddressBook.Web.Tests/README.md`](../../src/AddressBook.Web.Tests/README.md)
