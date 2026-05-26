---
description: "ASP.NET Core Web API architecture patterns for AddressBook2025. Use when adding endpoints, handlers, validators, repository methods, or modifying the middleware pipeline."
applyTo: "src/AddressBook.Api/**"
---
# API Architecture Patterns

## CQRS + MediatR

- Controllers are **thin pass-throughs** to `ISender` — no business logic in controllers
- Each operation gets its own handler implementing `IRequestHandler<TRequest, TResponse>`
- Commands (create/update) are mutable `class` types; queries are immutable `record` types
- All request/response contracts live in `AddressBook.Contracts` (shared with Web project)

## Validation

- Use **FluentValidation** `AbstractValidator<T>` for command validation
- Call `validator.ValidateAndThrowAsync(request, ct)` at the start of handlers — validators are not invoked automatically by the pipeline
- Mark validators `internal sealed`
- Trim string inputs (`request.FirstName.Trim()`) after validation, before persistence

## Domain Model

- Use **strongly-typed value-object IDs** (`sealed record ContactId(int Value)`)
- Entities inherit from `Entity<TId>` base class
- `OwnerId.Default()` returns `new(1)` — single-tenant placeholder; do not hardcode owner IDs elsewhere

## Repository / Data Access

- One repository class implements **multiple fine-grained interfaces** (`ICreate<T>`, `IRetrieve<TKey,TOut>`, `IUpdate<TKey,T>`, `IDelete<T>`, `IExist<T>`, `IRetrieveMany<TKey,TOut>`)
- Register the repository **once per interface** via `AddScoped<IXxx, Repository>()` (interface segregation)
- Handlers depend only on the specific interface they need
- Use `AsNoTracking()` for read-only queries
- Use `ExecuteUpdateAsync` / `ExecuteDeleteAsync` for bulk operations (no change-tracking overhead)
- Use the `Unwrap()` extension for strongly-typed ID comparisons in LINQ-to-SQL

## Error Handling

- `GlobalExceptionHandler` maps `ValidationException` → 400 ProblemDetails, other exceptions → 500 ProblemDetails
- In Development: 500s include exception type, message, stack trace, and Data entries
- In Production: 500s return generic "Internal Server Error" — no internal leakage
- `UseExceptionHandler` must be **first** in the middleware pipeline (before CORS, OpenAPI, MapControllers)

## Middleware Pipeline Order

1. `app.UseExceptionHandler(_ => { })`
2. OpenAPI (Swagger + Scalar)
3. CORS (`app.UseCors(...)`)
4. `app.MapControllers()`

## CORS

- Uses `AllowedOrigins` configuration array — if set, restricts origins; if empty, falls back to `AllowAnyOrigin()` with a warning log in non-Development
- Only `Location` header is exposed (for 201 Created responses)

## Controller Conventions

- Use `[ApiController]` + `[Route("api/[controller]")]`
- Use primary constructor injection of `ISender`
- Return `ActionResult` or `ActionResult<T>` — use `CreatedAtAction` for POST, `NoContent` for PUT/DELETE success, `NotFound` for missing resources

→ Full specification: [`docs/specs/AddressBook.Api.md`](../../docs/specs/AddressBook.Api.md)
