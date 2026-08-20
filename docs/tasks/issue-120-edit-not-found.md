# Fix plan — Issue #120 (bug)

**Title:** Edit not-found branch is dead code: ProblemDetailsHandler throws on 404
**Type:** Defect (`bug`). Web-layer fix in `AddressBook.Web`.

## 1. Reproduced failure (observed)

Navigating to `/edit-contact/{non-existent-id}` (e.g. `/edit-contact/99999999`) renders Blazor's generic **"An unhandled error has occurred"** UI instead of the intended **"Contact not found."** `MudAlert` + **Back to Contacts** button. Observed live this session: the API returns `404` for `GET /api/Contacts/99999999`, and the page shows the error strip.

## 2. Root cause

`AddressBook.Web/ErrorHandling/ProblemDetailsHandler` (a `DelegatingHandler` registered on the API `HttpClient`) throws `ProblemDetailsException` on **any** non-success response — including `404`:

```csharp
if (response.IsSuccessStatusCode) return response;
// ... any non-2xx, 404 included:
throw new ProblemDetailsException(problemDetails);
```

Because the handler runs inside `HttpClient.GetAsync`, the throw happens **before** `AddressBookApiService.GetContactByIdAsync` can inspect the status. Its `if (response.StatusCode == NotFound) return null;` (`AddressBookApiService.cs:51`) and the `EnsureSuccessStatusCode()` below it are therefore **dead code**, and the `_notFound` branch in `EditContact.razor` is unreachable. The exception propagates out of `OnInitializedAsync`, which Blazor surfaces as the generic error UI.

## 3. Fix (targeted, root-cause)

Handle the expected `404` in the one call that treats "not found" as normal control flow — `GetContactByIdAsync` — rather than changing the handler globally.

`ClientProblemDetails` already carries the numeric `Status`, and `ProblemDetailsException.ProblemDetails` exposes it, so the 404 can be recognised from the thrown exception:

```csharp
public async Task<ContactModel?> GetContactByIdAsync(int id, CancellationToken cancellationToken)
{
    try
    {
        var response = await httpClient.GetAsync($"contacts/{id}", cancellationToken);
        return await response.Content.ReadFromJsonAsync<ContactModel>(cancellationToken);
    }
    catch (ProblemDetailsException ex)
        when (ex.ProblemDetails?.Status == (int)System.Net.HttpStatusCode.NotFound)
    {
        return null;
    }
}
```

- The dead `StatusCode == NotFound` check and `EnsureSuccessStatusCode()` are removed: with the handler in place, any response that reaches this method is already a success, and a `404` now arrives as the caught exception → `null` → the razor renders "Contact not found." as designed.
- Non-404 errors keep the existing behaviour (the exception still propagates), so other pages' error handling is unchanged.

**Files to change:**

- `src/AddressBook.Web/AddressBookApiService.cs` — wrap `GetContactByIdAsync` so a `404` `ProblemDetailsException` returns `null`.

## 4. Regression risk

Low and contained. The change is scoped to `GetContactByIdAsync`; the `ProblemDetailsHandler` is untouched, so `CreateContact`, `UpdateContact`, `DeleteContact`, and the list call keep their current error-to-exception behaviour. The only behavioural change is that a by-id `404` now yields `null` (which is exactly what the existing—previously dead—code and the razor already expect).

## 5. Tests (regression guard)

The defect is a Web-layer, user-facing behaviour, so the guard is a **UI E2E** test, not an API test (the API already returns `404` correctly — it is not the bug). The natural vehicle is `src/UiTests` using the U8 `EditContactPage` page object:

- `src/UiTests/tests/contacts/edit-not-found.spec.ts` (new): navigate to `/edit-contact/{missing-id}` and assert `EditContactPage.isNotFound()` is true and the **Back to Contacts** button is visible; assert **Back to Contacts** navigates to `/contacts`. A positive check (a seeded, existing id shows the pre-filled form, not the alert) is included so the assertion cannot pass vacuously.

**Sequencing (resolved):** U8 (PR #121) is now **merged to `main`**, so `EditContactPage` is available. This bug-fix branches off updated `main` and the spec uses the U8 page object (option A) — no cross-branch coupling.

**First real UI spec — minimal supporting infra.** `src/UiTests` has no committed specs yet (U9 fixtures and U10+ specs are pending), so this spec news up its own page object and, if it needs to seed/assert against existing data, uses the U5 `ContactsApi` with a `request` context — it does **not** introduce the U9 `test.extend` fixtures (that stays U9's scope). The not-found path needs no seeded data (it asserts on a deliberately-missing id); the positive check seeds one contact via `ContactsApi` and tears it down.

> Note: this `edit-not-found` coverage overlaps the future **U14** edit spec (#105). Landing it here as the regression guard is deliberate; U14 can fold it in later.

## 6. Verification

1. Stop the dev servers, then `dotnet build src/AddressBook.sln` — clean.
2. Add the regression spec (per the chosen option) and run the `src/UiTests` suite — the new spec passes; nothing regresses.
3. Restart API + Web and re-walk the repro in the browser: `/edit-contact/99999999` now shows "Contact not found." + Back to Contacts (no error strip, clean console/network); a valid id still shows the pre-filled form.

## 7. Out of scope

- The identical dead post-handler status-checks in `DeleteContact` / `CreateContact` / `UpdateContact` — not part of this defect; deleting/updating a non-existent contact surfacing an error is acceptable and unchanged here.
- Any change to `ProblemDetailsHandler` itself.
