# AddressBook.Contracts Technical Specification

## 1. Project Overview

`AddressBook.Contracts` is a shared .NET class library that defines cross-layer request/response contracts and DTOs for the AddressBook solution.

- Project type: .NET class library
- Target framework: `net10.0`
- Shared by:
  - `AddressBook.Api`
  - `AddressBook.Web`
- Responsibility:
  - Define MediatR request contracts (`IRequest<TResponse>`)
  - Define shared response and read models (DTOs)
- NuGet dependency:
  - `MediatR.Contracts` (`2.0.1`)

This project contains contracts only. It does not contain handlers, persistence, or transport-specific logic.

## 2. Package and Runtime Baseline

### 2.1 SDK and Framework

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="MediatR.Contracts" Version="2.0.1" />
  </ItemGroup>
</Project>
```

### 2.2 MediatR Contract Usage

Request messages implement `IRequest<TResponse>` from `MediatR.Contracts`, enabling API handlers and web consumers to share strongly typed command/query contracts without duplicating DTO definitions.

## 3. Command Contracts (Mutable Classes)

### 3.1 CreateContactCommand

Source: `CreateContactCommand.cs`

```csharp
public class CreateContactCommand : IRequest<CreateContactCommandResponse>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly? Birthday { get; set; }
}
```

### 3.2 UpdateContactCommand

Source: `UpdateContactCommand.cs`

```csharp
public class UpdateContactCommand : IRequest<UpdateContactCommandResponse>
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public DateOnly? Birthday { get; set; }
}
```

Note: `Id` is set from the route parameter in the API controller, not from the request body.

## 4. Query Contracts (Immutable Records)

### 4.1 GetFilteredContactsQuery

Source: `GetFilteredContactsQuery.cs`

```csharp
public record GetFilteredContactsQuery(string? SearchText) : IRequest<GetFilteredContactsResponse>;
```

### 4.2 GetContactByIdQuery

Source: `GetContactByIdQuery.cs`

```csharp
public record GetContactByIdQuery(int Id) : IRequest<ContactModel?>;
```

### 4.3 DeleteContactByIdQuery

Source: `DeleteContactByIdQuery.cs`

```csharp
public record DeleteContactByIdQuery(int Id) : IRequest<DeleteContactByIdResponse>;
```

Note: This type is named as a `Query` but performs a delete mutation.

## 5. Shared Models (Immutable Records)

All model types are located under `Models/`.

### 5.1 ContactModel

Source: `Models/ContactModel.cs`

```csharp
public record ContactModel(int Id, string FirstName, string LastName, DateOnly? Birthday);
```

### 5.2 CreateContactCommandResponse

Source: `Models/CreateContactCommandResponse.cs`

```csharp
public record CreateContactCommandResponse(int Id);
```

### 5.3 UpdateContactCommandResponse

Source: `Models/UpdateContactCommandResponse.cs`

```csharp
public record UpdateContactCommandResponse(bool Found);
```

### 5.4 DeleteContactByIdResponse

Source: `Models/DeleteContactByIdResponse.cs`

```csharp
public record DeleteContactByIdResponse(bool Success);
```

### 5.5 GetFilteredContactsResponse

Source: `Models/GetFilteredContactsResponse.cs`

```csharp
public record GetFilteredContactsResponse(int TotalRows, IReadOnlyCollection<ContactModel> Rows);
```

## 6. Design Decisions

1. Commands are defined as mutable `class` types.
   - Rationale: Supports model binding and JSON deserialization for request bodies.

2. Queries and shared models are defined as immutable `record` types.
   - Rationale: Represents value-centric request and response contracts with concise immutable definitions.

3. `DeleteContactByIdQuery` naming inconsistency is preserved.
   - Observation: The operation is a mutation (delete) but the contract name uses `Query`.
   - Status: Acknowledged in current design.

4. `UpdateContactCommand.Id` is populated from route, not body.
   - Rationale: Prevents route/body ID mismatch and enforces URL as the authoritative resource identifier.

## 7. File Structure

| File | Contract Type | Description |
|---|---|---|
| `AddressBook.Contracts.csproj` | Project file | Declares target framework (`net10.0`) and `MediatR.Contracts` dependency. |
| `CreateContactCommand.cs` | Command (`class`) | Create-contact request with first/last name and optional birthday. |
| `UpdateContactCommand.cs` | Command (`class`) | Update-contact request with route-populated `Id`, first/last name, and optional birthday. |
| `GetFilteredContactsQuery.cs` | Query (`record`) | Query by optional search text, returns filtered rows and total count. |
| `GetContactByIdQuery.cs` | Query (`record`) | Query single contact by `Id`, returns nullable contact model. |
| `DeleteContactByIdQuery.cs` | Query-name mutation (`record`) | Delete request by `Id`, returns success flag. |
| `Models/ContactModel.cs` | DTO (`record`) | Shared contact read model. |
| `Models/CreateContactCommandResponse.cs` | Response DTO (`record`) | Response containing created contact `Id`. |
| `Models/UpdateContactCommandResponse.cs` | Response DTO (`record`) | Response indicating whether target contact was found and updated. |
| `Models/DeleteContactByIdResponse.cs` | Response DTO (`record`) | Response indicating whether delete succeeded. |
| `Models/GetFilteredContactsResponse.cs` | Response DTO (`record`) | Response containing total row count and read-only contact rows collection. |

## 8. Cross-Project Usage

- `AddressBook.Api`
  - Receives command/query contracts from HTTP endpoints and dispatches them via MediatR handlers.
- `AddressBook.Web`
  - Uses the same shared contracts and DTOs for API calls and response handling.

This shared-contract approach keeps request/response shapes consistent across backend and frontend and reduces duplication.
