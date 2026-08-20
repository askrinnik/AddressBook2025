import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * Smoke coverage for the application shell (MainLayout + NavMenu): the app boots, the two nav
 * links move between Home and Contacts, the drawer and theme toggles flip their state, and each
 * route sets its own page title.
 *
 * The shell is static (no per-contact data), so these tests seed nothing — the U5 contactsApi /
 * Create→Verify→Delete isolation does not apply here. Every check is web-first: locator matchers
 * auto-wait, and the two boolean shell signals (drawer open, dark mode) are read through
 * `expect.poll` so the toggle animation is retried rather than sampled once.
 */
test.describe('smoke — app shell', () => {
  test('loads the app shell', async ({ homePage, appShell }) => {
    await homePage.goto();

    await expect(appShell.appBarTitle).toBeVisible();
    await expect(homePage.heading).toBeVisible();
  });

  test('Home has the "Home" page title', async ({ page, homePage }) => {
    await homePage.goto();

    await expect(page).toHaveTitle('Home');
  });

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

  test('toggles the navigation drawer', async ({ homePage, appShell }) => {
    await homePage.goto();
    // MainLayout starts with the drawer open (`_drawerOpen = true`).
    await expect.poll(() => appShell.isDrawerOpen()).toBe(true);

    await appShell.toggleDrawer();
    await expect.poll(() => appShell.isDrawerOpen()).toBe(false);

    await appShell.toggleDrawer();
    await expect.poll(() => appShell.isDrawerOpen()).toBe(true);
  });

  test('toggles the theme', async ({ homePage, appShell }) => {
    await homePage.goto();
    // MainLayout starts in light mode (`_isDarkMode = false`).
    await expect.poll(() => appShell.isDarkMode()).toBe(false);

    await appShell.toggleTheme();
    await expect.poll(() => appShell.isDarkMode()).toBe(true);

    await appShell.toggleTheme();
    await expect.poll(() => appShell.isDarkMode()).toBe(false);
  });
});
