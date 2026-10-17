import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * Smoke coverage for the application shell (MainLayout + NavMenu) that needs no Contacts page: the
 * app boots, the drawer and theme toggles flip their state, Home and an unknown route set their
 * page titles. The tests that open the Contacts page are in app-shell-navigation.spec.ts.
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

  test('toggles the navigation drawer', async ({ homePage, appShell }) => {
    await homePage.goto();
    // MainLayout starts with the drawer open (`_drawerOpen = true`).
    await expect.poll(() => appShell.isDrawerOpen()).toBe(true);

    await appShell.toggleDrawer();
    await expect.poll(() => appShell.isDrawerOpen()).toBe(false);

    await appShell.toggleDrawer();
    await expect.poll(() => appShell.isDrawerOpen()).toBe(true);
  });

  test('app bar exposes no dead "More options" control', async ({ page, homePage }) => {
    await homePage.goto();
    // Regression guard for #135: the actionless MoreVert app-bar button was removed. Re-adding a
    // control with that accessible name (and no effect) should fail here.
    await expect(page.getByRole('button', { name: 'More options' })).toHaveCount(0);
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

  test('an unknown route shows the not-found view inside the layout', async ({ page, appShell }) => {
    await page.goto('/no-such-page');

    await expect(appShell.appBarTitle).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText("Sorry, there's nothing at this address.");
    await expect(page).toHaveTitle('Not found');
  });
});
