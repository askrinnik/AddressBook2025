import TablePager from '@/components/TablePager.vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import { VSelect } from 'vuetify/components';

interface PagerProps {
  page: number;
  itemsPerPage: number;
  totalRows: number;
}

function mountPager(props: PagerProps): VueWrapper {
  return mount(TablePager, {
    props: { ...props, itemsPerPageOptions: [10, 25, 50] },
    global: { plugins: [createVuetify()] },
  });
}

function button(wrapper: VueWrapper, label: string) {
  return wrapper.get(`button[aria-label="${label}"]`);
}

describe('TablePager', () => {
  it('shows the range of the current page and the total', () => {
    const wrapper = mountPager({ page: 2, itemsPerPage: 10, totalRows: 25 });

    expect(wrapper.get('.v-data-table-footer__info').text()).toBe('11-20 of 25');
  });

  it('ends the range of the last page at the total', () => {
    const wrapper = mountPager({ page: 3, itemsPerPage: 10, totalRows: 25 });

    expect(wrapper.get('.v-data-table-footer__info').text()).toBe('21-25 of 25');
  });

  it('shows 0-0 of 0 when there are no rows', () => {
    const wrapper = mountPager({ page: 1, itemsPerPage: 10, totalRows: 0 });

    expect(wrapper.get('.v-data-table-footer__info').text()).toBe('0-0 of 0');
  });

  it('disables First and Previous on the first page', () => {
    const wrapper = mountPager({ page: 1, itemsPerPage: 10, totalRows: 25 });

    expect(button(wrapper, 'First page').attributes('disabled')).toBeDefined();
    expect(button(wrapper, 'Previous page').attributes('disabled')).toBeDefined();
    expect(button(wrapper, 'Next page').attributes('disabled')).toBeUndefined();
    expect(button(wrapper, 'Last page').attributes('disabled')).toBeUndefined();
  });

  it('disables Next and Last on the last page', () => {
    const wrapper = mountPager({ page: 3, itemsPerPage: 10, totalRows: 25 });

    expect(button(wrapper, 'Next page').attributes('disabled')).toBeDefined();
    expect(button(wrapper, 'Last page').attributes('disabled')).toBeDefined();
    expect(button(wrapper, 'First page').attributes('disabled')).toBeUndefined();
    expect(button(wrapper, 'Previous page').attributes('disabled')).toBeUndefined();
  });

  it('disables every button when everything fits on one page', () => {
    const wrapper = mountPager({ page: 1, itemsPerPage: 10, totalRows: 0 });

    for (const label of ['First page', 'Previous page', 'Next page', 'Last page']) {
      expect(button(wrapper, label).attributes('disabled')).toBeDefined();
    }
  });

  it.each([
    ['First page', 1],
    ['Previous page', 2],
    ['Next page', 4],
    ['Last page', 5],
  ])('emits the page for %s', async (label, expectedPage) => {
    const wrapper = mountPager({ page: 3, itemsPerPage: 10, totalRows: 50 });

    await button(wrapper, label).trigger('click');

    expect(wrapper.emitted('update:page')).toEqual([[expectedPage]]);
  });

  it('emits the new size when the rows per page change', async () => {
    const wrapper = mountPager({ page: 1, itemsPerPage: 10, totalRows: 50 });

    wrapper.getComponent(VSelect).vm.$emit('update:modelValue', 25);

    expect(wrapper.emitted('update:itemsPerPage')).toEqual([[25]]);
  });
});
