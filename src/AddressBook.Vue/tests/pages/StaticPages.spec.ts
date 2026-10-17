import HomePage from '@/pages/HomePage.vue';
import NotFoundPage from '@/pages/NotFoundPage.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('HomePage', () => {
  it('welcomes the user', () => {
    const wrapper = mount(HomePage);

    expect(wrapper.get('h1').text()).toBe('Contacts application');
    expect(wrapper.text()).toContain('Welcome to your Contacts app.');
  });
});

describe('NotFoundPage', () => {
  it('tells the user there is nothing at the address', () => {
    const wrapper = mount(NotFoundPage);

    expect(wrapper.get('[role="alert"]').text()).toBe("Sorry, there's nothing at this address.");
  });
});
