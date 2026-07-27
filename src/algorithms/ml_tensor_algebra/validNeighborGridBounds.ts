import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface validNeighborGridBoundsInput {
  rows: number;
  cols: number;
  r: number;
  c: number;
}

export const VALIDNEIGHBORGRIDBOUNDS_CODE = `def valid_neighbor_grid_bounds(rows, cols, r, c):
    """
    Extracts valid 4-directional adjacent neighbor coordinates within grid bounds.
    """
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    valid_neighbors = []

    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            valid_neighbors.append((nr, nc))

    return valid_neighbors`;

export const DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT: validNeighborGridBoundsInput = {
  rows: 5,
  cols: 5,
  r: 2,
  c: 2,
};

export const generateValidNeighborGridBoundsSteps = (
  input: validNeighborGridBoundsInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { rows, cols, r, c } = input;
  const directions = [
    { dr: -1, dc: 0, label: "Up" },
    { dr: 1, dc: 0, label: "Down" },
    { dr: 0, dc: -1, label: "Left" },
    { dr: 0, dc: 1, label: "Right" },
  ];

  const validNeighbors: [number, number][] = [];

  const buildMatrixSnapshot = (
    candidate: [number, number] | null,
    isValidCandidate: boolean | null,
    title: string,
  ) => {
    const cells: MatrixCellItem[] = [];
    const [candR, candC] = candidate ?? [-99, -99];
    const validSet = new Set(validNeighbors.map(([vr, vc]) => `${vr},${vc}`));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let state: MatrixCellItem["state"] = "default";
        let label = `(${row},${col})`;

        if (row === r && col === c) {
          state = "pivot";
          label = "Target";
        } else if (row === candR && col === candC) {
          state = isValidCandidate ? "active" : "inactive";
        } else if (validSet.has(`${row},${col}`)) {
          state = "sorted";
        }

        cells.push({
          row,
          col,
          value: `${row},${col}`,
          label,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      cells,
      rowHeaders: Array.from({ length: rows }, (_, i) => `R${i}`),
      colHeaders: Array.from({ length: cols }, (_, i) => `C${i}`),
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    candidate: [number, number] | null = null,
    isValidCandidate: boolean | null = null,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildMatrixSnapshot(
        candidate,
        isValidCandidate,
        `2D Grid Neighbor Bounds Check (${rows}x${cols})`,
      ),
      auxiliaryState: {
        customState: {
          gridSize: `${rows}x${cols}`,
          focalCell: `(${r}, ${c})`,
          validCount: validNeighbors.length,
          validNeighbors: `[${validNeighbors.map(([vr, vc]) => `(${vr},${vc})`).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    `Call valid_neighbor_grid_bounds(rows=${rows}, cols=${cols}, r=${r}, c=${c})`,
    `Evaluating 4-directional adjacent neighbors for focal cell (${r}, ${c}) in a ${rows}x${cols} grid.`,
    { rows, cols, r, c },
  );

  // Line 5: directions
  addStep(
    5,
    "directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]",
    "Loaded 4 orthogonal movement direction offset vectors: Up (-1, 0), Down (1, 0), Left (0, -1), Right (0, 1).",
    { directions: "[(-1,0), (1,0), (0,-1), (0,1)]" },
  );

  // Line 6: valid_neighbors = []
  addStep(
    6,
    "valid_neighbors = []",
    "Initialized empty result list for accumulating valid neighbor coordinate tuples.",
    { valid_count: 0 },
  );

  // Loop through directions
  directions.forEach((dirObj, dirIdx) => {
    const { dr, dc, label } = dirObj;

    // Line 8: Loop header
    addStep(
      8,
      `Loop iteration ${dirIdx + 1}/4: dr=${dr}, dc=${dc} (${label})`,
      `Testing direction '${label}' offset (${dr}, ${dc}) from focal cell (${r}, ${c}).`,
      { dirIdx, dr, dc, label },
    );

    // Line 9: Calculate nr, nc
    const nr = r + dr;
    const nc = c + dc;
    addStep(
      9,
      `nr, nc = r + dr, c + dc -> (${r} + ${dr}, ${c} + ${dc}) = (${nr}, ${nc})`,
      `Computed candidate neighbor coordinates (${nr}, ${nc}).`,
      { nr, nc, r, c, dr, dc },
      [nr, nc],
      null,
    );

    // Micro-step: Row boundary evaluation
    const rowInBounds = 0 <= nr && nr < rows;
    addStep(
      10,
      `Evaluate row bound: 0 <= nr < rows -> 0 <= ${nr} < ${rows} -> ${rowInBounds}`,
      rowInBounds
        ? `Row coordinate ${nr} lies within grid row bounds [0, ${rows - 1}].`
        : `Row coordinate ${nr} is OUT OF BOUNDS for grid height ${rows}!`,
      { nr, rows, rowInBounds },
      [nr, nc],
      rowInBounds,
    );

    // Micro-step: Col boundary evaluation
    const colInBounds = 0 <= nc && nc < cols;
    addStep(
      10,
      `Evaluate col bound: 0 <= nc < cols -> 0 <= ${nc} < ${cols} -> ${colInBounds}`,
      colInBounds
        ? `Column coordinate ${nc} lies within grid column bounds [0, ${cols - 1}].`
        : `Column coordinate ${nc} is OUT OF BOUNDS for grid width ${cols}!`,
      { nc, cols, colInBounds },
      [nr, nc],
      colInBounds,
    );

    // Line 10: Overall IF evaluation
    const isValid = rowInBounds && colInBounds;
    addStep(
      10,
      `Check if 0 <= nr < rows and 0 <= nc < cols -> ${isValid}`,
      isValid
        ? `Candidate neighbor (${nr}, ${nc}) is VALID within grid boundaries.`
        : `Candidate neighbor (${nr}, ${nc}) is INVALID (out of bounds).`,
      { nr, nc, isValid },
      [nr, nc],
      isValid,
    );

    if (isValid) {
      validNeighbors.push([nr, nc]);
      // Line 11: Append
      addStep(
        11,
        `valid_neighbors.append((${nr}, ${nc}))`,
        `Appended valid neighbor (${nr}, ${nc}) to results list.`,
        { nr, nc, total_valid: validNeighbors.length },
        [nr, nc],
        true,
      );
    }
  });

  // Line 13: Return
  addStep(
    13,
    `Return valid_neighbors -> [${validNeighbors.map(([vr, vc]) => `(${vr},${vc})`).join(", ")}]`,
    `Completed neighbor bounds verification. Found ${validNeighbors.length} valid adjacent neighbors.`,
    { total_valid: validNeighbors.length, completed: true },
  );

  return steps;
};

const VALIDNEIGHBORGRIDBOUNDS_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "if nr < rows and nc < cols:",
    "valid_neighbors.append(dr + dc)",
    "if 0 <= nr <= rows and 0 <= nc <= cols:",
  ],
  hints: [{ line: 10, hint: "Check strict upper inequality nr < rows and nc < cols for zero-indexed grids." }],
  lineExplanations: {
    1: "Defines entry point for valid 2D grid neighbor bounds check.",
    2: "Docstring opening tag.",
    3: "Describes extraction of 4-directional adjacent neighbor coordinates.",
    4: "Docstring closing tag.",
    5: "Defines 4 orthogonal directional movement offset vectors: Up (-1, 0), Down (1, 0), Left (0, -1), Right (0, 1).",
    6: "Initializes empty list to collect valid neighbor coordinate tuples.",
    7: "Blank line preceding directional loop.",
    8: "Iterates through directional offset pairs (dr, dc) in directions list.",
    9: "Calculates candidate neighbor row nr = r + dr and column nc = c + dc.",
    10: "Evaluates boundary conditions: 0 <= nr < rows and 0 <= nc < cols.",
    11: "Appends valid coordinate tuple (nr, nc) to valid_neighbors list.",
    12: "Blank line preceding result return statement.",
    13: "Returns list of valid adjacent neighbor coordinate tuples.",
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
    "In 2D grid traversal algorithms (Graph BFS/DFS, Flood Fill, Pathfinding like $A^*$/Dijkstra) and ML spatial kernel operations (Convolution padding boundaries, Pooling window stencils, Vision Transformer patch neighbor queries), candidate adjacent cells must be checked against valid grid coordinate bounds:\n$$0 \\le n_r < R \\quad \\text{and} \\quad 0 \\le n_c < C$$\n\nWithout bounds validation, accessing cell $(n_r, n_c)$ risks out-of-bounds array index exceptions or illegal DRAM read accesses in low-level C++/CUDA kernels.\n\nThis algorithm iterates across the 4 orthogonal cardinal direction vectors (Up, Down, Left, Right), computes offset candidate coordinates, evaluates range constraints, and filters valid adjacent neighbor cells.",
  constraints: ["1 <= rows, cols <= 100", "0 <= r < rows", "0 <= c < cols"],
  examples: [
    {
      kind: "basic",
      title: "Center Cell in 5x5 Grid",
      inputDisplay: "rows = 5, cols = 5, r = 2, c = 2",
      outputDisplay: "[(1,2), (3,2), (2,1), (2,3)]",
      input: { rows: 5, cols: 5, r: 2, c: 2 },
      output: "[(1,2), (3,2), (2,1), (2,3)]",
      explanation: "Focal cell (2,2) is in interior; all 4 orthogonal directions yield valid coordinates.",
    },
    {
      kind: "complex",
      title: "Corner Cell (0,0) Boundary Condition",
      inputDisplay: "rows = 5, cols = 5, r = 0, c = 0",
      outputDisplay: "[(1,0), (0,1)]",
      input: { rows: 5, cols: 5, r: 0, c: 0 },
      output: "[(1,0), (0,1)]",
      explanation: "Up (-1,0) and Left (0,-1) violate 0 <= index bounds; Down and Right return valid.",
    },
    {
      kind: "negative",
      title: "Single Cell 1x1 Grid",
      inputDisplay: "rows = 1, cols = 1, r = 0, c = 0",
      outputDisplay: "[]",
      input: { rows: 1, cols: 1, r: 0, c: 0 },
      output: "[]",
      explanation: "All 4 directions step outside 1x1 grid; returns empty list.",
    },
  ],
  code: VALIDNEIGHBORGRIDBOUNDS_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(1) constant time execution evaluating exactly 4 direction vectors.",
    space: "O(1) auxiliary space collecting at most 4 coordinate tuples.",
  },
  topicGuide: {
    overview:
      "Valid 2D grid neighbor bounds checking is a critical building block in graph traversal and spatial computer vision algorithms. By evaluating directional displacement vectors against zero-based grid dimension limits $0 \\le n_r < R$ and $0 \\le n_c < C$, software components safely explore adjacent state spaces while maintaining memory safety.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Grids model 2D Cartesian spatial structures where adjacency is defined by displacement vectors. 4-directional connectivity uses directional offsets $\{(-1,0), (1,0), (0,-1), (0,1)\}$. For a point $(r, c)$ on a bounded grid $[0, R-1] \\times [0, C-1]$, valid neighbor topology requires the strict conjunction:\n$$0 \\le r + \\Delta r < R \\quad \\text{and} \\quad 0 \\le c + \\Delta c < C$$",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "In computer vision (OpenCV) and image processing, convolution and median filtering compute sliding window stencils over pixel grids. Boundary checks prevent memory segmentation faults at image borders and guide padding policies (zero padding, reflection padding, replication padding).",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For target cell $(0, 2)$ in a $4 \\times 4$ grid:\n1. Up $(-1, 0)$: $(0-1, 2) = (-1, 2)$. $-1 < 0$ (Invalid).\n2. Down $(1, 0)$: $(0+1, 2) = (1, 2)$. $0 \\le 1 < 4$ (Valid).\n3. Left $(0, -1)$: $(0, 2-1) = (0, 1)$. $0 \\le 1 < 4$ (Valid).\n4. Right $(0, 1)$: $(0, 2+1) = (0, 3)$. $0 \\le 3 < 4$ (Valid).\nResult list: `[(1,2), (0,1), (0,3)]`.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "In SIMT/GPU kernel execution (CUDA/Triton), evaluating branch IF statements per thread for boundary checks causes warp divergence when boundary threads take different branch paths than interior threads. Systems compilers optimize this by splitting grids into unbanded interior blocks (executed without IF checks) and specialized boundary halo blocks.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(1)$ constant time since direction vector count is fixed at 4. Space Complexity: $\\mathcal{O}(1)$ auxiliary memory allocating at most 4 coordinate pairs.",
      },
    ],
    keyTerms: [
      {
        term: "4-Connectivity",
        definition: "Adjacent neighbor topology considering only the 4 cardinal orthogonal directions (Up, Down, Left, Right).",
      },
      {
        term: "Boundary Guard",
        definition: "Conditional logic ensuring array indices satisfy 0 <= index < size before accessing memory.",
      },
      {
        term: "Halo Region",
        definition: "Outer boundary padding layers surrounding matrix grids to absorb out-of-bounds spatial stencil reads.",
      },
      {
        term: "Warp Divergence",
        definition: "GPU performance penalty occurring when threads within a 32-thread warp execute differing conditional branch paths.",
      },
    ],
  },
  trivia: VALIDNEIGHBORGRIDBOUNDS_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_VALIDNEIGHBORGRIDBOUNDS_INPUT,
  generateSteps: generateValidNeighborGridBoundsSteps,
};
