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
- Docker Compose runs Nginx, the Bun/SQLite API, and an internal CPython runner.
  The Vite plugin exposes the same persistence surface for frontend development.

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start Vite on port 5173 (do not leave it running for a user) |
| `bun run ddev` | Start the Docker development stack with web HMR and backend source watchers |
| `bun run ddev:down` | Stop the Docker development stack while preserving persisted data |
| `bun run ddev:logs` | Follow development-stack service logs |
| `bun run ddev:ps` | Show development-stack service status |
| `bun run dup` | Build and start the Docker Compose stack, waiting for healthy services |
| `bun run ddown` | Stop the Docker Compose stack and preserve persisted data |
| `bun run drestart` | Rebuild and restart the Docker Compose stack |
| `bun run dbuild` | Build Docker Compose images without starting services |
| `bun run dlogs` | Follow Docker Compose logs for all services |
| `bun run dps` | Show Docker Compose service status |
| `bun run dclean` | Stop the stack and delete persisted Docker volumes (destructive) |
| `bun run compose:dev:check` | Validate the Docker development Compose configuration |
| `bun run typecheck` | TypeScript check |
| `bun run format:check` | Check formatting |
| `bun run lint` | Run Oxlint with zero warnings |
| `bun run build` | Typecheck and create `dist/` |
| `bun run audit:catalog` | Verify exact active counts, Python assets, sources, and retirement |
| `bun run audit:visualizers` | Report tutorial migration and primitive-authoring health |
| `bun run check` | Typecheck, format, lint, Intent, Compose, catalog audit, and build |

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
3. **Single Fluid Narrative Paragraph Rule**:
   - Step captions MUST be authored as a **single, fluid, conversational narrative paragraph**.
   - Strictly ban mechanical `{ what, why }` object splits, bulleted checklists, or line-number references.
4. **Canvas Law & Native In-Canvas Auxiliary State**:
   - Visualizer SVGs MUST follow Canvas Law: `viewBox = boxViewBox(measuredBox)` with `width="100%" height="100%"`.
   - All auxiliary data structures (stacks, queues, hash maps, DP matrices, visited sets) MUST be rendered natively **INSIDE the SVG canvas** (`CanvasAuxiliaryOverlay` or in-canvas HUDs). Floating HTML side panels are strictly prohibited.
   - Use canonical reusable primitives from `src/components/primitives/` (Array, Matrix, Graph, Tree, Grid, Vector, Quantization, Interval, Heap, DSU, HashTable, StateSpace, CallStack, Bitmask, AttentionMap, Trie) or `CompositeCanvasSnapshot` for multi-primitive views.
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
for disjoint files, and a reviewer for production behavior and contracts. Choose a model and reasoning
effort for the task at hand rather than pinning a repository-wide model configuration.
Project trust is configured by the user's Codex configuration, not this repository.
