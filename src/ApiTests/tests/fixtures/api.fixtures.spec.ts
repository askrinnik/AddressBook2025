import { StatusCodes } from 'http-status-codes';
import { BaseApiClient } from '../../src/clients/base-api-client.js';
import { ContactsClient } from '../../src/clients/contacts-client.js';
import { ContactFactory } from '../../src/data/contact.factory.js';
import { expect, test } from '../../src/fixtures/api.fixtures.js';

test.describe('api fixtures — smoke', () => {
  test('contactFactory fixture is the ContactFactory class', ({ contactFactory }) => {
    expect(contactFactory).toBe(ContactFactory);
    const contact = contactFactory.validContact();
    expect(contact.firstName.length).toBeGreaterThan(0);
    expect(contact.lastName.length).toBeGreaterThan(0);
  });

  test('contactsClient is a ContactsClient instance', ({ contactsClient }) => {
    expect(contactsClient).toBeInstanceOf(ContactsClient);
  });

  test('successful create() registers the id in createdContacts', async ({
    contactsClient,
    contactFactory,
    createdContacts,
  }) => {
    const before = createdContacts.ids.length;

    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    expect(createdContacts.ids).toHaveLength(before + 1);
    expect(createdContacts.ids).toContain(created.id!);
  });
});

test.describe.serial('contactsClient is per-test (not a singleton)', () => {
  const seen: ContactsClient[] = [];

  test('captures the client instance from the first test', ({ contactsClient }) => {
    seen.push(contactsClient);
    expect(seen).toHaveLength(1);
  });

  test('gets a distinct instance in the second test', ({ contactsClient }) => {
    expect(seen).toHaveLength(1);
    expect(contactsClient).not.toBe(seen[0]);
  });
});

test.describe.serial('auto-cleanup after test teardown', () => {
  const previouslyCreatedIds: number[] = [];

  test('creates a contact through the fixture', async ({ contactsClient, contactFactory }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);
    previouslyCreatedIds.push(created.id!);

    const fetched = await contactsClient.getById(created.id!);
    expect(fetched.status).toBe(StatusCodes.OK);
  });

  test('previously created contact is 404 after teardown', async ({ request }) => {
    expect(previouslyCreatedIds).not.toHaveLength(0);
    const rawClient = new ContactsClient(new BaseApiClient(request));
    for (const id of previouslyCreatedIds) {
      const response = await rawClient.getById(id);
      expect(response.status).toBe(StatusCodes.NOT_FOUND);
    }
  });
});

test('teardown tolerates a contact already deleted inside the test', async ({
  contactsClient,
  contactFactory,
}) => {
  const created = await contactsClient.create(contactFactory.validContact());
  expect(created.status).toBe(StatusCodes.CREATED);

  const deleted = await contactsClient.delete(created.id!);
  expect(deleted.status).toBe(StatusCodes.NO_CONTENT);
  // If teardown throws on the already-deleted id, this test is marked failed post-hoc.
});

test.describe.serial('teardown continues after a failed delete', () => {
  const realIds: number[] = [];

  test('registers an unreachable id then creates a real contact', async ({
    contactsClient,
    contactFactory,
    createdContacts,
  }) => {
    // Larger than int32.MaxValue: fails the {id:int} route constraint → 404, teardown must go on.
    createdContacts.register(Number.MAX_SAFE_INTEGER);

    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);
    realIds.push(created.id!);
  });

  test('real contact from previous test is still cleaned up', async ({ request }) => {
    expect(realIds).not.toHaveLength(0);
    const rawClient = new ContactsClient(new BaseApiClient(request));
    for (const id of realIds) {
      const response = await rawClient.getById(id);
      expect(response.status).toBe(StatusCodes.NOT_FOUND);
    }
  });
});
