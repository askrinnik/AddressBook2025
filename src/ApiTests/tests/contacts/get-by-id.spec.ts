import { StatusCodes } from 'http-status-codes';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import { contactModelSchema } from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema } from '../../src/utils/assertions.js';

test.describe('GET /api/Contacts/{id}', () => {
  test("returns 200 with the created contact's fields", async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.validContact();
    const created = await contactsClient.create(payload);
    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    const response = await contactsClient.getById(created.id!);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, contactModelSchema);
    expect(parsed.id).toBe(created.id);
    expect(parsed.firstName).toBe(payload.firstName);
    expect(parsed.lastName).toBe(payload.lastName);
    expect(parsed.birthday).toBe(payload.birthday);
  });

  test('returns 404 for a freshly deleted contact', async ({ contactsClient, contactFactory }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const deleted = await contactsClient.delete(created.id!);
    expect(deleted.status).toBe(StatusCodes.NO_CONTENT);

    const response = await contactsClient.getById(created.id!);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 404 for a non-numeric id (route constraint)', async ({ contactsClient }) => {
    const response = await contactsClient.getById('abc');
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });

  test('returns 404 for an id that overflows int32 (route constraint)', async ({
    contactsClient,
  }) => {
    const response = await contactsClient.getById(Number.MAX_SAFE_INTEGER);
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});
