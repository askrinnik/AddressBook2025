import { getErrors, ProblemDetailsError } from '@/api/problemDetails';

/** The fields of the contact form. */
export type ContactFormField = 'firstName' | 'lastName' | 'birthday';

/** Errors of a failed save: the messages of each field and the general messages of the summary. */
export interface ContactFormErrors {
  fields: Record<ContactFormField, string[]>;
  general: string[];
}

/** Keys of the problem-details `errors` map, by lower-case name, and the field each belongs to. */
const fieldByErrorKey: Record<string, ContactFormField> = {
  firstname: 'firstName',
  lastname: 'lastName',
  birthday: 'birthday',
};

/** Returns errors with no messages at all. */
export function emptyContactFormErrors(): ContactFormErrors {
  return { fields: { firstName: [], lastName: [], birthday: [] }, general: [] };
}

/**
 * Maps an error thrown by a save to form errors:
 * - a problem with an `errors` map puts each `FirstName` / `LastName` / `Birthday` entry on its
 *   field and every other entry into the general messages;
 * - a problem without `errors` becomes one general message: its detail, else its title;
 * - any other error becomes one general message: its own message.
 */
export function toContactFormErrors(error: unknown): ContactFormErrors {
  const result = emptyContactFormErrors();

  if (!(error instanceof ProblemDetailsError)) {
    result.general.push(error instanceof Error ? error.message : String(error));
    return result;
  }

  const errors = getErrors(error.problem);
  if (Object.keys(errors).length === 0) {
    const text = [error.problem.detail, error.problem.title].find((value) => value?.trim());
    result.general.push(text ?? 'The request failed.');
    return result;
  }

  for (const [key, messages] of Object.entries(errors)) {
    const field = fieldByErrorKey[key.toLowerCase()];
    if (field) {
      result.fields[field].push(...messages);
    } else {
      result.general.push(...messages);
    }
  }
  return result;
}
