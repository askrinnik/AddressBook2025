import type { Page } from '@playwright/test';
import type { AppShell } from '../components/app-shell.component.js';
import type { Frontend } from '../frontends/index.js';

/*
 * Abstract base for every page object.
 *
 * Owns the Playwright `Page`, the frontend under test and the `AppShell` component (the app bar /
 * drawer / theme / nav are present on every route, so navigation and theme come for free on each
 * page). Subclasses expose their own `goto(...)` and route through `open(path)`, which navigates
 * and then waits for the app to be ready.
 *
 * Readiness and the component implementations come from the `Frontend`, so the page objects are
 * shared by every frontend.
 */
export abstract class BasePage {
  readonly shell: AppShell;

  constructor(
    protected readonly page: Page,
    protected readonly app: Frontend,
  ) {
    this.shell = app.appShell(page);
  }

  /** Navigate to `path` and wait until the app is ready. */
  protected async open(path: string): Promise<void> {
    await this.page.goto(path);
    await this.waitUntilReady();
  }

  /** Wait until the app has booted and the shell is rendered. */
  async waitUntilReady(): Promise<void> {
    await this.app.waitForAppReady(this.page);
  }
}
