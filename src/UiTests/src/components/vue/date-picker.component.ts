import type { Locator } from '@playwright/test';
import { DatePicker, parseIso } from '../date-picker.component.js';

/*
 * The `v-date-input` of the Vue frontend (the contact "Birthday" field).
 *
 * The input is read-only, so a date is chosen through the `v-date-picker` calendar that clicking
 * the input opens. The calendar renders in Vuetify's overlay container at page root, so its
 * locators are page-scoped. Vuetify markup this class relies on:
 *   - the docked controls carry `data-testid="year-btn"` and `data-testid="month-btn"`;
 *   - year, month and day buttons carry `data-v-year` (the year), `data-v-month` (the zero-based
 *     month) and `data-v-date` (the ISO date; enabled days only), so each is matched exactly;
 *   - every day of the displayed month is a `.v-date-picker-month__day-btn` button, `disabled`
 *     when it is after the maximum date; days of the adjacent months are not rendered.
 * Choosing a year or a month returns to the day grid; choosing a day closes the calendar.
 */
const PICKER = '.v-overlay-container .v-date-picker';
const DAY_BUTTON = '.v-date-picker-month__day-btn';

export class VueDatePicker extends DatePicker {
  private get picker(): Locator {
    return this.page.locator(PICKER);
  }

  /** Open the calendar by clicking the input. */
  async open(): Promise<void> {
    await this.input.click();
    await this.picker.waitFor({ state: 'visible' });
  }

  /** Select a date from an ISO `YYYY-MM-DD` string: year, then month, then day. */
  async selectDate(iso: string): Promise<void> {
    const { year, monthIndex } = parseIso(iso);

    await this.open();

    await this.picker.getByTestId('year-btn').click();
    await this.picker.locator(`[data-v-year="${year}"]`).click();

    await this.picker.getByTestId('month-btn').click();
    await this.picker.locator(`[data-v-month="${monthIndex}"]`).click();

    await this.picker.locator(`[data-v-date="${iso}"]`).click();
  }

  /** Day buttons of the displayed month that the picker lets the user choose. */
  get enabledDays(): Locator {
    return this.picker.locator(`${DAY_BUTTON}:not([disabled])`);
  }

  /** Day buttons of the displayed month that the picker refuses (after the maximum date). */
  get disabledDays(): Locator {
    return this.picker.locator(`${DAY_BUTTON}[disabled]`);
  }
}
