# Plan: Issue #160 — Blazor Tests B16: CustomValidationSummaryTests

> **Issue:** [#160](https://github.com/askrinnik/AddressBook2025/issues/160) — Phase 2
> **Lane:** test-authoring (bUnit), extended during plan review with a fix of the summary's filter (see Decisions).
> **Complexity:** S

## 1. Requirement

bUnit tests of `Components/CustomValidationSummary.razor`: only model-level messages are shown (per-field
messages are filtered out), the list refreshes on `EditContext.OnValidationStateChanged`, and the component
unsubscribes from that event in `Dispose`.

### Defect found while planning

The component separates model-level messages from per-field ones by **message text**: it collects the messages of
every property of the model and hides any message whose text is among them. As a result:

- a model-level message whose text equals a per-field message (for example both "Required") is hidden;
- a message on a field of a nested object (`FieldIdentifier(model.Nested, "City")`) is not a property of the root
  model, so it is shown as if it were model-level.

**Root cause:** the filter compares strings instead of reading the messages stored for the model itself.
**Fix:** read exactly the model-level messages — `EditContext.GetValidationMessages(new FieldIdentifier(EditContext.Model, string.Empty))`,
the same key the built-in `ValidationSummary` uses for its `Model` parameter.

## 2. Acceptance

Commit 1 — pin the current behaviour:

- [x] No cascading `EditContext` → renders nothing (no `ul.validation-errors`).
- [x] `EditContext` without messages → empty `ul.validation-errors`.
- [x] Only per-field messages (on model properties) → empty list.
- [x] Only model-level messages (`FieldIdentifier(model, string.Empty)`) → each shown as `li.validation-message`.
- [x] Mixed model-level and per-field messages → only the model-level ones are shown.
- [x] A model-level message added after render + `NotifyValidationStateChanged` → appears without re-rendering from the test.
- [x] Messages cleared + `NotifyValidationStateChanged` → the list empties.
- [x] After the component is disposed, `EditContext.OnValidationStateChanged` no longer references it; notifying does not throw.
- [x] Current quirk pinned: a model-level message with the same text as a per-field message is hidden.
- [x] Current quirk pinned: a message on a nested object's field is shown.

Commit 2 — fix the filter:

- [ ] A model-level message with the same text as a per-field message is shown.
- [ ] A message on a nested object's field is not shown.
- [ ] All other cases from commit 1 still pass unchanged.
- [ ] The component's `@code` block moves to a code-behind `CustomValidationSummary.razor.cs`, as the Blazor conventions require.
- [ ] `docs/specs/AddressBook.Web.md` §8.1 states how model-level messages are selected.

Both commits:

- [ ] Only `MudTestContext` + bUnit `Find`/`FindAll` + xUnit `Assert`; no `Task.Delay`/`Sleep`.
- [ ] `dotnet build src/AddressBook.slnx` clean; `dotnet test --project src/AddressBook.Web.Tests` green.

## 3. Affected files

Commit 1:

- `src/AddressBook.Web.Tests/Tests/Components/CustomValidationSummaryTests.cs` — new.
- `docs/tasks/issue-160-custom-validation-summary-tests.md` — this plan.

Commit 2:

- `src/AddressBook.Web/Components/CustomValidationSummary.razor` — markup only.
- `src/AddressBook.Web/Components/CustomValidationSummary.razor.cs` — new code-behind with the fixed filter.
- `src/AddressBook.Web.Tests/Tests/Components/CustomValidationSummaryTests.cs` — the two quirk tests flip to the correct behaviour.
- `docs/specs/AddressBook.Web.md` — §8.1.
- `docs/tasks/blazor-component-tests-framework-plan.md` — mark B16 done.
- `docs/tasks/issue-160-custom-validation-summary-tests.md` — checklist ticked.

## 4. Approach

- Render the component directly with the `EditContext` as a cascading value
  (`Render<CustomValidationSummary>(p => p.AddCascadingValue(editContext))`), over a small private test model
  with two string properties and a nested object. `EditForm` is not needed — the component reads only the
  cascading `EditContext`.
- Seed messages through a `ValidationMessageStore` on that `EditContext`; model-level messages use
  `new FieldIdentifier(model, string.Empty)`, per-field ones `editContext.Field(nameof(Model.Name))`.
- Raise the event via `cut.InvokeAsync(() => editContext.NotifyValidationStateChanged())` so the handler's
  `StateHasChanged` runs on the renderer's dispatcher.
- Locators: CSS `ul.validation-errors` / `li.validation-message` — the component has no role, `aria-label` or
  `data-testid`, and the suite does not add `data-testid` to the Web project.
- Unsubscribe check: dispose the rendered components, then read the delegate list of the event's backing field
  on `EditContext` (reflection) and assert none targets the component. Blazor silently ignores a
  `StateHasChanged` on a disposed component, so a markup-only assertion cannot detect a leaked subscription.

## 5. Tests

The bUnit tests above are the deliverable, and in commit 2 they also guard the fix. Playwright API/UI tests are
not needed — the component is not used by any page, so no user-visible flow changes.

## 6. Verification

Each commit: `dotnet build src/AddressBook.slnx -clp:ErrorsOnly`; `dotnet test --project src/AddressBook.Web.Tests`.
No browser walk — the component is not rendered by any page.

## 7. Out of scope

- Wiring the component into a page (it is not used by any page today).
- Model-level messages of a nested object (`FieldIdentifier(model.Nested, string.Empty)`) — not shown after the
  fix, since only the root model's own messages are model-level.

## 8. Decisions

- The `Dispose` check uses reflection on `EditContext`'s private event field (approved in plan review).
- The filter defect is fixed on this branch: commit 1 pins the current behaviour with tests, commit 2 fixes the
  component and flips the two quirk tests (agreed in plan review).
