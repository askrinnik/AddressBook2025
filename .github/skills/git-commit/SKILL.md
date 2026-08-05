---
name: git-commit
description: 'Create Git commits following this project''s commit message conventions. Use ALWAYS when the user asks to commit, commit changes, make a commit, or write a commit message. Formats the message based on whether the work belongs to a task (issue) or not.'
argument-hint: 'Optional: task number/name, or leave empty for a non-task commit'
---

# Git Commit

Always use this skill whenever the user asks to commit, commit changes, make a commit, or write a commit message in this repository.

## When to Use

- The user says "commit", "commit changes", "make a commit", "commit this", "закоммить", or similar.
- Any time a commit message must be composed for this repository.

## Commit Message Conventions

There are two cases. Pick the correct one before writing the message.

### Case 1 — The commit is part of a task

Use this when the work relates to a task/issue (for example a GitHub issue, a `Tx` task from a plan, a ticket, or a task-named branch).

- **Line 1:** the task number, then a single space, then the task name.
- **Line 2:** a blank separator line.
- **From line 3 onward:** the commit details, formatted as a list.
  - Each action is its own line and MUST start with `- ` (dash + space).
  - Split details across multiple lines — one line per action — when the commit contains several distinct actions.
  - Do not collapse multiple actions into a single run-on line.
  - Do NOT put blank lines between the action lines; they must be contiguous.

Example (task with several actions):

```
T13 Add PUT update tests

- Add update.spec.ts covering full and partial updates
- Add negative cases for non-existent id and validation errors
- Wire the update fixture cleanup in teardown
```

Example (task with a single action):

```
#69 Create contact endpoint tests

- Add create.spec.ts covering the happy path and boundary lengths
```

### Case 2 — The commit is NOT part of a task

Use this when the work is standalone and not tied to any task.

- **Line 1:** the first commit detail, starting with `- ` (dash + space), with no task number/name.
- **From line 2 onward:** the remaining commit details, each also starting with `- `.
- Still split details across multiple lines — one line per action — when there are several actions.
- No blank separator line is used in this case: all action lines are contiguous with no blank lines between them.

Example:

```
- Fix null reference in AddressBookRepository
- Guard against missing owner id before querying
- Add regression coverage for the empty search term
```

## Procedure

1. **Determine the case.** Check the current branch, the active issue/task context, and the conversation. If it is unclear whether the commit belongs to a task, ask the user for the task number and name before committing.
2. **Check the branch for task commits.** If the commit is part of a task (Case 1) and the current branch is the main branch (`main` or `master`), do NOT commit directly to it. First ask the user whether to create a new branch named after the current task number. If they agree, create and switch to that branch (for example `git switch -c <task-number>`) before staging, and make the commit there. If they decline, proceed on the current branch.
3. **Review what will be committed.** Run `git status` and `git diff` (or `git diff --staged`) to understand every change and enumerate the distinct actions for the body lines.
4. **Stage the changes.** Use `git add` for the intended files. Never stage unrelated or in-progress files without confirmation.
5. **Compose the message** following Case 1 or Case 2 above. Use a single `-m` with real newlines so the body lines stay contiguous. Do NOT use multiple `-m` flags: git inserts a blank line between each `-m`, which breaks the list formatting.
6. **Commit.** Run `git commit`. Do not push unless the user explicitly asks.
7. **Confirm.** Report the resulting commit message and short SHA back to the user.

## Notes

- Write the commit message in English.
- Keep each line concise and imperative ("Add", "Fix", "Update", "Remove").
- Do not add tooling signatures or extra footers unless the user requests them.
