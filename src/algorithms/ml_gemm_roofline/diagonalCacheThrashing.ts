import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface diagonalCacheThrashingInput {
  matrix?: number[][];
  cacheSets?: number;
  data?: number[];
  target?: number;
}

export const DIAGONALCACHETHRASHING_CODE = `def diagonal_cache_thrashing(matrix, cache_sets=4):
    """
    Demonstrates L1 cache line thrashing when strided diagonal matrix access spans cache sets.
    """
    n = len(matrix)
    misses = 0
    accessed_vals = []
    for i in range(n):
        val = matrix[i][i]
        accessed_vals.append(val)
        cache_set = (i * n + i) % cache_sets
        misses += 1
    return accessed_vals, misses`;

export const DEFAULT_DIAGONALCACHETHRASHING_INPUT: diagonalCacheThrashingInput = {
  matrix: [
    [10, 20, 30, 40, 50],
    [15, 25, 35, 45, 55],
    [11, 21, 31, 41, 51],
    [12, 22, 32, 42, 52],
    [13, 23, 33, 43, 53],
  ],
  cacheSets: 4,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDiagonalCacheThrashingSteps = (
  input: diagonalCacheThrashingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrix =
    input.matrix && input.matrix.length > 0
      ? input.matrix
      : [
          [10, 20, 30, 40, 50],
          [15, 25, 35, 45, 55],
          [11, 21, 31, 41, 51],
          [12, 22, 32, 42, 52],
          [13, 23, 33, 43, 53],
        ];

  const cacheSets = Math.max(input.cacheSets ?? 4, 2);
  const n = matrix.length;
  const accessedVals: number[] = [];
  let misses = 0;

  const getMatrixSnapshot = (
    currentI?: number,
    phase: string = "init",
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const isDiagonal = r === c;
        const isCurrent = currentI !== undefined && r === currentI && c === currentI;
        const isPastDiagonal = currentI !== undefined && isDiagonal && r < currentI;

        let state: MatrixCellItem["state"] = "inactive";
        if (isCurrent) {
          state = "active";
        } else if (isPastDiagonal || (phase === "complete" && isDiagonal)) {
          state = "sorted";
        } else if (isDiagonal) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: isDiagonal ? `Diag[${r}]` : `[${r},${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: n,
      cols: n,
      title: `Diagonal Cache Aliasing (N=${n}, CacheSets=${cacheSets}, Misses=${misses})`,
      rowHeaders: Array.from({ length: n }, (_, idx) => `Row ${idx}`),
      colHeaders: Array.from({ length: n }, (_, idx) => `Col ${idx}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentI?: number,
    phase: string = "init",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getMatrixSnapshot(currentI, phase),
      auxiliaryState: {
        customState: {
          n: String(n),
          cacheSets: String(cacheSets),
          misses: String(misses),
          accessedVals: `[${accessedVals.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Line 1: Setup
  addStep(
    1,
    "Initialize Diagonal Cache Thrashing Simulator",
    `Configured ${n}x${n} matrix with ${cacheSets} simulated L1 cache sets.`,
    { n, cache_sets: cacheSets },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Demonstrates L1 cache line thrashing when strided diagonal matrix access spans c",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Line 5: Read n
  addStep(
    5,
    "Read Matrix Dimension N",
    `Matrix size N = ${n} (Total elements N^2 = ${n * n}).`,
    { n },
  );

  // Line 6: Init misses
  addStep(
    6,
    "Initialize Cache Miss Counter",
    "Set misses counter to 0.",
    { misses: 0 },
  );

  // Line 7: Init accessed_vals
  addStep(
    7,
    "Initialize Accessed Values List",
    "Allocated array to record accessed diagonal values.",
    { accessed_vals: "[]" },
  );

  // Lines 8-12: Diagonal loop
  for (let i = 0; i < n; i++) {
    addStep(
      8,
      `Iterate Diagonal Element Index i=${i}`,
      `Traversing main diagonal at index (${i}, ${i}).`,
      { i },
      i,
      "iter",
    );

    const val = matrix[i][i];
    addStep(
      9,
      `Read Diagonal Value matrix[${i}][${i}] = ${val}`,
      `Accessed diagonal memory address mapped to element ${val}.`,
      { i, val },
      i,
      "read",
    );

    accessedVals.push(val);
    addStep(
      10,
      `Record Diagonal Value in History List`,
      `Appended ${val} to accessed_vals list.`,
      { i, val, accessed_vals: `[${accessedVals.join(", ")}]` },
      i,
      "record",
    );

    const flatOffset = i * n + i;
    const cacheSet = flatOffset % cacheSets;
    addStep(
      11,
      `Compute L1 Cache Set Alias: (${i} * ${n} + ${i}) mod ${cacheSets} = ${cacheSet}`,
      `Linear offset ${flatOffset} maps directly to L1 Cache Set #${cacheSet}.`,
      { i, flat_offset: flatOffset, cache_set: cacheSet },
      i,
      "cache_map",
    );

    misses++;
    addStep(
      12,
      `Cache Miss Eviction Tally (Misses = ${misses})`,
      `Strided diagonal access caused set aliasing collision in Cache Set #${cacheSet}, evicting cache line. Total misses = ${misses}.`,
      { i, cache_set: cacheSet, misses },
      i,
      "miss",
    );
  }

  // Line 13: Return
  addStep(
    13,
    "Diagonal Access Simulation Complete",
    `Finished traversal over ${n} diagonal elements with ${misses} total L1 cache misses.`,
    { misses, completed: true },
    undefined,
    "complete",
  );

  return steps;
};

const DIAGONALCACHETHRASHING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "cache_set = (i + i) % cache_sets  # Incorrect 1D index mapping",
    "misses += 0  # Assuming 100% cache hit rate",
    "return matrix[::-1]",
  ],
  hints: [
    { line: 11, hint: "Linearize 2D diagonal index as (i * n + i) to determine L1 cache set mapping." },
    { line: 12, hint: "Increment miss counter when diagonal elements alias to the same cache set, causing eviction." },
  ],
  lineExplanations: {
    1: "Defines diagonal_cache_thrashing function accepting matrix and cache_sets parameters.",
    2: "Starts docstring describing L1 cache line thrashing simulation during diagonal matrix access.",
    3: "Explains how strided diagonal memory accesses map to identical set-associative cache buckets.",
    4: "Closes function docstring.",
    5: "Gets square matrix row/column dimension n.",
    6: "Initializes cache miss eviction counter to 0.",
    7: "Initializes accessed_vals array to record fetched diagonal scalar entries.",
    8: "Iterates through main diagonal indices i from 0 to n - 1.",
    9: "Fetches diagonal value at matrix[i][i].",
    10: "Appends fetched diagonal scalar value to accessed_vals array.",
    11: "Calculates L1 cache set index by linearizing address: cache_set = (i * n + i) mod cache_sets.",
    12: "Increments misses counter due to cache line set aliasing collision and eviction.",
    13: "Returns tuple containing accessed_vals list and total misses count.",
  },
};

export const diagonalCacheThrashing: AlgorithmDefinition<diagonalCacheThrashingInput> = {
  id: "diagonal-cache-thrashing",
  title: "Diagonal Matrix Access Cache Thrashing",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description: `In high-performance GPU and CPU computing (BLAS GEMM, LU decomposition, Cholesky factorization), traversing the main diagonal $(i, i)$ of a row-major $N \\times N$ matrix can trigger **diagonal cache thrashing** (set aliasing conflict).

Set-associative hardware caches map physical memory addresses to cache sets via modular arithmetic:
$$\\text{CacheSet}(i) = \\left( \\lfloor \\frac{\\text{Address}(i)}{\\text{LineSize}} \\rfloor \\right) \\bmod S_{\\text{sets}}$$
For element $(i, i)$ at linear offset $\\text{Offset}(i) = i \\times N + i = i(N + 1)$, if $(N + 1)$ aligns with the cache set stride, every diagonal access maps to the exact same cache set. This forces continuous eviction of cache lines, reducing throughput to DRAM speeds ($\\approx 300$ cycle latency vs $\\approx 4$ cycles for L1 cache).

This algorithm simulates diagonal traversal, calculating set indices step-by-step and recording set collision misses.`,
  constraints: ["1 <= N <= 64", "2 <= cacheSets <= 16"],
  examples: [
    {
      kind: "basic",
      title: "Diagonal Traversal on 5x5 Matrix",
      inputDisplay: "Matrix (5x5), CacheSets = 4",
      outputDisplay: "5 Diagonal Elements Accessed, 5 Cache Misses",
      input: DEFAULT_DIAGONALCACHETHRASHING_INPUT,
      output: "5 Diagonal Elements Accessed, 5 Cache Misses",
      explanation: "Iterates along main diagonal (i, i), calculating set indices and recording set collision misses.",
    },
    {
      kind: "complex",
      title: "4x4 Matrix Set Conflict",
      inputDisplay: "Matrix (4x4), CacheSets = 4",
      outputDisplay: "4 Diagonal Elements Mapped to Same Set",
      input: {
        matrix: [
          [1, 0, 0, 0],
          [0, 2, 0, 0],
          [0, 0, 3, 0],
          [0, 0, 0, 4],
        ],
        cacheSets: 4,
      },
      output: "4 Diagonal Elements Mapped to Same Set",
      explanation: "Demonstrates power-of-two stride aliasing where every diagonal element maps to Set 0.",
    },
  ],
  code: DIAGONALCACHETHRASHING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) time complexity to traverse N main diagonal entries.",
    space: "O(N) space to record the accessed diagonal values list.",
  },
  topicGuide: {
    overview:
      "Cache set aliasing (thrashing) occurs when distinct physical memory locations collide in the same set of a set-associative cache, forcing existing cache lines to be evicted before their contents can be reused. In linear algebra libraries, improper matrix strides (such as unpadded powers of two) frequently cause catastrophic performance degradation.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Modern hardware caches use Set-Associative indexing:\n$$\\text{CacheSet} = \\lfloor \\frac{\\text{Address}}{B_{\\text{line}}} \\rfloor \\bmod S_{\\text{sets}}$$\nWhen accessing matrix element $(i, i)$ in a row-major $N \\times N$ matrix, flat index is $\\text{Offset}(i) = i(N + 1)$. If $(N + 1) \\times \\text{sizeof}(T)$ is a multiple of $B_{\\text{line}} \\times S_{\\text{sets}}$, every diagonal element maps to the exact same cache set, causing a $100\\%$ L1 cache miss rate.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Understanding diagonal cache thrashing is vital when writing high-performance C++/CUDA kernels for LU Decomposition, Cholesky Factorization, QR Decomposition, Eigenvalue solvers, and Strided Tensor Rescaling. Hardware engineers and compiler optimization teams apply stride padding to prevent cache set collisions.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider a $4 \\times 4$ matrix stored in row-major order with 4 cache sets. Element $(0,0)$ resides at offset $0$ ($0 \\bmod 4 = \\text{Set 0}$). Element $(1,1)$ resides at offset $1 \\times 4 + 1 = 5$ ($5 \\bmod 4 = \\text{Set 1}$). Element $(2,2)$ at offset $2 \\times 4 + 2 = 10$ ($10 \\bmod 4 = \\text{Set 2}$). Element $(3,3)$ at offset $3 \\times 4 + 3 = 15$ ($15 \\bmod 4 = \\text{Set 3}$). However, if $N=3$, offsets are $0, 4, 8$—all mapping to Set 0! Every access evicts the previous diagonal element.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "The standard hardware fix for diagonal cache thrashing is Stride Padding (Pitch Padding). By allocating leading dimension $\\text{LD} = N + 1$ instead of $N$, the memory stride is shifted by one scalar slot, breaking set aliasing alignment. The trade-off is a tiny amount of unused memory padding ($< 1\\%$ overhead) for massive throughput gains.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(N)$ linear time to access all $N$ main diagonal entries. Under thrashing, memory latency scales with DRAM latency ($\\sim 300$ cycles) instead of L1 cache latency ($\\sim 4$ cycles). Space Complexity: $\\mathcal{O}(N)$ memory to log scalar history values.",
      },
    ],
    keyTerms: [
      {
        term: "Cache Thrashing",
        definition:
          "Continuous eviction and reloading of cache lines caused by severe set aliasing conflicts.",
      },
      {
        term: "Set-Associative Cache",
        definition:
          "A cache design where memory addresses map to a specific subset of cache slots (sets).",
      },
      {
        term: "Stride Padding (Pitch)",
        definition:
          "Inserting extra dummy padding elements at the end of matrix rows to alter memory access alignment.",
      },
      {
        term: "Linearized Memory Index",
        definition:
          "Calculating 1D byte offset from 2D coordinates via row * N + col.",
      },
    ],
  },
  trivia: DIAGONALCACHETHRASHING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_DIAGONALCACHETHRASHING_INPUT,
  generateSteps: generateDiagonalCacheThrashingSteps,
};
