---
name: sync-ai-customizations
description: 'Audit and synchronize this repository''s cross-tool AI customizations for GitHub Copilot and Claude Code — verifies prompt wrapper structure, shared-body links in .ai/prompts, and byte-level skill parity between .github and .claude, reports policy mismatches, and scaffolds the correct structure with wrappers. Use when adding, moving, or reviewing prompts/commands or skills, or to check the .github vs .claude layout is in sync.'
argument-hint: '[--apply to also fix, otherwise report-only]'
---

# sync-ai-customizations

Keeps the repository's AI customizations consistent across **GitHub Copilot** (`.github/`) and **Claude Code** (`.claude/`), following the layout this repo uses:

- **Entry workflows are prompts.** The step-by-step body lives once in `.ai/prompts/<name>.md`. Thin wrappers reference it: `.github/prompts/<name>.prompt.md` (Copilot, via a Markdown link) and `.claude/commands/<name>.md` (Claude, via an `@` include). Each wrapper keeps only its own frontmatter and the work-item-id capture.
- **Reusable sub-procedures are skills.** A self-contained `SKILL.md` lives under `.github/skills/<name>/` (the source of truth) and is mirrored **byte-for-byte** to `.claude/skills/<name>/`. A short exclusion list stays Copilot-only.
- **Repo-local workflow skills use the `_local.` prefix** (e.g. `_local.git-commit`). The directory carries the prefix; the `name:` in `SKILL.md` stays unprefixed (`git-commit`), so the skill is still invoked as `/git-commit`.
- Prompts reference skills **by name** (e.g. "following the `git-commit` skill").

The policy — locations, the exclusion list, and thresholds — is data, not hard-coded: `.ai/customizations.policy.json`. Edit that file to change the rules.

## When to use

- After adding, renaming, moving, or deleting a prompt, command, or skill.
- To verify `.github` and `.claude` are in sync before opening a PR.
- When a slash command appears twice, or a skill looks out of date in one tool.

## Step 1 — Audit (always first)

Run the bundled PowerShell script (it locates the repo root itself from its own path):

```
pwsh -File scripts/check.ps1
```

Add `-Json` for machine-readable output. The script groups findings by severity and exits non-zero when there is any **Error**. It checks:

- **skill-parity** — every non-excluded skill under `.github/skills/` has an identical copy under `.claude/skills/`; a missing copy, an extra/missing file, or content drift are Errors, while a mirror-only skill or a wrongly-mirrored excluded skill is a Warning.
- **skill-format** — each skill has a `SKILL.md` whose `name` matches its directory and is kebab-case (the `_local.` prefix is allowed).
- **prompt-structure** — every `.ai/prompts/<name>.md` has both wrappers, each references the shared body, and each wrapper stays thin; a wrapper pointing at a missing body is an Error.
- **collision** — no name is used by both a prompt/command and a skill (slash-command clash).

## Step 2 — Propose

Summarize the findings to the user, grouped by severity, and state the concrete fix for each Error/Warning. **Do not change anything yet** unless the user asked to apply, or invoked the skill with `--apply`.

## Step 3 — Apply (only on confirmation)

Once the user agrees, fix the reported items following the layout above:

- **Skill drift / missing mirror** — copy the authoritative `.github/skills/<name>/` directory over `.claude/skills/<name>/` so they are byte-identical (reverse the direction only if the user confirms the Claude copy is the correct one).
- **Missing prompt wrapper** — create it from the shared body: a Copilot `.prompt.md` with `mode`/`description`/`tools` frontmatter + `${input:...}` id capture + a Markdown link to `../../.ai/prompts/<name>.md`; a Claude command `.md` with `description`/`argument-hint`/`allowed-tools` frontmatter + `$ARGUMENTS` id capture + `@.ai/prompts/<name>.md`.
- **Fat wrapper** — extract the duplicated steps into `.ai/prompts/<name>.md` and reduce the wrapper to a reference.
- **Collision** — rename one side, or convert the prompt into a skill (or vice-versa) so the name is used once.

Never delete unfamiliar or untracked files to "resolve" a mismatch — report them and let the user decide.

## Scaffolding a new item

- **New workflow (prompt):** write the body once in `.ai/prompts/<name>.md`, then create both thin wrappers as above.
- **New reusable procedure (skill):** create `.github/skills/<name>/SKILL.md` (self-contained), then copy the directory to `.claude/skills/<name>/`. If it must stay Copilot-only, add `<name>` to `excludedFromMirror` in the policy instead of copying it. For a repo-local workflow skill, name the directory `_local.<name>` on both sides.

After any change, re-run Step 1 to confirm a clean report.
