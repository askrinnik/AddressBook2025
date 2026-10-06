# AI harness of AddressBook2025

How the AI-assistant environment of this repository is built: what it consists of, how the issue workflow runs, why each stage uses the model it does, and how to keep it healthy. The harness serves two tools — **Claude Code** and **GitHub Copilot** — from one set of shared files. Its workflow, agents, rules, skills and benchmark were adapted from the GitHubBackup repository's harness (issue #184).

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
  ai-harness.md                        this document
```

The layout is checked with `pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1`.

## The issue workflow: `/implement-issue <n>`

One command takes any issue end to end. The issue's labels select the **lane**: `bug` → Bug lane; tests-only work (typically `testing`) → Test-authoring lane; everything else → Feature lane.

The body is `.ai/prompts/implement-issue.md`. The diagram below shows who does what at each step. Legend:

- `<session>` — the main session, on whatever model it was started with;
- agents have their model written out: it is set in `.claude/agents/*.md` and does not depend on the session's model (see [Agents and models](#agents-and-models));
- 🤖 — an agent call (`.claude/agents/`);
- 🧩 — a skill (`.claude/skills/`);
- **[You]** — a point where the process waits for the user.

```
/implement-issue 42
│
├─ 0. Branch preparation ─────────── <session>: git status → git switch main → git pull --ff-only
│                                    (uncommitted changes → stop, ask you; staying on the
│                                     current branch only when you said so)
├─ 1. Read the issue ─────────────── <session>: 🧩 github-issue (body, comments, sub-issues)
│                                    (no number → 🧩 next-issue → [You] pick an issue)
│                                    (closed issue → stop)
│                                    (open blocker → stop, ask you)
│                                    gh issue edit --add-assignee @me
├─ 2. Lane ───────────────────────── <session>: label bug → Bug · tests only → Test-authoring
│                                    · else Feature (labels and text disagree → [You])
│
├─ 3. Understand the problem
│    ├─ Bug:  <session> ──▶ 🤖 issue-verifier (Sonnet), reproduce mode, + 🧩 debug-issue
│    │          ◀── repro table (or a failing Playwright API spec)
│    │          (cannot reproduce → [You])
│    ├─ Feature / Test-authoring: <session>: 🧩 github-issue → acceptance list
│    │          (material gaps → [You])
│    └─ All lanes: <session> ──▶ 🤖 Explore (summary ≤ 30 lines): locate the code
│
├─ 4. Plan ──────────────────────────────────▶ 🤖 issue-planner (Opus, read-only)
│                                    (large cross-layer change → optional 🤖 architect, Opus)
│                                    ◀── plan text + complexity S/M/L
├─ 5–6. Save and review ──────────── <session>: docs/tasks/issue-42-<slug>.md
│                                    [You] review → edits → review again
│                                    [You] /compact (ready-made command)
│
├─ 7. Implement
│    ├─ Bug / Feature: <session> ──▶ 🤖 issue-developer (Sonnet · Opus for L)
│    ├─ Test-authoring: <session> ──▶ 🤖 playwright-tester (Sonnet) for Playwright specs
│    │                                🤖 issue-developer (Sonnet) for bUnit
│    │                  tests via 🧩 write-tests · docs updated in the same change
│    │                  ◀── change summary (no commits)
│    └─ (tests reveal a broken behaviour in Test-authoring → stop, [You])
│
├─ 8. Build, tests and review
│    ├─ <session>: stop background servers
│    ├─ <session> ──1 call──▶ 🤖 build-runner (Haiku), scope full
│    │                         dotnet build -clp:ErrorsOnly
│    │                         bUnit · Playwright API · Playwright UI E2E (output to files;
│    │                         the Playwright suites start API and Web themselves)
│    │    <session> ◀── verbatim summary lines + first errors
│    │    (red → errors to 🤖 issue-developer → 🤖 build-runner again)
│    ├─ <session>: review of the comments the change adds
│    └─ if API / validators / data access / Program.cs / config / packages changed:
│         <session> ──▶ 🤖 security-reviewer (Opus) ◀── findings → fixes
│
├─ 9. Verify
│    ├─ Bug / Feature: <session> ──▶ 🤖 issue-verifier (Sonnet), verify mode, + 🧩 verify-feature
│    │                  real browser: every acceptance item (or the repro), console, network
│    │                  ◀── evidence table
│    │                  (Test-authoring: no browser walk; the new tests in the build-runner summary
│    │                   must pass and assert the intended behaviour)
│    ├─ red or failed item → back to 7 (or 4 if the approach changes), then 8–9 again
│    └─ [You] /compact
├─ 10. Confirm the result ────────── <session>: result table (acceptance, or root cause)
│                                    [You] "result accepted?" → /compact
│                                    (not accepted → back to 7 or 4)
│
├─ 11. Result comment
│    ├─ [You] "yes, post the comment"
│    │    <session> ──1 call──▶ 🤖 skill-runner (Haiku) + 🧩 github-issue
│    │                           text → gh issue comment --body-file
│    │    <session> ◀── comment URL
│    └─ [You] "yes, tick the acceptance boxes" → <session>: Set-AcceptanceChecks.ps1 (- [ ] → - [x])
│
├─ 12. Ship
│    ├─ <session>: git fetch; origin/main moved → git pull --ff-only and repeat 8–9 (🤖 build-runner)
│    ├─ <session>: ticks the plan checklist
│    ├─ [You] "yes, commit"
│    │    <session> ──1 call──▶ 🤖 skill-runner (Haiku) + 🧩 git-commit
│    │                           creates branch 42-<slug>
│    │                           git add <the given list>
│    │                           writes the text → git commit -F
│    │                           git log -1 → --amend on a deviation
│    │    <session> ◀── "a1b2c3d #42 Title"
│    ├─ [You] "yes, push" → <session>: git push -u origin 42-<slug>
│    ├─ [You] "yes, open the PR"
│    │    <session> ──1 call──▶ 🤖 skill-runner (Haiku) + 🧩 open-pr
│    │                           text → gh pr create --body-file
│    │    <session> ◀── PR URL
│    └─ <session>: gh pr checks (once, no polling)
│
└─ 13. What next ─────────────────── <session>: 🧩 next-issue -AssumeClosed 42
                                     → "merge the PR → new session → /implement-issue N"
```

The same flow as a diagram (GitHub renders Mermaid), without `/compact` and the small commands, which are in the tree above. Grey blocks are the main session, blue are agents, green are skills, yellow are waits for the user, red is a return to implementation.

```mermaid
flowchart TD
    START(["/implement-issue N"]) --> S0["0. Branch preparation<br/>git switch main · git pull --ff-only"]:::session
    S0 --> S1["1. Read the issue<br/>🧩 github-issue · assign"]:::skill
    S1 -. "no number" .-> NI0["🧩 next-issue"]:::skill
    NI0 -.-> U1{{"[You] pick an issue"}}:::user
    U1 -.-> S1
    S1 --> S2["2. Lane<br/>Bug · Feature · Test-authoring"]:::session
    subgraph STEP3["3. Understand the problem"]
        A3B["Bug: reproduce<br/>🤖 issue-verifier · Sonnet<br/>🧩 debug-issue"]:::agent
        S3F["Feature / Test-authoring<br/>🧩 github-issue<br/>acceptance list"]:::skill
        A3E["Locate the code<br/>🤖 Explore"]:::agent
        A3B --> A3E
        S3F --> A3E
    end
    S2 -- "Bug" --> A3B
    S2 -- "Feature / Test-authoring" --> S3F
    A3B -. "cannot reproduce" .-> U3{{"[You] how to proceed"}}:::user
    U3 -.-> A3B
    S3F -. "material gaps" .-> U3G{{"[You] settle the gaps"}}:::user
    U3G -.-> S3F
    A3E --> A4["4. Plan<br/>🤖 issue-planner · Opus<br/>plan + complexity S/M/L"]:::agent
    A4 --> S5["5–6. Save the plan<br/>docs/tasks/issue-N-slug.md"]:::session
    S5 --> U5{{"[You] review the plan"}}:::user
    U5 -- "comments" --> S5
    U5 -- "approved" --> A7["7. Implement<br/>🤖 issue-developer · Sonnet, Opus for L<br/>🤖 playwright-tester · Sonnet, tests-only<br/>🧩 write-tests"]:::agent
    subgraph STEP8["8. Build, tests and review"]
        A8B["Build and test suites<br/>🤖 build-runner · Haiku<br/>build · bUnit · API E2E · UI E2E"]:::agent
        S8["Review of added comments"]:::session
        A8S["Security review<br/>🤖 security-reviewer · Opus"]:::agent
        A8B -- "green" --> S8
        S8 -. "API · config · packages" .-> A8S
    end
    A7 --> A8B
    subgraph STEP9["9. Verify"]
        A9["Browser walk (Bug / Feature)<br/>🤖 issue-verifier · Sonnet<br/>🧩 verify-feature"]:::agent
    end
    S8 --> A9
    A9 --> U10{{"10. [You] result accepted?"}}:::user
    A8B -- "red" --> FIX
    A8S -. "findings" .-> FIX
    A9 -- "failed item" --> FIX
    U10 -- "no" --> FIX
    FIX(["↩ fixes: back to step 7, or 4 if the approach changes"]):::fix
    FIX --> A7
    subgraph STEP11["11. Result comment"]
        U11C{{"[You] yes, comment"}}:::user
        A11["Issue comment<br/>🤖 skill-runner · Haiku<br/>🧩 github-issue"]:::agent
        U11T{{"[You] yes, tick the boxes"}}:::user
        S11T["Acceptance boxes<br/>Set-AcceptanceChecks.ps1<br/>- [ ] → - [x]"]:::session
        U11C --> A11 --> U11T --> S11T
    end
    U10 -- "yes" --> U11C
    subgraph STEP12["12. Ship"]
        U12{{"[You] yes, commit"}}:::user
        A12["Commit<br/>🤖 skill-runner · Haiku<br/>🧩 git-commit<br/>branch · commit · check"]:::agent
        U12P{{"[You] yes, push"}}:::user
        S12P["git push"]:::session
        U12R{{"[You] yes, open the PR"}}:::user
        A12R["Pull request<br/>🤖 skill-runner · Haiku<br/>🧩 open-pr"]:::agent
        U12 --> A12 --> U12P --> S12P --> U12R --> A12R
    end
    S11T --> U12
    A12R --> NI13["13. What next<br/>🧩 next-issue -AssumeClosed N"]:::skill
    NI13 --> END(["merge the PR → new session → /implement-issue"])

    classDef session fill:#f3f4f6,stroke:#6b7280,color:#111827
    classDef agent fill:#dbeafe,stroke:#2563eb,color:#1e3a8a
    classDef skill fill:#dcfce7,stroke:#16a34a,color:#14532d
    classDef user fill:#fef3c7,stroke:#d97706,color:#78350f
    classDef fix fill:#fee2e2,stroke:#dc2626,color:#7f1d1d
    style STEP3 fill:#f8fafc,stroke:#64748b,stroke-dasharray:4 3
    style STEP8 fill:#f8fafc,stroke:#64748b,stroke-dasharray:4 3
    style STEP9 fill:#f8fafc,stroke:#64748b,stroke-dasharray:4 3
    style STEP11 fill:#f8fafc,stroke:#64748b,stroke-dasharray:4 3
    style STEP12 fill:#f8fafc,stroke:#64748b,stroke-dasharray:4 3
```

The process waits for the user:

- on a pick when no issue number was given, a blocked or closed issue, a lane conflict, an irreproducible bug, or a material gap in the requirement (steps 0–3);
- on the plan review (steps 5–6);
- on the result confirmation (step 10);
- before each outward action: the issue comment, the acceptance boxes, the commit, the push and the pull request (steps 11–12) — each needs its own "yes";
- on the three ready-made `/compact` commands (after steps 6, 9 and 10), which may be skipped while the conversation is short.

`/implement-issues` runs this same cycle for several issues on one branch; it is described in [Batches](#batches-implement-issues-n-n-) and has no diagram of its own.

Context economy is built in: three `/compact` milestones with ready focus texts, a runaway guard, one issue per session, narrow reads, small tool output, and noisy work delegated to agents.

## Batches: `/implement-issues <n> <n> …`

For small issues the per-issue review stops cost more than the work. `/implement-issues 191 192 193` runs the `implement-issue` workflow for each issue in the given order on **one branch** (`<first>-<last>-<slug>`, created at the first commit, not earlier), one commit per issue (`#<n> <title>`), then verifies the branch once and ships **one pull request**. The batch body does not copy the workflow: it refers to `implement-issue.md` and lists only the differences, so a change to the workflow reaches the batch too.

| Aspect | Behaviour |
|---|---|
| Stops | None by default. The batch halts on an unsettled question, an open blocker that is not earlier in the list, a closed issue, a plan of complexity `L`, a failed reproduction, or a failure two fixes do not resolve. `--review-plans` restores the plan-review stop |
| Debatable decisions | Made, recorded in each plan's *Decisions* and reported together at the end |
| Per issue | Plan, implementation, `build-runner` (the build and the affected suites without UI E2E), commit through `skill-runner` (starting the batch authorises the commits) |
| Once at the end | `build-runner` with every suite including UI E2E, browser walk of every acceptance item, `security-reviewer` on the branch diff when the batch touches API, configuration, packages, the Web error pipeline or server-provided text; fixes go in further commits under their issue |
| Ship | One confirmation of the result; then comments, push and PR, each after the user's go-ahead, or without further prompts with `--ship`. The PR has one `Closes #<n>` line per issue |
| Limits | At most 5 issues of complexity S or M; never amend or rewrite a commit of the batch |

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

The main session keeps every gate: plan review, both confirmations, the user's go-ahead before every outward action, the push, the acceptance ticks and the CI check. The implementer's "passed" is input, not proof: `build-runner` builds and tests again, independently. The scratch directories and files the main session hands to `build-runner` and `skill-runner` lie outside the repository, and both agents run one plain command per call, so that nothing stray reaches `git status` and every command matches the permission rules. The `git-commit`, `github-issue` and `open-pr` skills delete their text file once the action succeeds, whether the main session or `skill-runner` runs them; `build-runner` deletes its output files itself once everything is green and keeps them on a failure. These `rm` calls are not on the allow list: a path pattern broad enough to cover every user's temp folder would also match a second, repository path in the same command, so outside auto mode each deletion asks once. Copilot cannot override a subagent's model per call, so there an `L` plan is implemented in the main session. Agent parity between `.claude/agents` and `.github/agents` is manual.

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

Generic skills (`aspnet-core`, `ef-core`, `security-owasp`, `update-docs`, `code-review-checklist`, `dotnet-run-tests`, `test-anti-patterns`, `coverage-analysis`, `directory-build-organization`, …) are loaded on demand instead of sitting in every context. Rarely needed ones — `coverage-analysis`, `directory-build-organization`, `test-anti-patterns`, `create-specification`, `dotnet-timezone`, `harness-quality-check` — set `disable-model-invocation: true`: their descriptions stay out of the start context, and they run only when invoked as `/<name>`. `dotnet-run-tests` is the upstream `run-tests` skill, renamed because `_local.run-tests` owns that name.

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
