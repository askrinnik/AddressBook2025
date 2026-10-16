import type { Directive } from 'vue';

function applyTestId(el: HTMLElement, testId: string): void {
  el.querySelector('input')?.setAttribute('data-testid', testId);
}

/**
 * Puts a `data-testid` on the native `<input>` inside a Vuetify field component.
 *
 * Vuetify fields such as `v-text-field` keep `data-*` attributes on their root element, while
 * tests type into and blur the `<input>` itself. Usage: `<v-text-field v-input-test-id="'id'" />`.
 */
export const vInputTestId: Directive<HTMLElement, string> = {
  mounted: (el, binding) => applyTestId(el, binding.value),
  updated: (el, binding) => applyTestId(el, binding.value),
};
