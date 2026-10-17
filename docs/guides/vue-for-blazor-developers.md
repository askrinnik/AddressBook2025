# Vue для Blazor-разработчика

Практическое руководство по Vue 3 на примере этого репозитория. В нём два фронтенда с одинаковым UI поверх одного API:

| | Blazor | Vue |
|---|---|---|
| Проект | [`src/AddressBook.Web`](../../src/AddressBook.Web) | [`src/AddressBook.Vue`](../../src/AddressBook.Vue) |
| Спецификация | [AddressBook.Web.md](../specs/AddressBook.Web.md) | [AddressBook.Vue.md](../specs/AddressBook.Vue.md) |
| Компонентные тесты | [`src/AddressBook.Web.Tests`](../../src/AddressBook.Web.Tests) (bUnit) | [`src/AddressBook.Vue/tests`](../../src/AddressBook.Vue/tests) (Vitest) |
| E2E-тесты | [`src/UiTests`](../../src/UiTests), проект `blazor` | [`src/UiTests`](../../src/UiTests), проект `vue` |

Каждое понятие Vue объясняется рядом с его аналогом в Blazor и показано на коротком фрагменте кода проекта со ссылкой на файл. Факты о поведении приложения — в спецификации; здесь — как это устроено и почему так написано. Правила написания кода — в [vue.instructions.md](../../.github/instructions/vue.instructions.md).

## Содержание

1. [Быстрый старт](#1-быстрый-старт)
2. [Порядок чтения файлов](#2-порядок-чтения-файлов)
3. [Карта соответствий Blazor → Vue](#3-карта-соответствий-blazor--vue)
4. [TypeScript для C#-разработчика](#4-typescript-для-c-разработчика)
5. [Точка входа: main.ts вместо Program.cs](#5-точка-входа-maints-вместо-programcs)
6. [Однофайловый компонент (SFC) вместо .razor](#6-однофайловый-компонент-sfc-вместо-razor)
7. [Шаблон: директивы вместо Razor-синтаксиса](#7-шаблон-директивы-вместо-razor-синтаксиса)
8. [Реактивность: ref, computed, watch вместо полей и StateHasChanged](#8-реактивность-ref-computed-watch-вместо-полей-и-statehaschanged)
9. [Props и emits вместо [Parameter] и EventCallback](#9-props-и-emits-вместо-parameter-и-eventcallback)
10. [v-model и defineModel вместо @bind](#10-v-model-и-definemodel-вместо-bind)
11. [Слоты вместо RenderFragment](#11-слоты-вместо-renderfragment)
12. [Жизненный цикл: onMounted и onBeforeUnmount вместо OnInitializedAsync и Dispose](#12-жизненный-цикл-onmounted-и-onbeforeunmount-вместо-oninitializedasync-и-dispose)
13. [Composables и provide/inject вместо DI и CascadingValue](#13-composables-и-provideinject-вместо-di-и-cascadingvalue)
14. [Пользовательская директива](#14-пользовательская-директива)
15. [Vue Router вместо @page и NavigationManager](#15-vue-router-вместо-page-и-navigationmanager)
16. [Vuetify вместо MudBlazor](#16-vuetify-вместо-mudblazor)
17. [fetch и problem details вместо HttpClient и DelegatingHandler](#17-fetch-и-problem-details-вместо-httpclient-и-delegatinghandler)
18. [Валидация: правила Vuetify вместо DataAnnotations](#18-валидация-правила-vuetify-вместо-dataannotations)
19. [Конфигурация: .env вместо appsettings.json](#19-конфигурация-env-вместо-appsettingsjson)
20. [Тесты: Vitest и Vue Test Utils вместо bUnit](#20-тесты-vitest-и-vue-test-utils-вместо-bunit)
21. [Общий Playwright-набор](#21-общий-playwright-набор)
22. [Отладка](#22-отладка)
23. [Где Vue-фронтенд сознательно отличается](#23-где-vue-фронтенд-сознательно-отличается)
24. [Глоссарий](#24-глоссарий)
25. [Документация](#25-документация)

## 1. Быстрый старт

Нужны Node.js `^20.19.0` или `>=22.12.0` и запущенный API на `http://localhost:5000` (как его запустить — в [AddressBook.Api.md](../specs/AddressBook.Api.md)). Все команды выполняются в `src/AddressBook.Vue`.

| Команда | Что делает | Аналог в .NET |
|---|---|---|
| `npm ci` | Ставит зависимости строго по `package-lock.json` | `dotnet restore --locked-mode` |
| `npm run dev` | Dev-сервер с горячей заменой модулей на `http://localhost:5173` | `dotnet watch` |
| `npm run build` | Проверка типов `vue-tsc`, затем сборка в `dist/` | `dotnet publish` |
| `npm run preview` | Отдаёт собранный `dist/` на `http://localhost:4173` | запуск опубликованной сборки |
| `npm test` | Один прогон Vitest | `dotnet test` |
| `npm run test:watch` | Vitest перезапускает тесты при каждом изменении | `dotnet watch test` |
| `npm run lint` / `npm run format` | ESLint / Prettier | анализаторы и `dotnet format` |

`package.json` — это одновременно `.csproj` (зависимости) и набор именованных команд (`scripts`). `package-lock.json` — аналог `packages.lock.json`.

Сохраните `.vue`-файл при запущенном `npm run dev` — страница в браузере обновится без полной перезагрузки: Vite заменяет только изменённый модуль (HMR).

## 2. Порядок чтения файлов

Читайте сверху вниз: каждый следующий файл опирается на предыдущие. Справа — что открыть в Blazor-проекте для сравнения.

| # | Vue-файл | Что в нём узнать | Blazor-аналог |
|---|---|---|---|
| 1 | [`index.html`](../../src/AddressBook.Vue/index.html), [`src/main.ts`](../../src/AddressBook.Vue/src/main.ts) | Как стартует приложение | [`wwwroot/index.html`](../../src/AddressBook.Web/wwwroot/index.html), [`Program.cs`](../../src/AddressBook.Web/Program.cs) |
| 2 | [`src/App.vue`](../../src/AddressBook.Vue/src/App.vue) | Корневой компонент, `provide` | [`App.razor`](../../src/AddressBook.Web/App.razor) |
| 3 | [`src/router/index.ts`](../../src/AddressBook.Vue/src/router/index.ts) | Маршруты, заголовки страниц | `@page`, `<PageTitle>` |
| 4 | [`src/pages/HomePage.vue`](../../src/AddressBook.Vue/src/pages/HomePage.vue), [`NotFoundPage.vue`](../../src/AddressBook.Vue/src/pages/NotFoundPage.vue) | Простейший компонент — только шаблон | [`Pages/Home.razor`](../../src/AddressBook.Web/Pages/Home.razor) |
| 5 | [`src/layouts/MainLayout.vue`](../../src/AddressBook.Vue/src/layouts/MainLayout.vue) | `ref`, `computed`, обработчики, слот | [`Layout/MainLayout.razor`](../../src/AddressBook.Web/Layout/MainLayout.razor) |
| 6 | [`src/components/NavMenu.vue`](../../src/AddressBook.Vue/src/components/NavMenu.vue) | Ссылки на маршруты | [`Layout/NavMenu.razor`](../../src/AddressBook.Web/Layout/NavMenu.razor) |
| 7 | [`src/composables/useErrorBanner.ts`](../../src/AddressBook.Vue/src/composables/useErrorBanner.ts), [`src/components/ErrorBanner.vue`](../../src/AddressBook.Vue/src/components/ErrorBanner.vue) | Composable, `provide` / `inject` | [`Layout/Error.razor`](../../src/AddressBook.Web/Layout/Error.razor) (`CascadingValue`) |
| 8 | [`src/api/types.ts`](../../src/AddressBook.Vue/src/api/types.ts) | Интерфейсы TypeScript | `AddressBook.Contracts`, [`Models/CreateContactModel.cs`](../../src/AddressBook.Web/Models/CreateContactModel.cs) |
| 9 | [`src/api/problemDetails.ts`](../../src/AddressBook.Vue/src/api/problemDetails.ts), [`src/api/http.ts`](../../src/AddressBook.Vue/src/api/http.ts) | `fetch` и разбор ошибок | [`ErrorHandling/`](../../src/AddressBook.Web/ErrorHandling) |
| 10 | [`src/api/contactsApi.ts`](../../src/AddressBook.Vue/src/api/contactsApi.ts) | Сервисные функции | [`AddressBookApiService.cs`](../../src/AddressBook.Web/AddressBookApiService.cs) |
| 11 | [`src/components/TablePager.vue`](../../src/AddressBook.Vue/src/components/TablePager.vue) | Props, emits, `computed` | `MudTablePager` в [`Pages/Contacts.razor`](../../src/AddressBook.Web/Pages/Contacts.razor) |
| 12 | [`src/pages/ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) | `watch`, слоты таблицы, диалог, отмена запросов | [`Pages/Contacts.razor`](../../src/AddressBook.Web/Pages/Contacts.razor), [`Contacts.razor.cs`](../../src/AddressBook.Web/Pages/Contacts.razor.cs) |
| 13 | [`src/rules/contactRules.ts`](../../src/AddressBook.Vue/src/rules/contactRules.ts) | Правила валидации | [`Models/NotInFutureAttribute.cs`](../../src/AddressBook.Web/Models/NotInFutureAttribute.cs), атрибуты модели |
| 14 | [`src/directives/inputTestId.ts`](../../src/AddressBook.Vue/src/directives/inputTestId.ts) | Пользовательская директива | — |
| 15 | [`src/components/BirthdayPicker.vue`](../../src/AddressBook.Vue/src/components/BirthdayPicker.vue) | `defineModel`, проброс props в Vuetify | `MudDatePicker` |
| 16 | [`src/components/ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue), [`contactFormErrors.ts`](../../src/AddressBook.Vue/src/components/contactFormErrors.ts) | Форма, `v-model` на модель родителя, функция-prop | `EditForm` в [`Pages/CreateContact.razor`](../../src/AddressBook.Web/Pages/CreateContact.razor) |
| 17 | [`src/pages/CreateContactPage.vue`](../../src/AddressBook.Vue/src/pages/CreateContactPage.vue), [`EditContactPage.vue`](../../src/AddressBook.Vue/src/pages/EditContactPage.vue) | Страница как владелец модели, параметр маршрута, `onMounted` | [`Pages/CreateContact.razor`](../../src/AddressBook.Web/Pages/CreateContact.razor), [`Pages/EditContact.razor`](../../src/AddressBook.Web/Pages/EditContact.razor) |
| 18 | [`tests/helpers/mountWithApp.ts`](../../src/AddressBook.Vue/tests/helpers/mountWithApp.ts), [`tests/components/ErrorBanner.spec.ts`](../../src/AddressBook.Vue/tests/components/ErrorBanner.spec.ts), [`tests/pages/CreateContactPage.spec.ts`](../../src/AddressBook.Vue/tests/pages/CreateContactPage.spec.ts) | Как тестировать компоненты | [`Infrastructure/MudTestContext.cs`](../../src/AddressBook.Web.Tests/Infrastructure/MudTestContext.cs), [`Specs/Pages/CreateContactTests.cs`](../../src/AddressBook.Web.Tests/Specs/Pages/CreateContactTests.cs) |
| 19 | [`vite.config.ts`](../../src/AddressBook.Vue/vite.config.ts), [`vitest.config.ts`](../../src/AddressBook.Vue/vitest.config.ts), [`package.json`](../../src/AddressBook.Vue/package.json) | Сборка и тестовый раннер | [`AddressBook.Web.csproj`](../../src/AddressBook.Web/AddressBook.Web.csproj) |

## 3. Карта соответствий Blazor → Vue

| Blazor | Vue в этом проекте | Раздел |
|---|---|---|
| `Program.cs`, `builder.Services.Add...` | `main.ts`, `createApp(App).use(...)` | [5](#5-точка-входа-maints-вместо-programcs) |
| `.razor` + `.razor.cs` + `.razor.css` | один `.vue`: `<script setup>`, `<template>`, `<style scoped>` | [6](#6-однофайловый-компонент-sfc-вместо-razor) |
| `@if`, `@foreach`, `@key` | `v-if`, `v-for`, `:key` | [7](#7-шаблон-директивы-вместо-razor-синтаксиса) |
| `@onclick="Handler"` | `@click="handler"` | [7](#7-шаблон-директивы-вместо-razor-синтаксиса) |
| поле + `StateHasChanged()` | `ref()`; перерисовка автоматическая | [8](#8-реактивность-ref-computed-watch-вместо-полей-и-statehaschanged) |
| вычисляемое свойство `=>` | `computed()` (с кэшем) | [8](#8-реактивность-ref-computed-watch-вместо-полей-и-statehaschanged) |
| `OnParametersSet`, `ReloadServerData()` | `watch()` | [8](#8-реактивность-ref-computed-watch-вместо-полей-и-statehaschanged) |
| `[Parameter]` | `defineProps` | [9](#9-props-и-emits-вместо-parameter-и-eventcallback) |
| `EventCallback` | `defineEmits` + `emit()` | [9](#9-props-и-emits-вместо-parameter-и-eventcallback) |
| `Func<T, Task>`-параметр | функция в props | [9](#9-props-и-emits-вместо-parameter-и-eventcallback) |
| `@bind-Value` (`Value` + `ValueChanged`) | `v-model` (`modelValue` + `update:modelValue`), `defineModel` | [10](#10-v-model-и-definemodel-вместо-bind) |
| `@Body`, `ChildContent`, `RenderFragment<T>` | `<slot />`, именованные и scoped-слоты | [11](#11-слоты-вместо-renderfragment) |
| `OnInitializedAsync` | `onMounted` (или код прямо в `<script setup>`) | [12](#12-жизненный-цикл-onmounted-и-onbeforeunmount-вместо-oninitializedasync-и-dispose) |
| `IDisposable.Dispose` | `onBeforeUnmount` | [12](#12-жизненный-цикл-onmounted-и-onbeforeunmount-вместо-oninitializedasync-и-dispose) |
| `CascadingValue` / `[CascadingParameter]` | `provide` / `inject` | [13](#13-composables-и-provideinject-вместо-di-и-cascadingvalue) |
| `@inject` сервиса | `import` модуля или composable `useXxx()` | [13](#13-composables-и-provideinject-вместо-di-и-cascadingvalue) |
| `@ref` | `useTemplateRef` | [10](#10-v-model-и-definemodel-вместо-bind) |
| `@page "/edit-contact/{Id:int}"` | запись в `routes` с `:id(\\d+)` | [15](#15-vue-router-вместо-page-и-navigationmanager) |
| `NavigationManager.NavigateTo` | `useRouter().push` | [15](#15-vue-router-вместо-page-и-navigationmanager) |
| `<PageTitle>` | `meta.title` + `router.afterEach` | [15](#15-vue-router-вместо-page-и-navigationmanager) |
| MudBlazor | Vuetify | [16](#16-vuetify-вместо-mudblazor) |
| `HttpClient` + `DelegatingHandler` | `fetch` в одной функции `request()` | [17](#17-fetch-и-problem-details-вместо-httpclient-и-delegatinghandler) |
| `ProblemDetailsException` | `ProblemDetailsError` | [17](#17-fetch-и-problem-details-вместо-httpclient-и-delegatinghandler) |
| DataAnnotations + `EditForm` | правила Vuetify + `v-form` | [18](#18-валидация-правила-vuetify-вместо-dataannotations) |
| `appsettings.json` | `.env.*` + `import.meta.env` | [19](#19-конфигурация-env-вместо-appsettingsjson) |
| bUnit + xUnit + NSubstitute | Vitest + Vue Test Utils + `vi.mock` | [20](#20-тесты-vitest-и-vue-test-utils-вместо-bunit) |

## 4. TypeScript для C#-разработчика

TypeScript проверяет типы только при сборке (`vue-tsc`); в браузере выполняется обычный JavaScript без типов. Поэтому `interface` — это описание формы объекта, а не класс: проверить `x instanceof ContactModel` нельзя.

```ts
export interface ContactModel {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string | null;
}
```

[`src/api/types.ts`](../../src/AddressBook.Vue/src/api/types.ts) — аналог `record ContactModel` из `AddressBook.Contracts`. `string | null` — объединение типов, аналог `string?`. У `DateOnly` нет аналога, поэтому дата с сервера — строка `yyyy-MM-dd`.

| C# | TypeScript |
|---|---|
| `int`, `double` | `number` |
| `string?` | `string \| null`, необязательное поле — `field?: string` |
| `enum` из строк | объединение литералов: `'GET' \| 'POST' \| 'PUT' \| 'DELETE'` ([`http.ts`](../../src/AddressBook.Vue/src/api/http.ts)) |
| `Dictionary<string, string[]>` | `Record<string, string[]>` |
| `Task<T>` | `Promise<T>` |
| `object` / `dynamic` | `unknown` (надо сузить проверкой) / `any` (не используем) |
| `x?.Y`, `x ?? y` | так же: `x?.y`, `x ?? y` |
| `using X;` | `import { x } from './x'`; `import type` импортирует только тип |
| `CancellationToken` | `AbortSignal` от `AbortController` |

Узкий тип через проверку — аналог pattern matching:

```ts
if (error instanceof ProblemDetailsError && error.status === 404) return null;
```

Здесь `ProblemDetailsError` — настоящий класс ([`problemDetails.ts`](../../src/AddressBook.Vue/src/api/problemDetails.ts)), поэтому `instanceof` работает. Это аналог `catch (ProblemDetailsException ex) when (...)`.

## 5. Точка входа: main.ts вместо Program.cs

```ts
createApp(App).use(router).use(vuetify).mount('#app');
```

[`src/main.ts`](../../src/AddressBook.Vue/src/main.ts) — аналог [`Program.cs`](../../src/AddressBook.Web/Program.cs):

| Blazor | Vue |
|---|---|
| `builder.RootComponents.Add<App>("#app")` | `createApp(App)` … `.mount('#app')` |
| `builder.Services.AddMudServices()` | `.use(vuetify)` — плагин из [`src/plugins/vuetify.ts`](../../src/AddressBook.Vue/src/plugins/vuetify.ts) |
| маршрутизация через `<Router>` в `App.razor` | `.use(router)` — плагин из [`src/router/index.ts`](../../src/AddressBook.Vue/src/router/index.ts) |
| `AddHttpClient<IAddressBookApiService, ...>` | не нужно: `contactsApi.ts` — обычный модуль, его импортируют |

В Vue нет DI-контейнера для сервисов. Модуль ES — уже синглтон: `import { getFilteredContacts } from '@/api/contactsApi'` везде даёт одну и ту же функцию. Подменять реализацию в тестах позволяет `vi.mock` ([раздел 20](#20-тесты-vitest-и-vue-test-utils-вместо-bunit)), а не интерфейс.

`@` в путях импорта — псевдоним папки `src/`, его задаёт [`vite.config.ts`](../../src/AddressBook.Vue/vite.config.ts).

## 6. Однофайловый компонент (SFC) вместо .razor

Компонент Vue — один файл `.vue` из трёх блоков. Вот [`ErrorBanner.vue`](../../src/AddressBook.Vue/src/components/ErrorBanner.vue) целиком без стилей:

```vue
<script setup lang="ts">
import { useErrorBanner } from '@/composables/useErrorBanner';

const { message } = useErrorBanner();
</script>

<template>
  <v-alert
    v-if="message"
    type="error"
    variant="flat"
    rounded="0"
    class="mb-4"
    data-testid="error-banner"
  >
    <h4 class="text-h6">Woops!</h4>
    <pre class="error-container">{{ message }}</pre>
  </v-alert>
</template>
```

| Блок | Blazor-аналог |
|---|---|
| `<script setup lang="ts">` | `@code { }` или partial-класс `.razor.cs` |
| `<template>` | разметка `.razor` |
| `<style scoped>` | CSS isolation `.razor.css` |

`<script setup>` выполняется один раз при создании экземпляра компонента — как конструктор плюс `OnInitialized`. Всё, что в нём объявлено на верхнем уровне (переменные, функции, импорты), доступно в шаблоне. Аналога `private` нет: шаблон видит всё.

Компонент проекта нужно импортировать, чтобы использовать: `import ContactForm from '@/components/ContactForm.vue'`. Компоненты Vuetify (`v-alert`, `v-btn`) импортировать не нужно — их подключает `vite-plugin-vuetify` с `autoImport: true`. Это похоже на `@using MudBlazor` в [`_Imports.razor`](../../src/AddressBook.Web/_Imports.razor).

## 7. Шаблон: директивы вместо Razor-синтаксиса

| Razor | Vue | Пример в проекте |
|---|---|---|
| `@context.FirstName` | `{{ item.firstName }}` | [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) |
| `Label="@label"` | `:label="label"` (сокращение `v-bind:label`) | [`BirthdayPicker.vue`](../../src/AddressBook.Vue/src/components/BirthdayPicker.vue) |
| `Label="First name"` (строка) | `label="First name"` (без двоеточия — строка) | [`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue) |
| `OnClick="Cancel"` | `@click="emit('cancel')"` (сокращение `v-on:click`) | [`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue) |
| `@if / else if / else` | `v-if`, `v-else-if`, `v-else` на соседних элементах | [`EditContactPage.vue`](../../src/AddressBook.Vue/src/pages/EditContactPage.vue) |
| `@foreach` + `@key` | `v-for="m in list" :key="m"` | [`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue) |
| `@onsubmit:preventDefault` | `@submit.prevent` | [`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue) |
| — | `@keydown.enter` — модификатор клавиши | [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) |

Главная ловушка: без двоеточия значение атрибута — строка, с двоеточием — выражение TypeScript. `:disabled="busy"` передаёт булево значение, `disabled="busy"` — строку `"busy"`.

Ветвление на странице редактирования — прямой перевод `@if` из [`EditContact.razor`](../../src/AddressBook.Web/Pages/EditContact.razor):

```vue
<template v-if="notFound">
  <v-alert type="warning">Contact not found.</v-alert>
  <v-btn variant="outlined" class="mt-4" @click="goToContacts">Back to Contacts</v-btn>
</template>
<template v-else-if="loadError !== null">
```

`<template>` внутри шаблона — невидимая обёртка, она не попадает в DOM. Это аналог блока `{ }` после `@if` с несколькими элементами.

## 8. Реактивность: ref, computed, watch вместо полей и StateHasChanged

В Blazor компонент перерисовывается после обработчика события или после `StateHasChanged()`. Во Vue перерисовка следует за данными: Vue запоминает, какие реактивные значения прочитал шаблон, и перерисовывает компонент, когда одно из них меняется. Вызывать `StateHasChanged` не нужно — его нет.

### ref

```ts
const drawerOpen = ref(true);
```

[`MainLayout.vue`](../../src/AddressBook.Vue/src/layouts/MainLayout.vue) — аналог `private bool _drawerOpen = true;` из [`MainLayout.razor`](../../src/AddressBook.Web/Layout/MainLayout.razor). `ref` — обёртка со свойством `.value`:

- в `<script>` значение читают и пишут через `.value`: `busy.value = true`;
- в `<template>` `.value` не пишут, Vue разворачивает ref сам: `@click="drawerOpen = !drawerOpen"`.

`ref` от объекта или массива делает реактивным всё внутри: `rows.value = [...]` и `serverErrors.value.fields.firstName` отслеживаются. Есть ещё `reactive()` — реактивный объект без `.value`; в коде приложения он не используется, его можно встретить в тесте [`ContactForm.spec.ts`](../../src/AddressBook.Vue/tests/components/ContactForm.spec.ts).

Не всё состояние должно быть реактивным. В [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) флаг и контроллер — обычные `let`, потому что шаблон их не показывает:

```ts
let loadErrorShown = false;
let loadController: AbortController | null = null;
```

Это как приватное поле в Blazor, которое не влияет на разметку.

### computed

```ts
const isDarkMode = computed(() => theme.current.value.dark);
const themeIcon = computed(() => (isDarkMode.value ? 'mdi-theme-light-dark' : 'mdi-weather-night'));
```

Аналог свойства `DarkLightModeButtonIcon => ...` в `MainLayout.razor`. Отличие: `computed` кэширует результат и пересчитывает его только при изменении того, что он читает. Ещё пример — подпись `X-Y of Z` в [`TablePager.vue`](../../src/AddressBook.Vue/src/components/TablePager.vue).

### watch

```ts
watch([searchTerm, sortBy, page, itemsPerPage], loadContacts, { immediate: true });
```

Одна строка в [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) заменяет `ServerData="ServerReload"` у `MudTable` и вызовы `_contactTable.ReloadServerData()` из [`Contacts.razor.cs`](../../src/AddressBook.Web/Pages/Contacts.razor.cs). Любое изменение одного из четырёх значений перезагружает таблицу; `immediate: true` загружает её сразу при создании страницы. Поэтому `commitSearch()` просто присваивает `searchTerm.value = text` и `page.value = 1` — загрузку запускает watch.

### Когда DOM обновится

Vue собирает изменения и перерисовывает компонент один раз, асинхронно, в следующем «тике». В тестах поэтому пишут `await nextTick()` или `await flushPromises()` перед проверкой разметки ([раздел 20](#20-тесты-vitest-и-vue-test-utils-вместо-bunit)).

## 9. Props и emits вместо [Parameter] и EventCallback

[`TablePager.vue`](../../src/AddressBook.Vue/src/components/TablePager.vue) показывает оба механизма:

```ts
const props = defineProps<{
  /** The current page, starting at 1. */
  page: number;
  itemsPerPage: number;
  totalRows: number;
  itemsPerPageOptions: number[];
}>();

const emit = defineEmits<{
  'update:page': [page: number];
  'update:itemsPerPage': [itemsPerPage: number];
}>();
```

| Blazor | Vue |
|---|---|
| `[Parameter] public int Page { get; set; }` | поле `page` в `defineProps` |
| `[Parameter] public EventCallback<int> PageChanged { get; set; }` | событие `'update:page'` в `defineEmits` |
| `await PageChanged.InvokeAsync(page)` | `emit('update:page', page)` |
| `<Pager Page="..." PageChanged="..." />` | `<TablePager :page="..." @update:page="..." />` |

`defineProps` и `defineEmits` — макросы компилятора: их не импортируют, а тип внутри `<...>` становится описанием props. Props доступны только для чтения — как параметр, который компонент не должен менять сам. Чтобы поменять значение, компонент сообщает об этом событием, а меняет его родитель.

В шаблоне имена props пишут через дефис: `:items-per-page="itemsPerPage"`, в скрипте — `props.itemsPerPage`. Vue сопоставляет их сам.

### Функция в props вместо события

У [`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue) есть и событие, и функция-prop:

```ts
const props = defineProps<{
  submitLabel: string;
  /** Saves the valid model; throwing shows the error on the form. */
  save: (model: ContactFormModel) => Promise<void>;
}>();

const emit = defineEmits<{
  cancel: [];
}>();
```

`emit` не возвращает результата: форма не может дождаться обработчика события и поймать его исключение. Поэтому `save` — функция в props, аналог параметра `Func<ContactFormModel, Task>`: форма делает `await props.save(model.value)`, держит кнопку выключенной до завершения и показывает ошибку в `catch`. `cancel` — просто уведомление, ему подходит событие.

## 10. v-model и defineModel вместо @bind

`v-model` — это `@bind` Vue. Он раскрывается в пару «значение + событие изменения», ровно как `@bind-Value` раскрывается в `Value` + `ValueChanged`:

| Запись | Во что раскрывается |
|---|---|
| `<v-text-field v-model="searchText" />` | `:model-value="searchText" @update:model-value="v => searchText = v"` |
| `<TablePager v-model:page="page" />` | `:page="page" @update:page="v => page = v"` |

Второй случай — из [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue): `v-model:page` работает с `TablePager`, потому что тот объявил prop `page` и событие `update:page`. В Blazor это та же договорённость об именах `Page` + `PageChanged` для `@bind-Page`.

Тот же `TablePager` показывает и обратный путь: rows per page связан вручную, потому что странице нужен свой обработчик (сброс на первую страницу):

```vue
v-model:page="page"
@update:items-per-page="changeItemsPerPage"
```

### defineModel

Чтобы не объявлять prop и событие руками, компонент пишет `defineModel`. В [`BirthdayPicker.vue`](../../src/AddressBook.Vue/src/components/BirthdayPicker.vue):

```ts
const birthday = defineModel<Date | null>({ required: true });
```

`birthday` — ref: чтение даёт значение от родителя, запись `birthday.value = ...` отправляет родителю `update:modelValue`. Внутри компонент просто передаёт его дальше — `<v-date-input v-model="birthday" />`, а родитель пишет `<BirthdayPicker v-model="model.birthday" />`.

### v-model на модель родителя

[`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue) получает от страницы объект модели и привязывает поля к его свойствам:

```vue
<v-text-field v-model="model.firstName" ... />
```

Свойство меняется прямо в объекте страницы: объект передан по ссылке. Так же в Blazor форма с `@bind-Value="_model.FirstName"` меняет экземпляр `CreateContactModel`, который принадлежит странице.

### Ссылка на элемент: useTemplateRef вместо @ref

```ts
const form = useTemplateRef('form');
// ...
const result = await form.value?.validate();
```

В шаблоне — `<v-form ref="form">`. Это аналог `@ref="_contactTable"` в `Contacts.razor`: доступ к методам дочернего компонента, здесь — к `validate()` формы Vuetify.

## 11. Слоты вместо RenderFragment

| Blazor | Vue |
|---|---|
| `@Body` в layout, `ChildContent` | `<slot />` |
| именованный `RenderFragment` (`ToolBarContent`, `NoRecordsContent`) | именованный слот `<template #top>`, `<template #no-data>` |
| `RenderFragment<T>` с `context` (`RowTemplate`) | scoped-слот `<template #item="{ item }">` |

[`MainLayout.vue`](../../src/AddressBook.Vue/src/layouts/MainLayout.vue) — layout со слотом:

```vue
<v-main>
  <v-container fluid class="pa-4">
    <ErrorBanner />
    <slot />
  </v-container>
</v-main>
```

[`App.vue`](../../src/AddressBook.Vue/src/App.vue) кладёт в этот слот `<router-view />` — место, куда маршрутизатор рендерит текущую страницу. В Blazor layout выбирает `RouteView DefaultLayout="@typeof(MainLayout)"`, а страница попадает в `@Body`.

Строка таблицы в [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) — scoped-слот: таблица передаёт в слот строку `item`, как `MudTable` передаёт `context` в `RowTemplate`:

```vue
<template #item="{ item }">
  <tr>
    <td :data-testid="`contact-row-${item.id}`">{{ item.firstName }}</td>
```

## 12. Жизненный цикл: onMounted и onBeforeUnmount вместо OnInitializedAsync и Dispose

| Blazor | Vue |
|---|---|
| конструктор, `OnInitialized` | код верхнего уровня в `<script setup>` |
| `OnInitializedAsync` | `onMounted(async () => ...)` или `watch(..., { immediate: true })` |
| `OnAfterRender(firstRender: true)` | `onMounted` (DOM уже есть) |
| `IDisposable.Dispose` | `onBeforeUnmount` / `onUnmounted` |

[`EditContactPage.vue`](../../src/AddressBook.Vue/src/pages/EditContactPage.vue):

```ts
const loadController = new AbortController();

onMounted(loadContact);
onBeforeUnmount(() => loadController.abort());
```

Пока запрос идёт, `contact` равен `null`, и шаблон показывает `v-progress-linear` — как `_model == null` в `EditContact.razor`. Когда пользователь уходит со страницы, запрос отменяется: `AbortController` — аналог `CancellationTokenSource`, а `signal` передаётся в `fetch`, как `CancellationToken` в `HttpClient`. Blazor-версия передаёт `CancellationToken.None`; Vue-версия отменяет запрос.

[`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) отменяет и устаревшие загрузки: новый поиск прерывает запрос старого, и ответы не приходят в неправильном порядке.

```ts
// A newer load supersedes the one in flight.
loadController?.abort();
const controller = new AbortController();
loadController = controller;
```

У `MudTable` это делает сама таблица: она передаёт в `ServerReload` свой `CancellationToken`.

## 13. Composables и provide/inject вместо DI и CascadingValue

В Blazor глобальный баннер ошибок — компонент [`Error.razor`](../../src/AddressBook.Web/Layout/Error.razor), который передаёт себя вниз через `<CascadingValue Value=this>`, а страница получает его через `[CascadingParameter] public Error Error`.

Во Vue то же делает пара функций в [`useErrorBanner.ts`](../../src/AddressBook.Vue/src/composables/useErrorBanner.ts):

```ts
const errorBannerKey: InjectionKey<ErrorBanner> = Symbol('errorBanner');

export function provideErrorBanner(): ErrorBanner {
  const message = ref('');
  const banner: ErrorBanner = {
    message: readonly(message),
    processError: (errorMessage) => {
      message.value = errorMessage;
    },
    // processProblem and clear
  };
  provide(errorBannerKey, banner);
  return banner;
}

export function useErrorBanner(): ErrorBanner {
  const banner = inject(errorBannerKey);
  if (!banner) {
    throw new Error('useErrorBanner() requires provideErrorBanner() in an ancestor component.');
  }
  return banner;
}
```

Фрагмент сокращён: `processProblem` и `clear` опущены, полный код — в файле.

| Шаг | Blazor | Vue |
|---|---|---|
| Создать состояние | экземпляр `Error` | `provideErrorBanner()` в [`App.vue`](../../src/AddressBook.Vue/src/App.vue) |
| Передать потомкам | `<CascadingValue Value=this>` | `provide(errorBannerKey, banner)` |
| Получить | `[CascadingParameter] Error Error` | `const errorBanner = useErrorBanner()` |
| Показать | `@if (!string.IsNullOrEmpty(ErrorMessage))` + `StateHasChanged()` | `v-if="message"` в [`ErrorBanner.vue`](../../src/AddressBook.Vue/src/components/ErrorBanner.vue); перерисовка сама |

**Composable** — обычная функция с именем `useXxx`, которая использует API реактивности и возвращает состояние и методы. Это способ переиспользовать логику с состоянием; ближайший аналог в C# — сервис, но без контейнера. `useRouter()` из Vue Router и `useTheme()` из Vuetify — тоже composables.

`InjectionKey` — типизированный ключ: `inject(errorBannerKey)` возвращает `ErrorBanner | undefined`, а не `any`. `Symbol` гарантирует, что ключ не совпадёт ни с чьим другим. `readonly(message)` отдаёт потребителям ref только для чтения: менять текст можно лишь через `processError` и `clear`.

`provide` и `inject` работают только внутри `<script setup>` (или `setup()`), пока компонент создаётся — как каскадный параметр, который существует только в дереве компонентов.

## 14. Пользовательская директива

Директива — повторно используемое поведение над DOM-элементом, у Blazor прямого аналога нет. В проекте одна: [`inputTestId.ts`](../../src/AddressBook.Vue/src/directives/inputTestId.ts).

```ts
export const vInputTestId: Directive<HTMLElement, string> = {
  mounted: (el, binding) => applyTestId(el, binding.value),
  updated: (el, binding) => applyTestId(el, binding.value),
};
```

Зачем: `v-text-field` оставляет `data-testid` на корневом `<div>`, а тестам нужен сам `<input>`. В Blazor MudBlazor передаёт `data-testid` дальше через `UserAttributes`, поэтому там директива не понадобилась.

Использование — в [`ContactForm.vue`](../../src/AddressBook.Vue/src/components/ContactForm.vue): `v-input-test-id="'contact-form-first-name'"`. Значение — выражение, поэтому строка в одинарных кавычках внутри двойных. В `<script setup>` переменная с именем `vXxx` автоматически становится директивой `v-xxx`; достаточно её импортировать.

## 15. Vue Router вместо @page и NavigationManager

Все маршруты — в одном файле [`src/router/index.ts`](../../src/AddressBook.Vue/src/router/index.ts), а не в `@page` каждой страницы:

```ts
{
  // Only an integer id matches; anything else falls through to the not-found route.
  path: '/edit-contact/:id(\\d+)',
  name: 'edit-contact',
  component: () => import('@/pages/EditContactPage.vue'),
  props: (route) => ({ id: Number(route.params.id) }),
  meta: { title: 'Edit Contact' },
},
```

| Blazor | Vue Router |
|---|---|
| `@page "/edit-contact/{Id:int}"` | `path: '/edit-contact/:id(\\d+)'` — ограничение регулярным выражением |
| `[Parameter] public int Id` из маршрута | `props: (route) => ({ id: Number(route.params.id) })` и `defineProps<{ id: number }>()` в странице |
| `<NotFound>` в `App.razor` | маршрут `/:pathMatch(.*)*` с `NotFoundPage.vue` |
| `<PageTitle>Edit Contact</PageTitle>` | `meta: { title: 'Edit Contact' }` + `router.afterEach` пишет `document.title` |
| `Navigation.NavigateTo("/contacts")` | `const router = useRouter(); router.push('/contacts')` |
| `<MudNavLink Href="" Match="NavLinkMatch.All">` | `<v-list-item to="/" exact>` в [`NavMenu.vue`](../../src/AddressBook.Vue/src/components/NavMenu.vue) |
| `<RouteView>` | `<router-view />` |

Параметры маршрута — всегда строки, поэтому `Number(...)`. Функция `props` превращает их в обычные props, и страница не знает о маршрутизаторе: её можно смонтировать в тесте с `{ props: { id: 7 } }`.

`component: () => import(...)` — ленивая загрузка: Vite выносит каждую страницу в отдельный файл, и браузер скачивает его при первом переходе. Blazor WASM скачивает всё приложение сразу.

`createWebHistory` даёт обычные URL без `#`. Чтобы обновление страницы на `/contacts` работало, сервер должен отдать `index.html` на любой путь. Dev-сервер и `vite preview` делают это сами; в Blazor для Azure это задаёт [`staticwebapp.config.json`](../../src/AddressBook.Web/wwwroot/staticwebapp.config.json).

Заголовок типизирован: файл расширяет интерфейс `RouteMeta` через `declare module 'vue-router'`, и `meta.title` становится `string | undefined`, а не `unknown`.

## 16. Vuetify вместо MudBlazor

Обе библиотеки реализуют Material Design, поэтому многое совпадает почти один в один. Полная таблица компонентов — в [спецификации](../specs/AddressBook.Vue.md#vuetify-references). Различия, которые встречаются в коде:

| Тема | MudBlazor | Vuetify |
|---|---|---|
| Настройка | `AddMudServices()`, `MudThemeProvider` в layout | `createVuetify({...})` в [`plugins/vuetify.ts`](../../src/AddressBook.Vue/src/plugins/vuetify.ts) |
| Тема | `@bind-IsDarkMode` у `MudThemeProvider` | `useTheme()` и `theme.change('dark')` в [`MainLayout.vue`](../../src/AddressBook.Vue/src/layouts/MainLayout.vue) |
| Иконки | `@Icons.Material.Filled.Delete` | строка `'mdi-delete'` (шрифт `@mdi/font`) |
| Варианты | `Variant="Variant.Filled"`, `Color="Color.Primary"` | `variant="flat"`, `color="primary"` |
| Сетка | `MudGrid` / `MudItem xs="12" sm="7"` | `v-row` / `v-col cols="12" sm="7"` |
| Таблица с сервера | `MudTable ServerData="..."` вызывает метод | `v-data-table-server` только показывает `items`; загрузку делает страница (`watch`) |
| Пейджер | `MudTablePager` | свой [`TablePager.vue`](../../src/AddressBook.Vue/src/components/TablePager.vue) в слоте `#bottom` |
| Диалог подтверждения | `MudMessageBox.ShowAsync()` возвращает результат | `v-dialog v-model="deleteDialogOpen"` + обработчик кнопки `Yes` |
| Выбор даты | `MudDatePicker` с `MaxDate` | `v-date-input` с `max` в [`BirthdayPicker.vue`](../../src/AddressBook.Vue/src/components/BirthdayPicker.vue) |
| Утилитарные классы | `Class="mt-4"` | `class="mt-4"` — те же имена отступов |

Диалог удаления в Vue — состояние, а не вызов. В [`Contacts.razor.cs`](../../src/AddressBook.Web/Pages/Contacts.razor.cs) код ждёт `await _confirmDeleteMessageBox.ShowAsync()`. В [`ContactsPage.vue`](../../src/AddressBook.Vue/src/pages/ContactsPage.vue) `askToDelete` запоминает id и открывает диалог, а продолжение — в `confirmDelete`, обработчике кнопки `Yes`.

Пропсы Vuetify-компонента можно передать и во вложенный компонент: `menu-props` в [`BirthdayPicker.vue`](../../src/AddressBook.Vue/src/components/BirthdayPicker.vue) убирает ARIA-атрибуты, которые меню календаря ставит на обёртку поля. Документация каждого компонента Vuetify перечисляет такие props в разделе API.

## 17. fetch и problem details вместо HttpClient и DelegatingHandler

В Blazor запрос идёт `AddressBookApiService` → `HttpClient` → `ProblemDetailsHandler`. Обработчик превращает неуспешный ответ в `ProblemDetailsException`. Во Vue всё это — одна функция `request()` в [`http.ts`](../../src/AddressBook.Vue/src/api/http.ts):

```ts
export async function request(path: string, options: RequestOptions): Promise<Response> {
  const url = new URL(path, apiPrefix);
  const hasBody = options.body !== undefined;

  const response = await fetch(url, {
    method: options.method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) throw new ProblemDetailsError(await buildProblem(response));
  return response;
}
```

| Blazor | Vue |
|---|---|
| `client.BaseAddress = new(API_Prefix)` | `new URL(path, apiPrefix)` |
| `PostAsJsonAsync(...)` | `body: JSON.stringify(...)` + `Content-Type` |
| `response.IsSuccessStatusCode` | `response.ok` |
| `ProblemDetailsHandler.SendAsync` | `buildProblem` + `throw` в `request()` |
| `ToProblemDetails()` (System.Text.Json, без учёта регистра) | `parseProblemDetails()` в [`problemDetails.ts`](../../src/AddressBook.Vue/src/api/problemDetails.ts) — разбор вручную |
| `GetErrors()` | `getErrors()` |
| `ReadFromJsonAsync<ContactModel>()` | `(await response.json()) as ContactModel` |

`as ContactModel` ничего не проверяет во время выполнения: TypeScript верит на слово. В C# десериализатор хотя бы создаёт объект нужного типа. Поэтому `parseProblemDetails` проверяет типы полей ошибки сам — это вход, который может прийти от прокси в любом виде.

Сервисные функции в [`contactsApi.ts`](../../src/AddressBook.Vue/src/api/contactsApi.ts) повторяют методы `IAddressBookApiService`. Например, 404 при чтении контакта — не ошибка, а `null`:

```ts
try {
  const response = await request(`contacts/${id}`, { method: 'GET', signal });
  return (await response.json()) as ContactModel;
} catch (error) {
  if (error instanceof ProblemDetailsError && error.status === 404) return null;
  throw error;
}
```

Ошибки сервера попадают на форму через [`contactFormErrors.ts`](../../src/AddressBook.Vue/src/components/contactFormErrors.ts): ключи `FirstName`, `LastName`, `Birthday` из `errors` — под поля, остальное — в список под полями. В Blazor то же делает `AddCustomError` с `ValidationMessageStore` в [`EditContact.razor`](../../src/AddressBook.Web/Pages/EditContact.razor).

## 18. Валидация: правила Vuetify вместо DataAnnotations

В Blazor правила — атрибуты модели ([`CreateContactModel.cs`](../../src/AddressBook.Web/Models/CreateContactModel.cs)), а `DataAnnotationsValidator` внутри `EditForm` их применяет. В Vuetify правило — функция, которую передают полю: она возвращает `true` или текст ошибки.

[`contactRules.ts`](../../src/AddressBook.Vue/src/rules/contactRules.ts):

```ts
export function nameRules(displayName: string): FieldRule<string | null>[] {
  return [
    (value) => (value ?? '').trim() !== '' || `The ${displayName} field is required.`,
    (value) =>
      (value ?? '').length <= NAME_MAX_LENGTH ||
      `The field ${displayName} must be a string with a maximum length of ${NAME_MAX_LENGTH}.`,
  ];
}
```

| Blazor | Vue |
|---|---|
| `[Required]` + `[Display(Name = "First name")]` | первое правило `nameRules('First name')` |
| `[StringLength(ContactRules.NameMaxLength)]` | второе правило, `NAME_MAX_LENGTH = 30` |
| `[NotInFuture]` + `TimeProvider` | `birthdayRules` + `todayUtc()` |
| `<EditForm OnSubmit=...>` + `_editContext.Validate()` | `<v-form validate-on="blur" @submit.prevent="submit">` + `await form.value?.validate()` |
| `For="@(() => _model.FirstName)"` | `:rules="firstNameRules"` на поле |
| `ValidationMessageStore.Add(...)` для ошибок сервера | `:error-messages="serverErrors.fields.firstName"` |

Тексты сообщений совпадают с Blazor и с API слово в слово — на этом держатся общие E2E-тесты. `validate-on="blur"` проверяет поле, когда оно теряет фокус; отправка формы проверяет все поля.

Дата рождения сравнивается с **UTC**-датой, как в API. `todayUtc` возвращает её как локальную полночь, потому что календарь и правило работают с локальными `Date`. В Blazor тесты подменяют часы через `TimeProvider`; во Vue функции принимают `now` параметром, а тесты фиксируют время через `vi.useFakeTimers()` и `vi.setSystemTime(...)`.

## 19. Конфигурация: .env вместо appsettings.json

| Blazor | Vue |
|---|---|
| `wwwroot/appsettings.json`: `"API_Prefix"` | [`.env.development`](../../src/AddressBook.Vue/.env.development): `VITE_API_PREFIX=...` |
| `builder.Configuration["API_Prefix"] ?? "..."` | `import.meta.env.VITE_API_PREFIX ?? '...'` в [`config.ts`](../../src/AddressBook.Vue/src/config.ts) |
| `appsettings.Development.json` | `.env.development`, личные значения — `.env.local` (в git не попадает) |

Важное отличие: Vite подставляет значение **при сборке**, прямо в код бандла. Blazor читает `appsettings.json` при запуске в браузере. Чтобы сменить адрес API у Vue, нужно пересобрать приложение. В код попадают только переменные с префиксом `VITE_`; их тип описан в [`env.d.ts`](../../src/AddressBook.Vue/env.d.ts).

## 20. Тесты: Vitest и Vue Test Utils вместо bUnit

| bUnit-набор | Vitest-набор |
|---|---|
| xUnit v3, `[Fact]` | Vitest, `describe` / `it` |
| `Assert.Equal(a, b)` | `expect(b).toBe(a)` |
| bUnit `Render<CreateContact>()` | `mount()` из `@vue/test-utils` |
| [`MudTestContext`](../../src/AddressBook.Web.Tests/Infrastructure/MudTestContext.cs) (MudBlazor, JSInterop, сервисы) | [`mountWithApp()`](../../src/AddressBook.Vue/tests/helpers/mountWithApp.ts) (Vuetify, роутер в памяти, баннер) |
| NSubstitute для `IAddressBookApiService` ([`ApiServiceMock.cs`](../../src/AddressBook.Web.Tests/Infrastructure/ApiServiceMock.cs)) | `vi.mock('@/api/contactsApi')` + `vi.mocked(createContact).mockResolvedValue(1)` |
| [`FakeHttpMessageHandler`](../../src/AddressBook.Web.Tests/Infrastructure/FakeHttpMessageHandler.cs) | `vi.stubGlobal('fetch', fetchMock)` + [`responses.ts`](../../src/AddressBook.Vue/tests/helpers/responses.ts) |
| [`FixedTimeProvider`](../../src/AddressBook.Web.Tests/Infrastructure/FixedTimeProvider.cs) | `vi.useFakeTimers()` + `vi.setSystemTime(...)` |
| `cut.Find("...")`, `WaitForAssertion` | `wrapper.get('...')`, `await flushPromises()`, `vi.waitFor` |
| браузер не нужен (рендер в памяти) | браузер не нужен (jsdom) |

Тест страницы создания — [`tests/pages/CreateContactPage.spec.ts`](../../src/AddressBook.Vue/tests/pages/CreateContactPage.spec.ts):

```ts
vi.mock('@/api/contactsApi');

it('creates the contact and goes back to the contacts list', async () => {
  const { wrapper, router } = await mountPage();

  await fillAndSubmit(wrapper, 'Ann', 'Lee');

  expect(createContact).toHaveBeenCalledWith({
    firstName: 'Ann',
    lastName: 'Lee',
    birthday: null,
  });
  await waitForRoute(router, '/contacts');
});
```

Сравните с [`Specs/Pages/CreateContactTests.cs`](../../src/AddressBook.Web.Tests/Specs/Pages/CreateContactTests.cs): та же схема «отрендерить — заполнить — отправить — проверить вызов сервиса и адрес».

`vi.mock('@/api/contactsApi')` заменяет весь модуль автоматическими заглушками: каждая экспортируемая функция становится `vi.fn()`. Это замена интерфейса-подмены: в Vue нет DI, поэтому подменяют модуль.

Что ещё полезно знать:

- **Асинхронность.** После `setValue` или `trigger` Vue перерисовывает компонент в следующем тике: пишите `await`. `flushPromises()` дожидается всех завершённых промисов — например, ответа замоканного API.
- **jsdom** — DOM без браузера. Ему не хватает API, которые нужны Vuetify; [`tests/setup.ts`](../../src/AddressBook.Vue/tests/setup.ts) подставляет заглушки `ResizeObserver`, `matchMedia` и других.
- **Монтирование в документ.** `mountWithApp` монтирует с `attachTo: document.body`, потому что диалоги и меню Vuetify рендерятся вне компонента (teleport). Поэтому в `afterEach` тест вызывает `unmount()`.
- **Структура.** Тесты лежат в `tests/` и повторяют папки `src/`: `src/components/ContactForm.vue` → `tests/components/ContactForm.spec.ts`.

Запуск — в `src/AddressBook.Vue`:

| Команда | Что делает |
|---|---|
| `npm test` | Все тесты один раз |
| `npx vitest run tests/components/ErrorBanner.spec.ts` | Один файл |
| `npx vitest run -t "shows the server field errors"` | Тесты, чьё имя содержит строку |
| `npm run test:watch` | Перезапуск при изменениях — удобно, пока пишете тест |
| `npm run test:coverage` | Покрытие; HTML-отчёт в `coverage/index.html`; порог 85 % строк и 70 % ветвей |

## 21. Общий Playwright-набор

E2E-тесты не дублируются: один набор [`src/UiTests`](../../src/UiTests) проверяет оба фронтенда. В [`playwright.config.ts`](../../src/UiTests/playwright.config.ts) два проекта, `blazor` и `vue`, с разными `baseURL`. Спеки и page-объекты общие. Разметку MudBlazor знают классы в `src/components/blazor/`, разметку Vuetify — в [`src/components/vue/`](../../src/UiTests/src/components/vue). Нужную реализацию подставляет фикстура ([`src/frontends/vue.ts`](../../src/UiTests/src/frontends/vue.ts)).

Это работает, потому что оба фронтенда выдают одинаковые тексты, aria-label и `data-testid` из [`testids.ts`](../../src/UiTests/src/utils/testids.ts).

Запуск — в `src/UiTests` (нужен SQL Server для API и один раз `npm ci` в `src/AddressBook.Vue`; подробности — в [README набора](../../src/UiTests/README.md)):

| Команда | Что делает |
|---|---|
| `npx playwright test --project=vue` | Все спеки против Vue |
| `npx playwright test tests/contacts/create.spec.ts --project=vue` | Один файл |
| `npx playwright test --project=vue --headed` | С видимым браузером |
| `npx playwright test --project=vue --ui` | UI-режим Playwright: шаги, снимки DOM, повтор теста |

Playwright сам поднимает API, Blazor и Vue (`webServer`). Vue он собирает и отдаёт через `vite preview`, а не через dev-сервер. Dev-сервер при первой загрузке может ответить 504 «Outdated Optimize Dep», пока заново оптимизирует компоненты Vuetify.

## 22. Отладка

### Vue DevTools

Расширение браузера Vue.js devtools (для Chrome, Edge и Firefox) — главный инструмент. Оно работает с `npm run dev`; в production-сборке (`vite preview`) Vue отключает devtools.

| Вкладка | Что показывает | Аналог в Blazor |
|---|---|---|
| Components | Дерево компонентов; у выбранного — props, ref, computed, provide/inject; значения можно править на лету | — (в Blazor состояние видно только в отладчике) |
| Timeline | События компонентов (`emit`), переходы маршрутизатора, производительность рендера | — |
| Routes / Router | Маршруты и текущий маршрут с параметрами | — |

Практический пример: откройте `/contacts`, выберите `ContactsPage` в дереве и смотрите, как `searchTerm`, `page` и `rows` меняются при поиске и листании. Измените `itemsPerPage` прямо в devtools — `watch` перезагрузит таблицу.

### Браузерный отладчик

- **Sources** (F12). Dev-сервер отдаёт source maps, поэтому `.vue`- и `.ts`-файлы видны как исходники: найдите файл по Ctrl+P, ставьте точки останова в `<script setup>`. Это проще, чем отладка Blazor WASM через прокси.
- `debugger;` в коде останавливает выполнение, пока открыты DevTools.
- **Network** — запросы к API: адрес, тело, ответ problem details при ошибке. Фильтр `Fetch/XHR`.
- **Console** — `console.error` из [`EditContactPage.vue`](../../src/AddressBook.Vue/src/pages/EditContactPage.vue) при ошибке загрузки и предупреждения Vue (`[Vue warn]`) — например, о не переданном обязательном prop.

### VS Code

- Расширение **Vue - Official** — подсветка, подсказки и проверка типов в `.vue`.
- Команда **Debug: Open Link** встроенного JavaScript-отладчика открывает `http://localhost:5173` в браузере с отладкой прямо в VS Code.
- **JavaScript Debug Terminal**: `npm test` в таком терминале останавливается на точках останова в тестах и в коде приложения.

### Частые ошибки новичка

| Симптом | Причина |
|---|---|
| Значение в скрипте не меняется, сравнение всегда ложно | Забыли `.value`: `busy = true` вместо `busy.value = true` |
| В props пришла строка вместо числа или булева | Нет двоеточия: `disabled="busy"` вместо `:disabled="busy"` |
| `[Vue warn]: injection "Symbol(errorBanner)" not found` или ошибка `useErrorBanner() requires provideErrorBanner()` | Компонент смонтирован без предка, который вызывает `provide`; в тестах используйте `mountWithApp` |
| Тест не видит изменений в разметке | Нет `await nextTick()` или `await flushPromises()` |
| `data-testid` не находится на `<input>` поля Vuetify | Нужна директива `v-input-test-id` ([раздел 14](#14-пользовательская-директива)) |
| Новый адрес API не применяется | `VITE_API_PREFIX` подставляется при сборке: перезапустите `npm run dev` или пересоберите |

## 23. Где Vue-фронтенд сознательно отличается

Поведение повторяет Blazor, кроме решений, принятых намеренно: текст ошибки загрузки списка, место баннера ошибок, ключи ошибок сервера вне полей формы, поиск по Enter, способ запуска для E2E и исправления доступности. Таблица с причинами — в [спецификации, раздел 10](../specs/AddressBook.Vue.md#10-deliberate-differences-from-the-blazor-frontend).

## 24. Глоссарий

| Термин | Что это | Ближайший аналог в Blazor/.NET |
|---|---|---|
| SFC (Single-File Component) | Файл `.vue` с `<script>`, `<template>` и `<style>` | `.razor` + `.razor.cs` + `.razor.css` |
| `<script setup>` | Сокращённая форма Composition API: код выполняется при создании компонента | `@code` / code-behind |
| Composition API | Стиль, где состояние и логику описывают функциями `ref`, `computed`, `watch` | — |
| Options API | Старый стиль с объектом `data`, `methods`; в проекте не используется | — |
| ref | Реактивная обёртка над значением, доступ через `.value` | поле + `StateHasChanged` |
| reactive | Реактивный объект без `.value` | — |
| computed | Кэшируемое вычисляемое значение | get-only свойство |
| watch | Реакция на изменение значений | `OnParametersSet`, обработчик `PropertyChanged` |
| props | Входные данные компонента | `[Parameter]` |
| emit | Событие от компонента родителю | `EventCallback` |
| v-model | Двусторонняя привязка | `@bind` |
| defineModel | Объявление `v-model` у компонента | пара `Value` / `ValueChanged` |
| slot / scoped slot | Место для разметки от родителя / с данными от компонента | `RenderFragment` / `RenderFragment<T>` |
| directive | Атрибут `v-...` с поведением; встроенные (`v-if`) и свои (`v-input-test-id`) | директивы Razor `@...` |
| composable | Функция `useXxx`, переиспользующая логику с состоянием | сервис |
| provide / inject | Передача значения всем потомкам | `CascadingValue` / `[CascadingParameter]` |
| plugin | Модуль, подключаемый через `app.use()` | `builder.Services.AddXxx()` |
| tick, `nextTick` | Момент, когда Vue применил накопленные изменения к DOM | конец рендера после `StateHasChanged` |
| teleport | Рендер части компонента в другое место DOM (диалоги, меню) | `MudPopoverProvider`, `MudDialogProvider` |
| Vite | Dev-сервер и сборщик | MSBuild + `dotnet watch` |
| HMR | Горячая замена модулей без перезагрузки страницы | Hot Reload |
| jsdom | DOM-реализация для Node.js, среда тестов | рендер bUnit в памяти |
| Vue Test Utils | Библиотека монтирования компонентов в тестах | bUnit |
| `vue-tsc` | Проверка типов TypeScript, включая `.vue` | компилятор C# |

## 25. Документация

| Тема | Где читать |
|---|---|
| Vue 3 | https://vuejs.org/guide/ — особенно «Essentials» и «Components In-Depth» |
| Vue Router | https://router.vuejs.org/guide/ |
| Vuetify | https://vuetifyjs.com/ — у каждого компонента раздел API с props, событиями и слотами |
| Vitest | https://vitest.dev/guide/ |
| Vue Test Utils | https://test-utils.vuejs.org/guide/ |
| Vite | https://vite.dev/guide/ |
| TypeScript | https://www.typescriptlang.org/docs/handbook/ |
| Этот проект | [AddressBook.Vue.md](../specs/AddressBook.Vue.md), [README](../../src/AddressBook.Vue/README.md), [vue.instructions.md](../../.github/instructions/vue.instructions.md) |
