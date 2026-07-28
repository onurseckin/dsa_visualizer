# ML Infrastructure Curriculum and Full-Stack Playground Design

Date: 2026-07-28

Status: approved by user direction and the research package in
`research/ml-infra-curriculum/`.

## Objective

Transform DSA Visualizer into a Docker-first full-stack learning application
whose final active catalog contains:

- the existing 88 DSA problems;
- 69 redesigned ML infrastructure learning items;
- an immutable reference implementation for every code-bearing item;
- an editable Python playground for every final active item;
- real stdout/stderr capture and typed test-case grading; and
- interaction models suitable for traces, calculators, debugging, scenarios,
  and capstones.

All 232 definitions currently carrying an ML topic leave active enrollment at
cutover. Their useful code, visualizations, explanations, and tests are inputs
to the 69 target items. The resulting net reduction is 163 ML entries. Ledger
`move` rows inform prerequisite coverage but do not expand the fixed set of 88
DSA-only problems.

## Product decisions

- Docker Compose is the supported runtime. Cloud and multi-tenant deployment
  are out of scope.
- The repository remains one Bun workspace. The existing Vite client stays at
  the root to avoid a low-value mass file move. New workspaces live under
  `apps/` and `packages/`.
- The editable editor starts with an authored function/class scaffold, not the
  answer. It offers explicit `Start blank`, `Copy reference`, and `Reset`
  actions.
- The reference solution remains immutable and continues to highlight the
  active visualization line.
- Every active code-bearing item has authored invocation metadata and typed
  public tests. Display examples are not treated as executable oracles.
- Browser execution is an optional fast path for standard-library/NumPy code.
  Docker execution is the authoritative path and the only path for PyTorch or
  native dependencies.
- Drafts persist per canonical item ID. Execution output is transient.
- Trivia continues to derive from the canonical reference code. Scenario and
  capstone items use retrieval prompts and rubrics rather than arbitrary code
  occlusion.

## Repository structure

```text
.
├── src/                         existing React/Vite client
│   ├── learning/                common item model, registry, validators
│   ├── playground/              client runner selection, worker, draft storage
│   └── ...
├── apps/
│   ├── api/                     Bun HTTP API and SQLite persistence
│   └── python-runner/           Python execution HTTP service
├── packages/
│   └── execution-contracts/     shared JSON-safe TypeScript protocol
├── docker/
│   ├── web/                     Nginx config
│   └── python-runner/           fixed Python/NumPy/PyTorch image inputs
├── Dockerfile.web
├── Dockerfile.api
├── Dockerfile.runner
└── compose.yaml
```

The frontend remains buildable with `bun run build`. Compose adds the complete
runtime without making Vite's development middleware a production server.

## Learning-item model

`AlgorithmDefinition` is too narrow for design scenarios and capstones. Add a
discriminated model:

```ts
type LearningItemKind =
  | "algorithm"
  | "trace"
  | "calculator"
  | "debugging"
  | "scenario"
  | "capstone";

interface LearningItemBase {
  id: string;
  kind: LearningItemKind;
  title: string;
  topicIds: readonly [TopicId, ...TopicId[]];
  difficulty: DifficultyLevel;
  description: string;
  sources: readonly ProblemSource[];
  assessment: AssessmentDefinition;
}

interface CodeLearningItem extends LearningItemBase {
  code: string;
  starterCode: string;
  execution: PythonExecutionSpec;
  generateSteps(input: unknown): AlgorithmStep[];
}

interface RubricLearningItem extends LearningItemBase {
  prompt: ScenarioPrompt;
  rubric: RubricDefinition;
  code?: never;
}
```

Existing DSA `AlgorithmDefinition` values remain intact. An adapter creates the
`algorithm` learning-item variant while deriving identity, topics, code, and
metadata from the definition. Execution specifications live in a validated
canonical map keyed by the same ID, avoiding mechanical edits to 88 large
algorithm modules. Transitional type helpers may be used inside a migration
batch, but no legacy ID aliases or category fallbacks are introduced.

The canonical `LEARNING_ITEMS` registry drives search, lists, topic counts,
drawers, workspace resolution, and assessment selection. A derived
`CODE_LEARNING_ITEMS` collection supplies Trivia and executable workspace
features. `ALGORITHM_REGISTRY` remains the canonical registry for the 88 DSA
algorithm implementations; it is no longer the app-wide content registry.

## Execution contract

The shared JSON-safe protocol includes:

```ts
interface PythonExecutionSpec {
  runtime: "browser" | "server";
  entrypoint: string;
  invocation:
    | { kind: "function"; arguments: readonly ValueBinding[] }
    | { kind: "class-method"; constructor: readonly ValueBinding[]; method: string }
    | { kind: "stdin"; output: "text" };
  packages: readonly ("numpy" | "torch")[];
  cases: readonly PythonTestCase[];
  limits?: Partial<PythonExecutionLimits>;
}

interface PythonTestCase {
  id: string;
  label: string;
  input: JsonValue;
  expected: JsonValue;
  comparison: "deep-equal" | "unordered" | "float" | "stdout";
  tolerance?: number;
}

interface PythonRunResult {
  runId: string;
  status: "passed" | "failed" | "error" | "timeout";
  stdout: string;
  stderr: string;
  cases: readonly PythonCaseResult[];
  durationMs: number;
  runtime: "browser" | "server";
}
```

Catalog contracts reject duplicate case IDs, unknown packages, invalid
entrypoints, empty test banks, non-JSON values, missing starter code, and
runtime/package mismatches.

## Runner architecture

### Browser runner

- Pyodide runs in a lazily loaded module Web Worker.
- Each request gets a fresh Python globals dictionary.
- The main thread enforces a wall timeout by terminating and recreating the
  Worker.
- Source, input, result, and stdout/stderr sizes are bounded.
- Only pinned, allowlisted packages load; no runtime `pip`/`micropip`.
- The browser runner is a responsiveness feature, not a hidden-test boundary.

### Docker runner

- `apps/python-runner` exposes an internal JSON HTTP endpoint.
- Compose does not publish the runner port to the host.
- The runner image includes CPython, NumPy, and CPU PyTorch at pinned versions.
- The service executes in a temporary directory as a non-root user with a
  read-only root filesystem, no external network, bounded CPU/memory/PIDs,
  capped output, and a hard timeout.
- The Bun API validates request shape and limits, forwards to the runner, and
  normalizes errors.
- Local-only scope omits accounts, billing, remote abuse protection, and
  adversarial multi-tenant guarantees.

### API and persistence

- `apps/api` owns `/api/health`, `/api/db/*`, and `/api/python/run`.
- SQLite behavior moves from the Vite-only plugin into a reusable service
  module. Vite development proxies `/api` to the Bun API.
- Nginx serves built frontend assets and proxies `/api` in Compose.
- Browser localStorage remains the immediate persistence layer; SQLite sync is
  best-effort.

## Code workspace

The existing `code` panel becomes a composite with three tabs:

1. **Reference** — immutable `CodeBlockViewer`, active-line highlighting, line
   explanations.
2. **Playground** — editor, runtime badge, Run, Stop, Reset, Start blank, Copy
   reference, test selector.
3. **Output** — stdout, stderr, duration, and individual case results.

The panel remains one existing resizable row, so workspace layout persistence
does not gain another top-level panel key.

The playground:

- loads editor/runtime code only when opened;
- uses a Python-aware editor with line numbers and accessible textarea
  semantics;
- supports Ctrl/Cmd+Enter to run while focused;
- yields all global playback keys while editing;
- announces final status through one polite live region;
- cancels work on navigation/unmount;
- caps rendered output; and
- never modifies `algorithm.code`.

## Assessment modes

- **Algorithm/trace:** visual state prediction plus executable tests.
- **Calculator:** structured inputs, estimate-before-run, numeric tolerance, and
  unit-aware output.
- **Debugging:** authored faulty starter, evidence/logs, failing tests, hints,
  and immutable corrected reference.
- **Scenario:** constrained choices with rationale, consequences, and a rubric.
- **Capstone:** saved design response, checklist/rubric scoring, and incident
  timeline; no fake exact-output grading.

Every topic has three assessed items using at least two modes, except R15's
three distinct capstone subtypes.

## Curriculum migration

The clean-break target follows
`research/ml-infra-curriculum/target-curriculum.md`:

- R1–R9 foundation and reproducibility;
- R10–R15 production operations and capstones;
- E1–E8 advanced electives.

The implementation consumes
`research/ml-infra-curriculum/current-problem-ledger.csv` exactly once:

- retain/merge/rework rows contribute to target implementations;
- move rows return to DSA/model prerequisite placement when useful;
- reference rows leave the assessed registry; and
- retire rows are removed after replacements pass.

DSA ties are explicit prerequisites and cross-topic bindings, not copied
questions. Topological sort supports pipelines/autodiff, queues support
schedulers, tries support tokenization, heaps support admission/scheduling, and
graphs support lineage/retrieval.

## Visualizations and code fidelity

- Visual state must represent the governing invariant, not decorative motion.
- SVG visualizers follow the repository canvas law and measured view boxes.
- Python reference code must parse and pass authored public tests.
- NumPy/PyTorch items execute those real libraries in the Docker runner.
- Triton/CUDA concepts are labeled simulations unless the code actually invokes
  the framework; authentic GPU execution is not claimed on a CPU-only local
  runner.
- Performance lessons compare correctness before timing and state hardware,
  version, warmup, and workload assumptions.
- Every item has a primary/official source URL.

## Phases

1. **Foundation:** workspace configuration, shared contracts, Bun API,
   persistence extraction, Python runner, Compose, health checks.
2. **Playground vertical slice:** browser/server clients, Code workspace UI,
   drafts, stdout/stderr, typed tests, one DSA and one ML pilot.
3. **Catalog model:** learning-item union, registries, consumer migration,
   contracts, assessment shells.
4. **DSA execution:** explicit starter/invocation/test metadata for all 88 final
   DSA problems.
5. **ML required R1–R9:** 27 items.
6. **ML production R10–R15:** 18 items.
7. **ML electives E1–E8:** 24 items and consolidation/removal of obsolete ML
   enrollment.
8. **Trivia/mastery:** semantic occlusion, confidence, spacing, changed-context
   variants, assessment records.
9. **System verification:** real Docker/browser smoke tests, catalog contracts,
   coverage, build, documentation, and final independent review.

## Error handling

- Validation errors return structured field failures and never start Python.
- Syntax/runtime errors preserve traceback text within output limits.
- Timeout stops the active browser worker or Docker process and returns a
  timeout result.
- Runner unavailability offers browser fallback only when packages/runtime
  permit it.
- Stale run IDs cannot overwrite a newer result.
- Persisted drafts validate version, item ID, source size, and string content;
  corrupt records are ignored without clearing unrelated keys.
- A reset deletes only the selected item's draft.

## Test strategy

Every behavior change follows red-green-refactor.

- Shared contract unit tests.
- API validation, persistence, proxy, timeout, and response tests.
- Python harness tests for invocation modes, comparisons, stdout/stderr,
  syntax/runtime errors, truncation, and timeout.
- Component tests for tabs, editor actions, test results, live region,
  keyboard guards, cancellation, and draft persistence.
- Catalog contracts for 88 DSA + 69 ML active items, source URLs, unique IDs,
  placement reachability, item counts, executable metadata, and code parsing.
- Focused pure-generator and render tests for every new visualizer.
- Real browser smoke test for Pyodide.
- Compose health and server-runner integration tests.
- Full `bun run check` before handoff.

## Non-goals

- Cloud deployment, user accounts, shared submissions, hostile multi-tenancy,
  GPU scheduling, arbitrary package installation, and secure hidden tests.
- Preserving old ML IDs through aliases.
- Keeping obsolete definitions enrolled to protect the current count.
- Treating every scenario or capstone as a LeetCode-shaped algorithm.

## Frozen semantic IDs

### Topics

| Research node | Canonical topic ID |
| --- | --- |
| R1 | `ml_python_scientific_computing` |
| R2 | `ml_problem_framing` |
| R3 | `ml_data_contracts_splits` |
| R4 | `ml_numerical_tensors` |
| R5 | `ml_model_evaluation` |
| R6 | `ml_training_autodiff` |
| R7 | `ml_experiment_lineage` |
| R8 | `ml_feature_pipelines` |
| R9 | `ml_workflow_orchestration` |
| R10 | `ml_training_platform` |
| R11 | `ml_model_registry` |
| R12 | `ml_inference_serving` |
| R13 | `ml_observability_incidents` |
| R14 | `ml_governance_security_cost` |
| R15 | `ml_platform_capstone` |
| E1 | `ml_accelerator_performance` |
| E2 | `ml_distributed_training` |
| E3 | `ml_compilation_quantization` |
| E4 | `ml_transformer_internals` |
| E5 | `ml_llm_serving` |
| E6 | `ml_vector_retrieval` |
| E7 | `ml_tree_ensemble_systems` |
| E8 | `ml_vision_sequence_models` |

### Learning items

| Node | Three canonical item IDs |
| --- | --- |
| R1 | `reproducible-python-environment`; `tensor-dtype-device-boundary`; `determinism-triage` |
| R2 | `ml-target-feedback-loop`; `metric-threshold-guardrails`; `leakage-proxy-debugging` |
| R3 | `dataset-contract-validator`; `time-group-split-builder`; `dataset-lineage-graph` |
| R4 | `tensor-layout-explorer`; `stable-softmax-repair`; `precision-policy` |
| R5 | `baseline-model-selection`; `evaluation-calibration-slices`; `generalization-failure-diagnosis` |
| R6 | `reverse-mode-autodiff`; `training-loop-state`; `activation-checkpoint-tradeoff` |
| R7 | `run-reproduction-manifest`; `model-artifact-lineage`; `experiment-comparison-debugging` |
| R8 | `point-in-time-feature-join`; `training-serving-skew`; `feature-materialization-design` |
| R9 | `ml-pipeline-retry-cache`; `ml-test-strategy`; `stale-artifact-pipeline-debugging` |
| R10 | `training-execution-topology`; `training-resource-sizing`; `training-scheduler-debugging` |
| R11 | `model-package-contract`; `model-registry-state-machine`; `model-promotion-gate` |
| R12 | `inference-topology-selection`; `inference-slo-capacity`; `rollout-regression-debugging` |
| R13 | `ml-observability-signals`; `drift-alert-calibration`; `ml-incident-response` |
| R14 | `ml-system-threat-model`; `sensitive-data-governance`; `ml-cost-attribution` |
| R15 | `batch-ml-platform-capstone`; `realtime-ml-platform-capstone`; `ml-incident-capstone` |
| E1 | `roofline-bound-estimator`; `tiled-gemm-memory-trace`; `profiler-optimization-decision` |
| E2 | `ring-allreduce-trace`; `distributed-parallelism-selection`; `distributed-memory-straggler` |
| E3 | `quantization-deployment-plan`; `compiler-graph-compatibility`; `portable-runtime-selection` |
| E4 | `bpe-token-budget`; `causal-attention-trace`; `kv-cache-memory-policy` |
| E5 | `paged-kv-cache-allocation`; `continuous-batching-trace`; `llm-serving-policy` |
| E6 | `exact-vs-hnsw-search`; `vector-index-tradeoffs`; `retrieval-regression-debugging` |
| E7 | `histogram-split-gain`; `tree-model-system-selection`; `tabular-pipeline-debugging` |
| E8 | `convolution-lowering-trace`; `recurrent-bptt-trace`; `vision-sequence-system-selection` |
