# Harness report: 2026-10-07-16-54_parity-with-githubbackup-shipping-order

**Overall: worse in bench-base** (see Summary for what moved and why).

- **Note:** parity with GitHubBackup: shipping order, git-commit and open-pr split, /next-issue
- **Setup:** commit 65be4ffe, uncommitted changes at start: no; Claude Code 2.1.291, model Sonnet 5.5, effort medium, harness 3, MCP servers: none.
- **Fixtures** (one test each): bench-base, quality-vertical-slice.
- **Compared with:** the most recent earlier run, `2026-10-05-11-35_rules-without-imports-fewer-skills` (commit a1212beb); each fixture is compared with the previous run that contains it.

## How to read this report

Every fixture is one scripted Claude Code session, or several repeats of it. All token numbers come from the session transcript. The columns of the first table are explained below from left to right, one paragraph per column; the terms of the Quality table and the `~` mark follow.

**Fixture (Repeats).** The name of the test, and in brackets how many times its session was run. `bench-*` fixtures measure cost (what a session loads and what reading a file adds); `quality-*` fixtures also have a judge that scores the answer. Where the number of repeats is more than 1, the other numbers are averages, shown as "mean (min-max)": the average followed by the lowest and the highest repeat.

**Start ctx (`FirstCtx`).** Tokens in the very first model call, before any work: tool definitions, system prompt, CLAUDE.md, memory index, skill and agent lists. Every later call of the session re-reads it. It depends on the tools loaded, so compare it only between runs of the same fixture. The bracket `(Δ +25)` is the change against the previous run of this fixture; up to 50 tokens counts as unchanged.

**End ctx (`LastCtx`).** Tokens in the last model call: the start context plus everything the task added. The bracket is the change against the previous run.

**Added by task (`Read`).** End ctx minus Start ctx: the tokens the task put into the context, that is the file or files read, the rules loaded for them and the model's answer. This is the number that shows what the instructions cost per task. The bracket is the change against the previous run; for fixtures with repeats, a change is noise when it is at most the larger of the previous run's own range and 1000 tokens ("within the spread").

**Model calls.** How many requests the session sent to the model. Each call re-reads the whole context, so more calls cost more.

**Output tokens.** Tokens the model wrote (answers and tool calls).

**Cost units.** The price of the session in relative units, where one new input token costs 1. Output is dearer and cached input is cheaper, so the session's tokens are counted by kind and multiplied by a weight: `cost units = new input x 1 + cache read x 0.1 + cache write x 1.25 + output x 5`. *New input* is context that was not cached, *cache read* is context taken from the prompt cache (the whole context is re-read on every model call), *cache write* is context stored into the cache the first time, *output* is what the model wrote. The sums are over all model calls of the session. Use it to compare sessions by cost, not by size. The token counts and the weights of every session are stored in `run-history.csv` (`InputTok`, `CacheReadTok`, `CacheWriteTok`, `OutTok`, `WInput`, `WCacheRead`, `WCacheWrite`, `WOutput`), so the value can be recomputed from the row; the breakdown is under the context table. The weights are relative prices assumed by the skill, not amounts of money.

**Tools loaded.** The tools the session was given. A fixture that sets none gets every built-in tool, and their definitions (about 17000 tokens) are part of its start context; fixtures limited to `Read` or a few tools carry almost none, which is why their start context is much smaller.

**Rules loaded.** Instruction files pulled in when a file of a matching type is read, as name=tokens. A change here is a real change to the instructions. A "Rules vs previous run" column appears only when some fixture's rules changed.

**Quality table.** *Score* is the number of checklist items the judge found, with the lowest and highest repeat, out of *Maximum*. *False positives* are findings the judge rejected as not real problems, summed over the repeats (previous run in brackets). The *Verdict* is `within noise` (no real change), `REGRESSION` (the mean score fell by more than the larger of the previous run's range and 0.5, or there are two or more extra false positives), `improvement` (the same, upward) or `no previous run`. One extra false positive is only noted, because the judge varies by that much.

**`~` after a number.** MCP servers were not ready when the session started, so the number can be about 1000 tokens off (see Caveats).

## Context and cost per fixture

The value in brackets after a number, (Δ ...), is the change against the previous run (0 or a few tens of tokens is noise). Values are averages over the repeats; "mean (min-max)" is shown for fixtures that ran more than once. Start context depends on the tools loaded (see the Tools loaded column), so compare it only between runs of the same fixture, never between fixtures with different tools.

| Fixture<br>(Repeats) | Start ctx (`FirstCtx`) | End ctx (`LastCtx`) | Added by task (`Read`) | Model calls | Output tokens | Cost units | Tools loaded | Rules loaded | Rules vs previous run |
|---|---|---|---|---|---|---|---|---|---|
| bench-base (1) | 34885 (Δ +4189) | 34885 (Δ +4189) | 0 (Δ 0) | 1 | 3 | 3505 | all built-in<br>(15 tools, 17620 tokens) | none | unchanged |
| quality-vertical-slice (3) | 10427 (Δ +1603) | 22412 (Δ +573) | 11985 (10978-12553) (Δ -1030) | 4.67 (4-5) | 3277 (2837-3725) | 37856 (35560-41539) | Read<br>Grep<br>Glob | api-architecture=39<br>blazor=36<br>csharp=30<br>docs=462<br>update-docs-on-code-change=441 | docs 408->462 |

<details><summary>How the cost units were calculated</summary>

Tokens by kind (averages over the repeats) multiplied by their weight. Weights: new input 1, cache read 0.1, cache write 1.25, output 5 per token.

| Fixture | New input (x 1) | Cache read (x 0.1) | Cache write (x 1.25) | Output (x 5) | Cost units (recomputed) | Cost units (stored) |
|---|---|---|---|---|---|---|
| bench-base | 2 | 34883 | 0 | 3 | 3505 | 3505 |
| quality-vertical-slice | 9.33 | 64812 | 11985 | 3277 | 37856 | 37856 |

Example, bench-base (first repeat): 2 x 1 + 34883 x 0.1 + 0 x 1.25 + 3 x 5 = 3505.

</details>

## Summary

One line per fixture: what was measured, the comparison with the previous run, and the conclusion after the arrow.

- **bench-base**: **start context**: 34885 tokens in the first model call, before any work (tools, system prompt, CLAUDE.md, memory index, skill list); every later call re-reads it. Previous run: 30696, so +4189. Where it moved: no single area explains it. **-> tokens worse (more tokens).**
- **quality-vertical-slice**: one session adds 11985 (10978-12553) tokens on average (range over 3 repeats) in 4.67 model calls on average; this covers the files the model chose to read, the rules loaded for them and its answer. Previous run: 13014 (9905-16537). Allowed difference: 6632 (the larger of that run's own range and 1000); actual difference: -1030. Rules loaded changed: docs 408->462. Judge: 4 of 4 checklist items found (previous run 4), 0 false positive(s). **-> tokens unchanged; quality unchanged (within noise).**

## Quality (judged fixtures)

Look at Verdict: `within noise` means the review quality did not change. Score is the average number of checklist items the judge found, with the lowest and highest repeat; false positives are summed over the repeats.

| Fixture | Score (mean, min-max) | Maximum | False positives (previous run) | Previous mean score | Δ | Verdict |
|---|---|---|---|---|---|---|
| quality-vertical-slice | 4 (4-4) | 4 | 0 (0) | 4 | 0 | within noise |

### Repeats that need a look

None: every repeat scored the maximum with no false positives.

<details><summary>Every repeat with the judge's notes and a link to the answer</summary>

| Fixture | Repeat | Score | False positives | Judge notes | Answer |
|---|---|---|---|---|---|
| quality-vertical-slice | 1 | 4/4 | 0 | All four items are covered: the whole slice including the migration, contracts and Web pages; both validators with a max length and format, plus a 400 ProblemDetails errors.Email check; Playwright API tests for create/update, no email, 254/255 boundary and malformed address; and several decisions raised for confirmation. The only gap is that contact.factory.ts reuse isn't named, which is minor, and no false statements were identified. | [answer](../runs/2026-10-07-16-54_parity-with-githubbackup-shipping-order_quality-vertical-slice-1.md) |
| quality-vertical-slice | 2 | 4/4 | 0 | All four items are met: the slice is named with real files and a migration (1), both validators carry length and format rules with errors.Email in ProblemDetails and the Web form (2), Playwright API tests cover valid, missing, boundary 254/255, bad format and factory/schema updates (3), and seven decisions are raised for confirmation before implementing (4). No clear false statements about the repo. | [answer](../runs/2026-10-07-16-54_parity-with-githubbackup-shipping-order_quality-vertical-slice-2.md) |
| quality-vertical-slice | 3 | 4/4 | 0 | All four items are met: the whole slice is named, including the migration, both validators with max length and RFC 7807 errors, Playwright API tests with boundary and negative cases, and several decisions raised for confirmation before implementing. The answer doesn't mention contact.factory.ts specifically, but it gives enough coverage of the tests to count. No clearly false repository claims were found, since the uncertain parts were marked as inferred. | [answer](../runs/2026-10-07-16-54_parity-with-githubbackup-shipping-order_quality-vertical-slice-3.md) |

</details>

## Instruction files that differ from the most recent earlier run

Changes in rules, agents, skills, `CLAUDE.md` and settings from `a1212beb` to `65be4ffe` :

```
 .ai/prompts/implement-issue.md                     |  63 ++++----
 .ai/prompts/implement-issues.md                    |  77 ++++++++++
 .ai/prompts/next-issue.md                          |   5 +
 .claude/agents/build-runner.md                     |  61 ++++++++
 .claude/agents/issue-developer.md                  |   2 +-
 .claude/agents/issue-planner.md                    |   2 +-
 .claude/agents/security-reviewer.md                |   5 +-
 .claude/agents/skill-runner.md                     |  54 +++----
 .claude/commands/implement-issue.md                |   2 +-
 .claude/commands/implement-issues.md               |   9 ++
 .claude/commands/next-issue.md                     |   9 ++
 .claude/rules/bunit.md                             |   8 ++
 .claude/rules/docs.md                              |   6 +-
 .claude/rules/github-actions.md                    |   1 +
 .claude/rules/update-docs-on-code-change.md        |   4 +-
 .claude/settings.json                              |   6 +
 .claude/skills/_local.git-commit/SKILL.md          |  88 ++++++------
 .claude/skills/_local.github-issue/SKILL.md        |  34 ++++-
 .../scripts/Set-AcceptanceChecks.ps1               | 132 +++++++++++++++++
 .../scripts/lib/Report.ps1                         |   2 +-
 .claude/skills/_local.open-pr/SKILL.md             |  61 ++++----
 .claude/skills/_local.write-tests/SKILL.md         |   4 +-
 .claude/skills/document-workflow/SKILL.md          |  95 ++++++++++++
 .../skills/document-workflow/references/format.md  | 160 +++++++++++++++++++++
 .../document-workflow/scripts/preview-mermaid.cjs  |  75 ++++++++++
 .../instructions/bunit-conventions.instructions.md |  99 +++++++++++++
 .github/prompts/implement-issues.prompt.md         |  11 ++
 .github/prompts/next-issue.prompt.md               |  10 ++
 CLAUDE.md                                          |  12 +-
 29 files changed, 954 insertions(+), 143 deletions(-)
```

## Start context by area (bench-base, client claude-desktop)

What the first model call consists of, so a change in start context can be traced to an area. Token sizes are estimates; the last row is the exact figure reported by the API.

<details><summary>Area table, MCP servers, skills and instruction files</summary>

| Area | Tokens (est.) | Share of start context | Δ vs previous run |
|---|---|---|---|
| Built-in tool definitions | 17620 | 51 % |  |
| MCP tool definitions (loaded) | 0 | 0 % |  |
| System prompt | 1719 | 5 % |  |
| CLAUDE.md | 3019 | 9 % |  |
| Memory index | 221 | 1 % |  |
| Skill list | 6432 | 18 % |  |
| Agent list | 2019 | 6 % |  |
| Deferred tool names | 47 | 0 % |  |
| MCP server instructions | 0 | 0 % |  |
| Not accounted for (reminders, environment, git status, estimate error) | 3808 | 11 % | |
| **FirstCtx (API)** | **34885** | 100% |  |

Largest tool definitions: PowerShell=4542; Workflow=2344; ScheduleWakeup=2099; Bash=1446; Agent=1330; Grep=1010

### MCP servers

None: the run started its sessions without MCP servers, so this start context is what the repository itself loads.

### Skills, agents and instruction files

- Skills listed: 56, 6432 tokens. By source (count/tokens): local=12/1217; other=31/2444; plugin=13/2527. Largest: dataviz=385; anthropic-skills:docs=274; anthropic-skills:pptx=262; anthropic-skills:google-workspace=260; anthropic-skills:xlsx=259.
- Agent types listed: 18, 2019 tokens.
- Instruction files loaded at start (tokens, est.): CLAUDE.md=3019; MEMORY.md=221 (CLAUDE.md 90 lines, memory index 8 lines).

</details>

## History

Start context, end context, added tokens and score of each fixture over the latest 8 runs that contain it; use it to see whether a number is stable over time.

<details><summary>History tables per fixture</summary>

### bench-base

| Run | Commit | Uncommitted | Harness | Start ctx | End ctx | Added by task | Score |
|---|---|---|---|---|---|---|---|
| 2026-10-05-11-15_old-harness-on-main | 58259490 | yes | 3 | 28684 | 28684 | 0 |  |
| 2026-10-05-11-19_new-harness-after-184 | 63d85a8c | no | 3 | 36194 | 36194 | 0 |  |
| 2026-10-05-11-35_rules-without-imports-fewer-skills | a1212beb | no | 3 | 30696 | 30696 | 0 |  |
| 2026-10-07-16-54_parity-with-githubbackup-shipping-order | 65be4ffe | no | 3 | 34885 | 34885 | 0 |  |

### quality-vertical-slice

| Run | Commit | Uncommitted | Harness | Start ctx | End ctx | Added by task | Score |
|---|---|---|---|---|---|---|---|
| 2026-10-05-11-15_old-harness-on-main | 58259490 | yes | 3 | 8212 | 24899 | 16687 | 3.67/4 |
| 2026-10-05-11-19_new-harness-after-184 | 63d85a8c | no | 3 | 13212 | 26093 | 12881 | 3.33/4 |
| 2026-10-05-11-35_rules-without-imports-fewer-skills | a1212beb | no | 3 | 8824 | 21838 | 13014 | 4/4 |
| 2026-10-07-16-54_parity-with-githubbackup-shipping-order | 65be4ffe | no | 3 | 10427 | 22412 | 11985 | 4/4 |

</details>

## Caveats

- Different client (sdk-cli before, claude-desktop now); compare FirstCtx with care. Applies to: all fixtures.

