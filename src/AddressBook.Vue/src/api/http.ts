import { apiPrefix } from '../config';
import {
  parseProblemDetails,
  ProblemDetailsError,
  type ClientProblemDetails,
} from './problemDetails';

/** Largest number of response-body bytes read when building a problem. */
const maxErrorBodyBytes = 64 * 1024;

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Sent as a JSON body when present. */
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Sends a request to the API and returns the response when it succeeds.
 * A non-success response throws a `ProblemDetailsError`; an abort or a network failure passes through unchanged.
 */
export async function request(path: string, options: RequestOptions): Promise<Response> {
  const url = new URL(path, apiPrefix);
  const hasBody = options.body !== undefined;

  const response = await fetch(url, {
    method: options.method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) throw new ProblemDetailsError(await buildProblem(response));
  return response;
}

/** Builds the problem of a failed response, filling a missing title and status from the response itself. */
async function buildProblem(response: Response): Promise<ClientProblemDetails> {
  const text = await readLimitedText(response);
  const problem = parseProblemDetails(text) ?? {};

  if (!problem.title?.trim()) problem.title = response.statusText || `HTTP ${response.status}`;
  if (problem.status == null) problem.status = response.status;
  return problem;
}

/** Reads at most `maxErrorBodyBytes` bytes of the body as text; a longer body is cut off. */
async function readLimitedText(response: Response): Promise<string> {
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (total < maxErrorBodyBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = value.subarray(0, maxErrorBodyBytes - total);
    chunks.push(chunk);
    total += chunk.length;
  }
  await reader.cancel();

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder().decode(bytes);
}
