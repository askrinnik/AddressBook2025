import type { Locator } from '@playwright/test';
import { ConfirmDialog } from '../confirm-dialog.component.js';

/*
 * The delete-confirmation dialog of the Blazor frontend, rendered by `MudMessageBox`.
 */
export class BlazorConfirmDialog extends ConfirmDialog {
  get title(): Locator {
    return this.dialog.locator('.mud-dialog-title');
  }
}
