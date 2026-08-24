# План: Issue #110 — README.md для `src/UiTests` (U19)

> **Тип:** документация (Фаза 3). Production-код и тесты не трогаем.
> **Deliverable:** переписанный [`src/UiTests/README.md`](../../src/UiTests/README.md) —
> запуск, env, предпосылки (живые API+Web), отладка.

## Требование

Issue #110 (U19): «`README.md` для `src/UiTests` (запуск, env, предпосылки: живые API+Web,
отладка)». Текущий README — заглушка со статусом «🚧 Каркас (Фаза 0)», которая устарела: весь
фреймворк (Фазы 0–2 + U18 a11y) уже реализован. README нужно привести в соответствие с
готовым кодом и раскрыть четыре темы из заголовка задачи.

## Acceptance criteria

| # | Критерий |
|---|---|
| 1 | Убран устаревший статус «Каркас (Фаза 0)»; README описывает готовый фреймворк. |
| 2 | **Запуск:** быстрый старт (`npm install` → `npx playwright install` → `.env.local` → `npm test`) и таблица всех npm-скриптов из `package.json`. |
| 3 | **Env:** таблица всех переменных (`BASE_URL`, `API_URL`, `HEADLESS`, `EXPECT_TIMEOUT`, `ACTION_TIMEOUT`, `NAVIGATION_TIMEOUT`) с дефолтами и назначением; порядок загрузки `.env.ci` → `.env.local`; требование завершающего `/`. |
| 4 | **Предпосылки:** Node 20+, .NET 10 SDK, доступный SQL Server; **живые API + Web** обязательны (без API таблица контактов показывает ошибку). Объяснено, как `webServer` поднимает оба сервера и `reuseExistingServer` локально. |
| 5 | **Отладка:** `test:ui`, `test:debug`, `test:headed`, HTML-репорт (`test:report`), артефакты диагностики (trace on-first-retry, screenshot only-on-failure, video retain-on-failure), запуск одного файла/`-g`. |
| 6 | Описаны структура каталогов и ключевые соглашения (гибридный E2E, POM-фикстуры, `data-testid`, web-first assertions), со ссылками на план, conventions-инструкцию и `.env.example`. |
| 7 | Все команды, пути, переменные и порты соответствуют реальным файлам (`package.json`, `playwright.config.ts`, `env.ts`, `.env.example`). |

## Подход

Один файл — `src/UiTests/README.md`. Пишем на русском (консистентно с
[`src/ApiTests/README.md`](../../src/ApiTests/README.md) и планом фреймворка), по его структуре,
но с UI-спецификой. Разделы:

1. Заголовок + краткое описание (гибридный E2E, Blazor WASM + MudBlazor).
2. **Требования** (Node 20+, .NET 10 SDK, SQL Server).
3. **Архитектура** — ключевые принципы (fixture-composed POM, component objects для MudBlazor,
   гибридный seed через API, `data-testid`, web-first assertions).
4. **Структура каталогов** — по факту дерева `src/` и `tests/`.
5. **Конфигурация окружения** — таблица переменных, порядок загрузки, `.env.example`.
6. **Быстрый старт** — команды по шагам.
7. **Команды** — таблица npm-скриптов.
8. **Как поднимаются API и Web** — блок `webServer`, `reuseExistingServer`, ручной запуск,
   зависимость UI от живого API.
9. **Отладка** — UI-режим, Inspector, headed, HTML-репорт, артефакты, запуск подмножества.
10. **Соглашения** + ссылки (план, `playwright-conventions`, `CLAUDE.md`).

## Tests

Нет. Это документация — нового или изменённого API-поведения нет, Playwright-тесты не
добавляются и не меняются (обоснование по workflow: «pure doc change, no API change»).
Проверка — сверка каждого факта README с исходниками и (по возможности) прогон
задокументированных команд.

## Вне scope

- U20 (#111) — CI-workflow.
- U21 (#112) — финальная верификация `npm ci` / `lint` / `test`.
- Правки production-кода или спеков.
