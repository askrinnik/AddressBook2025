import {
  createContact,
  deleteContact,
  getContactById,
  getFilteredContacts,
  updateContact,
} from '@/api/contactsApi';
import { ProblemDetailsError } from '@/api/problemDetails';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, problemResponse } from '../helpers/responses';

const fetchMock = vi.fn<typeof fetch>();

function lastCall(): { url: string; init: RequestInit } {
  const [url, init] = fetchMock.mock.calls.at(-1)!;
  return { url: String(url), init: init ?? {} };
}

function created(location?: string): Response {
  return new Response(null, { status: 201, headers: location ? { Location: location } : {} });
}

describe('contactsApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  describe('getFilteredContacts', () => {
    it('returns the parsed response', async () => {
      const body = {
        totalRows: 1,
        rows: [{ id: 1, firstName: 'A', lastName: 'B', birthday: null }],
      };
      fetchMock.mockResolvedValue(jsonResponse(body));

      await expect(getFilteredContacts('')).resolves.toEqual(body);
    });

    it.each([[''], ['   ']])('sends no search for the blank term "%s"', async (term) => {
      fetchMock.mockResolvedValue(jsonResponse({ totalRows: 0, rows: [] }));

      await getFilteredContacts(term);

      expect(lastCall().url).toBe('http://localhost:5000/api/contacts');
    });

    it('sends the term percent-encoded, including the characters encodeURIComponent keeps', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ totalRows: 0, rows: [] }));

      await getFilteredContacts("a b&c!'()*");

      expect(lastCall().url).toBe(
        'http://localhost:5000/api/contacts?search=a%20b%26c%21%27%28%29%2A',
      );
    });

    it('does not trim a term that is not blank', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ totalRows: 0, rows: [] }));

      await getFilteredContacts(' ann ');

      expect(lastCall().url).toContain('search=%20ann%20');
    });
  });

  describe('deleteContact', () => {
    it('sends DELETE for the contact', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      await deleteContact(12);

      expect(lastCall().url).toBe('http://localhost:5000/api/contacts/12');
      expect(lastCall().init.method).toBe('DELETE');
    });

    it('rejects with the problem of a failure', async () => {
      fetchMock.mockResolvedValue(problemResponse(404, { title: 'Gone' }));

      await expect(deleteContact(12)).rejects.toBeInstanceOf(ProblemDetailsError);
    });
  });

  describe('createContact', () => {
    const model = { firstName: 'Ann', lastName: 'Lee', birthday: new Date(2000, 0, 5) };

    it('posts the contact with the birthday as a date-only string', async () => {
      fetchMock.mockResolvedValue(created('/api/contacts/9'));

      await createContact(model);

      expect(lastCall().init.method).toBe('POST');
      expect(JSON.parse(lastCall().init.body as string)).toEqual({
        firstName: 'Ann',
        lastName: 'Lee',
        birthday: '2000-01-05',
      });
    });

    it('posts a null birthday when none is picked', async () => {
      fetchMock.mockResolvedValue(created());

      await createContact({ ...model, birthday: null });

      expect(JSON.parse(lastCall().init.body as string).birthday).toBeNull();
    });

    it.each([
      ['an absolute URL', 'http://localhost:5000/api/contacts/42', 42],
      ['a relative path', '/api/contacts/42', 42],
      ['a trailing slash', '/api/contacts/42/', 0],
      ['a non-numeric last segment', '/api/contacts/abc', 0],
      ['a signed number', '/api/contacts/-7', -7],
      ['a number beyond the safe range', '/api/contacts/99999999999999999999', 1e20],
    ])('reads the id from %s', async (_name, location, expected) => {
      fetchMock.mockResolvedValue(created(location));

      await expect(createContact(model)).resolves.toBe(expected);
    });

    it('returns 0 when the response has no Location header', async () => {
      fetchMock.mockResolvedValue(created());

      await expect(createContact(model)).resolves.toBe(0);
    });
  });

  describe('getContactById', () => {
    it('returns the contact', async () => {
      const contact = { id: 3, firstName: 'A', lastName: 'B', birthday: '2000-01-01' };
      fetchMock.mockResolvedValue(jsonResponse(contact));

      await expect(getContactById(3)).resolves.toEqual(contact);
    });

    it('returns null for a 404', async () => {
      fetchMock.mockResolvedValue(problemResponse(404, { title: 'Not Found' }));

      await expect(getContactById(3)).resolves.toBeNull();
    });

    it('rethrows other problems', async () => {
      fetchMock.mockResolvedValue(problemResponse(500, { title: 'Oops' }));

      await expect(getContactById(3)).rejects.toBeInstanceOf(ProblemDetailsError);
    });

    it('rethrows a network failure', async () => {
      const failure = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValue(failure);

      await expect(getContactById(3)).rejects.toBe(failure);
    });
  });

  describe('updateContact', () => {
    it('puts the contact with its id', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

      await updateContact(5, { firstName: 'Ann', lastName: 'Lee', birthday: null });

      expect(lastCall().url).toBe('http://localhost:5000/api/contacts/5');
      expect(lastCall().init.method).toBe('PUT');
      expect(JSON.parse(lastCall().init.body as string)).toEqual({
        id: 5,
        firstName: 'Ann',
        lastName: 'Lee',
        birthday: null,
      });
    });

    it('rejects with the problem of a failure', async () => {
      fetchMock.mockResolvedValue(problemResponse(400, { title: 'Bad' }));

      await expect(
        updateContact(5, { firstName: '', lastName: '', birthday: null }),
      ).rejects.toBeInstanceOf(ProblemDetailsError);
    });
  });
});
