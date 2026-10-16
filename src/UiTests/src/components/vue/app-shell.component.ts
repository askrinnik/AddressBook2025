import type { Locator } from '@playwright/test';
import { AppShell } from '../app-shell.component.js';

/*
 * The application shell of the Vue frontend (MainLayout + NavMenu).
 *
 * Vuetify exposes no ARIA state for the drawer, so "drawer open" is the `v-navigation-drawer--active`
 * class on the `#nav-drawer` element.
 */
const DRAWER_OPEN_CLASS = 'v-navigation-drawer--active';

export class VueAppShell extends AppShell {
  get appBarTitle(): Locator {
    return this.page.locator('.v-app-bar').getByText('Contact Book');
  }

  get drawer(): Locator {
    return this.page.locator('#nav-drawer');
  }

  /** True while the navigation drawer is open (`v-navigation-drawer--active` on `#nav-drawer`). */
  async isDrawerOpen(): Promise<boolean> {
    const classes = (await this.drawer.getAttribute('class')) ?? '';
    return classes.split(/\s+/).includes(DRAWER_OPEN_CLASS);
  }
}
