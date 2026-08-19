# AddressBook UI Tests (`src/UiTests`)

Современный фреймворк UI/E2E-автотестов для `AddressBook.Web` (Blazor WebAssembly + MudBlazor)
на **Playwright + TypeScript**. Архитектура — **гибридный E2E**: подготовка и очистка данных
выполняются быстро через REST API, а проверки — через реальный UI в браузере.

> Существующие наборы `src/ApiTests` и `src/AutoTests` не затрагиваются — это независимый,
> заново проектируемый фреймворк.

## Статус

🚧 **Каркас (Фаза 0).** Сейчас в проекте только тулинг-скелет: `package.json`, `tsconfig.json`,
ESLint (flat) + Prettier, `.gitignore`, `.env.example`. Конфигурация Playwright
(`playwright.config.ts`), установка зависимостей и браузеров, инфраструктура и сами тесты
добавляются в следующих задачах. Пока `npm test` запускать нечего.

Полный дизайн, структура каталогов и список задач — в плане
[docs/tasks/ui-tests-framework-plan.md](../../docs/tasks/ui-tests-framework-plan.md).

## Стек

`@playwright/test` · `zod` · `@faker-js/faker` · `dotenv` · `cross-env` ·
`@axe-core/playwright` (опц.) · ESLint (flat config) + Prettier · TypeScript.

## Скрипты npm

| Скрипт | Назначение |
|---|---|
| `npm test` | прогон всех тестов (`playwright test`) |
| `npm run test:report` | прогон + открыть HTML-репорт |
| `npm run test:ui` | интерактивный UI-режим Playwright |
| `npm run test:debug` | пошаговая отладка (`--debug`) |
| `npm run test:headed` | прогон в видимом браузере (`--headed`) |
| `npm run test:remote` | прогон против развёрнутого Web-приложения (Azure Static Web Apps) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Конфигурация окружения

Переменные окружения описаны в [`.env.example`](.env.example) (`BASE_URL`, `API_URL`,
`HEADLESS`, таймауты). Для локального запуска скопируйте его в `.env.local` и при необходимости
измените значения. Схема окружения формализуется в задаче U3.

## Предпосылки

- **Node.js** 20+ (LTS) и npm.
- **.NET 10 SDK** и доступный **SQL Server** — для локального запуска `AddressBook.Api` и
  `AddressBook.Web`. UI-тесты требуют живого API (без него таблица контактов показывает ошибку).
