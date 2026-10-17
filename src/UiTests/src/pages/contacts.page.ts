import type { Page } from '@playwright/test';
import type { ConfirmDialog } from '../components/confirm-dialog.component.js';
import type { ContactsTable } from '../components/contacts-table.component.js';
import type { Frontend } from '../frontends/index.js';
import { BasePage } from './base.page.js';

/*
 * Page object for the Contacts list (`/contacts`).
 *
 * Composes the `ContactsTable` and the delete `ConfirmDialog`; both stay public so specs can
 * assert on rows/search/sort/pager and on the dialog text directly. The page adds the
 * cross-component flows a single component cannot own (delete = table row → dialog → reload).
 */
export class ContactsPage extends BasePage {
  readonly table: ContactsTable;
  readonly deleteDialog: ConfirmDialog;

  constructor(page: Page, app: Frontend) {
    super(page, app);
    this.table = app.contactsTable(page);
    this.deleteDialog = app.confirmDialog(page);
  }

  async goto(): Promise<void> {
    await this.open('/contacts');
    await this.table.waitForLoaded();
  }

  /** Toolbar "Create Contact" → navigates to `/create-contact`. */
  async openCreate(): Promise<void> {
    await this.table.clickCreate();
  }

  /** Row "Edit" → navigates to `/edit-contact/{id}`. */
  async openEdit(id: number | string): Promise<void> {
    await this.table.clickEdit(id);
  }

  /** Delete a contact and confirm ("Yes"): row → dialog → confirm → reload settled. */
  async deleteContact(id: number | string): Promise<void> {
    await this.table.clickDelete(id);
    await this.deleteDialog.waitUntilOpen();
    await this.deleteDialog.confirm();
    await this.deleteDialog.waitUntilClosed();
    await this.table.waitForLoaded();
  }

  /** Open the delete dialog for a contact but back out ("Cancel"): the row stays. */
  async cancelDelete(id: number | string): Promise<void> {
    await this.table.clickDelete(id);
    await this.deleteDialog.waitUntilOpen();
    await this.deleteDialog.cancel();
    await this.deleteDialog.waitUntilClosed();
  }
}
