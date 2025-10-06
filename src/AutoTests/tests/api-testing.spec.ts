import { test, expect } from '@playwright/test';
import { Contact } from './dtos/contact';

const apiUrl =
  'https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/api/Contacts';

test.describe('GET /api/Contacts', () => {
  test('get all contacts', async ({ request }) => {
    const response = await request.get(`${apiUrl}`);
    console.log(await response.json());
    expect(response.status()).toBe(200);
  });

  test('get all contacts by letters (first name)', async ({ request }) => {
    const response = await request.get(`${apiUrl}?search=jo`);
    console.log(await response.json());
    expect(response.status()).toBe(200);
  });

  test('get all contacts by letters (last name)', async ({ request }) => {
    const response = await request.get(`${apiUrl}?search=skr`);
    console.log(await response.json());
    expect(response.status()).toBe(200);
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

    const locationHeader = createResponse.headers()['location'];
    const match = locationHeader?.match(/\/Contacts\/(\d+)$/);
    expect.soft(match?.[1]).toBeDefined();

    const contactId = Number(match?.[1]);
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

    const locationHeader = createResponse.headers()['location'];
    const match = locationHeader?.match(/\/Contacts\/(\d+)$/);
    expect.soft(match?.[1]).toBeDefined();

    const contactId = Number(match?.[1]);
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
