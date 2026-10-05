# Issue #165 — Blazor Tests B21: Verification: dotnet build + dotnet test

- Issue: [#165](https://github.com/askrinnik/AddressBook2025/issues/165)
- Lane: Test-authoring (verification only; no production or test code changes expected)
- Complexity: S
- Status: plan approved; verification complete.

## Requirement

Phase 3 of the Blazor component-test plan ends with a verification gate: the whole solution builds and the bUnit suite `src/AddressBook.Web.Tests` passes. The issue body names `src/AddressBook.sln`; the solution file is `src/AddressBook.slnx`.

## Acceptance

- [x] `dotnet build src/AddressBook.slnx` succeeds with no errors and no new warnings.
- [x] `dotnet test --project src/AddressBook.Web.Tests` passes; the run is offline (no API, no browser).
- [x] The exact command sequence of `.github/workflows/web-tests.yml` passes locally (locked-mode restore, Release build, test with `--no-build`, TRX and coverage output).
- [x] The README quick start of `src/AddressBook.Web.Tests` matches the commands that were run.
- [x] `docs/tasks/blazor-component-tests-framework-plan.md` marks B21 done.

## Affected files

- `docs/tasks/blazor-component-tests-framework-plan.md` — tick B21 (and B18–B20, see decisions).
- Any file where the run exposes a failure or a stale statement; that is reported before it is fixed.

## Approach

1. Run `dotnet build src/AddressBook.slnx -clp:ErrorsOnly` and a full build to count warnings.
2. Run `dotnet test --project src/AddressBook.Web.Tests` and read the summary.
3. Run the CI sequence from `web-tests.yml` and check that `TestResults/` holds a `.trx` and a Cobertura file.
4. Compare the README commands with what ran.
5. Tick the checklist in the multi-issue plan.

If a step fails, stop and report the cause; a broken test or a production defect becomes its own issue, not part of this one.

## Tests

No new tests. The deliverable is a green run of the existing suite.

## Verification

Build and test output summaries from steps 1–3. The browser walk does not apply.

## Out of scope

- Fixing defects the run uncovers (separate issues).
- Running the Playwright API and UI suites.
- Changes to the CI workflow.

## Decisions

1. **Stale ticks.** `blazor-component-tests-framework-plan.md` showed B18, B19 and B20 as open although their work is on `main`. Decided: tick B18–B21 in this change.
