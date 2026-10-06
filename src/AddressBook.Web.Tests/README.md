# AddressBook Web Component Tests (`src/AddressBook.Web.Tests`)

Компонентные/страничные автотесты для `AddressBook.Web` (Blazor WebAssembly + MudBlazor) на
**bUnit + xUnit v3**. Рендерят реальные Blazor-компоненты **в памяти, без браузера**; API, HTTP и
БД замоканы (NSubstitute + управляемый `HttpMessageHandler`). Тесты быстрые, детерминированные,
гоняются одним `dotnet test` без внешних зависимостей.

> Это отдельный слой пирамиды: [`src/ApiTests`](../ApiTests/README.md) проверяет HTTP API,
> [`src/UiTests`](../UiTests/README.md) — приложение в реальном браузере (оба на Playwright/TypeScript).

## Стек

`bunit` 2.9.0 · `xunit.v3` 4.0.0 · `NSubstitute` 6.2.0 · `Bogus` 35.6.5. Версии закреплены централизованно
в [`src/Directory.Packages.props`](../Directory.Packages.props), `packages.lock.json` лежит в репозитории.
MudBlazor 9.8.0 приходит транзитивно через `ProjectReference` на `AddressBook.Web`.

Ассерты — только семантические bUnit (`Find`/`MarkupMatches`) + xUnit `Assert` (без FluentAssertions).

xUnit v3 работает нативно на **Microsoft.Testing.Platform (MTP)**: на .NET 10 SDK классический
VSTest-путь удалён, поэтому VSTest-пакеты (`Microsoft.NET.Test.Sdk`, `xunit.runner.visualstudio`,
`coverlet.collector`, `*TestLogger`) не используются. MTP-режим `dotnet test` включён через
[`global.json`](../../global.json) (секция `test.runner`). Покрытие кода даёт расширение MTP
`Microsoft.Testing.Extensions.CodeCoverage` (опции `--coverage`, `--coverage-output-format`);
TRX-отчёт встроен в xUnit v3 (`--report-xunit-trx`).

## Требования

- **.NET 10 SDK**. Больше ничего: ни SQL Server, ни запущенного API, ни браузеров.

## Быстрый старт

```bash
dotnet test --project src/AddressBook.Web.Tests
```

| Задача | Команда |
|---|---|
| Все тесты | `dotnet test --project src/AddressBook.Web.Tests` |
| Один класс | `dotnet test --project src/AddressBook.Web.Tests --filter-class "*ContactsListTests"` |
| Один метод | `dotnet test --project src/AddressBook.Web.Tests --filter-method "*ContactsListTests.Search_RequestsTermAndReloadsRows"` |
| Пространство имён | `dotnet test --project src/AddressBook.Web.Tests --filter-namespace "AddressBook.Web.Tests.Specs.Pages"` |
| Список тестов без запуска | `dotnet test --project src/AddressBook.Web.Tests --list-tests` |
| Сборка всего решения | `dotnet build src/AddressBook.slnx` |

Фильтры — это опции xUnit v3 для MTP (`--filter-class`, `--filter-method`, `--filter-trait`, …).
Сейчас в наборе нет тестов с trait, поэтому `--filter-trait` ничего не запустит (код выхода 8).
VSTest-опция `--filter` здесь не используется. Полный список: `dotnet test --project src/AddressBook.Web.Tests --help`.

## Архитектура

Всё общее лежит в `Infrastructure/` и `Data/`; тесты не повторяют эту обвязку.

| Тип | Назначение |
|---|---|
| `MudTestContext` | Базовый класс тестов: `AddMudServices()`, `JSInterop` в loose-режиме, `RenderProviders()` для popover/dialog-провайдеров (нужен перед оверлейными виджетами). |
| `MudBlazorJsInterop` | Заглушки JS-вызовов MudBlazor. |
| `ApiServiceMock` | Extension-методы для NSubstitute-мока `IAddressBookApiService`: настройка ответов (`ReturnsContacts`, …) и проверки `Received`/`DidNotReceive`. |
| `FakeHttpMessageHandler` | Управляемый `HttpMessageHandler` для тестов `AddressBookApiService` (без живого HTTP). |
| `TestCulture` | `[ModuleInitializer]`: фиксирует культуру en-US для всей тестовой сборки, чтобы форматы дат и чисел не зависели от региональных настроек машины. |
| `TestIds` | Константы `data-testid`; синхронизированы с `src/UiTests/src/utils/testids.ts`, рассинхрон ловит `TestIdsTests`. |
| `RenderedComponentExtensions` | Поиск по `data-testid` и `aria-label` (`FindByTestId`, `FindByAriaLabel`, …). |
| `ContactBuilder` | Тестовые данные на Bogus, включая граничные варианты. |
| Harnesses | `ContactFormHarness`, `ContactsTableHarness`, `DeleteDialogHarness`, `AppShellHarness` — обёртки над отрендеренными компонентами. |

## Структура

```
src/AddressBook.Web.Tests/
├── AddressBook.Web.Tests.csproj
├── GlobalUsings.cs
├── xunit.runner.json
├── packages.lock.json
├── Infrastructure/    MudTestContext, MudBlazorJsInterop, ApiServiceMock,
│                      FakeHttpMessageHandler, TestIds, RenderedComponentExtensions, TestCulture
├── Data/              ContactBuilder
├── Harnesses/         ContactFormHarness, ContactsTableHarness, DeleteDialogHarness, AppShellHarness
└── Specs/
    ├── Components/    CustomValidationSummaryTests
    ├── ErrorHandling/ ProblemDetailsExtensionsTests, ProblemDetailsHandlerTests
    ├── Layout/        MainLayoutTests, NavMenuTests, ErrorTests
    ├── Pages/         HomeTests, ContactsListTests, ContactsDeleteTests, ContactsErrorTests,
    │                  CreateContactTests, CreateContactServerErrorTests,
    │                  EditContactTests, EditContactServerErrorTests,
    │                  EditContactNotFoundTests, EditContactLoadTests
    ├── Services/      AddressBookApiServiceTests
    ├── Infrastructure/ самотесты инфраструктуры: MudTestContextTests, ApiServiceMockTests,
    │                  FakeHttpMessageHandlerTests, RenderedComponentExtensionsTests, TestIdsTests
    ├── Data/          самотест ContactBuilderTests
    └── Harnesses/     самотесты харнессов (по одному файлу на харнесс)
```

`Specs/Infrastructure/`, `Specs/Data/` и `Specs/Harnesses/` — тесты самой обвязки, а не `AddressBook.Web`.

## Конвенции

Конвенции (контекст, именование, данные, моки, харнессы, локаторы, ассерты, асинхронность) описаны в
[`bunit-conventions.instructions.md`](../../.github/instructions/bunit-conventions.instructions.md) —
единственном источнике правил для этого набора тестов.

Общие правила C# — [`csharp.instructions.md`](../../.github/instructions/csharp.instructions.md);
правила для агентов — [`CLAUDE.md`](CLAUDE.md).

## Отладка

- **IDE.** Test Explorer в Visual Studio/Rider запускает и отлаживает отдельный тест; проект — `Exe` на MTP.
- **Один тест из консоли.** `--filter-method` (см. таблицу выше).
- **Разметка.** Выведите `cut.Markup` или используйте `MarkupMatches`: при расхождении bUnit печатает diff.
- **JSInterop.** Если MudBlazor вызывает неизвестную JS-функцию, временно поставьте `JSInterop.Mode = JSRuntimeMode.Strict`:
  тест упадёт с именем вызова, и его можно добавить в `MudBlazorJsInterop`.
- **Диагностика раннера.** `--diagnostic` пишет лог MTP; каталог — `--diagnostic-output-directory`.

## CI

Workflow [`web-tests.yml`](../../.github/workflows/web-tests.yml) («Web Component Tests») запускается на каждый push и вручную
(`workflow_dispatch`). Ему нужен только .NET 10 SDK. Он выполняет те же шаги, что и локально:

```bash
dotnet restore src/AddressBook.Web.Tests --locked-mode
dotnet build src/AddressBook.Web.Tests -c Release --no-restore
dotnet test --project src/AddressBook.Web.Tests -c Release --no-build --results-directory TestResults -- --report-xunit-trx --coverage --coverage-output-format cobertura
```

Шаг `dorny/test-reporter` читает `.trx` и добавляет в Summary прогона отчёт «Web component test results»
с числом пройденных, упавших и пропущенных тестов и списком упавших.

Артефакт `web-tests-results` (хранится 30 дней, загружается и при падении тестов) содержит `.trx`-отчёт и
Cobertura-файл покрытия (`*.cobertura.xml`) из `TestResults/`. Тот же каталог создаётся локально и игнорируется git.

Покрытие workflow превращает в отчёт через [ReportGenerator](https://github.com/danielpalme/ReportGenerator) (только сборка
`AddressBook.Web`): markdown-сводка попадает в Job Summary прогона, а HTML-отчёт — в артефакт
`web-tests-coverage-report` (открыть `index.html`). Локально то же самое:

```bash
dotnet tool install --global dotnet-reportgenerator-globaltool --version 5.5.11
reportgenerator "-reports:TestResults/**/*.cobertura.xml" "-targetdir:coverage-report" "-reporttypes:HtmlInline_AzurePipelines" "-assemblyfilters:+AddressBook.Web"
```

## План

Полный дизайн, архитектурные решения и список задач —
[docs/tasks/blazor-component-tests-framework-plan.md](../../docs/tasks/blazor-component-tests-framework-plan.md).
