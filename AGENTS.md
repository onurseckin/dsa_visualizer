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

This is a client-side learning app for algorithms, curriculum roadmaps, workspace
visualizations, and code-occlusion trivia. Read [README.md](README.md) for setup,
[docs/architecture.md](docs/architecture.md) for system boundaries, and
[docs/catalog.md](docs/catalog.md) before changing curriculum or algorithm data.

## Stack and commands

- React 19, TypeScript 7, Vite 5, TanStack Router file routes, Tailwind 4, and
  token-based CSS.
- Bun is the only package/script runner. Do not add npm, pnpm, or yarn lockfiles.
- Vitest + jsdom test the app. Oxlint and Oxfmt are the lint/format tools.
- The Vite development plugin exposes local SQLite-backed persistence through
  `/api/db/*`; it falls back safely when `bun:sqlite` is unavailable.

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start Vite on port 5173 (do not leave it running for a user) |
| `bun run typecheck` | TypeScript check |
| `bun run format:check` | Check formatting |
| `bun run lint` | Run Oxlint with zero warnings |
| `bunx vitest run <path>` | Run a focused test while iterating |
| `bun run test` | Run the full suite |
| `bun run test:coverage` | Run the suite and enforce repository coverage floors |
| `bun run build` | Typecheck and create `dist/` |
| `bun run check` | Full quality gate |

`src/routeTree.gen.ts` is generated. Never edit it by hand. Keep the TanStack Router
plugin before React in `vite.config.ts` and use `bun run generate-routes` when a route
file changes.

## Source map

```text
src/curriculum/       canonical topics and authored roadmap placements
src/algorithms/       one definition per problem plus the canonical enrollment list
src/routes/           file-based pages and workspace/trivia behavior
src/components/       feature components and visualizer primitives
src/ui/               reusable UI/organism/template components
src/app/              settings, local persistence, topic selectors, keyboard guards
src/trivia/           code-occlusion engine and session-owned persistence
src/server/           Vite-local SQLite persistence adapter
src/styles/           token system and shared UI styling
```

## Catalog contract: clean break

The catalog has one source of truth for each kind of fact.

- `src/curriculum/topics.ts` owns `TOPIC_CATALOG`. It defines every `TopicId`, its
  display label, and its `dsa` or `ml-infra` track.
- `AlgorithmDefinition.topicIds` is required and non-empty. Every listed topic has
  equal membership semantics; tuple order is not a primary/fallback mechanism. Do not introduce
  `category`, `categories`, `mlInfraCategory`, `isMlInfra`, or an implicit fallback.
- `src/algorithms/registry.ts` enrolls each definition exactly once in `ALGORITHMS`.
  The registry is built from `definition.id`; IDs are canonical kebab-case.
- There are **no secondary UUIDs, aliases, or legacy ID compatibility layers**. A changed ID is a
  breaking content change: update every in-repo reference in the same change.
- Curriculum placements describe teaching sequence and layout, not algorithm data.
  They reference a `topicId`; problem counts and drawer cards are derived from the
  algorithm registry. Never add `algorithmCount`, static problem/question lists, or
  copied algorithm title/difficulty/description to a placement.

The catalog contract tests in `src/algorithms/specs/catalogRegistry.contract.spec.ts`
and `src/components/knowledge-graph/specs/catalogTopology.contract.spec.ts` are
required gates for catalog changes.

## Adding or changing an algorithm

1. Choose existing `topicIds` from `TOPIC_CATALOG`; add a new topic only when the
   curriculum really needs a new navigable subject.
2. Give the definition a stable kebab-case `id`, a non-empty `topicIds` tuple, code,
   examples/default input, step generator, educational metadata, and sources.
3. Import and enroll that definition once in `ALGORITHMS`. Its `id` must be the only
   registry key.
4. Add focused pure-generator tests. When a render test shares a basename with a
   logic test, use `*.render.spec.tsx` to avoid TypeScript basename collisions.
5. Add or revise a curriculum placement only when the teaching roadmap needs it;
   do not create a placement merely to expose a topic in filtering.
6. Run the catalog contracts, the algorithm tests, then `bun run check` before handoff.

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

## Quality baseline

Coverage uses `all: true` over executable `src/**/*.ts(x)` files. The enforced floors
are 98% statements, 89% branches, 97% functions, and 98% lines. The additional
per-file gate rejects a source file with zero hits in any applicable metric. The
verified 2026-07-28 run passed 569 test files / 2,460 tests at 98.71% statements/lines,
89.43% branches, and 97.75% functions across 568 source files. These are floors, not a
reason to avoid improving a changed module toward 100%.

## Working in a shared checkout

Other agents may modify the tree while you work. Start with `git status --short`, do
not overwrite unrelated changes, and keep edits confined to your assigned files. Use
small, reviewable patches; report conflicts rather than reverting another agent's
work. For independent bounded work, delegate only when requested or when the active
task explicitly calls for parallelism.

Suggested roles are a coordinator for integration and scope, focused implementers
for disjoint files, and a reviewer for tests/contracts. Choose a model and reasoning
effort for the task at hand rather than pinning a repository-wide model configuration.
Project trust is configured by the user's Codex configuration, not this repository.
