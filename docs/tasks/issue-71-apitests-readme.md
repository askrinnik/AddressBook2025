# Issue #71 [ApiTests][T17] — README для `src/ApiTests`

> **Режим:** documentation. Продакшн-код и тесты не трогаем. Единственный артефакт —
> полноценный `src/ApiTests/README.md` вместо текущей заглушки.

## Требование

Заменить README-заглушку полноценной документацией, по которой новый разработчик запустит
тесты без дополнительных вопросов. Содержание: обзор архитектуры и структуры папок; требования
(Node, .NET, SQL Server); конфигурация окружения (`.env.local`, `BASE_URL`); команды запуска
(локально через webServer/`dotnet run`, remote, отчёт, UI, debug, lint, format); соглашения
(self-contained данные, клиент без ассертов, zod-контракты).

## Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | Обзор архитектуры и структуры каталогов `src/` и `tests/`. |
| A2 | Требования: Node.js, .NET 10 SDK, доступный SQL Server (общая БД). |
| A3 | Конфигурация окружения: `.env.local` из `.env.example`, переменные `BASE_URL` (с завершающим `/`), `API_TIMEOUT`, `EXPECT_TIMEOUT`; порядок загрузки `.env.ci` → `.env.local`. |
| A4 | Команды запуска: `test`, `test:report`, `test:remote`, `test:ui`, `test:debug`, `test:debug-webserver`, `lint`, `format` — с описанием. |
| A5 | Объяснение webServer: Playwright сам поднимает `dotnet run --project ../AddressBook.Api`, `reuseExistingServer` локально; readiness по `Contacts`. |
| A6 | Соглашения: self-contained данные + очистка в teardown, клиент без ассертов, zod как источник контракта, фабрики на faker, run-token для изоляции. |
| A7 | Новый разработчик может запустить тесты по README без дополнительных вопросов (проверяется прогоном по инструкции). |

## Факты (основание, сверено с кодом)

- **Скрипты** (`package.json`): `test`, `test:report`, `test:remote` (Azure `BASE_URL` через `cross-env`),
  `test:ui`, `test:debug`, `test:debug-webserver` (`DEBUG=pw:webserver`), `lint`, `format`.
- **Окружение** (`config/env.ts`): zod-схема; `BASE_URL` по умолчанию `http://localhost:5000/api/`
  (обязателен завершающий `/`), `API_TIMEOUT=30000`, `EXPECT_TIMEOUT=5000`; в CI грузится `.env.ci`,
  затем `.env.local` (локальный переопределяет).
- **webServer** (`playwright.config.ts`): `command: dotnet run --project ../AddressBook.Api`,
  readiness URL = `Contacts`, `reuseExistingServer: !CI`, `timeout 120s`; один проект `api`
  (браузер не нужен), `fullyParallel`, reporters `list`+`html`, `trace: on-first-retry`.
- **Структура** `src/`: `clients/`, `config/`, `data/`, `fixtures/`, `models/`, `schemas/`, `utils/`;
  `tests/contacts/` (get-list, get-by-id, create, update, delete, crud-lifecycle) и `tests/contract/`.
- **Стек**: `@playwright/test`, `zod`, `@faker-js/faker`, `dotenv`, `cross-env`, `http-status-codes`,
  ESLint (flat) + Prettier, TypeScript.

## Затрагиваемые файлы

- **Обновляется:** `src/ApiTests/README.md` — заглушка → полноценная документация.
- **Обновляется:** `docs/tasks/api-tests-framework-plan.md` — отметить `T17` как `[x]`.
- Продакшн-код, тесты и конфигурация **не меняются**.

## Структура README (черновик разделов)

1. Заголовок + краткое назначение (E2E API-тесты для `AddressBook.Api`, `src/AutoTests` не затрагивается).
2. **Требования** — Node.js, .NET 10 SDK, SQL Server (общая БД, авто-миграция при старте API).
3. **Архитектура** — принципы: self-contained данные, клиент без ассертов, zod-контракты, фабрики.
4. **Структура каталогов** — дерево `src/` и `tests/` с однострочным описанием.
5. **Конфигурация окружения** — `.env.example` → `.env.local`, таблица переменных, `.env.ci`/CI.
6. **Быстрый старт** — `npm install`, `npx playwright install`, копирование env, `npm test`.
7. **Команды** — таблица всех скриптов.
8. **Как запускается API** — webServer/`reuseExistingServer`, ручной `dotnet run`, remote-прогон.
9. **Соглашения** — изоляция, teardown, run-token, контрактные схемы; ссылки на инструкции/план.

## Tests

Тестов не добавляется: задача документационная, поведение и инфраструктура не меняются. Проверка
критериев — фактическим прогоном по инструкции README (A7): `npm test` поднимает API и проходит.

## Вне зоны действия

- Изменение скриптов, конфигурации, тестов или продакшн-кода.
- CI-workflow (`T18`, #74) — отдельная задача.

## Верификация

- Следовать README «с нуля»: `.env.local` из примера → `npm test` (Playwright сам поднимает API) —
  сьют зелёный, что подтверждает A7.
- `npm run lint` в `src/ApiTests` — без замечаний (README не влияет на линт TS, но прогоняем для чистоты).
- Ручная сверка каждого пункта содержания (A1–A6) с готовым README.
