import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * App boot smoke: the frontend under test serves its app and reaches the ready state, both on the
 * root route and on a deep link loaded directly (which needs the host's SPA fallback to serve the
 * app for a client-side route).
 */
test.describe('app boot', () => {
  test('boots on the root route', async ({ page, app }) => {
    const response = await page.goto('/');
    expect(response?.ok(), 'the root route should answer with a success status').toBe(true);
    await app.waitForAppReady(page);
  });

  test('boots on a deep link to the contacts route', async ({ page, app }) => {
    const response = await page.goto('/contacts');
    expect(response?.ok(), 'the deep link should be served by the SPA fallback').toBe(true);
    await app.waitForAppReady(page);
    await expect(page).toHaveURL(/\/contacts$/);
  });
});
