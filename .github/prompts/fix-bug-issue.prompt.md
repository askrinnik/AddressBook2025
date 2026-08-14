---
mode: agent
description: 'Reproduce, plan, and fix a GitHub bug issue for AddressBook2025 end-to-end, with a plan-review checkpoint and a fix-verification checkpoint.'
---

Fix the GitHub bug issue given as the command argument end to end: reproduce, plan, get plan approval, implement the fix, verify, get fix approval, record a resolution comment, and offer to ship it as a pull request.

- Issue number: `${input:issueNumber:GitHub bug issue number to fix}`. If no number is given, ask for it before doing anything else.

Follow the full end-to-end workflow defined in [.ai/prompts/fix-bug-issue.md](../../.ai/prompts/fix-bug-issue.md), using the issue number above.
