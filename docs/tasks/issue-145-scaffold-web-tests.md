# Issue #145 (B1) — Scaffold `src/AddressBook.Web.Tests`

> **Тип:** инфраструктура / каркас (Фаза 0). Production-код не трогаем, браузерный E2E не применим.
> **Родительский план:** [blazor-component-tests-framework-plan.md](blazor-component-tests-framework-plan.md)

## Требование

Создать каркас нового .NET-проекта компонентных (bUnit) тестов `src/AddressBook.Web.Tests`,
добавить его в решение и убедиться, что он собирается и запускается через `dotnet test`.
Тестовый код (базовый `MudTestContext`, sanity-тест) — это уже задача **B2** (#146), здесь только
каркас.

## Затрагиваемые файлы

- `src/AddressBook.Web.Tests/AddressBook.Web.Tests.csproj` — новый проект (`net10.0`, `OutputType=Exe`
  для xUnit v3, `IsPackable=false`, `ProjectReference` на `AddressBook.Web`).
- `src/AddressBook.Web.Tests/GlobalUsings.cs` — общие `global using` (Bunit, Xunit, NSubstitute).
- `src/AddressBook.Web.Tests/xunit.runner.json` — конфиг раннера (+ копирование в output).
- `src/AddressBook.Web.Tests/.gitignore` — `bin/`, `obj/`, `TestResults/`, покрытие.
- `src/AddressBook.Web.Tests/README.md`, `CLAUDE.md` — заглушки-пойнтеры на план и инструкции.
- `src/AddressBook.sln` — регистрация нового проекта.

## Пакеты (итоговый набор — MTP-native)

`bunit` 2.9.0 · `xunit.v3` 4.0.0 · `NSubstitute` 6.2.0 · `Bogus` 35.6.5.

> **Отклонение от рамочного плана (зафиксировано при реализации).** Рамочный план перечислял
> `Microsoft.NET.Test.Sdk`, `xunit.runner.visualstudio`, `coverlet.collector`,
> `GitHubActionsTestLogger`. На **.NET 10 SDK** классический VSTest-путь удалён, а xUnit v3
> работает нативно на **Microsoft.Testing.Platform (MTP)** — эти VSTest-пакеты не нужны и
> конфликтуют (`error: Testing with VSTest target is no longer supported`). Решение:
> - использовать MTP-native набор (только `xunit.v3` + доменные пакеты);
> - включить MTP-режим `dotnet test` через `global.json` в корне репозитория:
>   `{ "test": { "runner": "Microsoft.Testing.Platform" } }`;
> - MTP-расширения покрытия (`Microsoft.Testing.Extensions.CodeCoverage`) и CI-репорта отложены
>   до задачи **B20** (CI), где они реально используются.
>
> Рамочный план и его раздел «Стек»/B20 будут синхронизированы в задаче **B19** (обновление доков).

## Подход

1. Написать `.csproj` (SDK `Microsoft.NET.Sdk`, `OutputType=Exe` — требование xUnit v3, ссылки на
   пакеты и на Web-проект; MudBlazor приходит транзитивно, отдельный `PackageReference` не дублируем).
2. Добавить `GlobalUsings.cs`, `xunit.runner.json` (+ `CopyToOutputDirectory`), `.gitignore`,
   README/CLAUDE-заглушки.
3. Добавить `global.json` (секция `test.runner` = MTP) в корень репозитория.
4. `dotnet sln src/AddressBook.sln add …`.
5. `dotnet restore` + `dotnet build src/AddressBook.sln` — зелёно.
6. `dotnet test --project src/AddressBook.Web.Tests` — раннер MTP стартует (0 тестов на этом
   шаге; MTP возвращает exit code 8 «zero tests», это ожидаемо до B2).

## Критерии приёмки

- [ ] Проект `src/AddressBook.Web.Tests` существует с корректным `.csproj` (net10.0, все пакеты,
  `ProjectReference` на `AddressBook.Web`, `IsPackable=false`).
- [ ] Присутствуют `xunit.runner.json`, `GlobalUsings.cs`, `.gitignore`, `README.md`, `CLAUDE.md`.
- [ ] Проект добавлен в `src/AddressBook.sln`.
- [ ] `dotnet build src/AddressBook.sln` проходит без ошибок (без новых предупреждений от каркаса).
- [ ] `dotnet test --project src/AddressBook.Web.Tests` запускает MTP-раннер xUnit v3 (0 тестов на
  этапе B1 → exit code 8 «zero tests»; станет 0 после первого теста в B2).

## Вне области

- Базовый `MudTestContext`, заглушки JSInterop, sanity-тест рендера — задача **B2** (#146).
- CI-workflow — задача **B20** (#164).
