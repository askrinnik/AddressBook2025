# Issue 204: Client and server validation drift

- Issue: [#204](https://github.com/askrinnik/AddressBook2025/issues/204)
- Title: Client and server validation drift: time zone of the birthday rule and a single source of length limits
- Lane: Feature
- Complexity: L

## 1. Requirement

The client and the API both reject a birthday later than the current UTC date. Each side reads the clock through an injectable `TimeProvider` and compares the date in one shared helper. The name length limit (30) is defined once, as a constant in `AddressBook.Contracts`. The API validators, the EF Core column configuration and the Web model all read that constant, and so does the shared "Birthday cannot be in the future" message. One edit to Contracts keeps client and server in step.

Decisions made with the user: compare in UTC on both sides; share the constants through `AddressBook.Contracts`.

## 2. Acceptance

- [x] The UTC date rule is implemented on both sides and documented in `docs/specs/AddressBook.Web.md` and `docs/specs/AddressBook.Api.md`.
- [x] The length limit comes from one shared source in Contracts, so one change cannot leave client and server out of step.
- [x] Tests cover boundary behaviour (birthday today and tomorrow, 30 and 31 characters) on both sides: Playwright API in `src/ApiTests`, bUnit in `src/AddressBook.Web.Tests`, and UI E2E where it fits.
- [x] *(added)* `MudDatePicker.MaxDate` on both CreateContact and EditContact uses the UTC date, not `DateTime.Today`.
- [x] *(added)* `ContactConfiguration` (`HasMaxLength(30)` for FirstName/LastName) uses the same shared constant. The value does not change, so no migration.
- [x] *(added)* The test data factories (`ContactBuilder`, ApiTests `contact.factory.ts`, UiTests `contact.factory.ts`) build "today" and "tomorrow" as UTC dates, so the boundary tests do not flake when local and UTC dates differ.
- [x] *(added)* A deterministic bUnit test with a fixed clock shows that the client uses the UTC date even when local time is already on the next day.
- [x] *(added)* `docs/specs/AddressBook.Contracts.md` documents the new shared rules class.

Coverage cross-check: every `DateTime.Today` in production code (`NotInFutureAttribute.IsValid`, `CreateContact.razor:15`, `EditContact.razor:35`, both API validators at line 17) is covered. FirstName and LastName are the only length-limited inputs. Phone and PhoneOperator lengths have no command, validator or form yet.

## 3. Affected files

**Contracts**
- New `src/AddressBook.Contracts/ContactRules.cs`: `const int NameMaxLength = 30`, `const string BirthdayInFutureMessage`, `static DateOnly TodayUtc(TimeProvider)`, `static bool IsBirthdayNotInFuture(DateOnly?, TimeProvider)`.

**API**
- `Application/CreateContactCommandValidator.cs`, `UpdateContactCommandValidator.cs`: inject `TimeProvider`; use `ContactRules.NameMaxLength`; birthday rule via `Must(...)` with the shared message.
- `StartupExtensions.cs`: `TryAddSingleton(TimeProvider.System)`.
- `DataAccess/ContactConfiguration.cs`: `HasMaxLength(ContactRules.NameMaxLength)`.

**Web**
- `Models/CreateContactModel.cs`: `[StringLength(ContactRules.NameMaxLength)]`.
- `Models/NotInFutureAttribute.cs`: override `IsValid(object?, ValidationContext)`, get `TimeProvider` from the validation context (fallback `TimeProvider.System`), compare through `ContactRules`.
- `Pages/CreateContact.razor`, `Pages/EditContact.razor`: inject `TimeProvider`; `MaxDate` from the UTC date.
- `Program.cs`: register `TimeProvider.System`.

**Web.Tests**
- `Infrastructure/MudTestContext.cs`: register `TimeProvider.System` by default.
- New `Infrastructure/FixedTimeProvider.cs` (no new package).
- `Data/ContactBuilder.cs`: `ContactRules.NameMaxLength`; UTC-based birthdays.
- `Specs/Pages/CreateContactTests.cs`, `EditContactTests.cs`: UTC assertions; fixed-clock time-zone cases.
- New `Specs/Models/NotInFutureAttributeTests.cs`.

**ApiTests**: `src/data/contact.factory.ts` (UTC `today()`/`tomorrow()`/`pastBirthday()`), `tests/data/contact.factory.spec.ts`.

**UiTests**: `src/data/contact.factory.ts`, `tests/contacts/validation.spec.ts` (UTC expectation; time-zone case).

**Docs**: `docs/specs/AddressBook.Api.md` (Validation), `docs/specs/AddressBook.Web.md`, `docs/specs/AddressBook.Contracts.md`.

## 4. Approach

Order: Contracts → API → Web → tests → docs.

1. `ContactRules` in Contracts is the single source for the limit, the shared birthday message and the UTC date comparison. `TimeProvider` is in the BCL, so Contracts gets no new dependency.
2. API: validators take `TimeProvider` from DI; `Must(...)` reads the clock at validation time. The message is unchanged, so the ProblemDetails `errors.Birthday` value is unchanged. `ContactConfiguration` uses the constant; the model snapshot does not change, so no migration.
3. Web: `DataAnnotationsValidator` passes the service provider into `ValidationContext`; the attribute resolves `TimeProvider` from it. Pages inject `TimeProvider` for `MaxDate`, which stays a UI aid while the attribute is the rule.
4. Length messages stay the framework defaults (FluentValidation on the API, DataAnnotations on the Web), built from the shared number. Only the birthday message is shared.
5. Regression risks: east of UTC, between local and UTC midnight, the local "today" is now refused (intended). Near the UTC day change the window is clock skew only. `MudDatePicker` opens on the local month; with UTC `MaxDate` on the 1st every shown day can be disabled (handled in the UI test).

## 5. Tests

**bUnit**
- `NotInFutureAttributeTests`: null valid; UTC today valid; UTC tomorrow invalid with the shared message; time-zone case (UtcNow 2026-03-10T23:30Z, local zone UTC+14): 2026-03-11 invalid, 2026-03-10 valid; fallback to `TimeProvider.System`.
- `CreateContactTests` / `EditContactTests`: existing today / future / 30 / 31 cases kept with UTC data; `Render_BirthdayPickerMaxDate_IsUtcToday` with a fixed clock; new `Submit_BirthdayUtcTomorrowButLocalToday_BlocksSubmit`.
- `ContactBuilderTests`: `BirthdayToday()` equals `DateTime.UtcNow.Date`.

**Playwright API**: existing create/update boundary specs (today 201/204, tomorrow 400, 30 chars OK, 31 chars 400) run on UTC factory dates; factory spec moves to UTC. No server-side time-zone test is possible over HTTP.

**UI E2E**: `validation.spec.ts` computes the picker expectation from UTC; a time-zone case with `timezoneId: 'Pacific/Kiritimati'` and `page.clock.setFixedTime('2026-03-10T23:30:00Z')` asserts day 11 disabled and day 10 enabled (dropped if `page.clock` does not reach Blazor WASM `DateTime.UtcNow`).

## 6. Verification

| Acceptance item | How |
|---|---|
| UTC rule on both sides and docs | bUnit time-zone cases; MaxDate tests (Create and Edit); review of both validators; doc diff |
| Single source for the length limit | grep for `MaximumLength(30)` / `StringLength(30)` / `HasMaxLength(30)` returns nothing; solution builds; no pending EF model changes |
| Boundary tests on both sides | bUnit; ApiTests create/update specs; UiTests `validation.spec.ts` |
| MaxDate on both pages | bUnit tests; browser walk of Create and Edit |
| Factories use UTC | factory specs; `ContactBuilderTests` |

## 7. Out of scope

- An API unit-test project with a fake `TimeProvider` (none exists; server behaviour is covered by Playwright E2E). Follow-up issue if wanted.
- Sharing the length-error message text between FluentValidation and DataAnnotations.
- Phone and PhoneOperator length limits (no command or form yet).
- Clock skew between browser and server near UTC midnight (inherent, documented).

## 8. Decisions during review

- Message sharing: only the birthday message is shared; length messages stay framework defaults. (Confirmed.)
- Test clock: in-house `FixedTimeProvider`, no `Microsoft.Extensions.TimeProvider.Testing` package. (Confirmed.)
- UI time-zone E2E: kept if `page.clock` + `timezoneId` reach Blazor WASM, otherwise dropped. (Confirmed.)

## 9. Tasks

- [x] Add `ContactRules` to `src/AddressBook.Contracts`.
- [x] API: register `TimeProvider.System`; inject it into both validators; use `ContactRules`.
- [x] API: `ContactConfiguration` uses `ContactRules.NameMaxLength`; confirm no pending model changes.
- [x] Web: register `TimeProvider.System`; `CreateContactModel` and `NotInFutureAttribute` use `ContactRules`.
- [x] Web: CreateContact and EditContact set `MaxDate` to the UTC date.
- [x] Web.Tests: `FixedTimeProvider`, `MudTestContext`, `ContactBuilder`.
- [x] Web.Tests: update assertions; add fixed-clock cases and `NotInFutureAttributeTests`.
- [x] ApiTests: UTC dates in `contact.factory.ts` and its spec.
- [x] UiTests: UTC dates in `contact.factory.ts`; update `validation.spec.ts`; add the time-zone case.
- [x] Docs: `AddressBook.Api.md`, `AddressBook.Web.md`, `AddressBook.Contracts.md`.
- [x] Build the solution and run bUnit, ApiTests and UiTests.
