# Issue #60 — `[ApiTests][T8]` `fixtures/api.fixtures.ts` — фикстуры с авто-очисткой

**Type:** test-authoring / инфраструктура фреймворка (метки `api`, `testing`) — задача **T8**
из плана [`api-tests-framework-plan.md`](./api-tests-framework-plan.md).
**Scope:** только `src/ApiTests/src/fixtures/**` + одна изолированная спека,
подтверждающая, что фикстуры действительно чистят за собой. Никакого продакшн-кода
(`AddressBook.Api`, `AddressBook.Contracts`, `AddressBook.Web`), никаких правок
`src/AutoTests`.
**Зависимости:** T5 (`BaseApiClient`, `ContactsClient`), T7 (`ContactFactory`).

## 1. Требование (из issue)

- `src/fixtures/api.fixtures.ts`:
  - Фикстура `contactsClient` — создаётся per-test из `request`, без singleton.
  - Фикстура `contactFactory`.
  - Трекер созданных контактов + авто-удаление в teardown (`finally`-семантика).
- Критерии из issue:
  - Тесты не оставляют мусорных данных в БД.
  - Устойчивость к `fullyParallel: true`.

Позднее фикстуры будут переиспользованы во всех спеках эндпоинтов (T10–T15) и в
contract-тестах (T16).

## 2. Факты и опоры проектирования

- Playwright `test.extend<F>({...})` даёт test-scoped фикстуры: setup выполняется до
  теста, teardown — после (в том числе при падении теста). Компонуемость через
  «request-fixture» в аргументах фабрики.
- `fullyParallel: true` (см. [`playwright.config.ts`](../../src/ApiTests/playwright.config.ts))
  распределяет тесты по воркерам-процессам. Каждый воркер — свой `RUN_TOKEN` из T7,
  свой module-state. Test-scoped фикстура создаётся на каждый тест внутри воркера — нет
  общего состояния между тестами.
- `ContactsClient` (T5) не имеет ассертов и возвращает сырой `ApiResponse`; для авто-очистки
  нужно перехватывать успешное `create` и запоминать полученный `id`.
- `ContactFactory` (T7) — класс со static-методами; логично отдавать «как есть» через
  фикстуру, чтобы тесты писали `contactFactory.validContact(...)` без прямого импорта
  класса (единая точка входа через `import { test, expect } from '../../src/fixtures/api.fixtures.js'`).
- `DELETE /api/Contacts/{id}` возвращает `204` при удачном удалении и `404`, если контакта
  уже нет (см. §3 плана). Teardown должен молча пережёвывать `404` — тест мог удалить
  контакт сам (например, в `delete.spec.ts` из T14).

## 3. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | Экспорт `test` и `expect` из `api.fixtures.ts`; фикстуры типизированы и не тянут singleton (`grep` по `singleton|getInstance|static\s+instance` в модуле ничего не даёт). | Code review + импорт из спеки. |
| AC2 | `contactsClient` — фикстура test-scoped, инстанс создаётся per-test через `new ContactsClient(new BaseApiClient(request))`. Разные тесты получают **разные** инстансы (`===` не совпадает). | Спека: два теста сохраняют ссылку на клиента через worker-level fixture / module-state и проверяют `!==`. Достаточно кросс-тестовой проверки в `describe.serial`. |
| AC3 | `contactFactory` — фикстура, возвращающая `ContactFactory` (сам класс), тесты пишут `contactFactory.validContact(...)`. | Спека: `expect(contactFactory).toBe(ContactFactory)`; вызов `contactFactory.validContact()` возвращает валидный объект. |
| AC4 | Создание контакта через `contactsClient.create(...)` **автоматически** регистрирует `id` в трекере. После teardown контакт в БД отсутствует. | Спека `describe.serial`: тест A создаёт контакт через фикстуру и «прокидывает» его `id` наверх; тест B — с сырым клиентом (`new ContactsClient(...)`) проверяет `GET /api/Contacts/{id}` → `404`. |
| AC5 | Teardown устойчив к идемпотентности: если тест сам удалил контакт, повторное `DELETE` в teardown не роняет прогон (проглатываем `404`/сетевые сбои, best-effort). | Спека: тест создаёт контакт через фикстуру, потом сам его удаляет; проверяем, что тест завершается success, teardown не бросает. |
| AC6 | Teardown продолжает удалять остальные контакты, даже если удаление одного упало (перехватываем ошибку по элементу). | Юнит-подобная часть спеки: намеренно ломаем удаление одного из трёх созданных контактов (например, регистрируем «фейковый» id через прямой доступ к трекеру, если такой есть). Если механизм регистрации не публичен — покрываем это код-ревью и явно оставляем комментарий в фикстуре. |
| AC7 | Устойчивость к `fullyParallel: true`: в спеке несколько тестов подряд создают контакты через фикстуру, никаких коллизий и «утечек» между воркерами не происходит (проверяется тем, что кросс-worker обмена через `contactsClient` нет, module-state воркер-локален). | Прогон всей спеки при `fullyParallel: true` — тесты зелёные, никакой контакт не «перетекает». |
| AC8 | `npm run lint` + `npx tsc --noEmit` в `src/ApiTests` — чисто. | Прогон в шаге 8. |
| AC9 | Чек-бокс **T8** в [`docs/tasks/api-tests-framework-plan.md`](./api-tests-framework-plan.md) переведён в `[x]`. | Diff файла плана. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/src/fixtures/api.fixtures.ts` | **Новый** — `test.extend`, три фикстуры + teardown. |
| `src/ApiTests/src/fixtures/.gitkeep` | **Удалить**. |
| `src/ApiTests/tests/fixtures/api.fixtures.spec.ts` | **Новый** — спека, покрывающая AC1–AC7. |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T8** как `[x]`. |

## 5. Дизайн

### 5.1. Публичный API `api.fixtures.ts`

```ts
import { test as base, expect } from '@playwright/test';
import { BaseApiClient } from '../clients/base-api-client.js';
import { ContactsClient } from '../clients/contacts-client.js';
import { ContactFactory } from '../data/contact.factory.js';

export interface CreatedContactTracker {
  register(id: number): void;
  readonly ids: readonly number[];
}

export interface ApiFixtures {
  contactsClient: ContactsClient;
  contactFactory: typeof ContactFactory;
  createdContacts: CreatedContactTracker;
}

export const test: TestType<ApiFixtures & ...>;
export { expect };
```

Ключевые решения:

- **Три фикстуры, все test-scoped.** `contactFactory` — константа-ссылка на класс, никакой
  инстанс не строится. `createdContacts` — свежий трекер per-test. `contactsClient` — свежий
  инстанс `ContactsClient` per-test, обёрнутый так, что `create` подмешивает регистрацию `id`
  в трекер.
- **`createdContacts` вынесена как отдельная фикстура**, чтобы тесты могли явно
  регистрировать «свои» id (например, если контакт создавался через побочный путь, а не
  через `contactsClient.create`). Это же даёт AC5/AC6 явную точку контроля.
- **Обёртка над `create` через приватный подкласс**, а не `Proxy` — читабельнее и
  сохраняет типы:
  ```ts
  class TrackedContactsClient extends ContactsClient {
    constructor(base: BaseApiClient, private readonly tracker: CreatedContactTracker) {
      super(base);
    }
    async create(cmd: CreateContactCommand): Promise<CreateContactResult> {
      const result = await super.create(cmd);
      if (typeof result.id === 'number') this.tracker.register(result.id);
      return result;
    }
  }
  ```
  Класс модуль-приватный, наружу отдаётся как `ContactsClient` — тесты видят обычный тип.
- **Teardown — best-effort в `try/catch`.** Каждое `DELETE` в отдельном `try/catch`; провал
  одного не мешает остальным. `404` — «ничего страшного, тест сам почистил». Прочие ошибки
  логируем `console.warn` (без падения теста): teardown не должен «маскировать» реальный
  провал теста.
- **Никаких `expect` в фикстуре.** Все ассерты живут в тестах.
- **`export { expect }` из того же модуля.** Тесты пишут
  `import { test, expect } from '../../src/fixtures/api.fixtures.js'` — одна точка входа.

### 5.2. Спека `tests/fixtures/api.fixtures.spec.ts`

Структура:

1. **`test.describe('api fixtures — smoke')`** — быстрые проверки без хитрой оркестрации.
   - `contactFactory` — это `ContactFactory` (`toBe`), `contactFactory.validContact()`
     возвращает валидный объект.
   - `contactsClient` — инстанс `ContactsClient`; успешный `create` увеличивает
     `createdContacts.ids.length` на 1.

2. **`test.describe.serial('api fixtures — auto cleanup')`** — доказывает, что teardown
   удаляет контакты (AC4, AC7).
   - Тест A: создать контакт через фикстуру, дописать `res.id` в `describe`-локальный
     массив `createdIds`, `expect(...).toBe(StatusCodes.CREATED)`.
   - Тест B: для каждого id из массива создать **сырой** `ContactsClient` (не через
     фикстуру) и вызвать `getById(id)` → `404`.
   - `describe.serial` гарантирует порядок и не мешает `fullyParallel: true` для остальных
     файлов.

3. **`test('teardown tolerates a contact already deleted in-test')`** — AC5.
   - Создать контакт через фикстуру, тут же `contactsClient.delete(id)` → `204`.
   - Тест завершается success. (Если teardown ронёт, тест будет помечен failed —
     это и есть проверка.)

4. **`test('teardown continues after a failed delete')`** — AC6.
   - Регистрируем в трекере «недостижимый» id (например, `Number.MAX_SAFE_INTEGER`)
     через `createdContacts.register(...)`, плюс создаём один реальный контакт через
     фикстуру.
   - Тест успешен. После teardown реальный контакт удалён (проверяем в
     `describe.serial`-паре: следующий тест смотрит `GET /{id}` → `404`).

Спека соответствует `playwright-conventions`: маршрутизация через `ContactsClient`,
никаких `expect` внутри клиента/фикстуры, независимые шаги, Create → Verify → Delete
(здесь Delete — руками фикстуры).

### 5.3. Что осталось за кадром намеренно

- **Миграцию существующих спек на фикстуры не делаем в этом таске.** `contact.factory.spec.ts`
  (T7) и `problem-details.spec.ts` (T6) продолжают строить клиент вручную. Переход на
  фикстуры — часть подготовки к T10+ или отдельная уборка.
- **Worker-scoped фикстур нет.** Всё test-scoped: проще рассуждать, меньше нюансов
  с `fullyParallel`.
- **`request`-fixture не переопределяем**: `contactsClient` зависит от встроенной
  `request`, никаких `test.use({ ... })` мы здесь не трогаем.

## 6. Тесты в этой задаче

Одна спека (`tests/fixtures/api.fixtures.spec.ts`), четыре-пять `test(...)` в трёх
`describe` (один — `serial`). Всё в режиме `fullyParallel` — сериализация ограничена только
парой Create-then-Verify для проверки teardown, что и требуется по AC.

## 7. План работ

1. Создать `src/fixtures/api.fixtures.ts` по §5.1.
2. Удалить `src/fixtures/.gitkeep`.
3. Создать `tests/fixtures/api.fixtures.spec.ts` по §5.2.
4. `npm run lint` в `src/ApiTests` → без ошибок.
5. `npx tsc --noEmit` в `src/ApiTests` → без ошибок.
6. `npx playwright test tests/fixtures/api.fixtures.spec.ts` при поднятом API → зелёная.
7. Отметить чек-бокс **T8** как `[x]` в `docs/tasks/api-tests-framework-plan.md`.

## 8. Verification (шаг 8 промпта, режим test-authoring)

- `npm run lint` в `src/ApiTests` → 0 ошибок.
- `npx tsc --noEmit` в `src/ApiTests` → 0 ошибок.
- `npx playwright test tests/fixtures/api.fixtures.spec.ts` — все кейсы зелёные,
  включая проверку «контакт удалён после teardown».
- `dotnet build src/AddressBook.slnx` (§7 промпта) → без новых предупреждений
  (C#-код не трогаем).

## 9. Out of scope / follow-ups

- Не удаляем и не переписываем `src/AutoTests` — старая суита живёт до T19.
- Не мигрируем `contact.factory.spec.ts` / `problem-details.spec.ts` на фикстуры — это
  сделаем при написании реальных спек в T10+ (или отдельным cleanup-таском).
- Не вводим worker-scoped ресурсы: для нашей нагрузки test-scoped фикстур достаточно.
- README `src/ApiTests` (T17 / #71) — не сюда, но зафиксируем использование фикстур там же.
