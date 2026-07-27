import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface validNeighborGridBoundsInput {
  data: number[];
  target?: number;
}

export const VALIDNEIGHBORGRIDBOUNDS_CODE = `
def valid_neighbor_grid_bounds(rows, cols, r, c):
    """
    Extracts valid 4-directional adjacent neighbor coordinates within grid bounds.
    """
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    valid_neighbors = []

    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            valid_neighbors.append((nr, nc))

    return valid_neighbors
`;

export const DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT: validNeighborGridBoundsInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateValidNeighborGridBoundsSteps = (
  input: validNeighborGridBoundsInput,
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
    "Initialize Valid 2D Grid Neighbor Bounds Check",
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
    13,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VALIDNEIGHBORGRIDBOUNDS_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines valid 2D grid neighbor bounds check function.",
    4: "Defines 4 orthogonal directional movement offset vectors.",
    5: "Initializes list for valid neighbor coordinate tuples.",
    7: "Iterates through directional movement offsets dr, dc.",
    8: "Calculates candidate neighbor row nr and column nc.",
    9: "Checks if candidate coordinates satisfy 0 <= nr < rows and 0 <= nc < cols.",
    10: "Appends valid neighbor tuple (nr, nc) to result list.",
    12: "Returns list of valid adjacent grid neighbor tuples.",
  },
};

export const validNeighborGridBounds: AlgorithmDefinition<validNeighborGridBoundsInput> = {
  id: "valid-neighbor-grid-bounds",
  title: "Valid 2D Grid Neighbor Bounds Check",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In grid-based spatial algorithms (e.g. 2D convolution padding guards, flood fill, graph grid traversal, game AI pathfinding), checking neighbor cell validity against grid boundaries (0 <= nr < rows and 0 <= nc < cols) prevents illegal memory access out-of-bounds exceptions.\n\nThis algorithm implements Valid 2D Grid Neighbor Bounds Check, evaluating 4-directional orthogonal direction offsets (up, down, left, right) from target coordinate (r, c) and filtering valid grid neighbor pairs.\n\nInput Format:\n- data: Array representing grid dimensions or coordinates.\n- target: Optional target value.\n\nOutput Format:\n- Returns list of valid (nr, nc) adjacent neighbor coordinate tuples.\n\nEdge Cases & Constraints:\n- Center cell in interior of grid (all 4 neighbors valid).\n- Corner cell (e.g. (0,0), only 2 neighbors valid).\n- Edge cell (e.g. top row, 3 neighbors valid).",
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
  code: VALIDNEIGHBORGRIDBOUNDS_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Boundary checking is an indispensable safety check in grid image processing and stencil kernels. GPU kernels use explicit conditional guards or clamped boundary address modes (e.g. CUDA texture memory clamping) to protect against illegal DRAM out-of-bounds reads.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For a grid of size M x N and focal point (r, c), candidate neighbors are generated via (r + dr, c + dc) for dr, dc in {(-1,0), (1,0), (0,-1), (0,1)}. A candidate (nr, nc) is valid iff 0 <= nr < M and 0 <= nc < N.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In high-performance C++/CUDA stencil codes, branch divergence caused by boundary IF checks is minimized by handling boundary halo cells in separate specialized boundary block kernels.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates over orthogonal direction vectors, computes candidate neighbor coordinates, checks range bounds, and appends valid coordinate tuples.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes 1x1 grids (0 valid neighbors) and points positioned outside grid bounds.",
      },
    ],
    keyTerms: [
      {
        term: "Orthogonal Directions",
        definition:
          "The 4 cardinally adjacent direction vectors: Up (-1,0), Down (1,0), Left (0,-1), Right (0,1).",
      },
      {
        term: "Boundary Guard",
        definition: "Conditional logic verifying indices lie strictly within [0, bound-1].",
      },
      {
        term: "Halo Cells",
        definition:
          "Boundary padding regions added around matrix grids to simplify neighbor stencil computation.",
      },
    ],
  },
  trivia: VALIDNEIGHBORGRIDBOUNDS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT,
  generateSteps: generateValidNeighborGridBoundsSteps,
};
