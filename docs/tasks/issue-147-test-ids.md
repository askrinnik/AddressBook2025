# План: Issue #147 — Blazor Tests B3: `TestIds.cs` — константы data-testid

> **Issue:** [#147](https://github.com/askrinnik/AddressBook2025/issues/147) — «Blazor Tests B3: TestIds.cs — константы data-testid» (Фаза 1)
> **Режим работы:** test-authoring / инфраструктура — **production-код не трогаем**; B1/B2 ([#145](https://github.com/askrinnik/AddressBook2025/issues/145), [#146](https://github.com/askrinnik/AddressBook2025/issues/146)) уже в `main`.
> **Авторитетный дизайн:** [`docs/tasks/blazor-component-tests-framework-plan.md`](blazor-component-tests-framework-plan.md) (раздел B3).

## 1. Требование

Добавить `Infrastructure/TestIds.cs` в `src/AddressBook.Web.Tests` — порт
[`src/UiTests/src/utils/testids.ts`](../../src/UiTests/src/utils/testids.ts): единый источник
`data-testid`-селекторов для bUnit-поиска (`cut.Find(...)`). Новые `data-testid` в Web **не
добавляем** — константы зеркалят то, что уже есть в разметке.

## 2. Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | `Infrastructure/TestIds.cs` содержит все константы из `testids.ts` с теми же значениями: `app-drawer-toggle`, `app-theme-toggle`, `nav-home`, `nav-contacts`, `contacts-create`, `contacts-search`, `contacts-table`, `contact-delete-confirm`, `contact-form-first-name/last-name/birthday/submit/cancel`. |
| A2 | Есть хелперы для id-суффиксных контролов строки: `ContactRow(id)`, `ContactEditButton(id)`, `ContactDeleteButton(id)` → `contact-row-{id}` / `contact-edit-{id}` / `contact-delete-{id}`. |
| A3 | Есть хелпер, строящий CSS-селектор по testid (`[data-testid="..."]`) для `cut.Find(...)`, чтобы спеки не собирали строку вручную. |
| A4 | Значения не расходятся с разметкой Web: тест сверяет каждую константу с литералами `data-testid` в `.razor`-файлах (и наоборот — нет «осиротевших» литералов в разметке без константы). |
| A5 | Хотя бы одна константа проверена на реальном рендере компонента (`NavMenu` по `nav-home`/`nav-contacts`). |
| A6 | `dotnet build src/AddressBook.slnx` — без новых предупреждений; `dotnet test src/AddressBook.Web.Tests` — зелёный. |

## 3. Затрагиваемые файлы (только `src/AddressBook.Web.Tests`)

| Файл | Действие |
|------|----------|
| `Infrastructure/TestIds.cs` | **создать** — `static class TestIds` (`const string` + хелперы) |
| `Tests/Infrastructure/TestIdsTests.cs` | **создать** — тесты хелперов, дрейфа с разметкой, рендера `NavMenu` |
| `docs/tasks/issue-147-test-ids.md` | этот план |

`GlobalUsings.cs` уже содержит `AddressBook.Web.Tests.Infrastructure`. Production-проекты и
`src/ApiTests`/`src/UiTests` не трогаем.

## 4. Подход

1. **`TestIds`** — `public static class` с `public const string` (PascalCase, значения 1:1 с
   `testids.ts`; группы и комментарии как в оригинале) + статические методы `ContactRow`,
   `ContactEditButton`, `ContactDeleteButton` (принимают `int id` — тип `ContactModel.Id`; строковые id в
   bUnit-тестах не нужны) и `Selector(string testId)` → `[data-testid="{testId}"]`.
2. **Тесты (`TestIdsTests`, наследник `MudTestContext` только там, где нужен рендер):**
   - хелперы возвращают ожидаемые строки, `Selector` оборачивает значение;
   - **drift-тест:** найти `src/AddressBook.Web` подъёмом от `AppContext.BaseDirectory`, регулярно
     собрать литералы `data-testid="..."` из `*.razor`; динамические (`contact-row-{context.Id}`)
     приводятся к префиксу `contact-row-`. Проверить: множество статических литералов ==
     множество `const`-значений `TestIds` (reflection), а динамические префиксы совпадают с
     префиксами хелперов;
   - **render-тест:** `Render<NavMenu>()` → `Find(TestIds.Selector(TestIds.NavHome))` и
     `NavContacts` находятся.
3. Сборка и прогон тестов.

## 5. Tests

Playwright API/UI тесты **не нужны**: поведение API/UI не меняется (только .NET-инфраструктура
bUnit). Покрытие — тесты из п. 4.2 в `src/AddressBook.Web.Tests`.

## 6. Верификация

- `dotnet build src/AddressBook.slnx` — 0 предупреждений/ошибок.
- `dotnet test src/AddressBook.Web.Tests` — зелёный, офлайн.
- Браузерный UI-walk и Playwright не применимы (test-authoring/infra mode).

## 7. Вне скоупа

- Harness-обёртки, использующие `TestIds` (B6), `ApiServiceMock`/`FakeHttpMessageHandler` (B4),
  `ContactBuilder` (B5).
- Добавление новых `data-testid` в разметку Web.
- Автогенерация констант из разметки / общий источник с `testids.ts` (ручная синхронизация, как и в UiTests).
