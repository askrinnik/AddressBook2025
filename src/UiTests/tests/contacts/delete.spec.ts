import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import {
  expectContactRow,
  expectNoContactRow,
  expectNoRecords,
  expectSingleContact,
} from '../../src/utils/assertions.js';

/*
 * Delete a contact through the UI (U15): the row Delete button opens a `MudMessageBox` confirmation;
 * Cancel keeps the contact, Yes deletes it and the table reloads without the row.
 *
 * Isolation on the shared SQL Server DB: each test seeds its contact over REST via the `contactsApi`
 * fixture (id auto-tracked → deleted in teardown; `deleteContact` tolerates 404, so the "Yes" test
 * deleting its own row is safe at teardown). Contacts are built with `data.tokenized(token, …)` and
 * `search(token)` isolates the row. Persistence is verified via the API; the table state via the
 * component assertions. All checks web-first; no delays.
 */

test.describe('contacts — delete', () => {
  test('Cancel in the confirm dialog keeps the contact', async ({
    contactsPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const contact = data.tokenized(token);
    const id = await contactsApi.createContact(contact);

    await contactsPage.goto();
    await contactsPage.table.search(token);
    await expectContactRow(contactsPage.table, id, {
      firstName: contact.firstName,
      lastName: contact.lastName,
    });

    // Open the confirm dialog and assert it, then back out with Cancel.
    await contactsPage.table.clickDelete(id);
    await contactsPage.deleteDialog.waitUntilOpen();
    await expect(contactsPage.deleteDialog.title).toContainText('Warning');
    await expect(contactsPage.deleteDialog.message).toBeVisible();
    await contactsPage.deleteDialog.cancel();
    await contactsPage.deleteDialog.waitUntilClosed();

    // The contact is untouched: still in the table and still one row via the API.
    await expectContactRow(contactsPage.table, id, {
      firstName: contact.firstName,
      lastName: contact.lastName,
    });
    const remaining = await expectSingleContact(contactsApi, token);
    expect(remaining.id).toBe(id);
  });

  test('Yes deletes the contact and updates the table', async ({
    contactsPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const contact = data.tokenized(token);
    const id = await contactsApi.createContact(contact);

    await contactsPage.goto();
    await contactsPage.table.search(token);
    await expectContactRow(contactsPage.table, id, {
      firstName: contact.firstName,
      lastName: contact.lastName,
    });

    // Confirm the delete (dialog → Yes → table reload).
    await contactsPage.deleteContact(id);

    // The row is gone, the (token-filtered) table is empty, and the API has no such contact.
    await expectNoContactRow(contactsPage.table, id);
    await expectNoRecords(contactsPage.table);
    expect(await contactsApi.getFilteredContacts(token)).toHaveLength(0);
  });
});
