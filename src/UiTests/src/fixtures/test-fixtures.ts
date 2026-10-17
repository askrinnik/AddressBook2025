import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { ContactsApi, type CreateContactCommand } from '../api/contacts-api.js';
import type { AppShell } from '../components/app-shell.component.js';
import { env } from '../config/env.js';
import { ContactFactory } from '../data/contact.factory.js';
import { frontends, type Frontend, type FrontendName } from '../frontends/index.js';
import { ContactsPage } from '../pages/contacts.page.js';
import { CreateContactPage } from '../pages/create-contact.page.js';
import { EditContactPage } from '../pages/edit-contact.page.js';
import { HomePage } from '../pages/home.page.js';

/*
 * The UI-test `test.extend`: it injects the page objects, the `AppShell` component, the `app`
 * frontend, the `contactsApi` (hybrid REST seed/cleanup), and the `data` factory, and auto-cleans
 * every contact created through `contactsApi` in teardown. Specs declare only the fixtures they use.
 *
 * The `frontend` option (set per Playwright project) selects the frontend under test; the `app`
 * fixture resolves it to the `Frontend` that supplies readiness and the frontend-specific
 * component objects, so specs and page objects stay shared. Fixtures are lazy: a test builds
 * only the objects it declares.
 *
 * The Playwright `request` fixture is bound to the project's `baseURL` (the frontend), so it is
 * NOT reused for API seeding — the `contactsApi` fixture builds its own `APIRequestContext`
 * against `env.apiURL` instead.
 */
export interface UiOptions {
  /** The frontend under test; each Playwright project sets it. */
  frontend: FrontendName;
}

export interface UiFixtures {
  /** The frontend under test: readiness and the frontend-specific component objects. */
  app: Frontend;
  homePage: HomePage;
  contactsPage: ContactsPage;
  createContactPage: CreateContactPage;
  editContactPage: EditContactPage;
  appShell: AppShell;
  /** Hybrid seed/cleanup API; contacts it creates are auto-deleted in teardown. */
  contactsApi: ContactsApi;
  /** The contact data factory (matches the API's validation limits). */
  data: typeof ContactFactory;
}

// Extends ContactsApi so specs see the same surface; wraps `createContact` to auto-register ids.
class TrackedContactsApi extends ContactsApi {
  constructor(
    request: APIRequestContext,
    private readonly createdIds: Set<number>,
  ) {
    super(request);
  }

  async createContact(command: CreateContactCommand): Promise<number> {
    const id = await super.createContact(command);
    this.createdIds.add(id);
    return id;
  }
}

export const test = base.extend<UiOptions & UiFixtures>({
  frontend: ['blazor', { option: true }],

  app: async ({ frontend }, use) => {
    await use(frontends[frontend]);
  },

  // eslint-disable-next-line no-empty-pattern
  data: async ({}, use) => {
    await use(ContactFactory);
  },

  homePage: async ({ page, app }, use) => {
    await use(new HomePage(page, app));
  },

  contactsPage: async ({ page, app }, use) => {
    await use(new ContactsPage(page, app));
  },

  createContactPage: async ({ page, app }, use) => {
    await use(new CreateContactPage(page, app));
  },

  editContactPage: async ({ page, app }, use) => {
    await use(new EditContactPage(page, app));
  },

  appShell: async ({ page, app }, use) => {
    await use(app.appShell(page));
  },

  // eslint-disable-next-line no-empty-pattern
  contactsApi: async ({}, use) => {
    // Own context against the API (env.apiURL ends with /api/), independent of the page's baseURL.
    const apiContext = await request.newContext({
      baseURL: env.apiURL,
      ignoreHTTPSErrors: true,
    });
    const createdIds = new Set<number>();

    await use(new TrackedContactsApi(apiContext, createdIds));

    // Best-effort teardown: delete every tracked id (deleteContact tolerates 404 = already gone),
    // and keep going past a failure so one bad id cannot leak the rest. Then dispose the context.
    const cleanup = new ContactsApi(apiContext);
    for (const id of createdIds) {
      try {
        await cleanup.deleteContact(id);
      } catch (error) {
        console.warn(`[test-fixtures] cleanup DELETE contact ${id} failed`, error);
      }
    }
    await apiContext.dispose();
  },
});

export { expect };
