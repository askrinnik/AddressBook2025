---
name: verify-feature
description: >
  Verify a change to AddressBook2025 at both the API and the UI level: start
  the API and Blazor Web app, run the Playwright E2E API tests, and walk every
  acceptance criterion in a real browser. Use after implementing a feature or a
  defect fix, before asking the user to confirm the work.
---

# Verify a Change (API + UI)

> Local skill note: This skill is intentionally repository-specific for AddressBook2025 and does not map to a canonical upstream skill in github/awesome-copilot.

Verify at **both** the API and the UI level against a list of acceptance criteria. Use this after implementing a feature or a defect fix and before asking the user to confirm.

## Start the servers

Start each server as **your own background terminal** so you keep control of it (note each terminal id and stop them when done — do not hunt for stray `dotnet` processes):

| Server | How to start | URL |
|---|---|---|
| API | `run-api` skill (`dotnet run` in `src/AddressBook.Api`) | `http://localhost:5000` |
| Web | `dotnet run --project src/AddressBook.Web` | `http://localhost:5156` |

- Start the API with `dotnet run`, **not** by launching the built `.exe` from `bin/`, so the `Development` environment and local DB credentials load.
- The Web app is Blazor WASM and calls the API at `http://localhost:5000/api/`, so the API must be running alongside it for the UI to work.

## API-level verification

- Run the Playwright API suite with the `run-tests` skill (`npm test` in `src/ApiTests`, default `BASE_URL=http://localhost:5000/api/`).
- All tests must pass. Add cases for the new/changed behaviour if they are missing; for a defect fix, add a regression test that fails before the fix and passes after.

## UI-level verification

- If a UI E2E suite exists in `src/UiTests`, run it and let it drive the acceptance walk. Otherwise walk **every** acceptance criterion manually in a real browser against `http://localhost:5156` using the Playwright browser tools, capturing a screenshot per item.
- Check the **browser console and network requests** for errors even when the happy path looks right.
- Exercise the obvious negatives: validation on empty/invalid input, cancel, and a page reload / navigate-away to confirm state persists as intended.

## Loop and cleanup

- If an acceptance item or a test fails, keep iterating on the implementation (adjust the plan if the approach has to change), then re-verify the **whole** list — not just the item that failed.
- **Stop the API and Web background terminals before any rebuild** — a running instance locks its `.exe` in `bin/` and the build's copy step will fail.

## Report

Present the acceptance list as a checked table (item → how it was verified → result). Report anything not covered or left out, explicitly, then ask the user to confirm the work is acceptable.
