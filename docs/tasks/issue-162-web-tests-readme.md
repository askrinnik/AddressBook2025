# Issue #162 — Blazor Tests B18: README + CLAUDE.md for src/AddressBook.Web.Tests

- Issue: [#162](https://github.com/askrinnik/AddressBook2025/issues/162)
- Lane: Feature (docs only, no production code)
- Complexity: S

## Requirement

`src/AddressBook.Web.Tests/README.md` explains how to run, filter and debug the bUnit suite and describes its architecture and conventions. `src/AddressBook.Web.Tests/CLAUDE.md` points to the instructions that exist today, the README and the multi-issue plan, and keeps the non-negotiables. Every statement matches the code as it is now.

Problems in the current files:

- The README uses `dotnet test src/AddressBook.Web.Tests`. `global.json` selects Microsoft.Testing.Platform, so on SDK 10 the project goes through `--project`: `dotnet test --project src/AddressBook.Web.Tests`.
- The README says the MTP coverage extensions "will be added by task B20" and its structure heading says "as implemented". No coverage package exists.
- The README does not mention MudBlazor 9.8.0 (transitive through the `AddressBook.Web` reference) or CI. Today `build.yml` only builds the solution; no workflow runs these tests.
- A comment in `AddressBook.Web.Tests.csproj` (lines 21-27) has the same future-tense task reference, which breaks the comment rules in `CLAUDE.md`.

## Acceptance

- [x] README covers running `dotnet test`, architecture, conventions and debugging.
- [x] CLAUDE.md for `src/AddressBook.Web.Tests` points to the instructions and the plan.
- [x] Every command in the README runs as written, using `--project` and the xUnit v3 MTP filters (`--filter-class`, `--filter-method`, `--filter-trait`), never VSTest `--filter`.
- [x] Stack and versions match `src/Directory.Packages.props`: bunit 2.9.0, xunit.v3 4.0.0, NSubstitute 6.2.0, Bogus 35.6.5, MudBlazor 9.8.0 (transitive); versions are pinned centrally and `packages.lock.json` is committed.
- [x] The structure section lists the real folders and files (`Infrastructure/`, `Data/`, `Harnesses/`, `Tests/` subfolders); the infrastructure self-tests are named as such.
- [x] No "B20" or "will be added" text; coverage and a CI test run are not described as existing.
- [x] CLAUDE.md links only to files that exist now (no link to `bunit-conventions.instructions.md`; see ordering).
- [x] The csproj comment is restated in the present tense without the task reference.
- [x] `dotnet test --project src/AddressBook.Web.Tests` stays green.

## Affected files

- `src/AddressBook.Web.Tests/README.md` — rewrite
- `src/AddressBook.Web.Tests/CLAUDE.md` — edit
- `src/AddressBook.Web.Tests/AddressBook.Web.Tests.csproj` — comment only
- `docs/tasks/blazor-component-tests-framework-plan.md` — tick B18

## Approach

README, in the section order of `src/ApiTests/README.md` and `src/UiTests/README.md`:

- Intro: in-memory bUnit, no browser, API, DB or network; the layer in contrast with ApiTests and UiTests.
- Stack: versions from `Directory.Packages.props`; why MTP and no VSTest packages; assertions are bUnit and xUnit `Assert` only.
- Requirements: .NET 10 SDK only.
- Quick start and a commands table: run all, `--filter-class "*ContactsListTests"`, `--filter-method`, `--list-tests` (confirm against `--help`), `dotnet build src/AddressBook.slnx`.
- Architecture: `MudTestContext`, `MudBlazorJsInterop`, `ApiServiceMock`, `FakeHttpMessageHandler`, `TestIds` (synced with `src/UiTests/src/utils/testids.ts`, guarded by `TestIdsTests`), `RenderedComponentExtensions`, `ContactBuilder`, the four harnesses.
- Structure: a tree of the folders as they exist.
- Conventions: a short list (locator priority, `WaitForState`/`WaitForAssertion`, data through `ContactBuilder`, `TestContext.Current.CancellationToken`, English comments), then a link to `csharp.instructions.md` and CLAUDE.md.
- Debugging: IDE Test Explorer, single-test filter, `cut.Markup` and the `MarkupMatches` diff, temporary `JSInterop.Mode = Strict`, runner diagnostics.
- CI: one true sentence — `build.yml` builds the project; no workflow runs the tests.
- Plan: link to the framework plan.

CLAUDE.md, in the shape of `src/UiTests/CLAUDE.md`: keep the non-negotiables, add `MudTestContext.RenderProviders()` before overlay widgets and the `--project` run command, and point to `.github/instructions/csharp.instructions.md`, the README and the plan.

Ordering with #163: #162 lands first, so CLAUDE.md does not link to `bunit-conventions.instructions.md`. Issue #163 repoints this CLAUDE.md at the new instruction, trims duplicated rules and turns the README conventions list into a link.

## Tests

No new tests; documentation and a comment only.

## Verification

- Run each README command as written: the full run (record the count), the `--filter-class` and `--filter-method` examples, and `dotnet build src/AddressBook.slnx`.
- Every relative link in both files resolves.
- Grep both files and the csproj for `B20`, `будет`, `will be`, `по мере`, `bunit-conventions`: no matches.
- Versions match `Directory.Packages.props`; the tree matches the files on disk.
- No browser walk.

## Out of scope

- `bunit-conventions.instructions.md`, its `.claude/rules` rule, the hub row, Architecture.md, `.vscode/tasks.json`, version refresh in `AddressBook.Web.md`: #163.
- CI workflow and coverage: #164.
- Stale commands in older closed plans.
- The `GlobalUsings.cs` comment.
- `docs/ai-harness.md` (it does not list per-directory CLAUDE.md files).

## Decisions

Pending confirmation:

1. **README language.** The README and the sibling suite READMEs are Russian; `.claude/rules/docs.md` says to keep the document's language. Recommendation: keep Russian. Alternative: English, with a follow-up to translate the other two.
2. **csproj comment.** Restate it in this issue (recommended; comment-only).
3. **#163 follow-up.** Add the re-pointing items to #163 as a comment on the issue (the work is done in the next commit of this branch anyway).

## Tasks

- [x] Rewrite `README.md` in the decided language.
- [x] Update `CLAUDE.md`.
- [x] Restate the csproj comment.
- [x] Run every README command; check links, versions and tree.
- [x] Tick B18 in the framework plan and this checklist.
