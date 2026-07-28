# DSA Visualizer

An interactive learning workspace for data structures, algorithms, and ML-infrastructure
concepts. It combines step-by-step visualizations, executable-style Python listings,
curriculum roadmaps, a searchable problem directory, and a code-occlusion trivia drill.

## Stack

- React 19 + TypeScript 7
- Vite 5 + TanStack Router file routes
- Tailwind 4 and token-based CSS
- Bun scripts, Vitest + jsdom, Oxlint, and Oxfmt
- Local SQLite-backed persistence through a Vite plugin, with a safe fallback when
  `bun:sqlite` is unavailable

## Start here

```bash
bun install
bun run dev
```

Open `http://localhost:5173`.

## Common commands

| Command | Purpose |
| --- | --- |
| `bun run typecheck` | TypeScript check |
| `bun run format:check` | Formatting check |
| `bun run lint` | Lint with zero warnings |
| `bunx vitest run <path>` | Focused test run |
| `bun run test` | Full test suite |
| `bun run test:coverage` | Full suite with enforced coverage floors |
| `bun run build` | Production build |
| `bun run check` | Typecheck, format, lint, Intent, coverage, and build |

Use Bun for every command in this repository. Do not add npm, pnpm, or yarn lockfiles.

## The catalog and curriculum

Every problem has one canonical kebab-case ID and one `AlgorithmDefinition` with a
non-empty `topicIds` tuple. `src/curriculum/topics.ts` owns `TOPIC_CATALOG`; algorithm
membership, filters, counts, search, roadmap drawers, and trivia all derive from those
definitions. There are no aliases, legacy category fields, manual roadmap counts, or
static problem lists in curriculum data. Every topic binding is equal—there is no
primary-topic convention hidden in tuple order.

Curriculum placements are authored teaching and layout data: prerequisites, family,
copy, difficulty framing, and coordinates. They reference topics, but never duplicate
algorithm facts. See [docs/catalog.md](docs/catalog.md) for the contribution workflow
and [docs/architecture.md](docs/architecture.md) for the runtime data flow.

The coverage gate includes every executable `src/**/*.ts(x)` file and currently
enforces 98% statements/lines, 89% branches, and 97% functions, plus a per-file rule
that every applicable metric receives behavioral coverage.

## Contributing

Read [AGENTS.md](AGENTS.md) before editing. It contains the short project contract,
source map, required checks, visualizer rules, and collaboration guidance.

## License

MIT
