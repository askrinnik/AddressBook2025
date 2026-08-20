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
| Blazor project-specific (MudBlazor / WASM) | `.github/instructions/blazor.project-specific.instructions.md` |
| Playwright E2E — API (`src/ApiTests/**`, `src/AutoTests/**`) and UI (`src/UiTests/**`) | `.github/instructions/playwright-conventions.instructions.md` |

> The Playwright conventions file covers both the API suites and the UI E2E suite (`src/UiTests`, in its own section). Claude Code also auto-loads `src/UiTests/CLAUDE.md` when working in that subtree.

The four generic, always-on instruction files that used to load on every file (security/OWASP, web performance, generic code review, docs-sync) are now **on-demand skills** instead — `security-owasp`, `web-performance`, `code-review-checklist`, `update-docs` — so they no longer sit in context permanently; invoke them (or the built-in `/code-review` and `/security-review`) when that pass is actually needed.

For conventions important enough to auto-load in Claude Code, add a directory-scoped `CLAUDE.md` next to the code (Claude Code loads those when working in that subtree). Keep it short and non-duplicating; the `.github/instructions/*` file stays the single source of truth.

## Custom agents

- **GitHub Copilot** loads the full set from `.github/agents/<name>.agent.md` — this folder is Copilot's, and its contents are curated for Copilot, not pruned by Claude Code's capabilities.
- **Claude Code** loads a **curated subset** from `.claude/agents/<name>.md` (invoked via the Agent tool, `subagent_type` = the agent name). Only the agents whose role is **not already covered by a Claude Code built-in** are translated here; the body stays aligned with the Copilot source, the front matter is translated (lowercase `name` matching the filename, Claude tool names, short `model` alias).

The subset currently exposed to Claude Code:

- **architect** — designs changes that preserve project boundaries; surfaces trade-offs (design before implementation).
- **software-engineer** — implements features/fixes across the API + Blazor stack.
- **csharp-dotnet-janitor** — C#/.NET cleanup, modernization, tech-debt remediation.
- **playwright-tester** — writes/stabilises the Playwright API/UI E2E tests.
- **project-documenter** — generates project documentation (read-only on source).
- **orchestrator** — decomposes a multi-step request and delegates to the specialists.

Not translated to `.claude/agents` because a **Claude Code** built-in already covers the role (this is a Claude-Code judgement only — it says nothing about whether Copilot needs the corresponding `.github/agents` file): planning → the `Plan` agent; research → `Explore` / general-purpose; review → the `/code-review` skill; plus debugging/QA/design/regression roles handled inline or by general-purpose.

> Agent parity is **manual** — the `sync-ai-customizations` audit covers skills and prompts, **not** agents. `.claude/agents` is a deliberate subset of `.github/agents`, so it is not expected to match one-to-one. After editing a shared agent on one side, mirror the change (body aligned, front matter translated) on the other.

## Cross-tool skills & commands

Layout, mirroring rules, and the exclusion list are defined in [.ai/customizations.policy.json](.ai/customizations.policy.json); the mechanics and audit are the `sync-ai-customizations` skill. In short: `.github/skills/` is the source of truth, mirrored byte-for-byte to `.claude/skills/`; repo-local skills use the `_local.` prefix and are still invoked as `/<name>`. Commands keep their body once in `.ai/prompts/<name>.md` with thin wrappers in `.github/prompts/` (Copilot) and `.claude/commands/` (Claude). Audit the layout with:

```
pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1
```
