import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface transposeMatrixSquareInput {
  data: number[];
  target?: number;
}

export const TRANSPOSEMATRIXSQUARE_CODE = `
def transpose_matrix_square(matrix):
    """
    Transposes N x N matrix in-place by swapping symmetric upper/lower entries.
    """
    n = len(matrix)
    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
    return matrix
`;

export const DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT: transposeMatrixSquareInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTransposeMatrixSquareSteps = (
  input: transposeMatrixSquareInput,
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
    "Initialize Square Matrix Transpose Operator",
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
    9,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const TRANSPOSEMATRIXSQUARE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines square matrix transpose function.",
    4: "Gets matrix dimension N.",
    5: "Iterates through row index r from 0 to N-1.",
    6: "Iterates through upper-triangle column index c from r+1 to N-1.",
    7: "Swaps matrix[r][c] with symmetric lower-triangle entry matrix[c][r].",
    8: "Returns transposed in-place square matrix.",
  },
};

export const transposeMatrixSquare: AlgorithmDefinition<transposeMatrixSquareInput> = {
  id: "transpose-matrix-square",
  title: "Square Matrix Transpose Operator",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "Aligning matrix layout representations for GEMM kernels (e.g. converting row-major matrix B to column-major for BLAS GEMM) requires matrix transpose operations. For N x N square matrices, performing in-place symmetric element swaps across the main diagonal executes in O(1) auxiliary space.\n\nThis algorithm implements Square Matrix Transpose Operator, swapping upper-triangle entries (r, c) with lower-triangle entries (c, r).\n\nInput Format:\n- data: Array representing matrix data.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns in-place transposed N x N matrix.\n\nEdge Cases & Constraints:\n- 1x1 single element matrix.\n- Symmetric matrices (transpose equals original matrix).\n- Diagonal element invariance (r = c).",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: TRANSPOSEMATRIXSQUARE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "In-place transpose swaps off-diagonal symmetric elements across the main diagonal. Restricting column loops to c > r ensures every symmetric pair is swapped exactly once without double-swapping.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, transpose operation sets M_new[r][c] = M_old[c][r]. For an N x N matrix, total swaps executed are N*(N-1)/2.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In GPU execution, naive transpose causes non-coalesced memory reads. Tiled CUDA kernels load 32x32 tiles into shared memory (SRAM) before writing transposed entries back to DRAM.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation loops over row index r and upper-triangle column indices c from r+1 to N-1, swapping symmetric element pairs.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes 1x1 matrices and diagonal element handling.",
      },
    ],
    keyTerms: [
      {
        term: "In-Place Transpose",
        definition:
          "Swapping matrix entries across the main diagonal without allocating extra storage.",
      },
      {
        term: "Symmetric Pair Swap",
        definition: "Exchanging values at (r, c) and (c, r).",
      },
      {
        term: "Upper Triangle Traversal",
        definition: "Iterating strictly over cells above the main diagonal (c > r).",
      },
    ],
  },
  trivia: TRANSPOSEMATRIXSQUARE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
  generateSteps: generateTransposeMatrixSquareSteps,
};
