# Algorithm and curriculum catalog

## Canonical model

`TOPIC_CATALOG` in `src/curriculum/topics.ts` is the only topic catalog. A topic has a
stable ID, a display label, and a `dsa` or `ml-infra` track. `TopicId` is derived from
that data.

Every `AlgorithmDefinition` has a canonical kebab-case `id` and a non-empty ordered
`topicIds` tuple:

```ts
{
  id: "example-algorithm",
  topicIds: ["arrays_and_hashing", "two_pointers"],
  // title, description, code, generateSteps, examples, sources, ...
}
```

Every listed topic is an equal many-to-many binding. Tuple order exists only so the
non-empty relation has a stable serialized shape; it does not define a primary topic.
Topic membership is never inferred from a folder name or an ML flag.

Consumers display, filter, search, and sort using the complete topic set. Navigation
uses only the canonical algorithm ID; it never invents a preferred topic as routing
context.

`ALGORITHMS` in `src/algorithms/registry.ts` enrolls each definition once, and
`ALGORITHM_REGISTRY` is built from those IDs. There are no aliases, legacy IDs,
secondary UUIDs, `category`/`categories` fields, ML-specific category fields, or
implicit topic defaults.

## Roadmaps

A curriculum placement is a visual and pedagogical location for a topic. It owns:

- placement ID and referenced `topicId`;
- title, description, difficulty framing, and visual family;
- prerequisite placement IDs; and
- x/y layout coordinates.

It does not own algorithms. Counts, cards, titles, descriptions, and difficulty badges
for problems come from the algorithm registry. A topic may exist without a placement;
adding a topic does not require adding a graph node.

This is the complete relation:

```text
Problem ←many-to-many→ Topic ←many-to-many→ Curriculum placement → Tree
```

A question belongs to every tree placement whose `topicId` appears in that question's
`topicIds`. Problems never store placement IDs, and placements never store problem IDs.

Use `src/curriculum/trees.ts` for the shared placement type. DSA and ML roadmap modules
provide their own placement arrays and visual families.

## Add an algorithm

1. Choose one or more existing topics. Add a `TOPIC_CATALOG` entry only for a genuinely
   new subject users should filter and navigate to.
2. Implement one `AlgorithmDefinition` with a stable kebab-case ID and non-empty
   `topicIds` tuple.
3. Enroll it once in `ALGORITHMS`; the object ID and registry ID must match exactly.
4. Add generator tests and a render test where the visual workspace changes. Prefer a
   `*.render.spec.tsx` basename when a pure `*.spec.ts` shares the feature name.
5. Add or adjust a placement only when the curriculum sequence or visual roadmap needs
   to change.
6. Run the catalog contract tests, focused feature tests, then `bun run check`.

## Catalog checks

`src/algorithms/specs/catalogRegistry.contract.spec.ts` verifies one enrollment per
definition, canonical IDs, and valid topic references. The knowledge-graph topology
contract verifies unique placements, valid prerequisite references, and absence of
duplicated static catalog facts.

If a contract fails, fix the source of truth. Do not restore aliases, duplicate counts,
or static question lists to make a consumer pass.
