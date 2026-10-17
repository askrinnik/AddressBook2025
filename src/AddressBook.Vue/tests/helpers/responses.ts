/** A JSON response with the given body. */
export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

/** A failed response with a problem-details body. */
export function problemResponse(
  status: number,
  problem: Record<string, unknown> = {},
  statusText = '',
): Response {
  return new Response(JSON.stringify(problem), {
    status,
    statusText,
    headers: { 'Content-Type': 'application/problem+json' },
  });
}

/** A response with a plain-text body. */
export function textResponse(text: string, init: ResponseInit = {}): Response {
  return new Response(text, init);
}
