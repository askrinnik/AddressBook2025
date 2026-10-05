---
name: harness-quality-check
description: 'Measure what the assistant harness (CLAUDE.md, .claude/rules, skills, agents, memory, MCP servers, settings) costs and whether it still works: runs fixed test sessions (context size at start and after a file read, rules loaded, and judged answers checked against a ground truth) against the current repository state, appends one row per session to .ai/benchmarks/harness/run-history.csv and writes a dated report that compares each test with its previous run. Manual use only, for example after changing CLAUDE.md, rules, skills, agents, memory, MCP servers or settings, or after a Claude Code update.'
disable-model-invocation: true
argument-hint: '[fixture or mask ...] "note on what changed since the previous run"'
---

# harness-quality-check

> Local skill note: Ported from the GitHubBackup repository harness; repository-specific, no canonical upstream skill in github/awesome-copilot.

Every session re-reads its whole context on every model call, so what the harness loads multiplies into the cost of
every session; and a smaller harness is worthless if the assistant stops catching what it used to. This skill runs a
set of fixed tests ("fixtures") and records, for every session, the same metrics (context at the first and last
model call, calls, output tokens, weighted cost, rules loaded) plus, for fixtures that have a ground truth, a score
from an LLM judge. The history lives in the repository, so the whole team can follow the trend.

## Procedure

1. Read the argument. Leading words that match a fixture name or a mask (`bench-*`) select fixtures; the rest is
   the note. List the fixtures with `Get-ChildItem .ai/benchmarks/harness/fixtures -Directory`. Nothing selected
   runs every fixture. If there is no note, ask what changed since the previous run and write the note in English:
   it is the run title and part of every file name.
2. Say what will run and how long it takes: `bench-*` about 1 minute; each `quality-*` fixture about 5 minutes
   (three repetitions). Fixtures with a `seed.patch` patch working-tree files in place for one session at a time
   and revert them, so the user must not edit files in the repository while they run.
3. From the repository root run (in the background if it is long):

   ```powershell
   pwsh .github/skills/_local.harness-quality-check/scripts/Run-Harness.ps1 -Fixture "<names or masks, comma separated>" -Note "<note>"
   ```

   Leave `-Fixture` out to run everything. The script tests whatever the working tree contains (committed and
   uncommitted changes), starts one fresh `claude -p` session per fixture repetition with a fixed model and effort,
   then calls `Collect-Harness.ps1`, which parses the session transcripts, scores the judged answers, appends the
   rows to `run-history.csv` and writes the report. If a patch does not apply, or a file it patches has uncommitted
   changes, it stops before starting anything and says why.
4. Read `.ai/benchmarks/harness/reports/<RunId>_harness-report.md`. It opens with an overall line (regressions or
   not) and a *How to read this report* block that defines every term. Its *Summary* section already says, per
   fixture, what changed against the previous run of that fixture and why (rules added or removed, start-context
   areas that moved, environment noise); report it to the user in plain words, with the numbers from the tables
   (`FirstCtx`, `Read`, deltas, calls, cost, and for judged fixtures the score and verdict). Say which instruction
   files changed since the previous run and call out the *Caveats* (different harness, changed fixture, scorer,
   client, MCP mode, uncommitted changes). Read the answers listed under *Repeats that need a look*
   before repeating a judge verdict as fact.
5. Do not commit. The history, the runs and the report are ordinary tracked files: offer to commit them on the
   current issue branch and wait for the user's go-ahead.

To score an older version of the instructions, restore or check it out, run the skill with a note that says so,
then restore the current version and run it again; the second report compares against the first.

## Reading the results

| Metric | Meaning |
|---|---|
| **FirstCtx** | Size of the context at the first model call, in tokens, from API usage. For `bench-base` it is everything loaded at start: tool definitions, system prompt, `CLAUDE.md`, memory index, skill and agent lists, MCP names and instructions. |
| **Read** | `LastCtx - FirstCtx`: tokens the session added (a file read, the path-scoped rules it triggers, its own answer). Deterministic and independent of the client, so it is the best number for rule changes. |
| **Rules loaded** | Path-scoped rules pulled in during the session (all repetitions together), with a character-based token estimate. They load when a matching file is read, so a fixture that never reads a file shows none. |
| **Mean (min-max)** | For fixtures with several repetitions, `Read`, calls, output tokens and cost are shown as the mean and the range. What a judged review adds depends on which files the model chooses to read, so compare it as a range. |
| **Score / Max** | Judged fixtures only: items found (documents named, checklist items met) out of the maximum in the fixture's `ground-truth.md`. |
| **False positives** | Findings that assert something that is not there. Real extra findings are not false positives. |
| **Verdict** | `REGRESSION` when the mean score falls by more than the larger of the previous run's own spread and 0.5, or false positives rise by two or more; `improvement` symmetrically; otherwise `within noise` (a single extra false positive is only noted). |
| **Cost units** | Weighted cost of the session: input + 0.1 x cache read + 1.25 x cache write + 5 x output. |

Only `FirstCtx`, `LastCtx` and `Read` come from API usage exactly; every other token value is characters divided
by 3.76. Three repetitions of a judged fixture exist because model output varies: one worse repetition is noise, a
lower mean is signal. The judged fixtures are explicit requests ("review this for security issues"), so they mainly
catch instructions that make the assistant *worse*; a rule that only helps unprompted work will not show as an
improvement.

## Comparability

- Each fixture is compared with the previous run that contains it. The report marks the comparison as indicative
  when the runner or parser changed (`Harness`), when the fixture folder changed (`FixtureHash`, computed over its
  files), when the scorer differs, or when the client differs (compare `FirstCtx` only within one client).
- The session records the git state it started in; uncommitted changes add a few hundred tokens to the start
  context. `Dirty` in the history means uncommitted changes outside `.ai/benchmarks/harness/` at the start of the run.
- The memory index is per user and lives outside the repository, so `FirstCtx` differs between people; compare a
  person's own runs. `Read` is comparable everywhere.
- Sessions start **without MCP servers** (`--strict-mcp-config`, the default of `-Mcp none`). The user's own MCP
  servers connect at unpredictable moments: with them, the start context varied by about 1.4k tokens between
  identical sessions, and for fixtures that restrict tools by about 31k (all MCP tool definitions load once such a
  server is connected). What the repository itself loads is what the benchmark measures; `-Mcp environment` runs with
  the user's servers as they are (the report then flags the comparison and the `~` marks on `Read`). The history's
  `Mcp` column records the mode; rows from before it existed count as `environment`.
- Answers and the manifest are held in a temp folder until every session has finished, then copied into
  `runs/`: a file that appears in the working tree would show up in the next session's git status and add a few
  tokens to its start context. Commit the results of a run before the next one for the same reason.
- Fixtures that read a file restrict the tools to `Read` (`fixture.json`), so the model cannot answer with `Grep`
  instead, which would skip the file read and the rules it pulls in.
- Keep the model, effort and Claude Code version fixed between runs you want to compare; the history records them
  for every row. Test sessions stay in the session list; judge sessions do not.

## Files

| File | Purpose |
|---|---|
| `.ai/benchmarks/harness/fixtures/<name>/prompt.txt` | The prompt (required). `{{PATCH_FILES}}` is replaced with the files of `seed.patch`. |
| `.ai/benchmarks/harness/fixtures/<name>/fixture.json` | Optional: `repetitions`, `tools` (`--tools` list; empty keeps the default tool set), `allowedTools`, `startContext` (report the start-context breakdown by area for this fixture). |
| `.ai/benchmarks/harness/fixtures/<name>/seed.patch` | Optional `git apply` patch applied for the length of one session and reverted. |
| `.ai/benchmarks/harness/fixtures/<name>/ground-truth.md` | Optional; its presence means the answer is judged. Needs a `Max score: N` line and a scoring section. |
| `.ai/benchmarks/harness/runs/<RunId>_<fixture>-<rep>.md` | The answer of one session; `<RunId>_manifest.json` holds the run settings and session ids. |
| `.ai/benchmarks/harness/run-history.csv` | One row per session; append-only, old lines are never changed. |
| `.ai/benchmarks/harness/reports/<RunId>_harness-report.md` | Report of one run with the comparison to the previous runs. |
| `scripts/Run-Harness.ps1` | Runs the selected fixtures, then collects. `-DryRun` checks the patches and prints the plan only; `-Mcp environment` keeps the user's MCP servers. |
| `scripts/Collect-Harness.ps1` | Parses, judges, appends and reports. `-Run <RunId>` re-runs it when collecting failed; `-ReportOnly` regenerates a report. |
| `scripts/lib/` | Session-transcript parser, judge and report generator. |

`<RunId>` is the start time `yyyy-MM-dd-HH-mm` plus a slug of the note: `2026-09-30-11-13_security-scope-widened`.

## Notes

- To add a test, add a folder under `fixtures/` with a `prompt.txt` (and whatever else it needs); no script change
  is needed. Choose a stable target file for a fixture that reads one; a file that grows changes `Read` between runs.
  Patches must apply to the current code, so update them when the files they touch change.
- If a run is interrupted while a patch is applied, the next run stops in the preflight. Revert it with
  `git apply -R .ai/benchmarks/harness/fixtures/<name>/seed.patch`.
- Nothing is written to the history unless every session was parsed and every judged answer scored; re-run
  `Collect-Harness.ps1 -Run <RunId>` after fixing the cause.
- The benchmark starts real Claude Code sessions: they use a part of the usage limit.
