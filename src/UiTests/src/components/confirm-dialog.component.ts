import type { Locator, Page } from '@playwright/test';
import { TestIds } from '../utils/testids.js';

/*
 * Component object for the delete-confirmation dialog, rendered by `MudMessageBox`
 * (Title "Warning", message "Are you sure you want to delete this contact?", Yes/Cancel).
 *
 * The destructive "Yes" button carries `data-testid` (U4); "Cancel" keeps its visible text
 * and is located by accessible name. The surface is a MudBlazor dialog (`role="dialog"`).
 */
const DELETE_MESSAGE = 'Are you sure you want to delete this contact?';

export class ConfirmDialog {
  constructor(private readonly page: Page) {}

  get dialog(): Locator {
    return this.page.getByRole('dialog');
  }

  get title(): Locator {
    return this.dialog.locator('.mud-dialog-title');
  }

  get message(): Locator {
    return this.dialog.getByText(DELETE_MESSAGE);
  }

  /** The destructive confirmation ("Yes"). */
  get confirmButton(): Locator {
    return this.page.getByTestId(TestIds.contactDeleteConfirm);
  }

  get cancelButton(): Locator {
    return this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async waitUntilOpen(): Promise<void> {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async waitUntilClosed(): Promise<void> {
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
