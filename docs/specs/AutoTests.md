# AutoTests Technical Specification

## Project Overview

`AutoTests` is a Playwright (TypeScript) end-to-end API test suite for the AddressBook solution.

- Test target: live Azure API at `https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/api/`
- Test scope: API-level E2E scenarios for Contacts endpoints
- Status code assertions: `http-status-codes` npm package (`StatusCodes` constants)
- Cross-browser execution: Chromium, Firefox, WebKit

## Runtime and Tooling

- Framework: `@playwright/test`
- Language: TypeScript
- Linting: ESLint
- Formatting: Prettier
- Package manager: npm

## Playwright Configuration

Source: `src/AutoTests/playwright.config.ts`

| Setting | Value |
|---|---|
| `testDir` | `./tests` |
| `fullyParallel` | `true` |
| `forbidOnly` | `!!process.env.CI` |
| `retries` | `process.env.CI ? 2 : 0` |
| `workers` | `process.env.CI ? 1 : undefined` |
| `reporter` | `html` |
| `use.trace` | `on-first-retry` |

### Browser Projects

| Project Name | Device Profile |
|---|---|
| `chromium` | `Desktop Chrome` |
| `firefox` | `Desktop Firefox` |
| `webkit` | `Desktop Safari` |

## API Client Specification

Source: `src/AutoTests/tests/api-client.ts`

### Design

`ApiClient` is implemented as a singleton wrapper over Playwright `APIRequestContext`.

- Base URL: `https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/api/`
- Contacts path segment: `Contacts`
- Assertion strategy:
  - Positive-path methods use in-method assertions (`expect.soft(...)`) and return typed payloads.
  - Negative-path methods return raw `APIResponse` for caller-driven assertions.

### Public API

| Method | Description | Returns |
|---|---|---|
| `getInstance(request)` | Static singleton factory | `ApiClient` |
| `extractIdFromResponse(response)` | Parses contact ID from `Location` header using regex `/\/Contacts\/(\d+)$/` | `number` |
| `getContacts()` | `GET /Contacts`, asserts `200 OK` | `Promise<GetContactsResponse>` |
| `getContactsByTerm(searchTerm)` | `GET /Contacts?search=...`, asserts `200 OK` | `Promise<GetContactsResponse>` |
| `getContactById(contactId)` | `GET /Contacts/{id}`, asserts `200 OK` | `Promise<Contact>` |
| `getContactByWrongId(contactId)` | `GET /Contacts/{id}`, no status assertion | `Promise<APIResponse>` |
| `createContact(contactData)` | `POST /Contacts`, asserts `201 Created`, extracts ID from `Location` | `Promise<number>` |
| `createInvalidContact(contactData)` | `POST /Contacts`, no status assertion | `Promise<APIResponse>` |
| `deleteContactById(contactId)` | `DELETE /Contacts/{id}`, asserts `response.ok()` | `Promise<void>` |
| `deleteContactByWrongId(contactId)` | `DELETE /Contacts/{id}`, no status assertion | `Promise<APIResponse>` |

## DTOs

### Contact DTO

Source: `src/AutoTests/tests/dtos/contact.ts`

```typescript
export class Contact {
  id: number;
  firstName: string;
  lastName: string;
  birthday?: string;

  static createCorrectContactWithBirthday();    // Petr Petrov, 2011-11-11
  static createCorrectContactWithoutBirthday(); // Petr Petrov, no birthday
  static createIncorrectContact();              // first/last names length = 31
  static createContactWithFutureDate();         // Petr Petrov, 2100-11-11
}
```

### GetContactsResponse DTO

Source: `src/AutoTests/tests/dtos/GetContactsResponse.ts`

- `totalRows: number`
- `rows: Contact[]`

### ProblemDetails DTO

Source: `src/AutoTests/tests/dtos/ProblemDetails.ts`

Client-side RFC 7807 model used for validation-error assertions.

- Core fields: `type`, `title`, `status`, `detail`, `instance`, `errors`
- `hasErrors(): boolean`
- `messagesFor(propertyName: string): string[]`
- `static fromJSON(json: any): ProblemDetails`

## Test Scenarios

Source: `src/AutoTests/tests/api-testing.spec.ts`

### GET /api/Contacts

| Test | Description |
|---|---|
| `get all contacts` | Fetches all contacts; verifies `rows.length > 0` and `rows.length === totalRows` |
| `get all contacts by letters` | Searches with `skr`; verifies each returned name contains search term |
| `GET contacts by search term, verifying CORRECT names` | Searches with `skr`; verifies exact expected contacts: Alex Skr (1972-07-14), Vera Skrynnik (1998-12-11), Skrynnik Vera (no birthday) |

Note in source code: a Russian comment explains both checks are intentionally kept to demonstrate two testing approaches.

### GET /api/Contacts/{id}

| Test | Description |
|---|---|
| `get contact by id` | Requests ID `1`; verifies John Doe with birthday `1990-01-01` |
| `get contact by non-existed id` | Requests ID `10000`; expects `404` |

### POST /api/Contacts

| Test | Description |
|---|---|
| `create, verify, and delete contact with birthday data` | Full create-read-delete cycle with birthday |
| `create, verify, and delete contact without birthday data` | Full create-read-delete cycle with `birthday = null` |
| `create incorrect contact` | Uses 31-character names; expects `400` |
| `create contact with future date` | Uses future birthday; expects `400`, then validates `ProblemDetails` contains `Birthday` error with message `Birthday cannot be in the future` |

### DELETE /api/Contacts/{id}

| Test | Description |
|---|---|
| `delete contact by non-existed id` | Deletes ID `10000`; expects `404` |

## CI Integration

Source: `.github/workflows/playwright.yml`

- Workflow name: `Playwright Tests`
- Trigger: `push` and `pull_request` for `main` and `master`
- Runner: `ubuntu-latest`
- Timeout: `60` minutes
- Working directory for test commands: `src/AutoTests`

### CI Steps

1. `npm ci`
2. `npx playwright install --with-deps`
3. `npx playwright test`

### Reporting

- Artifact upload: `playwright-report`
- Artifact path: `src/AutoTests/playwright-report/`
- Retention: `30` days
- Upload condition: run when workflow is not cancelled

## File Structure

| File | Description |
|---|---|
| `playwright.config.ts` | Playwright configuration |
| `package.json` | npm dependencies and scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `eslint.config.mjs` | ESLint configuration |
| `tests/api-client.ts` | Singleton API client wrapper over `APIRequestContext` |
| `tests/api-testing.spec.ts` | End-to-end API test scenarios |
| `tests/dtos/contact.ts` | Contact DTO and factory methods |
| `tests/dtos/GetContactsResponse.ts` | DTO for list response (`totalRows`, `rows`) |
| `tests/dtos/ProblemDetails.ts` | RFC 7807 client-side model for validation error assertions |
