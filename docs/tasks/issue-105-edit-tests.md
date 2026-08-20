# Issue #105 (U14) — `tests/contacts/edit.spec.ts`

**Mode:** Test-authoring (Phase 2). Editing already works in `AddressBook.Web`; the Playwright UI
specs are the deliverable. **No production code changes.**

## Requirement

Cover the Edit Contact page (`/edit-contact/{id}`) through the UI:

- The form is **pre-filled** with the existing contact's data.
- **Saving** edits persists them and is reflected in the contacts list.
- **Cancel** returns to `/contacts` and discards the edits.
- **not-found** for a non-existent id.

## How the app behaves (verified in `EditContact.razor`)

- On load, `GetContactByIdAsync(Id)`; if `null` → renders a `Contact not found.` alert + `Back to
  Contacts` button; otherwise pre-fills First name / Last Name / Birthday into the shared form.
- **Save** (`HandleUpdateContact`): validates, `PUT /api/Contacts/{id}`, then navigates to
  `/contacts`. **Cancel**: navigates to `/contacts` with no API call.

## Scope note — not-found is already covered

The not-found branch is already exercised by `tests/contacts/edit-not-found.spec.ts` (the #120
regression guard: it asserts the alert, the `Back to Contacts` button, navigation to `/contacts`,
**and** — positively — that an existing id renders the pre-filled form rather than the alert).
`edit.spec.ts` therefore does **not** duplicate not-found; it focuses on the edit/save and cancel
flows. The acceptance table records where each criterion is verified.

## Reusing existing infrastructure

- `EditContactPage` (U8): `goto(id)`, public `form`, `save()`. `ContactForm` fills/reads fields.
- Seeding/cleanup: the contact is created via the `contactsApi` fixture (id auto-tracked → deleted
  in teardown). Editing does not change the id, so auto-cleanup still covers it — no manual cleanup.
- Data: `ContactFactory.tokenized(token, …)`; the edited names keep the token so `search(token)` /
  the API lookup still isolate the row after the rename.

## Test-infra addition (test code, not production)

Extract the "look up the single contact matching a token" helper (currently local to
`create.spec.ts` as `findOnlyContact`) into `src/UiTests/src/utils/assertions.ts` as
**`expectSingleContact(contactsApi, token): Promise<ContactRow>`** (asserts exactly one row, returns
it). Reused by `edit.spec.ts` now and by U15/U17 later. `create.spec.ts` is refactored onto it (DRY;
consistent with the U13 review direction).

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/contacts/edit.spec.ts` | **New** spec — the deliverable. |
| `src/UiTests/src/utils/assertions.ts` | Add `expectSingleContact` (shared token lookup + assertion). |
| `src/UiTests/tests/contacts/create.spec.ts` | Refactor onto `expectSingleContact` (drop local `findOnlyContact`). |

## Test plan — `edit.spec.ts`

1. **pre-fills the form and reflects saved edits in the list** — seed `original = data.tokenized(token, {birthday:'1990-01-01'})` via `contactsApi`; `goto(id)`; assert the form is pre-filled (First/Last values equal `original`, Birthday input non-empty). Edit to `updated = data.tokenized(token, {firstName:'Edited', lastName:'Renamed', birthday:'1985-05-05'})` (token kept), `save()`, assert URL `/contacts`. Verify via API (`expectSingleContact(token)`): same `id`, updated first/last, `birthday === '1985-05-05'`. Verify in the list via `search(token)` + `expectContactRow(id, …)`.
2. **Cancel discards the edits** — seed `original` via `contactsApi`; `goto(id)`; change the first name in the form; `cancel()`; assert URL `/contacts`. Verify via API the row is unchanged (`firstName`/`lastName` still equal `original`).

not-found → verified by `edit-not-found.spec.ts` (not repeated).

All assertions web-first; dates checked against the API `yyyy-MM-dd`, not the culture-formatted cell.

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Edit form is pre-filled with the contact's data | edit.spec test 1 (+ existing edit-not-found positive case) |
| 2 | Saving edits persists and shows in the list | edit.spec test 1 (API + visible row) |
| 3 | Cancel returns to `/contacts` and discards edits | edit.spec test 2 |
| 4 | not-found for a non-existent id | existing `edit-not-found.spec.ts` (#120) |

## Out of scope

- Validation on edit (empty/over-length/future date) → U16 (`validation.spec.ts`).
- Delete / full CRUD lifecycle → U15 / U17.
- No production Blazor/API/contract changes.

## Verification

Start the API (`run-api`); the Playwright `webServer` also starts Web. Run `edit.spec.ts` +
the refactored `create.spec.ts` (chromium). `npm run lint` and `tsc --noEmit` clean. No browser walk.
