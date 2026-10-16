import type { Page } from '@playwright/test';
import { VueAppShell } from '../components/vue/app-shell.component.js';
import { VueContactForm } from '../components/vue/contact-form.component.js';
import { VueConfirmDialog } from '../components/vue/confirm-dialog.component.js';
import { VueContactsTable } from '../components/vue/contacts-table.component.js';
import type { Frontend } from './frontend.js';

/*
 * Vue readiness: Vuetify's `<v-app>` renders the `.v-application` root once the app has mounted,
 * so its visibility marks a booted app on every route.
 */
const APP_ROOT = '.v-application';

/** The Vue.js + Vuetify frontend (`AddressBook.Vue`). */
export const vue: Frontend = {
  name: 'vue',
  async waitForAppReady(page: Page): Promise<void> {
    await page.locator(APP_ROOT).waitFor({ state: 'visible' });
  },
  appShell: (page) => new VueAppShell(page),
  contactsTable: (page) => new VueContactsTable(page),
  confirmDialog: (page) => new VueConfirmDialog(page),
  contactForm: (page) => new VueContactForm(page),
};
