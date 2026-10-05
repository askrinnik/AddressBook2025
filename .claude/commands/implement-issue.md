---
description: Take a GitHub issue for AddressBook2025 end-to-end — bug, feature or test-authoring lane chosen by its labels — with a plan-review checkpoint and a result-verification checkpoint.
argument-hint: "<issue number> [optional: 'stay on current branch']"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion, Skill, mcp__playwright__browser_navigate, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_wait_for, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_find, mcp__playwright__browser_close
---

Take the GitHub issue `$ARGUMENTS` end to end — a bug, a feature or a test-authoring task: pick the lane, plan, get plan approval, implement, verify, get result approval, record the result comment, and offer to ship it as a pull request. If `$ARGUMENTS` contains no issue number, ask me for it before doing anything else. If `$ARGUMENTS` asks to stay on the current branch, skip the switch to `main` in step 0.

Follow the full end-to-end workflow defined in @.ai/prompts/implement-issue.md, using the issue number above.
