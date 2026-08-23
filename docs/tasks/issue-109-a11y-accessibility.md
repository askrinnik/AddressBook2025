# Issue #109 (U18) — `tests/a11y/accessibility.spec.ts` (accessibility, @axe-core/playwright)

**Issue:** [#109](https://github.com/askrinnik/AddressBook2025/issues/109) — *UI Tests U18 (опц.): tests/a11y/accessibility.spec.ts*
**Phase:** 3 (optional). **Mode:** test-authoring — the Playwright specs are the deliverable; **no production code** is expected.

## Requirement

Run `@axe-core/playwright` accessibility scans against the three key `AddressBook.Web` pages named in the issue: **Home** (`/`), **Contacts** (`/contacts`), and **Create Contact** (`/create-contact`).

`@axe-core/playwright@4.13.0` is already a `devDependency` in `src/UiTests` — no dependency changes are needed. The layout already reserves the slot: `tests/a11y/accessibility.spec.ts` (see `docs/tasks/ui-tests-framework-plan.md`).

## Acceptance criteria

1. **A11y suite exists** — `src/UiTests/tests/a11y/accessibility.spec.ts` under a `test.describe('a11y — …')` block, importing `test`/`expect` from `src/fixtures/test-fixtures.js` (not `@playwright/test`).
2. **Home is scanned** — an axe scan of `/` reports **no WCAG 2.0/2.1 Level A & AA violations**.
3. **Contacts is scanned** — an axe scan of `/contacts` with a **populated** table (one seeded contact) reports no A/AA violations.
4. **Create Contact is scanned** — an axe scan of `/create-contact` (the contact form) reports no A/AA violations.
5. **Conventions honoured** — fixture-composed page objects drive navigation (`homePage`/`contactsPage`/`createContactPage`), the raw `page` fixture feeds `AxeBuilder`, web-first waits only (page objects’ `goto()` waits for Blazor ready), seeded data via `contactsApi` (auto-cleaned).
6. **Actionable failures** — when a scan finds violations, the failure message lists rule id, impact, help URL and the offending nodes (not a bare `[] !== [n]`).
7. **Green suite** — `npx playwright test tests/a11y` passes, and the full `npm test` stays green; `npm run lint` is clean.

## Affected files

| File | Change |
|---|---|
| `src/UiTests/tests/a11y/accessibility.spec.ts` | **New.** Three tests (Home, Contacts, Create), each scanning with `AxeBuilder`. |

No other files change. This is test-authoring mode: no `AddressBook.Web`, API, or Contracts edits.

## Approach

- Import `AxeBuilder` (default export) from `@axe-core/playwright`; import `test`/`expect` from the UI fixtures.
- Scope every scan with `.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])` — the actionable, industry-standard rule set — so results are stable and meaningful rather than the full experimental catalogue.
- Navigate via the existing page objects so Blazor-ready waiting is reused; hand the `page` fixture to `AxeBuilder({ page })`.
- **Contacts** seeds one `data.tokenized(token)` contact through the `contactsApi` fixture (auto-cleaned in teardown) so the scan covers a real populated MudTable (rows + Edit/Delete icon buttons), then `search(token)` to render exactly that row. This is the a11y-relevant state; an empty table would scan almost nothing.
- A small **local** helper (`expectNoViolations(results)`) formats `results.violations` into a readable message before asserting the array is empty — kept in-file because it is a11y-specific.

### Tests

`src/UiTests/tests/a11y/accessibility.spec.ts` — `describe('a11y — key pages')`:

1. `Home has no detectable WCAG A/AA accessibility violations` — `homePage.goto()` → scan `/`.
2. `Contacts (populated) has no detectable WCAG A/AA accessibility violations` — seed one contact via `contactsApi`, `contactsPage.goto()`, `table.search(token)` → scan `/contacts`.
3. `Create Contact has no detectable WCAG A/AA accessibility violations` — `createContactPage.goto()` → scan `/create-contact`.

Happy-path scans are the whole point of an a11y suite; there are no "boundary/negative" inputs to feed axe here — the negatives are the violations axe would surface. This is the justified no-extra-cases shape for a scan-only spec.

## Verification

- `run-api` + Web via the suite’s `webServer`, then run `tests/a11y` with the `run-tests` skill; all three scans pass. Then re-run full `npm test` and `npm run lint`.
- Per the workflow, the browser UI walk does not apply in test-authoring mode.

## Contingency (pre-existing violations) — TRIGGERED

Verification found real, pre-existing WCAG 2.0 Level A violations on all three pages (MudBlazor icon buttons and a MudTable select with no accessible name). Fixing production markup is out of scope for this test-authoring task, so — per the approved plan — both contingency options were applied together:

- **(a) Defect filed:** [#132](https://github.com/askrinnik/AddressBook2025/issues/132) records the actual UI a11y bugs (`button-name` on Home/Contacts/Create, `aria-input-field-name` on Contacts) with root cause and suggested fix.
- **(b) Documented baseline:** the spec tolerates exactly those known rule ids **per page** (`KNOWN_VIOLATIONS`, each citing #132) and asserts only that **no new** rule types appear. This is explicit and per-page — not a blanket disable — so a fresh violation of any other rule still fails. When #132 is fixed, the baseline entries are removed to re-enforce zero violations.

Observed baseline:

| Page | Baselined rule(s) | Impact | Nodes |
|---|---|---|---|
| `/` | `button-name` | critical | 3 |
| `/contacts` | `button-name`, `aria-input-field-name` | critical / serious | 5 / 1 |
| `/create-contact` | `button-name` | critical | 3 |

The assertion was **not silently weakened**: the tolerance is documented in-file, scoped per page and per rule id, and linked to a tracking defect.

## Out of scope

- Any change to `AddressBook.Web` markup/theme (including fixing violations axe may surface — see contingency).
- Colour-contrast tuning, keyboard-navigation flows, or screen-reader scripting beyond what axe’s static scan covers.
- U19 (README), U20 (CI), U21 (verification) — separate issues.
