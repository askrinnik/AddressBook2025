---
name: run-api
description: >
  Start the AddressBook API locally for development or test runs.
  Use when you need the API running on http://localhost:5000 before
  executing Playwright E2E tests or exploring endpoints via Swagger.
---

# Run AddressBook API Locally

> Local skill note: This skill is intentionally repository-specific for AddressBook2025 and does not map to a canonical upstream skill in github/awesome-copilot.

## Prerequisites

| Requirement | Notes |
|---|---|
| .NET 9 SDK | `dotnet --version` must be ≥ 9.0 |
| SQL Server Express | Must be accessible at `localhost\SQLEXPRESS` |

## Starting the API

```bash
cd src/AddressBook.Api
dotnet run
```

The API starts on **http://localhost:5000** (profile `http`, `Development` environment).

> The database schema is created and seeded automatically on startup — no manual migration step is needed.

## Database Credentials

The `Development` environment reads credentials from `appsettings.Development.json` (local file, not committed to source control). Ensure that file exists and contains valid `Database:User` and `Database:Password` values for your local SQL Server instance.

To use a different server or credentials, override via environment variables or user secrets:

```bash
# Override server
dotnet run --Database:Server="myserver\SQLEXPRESS"

# Override credentials
dotnet run --Database:User="myuser" --Database:Password="mypassword"
```

Or set them as environment variables:

```powershell
$env:Database__Server = "myserver\SQLEXPRESS"
$env:Database__User   = "myuser"
$env:Database__Password = "mypassword"
dotnet run
```

## Verifying the API is Running

Open either URL in a browser or HTTP client:

| URL | Expected |
|---|---|
| `http://localhost:5000/swagger/` | Scalar API reference UI |
| `http://localhost:5000/api/Contacts` | JSON array of contacts |

## Stopping the API

Press `Ctrl+C` in the terminal where `dotnet run` is running.

## Next Steps

- Run E2E tests against this local instance using the [run-tests](../run-tests/SKILL.md) skill.
