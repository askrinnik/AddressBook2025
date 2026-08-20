import { faker } from '@faker-js/faker';
import type { CreateContactCommand } from '../api/contacts-api.js';
import { RUN_TOKEN, newTestToken } from './tokens.js';

// Matches the API's CreateContactCommandValidator / UpdateContactCommandValidator (MaximumLength(30)).
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

// Embed RUN_TOKEN so search-by-token UI tests can isolate their own rows on the shared DB.
function validName(prefix: string): string {
  const raw = `${prefix}-${RUN_TOKEN}`;
  return raw.length > MAX_NAME_LENGTH ? raw.slice(0, MAX_NAME_LENGTH) : raw;
}

function paddedName(targetLength: number): string {
  const token = newTestToken();
  if (token.length >= targetLength) return token.slice(0, targetLength);
  return token + 'x'.repeat(targetLength - token.length);
}

function baseValidContact(): CreateContactCommand {
  return {
    firstName: validName(faker.person.firstName()),
    lastName: validName(faker.person.lastName()),
    birthday: pastBirthday(),
  };
}

/**
 * Builders for contact test data. Every variant is self-contained (names carry RUN_TOKEN) and
 * accepts a `Partial<CreateContactCommand>` overrides argument for per-test tweaks.
 */
export class ContactFactory {
  private constructor() {}

  static validContact(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), ...overrides };
  }

  /**
   * A valid contact whose first/last names carry `token` as a `<prefix>-<token>` suffix, so a
   * search-by-token isolates exactly this contact on the shared DB. `overrides.firstName` /
   * `overrides.lastName` set the PREFIX before the token (default `First` / `Last`); every other
   * override (e.g. `birthday`) is applied as-is. Prefixes are meant to stay short so the resulting
   * name keeps within the API's 30-char limit. This is the one builder the UI specs use to mint
   * token-isolated contacts (list/search, sort/paginate, create, …).
   */
  static tokenized(token: string, overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    const firstPrefix = overrides?.firstName ?? 'First';
    const lastPrefix = overrides?.lastName ?? 'Last';
    return {
      ...baseValidContact(),
      ...overrides,
      firstName: `${firstPrefix}-${token}`,
      lastName: `${lastPrefix}-${token}`,
    };
  }

  static validContactWithoutBirthday(
    overrides?: Partial<CreateContactCommand>,
  ): CreateContactCommand {
    return { ...baseValidContact(), birthday: null, ...overrides };
  }

  static firstName30Chars(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), firstName: paddedName(MAX_NAME_LENGTH), ...overrides };
  }

  static firstName31Chars(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), firstName: paddedName(MAX_NAME_LENGTH + 1), ...overrides };
  }

  static lastName30Chars(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), lastName: paddedName(MAX_NAME_LENGTH), ...overrides };
  }

  static lastName31Chars(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), lastName: paddedName(MAX_NAME_LENGTH + 1), ...overrides };
  }

  static emptyFirstName(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), firstName: '', ...overrides };
  }

  static emptyLastName(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), lastName: '', ...overrides };
  }

  // "   " (three spaces) passes a NotEmpty-style check pre-trim but trims to empty afterwards —
  // kept as a documented edge input for the validation specs, not as a valid case.
  static whitespaceFirstName(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), firstName: '   ', ...overrides };
  }

  static whitespaceLastName(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), lastName: '   ', ...overrides };
  }

  static birthdayInFuture(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), birthday: tomorrow(), ...overrides };
  }

  static birthdayToday(overrides?: Partial<CreateContactCommand>): CreateContactCommand {
    return { ...baseValidContact(), birthday: today(), ...overrides };
  }
}
