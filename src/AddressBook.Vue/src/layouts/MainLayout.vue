<script setup lang="ts">
import ErrorBanner from '@/components/ErrorBanner.vue';
import NavMenu from '@/components/NavMenu.vue';
import { computed, ref } from 'vue';
import { useTheme } from 'vuetify';

const drawerOpen = ref(true);
const theme = useTheme();
const isDarkMode = computed(() => theme.current.value.dark);
const themeIcon = computed(() => (isDarkMode.value ? 'mdi-theme-light-dark' : 'mdi-weather-night'));

function toggleTheme(): void {
  theme.change(isDarkMode.value ? 'light' : 'dark');
}
</script>

<template>
  <v-app-bar elevation="1">
    <v-app-bar-nav-icon
      aria-label="Toggle navigation drawer"
      data-testid="app-drawer-toggle"
      @click="drawerOpen = !drawerOpen"
    />
    <v-app-bar-title class="text-h5 ml-3">Contact Book</v-app-bar-title>
    <v-spacer />
    <v-btn
      :icon="themeIcon"
      aria-label="Toggle dark/light mode"
      data-testid="app-theme-toggle"
      @click="toggleTheme"
    />
  </v-app-bar>
  <v-navigation-drawer id="nav-drawer" v-model="drawerOpen" elevation="2">
    <NavMenu />
  </v-navigation-drawer>
  <v-main>
    <v-container fluid class="pa-4">
      <ErrorBanner />
      <slot />
    </v-container>
  </v-main>
</template>
