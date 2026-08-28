# CLAUDE.md — `src/AddressBook.Web.Tests`

Компонентные (bUnit) тесты для `AddressBook.Web` (Blazor WASM + MudBlazor) на **bUnit + xUnit v3**.
Рендер компонентов в памяти, без браузера; `IAddressBookApiService`, `NavigationManager` и JSInterop
подменяются. Отличается от `src/UiTests` (браузерный E2E) и `src/ApiTests` (HTTP).

Полный дизайн и список задач:
[`docs/tasks/blazor-component-tests-framework-plan.md`](../../docs/tasks/blazor-component-tests-framework-plan.md).

Non-negotiables при добавлении/изменении тестов здесь:

- Наследуйте тесты от базового `MudTestContext` (после B2) — он делает `AddMudServices()`, ставит
  `JSInterop` в loose-режим и рендерит провайдеры; не повторяйте этот boilerplate в каждом тесте.
- Данные — только через `ContactBuilder` (Bogus); без per-test билдеров.
- Сервис мокается через NSubstitute; для тестов самого `AddressBookApiService` — управляемый
  `FakeHttpMessageHandler`, а не живой HTTP.
- Ассерты только bUnit (`Find`/`FindAll`/`MarkupMatches`) + xUnit `Assert`. Сторонние
  assertion-библиотеки не подключаем (FluentAssertions v8 платная).
- Асинхронный рендер — через `cut.WaitForState`/`WaitForAssertion`, никаких `Task.Delay`/`Sleep`.
- Локаторы: роль/`aria-label` → `data-testid` (константы в `Infrastructure/TestIds.cs`) → CSS в
  крайнем случае. Новые `data-testid` в Web-проект не добавляем.
- Русскоязычные комментарии допустимы — держите язык соседних комментариев.
