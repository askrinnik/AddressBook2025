import { faker } from '@faker-js/faker';
import { RUN_TOKEN, newTestToken } from './tokens.js';

export interface ContactData {
  firstName: string;
  lastName: string;
  birthday?: string | null;
}

const MAX_NAME_LENGTH = 30;

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function today(): string {
  return formatDate(new Date());
}

function tomorrow(): string {
  return formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

function pastBirthday(): string {
  // refDate one day ago guarantees the value never lands on today by chance.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return formatDate(faker.date.past({ years: 60, refDate: oneDayAgo }));
}

function validName(prefix: string): string {
  const raw = `${prefix}-${RUN_TOKEN}`;
  return raw.length > MAX_NAME_LENGTH ? raw.slice(0, MAX_NAME_LENGTH) : raw;
}

function paddedName(targetLength: number): string {
  const token = newTestToken();
  if (token.length >= targetLength) return token.slice(0, targetLength);
  return token + 'x'.repeat(targetLength - token.length);
}

function baseValidContact(): ContactData {
  return {
    firstName: validName(faker.person.firstName()),
    lastName: validName(faker.person.lastName()),
    birthday: pastBirthday(),
  };
}

export class ContactFactory {
  private constructor() {}

  static validContact(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), ...overrides };
  }

  static validContactWithoutBirthday(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), birthday: null, ...overrides };
  }

  static firstName30Chars(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), firstName: paddedName(MAX_NAME_LENGTH), ...overrides };
  }

  static firstName31Chars(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), firstName: paddedName(MAX_NAME_LENGTH + 1), ...overrides };
  }

  static lastName30Chars(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), lastName: paddedName(MAX_NAME_LENGTH), ...overrides };
  }

  static lastName31Chars(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), lastName: paddedName(MAX_NAME_LENGTH + 1), ...overrides };
  }

  static emptyFirstName(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), firstName: '', ...overrides };
  }

  static emptyLastName(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), lastName: '', ...overrides };
  }

  // "   " (three spaces) passes FluentValidation's NotEmpty pre-trim but the API trims after
  // validation, so it persists as an empty name — kept here as a documented bug-candidate
  // input for T12, not as a valid case.
  static whitespaceFirstName(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), firstName: '   ', ...overrides };
  }

  static whitespaceLastName(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), lastName: '   ', ...overrides };
  }

  static birthdayInFuture(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), birthday: tomorrow(), ...overrides };
  }

  static birthdayToday(overrides?: Partial<ContactData>): ContactData {
    return { ...baseValidContact(), birthday: today(), ...overrides };
  }
}
