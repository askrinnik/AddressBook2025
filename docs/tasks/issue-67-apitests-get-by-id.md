# Issue #67 — `[ApiTests][T11]` `tests/contacts/get-by-id.spec.ts`

**Type:** test-authoring (метки `api`, `testing`) — задача **T11** из плана
[`api-tests-framework-plan.md`](./api-tests-framework-plan.md).
**Scope:** только `src/ApiTests/tests/contacts/get-by-id.spec.ts`. Никакого продакшн-кода,
никаких правок `src/AutoTests` и никаких существующих спек.
**Зависимости:** T4 (`contactModelSchema`), T5 (`ContactsClient.getById` — принимает
`number | string`), T7 (`ContactFactory.validContact`), T8 (`api.fixtures.ts` — авто-очистка),
T9 (`expectMatchesSchema`).

## 1. Требование (из issue)

Тесты `GET /api/Contacts/{id}`:

- Получить созданный контакт по id — `200`, поля совпадают с отправленными.
- Несуществующий id (свежесозданный + удалённый) — `404`.
- Нечисловой id (`abc`) — `404` (route constraint `{id:int}`).

Критерии из issue:

- Self-contained данные (без хардкода `id = 1`).
- Проверка ответа против zod-схемы `ContactModel`.

## 2. Факты об API (проверено по коду `AddressBook.Api`)

- **Контроллер** [`ContactsController.GetById`](../../src/AddressBook.Api/Controllers/ContactsController.cs)
  — `HttpGet("{id:int}")`, при `null` из handler-а `NotFound()`, иначе `Ok(ContactModel)`.
- Route constraint `{id:int}` — C# `int` (Int32). При нечисловом id или переполнении
  (`> Int32.MaxValue`) MVC-роутинг **не** матчит маршрут — возвращает `404` до входа
  в контроллер (тот же путь мы уже эксплуатировали в teardown фикстуры T8).
- **Handler**
  [`GetContactByIdQueryHandler`](../../src/AddressBook.Api/Application/GetContactByIdQueryHandler.cs)
  использует `IRetrieve<ContactId, Contact>.TryRetrieveAsync` — возвращает `null` при
  отсутствии → контроллер отдаёт `404`. Никакого problem-details тела на 404 не
  формируется — просто пустой ответ (`NotFound()`).
- **Ответ 200** содержит `ContactModel { id, firstName, lastName, birthday }` в camelCase —
  форма зафиксирована в T4-схеме `contactModelSchema`.

## 3. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | `GET /api/Contacts/{id}` для созданного контакта — статус `200`, тело валидируется `contactModelSchema` и поля (`id`, `firstName`, `lastName`, `birthday`) совпадают с отправленными. | Тест `returns 200 with the created contact's fields`. |
| AC2 | `GET /api/Contacts/{id}` для удалённого контакта — статус `404`. | Тест `returns 404 for a freshly deleted contact`. Создание и удаление — через фикстуру. |
| AC3 | `GET /api/Contacts/abc` (нечисловой) — статус `404` (сработал route constraint). | Тест `returns 404 for a non-numeric id`. |
| AC4 | `GET /api/Contacts/{overflowInt32}` — статус `404` (route constraint не матчит). Дополнительный boundary — покрывает поведение, на которое опирается teardown T8. | Тест `returns 404 for an id that overflows int32`. |
| AC5 | Ни один тест не хардкодит `id = 1` / `id = 2` и не полагается на seed-данные. | Code review + сам факт: все положительные и делеты идут через созданные фабрикой контакты. |
| AC6 | Все создания через `contactsClient.create` (фикстура T8), никаких прямых `delete` кроме той, что часть тест-сценария. Оставшиеся созданные контакты автоочистятся teardown-ом фикстуры. | Code review + прогон. |
| AC7 | `npm run lint` + `npx tsc --noEmit` чисто. | Прогон в шаге 8. |
| AC8 | Чек-бокс **T11** в [`api-tests-framework-plan.md`](./api-tests-framework-plan.md) переведён в `[x]`. | Diff файла плана. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/tests/contacts/get-by-id.spec.ts` | **Новый** — единственный спек T11. |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T11** как `[x]`. |

## 5. Дизайн спеки

Импорты — все через фикстуры и хелперы предыдущих задач. Одна `describe`, четыре теста:

```
test.describe('GET /api/Contacts/{id}', () => {
  1. returns 200 with the created contact's fields (happy path, schema, all fields)
  2. returns 404 for a freshly deleted contact
  3. returns 404 for a non-numeric id (route constraint)
  4. returns 404 for an id that overflows int32 (route constraint)
})
```

Ключевые решения:

- **`Number.MAX_SAFE_INTEGER` — «переполнение int32».** `> 2^31-1`, гарантированно проваливает
  `{id:int}` → `404`. Тот же способ уже эксплуатировался в T8 (тест устойчивости teardown).
- **`getById('abc')` — нечисловой id.** `ContactsClient.getById` принимает `number | string` и
  прогоняет через `encodeURIComponent(String(id))` — URL безопасен, до контроллера доедет строка,
  route не сматчится → `404`.
- **Тело 404 не проверяем.** ASP.NET `NotFound()` возвращает пустой ответ; фиксируем только
  статус — это ровно то, что спрашивает issue.
- **Для happy path — точное сравнение всех полей.** `payload.firstName === parsed.firstName`,
  `payload.lastName === parsed.lastName`, `payload.birthday === parsed.birthday`. Так подтверждаем
  round-trip запись → чтение без потерь. `id` берётся из `Location` (парсит `contactsClient.create`).
- **Никаких прямых `delete` кроме теста-«удалённый контакт».** Всё остальное чистится
  teardown-ом фикстуры.

## 6. Тесты в этой задаче

Одна спека, 4 теста. Все идут через фикстуру `contactsClient`, все проверяются схемой
там, где имеет смысл (только на `200`).

## 7. План работ

1. Создать `tests/contacts/get-by-id.spec.ts` по §5.
2. `npm run lint` → чисто.
3. `npx tsc --noEmit` → чисто.
4. `npx playwright test tests/contacts/get-by-id.spec.ts` при поднятом API → зелёная.
5. Отметить **T11** в плане.

## 8. Verification (шаг 8 промпта, test-authoring)

- `npm run lint` → 0 ошибок.
- `npx tsc --noEmit` → 0 ошибок.
- `npx playwright test tests/contacts/get-by-id.spec.ts` — все 4 теста зелёные.
- `dotnet build src/AddressBook.sln` → без новых предупреждений.

## 9. Out of scope / follow-ups

- Отрицательный `id` (`-1`) — валидный по route (`int` знаковый), просто нет в БД → тот же
  `404`, что и в тесте 2. Отдельно не тестируем — дублирует существующий кейс.
- Тело 404 (пустое сейчас, но ASP.NET может настроить `Problem()`) — не в скоупе issue.
- README `src/ApiTests` — T17 / #71.
