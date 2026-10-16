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
