# План: Issue #152 — Blazor Tests B8: ErrorTests

> **Issue:** [#152](https://github.com/askrinnik/AddressBook2025/issues/152) — «Blazor Tests B8: ErrorTests» (Фаза 2)
> **Режим работы:** test-authoring — **production-код (`AddressBook.Web`) не трогаем**, новые `data-testid` не добавляем.

## 1. Требование

`Tests/Layout/ErrorTests.cs` — компонентные bUnit-тесты `Layout/Error.razor`: `ProcessError`/`ProcessProblem`
показывают баннер с текстом, `Clear()` его скрывает; пустое состояние баннера не рендерит.

## 2. Acceptance

- [x] Начальное состояние (`ErrorMessage` пуст): баннер не рендерится, `ChildContent` отрендерен.
- [x] `ProcessError("...")` показывает баннер (`alert-danger`, заголовок «Woops!») с переданным текстом; `ChildContent` остаётся на месте.
- [x] `ProcessError("")` (граница) — баннер не рендерится.
- [x] Повторный `ProcessError` заменяет текст предыдущего сообщения (баннер один).
- [x] `ProcessProblem(problem)` показывает баннер с `problem.Extensions`, сериализованными в indented JSON (ключи и значения видны в тексте).
- [x] `Clear()` скрывает баннер и сбрасывает `ErrorMessage`; вызов `Clear()` без баннера — безопасный no-op.
- [x] После `Clear()` новый `ProcessError` снова показывает баннер.
- [x] Только `MudTestContext` + bUnit `Find`/`FindAll` + xUnit `Assert`; без `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx` без новых предупреждений, `dotnet test --project src/AddressBook.Web.Tests` зелёный.

## 3. Затронутые файлы (только `src/AddressBook.Web.Tests`)

- `Tests/Layout/ErrorTests.cs` — новый.
- `docs/tasks/blazor-component-tests-framework-plan.md` — отметить B8 выполненным.

## 4. Подход

- `Error` рендерится через `Render<Error>` с `ChildContent`-маркером (`<p id="child">`); методы
  `ProcessError`/`ProcessProblem`/`Clear` зовутся через `cut.InvokeAsync`/`Invoke` (они вызывают
  `StateHasChanged` и должны идти в диспетчере рендерера).
- `Error` — разметка Bootstrap без `role`/`aria-label`/`data-testid`, а новые `data-testid` в Web не
  добавляем. Поэтому локаторы — CSS в крайнем случае: `div.alert.alert-danger` (баннер) и
  `pre.error-container` (текст). Селекторы — приватные константы в тесте.
- `ProblemDetails` строится как `ClientProblemDetails` с `Extensions` (например `errors` → вложенные поля);
  ассерты — по вхождению ключей/значений в текст `pre`, а не по точному форматированию JSON.
- Отдельный harness не нужен: компонент крошечный, один потребитель тестов.

## 5. Tests

Playwright API/UI не нужны — поведение API/UI не меняется; deliverable — сами bUnit-тесты. Кейсы:
- happy path: `ProcessError` → баннер; `ProcessProblem` → баннер с JSON; `Clear` → скрыт;
- границы: пустая строка, повторный `ProcessError` (замена), `Clear` без баннера, показ после `Clear`;
- негативные: начальное состояние — баннера нет.

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. Браузерный UI-walk
не применим (компонентные тесты в памяти).

## 7. Вне скоупа

- Тест каскадной передачи `Error` потомкам (`CascadingValue`) — фактически покрывается страничными
  тестами `ContactsErrorTests` (B12) и др.
- **Замечание для отдельного issue (не пиним в тестах):** `ProcessProblem(null)` или проблема с
  `Extensions == null` сериализуется в строку `"null"` — непустую, поэтому баннер показывает текст `null`.
  Если это нежелательно — завести bug-issue; в рамках B8 это поведение не фиксируем тестом.
- Остальные спеки Фазы 2 (B9–B17).
