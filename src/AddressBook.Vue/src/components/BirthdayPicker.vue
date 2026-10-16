<script setup lang="ts">
import { toDateOnly, toShortDateString } from '@/api/types';
import { birthdayRules, todayUtc } from '@/rules/contactRules';

/*
 * A read-only date input whose value is chosen from a calendar popup, like MudDatePicker:
 * - an empty `update-on` list keeps the input read-only, so a date cannot be typed;
 * - the days after the UTC today are disabled;
 * - the value shows as `M/D/YYYY`, the format the placeholder of the focused empty input names.
 * Clicking the input or pressing Enter on it opens the calendar.
 */

defineProps<{
  label: string;
  /** Messages shown under the field in addition to the rule messages, such as server errors. */
  errorMessages?: string[];
}>();

/** The picked local date, or null when none is picked. */
const birthday = defineModel<Date | null>({ required: true });

// The latest day the calendar offers.
const maxDate = todayUtc();

// The calendar menu puts `aria-haspopup`, `aria-expanded`, `aria-controls` and `aria-owns` on the
// field's wrapper `<div>`, whose role does not support them. An undefined value removes each one.
const menuProps = {
  activatorProps: {
    'aria-haspopup': undefined,
    'aria-expanded': undefined,
    'aria-controls': undefined,
    'aria-owns': undefined,
  },
};

function formatDate(date: unknown): string {
  return toShortDateString(toDateOnly(date as Date));
}
</script>

<template>
  <v-date-input
    v-model="birthday"
    :label="label"
    :max="maxDate"
    :update-on="[]"
    :display-format="formatDate"
    placeholder="M/D/YYYY"
    :show-adjacent-months="false"
    :menu-props="menuProps"
    :rules="birthdayRules"
    :error-messages="errorMessages"
    prepend-icon=""
    append-inner-icon="mdi-calendar"
    variant="underlined"
  />
</template>
