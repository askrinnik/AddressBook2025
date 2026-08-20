import type { Page } from '@playwright/test';
import type { CreateContactCommand } from '../api/contacts-api.js';
import { ContactForm } from '../components/contact-form.component.js';
import { BasePage } from './base.page.js';

/*
 * Page object for the Create Contact page (`/create-contact`).
 *
 * Composes the shared `ContactForm` (kept public for field-level assertions in the validation
 * specs). On a successful create the app navigates to `/contacts`.
 */
export class CreateContactPage extends BasePage {
  readonly form: ContactForm;

  constructor(page: Page) {
    super(page);
    this.form = new ContactForm(page);
  }

  async goto(): Promise<void> {
    await this.open('/create-contact');
  }

  /** Fill the form from a command and submit ("Create"). */
  async create(command: CreateContactCommand): Promise<void> {
    await this.form.fill(command);
    await this.form.submit();
  }
}
