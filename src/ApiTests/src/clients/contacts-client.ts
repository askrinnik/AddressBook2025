import type { ApiResponse, BaseApiClient } from './base-api-client.js';

const CONTACTS_PATH = 'Contacts';
const LOCATION_ID_REGEX = /\/Contacts\/(\d+)$/;

export interface CreateContactCommand {
  firstName: string;
  lastName: string;
  birthday?: string | null;
}

export interface UpdateContactCommand extends CreateContactCommand {
  id?: number;
}

export interface CreateContactResult extends ApiResponse {
  /** Parsed from the `Location` header on 201; `undefined` on validation errors or malformed header. */
  id: number | undefined;
}

/**
 * Stateless per-endpoint client for `api/Contacts`.
 * All methods return the raw `ApiResponse` (no assertions); `create` additionally
 * exposes the id parsed from the `Location` header.
 */
export class ContactsClient {
  constructor(private readonly base: BaseApiClient) {}

  list(search?: string): Promise<ApiResponse> {
    return this.base.get(CONTACTS_PATH, { query: { search } });
  }

  getById(id: number | string): Promise<ApiResponse> {
    return this.base.get(`${CONTACTS_PATH}/${encodeURIComponent(String(id))}`);
  }

  async create(command: CreateContactCommand): Promise<CreateContactResult> {
    const response = await this.base.post(CONTACTS_PATH, { data: command });
    return { ...response, id: parseContactIdFromLocation(response.headers['location']) };
  }

  update(id: number | string, command: UpdateContactCommand): Promise<ApiResponse> {
    return this.base.put(`${CONTACTS_PATH}/${encodeURIComponent(String(id))}`, { data: command });
  }

  delete(id: number | string): Promise<ApiResponse> {
    return this.base.delete(`${CONTACTS_PATH}/${encodeURIComponent(String(id))}`);
  }
}

export function parseContactIdFromLocation(location: string | undefined): number | undefined {
  if (!location) return undefined;
  const match = LOCATION_ID_REGEX.exec(location);
  return match ? Number(match[1]) : undefined;
}
