# Visualizer Tutorial Guide

This is the canonical production contract for authored algorithm tutorials. A
tutorial teaches the state transition itself; it does not trace source code.

## Tutorial shape

Author new steps with `createTutorialStep` from
`src/learning/authoring/tutorialSteps.ts`. It owns the scalar narrative,
tutorial metadata, empty-state defaults, and `codeLine: undefined`. Do not
author a new `{ what, why }` explanation split: it remains only as compatibility
transport for older consumers.

Every tutorial must stand on its own for a learner meeting the problem and its
data structure for the first time. Define the problem and its terms, build the
intuition, contrast the naive bottleneck when it is relevant, introduce the
mechanism, walk the decisions it makes, and explain both completion and
complexity. The examples must also teach why boundary and adversarial inputs
behave differently, so the learner does not need a separate reference.

Every tutorial has an inputless intro and an input-aware walkthrough. Its
examples form the third learning phase:

1. `intro` — 8–12 inputless frames that establish the mental model and the
   bottleneck before a concrete input appears.
2. `walkthrough` — a visible, input-aware progression for the representative
   default input.
3. scenario matrix — `examples[].scenario` identifies the `standard`,
   `boundary`, and `adversarial` authored examples. Selecting any example runs
   the same input-independent intro followed by its input-aware walkthrough.

Each caption is one conversational paragraph. It must not contain line breaks,
bullets/checklists, or references to source-code line numbers. Teach one
claim or decision per frame. Every operative noun, state, and claim in that
paragraph must be visibly identifiable in that frame's `primarySnapshot`: do
not narrate a sorted order, roots, a cycle, a rejected edge, or a changed
accumulator unless it is on the canvas. When a decision has a cause and a
consequence, prefer an inspect frame followed by a consequence frame.

The walkthrough has a continuity contract. Once a concrete structure becomes
part of the evolving algorithm state, keep it visible in every later relevant
walkthrough frame until the algorithm retires or completes it. Preserve its
latest visible state and update it in place when it changes: an edge order,
frontier, DSU, accumulator, DP table, or visited set must not disappear merely
because the current paragraph focuses on another structure. The narrative can
focus on one decision while the canvas retains the causal state that makes the
next decision understandable. One-frame conceptual aids may disappear after
their lesson, but a persistent model may not. Continuity beats local
minimalism; use a compact, measured composite layout rather than hiding a
stateful primitive.

Each adjacent step must make an intentional, evidence-bearing visual change:
the exact evidence the learner is asked to inspect must change. Cosmetic
cycling, arbitrary highlights, and filler frames with an unchanged or
unrelated `primarySnapshot` are prohibited.

## Canonical authoring example

This example uses the current types exactly: a semantic snapshot `name`, an
unnamed graph, and a composite item `id`/`role` that controls placement rather
than its visual identity.

```ts
import { createTutorialStep } from "../../learning/authoring/tutorialSteps";

const step = createTutorialStep({
  stepIndex: 12,
  phase: "walkthrough",
  narrative:
    "The frontier now contains B and C, so we expand B first because its known distance is smaller.",
  primarySnapshot: {
    kind: "composite",
    layout: "horizontal",
    heading: "Shortest-path frontier",
    items: [
      {
        id: "network",
        role: "primary",
        snapshot: {
          kind: "graph",
          directed: true,
          nodes: [
            { id: "A", label: "A", state: "visited" },
            { id: "B", label: "B", state: "active" },
          ],
          edges: [{ from: "A", to: "B", weight: 3, isTraversed: true }],
        },
      },
      {
        id: "frontier",
        role: "auxiliary",
        snapshot: {
          kind: "heap",
          name: "frontier",
          heapType: "min",
          heap: [{ id: "B", val: 3, state: "active" }],
        },
      },
    ],
  },
});
```

`phase: "scenario"` is optional. Use it only for an explicitly
scenario-specific authored frame; it then requires a matching `scenario` kind.
Current migrations normally put the scenario kind on `examples[].scenario` and
use `intro` plus `walkthrough` steps for every selected example.

## Primitive selection and names

Use the smallest canonical primitive that expresses the learner's mental model,
and only when that primitive teaches or proves something in the current step:
Array, Matrix, Graph, Tree, Grid, Vector, Quantization, Interval, Heap, DSU,
HashTable, StateSpace, CallStack, Bitmask, AttentionMap, or Trie. Use a
`CompositeCanvasSnapshot` only when multiple structures must be understood at
the same time.

`snapshot.name` is a short, bare semantic identity such as `nums`, `prefix`,
or `frontier`. Renderers choose the notation; authors must not include `=` in
the name. The policy is deliberately structural:

| Primitive family | Rendered form | Authoring guidance |
| --- | --- | --- |
| Array | `name =` | Name it when it represents an input, variable, or auxiliary array. |
| Every other non-composite primitive | `name` | Use a bare caption only when it disambiguates structures. |

A lone graph normally has no `name`: its topology is already the subject of
the frame. Name a graph only when two graphs are compared, or when it is an
auxiliary structure whose role would otherwise be unclear. The same restraint
applies to every other caption-style primitive.

`title` and `planeTitle` are deprecated legacy fields. Do not author them in a
migration; use `name` instead. Set `directed: true` on a graph snapshot when
arrow direction carries meaning.

## Primitive selection map

Use this compact field map to select and populate one of the 16 primitives.
All fields below are snapshot fields; add `name` only when the label policy
above calls for a useful semantic identity.

| Primitive | Use when teaching | Required primary fields | Key optional fields |
| --- | --- | --- | --- |
| Array | Ordered values, pointers, swaps, scans | `elements` | `mode` |
| Grid | 2D cells, paths, walls, dynamic programming | `grid` | Cell fields carry start/end/wall/path/distance state |
| Graph | Nodes and relationships | `nodes`, `edges` | `directed` |
| Tree | Rooted binary structure | `nodes` | `rootId` |
| Vector | Geometric or embedding directions | `vectors` | `origin`, `dimensions` |
| Matrix | Indexed tabular values | `rows`, `cols`, `cells` | `rowHeaders`, `colHeaders` |
| Quantization | Numeric conversion and bits | `bits` | `originalValue`, `quantizedValue`, `scale`, `zeroPoint` |
| Interval | Ranges and sweep events | `intervals` | `sweepLine`, `eventPoints`, `axis` |
| Heap | Priority ordering and heap mutation | `heap` | `heapType`, `swapPair` |
| DSU | Parent links and component merging | `nodes` | `activeIds` |
| HashTable | Buckets, collisions, probing | `buckets` | `hashFunction`, `probingSequence` |
| StateSpace | Search states and transitions | `nodes` | `edges`, `activeNodeId`, `path` |
| CallStack | Nested invocation frames | `frames` | `activeFrameIndex` |
| Bitmask | Bits and a bitwise operation | `bits` | `value`, `label`, `bitWidth`, `operation` |
| AttentionMap | Query-to-key weights | `queryTokens`, `keyTokens`, `weights` | `activeQueryIndex`, `activeKeyIndex` |
| Trie | Prefix nodes and edges | `nodes` | `edges`, `rootId`, `activePath`, `searchWord` |

`CompositeCanvasSnapshot` is a layout container, not a seventeenth primitive.
Use it only to show a relationship between two or more entries in this table.

Use Array `bar` mode only when its numeric magnitudes are the lesson. Use
`box` mode for categorical or symbolic values such as IDs, parents, edge
labels, ordering, and booleans. When a specialized primitive exists, use it
instead of encoding its data in a generic array; for example, a DSU owns
parents, roots, ranks, and components.

## Information ownership and necessity

Put a fact in exactly one narrowest place that lets the learner see it. Do not
add a primitive, helper, or HUD merely to fill space, and do not repeat a fact
across a graph, another primitive, and a HUD. The canvas states the transition
first; the HUD is only for small secondary facts that cannot already be read
from the primitive.

| Information | Owner | Put it there when |
| --- | --- | --- |
| Teaching reason and transition | `narrative` | Explaining what changed and why it matters in one paragraph. |
| Main visible model | `primarySnapshot` | Choosing the primitive and its data for the state the learner should inspect. |
| Short semantic identity | `snapshot.name` | A variable/structure needs a concise label; keep it bare and omit a lone graph name. |
| Local visible transition | Element, node, cell `state` and array `pointers` | Highlighting, visiting, comparing, swapping, queueing, paths, or pointer positions. |
| Region identity and intent | Composite item `id` and `role` | Laying out a primary, auxiliary, or comparison region; never use these as a visual label. |
| Whole-frame relationship | Composite `heading` | A short title that explains why the regions appear together. |
| Small current facts | `variables` | Values such as the current index, bound, or accumulator when they are not already legible on the canvas. |
| Secondary collections | `auxiliaryState` | A queue, stack, visited set, map, or distance table not already represented by a primitive. |

For graph-based decisions, the graph owns topology and semantic edge decision
state; the DSU owns roots, parents, ranks, and components; an array owns the
ordered candidates. Keep accepted, rejected, visited, and pending decision
history visible whenever later decisions depend on it. If an ordered candidate
array will advance later, it remains on the canvas after sorting, with its
pointer and final state updated in place. Prefer a semantic decision state over
a generic traversal flag when the primitive supports one.

## Composites and auxiliary state

Each composite item has:

- `id`, a stable layout key;
- `role`, one of `primary`, `auxiliary`, or `comparison`; and
- a non-composite `snapshot`, which owns the primitive's visual identity and
  optional `name`.

`layout`, `columns`, `rows`, spans, and ratios arrange the items. The runtime is
a CSS grid/flex partition containing independently measured SVG primitives; it
is not a master SVG with translated `<g>` sub-viewports. The composite routes
the single auxiliary-state/variables HUD to the first `primary` item (or the
first item if none is primary), so do not duplicate an identical HUD in every
region. A native in-canvas HUD is not automatically safe: author one only when
the primary primitive has a reserved, verified readable region at actual
rendered sizes. Never place it over nodes, edges, labels, cells, or the
evidence for the current interaction. Omit it, or move the fact into the
appropriate primitive/composite, when no such region exists.

Use `layout: "persistent"` for a stable multi-structure walkthrough: it is a
12-column, 3-row measured grid, normally with the primary graph at `7 × 2`, a
compact DSU at `5 × 2`, and a compact full-width array strip below. Set
`density: "compact"` only when a persistent Array or DSU must share that
canvas; compact arrays retain their `name =`, values, and current pointer, and
compact DSUs retain `id`, `parent`, and rank. It is a continuity tool, not a
way to squeeze unrelated decoration into a frame.

## Canvas law

Each primitive owns a measured SVG surface and follows Canvas Law:

```text
viewBox = boxViewBox(measuredBox)
width="100%" height="100%"
```

Use the shared geometry and primitive components. Do not restore fixed SVG
view boxes or aspect-ratio wrappers that create dead bands. Auxiliary state such
as queues, stacks, visited sets, maps, and current variables belongs in the
native SVG HUD, never a floating HTML side panel.

For weighted graphs, the numeric edge label is the authoritative cost. Do not
use a perfectly symmetric node layout by habit, and do not let two weight
badges overlap at a crossing or shared midpoint. Use the graph primitive's
weighted layout mode when an authored layout would make labels collide: it
uses a deterministic irregular arrangement and collision-aware label offsets.
Geometry may use weight as a gentle layout cue for readability, but a drawn
edge's length is never a substitute for its visible numeric weight unless the
tutorial explicitly teaches that encoding.

## Scenario and implementation truth

The intro remains input-independent. The walkthrough must instead use the
selected input and explicitly explain the behavior that input causes. Standard,
boundary, and adversarial examples must exercise distinct behavior, not merely
different labels or values. The final frame and its prose must distinguish an
early completion, exhausted input, and any partial or forest result. Never
describe an unprocessed candidate as rejected.

Keep the narrative, snapshot, generator state, executable/reference algorithm,
output examples, and complexity claims mutually true. For example, only teach
path compression if the visual generator and implementation perform it, and
only teach early termination if the walkthrough actually stops there.

## Problem Description vs Solution Ownership

`AlgorithmDefinition.description` owns the **Problem Statement ONLY**. It must never leak the solution or algorithm mechanics, nor duplicate the dedicated constraints section:

| Content Area | Field Owner | Allowed Content | Prohibited Content |
| --- | --- | --- | --- |
| **Problem Statement** | `description` | HTML markup detailing: Problem Statement, Input Parameters, Output Format ONLY (`algorithm.constraints` powers the dedicated Constraints card UI). | NO solution spoilers, NO algorithm mechanics/steps, NO time/space complexity analysis, NO intuition summaries, NO redundant constraints section in HTML string. |
| **Solution & Deep-Dive Guide** | `topicGuide` | HTML overview and sections explaining: Mental model, intuition, step-by-step algorithm mechanism, naive vs optimal trade-offs, pitfalls, and generalizations. | Raw problem statements or duplicated basic constraint lists. |
| **Complexity Analysis** | `complexityAnalysis` | Detailed natural language explanation of time (best/average/worst) and space bounds. | Short unexplained formulas. |

Ensure a clean boundary: when a learner reads `description`, they see only *what* problem is being solved, *what inputs* are given, and *what output* is expected. Constraints are powered exclusively by `algorithm.constraints`. How the algorithm operates and why its time/space complexity holds belong strictly in `topicGuide`, `complexityAnalysis`, and the visualizer tutorial steps.

## Migration checklist

- [ ] Read the existing generator, its examples, and the relevant primitive.
- [ ] Replace new step construction with `createTutorialStep` and give every
  step a scalar `narrative` plus a phase.
- [ ] Keep every new step detached with `codeLine: undefined`; never use a
  source line as tutorial pacing.
- [ ] Add 8–12 inputless intro frames, then the concrete walkthrough, and
  author `standard`, `boundary`, and `adversarial` `examples[].scenario`
  metadata. Use `phase: "scenario"` only for a genuinely scenario-specific
  frame.
- [ ] Teach a true beginner the problem, terms, intuition, relevant naive
  bottleneck, mechanism, decisions, completion, complexity, and the distinct
  standard/boundary/adversarial behavior.
- [ ] Check the same-frame evidence rule: read each paragraph, then look only
  at its canvas and locate every operative fact it names. Split a decision into
  inspect and consequence frames when that makes the cause visible.
- [ ] Ensure every adjacent frame changes the evidence named by its paragraph;
  remove cosmetic or unrelated highlight cycles.
- [ ] Identify every persistent walkthrough structure before authoring the
  steps; once introduced, keep it visible with its latest state until it is
  retired or the walkthrough completes. Do not confuse focused narration with
  permission to remove causal state.
- [ ] Choose only necessary primitives, assign each fact one owner, use `box`
  arrays for symbolic/categorical values, and choose a specialized primitive
  over a generic array when one exists.
- [ ] Give arrays bare variable names, leave a lone graph unnamed, and add
  bare captions to other primitives only to disambiguate.
- [ ] Give every composite item a unique `id` and an intentional role; keep
  `name` on the snapshot, not on the layout item.
- [ ] Keep decision history visible when later reasoning depends on it; never
  label an unprocessed item as rejected.
- [ ] Make the selected scenario's walkthrough, termination prose, output, and
  executable/reference behavior agree, including any claimed optimization.
- [ ] Inspect the default and all three scenarios at real workspace size for
  Canvas Law, collisions, clipping, stretching, and HUD occlusion. Confirm
  that removing any displayed primitive would remove necessary evidence, while
  retaining every stateful structure needed to understand the following step.
- [ ] For every weighted graph, inspect every edge label at real workspace size:
  labels must not collide with other labels, nodes, or the current decision
  evidence, and the layout must not accidentally imply that geometric length is
  the sole definition of weight.

## Verification

Do not create or maintain automated tests for this project. For a tutorial or
primitive change, run the relevant non-test checks:

```bash
bun run typecheck
bun run format:check
bun run lint
bun run audit:visualizers
bun run audit:catalog
bun run build
```

Before handoff, perform the manual beginner review for every step: read its
paragraph, look only at the canvas, and confirm that every referenced fact is
locatable. Repeat it for the default input and all three scenarios at real
workspace size.
