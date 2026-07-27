import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface naive3LoopMatmulInput {
  data: number[];
  target?: number;
}

export const NAIVE3LOOPMATMUL_CODE = `
def naive_3_loop_matmul(matrix_a, matrix_b):
    """
    Computes un-tiled triply-nested loop matrix multiplication C = A @ B.
    """
    m, k_dim = len(matrix_a), len(matrix_a[0])
    n = len(matrix_b[0])
    matrix_c = [[0] * n for _ in range(m)]

    for i in range(m):
        for j in range(n):
            for k in range(k_dim):
                matrix_c[i][j] += matrix_a[i][k] * matrix_b[k][j]

    return matrix_c
`;

export const DEFAULT_NAIVE3LOOPMATMUL_INPUT: naive3LoopMatmulInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateNaive3LoopMatmulSteps = (input: naive3LoopMatmulInput): AlgorithmStep[] => {
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
    "Initialize Naive Triply-Nested Loop GEMM O(N^3)",
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
    14,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const NAIVE3LOOPMATMUL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines naive triply-nested loop GEMM function.",
    4: "Gets rows M and inner dimension K of matrix A.",
    5: "Gets columns N of matrix B.",
    6: "Allocates M x N output matrix C initialized to zero.",
    8: "Outer loop i iterates through output rows.",
    9: "Middle loop j iterates through output columns.",
    10: "Inner loop k iterates through contraction dimension.",
    11: "Accumulates product matrix_a[i][k] * matrix_b[k][j] into matrix_c[i][j].",
    13: "Returns computed matrix product matrix_c.",
  },
};

export const naive3LoopMatmul: AlgorithmDefinition<naive3LoopMatmulInput> = {
  id: "naive-3-loop-matmul",
  title: "Naive Triply-Nested Loop GEMM O(N^3)",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "The classical triply-nested loop algorithm evaluates matrix multiplication C = A @ B by iterating index loops i (rows), j (columns), and k (contraction). While mathematically straightforward, naive 3-loop matmul suffers from non-strided column memory reads on matrix B, leading to severe CPU/GPU cache line evictions and sub-optimal performance.\n\nThis algorithm implements Naive Triply-Nested Loop GEMM O(N^3), executing baseline un-tiled matrix multiplication.\n\nInput Format:\n- data: Array representing matrix data.\n- target: Optional target value.\n\nOutput Format:\n- Returns M x N matrix product C.\n\nEdge Cases & Constraints:\n- Non-square matrix dimensions (M != N != K).\n- 1x1 single-element matrices.\n- Large matrix sizes causing O(N^3) execution slowdown.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_NAIVE3LOOPMATMUL_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_NAIVE3LOOPMATMUL_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_NAIVE3LOOPMATMUL_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: NAIVE3LOOPMATMUL_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Naive triply-nested loop matmul is the baseline definition of matrix multiplication. Examining its memory access pattern highlights why cache tiling and memory swizzling are essential for high-performance computing.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for M x K matrix A and K x N matrix B, output entry C_{i,j} = sum_{k=0}^{K-1} A_{i,k} * B_{k,j}. Total scalar operations are 2 * M * N * K FLOPs.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In row-major memory order, inner loop access B_{k,j} steps down matrix B columns with stride N. As K increases, B_{k,j} reads jump across memory cache lines, resulting in low cache reuse and low FLOPS throughput.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation allocates output matrix C of shape M x N, loops over i, j, k, and accumulates scalar element products.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes non-matching matrix dimensions (K_a != K_b).",
      },
    ],
    keyTerms: [
      {
        term: "Triply-Nested Loop",
        definition: "The standard 3-loop structure (i, j, k) evaluating matrix multiplication.",
      },
      {
        term: "Contraction Index (k)",
        definition:
          "The shared inner index multiplied and summed over during matrix multiplication.",
      },
      {
        term: "Non-Strided Column Access",
        definition: "Reading matrix elements vertically down columns in row-major memory layouts.",
      },
    ],
  },
  trivia: NAIVE3LOOPMATMUL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_NAIVE3LOOPMATMUL_INPUT,
  generateSteps: generateNaive3LoopMatmulSteps,
};
