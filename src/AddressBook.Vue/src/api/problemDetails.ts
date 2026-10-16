/** An RFC 7807 problem details response; members beyond the standard ones are the extensions. */
export interface ClientProblemDetails {
  type?: string;
  title?: string;
  status?: number | null;
  detail?: string;
  instance?: string;
  /** Extension members of the problem object. */
  extensions?: Record<string, unknown> | null;
}

/** Thrown for every non-success API response. */
export class ProblemDetailsError extends Error {
  readonly problem: ClientProblemDetails;

  constructor(problem: ClientProblemDetails) {
    super(problem.detail || problem.title);
    this.name = 'ProblemDetailsError';
    this.problem = problem;
  }

  /** The HTTP status of the problem. */
  get status(): number | null | undefined {
    return this.problem.status;
  }
}

const stringMembers = ['type', 'title', 'detail', 'instance'] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parses a response body as problem details. Standard member names match case-insensitively and
 * every other member goes to `extensions`. Returns null when the text is not a JSON object or a
 * standard member has the wrong type.
 */
export function parseProblemDetails(text: string): ClientProblemDetails | null {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isPlainObject(json)) return null;

  const problem: ClientProblemDetails = {};
  const extensions: Record<string, unknown> = {};

  for (const [name, value] of Object.entries(json)) {
    const lowerName = name.toLowerCase();
    const stringMember = stringMembers.find((member) => member === lowerName);

    if (stringMember) {
      if (value !== null && typeof value !== 'string') return null;
      if (value !== null) problem[stringMember] = value;
    } else if (lowerName === 'status') {
      if (value !== null && typeof value !== 'number') return null;
      problem.status = value;
    } else {
      extensions[name] = value;
    }
  }

  if (Object.keys(extensions).length > 0) problem.extensions = extensions;
  return problem;
}

/** Returns the `errors` map (field name to messages), or an empty map when there is none or it has another shape. */
export function getErrors(problem: ClientProblemDetails): Record<string, string[]> {
  const errors = problem.extensions?.errors;
  if (!isPlainObject(errors)) return {};

  const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string');

  return Object.values(errors).every(isStringArray) ? (errors as Record<string, string[]>) : {};
}
