import type { APIRequestContext } from '@playwright/test';

/*
 * Hybrid-E2E data path: seed and clean up contacts directly through the REST API
 * (fast, no UI) so UI tests start from a known state and tear their data down after.
 *
 * The facts here are reused from src/ApiTests: the `Contacts` endpoint path, the id
 * carried in the `Location` header on 201, and the create-command shape.
 */
const CONTACTS_PATH = 'Contacts';
const LOCATION_ID_REGEX = /\/Contacts\/(\d+)$/;

export interface CreateContactCommand {
  firstName: string;
  lastName: string;
  birthday?: string | null;
}

/** A contact row as the API returns it (camelCase JSON; `birthday` is `yyyy-MM-dd` or null). */
export interface ContactRow {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string | null;
}

/**
 * Thin wrapper over Playwright's `APIRequestContext` for seeding and cleaning up contacts.
 * The context is expected to be created with `baseURL = env.apiURL` (which ends with `/api/`),
 * so the relative `Contacts` path resolves to `/api/Contacts`. Building that context and wiring
 * auto-cleanup is the fixture's job (U9); this class just uses whatever context it is given.
 */
export class ContactsApi {
  constructor(private readonly request: APIRequestContext) {}

  /**
   * Create a contact via the API and return its new id, parsed from the `Location` header.
   * A failed seed must fail the test loudly, so anything other than 201 (or a missing id) throws.
   */
  async createContact(command: CreateContactCommand): Promise<number> {
    const response = await this.request.post(CONTACTS_PATH, { data: command });
    if (response.status() !== 201) {
      throw new Error(
        `Failed to seed contact: expected 201, got ${response.status()} — ${await response.text()}`,
      );
    }

    const id = parseContactIdFromLocation(response.headers()['location']);
    if (id === undefined) {
      throw new Error(
        `Contact created but no id found in Location header: ${response.headers()['location']}`,
      );
    }
    return id;
  }

  /**
   * List contacts filtered by `search` (matched against first/last name), returning the `rows`.
   * Used by UI specs to look up the id of a contact created through the UI — for a
   * culture-independent birthday assertion and for teardown.
   */
  async getFilteredContacts(search: string): Promise<ContactRow[]> {
    const response = await this.request.get(CONTACTS_PATH, { params: { search } });
    if (response.status() !== 200) {
      throw new Error(
        `Failed to list contacts: expected 200, got ${response.status()} — ${await response.text()}`,
      );
    }
    const body = (await response.json()) as { rows: ContactRow[] };
    return body.rows;
  }

  /**
   * Delete a contact by id. Tolerates 404 (already gone) so teardown is idempotent and safe to
   * call even when the test under verification already deleted the row.
   */
  async deleteContact(id: number | string): Promise<void> {
    const response = await this.request.delete(
      `${CONTACTS_PATH}/${encodeURIComponent(String(id))}`,
    );
    const status = response.status();
    if (status !== 204 && status !== 404) {
      throw new Error(
        `Failed to delete contact ${id}: expected 204 or 404, got ${status} — ${await response.text()}`,
      );
    }
  }
}

/** Parse the numeric contact id from a `Location` header like `.../Contacts/238`. */
export function parseContactIdFromLocation(location: string | undefined): number | undefined {
  if (!location) return undefined;
  const match = LOCATION_ID_REGEX.exec(location);
  return match ? Number(match[1]) : undefined;
}
