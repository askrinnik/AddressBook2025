---
name: open-pr
description: >
  Open a pull request for AddressBook2025 following this repository's
  conventions — target branch, title, the Closes keyword and what the
  description should contain — with gh (Claude Code) or the GitHub MCP server
  (Copilot). Use whenever creating or updating a PR, on its own or as the PR
  step of /implement-issue and /implement-issues. Covers pull requests only —
  branch and commit mechanics live in the git-commit skill.
---

# Open a Pull Request

> Local skill note: This skill is intentionally repository-specific for AddressBook2025 and does not map to a canonical upstream skill in github/awesome-copilot.

How to open a pull request in this repository. **Pull-request mechanics only** — the branch and the commits are made with the **`git-commit`** skill.

Never create, update or merge a PR without the user's explicit go-ahead.

## Tooling

In Claude Code use the `gh` CLI (`gh pr create`, `gh pr view`, `gh pr checks`). Write the description to a scratch file outside the repository (the session's scratch directory, or the system temp folder) and pass it with `--body-file`; do not inline long text in the command line. In Copilot use the GitHub MCP server.

## Target, title and linkage

- **Source:** the issue branch `<issue>-<short-slug>`, pushed (`git push -u origin <branch>`) after the user's go-ahead.
- **Target:** `main`.
- **Title:** `#<issue> <exact issue title>` — the same first line as the commits.
- **Linkage:** the description starts with `Closes #<issue>` on its own line, so GitHub links the issue and closes it when the PR is merged. One PR resolves one issue, except a batch (`/implement-issues`): its branch is `<first>-<last>-<short-slug>`, the title is `#<a> #<b> #<c> <shared summary>`, and the description starts with one `Closes #<n>` line per issue.
- **Merge:** the user merges with a merge commit (not squash, not rebase). Do not merge unless the user explicitly asks.
- After creating, report the PR URL. A successful `gh pr create` is its own confirmation — do not re-read the PR to verify the title.

## Description

English, Markdown, following `.github/pull_request_template.md`. In priority order, when space is tight drop from the end:

1. **What and why** — for a bug: symptom, root cause, why this fix; for a feature: what it does and the non-obvious decisions or constraints a reviewer cannot infer from the diff.
2. **Attention** — a destructive path, a behaviour change, a residual risk, a deviation from the plan — or "None".
3. **Verification** — build, test suites run and how the acceptance criteria were verified, in two or three lines.
4. A link to the plan file (`docs/tasks/issue-<issue>-<short-slug>.md`) if there is one.

Do **not** repeat what the issue comment already holds (the full root cause or acceptance table and file list, see the `github-issue` skill) — the description is built *from* that comment, condensed. Keep it under about 3000 characters.

## After opening

- Check CI once with `gh pr checks <pr>`; if it is still running, say so and stop — the desktop app can watch CI; do not poll in a loop.
- If CI fails, report the failing job and the first error lines (`gh run view <run> --log-failed`, captured to a file and grepped), and fix it on the same branch after the user agrees.

## Inline or delegated

Run this skill inline when the user asks for a PR directly. Inside `/implement-issue` and `/implement-issues`, after the user's go-ahead and once the branch is pushed, the whole skill — composing and opening the PR — runs in the `skill-runner` agent: the caller hands it this skill's name, the issue number(s) and exact title(s), the head branch, the posted issue comment (in a batch, where the comments follow the PR, a short summary per issue instead) and a scratch file path for the body; it opens the PR and returns its URL. Pushing and checking CI stay with the caller. If you *are* the skill-runner, do not delegate again.
