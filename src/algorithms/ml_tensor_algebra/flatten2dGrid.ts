import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flatten2dGridInput {
  data: number[];
  target?: number;
}

export const FLATTEN2DGRID_CODE = `
def flatten_2d_grid(grid):
    """
    Flattens a 2D matrix into a 1D contiguous row-major memory buffer.
    """
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    flat_buffer = []

    for r in range(rows):
        for c in range(cols):
            flat_idx = r * cols + c
            flat_buffer.append((flat_idx, grid[r][c]))

    return flat_buffer
`;

export const DEFAULT_FLATTEN2DGRID_INPUT: flatten2dGridInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFlatten2dGridSteps = (input: flatten2dGridInput): AlgorithmStep[] => {
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
    "Initialize Flatten 2D Grid into 1D Contiguous Buffer",
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

const FLATTEN2DGRID_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines 2D grid flattening function.",
    4: "Determines row count M.",
    5: "Determines column count N.",
    8: "Iterates through row index r.",
    9: "Iterates through column index c.",
    10: "Calculates flat 1D memory index = r * cols + c.",
    11: "Appends linear index tuple (flat_idx, val) to flat_buffer.",
    13: "Returns flattened contiguous memory buffer.",
  },
};

export const flatten2dGrid: AlgorithmDefinition<flatten2dGridInput> = {
  id: "flatten-2d-grid",
  title: "Flatten 2D Grid into 1D Contiguous Buffer",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "Deep learning frameworks store multi-dimensional tensors as contiguous 1D memory buffers on CPU/GPU DRAM. Translating 2D grid coordinates (row, col) into 1D physical addresses flat_idx = row * cols + col is the standard row-major memory mapping convention.\n\nThis algorithm implements Flatten 2D Grid into 1D Contiguous Buffer, serializing 2D matrix elements into flat linear memory buffers while recording row-major index calculations.\n\nInput Format:\n- data: 1D array representing a flattened matrix or raw input array.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns an array of (flat_idx, val) tuples preserving row-major ordering.\n\nEdge Cases & Constraints:\n- 1x1 single element matrices.\n- Empty 2D grids (rows = 0 or cols = 0).\n- Asymmetric matrix dimensions (rows != cols).",
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
  code: FLATTEN2DGRID_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Row-major memory linearization is fundamental to C/C++, PyTorch, and CUDA memory layouts. When a 2D matrix is passed to a GPU kernel, it resides in memory as a single contiguous array. Knowing how row-major indexing maps (r, c) coordinates to linear offsets is essential for writing custom ML kernels.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For a 2D matrix of shape M x N, element (r, c) maps to physical linear index I = r * N + c. Inverse mapping reconstructs row and column coordinates via r = I // N and c = I mod N.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Row-major flattening enables sequential memory reads during matrix iteration. Continuous sequential access allows GPU memory controllers to issue coalesced 128-bit memory transactions, maximizing memory bandwidth utilization.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates row-by-row, column-by-column, appending linearized index tuples into a 1D result buffer.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes single-row matrices (cols stride = N), single-column matrices (cols stride = 1), and zero-sized empty grids.",
      },
    ],
    keyTerms: [
      {
        term: "Row-Major Order",
        definition:
          "Memory storage layout where consecutive elements of a matrix row are stored in contiguous memory addresses.",
      },
      {
        term: "Linearization",
        definition:
          "Mapping multidimensional grid coordinates into a 1D linear physical memory offset.",
      },
      {
        term: "Stride Arithmetic",
        definition:
          "Mathematical formula (r * cols + c) converting 2D spatial coordinates into 1D memory pointers.",
      },
    ],
  },
  trivia: FLATTEN2DGRID_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_FLATTEN2DGRID_INPUT,
  generateSteps: generateFlatten2dGridSteps,
};
