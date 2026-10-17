import { request } from './http';
import { ProblemDetailsError } from './problemDetails';
import {
  toDateOnly,
  type ContactFormModel,
  type ContactModel,
  type CreateContactCommand,
  type GetFilteredContactsResponse,
  type UpdateContactCommand,
} from './types';

/** Percent-encodes a query value like `Uri.EscapeDataString`, which also escapes `!'()*`. */
function escapeDataString(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function formatBirthday(model: ContactFormModel): string | null {
  return model.birthday ? toDateOnly(model.birthday) : null;
}

/** Gets the contacts; a blank search term returns all of them. */
export async function getFilteredContacts(
  searchTerm: string,
  signal?: AbortSignal,
): Promise<GetFilteredContactsResponse> {
  const query = searchTerm.trim() ? `?search=${escapeDataString(searchTerm)}` : '';
  const response = await request(`contacts${query}`, { method: 'GET', signal });
  return (await response.json()) as GetFilteredContactsResponse;
}

/** Deletes a contact. */
export async function deleteContact(id: number): Promise<void> {
  await request(`contacts/${id}`, { method: 'DELETE' });
}

/** Creates a contact and returns its id, or 0 when the `Location` header has no numeric id. */
export async function createContact(model: ContactFormModel): Promise<number> {
  const command: CreateContactCommand = {
    firstName: model.firstName,
    lastName: model.lastName,
    birthday: formatBirthday(model),
  };
  const response = await request('contacts', { method: 'POST', body: command });
  return parseIdFromLocation(response.headers.get('Location'));
}

/** Reads the id from the last path segment of a `Location` header value. */
function parseIdFromLocation(location: string | null): number {
  if (!location) return 0;

  const lastSegment = new URL(location, 'http://localhost').pathname.split('/').pop() ?? '';
  return /^[+-]?\d+$/.test(lastSegment) ? Number(lastSegment) : 0;
}

/** Gets one contact, or null when it does not exist. */
export async function getContactById(
  id: number,
  signal?: AbortSignal,
): Promise<ContactModel | null> {
  try {
    const response = await request(`contacts/${id}`, { method: 'GET', signal });
    return (await response.json()) as ContactModel;
  } catch (error) {
    if (error instanceof ProblemDetailsError && error.status === 404) return null;
    throw error;
  }
}

/** Updates a contact. */
export async function updateContact(
  id: number,
  model: ContactFormModel,
  signal?: AbortSignal,
): Promise<void> {
  const command: UpdateContactCommand = {
    id,
    firstName: model.firstName,
    lastName: model.lastName,
    birthday: formatBirthday(model),
  };
  await request(`contacts/${id}`, { method: 'PUT', body: command, signal });
}
