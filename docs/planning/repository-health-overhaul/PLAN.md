# Repository Health Overhaul Plan

**Design:** `docs/planning/repository-health-overhaul/DESIGN.md`  
**Date:** 2026-07-28

## Phase 1 — Stabilize the baseline

- Align Vitest and V8 coverage package versions.
- Add Intent allowlist and a deterministic Intent check.
- Decide and encode `.tmp` lint ownership.
- Add honest coverage configuration with `all: true`, reports, and no false 100%
  claim.
- Capture current gate and coverage baselines.

## Phase 2 — Canonical topics and problem catalog

- Add failing catalog invariant tests.
- Create the canonical topic catalog and derived topic types/selectors.
- Replace category constants, labels, guards, and ML Boolean classification.
- Create one-enrollment algorithm catalog derived from definition IDs.
- Remove duplicate/camelCase registry aliases.
- Normalize every definition to canonical kebab-case ID and non-empty `topicIds`.
- Update all source/test references.

## Phase 3 — Curriculum placement model

- Add failing tree-placement integrity tests.
- Introduce tree definitions and reusable curriculum placements.
- Convert DSA and ML tree data to placement-only authored metadata.
- Derive counts and problem cards from problem/topic selectors.
- Remove static ML question arrays and manual algorithm counts.

## Phase 4 — Persistence and consumers

- Update workspace lookup and route guards to canonical selectors.
- Replace persisted keys containing problem/topic IDs; discard old payloads.
- Update Problem List, Quick Access, Trivia, and settings consumers.
- Verify every displayed ID resolves.

## Phase 5 — Type, lint, test, and warning repair

- Repair working-data and visual-state contracts.
- Add test metadata narrowing helpers.
- Fix missing imports, unused declarations, and concrete lint findings.
- Repair failing algorithm/category/trivia assertions.
- Eliminate React `act(...)` warning sources.
- Reach a clean typecheck, format check, lint, full test run, and build.

## Phase 6 — Durable documentation and project context

- Rewrite root `AGENTS.md` as the concise, auto-loaded operational context.
- Refresh `README.md`.
- Add focused architecture and catalog contract documents.
- Remove stale generated reports, temporary audit scripts, and obsolete planning docs.
- Document economical coordinator/implementer/reviewer roles without pinning a model.
- Deliberately omit `.codex/config.toml`: the repository must not self-grant trust,
  and model choice belongs to the orchestrator for each task.

## Phase 7 — Coverage ratchet

- Classify production files as executable, generated, declaration, or static data.
- Generate an honest per-file baseline.
- Add missing behavioral and branch tests in bounded category batches.
- Ratchet thresholds upward without regression.
- Enforce 98% statements/lines, 89% branches, and 97% functions plus nonzero
  behavioral coverage in every applicable metric for every executable source file.
- Keep 100% as the direction for changed modules without claiming the repository has
  reached it; the verified result is 98.71/89.43/97.75/98.71.

## Verification at every phase

- Run the smallest relevant Vitest suites while iterating.
- Run typecheck and lint for cross-cutting type/data changes.
- Run `bun run check` before integration checkpoints.
- Run coverage with `all: true` and inspect uncovered-file output.
- Review the diff for aliases, fallbacks, casts, broad exclusions, and stale docs.
