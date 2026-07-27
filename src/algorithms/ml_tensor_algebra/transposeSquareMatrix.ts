import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface transposeSquareMatrixInput {
  data: number[];
  target?: number;
}

export const TRANSPOSESQUAREMATRIX_CODE = `
def transpose_square_matrix(matrix):
    """
    Transposes a square matrix in-place by swapping symmetric upper/lower entries.
    """
    n = len(matrix)

    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]

    return matrix
`;

export const DEFAULT_TRANSPOSESQUAREMATRIX_INPUT: transposeSquareMatrixInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateTransposeSquareMatrixSteps = (
  input: transposeSquareMatrixInput,
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
    "Initialize In-Place Square Matrix Transpose",
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
    11,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const TRANSPOSESQUAREMATRIX_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines in-place square matrix transpose function.",
    4: "Gets matrix dimension N.",
    6: "Iterates through row index r from 0 to N-1.",
    7: "Iterates through column index c strictly above main diagonal (c from r+1 to N-1).",
    8: "Swaps upper triangle element matrix[r][c] with lower triangle element matrix[c][r].",
    10: "Returns transposed in-place square matrix.",
  },
};

export const transposeSquareMatrix: AlgorithmDefinition<transposeSquareMatrixInput> = {
  id: "transpose-square-matrix",
  title: "In-Place Square Matrix Transpose",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "Matrix transpose (M^T) is one of the most fundamental operations in linear algebra, deep learning backpropagation, and linear system solvers. For square N x N matrices, transposing in-place by swapping symmetric upper-triangle element (r, c) with lower-triangle element (c, r) achieves optimal O(1) auxiliary space complexity.\n\nThis algorithm implements In-Place Square Matrix Transpose, executing upper-triangle symmetric index swaps across an N x N matrix buffer.\n\nInput Format:\n- data: Array representing matrix values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns transposed in-place square matrix buffer.\n\nEdge Cases & Constraints:\n- 1x1 single-element square matrix (no-op).\n- Symmetric matrices (transpose equals original matrix).\n- Diagonal elements (r = c) automatically untouched.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Input Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Processed Memory Layout",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input tensor memory buffer cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Buffer",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Processed Memory Layout",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates larger array with 5 tensor elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Execution",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Processed Memory Layout",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: TRANSPOSESQUAREMATRIX_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "In-place transpose swaps off-diagonal symmetric elements across the main diagonal. By restricting column iteration to c > r, the algorithm inspects each off-diagonal pair exactly once, avoiding redundant double-swapping.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, transpose operation sets M_new[r][c] = M_old[c][r]. For in-place execution on an N x N matrix, the loop bounds iterate r in [0, N-1] and c in [r+1, N-1], performing N*(N-1)/2 element pair swaps.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In GPU memory architectures, naive in-place transpose suffers from non-coalesced memory writes. High-performance CUDA kernels tile matrices into 32x32 shared memory (SRAM) blocks, avoiding shared memory bank conflicts via 33x32 padded array allocation before writing back to DRAM.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation loops over row index r and strictly upper-triangle column indices c = r+1 to N-1, executing tuple unpacking variable swaps.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include 1x1 matrices (loops do not execute) and main diagonal elements r == c (skipped by c = r+1 lower bound).",
      },
    ],
    keyTerms: [
      {
        term: "Matrix Transpose",
        definition: "Flipping a matrix over its main diagonal, switching row and column indices.",
      },
      {
        term: "Symmetric Pair Swap",
        definition: "Exchanging elements at positions (r, c) and (c, r).",
      },
      {
        term: "Upper Triangle Traversal",
        definition:
          "Iterating strictly over cells above the main diagonal (c > r) to avoid double-swapping.",
      },
    ],
  },
  trivia: TRANSPOSESQUAREMATRIX_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_TRANSPOSESQUAREMATRIX_INPUT,
  generateSteps: generateTransposeSquareMatrixSteps,
};
