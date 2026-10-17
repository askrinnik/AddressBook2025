<script setup lang="ts">
import { getContactById, updateContact } from '@/api/contactsApi';
import { ProblemDetailsError } from '@/api/problemDetails';
import { fromDateOnly, type ContactFormModel } from '@/api/types';
import ContactForm from '@/components/ContactForm.vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

/*
 * The Edit page: loads the contact, then shows the shared contact form pre-filled with it.
 * While loading it shows a progress bar; an unknown id or a failed load shows an alert instead.
 */

const props = defineProps<{
  /** Id of the contact to edit, taken from the route. */
  id: number;
}>();

const LOAD_FAILED_MESSAGE = 'Could not load the contact.';

const router = useRouter();

// The contact being edited; null until it has loaded.
const contact = ref<ContactFormModel | null>(null);
const notFound = ref(false);
const loadError = ref<string | null>(null);

// Aborts the load request when the page is left before it finishes.
const loadController = new AbortController();

async function loadContact(): Promise<void> {
  try {
    const loaded = await getContactById(props.id, loadController.signal);
    if (loaded === null) {
      notFound.value = true;
      return;
    }
    contact.value = {
      firstName: loaded.firstName,
      lastName: loaded.lastName,
      birthday: loaded.birthday ? fromDateOnly(loaded.birthday) : null,
    };
  } catch (error) {
    if (loadController.signal.aborted) return;

    if (error instanceof ProblemDetailsError) {
      loadError.value = error.problem.detail ?? error.problem.title ?? LOAD_FAILED_MESSAGE;
    } else {
      // Runtime and browser messages ("TypeError: Failed to fetch") mean nothing to the user.
      loadError.value = LOAD_FAILED_MESSAGE;
    }
    console.error(`Loading contact ${props.id} failed`, error);
  }
}

onMounted(loadContact);
onBeforeUnmount(() => loadController.abort());

async function save(model: ContactFormModel): Promise<void> {
  await updateContact(props.id, model);
  await router.push('/contacts');
}

function goToContacts(): void {
  router.push('/contacts');
}
</script>

<template>
  <template v-if="notFound">
    <v-alert type="warning">Contact not found.</v-alert>
    <v-btn variant="outlined" class="mt-4" @click="goToContacts">Back to Contacts</v-btn>
  </template>
  <template v-else-if="loadError !== null">
    <v-alert type="error">{{ loadError }}</v-alert>
    <v-btn variant="outlined" class="mt-4" @click="goToContacts">Back to Contacts</v-btn>
  </template>
  <v-progress-linear
    v-else-if="contact === null"
    indeterminate
    color="primary"
    aria-label="Loading contact"
  />
  <ContactForm v-else v-model="contact" submit-label="Save" :save="save" @cancel="goToContacts" />
</template>
