import { StatusCodes } from 'http-status-codes';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import { contactModelSchema } from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema, expectProblemDetails } from '../../src/utils/assertions.js';

const VALIDATION_TITLE = 'Validation Error';
const VALIDATION_DETAIL = 'One or more validation errors occurred';

test.describe('POST /api/Contacts — happy path', () => {
  test('creates a valid contact with birthday: 201, id from Location, read-back matches', async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.validContact();
    const created = await contactsClient.create(payload);

    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.body).toBeFalsy(); // 201 carries no body — id lives in the Location header
    expect(created.id).toBeGreaterThan(0);

    const read = await contactsClient.getById(created.id!);
    expect(read.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.id).toBe(created.id);
    expect(parsed.firstName).toBe(payload.firstName);
    expect(parsed.lastName).toBe(payload.lastName);
    expect(parsed.birthday).toBe(payload.birthday);
  });

  test('creates a valid contact without birthday: 201, birthday === null', async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.validContactWithoutBirthday();
    const created = await contactsClient.create(payload);

    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    const read = await contactsClient.getById(created.id!);
    expect(read.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.birthday).toBeNull();
  });

  test("accepts today's date as birthday: 201", async ({ contactsClient, contactFactory }) => {
    const payload = contactFactory.birthdayToday();
    const created = await contactsClient.create(payload);

    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    const read = await contactsClient.getById(created.id!);
    expect(read.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.birthday).toBe(payload.birthday);
  });
});

test.describe('POST /api/Contacts — length boundaries', () => {
  test('accepts a firstName of exactly 30 characters: 201', async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.firstName30Chars();
    expect(payload.firstName).toHaveLength(30);

    const created = await contactsClient.create(payload);
    expect(created.status).toBe(StatusCodes.CREATED);

    const read = await contactsClient.getById(created.id!);
    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.firstName).toHaveLength(30);
    expect(parsed.firstName).toBe(payload.firstName);
  });

  test('accepts a lastName of exactly 30 characters: 201', async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.lastName30Chars();
    expect(payload.lastName).toHaveLength(30);

    const created = await contactsClient.create(payload);
    expect(created.status).toBe(StatusCodes.CREATED);

    const read = await contactsClient.getById(created.id!);
    const parsed = expectMatchesSchema(read.body, contactModelSchema);
    expect(parsed.lastName).toHaveLength(30);
    expect(parsed.lastName).toBe(payload.lastName);
  });

  test('rejects a firstName of 31 characters: 400 with problem-details for FirstName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.firstName31Chars();
    expect(payload.firstName).toHaveLength(31);

    const response = await contactsClient.create(payload);

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
    const payload = contactFactory.lastName31Chars();
    expect(payload.lastName).toHaveLength(31);

    const response = await contactsClient.create(payload);

    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'LastName',
    });
  });
});

test.describe('POST /api/Contacts — empty required fields', () => {
  test('rejects an empty firstName: 400 with problem-details for FirstName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const response = await contactsClient.create(contactFactory.emptyFirstName());

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
    const response = await contactsClient.create(contactFactory.emptyLastName());

    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'LastName',
    });
  });
});

test.describe('POST /api/Contacts — birthday validation', () => {
  test('rejects a future birthday: 400 with the expected Birthday message', async ({
    contactsClient,
    contactFactory,
  }) => {
    const response = await contactsClient.create(contactFactory.birthdayInFuture());

    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'Birthday',
      message: 'Birthday cannot be in the future',
    });
  });
});

test.describe('POST /api/Contacts — whitespace-only names', () => {
  // The plan flagged "   " as a bug candidate (assumed to pass NotEmpty and be stored empty).
  // Actual behaviour: FluentValidation's NotEmpty treats a whitespace-only string as empty,
  // so the API correctly rejects it with 400 before the handler's Trim() ever runs.
  test('rejects a whitespace-only firstName: 400 with problem-details for FirstName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const response = await contactsClient.create(contactFactory.whitespaceFirstName());

    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'FirstName',
    });
  });

  test('rejects a whitespace-only lastName: 400 with problem-details for LastName', async ({
    contactsClient,
    contactFactory,
  }) => {
    const response = await contactsClient.create(contactFactory.whitespaceLastName());

    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: VALIDATION_TITLE,
      detail: VALIDATION_DETAIL,
      property: 'LastName',
    });
  });
});
