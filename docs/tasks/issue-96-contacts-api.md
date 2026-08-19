# Implementation plan — Issue #96: UI Tests U5: `api/contacts-api.ts` (seed/cleanup via APIRequestContext)

- **Issue:** [#96](https://github.com/askrinnik/AddressBook2025/issues/96) — *UI Tests U5: api/contacts-api.ts (seed/cleanup через APIRequestContext)*
- **Parent plan:** [docs/tasks/ui-tests-framework-plan.md](ui-tests-framework-plan.md) — Фаза 1 (U5)
- **Depends on:** U1–U4 (merged); consumes `env` from U3
- **Type:** test infrastructure (no production code, no permanent specs)
- **Labels:** none

## 1. Requirement

Provide a thin wrapper over Playwright's `APIRequestContext` for the **hybrid E2E** data path:
seed and clean up contacts directly through the REST API (fast, no UI), so UI tests start from a
known state and tear their data down afterwards. Reuse the API facts already established in
`src/ApiTests` (endpoint path, `Location`-header id parsing, command shape).

## 2. Scope boundary

- **In scope:** `src/UiTests/src/api/contacts-api.ts` — a `ContactsApi` class with `createContact`
  (POST → id from `Location`) and `deleteContact` (DELETE by id, idempotent).
- **Out of scope / later issues:** the `contactsApi` **fixture** that constructs the request
  context and wires auto-cleanup → U9 (#100); data factories/tokens → U6; component/page objects →
  U7–U8; specs → U10–U17. No production code, no API change.

## 3. Work mode note

Test infrastructure. There are no permanent specs in this task (they begin at U10). Static
verification is `tsc` + lint; **functional** verification is a throwaway round-trip spec run
against the live API and then removed (see §7) — the wrapper's whole value is runtime behaviour
(`Location` parsing, delete), so a live check is worth doing now, mirroring the U4 walk.

## 4. Files

| File | Change |
|---|---|
| `src/UiTests/src/api/contacts-api.ts` | **New.** `ContactsApi` seed/cleanup wrapper. |
| `docs/tasks/issue-96-contacts-api.md` | **New.** This plan. |
| `docs/tasks/ui-tests-framework-plan.md` | Tick the **U5** checkbox to `[x]`. |

Temporary, **not committed**: `tests/_seed-smoke.spec.ts` (created for the functional check in §7,
deleted before commit).

## 5. `contacts-api.ts` design (reusing ApiTests facts)

- Constructor takes an `APIRequestContext` (mirrors `src/ApiTests`'s `BaseApiClient`). The context
  is expected to be created with `baseURL = env.apiURL` (which ends with `/api/`), so the relative
  path `Contacts` resolves to `/api/Contacts`. Creating that context is the U9 fixture's job; U5
  just consumes whatever context it is given.
- **Reused facts:** `CONTACTS_PATH = 'Contacts'`; `Location` id regex `/\/Contacts\/(\d+)$/`;
  `CreateContactCommand = { firstName: string; lastName: string; birthday?: string | null }`.
- `async createContact(command): Promise<number>` — POST `Contacts`; if status ≠ 201 throw a
  descriptive error including the status and body (a failed seed must fail loudly); parse the id
  from the `Location` header and throw if it is missing. Returns the new id.
- `async deleteContact(id): Promise<void>` — DELETE `Contacts/{id}`; accept **204 or 404** (404 =
  already gone, so cleanup is idempotent and safe to call in teardown even if the test already
  deleted the row); any other status throws with the status and body.
- Export `parseContactIdFromLocation(location)` helper and the `CreateContactCommand` type for
  reuse by U6/U9.

No assertions library inside the wrapper beyond the throw-on-unexpected-status guards; richer
negative-path API testing stays in `src/ApiTests`.

## 6. Tests

**No permanent Playwright specs** in this task — the UI specs that use this wrapper are U10–U17,
and the auto-cleanup fixture is U9. This is the explicitly-justified no-permanent-test case; the
throwaway functional check in §7 is verification scaffolding, not a deliverable.

## 7. Verification

| # | Acceptance item | How verified |
|---|---|---|
| 1 | `api/contacts-api.ts` wraps `APIRequestContext` with seed/cleanup | Read file |
| 2 | `createContact` POSTs, asserts 201, returns id from `Location` | Functional round-trip (below) |
| 3 | `deleteContact` DELETEs by id, tolerates 404 | Functional round-trip + a second delete of the same id returning cleanly |
| 4 | Reuses ApiTests facts (path, Location regex, command shape) | Read file |
| 5 | Type-checks | `npx tsc --noEmit` clean |
| 6 | Lint clean | `npm run lint` exit 0 |

**Functional round-trip:** start the API (local SQL Server), add a temporary
`tests/_seed-smoke.spec.ts` that builds an `APIRequestContext` with `baseURL = env.apiURL`,
`createContact(...)` → assert a positive id, `deleteContact(id)` → assert no throw, then
`deleteContact(id)` again → assert the 404-tolerant path returns cleanly. Run it with
`npx playwright test _seed-smoke`, confirm green, then **delete the throwaway spec**. `dotnet build`
is not a gate (no .NET change).

## 8. Out of scope / follow-ups

`contactsApi` fixture + auto-cleanup (U9), data factories/tokens (U6), component/page objects
(U7–U8), specs (U10–U17). No production or API changes.
