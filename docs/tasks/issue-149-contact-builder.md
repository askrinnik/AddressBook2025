# План: Issue #149 — Blazor Tests B5: `ContactBuilder` на Bogus

> **Issue:** [#149](https://github.com/askrinnik/AddressBook2025/issues/149) — «Blazor Tests B5: ContactBuilder на Bogus» (Фаза 1)
> **Режим работы:** test-authoring / инфраструктура — **production-код не трогаем**.

## 1. Требование

`Data/ContactBuilder.cs` — Bogus-билдеры `ContactModel` / `CreateContactModel` + именованные граничные
варианты (валидный, с/без birthday, длина 30/31, пробелы, будущая дата). Порт идеи `contact.factory.ts`.

## 2. Acceptance

- [ ] `ContactBuilder.New` строит `CreateContactModel` (форма create/edit), `ContactBuilder.Existing` — `ContactModel` (строка списка / ответ API).
- [ ] Именованные варианты в обоих: `Valid`, `WithoutBirthday`, `FirstName30/31Chars`, `LastName30/31Chars`, `EmptyFirst/LastName`, `WhitespaceFirst/LastName`, `BirthdayInFuture`, `BirthdayToday`.
- [ ] Длины 30/31 совпадают с `MaximumLength(30)` валидаторов API; валидный контакт всегда в пределах правил (имена ≤ 30, непустые, birthday строго в прошлом).
- [ ] `Existing.*` принимает опциональный `id` (по умолчанию уникальный, потокобезопасный счётчик); `Existing.List(count)` — список с уникальными id.
- [ ] Потокобезопасность при параллельном запуске xUnit (новый `Faker` на вызов).
- [ ] Тесты билдера; `dotnet build src/AddressBook.slnx` без предупреждений, `dotnet test` зелёный.

## 3. Затронутые файлы (только `src/AddressBook.Web.Tests`)

- `Data/ContactBuilder.cs` — `public static class`, вложенные `New` и `Existing`.
- `Tests/Data/ContactBuilderTests.cs`.
- `GlobalUsings.cs` — `global using AddressBook.Web.Tests.Data;`.

## 4. Подход

Один источник правды — приватная генерация `CreateContactModel` (Bogus); `Existing.*` = маппинг
результата `New.*` в `ContactModel` (`DateTime → DateOnly`) с id. Имена усечены до 30; «N символов»
собираются из случайных букв Bogus.

## 5. Tests

Playwright API/UI не нужны — поведение API/UI не меняется. xUnit-тесты билдера (границы, инварианты, id).

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. Браузерный UI-walk не применим.

## 7. Вне скоупа

Harness-обёртки (B6), использование билдера в тестах страниц (Фаза 2).
