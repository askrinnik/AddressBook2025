# AddressBook API Tests (`src/ApiTests`)

Современный фреймворк API-автотестов для `AddressBook.Api` на **Playwright + TypeScript**.

> Заглушка. Полное описание появится в задаче **T17** ([#71](https://github.com/askrinnik/AddressBook2025/issues/71)).
> Существующий набор `src/AutoTests` не затрагивается.

## Стек

`@playwright/test` · `zod` · `@faker-js/faker` · `dotenv` · `cross-env` · `http-status-codes` · ESLint (flat) + Prettier · TypeScript.

## Быстрый старт

```bash
npm install            # T2: установка зависимостей + браузеров Playwright
cp .env.example .env.local
npm test               # запуск API-тестов
```

## Команды

| Скрипт | Назначение |
|--------|-----------|
| `npm test` | Запуск всех API-тестов. |
| `npm run test:report` | Запуск + открыть HTML-отчёт. |
| `npm run test:remote` | Прогон против удалённого (Azure) окружения. |
| `npm run test:ui` | Playwright UI-режим. |
| `npm run test:debug` | Пошаговая отладка. |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier. |

## План

См. [docs/tasks/api-tests-framework-plan.md](../../docs/tasks/api-tests-framework-plan.md).
