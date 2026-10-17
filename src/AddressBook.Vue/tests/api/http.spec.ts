import { request } from '@/api/http';
import { ProblemDetailsError } from '@/api/problemDetails';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse, problemResponse, textResponse } from '../helpers/responses';

const fetchMock = vi.fn<typeof fetch>();

async function failureOf(promise: Promise<unknown>): Promise<ProblemDetailsError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ProblemDetailsError);
  return error as ProblemDetailsError;
}

describe('request', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it('returns the response of a successful call untouched', async () => {
    const response = jsonResponse({ ok: true });
    fetchMock.mockResolvedValue(response);

    const result = await request('contacts', { method: 'GET' });

    expect(result).toBe(response);
  });

  it('sends the path under the API prefix with the method and no body headers', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await request('contacts/5', { method: 'DELETE' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('http://localhost:5000/api/contacts/5');
    expect(init).toMatchObject({ method: 'DELETE', headers: undefined, body: undefined });
  });

  it('sends a body as JSON with a content type', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));

    await request('contacts', { method: 'POST', body: { firstName: 'Ann' } });

    const init = fetchMock.mock.calls[0][1];
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init?.body).toBe('{"firstName":"Ann"}');
  });

  it('throws the parsed problem of a failed response', async () => {
    fetchMock.mockResolvedValue(
      problemResponse(400, { title: 'Bad', status: 400, errors: { FirstName: ['Required'] } }),
    );

    const error = await failureOf(request('contacts', { method: 'POST' }));

    expect(error.problem.title).toBe('Bad');
    expect(error.status).toBe(400);
    expect(error.problem.extensions).toEqual({ errors: { FirstName: ['Required'] } });
  });

  it('fills a missing title from the status text', async () => {
    fetchMock.mockResolvedValue(problemResponse(404, {}, 'Not Found'));

    const error = await failureOf(request('contacts/1', { method: 'GET' }));

    expect(error.problem.title).toBe('Not Found');
    expect(error.status).toBe(404);
  });

  it('fills a blank title and an empty status text with HTTP and the status', async () => {
    fetchMock.mockResolvedValue(problemResponse(502, { title: '   ' }));

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.problem.title).toBe('HTTP 502');
  });

  it('keeps the status sent in the problem when it has one', async () => {
    fetchMock.mockResolvedValue(problemResponse(500, { title: 'Oops', status: 418 }));

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.status).toBe(418);
  });

  it('builds a problem from the response when the body is not a problem', async () => {
    fetchMock.mockResolvedValue(textResponse('<html>Bad gateway</html>', { status: 502 }));

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.problem).toEqual({ title: 'HTTP 502', status: 502 });
  });

  it('builds a problem from the response when there is no body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.problem).toEqual({ title: 'HTTP 503', status: 503 });
  });

  it('reads a body that arrives in several chunks', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"title":"Chun'));
        controller.enqueue(encoder.encode('ked"}'));
        controller.close();
      },
    });
    fetchMock.mockResolvedValue(new Response(body, { status: 500 }));

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.problem.title).toBe('Chunked');
  });

  it('cuts a body longer than 64 KB, so that it no longer parses', async () => {
    const longBody = JSON.stringify({ title: 'Big', detail: 'x'.repeat(70 * 1024) });
    fetchMock.mockResolvedValue(
      textResponse(longBody, { status: 500, statusText: 'Server Error' }),
    );

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.problem).toEqual({ title: 'Server Error', status: 500 });
  });

  it('parses a body just under the 64 KB limit', async () => {
    const body = JSON.stringify({ title: 'Big', detail: 'x'.repeat(60 * 1024) });
    fetchMock.mockResolvedValue(textResponse(body, { status: 500 }));

    const error = await failureOf(request('contacts', { method: 'GET' }));

    expect(error.problem.title).toBe('Big');
  });

  it('lets an abort pass through unchanged', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValue(abort);

    await expect(request('contacts', { method: 'GET' })).rejects.toBe(abort);
  });

  it('lets a network failure pass through unchanged', async () => {
    const failure = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(failure);

    await expect(request('contacts', { method: 'GET' })).rejects.toBe(failure);
  });

  it('passes the abort signal to fetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}));
    const controller = new AbortController();

    await request('contacts', { method: 'GET', signal: controller.signal });

    expect(fetchMock.mock.calls[0][1]?.signal).toBe(controller.signal);
  });
});
