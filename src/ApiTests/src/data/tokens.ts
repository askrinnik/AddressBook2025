import { randomBytes } from 'node:crypto';

const BASE36_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function base36Token(length: number): string {
  // randomBytes → base36: uniform distribution via 8-bit → 36-symbol mapping is close enough
  // for uniqueness, and the alphabet is url/DB-safe (no case sensitivity, no separators).
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += BASE36_ALPHABET[bytes[i] % BASE36_ALPHABET.length];
  }
  return out;
}

// Stable within the current Node process; a fresh value on every test run and every
// Playwright worker (each worker is a separate process).
export const RUN_TOKEN: string = base36Token(6);

let sequence = 0;

// Unique per invocation; always starts with `RUN_TOKEN` so a failed test's data is
// grep-able in the database by the run's shared prefix.
export function newTestToken(): string {
  sequence += 1;
  return `${RUN_TOKEN}-${sequence.toString(36)}-${base36Token(4)}`;
}
