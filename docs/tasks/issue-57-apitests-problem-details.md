# Issue #57 — `[ApiTests][T6]` `models/problem-details.ts` — RFC 7807-хелпер

**Type:** test-authoring / инфраструктура фреймворка (метки `api`, `testing`) — задача **T6**
из плана [`api-tests-framework-plan.md`](./api-tests-framework-plan.md).
**Scope:** только `src/ApiTests/src/models/problem-details.ts` + одна минимальная спека,
подтверждающая работу хелпера против живого API. Никакого продакшн-кода
(`AddressBook.Api`, `AddressBook.Contracts`, `AddressBook.Web`), никаких правок `src/AutoTests`.
**Зависимости:** T4 (`problemDetailsSchema` в [`src/ApiTests/src/schemas/contact.schema.ts`](../../src/ApiTests/src/schemas/contact.schema.ts)),
T5 (`ContactsClient` для смоук-теста).

## 1. Требование (из issue)

Портировать и улучшить RFC 7807-модель из `src/AutoTests` в новый фреймворк:

- `src/ApiTests/src/models/problem-details.ts`:
  - Поддержка `errors` как `string[]` **и** `Record<string, string[]>`.
  - `messages` (плоский список), `messagesFor(property)`, `hasErrors()`.
  - Совместимость с `ProblemDetailsSchema` из T4.
- Критерии из issue:
  - Хелпер корректно разбирает валидационный ответ `400` от API.
  - Хелпер используется хотя бы в одном негативном сценарии.

Позднее хелпер будет широко переиспользоваться в T12–T14 (`create`, `update`) и в T16
(`contract/schema.spec.ts`).

## 2. Факты об API (проверено по коду `AddressBook.Api`)

- Ошибки валидации возвращаются как `application/problem+json` со схемой RFC 7807.
- Тело ответа `400` для create/update содержит:
  - `title = "Validation Error"`
  - `status = 400`
  - `detail = "One or more validation errors occurred"`
  - `errors: { PropertyName: string[] }` — **карта** свойств → сообщения.
- ASP.NET кладёт дополнительные расширения (`traceId`, `type` вида `https://tools.ietf.org/html/rfc7231#section-6.5.1`).
- FluentValidation-правила (см. `CreateContactCommandValidator` / `UpdateContactCommandValidator`):
  - `FirstName`, `LastName`: `NotEmpty` + `MaximumLength(30)`.
  - `Birthday`: `<= сегодня` иначе сообщение `"Birthday cannot be in the future"`.
- Существующий хелпер в [`src/AutoTests/tests/dtos/ProblemDetails.ts`](../../src/AutoTests/tests/dtos/ProblemDetails.ts)
  уже поддерживает оба варианта `errors` (`string[]` и `Record<string, string[]>`); порт сохраняет
  эту логику и добавляет привязку к zod-схеме T4.
- Из спеки к T4 (`problemDetailsSchema`): схема **не строгая** (допускает `traceId` и др.),
  `errors: z.record(z.string(), z.array(z.string())).optional()` — то есть покрывает только
  «карту», плоский `string[]` не входит в схему намеренно (RFC 7807 §3.1 не описывает единой
  формы `errors`). Хелпер шире схемы — это ожидаемо.

## 3. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | `ProblemDetails.fromJSON(body)` корректно разбирает реальный `400` от `POST /api/Contacts` с невалидными данными: заполнены `title`, `status`, `detail`, `errors: Record<string, string[]>`. | Спека `tests/contract/problem-details.spec.ts`: реальный запрос к API + проверки полей. |
| AC2 | `messagesFor('FirstName')` возвращает сообщения именно для `FirstName` (пустой массив, если ключа нет), `messages` — плоский список всех сообщений, `hasErrors()` — булев. | Утверждения в той же спеке. |
| AC3 | Хелпер принимает оба варианта `errors`: `string[]` и `Record<string, string[]>`. При отсутствии `errors` — `messages` пустой, `hasErrors()` = `false`. | Юнит-подобные проверки против фиксированных JSON-нагрузок в той же спеке (без сети). |
| AC4 | Хелпер устойчив к «мусору»: `fromJSON(null)`, `fromJSON(undefined)`, `fromJSON("not-an-object")`, `fromJSON({ errors: 123 })` возвращают инстанс без падения; `messages` пустой, `hasErrors()` = `false`. | Утверждения в той же спеке. |
| AC5 | Тип полей совместим с `problemDetailsSchema` из T4: все поля публичного API помечены как `readonly` и типизированы так же, как `z.infer<typeof problemDetailsSchema>`, где `errors` расширен до `string[] \| Record<string, string[]>`. | Компиляция TS + code review + утверждение `problemDetailsSchema.parse(pd)` в спеке при карт-варианте. |
| AC6 | Внутри `problem-details.ts` нет `expect` и нет глобального состояния (модуль — чистые данные и pure-функции). | `grep` по файлу + code review. |
| AC7 | Линт и типы чистые: `npm run lint` и `npx tsc --noEmit` без новых ошибок/предупреждений. | Прогон в шаге 8 (verify). |
| AC8 | Чек-бокс **T6** в [`docs/tasks/api-tests-framework-plan.md`](./api-tests-framework-plan.md) переведён в `[x]`. | Diff файла плана. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/src/models/problem-details.ts` | **Новый** — порт RFC 7807-хелпера. |
| `src/ApiTests/src/models/.gitkeep` | **Удалить** — каталог теперь содержит реальный файл. |
| `src/ApiTests/tests/contract/problem-details.spec.ts` | **Новый** — одна спека, покрывающая AC1–AC5 (реальный `400` + фиксированные нагрузки). |
| `src/ApiTests/tests/contract/.gitkeep` | **Удалить** — каталог теперь содержит спеку. |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T6** как выполненную (`[x]`). |

## 5. Дизайн

### 5.1. Публичный API `problem-details.ts`

```ts
import { z } from 'zod';
import { problemDetailsSchema } from '../schemas/contact.schema.js';

export type ProblemErrors = string[] | Record<string, string[]>;

// Base shape mirrors the T4 zod schema; `errors` is widened to accept both forms
// (RFC 7807 does not standardise the shape; ASP.NET emits a map for validation).
export interface ProblemDetailsShape
  extends Omit<z.infer<typeof problemDetailsSchema>, 'errors'> {
  errors?: ProblemErrors;
}

export class ProblemDetails implements ProblemDetailsShape {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly errors?: ProblemErrors;

  private constructor(init: ProblemDetailsShape);

  static fromJSON(json: unknown): ProblemDetails;

  messagesFor(propertyName: string): string[];
  get messages(): string[];
  hasErrors(): boolean;
}
```

Ключевые решения:

- **Класс, а не набор функций.** Хелпер имеет естественный «объектный» API
  (`pd.messagesFor('FirstName')`), которым удобно пользоваться в утверждениях тестов,
  как в старой суите. Класс легковесный, без внутреннего состояния помимо readonly-полей.
- **`fromJSON` — единственная точка входа.** `constructor` приватный, чтобы никто не
  создавал полурабочие инстансы «сбоку». Все внешние вызовы идут через `fromJSON`,
  который сам нормализует произвольный ввод.
- **`errors` шире, чем в T4-схеме.** Схема T4 намеренно принимает только карту; хелпер
  дополнительно поддерживает плоский `string[]` — это соответствует критерию из issue и
  оригинальному AutoTests-хелперу. Проверка `hasErrors()` работает единообразно для обоих
  форматов.
- **Совместимость с `problemDetailsSchema`.** Инстанс, полученный из карт-варианта,
  успешно проходит `problemDetailsSchema.parse(...)`: readonly-поля совпадают по имени и
  типу. Проверку добавляем в AC5 спеки.
- **`messages` — геттер, а не поле.** Так избегаем дублирования данных: считаем на лету
  из `errors`. `messagesFor(key)` возвращает `[]` для плоского `string[]` (там нет ключей).
- **Устойчивость к мусору.** `fromJSON` не бросает исключений: любой не-объект → пустой
  инстанс; поля с неверным типом просто отбрасываются. Это упрощает использование в
  негативных тестах, где формат ответа мы формально не гарантируем.

### 5.2. Нормализация в `fromJSON`

- `type`, `title`, `detail`, `instance` — берём, если это `string`, иначе `undefined`.
- `status` — принимаем `number`; допускаем `string` числового вида (`"400"` → `400`),
  как в оригинальном хелпере, для устойчивости.
- `errors` — три ветки:
  - `Array.isArray(errors)` и все элементы `string` → `string[]`.
  - объект, у которого все значения `string[]` → `Record<string, string[]>`.
  - иначе → `undefined` (проглатываем «мусор» вроде `errors: 123`).
- Никаких валидаций через zod внутри `fromJSON` — схема T4 отвергла бы `string[]`-форму
  и осложнила код. Совместимость со схемой мы обеспечиваем структурно (те же имена и типы
  публичных полей) и подтверждаем спекой (AC5).

### 5.3. Одна спека `tests/contract/problem-details.spec.ts`

Спека выполняет две задачи и покрывает AC1–AC5:

- **Live-часть (AC1, AC2, AC5).** Использует `ContactsClient` из T5:
  - `POST /api/Contacts` с невалидными данными (`firstName: ''`, `lastName: 'X'.repeat(31)`,
    `birthday: <дата в будущем>`) — гарантированный `400` из FluentValidation.
  - `ProblemDetails.fromJSON(response.body)` → проверки: `status === 400`,
    `title === 'Validation Error'`, `detail === 'One or more validation errors occurred'`,
    `hasErrors()` истинно, `messagesFor('FirstName').length > 0`,
    `messagesFor('LastName').length > 0`, `messagesFor('Birthday')` содержит
    `'Birthday cannot be in the future'`, `messages.length >= 3`.
  - `problemDetailsSchema.parse(response.body)` не бросает (косвенно — тот же формат).
- **Юнит-часть (AC3, AC4).** Тесты без сети, на фиксированных JSON-нагрузках:
  - `errors` в виде `string[]`: `messages` — плоский, `messagesFor('x') === []`,
    `hasErrors() === true`.
  - `errors` = `Record<string, string[]>`: `messagesFor(existing)` возвращает массив,
    `messagesFor(missing)` — `[]`.
  - `errors` отсутствует: `messages === []`, `hasErrors() === false`.
  - `fromJSON(null)`, `fromJSON(undefined)`, `fromJSON('str')`, `fromJSON({ errors: 123 })` —
    инстансы без падения; `hasErrors() === false`.

Спека размещается в `tests/contract/` рядом с будущим `schema.spec.ts` (T16): оба спека
относятся к контракту API-ответов. `.gitkeep` в `tests/contract/` удаляем.

### 5.4. Тесты в этой задаче (Playwright E2E)

Одна спека `tests/contract/problem-details.spec.ts` (см. §5.3). Она уже соответствует
`playwright-conventions`: маршрутизация через `ContactsClient` (T5), никаких `expect`
внутри клиентов, шаги независимы, live-часть не оставляет побочных данных (при `400`
ничего не создаётся). Никаких фикстур/фабрик из T7/T8 здесь нет — они появятся позже,
и переписать спеку под них — тривиально.

## 6. Что деликатно **вне** этого таска

- Фабрики данных / генератор токенов — **T7** (#64).
- Фикстуры Playwright — **T8** (#60).
- Кастомные assertion-хелперы — **T9** (#59).
- Спеки эндпоинтов (`create.spec.ts`, `update.spec.ts`, …) — **T10+**.
- Contract-тесты по zod-схемам — **T16** (#70).
- Любые изменения продакшн-кода — не требуется.

## 7. План работ (в этом порядке)

1. Создать `src/ApiTests/src/models/problem-details.ts` по дизайну из §5.
2. Удалить `src/ApiTests/src/models/.gitkeep`.
3. Создать `src/ApiTests/tests/contract/problem-details.spec.ts` по §5.3.
4. Удалить `src/ApiTests/tests/contract/.gitkeep`.
5. `npm run lint` в `src/ApiTests` → без ошибок.
6. `npx tsc --noEmit` в `src/ApiTests` → без ошибок.
7. Поднять API (`dotnet run --project src/AddressBook.Api`) через skill `run-api` и
   прогнать спеку через skill `run-tests` (только новый файл, чтобы не задевать AutoTests):
   `npx playwright test tests/contract/problem-details.spec.ts` → зелёная.
8. Отметить чек-бокс **T6** как `[x]` в `docs/tasks/api-tests-framework-plan.md`.

## 8. Verification (шаг 8 промпта, режим test-authoring)

Полный `verify-feature` (браузерный обход) неприменим — это чистая фреймворковая задача.
Достаточно:

- `npm run lint` в `src/ApiTests` → 0 ошибок.
- `npx tsc --noEmit` в `src/ApiTests` → 0 ошибок.
- `npx playwright test tests/contract/problem-details.spec.ts` при поднятом API → зелёная,
  каждый test-case реально утверждает поведение (не пустышка).
- Общий `dotnet build src/AddressBook.slnx` (§7 промпта) → без новых предупреждений
  (мы вообще не трогаем C#-код, ожидаем ровно текущее состояние).

## 9. Out of scope / follow-ups

- `src/AutoTests/tests/dtos/ProblemDetails.ts` — оставляем как есть; старая суита продолжает
  работать. Единственная возможная будущая уборка — удалить его после T19, когда старую
  суиту снимут с сопровождения (не в этом таске).
- README `src/ApiTests` (`T17` / #71) — не сюда; там же зафиксируем использование хелпера.
- CI-workflow — `T18` / #74.
