# План: Issue #151 — Blazor Tests B7: MainLayoutTests + NavMenuTests

> **Issue:** [#151](https://github.com/askrinnik/AddressBook2025/issues/151) — «Blazor Tests B7: MainLayoutTests + NavMenuTests» (Фаза 2)
> **Режим работы:** test-authoring — **production-код (`AddressBook.Web`) не трогаем**, новые `data-testid` не добавляем.

## 1. Требование

`Tests/Layout/MainLayoutTests.cs` + `Tests/Layout/NavMenuTests.cs` — компонентные bUnit-тесты оболочки:
провайдеры отрендерены, drawer toggle, тумблер темы (dark/light), заголовок, ссылки Home/Contacts и их `href`.

## 2. Acceptance

- [x] `MainLayout` рендерит `MudThemeProvider`, `MudPopoverProvider`, `MudDialogProvider`, `MudSnackbarProvider`.
- [x] `MainLayout` рендерит `Body` внутри `MudMainContent` и хостит `NavMenu` внутри `MudDrawer`.
- [x] Заголовок AppBar — «Contact Book».
- [x] Drawer по умолчанию открыт; `app-drawer-toggle` закрывает его, повторный клик — открывает.
- [x] Тема по умолчанию light (`MudThemeProvider.IsDarkMode == false`, иконка DarkMode); `app-theme-toggle` → dark (провайдер получает `IsDarkMode == true`, иконка AutoMode); повторный клик → light.
- [x] Кнопки AppBar имеют доступные имена (`aria-label`).
- [x] `NavMenu`: ссылки Home и Contacts с текстом и `href` (`""`/`/` и `/contacts`).
- [x] `NavMenu`: активная ссылка следует за URI — `/` → Home (Match=All), `/contacts` и `/contacts/...` → Contacts (Match=Prefix), Home при этом не активна.
- [x] Только `MudTestContext` + harness `AppShellHarness` / `TestIds` / `aria-label`; без `Task.Delay`/`Sleep`.
- [x] `dotnet build src/AddressBook.slnx` без новых предупреждений, `dotnet test --project src/AddressBook.Web.Tests` зелёный.

## 3. Затронутые файлы (только `src/AddressBook.Web.Tests`)

- `Tests/Layout/MainLayoutTests.cs` — новый.
- `Tests/Layout/NavMenuTests.cs` — новый.
- `Infrastructure/MudBlazorJsInterop.cs` — `SetupBrowserWindowSize` (см. §8).
- `docs/tasks/blazor-component-tests-framework-plan.md` — отметить B7 выполненным.

## 4. Подход

- `MainLayout` рендерится с `Body`-фрагментом; доменные проверки — через `AppShellHarness` (B6),
  структурные (провайдеры, `NavMenu` в drawer) — через `FindComponent<T>`.
- Тема дополнительно проверяется по состоянию самого `MudThemeProvider` (`Instance.IsDarkMode`) —
  это подтверждает, что `@bind-IsDarkMode` реально доходит до провайдера, а не только меняет иконку.
- `NavMenu` рендерится отдельно; активная ссылка меняется через `NavigationManager.NavigateTo`
  (`FakeNavigationManager`), `NavLink` перерисовывается по `LocationChanged`.

## 5. Tests

Playwright API/UI не нужны — поведение API/UI не меняется; deliverable — сами bUnit-тесты (happy path,
граничные: повторный toggle, prefix-match вложенного пути; негативные: неактивная ссылка).

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test --project src/AddressBook.Web.Tests`. Браузерный UI-walk
не применим (компонентные тесты в памяти).

## 7. Вне скоупа

`ErrorTests` (B8) и остальные спеки Фазы 2. Если тесты вскроют реальный дефект в Web — останавливаемся и
заводим отдельный bug-issue.

## 8. Отклонения от плана (по итогам реализации)

- `MudDrawer` — responsive: без заглушки loose-JSInterop отдаёт размер окна 0×0 (брейкпоинт Xs), и drawer
  закрывается сразу после первого рендера. В `Infrastructure/MudBlazorJsInterop.cs` добавлен
  `SetupBrowserWindowSize(width, height)` (заглушка `mudResizeListener.getBrowserWindowSize`);
  `MainLayoutTests` ставит десктопный viewport 1920×1080. Дополнительно покрыт мобильный кейс:
  при 375×812 drawer по умолчанию закрыт.
- Состояние `MudThemeProvider.IsDarkMode` читается через `GetState(x => x.IsDarkMode)`
  (`MudBlazor.Extensions`) — прямой доступ к параметру даёт предупреждение анализатора `MUD0012`.
