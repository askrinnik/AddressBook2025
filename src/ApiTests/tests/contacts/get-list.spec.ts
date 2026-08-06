import { StatusCodes } from 'http-status-codes';
import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import { getFilteredContactsResponseSchema } from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema } from '../../src/utils/assertions.js';

test.describe('GET /api/Contacts — list', () => {
  test('returns 200 with valid schema; TotalRows === Rows.length; includes the created contact', async ({
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

test.describe('GET /api/Contacts?search — search', () => {
  test('by a unique local token returns exactly the created contacts', async ({
    contactsClient,
    contactFactory,
  }) => {
    const token = newTestToken();
    const a = await contactsClient.create(contactFactory.validContact({ firstName: `A-${token}` }));
    const b = await contactsClient.create(contactFactory.validContact({ firstName: `B-${token}` }));
    expect(a.status).toBe(StatusCodes.CREATED);
    expect(b.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.list(token);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, getFilteredContactsResponseSchema);
    expect(parsed.totalRows).toBe(2);
    expect(parsed.rows).toHaveLength(2);
    const foundIds = parsed.rows.map((row) => row.id).sort((x, y) => x - y);
    const expectedIds = [a.id!, b.id!].sort((x, y) => x - y);
    expect(foundIds).toEqual(expectedIds);
  });

  test('by an unknown token returns an empty result', async ({ contactsClient }) => {
    // Freshly generated token never used in any create() call — cannot match anything.
    const unknown = newTestToken();

    const response = await contactsClient.list(unknown);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, getFilteredContactsResponseSchema);
    expect(parsed.totalRows).toBe(0);
    expect(parsed.rows).toHaveLength(0);
  });

  test('with an ampersand is URL-encoded correctly and finds the marker contact', async ({
    contactsClient,
    contactFactory,
  }) => {
    const marker = `Q&A-${newTestToken()}`;
    const created = await contactsClient.create(
      contactFactory.validContact({ firstName: marker }),
    );
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.list(marker);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, getFilteredContactsResponseSchema);
    expect(parsed.totalRows).toBe(1);
    expect(parsed.rows[0].id).toBe(created.id);
    expect(parsed.rows[0].firstName).toBe(marker);
  });

  test('with spaces is URL-encoded correctly and finds the marker contact', async ({
    contactsClient,
    contactFactory,
  }) => {
    const marker = `Hi There ${newTestToken()}`;
    const created = await contactsClient.create(
      contactFactory.validContact({ firstName: marker }),
    );
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.list(marker);
    expect(response.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(response.body, getFilteredContactsResponseSchema);
    expect(parsed.totalRows).toBe(1);
    expect(parsed.rows[0].id).toBe(created.id);
    expect(parsed.rows[0].firstName).toBe(marker);
  });
});
