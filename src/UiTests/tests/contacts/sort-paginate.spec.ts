import type { ContactsApi, CreateContactCommand } from '../../src/api/contacts-api.js';
import type { ContactsTable } from '../../src/components/contacts-table.component.js';
import type { ContactFactory } from '../../src/data/contact.factory.js';
import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * Contacts list sorting + pagination + TotalRows (U12).
 *
 * The MudTable reloads server-side (`ServerReload`): it fetches the rows matching the current
 * search, client-side sorts the whole filtered set by the clicked column, then pages it with
 * Skip/Take. `TableData.TotalItems` = `response.TotalRows`, which the pager shows as "X-Y of Z".
 *
 * Isolation on the shared SQL Server DB (same pattern as U11): each test mints `newTestToken()`
 * and seeds token-named contacts via the hybrid REST `contactsApi` fixture (auto-deleted in
 * teardown), then `search(token)` narrows the list to exactly this test's rows — so sort order,
 * page counts and TotalRows are all deterministic regardless of seed data or parallel workers.
 *
 * Sort order is asserted against the First-Name column (values these tests fully control), never
 * by parsing the culture-formatted Birthday cell. MudBlazor's smallest rows-per-page option is 10,
 * so the pagination tests seed 12 rows to force a real second page. All checks are web-first
 * (`expect.poll` retries the table's dynamic reads); reloads settle via the component; no delays.
 */

// Build a token-named contact so `search(token)` isolates it (the token sits in the first name).
function named(
  data: typeof ContactFactory,
  firstName: string,
  lastName: string,
  birthday: string,
  token: string,
): CreateContactCommand {
  return data.validContact({
    firstName: `${firstName}-${token}`,
    lastName: `${lastName}-${token}`,
    birthday,
  });
}

// Seed `count` contacts whose first names sort as P00, P01, … so paging order is deterministic.
// Promise.all keeps the returned ids aligned with the P-index, independent of DB insertion order.
async function seedPagedContacts(
  contactsApi: ContactsApi,
  data: typeof ContactFactory,
  token: string,
  count: number,
): Promise<number[]> {
  const contacts = Array.from({ length: count }, (_, i) =>
    named(data, `P${String(i).padStart(2, '0')}`, 'Lp', '1990-01-01', token),
  );
  return Promise.all(contacts.map((c) => contactsApi.createContact(c)));
}

async function expectFirstNameOrder(table: ContactsTable, expected: string[]): Promise<void> {
  await expect
    .poll(() => table.firstNameColumn(), {
      message: `first-name column order should be [${expected.join(', ')}]`,
    })
    .toEqual(expected);
}

async function expectRowCount(table: ContactsTable, count: number): Promise<void> {
  await expect
    .poll(() => table.rowCount(), { message: `page should show ${count} rows` })
    .toBe(count);
}

async function expectPageRange(table: ContactsTable, text: string): Promise<void> {
  await expect
    .poll(() => table.pageRangeText(), { message: `pager caption should read "${text}"` })
    .toBe(text);
}

test.describe('contacts — sort & paginate', () => {
  test('sorts by First Name ascending then descending', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const token = newTestToken();
    const anna = named(data, 'Anna', 'Lx', '1990-01-01', token);
    const bella = named(data, 'Bella', 'Lx', '1990-01-01', token);
    const cara = named(data, 'Cara', 'Lx', '1990-01-01', token);
    // Seed out of order so an ascending sort is proven to reorder, not just keep insertion order.
    await contactsApi.createContact(cara);
    await contactsApi.createContact(anna);
    await contactsApi.createContact(bella);

    await contactsPage.goto();
    await contactsPage.table.search(token);
    await expectRowCount(contactsPage.table, 3);

    await contactsPage.table.sortByFirstName(); // 1st click → ascending
    await expectFirstNameOrder(contactsPage.table, [
      anna.firstName,
      bella.firstName,
      cara.firstName,
    ]);

    await contactsPage.table.sortByFirstName(); // 2nd click → descending
    await expectFirstNameOrder(contactsPage.table, [
      cara.firstName,
      bella.firstName,
      anna.firstName,
    ]);
  });

  test('sorts by Last Name ascending then descending', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const token = newTestToken();
    // First names are distinct and unrelated to last-name order, so the First-Name column order
    // proves the sort followed the Last Name column (Alpha < Bravo < Charlie).
    const one = named(data, 'One', 'Charlie', '1990-01-01', token);
    const two = named(data, 'Two', 'Alpha', '1990-01-01', token);
    const three = named(data, 'Three', 'Bravo', '1990-01-01', token);
    await contactsApi.createContact(one);
    await contactsApi.createContact(two);
    await contactsApi.createContact(three);

    await contactsPage.goto();
    await contactsPage.table.search(token);
    await expectRowCount(contactsPage.table, 3);

    await contactsPage.table.sortByLastName(); // ascending: Alpha, Bravo, Charlie
    await expectFirstNameOrder(contactsPage.table, [two.firstName, three.firstName, one.firstName]);

    await contactsPage.table.sortByLastName(); // descending: Charlie, Bravo, Alpha
    await expectFirstNameOrder(contactsPage.table, [one.firstName, three.firstName, two.firstName]);
  });

  test('sorts by Birthday ascending then descending', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const token = newTestToken();
    // First names are alphabetical (X, Y, Z) but birthdays are NOT — so a correct order proves the
    // sort keyed on Birthday and not on name or insertion id.
    const xavier = named(data, 'Xavier', 'Lb', '1999-12-31', token);
    const yolanda = named(data, 'Yolanda', 'Lb', '1980-06-15', token);
    const zach = named(data, 'Zach', 'Lb', '1990-03-20', token);
    await contactsApi.createContact(xavier);
    await contactsApi.createContact(yolanda);
    await contactsApi.createContact(zach);

    await contactsPage.goto();
    await contactsPage.table.search(token);
    await expectRowCount(contactsPage.table, 3);

    await contactsPage.table.sortByBirthday(); // ascending: 1980, 1990, 1999
    await expectFirstNameOrder(contactsPage.table, [
      yolanda.firstName,
      zach.firstName,
      xavier.firstName,
    ]);

    await contactsPage.table.sortByBirthday(); // descending: 1999, 1990, 1980
    await expectFirstNameOrder(contactsPage.table, [
      xavier.firstName,
      zach.firstName,
      yolanda.firstName,
    ]);
  });

  test('paginates with the default page size and Next/Previous', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const token = newTestToken();
    const ids = await seedPagedContacts(contactsApi, data, token, 12);
    const table = contactsPage.table;

    await contactsPage.goto();
    await table.search(token);
    await table.sortByFirstName(); // P00..P11 → deterministic page contents

    // Page 1: 10 of 12 rows; TotalRows = 12; on the first page Previous is disabled.
    await expectRowCount(table, 10);
    expect(await table.totalRows()).toBe(12);
    await expectPageRange(table, '1-10 of 12');
    await expect(table.previousButton).toBeDisabled();
    await expect(table.rowById(ids[0])).toBeVisible(); // P00 on page 1
    await expect(table.rowById(ids[11])).toHaveCount(0); // P11 spills to page 2

    // Next → page 2: the remaining 2 rows; Next is now disabled.
    await table.nextPage();
    await expectRowCount(table, 2);
    await expectPageRange(table, '11-12 of 12');
    expect(await table.totalRows()).toBe(12);
    await expect(table.rowById(ids[11])).toBeVisible();
    await expect(table.nextButton).toBeDisabled();

    // Previous → back to page 1.
    await table.previousPage();
    await expectRowCount(table, 10);
    await expectPageRange(table, '1-10 of 12');
    await expect(table.rowById(ids[11])).toHaveCount(0);
  });

  test('rows-per-page can show every matching row on one page', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const token = newTestToken();
    await seedPagedContacts(contactsApi, data, token, 12);
    const table = contactsPage.table;

    await contactsPage.goto();
    await table.search(token);

    // Default 10/page → two pages; raising it to 25 collapses all 12 rows onto a single page.
    await expectRowCount(table, 10);
    await table.setRowsPerPage(25);

    await expectRowCount(table, 12);
    await expectPageRange(table, '1-12 of 12');
    expect(await table.totalRows()).toBe(12);
    await expect(table.nextButton).toBeDisabled();
  });
});
