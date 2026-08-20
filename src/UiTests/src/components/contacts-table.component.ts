import type { Locator, Page } from '@playwright/test';
import { TestIds, contactDeleteButton, contactEditButton, contactRow } from '../utils/testids.js';

/*
 * Component object for the contacts `MudTable` (server-reload) and its toolbar.
 *
 * Encapsulated MudBlazor specifics (no stable role/testid is exposed for these):
 *   - sort labels are `<span class="mud-table-sort-label">` carrying the column text;
 *   - the pager buttons carry aria-labels ("Next page" / "Previous page" / …);
 *   - the rows-per-page control is a `MudSelect`, not a native <select>;
 *   - server reload shows a "Loading..." row that must clear before the data is stable.
 *
 * Per-row controls reuse the U4 id-suffixed `data-testid`s, so each row is addressable on the
 * shared database and under parallel runs. The `contact-row-{id}` testid sits on the row's
 * first cell; the enclosing `<tr>` is derived from it.
 */
const SORT_LABEL = '.mud-table-sort-label';
const LOADING_TEXT = 'Loading...';
// The page renders the empty-state label wrapped in literal quotes; a substring match ignores them.
const NO_RECORDS_TEXT = 'No matching records found';

export class ContactsTable {
  constructor(private readonly page: Page) {}

  get root(): Locator {
    return this.page.getByTestId(TestIds.contactsTable);
  }

  get createButton(): Locator {
    return this.page.getByTestId(TestIds.contactsCreate);
  }

  /** The search box (`data-testid` sits on the `<input>` itself). */
  get searchInput(): Locator {
    return this.page.getByTestId(TestIds.contactsSearch);
  }

  get noRecords(): Locator {
    return this.root.getByText(NO_RECORDS_TEXT);
  }

  get bodyRows(): Locator {
    return this.root.locator('tbody tr');
  }

  /** The `<tr>` for a contact id, derived from the `contact-row-{id}` testid on its first cell. */
  rowById(id: number | string): Locator {
    return this.root.locator('tr').filter({ has: this.page.getByTestId(contactRow(id)) });
  }

  editButton(id: number | string): Locator {
    return this.page.getByTestId(contactEditButton(id));
  }

  deleteButton(id: number | string): Locator {
    return this.page.getByTestId(contactDeleteButton(id));
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  async clickEdit(id: number | string): Promise<void> {
    await this.editButton(id).click();
  }

  async clickDelete(id: number | string): Promise<void> {
    await this.deleteButton(id).click();
  }

  /**
   * Type a search term and let the server reload settle. The search field is not `Immediate`,
   * so the value is committed on blur (which fires the `OnSearch` → `ReloadServerData`).
   */
  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchInput.blur();
    await this.waitForLoaded();
  }

  /** Clear the search term (commit empty on blur) and let the reload settle. */
  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.searchInput.blur();
    await this.waitForLoaded();
  }

  async sortByFirstName(): Promise<void> {
    await this.sortLabel('First Name').click();
    await this.waitForLoaded();
  }

  async sortByLastName(): Promise<void> {
    await this.sortLabel('Last Name').click();
    await this.waitForLoaded();
  }

  async sortByBirthday(): Promise<void> {
    await this.sortLabel('Birthday').click();
    await this.waitForLoaded();
  }

  get nextButton(): Locator {
    return this.pagerButton('Next page');
  }

  get previousButton(): Locator {
    return this.pagerButton('Previous page');
  }

  async nextPage(): Promise<void> {
    await this.nextButton.click();
    await this.waitForLoaded();
  }

  async previousPage(): Promise<void> {
    await this.previousButton.click();
    await this.waitForLoaded();
  }

  /** Choose a rows-per-page option from the pager's `MudSelect`. */
  async setRowsPerPage(rows: number): Promise<void> {
    await this.root.locator('.mud-table-pagination-select').click();
    // The options render in a page-level popover list.
    await this.page.locator('.mud-list-item', { hasText: exact(String(rows)) }).click();
    await this.waitForLoaded();
  }

  /** Wait for the server-reload "Loading..." row to clear (no-op if it never showed). */
  async waitForLoaded(): Promise<void> {
    await this.root.getByText(LOADING_TEXT).waitFor({ state: 'hidden' });
  }

  /** Number of data rows currently rendered. */
  async rowCount(): Promise<number> {
    return this.bodyRows.count();
  }

  /**
   * The First-Name column values across the current page, in render order. Reads the first cell
   * of every body row — the column whose text the specs control — so sort order can be asserted
   * without parsing the culture-formatted Birthday cell.
   */
  async firstNameColumn(): Promise<string[]> {
    const cells = await this.root.locator('tbody tr td:nth-child(1)').allInnerTexts();
    return cells.map((text) => text.trim());
  }

  /** The pager caption locator (`X-Y of Z`). */
  get paginationInfo(): Locator {
    return this.root.locator('.mud-table-page-number-information');
  }

  /** The pager caption text (`X-Y of Z`), trimmed. */
  async pageRangeText(): Promise<string> {
    return (await this.paginationInfo.innerText()).trim();
  }

  /** Total row count parsed from the pager caption (`… of Z` → `TotalItems`/`TotalRows`). */
  async totalRows(): Promise<number> {
    const text = await this.pageRangeText();
    const match = /of\s+(\d+)/i.exec(text);
    if (!match) {
      throw new Error(`Could not parse total rows from pager caption: "${text}"`);
    }
    return Number(match[1]);
  }

  private sortLabel(columnText: string): Locator {
    return this.root.locator(SORT_LABEL, { hasText: columnText });
  }

  private pagerButton(ariaLabel: string): Locator {
    return this.root.getByRole('button', { name: ariaLabel });
  }
}

/** Anchored regex so `hasText` matches exactly ("10" must not match "100"). */
function exact(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}
