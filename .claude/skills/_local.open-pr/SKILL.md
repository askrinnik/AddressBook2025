---
name: open-pr
description: >
  Ship a completed change for AddressBook2025 as a pull request: commit onto an
  issue branch (never main), include the plan file, and open a PR targeting main
  with gh (Claude Code) or the GitHub MCP server (Copilot). Use after the work
  is verified and the user agrees to ship it.
---

# Open a Pull Request

> Local skill note: This skill is intentionally repository-specific for AddressBook2025 and does not map to a canonical upstream skill in github/awesome-copilot.

Ship a verified change as a pull request into `main`. Use after the work is confirmed and the user has agreed to ship it.

## When to Use

- The implementation/fix is verified and the user has said to commit and open a PR.
- Do **not** commit, push, or create the PR without the user's explicit go-ahead.

## Branch

- Commit onto a branch named `<issue>-<short-slug>` (for example `56-contact-search`). Never commit directly to `main`.
- The branch **may already exist** — check first (`git branch --list '<issue>-*'` and `git branch --show-current`). If it exists or is already checked out, commit onto it; only create it off `main` when it does not exist (`git switch -c <issue>-<short-slug>`).

## Commit

- Always include the plan copy (`docs/tasks/issue-<issue>-<short-slug>.md`) in the commit together with the code — never leave it untracked or out of the commit.
- Compose every commit with the **`git-commit`** skill. This is a task commit (Case 1): first line is `#<issue> <issue title>` (the exact issue title), then a blank separator line, then the dash-prefixed action list.
- When the work spans several commits, the first line is identical on every commit; only the action lines differ.
- A **batch** (`/implement-issues`) has one commit per issue, each with that issue's own `#<issue> <title>` first line, on one branch named `<first>-<last>-<short-slug>`.

## Pull request

- Open the PR against `main`. In Claude Code write the description to a scratch file outside the repository (the session's scratch directory, or the system temp folder) and run `gh pr create --base main --head <branch> --title "<title>" --body-file <file>`; in Copilot use the GitHub MCP server. Report the PR URL; that is the confirmation. Once the PR is open, delete the scratch file (`rm <file>`); if opening it failed, keep the file and say where it is.
- Title: `#<issue> <issue title>` (the exact issue title).
- The description starts with `Closes #<issue>` so the issue closes on merge.
- A batch PR has the title `#<a> #<b> #<c> <shared summary>` and one `Closes #<n>` line per issue at the start of the description.
- Write the description to cover:
  - what the change does,
  - the non-obvious decisions or constraints a reviewer could not infer from the diff,
  - anything that deserves particular attention (a destructive path, a residual risk, a deviation from the plan),
  - how it was verified.
- The full acceptance table and file list already live in the issue comment (see the `github-issue` skill), so do not repeat them in the PR description.

## Inline or delegated

Run this skill inline when the user asks for a PR directly. Inside `/implement-issue` and `/implement-issues` the commit is its own `skill-runner` call with the `git-commit` skill, and after the user's go-ahead and once the branch is pushed, *Pull request* — composing and opening the PR — runs in the `skill-runner` agent: the caller hands it this skill's name, the issue number(s) and exact title(s), the head branch, the posted issue comment (in a batch, where the comments follow the PR, a short summary per issue instead) and a scratch file path for the body; it opens the PR and returns its URL. Pushing and checking CI stay with the caller. If you *are* the skill-runner, do not delegate again.
