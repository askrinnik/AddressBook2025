# Issue #64 — `[ApiTests][T7]` `data/contact.factory.ts` + `tokens.ts`

**Type:** test-authoring / инфраструктура фреймворка (метки `api`, `testing`) — задача **T7**
из плана [`api-tests-framework-plan.md`](./api-tests-framework-plan.md).
**Scope:** только `src/ApiTests/src/data/**` + одна изолированная спека фабрик.
Никакого продакшн-кода (`AddressBook.Api`, `AddressBook.Contracts`, `AddressBook.Web`),
никаких правок `src/AutoTests`.
**Зависимости:** T5 (`ContactsClient`), T6 (`ProblemDetails`) — задействованы в live-части спеки.

## 1. Требование (из issue)

- `src/data/tokens.ts`: генератор уникального токена (для self-contained данных и поиска).
- `src/data/contact.factory.ts`:
  - `validContact()` (с/без birthday), с внедрением уникального токена в имя/фамилию.
  - Граничные варианты: имя/фамилия ровно 30 символов, 31 символ, пустые, `"   "`
    (пробелы), будущая дата, «сегодня».
- Критерии из issue:
  - Данные детерминированно уникальны между тестами и прогонами.
  - Именованные фабрики покрывают все валидационные границы из плана.

Позднее фабрики будут переиспользованы во всех спеках `create`/`update`/`delete`/`list`
(T10–T15) и в фикстурах T8.

## 2. Факты об API (проверено по коду `AddressBook.Api`)

- `CreateContactCommand` / `UpdateContactCommand`: `firstName`, `lastName`,
  `birthday?: string | null` в camelCase; birthday — `yyyy-MM-dd` или `null`.
- Валидация (`CreateContactCommandValidator`, `UpdateContactCommandValidator`):
  - `FirstName`, `LastName`: `NotEmpty()` + `MaximumLength(30)` → 30 валиден, 31 отклоняется.
  - `Birthday`: если задан → `<= сегодня`; иначе сообщение
    `"Birthday cannot be in the future"`.
  - **Trim выполняется после валидации** — `"   "` (три пробела) проходит `NotEmpty`, но
    сохраняется пустым. План (§3, §5-T12) отмечает это как «кандидат в баг-тест» — фабрика
    обязана уметь произвести этот вход, чтобы T12 мог его пропустить через API.

## 3. Acceptance criteria

| # | Критерий | Как проверим |
|---|----------|--------------|
| AC1 | Уникальность между тестами и прогонами: `RUN_TOKEN` стабилен в рамках Node-процесса и меняется от прогона к прогону; `newTestToken()` возвращает разные значения при последовательных вызовах в одном прогоне. | Юнит-часть спеки: 1000 вызовов `newTestToken()` → 1000 уникальных значений, все начинаются с `RUN_TOKEN`. Тест `import.meta` вызывает модуль дважды — `RUN_TOKEN` совпадает (в одном процессе стабилен). |
| AC2 | `validContact()` производит валидный контакт: `firstName` и `lastName` ≤ 30 символов, оба содержат `RUN_TOKEN`, `birthday` — строка `yyyy-MM-dd` в прошлом. | Юнит-часть: проверки длин, regex `^\d{4}-\d{2}-\d{2}$`, парс даты `<= сегодня`, `.includes(RUN_TOKEN)`. |
| AC3 | `validContactWithoutBirthday()` возвращает контакт с `birthday: null` при остальных валидных полях. | Юнит-часть: `.birthday === null`, `firstName`/`lastName` валидны. |
| AC4 | Граничные фабрики имён — точные длины: `firstName30Chars()` и `lastName30Chars()` дают ровно 30-символьное имя (валидное); `firstName31Chars()` и `lastName31Chars()` — ровно 31 (невалидное). Остальные поля остаются валидными. | Юнит-часть: `.length === 30` / `=== 31` для целевого поля; остальные поля валидны по правилам T2. |
| AC5 | Пустые фабрики: `emptyFirstName()` и `emptyLastName()` дают `""` в целевом поле; остальные поля валидны. | Юнит-часть: `.firstName === ''` / `.lastName === ''`. |
| AC6 | Пробельные фабрики: `whitespaceFirstName()` и `whitespaceLastName()` возвращают `"   "` (три пробела) в целевом поле; сохраняются валидные остальные поля. Комментарий в модуле фиксирует, что это «кандидат в баг-тест» (T12), а не валидный вход. | Юнит-часть + code review комментария. |
| AC7 | Даты: `birthdayInFuture()` даёт `birthday` строго позже сегодняшнего дня (`> сегодня`, UTC-Y-M-D); `birthdayToday()` — сегодняшний день (`= сегодня`). Формат `yyyy-MM-dd`. | Юнит-часть: парс, сравнение с локальным сегодня. |
| AC8 | Round-trip через API: `validContact()` → `POST /api/Contacts` возвращает `201`, `GET /api/Contacts/{id}` возвращает тот же контакт, `DELETE /api/Contacts/{id}` возвращает `204`. Данные, полученные фабрикой, реально валидны. | Live-часть спеки — Create → Verify → Delete на `ContactsClient` из T5. |
| AC9 | Никаких `expect` в самих модулях `tokens.ts` / `contact.factory.ts` (assertions живут в тестах). | `grep` + code review. |
| AC10 | `npm run lint` и `npx tsc --noEmit` в `src/ApiTests` — чисто. | Прогон в шаге 8. |
| AC11 | Чек-бокс **T7** в [`docs/tasks/api-tests-framework-plan.md`](./api-tests-framework-plan.md) переведён в `[x]`. | Diff файла плана. |

## 4. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/src/data/tokens.ts` | **Новый** — `RUN_TOKEN` + `newTestToken()`. |
| `src/ApiTests/src/data/contact.factory.ts` | **Новый** — фабрики валидных и граничных вариантов. |
| `src/ApiTests/src/data/.gitkeep` | **Удалить** — каталог теперь содержит реальные файлы. |
| `src/ApiTests/tests/data/contact.factory.spec.ts` | **Новый** — юнит-часть (AC1–AC7, AC9) + live round-trip (AC8). |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T7** как `[x]`. |

## 5. Дизайн

### 5.1. `src/data/tokens.ts`

```ts
import { randomBytes } from 'node:crypto';

/** Base36 token derived from crypto-random bytes; url/DB-safe. */
function base36Token(length: number): string;

/** Stable for the current Node process; different every test run. */
export const RUN_TOKEN: string;

/** Unique per invocation; always starts with `RUN_TOKEN` for cross-test grep-ability. */
export function newTestToken(): string;
```

Ключевые решения:

- **`RUN_TOKEN` — короткая base36-строка (6 символов).** ~2·10⁹ вариантов — вероятность
  коллизии между прогонами исчезающе мала, а длина позволяет вкладывать в 30-символьные
  имена. Определяется один раз при импорте модуля через `randomBytes(6).toString('base64url')`
  (нормализуем к base36 через фильтр цифр/букв).
- **`newTestToken()` — `RUN_TOKEN-<seq>-<rand4>`.** `seq` — монотонный счётчик модуля
  (1, 2, 3…), `rand4` — 4 base36-символа. Счётчик гарантирует уникальность даже при
  быстрых последовательных вызовах, `rand4` — устойчивость к сбоям параллельного импорта
  модуля.
- **Модуль-состояние ограничено счётчиком.** Это допустимо: тесты в Playwright изолированы
  по воркерам, каждый воркер — свой процесс, каждый импорт — свой `RUN_TOKEN` и свой
  счётчик. При этом `RUN_TOKEN` внутри одного воркера стабилен — можно грепать по нему в
  базе данных при разборе фейлов.

### 5.2. `src/data/contact.factory.ts`

Публичный API:

```ts
export interface ContactData {
  firstName: string;
  lastName: string;
  birthday?: string | null;
}

export class ContactFactory {
  private constructor();

  // Happy-path variants.
  static validContact(overrides?: Partial<ContactData>): ContactData;
  static validContactWithoutBirthday(overrides?: Partial<ContactData>): ContactData;

  // Length-boundary variants (30 = pass, 31 = fail per validator).
  static firstName30Chars(overrides?: Partial<ContactData>): ContactData;
  static firstName31Chars(overrides?: Partial<ContactData>): ContactData;
  static lastName30Chars(overrides?: Partial<ContactData>): ContactData;
  static lastName31Chars(overrides?: Partial<ContactData>): ContactData;

  // Empty and whitespace variants.
  static emptyFirstName(overrides?: Partial<ContactData>): ContactData;
  static emptyLastName(overrides?: Partial<ContactData>): ContactData;
  // "   " (three spaces) — passes NotEmpty pre-trim; kept as a bug-candidate input (T12).
  static whitespaceFirstName(overrides?: Partial<ContactData>): ContactData;
  static whitespaceLastName(overrides?: Partial<ContactData>): ContactData;

  // Birthday-boundary variants.
  static birthdayInFuture(overrides?: Partial<ContactData>): ContactData;
  static birthdayToday(overrides?: Partial<ContactData>): ContactData;
}
```

Ключевые решения:

- **Класс со static-методами, а не свободные функции.** Соответствует
  `playwright-conventions.instructions.md` («factory methods on DTO classes») и стилю T6
  (`ProblemDetails`). Даёт единый namespace для автокомплита и облегчает поиск полного
  набора вариантов.
- **Приватный конструктор.** Хелпер не инстанцируется — все методы статические.
- **`ContactData` вынесен наружу.** Отдельный `export interface` — тесты могут строить
  свои `Partial<ContactData>` для оверрайдов без импорта класса.
- **Один `ContactData` тип, зеркалит `CreateContactCommand` / `UpdateContactCommand`.**
  Не переиспользуем импорт из T5, чтобы не привязывать данные к клиенту, — `ContactsClient`
  принимает `ContactData` структурно (совпадающие поля).
- **Faker для имён и дат.** `faker.person.firstName()` / `.lastName()` для happy-path.
  Дата рождения — `faker.date.past({ years: 60 })` → форматируется в `yyyy-MM-dd`. Не
  сидим faker — реалистичные значения между запусками полезнее фиксированных.
- **Токен «зашивается» в имена happy-path.** Строим как
  `<fakerFirst>-<runToken>` и обрезаем до 30. Это делает контакты грепаемыми в БД по
  `RUN_TOKEN` при разборе флейков.
- **Boundary-фабрики строят имена детерминированной длины.** Для 30-символьного имени:
  `<runToken>-<newTestToken suffix>-<'x'*N>` — суффикс паддинга подбираем так, чтобы итог
  был ровно 30 символов; аналогично для 31. Для пустых — `""`; для пробельных — `"   "`.
  «Нецелевые» поля берут `baseValidContact()`-логику (валидные faker-имена и birthday).
- **`birthdayInFuture()` = завтра, `birthdayToday()` = сегодня.** Даты вычисляются от
  локального «сегодня» (`new Date()`), форматируются в `yyyy-MM-dd`. В юнит-части
  сравниваем через строковое сравнение — оно корректно для `yyyy-MM-dd`.
- **`overrides` — точечный оверрайд.** Все фабрики принимают `Partial<ContactData>`, чтобы
  тесты могли модифицировать только один аспект (например, брать 30-символьное имя, но
  сегодняшний birthday).
- **Никаких `expect`, никакого модульного состояния** (счётчик — в `tokens.ts`).

### 5.3. Тесты в этой задаче (Playwright)

Одна спека `tests/data/contact.factory.spec.ts` в новом каталоге `tests/data/`
(рядом с `tests/contract/` — они логически на одном уровне). Спека содержит:

- **Юнит-часть (без сети)** — покрывает AC1–AC7:
  - `tokens`: 1000 вызовов `newTestToken()` → 1000 уникальных значений, все начинаются с
    `RUN_TOKEN`; `RUN_TOKEN` состоит из base36-символов длины 6.
  - `validContact()` / `validContactWithoutBirthday()`: длины полей, наличие `RUN_TOKEN`
    в именах, формат `birthday` (`/^\d{4}-\d{2}-\d{2}$/`), `birthday <= today`, null для
    без-birthday-варианта.
  - Boundary-длины: `firstName30Chars`, `firstName31Chars`, `lastName30Chars`,
    `lastName31Chars` → точная длина целевого поля, остальные поля соответствуют
    happy-path-правилам.
  - Пустые: `emptyFirstName` → `firstName === ''`, `emptyLastName` → `lastName === ''`.
  - Пробельные: `whitespaceFirstName` → `firstName === '   '`, аналогично last.
  - Даты: `birthdayInFuture` → `birthday > today`, `birthdayToday` → `birthday === today`
    (оба в формате `yyyy-MM-dd`).
  - `overrides`: `validContact({ birthday: null })` даёт `birthday === null` при валидных
    именах.
- **Live-часть (AC8)** — один Create → Verify → Delete через `ContactsClient` (T5):
  - `factory.validContact()` → `create` → `201` + распарсен id из `Location`.
  - `getById(id)` → `200`, тело содержит те же `firstName`/`lastName`/`birthday`.
  - `delete(id)` → `204`. `getById(id)` → `404` (санити).

Спека соответствует `playwright-conventions`: маршрутизация через `ContactsClient`,
шаги независимы, live-часть создаёт и удаляет свой контакт (Create → Verify → Delete).

## 6. Что деликатно **вне** этого таска

- Фикстуры Playwright (`api.fixtures.ts`) — **T8** (#60). Автосtearing-cleanup появится там.
- Кастомные assertion-хелперы — **T9** (#59).
- Полные спеки эндпоинтов (`create.spec.ts`, `update.spec.ts` и т.д.) — **T10+**. Здесь
  мы не переносим весь набор негативных проверок — только доказываем, что фабрики их
  корректно порождают.
- README `src/ApiTests` — **T17** (#71).
- Правки продакшн-кода — не требуется.

## 7. План работ

1. Создать `src/data/tokens.ts` по §5.1.
2. Создать `src/data/contact.factory.ts` по §5.2.
3. Удалить `src/data/.gitkeep`.
4. Создать `tests/data/contact.factory.spec.ts` по §5.3.
5. `npm run lint` в `src/ApiTests` → без ошибок.
6. `npx tsc --noEmit` в `src/ApiTests` → без ошибок.
7. Прогнать только новую спеку через `run-tests`
   (`npx playwright test tests/data/contact.factory.spec.ts`) при поднятом API → зелёная.
8. Отметить чек-бокс **T7** как `[x]` в `docs/tasks/api-tests-framework-plan.md`.

## 8. Verification (шаг 8 промпта, режим test-authoring)

- `npm run lint` в `src/ApiTests` → 0 ошибок.
- `npx tsc --noEmit` в `src/ApiTests` → 0 ошибок.
- `npx playwright test tests/data/contact.factory.spec.ts` — все тесты зелёные,
  включая live round-trip.
- `dotnet build src/AddressBook.slnx` (§7 промпта) → без новых предупреждений
  (C#-код не трогаем).

## 9. Out of scope / follow-ups

- Не удаляем и не редактируем `src/AutoTests/**` — старая суита живёт до T19.
- Не вводим faker-сидинг: реалистичные вариации именно за счёт случайности; уникальность
  между тестами обеспечена токенами, а не сидом.
- Не добавляем ни новых пакетов, ни изменений `package.json` — `@faker-js/faker` уже стоит.
