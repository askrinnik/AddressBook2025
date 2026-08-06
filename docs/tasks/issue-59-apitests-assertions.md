# Issue #59 — `[ApiTests][T9]` `utils/assertions.ts` — кастомные проверки

**Type:** test-authoring / инфраструктура фреймворка (метки `api`, `testing`) — задача **T9**
из плана [`api-tests-framework-plan.md`](./api-tests-framework-plan.md).
**Scope:** только `src/ApiTests/src/utils/**` + одна изолированная спека, покрывающая
хелперы (юнит + live). Никакого продакшн-кода, никаких правок `src/AutoTests`, T6/T7/T8-спеки
не мигрируем.
**Зависимости:** T4 (`contactModelSchema`, `getFilteredContactsResponseSchema`,
`problemDetailsSchema`), T5 (`BaseApiClient`/`ContactsClient`, тип `ApiResponse`),
T6 (`ProblemDetails`), T7 (`ContactFactory`), T8 (`api.fixtures.ts`).

## 1. Требование (из issue)

- `src/utils/assertions.ts`:
  - `expectMatchesSchema(body, schema)` — валидация ответа против zod-схемы с
    понятным сообщением.
  - `expectProblemDetails(response, { status, property, message })` — проверка ошибок
    валидации.
- Критерии из issue:
  - Хелперы дают читаемые сообщения при расхождении.
  - Используются в contract- и негативных тестах.

Хелперы будут широко переиспользоваться в T10–T14 (endpoint-специфичные негативы) и в
T16 (`contract/schema.spec.ts`).

## 2. Факты об API и уже готовой инфраструктуре

- `problemDetailsSchema` из T4 — «нестрогая» (принимает `traceId` и др. расширения ASP.NET),
  `errors` — только карта `Record<string, string[]>` (форма, которую API реально отдаёт).
- `ProblemDetails.fromJSON` из T6 — устойчив к «мусору», поддерживает `errors` в двух
  формах, предоставляет `messagesFor(prop)`, `messages`, `hasErrors()`.
- `ApiResponse<TBody>` из T5 — `{ status: number, headers: Record<string,string>, body: TBody }`.
  Хелпер должен уметь принимать любой `ApiResponse<unknown>` без ограничений на `TBody`.
- Реальный `400` от `POST /api/Contacts` содержит `title="Validation Error"`,
  `status=400`, `detail="One or more validation errors occurred"` и карту
  `errors: { PropertyName: string[] }` (см. валидаторы `Create/UpdateContactCommandValidator`).

## 3. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | `expectMatchesSchema(body, schema)` возвращает распарсенный `T` при валидном теле и не бросает. Типизировано через `z.ZodType<T>`. | Юнит-тест: даём валидный `Contact` → получаем `data` того же типа; поле `id` доступно как `number`. |
| AC2 | `expectMatchesSchema` бросает с читаемым сообщением при несоответствии: перечисляет все проблемные пути и их сообщения. | Юнит-тест: даём невалидный ввод, ловим ошибку, `expect(caught.message)` содержит имена всех проблемных полей и слова из zod-сообщений. |
| AC3 | `expectMatchesSchema` работает как ассерт Playwright — падение помечает тест как failed (через `expect(...).toBe(true)` с custom message). | Юнит-тест: гарантируем, что при несоответствии выбрасывается ошибка (Playwright это сам маркирует failed). |
| AC4 | `expectProblemDetails(response, { status })` проверяет статус и наличие корректного problem-details тела. Возвращает распарсенный `ProblemDetails`. | Юнит-тест на фиксированной нагрузке. |
| AC5 | `expectProblemDetails(response, { status, property })` — проверяет, что для указанного свойства **есть** сообщения. Мимо-property (`errors[LastName]` при ожидании `FirstName`) даёт читаемую ошибку с перечислением фактических ключей. | Юнит-тест: успешный кейс + failure-кейс с проверкой текста сообщения. |
| AC6 | `expectProblemDetails(response, { status, property, message })` принимает `message` как `string` (точное совпадение) или `RegExp` (проверка совпадения). При отсутствии совпадения — читаемое сообщение с фактическими значениями. | Юнит-тест: `string` + `RegExp` + failure с проверкой текста. |
| AC7 | `expectProblemDetails` дополнительно принимает `title`/`detail` (опционально) — точное сравнение. | Юнит-тест. |
| AC8 | Хелперы работают на реальном API: `expectMatchesSchema` — на `GET /api/Contacts/{id}` и `GET /api/Contacts`; `expectProblemDetails` — на `POST /api/Contacts` с невалидными данными от `ContactFactory` (пустое имя, будущая дата). | Live-часть спеки. |
| AC9 | Никаких `expect` в чуждом контексте: хелперы используют `expect` из `@playwright/test`, но сам модуль не имеет side-effects и не содержит state. | Code review. |
| AC10 | `npm run lint` + `npx tsc --noEmit` чистые. | Прогон в шаге 8. |
| AC11 | Чек-бокс **T9** в [`api-tests-framework-plan.md`](./api-tests-framework-plan.md) переведён в `[x]`. | Diff файла плана. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/src/utils/assertions.ts` | **Новый** — `expectMatchesSchema` + `expectProblemDetails`. |
| `src/ApiTests/src/utils/.gitkeep` | **Удалить**. |
| `src/ApiTests/tests/utils/assertions.spec.ts` | **Новый** — юнит-кейсы (AC1–AC7) + live (AC8). |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T9** как `[x]`. |

## 5. Дизайн

### 5.1. Публичный API `assertions.ts`

```ts
import { expect } from '@playwright/test';
import type { z } from 'zod';
import type { ApiResponse } from '../clients/base-api-client.js';
import { ProblemDetails } from '../models/problem-details.js';
import { problemDetailsSchema } from '../schemas/contact.schema.js';

export function expectMatchesSchema<T>(body: unknown, schema: z.ZodType<T>): T;

export interface ExpectedProblemDetails {
  status: number;
  title?: string;
  detail?: string;
  property?: string;
  message?: string | RegExp;
}

export function expectProblemDetails(
  response: ApiResponse<unknown>,
  expected: ExpectedProblemDetails,
): ProblemDetails;
```

Ключевые решения:

- **Свободные функции, не класс.** Хелперы — не DTO/фабрика; класс со static-only здесь
  был бы лишним namespace object. Идиоматично экспортировать функции — так же читаются
  импорты в тестах: `import { expectProblemDetails } from '../../src/utils/assertions.js'`.
- **Возврат типизированного результата.** `expectMatchesSchema` отдаёт `T` (парснутое
  тело) — тесты могут дальше проверять поля напрямую. `expectProblemDetails` отдаёт
  `ProblemDetails` — доступ к `messagesFor`/`messages` для дополнительных проверок.
- **Интеграция с `expect` Playwright.** Внутри используем
  `expect(condition, customMessage).toBe(true)`. Playwright автоматически:
  - помечает тест `failed`,
  - вставляет `customMessage` в отчёт,
  - показывает шаг в UI/trace.
  При этом на успехе никакой лишней шумихи. Плюс — на конце функции после провала
  `expect(...)` перегоняем через `throw new Error(customMessage)` для сужения типа
  (TypeScript иначе жалуется на возможный `undefined`). Эта строка недостижима в рантайме,
  но не мешает читаемости.
- **Формат сообщений.**
  - Для схемы: список проблем в столбик — `  • <path>: <message>` — плюс краткая
    выжимка сырого тела (`JSON.stringify(body, null, 2)`, обрезанное до ~2 KB).
  - Для problem-details: конкретика (`expected status 400, got 500`; `no error for
    property "FirstName"; got keys: [LastName]`; `no message for "FirstName" matches
    /empty/i; got: ["is required"]`).
- **`message: string | RegExp`.** `string` — точное совпадение через `Array.includes`;
  `RegExp` — `.some(m => re.test(m))`. Обе ветки покрыты юнит-кейсами.
- **`title`/`detail` — опционально, точное сравнение.** Тесты часто хотят зафиксировать
  ровно те строки, что API отдаёт (`"Validation Error"`, `"One or more validation errors
  occurred"`).
- **Модуль без side-effects и без state.** Никаких module-scope переменных, никакого
  I/O при импорте.

### 5.2. Спека `tests/utils/assertions.spec.ts`

Разделы:

1. **`expectMatchesSchema` — unit**
   - валидный `ContactModel` → возвращает данные, тип сохраняется, `id` — число;
   - невалидное тело (`id: "x"`, отсутствует `firstName`) → бросает; ловим и проверяем,
     что сообщение содержит `id`, `firstName` и слова из zod-сообщений;
   - валидный `GetFilteredContactsResponse` → возвращает `{ totalRows, rows }`.

2. **`expectMatchesSchema` — live**
   - через фикстуру `contactsClient` создаём контакт, читаем через `getById`, пропускаем
     `body` через хелпер + `contactModelSchema` — не бросает, возвращает объект;
   - `list()` без параметров → пропускаем через `getFilteredContactsResponseSchema`.

3. **`expectProblemDetails` — unit**
   - фиксированная нагрузка `{ status: 400, headers: {}, body: {...validationProblem} }`:
     `{ status: 400 }` → OK, возвращает `pd`;
     `{ status: 400, property: 'FirstName' }` → OK;
     `{ status: 400, property: 'FirstName', message: 'X' }` → неуспех при отсутствии `X` в
     сообщениях; ловим и проверяем текст;
     `{ status: 400, property: 'FirstName', message: /empty/i }` → OK;
     `{ status: 400, property: 'FirstName', message: /nonsense/ }` → неуспех + текст;
     `{ status: 400, title: 'Validation Error', detail: 'One or more…' }` → OK;
     `{ status: 500 }` → неуспех + текст (`expected status 500, got 400`).

4. **`expectProblemDetails` — live**
   - через фикстуру `contactsClient.create(contactFactory.emptyFirstName())` → ожидаем
     `400`, `property: 'FirstName'`, `message: /empty/i` (соответствует FluentValidation
     сообщению `"'First Name' must not be empty."`);
   - через `contactsClient.create(contactFactory.birthdayInFuture())` → `400`,
     `property: 'Birthday'`, `message: 'Birthday cannot be in the future'`.

Спека соответствует `playwright-conventions`: маршрутизация через `contactsClient`
(фикстура T8), Create-в-live-части автоматически удаляется в teardown фикстуры,
разделение на unit/live-блоки чёткое.

### 5.3. Что деликатно **вне** этого таска

- **Не мигрируем существующие спеки** (`problem-details.spec.ts`, `contact.factory.spec.ts`,
  `api.fixtures.spec.ts`) на новые хелперы. Первое реальное применение — T10+ и T16.
- **Не расширяем `expect.extend`** (кастомные Playwright matchers). Обёртки-функции
  проще и понятнее для нашего масштаба.
- **Не добавляем никаких зависимостей.** Всё уже стоит: `zod` (T2), `@playwright/test`,
  внутренние модули T4/T5/T6/T7/T8.

## 6. Тесты в этой задаче

Одна спека `tests/utils/assertions.spec.ts` — 4 логических блока, ~10–14 `test(...)`
внутри `describe`. Live-часть автоматически чистится за собой через фикстуру T8.

## 7. План работ

1. Создать `src/utils/assertions.ts` по §5.1.
2. Удалить `src/utils/.gitkeep`.
3. Создать `tests/utils/assertions.spec.ts` по §5.2.
4. `npm run lint` → чисто.
5. `npx tsc --noEmit` → чисто.
6. `npx playwright test tests/utils/assertions.spec.ts` при поднятом API → зелёная.
7. Отметить чек-бокс **T9** как `[x]` в плане.

## 8. Verification (шаг 8 промпта, режим test-authoring)

- `npm run lint` → 0 ошибок.
- `npx tsc --noEmit` → 0 ошибок.
- `npx playwright test tests/utils/assertions.spec.ts` — все кейсы зелёные, включая
  failure-ветки (проверка текста сообщений).
- `dotnet build src/AddressBook.sln` → без новых предупреждений.

## 9. Out of scope / follow-ups

- README `src/ApiTests` (T17 / #71) — не сюда; там же зафиксируем использование
  ассертов.
- CI-workflow (T18 / #74) — вне задачи.
- Кастомные Playwright matchers через `expect.extend` — вне задачи, обсуждаем при
  необходимости в отдельном issue.
