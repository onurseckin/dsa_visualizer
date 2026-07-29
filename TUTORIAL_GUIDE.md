# Visualizer Tutorial Guide

This is the canonical production contract for authored algorithm tutorials. A
tutorial teaches the state transition itself; it does not trace source code.

## Tutorial shape

Author new steps with `createTutorialStep` from
`src/learning/authoring/tutorialSteps.ts`. It owns the scalar narrative,
tutorial metadata, empty-state defaults, and `codeLine: undefined`. Do not
author a new `{ what, why }` explanation split: it remains only as compatibility
transport for older consumers.

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
bullets/checklists, or references to source-code line numbers. Each adjacent
step must make an intentional visual change; do not add filler frames with an
unchanged `primarySnapshot`.

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
  auxiliaryState: { visited: ["A"] },
  variables: { current: "B" },
});
```

`phase: "scenario"` is optional. Use it only for an explicitly
scenario-specific authored frame; it then requires a matching `scenario` kind.
Current migrations normally put the scenario kind on `examples[].scenario` and
use `intro` plus `walkthrough` steps for every selected example.

## Primitive selection and names

Use the smallest canonical primitive that expresses the learner's mental model:
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

## Information ownership

Put a fact in the narrowest place that lets the learner see it. The canvas
states the transition first; the HUD is only for secondary facts that cannot
already be read from the primitive.

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
region.

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
- [ ] Choose one primitive per mental model; use a composite only when the
  relationship between structures matters.
- [ ] Give arrays bare variable names, leave a lone graph unnamed, and add
  bare captions to other primitives only to disambiguate.
- [ ] Give every composite item a unique `id` and an intentional role; keep
  `name` on the snapshot, not on the layout item.
- [ ] Verify visible state transitions and Canvas Law at the actual rendered
  sizes.

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
