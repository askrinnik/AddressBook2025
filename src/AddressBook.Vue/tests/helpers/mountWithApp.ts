import { provideErrorBanner, type ErrorBanner } from '@/composables/useErrorBanner';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { expect, vi } from 'vitest';
import { defineComponent, h, type Component } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { createVuetify } from 'vuetify';
import { VApp } from 'vuetify/components';

export interface MountOptions {
  /** Props of the mounted component. */
  props?: Record<string, unknown>;
  /** Route the router starts on. */
  route?: string;
  /** Wraps the component in `v-app`, which the layout components need. */
  inApp?: boolean;
}

export interface MountedApp {
  wrapper: VueWrapper;
  router: Router;
  banner: ErrorBanner;
  /** The mounted component itself, for emitted events and props. */
  component: VueWrapper;
}

const routeStub = defineComponent({ render: () => h('div') });

/** Creates a router on memory history with the application's route paths and empty pages. */
export function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: routeStub },
      { path: '/contacts', component: routeStub },
      { path: '/create-contact', component: routeStub },
      { path: '/edit-contact/:id(\\d+)', component: routeStub },
    ],
  });
}

/**
 * Mounts a component the way the application does: with Vuetify, a router and the global error
 * banner. The component is attached to the document so that overlays can teleport into it.
 */
export async function mountWithApp(
  component: Component,
  options: MountOptions = {},
): Promise<MountedApp> {
  const router = createTestRouter();
  await router.push(options.route ?? '/');
  await router.isReady();

  let banner!: ErrorBanner;
  const host = defineComponent({
    setup() {
      banner = provideErrorBanner();
      return () => {
        const child = h(component, options.props);
        return options.inApp ? h(VApp, () => child) : child;
      };
    },
  });

  const wrapper = mount(host, {
    attachTo: document.body,
    global: { plugins: [createVuetify(), router] },
  });
  await flushPromises();

  return {
    wrapper,
    router,
    banner,
    component: wrapper.findComponent(component) as VueWrapper,
  };
}

/** Waits until the router has navigated to the path; navigation finishes after a few ticks. */
export async function waitForRoute(router: Router, path: string): Promise<void> {
  await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(path));
}
