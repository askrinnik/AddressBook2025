---
name: run-tests
description: >
  Run the AddressBook Playwright E2E API tests against either the local API
  or the remote Azure instance. Use when verifying API behaviour, after
  making backend changes, or when setting up the test environment for the
  first time.
---

# Run AddressBook E2E Tests (Playwright)

> Local skill note: This skill is intentionally repository-specific for AddressBook2025 and does not map to a canonical upstream skill in github/awesome-copilot.

## Prerequisites

| Requirement | Notes |
|---|---|
| Node.js 18+ | `node --version` must be ≥ 18 |
| npm | Included with Node.js |

## One-Time Setup

```bash
cd src/AutoTests
npm install
npx playwright install
```

`npx playwright install` downloads the browser binaries (Chromium, Firefox, WebKit).

## Running Tests

### Against the remote Azure API (default)

No configuration needed — the existing Azure URL is used as the fallback:

```bash
cd src/AutoTests
npx playwright test
```

### Against a locally running API

Start the local API first (see the [run-api](../run-api/SKILL.md) skill), then run the
cross-platform npm script — it sets `BASE_URL=http://localhost:5000/api/` for you:

```bash
cd src/AutoTests
npm run test:local
```

To run and open the HTML report afterwards:

```bash
npm run test:local:report
```

Alternatively, set `BASE_URL` manually before running:

**bash / zsh**
```bash
BASE_URL=http://localhost:5000/api/ npx playwright test
```

**PowerShell**
```powershell
$env:BASE_URL = "http://localhost:5000/api/"
npx playwright test
```

## Useful Flags

| Command | Purpose |
|---|---|
| `npm run test:local` | Run all tests against the local API (`http://localhost:5000/api/`) |
| `npm run test:local:report` | Run against the local API, then open the HTML report |
| `npx playwright test -g "create"` | Run tests matching a name pattern |
| `npx playwright show-report` | Open the last HTML test report |

> These are HTTP API tests, so the config uses a single `api` project — there are no
> per-browser projects to select.

## Test Structure Overview

| Concept | Details |
|---|---|
| **ApiClient** | Singleton wrapper (`tests/api-client.ts`) — all HTTP calls go through it, never raw `request` |
| **DTOs** | TypeScript classes in `tests/dtos/` mirror backend models; use static factory methods for test data |
| **Assertions** | `expect.soft()` for non-critical checks (test continues); `expect()` for must-halt assertions |
| **Test isolation** | Follow **Create → Verify → Delete** pattern — every test cleans up its own data |
| **Grouping** | Tests grouped by `test.describe('VERB /api/Endpoint', ...)` |

## Viewing the HTML Report

```bash
cd src/AutoTests
npx playwright show-report
```

The report opens in your default browser and shows pass/fail per test, browser, and retry.
