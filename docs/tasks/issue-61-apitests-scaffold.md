# Issue #61 — [ApiTests][T1] Scaffold проекта `src/ApiTests`

## Требование

Создать каркас нового фреймворка API-автотестов в папке `src/ApiTests`
(существующий `src/AutoTests` не трогаем). Это задача **T1 / Фаза 0** из
[docs/tasks/api-tests-framework-plan.md](api-tests-framework-plan.md).

**Режим:** test-authoring / scaffold. Продакшн-код не затрагивается; спеки и
инфраструктура тестов (клиенты, схемы, фикстуры) — предмет последующих задач
T2–T16, здесь **не** создаются.

## Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | `package.json` содержит скрипты `test`, `test:report`, `test:remote`, `test:ui`, `test:debug`, `lint`, `format` и devDependencies из стека плана. |
| A2 | `tsconfig.json` — `strict: true`, `target: ESNext`. |
| A3 | `eslint.config.mjs` — flat config (по образцу `src/AutoTests`). |
| A4 | `.prettierrc.json` присутствует. |
| A5 | `.gitignore` игнорирует `node_modules`, `playwright-report`, `test-results`, `.env.local`. |
| A6 | `.env.example` содержит `BASE_URL` и прочие переменные окружения. |
| A7 | README-заглушка присутствует. |
| A8 | Структура папок соответствует разделу «Структура каталогов» плана. |
| A9 | Проект открывается без ошибок конфигурации (JSON/TS/ESLint валидны). |
| A10 | Задача **T1** отмечена `[x]` в разделе «Список задач» файла плана. |

## Затрагиваемые файлы (все — новые, под `src/ApiTests/`)

- `package.json` — метаданные, скрипты (A1), devDependencies по стеку п.2 плана
  (`@playwright/test`, `zod`, `@faker-js/faker`, `dotenv`, `cross-env`,
  `http-status-codes`, ESLint/Prettier/TypeScript). Тип `module` (ESM) для flat
  ESLint config и ESNext.
- `tsconfig.json` — `strict`, `target: ESNext`, `module: NodeNext`,
  `moduleResolution: NodeNext`, `types: [node, @playwright/test]` (A2).
- `eslint.config.mjs` — flat config, портирован из `src/AutoTests` (A3).
- `.prettierrc.json` — базовые правила Prettier + `prettier-plugin-organize-imports` (A4).
- `.gitignore` — `node_modules`, `playwright-report`, `test-results`, `.env.local`,
  `/playwright/.cache/` (A5).
- `.env.example` — `BASE_URL`, `API_TIMEOUT`, `EXPECT_TIMEOUT` (A6).
- `README.md` — заглушка: назначение, стек, команды, ссылка на план (A7).
- Каталоги-заглушки для структуры (A8): чтобы пустые директории отслеживались
  git, кладём `.gitkeep` в
  `src/config/`, `src/clients/`, `src/schemas/`, `src/models/`, `src/data/`,
  `src/fixtures/`, `src/utils/`, `tests/contacts/`, `tests/contract/`.

## Подход

Порядок «domain → data → contracts → API → Web → tests» здесь не применим —
это чисто инфраструктурный scaffold. Шаги:

1. Создать конфигурационные файлы уровня проекта (A1–A7).
2. Создать дерево каталогов из раздела «Структура каталогов» через `.gitkeep` (A8).
3. Отметить T1 как выполненную в плане (A10).

Файлы, закреплённые за другими задачами, здесь **не** создаём:
`playwright.config.ts` (T2), `src/**/*.ts` (T3–T9), `tests/**/*.spec.ts` (T10–T16).
Скрипты в `package.json` ссылаются на Playwright, который доступен после
`npm install` в рамках T2 — это ожидаемо для scaffold.

## Tests

Новых Playwright-спеков в этой задаче **нет** и не требуется: T1 — только
scaffold конфигурации, никакого API-поведения не добавляется и не меняется.
Написание спеков закреплено за задачами T10–T16. Верификация scaffold —
статическая: валидность JSON/TS/ESLint-конфигов и соответствие структуры плану.

## Вне области (out of scope)

- `playwright.config.ts` и установка зависимостей — **T2** (#58).
- Инфраструктура тестов (`config`, `clients`, `schemas`, `models`, `data`,
  `fixtures`, `utils`) — **T3–T9**.
- Сами спеки — **T10–T16**.
- CI-workflow — **T18**.

## Верификация приёмки

| # | Как проверяется |
|---|-----------------|
| A1–A7 | Просмотр созданных файлов; `dotnet build` не затрагивается. |
| A8 | Дерево каталогов `src/ApiTests/` совпадает с планом. |
| A9 | JSON-файлы валидны; `tsconfig`/eslint без синтаксических ошибок. |
| A10 | Чекбокс T1 в плане = `[x]`. |
