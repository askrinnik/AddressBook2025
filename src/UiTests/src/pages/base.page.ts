import type { Page } from '@playwright/test';
import { AppShell } from '../components/app-shell.component.js';
import { waitForBlazorReady } from '../utils/blazor.js';

/*
 * Abstract base for every page object.
 *
 * Owns the Playwright `Page` and the `AppShell` component (the app bar / drawer / theme / nav
 * are present on every route, so navigation and theme come for free on each page). Subclasses
 * expose their own `goto(...)` and route through `open(path)`, which navigates and then waits
 * for the app to be ready.
 *
 * Readiness is delegated to `utils/blazor.ts` (the app-bar title becomes visible only once
 * Blazor WASM has booted and MainLayout has rendered — a reliable, delay-free marker that also
 * holds on the edit not-found branch, which still renders the layout).
 */
export abstract class BasePage {
  readonly shell: AppShell;

  constructor(protected readonly page: Page) {
    this.shell = new AppShell(page);
  }

  /** Navigate to `path` and wait until the app is ready. */
  protected async open(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitUntilReady();
  }

  /** Wait until Blazor has booted and the shell is rendered. */
  async waitUntilReady(): Promise<void> {
    await waitForBlazorReady(this.page);
  }
}
