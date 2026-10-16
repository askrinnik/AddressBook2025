import type { Page } from '@playwright/test';
import type { AppShell } from '../components/app-shell.component.js';
import type { ContactForm } from '../components/contact-form.component.js';
import type { ConfirmDialog } from '../components/confirm-dialog.component.js';
import type { ContactsTable } from '../components/contacts-table.component.js';

/** The frontends the suite runs against; each is one Playwright project. */
export type FrontendName = 'blazor' | 'vue';

/*
 * Everything that differs between the frontends under test: the readiness signal and the
 * frontend-specific component objects. Page objects and specs use only the shared component
 * bases; the `app` fixture hands them the implementation of the project's frontend.
 */
export interface Frontend {
  readonly name: FrontendName;
  /** Wait until the app has booted and its layout (the app shell) has rendered. */
  waitForAppReady(page: Page): Promise<void>;
  appShell(page: Page): AppShell;
  contactsTable(page: Page): ContactsTable;
  confirmDialog(page: Page): ConfirmDialog;
  contactForm(page: Page): ContactForm;
}
