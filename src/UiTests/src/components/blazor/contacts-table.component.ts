import type { Locator } from '@playwright/test';
import { ContactsTable } from '../contacts-table.component.js';

/*
 * The contacts `MudTable` of the Blazor frontend.
 *
 * Encapsulated MudBlazor specifics (no stable role/testid is exposed for these):
 *   - sort labels are `<span class="mud-table-sort-label">` carrying the column text;
 *   - the rows-per-page control is a `MudSelect`, not a native <select>;
 *   - the pager caption is `.mud-table-page-number-information`.
 */
const SORT_LABEL = '.mud-table-sort-label';

export class BlazorContactsTable extends ContactsTable {
  /** Choose a rows-per-page option from the pager's `MudSelect`. */
  async setRowsPerPage(rows: number): Promise<void> {
    await this.root.locator('.mud-table-pagination-select').click();
    // The options render in a page-level popover list.
    await this.page.locator('.mud-list-item', { hasText: exact(String(rows)) }).click();
    await this.waitForLoaded();
  }

  /** The pager caption locator (`X-Y of Z`). */
  get paginationInfo(): Locator {
    return this.root.locator('.mud-table-page-number-information');
  }

  protected sortLabel(columnText: string): Locator {
    return this.root.locator(SORT_LABEL, { hasText: columnText });
  }
}

/** Anchored regex so `hasText` matches exactly ("10" must not match "100"). */
function exact(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}
