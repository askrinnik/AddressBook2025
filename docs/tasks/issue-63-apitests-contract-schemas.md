# Issue #63 — [ApiTests][T4] `schemas/contact.schema.ts` — zod-контракты

> **Режим:** test-authoring / инфраструктура фреймворка (метки `api`, `testing`).
> Production-код `AddressBook.Api` / `AddressBook.Web` **не трогаем**.
> **Родительский план:** [docs/tasks/api-tests-framework-plan.md](api-tests-framework-plan.md) — задача **T4**.
> **Зависит от:** T2 (`zod` в `main`). Не зависит от T3.

## 1. Требование

Описать zod-схемы ответов `AddressBook.Api` как единый источник контракта и TypeScript-типов:
`ContactModel`, ответ списка контактов и RFC 7807 `ProblemDetails`. Из схем выводятся типы
(`z.infer`), которые далее переиспользуют клиенты (T5), фикстуры/фабрики (T7–T8) и
contract-тесты (T16).

## 2. Факты об API (проверено по коду и текущим AutoTests)

- Регистр JSON — **camelCase** (подтверждено использованием в `src/AutoTests`):
  - `ContactModel`: `{ id: number, firstName: string, lastName: string, birthday: "yyyy-MM-dd" | null }`
    (C# `record ContactModel(int Id, string FirstName, string LastName, DateOnly? Birthday)`).
  - Список: `{ totalRows: number, rows: ContactModel[] }`
    (C# `GetFilteredContactsResponse(int TotalRows, IReadOnlyCollection<ContactModel> Rows)`).
- `ProblemDetails` (RFC 7807, `application/problem+json`), поля в lowercase:
  `type?`, `title?`, `status?`, `detail?`, `instance?`, `errors?`. Для валидации `errors` —
  карта `{ [field: string]: string[] }`. ASP.NET добавляет расширения (например `traceId`),
  поэтому схема ProblemDetails **не строгая** (допускает доп. поля).

## 3. Критерии приёмки

| # | Критерий | Как проверяется |
|---|----------|-----------------|
| A1 | Схемы соответствуют реальным ответам API | Поднять API, `GET /api/Contacts` и `GET /api/Contacts/1` → `parse` проходит; невалидный `POST` → ответ проходит `ProblemDetailsSchema`. |
| A2 | Экспортируются выведенные типы | `ContactModel`, `GetFilteredContactsResponse`, `ProblemDetails` через `z.infer`; `tsc --noEmit` чисто. |
| A3 | Типы переиспользуемы | Экспорт схем и типов из одного модуля; именование согласовано с планом. |
| A4 | lint + типы чистые | `eslint .` и `tsc --noEmit` без ошибок. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/src/schemas/contact.schema.ts` | **Новый** — zod-схемы + выведенные типы. |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T4** как выполненную (`[x]`). |

## 5. Подход

1. **`contact.schema.ts`:**
   - `contactModelSchema` = `z.object({ id, firstName, lastName, birthday })`:
     - `id`: `z.number().int()`.
     - `firstName`/`lastName`: `z.string()`.
     - `birthday`: `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()`.
     - `.strict()` — контракт-тест обязан ловить дрейф (лишние поля вроде телефонов/OwnerId).
   - `getFilteredContactsResponseSchema` = `z.object({ totalRows: z.number().int(), rows: z.array(contactModelSchema) }).strict()`.
   - `problemDetailsSchema` = `z.object({ type?, title?, status?, detail?, instance?, errors? })`
     **без** `.strict()` (RFC 7807 допускает расширения; ASP.NET добавляет `traceId`).
     `errors`: `z.record(z.string(), z.array(z.string())).optional()`.
   - Экспорт типов: `export type ContactModel = z.infer<typeof contactModelSchema>` и т.д.
2. **Верификация против живого API** (см. критерий A1).

### Решения

- **`.strict()` для Contact/List, но не для ProblemDetails.** Строгость на моделях даёт ценность
  contract-тестам (T16) — падаем при добавлении незадекларированного поля. ProblemDetails должен
  быть терпимым, т.к. RFC 7807 и ASP.NET кладут доп. члены (`traceId`).
- **`birthday` как строка-regex, а не `z.string().date()`** — явный формат `yyyy-MM-dd`,
  не зависящий от версии zod, читаемое сообщение.

## 6. Tests (Playwright E2E)

Отдельных спеков в T4 **нет** — это модуль контракта без собственного API-поведения. Его
корректность подтверждается компиляцией типов и проверкой `parse` против живых ответов API
(критерий A1). Полное использование схем во всех ответах — задача **T16** (`contract/schema.spec.ts`).

## 7. Вне объёма

- `models/problem-details.ts` — хелпер RFC7807 (`messagesFor`/`messages`/`hasErrors`) — **T6**.
- Клиенты (`base-api-client.ts`, `contacts-client.ts`) — **T5**.
- Сами contract-тесты — **T16**.

## 8. Верификация

1. `npx tsc --noEmit` — без ошибок типов.
2. `npm run lint` — без ошибок.
3. Поднять API (`dotnet run --project src/AddressBook.Api`) и точечно прогнать `parse`:
   - `GET /api/Contacts` → `getFilteredContactsResponseSchema.parse(body)` ок.
   - `GET /api/Contacts/1` → `contactModelSchema.parse(body)` ок.
   - невалидный `POST /api/Contacts` → `problemDetailsSchema.parse(body)` ок.
