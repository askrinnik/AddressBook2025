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
      // No title of its own, so the document title is the default, as in the Blazor frontend.
      path: '/create-contact',
      name: 'create-contact',
      component: () => import('@/pages/CreateContactPage.vue'),
    },
    {
      // Only an integer id matches; anything else falls through to the not-found route.
      path: '/edit-contact/:id(\\d+)',
      name: 'edit-contact',
      component: () => import('@/pages/EditContactPage.vue'),
      props: (route) => ({ id: Number(route.params.id) }),
      meta: { title: 'Edit Contact' },
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
