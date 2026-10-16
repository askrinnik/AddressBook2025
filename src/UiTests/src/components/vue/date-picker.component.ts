import type { Locator } from '@playwright/test';
import { DatePicker } from '../date-picker.component.js';
import { notImplemented } from './not-implemented.js';

/*
 * The Birthday date picker of the Vue frontend (Vuetify). The members that depend on Vuetify
 * markup are not covered yet and throw when used.
 */
export class VueDatePicker extends DatePicker {
  async open(): Promise<void> {
    notImplemented('VueDatePicker', 'open');
  }

  async selectDate(_iso: string): Promise<void> {
    notImplemented('VueDatePicker', 'selectDate');
  }

  get enabledDays(): Locator {
    return notImplemented('VueDatePicker', 'enabledDays');
  }

  get disabledDays(): Locator {
    return notImplemented('VueDatePicker', 'disabledDays');
  }
}
