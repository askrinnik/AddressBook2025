import type { Locator, Page } from '@playwright/test';
import type { CreateContactCommand } from '../api/contacts-api.js';
import { TestIds } from '../utils/testids.js';
import type { DatePicker } from './date-picker.component.js';

/*
 * Component object for the contact form shared by the create and edit pages (identical markup;
 * the submit button reads "Create" on create and "Save" on edit, but both carry the single
 * `contact-form-submit` testid, so this one object drives both pages).
 *
 * This base owns the `data-testid` fields, the buttons and the fill flows. The Birthday field is
 * a `DatePicker` handed in by the frontend-specific subclass. Where the field-level errors and
 * the validation summary render depends on the UI library's markup, so the subclass supplies
 * them too.
 */
export type NamedField = 'firstName' | 'lastName' | 'birthday';

export const FIELD_TEST_IDS: Record<NamedField, string> = {
  firstName: TestIds.contactFormFirstName,
  lastName: TestIds.contactFormLastName,
  // Server field errors for a bad birthday (e.g. a future date) render inline under the
  // date picker, not in the validation summary, so `errorFor('birthday')` reads them there.
  birthday: TestIds.contactFormBirthday,
};

export abstract class ContactForm {
  constructor(
    protected readonly page: Page,
    readonly birthday: DatePicker,
  ) {}

  /** The model-level / server "general" error messages of the validation summary. */
  abstract get validationSummary(): Locator;

  /** The validation error shown under a named field, or `''` when the field has no error. */
  abstract errorFor(field: NamedField): Promise<string>;

  get firstName(): Locator {
    return this.page.getByTestId(TestIds.contactFormFirstName);
  }

  get lastName(): Locator {
    return this.page.getByTestId(TestIds.contactFormLastName);
  }

  get submitButton(): Locator {
    return this.page.getByTestId(TestIds.contactFormSubmit);
  }

  get cancelButton(): Locator {
    return this.page.getByTestId(TestIds.contactFormCancel);
  }

  async fillFirstName(value: string): Promise<void> {
    await this.firstName.fill(value);
  }

  async fillLastName(value: string): Promise<void> {
    await this.lastName.fill(value);
  }

  /** Set the Birthday from an ISO `YYYY-MM-DD` string via the date-picker popover. */
  async setBirthday(iso: string): Promise<void> {
    await this.birthday.selectDate(iso);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Fill the whole form from a create-contact command. Names are always set; the birthday is
   * set only when the command carries one (a `null`/absent birthday leaves the picker empty,
   * matching the "without birthday" case).
   */
  async fill(command: CreateContactCommand): Promise<void> {
    await this.fillFirstName(command.firstName);
    await this.fillLastName(command.lastName);
    if (command.birthday) {
      await this.setBirthday(command.birthday);
    }
  }

  /** The model-level / server error messages listed in the validation summary. */
  async summaryErrors(): Promise<string[]> {
    return (await this.validationSummary.allInnerTexts()).map((text) => text.trim());
  }
}
