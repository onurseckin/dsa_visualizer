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

88 AlgorithmDefinitions ──► ALGORITHMS ──► DSA adapters ──┐
69 native ML items ────────────────────────────────────────┼──► LEARNING_ITEMS (157)
                                                          │
                                                          ├──► directory/search
                                                          ├──► roadmap counts/drawers
                                                          ├──► workspace assessment
                                                          └──► eligible trivia deck

Curriculum placements ──► prerequisites + copy + geometry ──► DSA/ML graph views
```

`src/curriculum/topics.ts` is the canonical topic catalog.
`src/algorithms/registry.ts` is the canonical DSA enrollment list.
`src/learning/registry.ts` is the canonical cross-track learning enrollment
list and builds the route lookup. The 69 ML items use the native learning-item
model; the 88 DSA definitions are adapted without duplicating their algorithm
facts.

`src/curriculum/trees.ts` defines the shared placement contract. Tree-specific
data owns only presentation and prerequisite relationships. The ML graph has 23
placements—15 required and 8 elective—with exactly three ML items per topic.

## Boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| Topic catalog | ID, label, track | Item membership or graph coordinates |
| DSA algorithm | Canonical ID, `topicIds`, code, steps, examples, execution adapter data | ML lifecycle scenarios or duplicated registry keys |
| ML learning item | Mode, objective, evidence, difficulty profile, sources, assessment, optional playground | A disguised LeetCode problem for a design decision |
| Learning registry | Exactly 88 adapted DSA items plus 69 native ML items | Aliases or a transitional/legacy registry |
| Curriculum placement | Prerequisites, family, copy, difficulty framing, coordinates | Counts, question lists, or copied item fields |
| Execution contract | Runtime, packages, invocation, limits, cases, expected outputs | Item identity or UI state |
| Trivia | Semantic puzzle generation and session records | An alternate code or progress catalog |

The design is a clean break: canonical IDs are kebab-case and there are no
legacy aliases or fallback category fields. Update every in-repository
reference when a canonical ID changes. Item↔topic bindings are equal
many-to-many relations; no consumer may interpret tuple position zero as a
primary topic.

The clean break retired 232 former ML IDs. The research ledger accounts for
each removed item, but it is not a runtime compatibility map.

## Workspace and assessment flow

The route `/workspace/$algorithmId` resolves from `LEARNING_ITEM_REGISTRY`.
Algorithm items retain the original visual step engine. Trace, calculator,
debugging, scenario, and capstone items use their matching assessment renderer.

When an item has an execution contract, `CodeWorkspace` presents:

1. an immutable **Reference** tab bound to the authored visualization and
   explanation; and
2. an editable **Playground** tab initialized from starter code and persisted
   per canonical item ID.

Running a draft validates the shared execution contract, selects the browser or
server runtime, executes selected test cases, and returns status, values,
diagnostics, duration, and bounded `stdout`/`stderr`. Each run supersedes and
cancels an older run from the same workspace.

The automatic runtime policy chooses browser Pyodide only for a
browser-compatible spec. PyTorch and explicitly server-authored specs use the
CPython service. Browser infrastructure failures may fall back to CPython when
the contract is compatible; learner code failures do not trigger fallback.

## Persistence

The API stores JSON-serialized key/value state in the `api_data` SQLite volume.
The client validates persisted records before using them and performs
best-effort writes. Server hydration fills only absent browser keys so a newer
local draft cannot be overwritten by a stale response.

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
  difficulty profiles, registry, progress, and authored ML content.
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

Use focused Vitest and Python tests while iterating. Catalog changes must
include the DSA catalog, learning-registry target, and graph-topology contracts.
`bun run audit:catalog` enforces 88 DSA + 69 ML = 157 active items, 23 ML
placements, exactly three ML items per topic, executable Python assets, source
metadata, uniqueness, and the 232-row retirement ledger.

`bun run check` is the final unit/static gate: typecheck, format, lint, Intent,
Compose topology, catalog audit, coverage, and production build. With the
Compose stack running, `bun run test:e2e:docker` verifies the catalog, roadmap,
all assessment renderers, draft persistence, real Pyodide, and real CPython API
execution. Coverage thresholds are regression floors and must never be lowered
to make a change pass.

## Codex workflow

Repository trust is granted from the user's Codex configuration, which then
permits a project-local configuration layer; this repository does not attempt
to grant itself trust or pin a model. Use a coordinator for cross-cutting
integration, focused workers for disjoint implementation areas, and a reviewer
for contract/test validation. Select the model and reasoning effort per task
rather than encoding a repository-wide default.
