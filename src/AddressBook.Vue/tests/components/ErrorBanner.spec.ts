import ErrorBanner from '@/components/ErrorBanner.vue';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mountWithApp } from '../helpers/mountWithApp';

describe('ErrorBanner', () => {
  it('is hidden while there is no error', async () => {
    const { wrapper } = await mountWithApp(ErrorBanner);

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });

  it('shows the heading and the message of an error', async () => {
    const { wrapper, banner } = await mountWithApp(ErrorBanner);

    banner.processError('Server unreachable');
    await nextTick();

    const alert = wrapper.get('[data-testid="error-banner"]');
    expect(alert.text()).toContain('Woops!');
    expect(alert.get('pre').text()).toBe('Server unreachable');
  });

  it('hides again when the error is cleared', async () => {
    const { wrapper, banner } = await mountWithApp(ErrorBanner);
    banner.processError('Server unreachable');
    await nextTick();

    banner.clear();
    await nextTick();

    expect(wrapper.find('[data-testid="error-banner"]').exists()).toBe(false);
  });
});
