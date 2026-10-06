---
description: Take several small GitHub issues for AddressBook2025 one after another on one branch, each with the full implement-issue workflow and its own commit, then verify once and ship one pull request.
argument-hint: "<issue numbers in order> [--review-plans] [--ship]"
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent, AskUserQuestion, Skill, mcp__playwright__browser_navigate, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_wait_for, mcp__playwright__browser_fill_form, mcp__playwright__browser_press_key, mcp__playwright__browser_select_option, mcp__playwright__browser_find, mcp__playwright__browser_close
---

Take the GitHub issues `$ARGUMENTS` in the given order, each with the `implement-issue` workflow and its own commit on one shared branch, then verify the branch once and ship one pull request. If `$ARGUMENTS` contains no issue numbers, recommend a batch with the `next-issue` skill and ask which to take before doing anything else. `--review-plans` restores the plan-review stops; `--ship` pre-authorises push, pull request and issue comments.

Follow the full batch workflow defined in @.ai/prompts/implement-issues.md, using the arguments above.
