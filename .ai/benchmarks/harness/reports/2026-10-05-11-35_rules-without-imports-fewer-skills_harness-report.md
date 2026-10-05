# Harness report: 2026-10-05-11-35_rules-without-imports-fewer-skills

**Overall: no regressions; better in bench-base, quality-vertical-slice.**

- **Note:** rules without imports, fewer skills
- **Setup:** commit a1212beb, uncommitted changes at start: no; Claude Code 2.1.284, model Sonnet 5.5, effort medium, harness 3, MCP servers: none.
- **Fixtures** (one test each): bench-base, quality-vertical-slice.
- **Compared with:** the most recent earlier run, `2026-10-05-11-19_new-harness-after-184` (commit 63d85a8c); each fixture is compared with the previous run that contains it.

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
| bench-base (1) | 30696 (Δ -5498) | 30696 (Δ -5498) | 0 (Δ 0) | 1 | 4 | 18582 | all built-in<br>(15 tools, 17320 tokens) | none |
| quality-vertical-slice (3) | 8824 (Δ -4388) | 21838 (Δ -4255) | 13014 (9905-16537) (Δ +133) | 4.33 (4-5) | 3014 (2455-3336) | 38732 (34617-44646) | Read<br>Grep<br>Glob | api-architecture=39<br>blazor=36<br>csharp=30<br>docs=408<br>update-docs-on-code-change=391 |

<details><summary>How the cost units were calculated</summary>

Tokens by kind (averages over the repeats) multiplied by their weight. Weights: new input 1, cache read 0.1, cache write 1.25, output 5 per token.

| Fixture | New input (x 1) | Cache read (x 0.1) | Cache write (x 1.25) | Output (x 5) | Cost units (recomputed) | Cost units (stored) |
|---|---|---|---|---|---|---|
| bench-base | 2 | 17224 | 13470 | 4 | 18582 | 18582 |
| quality-vertical-slice | 8.67 | 55199 | 14508 | 3014 | 38731 | 38732 |

Example, bench-base (first repeat): 2 x 1 + 17224 x 0.1 + 13470 x 1.25 + 4 x 5 = 18582.

</details>

## Summary

One line per fixture: what was measured, the comparison with the previous run, and the conclusion after the arrow.

- **bench-base**: **start context**: 30696 tokens in the first model call, before any work (tools, system prompt, CLAUDE.md, memory index, skill list); every later call re-reads it. Previous run: 36194, so -5498. Where it moved: claude.md +109; memory index +39; skill list -798; not attributable to any area (reminders, environment, git status) -4848. **-> tokens better (fewer tokens).**
- **quality-vertical-slice**: one session adds 13014 (9905-16537) tokens on average (range over 3 repeats) in 4.33 model calls on average; this covers the files the model chose to read, the rules loaded for them and its answer. Previous run: 12881 (11283-14579). Allowed difference: 3296 (the larger of that run's own range and 1000); actual difference: +133. Judge: 4 of 4 checklist items found (previous run 3.33), 0 false positive(s). **-> tokens unchanged; quality improvement.**

## Quality (judged fixtures)

Look at Verdict: `within noise` means the review quality did not change. Score is the average number of checklist items the judge found, with the lowest and highest repeat; false positives are summed over the repeats.

| Fixture | Score (mean, min-max) | Maximum | False positives (previous run) | Previous mean score | Δ | Verdict |
|---|---|---|---|---|---|---|
| quality-vertical-slice | 4 (4-4) | 4 | 0 (0) | 3.33 | +0.67 | improvement |

### Repeats that need a look

None: every repeat scored the maximum with no false positives.

<details><summary>Every repeat with the judge's notes and a link to the answer</summary>

| Fixture | Repeat | Score | False positives | Judge notes | Answer |
|---|---|---|---|---|---|
| quality-vertical-slice | 1 | 4/4 | 0 | Covers the full slice (entity, config, migration, contracts, Create/Edit pages), both validators with RFC 7807 errors, Playwright ApiTests with boundary/negative/optional cases, and raises six decisions for confirmation before implementing. It doesn't explicitly name contact.factory.ts or the response schema, but the rest of item 3 is covered; no clearly false repository claims identified. | [answer](../runs/2026-10-05-11-35_rules-without-imports-fewer-skills_quality-vertical-slice-1.md) |
| quality-vertical-slice | 2 | 4/4 | 0 | Item 1: names the full slice (Contact.cs, ContactConfiguration, migration, commands, ContactModel, CreateContact/EditContact.razor). Item 2: both validators with email format and max length 254 matching the column, with 400 problem details and the Web form showing errors. Item 3: Playwright tests cover happy path, optional case, the 254/255 boundary and an invalid format returning 400, but contact.factory.ts and the response schema are not mentioned, so this item is only mostly met. Item 4: seven decisions raised for confirmation before implementing. No clear false positives. | [answer](../runs/2026-10-05-11-35_rules-without-imports-fewer-skills_quality-vertical-slice-2.md) |
| quality-vertical-slice | 3 | 4/4 | 0 | All four items are covered. The slice names the entity, EF configuration, migration, contracts and Web pages. Both validators get the email rule with RFC 7807 errors. The Playwright API tests cover the factory, schema, boundaries and negatives. It raises a table of decisions and asks for confirmation before implementing. No clearly false repository claims. | [answer](../runs/2026-10-05-11-35_rules-without-imports-fewer-skills_quality-vertical-slice-3.md) |

</details>

## Instruction files that differ from the most recent earlier run

Changes in rules, agents, skills, `CLAUDE.md` and settings from `63d85a8c` to `a1212beb` :

```
 .claude/rules/api-architecture.md                  |  6 +--
 .claude/rules/blazor.md                            |  6 +--
 .claude/rules/csharp.md                            |  6 +--
 .claude/rules/playwright.md                        |  6 +--
 .claude/settings.json                              | 52 ++++++++++++++++------
 .claude/skills/coverage-analysis/SKILL.md          |  1 +
 .claude/skills/create-specification/SKILL.md       |  1 +
 .../skills/directory-build-organization/SKILL.md   |  1 +
 .claude/skills/dotnet-timezone/SKILL.md            |  1 +
 .claude/skills/test-anti-patterns/SKILL.md         |  1 +
 CLAUDE.md                                          |  3 +-
 11 files changed, 54 insertions(+), 30 deletions(-)
```

## Start context by area (bench-base, client sdk-cli)

What the first model call consists of, so a change in start context can be traced to an area. Token sizes are estimates; the last row is the exact figure reported by the API.

<details><summary>Area table, MCP servers, skills and instruction files</summary>

| Area | Tokens (est.) | Share of start context | Δ vs previous run |
|---|---|---|---|
| Built-in tool definitions | 17320 | 56 % | 0 |
| MCP tool definitions (loaded) | 0 | 0 % | 0 |
| System prompt | 1606 | 5 % | 0 |
| CLAUDE.md | 2389 | 8 % | +109 |
| Memory index | 221 | 1 % | +39 |
| Skill list | 5110 | 17 % | -798 |
| Agent list | 1548 | 5 % | 0 |
| Deferred tool names | 47 | 0 % | 0 |
| MCP server instructions | 0 | 0 % | 0 |
| Not accounted for (reminders, environment, git status, estimate error) | 2455 | 8 % | |
| **FirstCtx (API)** | **30696** | 100% | -5498 |

Largest tool definitions: PowerShell=4378; Workflow=2344; ScheduleWakeup=2099; Agent=1330; Bash=1310; Grep=1010

### MCP servers

None: the run started its sessions without MCP servers, so this start context is what the repository itself loads.

### Skills, agents and instruction files

- Skills listed: 48, 5110 tokens. By source (count/tokens): local=12/1083; other=27/2111; plugin=9/1672. Largest: dataviz=385; anthropic-skills:docs=274; anthropic-skills:pptx=262; anthropic-skills:google-workspace=260; anthropic-skills:xlsx=259.
- Agent types listed: 16, 1548 tokens.
- Instruction files loaded at start (tokens, est.): CLAUDE.md=2389; MEMORY.md=221 (CLAUDE.md 84 lines, memory index 8 lines).

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

### quality-vertical-slice

| Run | Commit | Uncommitted | Harness | Start ctx | End ctx | Added by task | Score |
|---|---|---|---|---|---|---|---|
| 2026-10-05-11-15_old-harness-on-main | 58259490 | yes | 3 | 8212 | 24899 | 16687 | 3.67/4 |
| 2026-10-05-11-19_new-harness-after-184 | 63d85a8c | no | 3 | 13212 | 26093 | 12881 | 3.33/4 |
| 2026-10-05-11-35_rules-without-imports-fewer-skills | a1212beb | no | 3 | 8824 | 21838 | 13014 | 4/4 |

</details>


