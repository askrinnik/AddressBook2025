import { getContactById, updateContact } from '@/api/contactsApi';
import { ProblemDetailsError } from '@/api/problemDetails';
import EditContactPage from '@/pages/EditContactPage.vue';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWithApp, waitForRoute, type MountedApp } from '../helpers/mountWithApp';

vi.mock('@/api/contactsApi');

const firstName = '[data-testid="contact-form-first-name"]';
const lastName = '[data-testid="contact-form-last-name"]';
const birthday = '[data-testid="contact-form-birthday"]';
const submit = '[data-testid="contact-form-submit"]';

const contact = { id: 7, firstName: 'Ann', lastName: 'Lee', birthday: '2000-01-05' };

let app: MountedApp | undefined;

async function mountPage(id = 7): Promise<MountedApp> {
  app = await mountWithApp(EditContactPage, { props: { id }, route: `/edit-contact/${id}` });
  return app;
}

function inputValue(wrapper: VueWrapper, selector: string): string {
  return wrapper.get<HTMLInputElement>(selector).element.value;
}

beforeEach(() => {
  vi.mocked(getContactById).mockResolvedValue(contact);
  vi.mocked(updateContact).mockResolvedValue();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  app?.wrapper.unmount();
  app = undefined;
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('EditContactPage', () => {
  it('requests the contact with the id of the route', async () => {
    await mountPage(7);

    expect(getContactById).toHaveBeenCalledWith(7, expect.any(AbortSignal));
  });

  it('shows a progress bar while the contact loads', async () => {
    vi.mocked(getContactById).mockReturnValue(new Promise(() => {}));

    const { wrapper } = await mountPage();

    expect(wrapper.find('[aria-label="Loading contact"]').exists()).toBe(true);
    expect(wrapper.find('form').exists()).toBe(false);
  });

  it('fills the form with the loaded contact', async () => {
    const { wrapper } = await mountPage();

    expect(wrapper.find('[aria-label="Loading contact"]').exists()).toBe(false);
    expect(inputValue(wrapper, firstName)).toBe('Ann');
    expect(inputValue(wrapper, lastName)).toBe('Lee');
    expect(inputValue(wrapper, birthday)).toBe('1/5/2000');
    expect(wrapper.get(submit).text()).toBe('Save');
  });

  it('leaves the birthday empty for a contact without one', async () => {
    vi.mocked(getContactById).mockResolvedValue({ ...contact, birthday: null });

    const { wrapper } = await mountPage();

    expect(inputValue(wrapper, birthday)).toBe('');
  });

  it('shows a warning and a way back for an unknown contact', async () => {
    vi.mocked(getContactById).mockResolvedValue(null);

    const { wrapper, router } = await mountPage();

    expect(wrapper.get('.v-alert').text()).toContain('Contact not found.');
    expect(wrapper.find('form').exists()).toBe(false);

    const back = wrapper.get('button');
    expect(back.text()).toBe('Back to Contacts');
    await back.trigger('click');
    await waitForRoute(router, '/contacts');
  });

  it('shows the detail of a problem when the load fails', async () => {
    vi.mocked(getContactById).mockRejectedValue(
      new ProblemDetailsError({ title: 'Server Error', detail: 'The database is down' }),
    );

    const { wrapper } = await mountPage();

    expect(wrapper.get('.v-alert').text()).toContain('The database is down');
    expect(wrapper.find('form').exists()).toBe(false);
    expect(wrapper.get('button').text()).toBe('Back to Contacts');
  });

  it('shows the title of a problem without detail', async () => {
    vi.mocked(getContactById).mockRejectedValue(new ProblemDetailsError({ title: 'Server Error' }));

    const { wrapper } = await mountPage();

    expect(wrapper.get('.v-alert').text()).toContain('Server Error');
  });

  it('shows a general message and logs the cause for another error', async () => {
    const failure = new TypeError('Failed to fetch');
    vi.mocked(getContactById).mockRejectedValue(failure);

    const { wrapper } = await mountPage();

    expect(wrapper.get('.v-alert').text()).toContain('Could not load the contact.');
    expect(wrapper.text()).not.toContain('Failed to fetch');
    expect(console.error).toHaveBeenCalledWith('Loading contact 7 failed', failure);
  });

  it('cancels the load request when the page is left', async () => {
    let fail!: (error: Error) => void;
    vi.mocked(getContactById).mockReturnValue(new Promise((_resolve, reject) => (fail = reject)));
    const { wrapper } = await mountPage();
    const signal = vi.mocked(getContactById).mock.calls[0][1]!;

    wrapper.unmount();
    fail(new DOMException('Aborted', 'AbortError'));
    await flushPromises();

    expect(signal.aborted).toBe(true);
    expect(wrapper.exists()).toBe(false);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('saves the changes and goes back to the contacts list', async () => {
    const { wrapper, router } = await mountPage();
    await wrapper.get(firstName).setValue('Anna');

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(updateContact).toHaveBeenCalledWith(7, {
      firstName: 'Anna',
      lastName: 'Lee',
      birthday: new Date(2000, 0, 5),
    });
    await waitForRoute(router, '/contacts');
  });

  it('does not call the API while the form is invalid', async () => {
    const { wrapper } = await mountPage();
    await wrapper.get(lastName).setValue('');

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(updateContact).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('The Last name field is required.');
  });

  it('shows the server errors of a failed save and stays on the page', async () => {
    vi.mocked(updateContact).mockRejectedValue(
      new ProblemDetailsError({
        title: 'Validation failed',
        extensions: { errors: { LastName: ['Last name is taken'] } },
      }),
    );
    const { wrapper, router } = await mountPage();

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.text()).toContain('Last name is taken');
    expect(router.currentRoute.value.path).toBe('/edit-contact/7');
  });

  it('goes back to the contacts list on Cancel', async () => {
    const { wrapper, router } = await mountPage();

    await wrapper.get('[data-testid="contact-form-cancel"]').trigger('click');
    await flushPromises();

    await waitForRoute(router, '/contacts');
    expect(updateContact).not.toHaveBeenCalled();
  });
});
