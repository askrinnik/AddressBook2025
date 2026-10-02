# План: Issue #150 — Blazor Tests B6: Harness-обёртки над отрендеренным компонентом

> **Issue:** [#150](https://github.com/askrinnik/AddressBook2025/issues/150) — «Blazor Tests B6: Harness-обёртки над отрендеренным компонентом» (Фаза 1)
> **Режим работы:** test-authoring / инфраструктура — **production-код (`AddressBook.Web`) не трогаем**, новые `data-testid` не добавляем.

## 1. Требование

`Harnesses/*` + `Infrastructure/RenderedComponentExtensions.cs` — тонкие обёртки над отрендеренным компонентом
(.NET-аналог component objects из `src/UiTests`): `ContactFormHarness`, `ContactsTableHarness`,
`DeleteDialogHarness`, `AppShellHarness`. Доменные операции над `cut`; хрупкая MudBlazor-разметка
инкапсулирована в одном месте, спеки Фазы 2 (B7–B16) читаются доменно.

## 2. Acceptance

- [x] `RenderedComponentExtensions`: `FindByTestId` / `FindAllByTestId` / `TryFindByTestId` / `HasTestId` / `FindByAriaLabel` поверх `TestIds.Selector`; работают для любого `IRenderedComponent`.
- [x] `ContactFormHarness` (create/edit): `SetFirstName` / `SetLastName` / `SetBirthday`, `Fill(CreateContactModel)`, `Submit()`, `Cancel()`, `IsSubmitDisabled`, значения полей, `ValidationMessages`.
- [x] `ContactsTableHarness`: `RowIds`/`RowCount`, `RowText(id)` (имя/фамилия/дата), `Search(text)`, `ClickEdit(id)`, `ClickDelete(id)`, `ClickCreate()`, `SortBy(label)`, `IsNoRecordsShown`, `ErrorAlertText`, `RowsPerPage` + `SelectRowsPerPage(n)`; ожидание асинхронной загрузки через `WaitForState`/`WaitForAssertion`.
- [x] `DeleteDialogHarness` (над `MudDialogProvider`): `IsOpen`, `Message`, `Confirm()` (testid `contact-delete-confirm`), `Cancel()` (кнопка «Cancel»).
- [x] `AppShellHarness` (над `MainLayout`): `Title`, `ToggleDrawer()`, `IsDrawerOpen`, `ToggleTheme()`, `IsDarkMode`, `NavHomeHref`/`NavContactsHref`, `IsNavHomeActive`/`IsNavContactsActive`.
- [x] Локаторы только через `TestIds` / `aria-label` / роль; никаких `Task.Delay`/`Sleep`.
- [x] Каждый harness проверен sanity-тестами против **реальных** компонентов Web (разметка MudBlazor подтверждена, а не угадана).
- [x] `GlobalUsings.cs` — `global using AddressBook.Web.Tests.Harnesses;`.
- [x] `dotnet build src/AddressBook.slnx` без новых предупреждений, `dotnet test --project src/AddressBook.Web.Tests` зелёный.

## 3. Затронутые файлы (только `src/AddressBook.Web.Tests`)

- `Infrastructure/RenderedComponentExtensions.cs` — extension-методы поиска по testid/aria-label.
- `Harnesses/ContactFormHarness.cs`, `ContactsTableHarness.cs`, `DeleteDialogHarness.cs`, `AppShellHarness.cs`.
- `Tests/Harnesses/*HarnessTests.cs` (+ `Tests/Infrastructure/RenderedComponentExtensionsTests.cs`).
- `GlobalUsings.cs`.

## 4. Подход

- Harness = обычный класс с конструктором `(IRenderedComponent<T> cut)`; без наследования от `BunitContext`.
  Состояние не кэшируется: каждый запрос заново ищет в `cut` (DOM меняется после рендера).
- Страницы рендерятся в тестах как реальные `CreateContact` / `Contacts` / `MainLayout`; harness для
  диалога строится на `IRenderedComponent<MudDialogProvider>` из `RenderProviders()`, т.к. `MudMessageBox`
  открывается через провайдер.
- Реальную разметку MudBlazor (куда попадает `data-testid` — на корневой `div` или на `input`; как
  кликается `MudSelectItem`; как `MudDatePicker` принимает ввод) уточняем на sanity-тестах и
  инкапсулируем в harness, а не в спеках.
- Действия, вызывающие async-перезагрузку (`Search`, `SelectRowsPerPage`, `Confirm`), ждут завершения через
  `WaitForAssertion`; публичные члены синхронные.
- Ввод birthday: если ввод текста в `MudDatePicker` в bUnit ненадёжен — `SetBirthday` идёт через
  `MudDatePicker`-компонент (`FindComponent<MudDatePicker>().Instance.SetDateAsync`), решение фиксируем в
  комментарии harness.

## 5. Tests

Playwright API/UI не нужны — поведение API/UI не меняется. xUnit/bUnit sanity-тесты каждого harness
против реальных компонентов (мок `IAddressBookApiService` + `ContactBuilder`):

- **Extensions:** найденный/ненайденный testid, `TryFind` → null, `HasTestId`, `FindByAriaLabel`.
- **ContactFormHarness:** `Fill` + `Submit` валидной формы → `CreateContact` получил значения и навигация `/contacts`; пустые имена → submit блокируется, `ValidationMessages` непусты; `Cancel` → навигация без вызова; граничное имя 31 символ → ошибка длины.
- **ContactsTableHarness:** строки из мока (`RowIds`, `RowText`); `Search` → `ReceivedSearch(term)`; `ClickEdit` → `/edit-contact/{id}`; `ClickCreate` → `/create-contact`; пустой результат → `IsNoRecordsShown`; исключение загрузки → `ErrorAlertText`; сортировка меняет порядок; смена rows-per-page.
- **DeleteDialogHarness:** клик Delete открывает диалог (`IsOpen`, `Message`); `Cancel` → `DidNotReceiveDelete`; `Confirm` → `ReceivedDelete(id)` + reload.
- **AppShellHarness:** заголовок «Contact Book»; `ToggleDrawer` меняет `IsDrawerOpen`; `ToggleTheme` меняет `IsDarkMode`; href'ы nav-ссылок.

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. Браузерный UI-walk
не применим (компонентные тесты в памяти).

## 7. Вне скоупа

Сами спеки страниц/layout (B7–B16), тесты сервиса (B17), документация (B18–B19). Если sanity-тесты
вскроют реальный дефект в Web — останавливаемся и заводим отдельный bug-issue.

## 8. Отклонения от плана (по итогам реализации)

- `ContactFormHarness` — не generic: `IRenderedComponent<out T>` ковариантен, harness принимает `IRenderedComponent<IComponent>` (подходит и для `CreateContact`, и для `EditContact`).
- `SetBirthday` идёт через `DateChanged` компонента `MudDatePicker` (`SetDateAsync` — protected, поле readonly).
- `ContactsTableHarness.Render(context)` — фабрика, рендерит `Contacts` внутри реального `Error` (страница требует его как cascading-параметр; без него ошибка загрузки даёт NRE). Добавлен `ErrorBannerText`.
- `SelectRowsPerPage` задаёт значение через `ValueChanged` самого `MudSelect<int>` (popover-выпадашка в bUnit ненадёжна).
- `ClickNavHome/ClickNavContacts` убраны: клик по `<a href>` в bUnit не навигирует (это поведение браузера); проверяются `href` и active-класс.
- В `MudTestContext` добавлен `CurrentPath` (путь `FakeNavigationManager`) — нужен всем тестам навигации.
