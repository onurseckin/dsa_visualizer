# Architecture

## Overview

DSA Visualizer is a local-first full-stack learning application. React 19,
TypeScript, Vite, TanStack Router, Tailwind, and the token-based component system
form the web client. The supported runtime packages that client behind Nginx and
adds a Bun API, persistent SQLite state, browser Pyodide, and a bounded CPython
runner.

The monorepo boundary is:

```text
web (Nginx + React) ──/api──► API (Bun + SQLite) ──runner network──► CPython
        │
        └──Web Worker──► Pyodide + NumPy
```

Only `web` publishes host port 5173. `api` is reachable from the web container
on the application network. `python-runner` is reachable only from the API over
the internal runner network. The Compose health checks gate service startup.

## Authoritative data flow

```text
TOPIC_CATALOG ──► TopicId + track + label ──┬──► item topicIds
                                            └──► curriculum placements

88 AlgorithmDefinitions ──► ALGORITHMS ──► DSA adapters ──► LEARNING_ITEMS (88)
                                                           │
                                                           ├──► directory/search
                                                           ├──► roadmap counts/drawers
                                                           ├──► workspace assessment
                                                           └──► eligible trivia deck

Curriculum placements ──► prerequisites + copy + geometry ──► DSA and retained ML-shell graph views
```

`src/curriculum/topics.ts` is the canonical topic catalog.
`src/algorithms/registry.ts` is the canonical DSA enrollment list.
`src/learning/registry.ts` is the canonical cross-track learning enrollment
list and builds the route lookup from the 88 adapted DSA definitions. Native ML
items are currently retired, so the ML learning-item model has no active
enrollment.

`src/curriculum/trees.ts` defines the shared placement contract. Tree-specific
data owns only presentation and prerequisite relationships. The ML graph retains
23 placements—15 required and 8 elective—as curriculum shells without active
native ML items.

## Boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| Topic catalog | ID, label, track | Item membership or graph coordinates |
| DSA algorithm | Canonical ID, `topicIds`, code, steps, examples, execution adapter data | Duplicated registry keys |
| Retired ML track | Topic/placement shells and future model contracts | Active native learning-item enrollment |
| Learning registry | Exactly 88 adapted DSA items | Aliases or a transitional/legacy registry |
| Curriculum placement | Prerequisites, family, copy, difficulty framing, coordinates | Counts, question lists, or copied item fields |
| Execution contract | Runtime, packages, invocation, limits, cases, expected outputs | Item identity or UI state |
| Trivia | Semantic puzzle generation and session records | An alternate code or progress catalog |

The design is strictly forward-looking: canonical IDs are kebab-case and there are
no legacy aliases, backwards-compatibility layers, or fallback category fields. Update
every in-repository reference when a canonical ID changes. Item↔topic bindings are equal
many-to-many relations; no consumer may interpret tuple position zero as a primary topic.
Problem descriptions and topic guides use clean React HTML markup, and visualizer tutorials
tell an intuitive visual story step-by-step, independent of source code line numbers.

## Workspace and assessment flow

The route `/workspace/$algorithmId` resolves from `LEARNING_ITEM_REGISTRY`.
Visualizer tutorials tell an intuitive visual story of algorithm progression step-by-step,
completely independent of source code line numbers. Trace, calculator, debugging, scenario,
and capstone items use their matching assessment renderer. When an assessment has an
executable playground, its selected authored case is passed to `generateSteps`; the resulting
snapshots, scalar narratives, variables, and auxiliary state are rendered as an
inspectable visual walkthrough. Input-evidence wrappers keep submitted input
and matching authored expected output separate from conceptual teaching frames.
All problem descriptions and topic guides use clean React HTML markup.

When an item has an execution contract, `CodeWorkspace` presents:

1. an immutable **Reference** tab bound to the authored visualization and
   explanation; and
2. an editable **Playground** tab initialized from starter code and persisted
   per canonical item ID.

Running a draft validates the shared execution contract, selects the browser or
server runtime, executes selected test cases, and returns status, values,
diagnostics, duration, and bounded `stdout`/`stderr`. Each run supersedes and
cancels an older run from the same workspace.

Open-ended submissions are persisted immediately with `pending` grading status.
The transparent self-review checks the authored rubric, calculates normalized
weighted points, records missed critical criteria, and replaces that same
attempt with a `graded` record. The first attempt establishes a 1/7/24-day
retrieval schedule; a submission made on or after a due date records completion.
An unresolved critical criterion can only be repaired through the dedicated
changed-context flow: it binds fresh evidence to a distinct authored execution
case, records a canonical repair variant, and clears the failure only after a
passing review. Ordinary pending attempts cannot be relabelled as repairs.

The automatic runtime policy chooses browser Pyodide only for a
browser-compatible spec. PyTorch and explicitly server-authored specs use the
CPython service. Browser infrastructure failures may fall back to CPython when
the contract is compatible; learner code failures do not trigger fallback.

## Visualizer authoring flow

`generateSteps` produces a sequence of `AlgorithmStep` values. New tutorials
use `createTutorialStep`, which records a scalar `narrative`, phase metadata,
and `codeLine: undefined`. The visualizer reads that narrative and does not use
the source-code line field to pace or highlight the lesson.

Each `PrimaryVisualSnapshot` selects one of the 16 canonical primitives. Its
optional `name` is the bare semantic identity. Arrays render it as an
assignment label (`name =`); every other non-composite primitive uses a bare
caption. A lone graph normally has no name. Legacy `title` and `planeTitle`
fields are read only for older content and are not migration inputs. A graph carries `directed: true` when
edge direction is instructional.

For multi-structure frames, `CompositeCanvasSnapshot.items` contains a stable
item `id`, a `primary`/`auxiliary`/`comparison` role, and a non-composite
snapshot. The composite is a CSS grid/flex partition of independently measured
SVG primitive surfaces, rather than one master SVG. It routes auxiliary state
and variables to one primary region, avoiding repeated HUDs. See
[TUTORIAL_GUIDE.md](../TUTORIAL_GUIDE.md) for the full authoring contract.

## Persistence

The API stores JSON-serialized key/value state in the `api_data` SQLite volume.
The client validates persisted records before using them and performs
best-effort writes. Server hydration fills only absent browser keys so a newer
local draft cannot be overwritten by a stale response. Application mounting is
gated on that initial hydration attempt, with a bounded timeout, so routed
defaults cannot race ahead of the SQLite snapshot.

The Vite adapter in `src/server` exposes the same `/api/db/*` shape for
frontend development and degrades safely when native SQLite is unavailable.
Reset endpoints are prefix-scoped. Trivia uses session records as its only
progress model; playground drafts are keyed by canonical learning-item ID.

## Python runner boundary

The API validates request structure, byte limits, case selection, packages, and
runtime before forwarding a server run. The runner executes each authored
request in a short-lived process group with bounded wall time, source/input
size, output/result size, case count, and concurrency.

The container runs as a non-root user with a read-only root filesystem, bounded
temporary filesystems, dropped Linux capabilities, no-new-privileges, process
and resource limits, and no published port. This is stability containment for
a local educational playground, not a security claim that arbitrary hostile
Python is perfectly sandboxed.

## Key runtime areas

- `src/routes/workspace.$algorithmId.tsx` selects the algorithm or assessment
  workspace from the learning registry.
- `src/learning` owns the cross-track item model, assessment metadata,
  difficulty profiles, registry, progress, and retired-ML model support.
- `src/playground` owns DSA execution adapters, runner selection, Pyodide
  worker/client behavior, server client behavior, and draft persistence.
- `src/ui/organisms/code-workspace` renders immutable reference code, the
  editable playground, test controls, and execution output.
- `src/components/knowledge-graph` renders authored placement graphs while
  deriving item cards and counts from the learning registry.
- `apps/api` owns HTTP validation, SQLite persistence, and runner proxying.
- `apps/python-runner` owns the CPython HTTP parent and per-run harness.
- `packages/execution-contracts` is the shared TypeScript protocol contract.
- `src/trivia` parses canonical reference code, applies semantic hints and
  changed-context retrieval, and persists validated session records.

## Verification

Use the repository's non-test quality commands while iterating. `bun run audit:catalog`
enforces 88 active DSA items, retired native ML content, retained ML placements,
executable Python assets, source metadata, and catalog uniqueness.

`bun run audit:visualizers` reports tutorial detachment from source code,
narrative/phase/scenario metadata, adjacent snapshot transitions, and primitive
usage. It is a health report for the ongoing migration, not a source-line
tutorial mechanism.

`bun run check` is the final quality gate: typecheck, format, lint, Intent,
Compose topology, catalog audit, and production build. Plans and implementation
work do not include unit, component, integration, or end-to-end tests.

## Codex workflow

Repository trust is granted from the user's Codex configuration, which then
permits a project-local configuration layer; this repository does not attempt
to grant itself trust or pin a model. Use a coordinator for cross-cutting
integration, focused workers for disjoint implementation areas, and a reviewer
for production behavior and contract validation. Select the model and reasoning effort per task
rather than encoding a repository-wide default.
