# AI harness benchmark

Results of the `harness-quality-check` skill (`.github/skills/_local.harness-quality-check/`): what the harness costs
(context at the start of a session, tokens a file read adds, path-scoped rules loaded) and whether it still works
(answers scored by a judge against a ground truth). How the harness is built is described in `docs/ai/README.md`.

- `fixtures/` — the tests: one folder per fixture (`prompt.txt`, optionally `fixture.json`, `seed.patch`,
  `ground-truth.md`).
- `run-history.csv` — one row per session, created by the first run. Append-only: rows are never edited or removed.
- `runs/` — the answer of every session and the manifest of every run.
- `reports/` — one report per run, comparing each fixture with its previous run.

Run it through the skill (`/harness-quality-check bench-* "<what changed>"`; without fixtures every fixture runs) or
directly:
`pwsh .github/skills/_local.harness-quality-check/scripts/Run-Harness.ps1 -Fixture 'bench-*' -Note "<what changed>"`.

## Fixtures

| Fixture | What it checks |
|---|---|
| `bench-base` | Size of the start context by area: tools, system prompt, `CLAUDE.md`, memory, skills, agents, MCP |
| `quality-vertical-slice` | Whether a feature request is answered with the full API + Contracts + Web slice, FluentValidation, Playwright API tests, and open decisions raised before coding |
