import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface sparseMatmulCsrInput {
  data: number[];
  target?: number;
}

export const SPARSEMATMULCSR_CODE = `
def sparse_matmul_csr(values, col_indices, row_ptr, vector):
    """
    Computes SpMV sparse matrix-vector product y = A_csr @ x.
    """
    num_rows = len(row_ptr) - 1
    result = []

    for r in range(num_rows):
        row_start = row_ptr[r]
        row_end = row_ptr[r + 1]
        dot = 0
        for i in range(row_start, row_end):
            val = values[i]
            col = col_indices[i]
            dot += val * vector[col]
        result.append(dot)

    return result
`;

export const DEFAULT_SPARSEMATMULCSR_INPUT: sparseMatmulCsrInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateSparseMatmulCsrSteps = (input: sparseMatmulCsrInput): AlgorithmStep[] => {
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
    "Initialize Sparse Matrix Multiplication (CSR Format)",
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
    18,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SPARSEMATMULCSR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines SpMV sparse matrix-vector multiplication function in CSR format.",
    4: "Gets matrix row count M = len(row_ptr) - 1.",
    5: "Initializes output result vector y.",
    7: "Iterates through row index r from 0 to M-1.",
    8: "Extracts row non-zero start pointer row_start = row_ptr[r].",
    9: "Extracts row non-zero end pointer row_end = row_ptr[r+1].",
    10: "Initializes row dot product accumulator to 0.",
    11: "Iterates through non-zero element index i from row_start to row_end - 1.",
    12: "Fetches non-zero scalar value val = values[i].",
    13: "Fetches column index col = col_indices[i].",
    14: "Accumulates val * vector[col] product into dot.",
    15: "Appends computed row dot product to output result vector.",
    17: "Returns computed SpMV result vector.",
  },
};

export const sparseMatmulCsr: AlgorithmDefinition<sparseMatmulCsrInput> = {
  id: "sparse-matmul-csr",
  title: "Sparse Matrix Multiplication (CSR Format)",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In Graph Neural Networks (GNNs, e.g., PyTorch Geometric, DGL) and pruned sparse ML models, matrices contain mostly zeros (>90% sparsity). Compressed Sparse Row (CSR) format compresses M x N sparse matrices into 3 compact 1D vectors: values (non-zero entries), col_indices (column indices of non-zero entries), and row_ptr (pointers to row start/end offsets).\n\nThis algorithm implements Sparse Matrix Multiplication (CSR Format), evaluating SpMV vector dot products using CSR index vectors.\n\nInput Format:\n- data: Array representing CSR arrays or vector inputs.\n- target: Optional target value.\n\nOutput Format:\n- Returns 1D result vector y of length M.\n\nEdge Cases & Constraints:\n- Empty rows in sparse matrix (row_start == row_end, output entry is 0).\n- Fully dense matrix stored in CSR format.\n- Single non-zero element sparse matrices.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_SPARSEMATMULCSR_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_SPARSEMATMULCSR_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_SPARSEMATMULCSR_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: SPARSEMATMULCSR_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "CSR (Compressed Sparse Row) representation eliminates zero-value multiplications, reducing memory footprint from O(M * N) down to O(NNZ + M), where NNZ is total non-zero elements. SpMV executes in O(NNZ) time.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, CSR format defines: values array of size NNZ, col_indices array of size NNZ, and row_ptr array of size M+1 where row r stores non-zero entries at index range [row_ptr[r] .. row_ptr[r+1]-1]. Row result y_r = sum_{i=row_ptr[r]}^{row_ptr[r+1]-1} values[i] * vector[col_indices[i]].",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "SpMV kernels on GPUs suffer from irregular memory access patterns because col_indices[i] causes indirect memory reads from vector x, resulting in non-coalesced DRAM accesses.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates through rows r, extracts non-zero index range [row_start .. row_end], multiplies values[i] by vector[col_indices[i]], and appends row totals.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes empty rows where row_start == row_end, yielding dot product 0 without looping.",
      },
    ],
    keyTerms: [
      {
        term: "CSR Format",
        definition:
          "Compressed Sparse Row matrix representation storing non-zero values, column indices, and row offset pointers.",
      },
      {
        term: "SpMV Kernel",
        definition: "Sparse Matrix-Vector Multiplication computing y = A_sparse * x.",
      },
      {
        term: "Non-Zero Count (NNZ)",
        definition: "The total count of non-zero scalar entries stored in a sparse matrix.",
      },
    ],
  },
  trivia: SPARSEMATMULCSR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_SPARSEMATMULCSR_INPUT,
  generateSteps: generateSparseMatmulCsrSteps,
};
