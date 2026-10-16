import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * Smoke coverage for the application shell that needs the Contacts page: its page title and the
 * two nav links moving between Home and Contacts. The shell-only checks are in app-shell.spec.ts.
 */
test.describe('smoke — app shell navigation', () => {
  test('Contacts has the "Contacts" page title', async ({ page, contactsPage }) => {
    await contactsPage.goto();

    await expect(page).toHaveTitle('Contacts');
  });

  test('navigates Home → Contacts via the nav link', async ({ page, homePage, appShell }) => {
    await homePage.goto();

    await appShell.gotoContacts();

    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page).toHaveTitle('Contacts');
  });

  test('navigates Contacts → Home via the nav link', async ({ page, contactsPage, homePage, appShell }) => {
    await contactsPage.goto();

    await appShell.gotoHome();

    await expect(page).toHaveURL(/\/$/);
    await expect(homePage.heading).toBeVisible();
  });
});
