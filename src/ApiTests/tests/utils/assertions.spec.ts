import { StatusCodes } from 'http-status-codes';
import { expect, test } from '../../src/fixtures/api.fixtures.js';
import {
  contactModelSchema,
  getFilteredContactsResponseSchema,
} from '../../src/schemas/contact.schema.js';
import { expectMatchesSchema, expectProblemDetails } from '../../src/utils/assertions.js';

interface FakeApiResponse {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

function fakeResponse(status: number, body: unknown): FakeApiResponse {
  return { status, headers: {}, body };
}

const validValidationProblemBody = {
  type: 'https://tools.ietf.org/html/rfc7231#section-6.5.1',
  title: 'Validation Error',
  status: 400,
  detail: 'One or more validation errors occurred',
  errors: {
    FirstName: ["'First Name' must not be empty."],
    LastName: ["'Last Name' must not be empty."],
  },
  traceId: '00-abc-01',
};

function catchError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the function to throw, but it returned normally');
}

test.describe('expectMatchesSchema — unit', () => {
  test('returns typed data when body matches schema', () => {
    const parsed = expectMatchesSchema(
      { id: 1, firstName: 'A', lastName: 'B', birthday: null },
      contactModelSchema,
    );
    expect(parsed.id).toBe(1);
    expect(parsed.firstName).toBe('A');
    expect(parsed.birthday).toBeNull();
  });

  test('parses a list-response body against getFilteredContactsResponseSchema', () => {
    const parsed = expectMatchesSchema(
      {
        totalRows: 1,
        rows: [{ id: 42, firstName: 'X', lastName: 'Y', birthday: '2000-01-01' }],
      },
      getFilteredContactsResponseSchema,
    );
    expect(parsed.totalRows).toBe(1);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].id).toBe(42);
  });

  test('throws a readable message listing every failing path when body is invalid', () => {
    const error = catchError(() =>
      expectMatchesSchema({ id: 'not-a-number', lastName: 5 }, contactModelSchema),
    );
    expect(error.message).toContain('Response body does not match schema');
    expect(error.message).toContain('id');
    expect(error.message).toContain('firstName');
    expect(error.message).toContain('lastName');
    expect(error.message).toContain('Actual body');
  });
});

test.describe('expectMatchesSchema — live via ContactsClient', () => {
  test('accepts a GET /Contacts/{id} response as ContactModel', async ({
    contactsClient,
    contactFactory,
  }) => {
    const payload = contactFactory.validContact();
    const created = await contactsClient.create(payload);
    expect(created.status).toBe(StatusCodes.CREATED);

    const fetched = await contactsClient.getById(created.id!);
    expect(fetched.status).toBe(StatusCodes.OK);

    const parsed = expectMatchesSchema(fetched.body, contactModelSchema);
    expect(parsed.id).toBe(created.id);
    expect(parsed.firstName).toBe(payload.firstName);
  });

  test('accepts a GET /Contacts list response as GetFilteredContactsResponse', async ({
    contactsClient,
  }) => {
    const list = await contactsClient.list();
    expect(list.status).toBe(StatusCodes.OK);
    const parsed = expectMatchesSchema(list.body, getFilteredContactsResponseSchema);
    expect(parsed.totalRows).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(parsed.rows)).toBe(true);
  });
});

test.describe('expectProblemDetails — unit', () => {
  test('accepts a valid 400 problem-details with just a status', () => {
    const pd = expectProblemDetails(
      fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody),
      { status: StatusCodes.BAD_REQUEST },
    );
    expect(pd.title).toBe('Validation Error');
    expect(pd.hasErrors()).toBe(true);
  });

  test('accepts { property } when errors[property] is present', () => {
    const pd = expectProblemDetails(
      fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody),
      { status: StatusCodes.BAD_REQUEST, property: 'FirstName' },
    );
    expect(pd.messagesFor('FirstName')).not.toHaveLength(0);
  });

  test('accepts { property, message } as exact string', () => {
    expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody), {
      status: StatusCodes.BAD_REQUEST,
      property: 'FirstName',
      message: "'First Name' must not be empty.",
    });
  });

  test('accepts { property, message } as RegExp', () => {
    expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody), {
      status: StatusCodes.BAD_REQUEST,
      property: 'FirstName',
      message: /must not be empty/i,
    });
  });

  test('accepts { title, detail } for exact metadata match', () => {
    expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody), {
      status: StatusCodes.BAD_REQUEST,
      title: 'Validation Error',
      detail: 'One or more validation errors occurred',
    });
  });

  test('fails readably on wrong status', () => {
    const error = catchError(() =>
      expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody), {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
      }),
    );
    expect(error.message).toContain('Expected status 500, got 400');
  });

  test('fails readably when the target property has no errors', () => {
    const error = catchError(() =>
      expectProblemDetails(
        fakeResponse(StatusCodes.BAD_REQUEST, {
          ...validValidationProblemBody,
          errors: { LastName: ['too long'] },
        }),
        { status: StatusCodes.BAD_REQUEST, property: 'FirstName' },
      ),
    );
    expect(error.message).toContain('FirstName');
    expect(error.message).toContain('LastName');
  });

  test('fails readably when the message matcher does not match', () => {
    const error = catchError(() =>
      expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody), {
        status: StatusCodes.BAD_REQUEST,
        property: 'FirstName',
        message: /nonsense/,
      }),
    );
    expect(error.message).toContain('FirstName');
    expect(error.message).toContain('nonsense');
  });

  test('fails readably when title does not match', () => {
    const error = catchError(() =>
      expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, validValidationProblemBody), {
        status: StatusCodes.BAD_REQUEST,
        title: 'Other Error',
      }),
    );
    expect(error.message).toContain('Other Error');
    expect(error.message).toContain('Validation Error');
  });

  test('fails readably when body is not a valid problem-details', () => {
    const error = catchError(() =>
      expectProblemDetails(fakeResponse(StatusCodes.BAD_REQUEST, { errors: 'not-an-object' }), {
        status: StatusCodes.BAD_REQUEST,
      }),
    );
    expect(error.message).toContain('not a valid RFC 7807 problem-details');
  });
});

test.describe('expectProblemDetails — live via ContactsClient', () => {
  test('validates the 400 from emptyFirstName()', async ({ contactsClient, contactFactory }) => {
    const response = await contactsClient.create(contactFactory.emptyFirstName());
    const pd = expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      title: 'Validation Error',
      detail: 'One or more validation errors occurred',
      property: 'FirstName',
      message: /must not be empty/i,
    });
    expect(pd.hasErrors()).toBe(true);
  });

  test('validates the 400 from birthdayInFuture()', async ({ contactsClient, contactFactory }) => {
    const response = await contactsClient.create(contactFactory.birthdayInFuture());
    expectProblemDetails(response, {
      status: StatusCodes.BAD_REQUEST,
      property: 'Birthday',
      message: 'Birthday cannot be in the future',
    });
  });
});
