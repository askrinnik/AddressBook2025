type ProblemErrors = string[] | Record<string, string[]>;

export class ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: ProblemErrors;

  constructor(init?: Partial<ProblemDetails>) {
    Object.assign(this, init);
  }

  static fromJSON(json: unknown): ProblemDetails {
    if (!json || typeof json !== 'object') return new ProblemDetails();
    const obj = json as Record<string, unknown>;

    return new ProblemDetails({
      type: typeof obj.type === 'string' ? obj.type : undefined,
      title: typeof obj.title === 'string' ? obj.title : undefined,
      status:
        typeof obj.status === 'number'
          ? obj.status
          : typeof obj.status === 'string'
            ? Number(obj.status)
            : undefined,
      detail: typeof obj.detail === 'string' ? obj.detail : undefined,
      instance: typeof obj.instance === 'string' ? obj.instance : undefined,
      errors:
        Array.isArray(obj.errors) && obj.errors.every((e) => typeof e === 'string')
          ? (obj.errors as string[])
          : ProblemDetails.isErrorMap(obj.errors)
            ? (obj.errors as Record<string, string[]>)
            : undefined,
    });
  }

  messagesFor(key: string): string[] {
    if (!this.errors || Array.isArray(this.errors)) return [];
    return this.errors[key] ?? [];
  }

  get messages(): string[] {
    if (!this.errors) return [];
    if (Array.isArray(this.errors)) return this.errors;
    return Object.values(this.errors).flat();
  }

  hasErrors(): boolean {
    return this.messages.length > 0;
  }

  private static isErrorMap(value: unknown): value is Record<string, string[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.values(value as Record<string, unknown>).every(
      (v) => Array.isArray(v) && v.every((s) => typeof s === 'string'),
    );
  }
}
