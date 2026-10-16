# Issue #218 — Vue V6: Contact form and Create page of the Vue frontend

> **Issue:** [#218](https://github.com/askrinnik/AddressBook2025/issues/218)
> **Lane:** Feature
> **Complexity:** L
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V6

## Requirement

`/create-contact` in `src/AddressBook.Vue` works like `src/AddressBook.Web/Pages/CreateContact.razor`: First name, Last name and a read-only Birthday picker in a card with Create and Cancel; client rules from `contactRules.ts`, which mirrors `ContactRules`, `[Required]`, `[StringLength]` and `[NotInFuture]`; server field errors on their fields and other errors in a summary list; submit disabled while the call runs; success and Cancel go to `/contacts`. `ContactForm.vue` is reusable by the Edit page. The create, validation and a11y specs of `src/UiTests` run in the `vue` project.

## Acceptance

- [x] The form has First name, Last name and Birthday with the testids `contact-form-first-name`, `contact-form-last-name`, `contact-form-birthday`, and the buttons `contact-form-submit` and `contact-form-cancel`
- [x] An empty or whitespace-only name shows `The First name field is required.` / `The Last name field is required.`
- [x] A name longer than 30 characters shows `The field First name must be a string with a maximum length of 30.` (same form for Last name)
- [x] Birthday is chosen only from the calendar; the days after the UTC today are disabled; a later date shows `Birthday cannot be in the future`; the rule compares with the UTC date
- [x] An invalid form never calls the API
- [x] Server field errors from the problem-details `errors` map show on their fields; any other error shows as a general message
- [x] Submit is disabled while the call runs; success and Cancel go to `/contacts`
- [x] The create and validation specs run for the `vue` project and pass
- [x] `tests/a11y/accessibility.spec.ts` (Home, Contacts, Create Contact) runs for `vue` and passes
- [x] `tests/utils/assertions.spec.ts` (summary and field-error assertions) runs for `vue` and passes
- [x] Labels `First name` / `Last name` / `Birthday`, buttons `Create` / `Cancel`; the Birthday input shows `M/D/YYYY`; the document title is the default `AddressBook`, as in Blazor
- [x] `--project=blazor` stays green

## Affected files

`src/AddressBook.Vue`: new `src/rules/contactRules.ts`, `src/components/BirthdayPicker.vue`, `src/components/ContactForm.vue`, `src/components/contactFormErrors.ts` (pure mapping of an error to field and general errors), `src/pages/CreateContactPage.vue`; `src/router/index.ts` (`/create-contact`, no title); `README.md`.

`src/UiTests`: `src/components/vue/contact-form.component.ts` (`validationSummary`, `errorFor`), `src/components/vue/date-picker.component.ts` (`open`, `selectDate`, `enabledDays`, `disabledDays`), `src/components/vue/not-implemented.ts` (removed once unused), `playwright.config.ts` (`vueSpecs`), `tests/a11y/accessibility.spec.ts` (waits for the form before scanning the lazily loaded Create page; comments cover both frontends).

## Approach

1. **Rules.** `todayUtc(now = new Date())` is the UTC calendar date at local midnight; `isBirthdayNotInFuture` accepts `null` and compares `yyyy-MM-dd` strings; name rules check the trimmed value for required and the raw length for the limit (as `[StringLength]`). The clock is the optional `now` argument; end-to-end tests fix it with `page.clock`, component tests with fake timers.
2. **Picker.** `v-date-input` (part of Vuetify 4 core) with `update-on` empty, which keeps the input read-only but interactive; `max` is the `todayUtc()` date; the display format is `M/D/YYYY`; no adjacent-month days and no clear button, like MudDatePicker; a calendar icon at the end; the testid on the native input.
3. **Form.** Card layout mirrors the Razor page. `validate-on="blur"` (MudTextField validates on change). Submit clears the server errors, validates, and only a valid form calls `save`; `busy` disables the submit button; a caught error is mapped: `errors` keys `FirstName` / `LastName` / `Birthday` go to the fields, other keys and a problem without `errors` (its detail or title) go to the summary, any other error shows its message.
4. **Page.** `CreateContactPage.vue` holds the empty model, uses `ContactForm` with `Create`, saves through `createContact`, and goes to `/contacts` on success and on Cancel.
5. **Component objects.** `errorFor(field)` reads the Vuetify messages of the field's input; `validationSummary` is the summary list; the date picker opens by clicking the input, then year → month → day in `v-date-picker`, with exact matches; enabled and disabled days come from the day buttons.

## Tests

- Shared specs join `vue` unchanged except for the a11y wait: `contacts/create.spec.ts`, `contacts/validation.spec.ts`, `a11y/accessibility.spec.ts`, `utils/assertions.spec.ts`.
- Component tests of the rules, the error mapping and the form come with the Vitest task.

## Verification

- `npm run lint`, `npm run type-check`, `npm run format:check`, `npm run build` in `src/AddressBook.Vue`.
- `npx playwright test --project=vue` and `--project=blazor` in `src/UiTests`.
- Browser: no POST for an invalid form; a server field error lands on its field; Create is disabled during a slow call.

## Out of scope

- The Edit page; Vitest tests; the Vue spec document; opening the picker on the UTC month at a month boundary east of UTC (Blazor has the same documented limitation).

## Decisions

- **Date picker:** `v-date-input` rather than `v-text-field` + `v-menu` + `v-date-picker`: it keeps the input read-only and supports `max` with a third of the wiring.
- Server error keys that are not form fields show in the summary.
- Fields validate on blur; server field errors stay until the next submit, like Blazor's message store.
- The input itself opens the calendar; there is no separate Open button.
