import { toDateOnly } from '@/api/types';
import {
  BIRTHDAY_IN_FUTURE_MESSAGE,
  birthdayRules,
  isBirthdayNotInFuture,
  NAME_MAX_LENGTH,
  nameRules,
  todayUtc,
} from '@/rules/contactRules';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('nameRules', () => {
  const [required, maxLength] = nameRules('First name');

  it('accepts a name', () => {
    expect(required('Ann')).toBe(true);
    expect(maxLength('Ann')).toBe(true);
  });

  it.each([[''], ['   '], [null]])('requires a name, rejecting %j', (value) => {
    expect(required(value)).toBe('The First name field is required.');
  });

  it('accepts a name of exactly 30 characters', () => {
    expect(maxLength('x'.repeat(NAME_MAX_LENGTH))).toBe(true);
  });

  it('rejects a name of 31 characters', () => {
    expect(maxLength('x'.repeat(NAME_MAX_LENGTH + 1))).toBe(
      'The field First name must be a string with a maximum length of 30.',
    );
  });

  it('counts the characters as typed, including the spaces around them', () => {
    expect(maxLength(` ${'x'.repeat(NAME_MAX_LENGTH)}`)).not.toBe(true);
  });

  it('accepts a null value for the length rule', () => {
    expect(maxLength(null)).toBe(true);
  });
});

describe('time zone', () => {
  const originalZone = process.env.TZ;

  afterEach(() => {
    if (originalZone === undefined) delete process.env.TZ;
    else process.env.TZ = originalZone;
  });

  // The clock reads 23:30 UTC on March 5: already March 6 east of UTC, still March 5 west of it.
  const instant = new Date('2024-03-05T23:30:00Z');

  it.each([['Pacific/Kiritimati'], ['Pacific/Pago_Pago'], ['UTC']])(
    'takes the UTC calendar day as today in %s',
    (zone) => {
      process.env.TZ = zone;

      expect(toDateOnly(todayUtc(instant))).toBe('2024-03-05');
    },
  );

  it.each([['Pacific/Kiritimati'], ['Pacific/Pago_Pago']])(
    'allows the UTC today and rejects the day after it in %s',
    (zone) => {
      process.env.TZ = zone;

      expect(isBirthdayNotInFuture(new Date(2024, 2, 5), instant)).toBe(true);
      expect(isBirthdayNotInFuture(new Date(2024, 2, 6), instant)).toBe(false);
    },
  );
});

describe('todayUtc', () => {
  it('returns the day at local midnight', () => {
    const today = todayUtc(new Date('2024-03-05T13:45:10Z'));

    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
  });

  it('keeps a year before 100', () => {
    const now = new Date('2000-01-01T00:00:00Z');
    now.setUTCFullYear(50);

    expect(todayUtc(now).getFullYear()).toBe(50);
  });

  it('defaults to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-05T12:00:00Z'));

    expect(toDateOnly(todayUtc())).toBe('2024-03-05');

    vi.useRealTimers();
  });
});

describe('isBirthdayNotInFuture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts no birthday', () => {
    expect(isBirthdayNotInFuture(null)).toBe(true);
  });

  it('accepts a past date and today', () => {
    expect(isBirthdayNotInFuture(new Date(1990, 5, 1))).toBe(true);
    expect(isBirthdayNotInFuture(new Date(2024, 2, 5))).toBe(true);
  });

  it('rejects tomorrow', () => {
    expect(isBirthdayNotInFuture(new Date(2024, 2, 6))).toBe(false);
  });
});

describe('birthdayRules', () => {
  const [rule] = birthdayRules;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-05T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accepts an empty and a past birthday', () => {
    expect(rule(null)).toBe(true);
    expect(rule(new Date(2000, 0, 1))).toBe(true);
  });

  it('returns the message for a future birthday', () => {
    expect(rule(new Date(2024, 2, 6))).toBe(BIRTHDAY_IN_FUTURE_MESSAGE);
  });
});
