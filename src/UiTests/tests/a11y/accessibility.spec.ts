import { AxeBuilder } from '@axe-core/playwright';
import type { AxeResults, Result } from 'axe-core';
import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';

/*
 * Accessibility scans (U18, Phase 3 — optional) for the three key AddressBook.Web pages named in
 * the issue: Home (`/`), Contacts (`/contacts`) and Create Contact (`/create-contact`), using
 * `@axe-core/playwright`.
 *
 * Scope: every scan is limited to the actionable WCAG 2.0/2.1 Level A & AA rule set
 * (`wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa`) — the stable, shippable subset — rather than axe's full
 * experimental catalogue, so a pass means "no A/AA violations", not "no findings of any kind".
 *
 * Navigation reuses the U8 page objects (their `goto()` waits for Blazor to boot), and the raw
 * `page` fixture feeds `AxeBuilder`. Contacts is scanned in its a11y-relevant *populated* state:
 * one contact is seeded over REST via the U9 `contactsApi` fixture (auto-deleted in teardown) and
 * rendered via search, so the scan actually covers table rows and the Edit/Delete icon buttons
 * instead of an empty table. All waiting is web-first — no delays.
 *
 * Known baseline (issue #132): the app currently ships pre-existing A-level violations — MudBlazor
 * icon buttons with no accessible name (`button-name`) and a MudTable rows-per-page select with no
 * label (`aria-input-field-name`). Fixing the Razor markup is out of scope for this test-authoring
 * task, so each page's known rule ids are baselined below and the scans assert only that **no new**
 * rule types appear. This is an explicit, documented tolerance — not a blanket disable: a fresh
 * violation of any other rule still fails the test. When #132 is fixed, delete the corresponding
 * ids from `KNOWN_VIOLATIONS` so the scan enforces zero violations again.
 */

const WCAG_A_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Pre-existing violation rule ids tolerated per page — see issue #132. Anything not listed here is
// treated as a regression and fails the test.
const KNOWN_VIOLATIONS: Record<string, ReadonlySet<string>> = {
  home: new Set(['button-name']),
  contacts: new Set(['button-name', 'aria-input-field-name']),
  create: new Set(['button-name']),
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
 * Baselined ids (issue #132) are ignored; any other violation fails with a readable breakdown.
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

    const results = await new AxeBuilder({ page }).withTags(WCAG_A_AA_TAGS).analyze();

    expectNoNewViolations(results, KNOWN_VIOLATIONS.create);
  });
});
