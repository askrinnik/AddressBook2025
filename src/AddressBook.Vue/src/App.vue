<script setup lang="ts">
import { provideErrorBanner } from '@/composables/useErrorBanner';
import MainLayout from '@/layouts/MainLayout.vue';

provideErrorBanner();
</script>

<template>
  <v-app>
    <MainLayout>
      <router-view />
    </MainLayout>
  </v-app>
</template>
