# Docker-first local runtime design

## Goal

Make the Docker development stack the only default runtime for this local-only
application. All unqualified start, stop, restart, and inspection commands
operate on a watch-enabled Compose stack. Running without Docker remains
available only through explicit `:local` scripts.

## Runtime topology

- Replace the production `compose.yaml` with the current development topology.
  It runs Vite with HMR, Bun in watch mode for the API, and restarts the Python
  runner when its source changes.
- Remove `compose.dev.yaml`; there is no separate production Compose surface.
- Keep the existing API data named volume. Ordinary `stop` preserves it.
- Simplify the web and API Dockerfiles to development images only. Remove the
  static Nginx build/stage and the API production stage, along with the Nginx
  configuration.
- Preserve build-layer dependency caching: Dockerfiles copy Bun manifests and
  `bun.lock` before `bun install --frozen-lockfile`, then copy application
  source. Source-only changes leave the install layer reusable; manifest or
  lockfile changes automatically rerun the install while `start` rebuilds.

## Command contract

| Command | Behavior |
| --- | --- |
| `bun run start` / `bun run dev` | Start Docker Compose with `--build --watch`. |
| `bun run stop` | Stop Compose containers and networks while retaining images and the API data volume. |
| `bun run restart` | Stop then start the Docker watch stack again. |
| `bun run logs` / `bun run ps` | Inspect the default Docker stack. |
| `bun run shell:web` / `shell:api` / `shell:runner` | Open a shell in the corresponding running service. |
| `bun run clean` | Explicitly stop the stack and delete the API data volume; document it as destructive. |
| `bun run dev:local` / `start:local` | Start Vite directly on the host. This uses the Vite persistence adapter and does not start server-only Python execution. |

There are no unqualified production, preview, build-and-serve, `d*`, or
container-internal Vite aliases. The Compose service invokes Vite directly. A
standalone frontend build remains an optional quality command, not a runtime
command.

## Validation and documentation

- Replace the production Compose structural checker with a development-stack
  validator that checks the three services, host Vite port, API/runner health
  wiring, source-watch rules, internal runner network, API data volume, and
  Python runner dependency locks.
- Update `README.md`, `AGENTS.md`, and architecture documentation to describe
  one Docker watch-mode workflow and the explicit native Vite alternative.
- Update the aggregate `check` command to validate the single Compose file and
  retain type, formatting, lint, catalog, and build quality gates.

## Error handling and persistence

- `stop` never removes images or named volumes, so restart is fast and saved
  local state survives.
- `clean` is the only script that removes the API data volume and is clearly
  marked destructive.
- Docker build cache handles dependency refresh automatically. A user can
  explicitly request a cacheless build only through a clearly named command if
  troubleshooting ever requires it; it is not part of normal start/restart.

## Scope

This change removes only deployment-oriented local artifacts and documentation.
It does not change the application’s learning catalog, API contract, or
playground behavior.
