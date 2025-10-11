import { Contact } from './contact';

export interface GetContactsResponse {
  totalRows: number;
  rows: Contact[];
}