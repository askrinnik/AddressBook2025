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

// Trailing slash keeps `new URL('path', base)` from dropping the last URL segment.
const trailingSlash = (value: string): boolean => value.endsWith('/');

const envSchema = z.object({
  // Web app under test (Blazor WASM, https launch profile).
  BASE_URL: z
    .string()
    .url()
    .refine(trailingSlash, 'BASE_URL must end with a trailing slash')
    .default('https://localhost:7187/'),
  // API used for hybrid seed/cleanup and as the webServer readiness probe.
  API_URL: z
    .string()
    .url()
    .refine(trailingSlash, 'API_URL must end with a trailing slash')
    .default('http://localhost:5000/api/'),
  HEADLESS: z
    .preprocess(
      (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
      z.enum(['true', 'false']),
    )
    .default('true'),
  EXPECT_TIMEOUT: z.coerce.number().int().positive().default(10_000),
  ACTION_TIMEOUT: z.coerce.number().int().positive().default(15_000),
  NAVIGATION_TIMEOUT: z.coerce.number().int().positive().default(30_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid UI test environment configuration:\n${details}`);
}

export interface Env {
  baseURL: string;
  apiURL: string;
  headless: boolean;
  expectTimeout: number;
  actionTimeout: number;
  navigationTimeout: number;
}

export const env: Env = {
  baseURL: parsed.data.BASE_URL,
  apiURL: parsed.data.API_URL,
  headless: parsed.data.HEADLESS === 'true',
  expectTimeout: parsed.data.EXPECT_TIMEOUT,
  actionTimeout: parsed.data.ACTION_TIMEOUT,
  navigationTimeout: parsed.data.NAVIGATION_TIMEOUT,
};
