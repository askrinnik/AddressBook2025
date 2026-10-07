import { faker } from '@faker-js/faker';
import type { CreateContactCommand } from '../api/contacts-api.js';
import { RUN_TOKEN, newTestToken } from './tokens.js';

// Mirrors ContactRules.NameMaxLength in AddressBook.Contracts, which the API validators and the Web form read.
const MAX_NAME_LENGTH = 30;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// The client and the API reject a birthday later than the current UTC date, so the boundary dates are
// UTC dates; local dates would flake whenever the local and the UTC calendar day differ.
function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function today(): string {
  return formatUtcDate(new Date());
}

function tomorrow(): string {
  return formatUtcDate(new Date(Date.now() + ONE_DAY_MS));
}

function pastBirthday(): string {
  // refDate one day ago guarantees the value never lands on today by chance.
  const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);
  return formatUtcDate(faker.date.past({ years: 60, refDate: oneDayAgo }));
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
