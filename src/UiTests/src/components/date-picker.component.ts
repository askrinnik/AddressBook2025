import type { Locator, Page } from '@playwright/test';
import { TestIds } from '../utils/testids.js';

/*
 * Component object for the date picker of the contact "Birthday" field.
 *
 * This base owns the value input (located by `data-testid`) and the ISO date parsing. Opening
 * the calendar, choosing a date and reading its day buttons depend on the UI library's popover
 * markup, so a frontend-specific subclass supplies them and keeps that fragility isolated.
 */
export abstract class DatePicker {
  /**
   * @param page the Playwright page
   * @param triggerTestId `data-testid` of the picker input; defaults to the contact form's
   *   Birthday field.
   */
  constructor(
    protected readonly page: Page,
    protected readonly triggerTestId: string = TestIds.contactFormBirthday,
  ) {}

  /** Open the popover calendar. Safe to call once before selecting a date. */
  abstract open(): Promise<void>;

  /** Select a date from an ISO `YYYY-MM-DD` string via the popover. */
  abstract selectDate(iso: string): Promise<void>;

  /** Day buttons of the displayed month that the picker lets the user choose. */
  abstract get enabledDays(): Locator;

  /** Day buttons of the displayed month that the picker refuses (after the maximum date). */
  abstract get disabledDays(): Locator;

  /** The value input carrying the `data-testid`. */
  get input(): Locator {
    return this.page.getByTestId(this.triggerTestId);
  }

  /** The displayed value (`M/D/YYYY`), or `''` when unset. */
  async value(): Promise<string> {
    return this.input.inputValue();
  }
}

/** Split an ISO `YYYY-MM-DD` date into its year, zero-based month index and day. */
export function parseIso(iso: string): { year: number; monthIndex: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`DatePicker.selectDate expects an ISO YYYY-MM-DD date, got: ${iso}`);
  }
  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}
