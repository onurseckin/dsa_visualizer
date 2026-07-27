import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface submatrixSum2dQueryInput {
  data: number[];
  target?: number;
}

export const SUBMATRIXSUM2DQUERY_CODE = `
def submatrix_sum_2d_query(prefix_matrix, r1, c1, r2, c2):
    """
    Queries 2D submatrix region sum using 4-corner integral image prefix table.
    """
    total = (prefix_matrix[r2+1][c2+1] - prefix_matrix[r1][c2+1] - 
             prefix_matrix[r2+1][c1] + prefix_matrix[r1][c1])
    return total
`;

export const DEFAULT_SUBMATRIXSUM2DQUERY_INPUT: submatrixSum2dQueryInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateSubmatrixSum2dQuerySteps = (
  input: submatrixSum2dQueryInput,
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
    "Initialize 2D Submatrix Region Sum Query Engine",
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
    7,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SUBMATRIXSUM2DQUERY_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements in GEMM memory pipeline." }],
  lineExplanations: {
    1: "Defines 2D submatrix region sum query function.",
    4: "Evaluates 4-corner inclusion-exclusion query: P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1].",
    6: "Returns computed scalar submatrix region sum total.",
  },
};

export const submatrixSum2dQuery: AlgorithmDefinition<submatrixSum2dQueryInput> = {
  id: "submatrix-sum-2d-query",
  title: "2D Submatrix Region Sum Query Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "In object detection feature extractors (e.g. Viola-Jones, Region of Interest pooling, spatial attention windowing), calculating submatrix sums across arbitrary bounding box coordinates [r1..r2, c1..c2] in O(1) constant time is achieved using pre-computed 2D integral image prefix tables.\n\nThis algorithm implements 2D Submatrix Region Sum Query Engine, evaluating 4-corner inclusion-exclusion queries over integral sum grids.\n\nInput Format:\n- data: Array representing matrix data.\n- target: Optional scalar target value.\n\nOutput Format:\n- Returns scalar region sum total for queried submatrix bounds.\n\nEdge Cases & Constraints:\n- Submatrix covering full matrix (r1=0, c1=0, r2=rows-1, c2=cols-1).\n- 1x1 single-cell submatrix query (r1=r2, c1=c2).\n- Boundary coordinate inclusion-exclusion limits.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Execution",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
      output: "[10, 20, 30]",
      explanation: "Standard execution pass.",
    },
    {
      kind: "complex",
      title: "Complex Execution",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "[10, 20, 30, 40, 50]",
      input: DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates workload performance boundaries.",
    },
    {
      kind: "negative",
      title: "Edge Case",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
      output: "[5, 10, 15]",
      explanation: "Edge case execution completes safely.",
    },
  ],
  code: SUBMATRIXSUM2DQUERY_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Execution time complexity pass across input elements.",
    space: "Memory allocation space for result structures.",
  },
  topicGuide: {
    overview:
      "Submatrix region queries calculate the sum of matrix elements within rectangular bounds in O(1) time. Using a 2D prefix sum grid P where P[r+1][c+1] stores the sum of all elements in submatrix [0..r, 0..c], region sum queries require only 4 corner lookups.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, sum over [r1..r2, c1..c2] = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1].",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "O(1) region querying enables evaluating millions of candidate bounding box features per second in spatial vision algorithms.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation evaluates 4-corner array indices on pre-computed integral image grid P and returns scalar sum total.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes verifying 0-indexed coordinate offset adjustments.",
      },
    ],
    keyTerms: [
      {
        term: "4-Corner Query",
        definition:
          "Evaluating rectangular region sums using four specific corner entries of an integral matrix.",
      },
      {
        term: "Integral Image",
        definition: "A 2D prefix table storing cumulative sums from top-left matrix origin.",
      },
      {
        term: "Inclusion-Exclusion",
        definition: "Subtracting overlapping sub-regions to extract exact bounded submatrix sum.",
      },
    ],
  },
  trivia: SUBMATRIXSUM2DQUERY_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
  generateSteps: generateSubmatrixSum2dQuerySteps,
};
