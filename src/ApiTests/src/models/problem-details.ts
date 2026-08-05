import type { z } from 'zod';
import type { problemDetailsSchema } from '../schemas/contact.schema.js';

// RFC 7807 does not standardise the `errors` shape; ASP.NET returns a property→messages map
// for validation failures, while some hand-crafted payloads use a flat list. Support both.
export type ProblemErrors = string[] | Record<string, string[]>;

// Structural superset of the T4 zod schema: same names/types, `errors` widened to accept the
// flat-array form as well. An instance built from a validation response still parses cleanly
// against `problemDetailsSchema`.
export interface ProblemDetailsShape
  extends Omit<z.infer<typeof problemDetailsSchema>, 'errors'> {
  errors?: ProblemErrors;
}

export class ProblemDetails implements ProblemDetailsShape {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly errors?: ProblemErrors;

  private constructor(init: ProblemDetailsShape) {
    this.type = init.type;
    this.title = init.title;
    this.status = init.status;
    this.detail = init.detail;
    this.instance = init.instance;
    this.errors = init.errors;
  }

  static fromJSON(json: unknown): ProblemDetails {
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return new ProblemDetails({});
    }
    const obj = json as Record<string, unknown>;
    return new ProblemDetails({
      type: typeof obj.type === 'string' ? obj.type : undefined,
      title: typeof obj.title === 'string' ? obj.title : undefined,
      status: ProblemDetails.coerceStatus(obj.status),
      detail: typeof obj.detail === 'string' ? obj.detail : undefined,
      instance: typeof obj.instance === 'string' ? obj.instance : undefined,
      errors: ProblemDetails.coerceErrors(obj.errors),
    });
  }

  messagesFor(propertyName: string): string[] {
    if (!this.errors || Array.isArray(this.errors)) return [];
    return this.errors[propertyName] ?? [];
  }

  get messages(): string[] {
    if (!this.errors) return [];
    if (Array.isArray(this.errors)) return [...this.errors];
    return Object.values(this.errors).flat();
  }

  hasErrors(): boolean {
    return this.messages.length > 0;
  }

  private static coerceStatus(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  }

  private static coerceErrors(value: unknown): ProblemErrors | undefined {
    if (Array.isArray(value)) {
      return value.every((item) => typeof item === 'string') ? (value as string[]) : undefined;
    }
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      const isMap = entries.every(
        ([, v]) => Array.isArray(v) && v.every((s) => typeof s === 'string'),
      );
      return isMap ? (value as Record<string, string[]>) : undefined;
    }
    return undefined;
  }
}
