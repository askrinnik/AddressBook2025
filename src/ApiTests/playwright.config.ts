import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Local overrides live in .env.local; defaults are documented in .env.example.
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const baseURL = process.env.BASE_URL ?? 'http://localhost:5000/api/';

// webServer needs a readiness URL that answers 200; the contacts list endpoint does.
const readinessURL = new URL('Contacts', baseURL).toString();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html']],
  use: {
    baseURL,
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
