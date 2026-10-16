import { createRouter, createWebHistory } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** The document title of the route. */
    title?: string;
  }
}

const DEFAULT_TITLE = 'AddressBook';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
      meta: { title: 'Home' },
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: () => import('@/pages/ContactsPage.vue'),
      meta: { title: 'Contacts' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: 'Not found' },
    },
  ],
});

router.afterEach((to) => {
  document.title = to.meta.title ?? DEFAULT_TITLE;
});

export default router;
