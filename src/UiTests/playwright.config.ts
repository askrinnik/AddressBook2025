import { defineConfig, devices } from '@playwright/test';

/*
 * Configuration is read directly from process.env with defaults here.
 * The typed zod/dotenv loader (src/config/env.ts) is introduced in U3 (#94);
 * once it exists this config will be refactored to import it.
 */
const isCI = !!process.env.CI;

// Web app under test (Blazor WASM, https launch profile).
const baseURL = process.env.BASE_URL ?? 'https://localhost:7187/';
// API used for hybrid seed/cleanup and as the webServer readiness probe.
const apiURL = process.env.API_URL ?? 'http://localhost:5000/api/';
const headless = (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false';

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const expectTimeout = num(process.env.EXPECT_TIMEOUT, 10_000);
const actionTimeout = num(process.env.ACTION_TIMEOUT, 15_000);
const navigationTimeout = num(process.env.NAVIGATION_TIMEOUT, 30_000);

// webServer readiness needs a URL that answers 200; the contacts list endpoint does.
const apiReadinessURL = new URL('Contacts', apiURL).toString();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['list'], ['html']],
  expect: {
    timeout: expectTimeout,
  },
  use: {
    baseURL,
    headless,
    ignoreHTTPSErrors: true,
    actionTimeout,
    navigationTimeout,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /*
     * Optional cross-browser projects. Enable and run
     * `npx playwright install firefox webkit` to use them.
     *
     * { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
     * { name: 'webkit', use: { ...devices['Desktop Safari'] } },
     */
  ],

  /*
   * Start both servers before the tests; reuse already-running instances locally.
   * The API starts first — the Web dev config (wwwroot/appsettings.Development.json)
   * points API_Prefix at http://localhost:5000/api/.
   */
  webServer: [
    {
      command: 'dotnet run --project ../AddressBook.Api',
      url: apiReadinessURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
    {
      command: 'dotnet run --project ../AddressBook.Web --launch-profile https',
      url: baseURL,
      reuseExistingServer: !isCI,
      ignoreHTTPSErrors: true,
      timeout: 120_000,
    },
  ],
});
