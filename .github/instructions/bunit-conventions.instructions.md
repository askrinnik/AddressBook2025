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
  When navigation happens after an asynchronous step completes, wait in the harness
  (`ContactFormHarness.WaitForNavigation(path)`); do not keep the rendered component in a field just to wait.
- The culture of the whole test assembly is fixed to en-US by the `[ModuleInitializer]` in
  `Infrastructure/TestCulture.cs`. Do not set the culture in a test, and do not rely on the machine's regional settings.
- Add missing MudBlazor JS stubs to `MudBlazorJsInterop`, not to an individual test.
- The context registers `TimeProvider.System`. A test that depends on the date pins the clock with
  `UseClock(new FixedTimeProvider(...))` (or `FixedTimeProvider.LocalDayAheadOfUtc()`) before rendering; do not
  compare against `DateTime.Today` or `DateTime.Now`.

## Layout and naming

- Tests live in `Specs/<Area>/<Subject>Tests.cs` (`Components`, `ErrorHandling`, `Layout`, `Models`, `Pages`, `Services`)
  in the namespace `AddressBook.Web.Tests.Specs.<Area>`; the few self-tests of the test infrastructure live in
  `Specs/Infrastructure` (`TestIdsTests`, `MudTestContextTests`, `FakeHttpMessageHandlerTests`) and `Specs/Data`
  (the `ContactBuilderTests` guards).
- Do not write self-tests for harnesses, `ApiServiceMock` or `RenderedComponentExtensions`: the page specs test
  them by using them. Keep a self-test only for a guard that no page spec exercises.
- Delete a helper, harness member or builder variant that no test uses; do not keep it for later.
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
- Declare the handler with `using var handler = new FakeHttpMessageHandler()`: disposing it also disposes
  every `HttpClient` it built through `CreateClient` or `CreateService`.

## Harnesses

- `ContactFormHarness`, `ContactsTableHarness`, `DeleteDialogHarness` and `AppShellHarness` wrap the
  rendered components. Tests use them instead of raw selectors.
- When an interaction is missing, add it to the harness. Do not put selectors into a test.
- A harness method that dispatches to the renderer (`cut.InvokeAsync`) is `async` and named `…Async`
  (`SetBirthdayAsync`, `FillAsync`, `SelectRowsPerPageAsync`); callers `await` it. Never block on a task with
  `.GetAwaiter().GetResult()`, `.Result` or `.Wait()`.
- Harness predicates search elements and compare their trimmed text exactly
  (`FindAll(...).Any(e => e.TextContent.Trim() == "...")`); do not match substrings of `cut.Markup`.

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
- Always `await cut.InvokeAsync(...)`; a test that calls it is `async Task`. A discarded task hides exceptions
  thrown on the renderer's dispatcher.

## Running

- `dotnet test --project src/AddressBook.Web.Tests`. The suite runs on Microsoft.Testing.Platform, enabled
  through `global.json`; a bare positional project path is rejected on .NET 10 SDK.
- Filter with `--filter-class`, `--filter-method`, `--filter-namespace`; never the VSTest `--filter`.
  Example: `--filter-namespace "AddressBook.Web.Tests.Specs.Pages"`.

## Comments

- All code comments must be written in English (see the English-comments rule in `CLAUDE.md`).

→ Run commands, architecture and structure: [`src/AddressBook.Web.Tests/README.md`](../../src/AddressBook.Web.Tests/README.md)
