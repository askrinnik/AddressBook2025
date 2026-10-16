import type { Locator } from '@playwright/test';
import { ConfirmDialog } from '../confirm-dialog.component.js';
import { notImplemented } from './not-implemented.js';

/*
 * The delete-confirmation dialog of the Vue frontend (Vuetify). The members that depend on
 * Vuetify markup are not covered yet and throw when used.
 */
export class VueConfirmDialog extends ConfirmDialog {
  get title(): Locator {
    return notImplemented('VueConfirmDialog', 'title');
  }
}
