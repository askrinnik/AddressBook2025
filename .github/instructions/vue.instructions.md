---
description: "Vue 3 + TypeScript + Vuetify conventions for the Vue frontend. Use when creating or modifying pages, components, composables, the API client, routes or Vitest tests in src/AddressBook.Vue."
applyTo: "src/AddressBook.Vue/**"
---
# Vue Frontend Conventions

The app is specified in `docs/specs/AddressBook.Vue.md`; how to run it is in `src/AddressBook.Vue/README.md`. Its behaviour matches the Blazor frontend (`docs/specs/AddressBook.Web.md`); a deliberate difference is recorded in the Vue spec's section *Deliberate Differences from the Blazor Frontend*.

## Components

- One component per `.vue` file, written as `<script setup lang="ts">` with the Composition API. No Options API, no `defineComponent` in app code.
- Order in a file: `<script setup>`, `<template>`, `<style scoped>`. Styles are always `scoped`; global styles live only in `src/styles/main.css`.
- Props with `defineProps<{ ... }>()`, events with `defineEmits<{ ... }>()`, two-way binding with `defineModel()`; type-based declarations, no runtime prop objects.
- A callback the component must await (for example the form's `save`) is a function prop; a notification the parent may ignore (for example `cancel`) is an event.
- State with `ref` and `computed`; side effects with `watch` and lifecycle hooks (`onMounted`, `onBeforeUnmount`). A request a page starts is aborted with an `AbortController` when the page unmounts or a newer request supersedes it.
- Template refs with `useTemplateRef`.

## Where code goes

| Folder | Content |
|---|---|
| `src/pages/` | Routed views only, `<Name>Page.vue`, registered in `src/router/index.ts` with a lazy `() => import(...)` and `meta.title` |
| `src/components/` | Reusable parts used by pages or the layout; pure helpers of a component next to it as `.ts` |
| `src/layouts/` | The application shell |
| `src/composables/` | `use<Name>` functions; state shared across components is provided with `provide` and an `InjectionKey`, and read with `inject` |
| `src/api/` | The only code that talks to the API: `request()` in `http.ts`, the service functions in `contactsApi.ts`, the contract types in `types.ts` |
| `src/rules/` | Validation rules as Vuetify field rules, mirroring `ContactRules` in `AddressBook.Contracts` |
| `src/directives/` | Custom directives, named `v<Name>` |

- Pages and components never call `fetch`; they call the functions of `src/api/contactsApi.ts`. A non-success response arrives as `ProblemDetailsError`.
- Contract types in `src/api/types.ts` mirror `AddressBook.Contracts`; change them together with the contract.
- No store library; page state stays in the page.
- Import app modules through the `@/` alias.

## Vuetify

- Use Vuetify components (auto-imported by `vite-plugin-vuetify`) instead of hand-written HTML controls; icons are `mdi-*` names.
- Validation messages and texts match the Blazor frontend word for word.
- An icon-only button has an `aria-label`. Keep the accessibility fixes listed in the Vue spec.

## Test ids

- Use the `data-testid` values of `src/UiTests/src/utils/testids.ts`; both frontends render the same ids, so a new id goes into that file too.
- On a Vuetify field put the id on its native `<input>` with `v-input-test-id="'id'"` (`src/directives/inputTestId.ts`).

## Comments

- In English, per `CLAUDE.md`: what the code does and why. `/** */` on exported members and on props.

## Tests

- Vitest + `@vue/test-utils` + jsdom, under `tests/` in the folder layout of `src/`, named `<Source>.spec.ts`.
- Mount with `mountWithApp()` from `tests/helpers/mountWithApp.ts` (real Vuetify, memory-history router, error banner). Mock `@/api/contactsApi` with `vi.mock` in page tests; stub `fetch` with the factories of `tests/helpers/responses.ts` in API-client tests.
- Find elements by `data-testid` or text; assert on the rendered markup. Unmount in `afterEach`.
- Time-dependent rules use fake timers with a fixed system time.
- Coverage stays at or above 85 % lines and 70 % branches (`npm run test:coverage`).

## Before you finish

In `src/AddressBook.Vue`: `npm run lint`, `npm run format:check`, `npm run build` (type-checks) and `npm test`. A UI change also runs `npx playwright test --project=vue` in `src/UiTests`.
