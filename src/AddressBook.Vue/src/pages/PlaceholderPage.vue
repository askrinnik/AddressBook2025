<script setup lang="ts">
import { apiPrefix } from '@/config';
</script>

<template>
  <v-container class="fill-height" max-width="720">
    <v-card class="w-100" prepend-icon="mdi-book-account" title="Address Book">
      <v-card-text>
        <p>The Vue.js frontend is running.</p>
        <p class="mt-2">
          API: <code>{{ apiPrefix }}</code>
        </p>
      </v-card-text>
    </v-card>
  </v-container>
</template>
