import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import {
  expectContactRow,
  expectNoContactRow,
  expectNoRecords,
  expectSingleContact,
} from '../../src/utils/assertions.js';

/*
 * End-to-end contact lifecycle through the UI (U17): create → find by search → edit → verify →
 * delete → confirm it's gone. Unlike the per-feature specs (U13–U16), nothing is API-seeded — the
 * contact is born and dies through the real pages; the API is used only to read back persisted
 * state and as the teardown safety net.
 *
 * Isolation on the shared SQL Server DB: `newTestToken()` per run; the contact is built with
 * `data.tokenized(token, …)` and the edited names keep the token, so the API lookup / `search(token)`
 * isolate it throughout. The contact is created via the UI (untracked by the fixture's auto-cleanup),
 * so the body is wrapped in try/finally that deletes the looked-up id (tolerates 404 — the happy path
 * already deleted it via the UI). Dates are asserted via the API's `yyyy-MM-dd`, not the cell.
 */

test.describe('contacts — CRUD lifecycle', () => {
  test('create → find → edit → verify → delete → gone', async ({
    page,
    createContactPage,
    contactsPage,
    editContactPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const original = data.tokenized(token, { birthday: '1990-01-01' });

    let id: number | undefined;
    try {
      // CREATE through the form.
      await createContactPage.goto();
      await createContactPage.create(original);
      await expect(page).toHaveURL(/\/contacts$/);

      // FIND: capture the id via the API, then prove it shows in the searched list.
      const created = await expectSingleContact(contactsApi, token);
      id = created.id;
      await contactsPage.table.search(token);
      await expectContactRow(contactsPage.table, id, {
        firstName: original.firstName,
        lastName: original.lastName,
      });

      // EDIT: open from the row, assert the pre-filled form, change every field, save.
      const updated = data.tokenized(token, {
        firstName: 'Edited',
        lastName: 'Renamed',
        birthday: '1985-05-05',
      });
      await contactsPage.openEdit(id);
      await expect(page).toHaveURL(new RegExp(`/edit-contact/${id}$`));
      await expect(editContactPage.form.firstName).toHaveValue(original.firstName);
      await editContactPage.form.fillFirstName(updated.firstName);
      await editContactPage.form.fillLastName(updated.lastName);
      await editContactPage.form.setBirthday('1985-05-05');
      await editContactPage.save();
      await expect(page).toHaveURL(/\/contacts$/);

      // VERIFY the edit persisted (same id, new values) and shows in the list.
      const saved = await expectSingleContact(contactsApi, token);
      expect(saved.id).toBe(id);
      expect(saved.firstName).toBe(updated.firstName);
      expect(saved.lastName).toBe(updated.lastName);
      expect(saved.birthday).toBe('1985-05-05');
      await contactsPage.table.search(token);
      await expectContactRow(contactsPage.table, id, {
        firstName: updated.firstName,
        lastName: updated.lastName,
      });

      // DELETE through the confirm dialog and confirm it's gone.
      await contactsPage.deleteContact(id);
      await expectNoContactRow(contactsPage.table, id);
      await expectNoRecords(contactsPage.table);
      expect(await contactsApi.getFilteredContacts(token)).toHaveLength(0);
    } finally {
      if (id !== undefined) await contactsApi.deleteContact(id);
    }
  });
});
