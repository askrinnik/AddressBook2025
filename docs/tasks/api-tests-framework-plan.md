# План: Современный фреймворк API-автотестов `src/ApiTests`

> **Статус:** черновик / в работе
> **Целевая папка:** `src/ApiTests` (существующий `src/AutoTests` не трогаем)
> **Прогресс отслеживается чек-боксами в разделе [Список задач](#список-задач-github-ready).**

## 1. Цель

Разработать с нуля новый, современный, гибкий и мощный фреймворк API-автотестов для
`AddressBook.Api` на Playwright + TypeScript. Полностью покрыть все 5 эндпоинтов `Contacts`
(включая непокрытый сейчас `PUT`), негативные сценарии, граничные значения и contract-схемы.

Полезные части текущего `src/AutoTests` переиспользуем (RFC7807-модель, парсинг `Location`,
`http-status-codes`), но архитектуру строим заново по актуальным паттернам.

## 2. Архитектурные решения

- **Self-contained данные.** Каждый тест создаёт собственные данные с уникальным токеном
  и удаляет их в teardown фикстуры. Устойчиво к общей SQL Server БД (без сброса между
  прогонами) и к параллельному запуску.
- **Клиент без ассертов.** API-клиент возвращает типизированный `{ status, headers, body }`;
  все проверки — в тестах. Это устраняет главный анти-паттерн старого singleton-клиента
  (ассерты внутри клиента, общий `APIRequestContext` при `fullyParallel`).
- **Zod как источник контракта.** Zod-схемы валидируют ответы API (contract testing) и
  одновременно дают TypeScript-типы (single source of truth).
- **Фабрики на faker.** Реалистичные данные + именованные граничные варианты (30/31 символ,
  будущая дата, пробелы и т.д.).
- **webServer.** Playwright поднимает `dotnet run --project src/AddressBook.Api` с
  `reuseExistingServer` локально; конфигурация через `dotenv` (`.env.local` / `.env.ci`).
- **Стек:** `@playwright/test`, `zod`, `@faker-js/faker`, `dotenv`, `cross-env`,
  `http-status-codes`, ESLint (flat config) + Prettier, TypeScript.

## 3. Факты об API (основа для дизайна тестов)

- База: `http://localhost:5000`, маршруты под `api/Contacts`. Авторизации нет.
- Эндпоинты:
  1. `GET api/Contacts?search=` → `200` `GetFilteredContactsResponse { TotalRows:int, Rows:ContactModel[] }`
  2. `GET api/Contacts/{id:int}` → `200` `ContactModel` | `404`
  3. `POST api/Contacts` (`CreateContactCommand`) → `201`, **тело пустое**, id только в заголовке `Location` (`/api/Contacts/{id}`) | `400`
  4. `DELETE api/Contacts/{id:int}` → `204` | `404`
  5. `PUT api/Contacts/{id:int}` (`UpdateContactCommand`, id из маршрута перекрывает тело) → `204` | `400` | `404`
- `ContactModel`: `{ id, firstName, lastName, birthday: "yyyy-MM-dd" | null }`.
- Валидация (FluentValidation, create и update идентичны):
  - `FirstName`: `NotEmpty` + `MaximumLength(30)`
  - `LastName`: `NotEmpty` + `MaximumLength(30)`
  - `Birthday`: если задан → `<= сегодня`; сообщение `"Birthday cannot be in the future"`
  - Trim выполняется **после** валидации → `"   "` проходит `NotEmpty`, но сохраняется пустым (кандидат в баг-тест).
  - В update-валидаторе **нет** правила на `Id`.
- Ошибки: RFC 7807 `application/problem+json`. Валидация `400`: `title="Validation Error"`,
  `status=400`, `detail="One or more validation errors occurred"`, `errors: { PropertyName: [msgs] }`.
- Ограничение `{id:int}`: нечисловой id → `404` на уровне роутинга (не доходит до контроллера).
- Seed-данные: контакт id 1 `John Doe` (1990-01-01), id 2 `Jane Smith` (1992-02-02).
- `Phone` / `PhoneOperator` **не доступны** через API; `ContactModel` не содержит телефонов и `OwnerId`.
- БД: общая SQL Server (SQLEXPRESS), авто-миграция при старте, не in-memory.

## 4. Структура каталогов

```
src/ApiTests/
  package.json  playwright.config.ts  tsconfig.json  eslint.config.mjs
  .prettierrc.json  .env.example  .gitignore  README.md
  src/
    config/env.ts                 # zod-валидация переменных окружения
    clients/
      base-api-client.ts          # тонкая обёртка, БЕЗ ассертов
      contacts-client.ts          # методы по эндпоинтам
    schemas/contact.schema.ts     # zod: Contact, ListResponse, ProblemDetails
    models/problem-details.ts     # улучшенный RFC7807-хелпер (порт)
    data/
      contact.factory.ts          # билдеры на faker + граничные варианты
      tokens.ts                   # генератор уникальных токенов прогона
    fixtures/api.fixtures.ts      # test.extend: client + factory + авто-cleanup
    utils/assertions.ts           # кастомные проверки (схема, problem-details)
  tests/
    contacts/
      get-list.spec.ts
      get-by-id.spec.ts
      create.spec.ts
      update.spec.ts
      delete.spec.ts
      crud-lifecycle.spec.ts
    contract/schema.spec.ts
```

## 5. Список задач (GitHub-ready)

Эти задачи предназначены для переноса в GitHub Issues. По мере выполнения отмечаем `[x]`.

### Фаза 0 — Каркас

- [ ] **T1** ([#61](https://github.com/askrinnik/AddressBook2025/issues/61)) Scaffold `src/ApiTests`: `package.json` (скрипты `test`, `test:report`, `test:remote`, `test:ui`, `test:debug`, `lint`, `format`), `tsconfig.json`, `eslint.config.mjs` (flat), `.prettierrc.json`, `.gitignore`, `.env.example`, README-заглушка. Создать этот файл плана в `docs/tasks/`.
- [ ] **T2** ([#58](https://github.com/askrinnik/AddressBook2025/issues/58)) Установить зависимости + `playwright.config.ts` (webServer `dotnet run` + `reuseExistingServer`, reporters `list`+`html`, `trace: on-first-retry`, `baseURL` из env).

### Фаза 1 — Инфраструктура

- [ ] **T3** ([#56](https://github.com/askrinnik/AddressBook2025/issues/56)) `config/env.ts` — zod-загрузчик окружения (`BASE_URL`, таймауты) + dotenv.
- [ ] **T4** ([#63](https://github.com/askrinnik/AddressBook2025/issues/63)) `schemas/contact.schema.ts` — zod-схемы `Contact` / `ListResponse` / `ProblemDetails`.
- [ ] **T5** ([#62](https://github.com/askrinnik/AddressBook2025/issues/62)) `clients/base-api-client.ts` + `contacts-client.ts` (5 методов, без ассертов, парсинг `Location` через `/\/Contacts\/(\d+)$/`).
- [ ] **T6** ([#57](https://github.com/askrinnik/AddressBook2025/issues/57)) `models/problem-details.ts` — порт RFC7807-хелпера (`messagesFor`, `messages`, `hasErrors`).
- [ ] **T7** ([#64](https://github.com/askrinnik/AddressBook2025/issues/64)) `data/contact.factory.ts` + `tokens.ts` — фабрики на faker + граничные варианты.
- [ ] **T8** ([#60](https://github.com/askrinnik/AddressBook2025/issues/60)) `fixtures/api.fixtures.ts` — `test.extend` (client + factory + авто-очистка созданных контактов).
- [ ] **T9** ([#59](https://github.com/askrinnik/AddressBook2025/issues/59)) `utils/assertions.ts` — хелперы проверки схем и problem-details.

### Фаза 2 — Тесты

- [ ] **T10** ([#65](https://github.com/askrinnik/AddressBook2025/issues/65)) `tests/contacts/get-list.spec.ts` — поиск, пустой результат, кодирование query, независимость от seed.
- [ ] **T11** ([#67](https://github.com/askrinnik/AddressBook2025/issues/67)) `tests/contacts/get-by-id.spec.ts` — созданный контакт, `404`, нечисловой id → `404`.
- [ ] **T12** ([#69](https://github.com/askrinnik/AddressBook2025/issues/69)) `tests/contacts/create.spec.ts` — валидный с/без birthday, границы 30/31, пусто, баг триммінга `"   "`, будущая дата → `400` + problem-details, «сегодня» → OK.
- [ ] **T13** ([#73](https://github.com/askrinnik/AddressBook2025/issues/73)) `tests/contacts/update.spec.ts` — **PUT (новое покрытие)**: полное/частичное обновление, `404`, валидация `400`, границы.
- [ ] **T14** ([#68](https://github.com/askrinnik/AddressBook2025/issues/68)) `tests/contacts/delete.spec.ts` — удаление созданного (`204`) → затем `404`, удаление неизвестного → `404`.
- [ ] **T15** ([#72](https://github.com/askrinnik/AddressBook2025/issues/72)) `tests/contacts/crud-lifecycle.spec.ts` — сквозной create → read → update → read → delete → `404`.
- [ ] **T16** ([#70](https://github.com/askrinnik/AddressBook2025/issues/70)) `tests/contract/schema.spec.ts` — валидация всех ответов против zod-схем.

### Фаза 3 — Обвязка и документация

- [ ] **T17** ([#71](https://github.com/askrinnik/AddressBook2025/issues/71)) `README.md` для `src/ApiTests`.
- [ ] **T18** ([#74](https://github.com/askrinnik/AddressBook2025/issues/74)) (опционально, с подтверждением) CI-workflow + обновление skills/instructions.
- [ ] **T19** ([#66](https://github.com/askrinnik/AddressBook2025/issues/66)) Верификация: `npm ci`, `npm run lint`, `npm test` — всё зелёное.

## 6. Что переиспользуем из `src/AutoTests`

- `ProblemDetails.ts` — уже хорошо сделанная RFC7807-модель.
- Регулярка извлечения id из заголовка `Location`.
- Пакет `http-status-codes` (константы статусов вместо магических чисел).

## 7. Верификация

1. `npm ci` в `src/ApiTests`.
2. `npm run lint` — без ошибок.
3. `npm test` (API поднимается через webServer или вручную `dotnet run --project src/AddressBook.Api`).
4. Все спеки зелёные, zod-контракты проходят.
