import { z } from 'zod';

// Birthday is serialized by the API as an ISO date (yyyy-MM-dd) or null.
export const birthdaySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be a yyyy-MM-dd date')
  .nullable();

// Strict: contract tests must catch drift such as leaked phones or ownerId.
export const contactModelSchema = z
  .object({
    id: z.number().int(),
    firstName: z.string(),
    lastName: z.string(),
    birthday: birthdaySchema,
  })
  .strict();

export const getFilteredContactsResponseSchema = z
  .object({
    totalRows: z.number().int(),
    rows: z.array(contactModelSchema),
  })
  .strict();

// RFC 7807 problem+json; not strict because ASP.NET adds extensions like traceId.
export const problemDetailsSchema = z.object({
  type: z.string().optional(),
  title: z.string().optional(),
  status: z.number().int().optional(),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ContactModel = z.infer<typeof contactModelSchema>;
export type GetFilteredContactsResponse = z.infer<typeof getFilteredContactsResponseSchema>;
export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
