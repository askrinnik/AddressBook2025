import { AxeBuilder } from '@axe-core/playwright';
import type { AxeResults, Result } from 'axe-core';
import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * Accessibility scans of the three key pages of each frontend: Home (`/`), Contacts (`/contacts`)
 * and Create Contact (`/create-contact`), using `@axe-core/playwright`.
 *
 * Scope: every scan is limited to the actionable WCAG 2.0/2.1 Level A & AA rule set
 * (`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`) — the stable, shippable subset — rather than axe's full
 * experimental catalogue, so a pass means "no A/AA violations", not "no findings of any kind".
 *
 * Navigation reuses the page objects (their `goto()` waits for the app shell), and the raw `page`
 * fixture feeds `AxeBuilder`. Contacts is scanned in its a11y-relevant *populated* state: one
 * contact is seeded over REST via the `contactsApi` fixture (auto-deleted in teardown) and rendered
 * via search, so the scan covers table rows and the Edit/Delete icon buttons instead of an empty
 * table. The Vue frontend loads a page's component after the shell, so the Home and Create
 * Contact scans wait for the page content first. All waiting is web-first — no delays.
 *
 * Every page of both frontends is enforced at zero WCAG A/AA violations. The Blazor icon buttons
 * carry `aria-label`s, and its Contacts pager uses a labelled rows-per-page select instead of the
 * unnamed MudBlazor one (see docs/tasks/issue-136-a11y-pager-rows-per-page-name.md). The baseline
 * is therefore empty for every page: any WCAG A/AA violation fails the scan.
 */

const WCAG_A_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Violation rule ids tolerated per page. Every page is enforced at zero: any violation is treated
// as a regression and fails the test.
const KNOWN_VIOLATIONS: Record<string, ReadonlySet<string>> = {
  home: new Set<string>(),
  contacts: new Set<string>(),
  create: new Set<string>(),
};

/** Format one axe violation (rule, impact, help URL + offending nodes) for a readable failure. */
function formatViolation(violation: Result): string {
  const nodes = violation.nodes.map((node) => `      - ${node.target.join(' ')}`).join('\n');
  return (
    `  • [${violation.impact ?? 'n/a'}] ${violation.id}: ${violation.help}\n` +
    `    ${violation.helpUrl}\n` +
    `    nodes:\n${nodes}`
  );
}

/**
 * Assert the scan surfaced no violation whose rule id is outside the page's documented baseline.
 * Baselined ids are ignored; any other violation fails with a readable breakdown.
 */
function expectNoNewViolations(results: AxeResults, known: ReadonlySet<string>): void {
  const unexpected = results.violations.filter((violation) => !known.has(violation.id));
  const message =
    `Expected no new WCAG A/AA accessibility violations (baseline: ` +
    `${[...known].join(', ') || 'none'}) but found ${unexpected.length}:\n` +
    unexpected.map(formatViolation).join('\n');
  expect(unexpected, message).toEqual([]);
}

test.describe('a11y — key pages', () => {
  test('Home has no new WCAG A/AA accessibility violations', async ({ page, homePage }) => {
    await homePage.goto();
    await expect(homePage.heading).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_A_AA_TAGS).analyze();

    expectNoNewViolations(results, KNOWN_VIOLATIONS.home);
  });

  test('Contacts (populated) has no new WCAG A/AA accessibility violations', async ({
    page,
    contactsPage,
    contactsApi,
    data,
  }) => {
    // Seed one row (auto-cleaned) and render it, so the scan covers a real MudTable with data.
    const token = newTestToken();
    await contactsApi.createContact(data.tokenized(token));

    await contactsPage.goto();
    await contactsPage.table.search(token);

    const results = await new AxeBuilder({ page }).withTags(WCAG_A_AA_TAGS).analyze();

    expectNoNewViolations(results, KNOWN_VIOLATIONS.contacts);
  });

  test('Create Contact has no new WCAG A/AA accessibility violations', async ({
    page,
    createContactPage,
  }) => {
    await createContactPage.goto();
    await expect(createContactPage.form.firstName).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_A_AA_TAGS).analyze();

    expectNoNewViolations(results, KNOWN_VIOLATIONS.create);
  });
});
