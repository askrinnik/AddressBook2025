<script setup lang="ts">
import { computed } from 'vue';

/*
 * The pager under a data table: a rows-per-page select, the `X-Y of Z` caption and the
 * First/Previous/Next/Last page buttons. It uses the Vuetify footer classes for its layout.
 */
const props = defineProps<{
  /** The current page, starting at 1. */
  page: number;
  itemsPerPage: number;
  /** The total number of rows over all pages. */
  totalRows: number;
  itemsPerPageOptions: number[];
}>();

const emit = defineEmits<{
  'update:page': [page: number];
  'update:itemsPerPage': [itemsPerPage: number];
}>();

const pageCount = computed(() => Math.max(1, Math.ceil(props.totalRows / props.itemsPerPage)));
const isFirstPage = computed(() => props.page <= 1);
const isLastPage = computed(() => props.page >= pageCount.value);

const caption = computed(() => {
  if (props.totalRows === 0) return '0-0 of 0';

  const firstRow = (props.page - 1) * props.itemsPerPage + 1;
  const lastRow = Math.min(props.page * props.itemsPerPage, props.totalRows);
  return `${firstRow}-${lastRow} of ${props.totalRows}`;
});

function goToPage(page: number): void {
  emit('update:page', page);
}
</script>

<template>
  <div class="v-data-table-footer">
    <div class="v-data-table-footer__items-per-page">
      <span class="text-body-2">Rows per page:</span>
      <v-select
        :model-value="itemsPerPage"
        :items="itemsPerPageOptions"
        density="compact"
        variant="plain"
        hide-details
        aria-label="Rows per page"
        @update:model-value="(value: number) => emit('update:itemsPerPage', value)"
      />
    </div>
    <div class="v-data-table-footer__info text-body-2">{{ caption }}</div>
    <div class="v-data-table-footer__pagination">
      <v-btn
        icon="mdi-page-first"
        variant="text"
        density="comfortable"
        aria-label="First page"
        :disabled="isFirstPage"
        @click="goToPage(1)"
      />
      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        density="comfortable"
        aria-label="Previous page"
        :disabled="isFirstPage"
        @click="goToPage(page - 1)"
      />
      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        density="comfortable"
        aria-label="Next page"
        :disabled="isLastPage"
        @click="goToPage(page + 1)"
      />
      <v-btn
        icon="mdi-page-last"
        variant="text"
        density="comfortable"
        aria-label="Last page"
        :disabled="isLastPage"
        @click="goToPage(pageCount)"
      />
    </div>
  </div>
</template>

<style scoped>
/* Vuetify styles no `__pagination` element of its footer, so the button row is laid out here. */
.v-data-table-footer__pagination {
  align-items: center;
  display: flex;
  margin-inline-start: 16px;
}
</style>
