# Plan: Issue #225 — Write a comprehensive README

> **Issue:** [#225](https://github.com/askrinnik/AddressBook2025/issues/225) — Write a comprehensive README
> **Lane:** Feature (documentation only) · **Complexity:** M

## Requirement

`README.md` is a single line. It becomes the entry point of the repository: what the project is, which technologies each project uses, what the tests cover, and how to build, run and test everything. It summarises and links to the authoritative documents (`docs/specs/`, the test suite READMEs, `docs/ai/`) instead of copying them.

Owner decisions: English; CI status, technology and metadata badges only (passed-test counts and coverage badges are #227); no screenshots, no live demo, no mention of a cloud (Azure) deployment; no separate `CONTRIBUTING.md` / `SECURITY.md`.

## Acceptance checklist

- [x] Title, one-line description and badge rows (CI status, technologies, license/metadata); every badge renders on GitHub and links to its target
- [x] Table of contents whose links resolve to the README's headings
- [x] Features section describes what the application does (contacts, phones, search, validation, RFC 7807 errors, two frontends on one API)
- [x] Architecture section with a Mermaid diagram (Blazor / Vue → API → SQL Server) that renders on GitHub, linking to `docs/specs/Architecture.md`
- [x] Tech stack table per project with the key technologies and their versions as in the code
- [x] Repository structure overview
- [x] Getting started: prerequisites, database setup, running the API, the Blazor app and the Vue app with their ports
- [x] Build section with the commands CI uses
- [x] Testing section: a table of all four suites (layer, framework, what it covers, what it needs, how to run, CI workflow), coverage thresholds, and what is not covered by tests
- [x] CI/CD section: every workflow with its trigger and purpose, and the required repository secret
- [x] Documentation index, AI-assisted development, Contributing, Security and License sections
- [x] No Azure / cloud deployment mention, no screenshots
- [x] Every relative link in the README resolves to an existing file

## Affected files

- `README.md` (rewritten)

## Approach

Sources of truth for each section:

| Section | Source |
|---|---|
| Features | `docs/specs/AddressBook.Api.md` (endpoints, validation), `AddressBook.Web.md`, `AddressBook.Vue.md` |
| Tech stack | `src/Directory.Packages.props`, `src/AddressBook.Vue/package.json`, `src/*Tests/package.json`, `global.json` |
| Getting started | `appsettings*.json`, `launchSettings.json`, `src/AddressBook.Vue/README.md`, `docs/specs/AddressBook.Api.md` |
| Build / CI | `.github/workflows/*.yml` |
| Testing | the four suites' READMEs, `vitest.config.ts`, `web-tests.yml` thresholds |

Badges: GitHub's own workflow badges (`actions/workflows/<file>/badge.svg?branch=main`), static shields.io badges for the stack, shields.io GitHub badges for license and activity.

## Tests

None: documentation only, no code or API behaviour changes.

## Verification

- Every relative link and heading anchor checked with a script against the working tree.
- After the push: the README is opened on GitHub in a browser; badges, the Mermaid diagram, tables and the table of contents are checked visually.

## Out of scope

- Passed-test-count and coverage badges (#227).
- Spec updates (#226).
- Repository description and topics on GitHub (settings, not files).

## Decisions

- Features describe first name, last name and birthday only: phones exist in the domain model but are not exposed by the API or the UI, so the README does not list them (the issue text names phones).
- Local database setup is shown with a SQL Server container and the `Database:*` overrides, because the committed defaults target a developer's SQL Express instance.
- Security section points to a private contact path rather than public issues, because GitHub private vulnerability reporting is disabled for the repository.
