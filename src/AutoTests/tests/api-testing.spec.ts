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
    console.log(data);
    expect.soft(response.status()).toBe(200);
    expect.soft(data.id).toBe(contactId);
  });

  test('get contact by non-existed id', async ({ request }) => {
    const contactId = 10000;
    const response = await request.get(`${apiUrl}/${contactId}`);
    expect(response.status()).toBe(404);
  });
});

test.describe('POST /api/Contacts', () => {
  test('create contact with birthday', async ({ request }) => {
    const contact = Contact.createCorrectContactWithBirthday();
    const response = await request.post(`${apiUrl}`, {
      data: contact,
    });
    expect(response.status()).toBe(201);
  });

  test('create contact without birthday', async ({ request }) => {
    const contact = Contact.createCorrectContactWithoutBirthday();
    const response = await request.post(`${apiUrl}`, {
      data: contact,
    });
    expect(response.status()).toBe(201);
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
