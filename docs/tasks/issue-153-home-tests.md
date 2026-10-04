# План: Issue #153 — Blazor Tests B9: HomeTests

> **Issue:** [#153](https://github.com/askrinnik/AddressBook2025/issues/153) — «Blazor Tests B9: HomeTests» (Фаза 2)
> **Режим работы:** test-authoring — **production-код (`AddressBook.Web`) не трогаем**, новые `data-testid` не добавляем.

## 1. Требование

`Tests/Pages/HomeTests.cs` — компонентные bUnit-тесты `Pages/Home.razor`: статический контент и `PageTitle`.

## 2. Acceptance

- [ ] Рендерится заголовок `<h1>` «Contacts application».
- [ ] Рендерится приветственный текст «Welcome to your Contacts app.».
- [ ] `PageTitle` устанавливает заголовок документа «Home» (через `HeadOutlet`).
- [ ] Компонент не вызывает `IAddressBookApiService` (статическая страница).
- [ ] Только `MudTestContext` + bUnit `Find` + xUnit `Assert`; без `Task.Delay`/`Sleep`.
- [ ] `dotnet build src/AddressBook.slnx` без новых предупреждений, `dotnet test --project src/AddressBook.Web.Tests` зелёный.

## 3. Затронутые файлы

- `src/AddressBook.Web.Tests/Tests/Pages/HomeTests.cs` — новый.
- `docs/tasks/blazor-component-tests-framework-plan.md` — отметить B9 выполненным.

## 4. Подход

`Render<Home>()`; локаторы — `h1` (роль), текст страницы через `TextContent`. `PageTitle` проверяется
рендером `HeadOutlet` и поиском `<title>`.

## 5. Tests

Playwright API/UI не нужны — поведение не меняется; deliverable — bUnit-тесты: заголовок, приветствие,
`PageTitle`, отсутствие вызовов API.

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. Браузерный UI-walk не применим.

## 7. Вне скоупа

Остальные спеки Фазы 2 (B10–B17).
