import type { Page } from '@playwright/test';

/*
 * Blazor WebAssembly readiness helper.
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

/** Wait until Blazor WASM has booted and `MainLayout` (the app shell) has rendered. */
export async function waitForBlazorReady(page: Page): Promise<void> {
  await page.locator(APP_BAR).getByText(APP_BAR_TITLE).waitFor({ state: 'visible' });
}
