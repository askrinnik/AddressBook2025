import { APIRequestContext, APIResponse, expect } from '@playwright/test';
import { StatusCodes } from 'http-status-codes';
import { GetContactsResponse } from './dtos/GetContactsResponse';
import { Contact } from './dtos/contact';

const serviceURL = 'https://addressbook-api-h5gmdghdcyfaf6gu.westeurope-01.azurewebsites.net/api/';
const contactsPath = 'Contacts';

export class ApiClient {
  static instance: ApiClient;
  private request: APIRequestContext;

  private constructor(request: APIRequestContext) {
    this.request = request;
  }

  public static getInstance(request: APIRequestContext): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(request);
    }
    return ApiClient.instance;
  }

  public static extractIdFromResponse(response: APIResponse): number {
    const locationHeader = response.headers()['location'];
    if (!locationHeader) throw new Error('Missing Location header');
    const match = locationHeader.match(/\/Contacts\/(\d+)$/);
    if (!match?.[1]) throw new Error(`Cannot parse contact id from Location: ${locationHeader}`);
    return Number(match[1]);
  }

  async getContacts(): Promise<GetContactsResponse> {
    const getResponse = await this.request.get(`${serviceURL}${contactsPath}`);
    expect.soft(getResponse.status()).toBe(StatusCodes.OK);
    return getResponse.json();
  }

  async getContactsByTerm(searchTerm: string): Promise<GetContactsResponse> {
    const getResponse = await this.request.get(`${serviceURL}${contactsPath}?search=${searchTerm}`);
    expect.soft(getResponse.status()).toBe(StatusCodes.OK);
    return getResponse.json();
  }

  async getContactById(contactId: number): Promise<Contact> {
    const getResponse = await this.request.get(`${serviceURL}${contactsPath}/${contactId}`);
    expect.soft(getResponse.status()).toBe(StatusCodes.OK);
    return getResponse.json();
  }

  async getContactByWrongId(contactId: number): Promise<APIResponse> {
    return await this.request.get(`${serviceURL}${contactsPath}/${contactId}`);
  }

  async createContact(contactData: Contact): Promise<number> {
    const createResponse = await this.request.post(`${serviceURL}${contactsPath}`, {
      data: contactData,
    });
    expect.soft(createResponse.status()).toBe(StatusCodes.CREATED);
    return ApiClient.extractIdFromResponse(createResponse);
  }

  async createInvalidContact(contactData: Contact): Promise<APIResponse> {
    return await this.request.post(`${serviceURL}${contactsPath}`, {
      data: contactData,
    });
  }

  async deleteContactById(contactId: number): Promise<void> {
    const deleteResponse = await this.request.delete(`${serviceURL}${contactsPath}/${contactId}`);
    expect.soft(deleteResponse.ok()).toBeTruthy();
  }

  async deleteContactByWrongId(contactId: number): Promise<APIResponse> {
    return await this.request.delete(`${serviceURL}${contactsPath}/${contactId}`);
  }
}
