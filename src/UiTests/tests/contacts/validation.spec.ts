import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { expectFieldError, expectNoFieldError } from '../../src/utils/assertions.js';

/*
 * Contact-form validation through the UI (U16), exercised on the create form.
 *
 * Client: `CreateContactModel` has `[Required]` on First/Last name only. A blocked submit stays on
 * `/create-contact` (the page returns before calling the API) and shows the inline Required error.
 * Server: there is no client length/date rule, so an over-length name or a future birthday passes
 * client validation, the POST returns 400, and the page maps the FluentValidation message onto the
 * form. Every rejected submit (client or server) creates nothing, so there is nothing to clean up.
 *
 * All checks are web-first (the error accessors are `expect.poll`-backed); no fixed delays.
 */

const ON_CREATE_PAGE = /\/create-contact$/;

test.describe('contacts — validation (client Required)', () => {
  test('empty First name blocks submit', async ({ page, createContactPage }) => {
    await createContactPage.goto();
    await createContactPage.form.fillLastName('Valid-Last');
    await createContactPage.form.submit();

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'firstName', /required/i);
    await expectNoFieldError(createContactPage.form, 'lastName');
  });

  test('empty Last name blocks submit', async ({ page, createContactPage }) => {
    await createContactPage.goto();
    await createContactPage.form.fillFirstName('Valid-First');
    await createContactPage.form.submit();

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'lastName', /required/i);
    await expectNoFieldError(createContactPage.form, 'firstName');
  });
});

test.describe('contacts — validation (server 400)', () => {
  test('a first name over 30 characters is rejected on the field', async ({
    page,
    createContactPage,
    data,
  }) => {
    const overLong = data.firstName31Chars({ birthday: null });
    expect(overLong.firstName.length).toBeGreaterThan(30);

    await createContactPage.goto();
    await createContactPage.create(overLong);

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'firstName', /30/);
  });

  test('a last name over 30 characters is rejected on the field', async ({
    page,
    createContactPage,
    data,
  }) => {
    const overLong = data.lastName31Chars({ birthday: null });
    expect(overLong.lastName.length).toBeGreaterThan(30);

    await createContactPage.goto();
    await createContactPage.create(overLong);

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'lastName', /30/);
  });

  test('a future birthday is rejected', async ({ page, createContactPage, data }) => {
    const future = data.birthdayInFuture();

    await createContactPage.goto();
    await createContactPage.create(future);

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'birthday', /future/i);
  });
});
