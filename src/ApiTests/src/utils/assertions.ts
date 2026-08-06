import { expect } from '@playwright/test';
import type { z } from 'zod';
import type { ApiResponse } from '../clients/base-api-client.js';
import { ProblemDetails } from '../models/problem-details.js';
import { problemDetailsSchema } from '../schemas/contact.schema.js';

const MAX_BODY_PREVIEW = 2000;

function previewBody(body: unknown): string {
  let text: string;
  try {
    text = typeof body === 'string' ? body : JSON.stringify(body, null, 2);
  } catch {
    text = String(body);
  }
  if (text.length <= MAX_BODY_PREVIEW) return text;
  return `${text.slice(0, MAX_BODY_PREVIEW)}… <truncated ${text.length - MAX_BODY_PREVIEW} chars>`;
}

function fail(message: string): never {
  expect(false, message).toBe(true);
  // Unreachable — expect() above throws — but keeps TS happy about `never`.
  throw new Error(message);
}

export function expectMatchesSchema<T>(body: unknown, schema: z.ZodType<T>): T {
  const result = schema.safeParse(body);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  const message = `Response body does not match schema:\n${issues}\n\nActual body:\n${previewBody(body)}`;
  expect(false, message).toBe(true);
  // Unreachable — expect() above throws — but satisfies eslint/consistent-return.
  throw new Error(message);
}

export interface ExpectedProblemDetails {
  status: number;
  title?: string;
  detail?: string;
  property?: string;
  message?: string | RegExp;
}

function describeMessageMatcher(matcher: string | RegExp): string {
  return matcher instanceof RegExp ? matcher.toString() : JSON.stringify(matcher);
}

function messageMatches(candidate: string, matcher: string | RegExp): boolean {
  return matcher instanceof RegExp ? matcher.test(candidate) : candidate === matcher;
}

export function expectProblemDetails(
  response: ApiResponse<unknown>,
  expected: ExpectedProblemDetails,
): ProblemDetails {
  if (response.status !== expected.status) {
    fail(
      `Expected status ${expected.status}, got ${response.status}. Body:\n${previewBody(response.body)}`,
    );
  }

  const schemaResult = problemDetailsSchema.safeParse(response.body);
  if (!schemaResult.success) {
    const issues = schemaResult.error.issues
      .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    fail(
      `Response body is not a valid RFC 7807 problem-details:\n${issues}\n\nActual body:\n${previewBody(response.body)}`,
    );
  }

  const pd = ProblemDetails.fromJSON(response.body);

  if (expected.title !== undefined && pd.title !== expected.title) {
    fail(`Expected problem-details title ${JSON.stringify(expected.title)}, got ${JSON.stringify(pd.title)}`);
  }
  if (expected.detail !== undefined && pd.detail !== expected.detail) {
    fail(
      `Expected problem-details detail ${JSON.stringify(expected.detail)}, got ${JSON.stringify(pd.detail)}`,
    );
  }

  if (expected.property !== undefined) {
    const messages = pd.messagesFor(expected.property);
    if (messages.length === 0) {
      const availableKeys =
        pd.errors && !Array.isArray(pd.errors) ? Object.keys(pd.errors) : [];
      fail(
        `Expected error(s) for property ${JSON.stringify(expected.property)}, found none. ` +
          `Available property keys: ${JSON.stringify(availableKeys)}. ` +
          `All messages: ${JSON.stringify(pd.messages)}`,
      );
    }

    if (expected.message !== undefined) {
      const matches = messages.some((m) => messageMatches(m, expected.message!));
      if (!matches) {
        fail(
          `No error message for property ${JSON.stringify(expected.property)} matches ${describeMessageMatcher(expected.message)}. ` +
            `Got: ${JSON.stringify(messages)}`,
        );
      }
    }
  } else if (expected.message !== undefined) {
    const matches = pd.messages.some((m) => messageMatches(m, expected.message!));
    if (!matches) {
      fail(
        `No error message matches ${describeMessageMatcher(expected.message)}. Got: ${JSON.stringify(pd.messages)}`,
      );
    }
  }

  return pd;
}
