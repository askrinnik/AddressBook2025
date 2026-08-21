# Issue #107 (U16) — `tests/contacts/validation.spec.ts`

**Mode:** Test-authoring (Phase 2). Validation already works in `AddressBook.Web` / the API; the
Playwright UI specs are the deliverable. **No production code changes.**

## Requirement

Cover contact-form validation through the UI (the create form):

- **Client:** empty First / Last name block submit (DataAnnotations `[Required]`).
- **Server:** name length > 30 and a future birthday → API 400 → the messages surface on the form.

## How it behaves (verified in code)

- **Client** (`CreateContactModel`): `[Required]` on `FirstName` / `LastName` only. `HandleCreateContact`
  calls `EditContext.Validate()`; on failure it **returns without calling the API** (no navigation).
  The error renders inline (MudBlazor helper text) and in `<ValidationSummary>`. Default message:
  `The FirstName field is required.` / `The LastName field is required.`
- **Server** (`CreateContactCommandValidator`, FluentValidation): `MaximumLength(30)` on both names
  and `Birthday <= today` (message `Birthday cannot be in the future`). There is **no** client-side
  length/date rule, so an over-length name or future date passes client validation, the POST returns
  **400** with `errors` keyed by `FirstName` / `LastName` / `Birthday` (PascalCase — confirmed in
  `src/ApiTests`), and `HandleCreateContact` maps each into the `EditContext` for that field.

## Reusing existing infrastructure

- `CreateContactPage.goto()` / `create(command)` / `form` (fill/submit). `ContactFactory`
  boundary builders: `firstName31Chars`, `lastName31Chars`, `birthdayInFuture`.
- Domain assertions (U9): `expectFieldError` (inline `.mud-input-error`), `expectNoFieldError`,
  `expectSummaryError` (`<ValidationSummary>`).
- No seeding needed: client-blocked and server-rejected (400) submits **create nothing**, so no
  contact is persisted and there is nothing to clean up.

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/contacts/validation.spec.ts` | **New** spec — the deliverable. |
| `src/UiTests/src/components/contact-form.component.ts` | Extend `NamedField` with `birthday` so `errorFor`/`expectFieldError` can read the birthday field error (test infra). |

No production changes.

> **Finding on the running app:** all server field errors (First/Last **and** Birthday) render
> **inline** under their field (`.mud-input-error`), not in the `<ValidationSummary>` (which only
> carries model-level/general errors). So the birthday case is asserted with
> `expectFieldError(form, 'birthday', /future/i)`, which required adding `birthday` to `NamedField`.

## Test plan — `validation.spec.ts`

**Client (`[Required]`, submit blocked, no navigation):**

1. **empty First name blocks submit** — fill a valid Last name, leave First empty, submit. Assert the
   URL is still `/create-contact`, `expectFieldError(firstName, /required/i)`, and
   `expectNoFieldError(lastName)`.
2. **empty Last name blocks submit** — symmetric (First valid, Last empty).

**Server (client passes → 400 → message on the form):**

3. **first name over 30 chars → server error on the field** — `firstName31Chars({birthday:null})`,
   `create()`. Assert URL still `/create-contact` and `expectFieldError(firstName, /30/)`.
4. **last name over 30 chars → server error on the field** — symmetric.
5. **future birthday → server error** — `birthdayInFuture()`, `create()` (the date picker selects
   tomorrow). Assert URL still `/create-contact` and `expectFieldError(birthday, /future/i)` (the
   message renders inline under the date-picker field).

All checks web-first (`expect.poll`-backed error accessors); no fixed delays.

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| 1 | Empty First name blocks submit (Required) | test 1 |
| 2 | Empty Last name blocks submit (Required) | test 2 |
| 3 | Name length > 30 → server 400 → message on the form | tests 3 & 4 |
| 4 | Future birthday → server 400 → message on the form | test 5 |

## Out of scope

- Whitespace-only names and exact-30 boundary (covered by `src/ApiTests`); full CRUD → U17.
- No production Blazor/API/contract changes.

## Verification

Start the API (`run-api`); the Playwright `webServer` also starts Web. Run `validation.spec.ts`
(chromium). `npm run lint` and `tsc --noEmit` clean. No browser walk.
