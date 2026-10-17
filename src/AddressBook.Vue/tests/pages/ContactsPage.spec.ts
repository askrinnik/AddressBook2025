import { deleteContact, getFilteredContacts } from '@/api/contactsApi';
import { ProblemDetailsError } from '@/api/problemDetails';
import type { ContactModel } from '@/api/types';
import TablePager from '@/components/TablePager.vue';
import ContactsPage from '@/pages/ContactsPage.vue';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VTextField } from 'vuetify/components';
import { mountWithApp, waitForRoute, type MountedApp } from '../helpers/mountWithApp';

vi.mock('@/api/contactsApi');

const searchInput = '[data-testid="contacts-search"]';

let app: MountedApp | undefined;

function contact(id: number, firstName: string, lastName: string, birthday: string | null = null) {
  return { id, firstName, lastName, birthday } satisfies ContactModel;
}

/** Contacts "Name01 Surname01", "Name02 Surname02", ... */
function numberedContacts(count: number): ContactModel[] {
  return Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return contact(index + 1, `Name${number}`, `Surname${number}`);
  });
}

/** Makes the API return the contacts, all rows at once as the real API does. */
function serve(contacts: ContactModel[]): void {
  vi.mocked(getFilteredContacts).mockResolvedValue({
    totalRows: contacts.length,
    rows: contacts,
  });
}

async function mountPage(): Promise<MountedApp> {
  app = await mountWithApp(ContactsPage, { route: '/contacts' });
  return app;
}

function firstNames(wrapper: VueWrapper): string[] {
  return wrapper.findAll('tbody tr td:first-child').map((cell) => cell.text());
}

function caption(wrapper: VueWrapper): string {
  return wrapper.get('.v-data-table-footer__info').text();
}

async function search(wrapper: VueWrapper, text: string): Promise<void> {
  const input = wrapper.get(searchInput);
  await input.setValue(text);
  await input.trigger('blur');
  await flushPromises();
}

async function sortBy(wrapper: VueWrapper, title: string): Promise<void> {
  const header = wrapper.findAll('th').find((cell) => cell.text() === title);
  await header!.trigger('click');
  await flushPromises();
}

async function clickPager(wrapper: VueWrapper, label: string): Promise<void> {
  await wrapper.get(`button[aria-label="${label}"]`).trigger('click');
  await flushPromises();
}

function dialogButton(selector: string): HTMLElement {
  return document.body.querySelector<HTMLElement>(selector)!;
}

async function askToDelete(wrapper: VueWrapper, id: number): Promise<void> {
  await wrapper.get(`[data-testid="contact-delete-${id}"]`).trigger('click');
  await flushPromises();
}

async function confirmDelete(): Promise<void> {
  dialogButton('[data-testid="contact-delete-confirm"]').click();
  await flushPromises();
}

beforeEach(() => {
  serve([]);
  vi.mocked(deleteContact).mockResolvedValue();
});

afterEach(() => {
  app?.wrapper.unmount();
  app = undefined;
  vi.resetAllMocks();
});

describe('ContactsPage', () => {
  describe('table', () => {
    it('lists the contacts with their birthdays as M/D/YYYY', async () => {
      serve([contact(1, 'Ann', 'Lee', '2000-01-05'), contact(2, 'Bob', 'Roe')]);

      const { wrapper } = await mountPage();

      const rows = wrapper.findAll('tbody tr').map((row) => row.findAll('td').map((c) => c.text()));
      expect(rows).toEqual([
        ['Ann', 'Lee', '1/5/2000', ''],
        ['Bob', 'Roe', '', ''],
      ]);
    });

    it('loads all contacts without a search term at first', async () => {
      await mountPage();

      expect(getFilteredContacts).toHaveBeenCalledWith('', expect.any(AbortSignal));
    });

    it('shows a message when there are no contacts', async () => {
      const { wrapper } = await mountPage();

      expect(wrapper.text()).toContain('No matching records found');
      expect(wrapper.find('.v-alert').exists()).toBe(false);
    });

    it('shows a loading indicator while the contacts load', async () => {
      vi.mocked(getFilteredContacts).mockReturnValue(new Promise(() => {}));

      const { wrapper } = await mountPage();

      expect(wrapper.text()).toContain('Loading...');
    });

    it('shows the range and the total in the pager', async () => {
      serve(numberedContacts(25));

      const { wrapper } = await mountPage();

      expect(caption(wrapper)).toBe('1-10 of 25');
      expect(firstNames(wrapper)).toHaveLength(10);
    });
  });

  describe('search', () => {
    it('does not search while the text is being typed', async () => {
      const { wrapper } = await mountPage();
      vi.mocked(getFilteredContacts).mockClear();

      await wrapper.get(searchInput).setValue('an');
      await flushPromises();

      expect(getFilteredContacts).not.toHaveBeenCalled();
    });

    it('searches when the field loses focus', async () => {
      const { wrapper } = await mountPage();

      await search(wrapper, 'ann');

      expect(getFilteredContacts).toHaveBeenLastCalledWith('ann', expect.any(AbortSignal));
    });

    it('searches on Enter', async () => {
      const { wrapper } = await mountPage();
      const input = wrapper.get(searchInput);

      await input.setValue('bob');
      await input.trigger('keydown.enter');
      await flushPromises();

      expect(getFilteredContacts).toHaveBeenLastCalledWith('bob', expect.any(AbortSignal));
    });

    it('does not reload when the committed text is unchanged', async () => {
      const { wrapper } = await mountPage();
      await search(wrapper, 'ann');
      vi.mocked(getFilteredContacts).mockClear();

      await wrapper.get(searchInput).trigger('blur');
      await flushPromises();

      expect(getFilteredContacts).not.toHaveBeenCalled();
    });

    it('shows all contacts again when the field is cleared', async () => {
      const { wrapper } = await mountPage();
      await search(wrapper, 'ann');

      wrapper.getComponent(VTextField).vm.$emit('update:modelValue', null);
      wrapper.getComponent(VTextField).vm.$emit('click:clear', new MouseEvent('click'));
      await flushPromises();

      expect(getFilteredContacts).toHaveBeenLastCalledWith('', expect.any(AbortSignal));
    });

    it('goes back to the first page when the term changes', async () => {
      serve(numberedContacts(25));
      const { wrapper } = await mountPage();
      await clickPager(wrapper, 'Next page');
      expect(caption(wrapper)).toBe('11-20 of 25');

      await search(wrapper, 'name');

      expect(caption(wrapper)).toBe('1-10 of 25');
    });
  });

  describe('sorting', () => {
    const contacts = [
      contact(1, 'Carl', 'Zed', '2001-02-03'),
      contact(2, 'Anna', 'Yu'),
      contact(3, 'Bert', 'Xi', '1999-12-31'),
    ];

    it('keeps the order of the API when no column is sorted', async () => {
      serve(contacts);

      const { wrapper } = await mountPage();

      expect(firstNames(wrapper)).toEqual(['Carl', 'Anna', 'Bert']);
    });

    it('sorts by first name ascending and then descending', async () => {
      serve(contacts);
      const { wrapper } = await mountPage();

      await sortBy(wrapper, 'First name');
      expect(firstNames(wrapper)).toEqual(['Anna', 'Bert', 'Carl']);

      await sortBy(wrapper, 'First name');
      expect(firstNames(wrapper)).toEqual(['Carl', 'Bert', 'Anna']);
    });

    it('sorts by last name', async () => {
      serve(contacts);
      const { wrapper } = await mountPage();

      await sortBy(wrapper, 'Last name');

      expect(firstNames(wrapper)).toEqual(['Bert', 'Anna', 'Carl']);
    });

    it('sorts by birthday with the contacts that have none first', async () => {
      serve(contacts);
      const { wrapper } = await mountPage();

      await sortBy(wrapper, 'Birthday');

      expect(firstNames(wrapper)).toEqual(['Anna', 'Bert', 'Carl']);
    });

    it('does not sort by the actions column', async () => {
      serve(contacts);
      const { wrapper } = await mountPage();

      await sortBy(wrapper, 'Actions');

      expect(firstNames(wrapper)).toEqual(['Carl', 'Anna', 'Bert']);
    });
  });

  describe('paging', () => {
    it('shows the next page of the contacts', async () => {
      serve(numberedContacts(25));
      const { wrapper } = await mountPage();

      await clickPager(wrapper, 'Next page');

      expect(firstNames(wrapper)[0]).toBe('Name11');
      expect(caption(wrapper)).toBe('11-20 of 25');
    });

    it('shows the last page with the remaining contacts', async () => {
      serve(numberedContacts(25));
      const { wrapper } = await mountPage();

      await clickPager(wrapper, 'Last page');

      expect(firstNames(wrapper)).toEqual(['Name21', 'Name22', 'Name23', 'Name24', 'Name25']);
    });

    it('shows more rows and goes back to the first page when the page size changes', async () => {
      serve(numberedContacts(30));
      const { wrapper } = await mountPage();
      await clickPager(wrapper, 'Next page');

      wrapper.getComponent(TablePager).vm.$emit('update:itemsPerPage', 25);
      await flushPromises();

      expect(caption(wrapper)).toBe('1-25 of 30');
      expect(firstNames(wrapper)).toHaveLength(25);
    });
  });

  describe('load errors', () => {
    it('shows the problem detail inline and in the banner', async () => {
      vi.mocked(getFilteredContacts).mockRejectedValue(
        new ProblemDetailsError({ title: 'Server Error', detail: 'The database is down' }),
      );

      const { wrapper, banner } = await mountPage();

      expect(wrapper.get('.v-alert').text()).toBe('The database is down');
      expect(banner.message.value).toBe('The database is down');
    });

    it('shows the title of a problem without detail', async () => {
      vi.mocked(getFilteredContacts).mockRejectedValue(
        new ProblemDetailsError({ title: 'Server Error' }),
      );

      const { banner } = await mountPage();

      expect(banner.message.value).toBe('Server Error');
    });

    it('shows the message of another error', async () => {
      vi.mocked(getFilteredContacts).mockRejectedValue(new TypeError('Failed to fetch'));

      const { banner } = await mountPage();

      expect(banner.message.value).toBe('Failed to fetch');
    });

    it('shows the text of a thrown value that is not an error', async () => {
      vi.mocked(getFilteredContacts).mockRejectedValue('boom');

      const { banner } = await mountPage();

      expect(banner.message.value).toBe('boom');
    });

    it('clears the inline alert and the banner after a successful load', async () => {
      vi.mocked(getFilteredContacts).mockRejectedValueOnce(new Error('Down'));
      const { wrapper, banner } = await mountPage();
      expect(banner.message.value).toBe('Down');
      serve([contact(1, 'Ann', 'Lee')]);

      await search(wrapper, 'ann');

      expect(banner.message.value).toBe('');
      expect(wrapper.find('.v-alert').exists()).toBe(false);
      expect(firstNames(wrapper)).toEqual(['Ann']);
    });

    it('shows no error for a load that was superseded by a newer one', async () => {
      let failFirst!: (error: Error) => void;
      vi.mocked(getFilteredContacts).mockReturnValueOnce(
        new Promise((_resolve, reject) => (failFirst = reject)),
      );
      const { wrapper, banner } = await mountPage();
      serve([contact(1, 'Ann', 'Lee')]);

      await search(wrapper, 'ann');
      failFirst(new Error('Aborted'));
      await flushPromises();

      expect(banner.message.value).toBe('');
      expect(firstNames(wrapper)).toEqual(['Ann']);
    });

    it('cancels the load in flight when the page is left', async () => {
      vi.mocked(getFilteredContacts).mockReturnValue(new Promise(() => {}));
      const { wrapper } = await mountPage();
      const signal = vi.mocked(getFilteredContacts).mock.calls[0][1]!;

      wrapper.unmount();

      expect(signal.aborted).toBe(true);
    });
  });

  describe('deleting', () => {
    beforeEach(() => {
      serve([contact(1, 'Ann', 'Lee'), contact(2, 'Bob', 'Roe')]);
    });

    it('asks for confirmation before deleting', async () => {
      const { wrapper } = await mountPage();

      await askToDelete(wrapper, 2);

      expect(document.body.textContent).toContain('Are you sure you want to delete this contact?');
      expect(deleteContact).not.toHaveBeenCalled();
    });

    it('deletes the contact and reloads the table after confirmation', async () => {
      const { wrapper } = await mountPage();
      await askToDelete(wrapper, 2);
      serve([contact(1, 'Ann', 'Lee')]);

      await confirmDelete();

      expect(deleteContact).toHaveBeenCalledWith(2);
      expect(firstNames(wrapper)).toEqual(['Ann']);
    });

    it('deletes nothing when the dialog is cancelled', async () => {
      const { wrapper } = await mountPage();
      await askToDelete(wrapper, 2);
      vi.mocked(getFilteredContacts).mockClear();

      const cancel = [
        ...document.body.querySelectorAll<HTMLElement>('.v-card-actions button'),
      ].find((button) => button.textContent?.trim() === 'Cancel');
      cancel!.click();
      await flushPromises();

      expect(deleteContact).not.toHaveBeenCalled();
      expect(getFilteredContacts).not.toHaveBeenCalled();
    });

    it('treats a 404 as success and shows no error', async () => {
      vi.mocked(deleteContact).mockRejectedValue(
        new ProblemDetailsError({ title: 'Not Found', status: 404 }),
      );
      const { wrapper, banner } = await mountPage();
      await askToDelete(wrapper, 2);
      serve([contact(1, 'Ann', 'Lee')]);

      await confirmDelete();

      expect(banner.message.value).toBe('');
      expect(firstNames(wrapper)).toEqual(['Ann']);
    });

    it('keeps the banner of a failed delete through the reload that follows', async () => {
      vi.mocked(deleteContact).mockRejectedValue(
        new ProblemDetailsError({ title: 'Server Error', detail: 'Cannot delete', status: 500 }),
      );
      const { wrapper, banner } = await mountPage();
      await askToDelete(wrapper, 2);

      await confirmDelete();

      expect(banner.message.value).toBe('Cannot delete');
      expect(firstNames(wrapper)).toEqual(['Ann', 'Bob']);
    });

    it('goes back to the first page when the last row of the last page is deleted', async () => {
      serve(numberedContacts(11));
      const { wrapper } = await mountPage();
      await clickPager(wrapper, 'Next page');
      expect(firstNames(wrapper)).toEqual(['Name11']);
      await askToDelete(wrapper, 11);
      serve(numberedContacts(10));

      await confirmDelete();

      expect(caption(wrapper)).toBe('1-10 of 10');
      expect(firstNames(wrapper)).toHaveLength(10);
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      serve([contact(4, 'Ann', 'Lee')]);
    });

    it('opens the Create page from the Create Contact button', async () => {
      const { wrapper, router } = await mountPage();

      await wrapper.get('[data-testid="contacts-create"]').trigger('click');

      await waitForRoute(router, '/create-contact');
    });

    it('opens the Edit page of the contact from its edit button', async () => {
      const { wrapper, router } = await mountPage();

      await wrapper.get('[data-testid="contact-edit-4"]').trigger('click');

      await waitForRoute(router, '/edit-contact/4');
    });
  });
});
