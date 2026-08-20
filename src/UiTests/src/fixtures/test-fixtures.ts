import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { ContactsApi, type CreateContactCommand } from '../api/contacts-api.js';
import { AppShell } from '../components/app-shell.component.js';
import { env } from '../config/env.js';
import { ContactFactory } from '../data/contact.factory.js';
import { ContactsPage } from '../pages/contacts.page.js';
import { CreateContactPage } from '../pages/create-contact.page.js';
import { EditContactPage } from '../pages/edit-contact.page.js';
import { HomePage } from '../pages/home.page.js';

/*
 * The UI-test `test.extend`: it injects the U8 page objects, the U7 `AppShell` component, the
 * U5 `contactsApi` (hybrid REST seed/cleanup), and the U6 `data` factory, and auto-cleans every
 * contact created through `contactsApi` in teardown. Specs declare only the fixtures they use.
 *
 * The Playwright `request` fixture is bound to `baseURL = env.baseURL` (the Web app), so it is
 * NOT reused for API seeding — the `contactsApi` fixture builds its own `APIRequestContext`
 * against `env.apiURL` instead. This is the wiring the U5 `ContactsApi` left to "the fixture".
 */
export interface UiFixtures {
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

export const test = base.extend<UiFixtures>({
  // eslint-disable-next-line no-empty-pattern
  data: async ({}, use) => {
    await use(ContactFactory);
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  contactsPage: async ({ page }, use) => {
    await use(new ContactsPage(page));
  },

  createContactPage: async ({ page }, use) => {
    await use(new CreateContactPage(page));
  },

  editContactPage: async ({ page }, use) => {
    await use(new EditContactPage(page));
  },

  appShell: async ({ page }, use) => {
    await use(new AppShell(page));
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
