import type { Locator, Page } from '@playwright/test';
import { TestIds } from '../utils/testids.js';

/*
 * Component object for the delete-confirmation dialog (title "Warning", message "Are you sure
 * you want to delete this contact?", Yes/Cancel).
 *
 * The destructive "Yes" button carries a `data-testid`; "Cancel" keeps its visible text and is
 * located by accessible name. The surface has `role="dialog"`. The title element depends on the
 * UI library's markup, so a frontend-specific subclass supplies it.
 */
const DELETE_MESSAGE = 'Are you sure you want to delete this contact?';

export abstract class ConfirmDialog {
  constructor(protected readonly page: Page) {}

  /** The dialog title. */
  abstract get title(): Locator;

  get dialog(): Locator {
    return this.page.getByRole('dialog');
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
