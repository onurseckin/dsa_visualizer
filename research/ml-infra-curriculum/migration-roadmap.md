# Migration Roadmap

## Goal

Move from the current 14-topic, 232-definition ML-bound collection to the
approved 23-topic, 69-item curriculum without weakening catalog contracts,
losing valuable visual work, or creating a compatibility layer the repository
explicitly forbids.

Status: completed. This document records the sequence and exit gates used by
the implementation.

## Phase 0 — Ratify the curriculum contract

Decide:

- 15 required nodes and their prerequisites;
- 8 electives and their prerequisites;
- 3 complementary assessed items per node;
- target labels and stable topic IDs;
- required versus elective presentation in the graph;
- archive versus deletion policy for retired deep definitions; and
- whether the first release must support new scenario/calculator/debugging item
  modes or can express them through the existing definition shape temporarily.

Exit gate: a reviewed curriculum decision record. Do not start mass ID changes
before this gate.

## Phase 1 — Build the per-definition ledger

Review and enrich the exactly-once ledger in
[current-problem-ledger.csv](current-problem-ledger.csv) for all 232 current
definitions. The research pass has assigned retain, merge, rework, move,
reference, or retire; implementation owners must add sources, reusable assets,
tests, corrections, and ownership before destructive changes.

For each of the 69 target items, identify:

- learning objective and mastery evidence;
- assessment mode;
- target topic;
- current definitions/assets/tests to reuse;
- missing implementation;
- primary source URLs;
- factual corrections;
- difficulty component scores; and
- prerequisite concepts.

Exit gate: 232 current rows accounted for exactly once and 69 target rows
accounted for exactly once.

## Phase 2 — Prove the required learning model

Implement a vertical slice before migrating the full catalog:

1. one trace visualization;
2. one calculator;
3. one debugging evidence set;
4. one changed-constraint scenario; and
5. one code-occlusion item with semantic equivalence plus explanation.

R8 is a strong pilot because point-in-time correctness naturally exercises
visual state, leakage debugging, scenario reasoning, and delayed retrieval. R3
can supply the prerequisite split/leakage concepts.

Validate:

- workspace navigation and step behavior;
- reset and persisted-state rules;
- keyboard/dialog guards;
- accessibility and non-color state;
- trivia scheduling and equivalent-answer behavior;
- learner evidence captured per concept; and
- whether `AlgorithmDefinition` remains the right abstraction for every item
  mode.

Exit gate: the product can assess a non-algorithmic ML infrastructure decision
without disguising it as a toy Python algorithm.

## Phase 3 — Ship the foundation and reproducibility path

Implement R1–R9:

- Python/environment bridge;
- framing;
- data contracts and splits;
- numerical/tensor foundations;
- baselines/evaluation;
- training/autodiff;
- experiment lineage;
- feature/data consistency; and
- workflow orchestration/testing.

Reuse the best tensor/autodiff visualizers only after their claims and sources
are corrected. New lifecycle items have higher priority than polishing deep
electives.

Exit gate: a learner can define, evaluate, train, reproduce, and orchestrate a
small model pipeline with valid data.

## Phase 4 — Ship the production operations path

Implement R10–R15:

- training platform and scheduling;
- model packaging and registry promotion;
- inference topology and reliability;
- production evaluation, observability, and incidents;
- security, governance, privacy, and cost; and
- three end-to-end capstones.

Exit gate: the required spine supports a complete batch system, a complete
online system, and an incident exercise. No GPU/LLM elective is required.

## Phase 5 — Consolidate advanced electives

Implement E1–E8 from the strongest existing mechanics:

- E1 accelerator performance;
- E2 distributed training;
- E3 compilation/quantization/runtimes;
- E4 transformer internals;
- E5 LLM serving;
- E6 retrieval;
- E7 tree ensembles; and
- E8 vision/sequence internals.

Authenticity gates:

- kernel-branded labs execute the named framework or are retitled simulations;
- performance items compare correct outputs and report methodology;
- distributed items start from a measured single-device baseline;
- compiler items expose capture/partition/fallback and validate numerics;
- serving items evaluate workload-specific latency, throughput, memory, and
  fairness; and
- every branded claim cites official documentation or a primary paper.

Exit gate: 24 complementary elective items, not a restored count of fragmented
micro-exercises.

## Phase 6 — Clean break and retirement

The catalog contract explicitly has no aliases or legacy ID compatibility
layer. In a coordinated change:

1. add approved target `TOPIC_CATALOG` entries;
2. add target placements and prerequisites;
3. enroll completed target definitions exactly once;
4. rebind retained definitions to target topic IDs;
5. update every in-repo reference to any changed ID;
6. remove old definitions from `ALGORITHMS` when their target replacement is
   verified;
7. remove obsolete topic entries and placements only after no definition
   references them; and
8. intentionally migrate `ml_recurrent_gates` so it is never silently orphaned.

Retired material that remains useful may live in a clearly non-curricular
reference archive. It must not remain enrolled merely to preserve a count.

## Validation for each migration batch

Follow the repository's algorithm-change sequence:

1. focused pure-generator tests;
2. relevant render and interaction tests;
3. `src/algorithms/specs/catalogRegistry.contract.spec.ts`;
4. `src/components/knowledge-graph/specs/catalogTopology.contract.spec.ts`;
5. `bun run generate-routes` only if a route file changed;
6. `bun run check`.

Also add research-specific validation:

- no target item without an authoritative source URL;
- no current definition missing a ledger disposition;
- no target node with fewer or more than three assessed items;
- no elective prerequisite for R15;
- no unreachable placement;
- no exact duplicate prompt/default code pair;
- no difficulty label without four component scores;
- no branded framework in a title when the code does not execute it; and
- no static copied problem count or card list in placements.

## Suggested delivery increments

| Increment | Scope | Why |
| --- | --- | --- |
| A | Interaction vertical slice + R3 | Proves scenario/debugging/calculator support and tackles leakage early. |
| B | R1–R6 | Establishes a valid ML foundation and reuses selected current content. |
| C | R7–R9 | Adds reproducibility, feature consistency, and testable workflows. |
| D | R10–R14 | Completes platform, release, serving, operations, and governance. |
| E | R15 | Validates transfer across the full spine. |
| F | E1–E3 | Consolidates compute/distributed/compiler strengths. |
| G | E4–E8 | Consolidates model/runtime specialties. |
| H | Final clean-break removal | Deletes obsolete enrollment only after replacements pass. |

## Success measures

Content:

- 100% source-URL coverage;
- 0 known exact duplicates;
- 0 unplaced or unreachable topics;
- 3 complementary assessed items per topic, with at least 2 modes in every
  non-capstone topic;
- all 15 required competencies demonstrated in capstone rubrics.

Learning:

- topic mastery on two item types;
- changed-context transfer success;
- 1-day, 7-day, and 21–28-day retention;
- confidence calibration;
- misconception recurrence by concept;
- capstone and incident-rubric performance.

Product:

- completion and abandonment by node;
- hint dependence;
- time-on-task and retry distribution;
- item discrimination;
- accessibility failures;
- content defect rate and source staleness.

Do not optimize for raw problem count, daily trivia streak alone, or exact
reference-code recall.

## Main risks

| Risk | Mitigation |
| --- | --- |
| Scope expands back toward a tool encyclopedia | Maintain the 69-item quality budget and vendor-neutral objectives. |
| Existing work is discarded too aggressively | Complete the 232-row ledger and reuse visuals/tests inside merged modules. |
| New lifecycle items feel like static articles | Prove scenario, trace, calculator, and debugging interactions in Phase 2. |
| Senior learners are bored by prerequisites | Add diagnostic skip gates for transferable Python/DevOps skills, but not for ML data/evaluation semantics without evidence. |
| Toy simulations overclaim real behavior | State abstraction boundaries and require authentic labs for branded execution. |
| Catalog changes become a legacy-compatibility project | Use the repository's clean-break contract; update references atomically. |
| Coverage falls during consolidation | Add target tests before removing old enrollment; migrate in small batches. |
| Difficulty remains subjective | Store the four-factor rubric and calibrate with telemetry. |
