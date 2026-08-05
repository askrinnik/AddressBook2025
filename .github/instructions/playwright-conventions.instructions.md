---
description: "Playwright TypeScript E2E test conventions for AddressBook2025. Use when writing, modifying, or reviewing API end-to-end tests."
applyTo: "src/AutoTests/**"
---
# Playwright E2E Test Conventions

## API Client Pattern

- All API interactions go through the `ApiClient` singleton — never use raw `request` calls directly in tests
- Get instance via `ApiClient.getInstance(request)` in each test
- Positive-path methods assert status and return typed payloads
- Negative-path methods (e.g., `createInvalidContact`, `getContactByWrongId`) return raw `APIResponse` for caller-driven assertions

## Assertions

- Use `expect.soft()` for non-critical assertions — allows tests to continue and report multiple failures
- Use strict `expect()` only for assertions that must halt the test on failure

## Test Structure

- Group tests using `test.describe('VERB /api/Endpoint', () => { ... })` per endpoint
- Test names should describe the scenario clearly (e.g., `'create, verify, and delete contact with birthday data'`)

## Test Data & Isolation

- Follow **Create → Verify → Delete** pattern to ensure test isolation and cleanup
- Use factory methods on DTO classes for test data (`Contact.createCorrectContactWithBirthday()`, etc.)
- Never rely on auto-increment IDs from previous test runs — always create and clean up your own data

## DTOs

- Mirror backend models in TypeScript classes under `tests/dtos/`
- Include static factory methods for common test scenarios (valid, invalid, edge cases)
- `ProblemDetails` DTO includes helper methods: `hasErrors()`, `messagesFor(propertyName)`

## Comments

- Russian-language comments are supported — maintain the language of existing comments nearby
- Use comments to explain **why** two similar tests exist (e.g., demonstrating different testing approaches)

→ Full specification: [`docs/specs/AutoTests.md`](../../docs/specs/AutoTests.md)
