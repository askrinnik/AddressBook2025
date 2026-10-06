# Issue #197 — Test code quality: async/await, harness navigation, fixed culture, namespace

- Issue: https://github.com/askrinnik/AddressBook2025/issues/197
- Title: Blazor Tests B29: Качество тестового кода: async/await, harness-навигация, фиксированная культура, namespace
- Lane: Test-authoring
- Complexity: L

## Requirement

After this issue the bUnit suite has no discarded `InvokeAsync` tasks and no sync-over-async calls in the harnesses. No test class keeps a component field just to wait for navigation, and no test uses raw selectors for the EditContact alert or the "Back to Contacts" button. Every run uses a fixed en-US culture. Test namespaces no longer repeat `Tests` (`AddressBook.Web.Tests.Specs.*`). Harness predicates search elements instead of `Markup.Contains`, and `HttpClient`s built by `FakeHttpMessageHandler` are disposed. The conventions file documents these rules. The number of tests and what each one checks stay the same. No production code changes.

## Acceptance

- [x] 1. `ErrorTests` and `CustomValidationSummaryTests` await every `cut.InvokeAsync(...)`; the affected tests are `async Task`.
- [x] 2. `ContactFormHarness.SetBirthday` becomes `SetBirthdayAsync`, `Fill` becomes `FillAsync`, `ContactsTableHarness.SelectRowsPerPage` becomes `SelectRowsPerPageAsync`. No `.GetAwaiter().GetResult()` is left in the project; every caller is updated.
- [x] 3. `ContactFormHarness.WaitForNavigation(string path)` exists and the `_cut` fields are removed from `CreateContactTests` and `EditContactTests`. The `.mud-alert` and "Back to Contacts" access of `EditContactNotFoundTests` moves into the harness, together with the same selectors, `HasForm` and `[role=progressbar]` checks of `EditContactLoadTests`.
- [x] 4. The culture is fixed to en-US for the whole test assembly in a `[ModuleInitializer]`.
- [x] 5. The folder `Tests/` becomes `Specs/` and the namespaces become `AddressBook.Web.Tests.Specs.<Area>`; the `--filter-namespace` examples and every path mention are updated.
- [x] 6. `ContactsTableHarness.IsLoading` checks elements by exact text; `AddressBookApiServiceTests` disposes the handler and the clients; `Dispose_UnsubscribesFromValidationStateChanged` has a comment explaining that its last line checks that no exception is thrown.
- [x] The test count (`--list-tests`) is the same before and after, and every test keeps its meaning.
- [x] `dotnet test --project src/AddressBook.Web.Tests` passes and `dotnet build src/AddressBook.slnx` reports 0 warnings.
- [x] `.github/instructions/bunit-conventions.instructions.md` gains the rules: await `InvokeAsync`; async harness methods; fixed culture; navigation waits in the harness; element-based predicates; disposing HTTP objects. The `write-tests` skill copies stay in step and the `check.ps1` audit passes.

## Affected files

Under `src/AddressBook.Web.Tests`:

- `Tests/**` → `Specs/**` (`git mv`, 29 files); the namespace line of each file changes to `AddressBook.Web.Tests.Specs.<Area>`.
- `Infrastructure/TestCulture.cs` (new): `[ModuleInitializer]` that sets `DefaultThreadCurrentCulture`, `DefaultThreadCurrentUICulture`, `CurrentCulture` and `CurrentUICulture` to en-US.
- `Harnesses/ContactFormHarness.cs`: `SetBirthdayAsync`, `FillAsync`, `WaitForNavigation`, `AlertText`, `AlertClasses`, `HasBackToContacts`, `BackToContacts()`, `IsFormShown`, `IsProgressShown`; class summary updated.
- `Harnesses/ContactsTableHarness.cs`: `SelectRowsPerPageAsync`; element-based `IsLoading`.
- `Infrastructure/FakeHttpMessageHandler.cs`: disposes the clients it creates.
- Specs: `Layout/ErrorTests.cs`, `Components/CustomValidationSummaryTests.cs`, `Pages/CreateContactTests.cs`, `Pages/EditContactTests.cs`, `Pages/CreateContactServerErrorTests.cs`, `Pages/EditContactNotFoundTests.cs`, `Pages/EditContactLoadTests.cs`, `Pages/ContactsListTests.cs`, `Harnesses/ContactsTableHarnessTests.cs`, `Harnesses/ContactFormHarnessTests.cs`, `Services/AddressBookApiServiceTests.cs`.
- `README.md`: `--filter-namespace` example, structure tree, the `Tests/` sentence, a `TestCulture` row.

Docs and customizations:

- `.github/instructions/bunit-conventions.instructions.md`: layout path, namespace filter example, new rules.
- `.github/skills/_local.write-tests/SKILL.md` and its byte mirror `.claude/skills/_local.write-tests/SKILL.md`: `Specs/<area>/` path.
- `docs/tasks/blazor-component-tests-framework-plan.md`: tick B29.

## Approach

1. Record the baseline test count with `--list-tests`.
2. `git mv` the folder and change the namespace lines; build.
3. Add `TestCulture.cs`. If analyzer CA2255 fires, use `"culture": "en-US"` in `xunit.runner.json` instead and record it here.
4. Make the harness changes, then update the callers file by file. `Submit`, `Cancel` and `Set{First,Last}Name` stay synchronous. The harness obtains `NavigationManager` from `cut.Services`; if that is unavailable, it receives the manager through its constructor.
5. Put the EditContact page states into `ContactFormHarness`, which already wraps both pages; port `EditContactNotFoundTests` and `EditContactLoadTests` with the same assertions.
6. Make `IsLoading` element-based; dispose clients in `FakeHttpMessageHandler`; use `using var handler` in `AddressBookApiServiceTests` (and, for consistency, in the other files that build a handler); add the Dispose comment.
7. Update the conventions file, README and both copies of the skill; run the audit.

Regression risk: turning synchronous tests into async ones can change when renders flush. bUnit's dispatcher completes these calls synchronously, so assertions after `await` see the same state. A selector mistake in `IsLoading` would fail broadly and show up at once.

## Tests

No tests are added or removed. The new harness members are covered by the ported `EditContactNotFoundTests` and `EditContactLoadTests`.

## Verification

- Greps in `src/AddressBook.Web.Tests`: no `GetAwaiter`, `.Result`, `.Wait(`; no un-awaited `cut.InvokeAsync`; no `_cut`; no raw `.mud-alert`, `Back to Contacts`, `role=progressbar` under `Specs/` (matches only in `Harnesses/`); no `Tests.Tests` in the repository outside `bin/obj` and closed plans.
- The suite passes on this ru-RU machine and the test count equals the baseline.
- `dotnet test --project src/AddressBook.Web.Tests --filter-namespace "AddressBook.Web.Tests.Specs.Pages"` runs a non-zero number of tests.
- `dotnet build src/AddressBook.slnx` has 0 warnings; `check.ps1` passes.

## Out of scope

- New self-tests for the added harness members (they would change the test count; trimming meta-tests is a separate issue).
- Historical paths in closed plans `docs/tasks/issue-*.md` and the design tree in `blazor-component-tests-framework-plan.md`.
- Ticking B26–B28 in the framework plan.
- Any change to `src/AddressBook.Web`.

## Decisions

- Folder name `Specs/` rather than dropping the level: dropping it would mix the self-tests into `Infrastructure/`, `Data/` and `Harnesses/` and create namespaces that mirror `AddressBook.Web.*`.
- The harness methods are async and every caller is updated (about 35 test methods become `async Task`).
- Culture through a `[ModuleInitializer]`, as the review suggests; `xunit.runner.json` is the fallback only if CA2255 fires.
- The EditContact alert, back button and page states go into `ContactFormHarness`, not a new `EditContactHarness`; the harness list in the docs stays unchanged.
- `using var handler` is applied beyond `AddressBookApiServiceTests` for consistency.
- Implementation runs with an Opus `issue-developer`, as the plan has complexity L.
