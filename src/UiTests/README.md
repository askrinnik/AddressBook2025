# AddressBook UI Tests (`src/UiTests`)

Современный фреймворк UI/E2E-автотестов для `AddressBook.Web` (Blazor WebAssembly + MudBlazor)
на **Playwright + TypeScript**. Покрывает пользовательские сценарии всех страниц (`/`,
`/contacts`, `/create-contact`, `/edit-contact/{id}`): навигацию и оболочку приложения, поиск,
сортировку, пагинацию, CRUD через UI, клиентскую и серверную валидацию, диалог удаления и
(опционально) a11y-проверки.

Архитектура — **гибридный E2E**: подготовка и очистка данных выполняются быстро через REST API
(переиспользуем подходы из `src/ApiTests`), а проверки — через реальный UI в браузере. Это
делает тесты быстрыми, изолированными и устойчивыми к общей БД.

> Существующие наборы `src/ApiTests` и `src/AutoTests` не затрагиваются — это независимый,
> заново спроектированный фреймворк.

## Требования

- **Node.js** 20+ (LTS) и npm.
- **.NET 10 SDK** — Playwright сам поднимает и API, и Web командами `dotnet run`
  (см. [Как поднимаются API и Web](#как-поднимаются-api-и-web)).
- **Доступный SQL Server** — для `AddressBook.Api`. База общая (не in-memory), миграции
  применяются автоматически при старте API. Тесты self-contained (уникальный run-token +
  teardown), поэтому прогон на общей БД безопасен.
- **Браузерные движки Playwright** — ставятся один раз через `npx playwright install`
  (по умолчанию используется только `chromium`).

> **Живые API + Web обязательны.** Это UI-тесты в реальном браузере: страница `/contacts`
> грузит данные из API, и без запущенного `AddressBook.Api` таблица показывает ошибку
> «An unhandled error has occurred». Оба сервера поднимаются автоматически (`webServer`) либо
> вручную — см. ниже.

## Архитектура

Ключевые принципы фреймворка:

- **Fixture-composed Page Object Model.** Тонкие page- и component-объекты инжектируются в тест
  через `test.extend`-фикстуры ([`src/fixtures/test-fixtures.ts`](src/fixtures/test-fixtures.ts));
  тест объявляет нужные фикстуры в сигнатуре и не создаёт объекты вручную. Локаторы ленивые
  (`getByRole(...)`), без хранения «сырых» селекторов.
- **Component objects для MudBlazor.** Отдельные обёртки для нетривиальных виджетов:
  `contacts-table` (server-reload), `date-picker` (popover-календарь), `confirm-dialog`
  (`MudMessageBox` удаления), `contact-form`, `app-shell` (AppBar/drawer/тема). Хрупкость
  Material-разметки изолирована в одном месте.
- **Гибридная подготовка данных через API.** Фикстура `contactsApi`
  ([`src/api/contacts-api.ts`](src/api/contacts-api.ts)) использует Playwright `APIRequestContext`
  для create/delete контактов напрямую в API — быстро и без UI. Созданные через фикстуру
  контакты удаляются автоматически в teardown.
- **Self-contained данные + уникальные токены.** Каждый тест создаёт контакты с уникальным
  run-token (см. [`src/data/tokens.ts`](src/data/tokens.ts)) и удаляет их. Поиск по токену
  изолирует тест от seed-данных и параллельных прогонов на общей БД.
- **Web-first assertions.** Только авто-ожидающие `expect(locator)` / `expect.poll`; никаких
  `waitForTimeout`. Учитывается специфика Blazor WASM (первичная загрузка `.wasm`) и
  `MudTable.ReloadServerData()`.
- **Стабильные селекторы через `data-testid`.** Иконочные кнопки Edit/Delete MudBlazor
  рендерит без доступного имени, поэтому в Web-проект добавлены ненавязчивые `data-testid`
  (через `UserAttributes`). Приоритет локаторов: `getByRole`/`getByLabel` →
  `getByTestId` ([`src/utils/testids.ts`](src/utils/testids.ts)) → CSS как крайний случай.
- **Артефакты диагностики.** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'`, HTML-репортёр.

## Структура каталогов

```
src/UiTests/
  package.json  playwright.config.ts  tsconfig.json  eslint.config.mjs
  .prettierrc.json  .env.example  .gitignore  README.md  CLAUDE.md
  src/
    config/     # env.ts — zod-валидация переменных окружения + dotenv
    api/        # contacts-api.ts — seed/cleanup контактов через APIRequestContext
    data/       # contact.factory.ts (билдеры на faker) + tokens.ts (run-token)
    components/ # app-shell, contacts-table, contact-form, date-picker, confirm-dialog
    pages/      # base, home, contacts, create-contact, edit-contact
    fixtures/   # test-fixtures.ts — test.extend: страницы + компоненты + contactsApi + data
    utils/      # testids.ts, assertions.ts (доменные проверки), blazor.ts (готовность WASM)
  tests/
    smoke/      # app-shell — загрузка, навигация Home/Contacts, тема, drawer
    contacts/   # list-search, sort-paginate, create, edit, edit-not-found, delete,
                #   validation, crud-lifecycle
    a11y/       # accessibility — @axe-core/playwright (опц.)
    fixtures/   # test-fixtures.spec.ts — самопроверка фикстур
    utils/      # assertions.spec.ts — самопроверка доменных ассертов
```

## Конфигурация окружения

Настройки читаются из переменных окружения через zod-схему в
[`src/config/env.ts`](src/config/env.ts). Локально задаются через файл `.env.local`
(скопируйте из [`.env.example`](.env.example)):

```bash
cp .env.example .env.local
```

| Переменная           | По умолчанию                 | Назначение                                                                                                                                                        |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BASE_URL`           | `https://localhost:7187/`    | Адрес Web-приложения под тестом (Blazor WASM, профиль `https`). **Обязателен завершающий `/`.**                                                                   |
| `API_URL`            | `http://localhost:5000/api/` | API для гибридного seed/cleanup и readiness-проба для `webServer`. **Обязателен завершающий `/`** — иначе `new URL('Contacts', API_URL)` отбросит сегмент `/api`. |
| `HEADLESS`           | `true`                       | Браузер без окна (`true`) или с окном (`false`).                                                                                                                  |
| `EXPECT_TIMEOUT`     | `10000`                      | Таймаут `expect()`, мс.                                                                                                                                           |
| `ACTION_TIMEOUT`     | `15000`                      | Таймаут одного действия, мс.                                                                                                                                      |
| `NAVIGATION_TIMEOUT` | `30000`                      | Таймаут навигации, мс (первая загрузка Blazor WASM бывает медленной).                                                                                             |

Порядок загрузки: в CI сначала грузится `.env.ci`, затем `.env.local` (локальный файл
переопределяет значения). Все переменные имеют дефолты, так что `.env.local` не обязателен для
стандартного локального запуска. Невалидная конфигурация приводит к падению с понятным
сообщением.

## Быстрый старт

```bash
npm install                 # зависимости
npx playwright install      # браузерные движки Playwright (одноразово)
cp .env.example .env.local  # локальная конфигурация (опционально — есть дефолты)
npm test                    # прогон — Playwright сам поднимет API и Web
```

## Команды

| Скрипт                | Назначение                                                         |
| --------------------- | ------------------------------------------------------------------ |
| `npm test`            | Запуск всех UI-тестов (`playwright test`).                         |
| `npm run test:report` | Прогон + открыть HTML-отчёт.                                       |
| `npm run test:ui`     | Playwright UI-режим (интерактивный прогон/отладка).                |
| `npm run test:debug`  | Пошаговая отладка (Playwright Inspector).                          |
| `npm run test:headed` | Прогон в видимом окне браузера.                                    |
| `npm run test:remote` | Прогон против развёрнутого Web-приложения (Azure Static Web Apps). |
| `npm run lint`        | ESLint (flat config).                                              |
| `npm run format`      | Prettier (форматирование).                                         |

Запуск отдельного файла или подмножества по имени:

```bash
npx playwright test tests/contacts/delete.spec.ts
npx playwright test -g "keeps the contact"
npx playwright test tests/smoke              # только smoke-набор
```

## Как поднимаются API и Web

UI-тестам нужны работающие `AddressBook.Api` **и** `AddressBook.Web`. Управляет этим массив
`webServer` в [`playwright.config.ts`](playwright.config.ts):

- Первым стартует API: `dotnet run --project ../AddressBook.Api`. Готовность определяется по
  эндпоинту `Contacts` (readiness-URL на базе `API_URL`).
- Затем стартует Web: `dotnet run --project ../AddressBook.Web --launch-profile https`
  (профиль `https` → `https://localhost:7187/`). Dev-конфиг Web указывает `API_Prefix` на
  `http://localhost:5000/api/`.
- `ignoreHTTPSErrors: true` — для самоподписанного TLS на `localhost:7187`.
- Локально `reuseExistingServer: true` — если серверы уже запущены, Playwright их переиспользует;
  в CI (`process.env.CI`) всегда стартуют свежие экземпляры.

Можно поднять серверы вручную и просто гонять тесты против них:

```bash
dotnet run --project ../AddressBook.Api                          # терминал 1
dotnet run --project ../AddressBook.Web --launch-profile https   # терминал 2
npm test                                                          # терминал 3
```

Против удалённого окружения (локально API/Web поднимать не нужно):

```bash
npm run test:remote
```

> `test:remote` переопределяет только `BASE_URL` (Azure-хостинг Web-приложения). Гибридный
> seed/cleanup по-прежнему обращается к `API_URL`, поэтому для полностью удалённого прогона
> задайте и `API_URL` на соответствующий backend (например, в `.env.local`).

## Отладка

- **UI-режим** — `npm run test:ui`: интерактивный запуск, тайм-тревел, watch, просмотр
  локаторов и шагов.
- **Inspector** — `npm run test:debug`: пошаговое выполнение с подсветкой локаторов.
- **Видимый браузер** — `npm run test:headed` (или `HEADLESS=false` в `.env.local`).
- **HTML-отчёт** — `npm run test:report`, либо `npx playwright show-report` после прогона.
- **Артефакты при падении** собираются в `test-results/` (см. `use` в конфиге):
  - `trace` — на первой повторной попытке; открыть: `npx playwright show-trace <trace.zip>`.
  - `screenshot` — только при падении.
  - `video` — сохраняется при падении.
- **Диагностика запуска серверов** — `DEBUG=pw:webserver npx playwright test` покажет вывод
  `dotnet run` при старте API/Web.
- **Параллелизм и повторы** (см. [`playwright.config.ts`](playwright.config.ts)): локально
  `workers: 4`, `retries: 1`; в CI `workers: 1`, `retries: 2`. Один локальный retry
  «залечивает» редкий промах холодного старта Blazor WASM (см. [#138](https://github.com/askrinnik/AddressBook2025/issues/138)).
  При отладке гонок бывает полезно сузить параллелизм: `npx playwright test --workers=1`.

## Соглашения

- **Изоляция и очистка.** Данные создаются через `contactsApi`; фикстура удаляет их в teardown —
  даже при падении. Контакт, созданный **через UI**, не отслеживается автоматически: найдите его
  id через `contactsApi.getFilteredContacts(token)` и удалите в `finally`.
- **Фабрики.** Данные строятся только через `ContactFactory`; для поиск-изолированных контактов —
  `ContactFactory.tokenized(token, overrides?)`. Без per-spec билдеров.
- **Локаторы.** `getByRole`/`getByLabel` → `getByTestId` ([`src/utils/testids.ts`](src/utils/testids.ts))
  → CSS в крайнем случае.
- **Даты.** Проверяйте против `yyyy-MM-dd`-значения API, а не против culture-форматированной
  ячейки таблицы.
- Полные правила — в [`playwright-conventions.instructions.md`](../../.github/instructions/playwright-conventions.instructions.md)
  (раздел **UI E2E tests (`src/UiTests`)**) и в [`CLAUDE.md`](CLAUDE.md).

## План

Полный дизайн, архитектурные решения и список задач —
[docs/tasks/ui-tests-framework-plan.md](../../docs/tasks/ui-tests-framework-plan.md).
