import { defineConfig } from '@playwright/test';
import { env } from './src/config/env.js';

// webServer needs a readiness URL that answers 200; the contacts list endpoint does.
const readinessURL = new URL('Contacts', env.baseURL).toString();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html']],
  timeout: env.apiTimeout,
  expect: {
    timeout: env.expectTimeout,
  },
  use: {
    baseURL: env.baseURL,
    trace: 'on-first-retry',
  },

  /* Single project — these are HTTP API tests, so a browser engine is irrelevant. */
  projects: [
    {
      name: 'api',
    },
  ],

  /* Start the API before the tests; reuse a running instance during local runs. */
  webServer: {
    command: 'dotnet run --project ../AddressBook.Api',
    url: readinessURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
