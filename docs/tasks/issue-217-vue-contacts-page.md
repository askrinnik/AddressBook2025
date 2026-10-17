# Issue #217 — Vue V5: Contacts page of the Vue frontend

> **Issue:** [#217](https://github.com/askrinnik/AddressBook2025/issues/217)
> **Lane:** Feature
> **Complexity:** L
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V5

## Requirement

`/contacts` in `src/AddressBook.Vue` works like `src/AddressBook.Web/Pages/Contacts.razor(.cs)`: a server-reloading Vuetify table with a toolbar (Create Contact, Search), client-side sorting and paging over the loaded rows, a MudBlazor-style pager, loading and empty states, the inline-alert and banner error rules, Edit and Delete with a confirmation dialog, and a delete that tolerates 404. The Vue component objects in `src/UiTests` are implemented, and the list-search, sort-paginate, delete and shell-navigation specs run in the `vue` project.

## Acceptance

- [x] A server-reloading table with the headers `First name`, `Last name`, `Birthday`, `Actions`; Birthday shows as `M/D/YYYY`
- [x] The search field (`contacts-search`) commits its value on blur and on clear, not while typing, and reloads the table
- [x] Sorting by each column and paging run on the client over the loaded rows; the total comes from `TotalRows`; the pager caption reads `X-Y of Z`; the rows-per-page select has the accessible name `Rows per page`
- [x] The loading state shows `Loading...`; an empty table shows `No matching records found`
- [x] A failed load shows the inline alert and the top banner; the next successful load clears both
- [x] `Create Contact` (`contacts-create`) opens `/create-contact`; Edit (`contact-edit-{id}`, `Edit contact`) opens `/edit-contact/{id}`
- [x] Delete (`contact-delete-{id}`, `Delete contact`) opens the dialog `Warning` / `Are you sure you want to delete this contact?` with `Yes` (`contact-delete-confirm`) and `Cancel`; a confirmed delete reloads the table; a failed delete raises the banner, which the following reload does not clear; a 404 only reloads the table
- [x] Each row carries `contact-row-{id}` on its first cell
- [x] The list-search, sort-paginate, delete and shell-navigation specs run for the `vue` project and pass
- [x] The `contacts-search` testid sits on the native `<input>` (Vuetify keeps `data-*` attributes on the root element)
- [x] The page title is `Contacts`; the sort cycle is ascending → descending → unsorted; rows-per-page options 10/25/50/100 with default 10; the pager has First/Previous/Next/Last buttons with those aria-labels, disabled at the ends
- [x] A newer load aborts the previous one; an aborted load shows no error; leaving the page aborts the load in flight
- [x] `--project=blazor` stays green

## Affected files

`src/AddressBook.Vue`: new `src/pages/ContactsPage.vue`, new `src/components/TablePager.vue`, new `src/directives/inputTestId.ts` (puts a `data-testid` on the inner `<input>`, reused by the form), `src/api/types.ts` (`toShortDateString`), `src/router/index.ts` (`/contacts`, title `Contacts`), `README.md`.

`src/UiTests`: `src/components/vue/contacts-table.component.ts` (`sortLabel`, `paginationInfo`, `setRowsPerPage`), `src/components/vue/confirm-dialog.component.ts` (`title`), `playwright.config.ts` (`vueSpecs`), `README.md`.

## Approach

1. **Date display.** `toShortDateString('yyyy-MM-dd')` builds `M/D/YYYY` from the string parts, independent of locale and time zone (Blazor runs under en-US).
2. **Table.** `v-data-table-server` with `data-testid="contacts-table"`, compact and hover; the toolbar sits in the `top` slot and the pager in the `bottom` slot, so everything the shared component object looks for is inside the testid root. Headers `firstName`, `lastName`, `birthday` sortable and `actions` not; no `must-sort`, single sort. The `item` slot renders the row with `contact-row-{id}` on the first cell and the Edit (`mdi-pencil`, primary) and Delete (`mdi-delete`, error) buttons with their aria-labels and testids. The `loading` slot shows `Loading...`; the `no-data` slot shows `No matching records found` and the error alert.
3. **Search.** `v-text-field` with placeholder `Search`, magnify icon, clearable; commits on blur, on Enter (the native `change` commits MudTextField on Enter too) and on clear, and only when the value changed. A new committed term resets to page 1.
4. **Loading.** Each load aborts the previous one, fetches with the committed term, sorts a copy with a stable comparator (en-US collation for names, ISO compare for birthdays with empty birthdays first ascending, descending by negating the comparator), slices the page and takes the total from `totalRows`. Success clears the inline alert and, if a load error raised it, the banner. A failure (not an abort) raises the banner and the inline alert and empties the rows.
5. **Delete.** `v-dialog` with `Warning`, the question, `Cancel` and `Yes` (`mdi-delete-forever`, error). On Yes the contact is deleted; a 404 is ignored; any other failure raises the banner, which the following reload keeps; then the table reloads with the last options.
6. **Pager.** `TablePager.vue` reproduces the MudBlazor pager with Vuetify footer classes: `Rows per page:` and a select with `aria-label="Rows per page"`, the caption `X-Y of Z`, and the four icon buttons.
7. **UiTests Vue objects.** `sortLabel` is the sortable header cell with the text; `paginationInfo` is the footer caption; `setRowsPerPage` picks the option from the `Rows per page` combobox; the dialog title is its card title.

## Tests

- Existing shared specs join `vue`: `contacts/list-search.spec.ts`, `contacts/sort-paginate.spec.ts`, `contacts/delete.spec.ts`, `smoke/app-shell-navigation.spec.ts`.
- Component tests of the load error, the 404 and the failed-delete banner come with the Vitest task; here they are checked in the browser.

## Verification

- `npm run lint`, `npm run type-check`, `npm run format:check`, `npm run build` in `src/AddressBook.Vue`.
- `npx playwright test --project=vue` and `--project=blazor` in `src/UiTests`.
- Browser: no request while typing, a request on blur, Enter and clear; the sort cycle; a load failure with the API stopped shows the alert and the banner and a later success clears them; a 404 on delete only reloads; a failed delete keeps the banner; Create and Edit navigate; the title is `Contacts`.

## Out of scope

- The Create and Edit pages (their routes show the not-found view until then); Vitest tests; the a11y spec for `vue`; the Vue spec document; any change to Blazor's own behaviour.

## Decisions

- **Load-error text.** Blazor shows the exception message, which for a problem-details failure is the generic "Exception of type … was thrown."; Vue shows the problem's detail or title, or the network error text.
- Enter commits the search, like the native `change` event in Blazor.
- A new search and a rows-per-page change go to page 1; sorting keeps the page; a reload that leaves the page past the end goes back to page 1.
- An aborted or superseded load shows no error.
- Create and Edit navigate even before their pages exist.
