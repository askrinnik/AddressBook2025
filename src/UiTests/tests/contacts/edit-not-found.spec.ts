import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { ContactsApi } from '../../src/api/contacts-api.js';
import { env } from '../../src/config/env.js';
import { ContactFactory } from '../../src/data/contact.factory.js';
import { EditContactPage } from '../../src/pages/edit-contact.page.js';

/*
 * Regression guard for #120: /edit-contact/{missing-id} must render the "Contact not found."
 * alert (with a "Back to Contacts" button), not Blazor's generic error UI. The defect was in
 * AddressBook.Web (ProblemDetailsHandler threw on 404, so GetContactByIdAsync's null path was
 * dead code). A positive check keeps the not-found assertion from passing vacuously.
 *
 * (This is the first committed src/UiTests spec; it news up the U8 page object directly and
 * seeds via the U5 ContactsApi — the U9 test.extend fixtures are a separate task.)
 */

// An id far above any seeded/auto-increment value, so the API reliably returns 404.
const MISSING_ID = 99_999_999;

let api: APIRequestContext;
let contacts: ContactsApi;

test.beforeAll(async () => {
  api = await request.newContext({ baseURL: env.apiURL, ignoreHTTPSErrors: true });
  contacts = new ContactsApi(api);
});

test.afterAll(async () => {
  await api.dispose();
});

test('shows "Contact not found." for a non-existent id', async ({ page }) => {
  const edit = new EditContactPage(page);
  await edit.goto(MISSING_ID);

  expect(await edit.isNotFound()).toBe(true);
  await expect(edit.notFoundAlert).toBeVisible();
  await expect(edit.backToContactsButton).toBeVisible();

  await edit.backToContacts();
  await expect(page).toHaveURL(/\/contacts$/);
});

test('shows the pre-filled form for an existing id (not the not-found alert)', async ({ page }) => {
  const command = ContactFactory.validContact();
  const id = await contacts.createContact(command);
  try {
    const edit = new EditContactPage(page);
    await edit.goto(id);

    expect(await edit.isNotFound()).toBe(false);
    await expect(edit.form.firstName).toHaveValue(command.firstName);
    await expect(edit.notFoundAlert).toHaveCount(0);
  } finally {
    await contacts.deleteContact(id);
  }
});
