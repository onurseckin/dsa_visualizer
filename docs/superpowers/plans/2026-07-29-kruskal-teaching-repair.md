# Kruskal Teaching Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking. The repository intentionally
> has no automated tests; do not create or run them.

**Goal:** Rebuild Kruskal's visual tutorial so every beginner-facing explanation
has matching canvas evidence and every input scenario receives a truthful,
purposeful walkthrough.

**Architecture:** Add semantic graph-edge decision states while preserving
legacy edge flags. Re-author Kruskal with graph, DSU, and box-array snapshot
factories, remove its HUD, and codify the evidence/necessity/scenario rules in
the canonical guide.

**Tech Stack:** React 19, TypeScript 7, native SVG primitives, Bun, Oxlint,
Oxfmt.

---

### Task 1: Semantic graph-edge decisions

**Files:**

- Modify: `src/types/dsa.ts`
- Modify: `src/components/primitives/graph/GraphEdge.tsx`
- Modify: `src/components/primitives/graph/layoutEngine.ts`

- [ ] Add `GraphEdgeDecisionState = "default" | "candidate" | "selected" |
  "rejected"` and optional `state` to `GraphEdgeItem`.
- [ ] In `GraphEdge`, make semantic state take precedence over legacy flags:
  candidate uses the compare token, selected uses the path token, rejected uses
  the danger token with a dashed, subdued line, and default preserves the
  existing unexplored rendering.
- [ ] Keep `isTraversed` and `isPath` behavior unchanged when `state` is absent.
- [ ] Derive honest `Candidate`, `Selected`, `Rejected`, and `Unexplored`
  legend entries from semantic states while preserving legacy legend entries.
- [ ] Run `bun run typecheck`, formatter/linter checks on changed files, and
  `git diff --check`.

### Task 2: Re-author Kruskal's tutorial

**Files:**

- Modify: `src/algorithms/graph_spanning_trees/kruskalMst/stepGenerator.ts`
- Modify: `src/algorithms/graph_spanning_trees/kruskalMst/definition.ts`
- Optionally create:
  `src/algorithms/graph_spanning_trees/kruskalMst/tutorialVisuals.ts`

- [ ] Replace stage-number highlight cycling with twelve explicit,
  input-independent conceptual frames whose snapshots visibly demonstrate each
  caption.
- [ ] Use graph-only frames for topology/cycle/minimum/completion ideas,
  graph-plus-box-array only for edge ordering, and graph-plus-DSU only for
  component decisions and union consequences.
- [ ] Remove all Kruskal `auxiliaryState` and `variables` HUD data.
- [ ] Build DSU snapshots from real parent/rank state, with synchronized
  component groups and active endpoint/root IDs.
- [ ] Build a box-mode `edge order` array for the sorted candidates and point
  to the next candidate where ordering is discussed.
- [ ] Generate inspect/consequence frame pairs. Persist selected and rejected
  graph edge states.
- [ ] Stop connected runs at `|V| - 1`; exhaust edges for disconnected runs.
  Give empty, singleton, connected, and forest outcomes distinct beginner
  explanations.
- [ ] Implement path compression in the generator's `find` helper or remove any
  generator narrative that claims it.
- [ ] Adjust the adversarial authored example so at least one low-weight
  cycle-closing edge is visibly rejected before the graph becomes connected;
  keep the disconnected example as the boundary forest scenario.
- [ ] Run `bun run audit:visualizers`, `bun run typecheck`, changed-file
  formatter/linter checks, and `git diff --check`.

### Task 3: Strengthen the canonical teaching contract

**Files:**

- Modify: `TUTORIAL_GUIDE.md`
- Modify: `AGENTS.md`

- [ ] Require a self-contained beginner learning sequence: goal, prerequisite
  structures, invariant/decision, consequences, completion, then complexity.
- [ ] Add the narrative-canvas evidence rule and the one-teachable-claim rule.
- [ ] Add the decision inspect/consequence rule and persistent rejection rule.
- [ ] Add state-ownership and primitive-necessity rules.
- [ ] Document Array `bar` versus `box` semantics for numeric magnitude versus
  categorical identifiers.
- [ ] Add the no-occluding-HUD rule and require reserved space for essential
  overlays.
- [ ] Require scenario-specific divergence, rationale, and completion behavior.
- [ ] Add an implementation-truth rule and a manual beginner-frame review
  checklist.
- [ ] Run `git diff --check`.

### Task 4: Visual and repository verification

**Files:**

- Inspect only; fix the owning production file if a defect is found.

- [ ] Run `bun run dev`, review Kruskal at the real workspace canvas size, and
  stop the server after inspection.
- [ ] Inspect representative intro frames and every default walkthrough frame.
- [ ] Select and inspect standard, boundary, and adversarial example cards.
- [ ] Confirm no HUD overlaps the graph, DSU geometry is legible, edge-order
  cells are compact, rejected edges remain visible, and each caption is
  supported by its frame.
- [ ] Run `bun run audit:visualizers` and confirm Kruskal is contract-ready.
- [ ] Run `bun run check` and read the complete result.
- [ ] Obtain final production/spec review from a fresh Terra reviewer and
  resolve every Critical or Important issue.
