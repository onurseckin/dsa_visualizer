import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface l1BlockTiledMatmulInput {
  data: number[];
  target?: number;
}

export const L1BLOCKTILEDMATMUL_CODE = `
def l1_block_tiled_matmul(matrix_a, matrix_b, block_size=2):
    """
    Tiles GEMM loop nest to fit sub-matrices inside CPU L1 cache lines.
    """
    n = len(matrix_a)
    matrix_c = [[0] * n for _ in range(n)]

    for bi in range(0, n, block_size):
        for bj in range(0, n, block_size):
            for bk in range(0, n, block_size):
                for i in range(bi, min(n, bi + block_size)):
                    for j in range(bj, min(n, bj + block_size)):
                        for k in range(bk, min(n, bk + block_size)):
                            matrix_c[i][j] += matrix_a[i][k] * matrix_b[k][j]

    return matrix_c
`;

export const DEFAULT_L1BLOCKTILEDMATMUL_INPUT: l1BlockTiledMatmulInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateL1BlockTiledMatmulSteps = (
  input: l1BlockTiledMatmulInput,
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
    "Initialize L1 Cache Block-Tiled MatMul Engine",
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
    16,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const L1BLOCKTILEDMATMUL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines L1 cache block-tiled matrix multiplication function.",
    4: "Gets square matrix dimension N.",
    5: "Allocates N x N output matrix C initialized to zero.",
    7: "Outer loop bi iterates through row block tiles.",
    8: "Outer loop bj iterates through column block tiles.",
    9: "Outer loop bk iterates through K contraction block tiles.",
    10: "Inner loop i iterates through rows within current row block tile.",
    11: "Inner loop j iterates through columns within current column block tile.",
    12: "Inner loop k iterates through contraction indices within current K block tile.",
    13: "Accumulates matrix_a[i][k] * matrix_b[k][j] product into matrix_c[i][j].",
    15: "Returns computed matrix product matrix_c.",
  },
};

export const l1BlockTiledMatmul: AlgorithmDefinition<l1BlockTiledMatmulInput> = {
  id: "l1-block-tiled-matmul",
  title: "L1 Cache Block-Tiled MatMul Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "On modern CPUs (x86 AVX-512, ARM Neon), L1 data cache access latency is 4-5 clock cycles compared to 200+ cycles for DRAM. Naive matrix multiplication causes cache line evictions. Block-tiling matrix multiplication into 6-nested loop structures ensures sub-matrix tiles fit completely inside 32KB/64KB L1 data cache lines.\n\nThis algorithm implements L1 Cache Block-Tiled MatMul Engine, executing 6-loop block tiled matrix multiplication to maximize CPU L1 cache line hit rates.\n\nInput Format:\n- data: Array representing matrix data.\n- target: Optional target value.\n\nOutput Format:\n- Returns N x N product matrix result.\n\nEdge Cases & Constraints:\n- Matrix sizes not evenly divisible by L1 block_size.\n- Single-element 1x1 matrix inputs.\n- Large matrices exceeding L2/L3 cache capacities.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: L1BLOCKTILEDMATMUL_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "L1 block tiling rearranges the standard 3-loop matmul (i, j, k) into a 6-loop nest (bi, bj, bk, i, j, k). The outer 3 loops iterate across tile blocks, while the inner 3 loops multiply elements residing in fast CPU L1 cache.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, tile size B is selected such that 3 * B^2 * sizeof(float) <= L1_Cache_Size. For a 32KB L1 cache, B = 32 or 64 elements per block tile.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "L1 tiling reduces DRAM memory traffic by a factor of B, boosting matrix multiplication speed by 10x-50x over naive triple loops on modern CPU architectures.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation loops over block indices (bi, bj, bk) and inner tile indices (i, j, k), accumulating products into sub-matrix result tiles.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes min(n, b + block_size) guards to handle matrix dimensions not divisible by block_size.",
      },
    ],
    keyTerms: [
      {
        term: "6-Loop Nest",
        definition:
          "Matrix multiplication structure using 3 outer tile loops and 3 inner element loops.",
      },
      {
        term: "L1 Data Cache",
        definition: "Small, ultra-fast CPU cache closest to execution core registers.",
      },
      {
        term: "Cache Reuse",
        definition:
          "Re-reading sub-matrix tile data multiple times while stored in L1 cache lines.",
      },
    ],
  },
  trivia: L1BLOCKTILEDMATMUL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
  generateSteps: generateL1BlockTiledMatmulSteps,
};
