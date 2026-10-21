# Issue #219 — Vue V7: Edit page of the Vue frontend

> **Issue:** [#219](https://github.com/askrinnik/AddressBook/issues/219)
> **Lane:** Feature
> **Complexity:** M
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V7

## Requirement

`/edit-contact/:id` in `src/AddressBook.Vue` works like `src/AddressBook.Web/Pages/EditContact.razor`: it loads the contact, shows a progress bar while loading, a warning for an unknown id and an error alert for any other load failure (each with `Back to Contacts`), and otherwise the shared `ContactForm` pre-filled with the contact, saving through `updateContact`. With it the `vue` project runs every spec the `blazor` project runs.

## Acceptance

- [x] The route accepts only an integer id
- [x] An indeterminate progress bar (`aria-label="Loading contact"`) shows while the contact loads
- [x] An unknown id shows the warning alert `Contact not found.` and `Back to Contacts`
- [x] Any other load error shows an error alert with the problem detail, else the title, else `Could not load the contact.`, and `Back to Contacts`; a network or runtime error shows the generic text and goes to the console
- [x] Save validates with the same rules as the Create page, calls the update and goes to `/contacts`; a loaded contact that breaks a rule cannot be saved unchanged
- [x] Server errors map to fields like on the Create page; Cancel goes to `/contacts`
- [x] The page title is `Edit Contact`; the buttons read `Save` and `Cancel`
- [x] The edit, edit-not-found and crud-lifecycle specs run for the `vue` project, so `vue` runs the same specs as `blazor`, and both pass

## Affected files

`src/AddressBook.Vue`: new `src/pages/EditContactPage.vue`; `src/router/index.ts` (`/edit-contact/:id(\\d+)`, title `Edit Contact`, the id passed as a number prop); `README.md`.

`src/UiTests`: `playwright.config.ts` (`vueSpecs` gains `contacts/edit.spec.ts`, `contacts/edit-not-found.spec.ts`, `contacts/crud-lifecycle.spec.ts`; when the list equals every spec, the `vue` project uses the default match); `README.md`.

## Approach

1. **Route.** `path: '/edit-contact/:id(\\d+)'` with `props: route => ({ id: Number(route.params.id) })`; a non-numeric id falls through to the not-found view, like Blazor's `{Id:int}` constraint.
2. **Loading.** On mount the page calls `getContactById(id, signal)` with an `AbortController` aborted on unmount. `null` sets the not-found state; a `ProblemDetailsError` sets the load error to `detail ?? title ?? 'Could not load the contact.'`; any other error (not an abort) sets the generic text and is logged with `console.error`. A loaded contact becomes the form model with `fromDateOnly(birthday)`.
3. **Rendering.** `v-progress-linear indeterminate color="primary" aria-label="Loading contact"` while loading; `v-alert type="warning"` or `type="error"` with an outlined `Back to Contacts` button (`mt-4`); otherwise `ContactForm` with `submit-label="Save"` and a `save` that calls `updateContact(id, model)`; success and Cancel go to `/contacts`.
4. **Specs.** No spec changes; the Vue component objects are complete.

## Tests

- `contacts/edit.spec.ts`, `contacts/edit-not-found.spec.ts`, `contacts/crud-lifecycle.spec.ts` join `vue`.
- Component tests of the load states come with the Vitest task.

## Verification

- `npm run lint`, `npm run type-check`, `npm run format:check`, `npm run build` in `src/AddressBook.Vue`.
- `npx playwright test --project=vue` and `--project=blazor`: the same spec count in both.
- Browser: progress bar, not-found, a load error with a stubbed 500, `/edit-contact/abc` shows the not-found view, saving an edit.

## Out of scope

- Vitest tests; the Vue spec document.

## Decisions

- The load error of a non-problem failure is logged with `console.error`, the counterpart of `ILogger`.
- A non-numeric id renders the app's not-found view, as the Blazor route constraint does.
