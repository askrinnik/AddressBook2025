# Phase 3: Create `run-tests` Skill

> **Depends on:** Phase 1 (env-var support) for local-run verification  
> **Blocks:** nothing (can be authored in parallel with Phase 2)

## Tasks

- [x] Create `.github/skills/run-tests/SKILL.md` with correct YAML frontmatter (`name: run-tests`, `description`)
- [x] Document prerequisites: Node.js 18+, npm
- [x] Document one-time setup:
  ```bash
  cd src/AutoTests
  npm install
  npx playwright install
  ```
- [x] Document running against the **local API**:
  ```bash
  BASE_URL=http://localhost:5000/api/ npx playwright test
  ```
  (Windows PowerShell: `$env:BASE_URL="http://localhost:5000/api/"; npx playwright test`)
- [x] Document running against the **remote Azure API** (default, no env var needed):
  ```bash
  npx playwright test
  ```
- [x] Document single-browser execution: `--project=chromium | firefox | webkit`
- [x] Document viewing the HTML report: `npx playwright show-report`
- [x] Document test structure overview: `ApiClient` singleton, DTO factory methods, `expect.soft()` assertions
- [x] Reference `run-api` skill for starting the local API
- [ ] Verify: run `BASE_URL=http://localhost:5000/api/ npx playwright test --project=chromium` against a locally running API — all tests pass

## Acceptance Criteria

- Skill file exists at `.github/skills/run-tests/SKILL.md`
- YAML frontmatter is valid
- A developer can run tests against both local and remote API by following the skill
- Both PowerShell and bash env-var syntax are documented
