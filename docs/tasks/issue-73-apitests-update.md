# Issue #73 [ApiTests][T13] — `tests/contacts/update.spec.ts` (PUT — новое покрытие)

> **Режим:** test-authoring (метки `api`, `testing`). Поведение `PUT` уже реализовано —
> продакшн-код не трогаем. Единственный артефакт: новый spec-файл с E2E-тестами Playwright.

## Требование

Добавить отсутствующее сейчас покрытие эндпоинта `PUT api/Contacts/{id}`: полное и
«частичное» (в рамках PUT-семантики — полное тело) обновление, `404`, валидацию `400` и
границы. Данные self-contained с очисткой в teardown.

## Критерии приёмки

| # | Критерий |
|---|----------|
| A1 | Полное обновление существующего контакта → `204`, последующий `GET` подтверждает новые значения. |
| A2 | «Частичное» обновление отдельных полей (смена только firstName / обнуление birthday / добавление birthday) → `204`, итоговое состояние проверено `GET`. |
| A3 | Обновление несуществующего id → `404`. |
| A4 | Валидация: пустой firstName / пустой lastName / 31 символ / будущая дата → `400` с problem-details по нужному свойству. |
| A5 | id из маршрута перекрывает id в теле: PUT на реальный id с чужим id в теле обновляет ресурс маршрута, посторонний контакт не затронут. |
| A6 | Граница длины 30 символов (firstName и lastName) → `204`. |
| A7 | Дата «сегодня» как birthday → `204`. |
| A8 | Данные self-contained, очистка в teardown (через фикстуру), покрыты позитив, негатив и границы. |

## Факты об API (основание для дизайна)

- `PUT api/Contacts/{id:int}` (`UpdateContactCommand`) → `204` (найден) | `400` | `404` (не найден).
- Контроллер выполняет `request.Id = id` — **id маршрута всегда перекрывает id тела**.
- Handler сначала `ValidateAndThrowAsync`, затем `UpdateAsync` → **невалидное тело даёт `400`
  раньше проверки существования**.
- Валидация идентична create: `FirstName`/`LastName` `NotEmpty` + `MaximumLength(30)`;
  `Birthday` (если задан) `<= сегодня`, сообщение `"Birthday cannot be in the future"`.
- В update-валидаторе **нет** правила на `Id`.
- Problem-details: `title = "Validation Error"`, `detail = "One or more validation errors occurred"`.
- `{id:int}` — нечисловой id отсекается роутингом (`404`), до валидатора не доходит.

## Затрагиваемые файлы

- **Добавляется:** `src/ApiTests/tests/contacts/update.spec.ts`.
- **Обновляется:** `docs/tasks/api-tests-framework-plan.md` — отметить `T13` как `[x]`.
- Продакшн-код и инфраструктура тестов **не меняются** — переиспользуем существующие
  `contactsClient`, `contactFactory`, `expectMatchesSchema`, `expectProblemDetails`.

## Переиспользуемая инфраструктура

- Фикстуры `src/fixtures/api.fixtures.ts`: `contactsClient` (авто-регистрация созданных id
  для teardown), `contactFactory`.
- `contactsClient.update(id, cmd)` → сырой `ApiResponse { status, headers, body }`.
- Фабрики: `validContact`, `validContactWithoutBirthday`, `firstName30Chars`,
  `firstName31Chars`, `lastName30Chars`, `lastName31Chars`, `emptyFirstName`,
  `emptyLastName`, `birthdayInFuture`, `birthdayToday`.
- Ассерты: `expectMatchesSchema(body, contactModelSchema)`, `expectProblemDetails(...)`.

## Tests — сценарии Playwright (`update.spec.ts`)

**`PUT /api/Contacts/{id} — full update` (A1, A2)**
- полное обновление всех полей (firstName + lastName + birthday) → `204`, `GET` подтверждает
  все новые значения (A1);
- обнуление birthday (было заполнено → `null`) → `204`, `GET` показывает `birthday === null` (A2);
- добавление birthday контакту, у которого его не было → `204`, `GET` показывает дату (A2);
- смена только firstName при неизменных lastName/birthday → `204`, `GET` подтверждает новый
  firstName и прежние lastName/birthday (A2).

**`PUT /api/Contacts/{id} — route id overrides body id` (A5)**
- создать контакты A и B; PUT на id A с телом, где `id = B.id`; → `204`; `GET A` показывает
  обновлённые данные, `GET B` не изменился.

**`PUT /api/Contacts/{id} — not found` (A3)**
- создать контакт, удалить его, затем PUT на его id валидным телом → `404` (self-contained).

**`PUT /api/Contacts/{id} — length boundaries` (A6, A4)**
- firstName ровно 30 → `204`, `GET` подтверждает длину 30;
- lastName ровно 30 → `204`, `GET` подтверждает длину 30;
- firstName 31 → `400`, problem-details по `FirstName`;
- lastName 31 → `400`, problem-details по `LastName`.

**`PUT /api/Contacts/{id} — empty required fields` (A4)**
- пустой firstName → `400`, problem-details по `FirstName`;
- пустой lastName → `400`, problem-details по `LastName`.

**`PUT /api/Contacts/{id} — birthday validation` (A4, A7)**
- будущая дата → `400`, problem-details по `Birthday`, сообщение `"Birthday cannot be in the future"`;
- «сегодня» → `204`, `GET` подтверждает дату.

Все негативные кейсы валидации выполняются над **реально существующим** созданным контактом,
чтобы отделить `400` (валидация) от `404` (существование) и заодно подтвердить, что валидатор
срабатывает раньше поиска.

## Изоляция и очистка

- Каждый тест создаёт свои контакты через `contactsClient.create` (фикстура сама удаляет их в
  teardown). Тест `not found` дополнительно удаляет контакт явно и проверяет `404`.
- Уникальность имён обеспечивают фабрики (run-token), тесты не зависят от seed-данных и
  устойчивы к параллельному прогону на общей БД.

## Вне зоны действия

- PATCH / частичное обновление на уровне API (эндпоинт — полный PUT, отдельного PATCH нет).
- Изменение продакшн-кода, фабрик, клиента или фикстур.
- Contract-schema spec (`T16`) и CRUD-lifecycle (`T15`) — отдельные задачи.

## Верификация

- `run-api` (или reuse) → API на `http://localhost:5000`.
- `npx playwright test tests/contacts/update.spec.ts` — все кейсы зелёные.
- `npm run lint` в `src/ApiTests` — без новых замечаний.
- Каждый критерий A1–A8 закрыт минимум одним тестом, где ассерты реально проверяют поведение.
