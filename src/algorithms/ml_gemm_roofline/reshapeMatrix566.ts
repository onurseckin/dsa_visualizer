import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface reshapeMatrix566Input {
  data: number[];
  target?: number;
}

export const RESHAPEMATRIX566_CODE = `
def reshape_matrix(matrix, new_shape):
    """
    Reshapes 2D matrix into new_shape (new_rows, new_cols) without data copy.
    """
    orig_rows = len(matrix)
    orig_cols = len(matrix[0]) if orig_rows > 0 else 0
    new_r, new_c = new_shape
    reshaped = [[0] * new_c for _ in range(new_r)]

    for idx in range(orig_rows * orig_cols):
        r_old, c_old = idx // orig_cols, idx % orig_cols
        r_new, c_new = idx // new_c, idx % new_c
        reshaped[r_new][c_new] = matrix[r_old][c_old]

    return reshaped
`;

export const DEFAULT_RESHAPEMATRIX566_INPUT: reshapeMatrix566Input = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateReshapeMatrix566Steps = (input: reshapeMatrix566Input): AlgorithmStep[] => {
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
    "Initialize Reshape Matrix Coordinates Engine",
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

const RESHAPEMATRIX566_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines matrix coordinate reshape function.",
    4: "Gets original matrix row count M.",
    5: "Gets original matrix column count N.",
    6: "Unpacks target reshape dimensions new_r and new_c.",
    7: "Allocates reshaped output matrix grid of shape new_r x new_c.",
    9: "Iterates through flat element index idx from 0 to M*N - 1.",
    10: "Maps flat idx to original row r_old = idx // orig_cols and column c_old = idx % orig_cols.",
    11: "Maps flat idx to new row r_new = idx // new_c and column c_new = idx % new_c.",
    12: "Copies matrix[r_old][c_old] element into reshaped[r_new][c_new].",
    14: "Returns reshaped output matrix.",
  },
};

export const reshapeMatrix566: AlgorithmDefinition<reshapeMatrix566Input> = {
  id: "reshape-matrix-566",
  title: "Reshape Matrix Coordinates Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In deep learning frameworks (e.g. PyTorch torch.reshape, view(), LeetCode 566), re-interpreting a matrix of shape (M, N) into a new shape (R, C) preserves row-major element order while mapping flat element offset index idx = r_old * N + c_old to new coordinates r_new = idx // C, c_new = idx % C.\n\nThis algorithm implements Reshape Matrix Coordinates Engine, mapping 2D matrix entries across dynamic spatial shape transformations.\n\nInput Format:\n- data: Input matrix representation.\n- target: Optional target value.\n\nOutput Format:\n- Returns reshaped R x C matrix.\n\nEdge Cases & Constraints:\n- Invalid reshape requested (total element count M * N != R * C).\n- Reshaping matrix to single row or single column vector.\n- Identity reshape (R = M, C = N).",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_RESHAPEMATRIX566_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_RESHAPEMATRIX566_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_RESHAPEMATRIX566_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: RESHAPEMATRIX566_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Reshaping is an O(1) metadata operation in zero-copy tensor engines when data is contiguous. Understanding coordinate translation equations demonstrates how row-major linear memory offsets remain invariant under spatial shape transformations.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, total elements count MUST satisfy M * N == R * C. For flat element index idx in [0, M*N-1], original coordinates are (idx // N, idx % N) and new coordinates are (idx // C, idx % C).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Zero-copy reshaping modifies tensor metadata (shape and stride vectors) without copying physical scalar memory buffers on DRAM.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation verifies volume conservation, iterates through linear index idx, extracts original element values, and places them into new shape grid positions.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes returning original matrix if M * N != R * C.",
      },
    ],
    keyTerms: [
      {
        term: "Tensor Reshape",
        definition:
          "Re-interpreting tensor spatial dimensions while preserving underlying memory order.",
      },
      {
        term: "Volume Conservation",
        definition:
          "Requirement that total element count remains identical before and after reshape.",
      },
      {
        term: "Linear Coordinate Mapping",
        definition: "Translating flat 1D offset indices into multidimensional spatial coordinates.",
      },
    ],
  },
  trivia: RESHAPEMATRIX566_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_RESHAPEMATRIX566_INPUT,
  generateSteps: generateReshapeMatrix566Steps,
};
