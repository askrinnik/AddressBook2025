# Harness report: 2026-10-05-11-15_old-harness-on-main

First run in the history: nothing to compare with.

- **Note:** old harness on main
- **Setup:** commit 58259490, uncommitted changes at start: yes; Claude Code 2.1.284, model Sonnet 5.5, effort medium, harness 3, MCP servers: none.
- **Fixtures** (one test each): bench-base, quality-vertical-slice.
- **Compared with:** nothing (first run).

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

| Fixture<br>(Repeats) | Start ctx (`FirstCtx`) | End ctx (`LastCtx`) | Added by task (`Read`) | Model calls | Output tokens | Cost units | Tools loaded | Rules loaded |
|---|---|---|---|---|---|---|---|---|
| bench-base (1) | 28684 | 28684 | 0 | 1 | 3 | 35870 | all built-in<br>(15 tools, 17320 tokens) | none |
| quality-vertical-slice (3) | 8212 | 24899 | 16687 (12245-19156) | 3.67 (3-4) | 2955 (2216-3508) | 42651 (29924-51490) | Read<br>Grep<br>Glob | none |

<details><summary>How the cost units were calculated</summary>

Tokens by kind (averages over the repeats) multiplied by their weight. Weights: new input 1, cache read 0.1, cache write 1.25, output 5 per token.

| Fixture | New input (x 1) | Cache read (x 0.1) | Cache write (x 1.25) | Output (x 5) | Cost units (recomputed) | Cost units (stored) |
|---|---|---|---|---|---|---|
| bench-base | 2 | 0 | 28682 | 3 | 35870 | 35870 |
| quality-vertical-slice | 7.33 | 48012 | 18454 | 2955 | 42651 | 42651 |

Example, bench-base (first repeat): 2 x 1 + 0 x 0.1 + 28682 x 1.25 + 3 x 5 = 35870.

</details>

## Summary

One line per fixture: what was measured, the comparison with the previous run, and the conclusion after the arrow.

- **bench-base**: **start context**: 28684 tokens in the first model call, before any work (tools, system prompt, CLAUDE.md, memory index, skill list); every later call re-reads it. No earlier run to compare with.
- **quality-vertical-slice**: one session adds 16687 (12245-19156) tokens on average (range over 3 repeats) in 3.67 model calls on average; this covers the files the model chose to read, the rules loaded for them and its answer. No earlier run to compare with. Judge: 3.67 of 4 checklist items found (lowest repeat 3.5), 0 false positive(s).

## Quality (judged fixtures)

Look at Verdict: `within noise` means the review quality did not change. Score is the average number of checklist items the judge found, with the lowest and highest repeat; false positives are summed over the repeats.

| Fixture | Score (mean, min-max) | Maximum | False positives (previous run) | Previous mean score | Δ | Verdict |
|---|---|---|---|---|---|---|
| quality-vertical-slice | 3.67 (3.5-4) | 4 | 0 | | | no previous run |

### Repeats that need a look

Repeats that scored below the maximum or raised a false positive; read the answer before repeating a judge verdict as fact.

- quality-vertical-slice repeat 2: 3.5/4, 0 false positive(s). Item 1 is satisfied: the answer names the entity, EF configuration, a new migration, the contracts, and CreateContact/EditContact pages. Item 2 is satisfied for both validators, with a 254 maximum matching the column, but it does not explicitly say errors come back as RFC 7807 problem details (only a mention of checking problem-details.spec.ts) or are shown on the form, so I count it as mostly met. Item 3 is satisfied: API tests cover happy path, optional case, 254/255 boundaries, invalid format, and reuse of the factory and schema. Item 4 is satisfied: it raises validation, normalization, and search decisions and asks for confirmation before implementing. No false positives found.
- quality-vertical-slice repeat 3: 3.5/4, 0 false positive(s). Item 1 is fully met (entity, ContactConfiguration, migration, contracts, Create/Edit pages). Item 2 is met (both validators, 254 max length, RFC 7807 errors shown on form). Item 3 is met (schema/factory, valid, none, 254 boundary, invalid format and 255 negatives), though it never states the 400 status. Item 4 is only half met: it makes decisions itself (254, trim to null, search/list) and asks the user to confirm only one, without raising uniqueness or existing-row migration as open questions, and it does not stop for approval before implementing. No false positives found.

<details><summary>Every repeat with the judge's notes and a link to the answer</summary>

| Fixture | Repeat | Score | False positives | Judge notes | Answer |
|---|---|---|---|---|---|
| quality-vertical-slice | 1 | 4/4 | 0 | Item 1: covers entity, config, migration, contracts, Create/Edit pages. Item 2: both validators with email format and max length 254 matching the column, RFC 7807 shown on form. Item 3: Playwright tests in ApiTests with happy path, optional, boundary 254/255, 400 negative, schema and factory. Item 4: raises list column, length and search questions and proposes defaults, asking for confirmation. No clear false claims about the repository. | [answer](../runs/2026-10-05-11-15_old-harness-on-main_quality-vertical-slice-1.md) |
| quality-vertical-slice | 2 | 3.5/4 | 0 | Item 1 is satisfied: the answer names the entity, EF configuration, a new migration, the contracts, and CreateContact/EditContact pages. Item 2 is satisfied for both validators, with a 254 maximum matching the column, but it does not explicitly say errors come back as RFC 7807 problem details (only a mention of checking problem-details.spec.ts) or are shown on the form, so I count it as mostly met. Item 3 is satisfied: API tests cover happy path, optional case, 254/255 boundaries, invalid format, and reuse of the factory and schema. Item 4 is satisfied: it raises validation, normalization, and search decisions and asks for confirmation before implementing. No false positives found. | [answer](../runs/2026-10-05-11-15_old-harness-on-main_quality-vertical-slice-2.md) |
| quality-vertical-slice | 3 | 3.5/4 | 0 | Item 1 is fully met (entity, ContactConfiguration, migration, contracts, Create/Edit pages). Item 2 is met (both validators, 254 max length, RFC 7807 errors shown on form). Item 3 is met (schema/factory, valid, none, 254 boundary, invalid format and 255 negatives), though it never states the 400 status. Item 4 is only half met: it makes decisions itself (254, trim to null, search/list) and asks the user to confirm only one, without raising uniqueness or existing-row migration as open questions, and it does not stop for approval before implementing. No false positives found. | [answer](../runs/2026-10-05-11-15_old-harness-on-main_quality-vertical-slice-3.md) |

</details>

## Instruction files that differ from the most recent earlier run

Not applicable (first run).

## Start context by area (bench-base, client sdk-cli)

What the first model call consists of, so a change in start context can be traced to an area. Token sizes are estimates; the last row is the exact figure reported by the API.

<details><summary>Area table, MCP servers, skills and instruction files</summary>

| Area | Tokens (est.) | Share of start context | Δ vs previous run |
|---|---|---|---|
| Built-in tool definitions | 17320 | 60 % |  |
| MCP tool definitions (loaded) | 0 | 0 % |  |
| System prompt | 1606 | 6 % |  |
| CLAUDE.md | 1887 | 7 % |  |
| Memory index | 182 | 1 % |  |
| Skill list | 4542 | 16 % |  |
| Agent list | 920 | 3 % |  |
| Deferred tool names | 47 | 0 % |  |
| MCP server instructions | 0 | 0 % |  |
| Not accounted for (reminders, environment, git status, estimate error) | 2180 | 8 % | |
| **FirstCtx (API)** | **28684** | 100% |  |

Largest tool definitions: PowerShell=4378; Workflow=2344; ScheduleWakeup=2099; Agent=1330; Bash=1310; Grep=1010

### MCP servers

None: the run started its sessions without MCP servers, so this start context is what the repository itself loads.

### Skills, agents and instruction files

- Skills listed: 45, 4542 tokens. By source (count/tokens): local=7/544; other=29/2082; plugin=9/1672. Largest: dataviz=385; anthropic-skills:docs=274; anthropic-skills:pptx=262; anthropic-skills:google-workspace=260; anthropic-skills:xlsx=259.
- Agent types listed: 11, 920 tokens.
- Instruction files loaded at start (tokens, est.): CLAUDE.md=1887; MEMORY.md=182 (CLAUDE.md 71 lines, memory index 7 lines).

</details>

## History

Start context, end context, added tokens and score of each fixture over the latest 8 runs that contain it; use it to see whether a number is stable over time.

<details><summary>History tables per fixture</summary>

### bench-base

| Run | Commit | Uncommitted | Harness | Start ctx | End ctx | Added by task | Score |
|---|---|---|---|---|---|---|---|
| 2026-10-05-11-15_old-harness-on-main | 58259490 | yes | 3 | 28684 | 28684 | 0 |  |

### quality-vertical-slice

| Run | Commit | Uncommitted | Harness | Start ctx | End ctx | Added by task | Score |
|---|---|---|---|---|---|---|---|
| 2026-10-05-11-15_old-harness-on-main | 58259490 | yes | 3 | 8212 | 24899 | 16687 | 3.67/4 |

</details>

## Caveats

- The run had uncommitted changes: their file list is part of the start context and the commit id alone does not identify the instructions that were tested. Applies to: all fixtures.

