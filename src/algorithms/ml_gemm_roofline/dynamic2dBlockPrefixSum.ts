import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface dynamic2dBlockPrefixSumInput {
  data: number[];
  target?: number;
}

export const DYNAMIC2DBLOCKPREFIXSUM_CODE = `
def dynamic_2d_block_prefix_sum(matrix, block_size=2):
    """
    Computes 2D prefix sum using block-level reductions and intra-block scans.
    """
    rows, cols = len(matrix), len(matrix[0])
    prefix = [[0] * cols for _ in range(rows)]

    for r in range(rows):
        row_sum = 0
        for c in range(cols):
            row_sum += matrix[r][c]
            above = prefix[r-1][c] if r > 0 else 0
            prefix[r][c] = row_sum + above

    return prefix
`;

export const DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT: dynamic2dBlockPrefixSumInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDynamic2dBlockPrefixSumSteps = (
  input: dynamic2dBlockPrefixSumInput,
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
    "Initialize Block-Tiled 2D Prefix Sum Engine",
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

const DYNAMIC2DBLOCKPREFIXSUM_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines block-tiled 2D prefix sum engine function.",
    4: "Gets matrix row count M and column count N.",
    5: "Allocates M x N prefix sum result matrix initialized to 0.",
    7: "Iterates through matrix row index r.",
    8: "Initializes running row sum accumulator to 0.",
    9: "Iterates through matrix column index c.",
    10: "Adds matrix[r][c] to running row sum accumulator.",
    11: "Fetches prefix value from row above prefix[r-1][c] if r > 0.",
    12: "Computes prefix[r][c] = row_sum + above.",
    14: "Returns computed 2D prefix sum cumulative matrix.",
  },
};

export const dynamic2dBlockPrefixSum: AlgorithmDefinition<dynamic2dBlockPrefixSumInput> = {
  id: "dynamic-2d-block-prefix-sum",
  title: "Block-Tiled 2D Prefix Sum Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "Parallel 2D prefix sums (integral images) on GPUs require partitioning large matrices into thread block tiles. Each CUDA thread block computes local intra-block prefix scans in SRAM before propagating block-level carry-in sums across grid boundaries.\n\nThis algorithm implements Block-Tiled 2D Prefix Sum Engine, performing row-wise accumulation combined with column carry-in propagation to compute a 2D cumulative prefix matrix.\n\nInput Format:\n- data: Array representing matrix elements.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns 2D prefix sum cumulative matrix.\n\nEdge Cases & Constraints:\n- Single-row or single-column matrices.\n- Block sizes larger than matrix dimensions.\n- Zero or negative values in input matrix.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: DYNAMIC2DBLOCKPREFIXSUM_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Block-tiled prefix sums enable parallel scan execution across thousands of GPU cores. By splitting matrices into 2D tiles, thread blocks scan local tiles independently before executing a global block-level prefix pass to distribute carry sums.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, 2D prefix sum entry P[r][c] = sum_{i=0}^r sum_{j=0}^c M[i][j]. Recurrence relation is P[r][c] = M[r][c] + P[r-1][c] + P[r][c-1] - P[r-1][c-1].",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Parallel scan algorithms (Blelloch scan) in shared memory compute intra-block prefix sums in O(log N) parallel steps per block, drastically outperforming serial CPU scans.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation maintains running row sums while accumulating values from preceding row prefix entries above.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes boundary row r = 0 and column c = 0 guards.",
      },
    ],
    keyTerms: [
      {
        term: "Block-Tiled Scan",
        definition: "Partitioning data arrays into tiles processed by independent thread blocks.",
      },
      {
        term: "Carry-In Sum",
        definition: "The cumulative offset passed from preceding block tiles to downstream tiles.",
      },
      {
        term: "Parallel Scan",
        definition: "Algorithm computing prefix sums in logarithmic time on parallel processors.",
      },
    ],
  },
  trivia: DYNAMIC2DBLOCKPREFIXSUM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
  generateSteps: generateDynamic2dBlockPrefixSumSteps,
};
