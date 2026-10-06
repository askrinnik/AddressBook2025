Take a list of small GitHub issues for AddressBook2025 one after another on **one branch**, each with the full `implement-issue` workflow and its own commit, then verify the whole branch once and ship it as **one pull request**. The batch runs without review stops: it halts only on a question it cannot settle itself, and it reports every debatable decision at the end.

The arguments are issue numbers in execution order (`/implement-issues 191 192 193`), plus optional flags:

- `--review-plans` — stop for plan review per issue, as `implement-issue` does.
- `--ship` — pre-authorise push, pull request, issue comments and acceptance ticks; without it each of them waits for my go-ahead.

No issue numbers → recommend a batch with the `next-issue` skill (ready issues in order) and ask which to take.

## Relation to `implement-issue`

For every issue run the workflow in [.ai/prompts/implement-issue.md](implement-issue.md) — lane, understanding, plan, implementation, build, verification — **with the differences below**. Everything not mentioned there applies unchanged: the delegation table, the instruction files, the comment rules, the documentation rules, the plan file `docs/tasks/issue-<n>-<slug>.md`. Do not copy the workflow here; when it changes, the batch inherits the change.

| `implement-issue` | In a batch |
|---|---|
| Step 0, per issue | Once, before the first issue |
| Branch created at the commit gate | Created at the first issue's commit, then reused (see *Branch*) |
| Steps 5–6, plan review stop | Save the plan and continue; stop only with `--review-plans` |
| Steps 8–9, `build-runner` with scope `full`, browser walk and security review per issue | `build-runner` with scope `suites` (the suites the change touches, without `ui-tests`) per issue; scope `full`, the browser walk and the security review once at the end |
| Step 10, result confirmation per issue | One confirmation for the whole batch |
| Steps 11–12, comment, commit, push, PR per issue | A commit per issue; one comment per issue, one push and one PR at the end |
| Step 13 | Once, at the end |

## 0. Preflight (once)

1. Working tree and branch as in `implement-issue` step 0: uncommitted changes stop the batch; clean tree → `git switch main` and `git pull --ff-only`.
2. Read every issue (`github-issue` skill): body, comments, labels, state. A closed issue stops the batch. Pick each lane from its labels.
3. **Dependencies.** A blocker that is open and **earlier in the list** counts as met; any other open blocker stops the batch and is named. If the list order contradicts a dependency, say so and stop.
4. **Size.** Batches are for small issues: at most 5, each of complexity S or M. A plan that comes back `L` stops the batch at that issue: report it, leave the finished commits, and suggest running that issue alone with `/implement-issue`.
5. Assign the issues to yourself when you have write access.

## Branch

Do not create the branch during preflight or planning; as in `implement-issue`, a branch comes into being only at a commit. Create it from the fresh `main` at the **first issue's commit**, together with that commit: `<first>-<last>-<short-slug>` (for example `191-193-web-error-handling`); a single issue would use `<n>-<slug>`. The slug names what the batch has in common. Later commits reuse the branch. Never commit on `main`.

## Per issue (in list order)

1. Run `implement-issue` steps 1–9 with the differences above. Plan with `issue-planner`, implement with the agent for the lane, review the added comments, keep the plan file in the working tree.
2. **Questions.** A question the issue, the code and sensible defaults do not settle stops the batch: ask me, then continue from the same issue. A choice that is yours to make but could be questioned (a UI presentation, a behaviour change beyond the acceptance list, a skipped refactor, a deviation from a convention) is **not** a stop: make it, record it in the plan's *Decisions* section and in a running list for the final report.
3. Call `build-runner` with scope `suites` and the suites the change touches (`web-tests`, `api-tests`; `ui-tests` waits for the final verification): the build, then those suites. Failures go back to implementation; do not commit red.
4. **Commit** — starting the batch authorises the commits, one per issue; the first one also creates the branch (see *Branch*). Make one `skill-runner` call with the `git-commit` skill (task commit, Case 1: `#<n> <exact issue title>`, a blank line, dash-prefixed actions): it creates or checks the branch, stages exactly the files you list, commits with `-F`, checks the message with `git log -1` and reports the short SHA. List only that issue's changes, including the plan file and the documentation the change updates.
5. The next issue starts from the committed state. Between issues give me the ready `/compact` command from `implement-issue` (focus: issue numbers and titles, acceptance lists, branch name, commits so far, the running decision list, changed files) once the conversation passes about 40 tool calls.

## Final verification (once, after the last commit)

Run on the branch as a whole, against `git diff main...HEAD`, in this order:

1. `build-runner` with scope `full`: the build, the bUnit tests, the Playwright API suite and the UI E2E suite; it returns the summary lines verbatim and the first failures.
2. **Browser walk** — hand every acceptance item of every issue to `issue-verifier` in `verify` mode (console and network checks, negatives). Include scenarios that need request interception for error paths.
3. **Security review** — `security-reviewer` on the branch diff when any issue touched API controllers, validators, data access, `Program.cs`, configuration/CORS, CI workflows, packages or .NET tools, the Web error pipeline, or rendering of server-provided text.
4. Fix what fails or what the review finds as **additional commits**, each under the `#<n>` of the issue it belongs to (Case 1), then re-run the affected checks.

## Report and confirmation

Present, in one message:

- a table: issue → commit → acceptance items → how verified → result;
- the verification results (build, suites, browser walk, UI E2E, security review);
- **the list of debatable decisions**, each with the alternative considered;
- anything not covered or left out.

Ask whether the result is acceptable. If not, iterate on the affected issue and re-verify.

## Ship

Without `--ship` each step below needs my go-ahead; with it, run them in order.

1. **Re-sync the base:** `git fetch origin`; if `origin/main` moved, `git pull --ff-only` onto the branch (rebase never) and re-run the final verification.
2. **Push** the branch (`git push -u origin <branch>`).
3. **One pull request** into `main` — one `skill-runner` call with the `open-pr` skill: title `#<a> #<b> #<c> <shared summary>`, a description that starts with one `Closes #<n>` line per issue, then what changed, the debatable decisions and how it was verified. Do not repeat the per-issue acceptance tables.
4. **Issue comments:** one comment per issue for its lane, each linking the PR — one `skill-runner` call per issue with the `github-issue` skill, which posts it. Post them after the PR is open so the link is real. Tick the verified `- [ ]` boxes in each issue body yourself, with one `Set-AcceptanceChecks.ps1` call per issue (`github-issue` skill, *Acceptance boxes*).
5. **CI:** check once with `gh pr checks <pr>`; never poll. Merging stays with me.
6. Run the `next-issue` skill with `-AssumeClosed` for every issue of the batch and end with the same short message as `implement-issue` step 13 (merge the PR, start a new session, the next `/implement-issue` or `/implement-issues`).

## Stops

The batch stops and reports, leaving all finished commits in place, on: an unsettled question, an open foreign blocker, a closed issue, a plan of complexity `L`, a reproduction that fails (Bug lane), a build or test failure that two fix attempts do not resolve, or a change that would need to touch an earlier issue's commit in a way that is not a plain follow-up. Never amend or rewrite a commit already made in the batch; fix forward. The one exception is the message check `skill-runner` runs on the commit it has just made (`git-commit` skill, *Procedure*).
