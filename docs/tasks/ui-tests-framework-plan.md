# План: Современный фреймворк UI (E2E) автотестов `src/UiTests`

> **Статус:** черновик / в работе
> **Целевая папка:** `src/UiTests` (новая; `src/ApiTests` и `src/AutoTests` не трогаем)
> **Тестируемое приложение:** `src/AddressBook.Web` — Blazor WebAssembly + MudBlazor 9.3.0
> **Локальный запуск сайта:** `https://localhost:7187/` (профиль `https`), API на `http://localhost:5000/api/`
> **Прогресс отслеживается чек-боксами в разделе [Список задач](#5-список-задач-github-ready).**

## 1. Цель

Разработать с нуля новый, современный, гибкий и мощный фреймворк UI/E2E-автотестов для
`AddressBook.Web` на **Playwright + TypeScript**. Полностью покрыть пользовательские сценарии
всех страниц (`/`, `/contacts`, `/create-contact`, `/edit-contact/{id}`): поиск, сортировку,
пагинацию, CRUD через UI, клиентскую и серверную валидацию, обработку ошибок, навигацию и
оболочку приложения (тема, drawer).

Ключевая идея архитектуры — **гибридный E2E**: подготовка и очистка данных выполняются быстро
через REST API (переиспользуем знания и подходы из `src/ApiTests`), а проверки — через реальный
UI в браузере. Это делает тесты быстрыми, изолированными и устойчивыми к общей БД.

## 2. Архитектурные решения

- **Page Object Model нового поколения (fixture-composed).** Не классические «толстые» POM, а
  тонкие page-объекты и component-объекты, которые инжектируются в тест через
  `test.extend`-фикстуры. Тест не создаёт объекты руками — он объявляет нужные фикстуры в
  сигнатуре. Локаторы ленивые (`page.getByRole(...)`), без хранения «сырых» селекторов.
- **Component objects для MudBlazor.** Отдельные обёртки для нетривиальных виджетов:
  `MudTable` (server-reload), `MudDatePicker` (popover-календарь), `MudMessageBox`
  (диалог удаления), `MudTextField`, тема/drawer. Это изолирует хрупкость Material-разметки
  в одном месте.
- **Гибридная подготовка данных через API.** Фикстура `contactsApi` использует Playwright
  `request` (`APIRequestContext`) для create/delete контактов напрямую в API — быстро и без UI.
  UI-тест стартует с уже известного состояния и проверяет только то, что он проверяет.
- **Self-contained данные + уникальные токены.** Каждый тест создаёт контакты с уникальным
  токеном прогона (в имени/фамилии) и удаляет их в teardown. Поиск по токену изолирует тест от
  seed-данных и параллельных прогонов на общей SQL Server БД.
- **Web-first assertions, ноль хардкод-ожиданий.** Только авто-ожидающие `expect(locator)`
  (`toBeVisible`, `toHaveText`, `toHaveURL` …). Никаких `waitForTimeout`. Учитываем специфику
  Blazor WASM (первичная загрузка `.dll`/`.wasm`) и `MudTable.ReloadServerData()`.
- **Стабильные селекторы через `data-testid`.** MudBlazor рендерит иконочные кнопки
  Edit/Delete **без доступного имени** и без `data-testid`. Поэтому первым делом добавляем
  ненавязчивые `data-testid` (через `UserAttributes`) в разметку Web-проекта. Приоритет
  локаторов: `getByRole`/`getByLabel` → `getByTestId` → CSS как крайний случай.
- **webServer поднимает и API, и Web.** Массив `webServer`: сначала `dotnet run --project
  ../AddressBook.Api`, затем `../AddressBook.Web` (профиль `http`/`https`), с
  `reuseExistingServer` локально. `ignoreHTTPSErrors: true` для самоподписанного TLS.
- **Артефакты диагностики.** `trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`,
  `video: 'retain-on-failure'`, HTML-репортёр.
- **Конфигурация через env.** `dotenv` + zod-валидация (`BASE_URL`, `API_URL`, таймауты,
  headless). Профили `.env.local` / `.env.ci`.
- **Опционально: a11y-проверки** через `@axe-core/playwright` на ключевых страницах.
- **Стек:** `@playwright/test`, `@faker-js/faker`, `zod`, `dotenv`, `cross-env`,
  `@axe-core/playwright` (опц.), ESLint (flat config) + Prettier, TypeScript.

## 3. Факты о UI (основа для дизайна тестов)

- **Оболочка (`MainLayout`):** `MudAppBar` с заголовком «Contact Book», кнопка-гамбургер
  (toggle `MudDrawer`), тумблер тёмной/светлой темы (`MudToggleIconButton`). Drawer содержит
  `NavMenu`: ссылки **Home** (`/`) и **Contacts** (`/contacts`).
- **Home (`/`):** статичная страница, `<PageTitle>Home</PageTitle>`.
- **Contacts (`/contacts`):**
  - `MudTable<ContactModel>` с `ServerData="ServerReload"`. Колонки: First Name, Last Name,
    Birthday (`ToShortDateString()`), Actions.
  - Сортировка `MudTableSortLabel`: `fn_field`/`ln_field`/`bd_field` (клиентская).
  - Пагинация `MudTablePager` (клиентская, Skip/Take), `TotalItems = response.TotalRows`.
  - Тулбар: кнопка **Create Contact** (→ `/create-contact`), поле **Search**
    (`MudTextField`, `Placeholder="Search"`, `Clearable`) → `OnSearch` → `ReloadServerData()`.
  - Строка: кнопка **Edit** (иконка карандаш, → `/edit-contact/{id}`) и **Delete**
    (иконка корзина) — **обе без текста и без доступного имени** (нужен `data-testid`).
  - Delete открывает `MudMessageBox` (Title «Warning», текст «Are you sure you want to delete
    this contact?», кнопки «Yes»/«Cancel»); по «Yes» → API delete → reload.
  - Ошибка загрузки: `MudAlert` в `NoRecordsContent` + баннер через каскадный `Error`.
- **Create (`/create-contact`):** `EditForm` + `DataAnnotationsValidator`. Поля: First name,
  Last Name (`MudTextField`), Birthday (`MudDatePicker`), `ValidationSummary`. Кнопки
  **Create**/**Cancel**. `FirstName`/`LastName` → `[Required]`. Серверные ошибки
  (`ProblemDetailsException`) мапятся на поля формы. Успех → навигация на `/contacts`.
- **Edit (`/edit-contact/{Id:int}`):** грузит контакт через `GetContactByIdAsync`; если не
  найден — `MudAlert` «Contact not found.» + кнопка «Back to Contacts». Форма идентична
  create. Кнопки **Save**/**Cancel**. Успех → `/contacts`.
- **Клиентская валидация:** только `[Required]` на First/Last name (DataAnnotations). Правил
  на длину/дату на клиенте нет → это проверяет **сервер** (400 → problem-details → поля формы).
- **Роутинг:** SPA (`staticwebapp.config.json`), deep-link на `/contacts`, `/create-contact`,
  `/edit-contact/{id}` работает после refresh.
- **Зависимость от API:** без запущенного API таблица показывает ошибку («An unhandled error
  has occurred») — подтверждено при инспекции. Значит UI-тесты требуют живого API.

## 4. Структура каталогов

```
src/UiTests/
  package.json  playwright.config.ts  tsconfig.json  eslint.config.mjs
  .prettierrc.json  .env.example  .gitignore  README.md
  src/
    config/env.ts                    # zod-валидация переменных окружения + dotenv
    fixtures/
      test-fixtures.ts               # test.extend: страницы + компоненты + contactsApi + data
    pages/
      base.page.ts                   # общий базовый page-объект (goto, ожидания Blazor)
      home.page.ts
      contacts.page.ts               # таблица, поиск, тулбар, действия строк
      create-contact.page.ts
      edit-contact.page.ts
    components/
      app-shell.component.ts         # AppBar, drawer, переключатель темы, навигация
      contacts-table.component.ts    # обёртка MudTable: строки, сортировка, пагинация
      contact-form.component.ts      # общая обёртка формы create/edit + валидация
      date-picker.component.ts       # обёртка MudDatePicker (popover)
      confirm-dialog.component.ts    # обёртка MudMessageBox (delete)
    api/
      contacts-api.ts                # seeding/cleanup контактов через APIRequestContext
    data/
      contact.factory.ts             # билдеры на faker + именованные граничные варианты
      tokens.ts                      # генератор уникальных токенов прогона
    utils/
      testids.ts                     # централизованные константы data-testid
      assertions.ts                  # доменные проверки (строка таблицы, ошибка поля)
      blazor.ts                      # хелперы ожидания готовности Blazor WASM
  tests/
    smoke/
      app-shell.spec.ts              # загрузка, навигация Home/Contacts, тема, drawer
    contacts/
      list-search.spec.ts           # отображение, поиск, пустой результат, очистка
      sort-paginate.spec.ts         # сортировка колонок, пагинация
      create.spec.ts                # создание с/без birthday, отмена
      edit.spec.ts                  # редактирование, not-found, отмена
      delete.spec.ts                # confirm-диалог: подтверждение/отмена
      validation.spec.ts            # required на клиенте + серверные 400 → поля формы
      crud-lifecycle.spec.ts        # сквозной create → find → edit → delete через UI
    a11y/
      accessibility.spec.ts         # (опц.) axe-core на ключевых страницах
```

## 5. Список задач (GitHub-ready)

Задачи заведены в GitHub Issues. По мере выполнения отмечаем `[x]`.

### Фаза 0 — Каркас

- [x] **U1** ([#92](https://github.com/askrinnik/AddressBook2025/issues/92)) Scaffold `src/UiTests`: `package.json` (скрипты `test`, `test:report`, `test:ui`,
  `test:debug`, `test:headed`, `test:remote`, `lint`, `format`), `tsconfig.json`,
  `eslint.config.mjs` (flat), `.prettierrc.json`, `.gitignore`, `.env.example`,
  README-заглушка. Создать этот файл плана в `docs/tasks/`.
- [x] **U2** ([#93](https://github.com/askrinnik/AddressBook2025/issues/93)) Установить зависимости + браузеры (`npx playwright install`). `playwright.config.ts`:
  проект(ы) браузеров (chromium; опц. firefox/webkit), `baseURL`, `ignoreHTTPSErrors`, `trace`,
  `screenshot`, `video`, reporters `list`+`html`, массив `webServer` (API + Web,
  `reuseExistingServer` локально).

### Фаза 1 — Инфраструктура

- [x] **U3** ([#94](https://github.com/askrinnik/AddressBook2025/issues/94)) `config/env.ts` — zod-загрузчик окружения (`BASE_URL`, `API_URL`, таймауты,
  `HEADLESS`) + dotenv (`.env.local`/`.env.ci`).
- [x] **U4** ([#95](https://github.com/askrinnik/AddressBook2025/issues/95)) Enabler: добавить ненавязчивые `data-testid` в `AddressBook.Web` (через
  `UserAttributes`) для иконочных кнопок Edit/Delete, кнопок Create/Save/Cancel, полей формы,
  строк таблицы, диалога удаления, тумблера темы. Задокументировать соглашение об именах
  `data-testid`. `utils/testids.ts` — централизованные константы.
- [x] **U5** ([#96](https://github.com/askrinnik/AddressBook2025/issues/96)) `api/contacts-api.ts` — обёртка над `APIRequestContext` для seed/cleanup контактов
  (create → id из `Location`, delete по id). Переиспользуем факты об API из `src/ApiTests`.
- [ ] **U6** ([#97](https://github.com/askrinnik/AddressBook2025/issues/97)) `data/contact.factory.ts` + `tokens.ts` — фабрики на faker + именованные граничные
  варианты (валидный, с/без birthday, длина 30/31, пробелы, будущая дата) + уникальный токен.
- [ ] **U7** ([#98](https://github.com/askrinnik/AddressBook2025/issues/98)) `components/*` — component objects: `app-shell`, `contacts-table`, `contact-form`,
  `date-picker` (popover), `confirm-dialog` (MudMessageBox).
- [ ] **U8** ([#99](https://github.com/askrinnik/AddressBook2025/issues/99)) `pages/*` — page objects: `base`, `home`, `contacts`, `create-contact`,
  `edit-contact` (используют component objects, ленивые локаторы).
- [ ] **U9** ([#100](https://github.com/askrinnik/AddressBook2025/issues/100)) `fixtures/test-fixtures.ts` — `test.extend`: инжект страниц/компонентов +
  `contactsApi` + `data` + авто-cleanup созданных контактов. `utils/assertions.ts`,
  `utils/blazor.ts` (готовность WASM).

### Фаза 2 — Тесты

- [ ] **U10** ([#101](https://github.com/askrinnik/AddressBook2025/issues/101)) `tests/smoke/app-shell.spec.ts` — загрузка приложения, навигация Home↔Contacts,
  переключение темы, toggle drawer, заголовки страниц.
- [ ] **U11** ([#102](https://github.com/askrinnik/AddressBook2025/issues/102)) `tests/contacts/list-search.spec.ts` — отображение созданных контактов, поиск по
  токену, пустой результат («No matching records found»), очистка поиска.
- [ ] **U12** ([#103](https://github.com/askrinnik/AddressBook2025/issues/103)) `tests/contacts/sort-paginate.spec.ts` — сортировка по First/Last/Birthday,
  пагинация (rows-per-page, next/prev), `TotalRows`.
- [ ] **U13** ([#104](https://github.com/askrinnik/AddressBook2025/issues/104)) `tests/contacts/create.spec.ts` — создание с birthday и без, появление в списке,
  отмена (Cancel → без создания).
- [ ] **U14** ([#105](https://github.com/askrinnik/AddressBook2025/issues/105)) `tests/contacts/edit.spec.ts` — редактирование существующего (данные
  предзаполнены, сохранение отражается в списке), not-found для несуществующего id, отмена.
- [ ] **U15** ([#106](https://github.com/askrinnik/AddressBook2025/issues/106)) `tests/contacts/delete.spec.ts` — confirm-диалог: «Cancel» не удаляет, «Yes»
  удаляет и обновляет таблицу.
- [ ] **U16** ([#107](https://github.com/askrinnik/AddressBook2025/issues/107)) `tests/contacts/validation.spec.ts` — клиент: пустые First/Last name блокируют
  сабмит (`Required`); сервер: длина > 30 и будущая дата → 400 → сообщения на полях формы.
- [ ] **U17** ([#108](https://github.com/askrinnik/AddressBook2025/issues/108)) `tests/contacts/crud-lifecycle.spec.ts` — сквозной UI-сценарий: create → найти
  поиском → edit → проверить → delete → убедиться, что исчез.

### Фаза 3 — Обвязка и документация

- [ ] **U18** ([#109](https://github.com/askrinnik/AddressBook2025/issues/109)) (опц., с подтверждением) `tests/a11y/accessibility.spec.ts` — `@axe-core/playwright`
  на Home/Contacts/Create.
- [ ] **U19** ([#110](https://github.com/askrinnik/AddressBook2025/issues/110)) `README.md` для `src/UiTests` (запуск, env, предпосылки: живые API+Web, отладка).
- [ ] **U20** ([#111](https://github.com/askrinnik/AddressBook2025/issues/111)) (опц., с подтверждением) CI-workflow (поднять API+Web, `npx playwright install
  --with-deps`, прогон, публикация HTML-репорта) + обновление skills/instructions.
- [ ] **U21** ([#112](https://github.com/askrinnik/AddressBook2025/issues/112)) Верификация: `npm ci`, `npm run lint`, `npm test` — всё зелёное.

## 6. Что переиспользуем из `src/ApiTests`

- **Факты об API** (эндпоинты, `Location`-парсинг id, RFC7807-валидация) — для слоя seed/cleanup.
- **Подход к данным:** фабрики на faker, уникальные токены прогона, self-contained + teardown.
- **Тулинг:** структура `package.json`-скриптов, ESLint flat config, Prettier, zod-валидация env,
  `dotenv` + `cross-env`.

## 7. Ключевые технические риски и решения

| Риск | Решение |
|---|---|
| Иконочные кнопки Edit/Delete без имени/testid | Enabler-задача **U4**: добавить `data-testid` через `UserAttributes` |
| MudDatePicker — popover-календарь, не обычный input | Component object `date-picker` инкапсулирует открытие/выбор даты |
| MudTable server-reload → гонки | Web-first assertions на данные строки, без `waitForTimeout`; ожидание исчезновения «Loading...» |
| Blazor WASM первая загрузка медленная | `base.page` ждёт готовности приложения; `reuseExistingServer` локально |
| Общая SQL Server БД, параллелизм | Уникальные токены + поиск по токену + teardown |
| Самоподписанный HTTPS `localhost:7187` | `ignoreHTTPSErrors: true` |
| Зависимость UI от живого API | `webServer`-массив поднимает и API, и Web |

## 8. Верификация

1. `npm ci` в `src/UiTests`.
2. `npx playwright install` (браузеры).
3. `npm run lint` — без ошибок.
4. `npm test` — API и Web поднимаются через `webServer` (или вручную: `dotnet run --project
   src/AddressBook.Api` и `dotnet run --project src/AddressBook.Web`).
5. Все спеки зелёные; артефакты (trace/screenshot/video) собираются при падении.
