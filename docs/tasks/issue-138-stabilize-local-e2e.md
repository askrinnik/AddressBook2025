# Issue #138 (testing) — UI E2E suite flakes locally under full-parallel cold start

**Issue:** [#138](https://github.com/askrinnik/AddressBook2025/issues/138) — labelled `testing`.
**Origin:** observed while verifying #135 (PR #137).

## Reproduced failure

Running the suite with the **default local** invocation flakes intermittently:

```
npx playwright test        # local: workers = undefined (many), retries = 0
```

Across this session's runs it failed 2 then 4 tests, with a **changing** failure set, always in `tests/smoke/app-shell.spec.ts` (page-title assertions) and `tests/contacts/validation.spec.ts` (server-400 cases) — never the code actually under test. The same suite is stable with the CI-style settings:

```
npx playwright test --retries=2 --workers=4   # 46 passed, repeatedly
```

## Root cause

`src/UiTests/playwright.config.ts`:

```ts
retries: isCI ? 2 : 0,
workers: isCI ? 1 : undefined,
```

Locally that is **max workers + zero retries**. On a cold start the two `dotnet` dev servers (API + Blazor WASM) are hit by many parallel first-loads at once; Blazor WASM's first boot per browser context plus server JIT warm-up is slow, so a few navigations/title assertions exceed the timeout. It is a startup-timing/load flake in the harness, not a product defect (CI already hides it via `workers: 1` + `retries: 2`).

## Fix approach (test harness only)

Give the **local** profile the two levers CI already has, without changing CI:

```ts
retries: isCI ? 2 : 1,          // one local retry self-heals a cold-start miss
workers: isCI ? 1 : 4,          // cap the local first-load thundering herd
```

- CI is untouched (`workers: 1`, `retries: 2`).
- Locally: a capped worker count reduces simultaneous WASM cold boots, and a single retry heals the rare residual miss — the same mechanism CI relies on. The suite stays fast (4 parallel workers) while becoming stable.

Only `src/UiTests/playwright.config.ts` changes. No product code, no spec logic.

## Tests / verification

This is a harness-stability change, so the "test" is the suite's own repeatability, not a new spec:

- Run the **default** local invocation `npx playwright test` (no extra flags) several times consecutively from a cold start; every run is green (46 passed).
- Confirm CI config is unchanged by inspection (the `isCI` branches keep `1` / `2`).
- `tsc --noEmit` + `eslint` on `src/UiTests` stay clean.

No new spec is warranted — adding a test cannot assert "the suite is not flaky"; repeated green cold-start runs are the evidence.

## Out of scope

- A webServer warm-up / readiness-probe redesign, or per-navigation timeout tuning — heavier changes kept in reserve if the retry+worker-cap proves insufficient.
- The unrelated upstream MudBlazor pager a11y gap (#136).
