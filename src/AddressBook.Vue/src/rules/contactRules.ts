import { toDateOnly } from '@/api/types';

/*
 * Validation rules of a contact. They mirror `ContactRules` in `AddressBook.Contracts` and the
 * data annotations of the Blazor form model (`[Required]`, `[StringLength]`, `[NotInFuture]`), so
 * both frontends and the API accept the same values and show the same messages.
 */

/** Maximum length of the first and the last name. */
export const NAME_MAX_LENGTH = 30;

/** Message of the birthday rule, identical to the API's `errors.Birthday`. */
export const BIRTHDAY_IN_FUTURE_MESSAGE = 'Birthday cannot be in the future';

/** A Vuetify field rule: `true` when the value is valid, otherwise the error message. */
export type FieldRule<T> = (value: T) => true | string;

/**
 * Returns the current UTC calendar date as a `Date` at local midnight. The date picker and the
 * birthday rule work with local dates, so this is the form in which they can compare with it.
 *
 * @param now the clock reading; defaults to the current time.
 */
export function todayUtc(now: Date = new Date()): Date {
  const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  // Years 0-99 map to 1900-1999 in the constructor, so set the year explicitly.
  today.setFullYear(now.getUTCFullYear());
  return today;
}

/**
 * Checks the birthday rule: an empty birthday is valid; otherwise it must not be later than the
 * current UTC date.
 *
 * @param birthday the picked local date, or null.
 * @param now the clock reading; defaults to the current time.
 */
export function isBirthdayNotInFuture(birthday: Date | null, now: Date = new Date()): boolean {
  if (birthday === null) return true;
  // `yyyy-MM-dd` strings compare in date order.
  return toDateOnly(birthday) <= toDateOnly(todayUtc(now));
}

/**
 * The rules of a name field: not empty or whitespace-only, and at most `NAME_MAX_LENGTH`
 * characters. The length counts the value as typed, like `[StringLength]`.
 *
 * @param displayName the field name used in the messages, for example `First name`.
 */
export function nameRules(displayName: string): FieldRule<string | null>[] {
  return [
    (value) => (value ?? '').trim() !== '' || `The ${displayName} field is required.`,
    (value) =>
      (value ?? '').length <= NAME_MAX_LENGTH ||
      `The field ${displayName} must be a string with a maximum length of ${NAME_MAX_LENGTH}.`,
  ];
}

/** The rules of the birthday field. */
export const birthdayRules: FieldRule<Date | null>[] = [
  (value) => isBirthdayNotInFuture(value ?? null) || BIRTHDAY_IN_FUTURE_MESSAGE,
];
