<script setup lang="ts">
import { createContact } from '@/api/contactsApi';
import type { ContactFormModel } from '@/api/types';
import ContactForm from '@/components/ContactForm.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const contact = ref<ContactFormModel>({ firstName: '', lastName: '', birthday: null });

async function save(model: ContactFormModel): Promise<void> {
  await createContact(model);
  await router.push('/contacts');
}

function cancel(): void {
  router.push('/contacts');
}
</script>

<template>
  <ContactForm v-model="contact" submit-label="Create" :save="save" @cancel="cancel" />
</template>
