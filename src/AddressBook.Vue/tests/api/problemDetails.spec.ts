import {
  getErrors,
  parseProblemDetails,
  ProblemDetailsError,
  type ClientProblemDetails,
} from '@/api/problemDetails';
import { describe, expect, it } from 'vitest';

describe('parseProblemDetails', () => {
  it('reads the standard members', () => {
    const text = JSON.stringify({
      type: 'https://example.test/problem',
      title: 'Not Found',
      status: 404,
      detail: 'No such contact',
      instance: '/contacts/7',
    });

    expect(parseProblemDetails(text)).toEqual({
      type: 'https://example.test/problem',
      title: 'Not Found',
      status: 404,
      detail: 'No such contact',
      instance: '/contacts/7',
    });
  });

  it('matches the standard member names case-insensitively', () => {
    const problem = parseProblemDetails('{"TITLE":"Bad","Status":400,"Detail":"d"}');

    expect(problem).toEqual({ title: 'Bad', status: 400, detail: 'd' });
  });

  it('puts every other member into the extensions and keeps its name as sent', () => {
    const problem = parseProblemDetails('{"title":"Bad","TraceId":"abc","errors":{"x":["y"]}}');

    expect(problem?.extensions).toEqual({ TraceId: 'abc', errors: { x: ['y'] } });
  });

  it('leaves the extensions out when there are none', () => {
    expect(parseProblemDetails('{"title":"Bad"}')).not.toHaveProperty('extensions');
  });

  it('omits a null string member and keeps a null status', () => {
    const problem = parseProblemDetails('{"title":null,"status":null}');

    expect(problem).toEqual({ status: null });
    expect(problem).not.toHaveProperty('title');
  });

  it.each([
    ['null', 'null'],
    ['an array', '[1,2]'],
    ['a string', '"text"'],
    ['a number', '42'],
    ['HTML', '<html><body>Bad gateway</body></html>'],
    ['an empty body', ''],
  ])('returns null for %s', (_name, text) => {
    expect(parseProblemDetails(text)).toBeNull();
  });

  it.each([
    ['a numeric title', '{"title":5}'],
    ['an object detail', '{"detail":{}}'],
    ['a string status', '{"status":"404"}'],
    ['an array type', '{"type":["a"]}'],
  ])('returns null for %s', (_name, text) => {
    expect(parseProblemDetails(text)).toBeNull();
  });
});

describe('getErrors', () => {
  it('returns the errors map', () => {
    const problem: ClientProblemDetails = {
      extensions: { errors: { FirstName: ['Required'], LastName: ['Too long', 'Bad'] } },
    };

    expect(getErrors(problem)).toEqual({ FirstName: ['Required'], LastName: ['Too long', 'Bad'] });
  });

  it('returns an empty map when the problem has no extensions or no errors', () => {
    expect(getErrors({})).toEqual({});
    expect(getErrors({ extensions: null })).toEqual({});
    expect(getErrors({ extensions: { other: 1 } })).toEqual({});
  });

  it.each([
    ['null', null],
    ['an array', ['a']],
    ['a string', 'oops'],
    ['a map with a non-array value', { FirstName: 'Required' }],
    ['a map with a non-string message', { FirstName: [1] }],
  ])('returns an empty map when errors is %s', (_name, errors) => {
    expect(getErrors({ extensions: { errors } })).toEqual({});
  });
});

describe('ProblemDetailsError', () => {
  it('uses the detail as its message and exposes the problem and the status', () => {
    const problem = { title: 'Bad', detail: 'Details', status: 400 };

    const error = new ProblemDetailsError(problem);

    expect(error.message).toBe('Details');
    expect(error.name).toBe('ProblemDetailsError');
    expect(error.problem).toBe(problem);
    expect(error.status).toBe(400);
    expect(error).toBeInstanceOf(Error);
  });

  it('falls back to the title when there is no detail', () => {
    expect(new ProblemDetailsError({ title: 'Bad' }).message).toBe('Bad');
  });
});
