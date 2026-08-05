# Issue #58 — [ApiTests][T2] Зависимости и `playwright.config.ts`

> **Режим:** test-authoring / инфраструктура фреймворка (метки `api`, `testing`).
> Production-код `AddressBook.Api` / `AddressBook.Web` **не трогаем**.
> **Родительский план:** [docs/tasks/api-tests-framework-plan.md](api-tests-framework-plan.md) — задача **T2**.

## 1. Требование

Установить зависимости фреймворка API-тестов `src/ApiTests` и настроить конфигурацию Playwright,
чтобы каркас (T1) стал запускаемым: генерируется lockfile, ставятся браузеры, а
`playwright test --list` отрабатывает без ошибок конфигурации.

## 2. Критерии приёмки

| # | Критерий | Как проверяется |
|---|----------|-----------------|
| A1 | `npm ci` проходит без ошибок | Сгенерировать `package-lock.json` через `npm install`, затем прогнать `npm ci` в `src/ApiTests`. |
| A2 | `npx playwright test --list` выполняется без ошибок конфигурации | Запустить в `src/ApiTests`; команда завершается кодом 0 (пустой список тестов допустим — спеки появятся в T10–T16). |
| A3 | `playwright.config.ts` соответствует ТЗ issue | `testDir: ./tests`, проект `api` без браузерных движков, `reporter: [['list'], ['html']]`, `trace: 'on-first-retry'`, `webServer` (`dotnet run --project ../AddressBook.Api`, `reuseExistingServer: !process.env.CI`), `use.baseURL` из env. |
| A4 | `npm run lint` не ломается на новом конфиге | ESLint (flat) отрабатывает без ошибок на `playwright.config.ts`. |

## 3. Затрагиваемые файлы

| Файл | Изменение |
|------|-----------|
| `src/ApiTests/package-lock.json` | **Новый** — создаётся `npm install` (фиксация версий зависимостей из `package.json`). |
| `src/ApiTests/playwright.config.ts` | **Новый** — конфигурация Playwright по ТЗ. |
| `docs/tasks/api-tests-framework-plan.md` | Отметить **T2** как выполненную (`[x]`) после верификации. |

Зависимости уже объявлены в `package.json` (T1): `@playwright/test`, `zod`, `@faker-js/faker`,
`dotenv`, `cross-env`, `http-status-codes`, ESLint/Prettier-стек, `typescript`, `@types/node`.
Добавлять новые пакеты не планируется — только установить существующие.

## 4. Подход

Порядок: **зависимости → конфигурация → верификация**.

1. **Зависимости.** `npm install` в `src/ApiTests` → создаёт `package-lock.json` и `node_modules`.
   Затем `npx playwright install` (только браузеры не нужны для API-проекта без движков, но CLI
   Playwright требуется; ставится вместе с `@playwright/test`). Браузерные бинарники для чисто
   HTTP-тестов не требуются, поэтому `playwright install` не запускаем без необходимости.
2. **`playwright.config.ts`.** Создать по образцу `src/AutoTests/playwright.config.ts`, но с
   активированными `webServer`, `baseURL` из env, двумя репортерами и загрузкой `.env.local`
   через `dotenv`. Ключевые решения:
   - `testDir: './tests'`.
   - `projects: [{ name: 'api' }]` — без `use: { browserName }`, движки не нужны.
   - `reporter: [['list'], ['html']]`.
   - `use: { baseURL: process.env.BASE_URL, trace: 'on-first-retry' }`.
   - `webServer: { command: 'dotnet run --project ../AddressBook.Api', url: <health/base>, reuseExistingServer: !process.env.CI, timeout: … }`.
   - `fullyParallel: true`, `forbidOnly: !!process.env.CI`, `retries: CI ? 2 : 0`.
   - `dotenv.config` для `.env.local` (значения по умолчанию из `.env.example`).
3. **Верификация.** `npm ci`, `npm run lint`, `npx playwright test --list`.

### Решение по `webServer.url`

Playwright `webServer` требует `url` **или** `port` для проверки готовности сервера. API отдаёт
Swagger на корне и `api/Contacts` — используем `http://localhost:5000/api/Contacts` (или значение,
производное от `BASE_URL`) как readiness-проверку. Уточню в реализации: `webServer.url` должен
указывать на реально отвечающий GET-эндпоинт (список контактов возвращает `200`).

## 5. Tests (Playwright E2E)

Новых спеков в рамках T2 **нет** — это инфраструктурная задача. Тестовые сценарии добавляются
отдельными задачами T10–T16. Обоснование: T2 не меняет поведение API и не добавляет тестируемой
логики; критерий A2 (`--list` без ошибок) проверяет, что конфигурация корректна на пустом наборе.

## 6. Вне объёма

- Написание самих спеков (`tests/contacts/*.spec.ts`) — T10–T16.
- `config/env.ts` (zod-загрузчик окружения) — T3.
- Клиенты, схемы, фабрики, фикстуры — T4–T9.
- CI-workflow — T18.

## 7. Верификация

1. `npm install` в `src/ApiTests` → появляется `package-lock.json`.
2. `npm ci` — успешно (A1).
3. `npm run lint` — без ошибок (A4).
4. `npx playwright test --list` — код возврата 0, ошибок конфигурации нет (A2, A3).
