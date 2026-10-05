---
paths:
  - ".github/workflows/**"
  - ".github/actions/**"
---

<!-- Condensed from github/awesome-copilot github-actions-ci-cd-best-practices (MIT) via the GitHubBackup harness, adapted to this repository. -->

# GitHub Actions workflows

## Workflows of this repository

All run on `ubuntu-latest`; `docs/specs/Architecture.md` describes CI and deployment.

- **`build.yml`** — locked-mode restore and Release build of the solution on every push.
- **`api-tests.yml`** — the Playwright API suite against the API with a SQL Server service container; on push and `workflow_dispatch`.
- **`ui-tests.yml`** — the Playwright UI suite against the API and the Web app with a SQL Server service container; on push and `workflow_dispatch`.
- **`web-tests.yml`** — the bUnit suite `src/AddressBook.Web.Tests` (.NET only, no SQL Server) with TRX and Cobertura coverage artifacts; on push and `workflow_dispatch`.
- **`security.yml`** — vulnerability scan of the NuGet and npm dependencies; on push and pull request to `main`, and weekly.
- The SQL Server password comes from the repository secret `MSSQL_SA_PASSWORD`.

## Rules for a workflow you add or change

- **Pin actions** you add or touch to a full commit SHA with the version in a trailing comment (`uses: actions/checkout@<sha> # v5`); first-party `actions/*` included. The existing tag references are migrated in their own change, not as a side effect.
- **Least privilege:** set `permissions:` at the workflow level to `contents: read` and widen per job only where needed.
- **Secrets** only through `secrets.*`, passed as environment variables to the step that needs them; never echoed, never in `run:` command text, never available to `pull_request` runs from forks.
- **Untrusted input** (`github.event.pull_request.title`, branch names, issue bodies) is never interpolated with `${{ }}` directly into a `run:` script; pass it through `env:` and quote it.
- **.NET setup:** `actions/setup-dotnet` with `global-json-file: global.json` when `global.json` pins an SDK; cache NuGet with the `packages.lock.json` files as the key (the repository uses lock files). **Node setup:** `actions/setup-node` with npm caching keyed on the suite's `package-lock.json`; `npm ci`, not `npm install`.
- **Build once, test with `--no-build`;** run the tests with the same commands developers use (`dotnet test --project …`, `npx playwright test`), so CI and local results agree. Upload the Playwright report and test results as artifacts.
- **Concurrency:** `concurrency: group: ${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true` for workflows triggered by pushes and pull requests.
- **Timeouts:** every job has `timeout-minutes`.
- Keep workflows small and readable; extract repeated steps into a composite action under `.github/actions/` only when two workflows share them.
