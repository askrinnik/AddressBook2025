# Phase 2: Create `run-api` Skill

> **Depends on:** nothing (can run in parallel with Phase 3)  
> **Blocks:** nothing

## Tasks

- [x] Create `.github/skills/run-api/SKILL.md` with correct YAML frontmatter (`name: run-api`, `description`)
- [x] Document prerequisites section: .NET 9+ SDK, SQL Server Express accessible at `localhost\SQLEXPRESS`
- [x] Document development credentials: `sa` / `MetraTech1` (from `appsettings.Development.json`) — **local dev only**
- [x] Document connection string overrides via `Database:Server`, `Database:User`, `Database:Password` config keys
- [x] Document the run command: `cd src/AddressBook.Api && dotnet run` → serves on `http://localhost:5000`
- [x] Document that DB migrations are applied automatically on startup (`ExecuteDatabaseMigration`)
- [x] Document verification steps: hit `http://localhost:5000/swagger/` or `GET http://localhost:5000/api/Contacts`
- [ ] Verify: start the API locally and confirm it responds to requests

## Acceptance Criteria

- Skill file exists at `.github/skills/run-api/SKILL.md`
- YAML frontmatter is valid
- A developer with no prior knowledge can start the API locally by following the skill
