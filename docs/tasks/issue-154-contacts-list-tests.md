# План: Issue #154 — Blazor Tests B10: ContactsListTests

> **Issue:** [#154](https://github.com/askrinnik/AddressBook2025/issues/154) — «Blazor Tests B10: ContactsListTests» (Фаза 2)
> **Режим работы:** test-authoring — **production-код (`AddressBook.Web`) не трогаем**, новые `data-testid` не добавляем.

## 1. Требование

`Tests/Pages/ContactsListTests.cs` — компонентные bUnit-тесты страницы `Pages/Contacts.razor` (список контактов):
рендер строк из мока, поиск, пустой результат, сортировка, rows-per-page.

## 2. Acceptance

- [x] Строки рендерятся из мока в порядке ответа; имя, фамилия и дата рождения отображаются; отсутствующий Birthday — пустая ячейка.
- [x] Поиск вызывает `GetFilteredContactsAsync` с введённым термином и перезагружает таблицу (строки заменяются).
- [x] Очистка поиска перезагружает таблицу с пустым термином.
- [x] Пустой результат (в т.ч. поиска) показывает «No matching records found».
- [x] Сортировка по First Name / Last Name / Birthday: первый клик — по возрастанию, второй — по убыванию.
- [x] Смена rows-per-page: по умолчанию 10 строк на странице; после выбора 25 видны все строки.
- [x] Только `MudTestContext` + `ContactsTableHarness` + xUnit `Assert`; без `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx` без новых предупреждений, `dotnet test --project src/AddressBook.Web.Tests` зелёный.

## 3. Затронутые файлы

- `src/AddressBook.Web.Tests/Tests/Pages/ContactsListTests.cs` — новый.
- `docs/tasks/blazor-component-tests-framework-plan.md` — отметить B10 выполненным.

## 4. Подход

`ContactsTableHarness.Render(this).WaitForLoaded()`; данные — `ContactBuilder.Existing`; мок — `ApiServiceMock`.
Сортировка и страницы выполняются на клиенте в `ServerReload`, поэтому проверяется порядок/число `RowIds`.

## 5. Tests

Playwright API/UI не нужны — поведение не меняется; deliverable — bUnit-тесты (см. Acceptance).

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. Браузерный UI-walk не применим.

## 7. Вне скоупа

Удаление (B11), ошибки загрузки (B12), навигация create/edit (покрыта harness-тестами), остальные спеки B13–B17.
