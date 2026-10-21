# Issue #222 — Vue V10: Documentation, AI harness and learning guide for the Vue frontend

> **Issue:** [#222](https://github.com/askrinnik/AddressBook/issues/222)
> **Lane:** Feature (documentation and harness)
> **Complexity:** M
> **Multi-issue plan:** [vue-frontend-plan.md](vue-frontend-plan.md), task V10

## Requirement

The Vue frontend gets its specification, its coding standard for both AI tools, pointers in `CLAUDE.md` and `docs/ai/README.md`, and a learning guide that explains the Vue concepts on this project's files, mapped to their Blazor counterparts.

## Acceptance

- [x] `docs/specs/AddressBook.Vue.md` specifies the Vue frontend like `AddressBook.Web.md` does for Blazor (overview, build and run, configuration, routing and pages, API client and problem-details pipeline, validation rules, layout and shared UI, tests, file structure) and states where it deliberately differs from Blazor
- [x] `docs/specs/Architecture.md` shows the Vue frontend in the diagrams and the component deep-dives
- [x] `CLAUDE.md` points to the Vue spec, the Vue README, the Vue component tests and the Vue coding standard
- [x] `.github/instructions/vue.instructions.md` holds the Vue coding standard (`applyTo: src/AddressBook.Vue/**`); `.claude/rules/vue.md` points to it with matching `paths:`; the instruction table in `CLAUDE.md` lists it
- [x] `docs/ai/README.md` reflects the new instruction file and rule; `check.ps1` passes
- [x] `.claude/rules/update-docs-on-code-change.md` says that a Vue change updates `docs/specs/AddressBook.Vue.md`
- [x] The learning guide exists at `docs/guides/vue-for-blazor-developers.md`, written in Russian (the user's decision), and links to the project's files; `.claude/rules/docs.md` names `docs/guides/` and the language exception

## Affected files

- New `docs/specs/AddressBook.Vue.md`, `docs/guides/vue-for-blazor-developers.md`, `.github/instructions/vue.instructions.md`, `.claude/rules/vue.md`
- `docs/specs/Architecture.md`, `CLAUDE.md`, `docs/ai/README.md`, `.claude/rules/docs.md`, `.claude/rules/update-docs-on-code-change.md`, `src/AddressBook.Vue/README.md` (links to the spec and the guide), `docs/tasks/vue-frontend-plan.md` (status, the guide-location open point)

## Approach

- The spec is written from the code, not from the plans: every statement is checked against `src/AddressBook.Vue`.
- The coding standard is short and derived from the code: `<script setup lang="ts">`, Composition API, one component per file, `pages/` for routed views, `components/` for reusable parts, composables with `provide`/`inject` for shared state, the API only through `src/api`, `data-testid`s from `src/UiTests/src/utils/testids.ts`, Vuetify components, English comments, Vitest specs under `tests/` mirroring `src/`.
- The guide goes from the project's entry point through its building blocks, each with the Blazor counterpart and a link to the file that shows it: SFC vs `.razor`; `ref`/`reactive`/`computed` vs fields and `StateHasChanged`; props and emits vs `[Parameter]` and `EventCallback`; `v-model` vs `@bind`; lifecycle hooks vs `OnInitializedAsync`/`Dispose`; composables and `provide`/`inject` vs DI and `CascadingValue`; Vue Router vs `@page`; Vuetify vs MudBlazor; `fetch` + problem details vs `HttpClient` + `DelegatingHandler`; validation rules vs DataAnnotations; Vitest + Vue Test Utils vs bUnit; the shared Playwright suite; how to run and debug; a reading order.

## Verification

- Every path and command in the new documents exists and runs; `pwsh -File .github/skills/_local.sync-ai-customizations/scripts/check.ps1` passes.

## Out of scope

- Any code change.

## Decisions

- The guide is in Russian in `docs/guides/`, an exception to the English rule for new documents, confirmed by the user.
