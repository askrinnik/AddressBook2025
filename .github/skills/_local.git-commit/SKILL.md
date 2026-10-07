---
name: git-commit
description: 'Create Git commits following this repository''s branch and commit-message conventions. Use ALWAYS when the user asks to commit, commit changes, make a commit or write a commit message ("commit", "закоммить"), and for the commit step of /implement-issue and /implement-issues. Chooses the format by whether the work belongs to a task (issue) or not. Covers committing only — pull requests live in the open-pr skill.'
argument-hint: 'Optional: task number/name, or leave empty for a non-task commit'
---

# Git Commit

Use this skill whenever a commit is made in this repository. **Commit mechanics only — nothing about pull requests** (those live in the `open-pr` skill).

Only commit when the user has asked, or when a calling workflow already holds the user's go-ahead. Never push unless explicitly asked.

## Choose the branch first

Work for issue `<issue>` happens on branch `<issue>-<short-slug>` — the issue number, a hyphen and a short kebab-case slug of the English title (for example `145-scaffold-web-tests`). A batch (`/implement-issues`) uses one branch `<first>-<last>-<short-slug>` for all its issues.

- **Never commit directly to `main`** with a task commit (Case 1).
- `git branch --show-current` — if it already starts with `<issue>-`, commit there.
- `git branch --list '<issue>-*'` — if the branch exists but is not checked out, switch to it.
- If you are on `main` and the commit belongs to a task, create the branch from an up-to-date `main`: run `git pull --ff-only` first (stop and report if it fails — diverged history or local conflicts), then `git switch -c <issue>-<short-slug>`. Uncommitted changes travel with you. Ask the user first unless a calling workflow already named the branch.

## Commit message

All commit text is **English**. There are two cases. Pick the correct one before writing the message.

### Case 1 — the commit is part of a task

Use this when the work relates to a task: a GitHub issue, a `Tx` task from a plan, or a task-named branch.

```
#<issue> <exact issue title>

- <first action>
- <second action>
```

- **Line 1:** the task number, one space, the task name. For a GitHub issue that is `#<issue>` and the exact issue title as on GitHub (`gh issue view <issue> --json title --jq .title`); it is identical on every commit of the branch. In a batch each commit carries its own issue's `#<issue> <title>`. For a plan task it is the task id and name (`T13 Add PUT update tests`).
- **Line 2:** blank.
- **From line 3:** one action per line, each starting with `- `, imperative mood ("Add", "Fix", "Update", "Remove"), contiguous — no blank lines between them. Do not collapse several actions into one run-on line. A single-action commit has one bullet.

Example:

```
#69 Create contact endpoint tests

- Add create.spec.ts covering the happy path and boundary lengths
- Add negative cases for missing required fields
```

### Case 2 — the commit is not part of a task

All lines are actions starting with `- `, contiguous, no header line and no blank lines:

```
- Fix null reference in AddressBookRepository
- Guard against missing owner id before querying
- Add regression coverage for the empty search term
```

### Rules for both cases

- No trailers or signatures (`Co-Authored-By`, "Generated with…") unless the user asks for them.
- Pass the message with `-F <file>` (or a single `-m` with real newlines), never several `-m` flags — git inserts blank lines between them and breaks the list.

## Stage the changes

- Review first: `git status --short` and `git diff --stat`; read per-file diffs only where you need them to name the actions.
- Stage the intended files explicitly with `git add <paths>`. Never stage unrelated or in-progress files without confirmation; never `git add -A` blindly.
- If a plan for the issue exists (`docs/tasks/issue-<issue>-*.md`), stage it in the **same** commit, with its checklist ticked to match the work.

## Inline or delegated

Run this skill **inline** when the user asks for a commit directly. Inside `/implement-issue` and `/implement-issues` the whole skill — branch, staging, message, commit and the check — runs in the `skill-runner` agent: the caller hands it this skill's name, the compact facts (issue number and exact title, one line per changed file), the exact files to stage, the branch and a scratch file path for the message. The branch the caller names takes the place of the question in *Choose the branch first*. If you *are* the skill-runner, do not delegate again.

## Procedure

1. **Determine the case** from the branch name, the workflow context or the conversation. If it is unclear whether the commit belongs to a task, ask the user for the task number and name.
2. **Check or create the branch** as in *Choose the branch first*.
3. **Review and stage** as in *Stage the changes*.
4. **Compose the message** and write it to a scratch file outside the repository (the session's scratch directory, or the system temp folder).
5. **Commit:** `git commit -F <file>` — a successful exit is the confirmation. Do not push.
6. **Check the message:** compare `git log -1 --format=%B` with the format above. On a deviation fix the commit just made with `git commit --amend -F <file>`; never amend an earlier or a pushed commit.
7. **Report** the short SHA and the first line.
