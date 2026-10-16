import type { Locator } from '@playwright/test';
import { AppShell } from '../app-shell.component.js';
import { notImplemented } from './not-implemented.js';

/*
 * The application shell of the Vue frontend (Vuetify). The members that depend on Vuetify
 * markup are not covered yet and throw when used.
 */
export class VueAppShell extends AppShell {
  get appBarTitle(): Locator {
    return notImplemented('VueAppShell', 'appBarTitle');
  }

  get drawer(): Locator {
    return notImplemented('VueAppShell', 'drawer');
  }

  async isDrawerOpen(): Promise<boolean> {
    return notImplemented('VueAppShell', 'isDrawerOpen');
  }
}
