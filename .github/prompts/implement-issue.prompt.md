---
mode: agent
description: 'Implement a GitHub issue for AddressBook2025 end-to-end, with a plan-review checkpoint and an acceptance-verification checkpoint.'
---

Implement the GitHub issue given as the command argument end to end: understand the requirement, plan, get plan approval, implement, verify against the acceptance criteria, get acceptance approval, record an implementation comment, and offer to ship it as a pull request.

- Issue number: `${input:issueNumber:GitHub issue number to implement}`. If no number is given, ask for it before doing anything else.

Follow the full end-to-end workflow defined in [.ai/prompts/implement-issue.md](../../.ai/prompts/implement-issue.md), using the issue number above.
