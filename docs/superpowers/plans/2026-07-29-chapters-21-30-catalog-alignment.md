# Competitive Programmer's Handbook Chapters 21-30 Catalog Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Chapter 21-30 learning item traceable to the source book, correctly linked to an equivalent external problem when one exists, executable through its stated runner interface, and covered by meaningful authored execution fixtures.

**Architecture:** Treat the local `competitive_programmer.pdf` as the source of truth for chapter and subsection coverage. Treat an external problem link as optional enrichment, never as the definition of the book algorithm: retain it only after independently checking its function contract and intended algorithm. Keep algorithm definitions in their existing topical directories, execution contracts in `src/playground/specs-data/dsa/`, and registrations in the canonical registry.

**Tech Stack:** TypeScript, React algorithm definitions, Bun, canonical DSA registry, Python execution-contract fixtures, Poppler PDF inspection.

---

## Scope record

The local book's table of contents fixes this migration to:

- Chapter 21: Number theory (pp. 197-206)
- Chapter 22: Combinatorics (pp. 207-216)
- Chapter 23: Matrices (pp. 217-224)
- Chapter 24: Probability (pp. 225-234)
- Chapter 25: Game theory (pp. 235-242)
- Chapter 26: String algorithms (pp. 243-250)
- Chapter 27: Square root algorithms (pp. 251-256)
- Chapter 28: Segment trees revisited (pp. 257-264)
- Chapter 29: Geometry (pp. 265-274)
- Chapter 30: Sweep line algorithms (pp. 275-280)

An item is in scope when `source.bookTitle` names *Competitive Programmer's Handbook* and `source.chapter` is 21 through 30, or when it is added to cover a documented missing subsection in that range. Do not change item IDs, titles, or algorithms merely to fit an external platform problem.

## Evidence and acceptance rules

- A LeetCode link remains only when the target’s callable signature, input domain, required output, and central algorithm are materially the same as the catalog item. A conceptual resemblance is insufficient.
- If no exact external problem exists, omit the link. The book provenance remains the pedagogical binding.
- Each runnable item’s reference code, problem statement, `ExecutionSpec`, starter code, and fixtures must agree on one callable interface.
- Execution fixtures are learner runner cases, not automated test-suite additions. Retain the three core examples and add deterministic, independently derived edge/adversarial fixtures within runner bounds.
- New items must have an existing non-empty `topicIds` binding, a source record with the exact book title/chapter/chapter title, a canonical registry enrollment, a runnable specification only when a safe learner contract is well-defined, and a tutorial conforming to `TUTORIAL_GUIDE.md`.
- Because the source book often explains concepts without a standalone coding exercise, add only a focused, teachable implementation with a clear input/output contract. Do not create glossary-only shells.

### Task 1: Build the chapter evidence ledger

**Files:**

- Create: `docs/planning/chapter-21-30-alignment-ledger.md`
- Read: `/Users/onurseckinsenoglu/Desktop/competitive_programmer.pdf`
- Read: `src/algorithms/**`
- Read: `src/playground/specs-data/dsa/**`

- [ ] Extract each Chapter 21-30 heading and subsection from the PDF, preserving the book’s chapter number and printed section title.
- [ ] List every existing in-scope algorithm with its ID, source file, topic bindings, chapter source metadata, external problem link, execution-spec key, and fixture count.
- [ ] Record one of `exact`, `remove`, `no equivalent`, or `not applicable` for each external link, with the target URL and a one-sentence contract comparison.
- [ ] Record each uncovered book subsection as `implemented elsewhere`, `covered by existing item`, `candidate`, or `not a standalone implementation`. A candidate must name a concrete algorithm, input/output contract, and owning topic.

### Task 2: Correct verified external-link and source metadata drift

**Files:**

- Modify: the individual definitions identified by Task 1 under `src/algorithms/`
- Modify: `docs/planning/chapter-21-30-alignment-ledger.md`

- [ ] Remove each link marked `remove`; do not substitute a looser or merely adjacent platform problem.
- [ ] Correct source labels and `chapterTitle` values where they contradict the PDF’s Chapter 21-30 headings.
- [ ] Preserve the book-derived algorithm’s name, implementation idea, and stable ID while making its prose distinguish book concept from optional platform practice.
- [ ] Update the ledger with the final URL or explicit “no equivalent external problem” decision.

### Task 3: Align runner interfaces and fixtures by execution-spec family

**Files:**

- Modify: affected files in `src/playground/specs-data/dsa/`
- Read: `src/playground/specs-data/dsa/helpers.ts`
- Read: `packages/execution-contracts/src/validation.ts`
- Modify: `docs/planning/chapter-21-30-alignment-ledger.md`

- [ ] For each runnable scope item, compare the reference implementation’s public callable name, parameters, types, mutation expectations, and return/print behavior with `ExecutionSpec` and starter code.
- [ ] Correct the specification or starter/reference adaptation so copying the shown reference code into the runner conforms to exactly that contract. Do not change the catalog algorithm to emulate a different linked problem.
- [ ] Keep `cases(basic, boundary, complex)` and add `extraCases(...)` only where the function’s bounded domain has additional meaningful partitions: minimum and maximum values, singleton/empty inputs when valid, duplicate/order variations, impossible states, and numerical corner cases.
- [ ] Derive each expected result independently from a direct oracle, identity, brute-force instance, or invariant; record the oracle in the fixture comment or ledger.
- [ ] Do not add automated unit, component, integration, or end-to-end test files.

### Task 4: Raise tutorial quality for changed and new definitions

**Files:**

- Modify: affected files in `src/algorithms/`
- Read: `TUTORIAL_GUIDE.md`

- [ ] Replace only demonstrated tutorial-contract violations: use the required inputless introduction, concrete walkthrough, and three-scenario matrix; keep snapshots `codeLine: undefined`; and ensure state structures remain visible in relevant later frames.
- [ ] Make changed descriptions identify the algorithm’s precondition, complexity, output meaning, and common pitfall in direct interview-ready language.
- [ ] Use the established primitive/composite snapshot authoring pattern; do not add floating HTML state panels or alter unrelated visualizers.

### Task 5: Add evidence-backed missing implementations

**Files:**

- Create: focused definitions under the existing owning directory in `src/algorithms/`
- Modify: `src/algorithms/registry.ts`
- Modify: appropriate `src/playground/specs-data/dsa/*.ts` only for items with a safe executable contract
- Modify: `docs/planning/chapter-21-30-alignment-ledger.md`

- [ ] For every Task 1 candidate approved by the evidence ledger, choose an existing `TOPIC_CATALOG` topic and stable kebab-case ID.
- [ ] Author the definition, source binding, three-phase tutorial, reference implementation, and exact runner contract/fixtures as one cohesive item.
- [ ] Enroll it once in `ALGORITHMS` and confirm no duplicate or secondary identity is introduced.
- [ ] Mark the ledger candidate as implemented and cite its canonical ID and source file.

### Task 6: Verify catalog-wide contracts and document limits

**Files:**

- Modify: `docs/planning/chapter-21-30-alignment-ledger.md`
- Read: `AGENTS.md`

- [ ] Run `bun run format:check`, `bun run typecheck`, `bun run lint`, `bun run audit:catalog`, `bun run audit:visualizers`, and `bun run build` after all code/data changes.
- [ ] Run `git diff --check` and inspect the final diff to ensure no unrelated shared-worktree change was overwritten.
- [ ] Record any links that are deliberately absent because no exact external equivalent was found, and any book topics consciously not made into items because the book gives no standalone implementation contract.
- [ ] Report exact verification command results and unresolved blockers without claiming coverage beyond the completed ledger.

## Self-review

- Scope coverage: Tasks 1-6 cover the book inventory, link verification, source metadata, runner contract/fixture alignment, tutorial alignment, missing implementation enrollment, and quality gates.
- Placeholder scan: no task delegates an unspecified implementation decision; additions require a concrete ledger candidate and contract before authoring.
- Consistency: the ledger is the decision record; algorithm definitions remain canonical, and runner specifications remain adapters rather than a second curriculum source.
