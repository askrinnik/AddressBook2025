import { test, expect, APIResponse } from '@playwright/test';
import { Contact } from './dtos/contact';

const apiUrl =
  'https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/api/Contacts';

function extractContactId(response: APIResponse): number {
  const locationHeader = response.headers()['location'];
  if (!locationHeader) throw new Error('Missing Location header');
  const match = locationHeader.match(/\/Contacts\/(\d+)$/);
  if (!match?.[1]) throw new Error(`Cannot parse contact id from Location: ${locationHeader}`);
  return Number(match[1]);
}

test.describe('GET /api/Contacts', () => {
  test('get all contacts', async ({ request }) => {
    const getResponse = await request.get(`${apiUrl}`);
    expect.soft(getResponse.status()).toBe(200);
    const contactsBody = await getResponse.json();
    const contactsArray = contactsBody.rows;
    expect.soft(contactsArray.length).toBeGreaterThan(0);
    const expectedCount = contactsBody.totalRows;
    expect.soft(contactsArray.length).toBe(expectedCount);
  });

  test('get all contacts by letters', async ({ request }) => {
    const searchTerm = 'skr';
    const getResponse = await request.get(`${apiUrl}?search=${searchTerm}`);
    expect.soft(getResponse.status()).toBe(200);
    const responseBody = await getResponse.json();
    const contactsArray = responseBody.rows;

    for (const contact of contactsArray) {
      const searchableString = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const isMatch = searchableString.includes(searchTerm.toLowerCase());
      expect.soft(isMatch).toBeTruthy();
    }
    expect.soft(contactsArray.length).toBe(responseBody.totalRows);
  });

  //хочу оставить обе проверки, чтобы показать два подхода к тестированию
  test('GET contacts by search term, verifying CORRECT names', async ({ request }) => {
    const searchTerm = 'skr';
    const getResponse = await request.get(`${apiUrl}?search=${searchTerm}`);
    expect.soft(getResponse.status()).toBe(200);
    const responseBody = await getResponse.json();
    const contactsArray = responseBody.rows;

    // --- СПИСОК ОЖИДАЕМЫХ ПРАВИЛЬНЫХ КОНТАКТОВ ---
    // Создаем массив объектов с ПРАВИЛЬНЫМИ данными, которые должны вернуться
    const EXPECTED_CORRECT_CONTACTS = [
      { firstName: 'Alex', lastName: 'Skr', birthday: '1972-07-14' },
      { firstName: 'Vera', lastName: 'Skrynnik', birthday: '1998-12-11' },
      { firstName: 'Skrynnik', lastName: 'Vera', birthday: null },
    ];

    // Проверка 1: Количество совпадает
    expect.soft(contactsArray.length).toBe(EXPECTED_CORRECT_CONTACTS.length);

    // Проверка 2: Каждый возвращенный контакт должен быть в списке ожидаемых
    for (const actualContact of contactsArray) {
      // Ищем соответствие в массиве ожидаемых контактов
      const expectedMatch = EXPECTED_CORRECT_CONTACTS.find(
        (expectedContact) =>
          expectedContact.firstName === actualContact.firstName &&
          expectedContact.lastName === actualContact.lastName,
      );

      // 1. Проверяем, что контакт вообще должен был вернуться
      expect.soft(expectedMatch).toBeDefined();

      // 2. Если контакт найден, проверяем, что все его поля совпадают с ожидаемыми
      if (expectedMatch) {
        // Проверяем все поля на ИДЕАЛЬНОЕ совпадение
        expect.soft(actualContact.firstName).toBe(expectedMatch.firstName);
        expect.soft(actualContact.lastName).toBe(expectedMatch.lastName);
        expect.soft(actualContact.birthday).toBe(expectedMatch.birthday);
      }
    }
  });
});

test.describe('GET /api/Contacts/{id}', () => {
  test('get contact by id', async ({ request }) => {
    const contactId = 1;
    const response = await request.get(`${apiUrl}/${contactId}`);
    const data = await response.json();
    expect.soft(response.status()).toBe(200);
    expect.soft(data.id).toBe(contactId);
    expect.soft(data.firstName).toBe('John');
    expect.soft(data.lastName).toBe('Doe');
    expect.soft(data.birthday).toBe('1990-01-01');
  });

  test('get contact by non-existed id', async ({ request }) => {
    const contactId = 10000;
    const response = await request.get(`${apiUrl}/${contactId}`);
    expect(response.status()).toBe(404);
  });
});

test.describe('POST /api/Contacts', () => {
  test('create, verify, and delete contact with birthday data', async ({ request }) => {
    const expectedContact = Contact.createCorrectContactWithBirthday();
    const createResponse = await request.post(`${apiUrl}`, {
      data: expectedContact,
    });
    expect.soft(createResponse.status()).toBe(201);

    const contactId = extractContactId(createResponse);
    expect.soft(contactId).toBeDefined();
    const getResponse = await request.get(`${apiUrl}/${contactId}`);
    expect.soft(getResponse.ok()).toBeTruthy();

    const actualContact = await getResponse.json();
    expect.soft(actualContact.firstName).toBe(expectedContact.firstName);
    expect.soft(actualContact.lastName).toBe(expectedContact.lastName);
    expect.soft(actualContact.birthday).toBe(expectedContact.birthday);

    const deleteResponse = await request.delete(`${apiUrl}/${contactId}`);
    expect.soft(deleteResponse.ok()).toBeTruthy();

    const finalGetResponse = await request.get(`${apiUrl}/${contactId}`);
    expect.soft(finalGetResponse.status()).toBe(404);
  });

  test('create, verify, and delete contact without birthday data', async ({ request }) => {
    const expectedContact = Contact.createCorrectContactWithoutBirthday();
    const createResponse = await request.post(`${apiUrl}`, {
      data: expectedContact,
    });
    expect.soft(createResponse.status()).toBe(201);

    const contactId = extractContactId(createResponse);
    expect.soft(contactId).toBeDefined();
    const getResponse = await request.get(`${apiUrl}/${contactId}`);
    expect.soft(getResponse.ok()).toBeTruthy();

    const actualContact = await getResponse.json();
    expect.soft(actualContact.firstName).toBe(expectedContact.firstName);
    expect.soft(actualContact.lastName).toBe(expectedContact.lastName);
    expect.soft(actualContact.birthday).toBeNull();

    const deleteResponse = await request.delete(`${apiUrl}/${contactId}`);
    expect.soft(deleteResponse.ok()).toBeTruthy();

    const finalGetResponse = await request.get(`${apiUrl}/${contactId}`);
    expect.soft(finalGetResponse.status()).toBe(404);
  });

  test('create incorrect contact', async ({ request }) => {
    const contact = Contact.createIncorrectContact();
    const response = await request.post(`${apiUrl}`, {
      data: contact,
    });
    expect(response.status()).toBe(400);
  });

  test('create contact with future date', async ({ request }) => {
    const contact = Contact.createContactWithFutureDate();
    const response = await request.post(`${apiUrl}`, {
      data: contact,
    });
    expect(response.status()).toBe(400);
  });
});

test.describe('DELETE /api/Contacts/{id}', () => {
  //test('delete contact by id', async ({ request }) => {
  //const contactId = 60;
  //const response = await request.delete(`${apiUrl}/${contactId}`);
  //expect.soft(response.status()).toBe(204);
  //const responseAfterDeleting = await request.get(`${apiUrl}/${contactId}`);
  //expect.soft(responseAfterDeleting.status()).toBe(404);
  //});

  test('delete contact by non-existed id', async ({ request }) => {
    const contactId = 10000;
    const response = await request.delete(`${apiUrl}/${contactId}`);
    expect(response.status()).toBe(404);
  });
});
