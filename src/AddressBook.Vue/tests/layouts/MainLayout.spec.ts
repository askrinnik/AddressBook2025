import MainLayout from '@/layouts/MainLayout.vue';
import { afterEach, describe, expect, it } from 'vitest';
import { mountWithApp, type MountedApp } from '../helpers/mountWithApp';

let app: MountedApp | undefined;

async function mountLayout(): Promise<MountedApp> {
  app = await mountWithApp(MainLayout, { inApp: true });
  return app;
}

afterEach(() => {
  app?.wrapper.unmount();
  app = undefined;
});

describe('MainLayout', () => {
  it('shows the application title in the app bar', async () => {
    const { wrapper } = await mountLayout();

    expect(wrapper.get('.v-app-bar-title').text()).toBe('Contact Book');
  });

  it('links to Home and Contacts in the navigation', async () => {
    const { wrapper } = await mountLayout();

    expect(wrapper.get('[data-testid="nav-home"]').attributes('href')).toBe('/');
    expect(wrapper.get('[data-testid="nav-contacts"]').attributes('href')).toBe('/contacts');
  });

  it('marks the link of the current route as active', async () => {
    app = await mountWithApp(MainLayout, { inApp: true, route: '/contacts' });

    expect(app.wrapper.get('[data-testid="nav-contacts"]').classes()).toContain(
      'v-list-item--active',
    );
    expect(app.wrapper.get('[data-testid="nav-home"]').classes()).not.toContain(
      'v-list-item--active',
    );
  });

  it('opens the navigation drawer at first and toggles it with the app bar button', async () => {
    const { wrapper } = await mountLayout();
    const drawer = wrapper.get('#nav-drawer');
    expect(drawer.classes()).toContain('v-navigation-drawer--active');

    await wrapper.get('[data-testid="app-drawer-toggle"]').trigger('click');
    expect(drawer.classes()).not.toContain('v-navigation-drawer--active');

    await wrapper.get('[data-testid="app-drawer-toggle"]').trigger('click');
    expect(drawer.classes()).toContain('v-navigation-drawer--active');
  });

  it('switches between the light and the dark theme with the theme button', async () => {
    const { wrapper } = await mountLayout();
    const toggle = wrapper.get('[data-testid="app-theme-toggle"]');
    expect(wrapper.get('.v-application').classes()).toContain('v-theme--light');
    expect(toggle.find('.mdi-weather-night').exists()).toBe(true);

    await toggle.trigger('click');
    expect(wrapper.get('.v-application').classes()).toContain('v-theme--dark');
    expect(toggle.find('.mdi-theme-light-dark').exists()).toBe(true);

    await toggle.trigger('click');
    expect(wrapper.get('.v-application').classes()).toContain('v-theme--light');
  });

  it('shows the error banner above the page content', async () => {
    const { wrapper, banner } = await mountLayout();
    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);

    banner.processError('Server unreachable');
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="error-banner"]').text()).toContain('Server unreachable');
  });
});
