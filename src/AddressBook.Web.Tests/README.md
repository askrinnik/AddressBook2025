# AddressBook Web Component Tests (`src/AddressBook.Web.Tests`)

Компонентные/страничные автотесты для `AddressBook.Web` (Blazor WebAssembly + MudBlazor) на
**bUnit + xUnit v3**. Рендерят реальные Blazor-компоненты **в памяти, без браузера**; API, HTTP и
БД замоканы (NSubstitute + управляемый `HttpMessageHandler`). Тесты быстрые, детерминированные,
гоняются одним `dotnet test` без внешних зависимостей.

> Существующие наборы `src/ApiTests` и `src/UiTests` (Playwright/TypeScript) не затрагиваются —
> это независимый, заново спроектированный слой пирамиды.

## Стек

`bunit` 2.9.0 · `xunit.v3` 4.0.0 · `NSubstitute` 6.2.0 · `Bogus` 35.6.5. Ассерты — только
семантические bUnit (`Find`/`MarkupMatches`) + xUnit `Assert` (без FluentAssertions).

xUnit v3 работает нативно на **Microsoft.Testing.Platform (MTP)**: на .NET 10 SDK классический
VSTest-путь удалён, поэтому VSTest-пакеты (`Microsoft.NET.Test.Sdk`, `xunit.runner.visualstudio`,
`coverlet.collector`, `*TestLogger`) не используются. MTP-режим `dotnet test` включён через
[`global.json`](../../global.json) (секция `test.runner`). MTP-расширения для покрытия и
CI-репорта добавит задача B20.

## Требования

- **.NET 10 SDK**. Больше ничего: ни SQL Server, ни запущенного API, ни браузеров.

## Быстрый старт

```bash
dotnet test src/AddressBook.Web.Tests
```

Или в составе решения:

```bash
dotnet build src/AddressBook.sln
```

## Структура (по мере реализации)

- `Infrastructure/` — базовый `MudTestContext`, заглушки MudBlazor JSInterop, `TestIds`, моки сервиса.
- `Data/` — `ContactBuilder` на Bogus (+ граничные варианты).
- `Harnesses/` — обёртки над отрендеренными компонентами (форма, таблица, диалог, оболочка).
- `Tests/` — тесты `Layout/`, `Pages/`, `Components/`, `Services/`.

## План

Полный дизайн, архитектурные решения и список задач (B1–B21) —
[docs/tasks/blazor-component-tests-framework-plan.md](../../docs/tasks/blazor-component-tests-framework-plan.md).
