# Issue #70 [ApiTests][T16] — `tests/contract/schema.spec.ts` (contract-тесты)

> **Режим:** test-authoring (метки `api`, `testing`). Всё поведение уже реализовано —
> продакшн-код не трогаем. Единственный артефакт: новый spec-файл с contract-тестами Playwright.

## Требование

Contract-тесты: валидировать ответы API против Zod-схем из `schemas/contact.schema.ts` (T4),
которые являются единым источником правды типов. Любое расхождение контракта (лишнее поле,
пропущенное поле, неверный тип, «утёкшие» phones/ownerId) → падение с понятным сообщением.

## Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | `GET` список → соответствует `getFilteredContactsResponseSchema` (строгая: ловит дрейф). |
| A2 | `GET` по id → соответствует `contactModelSchema` (строгая). |
| A3 | Ответ валидации `400` → соответствует `problemDetailsSchema` (RFC 7807). |
| A4 | Любое расхождение контракта приводит к падению с понятным сообщением (обеспечивает `expectMatchesSchema`, который печатает путь/ошибку/тело). |
| A5 | Схемы — единый источник правды; типы не дублируются (тесты импортируют `contactModelSchema` / `getFilteredContactsResponseSchema` / `problemDetailsSchema`, а не собственные типы). |
| A6 | Данные self-contained, очистка в teardown; контракт проверяется на **реально созданных** ресурсах. |

## Факты об API (основание для дизайна)

- `GET api/Contacts?search=` → `200` `{ totalRows:int, rows: ContactModel[] }`.
- `GET api/Contacts/{id:int}` → `200` `ContactModel { id, firstName, lastName, birthday: yyyy-MM-dd | null }`.
- `POST api/Contacts` → `201`, **тело пустое**, id в `Location` (не JSON-контракт тела).
- Валидация `400` → `application/problem+json`: `title="Validation Error"`, `status=400`,
  `detail="One or more validation errors occurred"`, `errors: { Property: [msgs] }`.
- `contactModelSchema`/`getFilteredContactsResponseSchema` — `.strict()` (ловят «утечки»
  phones/ownerId); `problemDetailsSchema` — нестрогая (ASP.NET добавляет `traceId` и пр.).

## Затрагиваемые файлы

- **Добавляется:** `src/ApiTests/tests/contract/schema.spec.ts` (новый каталог `tests/contract/`).
- **Обновляется:** `docs/tasks/api-tests-framework-plan.md` — отметить `T16` как `[x]`.
- Продакшн-код, схемы и инфраструктура тестов **не меняются** — переиспользуем `contactsClient`,
  `contactFactory`, `expectMatchesSchema` и существующие Zod-схемы.

## Переиспользуемая инфраструктура

- Фикстуры `src/fixtures/api.fixtures.ts`: `contactsClient` (авто-очистка), `contactFactory`.
- Схемы: `contactModelSchema`, `getFilteredContactsResponseSchema`, `problemDetailsSchema`.
- Ассерт: `expectMatchesSchema(body, schema)` — при расхождении печатает путь, сообщение и тело
  (это и есть «понятное сообщение» из A4). `StatusCodes` из `http-status-codes`.

## Tests — сценарии Playwright (`schema.spec.ts`)

**`Contract — GET /api/Contacts (list)` (A1)**
- создать контакт; `list()` → `200`; `expectMatchesSchema(body, getFilteredContactsResponseSchema)`;
  дополнительно `rows.length === totalRows` и созданный контакт присутствует в `rows`.

**`Contract — GET /api/Contacts/{id}` (A2)**
- контакт **с** birthday → `getById` → `200`; `expectMatchesSchema(body, contactModelSchema)`;
- контакт **без** birthday (`birthday: null`) → `getById` → `200`; схема валидна, `birthday === null`
  (подтверждает контракт nullable-даты).

**`Contract — validation 400 → problem-details` (A3)**
- невалидный `create` (пустой firstName) → `400`; `expectMatchesSchema(body, problemDetailsSchema)`;
- невалидный `update` существующего контакта (пустой lastName) → `400`;
  `expectMatchesSchema(body, problemDetailsSchema)`.

Каждый ассерт использует общий `expectMatchesSchema`, поэтому расхождение контракта даёт
детальное сообщение (путь + причина + тело), что закрывает A4. Типы берутся только из схем (A5).

## Изоляция и очистка

- Все контакты создаются в тесте через `contactsClient.create`; фикстура удаляет их в teardown (A6).
- Негативный `update` выполняется над реально созданным контактом (валидатор срабатывает раньше
  поиска, `400` не смешивается с `404`).

## Вне зоны действия

- Проверка бизнес-значений полей (это делают `create/get-by-id/update/delete` спеки) — здесь
  только **форма** контракта.
- Контракт пустого тела `201`/`204` и заголовка `Location` (косвенно покрыт в create/delete спеках).
- Изменение схем, продакшн-кода, клиента или фикстур.

## Верификация

- `run-api` (или reuse) → API на `http://localhost:5000`.
- `npx playwright test tests/contract/schema.spec.ts` — все кейсы зелёные.
- `npm run lint` в `src/ApiTests` — без новых замечаний.
- Каждый критерий A1–A6 закрыт минимум одним тестом с реальной проверкой схемы.
