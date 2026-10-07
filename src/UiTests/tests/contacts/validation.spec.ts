import { expect, test } from '../../src/fixtures/test-fixtures.js';
import { expectFieldError, expectNoFieldError } from '../../src/utils/assertions.js';

/*
 * Contact-form validation through the UI (U16), exercised on the create form.
 *
 * Client: `CreateContactModel` mirrors the API rules (Required, at most 30 characters for the names,
 * birthday not later than the current UTC date). A blocked submit stays on `/create-contact` (the page
 * returns before calling the API) and shows the inline message. The date picker also disables the days
 * after the UTC today.
 * Every rejected submit creates nothing, so there is nothing to clean up.
 *
 * All checks are web-first (the error accessors are `expect.poll`-backed); no fixed delays.
 */

const ON_CREATE_PAGE = /\/create-contact$/;

test.describe('contacts — validation (client)', () => {
  test('empty First name blocks submit', async ({ page, createContactPage }) => {
    await createContactPage.goto();
    await createContactPage.form.fillLastName('Valid-Last');
    await createContactPage.form.submit();

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'firstName', /The First name field is required/);
    await expectNoFieldError(createContactPage.form, 'lastName');
  });

  test('empty Last name blocks submit', async ({ page, createContactPage }) => {
    await createContactPage.goto();
    await createContactPage.form.fillFirstName('Valid-First');
    await createContactPage.form.submit();

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'lastName', /The Last name field is required/);
    await expectNoFieldError(createContactPage.form, 'firstName');
  });

  test('a whitespace-only First name blocks submit', async ({ page, createContactPage }) => {
    await createContactPage.goto();
    await createContactPage.form.fillFirstName('   ');
    await createContactPage.form.fillLastName('Valid-Last');
    await createContactPage.form.submit();

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(createContactPage.form, 'firstName', /The First name field is required/);
    await expectNoFieldError(createContactPage.form, 'lastName');
  });

  test('a first name over 30 characters blocks submit', async ({
    page,
    createContactPage,
    data,
  }) => {
    const overLong = data.firstName31Chars({ birthday: null });
    expect(overLong.firstName.length).toBeGreaterThan(30);

    await createContactPage.goto();
    await createContactPage.create(overLong);

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(
      createContactPage.form,
      'firstName',
      'The field First name must be a string with a maximum length of 30.',
    );
    await expectNoFieldError(createContactPage.form, 'lastName');
  });

  test('a last name over 30 characters blocks submit', async ({
    page,
    createContactPage,
    data,
  }) => {
    const overLong = data.lastName31Chars({ birthday: null });
    expect(overLong.lastName.length).toBeGreaterThan(30);

    await createContactPage.goto();
    await createContactPage.create(overLong);

    await expect(page).toHaveURL(ON_CREATE_PAGE);
    await expectFieldError(
      createContactPage.form,
      'lastName',
      'The field Last name must be a string with a maximum length of 30.',
    );
    await expectNoFieldError(createContactPage.form, 'firstName');
  });

  test('the birthday picker disables the days after today (UTC)', async ({ createContactPage }) => {
    const now = new Date();
    const todayUtc = now.getUTCDate();
    const daysInMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const picker = createContactPage.form.birthday;

    await createContactPage.goto();
    await picker.open();

    // The popover opens on the current month: the UTC today and the earlier days are chosen, the rest are refused.
    await expect(picker.enabledDays).toHaveCount(todayUtc);
    await expect(picker.disabledDays).toHaveCount(daysInMonth - todayUtc);
  });
});

/*
 * The birthday rule compares against the UTC date, not the browser's local date. The browser runs in
 * UTC+14 with its clock fixed at 2026-03-10 23:30 UTC, when the local date is already 2026-03-11:
 * the picker offers March 1-10 and refuses March 11 onwards.
 */
test.describe('contacts — validation (client), browser time zone ahead of UTC', () => {
  test.use({ timezoneId: 'Pacific/Kiritimati' });

  test('the birthday picker offers the UTC today, not the local today', async ({
    page,
    createContactPage,
  }) => {
    await page.clock.setFixedTime(new Date('2026-03-10T23:30:00Z'));
    const picker = createContactPage.form.birthday;

    await createContactPage.goto();
    await picker.open();

    await expect(picker.enabledDays).toHaveCount(10);
    await expect(picker.disabledDays).toHaveCount(31 - 10);
  });
});
