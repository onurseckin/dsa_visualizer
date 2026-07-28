# Repository Health and Curriculum Registry Design

**Status:** Approved for implementation by owner direction  
**Date:** 2026-07-28  
**Scope:** Registry, topic taxonomy, curriculum trees, quality gates, coverage,
documentation, and Codex project context.

## 1. Goals

1. Make every problem definition enroll exactly once under one canonical ID.
2. Model problem-to-topic and topic-to-tree relationships as many-to-many data.
3. Remove aliases, legacy IDs, compatibility branches, duplicate counts, and
   tree-local problem copies.
4. Derive problem lists, search, trivia decks, workspace lookup, and curriculum
   node contents from the same catalog.
5. Restore typecheck, formatting, lint, tests, and build to green.
6. Establish honest per-file coverage for hand-written executable source and ratchet
   it to 100% statements, branches, functions, and lines.
7. Replace stale onboarding material with concise durable context that Codex and
   contributors can reliably load.

## 2. Non-goals

- Preserving old route IDs, aliases, localStorage payloads, or deprecated schemas.
- Inferring pedagogical relationships from directory names.
- Storing problem metadata inside curriculum tree nodes.
- Gaming coverage through broad exclusions or ignore comments.
- Rewriting historical planning documents as if they described the current app.

## 3. Canonical domain model

### 3.1 Problem

`AlgorithmDefinition` remains the authored source for problem behavior and learning
content:

- canonical kebab-case `id`;
- title, description, difficulty, examples, constraints, and sources;
- code, default input, and step generator;
- complexity and topic guide;
- optional trivia metadata;
- non-empty `topicIds`.

Every definition is enrolled exactly once in `ALGORITHMS`. `ALGORITHMS_BY_ID` is
derived from that list. Duplicate IDs fail during catalog construction and in tests.
There is no alias map.

### 3.2 Topic

`TOPIC_CATALOG` is the single authored taxonomy. A topic owns:

- stable `id`;
- label and short description;
- track (`dsa` or `ml-infra`);
- display order;
- optional family/presentation classification.

`TopicId`, labels, filter options, URL validation, and track classification derive
from this catalog. The former category aliases and duplicated label records disappear.

### 3.3 Many-to-many relations

Problems declare `topicIds: readonly [TopicId, ...TopicId[]]`. A problem may therefore
belong to any number of related topics, and each topic may contain any number of
problems.

A tree owns curriculum placements:

```ts
interface CurriculumPlacement {
  id: string;
  topicId: TopicId;
  familyId: string;
  prerequisites: readonly string[];
  x: number;
  y: number;
  difficulty: DifficultyLevel;
  description: string;
}
```

The same topic can be placed in multiple trees. Placement IDs and prerequisite edges
belong to a tree; topic identity does not. This produces:

```text
Problem ←many-to-many→ Topic ←many-to-many→ Curriculum placement → Tree
```

Tree node problem cards, counts, and difficulty summaries are derived by selecting
problems whose `topicIds` include the placement's `topicId`.

## 4. Catalog API

Consumers use selectors rather than reading object internals:

- `getAlgorithm(id)`
- `getAllAlgorithms()`
- `getAlgorithmsForTopic(topicId)`
- `getTopic(id)`
- `getAllTopics()`
- `isTopicId(value)`
- `getPlacementsForTree(treeId)`
- `getProblemsForPlacement(treeId, placementId)`

All returned collections have deterministic authored order. Missing IDs return
`undefined` at external boundaries and fail invariant tests when referenced by
authored catalog data.

## 5. Migration policy

This is a clean break:

- choose one kebab-case ID for every definition;
- remove camelCase and duplicate registry keys;
- update all in-repository references to canonical IDs;
- delete legacy category names and compatibility helpers;
- increment or replace persisted storage keys whose values contain problem/topic IDs;
- discard unreadable or old payloads instead of migrating them;
- redirect only genuinely unknown workspace paths to the default problem.

No source file may reintroduce aliases or silent fallback categories.

## 6. Tree and UI behavior

General and ML Infrastructure trees retain authored layout, family, prerequisite,
description, and difficulty information. They lose:

- `algorithmCount`;
- static `questions`;
- copied problem titles, descriptions, difficulties, and IDs;
- category-folder lookup fallbacks.

Problem List, Quick Access, Trivia, and workspace routes all consume the canonical
catalog. A problem associated with three topics appears under all three topic filters
and all placements for those topics.

## 7. Type model repair

The current diagnostics are treated as contract failures, not suppressed errors:

- introduce an explicit recursively displayable working-data value type;
- make auxiliary renderers format every permitted value deterministically;
- unify algorithm state vocabulary where semantics are shared;
- use visualizer-specific adapters only where a renderer has genuinely different
  states;
- narrow optional authored metadata in tests through reusable assertion helpers;
- fix missing imports and unused declarations directly;
- do not add `any`, broad `unknown` casts, or router casts.

## 8. Quality and coverage policy

The master gate remains:

```text
typecheck → format check → lint → tests → build
```

Coverage uses the Vitest/V8 version matching the installed Vitest version. It includes
all hand-written executable `src/**/*.ts` and `src/**/*.tsx` files with `all: true`
and per-file thresholds.

Excluded:

- generated route trees;
- declaration files;
- tests and test setup;
- explicitly classified static data-only modules.

Static algorithm and curriculum metadata is validated through catalog integrity tests,
not counted as executable branch coverage. Executable modules may not be excluded by
directory. The final threshold is 100% for statements, branches, functions, and lines
per file. Until the repository reaches that target, a checked-in ratchet records only
measured improvements and never permits regression.

## 9. Documentation and Codex context

The 151 KB root `AGENTS.md` is replaced by a concise operational contract under the
Codex project instruction budget. Durable knowledge is split by ownership:

- `README.md`: product and quick start;
- `AGENTS.md`: startup rules, commands, safety, and task routing;
- `docs/CONTEXT.md`: current architecture and source-of-truth map;
- `docs/CONTRIBUTING.md`: development workflow and gates;
- `docs/contracts/algorithm-content.md`: problem/topic/catalog contract;
- `docs/contracts/ui-workspace.md`: workspace, visualizer, persistence, and design
  invariants;
- `docs/generated/repository-inventory.{md,json}`: generated volatile facts;
- `docs/planning/README.md`: status index for historical plans.

Generated inventory is produced and checked by scripts. Authored docs avoid manual
algorithm, category, route, and test counts.

Project `.codex/config.toml` defines economical subagent defaults and bounded roles.
Repository truth remains in checked-in docs, not private Codex memory.

## 10. TanStack Intent

`package.json` explicitly allowlists the three dependency-provided skill sources:

- `@tanstack/router-core`;
- `@tanstack/router-plugin`;
- `@tanstack/virtual-file-routes`.

The repository provides an Intent check script. Temp-directory sandbox failures are
documented as execution-environment failures; they are not hidden through application
code changes.

## 11. Required invariants

Tests must prove:

1. one enrollment and one canonical ID per problem;
2. every problem has at least one valid topic;
3. every topic and placement ID is unique;
4. every placement references a valid topic;
5. every prerequisite references another placement in the same tree;
6. every displayed or persisted problem ID resolves canonically;
7. no registry alias exists;
8. tree cards and counts equal selector output;
9. trivia-visible code and metadata are internally consistent;
10. generated inventory matches the running catalogs.

## 12. Execution strategy

Work proceeds in independently green phases. Read-only discovery can run in parallel.
Write-heavy work is assigned by non-overlapping ownership:

- strongest model/orchestrator: domain model, cross-cutting migrations, integration;
- Terra high/xhigh: mechanical source normalization, documentation generation,
  focused test repairs, and coverage batches;
- strongest reviewer: contract and integration review at phase boundaries.

No phase is declared complete without fresh command output.
