---
description: Reproduce, plan, and fix a GitHub bug issue for AddressBook2025 end-to-end, with a plan-review checkpoint and a fix-verification checkpoint.
argument-hint: "<issue number>"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion, Skill, mcp__playwright__browser_navigate, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_wait_for, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_find, mcp__playwright__browser_close
---

Fix the GitHub bug issue `$ARGUMENTS` end to end: reproduce, plan, get plan approval, implement the fix, verify, get fix approval, record a resolution comment, and offer to ship it as a pull request. If `$ARGUMENTS` is empty, ask me for the issue number before doing anything else.

Follow the full end-to-end workflow defined in @.ai/prompts/fix-bug-issue.md, using the issue number above.
