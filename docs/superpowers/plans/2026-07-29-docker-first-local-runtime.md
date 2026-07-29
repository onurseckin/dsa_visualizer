# Docker-first Local Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the watch-enabled Docker Compose stack the default local runtime and remove all production Docker artifacts.

**Architecture:** Promote the existing development Compose topology to `compose.yaml`, leaving source synchronization and service watchers intact. Simplify Bun Dockerfiles to development-only images, align scripts and the Compose validator with the one stack, and document native Vite as an explicit `:local` escape hatch.

**Tech Stack:** Docker Compose watch, Docker build cache, Bun, Vite, TypeScript, Oxlint, Oxfmt.

---

### Task 1: Consolidate Docker topology

**Files:**
- Modify: `compose.yaml`
- Delete: `compose.dev.yaml`
- Modify: `Dockerfile.web`
- Modify: `Dockerfile.api`
- Delete: `docker/web/nginx.conf`

- [ ] Replace `compose.yaml` with the existing development service topology so it exposes Vite on port 5173, proxies `/api` through Vite, keeps Bun/API watching, restarts the Python runner on source changes, and retains `api_data`.
- [ ] Delete `compose.dev.yaml` and the Nginx configuration.
- [x] Retain the cache-friendly Dockerfile ordering in both Bun images: copy manifests and `bun.lock`, run `bun install --frozen-lockfile`, then copy source. Remove build, Nginx, and production-only stages.

### Task 2: Create the Docker-first command surface

**Files:**
- Modify: `package.json`

- [x] Map `start` and `dev` to `docker compose up --build --watch`.
- [x] Add `stop`, `restart`, `logs`, `ps`, `shell:web`, `shell:api`, `shell:runner`, and destructive `clean` commands against the default Compose project.
- [x] Map `dev:local` and `start:local` to host Vite; Compose invokes its container-internal Vite command directly.
- [x] Remove production, preview, and legacy `d*` command aliases.

### Task 3: Align Compose validation

**Files:**
- Modify: `scripts/checkCompose.ts`
- Modify: `package.json`

- [x] Make the validator parse the single default Compose file.
- [x] Validate the development web port (5173), Vite command/environment, API and runner health dependencies, named API volume, internal runner network, and source-watch entries.
- [x] Retain validation of pinned Bun/Python images and hash-locked Python requirements, while removing Nginx-specific requirements and preserving compatible runner safeguards.
- [x] Collapse `compose:dev:check` into `compose:check` and update the aggregate quality command.

### Task 4: Update contributor-facing documentation

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/architecture.md`

- [x] Describe the single Docker watch-mode stack as the default way to run the full application.
- [x] Document lifecycle, shell, and destructive-clean commands; explicitly state Docker cache and persisted-volume behavior.
- [x] Document `dev:local` and `start:local` as native frontend-only alternatives.
- [x] Remove production/Nginx claims and legacy command references.

### Task 5: Validate the final configuration

**Files:**
- Verify: `package.json`
- Verify: `compose.yaml`

- [ ] Run `bun run compose:check` and inspect the successful single-stack Compose configuration validation.
- [ ] Run `bun run typecheck`, `bun run format:check`, `bun run lint`, `bun run audit:catalog`, and `bun run build`.
- [ ] Review `git diff --check` and `git diff` to confirm the edits stay limited to Docker runtime, scripts, documentation, and the approved planning artifacts.
