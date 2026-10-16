import type { Locator, Page } from '@playwright/test';
import { TestIds } from '../utils/testids.js';

/*
 * Component object for the application shell: the app bar title, the drawer toggle, the
 * light/dark theme toggle, and the Home/Contacts navigation.
 *
 * This base owns everything both frontends expose through `data-testid`s and the click flows
 * built on them. The app bar title and the drawer state depend on the UI library's markup, so a
 * frontend-specific subclass supplies them.
 *
 * Dark mode is read from the <body> background luminance (light theme is near-white, dark is
 * dark): neither UI library is required to expose a theme marker that a test can rely on.
 */
export abstract class AppShell {
  constructor(protected readonly page: Page) {}

  /** The "Contact Book" title in the app bar. */
  abstract get appBarTitle(): Locator;

  /** The navigation drawer element. */
  abstract get drawer(): Locator;

  /** True while the navigation drawer is open. */
  abstract isDrawerOpen(): Promise<boolean>;

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

  /**
   * True when the dark theme is active. Derived from the page background luminance because
   * the theme palette lives only in CSS variables.
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
