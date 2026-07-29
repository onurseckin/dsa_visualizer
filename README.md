# DSA Visualizer

An interactive learning workspace for data structures and algorithms. It
combines step-by-step visualizations, executable Python playgrounds,
curriculum roadmaps, a searchable learning-item directory, and
retrieval-practice trivia. ML-infrastructure roadmap shells remain in the
curriculum, while their native learning content is currently retired.

The active catalog is intentionally bounded at **88 DSA learning items**.

The 23 retained ML topic/placement shells preserve roadmap structure, but do
not contribute active learning items or assessments.

## Stack

- React 19 + TypeScript 7
- Vite 5 + TanStack Router file routes
- Tailwind 4 and token-based CSS
- Bun scripts, Oxlint, and Oxfmt
- A Bun HTTP API with persistent SQLite state
- A hybrid Python runner: Pyodide in a Web Worker for browser-compatible NumPy
  exercises and an isolated CPython 3.12 container for server/PyTorch exercises
- Nginx and Docker Compose as the supported full-stack local runtime

## Local full-stack runtime

Docker Compose is the supported way to use the complete application. It starts
an Nginx web server, a Bun API with persistent SQLite state, and an internal-only
CPython 3.12 runner with pinned NumPy and CPU PyTorch. Base images are pinned by
immutable digest; Python wheels are version-pinned and hash-locked for the
supported local CPU architectures.

```bash
bun run dup
```

Open `http://localhost:5173`. Only the web service publishes a host port. It
proxies `/api` to the API container, and the API reaches the runner over a
separate internal network. The API and Python runner have no host ports.

Stop the stack with `bun run ddown`. This preserves the `api_data` named volume.
Use `bun run dclean` only when you intentionally want to delete saved layouts,
drafts, trivia sessions, and learning progress.

For frontend-focused development, `bun run dev` still serves the app on port
5173 and exposes the same persistence API through the Vite development adapter.
Server-only Python exercises require the Compose stack.

### Docker development with live updates

Use the dedicated development stack when you want all services inside Docker and
need source changes to update automatically:

```bash
bun run ddev
```

It runs Vite with HMR for the web app, Bun watch mode for the API, and restarts
the Python runner when its source changes. Open `http://localhost:5173` and keep
the command running while developing. `api_data` stays in its named Docker volume,
so stopping the development stack does not erase saved work.

Use `bun run ddev:down` to stop it, `bun run ddev:logs` to follow service logs,
and `bun run ddev:ps` to inspect service status. `bun run dup` remains the
production-style static Nginx stack and does not live-reload.

## Workspace and assessments

Every executable workspace has two code surfaces:

- **Reference** is the immutable, authored solution and remains connected to the
  step-by-step explanation and input-aware visualizer tutorial.
- **Playground** is an editable starter or draft. Running it executes authored
  cases, reports per-case results, and captures `stdout` from `print`.

Visualizer tutorials tell an intuitive visual story of how algorithms work
step-by-step, completely independent of source code line numbers. Problem
descriptions and topic guides are authored using clean React HTML markup.

Trace, calculator, debugging, scenario, and capstone workspaces also render the
selected case's input, explicitly labelled conceptual frames, and authored
expected output. Non-exact responses are stored as pending until the learner
completes the transparent rubric self-review; that review updates the same
attempt with a weighted grade. A missed critical criterion remains unresolved
until the learner submits evidence against a different authored case and passes
the repair review. Attempts are scheduled automatically onto the 1/7/24-day
retrieval windows used by mastery evaluation.

The hybrid selector uses browser Pyodide for compatible NumPy exercises and the
Docker CPython runner for server/PyTorch exercises. A browser infrastructure
failure can fall back to the server when the execution contract permits it.
Learner drafts are saved per item and validated when restored.

The learning model still supports algorithm, trace, calculator, debugging,
scenario, and capstone modes for future content. Active content currently uses
the 88 canonical DSA definitions.

## Common commands

| Command | Purpose |
| --- | --- |
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
| `bun run typecheck` | TypeScript check |
| `bun run format:check` | Formatting check |
| `bun run lint` | Lint with zero warnings |
| `bun run build` | Production build |
| `bun run compose:check` | Validate Compose topology and runner hardening |
| `bun run compose:dev:check` | Validate the Docker development Compose configuration |
| `bun run audit:catalog` | Verify the 88 active DSA catalog, retired ML content, Python assets, sources, and retirement ledger |
| `bun run audit:visualizers` | Report tutorial detachment, narrative, scenario, transition, and primitive usage health |
| `bun run check` | Typecheck, format, lint, Intent, Compose, catalog, and build |

Use Bun for every command in this repository. Do not add npm, pnpm, or yarn lockfiles.

## The catalog and curriculum

Every item has one canonical kebab-case ID and a non-empty `topicIds` tuple.
`src/algorithms/registry.ts` enrolls the 88 DSA `AlgorithmDefinition` records.
`src/learning/registry.ts` adapts those definitions into the 88-item active
`LEARNING_ITEMS` catalog. Filters, counts, search, roadmap drawers, workspace
routing, and trivia derive from that catalog. ML topic and placement shells are
retained but their native items are retired.

There are no aliases, legacy category fields, backwards-compatibility layers,
manual roadmap counts, or static problem lists in curriculum data. Every topic
binding is equal—tuple order never creates a primary topic. Curriculum placements
own only teaching sequence, prerequisites, family, copy, difficulty framing,
and coordinates. Problem descriptions and topic guides use clean React HTML markup,
and visualizer tutorials communicate step-by-step algorithm behavior independent
of source code line numbers. See [TUTORIAL_GUIDE.md](TUTORIAL_GUIDE.md) for the
scalar narrative, primitive naming, composite, and migration contracts.

See [docs/catalog.md](docs/catalog.md) for the contribution workflow,
[docs/architecture.md](docs/architecture.md) for system boundaries, and
[research/ml-infra-curriculum/README.md](research/ml-infra-curriculum/README.md)
for curriculum reference material.

## Contributing

Read [AGENTS.md](AGENTS.md) before editing. It contains the short project contract,
source map, required checks, visualizer rules, and collaboration guidance.

## License

MIT
