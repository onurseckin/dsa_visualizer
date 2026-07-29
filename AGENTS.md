<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `bunx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `bunx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# DSA Visualizer contributor guide

This is a local-first full-stack learning app with exactly 88 active DSA items.
The 23 ML-infrastructure topic and roadmap shells remain, but native ML content is
currently retired. The app also includes executable Python workspaces,
visualizations, and retrieval-practice trivia. Read [README.md](README.md) for setup,
[docs/architecture.md](docs/architecture.md) for system boundaries, and
[docs/catalog.md](docs/catalog.md) before changing curriculum or algorithm data.

## Stack and commands

- React 19, TypeScript 7, Vite 5, TanStack Router file routes, Tailwind 4, and
  token-based CSS.
- Bun is the only package/script runner. Do not add npm, pnpm, or yarn lockfiles.
- Oxlint and Oxfmt are the lint/format tools.
- Docker Compose runs the default watch stack: Vite with HMR, the Bun/SQLite API,
  and an internal CPython runner. `dev:local` uses Vite's persistence adapter.

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run start` / `bun run dev` | Build and start the Docker watch stack with live updates |
| `bun run stop` | Stop the Docker stack, preserving images and `api_data` |
| `bun run restart` | Restart the Docker watch stack, rebuilding as needed |
| `bun run logs` / `bun run ps` | Follow logs / show status for the Docker stack |
| `bun run shell:web` / `shell:api` / `shell:runner` | Open a shell in the named Docker service |
| `bun run clean` | Stop the Docker stack and delete named volumes (destructive) |
| `bun run dev:local` / `bun run start:local` | Run host Vite with the Vite persistence adapter; no server-only runner |
| `bun run compose:check` | Validate the single Docker watch-stack configuration |
| `bun run typecheck` | TypeScript check |
| `bun run format:check` | Check formatting |
| `bun run lint` | Run Oxlint with zero warnings |
| `bun run build` | Typecheck and create the standalone `dist/` quality artifact |
| `bun run audit:catalog` | Verify exact active counts, Python assets, sources, and retirement |
| `bun run audit:visualizers` | Report tutorial migration and primitive-authoring health |
| `bun run check` | Typecheck, format, lint, Intent, Compose, catalog audit, and standalone build |

`src/routeTree.gen.ts` is generated. Never edit it by hand. Keep the TanStack Router
plugin before React in `vite.config.ts` and use `bun run generate-routes` when a route
file changes.

## Source map

```text
src/curriculum/       canonical topics and authored roadmap placements
src/algorithms/       88 canonical DSA definitions and enrollment
src/learning/         88-item model/registry, retired ML support, assessment and progress
src/playground/       DSA execution adapters, hybrid runners, and draft persistence
src/routes/           file-based pages and workspace/trivia behavior
src/components/       feature components and visualizer primitives
src/ui/               reusable UI/organism/template components
src/app/              settings, local persistence, topic selectors, keyboard guards
src/trivia/           code-occlusion engine and session-owned persistence
src/server/           Vite-local SQLite persistence adapter
src/styles/           token system and shared UI styling
apps/api/             Bun HTTP API, SQLite state, and runner proxy
apps/python-runner/   bounded CPython service and execution harness
packages/execution-contracts/ shared validated Python protocol
```

## Catalog contract: clean break

The catalog has one source of truth for each kind of fact.

- `src/curriculum/topics.ts` owns `TOPIC_CATALOG`. It defines every `TopicId`, its
  display label, and its `dsa` or `ml-infra` track.
- `AlgorithmDefinition.topicIds` is required and non-empty. Every listed topic has
  equal membership semantics; tuple order is not a primary/fallback mechanism. Do not introduce
  `category`, `categories`, `mlInfraCategory`, `isMlInfra`, or an implicit fallback.
- `src/algorithms/registry.ts` enrolls exactly 88 DSA definitions in `ALGORITHMS`.
  `src/learning/registry.ts` adapts those definitions into the 88-item active
  catalog. Native ML items are retired; their 23 topic and placement shells are
  retained for roadmap structure only.
- There are **no secondary UUIDs, aliases, or legacy ID compatibility layers**. A changed ID is a
  breaking content change: update every in-repo reference in the same change.
- Curriculum placements describe teaching sequence and layout, not algorithm data.
  They reference a `topicId`; problem counts and drawer cards are derived from the
  algorithm registry. Never add `algorithmCount`, static problem/question lists, or
  copied algorithm title/difficulty/description to a placement.
- Problem descriptions and topic guides use clean React HTML markup.
- Visualizer tutorials tell an intuitive visual story of algorithm state transitions, completely independent of source code line numbers.

The DSA catalog, learning registry, target catalog, and graph topology contracts,
plus `bun run audit:catalog`, are required gates for catalog changes.

## Adding or changing content

Agents authoring new items or updating existing algorithm/learning items MUST strictly follow the canonical [TUTORIAL_GUIDE.md](TUTORIAL_GUIDE.md) guide.

1. **Choose Topic & Stable Kebab-Case ID**: Choose existing `topicIds` from `TOPIC_CATALOG`; give the definition a stable kebab-case `id` and non-empty `topicIds` tuple.
2. **Read [TUTORIAL_GUIDE.md](TUTORIAL_GUIDE.md) First**: Follow the **3-Phase Tutorial Framework**:
   - **Phase 1 (Inputless Intro)**: Conceptual mental model, problem setup, and naive bottleneck explanation *before* operating on specific input arrays.
   - **Phase 2 (Concrete Walkthrough)**: Step-by-step visual execution on representative default inputs.
   - **Phase 3 (3-Scenario Matrix)**: Define 3 distinct input scenarios (Scenario 1: Standard Path, Scenario 2: Boundary/Edge Case like $N=1$, Scenario 3: Complex/Adversarial Case).
   - The guide is the canonical teaching contract: each narrative claim needs same-frame canvas evidence; primitives and HUDs must be necessary, non-duplicative, and non-occluding; and each selected scenario's walkthrough, termination, output, and implementation must agree.
   - Once an input-aware walkthrough introduces a structure that will later change, retain it with its latest state in every relevant later frame; focused narration does not justify hiding causal state. Use a compact measured composite when necessary.
3. **Single Fluid Narrative Paragraph Rule**:
   - Step captions MUST be authored as a **single, fluid, conversational narrative paragraph**.
   - Strictly ban mechanical `{ what, why }` object splits, bulleted checklists, or line-number references.
4. **Canvas Law & Native In-Canvas Auxiliary State**:
   - Visualizer SVGs MUST follow Canvas Law: `viewBox = boxViewBox(measuredBox)` with `width="100%" height="100%"`.
   - All auxiliary data structures (stacks, queues, hash maps, DP matrices, visited sets) MUST be rendered natively **INSIDE the SVG canvas** (`CanvasAuxiliaryOverlay` or in-canvas HUDs). Floating HTML side panels are strictly prohibited.
   - Use canonical reusable primitives from `src/components/primitives/` (Array, Matrix, Graph, Tree, Grid, Vector, Quantization, Interval, Heap, DSU, HashTable, StateSpace, CallStack, Bitmask, AttentionMap, Trie) or `CompositeCanvasSnapshot` for multi-primitive views.
   - For weighted graphs, keep numeric weights legible and collision-free. Prefer the graph primitive's weighted layout over an accidental symmetric layout; visual edge length is not a replacement for the displayed numeric weight unless explicitly taught.
5. **Code Decoupling (`codeLine: undefined`)**:
   - Visualizer step snapshots MUST set `codeLine: undefined`. Visual transitions tell an intuitive story independent of source code line numbers.
6. **Narrative and Names**:
   - Use `createTutorialStep` with one scalar `narrative` and phase metadata. The legacy `explanation` object, `title`, and `planeTitle` fields are not authoring APIs for migrations.
   - `snapshot.name` is bare semantic identity. Only arrays render `name =`; every other non-composite primitive uses a bare caption. A lone graph is normally unnamed; name it only to disambiguate an auxiliary, comparison, or multiple-structure frame.
   - Composite `id` and `role` define layout semantics; the nested snapshot owns the optional visual `name`. Composite rendering uses independently measured SVG regions in CSS grid/flex, and routes the one HUD to its primary region.
7. **Enrollment**:
   - Import and enroll a DSA definition once in `ALGORITHMS`. Do not add native ML
     items while that track is retired.
8. **Quality Check Gate**:
   - Run `bun run audit:visualizers`, `bun run audit:catalog`, and `bun run check` before handoff. See [docs/catalog.md](docs/catalog.md) and [TUTORIAL_GUIDE.md](TUTORIAL_GUIDE.md).

## UI and runtime rules

- Keep raw colors and size tokens in `src/styles/theme.css`; components consume
  tokens. Cards, controls, chips, and wells need a visible border token.
- Visualizer SVGs follow the canvas law: `viewBox = boxViewBox(measuredBox)` with
  `width="100%" height="100%"`. Do not reintroduce fixed view boxes or aspect-ratio
  sizing that creates dead bands.
- Persisted state must validate on read and be best-effort on write. Do not clear a
  persisted key except through its documented reset action.
- Global keyboard handlers must respect typing targets and open dialogs.
- The trivia engine derives puzzle lines from `algorithm.code`; `trivia` metadata is
  optional sharpening, never a second source for code or algorithm identity. Session
  records are the only trivia persistence model; do not add standalone config/progress
  mirrors.
- The immutable Reference tab remains the canonical solution. Playground drafts
  are editable, keyed by canonical item ID, and must execute through the shared
  browser/server contract with bounded output and authored cases.

## Executable runner-case authoring

Runner cases are learner-facing execution fixtures, not repository unit,
component, integration, or end-to-end test files. For every executable DSA item,
author its cases in `src/playground/specs-data/dsa/<topic>.ts` using the
canonical `defineDsaExecution` contract.

- Keep the three `cases(...)` slots for a standard path, a boundary case, and a
  complex/adversarial case. Add at least five focused `extraCases(...)` fixtures
  when the input domain permits it; the default execution limit is 100 cases per
  item.
- Every fixture must exactly match the reference code's callable interface:
  entrypoint, class method or function signature, argument paths, input shape,
  return type, mutation behavior, ordering comparison, and expected value.
  Update the definition's description, examples, default input, and visualizer
  input normalization in the same change when that interface changes.
- Derive expected values independently of the optimized reference implementation.
  Use a deliberately simple mathematical oracle, brute force over a small
  bounded domain, or a direct invariant. Never calculate expected outputs by
  calling the solution being graded.
- Cover distinct failure modes rather than repeating examples: minimum and
  maximum valid inputs, zero/one/empty boundaries when allowed, duplicates and
  order changes, identity values, prime/composite or valid/invalid partitions,
  no-solution and multiple-solution outcomes, repeated factors, overflow- or
  performance-adjacent values that remain within runner limits, and cases that
  expose common off-by-one, equality, initialization, or early-return errors.
- Exhausting the full constraint space is usually infeasible. Exhaustively
  enumerate only a small representative domain with an independent oracle, then
  add deterministic adversarial cases that exercise large-input behavior. Do
  not claim a finite fixture set proves correctness.
- Keep fixtures deterministic, JSON-serializable, bounded by the execution
  contract, and visibly named for the behavior they protect. Use `deep-equal`
  unless an order-insensitive or floating-point contract genuinely requires a
  different supported comparison.
- When expanding a chapter, review every runnable item in that chapter together
  so all of its contracts have comparable boundary and adversarial coverage.

## Planning and verification

Do not write, generate, or require unit, component, integration, or end-to-end tests
in plans or implementation work. Verify changes with the relevant non-test commands,
such as typecheck, formatting, lint, catalog audit, Compose validation, and build.

## Working in a shared checkout

Other agents may modify the tree while you work. Start with `git status --short`, do
not overwrite unrelated changes, and keep edits confined to your assigned files. Use
small, reviewable patches; report conflicts rather than reverting another agent's
work. For independent bounded work, delegate only when requested or when the active
task explicitly calls for parallelism.

Suggested roles are a coordinator for integration and scope, focused implementers
for disjoint files, and a reviewer for runtime behavior and contracts. Choose a model and reasoning
effort for the task at hand rather than pinning a repository-wide model configuration.
Project trust is configured by the user's Codex configuration, not this repository.
