# Plan: Issue #224 — Add MIT LICENSE file

> **Issue:** [#224](https://github.com/askrinnik/AddressBook2025/issues/224) — Add MIT LICENSE file
> **Lane:** Feature (documentation only) · **Complexity:** S

## Requirement

The repository has no license file, so the code is "all rights reserved" by default. The owner chose the MIT License. The README (#225) links to this file from its License badge and section.

## Acceptance checklist

- [x] `LICENSE` exists at the repository root with the standard MIT License text
- [x] The copyright line names the year and the copyright holder (Alexander Skrinnik)
- [x] GitHub detects the license as MIT (repository sidebar shows "MIT license")

## Affected files

- `LICENSE` (new)

## Approach

Copy the canonical MIT text (as published by the Open Source Initiative and used by GitHub's license picker) without edits, so GitHub's license detection (licensee) recognises it. Copyright line: `Copyright (c) 2025 Alexander Skrinnik` — the project started in 2025 (`AddressBook2025`).

## Tests

None: no code or API behaviour changes.

## Verification

- `git diff` shows only the new file with the canonical text.
- After the push, the GitHub repository page shows "MIT license" in the sidebar.

## Out of scope

- License headers in source files.
- README content (#225).

## Decisions

- Copyright year 2025 (start of the project) rather than a range up to the current year; MIT does not require updating the year.
