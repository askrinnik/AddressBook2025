---
description: Implement a GitHub issue for AddressBook2025 end-to-end, with a plan-review checkpoint and an acceptance-verification checkpoint.
argument-hint: "<issue number>"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion, Skill, mcp__playwright__browser_navigate, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_wait_for, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_find, mcp__playwright__browser_close
---

Implement the GitHub issue `$ARGUMENTS` end to end: understand the requirement, plan, get plan approval, implement, verify against the acceptance criteria, get acceptance approval, record an implementation comment, and offer to ship it as a pull request. If `$ARGUMENTS` is empty, ask me for the issue number before doing anything else.

Follow the full end-to-end workflow defined in @.ai/prompts/implement-issue.md, using the issue number above.
