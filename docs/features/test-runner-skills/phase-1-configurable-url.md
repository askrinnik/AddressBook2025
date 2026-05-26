# Phase 1: Make API URL Configurable

> **Depends on:** nothing  
> **Blocks:** Phase 3 (local-run verification)

## Tasks

- [x] Modify `src/AutoTests/tests/api-client.ts` line 6 — replace the hardcoded `serviceURL` constant with an env-var fallback:
  ```ts
  const serviceURL = process.env.BASE_URL ?? 'https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/api/';
  ```
- [ ] Verify: run `npx playwright test --project=chromium` without setting `BASE_URL` — tests must still pass against the Azure fallback URL

## Acceptance Criteria

- `BASE_URL` env var is read at runtime; if absent, existing Azure URL is used
- No dotenv dependency added
- Existing CI workflow (no env var set) is unaffected
