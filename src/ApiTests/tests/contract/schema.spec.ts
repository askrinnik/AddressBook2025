import { StatusCodes } from 'http-status-codes';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import {
  contactModelSchema,
  getFilteredContactsResponseSchema,
  problemDetailsSchema,
} from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema } from '../../src/utils/assertions.js';

test.describe('Contract — GET /api/Contacts (list)', () => {
  test('list response matches getFilteredContactsResponseSchema', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.list();
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, getFilteredContactsResponseSchema);
    expect(parsed.rows).toHaveLength(parsed.totalRows);
    expect(parsed.rows.some((row) => row.id === created.id)).toBe(true);
  });
});

test.describe('Contract — GET /api/Contacts/{id}', () => {
  test('contact with a birthday matches contactModelSchema', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.getById(created.id!);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, contactModelSchema);
    expect(parsed.birthday).not.toBeNull();
  });

  test('contact without a birthday matches contactModelSchema (birthday null)', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContactWithoutBirthday());
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.getById(created.id!);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, contactModelSchema);
    expect(parsed.birthday).toBeNull();
  });
});

test.describe('Contract — validation 400 → problem-details', () => {
  test('create validation error matches problemDetailsSchema', async ({
    contactsClient,
    contactFactory,
  }) => {
    const response = await contactsClient.create(contactFactory.emptyFirstName());
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);

    expectMatchesSchema(response.body, problemDetailsSchema);
  });

  test('update validation error matches problemDetailsSchema', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    // Validation runs before the existence check, so an invalid body yields 400 (not 404).
    const response = await contactsClient.update(created.id!, contactFactory.emptyLastName());
    expect(response.status).toBe(StatusCodes.BAD_REQUEST);

    expectMatchesSchema(response.body, problemDetailsSchema);
  });
});
