---
name: write-tests
description: Add focused tests for a behaviour or a bug fix in the correct AddressBook2025 test layer — Playwright API tests (src/ApiTests), bUnit component tests (src/AddressBook.Web.Tests) or Playwright UI E2E tests (src/UiTests). Use when asked to write, add or extend tests, or to cover a fix with a regression test.
---

# Write Tests

> Local skill note: Ported from the GitHubBackup repository harness; repository-specific, no canonical upstream skill in github/awesome-copilot.

Add or update tests in the correct layer for the requested behaviour or bug fix.

Ask for the target behaviour or the failing scenario if it is not already clear.

## Pick the layer

The lowest layer that can observe the behaviour wins.

| Behaviour | Layer | Conventions |
|---|---|---|
| API contract: status codes, response shape, validation (RFC 7807 errors), filtering, sorting, paging | Playwright API — `src/ApiTests` | `.github/instructions/playwright-conventions.instructions.md` (API sections), `src/ApiTests/README.md` |
| Blazor component or page logic: rendering, form validation, calls to `IAddressBookApiService`, navigation, error display | bUnit — `src/AddressBook.Web.Tests` | `.github/instructions/bunit-conventions.instructions.md`, `src/AddressBook.Web.Tests/README.md` |
| A user flow across the real UI and API in a browser | Playwright UI E2E — `src/UiTests` | `.github/instructions/playwright-conventions.instructions.md` (UI section), `src/UiTests/CLAUDE.md` |

A decision a component makes gets a bUnit test, not a browser test; a validation rule of the API gets an API test, not a UI test. A UI E2E test proves the slice is wired, not every branch.

## Procedure

1. **Find the requirement.** The issue's acceptance list and the code define the cases: required vs optional fields, boundary lengths and dates, success/error/empty/loading states.
2. **Find the home.** The nearest existing spec or test class for the endpoint, page or component (`src/ApiTests/tests/contacts/*.spec.ts`, `src/AddressBook.Web.Tests/Specs/<area>/`, `src/UiTests/tests/`). Match its naming, fixtures and helpers.
3. **Write the cases:** the success path, each failure path the code handles, and the boundaries. One behaviour per test; parametrise instead of copying (`[Theory]` in xUnit, a data table loop in Playwright).
4. **Keep them isolated and deterministic:**
   - Playwright: data only through the factories (`contact.factory.ts`, `ContactFactory`), a unique run token in names, Create → Verify → Delete; the database is a shared SQL Server that is never reset, so never assert on absolute counts or "the first row". Web-first assertions only, never `waitForTimeout`.
   - bUnit: derive from `MudTestContext`, data through `ContactBuilder`, `IAddressBookApiService` mocked with NSubstitute, `WaitForState` / `WaitForAssertion` instead of delays.
5. **Run** the affected tests while iterating, then the whole suite once at the end:
   - API: `npx playwright test <spec> --reporter=line` from `src/ApiTests` (its `webServer` config starts the API);
   - bUnit: `dotnet test --project src/AddressBook.Web.Tests`;
   - UI: `npx playwright test <spec> --reporter=line` from `src/UiTests` (starts the API and the Web app).
   Every existing test still passes.

## For a bug fix

Write the regression test **first**, run it, and confirm it fails for the reason in the bug report. Only then fix the code and watch it pass. A test that never failed proves nothing.

## Checklist

- Every test asserts the behaviour it names; no test passes without an assertion.
- No test depends on another test, on order, on the clock or on data it did not create.
- Comments are in English and explain *why*, not what.
