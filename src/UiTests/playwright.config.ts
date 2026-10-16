import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { env } from './src/config/env.js';
import type { UiOptions } from './src/fixtures/test-fixtures.js';

// CI-ness is a runner concern, not app config, so it stays a direct process.env read.
const isCI = !!process.env.CI;

// webServer readiness needs a URL that answers 200; the contacts list endpoint does.
const apiReadinessURL = new URL('Contacts', env.apiURL).toString();

const vueProjectDir = fileURLToPath(new URL('../AddressBook.Vue/', import.meta.url));

/*
 * The specs the `vue` project runs. A spec joins this list once the Vue component objects it
 * uses are implemented; until then the Vue stubs throw. `blazor` runs every spec.
 */
const vueSpecs = [
  'smoke/app-boot.spec.ts',
  'smoke/app-shell.spec.ts',
  'smoke/app-shell-navigation.spec.ts',
  'contacts/list-search.spec.ts',
  'contacts/sort-paginate.spec.ts',
  'contacts/delete.spec.ts',
];

export default defineConfig<UiOptions>({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  // Locally one retry self-heals a rare Blazor WASM cold-start miss, and capping workers tames the
  // first-load thundering herd on the dev servers (see #138). CI stays serialized with more retries.
  retries: isCI ? 2 : 1,
  workers: isCI ? 1 : 4,
  reporter: [['list'], ['html']],
  expect: {
    timeout: env.expectTimeout,
  },
  use: {
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
      name: 'blazor',
      use: { ...devices['Desktop Chrome'], baseURL: env.baseURL, frontend: 'blazor' },
    },
    {
      name: 'vue',
      testMatch: vueSpecs,
      use: { ...devices['Desktop Chrome'], baseURL: env.vueBaseURL, frontend: 'vue' },
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
   * Start the API and both frontends before the tests; reuse already-running instances locally.
   * Playwright starts every entry whatever `--project` selects. The API starts first — the Blazor
   * dev config (wwwroot/appsettings.Development.json) and the Vue build's fallback both point the
   * API prefix at http://localhost:5000/api/.
   *
   * Vue is served as a production build by `vite preview`, not by the dev server: the dev server
   * answers 504 "Outdated Optimize Dep" on a first load while it re-optimises Vuetify's lazily
   * imported components. `vite preview` also serves the SPA fallback for deep links.
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
    {
      command: 'npm run build && npm run preview',
      cwd: vueProjectDir,
      url: env.vueBaseURL,
      reuseExistingServer: !isCI,
      timeout: 120_000,
    },
  ],
});
