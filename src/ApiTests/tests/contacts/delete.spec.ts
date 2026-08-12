import { StatusCodes } from 'http-status-codes';
import { expect, test } from '../../src/fixtures/api.fixtures.js';

test.describe('DELETE /api/Contacts/{id} — existing contact', () => {
  test('deletes a created contact: 204 with empty body, then GET returns 404', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    const deleted = await contactsClient.delete(created.id!);
    expect(deleted.status).toBe(StatusCodes.NO_CONTENT);
    expect(deleted.body).toBeFalsy();

    const read = await contactsClient.getById(created.id!);
    expect(read.status).toBe(StatusCodes.NOT_FOUND);
  });
});

test.describe('DELETE /api/Contacts/{id} — not found', () => {
  test('returns 404 for a contact that was created and already deleted', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const firstDelete = await contactsClient.delete(created.id!);
    expect(firstDelete.status).toBe(StatusCodes.NO_CONTENT);

    const response = await contactsClient.delete(created.id!);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});

test.describe('DELETE /api/Contacts/{id} — idempotency', () => {
  test('first delete is 204, a repeated delete of the same id is 404', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const first = await contactsClient.delete(created.id!);
    expect(first.status).toBe(StatusCodes.NO_CONTENT);

    // deletedRows == 0 on the second call, so the handler reports "not found".
    const second = await contactsClient.delete(created.id!);
    expect(second.status).toBe(StatusCodes.NOT_FOUND);
  });
});

test.describe('DELETE /api/Contacts/{id} — non-numeric id (route constraint)', () => {
  test('returns 404 for a non-numeric id, rejected by the {id:int} route constraint', async ({
    contactsClient,
  }) => {
    const response = await contactsClient.delete('abc');
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});
