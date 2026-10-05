---
name: nuget-package-update
description: 'Pin-aware NuGet dependency updates for AddressBook2025 through Central Package Management (src/Directory.Packages.props). Use when the user asks to update or bump NuGet packages, find outdated or vulnerable packages, or invokes this skill. Discovers outdated packages, classifies them against the pin contract and package families, and applies safe updates on the current branch with a build and test gate after each step. Never commits, pushes or creates a branch.'
---

# nuget-package-update

> Local skill note: Ported from the GitHubBackup repository harness; repository-specific, no canonical upstream skill in github/awesome-copilot.

## Use this skill when

- The user asks to update, bump or refresh NuGet package versions, or to check for outdated or vulnerable packages.
- A shared-framework wave (`Microsoft.AspNetCore.*`, `Microsoft.EntityFrameworkCore.*`, `Microsoft.Extensions.*` at `10.0.x`) needs its next patch.

## Do not use it when

- Adding a brand-new dependency — add a `<PackageVersion>` to `src/Directory.Packages.props` and a version-less `<PackageReference>` to the project directly.
- Updating npm packages of `src/ApiTests` or `src/UiTests` — this skill is NuGet only.
- The working tree is dirty — the preflight refuses; ask the user to commit or stash first.

## Scope

NuGet only, apply-only, current branch only: no branch is created, nothing is committed or pushed, no CI run is triggered. The working tree is left with the applied edits for the user (or `/implement-issue`) to review and commit.

## Preflight

From the repository root:

```
pwsh -NoProfile -File .github/skills/_local.nuget-package-update/scripts/Prepare-PackageUpdate.ps1
```

It refuses to run on a dirty tree, then removes the `bin`/`obj` folders of the .NET projects under `src` only — it never touches `node_modules`, local `appsettings.*.local.json` files or test results.

## Discovery

- `dotnet list src/AddressBook.slnx package --outdated --format json` — capture to a file and read the summary, not the whole output. Add `--include-prerelease` only for a package already on a prerelease.
- `dotnet list src/AddressBook.slnx package --vulnerable --include-transitive` — a vulnerable package is an update candidate regardless of family timing.
- The `nuget` MCP server (`NuGet.Mcp.Server`, see `.mcp.json`) answers version, vulnerability and release questions about a single package; use it instead of browsing nuget.org.

## Pin contract

Source of truth: `src/Directory.Packages.props`. A `<PackageVersion>` that must not move on a routine update — license change, compatibility constraint, a version CI depends on — carries `Pinned="true"` plus an XML comment with the reason. Do not bump a pinned package, not even a patch, unless the user names it. Do not add a pin without a real constraint.

Current pins: `MediatR` 12.x and `MediatR.Contracts` 2.0.x — MediatR 13+ moved to a commercial license.

## Package families

Move each family together in one step; never split it across runs. Families are defined by what `src/Directory.Packages.props` actually contains — when it gains a package that belongs to a family below, it joins that family; keep this list in step with the file.

- **Shared framework `10.0.x`:** `Microsoft.AspNetCore.Components.WebAssembly*`, `Microsoft.EntityFrameworkCore.*`, `Microsoft.Extensions.*` that version with the runtime (`Microsoft.Extensions.Http`). Same latest patch for all.
- **Validation:** `FluentValidation*`.
- **API documentation:** `Swashbuckle.AspNetCore*`, `Scalar.AspNetCore`.
- **UI:** `MudBlazor` — a minor or major can change component markup; the bUnit and UI E2E suites are the gate.
- **Test infrastructure:** `xunit.v3*`, `Microsoft.Testing.*`, `bunit`, `NSubstitute*`, `Bogus`.
- **Analyzers, last:** analyzer-only packages (`*.Analyzers`) if present.
- **Individually:** everything else.

## Major versions

A major version is not by itself a reason to skip:

1. Read the target version's license and skim its release notes for breaking changes; record both in the report.
2. Commercial or paid license on the target version → do not bump; add `Pinned="true"` with the license URL in the comment, continue with the rest.
3. Otherwise apply it in its step; the build and test gate catches breakage.

## Steps — fail fast, no rollback, no commit

Report every package first as `skipped-pinned`, `update-candidate` (with its step) or `pin-candidate`. Then apply in this order:

1. Verify the pin contract (every `Pinned="true"` has a reason).
2. Individual packages.
3. Validation and API-documentation families.
4. UI (`MudBlazor`).
5. Test infrastructure family.
6. Shared-framework `10.0.x` wave.
7. SDK band — only if a framework wave requires a newer SDK or TFM: update `global.json` (add an `sdk` section if needed) and the TFMs, at most one stable band, no preview unless already on preview.
8. Analyzers.

Edit the `Version` attribute of the `<PackageVersion>` element directly; `dotnet package update` does not reliably edit the central file. The repository uses lock files (`RestorePackagesWithLockFile` in `src/Directory.Build.props`): run `dotnet restore src/AddressBook.slnx` and include the regenerated `packages.lock.json` files; never hand-edit them.

After **each** step, as separate commands:

- `dotnet build src/AddressBook.slnx -clp:ErrorsOnly` — must be clean;
- `dotnet test --project src/AddressBook.Web.Tests` — every bUnit test passes.

After the last step, and after any step that touched `MudBlazor`, ASP.NET Core or EF Core, also run the Playwright suites (`run-tests` skill for `src/ApiTests`; `npx playwright test --reporter=line` in `src/UiTests`) — they start the API and the Web app themselves.

A red step stops the run; earlier green steps stay in the working tree. Report what was applied, what failed and why, and what was skipped.
