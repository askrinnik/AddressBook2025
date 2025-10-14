import { test, expect } from '@playwright/test';
import { Contact } from './dtos/contact';
import { ProblemDetails } from './dtos/ProblemDetails';
import { ApiClient } from './api-client';
import { StatusCodes } from 'http-status-codes';

test.describe('GET /api/Contacts', () => {
  test('get all contacts', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const contactsBody = await apiClient.getContacts();
    const contactsArray = contactsBody.rows;
    expect.soft(contactsArray.length).toBeGreaterThan(0);
    const expectedCount = contactsBody.totalRows;
    expect.soft(contactsArray.length).toBe(expectedCount);
  });

  test('get all contacts by letters', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const searchTerm = 'skr';
    const contactsBody = await apiClient.getContactsByTerm(searchTerm);
    const contactsArray = contactsBody.rows;

    for (const contact of contactsArray) {
      const searchableString = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const isMatch = searchableString.includes(searchTerm.toLowerCase());
      expect.soft(isMatch).toBeTruthy();
    }
    expect.soft(contactsArray.length).toBe(contactsBody.totalRows);
  });

  //хочу оставить обе проверки, чтобы показать два подхода к тестированию
  test('GET contacts by search term, verifying CORRECT names', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const searchTerm = 'skr';
    const contactsBody = await apiClient.getContactsByTerm(searchTerm);
    const contactsArray = contactsBody.rows;

    const EXPECTED_CORRECT_CONTACTS = [
      new Contact('Alex', 'Skr', '1972-07-14'),
      new Contact('Vera', 'Skrynnik', '1998-12-11'),
      new Contact('Skrynnik', 'Vera'),
    ];

    expect.soft(contactsArray.length).toBe(EXPECTED_CORRECT_CONTACTS.length);

    // Проверка 2: Каждый возвращенный контакт должен быть в списке ожидаемых
    for (const actualContact of contactsArray) {
      // Ищем соответствие в массиве ожидаемых контактов
      const expectedMatch = EXPECTED_CORRECT_CONTACTS.find(
        (expectedContact) =>
          expectedContact.firstName === actualContact.firstName &&
          expectedContact.lastName === actualContact.lastName,
      );

      expect.soft(expectedMatch).toBeDefined();
    }
  });
});

test.describe('GET /api/Contacts/{id}', () => {
  test('get contact by id', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const contactId = 1;
    const contactsBody = await apiClient.getContactById(contactId);
    expect.soft(contactsBody.id).toBe(contactId);
    expect.soft(contactsBody.firstName).toBe('John');
    expect.soft(contactsBody.lastName).toBe('Doe');
    expect.soft(contactsBody.birthday).toBe('1990-01-01');
  });

  test('get contact by non-existed id', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const nonExistentContactId = 10000;
    const contactsBody = await apiClient.getContactByWrongId(nonExistentContactId);
    expect(contactsBody.status()).toBe(404);
  });
});

test.describe('POST /api/Contacts', () => {
  test('create, verify, and delete contact with birthday data', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const expectedContact = Contact.createCorrectContactWithBirthday();
    const contactId = await apiClient.createContact(expectedContact);
    const actualContact = await apiClient.getContactById(contactId);
    expect.soft(actualContact.firstName).toBe(expectedContact.firstName);
    expect.soft(actualContact.lastName).toBe(expectedContact.lastName);
    expect.soft(actualContact.birthday).toBe(expectedContact.birthday);

    await apiClient.deleteContactById(contactId);
    const finalGetResponse = await apiClient.getContactByWrongId(contactId);
    expect.soft(finalGetResponse.status()).toBe(StatusCodes.NOT_FOUND);
  });

  test('create, verify, and delete contact without birthday data', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const expectedContact = Contact.createCorrectContactWithoutBirthday();
    const contactId = await apiClient.createContact(expectedContact);
    const actualContact = await apiClient.getContactById(contactId);
    expect.soft(actualContact.firstName).toBe(expectedContact.firstName);
    expect.soft(actualContact.lastName).toBe(expectedContact.lastName);
    expect.soft(actualContact.birthday).toBeNull();

    await apiClient.deleteContactById(contactId);
    const finalGetResponse = await apiClient.getContactByWrongId(contactId);
    expect.soft(finalGetResponse.status()).toBe(StatusCodes.NOT_FOUND);
  });

  test('create incorrect contact', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const contact = Contact.createIncorrectContact();
    const response = await apiClient.createInvalidContact(contact);
    expect(response.status()).toBe(400);
  });

  test('create contact with future date', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const contact = Contact.createContactWithFutureDate();
    const response = await apiClient.createInvalidContact(contact);
    expect(response.status()).toBe(400);
    const problemDetails = ProblemDetails.fromJSON(await response.json());
    expect(problemDetails.hasErrors()).toBeTruthy();
    const errors = problemDetails.messagesFor('Birthday');
    expect(errors.length).toBe(1);
    expect(errors[0]).toBe('Birthday cannot be in the future');
  });
});

test.describe('DELETE /api/Contacts/{id}', () => {
  test('delete contact by non-existed id', async ({ request }) => {
    const apiClient = ApiClient.getInstance(request);
    const nonExistentContactId = 10000;
    const response = await apiClient.deleteContactByWrongId(nonExistentContactId);
    expect(response.status()).toBe(404);
  });
});
