# Issue #173 — Shared build files: `Directory.Build.props`, `Directory.Packages.props` (CPM), `.editorconfig`

> **Тип:** инфраструктура сборки. Поведение приложения не меняется, браузерный E2E не применим.

## Требование

Ввести общие для всех .NET-проектов под `src/` файлы сборки по образцу другого репозитория,
с учётом особенностей AddressBook2025 (без переноса того, что здесь не применимо).

## Затрагиваемые файлы

- `src/Directory.Packages.props` — **новый.** CPM + transitive pinning; все версии NuGet в одном месте.
  Pin-контракт: `MediatR` 12.4.1 / `MediatR.Contracts` 2.0.1 — `Pinned="true"` (13+ — коммерческая лицензия).
- `src/Directory.Build.props` — **новый.** `EnforceCodeStyleInBuild`, `GenerateDocumentationFile`,
  `RestorePackagesWithLockFile`.
- `src/.editorconfig` — **новый**, заменяет три копии `src/AddressBook.{Api,Contracts,Web}/.editorconfig`
  (удалены). Правила стиля с severity `warning`; `**/Migrations/*.cs` — generated code + CS1591 off.
- `src/*/*.csproj` — убран `Version` из `PackageReference`; в Api убран дублирующий
  `GenerateDocumentationFile`; в Contracts/Web/Web.Tests — `NoWarn CS1591` (в API доки обязательны).
- `src/*/packages.lock.json` — **новые** (генерируются restore).
- `.github/workflows/build.yml`, `security.yml` — `dotnet restore --locked-mode`.
- Код: исправлены IDE0005 / IDE0022, выявленные `EnforceCodeStyleInBuild`.
- Доки: `docs/specs/Architecture.md`, `docs/specs/AddressBook.Contracts.md`.

## Решения и отклонения от образца

- Не перенесено: `Microsoft.CodeAnalysis.BannedApiAnalyzers` / `RS0030` — анализатора в проекте нет.
- Отступы: по умолчанию 2 пробела (как в прежних `.editorconfig`), но `AddressBook.Web.Tests/**.cs`
  и `*.{razor,css,html}` — 4 пробела, т.к. код там фактически так написан (без массового переформатирования).
- Версии пакетов не обновлялись — только перенос.

## Критерии приёмки

| # | Критерий | Проверка |
|---|---|---|
| 1 | Release-сборка чистая | `dotnet build src/AddressBook.slnx -c Release --no-incremental` → 0 warnings, 0 errors |
| 2 | Lock-файлы согласованы | `dotnet restore src/AddressBook.slnx --locked-mode` проходит |
| 3 | Тесты зелёные | `dotnet test --project src/AddressBook.Web.Tests` → 60/60 |
| 4 | Версии не изменились | `packages.lock.json` резолвит те же версии, что были в `.csproj` |
