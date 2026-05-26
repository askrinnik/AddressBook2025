---
description: "Blazor WebAssembly and MudBlazor conventions for AddressBook2025 frontend. Use when creating or modifying Razor pages, components, layouts, or the API service layer."
applyTo: "src/AddressBook.Web/**"
---
# Blazor & MudBlazor Conventions

## Component Structure

- Use **code-behind pattern**: markup in `.razor`, logic in partial class `.razor.cs`
- Never put `@code { }` blocks in `.razor` files — use the code-behind partial class

## MudBlazor

- Use **MudBlazor components exclusively** for UI (no raw HTML inputs, tables, buttons)
- Key components: `MudTable<T>`, `MudTextField`, `MudDatePicker`, `MudCard`, `MudButton`, `MudMessageBox`, `MudAlert`
- Layout uses `MudLayout` / `MudAppBar` / `MudDrawer` / `MudMainContent` shell

## Dependency Injection

- Use `[Inject]` attribute on properties (not constructor injection) in code-behind files
- Use `null!` for injected services: `[Inject] private IMyService MyService { get; set; } = null!;`
- Use `[Inject] private NavigationManager Navigation { get; set; } = null!;` for navigation

## Field Naming

- Prefix private fields with underscore: `_searchString`, `_contactTable`
- MudBlazor component references use underscore prefix: `_contactTable`, `_deleteMessageBox`

## Error Handling

- HTTP errors flow through `ProblemDetailsHandler` (DelegatingHandler) → throws `ProblemDetailsException`
- Pages catch `ProblemDetailsException` and map server-side field errors to form validation via `ValidationMessageStore`
- Use the cascading `Error` component (`Error.ProcessError(message)`) for displaying errors to the user
- Supporting types: `ClientProblemDetails`, `ProblemDetailsExtensions`, `CustomValidationSummary.razor`

## API Service

- All HTTP calls go through `IAddressBookApiService` / `AddressBookApiService` — never call `HttpClient` directly from pages
- Convert `DateTime?` (UI model) to `DateOnly?` (API contract) using `DateOnly.FromDateTime(...)`
- API base URL is configured via `API_Prefix` in `wwwroot/appsettings.json`

## Navigation

- After successful create/update, navigate to `/contacts`
- Use `NavigationManager.NavigateTo("/contacts")` for programmatic navigation

→ Full specification: [`docs/specs/AddressBook.Web.md`](../../docs/specs/AddressBook.Web.md)
