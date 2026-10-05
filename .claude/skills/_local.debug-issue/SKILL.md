---
name: debug-issue
description: Reproduce and diagnose a defect in AddressBook2025 systematically — reproduce with a failing Playwright or bUnit test or in a real browser, read the problem details, console and API log, find the root cause in the right layer (Web, Contracts, API handler/validator/controller/repository), and validate the fix. Use when something behaves wrongly, a test fails unexpectedly, or the API returns an unexpected error.
---

# Debug Issue

> Local skill note: Ported from the GitHubBackup repository harness; repository-specific, no canonical upstream skill in github/awesome-copilot.

Diagnose a defect systematically and validate the fix with the existing test suites.

Ask for the failing behaviour, the steps or request, and any error message if they are not already clear.

## Procedure

1. **Reproduce before fixing.** In order of preference:
   - a failing test in the layer that owns the decision — a Playwright API spec for API behaviour, a bUnit test for component logic (see the `write-tests` skill for the layer table);
   - a single HTTP request against the running API (`src/AddressBook.Api/AddressBook.Web.http`, or Swagger at `http://localhost:5000/swagger`), capturing status and body;
   - a walk in a real browser with the Playwright MCP server against the running API + Web (`issue-verifier` agent, `reproduce` mode), capturing console errors and failed requests.
   If it cannot be reproduced as described, report what was tried and ask before going further.
2. **Read the evidence.**
   - API errors come back as RFC 7807 problem details built by `GlobalExceptionHandler`: validation failures list the property errors, other exceptions carry the type and status. Read the response body, not only the status.
   - The API console log of the `dotnet run` task shows the exception and the EF Core SQL in Development.
   - In the browser, the console and the network panel show which request failed and what the Web app did with the response (`AddressBookApiService`, `CustomValidationSummary`).
3. **Find the root cause, not the symptom.** Follow the request across the layers — Web page → `IAddressBookApiService` → Contracts → controller → MediatR handler / FluentValidation validator → repository / EF Core configuration — and name the type and member where the wrong decision is made, and why it is wrong.
4. **Fix minimally** in that layer, keeping the architecture and conventions; no unrelated cleanup.
5. **Validate:** the reproducing test now passes, every existing test still passes, the build is clean, and the original repro no longer fails.
6. **Record** the root cause and the fix in the shape of the Bug-lane comment of the `github-issue` skill (*Root Cause / Resolution / Verification*).

Never "fix" a failure by weakening a test, deleting an assertion, retrying a flaky step, or swallowing an exception.
