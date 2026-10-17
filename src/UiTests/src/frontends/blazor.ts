import type { Page } from '@playwright/test';
import { BlazorAppShell } from '../components/blazor/app-shell.component.js';
import { BlazorContactForm } from '../components/blazor/contact-form.component.js';
import { BlazorConfirmDialog } from '../components/blazor/confirm-dialog.component.js';
import { BlazorContactsTable } from '../components/blazor/contacts-table.component.js';
import type { Frontend } from './frontend.js';

/*
 * Blazor WebAssembly readiness.
 *
 * The Web app boots into `#app`, which first shows the `.loading-progress` spinner
 * (wwwroot/index.html); once Blazor WASM has downloaded and `MainLayout` has rendered, the
 * MudBlazor app bar appears with the title "Contact Book". That title is therefore a reliable,
 * delay-free "ready" marker — it is present on every route, including the edit not-found branch
 * (which still renders the layout). This is the single place that owns that signal; page objects
 * wait through here instead of hardcoding their own.
 */
const APP_BAR = '.mud-appbar';
const APP_BAR_TITLE = 'Contact Book';

/** The Blazor WASM + MudBlazor frontend (`AddressBook.Web`). */
export const blazor: Frontend = {
  name: 'blazor',
  async waitForAppReady(page: Page): Promise<void> {
    await page.locator(APP_BAR).getByText(APP_BAR_TITLE).waitFor({ state: 'visible' });
  },
  appShell: (page) => new BlazorAppShell(page),
  contactsTable: (page) => new BlazorContactsTable(page),
  confirmDialog: (page) => new BlazorConfirmDialog(page),
  contactForm: (page) => new BlazorContactForm(page),
};
