import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface virtualMatrixAdditionZeroStrideInput {
  data: number[];
  target?: number;
}

export const VIRTUALMATRIXADDITIONZEROSTRIDE_CODE = `
def virtual_matrix_addition_zero_stride(matrix, row_vec):
    """
    Adds 1D vector to 2D matrix rows using zero-stride virtual broadcasting.
    """
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    result = []

    for r in range(rows):
        row_res = []
        for c in range(cols):
            val = matrix[r][c] + row_vec[c]
            row_res.append(val)
        result.append(row_res)

    return result
`;

export const DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT: virtualMatrixAdditionZeroStrideInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVirtualMatrixAdditionZeroStrideSteps = (
  input: virtualMatrixAdditionZeroStrideInput,
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
    "Initialize Zero-Stride Broadcasting Matrix Addition",
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

const VIRTUALMATRIXADDITIONZEROSTRIDE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines zero-stride broadcasting matrix addition function.",
    4: "Gets matrix row count M.",
    5: "Gets matrix column count N.",
    8: "Iterates through matrix row index r.",
    10: "Iterates through matrix column index c.",
    11: "Adds matrix element matrix[r][c] and broadcasted vector element row_vec[c].",
    12: "Appends element sum val to current result row.",
    14: "Returns computed broadcasted matrix sum.",
  },
};

export const virtualMatrixAdditionZeroStride: AlgorithmDefinition<virtualMatrixAdditionZeroStrideInput> =
  {
    id: "virtual-matrix-addition-zero-stride",
    title: "Zero-Stride Broadcasting Matrix Addition",
    category: "ml_tensor_algebra",
    categories: ["ml_tensor_algebra", "arrays_and_hashing"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 1,
    mlInfraCategory: "ml_tensor_algebra",
    description:
      "In deep learning bias addition (e.g. PyTorch Y = X + b in linear layers), a 1D bias vector of shape (N,) is added to every row of an M x N matrix. Rather than copying the 1D bias vector M times to create an M x N matrix, PyTorch uses zero-stride broadcasting: the row stride of the bias tensor is set to 0.\n\nThis algorithm implements Zero-Stride Broadcasting Matrix Addition, performing element-wise addition between a 2D matrix and a broadcasted 1D row vector without memory duplication.\n\nInput Format:\n- data: Array representing matrix or bias values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns M x N matrix containing element-wise sum totals.\n\nEdge Cases & Constraints:\n- Matrix with single row (M = 1).\n- 1D vector length matching matrix column count N.\n- Zero-stride memory address resolution.",
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
    code: VIRTUALMATRIXADDITIONZEROSTRIDE_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for result structures.",
    },
    topicGuide: {
      overview:
        "Broadcasting allows arithmetic operations on tensors of different shapes without allocating intermediate expanded memory buffers. Setting a dimension's stride to 0 causes pointer calculations to re-read identical scalar values repeatedly without physical memory copy overhead.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, for matrix A of shape M x N and row vector B of shape N, zero-stride expansion defines virtual tensor B' of shape M x N with strides (s_row=0, s_col=1). Element (r, c) is computed as C[r][c] = A[r][c] + B[c].",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Zero-stride broadcasting saves O(M * N) DRAM allocations. In CUDA kernels, thread blocks read vector B into shared memory (SRAM) once, reusing bias values across all M rows to maximize HBM memory bandwidth.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation iterates over matrix rows r and columns c, computing sum = matrix[r][c] + row_vec[c], appending results to output rows.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes 1x1 matrices and column vector broadcasting (where column stride is set to 0).",
        },
      ],
      keyTerms: [
        {
          term: "Zero-Stride Broadcasting",
          definition:
            "Setting a tensor dimension stride to 0 to virtually expand a tensor without memory copy.",
        },
        {
          term: "Bias Addition",
          definition: "Adding a 1D feature bias vector to every sample row in a batch matrix.",
        },
        {
          term: "Virtual Tensor View",
          definition:
            "An expanded logical tensor view sharing physical memory storage with smaller tensors.",
        },
      ],
    },
    trivia: VIRTUALMATRIXADDITIONZEROSTRIDE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
    defaultInput: DEFAULT_VIRTUALMATRIXADDITIONZEROSTRIDE_INPUT,
    generateSteps: generateVirtualMatrixAdditionZeroStrideSteps,
  };
