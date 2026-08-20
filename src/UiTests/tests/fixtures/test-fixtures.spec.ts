import { request } from '@playwright/test';
import { AppShell } from '../../src/components/app-shell.component.js';
import { env } from '../../src/config/env.js';
import { ContactFactory } from '../../src/data/contact.factory.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { ContactsPage } from '../../src/pages/contacts.page.js';
import { CreateContactPage } from '../../src/pages/create-contact.page.js';
import { EditContactPage } from '../../src/pages/edit-contact.page.js';
import { HomePage } from '../../src/pages/home.page.js';
import { waitForBlazorReady } from '../../src/utils/blazor.js';

test.describe('test fixtures — injection smoke', () => {
  test('data fixture is the ContactFactory and builds valid contacts', ({ data }) => {
    expect(data).toBe(ContactFactory);
    const contact = data.validContact();
    expect(contact.firstName.length).toBeGreaterThan(0);
    expect(contact.lastName.length).toBeGreaterThan(0);
  });

  test('page and component fixtures are the expected instances', ({
    homePage,
    contactsPage,
    createContactPage,
    editContactPage,
    appShell,
  }) => {
    expect(homePage).toBeInstanceOf(HomePage);
    expect(contactsPage).toBeInstanceOf(ContactsPage);
    expect(createContactPage).toBeInstanceOf(CreateContactPage);
    expect(editContactPage).toBeInstanceOf(EditContactPage);
    expect(appShell).toBeInstanceOf(AppShell);
  });
});

test.describe('test fixtures — Blazor readiness', () => {
  test('waitForBlazorReady resolves once the shell is rendered', async ({ page, appShell }) => {
    await page.goto('/');
    await waitForBlazorReady(page);
    await expect(appShell.appBarTitle).toBeVisible();
  });
});

/*
 * Auto-cleanup: a contact created through `contactsApi` (with no manual delete) must be gone
 * after the test's teardown. Serial so the verification test runs after the seeding test's
 * teardown has executed.
 */
test.describe.serial('test fixtures — auto-cleanup', () => {
  const seededIds: number[] = [];

  test('seeds contacts through contactsApi without cleaning them up manually', async ({
    contactsApi,
    data,
  }) => {
    const first = await contactsApi.createContact(data.validContact());
    const second = await contactsApi.createContact(data.validContact());
    expect(first).toBeGreaterThan(0);
    expect(second).toBeGreaterThan(0);
    seededIds.push(first, second);
  });

  test('every seeded contact is 404 after teardown', async () => {
    expect(seededIds.length).toBe(2);
    const api = await request.newContext({ baseURL: env.apiURL, ignoreHTTPSErrors: true });
    try {
      for (const id of seededIds) {
        const response = await api.get(`Contacts/${id}`);
        expect(response.status(), `contact ${id} should be deleted after teardown`).toBe(404);
      }
    } finally {
      await api.dispose();
    }
  });
});

test('teardown tolerates a contact already deleted inside the test', async ({
  contactsApi,
  data,
}) => {
  const id = await contactsApi.createContact(data.validContact());
  await contactsApi.deleteContact(id);
  // Teardown will try to delete the same id again; a 404 must be tolerated, not thrown.
  // If teardown throws, this test is reported failed post-hoc.
});
