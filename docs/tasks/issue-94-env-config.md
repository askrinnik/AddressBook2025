# Implementation plan — Issue #94: UI Tests U3: `config/env.ts` (zod + dotenv)

- **Issue:** [#94](https://github.com/askrinnik/AddressBook2025/issues/94) — *UI Tests U3: config/env.ts (zod + dotenv)*
- **Parent plan:** [docs/tasks/ui-tests-framework-plan.md](ui-tests-framework-plan.md) — Фаза 1 (U3)
- **Depends on:** U1 (#92) scaffold, U2 (#93) `playwright.config.ts` — both merged
- **Type:** test infrastructure (no production code, no specs yet)
- **Labels:** none

## 1. Requirement

Add a typed environment loader `src/config/env.ts` for `src/UiTests`: a **zod**-validated config
sourced from `process.env`, layered over **dotenv** files (`.env.ci` in CI, then `.env.local`
overriding locally). It exposes `BASE_URL`, `API_URL`, the timeout knobs, and `HEADLESS`.

## 2. Scope boundary

- **In scope:**
  - `src/UiTests/src/config/env.ts` — the zod + dotenv loader.
  - Refactor `src/UiTests/playwright.config.ts` to **import** this typed loader instead of its
    current inline `process.env` parsing. This is the seam explicitly left open in U2 (#93); U3
    is where it closes, so the project has a single source of config truth (mirroring how
    `src/ApiTests/playwright.config.ts` imports `./src/config/env.js`).
- **Out of scope / later issues:** `.env.ci` file contents and the CI workflow → U20; framework
  code that will also consume `env` (api client, fixtures) → U5–U9; specs → U10–U17. No
  `.env.local` is committed (it is git-ignored and developer-specific; `.env.example` from U1 is
  the template).

## 3. Work mode note

Test infrastructure, no runnable specs yet (they begin at U10). Verification is loader
correctness: it type-checks, `playwright.config.ts` still loads through it, invalid values are
**rejected** with a clear error, and valid overrides are honoured. See §7.

## 4. Files

| File | Change |
|---|---|
| `src/UiTests/src/config/env.ts` | **New.** zod schema + dotenv layering; exports a typed `env` object. |
| `src/UiTests/playwright.config.ts` | **Edit.** Import `env` from `./src/config/env.js`; replace inline parsing with `env.*`. |
| `docs/tasks/issue-94-env-config.md` | **New.** This plan. |
| `docs/tasks/ui-tests-framework-plan.md` | Tick the **U3** checkbox to `[x]`. |

## 5. `env.ts` design (mirrors `src/ApiTests/src/config/env.ts`)

- **dotenv layering** (identical approach to ApiTests): resolve the package root from
  `import.meta.url`; if `process.env.CI`, load `.env.ci` first; then always load `.env.local` so a
  developer file overrides CI defaults. Real `process.env` still wins over both.
- **zod schema** over `process.env`:
  | Var | Rule | Default |
  |---|---|---|
  | `BASE_URL` | URL, must end with `/` (so `new URL('path', BASE_URL)` keeps the base) | `https://localhost:7187/` |
  | `API_URL` | URL, must end with `/` | `http://localhost:5000/api/` |
  | `HEADLESS` | case-insensitive `true`/`false` | `true` |
  | `EXPECT_TIMEOUT` | positive int (coerced) | `10000` |
  | `ACTION_TIMEOUT` | positive int (coerced) | `15000` |
  | `NAVIGATION_TIMEOUT` | positive int (coerced) | `30000` |
- On `safeParse` failure, throw an `Error` listing each invalid field (same message shape as
  ApiTests: `Invalid UI test environment configuration:` + bullet list).
- Export `interface Env { baseURL; apiURL; headless: boolean; expectTimeout; actionTimeout;
  navigationTimeout }` and a materialised `env: Env` (with `HEADLESS` mapped to a real boolean).
  Defaults match the values already hard-coded in U2's `playwright.config.ts`, so behaviour is
  unchanged for a default run.

## 6. `playwright.config.ts` refactor

Replace the inline `BASE_URL`/`API_URL`/`HEADLESS`/timeout parsing and the `num()` helper with
`import { env } from './src/config/env.js';`, then use `env.baseURL`, `env.apiURL`, `env.headless`,
`env.expectTimeout`, `env.actionTimeout`, `env.navigationTimeout`. `isCI` stays a direct
`process.env.CI` read (CI-ness is a runner concern, not app config), as in ApiTests. The
`apiReadinessURL`, projects, and `webServer` array are otherwise unchanged.

## 7. Tests

**None.** No API/UI behaviour change and no spec files (specs begin at U10). Explicitly-justified
no-test case per the workflow.

## 8. Verification (loader correctness)

| # | Acceptance item | How verified |
|---|---|---|
| 1 | `src/config/env.ts` exists, zod-validated, dotenv-layered (`.env.ci` in CI, then `.env.local`) | Read file |
| 2 | Exposes `BASE_URL`, `API_URL`, timeouts, `HEADLESS` | Read file / schema |
| 3 | `playwright.config.ts` consumes the typed loader (no inline parsing left) | Read file |
| 4 | Type-checks | `npx tsc --noEmit` clean |
| 5 | Config loads through the loader with defaults | `npx playwright test --list` loads (0 tests, no error) |
| 6 | Invalid config is rejected | `BASE_URL=not-a-url npx playwright test --list` fails with the "Invalid UI test environment configuration" error; likewise a no-trailing-slash `BASE_URL` |
| 7 | Valid override honoured | `BASE_URL=https://example.com/ npx playwright test --list` loads without error |
| 8 | Lint clean | `npm run lint` exit 0 |

`dotnet build` is not a gate — the TS project is not part of `AddressBook.sln`.

## 9. Out of scope / follow-ups

`.env.ci` + CI workflow (U20), consumers of `env` in framework code (U5–U9), specs (U10–U17). No
changes to `AddressBook.Web`, the API, or the solution file.
