# Implementation plan — Issue #97: UI Tests U6: `data/contact.factory.ts` + `tokens.ts`

- **Issue:** [#97](https://github.com/askrinnik/AddressBook2025/issues/97) — *UI Tests U6: data/contact.factory.ts + tokens.ts*
- **Parent plan:** [docs/tasks/ui-tests-framework-plan.md](ui-tests-framework-plan.md) — Фаза 1 (U6)
- **Depends on:** U1–U5 (merged); reuses the `CreateContactCommand` type from U5's `api/contacts-api.ts`
- **Type:** test infrastructure (no production code, no permanent specs)
- **Labels:** none

## 1. Requirement

Provide test-data builders for the UI suite: faker-based contact factories with **named boundary
variants** (valid, with/without birthday, name length 30/31, whitespace, future date) plus a
**unique run-token** generator so data is self-contained, searchable, and isolated on the shared
SQL Server DB under parallel runs. Reuse the approach already proven in `src/ApiTests`.

## 2. Scope boundary

- **In scope:** `src/UiTests/src/data/tokens.ts` and `src/UiTests/src/data/contact.factory.ts`.
- **Out of scope / later:** the `data` **fixture** that surfaces the factory to tests → U9 (#100);
  component/page objects → U7–U8; specs (which consume the variants) → U10–U17. No production code,
  no API change.

## 3. Work mode note

Test infrastructure, pure functions, no permanent specs (they begin at U10). Verification is
`tsc` + lint plus a **throwaway** spec asserting the factory/token invariants, then removed (§7).

## 4. Files

| File | Change |
|---|---|
| `src/UiTests/src/data/tokens.ts` | **New.** `RUN_TOKEN` (per-process/per-worker) + `newTestToken()`. |
| `src/UiTests/src/data/contact.factory.ts` | **New.** `ContactFactory` with the named variants. |
| `docs/tasks/issue-97-contact-factory.md` | **New.** This plan. |
| `docs/tasks/ui-tests-framework-plan.md` | Tick the **U6** checkbox to `[x]`. |

Temporary, **not committed**: a throwaway `tests/_factory-check.spec.ts` for §7, deleted before commit.

## 5. Design (mirrors `src/ApiTests/src/data/*`, adapted)

**`tokens.ts`** — replicated from ApiTests (the token strategy is a shared fact):
- `RUN_TOKEN` = 6-char base36 from `crypto.randomBytes`, stable within a Node process → fresh per
  run and per Playwright worker (each worker is its own process).
- `newTestToken()` = `${RUN_TOKEN}-${seq}-${rand4}`, unique per call, always prefixed with
  `RUN_TOKEN` so a failed test's rows are grep-able in the DB by the run's shared prefix.

**`contact.factory.ts`** — `ContactFactory` producing the U5 `CreateContactCommand`
(`{ firstName, lastName, birthday? }`), imported from `../api/contacts-api.js` so the factory and
the seed wrapper share one type (no drift). `MAX_NAME_LENGTH = 30` (confirmed against the API's
`CreateContactCommandValidator` / `UpdateContactCommandValidator` — both `MaximumLength(30)`).
Names embed `RUN_TOKEN` so search-by-token UI tests (U11) can isolate their rows. Birthdays are
`YYYY-MM-DD` strings (the API contract shape); converting to a `Date` for the MudDatePicker is the
U7 component object's concern. Static methods:

| Method | Produces |
|---|---|
| `validContact(overrides?)` | faker names + `RUN_TOKEN`, both ≤30, a past birthday |
| `validContactWithoutBirthday(overrides?)` | valid, `birthday: null` |
| `firstName30Chars` / `lastName30Chars` | that name padded to exactly 30 (valid boundary) |
| `firstName31Chars` / `lastName31Chars` | that name padded to exactly 31 (over the limit) |
| `emptyFirstName` / `emptyLastName` | that name `''` |
| `whitespaceFirstName` / `whitespaceLastName` | that name `'   '` (documented edge input) |
| `birthdayInFuture(overrides?)` | valid + tomorrow's date |
| `birthdayToday(overrides?)` | valid + today's date |

All accept a `Partial<CreateContactCommand>` `overrides` argument for per-test tweaks. Helper
internals (`formatDate`, `today`/`tomorrow`, `pastBirthday`, `validName`, `paddedName`) mirror
ApiTests.

## 6. Tests

**No permanent specs** in this task — the specs that consume these variants are U10–U17 and the
`data` fixture is U9. Explicitly-justified no-permanent-test case; the throwaway check in §7 is
verification scaffolding, not a deliverable.

## 7. Verification

| # | Acceptance item | How verified |
|---|---|---|
| 1 | `tokens.ts`: `RUN_TOKEN` + unique `newTestToken()` | Throwaway spec: two `newTestToken()` differ and both start with `RUN_TOKEN` |
| 2 | `validContact` has token-embedded names ≤30 and a past birthday | Throwaway spec asserts length, `RUN_TOKEN` substring, date `< today` |
| 3 | `validContactWithoutBirthday` → `birthday: null` | Throwaway spec |
| 4 | `firstName30Chars`/`firstName31Chars` (and lastName) exact lengths 30/31 | Throwaway spec asserts `.length` |
| 5 | `whitespace*` → `'   '`; `empty*` → `''` | Throwaway spec |
| 6 | `birthdayInFuture` > today; `birthdayToday` == today | Throwaway spec compares dates |
| 7 | Reuses ApiTests approach; shares the U5 `CreateContactCommand` type | Read file |
| 8 | Type-checks / lint | `npx tsc --noEmit` clean; `npm run lint` exit 0 |

The throwaway spec is pure (no API/UI needed); Playwright will still boot the `webServer` array —
that overhead is harmless here. Spec is deleted after it passes. `dotnet build` is not a gate.

## 8. Out of scope / follow-ups

`data` fixture (U9), component/page objects (U7–U8), specs (U10–U17). No production or API changes.
