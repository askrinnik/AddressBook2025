import type { Locator, Page } from '@playwright/test';
import { ContactForm, FIELD_TEST_IDS, type NamedField } from '../contact-form.component.js';
import { BlazorDatePicker } from './date-picker.component.js';

/*
 * The contact form of the Blazor frontend (CreateContact.razor and EditContact.razor).
 *
 * The Birthday field is a MudDatePicker, delegated to `BlazorDatePicker`. Field-level errors
 * render as MudBlazor helper text (`.mud-input-helper-text.mud-input-error`) under each field;
 * the `<ValidationSummary>` list (`.validation-message`) carries model-level / server errors.
 */
const FIELD_ERROR = '.mud-input-helper-text.mud-input-error';

export class BlazorContactForm extends ContactForm {
  constructor(page: Page) {
    super(page, new BlazorDatePicker(page));
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

  /** The validation error shown under a named field, or `''` when the field has no error. */
  async errorFor(field: NamedField): Promise<string> {
    const control = this.page.locator('.mud-input-control', {
      has: this.page.getByTestId(FIELD_TEST_IDS[field]),
    });
    const error = control.locator(FIELD_ERROR);
    if ((await error.count()) === 0) return '';
    return (await error.first().innerText()).trim();
  }
}
