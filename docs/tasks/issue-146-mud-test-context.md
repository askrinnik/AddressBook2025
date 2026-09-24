# План: Issue #146 — Blazor Tests B2: Базовый `MudTestContext` + заглушки JSInterop

> **Issue:** [#146](https://github.com/askrinnik/AddressBook2025/issues/146) — «Blazor Tests B2: Базовый MudTestContext + заглушки JSInterop» (Фаза 0)
> **Режим работы:** test-authoring / инфраструктура — **production-код не трогаем**; предшественник B1 ([#145](https://github.com/askrinnik/AddressBook2025/issues/145)) уже наскаффолдил проект `src/AddressBook.Web.Tests` и влит в `main`.
> **Авторитетный дизайн:** [`docs/tasks/blazor-component-tests-framework-plan.md`](blazor-component-tests-framework-plan.md) (раздел B2).

## 1. Требование

Заложить базовую инфраструктуру рендеринга MudBlazor-компонентов в bUnit, чтобы все последующие
задачи (B3–B17) наследовали её и не повторяли boilerplate:

- `Infrastructure/MudTestContext.cs` — базовый bUnit-контекст: `AddMudServices()`, `JSInterop` в
  loose-режиме, отрендеренные провайдеры (`MudPopoverProvider` / `MudDialogProvider`), подмена
  `IAddressBookApiService` через NSubstitute.
- `Infrastructure/MudBlazorJsInterop.cs` — явные заглушки JS-вызовов MudBlazor
  (popover / keyinterceptor / scroll-manager / resize-listener).
- **Sanity-тест:** тривиальный MudBlazor-компонент рендерится **без исключений на JSInterop**.

## 2. Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | Существует базовый класс `MudTestContext : Bunit.BunitContext` в `Infrastructure/`; он вызывает `Services.AddMudServices()`. |
| A2 | В базовом классе `JSInterop.Mode = JSRuntimeMode.Loose`. |
| A3 | Базовый класс регистрирует/рендерит провайдеры `MudPopoverProvider` и `MudDialogProvider` (в том же наборе сервисов, что и компонент-под-тестом). |
| A4 | Базовый класс подменяет `IAddressBookApiService` (NSubstitute) и регистрирует мок в `Services`; мок доступен наследникам (напр. свойство `ApiService`). |
| A5 | Есть `MudBlazorJsInterop.cs` с явными заглушками известных JS-вызовов MudBlazor (popover/keyinterceptor/scroll/resize), подключаемыми из `MudTestContext`. |
| A6 | Sanity-тест наследуется от `MudTestContext`, рендерит тривиальный MudBlazor-компонент и проходит без исключений (в т.ч. без ошибок JSInterop); ассерт проверяет наличие ожидаемой разметки. |
| A7 | `dotnet build src/AddressBook.slnx` — без новых ошибок/предупреждений; `dotnet test src/AddressBook.Web.Tests` — зелёный. |

## 3. Затрагиваемые файлы (только `src/AddressBook.Web.Tests`)

| Файл | Действие |
|------|----------|
| `Infrastructure/MudTestContext.cs` | **создать** — базовый `BunitContext` |
| `Infrastructure/MudBlazorJsInterop.cs` | **создать** — extension-заглушки JS |
| `Tests/Infrastructure/MudTestContextTests.cs` | **создать** — sanity-тест |
| `GlobalUsings.cs` | **обновить** — добавить `AddressBook.Web`, `AddressBook.Web.Tests.Infrastructure`, `MudBlazor` |

Production-проекты (`AddressBook.Web`, `AddressBook.Api`, `AddressBook.Contracts`) и другие
тест-проекты (`src/ApiTests`, `src/UiTests`) **не трогаем**. Новые `data-testid` в Web не добавляем
(их порт — отдельная задача B3).

## 4. Подход (реализация)

Порядок: инфраструктура → sanity-тест → сборка → верификация.

### 4.1 `Infrastructure/MudBlazorJsInterop.cs`
Extension-метод над `Bunit.BunitJSInterop`, который в loose-режиме явно объявляет известные
void-вызовы MudBlazor, чтобы намерение было задокументировано и связка не ломалась при переходе на
strict-режим в будущем:
- `mudPopover.*` (`connect`, `disconnect`, `initialize`, `dispose`),
- `mudKeyInterceptor.*` (`connect`, `updatekey`, `disconnect`),
- `mudScrollManager.*`, `mudScrollListener.*`, `mudResizeListener.*` / `mudResizeObserver.*`,
- `mudElementRef.*` (в т.ч. `focus`/`saveFocus`/`restoreFocus`).

Реализация опирается на loose-режим как основной механизм (неописанные вызовы возвращают default),
а перечисленные setup'ы делают контракт явным.

### 4.2 `Infrastructure/MudTestContext.cs`
```
public abstract class MudTestContext : Bunit.BunitContext
{
    protected IAddressBookApiService ApiService { get; }

    protected MudTestContext()
    {
        JSInterop.Mode = JSRuntimeMode.Loose;
        JSInterop.SetupMudBlazorJsInterop();           // из MudBlazorJsInterop.cs
        Services.AddMudServices();                     // как в Web/Program.cs
        ApiService = Substitute.For<IAddressBookApiService>();
        Services.AddSingleton(ApiService);
        // провайдеры доступны наследникам (см. ниже)
    }
}
```
- **Провайдеры (A3):** bUnit рендерит один корневой компонент, но overlay-виджеты
  (`MudMessageBox`, `MudDatePicker`, выпадашка `MudSelect`) публикуют содержимое в провайдер через
  общий сервис из `Services`. Поэтому провайдеры рендерятся отдельными компонентами в том же
  контексте — предоставим защищённый хелпер `RenderProviders()` (рендерит `MudPopoverProvider` и
  `MudDialogProvider`), который наследники с overlay-логикой (B11 и т.п.) вызывают до рендера
  компонента-под-тестом. Провайдеры реагируют на popup'ы благодаря общему singletone-сервису.
  Для sanity-теста overlay не нужен, но хелпер и его безошибочный рендер провайдеров проверяются.
  (Финальная форма — метод-хелпер vs. авто-рендер в конструкторе — уточняется при реализации; на
  критерии A3 это не влияет.)

### 4.3 `Tests/Infrastructure/MudTestContextTests.cs`
```
public class MudTestContextTests : MudTestContext
{
    [Fact]
    public void MudComponent_Renders_WithoutJsInteropExceptions()
    {
        var cut = RenderComponent<MudButton>(p => p.AddChildContent("Ping"));
        Assert.Contains("Ping", cut.Markup);
    }

    [Fact]
    public void Providers_Render_WithoutExceptions() { /* RenderProviders(); ассерт разметки */ }
}
```

## 5. Тесты

Это инфраструктурная задача: **тесты и есть deliverable**, но покрытие узкое по замыслу B2 —
только sanity рендеринга. Полноценные тесты компонентов/страниц идут в B7–B17 и опираются на этот
базовый класс.

- `MudComponent_Renders_WithoutJsInteropExceptions` — тривиальный MudBlazor-компонент рендерится, в
  разметке присутствует контент, исключений (в т.ч. JSInterop) нет. **Это прямой критерий A6.**
- `Providers_Render_WithoutExceptions` — провайдеры MudBlazor рендерятся в контексте без исключений
  (проверка A3/A5).

Playwright API-тесты (`src/ApiTests`) не добавляются: изменений API нет.

## 6. Вне области видимости / follow-up

- `TestIds.cs`, `ApiServiceMock`, `FakeHttpMessageHandler`, `ContactBuilder`, harness-обёртки —
  задачи B3–B6.
- Тесты конкретных страниц/компонентов и сервиса — B7–B17.
- README/CLAUDE/CI/инструкции — B18–B21.

## 7. Верификация

1. `dotnet build src/AddressBook.slnx` — зелёная сборка решения (включая тест-проект).
2. `dotnet test src/AddressBook.Web.Tests` — sanity-тест(ы) проходят, без SQL Server / API / браузера.

> **⚠️ Ограничение окружения (важно для планирования):** в текущем cloud-контейнере **не установлен
> .NET 10 SDK**, а сетевая политика окружения запрещает CDN Microsoft
> (`builds.dotnet.microsoft.com`), поэтому SDK нельзя скачать/установить в этой сессии. Код и тесты
> я написать могу, но выполнить `dotnet build` / `dotnet test` (шаг 7 и критерий A7/A6) в этой
> сессии — **нет**, пока доступ не будет открыт. Варианты решения в сообщении к ревью.
