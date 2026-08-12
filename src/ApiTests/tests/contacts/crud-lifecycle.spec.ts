import { StatusCodes } from 'http-status-codes';
import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import {
  contactModelSchema,
  getFilteredContactsResponseSchema,
} from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema } from '../../src/utils/assertions.js';

test.describe('Contact CRUD lifecycle', () => {
  test('create → read → update → read → delete → read(404)', async ({
    contactsClient,
    contactFactory,
  }) => {
    // Unique token keeps the search step immune to seed data and parallel runs.
    const token = newTestToken();
    const initial = contactFactory.validContact({ firstName: `Life-${token}` });

    // 1. create
    const created = await contactsClient.create(initial);
    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    // 2. read back the created state
    const afterCreate = await contactsClient.getById(created.id!);
    expect(afterCreate.status).toBe(StatusCodes.OK);
    const createdModel = expectMatchesSchema(afterCreate.body, contactModelSchema);
    expect(createdModel.id).toBe(created.id);
    expect(createdModel.firstName).toBe(initial.firstName);
    expect(createdModel.lastName).toBe(initial.lastName);
    expect(createdModel.birthday).toBe(initial.birthday);

    // 3. the contact is discoverable by its token while it lives
    const listedAlive = await contactsClient.list(token);
    expect(listedAlive.status).toBe(StatusCodes.OK);
    const aliveRows = expectMatchesSchema(listedAlive.body, getFilteredContactsResponseSchema);
    expect(aliveRows.rows.some((row) => row.id === created.id)).toBe(true);

    // 4. update every field (full-replace PUT)
    const updated = contactFactory.validContact({ firstName: `Life2-${token}` });
    const updateResponse = await contactsClient.update(created.id!, updated);
    expect(updateResponse.status).toBe(StatusCodes.NO_CONTENT);

    // 5. read back the updated state
    const afterUpdate = await contactsClient.getById(created.id!);
    expect(afterUpdate.status).toBe(StatusCodes.OK);
    const updatedModel = expectMatchesSchema(afterUpdate.body, contactModelSchema);
    expect(updatedModel.id).toBe(created.id);
    expect(updatedModel.firstName).toBe(updated.firstName);
    expect(updatedModel.lastName).toBe(updated.lastName);
    expect(updatedModel.birthday).toBe(updated.birthday);

    // 6. delete
    const deleteResponse = await contactsClient.delete(created.id!);
    expect(deleteResponse.status).toBe(StatusCodes.NO_CONTENT);

    // 7. the contact is gone
    const afterDelete = await contactsClient.getById(created.id!);
    expect(afterDelete.status).toBe(StatusCodes.NOT_FOUND);

    // 8. and no longer discoverable by its token
    const listedDeleted = await contactsClient.list(token);
    expect(listedDeleted.status).toBe(StatusCodes.OK);
    const deletedRows = expectMatchesSchema(listedDeleted.body, getFilteredContactsResponseSchema);
    expect(deletedRows.rows.some((row) => row.id === created.id)).toBe(false);
  });
});
