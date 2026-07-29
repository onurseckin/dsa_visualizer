# Kruskal Teaching Repair Design

## Goal

Make Kruskal's tutorial self-contained for a beginner and ensure every narrated
claim is directly visible in the same canvas frame. Repair the current HUD
collision and stretched symbolic-array presentation without changing Prefix
Sum's completed tutorial.

## Root causes

The stretched `parent` display is Kruskal-specific misuse of the Array
primitive. The snapshot omits `mode`, so string parent identifiers enter bar
mode, where nonnumeric values become equal-height bars. Parent relationships
belong in the DSU primitive.

The graph HUD collision is a shared limitation exposed by unnecessary Kruskal
state. Graph layout consumes the full SVG box while the HUD paints over that
same box. Kruskal's accepted count and weight are already visible from selected
edges and can be stated in the narrative, so this tutorial must not render the
HUD.

The intro mismatch is an authoring failure. Its snapshots rotate highlights
according to the step number rather than constructing visible evidence for the
caption.

## Chosen architecture

Kruskal uses three visual responsibilities:

- Graph: topology, weights, current candidate, selected edges, and rejected
  cycle-closing edges.
- DSU: components, parent links, representatives, rank, and the effect of
  union.
- Box-mode Array: the sorted edge order, only while order is the teaching
  subject.

Graph edges gain an optional semantic decision state: `candidate`, `selected`,
or `rejected`. Existing `isTraversed` and `isPath` fields remain readable for
legacy algorithms.

The inputless intro contains twelve purposeful frames. It teaches the network
goal, spanning, cycles, minimum cost, sorted inspection, singleton components,
the find decision, accepting and unioning different components, rejecting a
cycle within one component, and the connected/disconnected completion rules.
The conceptual snapshots are identical for every input.

The walkthrough is generated from the selected input. It first shows the input,
then sorted edge order, then singleton DSU state. Each edge receives an inspect
frame followed by an accept or reject consequence frame. Connected inputs stop
at `|V| - 1` accepted edges. Disconnected inputs exhaust the candidates and end
with an explicitly explained minimum spanning forest.

## Authoring contract changes

The tutorial guide will require:

- complete beginner context before jargon;
- one teachable claim per frame;
- visible evidence for every operative claim in the caption;
- inspect/consequence pairs for decisions;
- primitives chosen by the current teaching responsibility;
- box mode for identifiers and categorical array values;
- no decorative or redundant primitives, HUDs, labels, or state;
- no HUD over essential visual content unless the primitive reserves space;
- scenario-specific divergence and completion explanations; and
- implementation-truth alignment.

## Verification

No automated tests are created or run. Verification uses:

- `bun run audit:visualizers`
- `bun run typecheck`
- `bun run format:check`
- `bun run lint`
- `bun run audit:catalog`
- `bun run build`
- direct browser review of the intro, default input, and all three authored
  scenarios at the actual workspace canvas size.

