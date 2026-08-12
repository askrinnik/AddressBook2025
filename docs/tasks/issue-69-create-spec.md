# Issue #69 — [ApiTests][T12] `tests/contacts/create.spec.ts`

> **Режим:** test-authoring (метки `api`, `testing`). Production-код не трогаем.
> **Файл-результат:** `src/ApiTests/tests/contacts/create.spec.ts`

## 1. Требование

Покрыть `POST api/Contacts` E2E-тестами на Playwright: позитив, негатив, границы длины
и известный баг-кандидат с пробелами. Все негативы проверяют структуру RFC 7807
problem-details. Создаваемые контакты удаляются в teardown (через фикстуру).

## 2. Факты API (проверено в коде)

- `POST api/Contacts` (`CreateContactCommand { firstName, lastName, birthday? }`)
  → `201` с **пустым телом**, id только в заголовке `Location` (`/api/Contacts/{id}`) | `400`.
- Валидация (`CreateContactCommandValidator`, FluentValidation):
  - `FirstName`: `NotEmpty` + `MaximumLength(30)`
  - `LastName`: `NotEmpty` + `MaximumLength(30)`
  - `Birthday`: если задан → `<= сегодня`, сообщение `"Birthday cannot be in the future"`
- Trim в `CreateContactCommandHandler` **после** валидации (`request.FirstName.Trim()`).
  Проверено фактически: `"   "` (только пробелы) **отклоняется** с `400` — `NotEmpty()` во
  FluentValidation считает строку из пробелов пустой, поэтому до Trim дело не доходит.
  Премиса плана о «баге» не подтвердилась: поведение корректное, дефекта нет.
- Problem-details при `400` (`GlobalExceptionHandler`): `title="Validation Error"`,
  `status=400`, `detail="One or more validation errors occurred"`,
  `errors: { FirstName|LastName|Birthday: [messages] }`.

## 3. Переиспользуемая инфраструктура (уже готова)

- `fixtures/api.fixtures.ts` — `contactsClient` (авто-регистрация созданных id + teardown),
  `contactFactory`.
- `data/contact.factory.ts` — готовые билдеры: `validContact`, `validContactWithoutBirthday`,
  `firstName30Chars`/`firstName31Chars`, `lastName30Chars`/`lastName31Chars`,
  `emptyFirstName`/`emptyLastName`, `whitespaceFirstName`/`whitespaceLastName`,
  `birthdayInFuture`, `birthdayToday`.
- `clients/contacts-client.ts` — `create` возвращает `{ status, headers, body, id }` (id из `Location`).
- `utils/assertions.ts` — `expectMatchesSchema`, `expectProblemDetails({ status, title, detail, property, message })`.
- `schemas/contact.schema.ts` — `contactModelSchema`, `problemDetailsSchema`.

Новые абстракции не создаём.

## 4. Подход

Один файл `tests/contacts/create.spec.ts`, `test.describe('POST /api/Contacts')`,
фикстуры `contactsClient` + `contactFactory`. Позитив подтверждается чтением через
`getById` и валидацией схемой; негатив — через `expectProblemDetails`. Изоляция:
Create → Verify (→ auto-Delete в teardown фикстуры).

## 5. Tests — сценарии

Happy path:
1. **Валидный с birthday** → `201`, `id > 0` из `Location`; `getById` → поля совпадают
   (`firstName`, `lastName`, `birthday`), тело валидно по `contactModelSchema`.
2. **Валидный без birthday** → `201`; `getById` → `birthday === null`.
3. **Дата «сегодня»** → `201`; `getById` → `birthday` равен сегодняшней дате.

Границы:
4. **firstName ровно 30 символов** → `201`; чтением подтверждаем длину 30.
5. **lastName ровно 30 символов** → `201`.
6. **firstName 31 символ** → `400`, problem-details, `property = FirstName`.
7. **lastName 31 символ** → `400`, problem-details, `property = LastName`.

Негативы (пустые):
8. **Пустой firstName** → `400`, `title="Validation Error"`,
   `detail="One or more validation errors occurred"`, `property = FirstName`.
9. **Пустой lastName** → `400`, `property = LastName`.

Дата:
10. **Будущая дата (завтра)** → `400`, `property = Birthday`,
    `message` содержит `Birthday cannot be in the future`.

Пробелы (плановый «баг-кандидат» не подтвердился — поведение корректное):
11. **firstName `"   "`** → `400`, problem-details, `property = FirstName`
    (`NotEmpty` отклоняет строку из пробелов). Комментарий фиксирует, что премиса
    плана о баге не подтвердилась.
12. **lastName `"   "`** → аналогично `400`, `property = LastName`.

## 6. Критерии приёмки

| # | Критерий | Проверка |
|---|----------|----------|
| 1 | Валидный с birthday → 201, id из Location, чтение подтверждает поля | тест 1 |
| 2 | Валидный без birthday → 201, `birthday === null` | тест 2 |
| 3 | Имя/фамилия 30 символов → 201 | тесты 4, 5 |
| 4 | Имя/фамилия 31 символ → 400 | тесты 6, 7 |
| 5 | Пустые имя/фамилия → 400 с корректным problem-details | тесты 8, 9 |
| 6 | `"   "` → зафиксировано фактическое поведение (400, корректно отклонено) | тесты 11, 12 |
| 7 | Будущая дата → 400, `messagesFor('Birthday')` содержит нужное сообщение | тест 10 |
| 8 | Дата «сегодня» → 201 | тест 3 |
| 9 | Все созданные контакты удаляются в teardown | фикстура (авто-cleanup) |
| 10 | Негативы проверяют структуру problem-details | `expectProblemDetails` в тестах 6–10 |

## 7. Out of scope

- Производственный код (не меняем; поведение с пробелами оказалось корректным).
- PUT/DELETE/GET (свои задачи T11/T13/T14).
- Отдельный defect-issue не требуется: поведение с пробелами корректное (`400`).

## 8. Верификация

- `dotnet build src/AddressBook.sln`.
- Поднять API (`run-api`) и прогнать спеку (`run-tests`): все кейсы зелёные и реально
  проверяют поведение.
- По завершении отметить **T12** как `[x]` в `docs/tasks/api-tests-framework-plan.md`.
