import { provideErrorBanner, useErrorBanner, type ErrorBanner } from '@/composables/useErrorBanner';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

/** Mounts a parent that provides the banner and a child that uses it. */
function mountBanner(): ErrorBanner {
  let used!: ErrorBanner;
  const child = defineComponent({
    setup() {
      used = useErrorBanner();
      return () => h('div');
    },
  });
  const parent = defineComponent({
    setup() {
      provideErrorBanner();
      return () => h(child);
    },
  });
  mount(parent);
  return used;
}

describe('useErrorBanner', () => {
  it('starts without a message', () => {
    expect(mountBanner().message.value).toBe('');
  });

  it('shows a plain error message', () => {
    const banner = mountBanner();

    banner.processError('Something failed');

    expect(banner.message.value).toBe('Something failed');
  });

  it('shows the extensions of a problem as indented JSON', () => {
    const banner = mountBanner();

    banner.processProblem({ title: 'Bad', extensions: { errors: { x: ['y'] } } });

    expect(banner.message.value).toBe(JSON.stringify({ errors: { x: ['y'] } }, null, 2));
  });

  it.each([[null], [undefined], [{ title: 'No extensions' }]])(
    'shows null for the problem %j',
    (problem) => {
      const banner = mountBanner();

      banner.processProblem(problem);

      expect(banner.message.value).toBe('null');
    },
  );

  it('clears the message', () => {
    const banner = mountBanner();
    banner.processError('Something failed');

    banner.clear();

    expect(banner.message.value).toBe('');
  });

  it('keeps the message read-only', () => {
    const banner = mountBanner();

    (banner.message as { value: string }).value = 'changed';

    expect(banner.message.value).toBe('');
  });

  it('throws when no ancestor provides the banner', () => {
    const lonely = defineComponent({
      setup() {
        useErrorBanner();
        return () => h('div');
      },
    });

    expect(() => mount(lonely)).toThrow('requires provideErrorBanner()');
  });
});
