import PlaceholderPage from '@/pages/PlaceholderPage.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/:pathMatch(.*)*', name: 'placeholder', component: PlaceholderPage }],
});

export default router;
