# Issue #216 — Vue V4: API client of the Vue frontend with the problem-details pipeline

> **Issue:** [#216](https://github.com/askrinnik/AddressBook/issues/216)
> **Lane:** Feature
> **Complexity:** M
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V4

## Requirement

`src/AddressBook.Vue/src/api` gets an API client that behaves like `AddressBookApiService` together with `ProblemDetailsHandler` in `AddressBook.Web`: contract types, a `fetch` wrapper that turns every non-success response into a `ProblemDetailsError` (64 KB read limit, case-insensitive parse, fallback), `getErrors()`, and five service functions. No UI in this task.

## Acceptance

- [x] TypeScript types mirror `ContactModel`, `GetFilteredContactsResponse`, `CreateContactCommand` and `UpdateContactCommand`
- [x] `getFilteredContacts` adds `?search=` only for a non-blank term, percent-encoded
- [x] `createContact` returns the new id from the last segment of the `Location` header, and 0 when it is missing or not numeric
- [x] `getContactById` returns `null` on 404
- [x] A non-success response throws `ProblemDetailsError`; at most 64 KB of the body is read; an empty, non-JSON or non-problem body yields a fallback with the reason phrase as title and the status code; a parsed problem without `title` or `status` takes them from the response
- [x] `getErrors()` returns the `errors` map, and an empty map for an `errors` member of another shape
- [x] Every function throws `ProblemDetailsError` on non-success (the Blazor handler throws before `EnsureSuccessStatusCode`); the error exposes `status`, so the Contacts page can treat a 404 on delete as not an error
- [x] Birthday leaves the client as `yyyy-MM-dd` from the date's local components, with no time-zone shift; a missing birthday is sent as `null`
- [x] An aborted `AbortSignal` and network failures pass through unchanged and are never wrapped as `ProblemDetailsError`
- [x] The README structure lists the new files

## Affected files (under `src/AddressBook.Vue`)

- `src/api/types.ts` (new) — contract types, the form model `ContactFormModel` (`birthday: Date | null`, the counterpart of `CreateContactModel`), `toDateOnly` and `fromDateOnly`
- `src/api/problemDetails.ts` — keeps `ClientProblemDetails`; adds `parseProblemDetails`, `getErrors` and `ProblemDetailsError`
- `src/api/http.ts` (new) — `request()` and the problem-details pipeline
- `src/api/contactsApi.ts` (new) — the five service functions
- `README.md` — the `src/api/` structure row

## Approach

Facts from the code: the route is `api/[controller]` (case-insensitive); `CreatedAtAction` returns an absolute `Location`; CORS exposes `Location`; the API writes camelCase JSON with `DateOnly` as `yyyy-MM-dd`.

1. **types.ts** — `ContactModel {id, firstName, lastName, birthday: string | null}`, `GetFilteredContactsResponse {totalRows, rows}`, the two commands, `ContactFormModel`, `toDateOnly(d)` from `getFullYear/getMonth/getDate` (mirrors `DateOnly.FromDateTime`), `fromDateOnly(s)` as a local date.
2. **problemDetails.ts** — `parseProblemDetails(text)` returns a problem only for a JSON object (not `null`, an array or a primitive), matches the standard members case-insensitively, returns `null` for a wrong-typed standard member (as System.Text.Json throws), and puts every other member into `extensions`. `getErrors(problem)` reads `extensions.errors` and returns `{}` unless it is an object of string arrays. `ProblemDetailsError` carries `problem` and `status`; its message is `detail || title`.
3. **http.ts** — `request(path, {method, body?, signal?})` builds the URL with `new URL(path, apiPrefix)`, sends JSON, returns a success response unchanged, and otherwise reads at most 65536 bytes of the body through the stream reader (a larger body is truncated and fails to parse), parses it, fills a blank title from `statusText` (or `HTTP <status>` when `statusText` is empty, as on HTTP/2) and a missing status from the response, and throws `ProblemDetailsError`.
4. **contactsApi.ts** — `getFilteredContacts(searchTerm, signal?)` encodes like `Uri.EscapeDataString` (`encodeURIComponent` plus `!'()*`); `deleteContact(id)`; `createContact(model)` parses the id from the `Location` path like `int.TryParse`, else 0; `getContactById(id, signal?)` returns `null` for a 404 `ProblemDetailsError`; `updateContact(id, model, signal?)`.

## Tests

Vitest arrives with the component-test task, which covers this client: the parse and fallback matrix, `getErrors` shapes, search encoding, `Location` parsing, 404 to `null`, abort pass-through. This task adds no test files.

## Verification

- `npm run lint`, `npm run type-check`, `npm run format:check`, `npm run build` in `src/AddressBook.Vue`.
- Live check in the browser console against the local API (dev server): search with a blank and an encoded term, create with a birthday, get by id and an unknown id, a 400 with `getErrors`, delete twice (404 on the second), the fallback with a stubbed `fetch` (HTML over 64 KB, empty body, problem without title), and abort.

## Out of scope

- Pages, the banner wiring and the 404-on-delete handling; form validation; Vitest tests; any API or Blazor change.

## Decisions

- An empty `statusText` gives the title `HTTP <status>`, with no status-name table.
- `getErrors` returns `{}` for any value that is not an object of string arrays.
- `ProblemDetailsError.message` is `detail || title`.
- `updateContact` sends the route id in the body; Blazor sends 0 and the controller overwrites it either way.
- `getErrors` is a standalone function, so it also works on a problem object the banner holds.
