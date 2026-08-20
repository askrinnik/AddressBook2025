import type { Locator, Page } from '@playwright/test';
import type { CreateContactCommand } from '../api/contacts-api.js';
import { TestIds } from '../utils/testids.js';
import { DatePicker } from './date-picker.component.js';

/*
 * Component object for the contact form shared by CreateContact.razor and EditContact.razor
 * (identical markup; the submit button reads "Create" on create and "Save" on edit, but both
 * carry the single `contact-form-submit` testid, so this one object drives both pages).
 *
 * The First/Last name `data-testid`s sit on the `<input>`s directly. The Birthday field is a
 * MudDatePicker, delegated to `DatePicker`. Field-level errors render as MudBlazor helper text
 * (`.mud-input-helper-text.mud-input-error`) under each field; the `<ValidationSummary>` list
 * (`.validation-message`) carries model-level / server errors.
 */
const FIELD_ERROR = '.mud-input-helper-text.mud-input-error';

export type NamedField = 'firstName' | 'lastName';

const FIELD_TEST_IDS: Record<NamedField, string> = {
  firstName: TestIds.contactFormFirstName,
  lastName: TestIds.contactFormLastName,
};

export class ContactForm {
  readonly birthday: DatePicker;

  constructor(private readonly page: Page) {
    this.birthday = new DatePicker(page, TestIds.contactFormBirthday);
  }

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

  /**
   * The `<ValidationSummary>` messages (model-level / server "general" errors). Blazor renders
   * each as `<li class="validation-message">`; the `<ul class="validation-errors">` wrapper is
   * NOT matched here because the page passes `class="mt-4"`, which Blazor splats over the
   * built-in "validation-errors" class on the `<ul>`. Field-level errors use a different class
   * (`.mud-input-helper-text.mud-input-error`, see FIELD_ERROR), so there is no collision.
   */
  get validationSummary(): Locator {
    return this.page.locator('.validation-message');
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

  /** The validation error shown under a named field, or `''` when the field has no error. */
  async errorFor(field: NamedField): Promise<string> {
    const control = this.page.locator('.mud-input-control', {
      has: this.page.getByTestId(FIELD_TEST_IDS[field]),
    });
    const error = control.locator(FIELD_ERROR);
    if ((await error.count()) === 0) return '';
    return (await error.first().innerText()).trim();
  }

  /** The model-level / server error messages listed in the `<ValidationSummary>`. */
  async summaryErrors(): Promise<string[]> {
    return (await this.validationSummary.allInnerTexts()).map((text) => text.trim());
  }
}
