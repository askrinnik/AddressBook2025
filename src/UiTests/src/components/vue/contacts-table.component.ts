import type { Locator } from '@playwright/test';
import { ContactsTable } from '../contacts-table.component.js';

/*
 * The contacts `v-data-table-server` of the Vue frontend.
 *
 * Encapsulated Vuetify specifics:
 *   - a sortable column header is a `<th class="v-data-table__th--sortable">` carrying the column text;
 *   - the rows-per-page control is a `v-select` (role `combobox`, accessible name "Rows per page");
 *     its selected value covers the `<input>`, and its options render in a page-level popup;
 *   - the pager caption is `.v-data-table-footer__info`.
 */
const SORTABLE_HEADER = 'th.v-data-table__th--sortable';

export class VueContactsTable extends ContactsTable {
  /** Choose a rows-per-page option from the pager's `v-select`. */
  async setRowsPerPage(rows: number): Promise<void> {
    // The selected value is drawn over the combobox `<input>`, so the click goes to the field.
    const combobox = this.page.getByRole('combobox', { name: 'Rows per page' });
    await this.root.locator('.v-select', { has: combobox }).click();
    await this.page.getByRole('option', { name: String(rows), exact: true }).click();
    await this.waitForLoaded();
  }

  /** The pager caption locator (`X-Y of Z`). */
  get paginationInfo(): Locator {
    return this.root.locator('.v-data-table-footer__info');
  }

  protected sortLabel(columnText: string): Locator {
    return this.root.locator(SORTABLE_HEADER, { hasText: columnText });
  }
}
