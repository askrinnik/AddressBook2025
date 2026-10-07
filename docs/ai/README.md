# AI harness of AddressBook2025

How the AI-assistant environment of this repository is built: what it consists of, how the workflows are organised, why each stage uses the model it does, and how to keep it healthy. The harness serves two tools — **Claude Code** and **GitHub Copilot** — from one set of shared files. Its workflow, agents, rules, skills and benchmark were adapted from the GitHubBackup repository's harness (issue #184).

## Layout

```
CLAUDE.md                              single instruction hub, read by Claude Code and Copilot
.mcp.json                              MCP servers for Claude Code (context7, microsoft-learn, nuget)
.vscode/mcp.json                       MCP servers for Copilot in VS Code (github + the same three)
.ai/
  customizations.policy.json           layout and mirroring rules (audited by check.ps1)
  prompts/implement-issue.md           the workflow body, shared by both tools
  prompts/implement-issues.md          the batch workflow body (several issues, one branch)
  benchmarks/harness/                  harness benchmark: fixtures, history, reports
.github/
  instructions/*.instructions.md       file-type standards (source of truth; Copilot applies them via applyTo)
  skills/                              skills (source of truth)
  prompts/implement-issue.prompt.md    Copilot wrapper of the workflow
  prompts/implement-issues.prompt.md   Copilot wrapper of the batch workflow
  agents/*.agent.md                    Copilot agents (full set)
.claude/
  skills/                              byte-for-byte mirror of .github/skills
  commands/implement-issue.md          Claude Code wrapper of the workflow
  commands/implement-issues.md         Claude Code wrapper of the batch workflow
  agents/*.md                          Claude Code agents (curated subset + workflow agents)
  rules/*.md                           path-scoped rules: pointers to .github/instructions
  settings.json                        shared permissions, attribution off, MCP servers enabled
docs/
  specs/                               specifications (API, Contracts, Web, Architecture)
  tasks/                               one plan per issue: issue-<n>-<slug>.md
  ai/                                  the harness hub (README.md) and one document per workflow command
```

The layout is checked with `pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1`.

## Workflows

Each command has its own document in `docs/ai/`: a step tree and a Mermaid flowchart showing who acts at each step — 💻 the main session, 🤖 an agent, 🧩 a skill, 🙋 a wait for the user. The `document-workflow` skill writes them and keeps them in step with the workflow bodies in `.ai/prompts/`.

| Command | Document | What it does |
|---|---|---|
| `/implement-issue <n>` | [docs/ai/implement-issue.md](implement-issue.md) | One issue end to end; the labels select the Bug, Feature or Test-authoring lane; two checkpoints with the user |
| `/implement-issues <n> <n> …` | [docs/ai/implement-issues.md](implement-issues.md) | Several small issues on one branch, one commit each, one pull request |

The sections below describe what all workflows share: the agents and their models, the rules, the skills, the MCP servers and the permissions.

## Issue order: `next-issue`

`.github/skills/_local.next-issue/scripts/Get-NextIssue.ps1` reads all open issues with one GraphQL query and lists the ready ones: no open pull request and every "blocked by" issue closed, ordered by issue number (issues of one plan are created in plan order). `-AssumeClosed <n>` treats an issue as closed, so the workflow can recommend the next issue before the current PR merges. Dependencies must be recorded as GitHub "blocked by" relations for the order to hold.

## Agents and models

| Agent | Model | Why this model |
|---|---|---|
| `issue-planner` | Opus | A planning mistake is the most expensive one: it is multiplied by implementation, review and rework |
| `issue-developer` | Sonnet; Opus for complexity `L` | Implementing an approved plan is well-specified work; `L` (migration, contract ripple, validation/security logic, > ~8 files) gets the stronger model |
| `issue-verifier` | Sonnet | Browser walks are mechanical but produce huge snapshots; isolating them keeps the main context small |
| `security-reviewer` | Opus | Rare, and finding a real issue needs the strongest reasoning |
| `build-runner` | Haiku | The build-and-test gate of step 8: the build, bUnit, the Playwright API suite and the UI E2E suite. It returns the runners' summary lines verbatim with the first errors, so a retelling cannot distort the result; the main session spends one call on the gate, and the noisy build and test output stays out of its context. It checks independently of the implementer and fixes nothing |
| `skill-runner` | Haiku | Carries out one already-approved action end to end by its skill: the issue comment (`github-issue`), the commit (`git-commit`) or the pull request (`open-pr`) — writes the text in English, runs the `git`/`gh` command, checks the result. The main session spends one call on the action and does not load the skill into its own context. It never pushes, edits the issue body or merges |
| `architect` | Opus | Design questions on cross-layer changes |
| `playwright-tester` | Sonnet | Test-authoring lane: explores the UI with Playwright MCP and writes specs |

The main session keeps every gate: plan review, both confirmations, the user's go-ahead before every outward action, the push, the acceptance ticks and the CI check. The implementer's "passed" is input, not proof: `build-runner` builds and tests again, independently. The scratch directories and files the main session hands to `build-runner` and `skill-runner` lie outside the repository, and both agents run one plain command per call, so that nothing stray reaches `git status` and every command matches the permission rules. The scratch location is the main session's own scratchpad, a per-session folder Claude Code keeps under the system temp directory; `build-runner` gets a subfolder of it. Files there are not deleted one by one inside the workflow: that would cost model calls and, outside auto mode, a permission prompt per file. Clearing old session folders as a whole is left to the user, outside the workflow. `skill-runner` copies numbers, names and lists from the facts it is given verbatim and adds no acceptance rows of its own: Haiku is reliable at the fixed-format actions but drifted when it re-worded dense facts in an issue comment. Copilot cannot override a subagent's model per call, so there an `L` plan is implemented in the main session. Agent parity between `.claude/agents` and `.github/agents` is manual.

## Rules (`.claude/rules/`)

Claude Code loads a rule when it works with a file matching the rule's `paths:`. Five rules are thin pointers that tell the assistant to read a `.github/instructions/*` file before editing, so the standard stays in one place and loads only when needed (an `@`-import would be expanded at session start — the first benchmark showed ~3k tokens in every session): `api-architecture.md`, `csharp.md`, `blazor.md`, `playwright.md`, `bunit.md`. Their `paths:` mirror the instruction's `applyTo` — change both together. Three rules carry their own content: `update-docs-on-code-change.md` (which document each kind of change updates), `docs.md` (where documents go, plan format, style) and `github-actions.md` (workflow security and CI conventions). Directory-scoped `CLAUDE.md` files (`src/UiTests`, `src/AddressBook.Web.Tests`) add project-specific non-negotiables.

## Skills

Repository-local skills (`_local.*`, invoked as `/<name>`):

| Skill | Purpose |
|---|---|
| `github-issue` | Read an issue; post the result comment for the lane. Its script `Set-AcceptanceChecks.ps1` ticks the verified items of the acceptance section (`## Критерии приёмки`, `## Acceptance criteria` or `## Acceptance`) by their positions in one call; it changes nothing else in the issue and refuses to write if anything besides the marks would differ |
| `run-api`, `run-tests` | Start the API; run the Playwright API suite |
| `verify-feature` | Start API + Web and walk acceptance items in a browser |
| `open-pr`, `git-commit` | Commit and pull-request conventions |
| `next-issue` | Recommend the next issue |
| `write-tests` | Pick the test layer (Playwright API / bUnit / Playwright UI) and write the tests |
| `debug-issue` | Reproduce and find the root cause of a defect |
| `refactor-code` | Behaviour-preserving refactoring |
| `nuget-package-update` | Pin-aware NuGet updates through `src/Directory.Packages.props`, family by family, with a build and test gate after each step |
| `harness-quality-check` | Benchmark the harness (manual only) |
| `sync-ai-customizations` | Audit the cross-tool layout |

Generic skills (`aspnet-core`, `ef-core`, `security-owasp`, `update-docs`, `code-review-checklist`, `dotnet-run-tests`, `test-anti-patterns`, `coverage-analysis`, `directory-build-organization`, …) are loaded on demand instead of sitting in every context. Rarely needed ones — `coverage-analysis`, `directory-build-organization`, `test-anti-patterns`, `create-specification`, `dotnet-timezone`, `harness-quality-check` — set `disable-model-invocation: true`: their descriptions stay out of the start context, and they run only when invoked as `/<name>`. `dotnet-run-tests` is the upstream `run-tests` skill, renamed because `_local.run-tests` owns that name. `document-workflow` writes or syncs the document of a workflow command — a step tree and a Mermaid flowchart with the emoji set 💻 session, 🤖 agent, 🧩 skill, 🙋 user wait — and checks the diagram with its own local preview script.

## MCP servers

| Server | Used for |
|---|---|
| `microsoft-learn` | Official .NET, ASP.NET Core, EF Core and Azure documentation and code samples (`microsoft-docs` skill, `issue-planner`, `issue-developer`) |
| `context7` | Documentation of third-party libraries: MudBlazor, FluentValidation, MediatR, bUnit, Playwright |
| `nuget` | Package versions, vulnerabilities and release information (`nuget-package-update`); runs through `dnx`, which needs the .NET 10 SDK |
| `github` | Issues and pull requests — in the Copilot config only; Claude Code uses `gh` or the user's own GitHub MCP server |

Claude Code asks each user once to approve the project servers in `.mcp.json`.

## Permissions

`.claude/settings.json` is shared through git:

- **allow** — build, tests, running the API and the Web app, `git` and `gh` reads, the shipping commands (`git add`/`commit`/`push`, `gh pr create`, `gh issue comment`/`edit`), the `_local.*` scripts, and the documentation MCP servers. Commit, push and PR stay gated by instruction: the assistant does them only when the user asks (`CLAUDE.md`). The same holds for `Set-AcceptanceChecks.ps1`: it runs without a system prompt like every `_local.*` script, but it edits the issue body and so runs only after the user's "yes";
- **ask** — merging, PR comments and edits, creating or closing issues, GitHub API writes, `dotnet ef database`;
- **deny** — force-push, `reset --hard`, `git clean`, `rm -rf`, and reading `.env` or local `appsettings.*.local.json` secrets.

It also turns off the automatic commit and PR attribution (commit messages follow the `git-commit` skill) and enables the `.mcp.json` servers. Personal overrides go to `.claude/settings.local.json`, which git ignores.

## Harness benchmark

The `harness-quality-check` skill starts fixed `claude -p` sessions and records the start context, the tokens a file read adds, the rules loaded, and a judge's score against a ground truth. History: `.ai/benchmarks/harness/run-history.csv`; reports: `.ai/benchmarks/harness/reports/`. Fixtures: `bench-base` (start context by area) and `quality-vertical-slice` (a feature request answered with the full slice, validation, tests and open decisions). Run it after changing `CLAUDE.md`, rules, skills, agents, MCP servers or settings; it uses part of the usage limit.

## Maintenance

When `CLAUDE.md`, `.claude/**`, `.github/{agents,skills,prompts,instructions}/**`, `.ai/**` or `.mcp.json` change, update this document in the same change, run the layout audit, and preferably the benchmark.
