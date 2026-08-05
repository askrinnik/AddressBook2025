import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// In CI load .env.ci first; a local .env.local overrides it on developer machines.
if (process.env.CI) {
  dotenv.config({ path: path.resolve(packageRoot, '.env.ci') });
}
dotenv.config({ path: path.resolve(packageRoot, '.env.local') });

const envSchema = z.object({
  BASE_URL: z
    .string()
    .url()
    // Trailing slash keeps `new URL('Contacts', BASE_URL)` from dropping the /api segment.
    .refine((value) => value.endsWith('/'), 'BASE_URL must end with a trailing slash')
    .default('http://localhost:5000/api/'),
  API_TIMEOUT: z.coerce.number().int().positive().default(30_000),
  EXPECT_TIMEOUT: z.coerce.number().int().positive().default(5_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid API test environment configuration:\n${details}`);
}

export interface Env {
  baseURL: string;
  apiTimeout: number;
  expectTimeout: number;
}

export const env: Env = {
  baseURL: parsed.data.BASE_URL,
  apiTimeout: parsed.data.API_TIMEOUT,
  expectTimeout: parsed.data.EXPECT_TIMEOUT,
};
