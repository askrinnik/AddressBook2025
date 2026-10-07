# Issue #163 — Blazor Tests B19: bunit-conventions instruction + doc updates

- Issue: [#163](https://github.com/askrinnik/AddressBook2025/issues/163)
- Lane: Feature (docs and configuration only, no production or test code)
- Complexity: M

## Requirement

The bUnit suite (`src/AddressBook.Web.Tests`) gets one authoritative conventions file, `.github/instructions/bunit-conventions.instructions.md`, with `applyTo: "src/AddressBook.Web.Tests/**"`. Copilot applies it through `applyTo`; Claude Code loads it through a thin path-scoped rule. The hub, the architecture spec, `.vscode/tasks.json` and the Web spec versions are updated to match the repository as it is now.

"Mirror into `.claude`" in the issue: `.ai/customizations.policy.json` and `check.ps1` mirror only skills byte for byte and check prompt wrappers. Instruction files are never copied. The Claude-side counterpart is a thin pointer rule in `.claude/rules/`, like `playwright.md` and `blazor.md`, so "mirror" means creating `.claude/rules/bunit.md`.

## Acceptance

- [x] `.github/instructions/bunit-conventions.instructions.md` exists with `description` and `applyTo: "src/AddressBook.Web.Tests/**"`.
- [x] `.claude/rules/bunit.md` exists; its `paths:` mirror `applyTo` and it says to read the instruction before editing.
- [x] Hub `CLAUDE.md` is updated (file-type table row, note, "Where things live" entry).
- [x] `docs/specs/Architecture.md` is updated (tree, tables, diagram).
- [x] `.vscode/tasks.json` has a `dotnet test` task for the bUnit suite.
- [x] `docs/specs/AddressBook.Web.md` versions are refreshed: MudBlazor 9.8.0, WebAssembly 10.0.11.
- [x] `docs/ai-harness.md` lists the new pointer rule.
- [x] The test-suite row of `.claude/rules/update-docs-on-code-change.md` names the bUnit instruction.
- [x] `src/AddressBook.Web.Tests/CLAUDE.md` points to the instruction as the authoritative source (shape of `src/UiTests/CLAUDE.md`), keeps a short non-negotiables list, and the README conventions list becomes a link.
- [x] The `write-tests` skill (both copies, byte-identical) and the instruction lists of the `issue-developer` and `issue-planner` agents (`.claude` and `.github`) name the new file.
- [x] Other stale facts in `Architecture.md` are fixed: MudBlazor 9.3.0 to 9.8.0, the tree gains `.claude/rules/`, `src/AddressBook.Web.Tests/` and `global.json`, and the "Russian-language comments are allowed" statement becomes the English-only rule.
- [x] `pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1` reports 0 errors and 0 warnings.
- [x] B19 is ticked in `docs/tasks/blazor-component-tests-framework-plan.md`.

## Affected files

New:

- `.github/instructions/bunit-conventions.instructions.md`
- `.claude/rules/bunit.md`

Changed:

- `CLAUDE.md`
- `src/AddressBook.Web.Tests/CLAUDE.md`, `src/AddressBook.Web.Tests/README.md` (conventions list becomes a link)
- `docs/specs/Architecture.md`, `docs/specs/AddressBook.Web.md`
- `.vscode/tasks.json`
- `docs/ai-harness.md`
- `.claude/rules/update-docs-on-code-change.md`
- `.github/skills/_local.write-tests/SKILL.md` and `.claude/skills/_local.write-tests/SKILL.md`
- `.claude/agents/issue-developer.md`, `.github/agents/issue-developer.agent.md`, `.claude/agents/issue-planner.md`, `.github/agents/issue-planner.agent.md`
- `docs/tasks/blazor-component-tests-framework-plan.md`

## Approach

1. **Instruction**, in the shape of `playwright-conventions.instructions.md`, with content taken from the real code:
   - Scope: component and page logic in memory; API contracts go to `src/ApiTests`, browser flows to `src/UiTests`; link the `write-tests` skill.
   - Context: derive from `MudTestContext`; `RenderProviders()` before dialogs, `MudSelect`, `MudDatePicker`; navigation through `CurrentPath`; no per-test service or JS setup.
   - Layout and naming: `Tests/<Area>/<Subject>Tests.cs`; `Action_Condition_Outcome`; one behaviour per test; `[Theory]` over copies.
   - Data: `ContactBuilder.New.*`, `ContactBuilder.Existing.*`, `List(n)`; new boundary variants go into the builder.
   - Mocks: `ApiServiceMock` extensions first; `FakeHttpMessageHandler` for `AddressBookApiService` tests, never live HTTP.
   - Harnesses: four harnesses; missing interactions are added to a harness, not selectors to a test.
   - Locators: role or `aria-label`, then `TestIds`, then CSS; no new `data-testid` in the Web project.
   - Assertions: bUnit and xUnit `Assert` only. Async: `WaitForState` / `WaitForAssertion`, never `Task.Delay`.
   - Running: `dotnet test --project src/AddressBook.Web.Tests` (native MTP mode through `global.json`; the bare positional path is rejected on SDK 10). Comments: English.
2. **Pointer rule** `.claude/rules/bunit.md`, in the style of `playwright.md`.
3. **`src/AddressBook.Web.Tests/CLAUDE.md`**: pointer paragraph plus a short non-negotiables list.
4. **Hub, harness doc, update-docs rule, skill (edit the `.github` copy, copy byte for byte to `.claude`), four agent files** (parity is manual).
5. **Specs**: versions from `src/Directory.Packages.props` (WebAssembly, DevServer, Extensions.Http 10.0.11; MudBlazor 9.8.0). `Architecture.md`: summary, diagram node, tree, test-suite section or table, MudBlazor, comment-language fact.
6. **`.vscode/tasks.json`**: task "Run Web component tests (bUnit)" running `dotnet test --project src/AddressBook.Web.Tests`, group `test`.
7. Tick B19.

Regression risk: none at runtime. The risks are skill-mirror drift (caught by `check.ps1`) and a rule whose `paths:` differ from `applyTo`.

## Tests

No new tests; documentation and configuration. The existing bUnit suite stays green and the new task command runs as written.

## Verification

- Front matters: `applyTo` equals the rule's `paths:`.
- `check.ps1` reports "Errors: 0 Warnings: 0".
- Grep `bunit-conventions` finds it in `CLAUDE.md`, the rule, `ai-harness.md`, the update-docs rule, both `write-tests` copies, the four agent files and `src/AddressBook.Web.Tests/CLAUDE.md`.
- `.vscode/tasks.json` parses as JSON; the task command is green.
- Grep `9\.3\.0|10\.0\.5` in the two specs finds no stale versions (except as decided for the EF Core line).
- `Architecture.md` shows the new tree entries, the bUnit suite in the diagram and tables, and no "Russian comments allowed" text.
- Relative links resolve; `dotnet build src/AddressBook.slnx` still succeeds.

## Out of scope

- CI workflow: #164. Final verification: #165.
- Other `.github/agents` (for example `playwright-tester`).
- The stale `dotnet test src/AddressBook.Web.Tests` line of the README is #162's work and is fixed there.

## Decisions

Pending confirmation:

1. Add the instruction reference to the four agent files and the `write-tests` skill (recommended: yes).
2. Fix the stale EF Core 10.0.5 versions in `docs/specs/AddressBook.Api.md` (lines 89-91; Directory.Packages.props has 10.0.11) as a one-line consistency fix here (recommended: yes).
3. Keep a short non-negotiables list in `src/AddressBook.Web.Tests/CLAUDE.md` rather than a bare pointer (recommended: keep).

## Tasks

- [x] Create the instruction and the `.claude/rules/bunit.md` pointer.
- [x] Update `src/AddressBook.Web.Tests/CLAUDE.md` and the README conventions link.
- [x] Update the hub `CLAUDE.md`, `docs/ai-harness.md` and the update-docs rule.
- [x] Update the `write-tests` skill (both copies) and the four agent files.
- [x] Update `Architecture.md` and `AddressBook.Web.md`.
- [x] Add the `.vscode/tasks.json` task.
- [x] Run `check.ps1`, the bUnit suite and the grep checks.
- [x] Tick B19 in the framework plan and this checklist.
