import { createContact } from '@/api/contactsApi';
import { ProblemDetailsError } from '@/api/problemDetails';
import CreateContactPage from '@/pages/CreateContactPage.vue';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWithApp, waitForRoute, type MountedApp } from '../helpers/mountWithApp';

vi.mock('@/api/contactsApi');

const firstName = '[data-testid="contact-form-first-name"]';
const lastName = '[data-testid="contact-form-last-name"]';
const submit = '[data-testid="contact-form-submit"]';

let app: MountedApp | undefined;

async function mountPage(): Promise<MountedApp> {
  app = await mountWithApp(CreateContactPage, { route: '/create-contact' });
  return app;
}

async function fillAndSubmit(wrapper: VueWrapper, first: string, last: string): Promise<void> {
  await wrapper.get(firstName).setValue(first);
  await wrapper.get(lastName).setValue(last);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}

beforeEach(() => {
  vi.mocked(createContact).mockResolvedValue(1);
});

afterEach(() => {
  app?.wrapper.unmount();
  app = undefined;
  vi.resetAllMocks();
});

describe('CreateContactPage', () => {
  it('shows an empty form with a Create button', async () => {
    const { wrapper } = await mountPage();

    expect(wrapper.get<HTMLInputElement>(firstName).element.value).toBe('');
    expect(wrapper.get<HTMLInputElement>(lastName).element.value).toBe('');
    expect(wrapper.get(submit).text()).toBe('Create');
  });

  it('does not call the API while the form is invalid', async () => {
    const { wrapper, router } = await mountPage();

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createContact).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/create-contact');
  });

  it('creates the contact and goes back to the contacts list', async () => {
    const { wrapper, router } = await mountPage();

    await fillAndSubmit(wrapper, 'Ann', 'Lee');

    expect(createContact).toHaveBeenCalledWith({
      firstName: 'Ann',
      lastName: 'Lee',
      birthday: null,
    });
    await waitForRoute(router, '/contacts');
  });

  it('shows the server field errors and stays on the page', async () => {
    vi.mocked(createContact).mockRejectedValue(
      new ProblemDetailsError({
        title: 'Validation failed',
        extensions: { errors: { FirstName: ['First name is taken'] } },
      }),
    );
    const { wrapper, router } = await mountPage();

    await fillAndSubmit(wrapper, 'Ann', 'Lee');

    expect(wrapper.text()).toContain('First name is taken');
    expect(router.currentRoute.value.path).toBe('/create-contact');
  });

  it('keeps the submit button disabled while the contact is being created', async () => {
    let finish!: (id: number) => void;
    vi.mocked(createContact).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const { wrapper } = await mountPage();

    await fillAndSubmit(wrapper, 'Ann', 'Lee');
    expect(wrapper.get(submit).attributes('disabled')).toBeDefined();

    finish(1);
    await flushPromises();
  });

  it('goes back to the contacts list on Cancel without calling the API', async () => {
    const { wrapper, router } = await mountPage();

    await wrapper.get('[data-testid="contact-form-cancel"]').trigger('click');
    await flushPromises();

    await waitForRoute(router, '/contacts');
    expect(createContact).not.toHaveBeenCalled();
  });
});
