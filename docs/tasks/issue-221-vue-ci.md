# Issue #221 — Vue V9: CI for the Vue frontend

> **Issue:** [#221](https://github.com/askrinnik/AddressBook2025/issues/221)
> **Lane:** Feature (CI)
> **Complexity:** S
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V9

## Requirement

The Vue frontend's checks run in GitHub Actions: a path-filtered workflow for `src/AddressBook.Vue`, both Playwright projects in `ui-tests.yml`, and the npm scan of the new project in `security.yml`.

## Acceptance

- [x] A new workflow `vue-tests.yml` runs lint, format check, build (with the `vue-tsc` type check) and the Vitest tests with coverage for `src/AddressBook.Vue`, only when that project or the workflow changes
- [x] The workflow writes a coverage table to the job summary, publishes the JUnit results as a check run, uploads the coverage report and the test results, and fails below the coverage thresholds (they live in `vitest.config.ts`)
- [x] `ui-tests.yml` runs both Playwright projects, `blazor` and `vue` (`npm test` runs every project; the Vue app dependencies are installed)
- [x] `security.yml` scans the npm packages of `src/AddressBook.Vue`
- [x] The new workflow pins its actions to commit SHAs and uses a read-only token except `checks: write` for the report; `ui-tests.yml` gets a workflow-level read-only token
- [x] `docs/specs/Architecture.md` and `.claude/rules/github-actions.md` describe the new workflow and the changes
- [x] The pull request's CI run is green for `Vue Frontend`, `UI E2E Tests` and `Security Vulnerability Scan`

## Affected files

- `.github/workflows/vue-tests.yml` (new)
- `.github/workflows/ui-tests.yml` — `permissions: contents: read`
- `.github/workflows/security.yml` — `AddressBook.Vue` in the npm matrix
- `src/AddressBook.Vue/.gitignore` — `test-results/`
- `docs/specs/Architecture.md`, `.claude/rules/github-actions.md`

## Approach

- The new workflow mirrors `web-tests.yml`: the same triggers shape, concurrency, timeout, `dorny/test-reporter` check run and artifacts; Node LTS with the npm cache keyed on the project's `package-lock.json`.
- The test step runs the developers' command `npm run test:coverage` and adds the JUnit and `json-summary` reporters on the command line.
- The existing tag references in `ui-tests.yml` and `security.yml` stay as they are; pinning them is a separate change.

## Verification

- The workflows parse as YAML; the test step's exact command runs locally (218 tests, `junit.xml` and `coverage-summary.json` written).
- The pull request's CI run confirms the rest.

## Out of scope

- Pinning the existing actions of `ui-tests.yml` and `security.yml`.

## Decisions

- The Vue workflow is separate from `web-tests.yml` because it needs Node only.
