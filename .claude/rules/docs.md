---
paths:
  - "docs/**/*.md"
  - "**/README.md"
---

# Documentation

- **Language:** keep the language of the document you edit. New documents under `docs/` are written in English, like `docs/specs/`, `docs/tasks/` and `docs/ai-harness.md`. Identifiers, commands, paths and code stay exactly as in the code.
- **Where things go:**
  - `docs/specs/` — specifications of what is true now: `Architecture.md`, `AddressBook.Api.md`, `AddressBook.Web.md`, `AddressBook.Contracts.md`.
  - `docs/tasks/issue-<n>-<slug>.md` — the implementation plan of one issue; `docs/tasks/<topic>-plan.md` — a multi-issue plan (task list and design of a larger effort).
  - `docs/ai-harness.md` — how the AI harness is built, for people who maintain or reuse it.
  - A test suite's `README.md` — how to run that suite; its conventions live in `.github/instructions/` and the suite's `CLAUDE.md`.
- **Issue plans** have a header (issue link, title, lane, complexity), then: requirement (or bug and root cause), acceptance checklist, affected files, approach, tests, verification, out of scope, decisions. The checklist is ticked as the work completes and committed with the work. A plan is not rewritten after its issue is closed — a later change gets its own plan.
- A multi-issue plan marks each of its tasks done when the task's issue closes.
- **Style:** short sentences, active voice, one idea per paragraph; tables for structured comparisons; no emoji, except 🤖 (agent call) and 🧩 (skill) as markers in the workflow diagram of `docs/ai-harness.md`. Do not repeat what another document already says — link to it. State what is true now; no "will be added" for features that do not exist.
