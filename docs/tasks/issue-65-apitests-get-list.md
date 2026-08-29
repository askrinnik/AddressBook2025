# Issue #65 — `[ApiTests][T10]` `tests/contacts/get-list.spec.ts`

**Type:** test-authoring (метки `api`, `testing`) — задача **T10** из плана
[`api-tests-framework-plan.md`](./api-tests-framework-plan.md). **Первый** реальный
endpoint-спек: с этой задачи начинается Фаза 2.
**Scope:** только `src/ApiTests/tests/contacts/get-list.spec.ts`. Никакого продакшн-кода,
никаких правок `src/AutoTests` и никаких существующих спек.
**Зависимости:** T4 (`getFilteredContactsResponseSchema`), T5 (`ContactsClient`),
T7 (`ContactFactory` + `newTestToken` / `RUN_TOKEN`), T8 (`api.fixtures.ts` — авто-очистка
`contactsClient.create`), T9 (`expectMatchesSchema`).

## 1. Требование (из issue)

Тесты `GET /api/Contacts` (список + поиск):

- Получить список — ответ `200`, структура `{ TotalRows, Rows }`, `Rows.length === TotalRows`.
- Поиск по созданному уникальному токену возвращает ровно ожидаемые контакты (self-contained).
- Пустой результат поиска по заведомо несуществующему токену.
- Корректное кодирование query (терм со спецсимволами / пробелами).
- Независимость от seed-данных.

Критерии из issue:

- Тесты создают/чистят свои данные через фикстуры.
- Нет привязки к конкретным seed-контактам.

## 2. Факты об API (проверено по коду `AddressBook.Api`)

- **Контроллер** [`ContactsController.Get`](../../src/AddressBook.Api/Controllers/ContactsController.cs)
  принимает `[FromQuery] string? search` и всегда возвращает `200 OK` с
  `GetFilteredContactsResponse { TotalRows: int, Rows: ContactModel[] }`.
- **Репозиторий**
  [`AddressBookRepository.RetrieveManyAsync`](../../src/AddressBook.Api/DataAccess/AddressBookRepository.cs):
  - `IsNullOrWhiteSpace(searchText)` → возвращает **все** контакты (в т.ч. seed + всё,
    что накопили другие прогоны);
  - иначе → фильтр `FirstName.Contains(searchText) || LastName.Contains(searchText)`.
    EF Core → SQL Server `LIKE '%…%'`; по умолчанию **case-insensitive** (collation `_CI_`).
- **Handler** [`GetFilteredContactsQueryHandler`](../../src/AddressBook.Api/Application/GetFilteredContactsQueryHandler.cs)
  всегда выставляет `TotalRows = Rows.Length` — тавтологическое равенство, гарантия схемы.
- **`RUN_TOKEN`** (T7) стабилен на процесс; embedded в happy-path именах фабрики.
  `newTestToken()` уникален per invocation. Значит: поиск по свежесгенерированному
  `newTestToken()` **точно** не найдёт ни один контакт, созданный до этого вызова —
  безопасный «заведомо несуществующий» токен, при этом не зависящий от чужих прогонов.

## 3. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | `GET /api/Contacts` (без `search`) → статус `200` и валидная схема `getFilteredContactsResponseSchema`. | Тест `returns 200 with valid schema` — `expectMatchesSchema`. |
| AC2 | Инвариант `Rows.length === TotalRows` в ответе списка. | Тот же тест — `expect(parsed.rows.length).toBe(parsed.totalRows)`. |
| AC3 | Список содержит созданные тестом контакты (self-contained: проверяем через `.some(r => r.id === created.id)`, а не через фиксированное число). | В том же тесте — создаём один контакт, ищем его в `Rows` по `id`. |
| AC4 | Поиск по локально сгенерированному токену возвращает **ровно** ожидаемое число созданных контактов и **не** возвращает других. | Тест `search by unique local token returns exactly the created contacts` — создаём 2 контакта с этим токеном в `firstName`, поиск возвращает `totalRows === 2` и `rows[*].id ∋` оба id. |
| AC5 | Поиск по гарантированно несуществующему токену возвращает `TotalRows === 0`, `Rows === []`. | Тест `unknown token returns empty result`. |
| AC6 | Спец-символ URL (`&`) в query кодируется и доходит до API как есть. | Тест `search term with '&' is URL-encoded correctly` — создаём контакт с `firstName = "Q&A-<token>"`, поиск возвращает ровно его. |
| AC7 | Пробел в query кодируется и доходит как есть (то есть API находит контакт по substring c пробелом). | Тест `search term with spaces is URL-encoded correctly`. |
| AC8 | Ни один тест не привязан к seed-контактам (`id 1 John Doe`, `id 2 Jane Smith`) и не полагается на «был только один контакт до нас». | Code review + отсутствие любых `totalRows === <const>` без предварительного создания того же числа контактов; никакие тесты не читают `Rows[0]` без фильтрации по своему `id`. |
| AC9 | Все создания идут через `contactsClient.create` (фикстура T8) — автоматическая teardown-очистка. Никаких ручных `delete` в тестах. | Code review + прогон: после спеки поиск по `RUN_TOKEN`/токенам должен вернуть 0 (по факту — teardown уже отработал). |
| AC10 | `npm run lint` + `npx tsc --noEmit` чистые. | Прогон в шаге 8. |
| AC11 | Чек-бокс **T10** в [`api-tests-framework-plan.md`](./api-tests-framework-plan.md) переведён в `[x]`. | Diff файла плана. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/tests/contacts/get-list.spec.ts` | **Новый** — единственный спек T10. |
| `src/ApiTests/tests/contacts/.gitkeep` | **Удалить**. |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T10** как `[x]`. |

## 5. Дизайн спеки

Импорты — все через фикстуры и хелперы предыдущих задач: `test`/`expect` из
`api.fixtures.js`, `getFilteredContactsResponseSchema`, `expectMatchesSchema`,
`newTestToken`.

```
test.describe('GET /api/Contacts — list', () => {
  1. returns 200 with valid schema; Rows.length === TotalRows; includes created id
})

test.describe('GET /api/Contacts?search — search', () => {
  2. by unique local token returns exactly the two created contacts
  3. by an unknown token returns TotalRows === 0
  4. with '&' is URL-encoded correctly and finds the marker contact
  5. with spaces is URL-encoded correctly and finds the marker contact
})
```

Ключевые решения:

- **`totalRows === rows.length` — единственный «структурный» инвариант.** Никаких
  `totalRows === <N>` в общем случае, только там, где мы контролируем ровно `N`
  созданных нами контактов и уверенно фильтруем по своему токену.
- **`newTestToken()` как «заведомо несуществующий»** — свежий, не использованный ни в
  одном create(). Не полагаемся на длинные «магические» строки.
- **`marker`-контакты для encoding-тестов** имеют distinctive `firstName` (`"Q&A-<token>"`,
  `"Hi There <token>"`); длина строго ≤ 30 (проверим в коде через `.slice(0, 30)` на
  всякий случай).
- **Никаких прямых `delete`** — всё, что мы создаём через `contactsClient.create`,
  автоматически удалится в teardown фикстуры T8.
- **Никакой зависимости от seed-данных.** Пример: тест «список» проверяет наличие
  **своего** id, а не «list is non-empty and TotalRows > 0».

### 5.1. Что делаем со спец-символами SQL LIKE

`Contains` → `LIKE '%…%'`. Спец-символы SQL LIKE — `%`, `_`, `[`, `]`. Их поведение
на стороне API — отдельная история (может «залипать» и матчить лишнее), и это не
про URL-кодирование. Ограничиваемся URL-специальными: `&` и пробел. `%`/`_`/`[`
в текущем таске **не** проверяем — оставим на потенциальный T12/T14 или отдельный defect.

## 6. Тесты в этой задаче

Одна спека, 5 тестов. Все идут через фикстуру `contactsClient`, все проходят
`expectMatchesSchema`, каждый тест независим и self-contained.

## 7. План работ

1. Создать `tests/contacts/get-list.spec.ts` по §5.
2. Удалить `tests/contacts/.gitkeep`.
3. `npm run lint` → чисто.
4. `npx tsc --noEmit` → чисто.
5. `npx playwright test tests/contacts/get-list.spec.ts` при поднятом API → зелёная.
6. Отметить **T10** в плане.

## 8. Verification (шаг 8 промпта, test-authoring)

- `npm run lint` → 0 ошибок.
- `npx tsc --noEmit` → 0 ошибок.
- `npx playwright test tests/contacts/get-list.spec.ts` — все 5 тестов зелёные.
- `dotnet build src/AddressBook.slnx` → без новых предупреждений.

## 9. Out of scope / follow-ups

- SQL-LIKE спец-символы (`%`, `_`, `[`) — не в этой задаче.
- Пагинация / сортировка — API её сейчас не предоставляет.
- README `src/ApiTests` — T17 / #71.
- Миграция T6/T7/T8/T9-спек на фикстуры — не сюда.
