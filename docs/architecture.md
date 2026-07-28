# Architecture

## Overview

DSA Visualizer is a client-side React application. Vite provides development and static
production builds; TanStack Router maps files in `src/routes` to pages. The app is built
with React 19, TypeScript 7, Vite 5, Tailwind 4, token-based CSS, and Bun tooling.

The only local service behavior is the Vite SQLite adapter in `src/server`. The client
hydrates browser storage from `/api/db/state` and writes state asynchronously. The
application remains usable if the adapter or native SQLite binding is unavailable.

## Authoritative data flow

```text
TOPIC_CATALOG ──► TopicId and labels ──┬──► filters, directory, and search
                                       ├──► AlgorithmDefinition.topicIds
                                       └──► curriculum placement references

Algorithm definitions ──► ALGORITHMS ──► ALGORITHM_REGISTRY ──┬──► workspace route
                                                               ├──► directory/drawer
                                                               ├──► roadmap counts/cards
                                                               └──► trivia code sources

Curriculum placements ──► roadmap topology, copy, and geometry ─► DSA/ML graph views
```

`src/curriculum/topics.ts` is the canonical topic catalog. `src/algorithms/registry.ts`
is the canonical enrollment list and builds the lookup registry. `src/curriculum/trees.ts`
defines the common placement contract; tree-specific data owns only presentation and
curriculum relationships.

## Boundaries

| Area | Owns | Must not own |
| --- | --- | --- |
| Topic catalog | ID, label, track | Algorithm membership or graph coordinates |
| Algorithm definition | Canonical ID, `topicIds`, code, steps, learning content | Aliases or duplicated registry keys |
| Registry | One enrollment for each definition and lookup | A second copy of algorithm metadata |
| Curriculum placement | Prerequisites, family, copy, difficulty framing, coordinates | Counts, question lists, or copied algorithm fields |
| Trivia | Drill state plus parsed code lines | An alternate algorithm catalog |

The design is deliberately a clean break: canonical IDs are kebab-case and there are no
legacy aliases or fallback category fields. Update all in-repository references when a
canonical ID changes. Problem↔topic bindings are equal many-to-many relations; no
consumer may interpret tuple position zero as a primary topic.

## Key runtime areas

- `src/routes/workspace.$algorithmId.tsx` resolves the selected definition and drives
  the step engine.
- `src/ui/organisms/ProblemList.tsx` and `QuickAccessDrawer.tsx` query definitions by
  their derived topics.
- `src/components/knowledge-graph` renders the authored placement graphs while deriving
  problem cards and counts from the registry.
- `src/trivia` parses each selected definition's code and persists session records.
  There is no standalone trivia config/progress mirror.
- `src/app` owns settings, layout storage, keyboard guards, and topic selectors.

## Verification

Use focused Vitest runs while iterating. Catalog changes must include the registry and
topology contract tests. `bun run check` is the final gate: typecheck, format check,
lint, Intent allowlist verification, coverage-enforced tests, and production build.
Coverage thresholds are regression floors; raise them when the measured suite improves
and never lower them to make a change pass. The verified 2026-07-28 baseline is 98.71%
statements/lines, 89.43% branches, and 97.75% functions, with every executable source
file receiving at least one hit in every applicable metric.

## Codex workflow

Repository trust is granted from the user's Codex configuration, which then permits a
project-local configuration layer; this repository does not attempt to grant itself
trust or pin a model. Use a coordinator for cross-cutting integration, focused workers
for disjoint implementation areas, and a reviewer for contract/test validation. Select
the model and reasoning effort per task rather than encoding a repository-wide default.
