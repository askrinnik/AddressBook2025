import type { Locator } from '@playwright/test';
import { DatePicker, parseIso } from '../date-picker.component.js';

/*
 * The MudDatePicker of the Blazor frontend (the contact "Birthday" field).
 *
 * The MudDatePicker input is rendered read-only, so a date cannot be typed — it must be
 * chosen through the popover calendar. This class is the ONE place that knows the popover's
 * Material-specific markup (`.mud-button-year`, `.mud-picker-year`, `.mud-picker-month`,
 * `.mud-day`), so that fragility stays isolated here per the framework plan. The popover itself
 * is rendered at page root by `MudPopoverProvider`, so its locators are page-scoped, not scoped
 * under the trigger.
 *
 * Popover flow confirmed against MudBlazor 9.3 on the running app:
 *   open → click the toolbar year → pick the year → (auto month grid) pick the 3-letter month
 *   → pick the day; the popover then auto-closes and the input shows `M/D/YYYY`.
 */

// Short month names as MudBlazor renders them in the month grid ("Jan".."Dec"), index 0..11.
const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

export class BlazorDatePicker extends DatePicker {
  /** The calendar-open adornment button (aria-label "Open") sitting next to the input. */
  private get openButton(): Locator {
    // The adornment is a sibling of the input inside the shared `.mud-input-control` wrapper.
    return this.page
      .locator('.mud-input-control', { has: this.input })
      .getByRole('button', { name: 'Open' });
  }

  /** Open the popover calendar. Idempotent-ish: safe to call once before selecting a date. */
  async open(): Promise<void> {
    await this.openButton.click();
  }

  /**
   * Select a date from an ISO `YYYY-MM-DD` string via the popover: year → month → day.
   * Auto-waits at each view (web-first locators); no fixed delays.
   */
  async selectDate(iso: string): Promise<void> {
    const { year, monthIndex, day } = parseIso(iso);

    await this.open();

    // Year view: the toolbar year button opens the scrollable year list.
    await this.page.locator('.mud-button-year').click();
    await this.page
      .locator('.mud-picker-year', { hasText: exact(String(year)) })
      .click();

    // Month grid appears automatically after picking a year.
    await this.page
      .locator('.mud-picker-month', { hasText: exact(MONTH_ABBREVIATIONS[monthIndex]) })
      .click();

    // Day grid: exclude days spilled in from adjacent months (`.mud-hidden`).
    await this.page
      .locator('button.mud-day:not(.mud-hidden)', { hasText: exact(String(day)) })
      .click();
  }

  /** Day buttons of the displayed month that the picker lets the user choose. */
  get enabledDays(): Locator {
    return this.page.locator('button.mud-day:not(.mud-hidden):not([disabled])');
  }

  /** Day buttons of the displayed month that the picker refuses (after `MaxDate`). */
  get disabledDays(): Locator {
    return this.page.locator('button.mud-day:not(.mud-hidden)[disabled]');
  }
}

/** Anchored regex so `hasText` matches a cell exactly ("1" must not match "10"/"11"/"21"). */
function exact(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}
