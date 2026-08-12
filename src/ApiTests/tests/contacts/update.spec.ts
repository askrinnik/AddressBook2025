import { StatusCodes } from 'http-status-codes';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import { contactModelSchema } from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema, expectProblemDetails } from '../../src/utils/assertions.js';

const VALIDATION_TITLE = 'Validation Error';
const VALIDATION_DETAIL = 'One or more validation errors occurred';

test.describe('PUT /api/Contacts/{id} — full update', () => {
  test('replaces every field: 204, read-back matches the new values', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.validContact();
    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const read = await contactsClient.getById(created.id!);
    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.id).toBe(created.id);
    expect(parsed.firstName).toBe(update.firstName);
    expect(parsed.lastName).toBe(update.lastName);
    expect(parsed.birthday).toBe(update.birthday);
  });

  test('clears an existing birthday to null: 204, read-back shows null', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.validContactWithoutBirthday();
    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const read = await contactsClient.getById(created.id!);
    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.birthday).toBeNull();
  });

  test('adds a birthday to a contact that had none: 204, read-back shows the date', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContactWithoutBirthday());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.validContact();
    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const read = await contactsClient.getById(created.id!);
    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.birthday).toBe(update.birthday);
  });

  test('changes only firstName while resending the other fields unchanged: 204', async ({
    contactsClient,
    contactFactory,
  }) => {
    const original = contactFactory.validContact();
    const created = await contactsClient.create(original);
    expect(created.status).toBe(StatusCodes.CREATED);

    // PUT is a full replace, so a "partial" change means resending the whole object
    // with only firstName altered.
    const update = { ...original, firstName: contactFactory.validContact().firstName };
    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const read = await contactsClient.getById(created.id!);
    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.firstName).toBe(update.firstName);
    expect(parsed.lastName).toBe(original.lastName);
    expect(parsed.birthday).toBe(original.birthday);
  });
});

test.describe('PUT /api/Contacts/{id} — route id overrides body id', () => {
  test('updates the route resource and leaves the body-id resource untouched', async ({
    contactsClient,
    contactFactory,
  }) => {
    const target = await contactsClient.create(contactFactory.validContact());
    const other = await contactsClient.create(contactFactory.validContact());
    expect(target.status).toBe(StatusCodes.CREATED);
    expect(other.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.validContact();
    // Body carries the *other* contact's id; the controller must overwrite it with the route id.
    const response = await contactsClient.update(target.id!, { ...update, id: other.id! });
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const readTarget = expectMatchesSchema(
      (await contactsClient.getById(target.id!)).body,
      contactModelSchema,
    );
    expect(readTarget.firstName).toBe(update.firstName);
    expect(readTarget.lastName).toBe(update.lastName);

    const readOther = expectMatchesSchema(
      (await contactsClient.getById(other.id!)).body,
      contactModelSchema,
    );
    expect(readOther.firstName).not.toBe(update.firstName);
  });
});

test.describe('PUT /api/Contacts/{id} — not found', () => {
  test('returns 404 when updating a freshly deleted contact', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const deleted = await contactsClient.delete(created.id!);
    expect(deleted.status).toBe(StatusCodes.NO_CONTENT);

    const response = await contactsClient.update(created.id!, contactFactory.validContact());
    expect(response.status).toBe(StatusCodes.NOT_FOUND);
  });
});

test.describe('PUT /api/Contacts/{id} — length boundaries', () => {
  test('accepts a firstName of exactly 30 characters: 204', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.firstName30Chars();
    expect(update.firstName).toHaveLength(30);

    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const parsed = expectMatchesSchema(
      (await contactsClient.getById(created.id!)).body,
      contactModelSchema,
    );
    expect(parsed.firstName).toBe(update.firstName);
    expect(parsed.firstName).toHaveLength(30);
  });

  test('accepts a lastName of exactly 30 characters: 204', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.lastName30Chars();
    expect(update.lastName).toHaveLength(30);

    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const parsed = expectMatchesSchema(
      (await contactsClient.getById(created.id!)).body,
      contactModelSchema,
    );
    expect(parsed.lastName).toBe(update.lastName);
    expect(parsed.lastName).toHaveLength(30);
  });

  test('rejects a firstName of 31 characters: 400 with problem-details for FirstName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.firstName31Chars();
    expect(update.firstName).toHaveLength(31);

    const response = await contactsClient.update(created.id!, update);
    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'FirstName',
    });
  });

  test('rejects a lastName of 31 characters: 400 with problem-details for LastName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.lastName31Chars();
    expect(update.lastName).toHaveLength(31);

    const response = await contactsClient.update(created.id!, update);
    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'LastName',
    });
  });
});

test.describe('PUT /api/Contacts/{id} — empty required fields', () => {
  test('rejects an empty firstName: 400 with problem-details for FirstName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.update(created.id!, contactFactory.emptyFirstName());
    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'FirstName',
    });
  });

  test('rejects an empty lastName: 400 with problem-details for LastName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.update(created.id!, contactFactory.emptyLastName());
    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'LastName',
    });
  });
});

test.describe('PUT /api/Contacts/{id} — birthday validation', () => {
  test('rejects a future birthday: 400 with the expected Birthday message', async ({
    contactsClient,
    contactFactory,
  }) => {
    const created = await contactsClient.create(contactFactory.validContact());
    expect(created.status).toBe(StatusCodes.CREATED);

    const response = await contactsClient.update(created.id!, contactFactory.birthdayInFuture());
    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'Birthday',
      message: 'Birthday cannot be in the future',
    });
  });

  test("accepts today's date as birthday: 204", async ({ contactsClient, contactFactory }) => {
    const created = await contactsClient.create(contactFactory.validContactWithoutBirthday());
    expect(created.status).toBe(StatusCodes.CREATED);

    const update = contactFactory.birthdayToday();
    const response = await contactsClient.update(created.id!, update);
    expect(response.status).toBe(StatusCodes.NO_CONTENT);

    const parsed = expectMatchesSchema(
      (await contactsClient.getById(created.id!)).body,
      contactModelSchema,
    );
    expect(parsed.birthday).toBe(update.birthday);
  });
});
