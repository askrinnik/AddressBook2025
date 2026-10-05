---
mode: agent
description: 'Take a GitHub issue for AddressBook2025 end-to-end — bug, feature or test-authoring lane chosen by its labels — with a plan-review checkpoint and a result-verification checkpoint.'
---

Take the GitHub issue given as the command argument end to end — a bug, a feature or a test-authoring task: pick the lane, plan, get plan approval, implement, verify, get result approval, record the result comment, and offer to ship it as a pull request.

- Issue number: `${input:issueNumber:GitHub issue number to implement}`. If no number is given, ask for it before doing anything else.

Follow the full end-to-end workflow defined in [.ai/prompts/implement-issue.md](../../.ai/prompts/implement-issue.md), using the issue number above.
