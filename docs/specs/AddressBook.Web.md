# AddressBook.Web Technical Specification

## 1. Project Overview

AddressBook.Web is a standalone Blazor WebAssembly frontend for the AddressBook2025 solution.

| Item | Value |
|---|---|
| Framework | .NET 10 Blazor WebAssembly (standalone, not hosted) |
| UI library | MudBlazor 9.3.0 (Material Design components) |
| API access | Typed HttpClient via DI |
| HTTP error pipeline | ProblemDetailsHandler delegating handler |
| API base URL config | `API_Prefix` (fallback: `http://localhost:5000/api/`) |
| Deployment target | Azure Static Web Apps |

The project references AddressBook.Contracts for request/response and model types used by the API client.

## 2. Startup and Dependency Injection

Source: `src/AddressBook.Web/Program.cs`

```csharp
builder.Services.AddTransient<ProblemDetailsHandler>();
builder.Services.AddScoped<IAddressBookApiService, AddressBookApiService>();
builder.Services.AddHttpClient<IAddressBookApiService, AddressBookApiService>(
        client => client.BaseAddress = new(builder.Configuration["API_Prefix"] ?? "http://localhost:5000/api/"))
    .AddHttpMessageHandler<ProblemDetailsHandler>();
builder.Services.AddMudServices();
```

### DI behavior

| Registration | Lifetime | Purpose |
|---|---|---|
| ProblemDetailsHandler | Transient | Intercepts non-success HTTP responses and throws ProblemDetailsException |
| IAddressBookApiService -> AddressBookApiService | Scoped | Typed API abstraction used by pages |
| Typed HttpClient<IAddressBookApiService, AddressBookApiService> | Managed by HttpClientFactory | Sets BaseAddress from config and adds ProblemDetailsHandler |
| Mud services | Service collection extension | Registers MudBlazor runtime services |

## 3. API Service Layer

### 3.1 Interface

Source: `src/AddressBook.Web/IAddressBookApiService.cs`

```csharp
Task<GetFilteredContactsResponse?> GetFilteredContactsAsync(string searchTerm, CancellationToken ct);
Task DeleteContact(int id);
Task<int> CreateContact(CreateContactModel model);
Task<ContactModel?> GetContactByIdAsync(int id, CancellationToken ct);
Task UpdateContact(int id, CreateContactModel model, CancellationToken ct);
```

### 3.2 Implementation

Source: `src/AddressBook.Web/AddressBookApiService.cs`

| Method | HTTP call | Behavior |
|---|---|---|
| GetFilteredContactsAsync | GET `contacts` or `contacts?search={term}` | Uses GetFromJsonAsync; returns deserialized `GetFilteredContactsResponse?` |
| DeleteContact | DELETE `contacts/{id}` | Throws HttpRequestException when status is non-success |
| CreateContact | POST `contacts` | Sends CreateContactCommand; on success parses new ID from `Location` header segments; returns 0 on failure |
| GetContactByIdAsync | GET `contacts/{id}` | Returns null on 404; otherwise EnsureSuccessStatusCode + ReadFromJsonAsync<ContactModel> |
| UpdateContact | PUT `contacts/{id}` | Sends UpdateContactCommand and calls EnsureSuccessStatusCode |

### 3.3 Model conversion

`CreateContactModel.Birthday` is `DateTime?` in UI model and is converted to `DateOnly?` for API commands using `DateOnly.FromDateTime(...)`.

## 4. Routing and Pages

## 4.1 Home page (`/`)

Source: `src/AddressBook.Web/Pages/Home.razor`

- Static welcome page.
- Declares `<PageTitle>Home</PageTitle>`.

## 4.2 Contacts page (`/contacts`)

Sources:
- `src/AddressBook.Web/Pages/Contacts.razor`
- `src/AddressBook.Web/Pages/Contacts.razor.cs`

### UI and data loading

- Uses MudBlazor `MudTable<ContactModel>` with `ServerData="ServerReload"`.
- Search input (`MudTextField`) calls `OnSearch`, which updates search state and triggers `_contactTable.ReloadServerData()`.
- Toolbar includes `Create Contact` button, which navigates to `/create-contact`.

### Sorting and pagination

- Sorting is performed client-side in `ServerReload` with `OrderByDirection` using sort labels:
  - `fn_field` -> FirstName
  - `ln_field` -> LastName
  - `bd_field` -> Birthday
- Pagination is applied client-side with `Skip/Take` on loaded rows.
- `TotalItems` comes from `response.TotalRows`.

### Row actions

- Edit button (primary blue, pencil icon): navigates to `/edit-contact/{id}`.
- Delete button (error red): opens `MudMessageBox` confirmation dialog and, on confirm, calls API delete then reloads table.

### Error handling in page

- `ServerReload` catches exceptions and:
  - Sends message to cascading `Error` component via `Error.ProcessError(ex.Message)`.
  - Stores message in `_errorText` and shows it in inline `MudAlert` inside table no-records area.
- Contacts page follows code-behind pattern: markup in `.razor`, logic in partial class `.razor.cs`.

## 4.3 Create page (`/create-contact`)

Source: `src/AddressBook.Web/Pages/CreateContact.razor`

- Uses `EditForm` with `EditContext` and `DataAnnotationsValidator`.
- Layout: `MudCard` containing:
  - `MudTextField` First Name
  - `MudTextField` Last Name
  - `MudDatePicker` Birthday
  - `ValidationSummary`
- Submit flow:
  - Clears message store and validates `EditContext`.
  - On valid state, calls `AddressBookApiService.CreateContact` and navigates to `/contacts`.
- Error handling:
  - Catches `ProblemDetailsException`; maps server field errors into `ValidationMessageStore`.
  - Catches generic exceptions and adds general validation error.
- Cancel button navigates to `/contacts`.
- `_isLoading` disables submit button while API call is in progress.

## 4.4 Edit page (`/edit-contact/{Id:int}`)

Source: `src/AddressBook.Web/Pages/EditContact.razor`

- Route includes integer parameter: `[Parameter] public int Id { get; set; }`.
- `OnInitializedAsync` loads existing contact with `GetContactByIdAsync(Id, CancellationToken.None)`.
- If contact is not found, sets `_notFound = true` and renders:
  - `MudAlert` warning
  - `Back to Contacts` button
- Edit form uses the same structure as create page (MudCard + two text fields + date picker + ValidationSummary).
- Save flow validates and calls `UpdateContact`, then navigates to `/contacts`.
- Error handling mirrors create page:
  - `ProblemDetailsException` -> field-level mapping
  - generic exception -> general message
- Includes Save and Cancel buttons.

## 5. Error Handling Subsystem

Folder: `src/AddressBook.Web/ErrorHandling`

### 5.1 ProblemDetailsHandler.cs

- Custom `DelegatingHandler` in the typed HttpClient pipeline.
- For success responses: returns response unchanged.
- For non-success responses:
  - reads body as string,
  - converts string to `ClientProblemDetails` via extension,
  - throws `ProblemDetailsException`.

### 5.2 ClientProblemDetails.cs

- Client-side RFC 7807 representation.
- Properties (JSON mapped via `[JsonPropertyName]`):
  - `Type`
  - `Title`
  - `Status`
  - `Detail`
  - `Instance`
  - `Extensions` (via `[JsonExtensionData]`)
- File header states it is copied from ASP.NET Core source under Apache 2.0 license.

### 5.3 ProblemDetailsException.cs

- Custom exception that wraps `ClientProblemDetails?`.
- Constructor:

```csharp
ProblemDetailsException(ClientProblemDetails? problemDetails)
```

### 5.4 ProblemDetailsExtensions.cs

- `GetErrors()` extension on `ClientProblemDetails`:
  - reads `errors` from `Extensions`,
  - deserializes into `Dictionary<string, string[]>`.
- `ToProblemDetails()` extension on `string`:
  - deserializes JSON text into `ClientProblemDetails` using case-insensitive options.

## 6. Models

### 6.1 CreateContactModel

Source: `src/AddressBook.Web/Models/CreateContactModel.cs`

Used by both create and edit pages.

| Property | Type | Notes |
|---|---|---|
| FirstName | string | `[Required]` |
| LastName | string | `[Required]` |
| Birthday | DateTime? | Converted to `DateOnly?` when sending command to API |

## 7. Layout and Shared UI

Folder: `src/AddressBook.Web/Layout`

### 7.1 MainLayout.razor

- Uses MudBlazor shell components (`MudLayout`, `MudAppBar`, `MudDrawer`, `MudMainContent`).
- App bar includes:
  - title: `Contact Book`,
  - drawer toggle button,
  - dark/light mode toggle via `MudThemeProvider` and icon button.
- Side drawer is collapsible and hosts `NavMenu`.

### 7.2 NavMenu.razor

- Navigation links:
  - Home (`/`)
  - Contacts (`/contacts`)

### 7.3 Error.razor

- Wraps app content in cascading value for global error display.
- Exposes methods:
  - `ProcessError(string message)`
  - `ProcessProblem(ClientProblemDetails? problem)`
  - `Clear()`
- Renders top banner when `ErrorMessage` is not empty.

## 8. Components

### 8.1 CustomValidationSummary.razor

Source: `src/AddressBook.Web/Components/CustomValidationSummary.razor`

- Custom summary component implementing `IDisposable`.
- Subscribes to `EditContext.OnValidationStateChanged`.
- Displays only general model-level validation messages, filtering out per-field messages.

Note: current create/edit pages use built-in `ValidationSummary`; this custom component exists as reusable infrastructure.

## 9. App Composition

| File | Role |
|---|---|
| `App.razor` | Root router, default layout mapping, not-found view, wraps content with `Error` component |
| `_Imports.razor` | Shared using/import directives for components |
| `Program.cs` | Host bootstrap and DI registrations |

## 10. Azure Static Web Apps Routing

Source: `src/AddressBook.Web/wwwroot/staticwebapp.config.json`

- Defines `navigationFallback.rewrite = "/index.html"`.
- Excludes framework/content/static assets from rewrite.
- Ensures Blazor client-side routes (for example `/contacts`, `/create-contact`, `/edit-contact/{id}`) work on browser refresh and direct deep links.

## 11. Configuration

Source: `src/AddressBook.Web/wwwroot/appsettings.json`

- `API_Prefix` defines the API base URL for typed HttpClient.
- If not set, fallback is `http://localhost:5000/api/` as defined in startup.

## 12. File Structure Reference

### Root and startup
- `src/AddressBook.Web/Program.cs`
- `src/AddressBook.Web/App.razor`
- `src/AddressBook.Web/_Imports.razor`

### API client
- `src/AddressBook.Web/IAddressBookApiService.cs`
- `src/AddressBook.Web/AddressBookApiService.cs`

### Pages
- `src/AddressBook.Web/Pages/Contacts.razor`
- `src/AddressBook.Web/Pages/Contacts.razor.cs`
- `src/AddressBook.Web/Pages/CreateContact.razor`
- `src/AddressBook.Web/Pages/EditContact.razor`
- `src/AddressBook.Web/Pages/Home.razor`

### Components
- `src/AddressBook.Web/Components/CustomValidationSummary.razor`

### Error handling
- `src/AddressBook.Web/ErrorHandling/ClientProblemDetails.cs`
- `src/AddressBook.Web/ErrorHandling/ProblemDetailsException.cs`
- `src/AddressBook.Web/ErrorHandling/ProblemDetailsExtensions.cs`
- `src/AddressBook.Web/ErrorHandling/ProblemDetailsHandler.cs`

### Models
- `src/AddressBook.Web/Models/CreateContactModel.cs`

### Layout
- `src/AddressBook.Web/Layout/MainLayout.razor`
- `src/AddressBook.Web/Layout/NavMenu.razor`
- `src/AddressBook.Web/Layout/Error.razor`

### Static web app
- `src/AddressBook.Web/wwwroot/staticwebapp.config.json`
