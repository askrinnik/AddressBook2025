<script setup lang="ts">
import type { ContactFormModel } from '@/api/types';
import BirthdayPicker from '@/components/BirthdayPicker.vue';
import { emptyContactFormErrors, toContactFormErrors } from '@/components/contactFormErrors';
import { vInputTestId } from '@/directives/inputTestId';
import { nameRules } from '@/rules/contactRules';
import { ref, useTemplateRef } from 'vue';

/*
 * The contact form of the Create and Edit pages: First name, Last name and Birthday in a card
 * with a submit and a Cancel button.
 *
 * The page owns the model and decides what saving means. On submit the form validates and calls
 * `save` only when every field is valid; the submit button is disabled until `save` settles. An
 * error thrown by `save` shows on the form: field errors under their fields, anything else in
 * the summary list under the fields.
 */

const props = defineProps<{
  /** Text of the submit button, for example `Create` or `Save`. */
  submitLabel: string;
  /** Saves the valid model; throwing shows the error on the form. */
  save: (model: ContactFormModel) => Promise<void>;
}>();

const emit = defineEmits<{
  cancel: [];
}>();

/** The edited contact, owned by the page. */
const model = defineModel<ContactFormModel>({ required: true });

const firstNameRules = nameRules('First name');
const lastNameRules = nameRules('Last name');

const form = useTemplateRef('form');
const busy = ref(false);
// Errors of the last failed save; they stay until the next submit.
const serverErrors = ref(emptyContactFormErrors());

async function submit(): Promise<void> {
  serverErrors.value = emptyContactFormErrors();

  const result = await form.value?.validate();
  if (!result?.valid) return;

  busy.value = true;
  try {
    await props.save(model.value);
  } catch (error) {
    serverErrors.value = toContactFormErrors(error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <v-form ref="form" validate-on="blur" @submit.prevent="submit">
    <v-row>
      <v-col cols="12" sm="7">
        <v-card>
          <v-card-text>
            <v-text-field
              v-model="model.firstName"
              v-input-test-id="'contact-form-first-name'"
              label="First name"
              variant="underlined"
              :rules="firstNameRules"
              :error-messages="serverErrors.fields.firstName"
            />
            <v-text-field
              v-model="model.lastName"
              v-input-test-id="'contact-form-last-name'"
              label="Last name"
              variant="underlined"
              class="mt-3"
              :rules="lastNameRules"
              :error-messages="serverErrors.fields.lastName"
            />
            <BirthdayPicker
              v-model="model.birthday"
              v-input-test-id="'contact-form-birthday'"
              label="Birthday"
              :error-messages="serverErrors.fields.birthday"
            />
            <ul v-if="serverErrors.general.length" class="contact-form-summary mt-4 text-error">
              <li v-for="message in serverErrors.general" :key="message">{{ message }}</li>
            </ul>
          </v-card-text>
          <v-card-actions>
            <v-btn
              type="submit"
              variant="flat"
              color="primary"
              :disabled="busy"
              data-testid="contact-form-submit"
            >
              {{ submitLabel }}
            </v-btn>
            <v-btn
              variant="flat"
              class="ms-2"
              data-testid="contact-form-cancel"
              @click="emit('cancel')"
            >
              Cancel
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-form>
</template>

<style scoped>
.contact-form-summary {
  padding-left: 1.5rem;
}
</style>
