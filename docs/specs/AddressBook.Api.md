# AddressBook.Api Technical Specification

## Project Overview

`AddressBook.Api` is a .NET 10 ASP.NET Core Web API project implementing a contact-management backend.

Core architecture and technologies:

- CQRS pattern via MediatR (`ISender` in controllers + request handlers in `Application/`)
- FluentValidation for command validation
- EF Core 10 with SQL Server
- Strongly-typed value-object IDs as sealed record wrappers over `int`
- RFC 7807 `ProblemDetails` responses through a global exception handler

## Prerequisites, Build, and Run

### Prerequisites

- .NET 10 SDK
- SQL Server (LocalDB, SQL Express, or remote instance)

### Build

```bash
dotnet build src/AddressBook.Api/AddressBook.Api.csproj
```

Or as part of the solution:

```bash
dotnet build src/AddressBook.sln
```

### Run locally

Default profile (`http`) listens on `http://localhost:5000` with `ASPNETCORE_ENVIRONMENT=Development`:

```bash
cd src/AddressBook.Api
dotnet run
```

Opens Swagger UI at `http://localhost:5000/swagger/` and Scalar at `http://localhost:5000/scalar/`.

### Database connection

The default connection string in `appsettings.json` targets local SQL Express with Windows Auth:

```
Server=localhost\SQLEXPRESS;Database=AddressBook;Trusted_Connection=true;TrustServerCertificate=True;MultipleActiveResultSets=true
```

Override credentials via configuration keys (CLI args, env vars, or appsettings):

| Key | Purpose |
|---|---|
| `Database:Server` | SQL Server host (e.g., `sanyascr.database.windows.net`) |
| `Database:User` | SQL auth username (disables Windows Auth) |
| `Database:Password` | SQL auth password |

Example with SQL auth:

```bash
dotnet run --Database:Password=MyPassword
```

### Launch profiles

| Profile | URL | Environment |
|---|---|---|
| `http` | `http://localhost:5000` | Development |
| `http-AWS` | `http://localhost:5000` | AWS |

### Database migration

EF Core migrations run automatically on startup (unless running `dotnet swagger tofile`). To apply manually:

```bash
cd src/AddressBook.Api
dotnet ef database update
```

### Dependencies

| Package | Version |
|---|---|
| FluentValidation.DependencyInjectionExtensions | 12.1.1 |
| MediatR | 12.4.1 |
| Microsoft.EntityFrameworkCore | 10.0.5 |
| Microsoft.EntityFrameworkCore.SqlServer | 10.0.5 |
| Microsoft.EntityFrameworkCore.Tools | 10.0.5 |
| Scalar.AspNetCore | 2.13.20 |
| Swashbuckle.AspNetCore | 10.1.7 |

### CI

GitHub Actions workflow `build.yml` runs on every push:

```bash
dotnet restore src/AddressBook.sln
dotnet build src/AddressBook.sln --configuration Release --no-restore
```

## API Endpoints

Controller: `ContactsController` (thin pass-through to MediatR `ISender`)

| Method | Route | Success | Error | Description |
|---|---|---|---|---|
| GET | `/api/contacts?search=text` | 200 `GetFilteredContactsResponse` | - | List/search contacts |
| GET | `/api/contacts/{id}` | 200 `ContactModel` | 404 | Get by ID |
| POST | `/api/contacts` | 201 + `Location` header | 400 (validation) | Create contact |
| PUT | `/api/contacts/{id}` | 204 No Content | 404, 400 | Update contact |
| DELETE | `/api/contacts/{id}` | 204 No Content | 404 | Delete contact |

Notes:

- `POST` returns `CreatedAtAction(nameof(GetById), new { id = response.Id }, null)`.
- `PUT` sets `request.Id` from route before dispatching to MediatR.
- `GET by id` and `DELETE` map `not found` to HTTP 404 based on handler result.

## Domain Model (`Domain/`)

### Contact (aggregate root)

```csharp
public sealed class Contact : Entity<ContactId>
{
    public OwnerId OwnerId { get; set; } = OwnerId.Default();
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly? Birthday { get; set; }
    public List<Phone> Phones { get; set; } = [];
}
```

### Strongly-typed IDs

All ID types are `sealed record` wrappers:

- `ContactId(int Value)`
- `OwnerId(int Value)`
- `PhoneId(int Value)`
- `PhoneOperatorId(int Value)`

`OwnerId.Default()` returns `new(1)` and currently acts as a single-tenant placeholder.

`Phone` and `PhoneOperator` domain entities are implemented and mapped in EF Core, but are not yet exposed via dedicated API endpoints.

## Repository Interfaces (`Interfaces/`)

| Interface | Method | Returns |
|---|---|---|
| `ICreate<T>` | `CreateAsync(T item)` | `Task<T>` |
| `IDelete<in T>` | `DeleteAsync(T key)` | `Task<int>` (row count) |
| `IExist<in T>` | `ExistAsync(T key)` | `Task<bool>` |
| `IRetrieve<in TKey, TOut>` | `TryRetrieveAsync(TKey key)` | `Task<TOut?>` |
| `IRetrieveMany<in TKey, TOut>` | `RetrieveManyAsync(TKey key)` | `Task<IReadOnlyCollection<TOut>>` |
| `IUpdate<in TKey, in T>` | `UpdateAsync(TKey key, T item)` | `Task<bool>` (found) |

## Application Handlers (`Application/`)

All handlers use primary constructor injection.

- `CreateContactCommandHandler`
  - Validates request via FluentValidation
  - Trims `FirstName` and `LastName`
  - Creates entity through `ICreate<Contact>`
  - Returns `CreateContactCommandResponse(createdContact.Id.Value)`

- `UpdateContactCommandHandler`
  - Validates request
  - Trims names
  - Calls `IUpdate<ContactId, Contact>`
  - Repository implementation performs update via `ExecuteUpdateAsync` (no change-tracking)

- `GetContactByIdQueryHandler`
  - Uses `IRetrieve<ContactId, Contact>`
  - Maps entity to `ContactModel`
  - Returns `null` when not found

- `GetFilteredContactsQueryHandler`
  - Uses `IRetrieveMany<GetFilteredContactsQuery, Contact>`
  - Maps to `ContactModel[]`
  - Wraps into `GetFilteredContactsResponse(totalRows, rows)`

- `DeleteContactByIdQueryHandler`
  - Uses `IDelete<ContactId>`
  - Returns `DeleteContactByIdResponse(rows > 0)`

## Validation (`Application/`)

Both validators implement the same rules:

- `CreateContactCommandValidator`
- `UpdateContactCommandValidator`

Rules:

```text
FirstName: NotEmpty, MaximumLength(30)
LastName: NotEmpty, MaximumLength(30)
Birthday: LessThanOrEqualTo(today) when HasValue, message "Birthday cannot be in the future"
```

## Data Access (`DataAccess/`)

### AddressBookRepository

`AddressBookRepository` implements all six repository interfaces.

Key methods:

- `RetrieveManyAsync(GetFilteredContactsQuery)`
  - Applies `Contains` filter over `FirstName` or `LastName` when `SearchText` is provided
  - Uses `AsNoTracking()`

- `TryRetrieveAsync(ContactId)`
  - Includes `Phones`
  - Uses `AsNoTracking()`

- `UpdateAsync(ContactId, Contact)`
  - Uses `ExecuteUpdateAsync` to update `FirstName`, `LastName`, `Birthday`

- `DeleteAsync(ContactId)`
  - Uses `ExecuteDeleteAsync`

- `ExistAsync(ContactId)`
  - Uses `AnyAsync`

Typed ID translation:

- `Unwrap()` extension methods are declared for ID wrappers.
- `ApplicationDbContext` registers them via `HasDbFunction(...).HasTranslation(...)` so expressions like `c.Id.Unwrap() == key.Value` translate to SQL.

### ApplicationDbContext

Configures entity mappings and seed data.

Seeded reference data:

- Phone operators (3): `Vodafone UA`, `Kyivstar UA`, `Super EE`
- Contacts (2): `John Doe`, `Jane Smith`
- Phones (4): two per seeded contact

### Dependency Injection registration

In `DataAccess/StartupExtensions.cs`, `AddressBookRepository` is registered once per interface:

- `IRetrieveMany<GetFilteredContactsQuery, Contact>`
- `IRetrieve<ContactId, Contact>`
- `ICreate<Contact>`
- `IDelete<ContactId>`
- `IUpdate<ContactId, Contact>`
- `IExist<ContactId>`

This follows interface segregation by resolving only the required capability in each handler.

### Database configuration

Connection-string behavior:

- Base connection string from `ConnectionStrings:DefaultConnection` (local SQL Server, Windows Auth / trusted connection in `appsettings.json`)
- Optional overrides:
  - `Database:Server` -> `SqlConnectionStringBuilder.DataSource`
  - `Database:User` / `Database:Password` -> disables integrated security and sets SQL auth credentials

## Global Exception Handler (`GlobalExceptionHandler.cs`)

The API uses `IExceptionHandler` + `IProblemDetailsService` to emit RFC 7807 responses.

- `ValidationException`
  - Status: 400
  - Title: `Validation Error`
  - Detail: `One or more validation errors occurred`
  - Extension `errors`: dictionary grouped by property name, each value is an array of error messages

- Other exceptions
  - Status: 500
  - Development environment:
    - `Title`: exception type name
    - `Detail`: exception message
    - Extensions include stack trace and `exception.Data`
  - Non-development:
    - `Title`: `Internal Server Error`
    - `Detail`: `An unexpected error occurred.`
    - No internal diagnostic leakage

`ProblemDetails.Instance` is set to `"{HTTP_METHOD} {PATH}"`.

## Middleware Pipeline (`StartupExtensions.cs`)

Order in `ConfigureApp`:

1. `app.UseExceptionHandler(_ => { })` (first; wraps all downstream middleware)
2. OpenAPI middleware:
   - `app.UseSwagger()`
   - `app.UseSwaggerUI()`
   - `app.MapScalarApiReference(...)` (Scalar route `/scalar`, OpenAPI route pattern `/swagger/{documentName}/swagger.json`)
3. CORS (`app.UseCors(...)` through `ConfigureClientAccess()`)
4. `app.MapControllers()`

CORS behavior:

- Reads `AllowedOrigins` configuration array
- If configured: restricts via `WithOrigins(...)`
- If missing/empty: uses `AllowAnyOrigin()` (development fallback)
- Logs a warning in non-development when `AllowedOrigins` is missing/empty
- Allows any method and header
- Exposes only `Location` header

Authentication/authorization pipeline calls are currently commented out:

- `app.UseHttpsRedirection()`
- `app.UseAuthentication()`
- `app.UseAuthorization()`

### Issue #50 Resolution

The `UseExceptionHandler` middleware is now placed first in the pipeline (before CORS, OpenAPI, and `MapControllers`), ensuring all exceptions — including those from downstream middleware — are caught by `GlobalExceptionHandler`. Previously it was placed after `MapControllers`, which meant controller exceptions bypassed the handler.

## File Structure

Paths relative to `src/AddressBook.Api/`:

- `Controllers/ContactsController.cs`
- `Application/CreateContactCommandHandler.cs`
- `Application/UpdateContactCommandHandler.cs`
- `Application/GetContactByIdQueryHandler.cs`
- `Application/GetFilteredContactsQueryHandler.cs`
- `Application/DeleteContactByIdQueryHandler.cs`
- `Application/CreateContactCommandValidator.cs`
- `Application/UpdateContactCommandValidator.cs`
- `Domain/Contact.cs`
- `Domain/ContactId.cs`
- `Domain/Entity.cs`
- `Domain/OwnerId.cs`
- `Domain/Phone.cs`
- `Domain/PhoneId.cs`
- `Domain/PhoneOperator.cs`
- `Domain/PhoneOperatorId.cs`
- `DataAccess/AddressBookRepository.cs`
- `DataAccess/ApplicationDbContext.cs`
- `DataAccess/ContactConfiguration.cs`
- `DataAccess/PhoneConfiguration.cs`
- `DataAccess/PhoneOperatorConfiguration.cs`
- `DataAccess/StartupExtensions.cs`
- `Interfaces/ICreate.cs`
- `Interfaces/IDelete.cs`
- `Interfaces/IExist.cs`
- `Interfaces/IRetrieve.cs`
- `Interfaces/IRetrieveMany.cs`
- `Interfaces/IUpdate.cs`
- `GlobalExceptionHandler.cs`
- `StartupExtensions.cs`
- `Program.cs`

## Database Schema

```text
Contacts:
  Id (INT PK IDENTITY)
  OwnerId (INT NOT NULL)
  FirstName (NVARCHAR(30) NOT NULL)
  LastName (NVARCHAR(30) NOT NULL)
  Birthday (DATE NULL)

Phones:
  Id (INT PK IDENTITY)
  ContactId (INT FK)
  PhoneOperatorId (INT FK)
  PhoneNumber (NVARCHAR(15) NOT NULL)
  Comment (NVARCHAR(100) NULL)

PhoneOperators:
  Id (INT PK IDENTITY)
  Name (NVARCHAR(30) NOT NULL)
  Description (NVARCHAR(100) NOT NULL)
```

> **Note:** `PhoneNumber` max length is 15 in EF config (`PhoneConfiguration.cs`) vs. 20 in the FRS (`docs/03_FRS.md`) — a minor discrepancy.
