import type { Locator } from '@playwright/test';
import { BasePage } from './base.page.js';

/*
 * Page object for the static Home page (`/`): a heading and a welcome line.
 */
export class HomePage extends BasePage {
  async goto(): Promise<void> {
    await this.open('/');
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Contacts application' });
  }
}
