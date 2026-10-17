<script setup lang="ts">
import { deleteContact, getFilteredContacts } from '@/api/contactsApi';
import { ProblemDetailsError } from '@/api/problemDetails';
import { toShortDateString, type ContactModel } from '@/api/types';
import TablePager from '@/components/TablePager.vue';
import { useErrorBanner } from '@/composables/useErrorBanner';
import { vInputTestId } from '@/directives/inputTestId';
import { onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import type { DataTableHeader, DataTableSortItem } from 'vuetify';

const headers: DataTableHeader<ContactModel>[] = [
  { title: 'First name', key: 'firstName', sortable: true },
  { title: 'Last name', key: 'lastName', sortable: true },
  { title: 'Birthday', key: 'birthday', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
];
const itemsPerPageOptions = [10, 25, 50, 100];

const router = useRouter();
const errorBanner = useErrorBanner();

// Table state. Every change of these four reloads the table from the API.
const searchTerm = ref('');
const sortBy = ref<DataTableSortItem[]>([]);
const page = ref(1);
const itemsPerPage = ref(10);

// The text in the search field; it becomes the search term only when committed.
const searchText = ref<string | null>('');

const rows = ref<ContactModel[]>([]);
const totalRows = ref(0);
const loading = ref(false);
const loadErrorText = ref('');
// True while the banner shows a load failure: only then does a successful load clear it, so a
// banner raised by a failed delete survives the reload that follows the delete.
let loadErrorShown = false;
let loadController: AbortController | null = null;

const deleteDialogOpen = ref(false);
let contactIdToDelete: number | null = null;

async function loadContacts(): Promise<void> {
  // A newer load supersedes the one in flight.
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  loading.value = true;

  try {
    const response = await getFilteredContacts(searchTerm.value, controller.signal);
    if (controller.signal.aborted) return;
    showLoadedContacts(response.rows, response.totalRows);
  } catch (error) {
    if (controller.signal.aborted) return;
    showLoadError(describeError(error));
  } finally {
    if (loadController === controller) loading.value = false;
  }
}

function showLoadedContacts(loadedRows: ContactModel[], total: number): void {
  const firstRowIndex = (page.value - 1) * itemsPerPage.value;
  if (page.value > 1 && firstRowIndex >= loadedRows.length) {
    // The current page is past the end, for example after its last row was deleted.
    // The page watcher loads page 1.
    page.value = 1;
    return;
  }

  rows.value = sortContacts(loadedRows).slice(firstRowIndex, firstRowIndex + itemsPerPage.value);
  totalRows.value = total;
  loadErrorText.value = '';
  if (loadErrorShown) {
    errorBanner.clear();
    loadErrorShown = false;
  }
}

function showLoadError(message: string): void {
  errorBanner.processError(message);
  loadErrorText.value = message;
  loadErrorShown = true;
  rows.value = [];
  totalRows.value = 0;
}

/** Returns a sorted copy of the contacts by the current sort column; unsorted keeps the API order. */
function sortContacts(contacts: ContactModel[]): ContactModel[] {
  const sort = sortBy.value[0];
  if (!sort) return contacts;

  const compareAscending = comparers[sort.key];
  if (!compareAscending) return contacts;

  const compare =
    sort.order === 'desc'
      ? (a: ContactModel, b: ContactModel) => -compareAscending(a, b)
      : compareAscending;
  // Array.prototype.sort is stable, so contacts with equal values keep the API order.
  return [...contacts].sort(compare);
}

const nameCollator = new Intl.Collator('en-US');

/** Ascending comparers per sortable column; a missing birthday sorts before every date. */
const comparers: Record<string, (a: ContactModel, b: ContactModel) => number> = {
  firstName: (a, b) => nameCollator.compare(a.firstName, b.firstName),
  lastName: (a, b) => nameCollator.compare(a.lastName, b.lastName),
  // `yyyy-MM-dd` strings sort in date order.
  birthday: (a, b) => compareText(a.birthday ?? '', b.birthday ?? ''),
};

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/** The problem's detail or title for an API failure, otherwise the error's own message. */
function describeError(error: unknown): string {
  if (error instanceof ProblemDetailsError) {
    const text = [error.problem.detail, error.problem.title].find((value) => value?.trim());
    if (text) return text;
  }
  return error instanceof Error ? error.message : String(error);
}

/** Makes the search field's text the search term; called on blur, Enter and clear. */
function commitSearch(): void {
  const text = searchText.value ?? '';
  if (text === searchTerm.value) return;

  searchTerm.value = text;
  page.value = 1;
}

function changeItemsPerPage(value: number): void {
  itemsPerPage.value = value;
  page.value = 1;
}

function openCreateContact(): void {
  router.push('/create-contact');
}

function openEditContact(id: number): void {
  router.push(`/edit-contact/${id}`);
}

function askToDelete(id: number): void {
  contactIdToDelete = id;
  deleteDialogOpen.value = true;
}

async function confirmDelete(): Promise<void> {
  deleteDialogOpen.value = false;
  if (contactIdToDelete === null) return;

  const id = contactIdToDelete;
  contactIdToDelete = null;
  try {
    await deleteContact(id);
  } catch (error) {
    // A 404 means the contact is already gone, which is what the user asked for.
    if (!(error instanceof ProblemDetailsError && error.status === 404)) {
      errorBanner.processError(describeError(error));
      // The banner now belongs to the delete failure, so the reload below keeps it.
      loadErrorShown = false;
    }
  }
  await loadContacts();
}

watch([searchTerm, sortBy, page, itemsPerPage], loadContacts, { immediate: true });
// Leaving the page cancels the load in flight.
onBeforeUnmount(() => loadController?.abort());
</script>

<template>
  <h6 class="text-h6 mb-4">Contacts</h6>

  <v-data-table-server
    :headers="headers"
    :items="rows"
    :items-length="totalRows"
    :loading="loading"
    v-model:sort-by="sortBy"
    density="compact"
    hover
    data-testid="contacts-table"
  >
    <template #top>
      <v-toolbar flat color="transparent" class="px-4">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-plus"
          data-testid="contacts-create"
          @click="openCreateContact"
        >
          Create Contact
        </v-btn>
        <v-spacer />
        <v-text-field
          v-model="searchText"
          v-input-test-id="'contacts-search'"
          placeholder="Search"
          aria-label="Search"
          prepend-inner-icon="mdi-magnify"
          variant="underlined"
          density="compact"
          clearable
          hide-details
          class="contacts-search"
          @blur="commitSearch"
          @keydown.enter="commitSearch"
          @click:clear="commitSearch"
        />
      </v-toolbar>
    </template>

    <template #item="{ item }">
      <tr>
        <td :data-testid="`contact-row-${item.id}`">{{ item.firstName }}</td>
        <td>{{ item.lastName }}</td>
        <td>{{ item.birthday ? toShortDateString(item.birthday) : '' }}</td>
        <td>
          <v-btn
            variant="flat"
            color="primary"
            size="small"
            aria-label="Edit contact"
            :data-testid="`contact-edit-${item.id}`"
            @click="openEditContact(item.id)"
          >
            <v-icon icon="mdi-pencil" />
          </v-btn>
          <v-btn
            variant="flat"
            color="error"
            size="small"
            class="ms-2"
            aria-label="Delete contact"
            :data-testid="`contact-delete-${item.id}`"
            @click="askToDelete(item.id)"
          >
            <v-icon icon="mdi-delete" />
          </v-btn>
        </td>
      </tr>
    </template>

    <template #loading>Loading...</template>

    <template #no-data>
      <div>No matching records found</div>
      <v-alert v-if="loadErrorText" type="error" variant="tonal" density="compact" class="mt-2">
        {{ loadErrorText }}
      </v-alert>
    </template>

    <template #bottom>
      <v-divider />
      <TablePager
        :items-per-page="itemsPerPage"
        :total-rows="totalRows"
        :items-per-page-options="itemsPerPageOptions"
        v-model:page="page"
        @update:items-per-page="changeItemsPerPage"
      />
    </template>
  </v-data-table-server>

  <v-dialog v-model="deleteDialogOpen" max-width="400">
    <v-card>
      <v-card-title>Warning</v-card-title>
      <v-card-text>Are you sure you want to delete this contact?</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialogOpen = false">Cancel</v-btn>
        <v-btn
          variant="flat"
          color="error"
          prepend-icon="mdi-delete-forever"
          data-testid="contact-delete-confirm"
          @click="confirmDelete"
        >
          Yes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.contacts-search {
  max-width: 320px;
}
</style>
