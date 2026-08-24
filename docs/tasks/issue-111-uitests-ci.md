# План: Issue #111 — CI-workflow для UI и API тестов (U20)

> **Тип:** инфраструктура CI + документация (Фаза 3, опционально). Production-код и Playwright-спеки не трогаем.
> **Deliverables:**
> - новый workflow `.github/workflows/ui-tests.yml` (UI E2E, `src/UiTests`);
> - новый workflow `.github/workflows/api-tests.yml` (API E2E, `src/ApiTests`);
> - удаление устаревшего `.github/workflows/playwright.yml` (гонял legacy `src/AutoTests`, reference-only);
> - обновление документации.
>
> **Расширение scope (согласовано):** изначально U20 — только UI-workflow. По решению владельца в
> рамках этой же задачи наводим порядок в CI тестов целиком: раз всё теперь исполняется внутри
> GitHub-инфраструктуры, устаревший `playwright.yml` (запуск против внешнего сервера) удаляем и
> заводим по независимому workflow на каждый актуальный набор (UI, API), с заделом на будущие.

## Требование

Issue #111 (U20): CI-workflow, который поднимает **API + Web**, ставит браузеры
(`npx playwright install --with-deps`), прогоняет UI E2E-набор `src/UiTests` и публикует
HTML-репорт. Плюс «обновление skills/instructions» — привести документацию в соответствие.

## Ключевая сложность (почему workflow нетривиален)

UI-тесты требуют **живого API**, а API требует **SQL Server**. На Linux-раннере:

1. **SQL Server** поднимается как services-контейнер `mcr.microsoft.com/mssql/server:2022-latest`.
2. **API по умолчанию стартует в Development** (первый профиль `http` в `launchSettings.json` →
   `ASPNETCORE_ENVIRONMENT=Development`, порт 5000). В Development строка подключения указывает на
   `localhost\SQLEXPRESS` + `sa/MetraTech1` — на Linux не работает. Поэтому в CI **переопределяем
   через env-переменные** (у env высший приоритет над JSON): `Database__Server=localhost,1433`,
   `Database__User=sa`, `Database__Password=<SA_PASSWORD>`. Код в
   [`StartupExtensions.cs`](../../src/AddressBook.Api/DataAccess/StartupExtensions.cs) при непустых
   `Database:User/Password` ставит `IntegratedSecurity=false` → SQL-аутентификация. `DefaultConnection`
   уже содержит `TrustServerCertificate=True` (самоподписанный TLS контейнера) и `Database=AddressBook`.
   Миграции применяются на старте (`Database.Migrate()`), БД создаётся сама.
3. **Web стартует по профилю `https`** (`https://localhost:7187`). Kestrel на Linux требует dev-cert →
   шаг `dotnet dev-certs https`. Тесты уже с `ignoreHTTPSErrors: true`.
4. В CI (`process.env.CI`) `playwright.config.ts` сам поднимает оба сервера (`reuseExistingServer:false`,
   `workers:1`, `retries:2`) через блок `webServer` — воркфлоу лишь запускает `npm test`.

## Acceptance criteria

| # | Критерий |
|---|---|
| 1 | Есть workflow `ui-tests.yml`, поднимающий SQL Server, .NET 10 SDK, Node LTS, HTTPS dev-cert. |
| 2 | UI: ставятся зависимости (`npm ci`) и браузеры (`npx playwright install --with-deps`) в `src/UiTests`; `npm test` поднимает API+Web через `webServer` и гоняет UI E2E-набор. |
| 3 | Есть независимый workflow `api-tests.yml`, поднимающий SQL Server + .NET 10 + Node LTS; `npm ci` + `npm test` в `src/ApiTests` (API поднимается через `webServer`, браузеры **не** нужны — `APIRequestContext`). |
| 4 | Устаревший `playwright.yml` удалён. |
| 5 | Оба workflow публикуют HTML-репорт как artifact; трейсы (и видео для UI) — при падении. Имена артефактов не конфликтуют. |
| 6 | YAML обоих workflow валиден; все пути, порты и команды соответствуют реальным файлам. |
| 7 | Документация обновлена: `Architecture.md` (дерево workflow + раздел CI/CD), `src/UiTests/README.md` и `src/ApiTests/README.md` (разделы CI), чек-бокс U20 в плане фреймворка. |

## Подход

### 1. Workflow `.github/workflows/ui-tests.yml`

- **Trigger (согласовано):**
  - `push` — на **любой** пуш в репозиторий (без фильтра веток, как в
    [`build.yml`](../../.github/workflows/build.yml) `on: push`);
  - `workflow_dispatch` — ручной запуск из Actions.

  Без `pull_request` (пуш ветки уже покрывает ветку PR) и без фильтра путей (пуш должен триггерить
  всегда, по требованию). Флаки холодного старта смягчаются `retries:2` в CI (см. #138).
- **Job** `ui-e2e` на `ubuntu-latest`, `timeout-minutes: 60`.
- **services.sqlserver:** образ `mcr.microsoft.com/mssql/server:2022-latest`, env `ACCEPT_EULA=Y`,
  `MSSQL_SA_PASSWORD=<секрет>`, порт `1433:1433`, health-check через `sqlcmd` (или ожидание готовности).
- **Job-level `env`** (наследуется дочерними `dotnet run`): `CI: true`,
  `Database__Server: localhost,1433`, `Database__User: sa`,
  `Database__Password: ${{ secrets.MSSQL_SA_PASSWORD }}`. Пароль SA — **repository secret**
  `MSSQL_SA_PASSWORD` (задаётся в Settings → Secrets and variables → Actions), а не литерал в файле.
- **Steps:** checkout → setup-dotnet 10.0.x → setup-node lts → `dotnet dev-certs https` →
  `npm ci` (`src/UiTests`) → `npx playwright install --with-deps` → `npm test` →
  upload-artifact `playwright-report/` (`if: !cancelled()`) → upload-artifact `test-results/`
  (`if: failure()`).

### 2. Workflow `.github/workflows/api-tests.yml`

Независимый workflow для `src/ApiTests` — тот же скелет, но **проще**:

- **Trigger:** `push` + `workflow_dispatch` (как у UI).
- **Job** `api-e2e` на `ubuntu-latest`, `timeout-minutes: 30`.
- **services.sqlserver** и **job-level `env`** (`Database__Server/User/Password`) — идентично UI
  (API тоже поднимается через `webServer` `dotnet run --project ../AddressBook.Api`).
- **Отличия от UI:** нет `dotnet dev-certs https` (API только HTTP, порт 5000) и нет
  `npx playwright install` — API-тесты используют `APIRequestContext`, браузер не нужен
  (`playwright.config.ts` → единственный проект `api`, без browser engine).
- **Steps:** checkout → setup-dotnet 10.0.x → setup-node lts → wait-for-SQL → `npm ci`
  (`src/ApiTests`) → `npm test` → upload-artifact `api-playwright-report` (`if: !cancelled()`) →
  upload-artifact `api-test-results` (`if: failure()`). Имена артефактов с префиксом `api-`,
  чтобы не конфликтовать с UI-workflow.

### 3. Удаление `playwright.yml`

Удаляем [`.github/workflows/playwright.yml`](../../.github/workflows/playwright.yml): он гоняет
legacy-набор `src/AutoTests` (reference-only), триггерится только вручную и морально устарел —
его роль (прогон против внешнего сервера) заменяют новые workflow, исполняющиеся целиком внутри CI.

### 4. Документация («skills/instructions»)

- [`docs/specs/Architecture.md`](../../docs/specs/Architecture.md): в дереве `.github/workflows/`
  убрать `playwright.yml`, добавить `ui-tests.yml` и `api-tests.yml`; обновить раздел **CI/CD**.
- [`src/UiTests/README.md`](../../src/UiTests/README.md) и
  [`src/ApiTests/README.md`](../../src/ApiTests/README.md): короткий раздел **CI** (что делает
  workflow, ручной запуск, где смотреть HTML-репорт).
- [`docs/tasks/ui-tests-framework-plan.md`](../../docs/tasks/ui-tests-framework-plan.md): отметить U20 `[x]`.

> Файлы `.github/skills/**` и `.github/instructions/**` **не меняем** — сейчас ни один из них не
> документирует CI-воркфлоу, поэтому «обновление skills/instructions» покрываем спеками/README.

## Tests

Нет Playwright-тестов. Это CI-инфраструктура: новое/изменённое API-поведение отсутствует, спеки не
добавляются и не меняются (обоснование по workflow: «no API change»). Существующий UI E2E-набор —
это и есть то, что workflow прогоняет.

## Верификация

- **Статически (до merge):** валидация YAML (`actionlint`/парсер), сверка каждого пути/порта/команды с
  `playwright.config.ts`, `launchSettings.json` (API→5000, Web→7187), `StartupExtensions.cs`,
  `package.json` и `.gitignore`.
- **Динамически (определяющая):** после push — запуск через `workflow_dispatch`
  (`gh workflow run ui-tests.yml`) и проверка зелёного прогона + артефакта с HTML-репортом. Предложу
  выполнить это после пуша ветки (до/после открытия PR — по согласованию), т.к. Actions исполняется
  только на GitHub.

## Вне scope

- U21 (#112) — финальная верификация `npm ci` / `lint` / `test`.
- Изменения production-кода, спеков, конфигурации API/Web (кроме env-оверрайдов внутри самого workflow).
- CI для `src/ApiTests` (отдельная задача, если понадобится).
