---
paths:
  - "src/AddressBook.Api/**"
  - "src/AddressBook.Contracts/**"
  - "src/AddressBook.Web/**"
  - "src/**/appsettings*.json"
  - "src/**/Properties/launchSettings.json"
  - "CLAUDE.md"
  - ".claude/**"
  - ".ai/**"
  - ".github/**"
  - ".mcp.json"
---

# Keep documentation in step with code

Documentation is updated **in the same change** as the code it describes. The mechanics of finding stale text are in the `update-docs` skill; this table says where each kind of change is documented in this repository.

| Change | Update |
|---|---|
| API endpoint, request/response shape, validation rule, status code, domain or data-access behaviour | `docs/specs/AddressBook.Api.md` |
| Commands, queries or models in `AddressBook.Contracts` | `docs/specs/AddressBook.Contracts.md` |
| Web pages, components, the API service, launch profiles or ports | `docs/specs/AddressBook.Web.md` |
| Project structure, CI, deployment | `docs/specs/Architecture.md` |
| How to run or write a test suite | the suite's `README.md` / `CLAUDE.md` and `.github/instructions/playwright-conventions.instructions.md` |
| AI harness: `CLAUDE.md`, `.claude/**`, `.github/{agents,skills,prompts,instructions}/**`, `.ai/**`, `.mcp.json` | `docs/ai-harness.md` |
| Work deferred to later | a new GitHub issue (with a "blocked by" relation when it depends on this one) — not a TODO in a document or in code |

Rules:

- Documentation states what is true now. Do not document a feature that does not exist yet; remove or correct any statement the change made false.
- Code examples in documents match the current signatures and run as written.
- Task breakdowns belong in `docs/tasks/`, specifications in `docs/specs/`; do not mix them.
