import type { Locator, Page } from '@playwright/test';
import { ContactForm } from '../components/contact-form.component.js';
import { BasePage } from './base.page.js';

/*
 * Page object for the Edit Contact page (`/edit-contact/{id}`).
 *
 * Composes the shared `ContactForm`, which the page pre-fills with the loaded contact; specs
 * mutate fields through the public `form` and then `save()`. When the id does not exist the
 * page renders a "Contact not found." alert with a "Back to Contacts" button instead of the
 * form — exposed here so the not-found spec can assert it.
 */
export class EditContactPage extends BasePage {
  readonly form: ContactForm;

  constructor(page: Page) {
    super(page);
    this.form = new ContactForm(page);
  }

  async goto(id: number | string): Promise<void> {
    await this.open(`/edit-contact/${id}`);
  }

  /** Submit the (pre-filled, possibly edited) form ("Save"). */
  async save(): Promise<void> {
    await this.form.submit();
  }

  get notFoundAlert(): Locator {
    return this.page.getByText('Contact not found.');
  }

  get backToContactsButton(): Locator {
    return this.page.getByRole('button', { name: 'Back to Contacts' });
  }

  async backToContacts(): Promise<void> {
    await this.backToContactsButton.click();
  }

  /**
   * True when the requested contact id was not found. Waits for the async contact load to
   * resolve into one branch or the other (the not-found alert or the form) before reading,
   * so it is race-free without a fixed delay.
   */
  async isNotFound(): Promise<boolean> {
    await this.notFoundAlert.or(this.form.firstName).first().waitFor({ state: 'visible' });
    return this.notFoundAlert.isVisible();
  }
}
