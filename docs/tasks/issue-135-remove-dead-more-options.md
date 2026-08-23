# Issue #135 (bug) — App-bar "more options" icon button has no action (dead control)

**Issue:** [#135](https://github.com/askrinnik/AddressBook2025/issues/135) — labelled `bug`, `ui`.
**Origin:** spotted while fixing #132 (PR #134).

## Reproduced failure

Source-level reproduction (a no-op control — there is no event to capture in a browser). In `src/AddressBook.Web/Layout/MainLayout.razor` the app-bar `MoreVert` button has **no `OnClick`** and no menu behind it:

```razor
<MudIconButton Icon="@Icons.Material.Filled.MoreVert" Color="Color.Inherit" Edge="Edge.End" aria-label="More options" />
```

It renders a clickable three-dots icon on every page (via the layout) that does nothing. #132 added the `aria-label` only so it stopped failing the a11y scan — but a labelled button announcing "More options" that has no effect is misleading, especially for screen-reader users.

## Root cause

Dead UI: an `MudIconButton` was placed in the app bar without an action or an overflow menu. There is no planned menu in the codebase (no handler, no `MudMenu`, no referencing code).

## Fix approach (Web only)

Remove the `MoreVert` `MudIconButton` line from `MainLayout.razor` (including its `aria-label`). This is the option the issue calls out as cleanest "if there is no planned menu" — it drops the dead control and the misleading label. The drawer toggle, title, spacer and theme toggle are untouched.

No code-behind, DI, or behaviour changes; the remaining app-bar controls keep working exactly as before.

## Tests (regression guard)

`src/UiTests/tests/smoke/app-shell.spec.ts` — add one test asserting the app bar exposes **no** "More options" control (`getByRole('button', { name: 'More options' })` → count 0), so re-introducing the dead button fails the smoke suite. The existing drawer/theme/nav tests already prove the surviving controls still work; the a11y suite (#109) already enforces zero `button-name` violations on Home/Create.

## Verification

- Stop dev servers, then `dotnet build src/AddressBook.sln`.
- Run the full UI suite via the webServer — all green, including the new absence assertion; drawer/theme toggles and navigation unaffected.
- Re-check `/`, `/contacts`, `/create-contact`: the three-dots button is gone; the rest of the app bar is unchanged.

## Out of scope

- Adding a real overflow menu (the alternative the issue lists) — no menu is planned; if one is wanted later it is a feature, not this defect.
