# Plan: Issue #226 — Sync the specs with the README and the current CI, drop the Azure deployment

> **Issue:** [#226](https://github.com/askrinnik/AddressBook/issues/226) — Sync the specs with the README and the current CI, drop the Azure deployment
> **Lane:** Feature (documentation only) · **Complexity:** S

## Requirement

The specifications describe a minimal README, the removed `playwright.yml` workflow and an Azure deployment (App Service, Static Web Apps, Azure SQL, production URLs). The project is no longer deployed to Azure, and the README was rewritten in #225. The specs must state what is true now.

## Acceptance checklist

- [x] `Architecture.md` project structure describes `README.md` as the project overview
- [x] `Architecture.md` no longer shows `playwright.yml`; its CI picture matches the workflows in `.github/workflows/`
- [x] `Architecture.md`, `AddressBook.Web.md` and `AddressBook.Vue.md` no longer describe an Azure deployment or production URLs as current
- [x] Mermaid diagrams in the changed files still render on GitHub
- [x] Every relative link in the changed files resolves

## Affected files

- `docs/specs/Architecture.md` — executive summary, architecture overview diagram, project structure (`LICENSE`, `README.md`), Web deep-dive, `docs/Old` table, request flow diagram, the deployment section (now *Runtime and CI Architecture* with the six workflows), confidence table
- `docs/specs/AddressBook.Web.md` — deployment target, API connection, the Azure deployment subsection, section 10
- `docs/specs/AddressBook.Vue.md` — the deployment row of the Blazor comparison table
- `docs/specs/AddressBook.Api.md` — the `Database:Server` example

## Approach

Remove every statement that presents Azure hosting as current. Describe files that remain in the code (`staticwebapp.config.json`) as they are, without a hosting claim. Replace the deployment diagram with a diagram of the current CI workflows and the SQL Server service container.

## Tests

None: documentation only.

## Verification

- `grep -i azure docs/specs` returns only the historical PR row (#42) in the AI-tooling table.
- A link checker over the changed files reports no broken relative link or anchor.
- After the push, the changed Mermaid diagrams are opened on GitHub.

## Out of scope

- Removing Azure leftovers from code and tooling: publish profiles, `staticwebapp.config.json`, the `AllowedOrigins` comment in `appsettings.json`, the `test:remote` scripts and the remote mode of the `run-tests` skill.
- Other stale statements in `Architecture.md` unrelated to deployment, README or CI.

## Decisions

- The historical PR table keeps the row of PR #42 ("Fix Azure SWA 404"): it records what that PR did, not a current deployment.
- The `docs/Old` table is removed: the folder no longer exists.
- `AddressBook.Api.md` is changed too (an Azure SQL host as the `Database:Server` example), although the issue names three files; it is the same kind of stale statement.
