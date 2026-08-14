# CLAUDE.md — AddressBook2025

Project guidance for both **Claude Code** and **GitHub Copilot** — both tools read this file.

This file is intentionally a **thin hub**: it owns only the few rules that live nowhere else, and points to the authoritative docs for everything else. Nothing here restates build commands, project structure, or coding conventions — those have a single source of truth (the specs and the instruction files), and duplicating them here would only drift out of sync.

## Always

- Source code may contain non-English (Russian) comments — that is expected; do not "fix" them to English.
- When a Git commit is requested, use the `git-commit` skill and follow its message conventions; do not hand-write commit messages in another format.

## Where things live (read the source — do not restate it here)

- **Architecture, project structure, CI, deployment** → [docs/specs/Architecture.md](docs/specs/Architecture.md)
- **API — build/run, endpoints, CQRS (MediatR) / FluentValidation / RFC 7807, domain, data access** → [docs/specs/AddressBook.Api.md](docs/specs/AddressBook.Api.md)
- **Web — build/run, launch profiles & ports, Blazor WASM + MudBlazor conventions, API service, pages** → [docs/specs/AddressBook.Web.md](docs/specs/AddressBook.Web.md)
- **Contracts — commands, queries, models** → [docs/specs/AddressBook.Contracts.md](docs/specs/AddressBook.Contracts.md)
- **API E2E tests — run & conventions** → [src/ApiTests/README.md](src/ApiTests/README.md)
- **UI E2E tests (planned)** → [docs/tasks/ui-tests-framework-plan.md](docs/tasks/ui-tests-framework-plan.md)

Solution file: `src/AddressBook.sln`.

## Working style

- Make focused, reviewable changes; reuse existing abstractions before adding new ones.
- When a change spans the API and the Web frontend, wire both sides so the feature is complete.
- New or changed API behaviour ships with Playwright tests in `src/ApiTests` (happy path, boundaries, negatives).

## File-type coding standards

Read the matching instruction file before working on these file types. **Copilot** applies them automatically via the `applyTo` globs in each file's front matter; **Claude Code does not** understand `applyTo`, so for Claude Code this table is the pointer and reading the file is a manual step. The `.github/instructions/*.instructions.md` files are the single source of truth for these standards — the globs shown here are just a hint; the authoritative `applyTo` lives in each file's front matter.

| Topic / file type | Instruction file |
|---|---|
| API architecture (`src/AddressBook.Api/**`) | `.github/instructions/api-architecture.instructions.md` |
| C# (`**/*.cs`) | `.github/instructions/csharp.instructions.md` |
| ASP.NET REST APIs (`**/*.cs`, `**/*.json`) | `.github/instructions/aspnet-rest-apis.instructions.md` |
| Blazor (`*.razor`, `*.razor.cs`, `*.razor.css`) | `.github/instructions/blazor.instructions.md` |
| Blazor project-specific (MudBlazor / WASM) | `.github/instructions/blazor.project-specific.instructions.md` |
| Playwright E2E (`src/ApiTests/**`, `src/AutoTests/**`) | `.github/instructions/playwright-conventions.instructions.md` |
| Security / OWASP (`**`) | `.github/instructions/security-and-owasp.instructions.md` |
| Performance (`**`) | `.github/instructions/performance-optimization.instructions.md` |
| Code review (`**`) | `.github/instructions/code-review-generic.instructions.md` |
| Docs sync on code change | `.github/instructions/update-docs-on-code-change.instructions.md` |

> When the `src/UiTests` suite is created, add `src/UiTests/**` to the `applyTo` glob of `playwright-conventions.instructions.md` so both tools apply it there too.

For conventions important enough to auto-load in Claude Code, add a directory-scoped `CLAUDE.md` next to the code (Claude Code loads those when working in that subtree). Keep it short and non-duplicating; the `.github/instructions/*` file stays the single source of truth.

## Cross-tool skills & commands

Layout, mirroring rules, and the exclusion list are defined in [.ai/customizations.policy.json](.ai/customizations.policy.json); the mechanics and audit are the `sync-ai-customizations` skill. In short: `.github/skills/` is the source of truth, mirrored byte-for-byte to `.claude/skills/`; repo-local skills use the `_local.` prefix and are still invoked as `/<name>`. Commands keep their body once in `.ai/prompts/<name>.md` with thin wrappers in `.github/prompts/` (Copilot) and `.claude/commands/` (Claude). Audit the layout with:

```
pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1
```
