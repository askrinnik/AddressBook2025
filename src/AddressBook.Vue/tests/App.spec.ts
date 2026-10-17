import App from '@/App.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import { createTestRouter } from './helpers/mountWithApp';

describe('App', () => {
  let wrapper: ReturnType<typeof mount> | undefined;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  async function mountApp(path: string) {
    const router = createTestRouter();
    await router.push(path);
    wrapper = mount(App, {
      attachTo: document.body,
      global: { plugins: [createVuetify(), router] },
    });
    await flushPromises();
    return wrapper;
  }

  it('hosts the layout around the routed page', async () => {
    const app = await mountApp('/');

    expect(app.get('.v-app-bar-title').text()).toBe('Contact Book');
    expect(app.find('[data-testid="nav-contacts"]').exists()).toBe(true);
  });
});
