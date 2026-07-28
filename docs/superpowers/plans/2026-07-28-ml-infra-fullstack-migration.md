# ML Infrastructure Full-Stack Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a Docker-first full-stack DSA/ML learning application with
exactly 88 DSA and 69 ML infrastructure items, a real Python playground for
every active item, and mode-appropriate assessment and visualization.

**Architecture:** Preserve the existing React/Vite client and DSA algorithm
modules. Add Bun workspaces for shared execution contracts and the Bun API, an
internal Python runner service, a browser Pyodide fast path, a canonical
learning-item registry that adapts existing DSA algorithms, and 69 clean-break
ML learning items. Docker Compose connects Nginx, API, and the runner.

**Tech Stack:** Bun, React 19, TypeScript 7, Vite 5, TanStack Router, Vitest,
Pyodide Web Worker, CodeMirror 6, Bun SQLite, CPython 3.12, NumPy, CPU PyTorch,
Docker Compose, Nginx.

---

## File structure

Create:

```text
apps/api/
  package.json
  src/index.ts
  src/config.ts
  src/http.ts
  src/persistence.ts
  src/pythonRunnerClient.ts
  src/specs/*.spec.ts
apps/python-runner/
  runner_service.py
  execution_harness.py
  tests/test_*.py
packages/execution-contracts/
  package.json
  src/index.ts
  src/json.ts
  src/validation.ts
  src/specs/*.spec.ts
src/learning/
  types.ts
  registry.ts
  algorithmAdapters.ts
  difficulty.ts
  assessment.ts
  progress/*
  items/<topic>/<one file per item>.ts
  specs/*
src/playground/
  types.ts
  draftStorage.ts
  runnerSelector.ts
  serverRunnerClient.ts
  pyodideRunnerClient.ts
  pyodideRunner.worker.ts
  specs/*
src/ui/organisms/code-workspace/*
src/ui/organisms/assessment/*
docker/web/nginx.conf
compose.yaml
Dockerfile.web
Dockerfile.api
Dockerfile.runner
```

Modify:

```text
package.json
bun.lock
vite.config.ts
README.md
docs/architecture.md
docs/catalog.md
src/types/dsa.ts
src/curriculum/topics.ts
src/components/knowledge-graph/mlInfraTree.ts
src/components/knowledge-graph/MLInfraKnowledgeGraph.tsx
src/routes/workspace.$algorithmId.tsx
src/routes/problems.tsx
src/routes/ml-infra.tsx
src/routes/trivia/*
src/components/main-layout/*
src/ui/organisms/ProblemList.tsx
src/ui/organisms/QuickAccessDrawer.tsx
src/ui/index.ts
src/styles/theme.css
src/algorithms/registry.ts
```

## Task 1: Workspace and execution contracts

**Files:**

- Modify: `package.json`
- Create: `packages/execution-contracts/package.json`
- Create: `packages/execution-contracts/src/index.ts`
- Create: `packages/execution-contracts/src/json.ts`
- Create: `packages/execution-contracts/src/validation.ts`
- Test: `packages/execution-contracts/src/specs/validation.spec.ts`

- [ ] Write failing tests for JSON-value validation, request limits, unique case
  IDs, invocation variants, comparison/tolerance validation, and runtime/package
  compatibility.
- [ ] Run
  `bunx vitest run packages/execution-contracts/src/specs/validation.spec.ts`
  and confirm imports/functions are missing.
- [ ] Add root workspaces:

  ```json
  "workspaces": ["apps/*", "packages/*"]
  ```

- [ ] Implement the exact protocol from the design:
  `PythonExecutionSpec`, `PythonTestCase`, `PythonRunRequest`,
  `PythonCaseResult`, `PythonRunResult`, `PythonExecutionLimits`, `JsonValue`.
- [ ] Implement pure validators returning a discriminated
  `{ok:true,value}|{ok:false,issues}` result; do not throw for user input.
- [ ] Run the focused tests and confirm green.
- [ ] Run `bun run typecheck`.
- [ ] Commit `feat: add Python execution contracts`.

## Task 2: Production Bun API and SQLite extraction

**Files:**

- Create: `apps/api/package.json`
- Create: `apps/api/src/config.ts`
- Create: `apps/api/src/http.ts`
- Create: `apps/api/src/persistence.ts`
- Create: `apps/api/src/index.ts`
- Test: `apps/api/src/specs/http.spec.ts`
- Test: `apps/api/src/specs/persistence.spec.ts`
- Modify: `src/server/sqliteVitePlugin.ts`
- Modify: `vite.config.ts`

- [ ] Write failing tests for `/api/health`, body-size rejection, malformed JSON,
  get/set/delete state, prefix resets, method rejection, CORS/origin behavior for
  localhost, and normalized errors.
- [ ] Run the focused API tests and verify the expected red failures.
- [ ] Extract persistence semantics behind a small `KeyValueStore` interface.
  Keep read validation and best-effort write behavior.
- [ ] Implement `Bun.serve` routing. Preserve the existing `/api/db/state`,
  `/api/db/reset`, and `/api/db/clear-trivia` contracts.
- [ ] Change the Vite plugin into a development proxy or shared handler so
  production behavior has one implementation.
- [ ] Add SIGTERM/SIGINT close handling.
- [ ] Run focused tests, existing SQLite tests, and typecheck.
- [ ] Commit `feat: add production Bun API`.

## Task 3: Python runner harness

**Files:**

- Create: `apps/python-runner/execution_harness.py`
- Create: `apps/python-runner/runner_service.py`
- Create: `apps/python-runner/tests/test_execution_harness.py`
- Create: `apps/python-runner/tests/test_runner_service.py`
- Create: `apps/api/src/pythonRunnerClient.ts`
- Test: `apps/api/src/specs/pythonRunnerClient.spec.ts`

- [ ] Write failing Python unit tests for function, class-method, and stdin
  invocation; deep/unordered/float/stdout comparisons; stdout/stderr capture;
  syntax/runtime error; non-JSON results; truncation; and subprocess timeout.
- [ ] Run
  `python3 -m unittest discover -s apps/python-runner/tests -v` and verify red.
- [ ] Implement a trusted harness that reads one JSON request from stdin,
  executes learner code in a fresh namespace, invokes only the authored
  contract, and writes one JSON result.
- [ ] Execute each request in a fresh `python -I` subprocess with an empty
  temporary working directory and a hard parent timeout.
- [ ] Implement the internal HTTP service with `/health` and `/run`, bounded
  request bodies, one normalized response shape, and no arbitrary package
  installation.
- [ ] Write failing Bun client tests for success, unavailable runner, timeout,
  invalid response, and stale request cancellation.
- [ ] Implement the API-to-runner client and `/api/python/run`.
- [ ] Run Python tests, Bun API tests, and typecheck.
- [ ] Commit `feat: add container Python runner`.

## Task 4: Docker Compose runtime

**Files:**

- Create: `Dockerfile.web`
- Create: `Dockerfile.api`
- Create: `Dockerfile.runner`
- Create: `docker/web/nginx.conf`
- Create: `compose.yaml`
- Create: `.dockerignore`
- Modify: `README.md`
- Test: `scripts/checkCompose.ts`

- [ ] Write a failing structural test that parses Compose configuration and
  asserts web/API/runner health checks, internal-only runner, read-only runner
  filesystem, non-root user, resource/PID limits, and API proxy wiring.
- [ ] Build a pinned CPython 3.12 runner image with NumPy and CPU PyTorch.
- [ ] Build the Bun API image and a multi-stage Vite/Nginx web image.
- [ ] Configure `/api` reverse proxy, SPA fallback, WASM MIME, and immutable
  asset caching.
- [ ] Configure runner `network_mode`/internal network, temporary writable
  storage, read-only root, dropped capabilities, memory/CPU/PID limits.
- [ ] Run `bun run scripts/checkCompose.ts`.
- [ ] Run `docker compose config`.
- [ ] Build and start Compose; verify all three health endpoints and shutdown.
- [ ] Commit `build: add Docker Compose full-stack runtime`.

## Task 5: Browser Pyodide runner and runtime selection

**Files:**

- Modify: `package.json`
- Create: `src/playground/types.ts`
- Create: `src/playground/runnerSelector.ts`
- Create: `src/playground/pyodideRunner.worker.ts`
- Create: `src/playground/pyodideRunnerClient.ts`
- Create: `src/playground/serverRunnerClient.ts`
- Test: `src/playground/specs/runnerSelector.spec.ts`
- Test: `src/playground/specs/pyodideRunnerClient.spec.ts`
- Test: `src/playground/specs/serverRunnerClient.spec.ts`

- [ ] Write failing tests proving standard-library/NumPy browser eligibility,
  PyTorch server-only selection, explicit server override, timeout termination,
  stale-result suppression, error normalization, and server-to-browser fallback.
- [ ] Add pinned Pyodide and configure Vite Worker/WASM assets.
- [ ] Implement lazy worker construction; do not load Pyodide during initial
  application render.
- [ ] Reuse the shared contract and comparison semantics.
- [ ] Terminate/recreate the Worker on timeout or cancellation.
- [ ] Implement server runner fetch with `AbortController`.
- [ ] Run focused tests, typecheck, and a real-browser Pyodide smoke test.
- [ ] Commit `feat: add hybrid Python runner`.

## Task 6: Draft persistence and Code Workspace vertical slice

**Files:**

- Create: `src/playground/draftStorage.ts`
- Create: `src/playground/specs/draftStorage.spec.ts`
- Create: `src/ui/organisms/code-workspace/CodeWorkspace.tsx`
- Create: `src/ui/organisms/code-workspace/PythonEditor.tsx`
- Create: `src/ui/organisms/code-workspace/ExecutionOutput.tsx`
- Create: `src/ui/organisms/code-workspace/TestCaseList.tsx`
- Create: `src/ui/organisms/code-workspace/specs/*.spec.tsx`
- Modify: `src/components/main-layout/components/MainStage.tsx`
- Modify: `src/ui/index.ts`
- Modify: `src/styles/theme.css`

- [ ] Write failing storage tests for version validation, per-item isolation,
  corrupt-record fallback, debounced best-effort sync, and selected-item reset.
- [ ] Implement draft storage without clearing a key except through Reset.
- [ ] Write failing component tests for Reference/Playground/Output tabs,
  immutable reference, scaffold default, Blank/Copy/Reset, Run/Stop,
  stdout/stderr, pass/fail/error/timeout, test selection, runtime badge, live
  status, and route-change cancellation.
- [ ] Add CodeMirror Python through a lazy boundary with textarea-compatible
  labels and keyboard semantics.
- [ ] Replace only the existing `code` row content with `CodeWorkspace`.
- [ ] Preserve active-line highlighting and line explanations in Reference.
- [ ] Add Ctrl/Cmd+Enter only while editor-focused; verify workspace playback
  shortcuts yield.
- [ ] Use only theme tokens and bordered controls/wells.
- [ ] Run focused UI/storage tests and all existing MainLayout tests.
- [ ] Commit `feat: add executable code workspace`.

## Task 7: Learning-item model and app-wide registry

**Files:**

- Create: `src/learning/types.ts`
- Create: `src/learning/difficulty.ts`
- Create: `src/learning/assessment.ts`
- Create: `src/learning/algorithmAdapters.ts`
- Create: `src/learning/registry.ts`
- Create: `src/learning/specs/registry.contract.spec.ts`
- Modify: `src/types/dsa.ts`
- Modify: discovery, graph, Workspace, navbar, settings, and route consumers

- [ ] Write failing contracts for unique canonical IDs, equal nonempty topics,
  sources with URLs, P/R/H/T scores, renderer availability, execution specs,
  trivia eligibility, and exact active counts behind a temporary migration flag.
- [ ] Implement the discriminated union and DSA adapter without copying
  algorithm identity or content.
- [ ] Add `LEARNING_ITEMS`, `LEARNING_ITEM_REGISTRY`,
  `CODE_LEARNING_ITEMS`, and type guards.
- [ ] Change search/list/drawer/count consumers to learning items.
- [ ] Change Workspace route lookup to the item registry while retaining the
  current URL shape during migration.
- [ ] Rename internal `lastAlgorithmId` state to `lastItemId` and bump/validate
  persistence.
- [ ] Restrict Trivia decks to eligible code-bearing items.
- [ ] Run catalog, route, discovery, settings, and trivia tests.
- [ ] Commit `refactor: introduce learning item registry`.

## Task 8: Assessment renderers and progress

**Files:**

- Create: `src/ui/organisms/assessment/TraceAssessment.tsx`
- Create: `src/ui/organisms/assessment/CalculatorAssessment.tsx`
- Create: `src/ui/organisms/assessment/DebuggingAssessment.tsx`
- Create: `src/ui/organisms/assessment/ScenarioAssessment.tsx`
- Create: `src/ui/organisms/assessment/CodeCompletionAssessment.tsx`
- Create: `src/ui/organisms/assessment/CapstoneAssessment.tsx`
- Create: `src/ui/organisms/assessment/AssessmentWorkspace.tsx`
- Create: `src/learning/progress/types.ts`
- Create: `src/learning/progress/storage.ts`
- Create: `src/learning/progress/grading.ts`
- Test: corresponding `specs/*`

- [ ] Write one failing behavior test per renderer plus shared keyboard,
  accessibility, error, and persistence tests.
- [ ] Implement renderer selection by `kind`, with no fabricated complexity or
  code requirements.
- [ ] Implement versioned attempt records containing item ID, variant, response,
  score/rubric, confidence, misconception codes, and timestamps.
- [ ] Implement mastery from two modes, changed context, and delayed retrieval;
  keep thresholds/schedules configurable and initially set to the research
  values.
- [ ] Add Workspace dispatch and preserve existing algorithm step playback.
- [ ] Run focused tests and route/MainLayout regression tests.
- [ ] Commit `feat: add learning assessment modes`.

## Task 9: DSA playground specifications for all 88 active algorithms

**Files:**

- Create: `src/playground/specs-data/dsa/<one module per DSA topic>.ts`
- Create: `src/playground/specs-data/dsa/index.ts`
- Create: `src/playground/specs/dsaExecution.contract.spec.ts`
- Test: existing focused algorithm generators

- [ ] Generate an audit listing the 88 DSA-only IDs, Python top-level symbols,
  default input shape, mutation behavior, and examples.
- [ ] Write a failing contract requiring exactly one execution specification
  with at least three typed cases for every DSA-only algorithm.
- [ ] Author function/class/stdin invocation adapters and cases by topic. Include
  basic, boundary/negative, and complex cases.
- [ ] For mutable inputs, compare the declared return or selected post-state
  explicitly.
- [ ] Run every immutable reference solution through the Docker harness against
  every case.
- [ ] Correct reference Python only when an authored test exposes a real defect;
  preserve step `codeLine` mapping and update tests together.
- [ ] Run DSA generators, execution contract, catalog contracts, and Trivia
  parsing tests.
- [ ] Commit `feat: make all DSA items executable`.

## Task 10: Target topics, placements, and graph

**Files:**

- Modify: `src/curriculum/topics.ts`
- Modify: `src/components/knowledge-graph/mlInfraTree.ts`
- Modify: `src/components/knowledge-graph/data/mlInfraTypes.ts`
- Modify: `src/components/knowledge-graph/MLInfraKnowledgeGraph.tsx`
- Modify: graph specs/contracts

- [ ] Write failing contracts for the 23 frozen topic IDs, 15 required/8
  elective nodes, exact prerequisite edges, acyclicity, reachability, R15
  independence from electives, and measured canvas view box.
- [ ] Replace the 14 old topics with the 23 semantic IDs in one clean-break
  patch coordinated with temporary target item stubs.
- [ ] Author central-spine/elective placement coordinates and vendor-neutral
  copy without static counts.
- [ ] Change the ML graph to `boxViewBox(measuredBox)` with
  `width="100%" height="100%"`.
- [ ] Run route generation only if route files change.
- [ ] Run graph and catalog contracts.
- [ ] Commit `feat: add lifecycle-first ML curriculum graph`.

## Tasks 11–15: Author 69 ML learning items

Each item gets one definition file and one focused spec. Every task follows the
same red-green cycle but has a disjoint canonical ID set.

Common required fields:

```ts
{
  id,
  kind,
  title,
  topicIds,
  difficultyProfile: { prerequisite, representations, horizon, tradeoffs },
  description,
  objective,
  completionEvidence,
  sources: [{ kind: "standard", label, url }],
  assessment,
  starterCode,
  code,
  execution,
  examples,
  generateSteps
}
```

For rubric-first items, `generateSteps` is replaced by the mode payload, but a
small executable playground scaffold and tests remain available.

### Task 11: R1–R6 foundations — 18 items

**Files:**

- Create: `src/learning/items/required-foundations/*.ts` (18)
- Create: `src/learning/items/required-foundations/specs/*.spec.ts` (18)
- Modify: `src/learning/registry.ts`

- [ ] Write failing manifest/contracts for the 18 frozen R1–R6 IDs.
- [ ] Implement R1 environment/scientific-computing items.
- [ ] Implement R2 framing/metrics/leakage items.
- [ ] Implement R3 data-contract/split/lineage items.
- [ ] Consolidate validated legacy assets into R4 tensor/numerical items.
- [ ] Implement R5 baseline/evaluation/error-analysis items.
- [ ] Consolidate validated autograd/checkpoint assets and add R6 training-loop
  state.
- [ ] Execute all reference code/cases in Docker and focused generators in
  Vitest.
- [ ] Run required-item, source, visualization, and catalog contracts.
- [ ] Commit `feat: add ML foundations curriculum`.

### Task 12: R7–R9 reproducible delivery — 9 items

**Files:**

- Create: `src/learning/items/reproducible-delivery/*.ts` (9)
- Create: corresponding specs
- Modify: `src/learning/registry.ts`

- [ ] Write failing ID/mode/count contracts.
- [ ] Implement experiment metadata, artifact lineage, and run-comparison
  debugging.
- [ ] Implement point-in-time feature join, training-serving skew, and
  materialization design.
- [ ] Implement pipeline retry/cache trace, ML test strategy, and stale-artifact
  debugging.
- [ ] Use real timestamped records, DAGs, cache keys, and validation evidence in
  visual states.
- [ ] Execute reference code/cases and all focused tests.
- [ ] Commit `feat: add reproducible ML delivery curriculum`.

### Task 13: R10–R14 production operations — 15 items

**Files:**

- Create: `src/learning/items/production-operations/*.ts` (15)
- Create: corresponding specs
- Modify: `src/learning/registry.ts`

- [ ] Write failing ID/mode/count contracts.
- [ ] Implement training execution, resource sizing, and scheduler diagnosis.
- [ ] Implement package contract, registry state machine, and promotion gate.
- [ ] Implement inference topology, SLO/capacity calculator, and rollout
  debugging.
- [ ] Implement observability signal separation, drift alert calibration, and
  incident response.
- [ ] Implement threat model, sensitive-data governance, and cost attribution.
- [ ] Validate calculations with independent fixture computations and primary
  sources.
- [ ] Execute all code/cases and focused tests.
- [ ] Commit `feat: add production ML operations curriculum`.

### Task 14: R15 capstones — 3 items

**Files:**

- Create: `src/learning/items/capstones/*.ts` (3)
- Create: corresponding specs
- Modify: `src/learning/registry.ts`

- [ ] Write failing rubric tests for required dimensions, critical failures,
  changed constraints, evidence attachments, and saved attempts.
- [ ] Implement batch platform, real-time platform, and compound incident
  capstones.
- [ ] Provide executable sizing/validation scratchpads without pretending the
  design response has one exact output.
- [ ] Verify no elective is required.
- [ ] Run capstone and progress tests.
- [ ] Commit `feat: add ML platform capstones`.

### Task 15: E1–E8 electives — 24 items

**Files:**

- Create: `src/learning/items/electives/*.ts` (24)
- Create: corresponding specs
- Modify: `src/learning/registry.ts`

- [ ] Write failing manifest/contracts for the 24 frozen elective IDs.
- [ ] Implement E1 roofline, tiled GEMM, and profiler decision using measured
  memory-access state.
- [ ] Implement E2 collectives, parallelism selection, and memory/straggler
  diagnosis.
- [ ] Implement E3 real NumPy/PyTorch quantization, compiler compatibility, and
  runtime selection without false vendor execution claims.
- [ ] Implement E4 tokenizer, attention, and KV memory items.
- [ ] Implement E5 paged KV, continuous batching, and serving policy items.
- [ ] Implement E6 exact/HNSW trace, index tradeoffs, and retrieval diagnosis.
- [ ] Implement E7 histogram gain, model selection, and tabular debugging.
- [ ] Implement E8 convolution lowering, BPTT, and model-family selection.
- [ ] Execute all reference code/cases; compare correctness before any
  performance measurement.
- [ ] Run elective, source, visualization, and catalog contracts.
- [ ] Commit `feat: add ML systems electives`.

## Task 16: Atomic ML cutover and legacy retirement

**Files:**

- Modify: `src/algorithms/registry.ts`
- Modify: `src/learning/registry.ts`
- Delete/archive: active enrollment and obsolete implementation/spec files under
  `src/algorithms/ml_*` and `src/algorithms/ml_infra`
- Modify: all old topic/ID references
- Test: catalog and topology contracts

- [ ] Write a failing cutover contract requiring exactly 88 DSA algorithms, 69
  ML items, and 157 active learning items.
- [ ] Require every one of the 232 old ML-bound IDs to be absent from all active
  registries, graphs, directories, Workspace resolution, and Trivia.
- [ ] Use the CSV ledger to verify every old ID contributes to one target asset
  decision before deletion.
- [ ] Remove old enrollment and obsolete files in reviewable topic batches.
- [ ] Preserve optional reference prose outside `src` only when it adds value.
- [ ] Update stale persisted IDs by validation/fallback, not aliases.
- [ ] Run catalog registry/topology contracts after every batch.
- [ ] Commit `refactor: complete ML curriculum clean break`.

## Task 17: Trivia and mastery redesign

**Files:**

- Modify: `src/trivia/*`
- Modify: `src/components/trivia/*`
- Modify: `src/routes/trivia/*`
- Modify: `src/types/trivia.ts`
- Test: existing/new Trivia and progress specs

- [ ] Write failing tests for semantic blank selection, equivalent expressions,
  invariant/prediction follow-up, confidence, misconception codes, variants,
  spacing queue, and delayed retrieval.
- [ ] Keep session records as the only Trivia persistence model.
- [ ] Filter non-code/rubric-only items from code decks.
- [ ] Add item-mode retrieval prompts without creating a second code source.
- [ ] Implement provisional 1/7/21–28-day scheduling and configurable
  80–85-percent mastery.
- [ ] Run all Trivia and learning-progress tests.
- [ ] Commit `feat: add mastery-oriented practice`.

## Task 18: Integration, documentation, and final verification

**Files:**

- Modify: `README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/catalog.md`
- Modify: `AGENTS.md` only for factual command/source-map updates
- Add: Playwright smoke configuration/tests
- Add: catalog audit scripts

- [ ] Write failing end-to-end tests for DSA execution, each assessment mode,
  browser runner, Docker runner, draft persistence, ML graph navigation, and
  retired-ID fallback.
- [ ] Add audit scripts for exact counts, code parsing, sources, runner specs,
  duplicate prompts/code, and ledger coverage.
- [ ] Run every active reference through its authored tests.
- [ ] Run `docker compose build` and `docker compose up --wait`.
- [ ] Run API, runner, and browser smoke tests.
- [ ] Run `bun run check`.
- [ ] Request independent spec-compliance review and fix every Critical or
  Important finding.
- [ ] Request independent code-quality/content-fidelity review and fix every
  Critical or Important finding.
- [ ] Re-run `bun run check` and Docker smoke tests after review fixes.
- [ ] Commit `docs: complete full-stack curriculum migration`.

## Continuous execution rule

The user delegated remaining decisions and requested no further questions.
Proceed through tasks without pausing unless:

- a required dependency or environment is unavailable after three distinct
  attempts;
- a destructive operation would affect data outside this repository; or
- two approved requirements become technically contradictory.

Record autonomous decisions in the design or plan instead of asking.

