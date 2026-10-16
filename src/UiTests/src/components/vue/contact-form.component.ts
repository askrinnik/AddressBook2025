import type { Locator, Page } from '@playwright/test';
import { ContactForm, FIELD_TEST_IDS, type NamedField } from '../contact-form.component.js';
import { VueDatePicker } from './date-picker.component.js';

/*
 * The contact form of the Vue frontend (ContactForm.vue, used by the Create and Edit pages).
 *
 * The Birthday field is a `v-date-input`, delegated to `VueDatePicker`. Field-level errors render
 * as Vuetify messages (`.v-messages__message`) inside the field's `.v-input`; general errors
 * (server errors that belong to no field) render as `<li>` items of the `.contact-form-summary`
 * list under the fields.
 */
const FIELD_ERROR = '.v-messages__message';

export class VueContactForm extends ContactForm {
  constructor(page: Page) {
    super(page, new VueDatePicker(page));
  }

  /** The general error messages of the summary list. */
  get validationSummary(): Locator {
    return this.page.locator('.contact-form-summary li');
  }

  /** The validation error shown under a named field, or `''` when the field has no error. */
  async errorFor(field: NamedField): Promise<string> {
    const control = this.page.locator('.v-input', {
      has: this.page.getByTestId(FIELD_TEST_IDS[field]),
    });
    const error = control.locator(FIELD_ERROR);
    if ((await error.count()) === 0) return '';
    return (await error.first().innerText()).trim();
  }
}
