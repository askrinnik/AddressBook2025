import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface ApiResponse<TBody = unknown> {
  status: number;
  headers: Record<string, string>;
  body: TBody;
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  query?: QueryParams;
  data?: unknown;
  headers?: Record<string, string>;
}

/**
 * Thin, stateless wrapper over Playwright's `APIRequestContext`.
 * Returns the raw response shape as `{ status, headers, body }` — no assertions:
 * every check belongs in the tests, not in the client.
 */
export class BaseApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.get(this.buildUrl(path, options?.query), {
      headers: options?.headers,
    });
    return this.toApiResponse<T>(response);
  }

  async post<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.post(this.buildUrl(path, options?.query), {
      data: options?.data,
      headers: options?.headers,
    });
    return this.toApiResponse<T>(response);
  }

  async put<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.put(this.buildUrl(path, options?.query), {
      data: options?.data,
      headers: options?.headers,
    });
    return this.toApiResponse<T>(response);
  }

  async delete<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    const response = await this.request.delete(this.buildUrl(path, options?.query), {
      headers: options?.headers,
    });
    return this.toApiResponse<T>(response);
  }

  private buildUrl(path: string, query?: QueryParams): string {
    if (!query) return path;
    const encoded: string[] = [];
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      encoded.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
    if (encoded.length === 0) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}${encoded.join('&')}`;
  }

  private async toApiResponse<T>(response: APIResponse): Promise<ApiResponse<T>> {
    const status = response.status();
    const headers = response.headers();
    const body = await this.parseBody(response, headers);
    return { status, headers, body: body as T };
  }

  private async parseBody(
    response: APIResponse,
    headers: Record<string, string>,
  ): Promise<unknown> {
    const raw = await response.text();
    if (raw.length === 0) return undefined;
    const contentType = headers['content-type'] ?? '';
    if (contentType.includes('json')) {
      try {
        return JSON.parse(raw);
      } catch {
        // Malformed JSON is surfaced as the raw string so tests can inspect it.
        return raw;
      }
    }
    return raw;
  }
}
