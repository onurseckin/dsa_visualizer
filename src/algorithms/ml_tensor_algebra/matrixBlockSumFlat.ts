import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface matrixBlockSumFlatInput {
  data: number[];
  target?: number;
}

export const MATRIXBLOCKSUMFLAT_CODE = `
def matrix_block_sum_flat(matrix, k):
    """
    Computes k-radius submatrix block sum using 2D prefix sums.
    """
    rows = len(matrix)
    cols = len(matrix[0]) if rows > 0 else 0
    prefix = [[0] * (cols + 1) for _ in range(rows + 1)]

    for r in range(rows):
        for c in range(cols):
            prefix[r+1][c+1] = matrix[r][c] + prefix[r][c+1] + prefix[r+1][c] - prefix[r][c]

    result = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        for c in range(cols):
            r1, c1 = max(0, r - k), max(0, c - k)
            r2, c2 = min(rows - 1, r + k), min(cols - 1, c + k)
            result[r][c] = prefix[r2+1][c2+1] - prefix[r1][c2+1] - prefix[r2+1][c1] + prefix[r1][c1]

    return result
`;

export const DEFAULT_MATRIXBLOCKSUMFLAT_INPUT: matrixBlockSumFlatInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMatrixBlockSumFlatSteps = (
  input: matrixBlockSumFlatInput,
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
    "Initialize Submatrix Block Sum with 2D Prefix Array",
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
    20,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MATRIXBLOCKSUMFLAT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines submatrix block sum function.",
    4: "Determines matrix row count.",
    5: "Determines matrix column count.",
    6: "Allocates (rows+1) x (cols+1) prefix sum integral matrix initialized to zero.",
    8: "Iterates through rows to construct 2D prefix sum array.",
    10: "Applies 2D prefix sum recurrence: current + top + left - top_left.",
    13: "Allocates result matrix of shape rows x cols.",
    14: "Iterates through cells to query k-radius submatrix sums.",
    16: "Clamps boundary coordinates [r1..r2, c1..c2] within grid limits.",
    18: "Evaluates 4-corner submatrix sum query: P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1].",
    20: "Returns computed submatrix block sum matrix.",
  },
};

export const matrixBlockSumFlat: AlgorithmDefinition<matrixBlockSumFlatInput> = {
  id: "matrix-block-sum-flat",
  title: "Submatrix Block Sum with 2D Prefix Array",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In computer vision feature pooling, spatial box filters, and attention region calculations, computing the sum of elements in a k-radius submatrix window around every cell (r, c) naively takes O(M * N * K^2) time. Using a 2D prefix sum (summed-area table), region sum queries execute in O(1) constant time, reducing total execution complexity to O(M * N).\n\nThis algorithm implements Submatrix Block Sum with 2D Prefix Array, building an (M+1) x (N+1) integral image prefix table and evaluating submatrix sums with 4-corner inclusion-exclusion arithmetic.\n\nInput Format:\n- data: Flat array or grid values.\n- target: Optional scalar value target.\n\nOutput Format:\n- Returns 2D matrix containing k-radius submatrix sum totals for every grid position.\n\nEdge Cases & Constraints:\n- Corner cells where k-radius extends beyond grid boundaries (clamped via min/max).\n- k radius larger than total matrix dimensions.\n- 1x1 matrix buffers.",
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
  code: MATRIXBLOCKSUMFLAT_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "2D Prefix Sums (Integral Images) are widely used in deep learning spatial pooling, box blurring kernels, and 2D bounding box feature extraction. By performing O(M * N) pre-computation, any submatrix rectangle sum can be calculated with just 4 array lookups and 3 additions/subtractions.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, integral image P[r+1][c+1] stores sum(matrix[i][j]) for 0 <= i <= r and 0 <= j <= c. The recurrence relation is P[r+1][c+1] = matrix[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]. Submatrix sum over rectangle [r1..r2, c1..c2] is given by P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1].",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In GPU vision kernels, constructing 2D prefix sums utilizes parallel scan algorithms (Blelloch or Hillis-Steele) across rows then columns, running in O(log M + log N) parallel steps in SRAM.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation constructs an auxiliary (rows+1) x (cols+1) prefix grid, populates integral sums, and queries submatrix regions while clamping boundary coordinates r1, c1, r2, c2 using min/max logic.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include k = 0 (returning original matrix values) and k >= max(M, N) (where every cell receives total matrix sum).",
      },
    ],
    keyTerms: [
      {
        term: "Integral Image",
        definition:
          "A 2D array representation where each cell stores the sum of all elements above and to the left.",
      },
      {
        term: "Inclusion-Exclusion Principle",
        definition:
          "Calculating region sums by adding overlapping areas and subtracting double-counted intersections.",
      },
      {
        term: "Submatrix Window",
        definition: "The rectangular sub-grid defined by bounding coordinates [r1..r2, c1..c2].",
      },
    ],
  },
  trivia: MATRIXBLOCKSUMFLAT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_MATRIXBLOCKSUMFLAT_INPUT,
  generateSteps: generateMatrixBlockSumFlatSteps,
};
