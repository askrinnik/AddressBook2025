import type { Locator } from '@playwright/test';
import { ConfirmDialog } from '../confirm-dialog.component.js';

/*
 * The delete-confirmation dialog of the Vue frontend, a `v-dialog` around a `v-card`.
 */
export class VueConfirmDialog extends ConfirmDialog {
  get title(): Locator {
    return this.dialog.locator('.v-card-title');
  }
}
