import { newTestToken } from '../../src/data/tokens.js';
import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { expectContactRow, expectSingleContact } from '../../src/utils/assertions.js';

/*
 * Edit Contact through the UI (U14): `/edit-contact/{id}` pre-fills the existing contact, Save
 * persists the edits (reflected in the list), and Cancel returns to `/contacts` discarding them.
 *
 * not-found for a missing id is already covered by `edit-not-found.spec.ts` (the #120 regression
 * guard, which also positively asserts the pre-filled form for an existing id), so it is not
 * duplicated here.
 *
 * Isolation on the shared SQL Server DB: each test seeds its contact over REST via the `contactsApi`
 * fixture (id auto-tracked → deleted in teardown; an edit keeps the same id, so cleanup still
 * covers it). Contacts are built with `data.tokenized(token, …)` and the edited names keep the
 * token, so the API lookup / `search(token)` still isolate the row after the rename. Birthday is
 * asserted against the API's `yyyy-MM-dd` value, not the culture-formatted cell. All checks web-first.
 */

test.describe('contacts — edit', () => {
  test('pre-fills the form and reflects saved edits in the list', async ({
    page,
    editContactPage,
    contactsPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const original = data.tokenized(token, { birthday: '1990-01-01' });
    const id = await contactsApi.createContact(original);

    await editContactPage.goto(id);

    // The form is pre-filled with the loaded contact.
    await expect(editContactPage.form.firstName).toHaveValue(original.firstName);
    await expect(editContactPage.form.lastName).toHaveValue(original.lastName);
    await expect(editContactPage.form.birthday.input).not.toHaveValue('');

    // Edit every field (the token stays in the names so the row is still isolable).
    const updated = data.tokenized(token, {
      firstName: 'Edited',
      lastName: 'Renamed',
      birthday: '1985-05-05',
    });
    await editContactPage.form.fillFirstName(updated.firstName);
    await editContactPage.form.fillLastName(updated.lastName);
    await editContactPage.form.setBirthday('1985-05-05');
    await editContactPage.save();
    await expect(page).toHaveURL(/\/contacts$/);

    // Persisted (same id, new values) — birthday checked via the API's yyyy-MM-dd value.
    const saved = await expectSingleContact(contactsApi, token);
    expect(saved.id).toBe(id);
    expect(saved.firstName).toBe(updated.firstName);
    expect(saved.lastName).toBe(updated.lastName);
    expect(saved.birthday).toBe('1985-05-05');

    // Reflected in the list.
    await contactsPage.table.search(token);
    await expectContactRow(contactsPage.table, id, {
      firstName: updated.firstName,
      lastName: updated.lastName,
    });
  });

  test('Cancel returns to the list and discards the edits', async ({
    page,
    editContactPage,
    contactsApi,
    data,
  }) => {
    const token = newTestToken();
    const original = data.tokenized(token, { birthday: '1990-01-01' });
    const id = await contactsApi.createContact(original);

    await editContactPage.goto(id);
    await expect(editContactPage.form.firstName).toHaveValue(original.firstName);

    // Change a field, then back out with Cancel.
    await editContactPage.form.fillFirstName(
      data.tokenized(token, { firstName: 'Discarded' }).firstName,
    );
    await editContactPage.form.cancel();
    await expect(page).toHaveURL(/\/contacts$/);

    // Nothing changed: the API still returns the original values.
    const after = await expectSingleContact(contactsApi, token);
    expect(after.id).toBe(id);
    expect(after.firstName).toBe(original.firstName);
    expect(after.lastName).toBe(original.lastName);
  });
});
