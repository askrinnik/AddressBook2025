# Implementation plan — Issue #92: UI Tests U1: Scaffold `src/UiTests`

- **Issue:** [#92](https://github.com/askrinnik/AddressBook2025/issues/92) — *UI Tests U1: Scaffold `src/UiTests`*
- **Parent plan:** [docs/tasks/ui-tests-framework-plan.md](ui-tests-framework-plan.md) — Фаза 0 (U1)
- **Type:** tooling scaffold (no production code, no tests yet)
- **Labels:** none

## 1. Requirement

Create the empty tooling skeleton for the new `src/UiTests` Playwright + TypeScript UI
E2E project. This is **only the tooling/config layer** — the `package.json` (with the named
npm scripts), `tsconfig.json`, ESLint flat config, Prettier config, `.gitignore`,
`.env.example`, and a README stub. The parent plan file already exists in `docs/tasks/`.

## 2. Scope boundary (what U1 is / is NOT)

This is the first task of a 21-task epic. U1 is the carcass only; everything below is a
**later, separate issue** and is deliberately **out of scope** here:

- **`playwright.config.ts`** and installing dependencies/browsers → **U2** (#93).
- `src/config/env.ts` zod loader → **U3** (#94).
- `data-testid` enablers in `AddressBook.Web` → **U4** (#95).
- All `src/**` framework code (pages, components, api, data, utils, fixtures) → **U5–U9**.
- All `tests/**` specs → **U10–U17**.

Consequently U1 adds **no `node_modules`, no `package-lock.json`, and no runnable tests**.
`package.json` *declares* the dependency set so U2 can `npm install`, but U1 does not install
or lock anything.

## 3. Work mode note

The `/implement-issue` workflow's Feature and Test-authoring modes both assume runnable
behaviour to verify. U1 has neither: there is no API/UI change to walk in a browser and no
Playwright spec to run (Playwright itself is wired up in U2). Verification for U1 is therefore
limited to **file presence, well-formedness (valid JSON / parseable config), and scope match**
— see §7. This deviation is expected for a pure scaffold task and is flagged here explicitly.

## 4. Files to add

All under `src/UiTests/` (mirroring the shape and tooling of `src/ApiTests`, adapted for a
browser UI suite):

| File | Purpose |
|---|---|
| `package.json` | name `addressbook-ui-tests`, ESM, the 8 required npm scripts, devDependencies mirroring `src/ApiTests` plus the UI stack from the parent plan §2. |
| `tsconfig.json` | Identical to `src/ApiTests` (ESNext / NodeNext, `strict`, `types: [node, @playwright/test]`). |
| `eslint.config.mjs` | Flat config, byte-identical rules to `src/ApiTests`. |
| `.prettierrc.json` | Identical to `src/ApiTests`. |
| `.gitignore` | `node_modules`, `playwright-report`, `test-results`, `.env.local`, `.env.ci`, `/playwright/.cache/`. |
| `.env.example` | Documented UI-test env template: `BASE_URL` (Web site), `API_URL` (API), `HEADLESS`, timeout knobs. |
| `README.md` | Short stub in Russian (matching `src/ApiTests/README.md` language): what this is, scaffold status, pointer to the parent plan for the full design. |

Plus one edit to the existing parent plan:

- `docs/tasks/ui-tests-framework-plan.md` — tick the **U1** checkbox in §5 to `[x]`. Done in
  this same change (not after merge) so the progress marker ships inside this PR rather than
  lingering as a separate untracked edit.

### 4.1 npm scripts (exact set required by the issue)

| Script | Command |
|---|---|
| `test` | `playwright test` |
| `test:report` | `playwright test && playwright show-report` |
| `test:ui` | `playwright test --ui` |
| `test:debug` | `playwright test --debug` |
| `test:headed` | `playwright test --headed` |
| `test:remote` | `cross-env BASE_URL=https://happy-river-0d4a91803-preview.westeurope.6.azurestaticapps.net/ playwright test` |
| `lint` | `eslint .` |
| `format` | `prettier --write "**/*.{ts,tsx,js,mjs,cjs,json,md}"` |

`test:remote` points `BASE_URL` at the deployed Azure Static Web App (the UI under test),
mirroring how `src/ApiTests`'s `test:remote` points at the deployed API.

### 4.2 devDependencies (declared, installed in U2)

Mirror `src/ApiTests`: `@eslint/js`, `@faker-js/faker`, `@playwright/test`, `@types/node`,
`cross-env`, `dotenv`, `eslint`, `globals`, `prettier`, `prettier-plugin-organize-imports`,
`typescript`, `typescript-eslint`. **Add** `@axe-core/playwright` (optional a11y — used later in
U18). `zod` stays a runtime `dependency` (as in `src/ApiTests`). `http-status-codes` from
`src/ApiTests` is API-specific and is **omitted**.

### 4.3 `.env.example` contents

```
# Base URL of the AddressBook Web app under test (Blazor WASM site).
BASE_URL=https://localhost:7187/

# Base URL of the AddressBook API used for hybrid seed/cleanup (must end with /api/).
API_URL=http://localhost:5000/api/

# Run the browser headless (true) or headed (false).
HEADLESS=true

# Default expect() assertion timeout in milliseconds.
EXPECT_TIMEOUT=10000

# Per-action timeout in milliseconds.
ACTION_TIMEOUT=15000

# Navigation timeout in milliseconds (Blazor WASM first load can be slow).
NAVIGATION_TIMEOUT=30000
```

The exact env schema is finalised in U3; this file is the documented template only.

## 5. Approach / order

Pure additive scaffold — no domain/data/contracts/API/Web layers involved. Create the seven
files under `src/UiTests/` in one pass, keeping tooling byte-aligned with `src/ApiTests` where
it is not UI-specific.

## 6. Tests

**None.** No API or UI behaviour changes, and the Playwright runner is not wired until U2, so
there is nothing runnable to test. This is the explicitly-justified no-test case per the
workflow. Playwright specs begin at U10.

## 7. Verification (adapted for a scaffold task)

| # | Acceptance item | How verified |
|---|---|---|
| 1 | `src/UiTests/package.json` exists with scripts `test`, `test:report`, `test:ui`, `test:debug`, `test:headed`, `test:remote`, `lint`, `format` | Read file; `node -e` JSON parse; confirm all 8 script keys present |
| 2 | `src/UiTests/tsconfig.json` exists | Read file; JSON parse |
| 3 | `src/UiTests/eslint.config.mjs` (flat config) exists | Read file |
| 4 | `src/UiTests/.prettierrc.json` exists | Read file; JSON parse |
| 5 | `src/UiTests/.gitignore` exists | Read file |
| 6 | `src/UiTests/.env.example` exists | Read file |
| 7 | `src/UiTests/README.md` stub exists | Read file |
| 8 | Parent plan present in `docs/tasks/` | Already present: `ui-tests-framework-plan.md` |
| 9 | No out-of-scope files created (`playwright.config.ts`, `node_modules`, `src/`, `tests/`) | `ls src/UiTests` shows only the 7 scaffold files |

`dotnet build src/AddressBook.sln` is unaffected (the UI test project is not part of the .NET
solution), so a solution build is not a meaningful gate for this task.

## 8. Out of scope / follow-ups

Everything in §2 (U2–U21). No CI wiring, no `data-testid` changes to `AddressBook.Web`, no
solution-file changes.
