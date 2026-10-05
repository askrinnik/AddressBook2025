# CLAUDE.md — `src/AddressBook.Web.Tests`

Component (bUnit) tests for `AddressBook.Web` (Blazor WASM + MudBlazor) on **bUnit + xUnit v3**.
Components render in memory, without a browser; `IAddressBookApiService`, `NavigationManager` and JSInterop
are substituted. This differs from `src/UiTests` (browser E2E) and `src/ApiTests` (HTTP).

Run: `dotnet test --project src/AddressBook.Web.Tests` (MTP; filters are `--filter-class`,
`--filter-method`, `--filter-trait`, never VSTest `--filter`). Commands, architecture and structure:
[`README.md`](README.md). C# rules: [`.github/instructions/csharp.instructions.md`](../../.github/instructions/csharp.instructions.md).

The **authoritative conventions** live in
[`.github/instructions/bunit-conventions.instructions.md`](../../.github/instructions/bunit-conventions.instructions.md)
— read it before writing tests. Claude Code does not apply `applyTo`, so this file is the pointer.

Full design and task list:
[`docs/tasks/blazor-component-tests-framework-plan.md`](../../docs/tasks/blazor-component-tests-framework-plan.md).

Non-negotiables when adding or changing tests here:

- Derive tests from the base `MudTestContext` — it calls `AddMudServices()`, puts `JSInterop` in loose
  mode and renders the providers; do not repeat that boilerplate in each test. Call
  `MudTestContext.RenderProviders()` before rendering overlay widgets (popovers, dialogs, menus).
- Test data only through `ContactBuilder` (Bogus); no per-test builders.
- Mock the service with NSubstitute; tests of `AddressBookApiService` itself use the controllable
  `FakeHttpMessageHandler`, not live HTTP.
- Assertions only with bUnit (`Find`/`FindAll`/`MarkupMatches`) + xUnit `Assert`. No third-party
  assertion libraries (FluentAssertions v8 is commercial).
- Async rendering through `cut.WaitForState`/`WaitForAssertion`; never `Task.Delay`/`Sleep`.
- Locators: role/`aria-label` → `data-testid` (constants in `Infrastructure/TestIds.cs`) → CSS as a
  last resort. Do not add new `data-testid` attributes to the Web project.
- Comments in code (`//`, `///`, csproj/.gitignore) must be in English.
