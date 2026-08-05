# Issue #62 — `[ApiTests][T5]` clients: `base-api-client` + `contacts-client` (без ассертов)

**Type:** test-authoring (labels `api`, `testing`) — фреймворк-задача из плана
[`api-tests-framework-plan.md`](./api-tests-framework-plan.md), T5.
**Scope:** только `src/ApiTests/src/clients/**` + минимальные типы под входные команды.
Никакого продакшн-кода (`AddressBook.Api`, `AddressBook.Contracts`, `AddressBook.Web`).
Тесты в этой задаче **не пишем** — они появятся в T10–T16.

## 1. Требование

Реализовать слой API-клиентов для будущих Playwright-тестов:

- `src/clients/base-api-client.ts` — тонкая типизированная обёртка над Playwright
  `APIRequestContext`, возвращает `{ status, headers, body }` по каждому запросу. Query-параметры
  кодируются `encodeURIComponent`.
- `src/clients/contacts-client.ts` — методы под 5 эндпоинтов `Contacts` со спецификой:
  `list(search?)`, `getById(id)`, `create(cmd)`, `update(id, cmd)`, `delete(id)`. `create` парсит
  id нового контакта из заголовка `Location` регуляркой `/\/Contacts\/(\d+)$/`.

## 2. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | Внутри `base-api-client.ts` и `contacts-client.ts` нет `expect` (ни `expect(...)`, ни `expect.soft(...)`). | `grep` по файлам клиентов + code review. |
| AC2 | Клиент переиспользуем и без глобального состояния: нет `static instance`, нет `getInstance`, нет `let`-переменных на уровне модуля с состоянием запроса. | Code review + `grep` по `singleton|getInstance|static\s+instance` в `src/clients/**`. |
| AC3 | `BaseApiClient` предоставляет методы `get`/`post`/`put`/`delete`, возвращающие `Promise<ApiResponse<T>>` с полями `status: number`, `headers: Record<string, string>`, `body: T` (JSON распарсен, пустое тело → `undefined`). | Компиляция TS + code review. |
| AC4 | Query-параметры кодируются `encodeURIComponent`: пробелы, `&`, кириллица не ломают URL. | Юнит-подобная проверка на этапе имплементации: временный вызов `list('Ivan &co')` при ручной отладке (описать в комментарии PR). Формальная авто-проверка — в T10. |
| AC5 | `ContactsClient` реализует все 5 методов с сигнатурами из плана и возвращает результат `BaseApiClient` (без ассертов); `create` дополнительно возвращает `id: number \| undefined`, распарсенный из `Location` по регулярке `/\/Contacts\/(\d+)$/`. | Компиляция TS + code review. |
| AC6 | `path` в `getById` / `update` / `delete` кодируется, чтобы нечисловой id (например, `abc`) корректно уходил на роут и получал `404` (сценарий из T11). | Реализация через `encodeURIComponent(String(id))` + code review. |
| AC7 | Линт и билд зелёные: `npm run lint`, `npx tsc --noEmit` (или сборка Playwright) не показывают новых ошибок/предупреждений. | Прогон в шаге 8 (verify). |
| AC8 | Чек-бокс T5 в `docs/tasks/api-tests-framework-plan.md` переведён в `[x]`. | Diff файла плана. |

Тесты для этой задачи **не пишем** (см. Scope). Playwright-тесты, использующие эти клиенты,
уже запланированы отдельными задачами (T10–T16); в них покроем реальные сценарии, включая
энкодинг query, парсинг `Location` и все негативы.

## 3. Дизайн

### 3.1. Файлы

```
src/ApiTests/src/clients/
  base-api-client.ts     # NEW
  contacts-client.ts     # NEW
```

Плюс правка одного чек-бокса в `docs/tasks/api-tests-framework-plan.md`.
Файла `.gitkeep` в `clients/` больше не нужно — удалим после появления реальных файлов.

### 3.2. `base-api-client.ts`

Публичный API:

```ts
export interface ApiResponse<TBody = unknown> {
  status: number;
  headers: Record<string, string>;
  body: TBody;
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  query?: QueryParams;
  data?: unknown;                   // JSON body для POST/PUT
  headers?: Record<string, string>;
}

export class BaseApiClient {
  constructor(request: APIRequestContext);
  get<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  post<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  put<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
  delete<T = unknown>(path: string, options?: RequestOptions): Promise<ApiResponse<T>>;
}
```

Ключевые решения:

- Никакого singleton — просто класс с конструктором. Каждая фикстура (T8) будет создавать
  свой инстанс с текущим `APIRequestContext`.
- `path` относительный: `baseURL` уже задан в `playwright.config.ts` (`env.baseURL`
  оканчивается на `/`, `new URL('Contacts', baseURL)` даёт `.../api/Contacts`).
- Query-параметры собираем вручную:
  - пропускаем `undefined` и `null` (позволяет писать `list(undefined)` — параметр `search`
    просто не уйдёт);
  - каждый ключ и значение прогоняем через `encodeURIComponent` (жёстче, чем `URLSearchParams`,
    и в явном виде отвечает требованию из issue).
- Тело парсим независимо от статуса, но безопасно:
  - `204 No Content` и любой пустой ответ → `body = undefined`;
  - `content-type` содержит `json` → `JSON.parse`;
  - иначе — сырая строка (для форматов, которых у нашего API сейчас нет; страховка).
- Никаких `expect` — обработка ошибок парсинга через `try/catch` с возвратом сырого тела
  как `body`, чтобы тесты могли сами решать, критично это или нет.

### 3.3. `contacts-client.ts`

```ts
export interface CreateContactCommand {
  firstName: string;
  lastName: string;
  birthday?: string | null;   // yyyy-MM-dd | null (API-формат)
}

export interface UpdateContactCommand extends CreateContactCommand {
  id?: number;                // API перекрывает id из маршрута; тесты могут проверять это
}

export interface CreateContactResult extends ApiResponse {
  id: number | undefined;
}

export class ContactsClient {
  constructor(base: BaseApiClient);
  list(search?: string): Promise<ApiResponse<unknown>>;
  getById(id: number | string): Promise<ApiResponse<unknown>>;
  create(command: CreateContactCommand): Promise<CreateContactResult>;
  update(id: number | string, command: UpdateContactCommand): Promise<ApiResponse<unknown>>;
  delete(id: number | string): Promise<ApiResponse<unknown>>;
}

export function parseContactIdFromLocation(location: string | undefined): number | undefined;
```

Ключевые решения:

- `id: number | string` — нужно для сценариев T11 (нечисловой id → `404` на уровне
  роутинга). Внутри — `encodeURIComponent(String(id))`.
- `create` возвращает расширенный `ApiResponse` с полем `id`. Если статус ≠ 201 или
  `Location` отсутствует / не парсится — `id = undefined`, решение о валидности принимает
  тест.
- Регулярка `/\/Contacts\/(\d+)$/` вынесена в модульную константу и переиспользуется
  экспортируемой функцией `parseContactIdFromLocation` (пригодится в тестах и фикстурах
  T8, не заставляя импортировать сам класс).
- Возвращаемый generic `<unknown>` для успешных body: тесты сами применяют zod-схемы
  (`contactModelSchema.parse(...)`) из T4. Внутри клиента типизировать реальные payload'ы
  нет смысла — это дублирует контракт и подрывает contract-тесты.
- `search === undefined` не добавляется в query → `GET /api/Contacts` без параметров.

### 3.4. Что деликатно **вне** этого таска

- Фикстуры Playwright (`api.fixtures.ts`) — T8.
- RFC7807-хелпер (`problem-details.ts`) — T6.
- Фабрики данных / генератор токенов — T7.
- Кастомные assertion-хелперы — T9.
- Любые `*.spec.ts` — T10 и далее.
- Правки продакшн-кода — не требуется и не планируется.

## 4. План работ (в этом порядке)

1. Создать `src/clients/base-api-client.ts` по дизайну из §3.2.
2. Создать `src/clients/contacts-client.ts` по дизайну из §3.3.
3. Удалить `src/clients/.gitkeep` (клиенты теперь реальные).
4. `npm run lint` в `src/ApiTests` → должно быть чисто.
5. `npx tsc --noEmit` (либо `npx playwright test --list`) → без ошибок компиляции.
6. Отметить T5 как `[x]` в `docs/tasks/api-tests-framework-plan.md`.

## 5. Verification (шаг 8 промпта)

По режиму «test-authoring» полный запуск `verify-feature` не требуется. Для T5 достаточно:

- `npm run lint` → 0 ошибок;
- `npx tsc --noEmit` → 0 ошибок (проверка типов клиентов и генерика `ApiResponse<T>`);
- Смок-проверка: короткий одноразовый спек-заглушка в скретче (не коммитим), поднимающий API
  через `run-api`, зовущий `list()`, `create()`, `getById()`, `delete()` для проверки
  парсинга `Location` и энкодинга query. Обязательные полновесные `.spec.ts` появятся в
  T10–T16.

Полный `npm test` в этой задаче не запускаем: без фикстур и тестов из следующих тасков
запускать нечего, а сами клиенты — библиотечный код.

## 6. Out of scope / follow-ups

- Никаких изменений в `src/AutoTests` — старая суита остаётся нетронутой (плановое решение
  из `api-tests-framework-plan.md`).
- Zod-схемы для запросов (`CreateContactCommand`, `UpdateContactCommand`) — не добавляем;
  это дублировало бы серверную валидацию. Тесты будут собирать команды через фабрику T7.
- README и CI-workflow — T17/T18.
