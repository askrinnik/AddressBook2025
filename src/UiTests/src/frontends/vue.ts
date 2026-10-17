import type { Page } from '@playwright/test';
import { VueAppShell } from '../components/vue/app-shell.component.js';
import { VueContactForm } from '../components/vue/contact-form.component.js';
import { VueConfirmDialog } from '../components/vue/confirm-dialog.component.js';
import { VueContactsTable } from '../components/vue/contacts-table.component.js';
import type { Frontend } from './frontend.js';

/*
 * Vue readiness: the "Contact Book" title in the app bar, rendered by the layout on every route
 * once the app has mounted.
 */
const APP_BAR = '.v-app-bar';
const APP_BAR_TITLE = 'Contact Book';

/** The Vue.js + Vuetify frontend (`AddressBook.Vue`). */
export const vue: Frontend = {
  name: 'vue',
  async waitForAppReady(page: Page): Promise<void> {
    await page.locator(APP_BAR).getByText(APP_BAR_TITLE).waitFor({ state: 'visible' });
  },
  appShell: (page) => new VueAppShell(page),
  contactsTable: (page) => new VueContactsTable(page),
  confirmDialog: (page) => new VueConfirmDialog(page),
  contactForm: (page) => new VueContactForm(page),
};
