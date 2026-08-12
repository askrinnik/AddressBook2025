# Issue #68 [ApiTests][T14] — `tests/contacts/delete.spec.ts` (DELETE)

> **Режим:** test-authoring (метки `api`, `testing`). Поведение `DELETE` уже реализовано —
> продакшн-код не трогаем. Единственный артефакт: новый spec-файл с E2E-тестами Playwright.

## Требование

Покрыть эндпоинт `DELETE api/Contacts/{id}`: удаление созданного контакта, `404` для
несуществующего id, идемпотентность повторного удаления, а также поведение route-constraint
`{id:int}`. Данные self-contained с очисткой в teardown фикстуры.

## Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | Удаление созданного контакта → `204`; последующий `GET` того же id → `404`. |
| A2 | Удаление несуществующего id (созданный и уже удалённый контакт) → `404`. |
| A3 | Повторное удаление того же id (идемпотентность) → `204` затем `404`. |
| A4 | Нечисловой id отсекается роутингом (`{id:int}`) → `404`. |
| A5 | Данные создаются в тесте (без зависимости от seed), очистка в teardown; тело ответа `204` пустое. |

## Факты об API (основание для дизайна)

- `DELETE api/Contacts/{id:int}` (`DeleteContactByIdQuery`) → `204` (найден, удалён) | `404` (не найден).
- Handler возвращает `Success = deletedRows > 0`; контроллер: `!Success ? NotFound() : NoContent()`.
- **Идемпотентность:** второе удаление того же id даёт `deletedRows == 0` → `404`.
- `{id:int}` — нечисловой id отсекается роутингом (`404`), до контроллера не доходит.
- Успешный `DELETE` → `204` **с пустым телом** (нет payload).

## Затрагиваемые файлы

- **Добавляется:** `src/ApiTests/tests/contacts/delete.spec.ts`.
- **Обновляется:** `docs/tasks/api-tests-framework-plan.md` — отметить `T14` как `[x]`.
- Продакшн-код и инфраструктура тестов **не меняются** — переиспользуем существующие
  `contactsClient`, `contactFactory` и фикстуру авто-очистки.

## Переиспользуемая инфраструктура

- Фикстуры `src/fixtures/api.fixtures.ts`: `contactsClient` (авто-регистрация созданных id
  для teardown), `contactFactory`.
- `contactsClient.create(cmd)` → `{ status, headers, body, id }` (id из `Location`).
- `contactsClient.delete(id)` → сырой `ApiResponse { status, headers, body }`.
- `contactsClient.getById(id)` → сырой `ApiResponse`.
- `StatusCodes` из `http-status-codes` (без магических чисел).

## Tests — сценарии Playwright (`delete.spec.ts`)

**`DELETE /api/Contacts/{id} — existing contact` (A1, A5)**
- создать контакт → `201`; `DELETE` его id → `204`, тело пустое; затем `GET` того же id → `404`.

**`DELETE /api/Contacts/{id} — not found` (A2)**
- создать контакт, удалить его (`204`), затем `DELETE` того же id → `404` (self-contained,
  без опоры на «случайно свободный» id).

**`DELETE /api/Contacts/{id} — idempotency` (A3)**
- создать контакт; первый `DELETE` → `204`; второй `DELETE` того же id → `404`
  (подтверждает идемпотентную семантику `deletedRows == 0`).

**`DELETE /api/Contacts/{id} — non-numeric id (route constraint)` (A4)**
- `DELETE` с id `"abc"` → `404` (отсекается `{id:int}` до контроллера).

Все негативные кейсы построены над реально созданными и удалёнными в тесте контактами, чтобы
`404` означал именно «ресурс отсутствует», а не «id никогда не существовал».

## Изоляция и очистка

- Каждый тест создаёт свои контакты через `contactsClient.create` (фикстура регистрирует id и
  удаляет их в teardown; повторный `DELETE` в teardown безопасно проглатывает `404`).
- Тесты не зависят от seed-данных и устойчивы к параллельному прогону на общей БД.

## Вне зоны действия

- CRUD-lifecycle (`T15`, #72) и contract-schema spec (`T16`, #70) — отдельные задачи.
- Изменение продакшн-кода, фабрик, клиента или фикстур.

## Верификация

- `run-api` (или reuse) → API на `http://localhost:5000`.
- `npx playwright test tests/contacts/delete.spec.ts` — все кейсы зелёные.
- `npm run lint` в `src/ApiTests` — без новых замечаний.
- Каждый критерий A1–A5 закрыт минимум одним тестом с реальными ассертами.
