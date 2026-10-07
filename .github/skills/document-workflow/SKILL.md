---
name: document-workflow
description: 'Write or update the human-readable document of an AI workflow (a slash command, prompt or skill that runs a multi-step process): a legend, a step tree in a code block and a Mermaid flowchart showing who does what at each step, with the fixed emoji set 💻 main session, 🤖 agent, 🧩 skill, 🙋 user wait. Use when asked to document, describe, diagram or visualise a workflow or command, or to bring an existing workflow document back in sync with its workflow.'
argument-hint: '<workflow name or path>, e.g. implement-work-item or .ai/prompts/implement-work-item.md'
---

# document-workflow

Turns a workflow definition into a document a person can read in a minute: who acts at each step (the
main session, an agent on a fixed model, a skill, or the user), where the process waits, and where it
loops back. The format is fixed and lives in [references/format.md](references/format.md); the
Mermaid check is [scripts/preview-mermaid.cjs](scripts/preview-mermaid.cjs).

## The one rule: describe, never invent

Every line of the document must trace to a sentence of the workflow, to an agent's front matter, or to a
file that exists. In particular:

- Do not add a confirmation, a step, an agent, a skill or a model the workflow does not name. If the
  workflow performs an outward action without asking, the diagram shows no 🙋 there.
- An agent's model comes from its definition file (`model:` in the front matter), never from memory or
  from what the workflow text claims. `inherit` is written as "session model".
- When the workflow is ambiguous (a tool mentioned only in a general section, a step whose actor is
  unclear, a wait that may or may not exist), make the smallest faithful choice and **list it for the user
  at the end** — or ask before writing if the choice changes the shape of the diagram.
- A contradiction found in the workflow itself (e.g. it names a project or file that does not exist) is
  reported to the user, not silently fixed in the document.

## Steps

### 1. Find the workflow and everything it names

1. Resolve the argument to the workflow **body**. Look, in this order, for: the path as given;
   `.ai/prompts/<name>.md`; `.claude/commands/<name>.md`; `.github/prompts/<name>.prompt.md`;
   `.claude/skills/<name>/SKILL.md` or `.github/skills/<name>/SKILL.md`. A thin wrapper that points to a
   body (`@path`, "follow the workflow in …") is followed to that body; note every wrapper — the document
   names them.
2. Read the body in full; it is the source. List: the steps and their numbers, lanes and how a lane is
   chosen, every agent and skill invoked and at which step, every point that waits for the user, every
   "back to step N", every outward action (commit, push, PR, comment, post) and whether it needs a
   go-ahead, and any context/compaction rules.
3. For each agent, read only the front matter of its definition (`.claude/agents/<name>.md`, else
   `.github/agents/<name>.agent.md`) for `model:`. Confirm each skill exists under the skills folder.
   Built-in agents with no definition file (e.g. `Explore`) are written without a model.

### 2. Decide where the document goes

1. Search for an existing document of this workflow: grep the docs folders and the instruction hub
   (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) for the command name. If one exists,
   go to step 4 (**sync**).
2. Otherwise propose a location and **ask before creating it**: the folder that already holds workflow or
   AI-harness documents, else `docs/ai/<workflow-name>.md`. Write in the language of the repository's
   other documentation (English when unsure).

### 3. Write a new document

1. Follow [references/format.md](references/format.md) exactly: skeleton, legend, emoji set, step tree,
   Mermaid flowchart, wait list. If the repository already has a workflow document in this format, read it
   once as the worked example.
2. Build the step tree first, then derive the Mermaid flowchart from it, so both show the same steps,
   lanes, agents, skills, waits and returns.
3. Go to step 5.

### 4. Sync an existing document

1. Compare the document with the workflow body and the agents' current models, item by item: steps and
   their order, lanes, agents and models, skills, waits, returns, outward actions, file names.
2. Change only what differs, and keep wording the user wrote by hand where it is still true. If the
   document predates this format (no emoji legend, no Mermaid), convert it to the format.
3. Show the user the list of discrepancies found and what was changed.

### 5. Check the Mermaid diagram

1. Start the preview as a background task (it serves only `127.0.0.1` and reads the file on every request,
   so it needs no restart after an edit):

   ```bash
   node <skill folder>/scripts/preview-mermaid.cjs <document.md> 8765
   ```

2. Open `http://127.0.0.1:8765/` in the session's browser tool. Rendering is done when `document.title`
   is `rendered` (success) or starts with `error:` (the Mermaid message, per block). Fix the source and
   reload until it is `rendered`.
3. Look at the rendered diagram (a screenshot per screen of height): every step present, labels not cut,
   lanes and return edges where the tree has them. Then show it to the user in the browser pane.
4. Stop the background task. If Node, a browser tool or internet access (Mermaid loads from the jsDelivr
   CDN) is unavailable, say that the diagram was not rendered rather than claiming it is valid.

### 6. Hand over

1. Offer to add a one-line link to the document from the repository's instruction hub (`CLAUDE.md` or its
   equivalent), next to where workflows or skills are described. Add it only after a yes.
2. Report: the document path, whether it was created or synced, the Mermaid check result, and every
   judgement call from *The one rule*. Do not commit; committing follows the repository's own commit
   workflow, on the user's request.
