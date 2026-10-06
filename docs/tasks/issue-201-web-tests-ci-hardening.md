# Issue 201 — CI web-tests.yml: checks: write, PR triggers and paths, concurrency, coverage threshold

- Issue: [#201](https://github.com/askrinnik/AddressBook2025/issues/201) — Blazor Tests B33: CI web-tests.yml: checks: write, триггеры PR и paths, concurrency, порог покрытия
- Lane: Test-authoring (CI configuration; no production code)
- Complexity: S

## Requirement

Harden the `web-tests.yml` workflow after review and align `build.yml` with it.

## Acceptance

- [x] A check run "Web component test results" appears on a pull request.
- [x] The workflow runs on pull requests and on `main`, and does not run for changes only under `docs/`.
- [x] A coverage drop below the threshold fails the job with a clear message.
- [x] The README of `src/AddressBook.Web.Tests` and the CI section of `docs/specs/Architecture.md` are updated.

## Affected files

| File | Change |
|---|---|
| `.github/workflows/web-tests.yml` | `checks: write`; triggers `pull_request`, `push` to `main`, `workflow_dispatch` with `paths`; concurrency keeps runs on `main`; threshold; tool restore |
| `.config/dotnet-tools.json` | new manifest pinning `dotnet-reportgenerator-globaltool` 5.5.11 |
| `.github/workflows/build.yml` | actions pinned to the SHAs used in `web-tests.yml`; `permissions: contents: read` |
| `src/AddressBook.Web.Tests/README.md` | CI section: triggers, check run, threshold, tool manifest |
| `docs/specs/Architecture.md` | CI section and tree comment for `web-tests.yml` and `build.yml` |
| `.claude/rules/github-actions.md` | workflow list: `web-tests.yml` triggers |

## Approach

1. `permissions`: workflow level `contents: read`; the `web-tests` job adds `checks: write` (least privilege).
2. Triggers: `pull_request` and `push: branches: [main]`, both with `paths` (`src/AddressBook.Web/**`, `src/AddressBook.Web.Tests/**`, `src/AddressBook.Contracts/**`, `src/Directory.*.props`, `global.json`, `.github/workflows/web-tests.yml`), plus `workflow_dispatch`. The tool manifest `.config/dotnet-tools.json` is added to the filter because it changes the job's inputs.
3. Concurrency: `cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`.
4. Threshold: ReportGenerator setting `minimumCoverageThresholds:lineCoverage=85` and `minimumCoverageThresholds:branchCoverage=70` (setting format `section:key=value`, verified in the ReportGenerator settings wiki and by a local run on 5.5.11). The report and summary are written before the failure is raised, so a failing run still shows them. A step prints a message naming the thresholds when ReportGenerator exits non-zero.
5. Tool pin: `.config/dotnet-tools.json` + `dotnet tool restore` in CI; the README uses the same manifest.
6. `build.yml`: same SHAs as `web-tests.yml` for `actions/checkout` and `actions/setup-dotnet`; `permissions: contents: read`.

## Tests

No test code changes. Verification: local run of the bUnit suite with coverage and of ReportGenerator through the tool manifest, once above the thresholds and once with raised thresholds to see the failure; YAML syntax check; the workflow run on the pull request.

## Out of scope

- Pinning the actions of `api-tests.yml` and `ui-tests.yml` (not named in the issue).
- Raising coverage.

## Decisions

- The pull-request check is the proof of the check run; it cannot be shown locally.
- The user pre-authorised going through the whole workflow, including the pull request, when planning raises no questions.
