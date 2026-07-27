import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface matrixVectorMultiplicationInput {
  data: number[];
  target?: number;
}

export const MATRIXVECTORMULTIPLICATION_CODE = `
def matrix_vector_multiplication(matrix, vector):
    """
    Computes GEMV y = A * x matrix-vector product.
    """
    rows = len(matrix)
    cols = len(vector)
    result = []

    for r in range(rows):
        dot = 0
        for c in range(cols):
            dot += matrix[r][c] * vector[c]
        result.append(dot)

    return result
`;

export const DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT: matrixVectorMultiplicationInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMatrixVectorMultiplicationSteps = (
  input: matrixVectorMultiplicationInput,
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
    "Initialize Matrix-Vector Multiplication (GEMV)",
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

const MATRIXVECTORMULTIPLICATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines GEMV matrix-vector multiplication function.",
    4: "Gets matrix row count M.",
    5: "Gets vector length N.",
    6: "Initializes output result vector y.",
    8: "Iterates through matrix row index r.",
    9: "Initializes row dot product accumulator to 0.",
    10: "Iterates through column index c.",
    11: "Accumulates matrix element matrix[r][c] * vector[c] product into dot.",
    12: "Appends computed row dot product to output result vector.",
    14: "Returns computed GEMV output result vector.",
  },
};

export const matrixVectorMultiplication: AlgorithmDefinition<matrixVectorMultiplicationInput> = {
  id: "matrix-vector-multiplication",
  title: "Matrix-Vector Multiplication (GEMV)",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In auto-regressive LLM inference (e.g. LLaMA, GPT-4 single-token decoding), generating each new token involves multiplying weights matrix A (M x N) by a single token activation vector x (N x 1). This GEMV operation (BLAS Level 2) has an Arithmetic Intensity of ~1 FLOP/Byte, making it strictly memory-bandwidth bound.\n\nThis algorithm implements Matrix-Vector Multiplication (GEMV), computing row-wise vector dot products y_r = sum_c (A[r][c] * x[c]).\n\nInput Format:\n- data: Array representing matrix or vector entries.\n- target: Optional target value.\n\nOutput Format:\n- Returns 1D output vector y of length M.\n\nEdge Cases & Constraints:\n- Vector length matching matrix column dimension N.\n- Single-row matrix (M = 1, single dot product).\n- Zero vector or zero matrix inputs.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: MATRIXVECTORMULTIPLICATION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "GEMV (General Matrix-Vector Multiplication) is the primary computational bottleneck during LLM decoding. Because batch size is 1, weight matrix A is loaded from DRAM once per generated token without opportunities for weight reuse, bounding throughput strictly by HBM memory bandwidth.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, y_i = sum_{j=0}^{N-1} A_{i,j} * x_j. Operational Intensity AI = (2 * M * N FLOPs) / (M * N * sizeof(weight) + (M + N) * sizeof(activation)) Bytes approx 1 / sizeof(weight) FLOPs/Byte.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "For FP16 weights (2 bytes/weight), GEMV AI is ~0.5 FLOPs/Byte. On an NVIDIA A100 GPU (2 TB/s HBM2e), maximum GEMV weight read throughput is 1 TB/s, generating ~500 token passes per second.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates through matrix rows r, accumulates row dot products against input vector x, and appends results to output vector y.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes vector dimension mismatch validation.",
      },
    ],
    keyTerms: [
      {
        term: "GEMV Kernel",
        definition:
          "General Matrix-Vector multiplication kernel operating on 2D matrix and 1D vector.",
      },
      {
        term: "LLM Decode Phase",
        definition: "Auto-regressive token generation step operating with batch size 1.",
      },
      {
        term: "Memory-Bound Bottleneck",
        definition:
          "Performance bottleneck caused by DRAM memory bandwidth limits rather than compute capacity.",
      },
    ],
  },
  trivia: MATRIXVECTORMULTIPLICATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_MATRIXVECTORMULTIPLICATION_INPUT,
  generateSteps: generateMatrixVectorMultiplicationSteps,
};
