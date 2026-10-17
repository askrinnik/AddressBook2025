import { fromDateOnly, toDateOnly, toShortDateString } from '@/api/types';
import { describe, expect, it } from 'vitest';

describe('toDateOnly', () => {
  it('formats the local date parts with zero padding', () => {
    expect(toDateOnly(new Date(2024, 2, 5))).toBe('2024-03-05');
  });

  it('ignores the time of day', () => {
    expect(toDateOnly(new Date(2024, 11, 31, 23, 59, 59))).toBe('2024-12-31');
  });

  it('pads a year before 1000', () => {
    const date = new Date(2000, 0, 1);
    date.setFullYear(99);

    expect(toDateOnly(date)).toBe('0099-01-01');
  });
});

describe('fromDateOnly', () => {
  it('returns local midnight of the date', () => {
    expect(fromDateOnly('2024-03-05')).toEqual(new Date(2024, 2, 5));
  });

  it('keeps a year before 100', () => {
    expect(fromDateOnly('0050-06-07')?.getFullYear()).toBe(50);
  });

  it.each([
    ['text', 'not a date'],
    ['an empty string', ''],
    ['a date-time', '2024-03-05T10:00:00'],
    ['a short month', '2024-3-5'],
    ['a month past 12', '2024-13-01'],
    ['a day the month lacks', '2023-02-29'],
  ])('returns null for %s', (_name, value) => {
    expect(fromDateOnly(value)).toBeNull();
  });

  it('accepts a leap day', () => {
    expect(fromDateOnly('2024-02-29')).toEqual(new Date(2024, 1, 29));
  });
});

describe('toShortDateString', () => {
  it('formats as M/D/YYYY without leading zeros', () => {
    expect(toShortDateString('2024-03-05')).toBe('3/5/2024');
  });

  it('returns a value that is not in yyyy-MM-dd form unchanged', () => {
    expect(toShortDateString('March 5')).toBe('March 5');
  });
});
