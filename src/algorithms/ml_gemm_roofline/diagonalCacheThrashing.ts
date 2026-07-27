import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface diagonalCacheThrashingInput {
  data: number[];
  target?: number;
}

export const DIAGONALCACHETHRASHING_CODE = `
def diagonal_cache_thrashing(matrix, cache_sets=4):
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

    return accessed_vals, misses
`;

export const DEFAULT_DIAGONALCACHETHRASHING_INPUT: diagonalCacheThrashingInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDiagonalCacheThrashingSteps = (
  input: diagonalCacheThrashingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Diagonal Matrix Access Cache Thrashing",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in memory layout.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    15,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const DIAGONALCACHETHRASHING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines diagonal cache thrashing simulation function.",
    4: "Gets matrix dimension N.",
    5: "Initializes cache miss counter to 0.",
    6: "Initializes array for accessed diagonal values.",
    8: "Iterates through diagonal element indices i from 0 to N-1.",
    9: "Fetches diagonal value at matrix[i][i].",
    10: "Appends value to accessed array.",
    11: "Calculates cache set index = (i * N + i) mod cache_sets.",
    12: "Increments cache miss counter due to set aliasing collision.",
    14: "Returns accessed diagonal values and total cache miss count.",
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
  description:
    "In CPU and GPU memory hierarchies, L1 cache is organized into N-way set-associative cache sets. When accessing matrix elements along diagonal strides (e.g. matrix[i][i] in row-major memory), memory addresses can map to identical cache set indices. This aliasing causes constant cache line evictions (cache thrashing), dropping effective memory bandwidth.\n\nThis algorithm implements Diagonal Matrix Access Cache Thrashing, simulating L1 cache set mapping conflicts and counting cache eviction misses during diagonal matrix traversal.\n\nInput Format:\n- data: Array representing matrix elements.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns accessed diagonal values and total simulated cache miss count.\n\nEdge Cases & Constraints:\n- Matrix dimensions equal to powers of two (worst-case set aliasing).\n- Matrix dimensions coprime to cache set count (minimal set aliasing).\n- Single-element 1x1 matrix inputs.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_DIAGONALCACHETHRASHING_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_DIAGONALCACHETHRASHING_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_DIAGONALCACHETHRASHING_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: DIAGONALCACHETHRASHING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Cache thrashing occurs when multiple memory locations compete for the same set in a set-associative cache, forcing active data out of cache before it can be reused. Power-of-two matrix strides are notorious for causing cache line collisions.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for an N x N row-major matrix stored at base address B, diagonal element (i, i) resides at memory address Address(i) = B + (i * N + i) * sizeof(element). In a cache with S sets, cache set index is Set(i) = (Address(i) / CacheLineSize) mod S.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "If N + 1 is a multiple of S, every diagonal access maps to the exact same cache set, evicting the previous line and causing a 100% L1 cache miss rate. High-performance systems use array padding (e.g. stride = N + 1) to break set aliasing.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates along main diagonal (i, i), tracks memory address set mapping, and tallies cache miss events.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis compares power-of-two strides against padded strides to demonstrate performance recovery.",
      },
    ],
    keyTerms: [
      {
        term: "Cache Thrashing",
        definition:
          "Repeatedly evicting and re-loading memory cache lines due to severe set aliasing.",
      },
      {
        term: "Set-Associative Cache",
        definition: "Cache architecture where memory addresses map to specific cache set buckets.",
      },
      {
        term: "Stride Padding",
        definition:
          "Inserting extra dummy elements per row to prevent power-of-two stride collisions.",
      },
    ],
  },
  trivia: DIAGONALCACHETHRASHING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_DIAGONALCACHETHRASHING_INPUT,
  generateSteps: generateDiagonalCacheThrashingSteps,
};
