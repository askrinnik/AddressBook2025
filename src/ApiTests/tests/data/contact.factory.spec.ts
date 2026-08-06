import { expect, test } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';
import { BaseApiClient } from '../../src/clients/base-api-client.js';
import { ContactsClient } from '../../src/clients/contacts-client.js';
import { ContactFactory } from '../../src/data/contact.factory.js';
import { RUN_TOKEN, newTestToken } from '../../src/data/tokens.js';
import { contactModelSchema } from '../../src/schemas/contact.schema.js';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BASE36 = /^[a-z0-9]+$/;

function todayIsoLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

test.describe('tokens', () => {
  test('RUN_TOKEN is a 6-char base36 string', () => {
    expect(RUN_TOKEN).toHaveLength(6);
    expect(RUN_TOKEN).toMatch(BASE36);
  });

  test('newTestToken() returns unique values sharing the RUN_TOKEN prefix', () => {
    const generated = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      const token = newTestToken();
      expect(token.startsWith(`${RUN_TOKEN}-`)).toBe(true);
      generated.add(token);
    }
    expect(generated.size).toBe(1000);
  });
});

test.describe('contact.factory — valid variants (unit)', () => {
  test('validContact() produces valid names <= 30 chars with a past birthday containing RUN_TOKEN', () => {
    const contact = ContactFactory.validContact();

    expect(contact.firstName.length).toBeGreaterThan(0);
    expect(contact.firstName.length).toBeLessThanOrEqual(30);
    expect(contact.lastName.length).toBeGreaterThan(0);
    expect(contact.lastName.length).toBeLessThanOrEqual(30);
    expect(contact.firstName).toContain(RUN_TOKEN);
    expect(contact.lastName).toContain(RUN_TOKEN);
    expect(contact.birthday).toMatch(ISO_DATE);
    expect(contact.birthday! <= todayIsoLocal()).toBe(true);
  });

  test('validContactWithoutBirthday() sets birthday to null and keeps names valid', () => {
    const contact = ContactFactory.validContactWithoutBirthday();

    expect(contact.birthday).toBeNull();
    expect(contact.firstName.length).toBeLessThanOrEqual(30);
    expect(contact.lastName.length).toBeLessThanOrEqual(30);
    expect(contact.firstName).toContain(RUN_TOKEN);
  });

  test('overrides take precedence over generated defaults', () => {
    const overridden = ContactFactory.validContact({ firstName: 'Custom', birthday: null });

    expect(overridden.firstName).toBe('Custom');
    expect(overridden.birthday).toBeNull();
    expect(overridden.lastName).toContain(RUN_TOKEN);
  });
});

test.describe('contact.factory — length boundaries (unit)', () => {
  test('firstName30Chars() sets firstName to exactly 30 characters; lastName stays valid', () => {
    const c = ContactFactory.firstName30Chars();
    expect(c.firstName).toHaveLength(30);
    expect(c.lastName.length).toBeLessThanOrEqual(30);
    expect(c.lastName.length).toBeGreaterThan(0);
  });

  test('firstName31Chars() sets firstName to exactly 31 characters', () => {
    const c = ContactFactory.firstName31Chars();
    expect(c.firstName).toHaveLength(31);
    expect(c.lastName.length).toBeLessThanOrEqual(30);
  });

  test('lastName30Chars() sets lastName to exactly 30 characters', () => {
    const c = ContactFactory.lastName30Chars();
    expect(c.lastName).toHaveLength(30);
    expect(c.firstName.length).toBeLessThanOrEqual(30);
  });

  test('lastName31Chars() sets lastName to exactly 31 characters', () => {
    const c = ContactFactory.lastName31Chars();
    expect(c.lastName).toHaveLength(31);
    expect(c.firstName.length).toBeLessThanOrEqual(30);
  });
});

test.describe('contact.factory — empty and whitespace (unit)', () => {
  test('emptyFirstName() returns empty firstName; other fields valid', () => {
    const c = ContactFactory.emptyFirstName();
    expect(c.firstName).toBe('');
    expect(c.lastName.length).toBeGreaterThan(0);
    expect(c.birthday).toMatch(ISO_DATE);
  });

  test('emptyLastName() returns empty lastName; other fields valid', () => {
    const c = ContactFactory.emptyLastName();
    expect(c.lastName).toBe('');
    expect(c.firstName.length).toBeGreaterThan(0);
  });

  test('whitespaceFirstName() returns "   " firstName (bug-candidate input)', () => {
    const c = ContactFactory.whitespaceFirstName();
    expect(c.firstName).toBe('   ');
    expect(c.lastName.length).toBeGreaterThan(0);
  });

  test('whitespaceLastName() returns "   " lastName (bug-candidate input)', () => {
    const c = ContactFactory.whitespaceLastName();
    expect(c.lastName).toBe('   ');
    expect(c.firstName.length).toBeGreaterThan(0);
  });
});

test.describe('contact.factory — birthday boundaries (unit)', () => {
  test('birthdayToday() returns local today in yyyy-MM-dd', () => {
    const c = ContactFactory.birthdayToday();
    expect(c.birthday).toBe(todayIsoLocal());
  });

  test('birthdayInFuture() returns a date strictly after today', () => {
    const c = ContactFactory.birthdayInFuture();
    expect(c.birthday).toMatch(ISO_DATE);
    expect(c.birthday! > todayIsoLocal()).toBe(true);
  });
});

test.describe('contact.factory — live round-trip via ContactsClient', () => {
  test('validContact() creates a real contact that can be fetched and deleted', async ({
    request,
  }) => {
    const contacts = new ContactsClient(new BaseApiClient(request));
    const payload = ContactFactory.validContact();

    const created = await contacts.create(payload);
    expect(created.status).toBe(StatusCodes.CREATED);
    expect(created.id).toBeGreaterThan(0);

    try {
      const fetched = await contacts.getById(created.id!);
      expect(fetched.status).toBe(StatusCodes.OK);
      const parsed = contactModelSchema.parse(fetched.body);
      expect(parsed.id).toBe(created.id);
      expect(parsed.firstName).toBe(payload.firstName);
      expect(parsed.lastName).toBe(payload.lastName);
      expect(parsed.birthday).toBe(payload.birthday);
    } finally {
      const deleted = await contacts.delete(created.id!);
      expect(deleted.status).toBe(StatusCodes.NO_CONTENT);
    }

    const afterDelete = await contacts.getById(created.id!);
    expect(afterDelete.status).toBe(StatusCodes.NOT_FOUND);
  });
});
