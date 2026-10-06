---
mode: agent
description: 'Take several small GitHub issues for AddressBook2025 one after another on one branch, each with the full implement-issue workflow and its own commit, then verify once and ship one pull request.'
---

Take the GitHub issues given as the command argument in the given order, each with the `implement-issue` workflow and its own commit on one shared branch, then verify the branch once and ship one pull request.

- Issue numbers: `${input:issueNumbers:GitHub issue numbers in execution order, e.g. 191 192 193}`. If none are given, recommend a batch with the `next-issue` skill and ask which to take before doing anything else.
- Options: `--review-plans` restores the plan-review stops; `--ship` pre-authorises push, pull request and issue comments.

Follow the full batch workflow defined in [.ai/prompts/implement-issues.md](../../.ai/prompts/implement-issues.md), using the arguments above.
