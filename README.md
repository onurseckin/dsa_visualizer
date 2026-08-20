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
- Docker Compose as the default full-stack local development runtime

## Docker-first local runtime

Docker Compose is the default way to run the complete application. It starts a
Vite web server with HMR, a Bun API with persistent SQLite state, and an
internal-only CPython 3.12 runner with pinned NumPy and CPU PyTorch. Source
changes are watched: Vite updates the web app, Bun restarts the API, and runner
source changes restart the Python service. Base images are pinned by immutable
digest; Python wheels are version-pinned and hash-locked for the supported local
CPU architectures.

```bash
bun run start
```

`bun run dev` is an equivalent Docker-watch command. Open
`http://localhost:42000`. Only the web service publishes a host port. Vite
forwards `/api` to the API container, and the API reaches the runner over a
separate internal network. The API and Python runner have no host ports.

Use `bun run stop` to stop the stack. It preserves the Docker images and the
`api_data` named volume, so saved layouts, drafts, trivia sessions, and learning
progress remain. `bun run restart` stops and starts the same watch stack.
Use `bun run clean` only when you intentionally want to delete that persisted
volume.

### Dependency and image refreshes

Stopping the stack does not remove its images or reinstall packages. On the next
`start`, Docker reuses cached build layers when the manifests and `bun.lock` are
unchanged. If a workspace `package.json` or the lockfile changes, the next
`start` or `restart` rebuild reaches the `bun install --frozen-lockfile` layer
and refreshes the container dependencies. Ordinary source changes are synced by
Compose watch and do not reinstall dependencies automatically.

### Run Vite directly on the host

Use the explicit local alias when you want only the Vite application on your
computer instead of Docker:

```bash
bun run dev:local
```

`bun run start:local` is the same command. It uses the Vite persistence adapter,
not the Docker API or SQLite service, so server-only CPython exercises are not
available. Use the Docker default for the complete application.

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
| `bun run start` / `bun run dev` | Build and start the Docker watch stack with live updates |
| `bun run stop` | Stop the Docker stack while preserving images and `api_data` |
| `bun run restart` | Restart the Docker watch stack, rebuilding as needed |
| `bun run logs` | Follow Docker service logs |
| `bun run ps` | Show Docker service status |
| `bun run shell:web` | Open a shell in the Vite web container |
| `bun run shell:api` | Open a shell in the Bun API container |
| `bun run shell:runner` | Open a shell in the CPython runner container |
| `bun run clean` | Stop the Docker stack and delete named volumes (destructive) |
| `bun run dev:local` / `bun run start:local` | Run Vite directly on the host with the Vite persistence adapter |
| `bun run typecheck` | TypeScript check |
| `bun run format:check` | Formatting check |
| `bun run lint` | Lint with zero warnings |
| `bun run build` | Typecheck and create the standalone `dist/` quality artifact |
| `bun run compose:check` | Validate Compose topology and runner hardening |
| `bun run audit:catalog` | Verify the 88 active DSA catalog, retired ML content, Python assets, sources, and retirement ledger |
| `bun run audit:visualizers` | Report tutorial detachment, narrative, scenario, transition, and primitive usage health |
| `bun run check` | Typecheck, format, lint, Intent, Compose, catalog, and standalone build |

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
