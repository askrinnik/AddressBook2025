# Issue #108 (U17) — `tests/contacts/crud-lifecycle.spec.ts`

**Mode:** Test-authoring (Phase 2). All CRUD flows already work in `AddressBook.Web`; the Playwright
UI spec is the deliverable. **No production code changes.**

## Requirement

One end-to-end journey driven entirely through the UI: **create → find by search → edit → verify →
delete → confirm it's gone**.

## Approach

Unlike the per-feature specs (U13–U16), this is a single lifecycle test that chains the real pages,
so nothing is API-seeded — the contact is born and dies through the UI. Each step reuses the existing
page objects and domain assertions:

- **Create** — `CreateContactPage.create()`, then assert navigation to `/contacts`.
- **Find** — look the new id up via the API (`expectSingleContact`) for precise assertions, then
  `table.search(token)` + `expectContactRow` to prove it shows in the list.
- **Edit** — row Edit (`contactsPage.openEdit(id)`) → assert the pre-filled form → change all fields
  → `save()` → assert navigation back to `/contacts`.
- **Verify** — API row shows the updated values (incl. `birthday` as `yyyy-MM-dd`); the list row
  reflects them.
- **Delete** — `contactsPage.deleteContact(id)` (dialog → Yes → reload) → row gone
  (`expectNoContactRow`), empty state (`expectNoRecords`), API returns none for the token.

## Isolation & cleanup (shared SQL Server DB)

`newTestToken()` per run; the contact is built with `data.tokenized(token, …)` and the edited names
keep the token, so the API lookup / `search(token)` isolate it throughout. The contact is created
through the UI (untracked by the fixture's auto-cleanup), so the test wraps its body in `try/finally`
and deletes the looked-up id at the end (`deleteContact` tolerates 404 — the happy path already
deleted it via the UI, so the safety-net delete is a no-op then, and a real cleanup on any mid-test
failure).

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/contacts/crud-lifecycle.spec.ts` | **New** spec — the deliverable. |

No test-infra or production changes (all helpers already exist).

## Test plan — `crud-lifecycle.spec.ts`

1. **create → find → edit → verify → delete → gone** (single test):
   - Create `original = data.tokenized(token, {birthday:'1990-01-01'})` via the form; URL → `/contacts`.
   - Find: `expectSingleContact(token)` (capture id); `search(token)` + `expectContactRow(id, original)`.
   - Edit: `openEdit(id)`; assert URL `/edit-contact/{id}` and the form pre-filled with `original`;
     change to `updated = data.tokenized(token, {firstName:'Edited', lastName:'Renamed', birthday:'1985-05-05'})`; `save()`; URL → `/contacts`.
   - Verify: `expectSingleContact(token)` → same id, updated names, `birthday === '1985-05-05'`;
     `search(token)` + `expectContactRow(id, updated)`.
   - Delete: `deleteContact(id)`; `expectNoContactRow(id)`, `expectNoRecords`, API count 0.

All checks web-first; dates asserted via the API `yyyy-MM-dd`, not the culture-formatted cell.

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Create a contact through the UI | create step (URL + API/list) |
| 2 | Find it via search | find step (`expectContactRow`) |
| 3 | Edit it and the change is verified | edit + verify steps (API + list) |
| 4 | Delete it and confirm it's gone | delete step (row gone + empty state + API 0) |

## Out of scope

- Per-feature edge cases (already covered by U11–U16). No production changes.

## Verification

Start the API (`run-api`); the Playwright `webServer` also starts Web. Run `crud-lifecycle.spec.ts`
(chromium). `npm run lint` and `tsc --noEmit` clean. No separate browser walk (the test *is* the walk).
