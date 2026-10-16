import type { Locator, Page } from '@playwright/test';
import { ContactForm, type NamedField } from '../contact-form.component.js';
import { VueDatePicker } from './date-picker.component.js';
import { notImplemented } from './not-implemented.js';

/*
 * The contact form of the Vue frontend (Vuetify). The members that depend on Vuetify markup are
 * not covered yet and throw when used.
 */
export class VueContactForm extends ContactForm {
  constructor(page: Page) {
    super(page, new VueDatePicker(page));
  }

  get validationSummary(): Locator {
    return notImplemented('VueContactForm', 'validationSummary');
  }

  async errorFor(_field: NamedField): Promise<string> {
    return notImplemented('VueContactForm', 'errorFor');
  }
}
