# Issue #106 (U15) — `tests/contacts/delete.spec.ts`

**Mode:** Test-authoring (Phase 2). Deleting already works in `AddressBook.Web`; the Playwright UI
specs are the deliverable. **No production code changes.**

## Requirement

Cover the delete confirmation dialog (`MudMessageBox`) on the contacts list:

- **Cancel** in the dialog → the contact is **not** deleted (stays in the table).
- **Yes** → the contact is deleted and the table is updated (row gone).

## How the app behaves (verified in `Contacts.razor` / `.cs`)

- The row Delete button calls `DeleteContactAsync(id)` → `MudMessageBox.ShowAsync()` (Title
  "Warning", message "Are you sure you want to delete this contact?", buttons "Yes"/"Cancel").
- On **Yes** → `DELETE /api/Contacts/{id}` then `ReloadServerData()`; on **Cancel** → nothing.

## Reusing existing infrastructure

- `ContactsPage.deleteContact(id)` (row → dialog → **Yes** → reload settled) and
  `ContactsPage.cancelDelete(id)` (row → dialog → **Cancel** → dialog closed). `ConfirmDialog`
  exposes `dialog` / `title` / `message` / `confirm` / `cancel` for asserting the dialog itself.
- Seeding/cleanup via the `contactsApi` fixture (id auto-tracked → deleted in teardown;
  `deleteContact` tolerates 404, so the Yes test deleting its own row is safe at teardown).
- Data via `ContactFactory.tokenized(token, …)`; `search(token)` isolates the row.
- Verify persistence via `expectSingleContact` / `getFilteredContacts` (API), plus the table state.

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/contacts/delete.spec.ts` | **New** spec — the deliverable. |

No test-infra or production changes (all helpers already exist).

## Test plan — `delete.spec.ts`

1. **Cancel keeps the contact** — seed via `contactsApi`; `goto()` + `search(token)`; assert the row
   is visible. Click Delete, wait for the dialog, assert it shows the "Warning" title and the
   confirmation message, click **Cancel**. Assert the row is still visible and the API still returns
   exactly one contact (`expectSingleContact`).
2. **Yes deletes and updates the table** — seed; `goto()` + `search(token)`; assert the row is
   visible. `deleteContact(id)` (dialog → **Yes** → reload). Assert the row is gone
   (`expectNoContactRow`) and the list shows the empty state (`expectNoRecords`), and the API
   returns no contacts for the token.

All checks web-first; no fixed delays (the dialog/table settle via the component waits).

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Delete opens the confirm dialog (Warning + message) | test 1 (dialog assertions) |
| 2 | Cancel does not delete (row stays) | test 1 (row visible + API count 1) |
| 3 | Yes deletes and updates the table | test 2 (row gone + empty state + API count 0) |

## Out of scope

- Full CRUD lifecycle → U17. No production Blazor/API/contract changes.

## Verification

Start the API (`run-api`); the Playwright `webServer` also starts Web. Run `delete.spec.ts`
(chromium). `npm run lint` and `tsc --noEmit` clean. No browser walk.
