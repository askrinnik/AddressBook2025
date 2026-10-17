<script setup lang="ts">
import { useErrorBanner } from '@/composables/useErrorBanner';

const { message } = useErrorBanner();
</script>

<template>
  <v-alert
    v-if="message"
    type="error"
    variant="flat"
    rounded="0"
    class="mb-4"
    data-testid="error-banner"
  >
    <h4 class="text-h6">Woops!</h4>
    <pre class="error-container">{{ message }}</pre>
  </v-alert>
</template>

<style scoped>
.error-container {
  white-space: pre-wrap;
  margin: 0;
}
</style>
