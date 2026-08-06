import { test as base, expect } from '@playwright/test';
import { BaseApiClient } from '../clients/base-api-client.js';
import {
  ContactsClient,
  type CreateContactCommand,
  type CreateContactResult,
} from '../clients/contacts-client.js';
import { ContactFactory } from '../data/contact.factory.js';

export interface CreatedContactTracker {
  register(id: number): void;
  readonly ids: readonly number[];
}

export interface ApiFixtures {
  contactsClient: ContactsClient;
  contactFactory: typeof ContactFactory;
  createdContacts: CreatedContactTracker;
}

class InMemoryCreatedContactTracker implements CreatedContactTracker {
  private readonly registered = new Set<number>();

  register(id: number): void {
    this.registered.add(id);
  }

  get ids(): readonly number[] {
    return [...this.registered];
  }
}

// Extends ContactsClient so tests see the same public surface; wraps `create` to auto-register.
class TrackedContactsClient extends ContactsClient {
  constructor(
    baseClient: BaseApiClient,
    private readonly tracker: CreatedContactTracker,
  ) {
    super(baseClient);
  }

  async create(command: CreateContactCommand): Promise<CreateContactResult> {
    const result = await super.create(command);
    if (typeof result.id === 'number') this.tracker.register(result.id);
    return result;
  }
}

export const test = base.extend<ApiFixtures>({
  // Playwright inspects the source to detect fixture dependencies, so the empty destructuring
  // pattern is required for zero-dependency fixtures.
  // eslint-disable-next-line no-empty-pattern
  contactFactory: async ({}, use) => {
    await use(ContactFactory);
  },

  // eslint-disable-next-line no-empty-pattern
  createdContacts: async ({}, use) => {
    await use(new InMemoryCreatedContactTracker());
  },

  contactsClient: async ({ request, createdContacts }, use) => {
    const rawBase = new BaseApiClient(request);
    const client = new TrackedContactsClient(rawBase, createdContacts);

    await use(client);

    // Best-effort teardown: try to delete every tracked id; swallow 404 (already gone),
    // log anything else so an unexpected cleanup failure surfaces without failing the test.
    const cleanup = new ContactsClient(rawBase);
    for (const id of createdContacts.ids) {
      try {
        const response = await cleanup.delete(id);
        if (response.status !== 204 && response.status !== 404) {
          console.warn(
            `[api.fixtures] cleanup DELETE /Contacts/${id} returned ${response.status}`,
          );
        }
      } catch (error) {
        console.warn(`[api.fixtures] cleanup DELETE /Contacts/${id} threw`, error);
      }
    }
  },
});

export { expect };
