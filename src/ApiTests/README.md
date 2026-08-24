# AddressBook API Tests (`src/ApiTests`)

Современный фреймворк E2E API-автотестов для `AddressBook.Api` на **Playwright + TypeScript**.
Полностью покрывает пять эндпоинтов `Contacts` (GET-список, GET-по-id, POST, PUT, DELETE),
негативные сценарии, границы и contract-схемы.

> Существующий набор `src/AutoTests` не затрагивается — это независимый, заново спроектированный
> фреймворк.

## Стек

`@playwright/test` · `zod` · `@faker-js/faker` · `dotenv` · `cross-env` · `http-status-codes` ·
ESLint (flat config) + Prettier · TypeScript.

## Требования

- **Node.js** 20+ (LTS) и npm.
- **.NET 10 SDK** — Playwright сам поднимает API командой `dotnet run` (см. [webServer](#как-запускается-api)).
- **SQL Server** — доступный экземпляр для `AddressBook.Api`. База общая (не in-memory),
  миграции применяются автоматически при старте API. Тесты self-contained и не зависят от
  seed-данных, поэтому прогон на общей БД безопасен.

## Архитектура

Ключевые принципы фреймворка:

- **Self-contained данные.** Каждый тест создаёт собственные данные с уникальным run-token и
  удаляет их в teardown фикстуры. Устойчиво к общей БД и параллельному запуску.
- **Клиент без ассертов.** API-клиент возвращает типизированный `{ status, headers, body }`;
  все проверки живут в тестах, а не в клиенте.
- **Zod как источник контракта.** Zod-схемы одновременно валидируют ответы API (contract testing)
  и дают TypeScript-типы — единый источник правды, без дублирования типов.
- **Фабрики на faker.** Реалистичные данные плюс именованные граничные варианты
  (30/31 символ, будущая дата, пустые/пробельные значения).
- **webServer.** Playwright поднимает API сам и переиспользует уже запущенный локально.

## Структура каталогов

```
src/ApiTests/
  package.json  playwright.config.ts  tsconfig.json  eslint.config.mjs
  .prettierrc.json  .env.example  .gitignore  README.md
  src/
    config/     # env.ts — zod-валидация переменных окружения + dotenv
    clients/    # base-api-client.ts (тонкая обёртка) + contacts-client.ts (методы эндпоинтов)
    schemas/    # contact.schema.ts — zod: Contact, ListResponse, ProblemDetails
    models/     # problem-details.ts — RFC 7807-хелпер
    data/       # contact.factory.ts (билдеры на faker) + tokens.ts (run-token)
    fixtures/   # api.fixtures.ts — test.extend: client + factory + авто-очистка
    utils/      # assertions.ts — проверка схем и problem-details
  tests/
    contacts/   # get-list, get-by-id, create, update, delete, crud-lifecycle
    contract/   # schema.spec.ts — валидация ответов против zod-схем
```

## Конфигурация окружения

Настройки читаются из переменных окружения через zod-схему в
[`src/config/env.ts`](src/config/env.ts). Локально задаются через файл `.env.local`
(скопируйте из [`.env.example`](.env.example)):

```bash
cp .env.example .env.local
```

| Переменная | По умолчанию | Назначение |
|-----------|--------------|-----------|
| `BASE_URL` | `http://localhost:5000/api/` | База API. **Обязателен завершающий `/`** — иначе `new URL('Contacts', BASE_URL)` отбросит сегмент `/api`. |
| `API_TIMEOUT` | `30000` | Таймаут запроса/теста, мс. |
| `EXPECT_TIMEOUT` | `5000` | Таймаут `expect()`, мс. |

Порядок загрузки: в CI сначала грузится `.env.ci`, затем `.env.local` (локальный файл
переопределяет значения). Невалидная конфигурация приводит к падению с понятным сообщением.

## Быстрый старт

```bash
npm install                 # зависимости
npx playwright install      # браузерные движки Playwright (одноразово)
cp .env.example .env.local  # локальная конфигурация
npm test                    # прогон — Playwright сам поднимет API
```

## Команды

| Скрипт | Назначение |
|--------|-----------|
| `npm test` | Запуск всех API-тестов. |
| `npm run test:report` | Запуск + открыть HTML-отчёт. |
| `npm run test:remote` | Прогон против удалённого (Azure) окружения (`BASE_URL` через `cross-env`). |
| `npm run test:ui` | Playwright UI-режим (интерактивный прогон/отладка). |
| `npm run test:debug` | Пошаговая отладка (Playwright Inspector). |
| `npm run test:debug-webserver` | Прогон с диагностикой запуска API (`DEBUG=pw:webserver`). |
| `npm run lint` | ESLint (flat config). |
| `npm run format` | Prettier (форматирование). |

Запуск отдельного файла или describe-блока:

```bash
npx playwright test tests/contacts/delete.spec.ts
npx playwright test -g "route id overrides body id"
```

## Как запускается API

Тестам нужен работающий `AddressBook.Api`. Управляет этим блок `webServer` в
[`playwright.config.ts`](playwright.config.ts):

- Команда `dotnet run --project ../AddressBook.Api` поднимает API перед прогоном.
- Готовность определяется по эндпоинту `Contacts` (`readinessURL`).
- Локально `reuseExistingServer: true` — если API уже запущен на `BASE_URL`, Playwright
  переиспользует его; в CI всегда стартует свежий экземпляр.

Можно поднять API вручную и просто гонять тесты против него:

```bash
dotnet run --project ../AddressBook.Api   # в отдельном терминале
npm test
```

Против удалённого окружения (API поднимать не нужно):

```bash
npm run test:remote
```

## Соглашения

- **Изоляция и очистка.** Каждый тест создаёт данные через `contactsClient.create`; фикстура
  регистрирует созданные id и удаляет их в teardown — очистка выполняется даже при падении.
- **Run-token.** Фабрики добавляют уникальный токен в имена (см. [`src/data/tokens.ts`](src/data/tokens.ts)),
  что делает поиск и проверки независимыми от seed и безопасными при параллельном прогоне.
- **Клиент без ассертов.** `ContactsClient` возвращает сырой `{ status, headers, body }`;
  проверки статуса/данных — в тестах.
- **Контрактные схемы.** Ответы валидируются zod-схемами через `expectMatchesSchema`; строгие
  схемы ловят дрейф контракта (лишние/утёкшие поля).
- Подробнее — в [`playwright-conventions.instructions.md`](../../.github/instructions/playwright-conventions.instructions.md).

## CI

Набор прогоняется в GitHub Actions воркфлоу
[`.github/workflows/api-tests.yml`](../../.github/workflows/api-tests.yml) — на **любой push** и по
ручному запуску (`workflow_dispatch`). На `ubuntu-latest` воркфлоу:

- поднимает **SQL Server 2022** как services-контейнер;
- ставит **.NET 10 SDK** и **Node LTS**;
- `npm ci` → `npm test` в `src/ApiTests`. В CI (`process.env.CI`) `webServer` сам поднимает API
  (порт 5000), направленный на контейнер через env-оверрайды `Database__Server` / `Database__User` /
  `Database__Password`. Браузеры **не** ставятся — тесты работают через `APIRequestContext`;
- публикует HTML-репорт как artifact `api-playwright-report` (30 дней); при падении — трейсы
  (`api-test-results`).

### Настройка секрета `MSSQL_SA_PASSWORD`

Воркфлоу требует repository secret **`MSSQL_SA_PASSWORD`** — пароль SA для контейнера SQL Server
(используется и как `MSSQL_SA_PASSWORD` контейнера, и как `Database__Password` для API). Без него
прогон падает на старте SQL. Значение должно удовлетворять политике SQL Server: **≥ 8 символов** и
минимум **3 из 4** категорий (заглавная, строчная, цифра, спецсимвол).

Через веб-интерфейс:

1. Репозиторий → **Settings** → **Secrets and variables** → **Actions**.
2. Вкладка **Secrets** → **New repository secret**.
3. **Name:** `MSSQL_SA_PASSWORD`, **Secret:** надёжный пароль (см. требования выше).
4. **Add secret**.

Или через GitHub CLI (значение спросит интерактивно, не попадёт в историю оболочки):

```bash
gh secret set MSSQL_SA_PASSWORD --repo askrinnik/AddressBook2025
```

Запуск вручную:

```bash
gh workflow run api-tests.yml
```

## План

См. [docs/tasks/api-tests-framework-plan.md](../../docs/tasks/api-tests-framework-plan.md).
