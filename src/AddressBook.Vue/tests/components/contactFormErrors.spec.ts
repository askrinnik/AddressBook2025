import { ProblemDetailsError } from '@/api/problemDetails';
import { emptyContactFormErrors, toContactFormErrors } from '@/components/contactFormErrors';
import { describe, expect, it } from 'vitest';

function problemWithErrors(errors: unknown): ProblemDetailsError {
  return new ProblemDetailsError({ title: 'Validation failed', extensions: { errors } });
}

describe('emptyContactFormErrors', () => {
  it('has no message on any field and no general message', () => {
    expect(emptyContactFormErrors()).toEqual({
      fields: { firstName: [], lastName: [], birthday: [] },
      general: [],
    });
  });
});

describe('toContactFormErrors', () => {
  it('puts the entries of the form fields on their fields', () => {
    const errors = toContactFormErrors(
      problemWithErrors({
        FirstName: ['First is bad'],
        LastName: ['Last is bad', 'Last is worse'],
        Birthday: ['Birthday is bad'],
      }),
    );

    expect(errors.fields).toEqual({
      firstName: ['First is bad'],
      lastName: ['Last is bad', 'Last is worse'],
      birthday: ['Birthday is bad'],
    });
    expect(errors.general).toEqual([]);
  });

  it('matches the field keys case-insensitively', () => {
    const errors = toContactFormErrors(problemWithErrors({ firstname: ['x'], LASTNAME: ['y'] }));

    expect(errors.fields.firstName).toEqual(['x']);
    expect(errors.fields.lastName).toEqual(['y']);
  });

  it('puts the entries of other keys into the general messages', () => {
    const errors = toContactFormErrors(
      problemWithErrors({ FirstName: ['First is bad'], '': ['Whole form is bad'], Other: ['o'] }),
    );

    expect(errors.fields.firstName).toEqual(['First is bad']);
    expect(errors.general).toEqual(['Whole form is bad', 'o']);
  });

  it('shows the detail of a problem without errors', () => {
    const error = new ProblemDetailsError({ title: 'Title', detail: 'Detail' });

    expect(toContactFormErrors(error).general).toEqual(['Detail']);
  });

  it('shows the title when the detail is blank', () => {
    const error = new ProblemDetailsError({ title: 'Title', detail: '  ' });

    expect(toContactFormErrors(error).general).toEqual(['Title']);
  });

  it('shows a fixed message when the problem has neither detail nor title', () => {
    expect(toContactFormErrors(new ProblemDetailsError({})).general).toEqual([
      'The request failed.',
    ]);
  });

  it('treats an errors member of another shape as no errors', () => {
    const errors = toContactFormErrors(problemWithErrors('oops'));

    expect(errors.general).toEqual(['Validation failed']);
  });

  it('shows the message of another error', () => {
    const errors = toContactFormErrors(new TypeError('Failed to fetch'));

    expect(errors.general).toEqual(['Failed to fetch']);
    expect(errors.fields).toEqual(emptyContactFormErrors().fields);
  });

  it('shows a thrown value that is not an error as text', () => {
    expect(toContactFormErrors('boom').general).toEqual(['boom']);
  });
});
