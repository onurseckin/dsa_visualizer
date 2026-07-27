import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flatten2dArrayInput {
  data: number[];
  target?: number;
}

export const FLATTEN2DARRAY_CODE = `
def flatten_2d_array(matrix):
    """
    Linearizes 2D row-major matrix into contiguous 1D memory array.
    """
    flat = []
    for row in matrix:
        for val in row:
            flat.append(val)
    return flat
`;

export const DEFAULT_FLATTEN2DARRAY_INPUT: flatten2dArrayInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFlatten2dArraySteps = (input: flatten2dArrayInput): AlgorithmStep[] => {
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
    "Initialize 1D Buffer Matrix Flattening",
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

const FLATTEN2DARRAY_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines 1D matrix flattening function.",
    4: "Initializes 1D flat memory result array.",
    5: "Iterates through rows in input matrix.",
    6: "Iterates through scalar values in current row.",
    7: "Appends scalar value to flat array.",
    8: "Returns flattened 1D contiguous memory array.",
  },
};

export const flatten2dArray: AlgorithmDefinition<flatten2dArrayInput> = {
  id: "flatten-2d-array",
  title: "1D Buffer Matrix Flattening",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "Preparing matrix data for BLAS GEMM calls (e.g. cuBLAS sgemm, PyTorch tensor memory flattening) requires serializing 2D grid structures into 1D contiguous memory buffers.\n\nThis algorithm implements 1D Buffer Matrix Flattening, iterating through matrix rows and serializing scalar values into a 1D flat memory payload buffer.\n\nInput Format:\n- data: Array representing 2D matrix structure.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns 1D flat linear array containing all matrix elements in row-major order.\n\nEdge Cases & Constraints:\n- Empty matrix buffers.\n- Single row or single column matrices.\n- Asymmetric matrix dimensions.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_FLATTEN2DARRAY_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_FLATTEN2DARRAY_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_FLATTEN2DARRAY_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: FLATTEN2DARRAY_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Matrix flattening converts 2D array representation into 1D continuous memory buffers required by hardware BLAS subroutines. Row-major order ensures row elements occupy consecutive memory addresses.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For an M x N matrix, element (r, c) maps to 1D flat index idx = r * N + c. Total serialized length is M * N.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Contiguous 1D buffers maximize SIMD vector instruction efficiency and GPU HBM memory coalescing during matrix operations.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation loops row-by-row, column-by-column, appending each element into a flat 1D array.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes 1x1 matrices and zero-sized empty grids.",
      },
    ],
    keyTerms: [
      {
        term: "Buffer Linearization",
        definition: "Converting multidimensional grid structures into a 1D flat array.",
      },
      {
        term: "Row-Major Order",
        definition: "Storing elements of consecutive row entries in contiguous physical memory.",
      },
      {
        term: "Memory Alignment",
        definition: "Ensuring 1D buffer start pointers align with hardware SIMD boundaries.",
      },
    ],
  },
  trivia: FLATTEN2DARRAY_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_FLATTEN2DARRAY_INPUT,
  generateSteps: generateFlatten2dArraySteps,
};
