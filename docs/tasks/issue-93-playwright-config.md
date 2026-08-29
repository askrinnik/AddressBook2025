# Implementation plan — Issue #93: UI Tests U2: `playwright.config.ts` + browsers + webServer (API+Web)

- **Issue:** [#93](https://github.com/askrinnik/AddressBook2025/issues/93) — *UI Tests U2: playwright.config.ts + браузеры + webServer (API+Web)*
- **Parent plan:** [docs/tasks/ui-tests-framework-plan.md](ui-tests-framework-plan.md) — Фаза 0 (U2)
- **Depends on:** U1 (#92, merged) — the `src/UiTests` scaffold
- **Type:** tooling / test-runner wiring (no production code, no specs yet)
- **Labels:** none

## 1. Requirement

Wire up the Playwright test runner for `src/UiTests`:

1. Install the npm dependencies declared in U1 and the Playwright browser(s) (`npx playwright install`).
2. Add `playwright.config.ts` with: browser project(s) (chromium required; firefox/webkit
   optional), `baseURL`, `ignoreHTTPSErrors`, `trace`/`screenshot`/`video` artefacts,
   `list`+`html` reporters, and a **`webServer` array** that starts both the API and the Web app,
   with `reuseExistingServer` locally.

## 2. Scope boundary (what U2 is / is NOT)

- **In scope:** `npm install` (produces `package-lock.json`), `npx playwright install chromium`,
  and `playwright.config.ts`.
- **Out of scope / later issues:**
  - `src/config/env.ts` (zod + dotenv env loader) → **U3 (#94)**. Therefore U2's config must
    **not** import `./src/config/env.js` the way `src/ApiTests` does — that module does not exist
    yet. U2 reads configuration directly from `process.env` with sensible defaults; U3 will
    refactor the config to import the typed loader. This seam is deliberate and documented below.
  - `data-testid` enablers, framework code (`src/**`), and all specs (`tests/**`) → U4–U17.

## 3. Work mode note

Like U1, this is test-runner wiring with **no runnable specs yet** (`tests/` is created from U10
on). So there is no browser walk and no green test suite to show. Verification is
runner-integrity: dependencies + browser install succeed, and `playwright.config.ts` type-checks
and loads cleanly. See §7. Proving the `webServer` array actually boots both servers end-to-end
is only meaningfully exercised once a real spec exists — the optional throwaway-smoke check in §7
covers it if you want that proof now; otherwise it lands naturally at U10.

## 4. Files

| File | Change |
|---|---|
| `src/UiTests/playwright.config.ts` | **New.** The runner config described in §5. |
| `src/UiTests/package-lock.json` | **New (generated).** Produced by `npm install`; committed (as in `src/ApiTests`). |
| `docs/tasks/issue-93-playwright-config.md` | **New.** This plan. |
| `docs/tasks/ui-tests-framework-plan.md` | Tick the **U2** checkbox to `[x]` (same-PR progress marker, per the U1 convention). |

`node_modules/` stays git-ignored (already in `.gitignore`). Playwright browser binaries install
to the machine-global cache, not the repo — nothing to commit for them.

## 5. `playwright.config.ts` design

Mirrors `src/ApiTests/playwright.config.ts` where sensible, adapted for a browser UI suite:

- **Config source:** read inline from `process.env` with defaults (no U3 dependency):
  - `BASE_URL` → default `https://localhost:7187/` (Web `https` launch profile).
  - `API_URL` → default `http://localhost:5000/api/` (API `http` profile; used for the API
    readiness URL).
  - `HEADLESS` → default `true`.
  - timeout knobs (`EXPECT_TIMEOUT` 10000, `ACTION_TIMEOUT` 15000, `NAVIGATION_TIMEOUT` 30000)
    with numeric parsing.
- **Top-level:** `testDir: './tests'`, `fullyParallel: true`, `forbidOnly: !!process.env.CI`,
  `retries: CI ? 2 : 0`, `workers: CI ? 1 : undefined`.
- **Reporter:** `[['list'], ['html']]`.
- **`use`:** `baseURL`, `headless`, `ignoreHTTPSErrors: true`, `actionTimeout`,
  `navigationTimeout`, `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'`.
- **`expect`:** `{ timeout: EXPECT_TIMEOUT }`.
- **`projects`:** `chromium` (spread `devices['Desktop Chrome']`) as the active project.
  firefox/webkit added as a **commented optional block** with a one-line note, so
  `npx playwright install` stays scoped to chromium (matches "chromium; опц. firefox/webkit").
- **`webServer` (array of two):**
  1. **API** — `command: 'dotnet run --project ../AddressBook.Api'`, `url` = API readiness
     (`http://localhost:5000/api/Contacts`, the list endpoint answers 200, as in ApiTests),
     `reuseExistingServer: !process.env.CI`, `timeout: 120_000`.
  2. **Web** — `command: 'dotnet run --project ../AddressBook.Web --launch-profile https'`,
     `url` = `BASE_URL`, `reuseExistingServer: !process.env.CI`, `timeout: 120_000`,
     `ignoreHTTPSErrors: true` (self-signed localhost TLS).

  Order matters: the Web dev config (`wwwroot/appsettings.Development.json`) already points
  `API_Prefix` at `http://localhost:5000/api/`, so starting the API first is coherent.

## 6. Tests

**None.** No API/UI behaviour change and no spec files in this task (specs begin at U10). This is
the explicitly-justified no-test case per the workflow.

## 7. Verification (runner-integrity, scaffold-appropriate)

| # | Acceptance item | How verified |
|---|---|---|
| 1 | Dependencies installed | `npm install` in `src/UiTests` exits 0; `node_modules/` present; `package-lock.json` generated |
| 2 | Playwright browser installed | `npx playwright install chromium` exits 0; `npx playwright --version` prints |
| 3 | `playwright.config.ts` present with chromium project, `baseURL`, `ignoreHTTPSErrors`, trace/screenshot/video, list+html reporters, `webServer` array (API+Web) | Read file; each element present |
| 4 | Config type-checks | `npx tsc --noEmit` clean |
| 5 | Config loads in Playwright | `npx playwright test --list` loads the config without error (reports 0 tests — expected until U10; does **not** boot the webServer) |
| 6 | Lint clean | `npm run lint` passes on the new config |
| 7 | No out-of-scope files | No `src/config/env.ts`, no `tests/` specs created |

**Optional end-to-end webServer proof (only if you want it now):** drop a one-line throwaway
spec (`tests/_smoke.spec.ts` asserting `await page.goto('/')` gets a title), run `npm test` so
Playwright actually boots the API + Web via the `webServer` array, confirm green, then delete the
throwaway spec. This requires a reachable SQL Server for the API. If you'd rather not, the
`webServer` wiring is validated for real at U10 with the first genuine spec.

`dotnet build` is not a gate — the TS project is not part of `AddressBook.slnx`.

## 8. Out of scope / follow-ups

`src/config/env.ts` + dotenv/zod (U3), `data-testid` enablers (U4), framework code (U5–U9),
specs (U10–U17), CI (U20). No changes to `AddressBook.Web`, the API, or the solution file.
