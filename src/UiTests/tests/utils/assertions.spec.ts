import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { newTestToken } from '../../src/data/tokens.js';
import {
  expectContactRow,
  expectFieldError,
  expectNoContactRow,
  expectNoFieldError,
  expectNoRecords,
  expectSummaryError,
} from '../../src/utils/assertions.js';

/*
 * Exercises every exported domain assertion against the running UI, driven through the U9
 * fixtures. Table assertions seed via the hybrid API (auto-cleaned in teardown); form
 * assertions use the create form's client-side [Required] validation, which surfaces both
 * inline (helper text) and in the <ValidationSummary>.
 */

test.describe('table assertions', () => {
  test('expectContactRow matches a seeded, searched-for row', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    const command = data.validContact();
    const id = await contactsApi.createContact(command);

    await contactsPage.goto();
    await contactsPage.table.search(command.firstName);

    await expectContactRow(contactsPage.table, id, {
      firstName: command.firstName,
      lastName: command.lastName,
    });
  });

  test('expectNoRecords / expectNoContactRow hold for a non-matching search', async ({
    contactsApi,
    contactsPage,
    data,
  }) => {
    // Seed a real row, then search a token that cannot match it, so the table is empty.
    const id = await contactsApi.createContact(data.validContact());

    await contactsPage.goto();
    await contactsPage.table.search(newTestToken());

    await expectNoRecords(contactsPage.table);
    await expectNoContactRow(contactsPage.table, id);
  });
});

test.describe('form-error assertions', () => {
  test('expectNoFieldError holds on a fresh form', async ({ createContactPage }) => {
    await createContactPage.goto();
    await expectNoFieldError(createContactPage.form, 'firstName');
  });

  test('expectFieldError holds after submitting an empty required form', async ({
    createContactPage,
  }) => {
    // Client-side [Required] renders inline helper text under each field.
    await createContactPage.goto();
    await createContactPage.form.submit();

    await expectFieldError(createContactPage.form, 'firstName', /required/i);
  });

  test('expectSummaryError holds when the create request fails with a general error', async ({
    page,
    createContactPage,
    data,
  }) => {
    // Aborting the create POST makes the WASM HttpClient throw a non-ProblemDetails error, which
    // the page maps to a model-level message in the <ValidationSummary> (the AddGeneralError
    // path) — the only channel `.validation-errors` carries. Names must be valid so client
    // validation passes and the request is actually attempted. Route is registered after the app
    // has booted so only the submit POST is affected, not the WASM asset downloads.
    await createContactPage.goto();

    let postAborted = false;
    await page.route('**/*', async (route) => {
      const request = route.request();
      // The WASM app posts to a lowercase `/api/contacts` path (routing is case-insensitive).
      if (request.method() === 'POST' && /\/api\/contacts\b/i.test(request.url())) {
        postAborted = true;
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    await createContactPage.create(data.validContactWithoutBirthday());

    expect(postAborted, 'the create POST should have been intercepted and aborted').toBe(true);
    await expectSummaryError(createContactPage.form, /\S/);
  });
});
