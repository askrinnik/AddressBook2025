import { ProblemDetailsError } from '@/api/problemDetails';
import type { ContactFormModel } from '@/api/types';
import ContactForm from '@/components/ContactForm.vue';
import { flushPromises, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { VDateInput } from 'vuetify/components';
import { mountWithApp, type MountedApp } from '../helpers/mountWithApp';

const firstName = '[data-testid="contact-form-first-name"]';
const lastName = '[data-testid="contact-form-last-name"]';
const submit = '[data-testid="contact-form-submit"]';
const cancel = '[data-testid="contact-form-cancel"]';

let app: MountedApp | undefined;

afterEach(() => {
  app?.wrapper.unmount();
  app = undefined;
});

async function mountForm(
  save: (model: ContactFormModel) => Promise<void> = () => Promise.resolve(),
  model: ContactFormModel = { firstName: '', lastName: '', birthday: null },
) {
  const state = reactive(model);
  app = await mountWithApp(ContactForm, {
    props: { modelValue: state, submitLabel: 'Create', save },
  });
  return { wrapper: app.wrapper, form: app.component, state };
}

async function fill(wrapper: VueWrapper, first: string, last: string): Promise<void> {
  await wrapper.get(firstName).setValue(first);
  await wrapper.get(lastName).setValue(last);
}

async function submitForm(wrapper: VueWrapper): Promise<void> {
  await wrapper.get('form').trigger('submit');
  await flushPromises();
}

function messagesOf(wrapper: VueWrapper): string[] {
  return wrapper.findAll('.v-messages__message').map((message) => message.text());
}

describe('ContactForm', () => {
  it('shows the fields, the submit label and Cancel', async () => {
    const { wrapper } = await mountForm();

    expect(wrapper.text()).toContain('First name');
    expect(wrapper.text()).toContain('Last name');
    expect(wrapper.text()).toContain('Birthday');
    expect(wrapper.get(submit).text()).toBe('Create');
    expect(wrapper.get(cancel).text()).toBe('Cancel');
  });

  it('shows the values of the model', async () => {
    const { wrapper } = await mountForm(undefined, {
      firstName: 'Ann',
      lastName: 'Lee',
      birthday: new Date(2000, 0, 5),
    });

    expect(wrapper.get<HTMLInputElement>(firstName).element.value).toBe('Ann');
    expect(wrapper.get<HTMLInputElement>(lastName).element.value).toBe('Lee');
    expect(
      wrapper.get<HTMLInputElement>('[data-testid="contact-form-birthday"]').element.value,
    ).toBe('1/5/2000');
  });

  it('writes typed values to the model', async () => {
    const { wrapper, state } = await mountForm();

    await fill(wrapper, 'Ann', 'Lee');

    expect(state.firstName).toBe('Ann');
    expect(state.lastName).toBe('Lee');
  });

  it('writes the picked birthday to the model', async () => {
    const { wrapper, state } = await mountForm();
    const birthday = new Date(2000, 0, 5);

    wrapper.getComponent(VDateInput).vm.$emit('update:modelValue', birthday);
    await flushPromises();

    expect(state.birthday).toEqual(birthday);
  });

  it('emits cancel when Cancel is clicked', async () => {
    const { wrapper, form } = await mountForm();

    await wrapper.get(cancel).trigger('click');

    expect(form.emitted('cancel')).toHaveLength(1);
  });

  describe('validation', () => {
    it('does not call save while a name is empty and shows the required messages', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const { wrapper } = await mountForm(save);

      await submitForm(wrapper);

      expect(save).not.toHaveBeenCalled();
      expect(messagesOf(wrapper)).toEqual([
        'The First name field is required.',
        'The Last name field is required.',
      ]);
    });

    it('treats a whitespace-only name as empty', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const { wrapper } = await mountForm(save);
      await fill(wrapper, '   ', 'Lee');

      await submitForm(wrapper);

      expect(save).not.toHaveBeenCalled();
      expect(messagesOf(wrapper)).toEqual(['The First name field is required.']);
    });

    it('rejects a name of 31 characters and accepts one of 30', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'x'.repeat(31), 'y'.repeat(30));

      await submitForm(wrapper);

      expect(save).not.toHaveBeenCalled();
      expect(messagesOf(wrapper)).toEqual([
        'The field First name must be a string with a maximum length of 30.',
      ]);
    });

    it('rejects a birthday in the future', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      wrapper.getComponent(VDateInput).vm.$emit('update:modelValue', tomorrow);
      await flushPromises();
      await submitForm(wrapper);

      expect(save).not.toHaveBeenCalled();
      expect(messagesOf(wrapper)).toEqual(['Birthday cannot be in the future']);
    });
  });

  describe('saving', () => {
    it('calls save with the model when every field is valid', async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const { wrapper, state } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');

      await submitForm(wrapper);

      expect(save).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledWith(state);
      expect(messagesOf(wrapper)).toEqual([]);
    });

    it('disables the submit button until save settles', async () => {
      let finish!: () => void;
      const save = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');

      await submitForm(wrapper);
      expect(wrapper.get(submit).attributes('disabled')).toBeDefined();

      finish();
      await flushPromises();
      expect(wrapper.get(submit).attributes('disabled')).toBeUndefined();
    });

    it('enables the submit button again after save fails', async () => {
      const save = vi.fn().mockRejectedValue(new Error('Boom'));
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');

      await submitForm(wrapper);

      expect(wrapper.get(submit).attributes('disabled')).toBeUndefined();
    });
  });

  describe('server errors', () => {
    it('shows field errors under their fields', async () => {
      const save = vi.fn().mockRejectedValue(
        new ProblemDetailsError({
          title: 'Validation failed',
          extensions: { errors: { FirstName: ['First is taken'], LastName: ['Last is bad'] } },
        }),
      );
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');

      await submitForm(wrapper);

      expect(messagesOf(wrapper)).toEqual(['First is taken', 'Last is bad']);
      expect(wrapper.find('.contact-form-summary').exists()).toBe(false);
    });

    it('shows the other errors in the summary under the fields', async () => {
      const save = vi.fn().mockRejectedValue(
        new ProblemDetailsError({
          title: 'Validation failed',
          extensions: { errors: { '': ['Whole form is bad'], Other: ['Another'] } },
        }),
      );
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');

      await submitForm(wrapper);

      const items = wrapper.findAll('.contact-form-summary li').map((item) => item.text());
      expect(items).toEqual(['Whole form is bad', 'Another']);
    });

    it('shows the message of an error that is not a problem in the summary', async () => {
      const save = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');

      await submitForm(wrapper);

      expect(wrapper.get('.contact-form-summary').text()).toBe('Failed to fetch');
    });

    it('clears the errors of the last save when submitting again', async () => {
      const save = vi
        .fn()
        .mockRejectedValueOnce(new Error('Boom'))
        .mockResolvedValueOnce(undefined);
      const { wrapper } = await mountForm(save);
      await fill(wrapper, 'Ann', 'Lee');
      await submitForm(wrapper);
      expect(wrapper.find('.contact-form-summary').exists()).toBe(true);

      await submitForm(wrapper);

      expect(wrapper.find('.contact-form-summary').exists()).toBe(false);
    });
  });
});
