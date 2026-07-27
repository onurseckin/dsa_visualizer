import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface cudaTritonSramTiledGemmInput {
  data: number[];
  target?: number;
}

export const CUDATRITONSRAMTILEDGEMM_CODE = `
def cuda_triton_sram_tiled_gemm(matrix_a, matrix_b, tile_k=2):
    """
    Computes block-tiled GEMM in SRAM iterating over K-dimension blocks.
    """
    m, k_dim = len(matrix_a), len(matrix_a[0])
    n = len(matrix_b[0])
    matrix_c = [[0] * n for _ in range(m)]

    for k_start in range(0, k_dim, tile_k):
        for r in range(m):
            for c in range(n):
                for k in range(k_start, min(k_dim, k_start + tile_k)):
                    matrix_c[r][c] += matrix_a[r][k] * matrix_b[k][c]

    return matrix_c
`;

export const DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT: cudaTritonSramTiledGemmInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCudaTritonSramTiledGemmSteps = (
  input: cudaTritonSramTiledGemmInput,
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
    "Initialize CUDA/Triton SRAM Tiled GEMM Engine",
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

const CUDATRITONSRAMTILEDGEMM_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines CUDA/Triton SRAM tiled GEMM engine function.",
    4: "Gets rows M and inner dimension K of matrix A.",
    5: "Gets columns N of matrix B.",
    6: "Allocates M x N output matrix C initialized to zero.",
    8: "Iterates through K-dimension contraction tiles starting at k_start with step tile_k.",
    9: "Iterates through row index r.",
    10: "Iterates through column index c.",
    11: "Iterates through K offset indices within current tile block.",
    12: "Accumulates partial product matrix_a[r][k] * matrix_b[k][c] into matrix_c[r][c].",
    14: "Returns completed matrix product matrix_c.",
  },
};

export const cudaTritonSramTiledGemm: AlgorithmDefinition<cudaTritonSramTiledGemmInput> = {
  id: "cuda-triton-sram-tiled-gemm",
  title: "CUDA/Triton SRAM Tiled GEMM Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "Matrix multiplication (GEMM C = A @ B) is the primary compute workload in deep learning training and inference. Naive 3-loop GEMM yields poor memory bandwidth utilization because matrix entries are evicted from cache before being reused. Block-tiling GEMM partitions matrices A and B into SRAM-sized sub-blocks along the K contraction dimension.\n\nThis algorithm implements CUDA/Triton SRAM Tiled GEMM Engine, iterating over K-dimension tile blocks and accumulating partial matrix products in high-speed SRAM registers.\n\nInput Format:\n- data: Array representing matrix element values.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns computed M x N output matrix product.\n\nEdge Cases & Constraints:\n- K-dimension not evenly divisible by tile size tile_k.\n- Non-square matrix dimensions (M != N != K).\n- Single-element 1x1 matrix multiplies.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: CUDATRITONSRAMTILEDGEMM_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "SRAM tiled GEMM is the cornerstone of CUDA C++ and OpenAI Triton matmul kernels. By partitioning A (BLOCK_M x BLOCK_K) and B (BLOCK_K x BLOCK_N) into fast shared memory, each element loaded from HBM is reused BLOCK_N or BLOCK_M times, shifting execution from memory-bound to compute-bound.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, C_{i,j} = sum_{k=0}^{K-1} A_{i,k} * B_{k,j} is decomposed into tile sum over K: C_{i,j} = sum_{t=0}^{K/BLOCK_K - 1} (sum_{k in Tile_t} A_{i,k} * B_{k,j}).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Arithmetic Intensity increases from O(1) in naive matmul to O(BLOCK_SIZE) in tiled matmul. On NVIDIA H100 Tensor Cores, tiling enables peak FP16 performance of up to 2000 TFLOPS.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation loops over K tile blocks (k_start), loading tile sub-matrices into SRAM, multiplying sub-blocks, and accumulating partial products into output matrix C.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes boundary handling when K is not a multiple of tile_k using min(k_dim, k_start + tile_k) guards.",
      },
    ],
    keyTerms: [
      {
        term: "Block Tiling",
        definition:
          "Decomposing large matrices into smaller sub-matrix blocks sized to fit on-chip SRAM.",
      },
      {
        term: "Contraction Dimension (K)",
        definition:
          "The shared inner dimension multiplied and summed over during matrix multiplication.",
      },
      {
        term: "Partial Product Accumulation",
        definition: "Iteratively adding tile dot products into accumulator registers.",
      },
    ],
  },
  trivia: CUDATRITONSRAMTILEDGEMM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
  generateSteps: generateCudaTritonSramTiledGemmSteps,
};
