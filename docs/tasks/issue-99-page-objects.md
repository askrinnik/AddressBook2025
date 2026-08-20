# Implementation plan — Issue #99 (UI Tests U8)

**Title:** UI Tests U8: page objects
**Phase:** 1 — Инфраструктура (framework build-out, see [ui-tests-framework-plan.md](ui-tests-framework-plan.md))
**Mode:** Test-authoring (infrastructure). **No production code.** The pages already exist in `AddressBook.Web`; U8 delivers the page-object layer that composes the U7 component objects — exactly as U7 delivered the components and U5/U6 the API wrapper and data factories.

## 1. Requirement

Add the `pages/*` layer of the UI-test framework: one page object per route, composing the U7 component objects and exposing lazy locators (`getByRole`/`getByLabel`/`getByTestId`). Five files, per the issue body and §4 of the framework plan:

| File | Route | Composes (U7) |
|---|---|---|
| `base.page.ts` | — (abstract) | `AppShell` (present on every page) |
| `home.page.ts` | `/` | — |
| `contacts.page.ts` | `/contacts` | `ContactsTable`, `ConfirmDialog` |
| `create-contact.page.ts` | `/create-contact` | `ContactForm` |
| `edit-contact.page.ts` | `/edit-contact/{id}` | `ContactForm` |

## 2. Acceptance criteria

1. **AC1 — base**: an abstract `BasePage` owns the `Page`, exposes the `AppShell`, and provides navigation with a Blazor-WASM readiness wait (subclasses navigate through it); all pages extend it.
2. **AC2 — home**: `HomePage` navigates to `/` and exposes the page's heading/content for assertion.
3. **AC3 — contacts**: `ContactsPage` navigates to `/contacts` (waiting for the server-reloaded table to settle), exposes the `ContactsTable` and the delete `ConfirmDialog`, and offers the cross-component flows a spec needs (open create, open edit by id, delete-with-confirm, delete-then-cancel).
4. **AC4 — create**: `CreateContactPage` navigates to `/create-contact`, exposes the `ContactForm`, and offers a `create(command)` convenience (fill + submit).
5. **AC5 — edit**: `EditContactPage` navigates to `/edit-contact/{id}`, exposes the `ContactForm` and a `save()` convenience, and exposes the not-found state (`Contact not found.` alert + `Back to Contacts`).
6. **AC6 — conventions**: pages compose the U7 components (no duplicated locators), locators are lazy and follow `getByRole`/`getByLabel` → `getByTestId` → CSS priority, no `waitForTimeout`, web-first auto-waiting; readiness is a real signal, not a fixed delay.
7. **AC7 — quality gate**: `npx tsc --noEmit` clean and `npm run lint` exit 0; each page object is proven to navigate and drive its route against the live API+Web via a **throwaway** spec that is removed afterwards (no `tests/` committed) — matching the U5/U6/U7 verification bar.

## 3. Affected files

All new, under `src/UiTests/src/pages/` (folder is new):

- `base.page.ts` — `BasePage` (abstract)
- `home.page.ts` — `HomePage`
- `contacts.page.ts` — `ContactsPage`
- `create-contact.page.ts` — `CreateContactPage`
- `edit-contact.page.ts` — `EditContactPage`

Docs:

- `docs/tasks/ui-tests-framework-plan.md` — tick the **U8** checkbox `[x]`.
- `docs/tasks/issue-99-page-objects.md` — this plan.

No production code, no `src/ApiTests` changes, no `tests/` files committed.

## 4. Approach

Test-authoring mode, so the order is: **pages → prove → clean up**. No domain/data/contracts/API/Web slice.

**`BasePage` (abstract).** Owns `protected readonly page: Page` and a `readonly shell: AppShell` (the shell is on every route, so navigation/theme come for free on every page). Provides a `protected open(path)` that calls `page.goto(path)` then `waitUntilReady()`, and `waitUntilReady()` that waits for the app-bar title (`Contact Book`) to be visible — a reliable "Blazor WASM booted and the layout rendered" signal that holds even on the edit not-found path. Subclasses expose their own `goto(...)` with the right signature and call `open(...)`.

> Note: the framework plan lists a `utils/blazor.ts` WASM-readiness helper under **U9**. U8 keeps readiness inline in `BasePage` (app-bar-title visible); U9 may refactor `waitUntilReady()` to delegate to `utils/blazor.ts`. Called out so the small overlap is explicit.

**`HomePage`.** `goto()` → `open('/')`. Exposes `heading` (`getByRole('heading', { name: 'Contacts application' })`) for the smoke spec.

**`ContactsPage`.** Fields `table: ContactsTable`, `deleteDialog: ConfirmDialog`. `goto()` → `open('/contacts')` then `table.waitForLoaded()`. Cross-component flows (the reason a page object exists over raw components): `openCreate()` (`table.clickCreate()` → navigates to `/create-contact`), `openEdit(id)` (`table.clickEdit(id)`), `deleteContact(id)` (click delete → dialog open → confirm → dialog closed → reload settled), `cancelDelete(id)` (click delete → dialog open → cancel → dialog closed). The `table`/`deleteDialog` stay public so specs can assert on rows, search, sort, and dialog text directly.

**`CreateContactPage`.** Field `form: ContactForm`. `goto()` → `open('/create-contact')`. `create(command)` = `form.fill(command)` + `form.submit()`. `form` stays public for field-level assertions (validation specs).

**`EditContactPage`.** Field `form: ContactForm`. `goto(id)` → `open(`/edit-contact/${id}`)`. `save()` = `form.submit()` (the form pre-fills existing values; specs mutate fields via the public `form` then `save()`). Not-found surface: `notFoundAlert` (`getByText('Contact not found.')`), `backToContactsButton` (`getByRole('button', { name: 'Back to Contacts' })`), `backToContacts()` action, and `isNotFound()`.

**EF Core migration:** none.

## 5. Tests

Per the workflow's test-authoring mode: **the page objects are the deliverable; no permanent spec is added in U8** (specs are U10–U17). Consistent with U5/U6/U7, correctness is proven with a **throwaway** spec that drives each page against the live API+Web and is deleted before commit — nothing under `tests/` is committed. This is stated explicitly rather than skipped silently.

The throwaway spec will, at minimum:
- **HomePage**: `goto()`, assert `heading` visible and the shell present.
- **ContactsPage**: seed a contact via `ContactsApi`; `goto()`, `table.search(token)`, assert `table.rowById(id)` visible; `openEdit(id)` → URL `/edit-contact/{id}`; back to contacts; `cancelDelete(id)` keeps the row; `deleteContact(id)` removes it.
- **CreateContactPage**: `goto()`, `create(validContact())`, assert URL `/contacts`; clean up the created contact by id via the API.
- **EditContactPage**: seed a contact; `goto(id)`, assert the form pre-filled (first-name value), mutate a field, `save()`, assert URL `/contacts`; then `goto(<non-existent id>)` and assert `isNotFound()`.

Every seeded contact is deleted via `ContactsApi` in teardown (Create → Verify → Delete isolation, unique run-token names).

## 6. Verification (how each AC is checked)

1. `npx tsc --noEmit` — clean (AC7).
2. `npm run lint` — exit 0 (AC7).
3. Start API (`run-api`) + Web (`https` profile) and run the throwaway spec (`run-tests` style) — all pass, each page exercised end-to-end (AC1–AC5), including the edit not-found branch.
4. Manual read-through confirms component composition (no duplicated locators), lazy locators, locator priority, and no `waitForTimeout` (AC6).
5. Delete the throwaway spec; re-run `tsc`/`lint` on the final state; confirm no `tests/` committed (AC7).

## 7. Out of scope / follow-ups

- **No production `.razor`/`.cs` changes.**
- **Fixtures** (`test.extend` injecting pages/components + `contactsApi` + `data` + auto-cleanup) and `utils/assertions.ts` / `utils/blazor.ts` — **U9** (#100). U8 pages are plain classes (`new XPage(page)`); the fixture wiring that lets specs declare them is U9's job, so these files are not imported anywhere yet (same staging as U5's wrapper before U9).
- **Permanent specs** — U10–U17.
- **a11y**, **README**, **CI** — U18–U21.
