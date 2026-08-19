import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env.js';

// CI-ness is a runner concern, not app config, so it stays a direct process.env read.
const isCI = !!process.env.CI;

// webServer readiness needs a URL that answers 200; the contacts list endpoint does.
const apiReadinessURL = new URL('Contacts', env.apiURL).toString();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['list'], ['html']],
  expect: {
    timeout: env.expectTimeout,
  },
  use: {
    baseURL: env.baseURL,
    headless: env.headless,
    ignoreHTTPSErrors: true,
    actionTimeout: env.actionTimeout,
    navigationTimeout: env.navigationTimeout,
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
      url: env.baseURL,
      reuseExistingServer: !isCI,
      ignoreHTTPSErrors: true,
      timeout: 120_000,
    },
  ],
});
