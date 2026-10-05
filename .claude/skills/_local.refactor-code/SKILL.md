---
name: refactor-code
description: Refactor AddressBook2025 source surgically without changing behaviour — improve structure, naming or duplication within the existing architecture (CQRS/MediatR API, Contracts, Blazor/MudBlazor Web, Playwright and bUnit test code), verified by the unchanged test suites. Use when asked to refactor, clean up or restructure code.
---

# Refactor Code

> Local skill note: Ported from the GitHubBackup repository harness; repository-specific, no canonical upstream skill in github/awesome-copilot.

Improve maintainability while preserving behaviour and the repository's conventions.

Ask for the target area and the reason for the refactoring if they are not already clear.

## Requirements

- Behaviour stays identical: the existing tests pass unchanged — the Playwright API suite (`src/ApiTests`), the bUnit suite (`src/AddressBook.Web.Tests`) and, for UI changes, the UI E2E suite (`src/UiTests`). If a test must change, the change is structural (a moved type, a renamed member, an updated locator constant), never a weakened assertion — and say so.
- The API contract does not change: routes, status codes, request and response shapes, and problem-details content stay the same. A contract change is a feature, not a refactoring.
- Stay within the architecture: the project boundaries (`AddressBook.Api`, `AddressBook.Contracts`, `AddressBook.Web`), the CQRS handler/validator pattern, DI through interfaces (`api-architecture.instructions.md`, `blazor.project-specific.instructions.md`). A refactoring that moves a responsibility across projects is a design change — consult the `architect` agent first.
- No EF Core model change without a migration; a refactoring that needs one is not a pure refactoring — say so before doing it.
- Small, reviewable steps; build (`dotnet build src/AddressBook.slnx -clp:ErrorsOnly`) and run the affected tests after each one.
- Do not mix feature work or bug fixes into a refactoring.
- Comments touched by the refactoring are in English and obey the comment-hygiene rules in `CLAUDE.md`; leftover comments that narrate history are rewritten, not carried along.
- Finish with a clean build and a full run of the affected suites.
