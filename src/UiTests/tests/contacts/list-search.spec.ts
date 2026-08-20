import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { newTestToken } from '../../src/data/tokens.js';
import type { CreateContactCommand } from '../../src/api/contacts-api.js';
import type { ContactFactory } from '../../src/data/contact.factory.js';
import { expectContactRow, expectNoContactRow, expectNoRecords } from '../../src/utils/assertions.js';

/*
 * Contacts list display + search (U11): created contacts show up in the MudTable, the toolbar
 * Search box (server-reload) narrows the list, a non-matching term renders the empty state, and
 * clearing the search brings the rows back.
 *
 * Isolation on the shared SQL Server DB: each test mints a fresh `newTestToken()` and seeds
 * contacts whose first/last names embed it, so searching that token returns exactly this test's
 * rows regardless of seed data or parallel workers. Seeding is the hybrid REST path (fast, no UI)
 * via the U9 `contactsApi` fixture, which auto-deletes every created contact in teardown. All
 * checks are web-first (the U7 table component and the U9 domain assertions auto-wait); no delays.
 */

// A contact whose first and last name both embed `token` (kept within the API's 30-char limit),
// so the server's `FirstName.Contains OR LastName.Contains` filter isolates it by that token.
function tokenNamedContact(data: typeof ContactFactory, token: string): CreateContactCommand {
  return data.validContact({ firstName: `First-${token}`, lastName: `Last-${token}` });
}

test.describe('contacts — list & search', () => {
  test('displays created contacts in the list', async ({ contactsApi, contactsPage, data }) => {
    const token = newTestToken();
    const first = tokenNamedContact(data, token);
    const second = tokenNamedContact(data, token);
    const firstId = await contactsApi.createContact(first);
    const secondId = await contactsApi.createContact(second);

    await contactsPage.goto();
    await contactsPage.table.search(token);

    await expectContactRow(contactsPage.table, firstId, {
      firstName: first.firstName,
      lastName: first.lastName,
    });
    await expectContactRow(contactsPage.table, secondId, {
      firstName: second.firstName,
      lastName: second.lastName,
    });
    expect(await contactsPage.table.rowCount()).toBe(2);
  });

  test('search by token narrows the list to the matching contact', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const tokenA = newTestToken();
    const tokenB = newTestToken();
    const contactA = tokenNamedContact(data, tokenA);
    const idA = await contactsApi.createContact(contactA);
    const idB = await contactsApi.createContact(tokenNamedContact(data, tokenB));

    await contactsPage.goto();
    await contactsPage.table.search(tokenA);

    await expectContactRow(contactsPage.table, idA, {
      firstName: contactA.firstName,
      lastName: contactA.lastName,
    });
    await expectNoContactRow(contactsPage.table, idB);
    expect(await contactsPage.table.rowCount()).toBe(1);
  });

  test('a non-matching search shows the "No matching records found" empty state', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    // Seed a real row so the empty state is proven to come from the filter, not an empty DB.
    const id = await contactsApi.createContact(tokenNamedContact(data, newTestToken()));

    await contactsPage.goto();
    await contactsPage.table.search(newTestToken());

    await expectNoRecords(contactsPage.table);
    await expectNoContactRow(contactsPage.table, id);
  });

  test('clearing the search restores the list', async ({ contactsApi, contactsPage, data }) => {
    await contactsApi.createContact(tokenNamedContact(data, newTestToken()));

    await contactsPage.goto();
    await contactsPage.table.search(newTestToken());
    await expectNoRecords(contactsPage.table);

    await contactsPage.table.clearSearch();

    await expect(contactsPage.table.noRecords).toBeHidden();
    expect(await contactsPage.table.rowCount()).toBeGreaterThan(0);
  });
});
