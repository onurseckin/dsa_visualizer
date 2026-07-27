# Code-Line Alignment Improvement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every algorithm step in the DSA Visualizer must reference a meaningful, accurate `codeLine` number that highlights the corresponding Python code line in the workspace code viewer — covering every distinct line of the Python implementation.

**Architecture:** Each algorithm `generateXxxSteps` function calls `addStep(codeLine, what, why, vars)`. The `codeLine` argument is a 1-based index into the Python code string shown in `CodeBlockViewer`. When every distinct line in the Python code is mapped to at least one step, the learner can follow code and visualization in tandem.

**Tech Stack:** TypeScript, Bun, Vitest, existing `AlgorithmStep` / `AlgorithmDefinition` contracts in `src/types/dsa.ts`.

---

## Quality Standard for "Complete"

An algorithm is **complete** when:
1. Every distinct, meaningful line of the Python code string has at least one step referencing it.
2. No `codeLine` value exceeds the total line count in the Python code string.
3. The narrative arc maps coherently: initialization -> loop body -> exit -> return.

---

## Already Complete (user's prior work — 9 algorithms)

- `bubble-sort`, `prefix-sum`, `two-sum`, `kadane-max-subarray` (arrays_and_hashing)
- `binary-tree-lca` (tree_fundamentals)
- `merge-intervals`, `huffman-coding`, `interval-scheduling`, `tasks-and-deadlines` (greedy/intervals)

---

## Task 1: Simple Verification + Quick Fixes

**Files to verify/fix:**
- `src/algorithms/stack_and_queue/validParentheses.ts`
- `src/algorithms/stack_and_queue/nearestSmallerElement.ts`
- `src/algorithms/two_pointers/twoPointers.ts`
- `src/algorithms/two_pointers/mergeSort.ts`
- `src/algorithms/dp_1d/knapsack01.ts`
- `src/algorithms/linked_list/reverseLinkedList.ts`
- `src/algorithms/bit_manipulation/countingBits.ts` (Fix: 80% coverage, missing line 5)
- `src/algorithms/math_and_number_theory/euclidGcd.ts` (Re-verify)

- [ ] **Step 1:** Read each file. Count lines in the Python code string. Check all `addStep(codeLine, ...)` calls.
- [ ] **Step 2:** Fix `countingBits.ts` — add step for missing line 5 (return statement).
- [ ] **Step 3:** For each "verify" file, confirm coverage >= 90%. Fix any gaps found.
- [ ] **Step 4:** Run tests:
  ```bash
  bunx vitest run src/algorithms/stack_and_queue/specs/ src/algorithms/two_pointers/specs/ src/algorithms/dp_1d/specs/ src/algorithms/bit_manipulation/specs/ 2>&1 | tail -20
  ```
- [ ] **Step 5:** Update `.tmp/code_line_alignment_tracker.json` status to `completed`.

---

## Task 2: Graph Shortest Paths + Traversal

**Files:**
- `src/algorithms/graph_shortest_paths/bellmanFord.ts` (~0% coverage)
- `src/algorithms/graph_shortest_paths/floydWarshall.ts` (~0%)
- `src/algorithms/graph_shortest_paths/dijkstraShortestPath.ts` (53%)
- `src/algorithms/graph_traversal/bfsGraph.ts` (~0%)
- `src/algorithms/graph_traversal/dfsGraph.ts` (77%)
- `src/algorithms/graph_traversal/bipartiteGraphCheck.ts` (~0%)
- `src/algorithms/graph_traversal/numberOfIslands.ts` (~0%)

- [ ] **Step 1:** Read Python code strings, number all lines 1..N.
- [ ] **Step 2:** Fix each file — map init/loop/relax/return steps to exact code lines.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/graph_shortest_paths/specs/ src/algorithms/graph_traversal/specs/ 2>&1 | tail -20
  ```

---

## Task 3: Graph Directed + SCC

**Files:**
- `src/algorithms/graph_directed_and_scc/topologicalSort.ts`
- `src/algorithms/graph_directed_and_scc/kosarajuScc.ts`
- `src/algorithms/graph_directed_and_scc/hierholzerEulerianPath.ts`
- `src/algorithms/graph_directed_and_scc/deBruijnSequence.ts`
- `src/algorithms/graph_directed_and_scc/twoSatSolver.ts`
- `src/algorithms/graph_directed_and_scc/successorPaths.ts`
- `src/algorithms/graph_directed_and_scc/dagDpLongestPath.ts`

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/graph_directed_and_scc/specs/ 2>&1 | tail -20
  ```

---

## Task 4: Graph Spanning Trees + Flows

**Files:**
- `src/algorithms/graph_spanning_trees/kruskalMst/stepGenerator.ts`
- `src/algorithms/graph_spanning_trees/primMst.ts`
- `src/algorithms/graph_spanning_trees/disjointSetUnion.ts`
- `src/algorithms/graph_flows_and_cuts/ford_fulkerson/stepGenerator.ts`
- `src/algorithms/graph_flows_and_cuts/minimumPathCover.ts`

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/graph_spanning_trees/specs/ src/algorithms/graph_flows_and_cuts/specs/ 2>&1 | tail -20
  ```

---

## Task 5: DP (1D + 2D) + Math

**Files:**
- `src/algorithms/dp_1d/longestIncreasingSubsequence.ts` (80%)
- `src/algorithms/dp_2d/editDistance.ts` (79%)
- `src/algorithms/dp_2d/countingTilings.ts` (55%)
- `src/algorithms/dp_2d/tspBitmaskDp.ts` (75%)
- `src/algorithms/math_and_number_theory/sievePrimes.ts` (~0%)
- `src/algorithms/math_and_number_theory/extendedEuclideanAlgorithm.ts` (50%)
- `src/algorithms/math_and_number_theory/modularExponentiationInverse.ts` (~0%)
- `src/algorithms/math_and_number_theory/chineseRemainderTheorem.ts` (57%)
- `src/algorithms/math_and_number_theory/eulerTotientFunction.ts` (~0%)
- `src/algorithms/math_and_number_theory/binomialCoefficientsPascal.ts` (33%)
- `src/algorithms/math_and_number_theory/catalanNumbers.ts` (50%)
- `src/algorithms/math_and_number_theory/inclusionExclusionPrinciple.ts` (26%)
- `src/algorithms/math_and_number_theory/matrixExponentiation.ts` (40%)
- `src/algorithms/math_and_number_theory/markovChains.ts` (38%)

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/dp_1d/specs/ src/algorithms/dp_2d/specs/ src/algorithms/math_and_number_theory/specs/ 2>&1 | tail -20
  ```

---

## Task 6: Backtracking

**Files:**
- `src/algorithms/backtracking/nQueens/stepGenerator.ts` (~0%)
- `src/algorithms/backtracking/generatingPermutations.ts` (41%)
- `src/algorithms/backtracking/generatingSubsets.ts` (50%)
- `src/algorithms/backtracking/hamiltonianPathDp.ts` (15%)
- `src/algorithms/backtracking/knightsTourWarnsdorff.ts` (19%)

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/backtracking/specs/ 2>&1 | tail -20
  ```

---

## Task 7: Heap + Game Theory + Tries + Strings

**Files:**
- `src/algorithms/heap_and_priority_queue/kthLargestElement.ts` (~0%)
- `src/algorithms/game_theory/nimGame/stepGenerator.ts` (~0%)
- `src/algorithms/game_theory/spragueGrundyTheorem.ts` (62%)
- `src/algorithms/tries_and_strings/kmpStringMatch/stepGenerator.ts` (~0%)
- `src/algorithms/tries_and_strings/zAlgorithm/stepGenerator.ts` (~0%)
- `src/algorithms/tries_and_strings/trie_prefix_tree/stepGenerator.ts` (~0%)
- `src/algorithms/tries_and_strings/stringHashing.ts` (20%)

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/heap_and_priority_queue/specs/ src/algorithms/game_theory/specs/ src/algorithms/tries_and_strings/specs/ 2>&1 | tail -20
  ```

---

## Task 8: Geometry + Binary Search + Sliding Window

**Files:**
- `src/algorithms/geometry_and_sweep_line/convexHull/stepGenerator.ts` (~0%)
- `src/algorithms/geometry_and_sweep_line/polygonArea/stepGenerator.ts` (~0%)
- `src/algorithms/geometry_and_sweep_line/lineSegmentIntersection.ts` (~0%)
- `src/algorithms/geometry_and_sweep_line/sweepLineIntersections.ts` (~0%)
- `src/algorithms/geometry_and_sweep_line/closestPairOfPoints.ts` (61%)
- `src/algorithms/binary_search/binarySearch1d.ts`
- `src/algorithms/binary_search/binarySearchMatrix/stepGenerator.ts` (~0%)
- `src/algorithms/binary_search/meetInTheMiddle.ts` (86%)
- `src/algorithms/sliding_window/slidingWindowMin/stepGenerator.ts` (~0%)

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/geometry_and_sweep_line/specs/ src/algorithms/binary_search/specs/ src/algorithms/sliding_window/specs/ 2>&1 | tail -20
  ```

---

## Task 9: Advanced Range Queries + Tree Queries

**Files:**
- `src/algorithms/advanced_range_queries/fenwickTree/stepGenerator.ts` (~0%)
- `src/algorithms/advanced_range_queries/segment_tree/stepGenerator.ts` (~0%)
- `src/algorithms/advanced_range_queries/segment_tree_lazy/stepGenerator.ts` (~0%)
- `src/algorithms/advanced_range_queries/sparseTableRmq.ts` (32%)
- `src/algorithms/advanced_range_queries/sqrtDecomposition.ts` (30%)
- `src/algorithms/advanced_range_queries/moAlgorithm.ts` (31%)
- `src/algorithms/advanced_range_queries/dynamicSegmentTree.ts` (30%)
- `src/algorithms/advanced_range_queries/persistentSegmentTree.ts` (40%)
- `src/algorithms/tree_queries_and_diameter/treeDiameter/stepGenerator.ts` (~0%)
- `src/algorithms/tree_queries_and_diameter/eulerTourTechnique.ts` (55%)
- `src/algorithms/tree_queries_and_diameter/dsuOnTree.ts` (29%)
- `src/algorithms/tree_queries_and_diameter/binaryLiftingLca.ts` (44%)

- [ ] **Step 1:** Read and map Python code strings.
- [ ] **Step 2:** Fix each file.
- [ ] **Step 3:** Run tests:
  ```bash
  bunx vitest run src/algorithms/advanced_range_queries/specs/ src/algorithms/tree_queries_and_diameter/specs/ 2>&1 | tail -20
  ```

---

## Task 10: Final Verification + Commit

- [ ] **Step 1:** Re-run the audit script (`.tmp/audit.ts`) to regenerate tracker.
- [ ] **Step 2:** Check any remaining algorithms below 85% coverage.
- [ ] **Step 3:** Fix any remaining gaps.
- [ ] **Step 4:** Run scoped tests for all touched categories.
- [ ] **Step 5:** Commit:
  ```bash
  git add src/algorithms/ .tmp/code_line_alignment_tracker.json
  git commit -m "feat: complete code-line alignment for all core DSA algorithms"
  ```

---

## Context for Subagents

### What `codeLine` Does
`AlgorithmStep.codeLine: number` is a 1-based line number into the Python code string. `CodeBlockViewer` highlights this line while the step is active. The Python code string is the template literal assigned to `XXX_CODE` in each file.

### How to Count Lines
Count only non-blank lines. Line 1 is the first non-blank line (`def ...`). The `codeLine` must be between 1 and total non-blank line count inclusive.

### Step File Patterns
- **Single-file** (e.g., `bubbleSort.ts`): `addStep(codeLine, what, why, vars)` — first arg is codeLine.
- **Split-module** (e.g., `nQueens/stepGenerator.ts`): `steps.push({ codeLine: N, ... })`.
- **Subdir with pythonCode.ts**: Python code is in `pythonCode.ts`; count lines there.

### Good Mapping Pattern
- Initialization step -> line with `left = 0` or `n = len(arr)`
- Loop condition -> `while` or `for` line
- Body operation -> specific inner-body line
- Return -> `return` line
- NEVER put `codeLine: 1` for every step — that is the bug pattern to fix.
