import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import {
  expectContactRow,
  expectNoRecords,
  expectSingleContact,
} from '../../src/utils/assertions.js';

/*
 * Create Contact through the UI (U13): the `/create-contact` form creates a contact with or without
 * a birthday and returns to `/contacts`, where the new row shows up; Cancel returns without creating.
 *
 * Isolation on the shared SQL Server DB: each test mints a fresh `newTestToken()` and builds the
 * contact with `data.tokenized(token, …)` (names carry the token), so `getFilteredContacts(token)` /
 * `search(token)` isolate exactly this test's row. The contact is created through the UI (so it is
 * NOT tracked by the fixture's auto-cleanup) — each create test looks its id up via the API and
 * deletes it in `finally`, so a mid-test failure cannot leak data. The birthday is asserted against
 * the API's `yyyy-MM-dd` value, not the culture-formatted table cell. All UI checks are web-first.
 */

test.describe('contacts — create', () => {
  test('creates a contact with a birthday and shows it in the list', async ({
    page,
    createContactPage,
    contactsPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const contact = data.tokenized(token, { birthday: '1990-06-15' });

    let createdId: number | undefined;
    try {
      await createContactPage.goto();
      await createContactPage.create(contact);
      await expect(page).toHaveURL(/\/contacts$/);

      // Persisted with the birthday (checked via the API's yyyy-MM-dd value, culture-independent).
      const created = await expectSingleContact(contactsApi, token);
      createdId = created.id;
      expect(created.firstName).toBe(contact.firstName);
      expect(created.lastName).toBe(contact.lastName);
      expect(created.birthday).toBe('1990-06-15');

      // Shows up in the list.
      await contactsPage.table.search(token);
      await expectContactRow(contactsPage.table, createdId, {
        firstName: contact.firstName,
        lastName: contact.lastName,
      });
    } finally {
      if (createdId !== undefined) await contactsApi.deleteContact(createdId);
    }
  });

  test('creates a contact without a birthday and shows it in the list', async ({
    page,
    createContactPage,
    contactsPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const contact = data.tokenized(token, { birthday: null });

    let createdId: number | undefined;
    try {
      await createContactPage.goto();
      await createContactPage.create(contact);
      await expect(page).toHaveURL(/\/contacts$/);

      // Persisted with no birthday.
      const created = await expectSingleContact(contactsApi, token);
      createdId = created.id;
      expect(created.firstName).toBe(contact.firstName);
      expect(created.lastName).toBe(contact.lastName);
      expect(created.birthday).toBeNull();

      await contactsPage.table.search(token);
      await expectContactRow(contactsPage.table, createdId, {
        firstName: contact.firstName,
        lastName: contact.lastName,
      });
    } finally {
      if (createdId !== undefined) await contactsApi.deleteContact(createdId);
    }
  });

  test('Cancel returns to the list without creating the contact', async ({
    page,
    createContactPage,
    contactsPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const contact = data.tokenized(token, { birthday: '1985-03-10' });

    await createContactPage.goto();
    // Fill everything, including a birthday, to prove Cancel discards entered data — then back out.
    await createContactPage.form.fill(contact);
    await createContactPage.form.cancel();
    await expect(page).toHaveURL(/\/contacts$/);

    // Nothing was persisted: neither the API nor the list knows this token.
    expect(await contactsApi.getFilteredContacts(token)).toHaveLength(0);
    await contactsPage.table.search(token);
    await expectNoRecords(contactsPage.table);
  });
});
