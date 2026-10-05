---
paths:
  - "src/ApiTests/**"
  - "src/UiTests/**"
---

<!-- Path-scoped pointer for Claude Code. The single source of truth is .github/instructions/playwright-conventions.instructions.md; keep these paths in step with its applyTo. No @-import: an import is expanded at session start and would defeat the path scoping. -->

Before editing a file under `src/ApiTests/` or `src/UiTests/`, read `.github/instructions/playwright-conventions.instructions.md` (once per session) and follow it — the API sections for `src/ApiTests`, the *UI E2E tests* section for `src/UiTests`.
