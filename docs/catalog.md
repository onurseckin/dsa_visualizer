# Learning-item and curriculum catalog

## Canonical model

`TOPIC_CATALOG` in `src/curriculum/topics.ts` is the only topic catalog. A topic
has a stable ID, a display label, and a `dsa` or `ml-infra` track. `TopicId` is
derived from that data.

The active learning catalog contains exactly:

- 88 DSA items adapted from `AlgorithmDefinition`;
- 69 native ML-infrastructure items;
- 157 total items; and
- 23 ML topics with exactly three items each (15 required and 8 elective).

Every item has a canonical kebab-case `id` and a non-empty `topicIds` tuple:

```ts
{
  id: "example-learning-item",
  topicIds: ["ml_model_evaluation", "ml_problem_framing"],
  // kind, title, objective, assessment, sources, code/playground, ...
}
```

Every listed topic is an equal many-to-many binding. Tuple order gives the
non-empty relation a stable serialized shape; it does not define a primary
topic. Topic membership is never inferred from a folder name or ML flag.

Consumers display, filter, search, and sort using the complete topic set.
Navigation uses only the canonical item ID; it never invents a preferred topic
as routing context.

`ALGORITHMS` in `src/algorithms/registry.ts` enrolls each definition once, and
`ALGORITHM_REGISTRY` contains only the 88 DSA definitions.
`LEARNING_ITEMS` in `src/learning/registry.ts` adapts those 88 definitions and
enrolls the 69 native ML items. `LEARNING_ITEM_REGISTRY` is the only
cross-track route lookup.

The learning model has six modes:

| Kind | Primary evidence |
| --- | --- |
| `algorithm` | Implement and pass executable cases |
| `trace` | Predict the next state and explain the transition |
| `calculator` | Compute a capacity/performance quantity within tolerance |
| `debugging` | Diagnose evidence, repair code/design, and pass failing cases |
| `scenario` | Make and justify a system decision under constraints |
| `capstone` | Produce an integrated design evaluated by a critical-aware rubric |

Code completion is nested in trace/debugging assessments, not a seventh item
kind. Scenario and capstone items may expose a separate executable playground
without turning their rubric into a code-only assessment.

There are no aliases, legacy IDs, secondary UUIDs,
`category`/`categories` fields, ML-specific category fields, transitional
registries, or implicit topic defaults.

## ML curriculum contract

The required spine covers:

1. Python, environments, and scientific computing;
2. ML problem framing and success metrics;
3. data contracts, datasets, and splits;
4. numerical computing, tensors, and stability;
5. baseline models, evaluation, and error analysis;
6. training loops, autodiff, and optimization;
7. experiment reproducibility, metadata, and lineage;
8. feature/data pipelines and offline–online consistency;
9. workflow orchestration, testing, and CI;
10. training platform, compute, and scheduling;
11. model packaging, registry, and release promotion;
12. inference deployment and serving reliability;
13. production evaluation, observability, and incident response;
14. security, governance, privacy, and cost; and
15. end-to-end ML platform capstones.

Electives cover accelerator performance, distributed training,
compilation/quantization, transformer internals, LLM serving, vector
retrieval, tree-ensemble systems, and vision/sequence internals. No elective is
a prerequisite for the required capstone.

All ML items carry an objective, completion evidence, a four-factor difficulty
profile, explicit assessment metadata, and at least one source. Every item also
has an executable playground with distinct starter/reference code and at least
three authored cases.

## Roadmaps

A curriculum placement is a visual and pedagogical location for a topic. It
owns:

- placement ID and referenced `topicId`;
- title, description, difficulty framing, and visual family;
- prerequisite placement IDs; and
- x/y layout coordinates.

It does not own learning items. Counts, cards, titles, descriptions, and
difficulty badges come from the learning registry. A topic may exist without a
placement; adding a topic does not automatically require a graph node.

This is the complete relation:

```text
Learning item ←many-to-many→ Topic ←many-to-many→ Curriculum placement → Tree
```

An item belongs to every tree placement whose `topicId` appears in the item's
`topicIds`. Items never store placement IDs, and placements never store item
IDs.

Use `src/curriculum/trees.ts` for the shared placement type. DSA and ML roadmap
modules provide their own placement arrays and visual families.

## Add or change a DSA algorithm

1. Choose one or more existing topics. Add a `TOPIC_CATALOG` entry only for a
   genuinely new subject users should filter and navigate to.
2. Implement one `AlgorithmDefinition` with a stable kebab-case ID and
   non-empty `topicIds` tuple.
3. Enroll it once in `ALGORITHMS`; the object ID and registry ID must match.
4. Add generator tests and a render test where the visual workspace changes.
5. Add or adjust a placement only when the curriculum sequence changes.
6. Run the catalog contract tests, focused feature tests, then `bun run check`.

DSA executable metadata lives in `src/playground/specs-data/dsa`. It must
provide semantic starter code, a validated execution contract, and cases that
call the real reference interface. Reference-code string comparison is not an
execution test.

## Add or change an ML learning item

1. Confirm the item fills one of the three complementary slots for an existing
   ML topic. Changing the 69-item budget or adding a topic is a curriculum
   decision, not routine content authoring.
2. Select the evidence mode before writing code. Use scenario/capstone for
   design synthesis and trace/calculator/debugging for executable state,
   quantitative, or diagnosis evidence.
3. Author the item through `src/learning/authoring`, including objective,
   completion evidence, four-factor difficulty, sources, assessment payload,
   starter/reference code, execution contract, and input-derived steps.
4. Enroll it once in the appropriate `src/learning/items` collection. Do not
   add it to `ALGORITHMS`.
5. Add focused generator, assessment, execution, and fidelity tests.
6. Run the learning-registry and target-catalog contracts,
   `bun run audit:catalog`, then `bun run check`.

Branded mechanics must either execute the named package/runtime or be clearly
presented as a model/simulation. Performance exercises compare correct outputs
and state their methodology. Distributed exercises model topology and failure
behavior. Serving traces must derive from learner-visible inputs.

## Clean-break retirement

The 232 former ML-bound algorithm IDs were removed after the target items
passed their contracts. Their exactly-once disposition remains in
`research/ml-infra-curriculum/current-problem-ledger.csv`. That ledger exists
for audit and asset provenance only; it must never become a runtime alias or
fallback layer.

## Catalog checks

`src/algorithms/specs/catalogRegistry.contract.spec.ts` verifies the DSA
definitions. `src/learning/specs/registry.contract.spec.ts` and
`targetCatalog.contract.spec.ts` verify cross-track identity, assessment,
difficulty, exact counts, source, and executable-playground contracts. The
knowledge-graph topology contract verifies unique placements, reachable
prerequisites, and absence of duplicated catalog facts.

`bun run audit:catalog` adds a repository-level audit for exact counts, Python
syntax, execution-contract validity, duplicate reference code/descriptions,
retired-directory absence, and complete accounting of the 232 retired IDs.

If a contract fails, fix the source of truth. Do not restore aliases, duplicate
counts, static question lists, or retired enrollment to make a consumer pass.
