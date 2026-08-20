import type { Locator, Page } from '@playwright/test';
import { TestIds } from '../utils/testids.js';

/*
 * Component object for the application shell (MainLayout + NavMenu): the app bar title,
 * the drawer toggle, the light/dark theme toggle, and the Home/Contacts navigation.
 *
 * MudBlazor exposes no stable class for the current theme and no ARIA state for the drawer,
 * so the two encapsulated signals are:
 *   - drawer open  → the `mud-drawer--open` class on the `#nav-drawer` <aside>.
 *   - dark mode    → the <body> background luminance (light theme is near-white, dark is dark);
 *     the theme provider only swaps `--mud-palette-*` variables, it adds no marker class.
 */
const DRAWER_OPEN_CLASS = 'mud-drawer--open';

export class AppShell {
  constructor(private readonly page: Page) {}

  get appBarTitle(): Locator {
    return this.page.locator('.mud-appbar').getByText('Contact Book');
  }

  get drawerToggle(): Locator {
    return this.page.getByTestId(TestIds.drawerToggle);
  }

  get themeToggle(): Locator {
    return this.page.getByTestId(TestIds.themeToggle);
  }

  get homeLink(): Locator {
    return this.page.getByTestId(TestIds.navHome);
  }

  get contactsLink(): Locator {
    return this.page.getByTestId(TestIds.navContacts);
  }

  get drawer(): Locator {
    return this.page.locator('#nav-drawer');
  }

  async toggleDrawer(): Promise<void> {
    await this.drawerToggle.click();
  }

  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  async gotoHome(): Promise<void> {
    await this.homeLink.click();
  }

  async gotoContacts(): Promise<void> {
    await this.contactsLink.click();
  }

  /** True while the navigation drawer is open (`mud-drawer--open` on `#nav-drawer`). */
  async isDrawerOpen(): Promise<boolean> {
    const classes = (await this.drawer.getAttribute('class')) ?? '';
    return classes.split(/\s+/).includes(DRAWER_OPEN_CLASS);
  }

  /**
   * True when the dark theme is active. Derived from the page background luminance because
   * MudBlazor exposes no theme marker class — the palette lives only in CSS variables.
   */
  async isDarkMode(): Promise<boolean> {
    return this.page.evaluate(() => {
      // Runs in the browser; use globalThis so the node-scoped ESLint config stays happy.
      const bg = globalThis.getComputedStyle(globalThis.document.body).backgroundColor;
      const match = /(\d+),\s*(\d+),\s*(\d+)/.exec(bg);
      if (!match) return false;
      const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
      // Rec. 601 perceived luminance (0..255); a dark background means dark mode.
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return luminance < 128;
    });
  }
}
