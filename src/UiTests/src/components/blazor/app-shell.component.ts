import type { Locator } from '@playwright/test';
import { AppShell } from '../app-shell.component.js';

/*
 * The application shell of the Blazor frontend (MainLayout + NavMenu).
 *
 * MudBlazor exposes no ARIA state for the drawer, so "drawer open" is the `mud-drawer--open`
 * class on the `#nav-drawer` <aside>.
 */
const DRAWER_OPEN_CLASS = 'mud-drawer--open';

export class BlazorAppShell extends AppShell {
  get appBarTitle(): Locator {
    return this.page.locator('.mud-appbar').getByText('Contact Book');
  }

  get drawer(): Locator {
    return this.page.locator('#nav-drawer');
  }

  /** True while the navigation drawer is open (`mud-drawer--open` on `#nav-drawer`). */
  async isDrawerOpen(): Promise<boolean> {
    const classes = (await this.drawer.getAttribute('class')) ?? '';
    return classes.split(/\s+/).includes(DRAWER_OPEN_CLASS);
  }
}
