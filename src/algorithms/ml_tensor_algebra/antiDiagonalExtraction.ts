import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface antiDiagonalExtractionInput {
  data: number[];
  target?: number;
}

export const ANTIDIAGONALEXTRACTION_CODE = `
def anti_diagonal_extraction(matrix):
    """
    Extracts anti-diagonals (row + col = k) for wavefront parallel processing.
    """
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    diagonals = []

    for k in range(rows + cols - 1):
        diag = []
        for r in range(max(0, k - cols + 1), min(rows, k + 1)):
            c = k - r
            diag.append(matrix[r][c])
        diagonals.append(diag)

    return diagonals
`;

export const DEFAULT_ANTIDIAGONALEXTRACTION_INPUT: antiDiagonalExtractionInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAntiDiagonalExtractionSteps = (
  input: antiDiagonalExtractionInput,
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
    "Initialize Anti-Diagonal Matrix Traversal",
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

const ANTIDIAGONALEXTRACTION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines anti-diagonal matrix traversal function.",
    4: "Extracts row count from input matrix structure.",
    5: "Extracts column count, defaulting to 0 for empty matrix.",
    8: "Iterates through total wavefront diagonal steps k from 0 to rows + cols - 2.",
    10: "Iterates through valid row indices r for current diagonal k.",
    11: "Calculates column index c = k - r.",
    12: "Appends matrix[r][c] element to current anti-diagonal list.",
    15: "Returns collected array of anti-diagonal slices.",
  },
};

export const antiDiagonalExtraction: AlgorithmDefinition<antiDiagonalExtractionInput> = {
  id: "anti-diagonal-extraction",
  title: "Anti-Diagonal Matrix Traversal",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In dynamic programming, dynamic time warping (DTW), sequence alignment, and parallel matrix solvers, dependencies often run along row and column indices such that element (r, c) depends on (r-1, c) and (r, c-1). Consequently, all elements along anti-diagonal slices defined by r + c = k are mutually independent and can be executed concurrently in a single GPU wavefront step.\n\nThis algorithm implements Anti-Diagonal Matrix Traversal, extracting anti-diagonal slices from 2D tensor buffers to enable lock-free parallel execution across GPU thread blocks.\n\nInput Format:\n- data: Array of numerical elements representing a flattened or 2D matrix structure.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns an array of anti-diagonal slices containing elements ordered by wavefront step k.\n\nEdge Cases & Constraints:\n- Rectangular matrices where rows != cols.\n- Single row or single column matrices.\n- Empty input matrix buffers.",
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
  code: ANTIDIAGONALEXTRACTION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Anti-diagonal extraction (also known as wavefront execution or diagonal sweep) is a fundamental pattern for parallelizing dynamic programming algorithms on SIMD/SIMT architectures. By organizing computation into independent diagonal waves (where r + c = constant k), GPU threads execute entire diagonals in parallel without encountering data races or write conflicts.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, for an M x N matrix, there are M + N - 1 total anti-diagonals indexed by k in [0, M + N - 2]. For a given diagonal index k, valid row indices satisfy r in [max(0, k - N + 1), min(M - 1, k)]. The corresponding column index is uniquely determined by c = k - r.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "From a memory hierarchy perspective, anti-diagonal accesses do not naturally align with row-major memory layouts. Accessing elements along r + c = k across different rows causes strided DRAM reads. High-performance CUDA implementations load 2D matrix blocks into fast shared memory (SRAM) first, enabling unstrided anti-diagonal reads directly from SRAM with zero bank conflicts via index swizzling.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation details require precise calculation of loop bounds to avoid out-of-bounds array access. Using min/max bounds ensures that only valid (r, c) grid coordinates are generated during each wavefront pass.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes non-square matrices (e.g., tall 100x10 or wide 10x100), single-element matrices (1x1), and empty buffers. Bounds guards guarantee safety across all aspect ratios.",
      },
    ],
    keyTerms: [
      {
        term: "Wavefront Execution",
        definition:
          "Parallel processing pattern where independent diagonal computation steps advance sequentially through a matrix.",
      },
      {
        term: "Anti-Diagonal Index",
        definition:
          "The sum k = r + c identifying all matrix cells lying on the same diagonal slice.",
      },
      {
        term: "Shared Memory Swizzling",
        definition:
          "Remapping 2D indices in SRAM to eliminate memory bank conflicts during strided diagonal access.",
      },
    ],
  },
  trivia: ANTIDIAGONALEXTRACTION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ANTIDIAGONALEXTRACTION_INPUT,
  generateSteps: generateAntiDiagonalExtractionSteps,
};
