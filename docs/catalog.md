# Learning-item and curriculum catalog

## Canonical model

`TOPIC_CATALOG` in `src/curriculum/topics.ts` is the only topic catalog. A topic
has a stable ID, a display label, and a `dsa` or `ml-infra` track. `TopicId` is
derived from that data.

The active learning catalog contains exactly 88 DSA items adapted from
`AlgorithmDefinition`. There are 0 active native ML-infrastructure items.
The 23 ML topics and their 15 required / 8 elective roadmap placements remain
as retired-content shells; they are not an item-count budget and must not be
populated as a side effect of DSA work.

Every active item has a canonical kebab-case `id` and a non-empty `topicIds`
tuple:

```ts
{
  id: "example-algorithm",
  topicIds: ["arrays"],
  // title, description, code, generateSteps, execution metadata, ...
}
```

Every listed topic is an equal many-to-many binding. Tuple order gives the
relation a stable serialized shape; it does not define a primary topic. Topic
membership is never inferred from a folder name or ML flag.

`ALGORITHMS` in `src/algorithms/registry.ts` enrolls each definition once, and
`ALGORITHM_REGISTRY` contains the 88 DSA definitions. `LEARNING_ITEMS` in
`src/learning/registry.ts` adapts them into the 88-item active catalog.
`LEARNING_ITEM_REGISTRY` is the only route lookup. There are no aliases,
legacy IDs, secondary UUIDs, category fields, transitional registries, or
implicit topic defaults.

The learning model retains algorithm, trace, calculator, debugging, scenario,
and capstone modes for future content, but no native ML item is currently
enrolled.

## Retired ML curriculum

The ML topic catalog and roadmap placements preserve the historical learning
structure: Python and numerical foundations through training, reproducibility,
data/feature pipelines, orchestration, platforms, serving, operations,
governance, and capstones, plus eight elective areas. They contain no active
native items. Do not reintroduce the former 69-item / three-items-per-topic
contract unless the catalog source of truth and its audit are deliberately
changed together.

## Roadmaps

A curriculum placement is a visual and pedagogical location for a topic. It
owns placement ID, referenced `topicId`, title, description, difficulty
framing, visual family, prerequisite placement IDs, and x/y layout coordinates.
It does not own learning items. Counts, cards, titles, descriptions, and
difficulty badges derive from the active learning registry.

```text
Learning item ←many-to-many→ Topic ←many-to-many→ Curriculum placement → Tree
```

An item belongs to every placement whose `topicId` appears in its `topicIds`.
Items never store placement IDs, and placements never store item IDs. Use
`src/curriculum/trees.ts` for the shared placement type.

## Add or change a DSA algorithm

1. Choose existing topics, adding a topic only for a genuinely new subject.
2. Implement one `AlgorithmDefinition` with a stable kebab-case ID and
   non-empty `topicIds`. Use clean React HTML in problem descriptions and topic
   guides.
3. Follow [TUTORIAL_GUIDE.md](../TUTORIAL_GUIDE.md): author scalar narratives,
   detached steps, intentional primitive names, and the three-phase tutorial.
4. Enroll the definition once in `ALGORITHMS`; do not create aliases or a
   compatibility registry.
5. Change a placement only when curriculum sequence or layout changes.
6. Run `bun run audit:visualizers`, `bun run audit:catalog`, and the relevant
   typecheck, format, lint, and build commands.

DSA executable metadata lives in `src/playground/specs-data/dsa`. It provides
semantic starter code, a validated execution contract, and authored cases that
call the real reference interface.

## Identity and audit contract

Every active ID is canonical, kebab-case, and forward-looking. Changing an ID
is a breaking content change: update all in-repository references in the same
change. Do not add legacy aliases, secondary identifiers, static placement
counts, copied item metadata, or fallback routing maps.

`bun run audit:catalog` verifies active DSA enrollment, retired native ML
content, Python assets, source metadata, execution contracts, unique identity,
and catalog accounting. `bun run audit:visualizers` reports the health of the
tutorial migration. When either identifies a source problem, fix the canonical
definition or registry rather than recreating duplicated data.
