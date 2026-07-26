# Master Plan V6: Deep Code Modularization, File Splitting & Comprehensive Quality Gate Overhaul

## Objectives

Execute a deep modularization and file-splitting overhaul across the entire `dsa_visualizer` repository. Decompose all large files (>200 lines) into focused sub-modules, helper utilities, explicit type definitions, and sub-component packages.

---

## Execution Streams & Specialized Agent Roles

### Stream 1: Algorithm & Step Generator Modularizer (`alg_step_modularizer`)

- **Focus**: Split all algorithm definitions (>200 lines) into dedicated subfolders (`definition.ts`, `stepGenerator.ts`, `pythonCode.ts`).
- **Targets**:
  - `kmpStringMatch.ts`
  - `kruskalMst.ts`
  - `bfsGraph.ts`
  - `floydWarshall.ts`
  - `treeDiameter.ts`
  - `convexHull.ts`
  - `zAlgorithm.ts`
  - `topologicalSort.ts`
  - `binarySearchMatrix.ts`
  - `fenwickTree.ts`
  - `quickSort.ts`
  - `numberOfIslands.ts`
  - `bellmanFord.ts`
  - `polygonArea.ts`
  - `nimGame.ts`
  - `mergeIntervals.ts`
  - `sievePrimes.ts`
  - `kthLargestElement.ts`
  - `binaryTreeLca.ts`
  - `nQueens.ts`
  - `slidingWindowMin.ts`

### Stream 2: Trivia Engine & Storage Modularizer (`trivia_engine_modularizer`)

- **Focus**: Decompose core trivia engine & storage files into focused modules.
- **Targets**:
  - `src/trivia/triviaEngine.ts`
  - `src/trivia/triviaStorage.ts`
  - `src/components/trivia/hooks/useTriviaSessionState.ts`
  - `src/components/knowledge-graph/knowledgeGraphData.ts`

### Stream 3: Component & Layout Modularizer (`component_hook_modularizer`)

- **Focus**: Decompose large container components and layout handlers.
- **Targets**:
  - `src/components/MainLayout.tsx`
  - `src/app/workspaceLayout.ts`
  - `src/components/trivia/TriviaDeckBuilder.tsx`
  - `src/components/trivia/TriviaSessionsManager.tsx`
  - `src/components/trivia/CodePuzzle.tsx`
  - `src/components/trivia/TriviaSession.tsx`
  - `src/components/ControlPanel.tsx`
  - `src/routes/trivia/-hooks/useTriviaPage.ts`

### Stream 4: Test Suite Modularizer & Master Quality Gatekeeper (`test_quality_gatekeeper`)

- **Focus**: Decompose large spec test files (>200 lines) into single-concern specs and execute master quality gate `bun run check`.
- **Targets**:
  - Split large spec files into focused test suites.
  - Run `bun run check` (`tsc --noEmit && bun run lint && bun run test && bun run build`).

---

## Success Criteria

1. No source or test file exceeds 220 lines.
2. `tsc --noEmit` returns 0 errors.
3. `bun run lint` returns 0 warnings and 0 errors.
4. `vitest run` passes 100% of test files.
5. Production build `vite build` completes cleanly.
