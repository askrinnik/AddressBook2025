# План: Современный фреймворк компонентных (bUnit) автотестов `src/AddressBook.Web.Tests`

> **Статус:** черновик / готов к реализации
> **Целевая папка:** `src/AddressBook.Web.Tests` (новая; `src/ApiTests` и `src/UiTests` не трогаем)
> **Тестируемое приложение:** `src/AddressBook.Web` — Blazor WebAssembly + MudBlazor 9.8.0 (.NET 10)
> **Тип тестов:** компонентные/страничные (**bUnit**) — рендеринг в памяти, **без браузера**; API, HTTP и БД замоканы
> **Стек:** bUnit v2 · xUnit v3 · NSubstitute · Bogus · только bUnit- и xUnit-ассерты (без FluentAssertions)
> **Прогресс отслеживается чек-боксами в разделе [Список задач](#5-список-задач-github-ready).**

## 1. Цель

Разработать с нуля новый, современный, гибкий и мощный фреймворк **компонентных/страничных**
автотестов для `AddressBook.Web` на **bUnit + xUnit v3**. Это третий (после `src/ApiTests` и
`src/UiTests`), но принципиально другой слой пирамиды: он рендерит реальные Blazor-компоненты
**в памяти** и проверяет их логику рендеринга, привязки, валидацию и обработку событий —
**без браузера, без запущенного API и без SQL Server**.

Ключевая идея архитектуры — **изоляция через моки**. В отличие от E2E (`src/UiTests`) и API-тестов
(`src/ApiTests`), которым нужен живой стек, здесь `IAddressBookApiService`, `NavigationManager` и
JSInterop подменяются. Тесты становятся быстрыми, детерминированными и гоняются одним
`dotnet test` в CI без внешних зависимостей. Это закрывает «дешёвый» уровень пирамиды: то, что
сейчас проверяется медленным браузерным E2E (клиентская валидация, ветки `_notFound`,
маппинг ошибок сервера на поля формы, диалог удаления), становится быстрым unit-покрытием, а E2E
остаётся для сквозных сценариев.

Полностью покрываем страницы (`Home`, `Contacts`, `CreateContact`, `EditContact`), компоненты
оболочки (`MainLayout`, `NavMenu`, `Error`), переиспользуемый `CustomValidationSummary`, а также
сервисный слой `AddressBookApiService` (через мок `HttpMessageHandler`).

## 2. Архитектурные решения

- **Изоляция через моки, а не через живой стек.** Компонентные тесты рендерят Blazor в памяти
  (bUnit `TestContext`), а `IAddressBookApiService`, `NavigationManager`, JSInterop — подменяются.
  Нет браузера, API, БД → тест стартует с известного состояния и проверяет ровно одну вещь. Это
  главное отличие от `src/UiTests` (гибридный E2E) и `src/ApiTests` (HTTP).
- **bUnit v2 + xUnit v3.** bUnit рендерит компонент (`RenderComponent<T>`), даёт доступ к DOM
  (`cut.Find`/`FindAll`), диспетчеризацию событий (`Click`, `Change`, `Input`) и `WaitForState`/
  `WaitForAssertion` для асинхронного рендеринга. Раннер — xUnit v3 (bUnit v2 — единственная линия
  bUnit с поддержкой xUnit v3).
- **Мок сервисного слоя через NSubstitute.** `Substitute.For<IAddressBookApiService>()` —
  задаём ответы (`Returns`) и проверяем вызовы (`Received`). NSubstitute — современный бесплатный
  выбор без лицензионных оговорок (Moq/SponsorLink). Это библиотека **моков**, не ассертов, поэтому
  совместима с выбором «только bUnit + xUnit Assert».
- **Базовый `MudTestContext` для MudBlazor.** Общий базовый класс инкапсулирует установку в одном
  месте: `Services.AddMudServices()`, `JSInterop.Mode = JSRuntimeMode.Loose`, регистрация
  провайдеров (`MudPopoverProvider`/`MudDialogProvider`) и подмена `IAddressBookApiService`. Тесты
  не повторяют boilerplate MudBlazor.
- **Переиспользуем `data-testid` из Web-проекта.** Разметка уже содержит стабильные `data-testid`
  (добавлены ранее для `src/UiTests`: `contacts-table`, `contacts-search`, `contact-row-{id}`,
  `contact-edit-{id}`, `contact-delete-{id}`, `contact-delete-confirm`, `contact-form-*`,
  `app-drawer-toggle`, `app-theme-toggle`, `nav-*`). bUnit ищет по `cut.Find("[data-testid=...]")`.
  Централизуем константы в `TestIds.cs` (порт `src/UiTests/src/utils/testids.ts`). **Новые testid в
  Web НЕ добавляем** — приоритет селекторов: роль/`aria-label` → `data-testid` → CSS как крайний случай.
- **Component harness (обёртки над отрендеренным компонентом).** Тонкие обёртки над
  `IRenderedComponent<T>` для нетривиальных виджетов (форма create/edit, таблица, диалог удаления,
  оболочка) — .NET-аналог component objects из `src/UiTests`. Хрупкость MudBlazor-разметки
  изолирована в одном месте, спеки читаются доменно.
- **Фабрики данных на Bogus.** `ContactBuilder` строит `ContactModel`/`CreateContactModel` +
  именованные граничные варианты (валидный, с/без birthday, длина 30/31, пробелы, будущая дата) —
  порт идеи `contact.factory.ts`.
- **`FakeNavigationManager` для навигации.** Встроенный в bUnit — проверяем переходы (create →
  `/contacts`, edit-кнопка → `/edit-contact/{id}`, cancel → `/contacts`) через `nav.Uri` без
  реального роутинга.
- **Сервисный слой через управляемый `HttpMessageHandler`.** `FakeHttpMessageHandler` возвращает
  заранее заданный `HttpResponseMessage` (в т.ч. `Location`-заголовок и problem+json для 404), что
  позволяет юнит-тестировать `AddressBookApiService` (парсинг id, `404 → null` через
  `ProblemDetailsException`, `DateTime → DateOnly`, построение URL) вместе с `ProblemDetailsHandler`.
- **Семантические ассерты bUnit + xUnit `Assert`.** `cut.Find`/`FindAll`, `MarkupMatches`,
  атрибуты/классы узлов — плюс `Assert.*` для статусов/значений. Никаких сторонних
  assertion-библиотек (FluentAssertions v8 платная для коммерческого использования — не берём).
- **Асинхронность без задержек.** `MudTable ServerData` и `OnInitializedAsync` — через
  `cut.WaitForState(...)` / `cut.WaitForAssertion(...)`, никаких `Task.Delay`/`Thread.Sleep`.
- **Покрытие кода.** `coverlet.collector` → Cobertura; логи в CI через `GitHubActionsTestLogger`.
- **Стек:** `bunit` (v2) · `xunit.v3` · `Microsoft.NET.Test.Sdk` · `NSubstitute` · `Bogus` ·
  `MudBlazor` 9.8.0 (транзитивно из Web) · `coverlet.collector` · `GitHubActionsTestLogger`.

## 3. Факты о компонентах и страницах (основа для дизайна тестов)

- **Хостинг:** Blazor **WebAssembly standalone**, .NET 10, MudBlazor **9.8.0**. Тест-проект
  ссылается на `AddressBook.Web` напрямую → рендерит реальные компоненты и получает MudBlazor той
  же версии транзитивно (отдельный `PackageReference` на MudBlazor не нужен).
- **Оболочка (`Layout/MainLayout.razor`):** `LayoutComponentBase`; рендерит провайдеры
  `MudThemeProvider` (`@bind-IsDarkMode`), `MudPopoverProvider`, `MudDialogProvider`,
  `MudSnackbarProvider`; `MudAppBar` (заголовок «Contact Book», кнопка drawer `app-drawer-toggle`,
  тумблер темы `app-theme-toggle`); `MudDrawer` хостит `NavMenu`.
- **`Layout/NavMenu.razor`:** `MudNavMenu` с двумя `MudNavLink`: Home (`""`, `Match=All`,
  `nav-home`) и Contacts (`/contacts`, `Match=Prefix`, `nav-contacts`).
- **`Layout/Error.razor`:** cascading-обёртка над роутером; методы `ProcessError(string)`,
  `ProcessProblem(ClientProblemDetails?)`, `Clear()`; инжектит `ILogger<Error>`; рендерит верхний
  баннер, когда `ErrorMessage` не пуст. **Чисто юнит-тестируется** через вызов методов + проверку разметки.
- **`Pages/Home.razor` (`/`):** статичная, `<PageTitle>Home</PageTitle>` + `<h1>Contacts application</h1>`, без DI.
- **`Pages/Contacts.razor` (+ `Contacts.razor.cs`, code-behind, `/contacts`):**
  - `MudTable<ContactModel>` с `ServerData="ServerReload"`; данные грузятся через
    `IAddressBookApiService.GetFilteredContactsAsync`. Колонки: First Name, Last Name, Birthday
    (`ToShortDateString()`), Actions.
  - Сортировка `MudTableSortLabel`: `fn_field`/`ln_field`/`bd_field` (клиентская, `OrderByDirection`).
  - Пагинация клиентская (`Skip/Take`), `TotalItems = response.TotalRows`; **кастомный** селектор
    rows-per-page — `MudSelect<int>` (`aria-label="Rows per page"`) + `MudTablePager HideRowsPerPage`.
  - Тулбар: `Create Contact` (`contacts-create` → `/create-contact`) и поиск (`contacts-search`,
    `Clearable`) → `OnSearch` → `_contactTable.ReloadServerData()`.
  - Строка: Edit (`contact-edit-{id}`, `aria-label="Edit contact"` → `/edit-contact/{id}`) и Delete
    (`contact-delete-{id}`, `aria-label="Delete contact"`) — иконочные `MudButton` **без текста**.
  - Delete → `MudMessageBox` (`_confirmDeleteMessageBox.ShowAsync()`, Title «Warning», текст
    «Are you sure you want to delete this contact?», кнопка «Yes» = `contact-delete-confirm`); по
    «Yes» → `DeleteContact(id)` → reload.
  - Ошибка загрузки: `catch` в `ServerReload` → `Error.ProcessError(...)` + `_errorText` в
    `MudAlert` внутри `NoRecordsContent`.
- **`Pages/CreateContact.razor` (`/create-contact`):** `EditForm` c явным `EditContext` +
  `DataAnnotationsValidator` + `ValidationSummary`. Поля: First name / Last Name (`MudTextField`,
  `contact-form-first-name`/`-last-name`), Birthday (`MudDatePicker`, `contact-form-birthday`).
  Кнопки Create (`contact-form-submit`, submit) / Cancel (`contact-form-cancel`).
  **Важные ветки для тестов:** используется `OnSubmit` (не `OnValidSubmit`) → валидация вызывается
  вручную `_editContext.Validate()`; при невалидной форме сабмит не доходит до сервиса. Успех →
  `CreateContact(_model)` → навигация `/contacts`. `ProblemDetailsException` → `GetErrors()` →
  `ValidationMessageStore.Add(field, ...)` (маппинг на поля). Общее исключение → сообщение на
  пустом ключе. `_isLoading` дизейблит submit во время вызова.
- **`Pages/EditContact.razor` (`/edit-contact/{Id:int}`):** `OnInitializedAsync` →
  `GetContactByIdAsync(Id, ...)`; если `null` → `_notFound=true` → `MudAlert` «Contact not found.»
  + кнопка «Back to Contacts». Иначе форма как в create; Save → `UpdateContact` → `/contacts`.
- **`Components/CustomValidationSummary.razor`:** `IDisposable`, подписан на
  `EditContext.OnValidationStateChanged`, показывает только **model-level** сообщения (фильтрует
  per-field). Сейчас **не подключён** ни к одной странице — но сам по себе хороший юнит-объект.
- **Сервис `AddressBookApiService` (`AddressBookApiService.cs`):** primary ctor
  `(HttpClient httpClient)`. 5 методов; ключевые ветки: URL строится с `?search=` только для
  непустого термина; `CreateContact` парсит id из последнего сегмента `Location` (0 при неудаче) и
  конвертит `DateTime?→DateOnly?`; `GetContactByIdAsync` возвращает `null`, ловя
  `ProblemDetailsException` со статусом 404 (не сырой 404 — его конвертит `ProblemDetailsHandler`);
  `DeleteContact`/`UpdateContact` бросают на non-success.
- **Установка MudBlazor в bUnit (обязательные факты):** нужны `AddMudServices()`,
  `JSInterop` в loose-режиме и отрендеренные провайдеры (`MudPopoverProvider`/`MudDialogProvider`),
  иначе overlay-компоненты (`MudDatePicker`, `MudMessageBox`, выпадашка `MudSelect`) кидают на
  JSInterop/провайдерах.

## 4. Структура каталогов

```
src/AddressBook.Web.Tests/
  AddressBook.Web.Tests.csproj   xunit.runner.json   GlobalUsings.cs
  README.md   CLAUDE.md   .gitignore
  Infrastructure/
    MudTestContext.cs            # базовый TestContext: AddMudServices, JSInterop loose,
                                 #   провайдеры, подмена IAddressBookApiService (NSubstitute)
    MudBlazorJsInterop.cs        # заглушки JS-вызовов MudBlazor (popover/keyinterceptor/scroll)
    TestIds.cs                   # константы data-testid (порт src/UiTests/src/utils/testids.ts)
    ApiServiceMock.cs            # хелперы настройки IAddressBookApiService (Returns/Received)
    FakeHttpMessageHandler.cs    # управляемый HttpMessageHandler для тестов сервиса
    RenderedComponentExtensions.cs # доменные хелперы поиска/ассертов над cut
  Data/
    ContactBuilder.cs            # Bogus: ContactModel/CreateContactModel + граничные варианты
  Harnesses/
    ContactFormHarness.cs        # обёртка формы create/edit: заполнить поля, submit, ошибки
    ContactsTableHarness.cs      # обёртка MudTable: строки, поиск, сортировка, действия строки
    DeleteDialogHarness.cs       # обёртка MudMessageBox (подтверждение/отмена удаления)
    AppShellHarness.cs           # AppBar / drawer / тумблер темы / навигация
  Tests/
    Layout/
      MainLayoutTests.cs         # провайдеры, drawer toggle, тумблер темы, заголовок
      NavMenuTests.cs            # ссылки Home/Contacts, href, активная ссылка
      ErrorTests.cs              # ProcessError/ProcessProblem/Clear → рендер/скрытие баннера
    Pages/
      HomeTests.cs               # статический контент, PageTitle
      ContactsListTests.cs       # загрузка строк, поиск (reload), пустой результат, sort, rows-per-page
      ContactsDeleteTests.cs     # диалог удаления: «Cancel» не удаляет, «Yes» → delete + reload
      ContactsErrorTests.cs      # исключение загрузки → баннер Error + MudAlert
      CreateContactTests.cs      # required блокирует submit, успех → навигация, cancel, _isLoading
      CreateContactServerErrorTests.cs # ProblemDetails.GetErrors → сообщения на полях формы
      EditContactTests.cs        # предзаполнение, save → UpdateContact + навигация, cancel
      EditContactNotFoundTests.cs # GetContactById→null ⇒ _notFound: MudAlert + Back to Contacts
    Components/
      CustomValidationSummaryTests.cs # только model-level сообщения, отписка при Dispose
    Services/
      AddressBookApiServiceTests.cs   # 5 методов через FakeHttpMessageHandler: URL, Location-id,
                                      #   404→null, DateTime→DateOnly, исключения на non-success
```

## 5. Список задач (GitHub-ready)

Эти задачи предназначены для переноса в GitHub Issues (номера проставим при заведении). По мере
выполнения отмечаем `[x]`.

### Фаза 0 — Каркас

- [ ] **B1** ([#145](https://github.com/askrinnik/AddressBook2025/issues/145)) Scaffold `src/AddressBook.Web.Tests`: `.csproj` (`net10.0`, `IsPackable=false`,
  `ProjectReference` на `AddressBook.Web`; пакеты `bunit` v2, `xunit.v3`, `Microsoft.NET.Test.Sdk`,
  `NSubstitute`, `Bogus`, `coverlet.collector`, `GitHubActionsTestLogger`), `xunit.runner.json`,
  `GlobalUsings.cs`, `.gitignore`, README/CLAUDE-заглушки. **Добавить проект в `src/AddressBook.sln`.**
  Создать этот файл плана в `docs/tasks/`.
- [ ] **B2** ([#146](https://github.com/askrinnik/AddressBook2025/issues/146)) `Infrastructure/MudTestContext.cs` + `MudBlazorJsInterop.cs`: `AddMudServices()`,
  `JSInterop` loose, провайдеры, подмена `IAddressBookApiService`. Sanity-тест: тривиальный
  MudBlazor-компонент рендерится без исключений на JSInterop.

### Фаза 1 — Инфраструктура

- [ ] **B3** ([#147](https://github.com/askrinnik/AddressBook2025/issues/147)) `Infrastructure/TestIds.cs` — константы `data-testid` (порт
  `src/UiTests/src/utils/testids.ts`), единый источник селекторов.
- [ ] **B4** ([#148](https://github.com/askrinnik/AddressBook2025/issues/148)) `Infrastructure/ApiServiceMock.cs` + `FakeHttpMessageHandler.cs` — хелперы NSubstitute
  (частые расстановки `Returns`/`Received`) и управляемый `HttpMessageHandler` (статус, `Location`,
  problem+json) для тестов сервиса.
- [ ] **B5** ([#149](https://github.com/askrinnik/AddressBook2025/issues/149)) `Data/ContactBuilder.cs` — Bogus-билдеры `ContactModel`/`CreateContactModel` +
  именованные граничные варианты (валидный, с/без birthday, длина 30/31, пробелы, будущая дата).
- [ ] **B6** ([#150](https://github.com/askrinnik/AddressBook2025/issues/150)) `Harnesses/*` + `RenderedComponentExtensions.cs` — обёртки `ContactFormHarness`,
  `ContactsTableHarness`, `DeleteDialogHarness`, `AppShellHarness` (доменные операции над `cut`,
  инкапсуляция MudBlazor-разметки).

### Фаза 2 — Тесты (компоненты и страницы)

- [ ] **B7** ([#151](https://github.com/askrinnik/AddressBook2025/issues/151)) `Tests/Layout/MainLayoutTests.cs` + `NavMenuTests.cs` — провайдеры отрендерены,
  drawer toggle, тумблер темы (dark/light), заголовок, ссылки Home/Contacts и их `href`.
- [ ] **B8** ([#152](https://github.com/askrinnik/AddressBook2025/issues/152)) `Tests/Layout/ErrorTests.cs` — `ProcessError`/`ProcessProblem` показывают баннер с
  текстом, `Clear()` его скрывает; пустое состояние баннера не рендерит.
- [ ] **B9** ([#153](https://github.com/askrinnik/AddressBook2025/issues/153)) `Tests/Pages/HomeTests.cs` — статический контент и `PageTitle`.
- [ ] **B10** ([#154](https://github.com/askrinnik/AddressBook2025/issues/154)) `Tests/Pages/ContactsListTests.cs` — рендер строк из мока, поиск →
  `GetFilteredContactsAsync` c термином + reload, пустой результат («No matching records found»),
  сортировка по колонкам, смена rows-per-page.
- [ ] **B11** ([#155](https://github.com/askrinnik/AddressBook2025/issues/155)) `Tests/Pages/ContactsDeleteTests.cs` — открытие `MudMessageBox`; «Cancel» → сервис
  `DeleteContact` **не** вызван; «Yes» → вызван и таблица перезагружена (`Received`).
- [ ] **B12** ([#156](https://github.com/askrinnik/AddressBook2025/issues/156)) `Tests/Pages/ContactsErrorTests.cs` — мок бросает исключение → `Error`-баннер и
  `MudAlert` с сообщением.
- [ ] **B13** ([#157](https://github.com/askrinnik/AddressBook2025/issues/157)) `Tests/Pages/CreateContactTests.cs` — пустые First/Last name блокируют submit
  (`CreateContact` не вызван, видны required-сообщения); валидная форма → `CreateContact` вызван
  → навигация `/contacts`; Cancel → навигация без вызова; `_isLoading` дизейблит submit.
- [ ] **B14** ([#158](https://github.com/askrinnik/AddressBook2025/issues/158)) `Tests/Pages/CreateContactServerErrorTests.cs` — мок бросает `ProblemDetailsException`
  с `errors` → сообщения ложатся на соответствующие поля формы (`ValidationMessageStore`).
- [ ] **B15** ([#159](https://github.com/askrinnik/AddressBook2025/issues/159)) `Tests/Pages/EditContactTests.cs` + `EditContactNotFoundTests.cs` — предзаполнение из
  `GetContactByIdAsync`, Save → `UpdateContact` + навигация, Cancel; `null` → `_notFound`: `MudAlert`
  «Contact not found.» + кнопка «Back to Contacts».
- [ ] **B16** ([#160](https://github.com/askrinnik/AddressBook2025/issues/160)) `Tests/Components/CustomValidationSummaryTests.cs` — показываются только model-level
  сообщения (per-field отфильтрованы); обновление при `OnValidationStateChanged`; отписка в `Dispose`.
- [ ] **B17** ([#161](https://github.com/askrinnik/AddressBook2025/issues/161)) `Tests/Services/AddressBookApiServiceTests.cs` — через `FakeHttpMessageHandler`:
  построение URL (`?search=` только для непустого термина), парсинг id из `Location` (и `0` при
  неудаче), `404 → null` (через `ProblemDetailsException`), `DateTime→DateOnly`, исключения на
  non-success у `Delete`/`Update`.

### Фаза 3 — Обвязка и документация

- [ ] **B18** ([#162](https://github.com/askrinnik/AddressBook2025/issues/162)) `README.md` (запуск `dotnet test`, архитектура, соглашения, отладка) + `CLAUDE.md`
  для `src/AddressBook.Web.Tests` (пойнтер на инструкции и план).
- [ ] **B19** ([#163](https://github.com/askrinnik/AddressBook2025/issues/163)) Инструкция `bunit-conventions.instructions.md` в `.github/instructions/` (front-matter
  `applyTo: src/AddressBook.Web.Tests/**`, зеркалим в `.claude` по `sync-ai-customizations`) +
  обновить хаб `CLAUDE.md`, `docs/specs/Architecture.md` (дерево, таблицы) и `.vscode/tasks.json`
  (задача `dotnet test`). Заодно освежить устаревшие версии в `docs/specs/AddressBook.Web.md`
  (MudBlazor 9.8.0, WASM 10.0.11).
- [ ] **B20** ([#164](https://github.com/askrinnik/AddressBook2025/issues/164)) (опц., с подтверждением) CI-workflow `.github/workflows/web-tests.yml`: `setup-dotnet`
  10.0.x → `dotnet test src/AddressBook.Web.Tests` (+ артефакт покрытия). **Без** SQL Server,
  **без** браузеров — тесты полностью офлайн.
- [ ] **B21** ([#165](https://github.com/askrinnik/AddressBook2025/issues/165)) Верификация: `dotnet build src/AddressBook.sln` + `dotnet test
  src/AddressBook.Web.Tests` — всё зелёное.

## 6. Что переиспользуем из `src/UiTests` и `AddressBook.Web`

Из **`src/UiTests`** (концептуально, порт на C#):
- **Соглашение `data-testid` и константы** (`utils/testids.ts` → `Infrastructure/TestIds.cs`) — те
  же селекторы, что уже есть в разметке Web.
- **Подход к данным:** фабрики + именованные граничные варианты (`contact.factory.ts` →
  `ContactBuilder.cs` на Bogus).
- **Component-object паттерн** → harness-обёртки над `IRenderedComponent<T>`.
- **Факты о поведении** страниц, валидации и диалога удаления (из плана UiTests и
  `docs/specs/AddressBook.Web.md`).

Из **`AddressBook.Web`** напрямую:
- Тест-проект **ссылается** на Web → рендерит реальные компоненты (не копии) и получает MudBlazor
  9.8.0 транзитивно.
- Contracts-типы (`ContactModel`, `GetFilteredContactsResponse`, `CreateContactCommand`/
  `UpdateContactCommand`) и `CreateContactModel` — конструируем в фабриках.

## 7. Ключевые технические риски и решения

| Риск | Решение |
|---|---|
| MudBlazor требует JSInterop и провайдеров при рендере | Базовый `MudTestContext`: `AddMudServices` + `JSInterop` loose + `MudPopoverProvider`/`MudDialogProvider` |
| Overlay-виджеты (`MudDatePicker`, `MudMessageBox`, `MudSelect`) идут через JS | `JSInterop` loose + отрендеренные провайдеры; harness инкапсулирует открытие/выбор |
| `MudTable ServerData` и `OnInitializedAsync` асинхронны | `cut.WaitForState` / `WaitForAssertion`, никаких `Task.Delay`/`Sleep` |
| Навигация из компонентов | Встроенный bUnit `FakeNavigationManager` — проверка `nav.Uri` без реального роутинга |
| Первый .NET-тест-проект в репо | Добавляем в `AddressBook.sln`; `build.yml` и `security.yml` подхватят его автоматически (сканируют всю sln) |
| Версии MudBlazor должны совпадать с Web | Ссылка на проект `AddressBook.Web` даёт MudBlazor 9.8.0 транзитивно — отдельный `PackageReference` не дублируем |
| bUnit v2 требуется для xUnit v3 (может быть pre-release) | Явно пинним версии `bunit`/`xunit.v3` в `.csproj`; sanity-тест B2 подтверждает связку |
| FluentAssertions v8 платная для коммерции | Не используем — только bUnit-ассерты (`Find`/`MarkupMatches`) + xUnit `Assert` |
| `GetContactByIdAsync` ловит `ProblemDetailsException` (404), а не сырой 404 | Тест сервиса через `FakeHttpMessageHandler` эмулирует 404 + реальный `ProblemDetailsHandler` в pipeline |
| `MudMessageBox`/`MudSelect` без доступного имени | Локатор по `data-testid` (`contact-delete-confirm`) / `aria-label` — уже в разметке |

## 8. Верификация

1. `dotnet restore src/AddressBook.sln`.
2. `dotnet build src/AddressBook.sln -c Release` — тест-проект собирается в составе решения.
3. `dotnet test src/AddressBook.Web.Tests` — все тесты зелёные, **без** SQL Server / API / браузера.
4. (опц.) `dotnet test src/AddressBook.Web.Tests --collect:"XPlat Code Coverage"` + отчёт
   ReportGenerator по покрытию страниц/компонентов/сервиса.
5. Прогон детерминированный и офлайн: отсутствие внешних зависимостей проверяется запуском без
   поднятого API и без сети.
