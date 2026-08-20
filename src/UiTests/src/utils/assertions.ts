import { expect } from '@playwright/test';
import type { ContactForm, NamedField } from '../components/contact-form.component.js';
import type { ContactsTable } from '../components/contacts-table.component.js';

/*
 * Domain-level assertions for the AddressBook.Web UI, built on the public surface of the U7
 * component objects. Every assertion is web-first: locator matchers auto-wait, and the two
 * string-based form accessors (`errorFor` / `summaryErrors`) are wrapped in `expect.poll` so
 * the async client/server validation is retried rather than read once. No fixed delays.
 */

export interface ExpectedRow {
  firstName: string;
  lastName: string;
}

/** Assert the contact row for `id` is visible and shows the expected first and last name. */
export async function expectContactRow(
  table: ContactsTable,
  id: number | string,
  expected: ExpectedRow,
): Promise<void> {
  const row = table.rowById(id);
  await expect(row, `contact row ${id} should be visible`).toBeVisible();
  await expect(row).toContainText(expected.firstName);
  await expect(row).toContainText(expected.lastName);
}

/** Assert no contact row is rendered for `id` (e.g. after a delete or a non-matching search). */
export async function expectNoContactRow(
  table: ContactsTable,
  id: number | string,
): Promise<void> {
  await expect(table.rowById(id), `contact row ${id} should be absent`).toHaveCount(0);
}

/** Assert the table shows its empty state ("No matching records found"). */
export async function expectNoRecords(table: ContactsTable): Promise<void> {
  await expect(table.noRecords).toBeVisible();
}

/**
 * Assert the named field shows a validation error. With `message`, the error text must match
 * (substring for a string, `.test` for a RegExp); without it, any non-empty error suffices.
 */
export async function expectFieldError(
  form: ContactForm,
  field: NamedField,
  message?: string | RegExp,
): Promise<void> {
  if (message === undefined) {
    await expect
      .poll(() => form.errorFor(field), { message: `${field} should show a validation error` })
      .not.toBe('');
    return;
  }
  await expect
    .poll(() => form.errorFor(field), {
      message: `${field} error should match ${describeMatcher(message)}`,
    })
    .toMatch(message);
}

/** Assert the named field shows no validation error. */
export async function expectNoFieldError(form: ContactForm, field: NamedField): Promise<void> {
  await expect
    .poll(() => form.errorFor(field), { message: `${field} should have no validation error` })
    .toBe('');
}

/**
 * Assert the `<ValidationSummary>` lists an error matching `message` (substring for a string,
 * `.test` for a RegExp) — used for model-level / server (problem-details) errors.
 */
export async function expectSummaryError(
  form: ContactForm,
  message: string | RegExp,
): Promise<void> {
  await expect
    .poll(() => form.summaryErrors(), {
      message: `validation summary should contain ${describeMatcher(message)}`,
    })
    .toEqual(expect.arrayContaining([expect.stringMatching(matcherToRegExp(message))]));
}

function describeMatcher(matcher: string | RegExp): string {
  return matcher instanceof RegExp ? matcher.toString() : JSON.stringify(matcher);
}

/** Turn a plain string into an escaped substring RegExp; pass a RegExp through unchanged. */
function matcherToRegExp(matcher: string | RegExp): RegExp {
  if (matcher instanceof RegExp) return matcher;
  return new RegExp(matcher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
}
