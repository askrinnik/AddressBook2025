import { expect, test } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';
import { BaseApiClient } from '../../src/clients/base-api-client.js';
import { ContactsClient } from '../../src/clients/contacts-client.js';
import { ProblemDetails } from '../../src/models/problem-details.js';
import { problemDetailsSchema } from '../../src/schemas/contact.schema.js';

test.describe('ProblemDetails helper — live 400 from POST /api/Contacts', () => {
  test('parses validation errors into typed fields and messagesFor()', async ({ request }) => {
    const contacts = new ContactsClient(new BaseApiClient(request));
    // Future date guarantees the "Birthday cannot be in the future" rule fires deterministically.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const response = await contacts.create({
      firstName: '',
      lastName: 'X'.repeat(31),
      birthday: tomorrow,
    });

    expect(response.status).toBe(StatusCodes.BAD_REQUEST);

    const pd = ProblemDetails.fromJSON(response.body);

    expect(pd.status).toBe(StatusCodes.BAD_REQUEST);
    expect(pd.title).toBe('Validation Error');
    expect(pd.detail).toBe('One or more validation errors occurred');
    expect(pd.hasErrors()).toBe(true);
    expect(pd.messagesFor('FirstName').length).toBeGreaterThan(0);
    expect(pd.messagesFor('LastName').length).toBeGreaterThan(0);
    expect(pd.messagesFor('Birthday')).toContain('Birthday cannot be in the future');
    expect(pd.messages.length).toBeGreaterThanOrEqual(3);
    // T4 schema compatibility: the same body must round-trip through the zod schema.
    expect(() => problemDetailsSchema.parse(response.body)).not.toThrow();
  });
});

test.describe('ProblemDetails helper — fixed payloads', () => {
  test('accepts errors as Record<string, string[]> and returns per-property messages', () => {
    const pd = ProblemDetails.fromJSON({
      title: 'Validation Error',
      status: 400,
      errors: {
        FirstName: ['must not be empty'],
        Birthday: ['must be in the past', 'must be a valid date'],
      },
    });

    expect(pd.hasErrors()).toBe(true);
    expect(pd.messagesFor('FirstName')).toEqual(['must not be empty']);
    expect(pd.messagesFor('Birthday')).toEqual(['must be in the past', 'must be a valid date']);
    expect(pd.messagesFor('Missing')).toEqual([]);
    expect(pd.messages).toEqual(
      expect.arrayContaining([
        'must not be empty',
        'must be in the past',
        'must be a valid date',
      ]),
    );
    expect(pd.messages).toHaveLength(3);
  });

  test('accepts errors as flat string[] with messagesFor() returning empty', () => {
    const pd = ProblemDetails.fromJSON({
      title: 'Bad Request',
      status: 400,
      errors: ['general failure', 'try again later'],
    });

    expect(pd.hasErrors()).toBe(true);
    expect(pd.messages).toEqual(['general failure', 'try again later']);
    expect(pd.messagesFor('FirstName')).toEqual([]);
  });

  test('treats missing errors as no errors', () => {
    const pd = ProblemDetails.fromJSON({ title: 'Not Found', status: 404 });

    expect(pd.errors).toBeUndefined();
    expect(pd.messages).toEqual([]);
    expect(pd.hasErrors()).toBe(false);
    expect(pd.messagesFor('anything')).toEqual([]);
  });

  test('coerces numeric-string status and preserves other string fields', () => {
    const pd = ProblemDetails.fromJSON({
      type: 'https://example.com/problem',
      title: 'Bad Request',
      status: '400',
      detail: 'nope',
      instance: '/api/Contacts',
    });

    expect(pd.status).toBe(400);
    expect(pd.type).toBe('https://example.com/problem');
    expect(pd.detail).toBe('nope');
    expect(pd.instance).toBe('/api/Contacts');
  });

  test('is resilient to garbage input (null, non-objects, wrong error shape)', () => {
    const garbageInputs: unknown[] = [
      null,
      undefined,
      'not-an-object',
      42,
      [],
      { errors: 123 },
      { errors: { FirstName: 'not-an-array' } },
      { status: 'not-a-number' },
    ];

    for (const input of garbageInputs) {
      const pd = ProblemDetails.fromJSON(input);
      expect(pd).toBeInstanceOf(ProblemDetails);
      expect(pd.hasErrors()).toBe(false);
      expect(pd.messages).toEqual([]);
      expect(pd.messagesFor('any')).toEqual([]);
    }
  });
});
