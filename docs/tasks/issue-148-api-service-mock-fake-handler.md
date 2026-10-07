# План: Issue #148 — Blazor Tests B4: `ApiServiceMock` + `FakeHttpMessageHandler`

> **Issue:** [#148](https://github.com/askrinnik/AddressBook2025/issues/148) — «Blazor Tests B4: ApiServiceMock + FakeHttpMessageHandler» (Фаза 1)
> **Режим работы:** test-authoring / инфраструктура — **production-код не трогаем**.

## 1. Требование

`Infrastructure/ApiServiceMock.cs` + `Infrastructure/FakeHttpMessageHandler.cs` — хелперы NSubstitute
(частые расстановки `Returns`/`Received`) и управляемый `HttpMessageHandler` (статус, `Location`,
problem+json) для тестов сервиса.

## 2. Acceptance

- [x] `ApiServiceMock` — extension-методы над `IAddressBookApiService`: настройка ответов
  (`GetFilteredContactsAsync`, `GetContactByIdAsync`, `CreateContact`, ошибки) и проверки вызовов
  (`Received`/`DidNotReceive` для search/delete/create/update).
- [x] `FakeHttpMessageHandler` — отдаёт заданный ответ: статус, `Location`, JSON-тело, problem+json;
  запоминает запросы (метод, URI, тело) для ассертов.
- [x] `FakeHttpMessageHandler.CreateClient()` собирает `HttpClient` с реальным `ProblemDetailsHandler`
  в pipeline (non-success → `ProblemDetailsException`), как в `Program.cs`.
- [x] Хелперы покрыты тестами; `dotnet build src/AddressBook.slnx` без предупреждений, `dotnet test` зелёный.

## 3. Затронутые файлы (только `src/AddressBook.Web.Tests`)

- `Infrastructure/ApiServiceMock.cs` — `public static class`, extension-методы.
- `Infrastructure/FakeHttpMessageHandler.cs` — `HttpMessageHandler` + `RecordedRequest`.
- `Tests/Infrastructure/ApiServiceMockTests.cs`, `Tests/Infrastructure/FakeHttpMessageHandlerTests.cs`.

## 4. Подход

1. **`ApiServiceMock`**: `ReturnsContacts(params ContactModel[])` / `ReturnsContacts(IEnumerable, totalRows)`,
   `ReturnsContactsFor(searchTerm, …)`, `ReturnsContact(id, contact)`, `ReturnsContactNotFound(id)` (→ `null`),
   `ReturnsCreatedId(id)`, `ThrowsOnGetContacts(Exception)`, `ThrowsOnDelete(Exception)`;
   проверки `ReceivedSearch(term, times)`, `ReceivedDelete(id)`, `DidNotReceiveDelete()`, `ReceivedCreate()`,
   `DidNotReceiveCreate()`, `ReceivedUpdate(id)`.
2. **`FakeHttpMessageHandler`**: очередь ответов + ответ по умолчанию; `Respond(status)`,
   `RespondJson(status, value)`, `RespondCreated(location)`, `RespondProblem(status, title, detail, errors?)`
   (`application/problem+json`), `Respond(Func<HttpRequestMessage, HttpResponseMessage>)`;
   `Requests` (тело читается eagerly в `SendAsync`); `CreateClient(baseAddress?, withProblemDetails = true)`.
3. Тесты хелперов (по принципу: хелпер, которому доверяют 15+ тестов, сам должен быть проверен).

## 5. Tests

Playwright API/UI не нужны — поведение API/UI не меняется. Покрытие — xUnit-тесты хелперов (п. 3).

## 6. Верификация

`dotnet build src/AddressBook.slnx`, `dotnet test src/AddressBook.Web.Tests`. Браузерный UI-walk не применим.

## 7. Вне скоупа

`AddressBookApiServiceTests` (B17), `ContactBuilder` (B5), harness-обёртки (B6).
