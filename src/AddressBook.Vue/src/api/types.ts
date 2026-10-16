/** A contact as returned by the API; the birthday is a `yyyy-MM-dd` string or null. */
export interface ContactModel {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string | null;
}

/** One page of the contact list together with the total number of matching rows. */
export interface GetFilteredContactsResponse {
  totalRows: number;
  rows: ContactModel[];
}

/** Request body of `POST contacts`. */
export interface CreateContactCommand {
  firstName: string;
  lastName: string;
  birthday: string | null;
}

/** Request body of `PUT contacts/{id}`. */
export interface UpdateContactCommand {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string | null;
}

/** The contact form model; the birthday is a local date picked in the UI. */
export interface ContactFormModel {
  firstName: string;
  lastName: string;
  birthday: Date | null;
}

/** Formats the local date components as `yyyy-MM-dd`, without any time-zone shift. */
export function toDateOnly(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Converts a `yyyy-MM-dd` string to a `Date` at local midnight, or null when the string is not a date. */
export function fromDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  // Years 0-99 map to 1900-1999 in the constructor, so set the year explicitly.
  date.setFullYear(year);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isRealDate ? date : null;
}
