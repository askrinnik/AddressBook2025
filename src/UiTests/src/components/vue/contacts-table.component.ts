import type { Locator } from '@playwright/test';
import { ContactsTable } from '../contacts-table.component.js';
import { notImplemented } from './not-implemented.js';

/*
 * The contacts table of the Vue frontend (Vuetify). The members that depend on Vuetify markup
 * are not covered yet and throw when used.
 */
export class VueContactsTable extends ContactsTable {
  get paginationInfo(): Locator {
    return notImplemented('VueContactsTable', 'paginationInfo');
  }

  async setRowsPerPage(_rows: number): Promise<void> {
    notImplemented('VueContactsTable', 'setRowsPerPage');
  }

  protected sortLabel(_columnText: string): Locator {
    return notImplemented('VueContactsTable', 'sortLabel');
  }
}
