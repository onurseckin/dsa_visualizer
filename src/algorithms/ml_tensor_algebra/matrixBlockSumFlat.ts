import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface matrixBlockSumFlatInput {
  matrix?: number[][];
  k?: number;
  data?: number[];
}

export const MATRIXBLOCKSUMFLAT_CODE = `def matrix_block_sum_flat(matrix, k):
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

    return result`;

export const DEFAULT_MATRIXBLOCKSUMFLAT_INPUT: matrixBlockSumFlatInput = {
  matrix: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  k: 1,
};

export const generateMatrixBlockSumFlatSteps = (
  input: matrixBlockSumFlatInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrix = input.matrix ?? [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];
  const k = input.k ?? 1;

  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;

  const prefix: number[][] = Array.from({ length: rows + 1 }, () =>
    Array.from({ length: cols + 1 }, () => 0),
  );
  const result: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );

  const makeMatrixSnapshot = (
    mode: "init" | "prefix" | "result",
    activeR: number | null,
    activeC: number | null,
    windowBounds?: { r1: number; c1: number; r2: number; c2: number },
    titleText?: string,
  ) => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let state: MatrixCellItem["state"] = "default";
        let cellVal = matrix[r][c];

        if (mode === "prefix") {
          if (r === activeR && c === activeC) state = "active";
          else if (r < (activeR ?? 0) || (r === activeR && c < (activeC ?? 0)))
            state = "sorted";
        } else if (mode === "result") {
          cellVal = result[r][c];
          if (r === activeR && c === activeC) {
            state = "pivot";
          } else if (
            windowBounds &&
            r >= windowBounds.r1 &&
            r <= windowBounds.r2 &&
            c >= windowBounds.c1 &&
            c <= windowBounds.c2
          ) {
            state = "active";
          } else if (r < (activeR ?? 0) || (r === activeR && c < (activeC ?? 0))) {
            state = "sorted";
          }
        }

        cells.push({
          row: r,
          col: c,
          value: cellVal,
          label: mode === "result" ? `Out[${r}][${c}]` : `In[${r}][${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      rowHeaders: Array.from({ length: rows }, (_, i) => `Row ${i}`),
      colHeaders: Array.from({ length: cols }, (_, i) => `Col ${i}`),
      title: titleText ?? "Submatrix Block Sum State",
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    mode: "init" | "prefix" | "result",
    activeR: number | null,
    activeC: number | null,
    windowBounds?: { r1: number; c1: number; r2: number; c2: number },
    titleText?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        mode,
        activeR,
        activeC,
        windowBounds,
        titleText,
      ),
      auxiliaryState: {
        customState: {
          matrixRows: String(rows),
          matrixCols: String(cols),
          kRadius: String(k),
        },
      },
      variables,
    });
  };

  // Line 1: Entry
  addStep(
    1,
    "Initialize Submatrix Block Sum Algorithm",
    `Entry into matrix_block_sum_flat with matrix shape ${rows}x${cols} and radius k = ${k}.`,
    { rows, cols, k },
    "init",
    null,
    null,
    undefined,
    "Function Entry",
  );

  // Line 2: Docstring start
  addStep(
    2,
    "Parse Docstring & Algorithm Purpose",
    "Computes k-radius rectangular submatrix sums in O(1) time per cell using a 2D prefix sum (summed-area table).",
    { radius: k },
    "init",
    null,
    null,
    undefined,
    "Docstring",
  );

  // Line 3: Docstring body
  addStep(
    3,
    "Review 2D Prefix Sum Formulation",
    "2D prefix sum enables constant time region queries: sum(box) = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1].",
    { complexity: "O(rows * cols)" },
    "init",
    null,
    null,
    undefined,
    "Docstring",
  );

  // Line 4: Docstring end
  addStep(
    4,
    "Finalize Algorithm Setup",
    "Preparing variables for prefix table allocation and 2D inclusion-exclusion evaluation.",
    { k },
    "init",
    null,
    null,
    undefined,
    "Docstring End",
  );

  // Line 5: rows
  addStep(
    5,
    `Read Matrix Rows: rows = ${rows}`,
    `Extracting row count ${rows} from input matrix.`,
    { rows },
    "init",
    null,
    null,
    undefined,
    "Get Rows",
  );

  // Line 6: cols
  addStep(
    6,
    `Read Matrix Columns: cols = ${cols}`,
    `Extracting column count ${cols} from input matrix.`,
    { rows, cols },
    "init",
    null,
    null,
    undefined,
    "Get Cols",
  );

  // Line 7: Allocate prefix matrix
  addStep(
    7,
    `Allocate Prefix Grid of Shape (${rows + 1}) x (${cols + 1})`,
    `Creating (M+1) x (N+1) 2D prefix integral table filled with 0s to simplify 1-based indexing.`,
    { prefixRows: rows + 1, prefixCols: cols + 1 },
    "init",
    null,
    null,
    undefined,
    "Allocate Prefix",
  );

  // Line 8: Blank line
  addStep(
    8,
    "Begin 2D Prefix Table Construction Loop",
    "Starting nested loops to construct 2D prefix sum table.",
    { rows, cols },
    "init",
    null,
    null,
    undefined,
    "Start Prefix Pass",
  );

  // Prefix loop
  for (let r = 0; r < rows; r++) {
    addStep(
      9,
      `Prefix Loop Outer Row r = ${r}`,
      `Processing row ${r} for 2D prefix accumulation.`,
      { r },
      "prefix",
      r,
      null,
      undefined,
      `Prefix Row ${r}`,
    );

    for (let c = 0; c < cols; c++) {
      addStep(
        10,
        `Prefix Loop Inner Column c = ${c}`,
        `Computing prefix sum for cell (${r}, ${c}).`,
        { r, c },
        "prefix",
        r,
        c,
        undefined,
        `Prefix Cell (${r}, ${c})`,
      );

      const currentVal = matrix[r][c];
      const top = prefix[r][c + 1];
      const left = prefix[r + 1][c];
      const topLeft = prefix[r][c];
      const prefixVal = currentVal + top + left - topLeft;
      prefix[r + 1][c + 1] = prefixVal;

      addStep(
        11,
        `Compute Prefix[${r + 1}][${c + 1}] = ${currentVal} + ${top} + ${left} - ${topLeft} = ${prefixVal}`,
        `Applying 2D recurrence: P[r+1][c+1] = val + P[r][c+1] + P[r+1][c] - P[r][c].`,
        { r, c, val: currentVal, prefixVal },
        "prefix",
        r,
        c,
        undefined,
        `Prefix Computed (${r}, ${c})`,
      );
    }
  }

  // Line 12: Blank line
  addStep(
    12,
    "Prefix Sum Construction Complete",
    "2D integral sum image is fully populated. Preparing output result matrix allocation.",
    { prefixReady: true },
    "prefix",
    null,
    null,
    undefined,
    "Prefix Complete",
  );

  // Line 13: Allocate result
  addStep(
    13,
    `Allocate Result Matrix of Shape ${rows} x ${cols}`,
    `Initializing output matrix of shape ${rows} x ${cols} to hold k-radius submatrix sums.`,
    { resultShape: `${rows}x${cols}` },
    "result",
    null,
    null,
    undefined,
    "Allocate Result",
  );

  // Result loop
  for (let r = 0; r < rows; r++) {
    addStep(
      14,
      `Result Loop Outer Row r = ${r}`,
      `Calculating k-radius window sums for row ${r}.`,
      { r },
      "result",
      r,
      null,
      undefined,
      `Result Row ${r}`,
    );

    for (let c = 0; c < cols; c++) {
      addStep(
        15,
        `Result Loop Inner Column c = ${c}`,
        `Evaluating k-radius window sum for cell (${r}, ${c}).`,
        { r, c },
        "result",
        r,
        c,
        undefined,
        `Result Cell (${r}, ${c})`,
      );

      const r1 = Math.max(0, r - k);
      const c1 = Math.max(0, c - k);
      addStep(
        16,
        `Clamp Top-Left Boundary: r1 = max(0, ${r} - ${k}) = ${r1}, c1 = max(0, ${c} - ${k}) = ${c1}`,
        `Clamping upper-left submatrix coordinate (r1, c1) within valid grid bounds.`,
        { r, c, k, r1, c1 },
        "result",
        r,
        c,
        { r1, c1, r2: r1, c2: c1 },
        `Bounds r1, c1`,
      );

      const r2 = Math.min(rows - 1, r + k);
      const c2 = Math.min(cols - 1, c + k);
      addStep(
        17,
        `Clamp Bottom-Right Boundary: r2 = min(${rows - 1}, ${r} + ${k}) = ${r2}, c2 = min(${cols - 1}, ${c} + ${k}) = ${c2}`,
        `Clamping bottom-right submatrix coordinate (r2, c2) within valid grid bounds.`,
        { r, c, k, r2, c2 },
        "result",
        r,
        c,
        { r1, c1, r2, c2 },
        `Bounds r2, c2`,
      );

      const sumVal =
        prefix[r2 + 1][c2 + 1] -
        prefix[r1][c2 + 1] -
        prefix[r2 + 1][c1] +
        prefix[r1][c1];
      result[r][c] = sumVal;

      addStep(
        18,
        `Compute Window Sum: P[${r2 + 1}][${c2 + 1}] - P[${r1}][${c2 + 1}] - P[${r2 + 1}][${c1}] + P[${r1}][${c1}] = ${sumVal}`,
        `Applying 4-corner inclusion-exclusion formula to calculate submatrix sum for window [${r1}..${r2}, ${c1}..${c2}].`,
        { r, c, r1, c1, r2, c2, submatrix_sum: sumVal },
        "result",
        r,
        c,
        { r1, c1, r2, c2 },
        `Window Sum = ${sumVal}`,
      );
    }
  }

  // Line 19: Blank line
  addStep(
    19,
    "Finish Submatrix Block Sum Evaluation",
    "All cells processed. Returning completed submatrix block sum matrix.",
    { complete: true },
    "result",
    null,
    null,
    undefined,
    "Evaluation Done",
  );

  // Line 20: Return result
  addStep(
    20,
    "Return Result Matrix",
    "Returning computed k-radius block sum matrix.",
    { result: JSON.stringify(result) },
    "result",
    null,
    null,
    undefined,
    "Return Matrix",
  );

  return steps;
};

const MATRIXBLOCKSUMFLAT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result[r][c] = prefix[r2][c2] - prefix[r1][c1]",
    "r1, c1 = r - k, c - k",
    "prefix[r][c] = matrix[r][c] + prefix[r-1][c-1]",
  ],
  hints: [{ line: 18, hint: "Use the 4-corner prefix formula: P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]." }],
  lineExplanations: {
    1: "Function declaration taking input matrix grid and radius k.",
    2: "Opening docstring for 2D prefix sum block sum calculation.",
    3: "Documentation describing O(1) region queries via summed-area table.",
    4: "Closing docstring for 2D prefix sum block sum calculation.",
    5: "Retrieves row count of input matrix.",
    6: "Retrieves column count of input matrix.",
    7: "Allocates zero-initialized prefix grid of size (rows + 1) x (cols + 1).",
    8: "Empty line separating initialization from prefix calculation loops.",
    9: "Outer loop iterating through row indices r of input matrix.",
    10: "Inner loop iterating through column indices c of input matrix.",
    11: "Computes prefix integral cell using recurrence: matrix[r][c] + top + left - top_left.",
    12: "Empty line separating prefix build loop from result query loop.",
    13: "Allocates output result matrix of size rows x cols initialized to zeros.",
    14: "Outer loop iterating through result matrix row indices r.",
    15: "Inner loop iterating through result matrix column indices c.",
    16: "Calculates top-left boundary coordinates [r1, c1] clamped to matrix limits.",
    17: "Calculates bottom-right boundary coordinates [r2, c2] clamped to matrix limits.",
    18: "Queries 2D prefix sum table using 4-corner inclusion-exclusion equation.",
    19: "Empty line separating query loops from return statement.",
    20: "Returns completed 2D matrix containing k-radius submatrix sums.",
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
    "In computer vision, convolutional feature map extraction, and spatial attention kernels, computing submatrix window sums around every grid cell $(r, c)$ within a radius $k$ is a common primitive operation.\n\nNaively scanning the $(2k+1) \\times (2k+1)$ neighborhood for every cell takes $\\mathcal{O}(M \\times N \\times k^2)$ time. By pre-computing a 2D prefix sum table (also known as a Summed-Area Table), any rectangular region sum can be evaluated in $\\mathcal{O}(1)$ constant time using 4 corner array lookups:\n$$\\text{Sum} = P[r_2+1][c_2+1] - P[r_1][c_2+1] - P[r_2+1][c_1] + P[r_1][c_1]$$\n\nThis algorithm constructs an $(M+1) \\times (N+1)$ integral image table, demonstrates the 2D prefix recurrence, and evaluates submatrix region sums with boundary clamping in $\\mathcal{O}(M \\times N)$ total runtime.",
  constraints: [
    "1 <= matrix.length, matrix[i].length <= 100",
    "0 <= k <= 100",
    "-10^4 <= matrix[i][j] <= 10^4",
  ],
  examples: [
    {
      kind: "basic",
      title: "3x3 Matrix with k=1 Radius",
      inputDisplay: "matrix = [[1,2,3],[4,5,6],[7,8,9]], k = 1",
      outputDisplay: "[[12, 21, 16], [27, 45, 33], [24, 39, 28]]",
      input: {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
        k: 1,
      },
      output: "[[12, 21, 16], [27, 45, 33], [24, 39, 28]]",
      explanation: "Computes 1-radius submatrix sums for all 9 cells.",
    },
    {
      kind: "complex",
      title: "Clamped Boundaries with k=2 Radius",
      inputDisplay: "matrix = [[1, 1], [1, 1]], k = 2",
      outputDisplay: "[[4, 4], [4, 4]]",
      input: {
        matrix: [
          [1, 1],
          [1, 1],
        ],
        k: 2,
      },
      output: "[[4, 4], [4, 4]]",
      explanation: "When k exceeds grid dimensions, every cell receives the sum of the entire matrix.",
    },
    {
      kind: "negative",
      title: "Single Element k=0",
      inputDisplay: "matrix = [[5]], k = 0",
      outputDisplay: "[[5]]",
      input: { matrix: [[5]], k: 0 },
      output: "[[5]]",
      explanation: "Radius k=0 returns the original single-element matrix value.",
    },
  ],
  code: MATRIXBLOCKSUMFLAT_CODE,
  timeComplexity: { best: "O(M*N)", average: "O(M*N)", worst: "O(M*N)" },
  spaceComplexity: "O(M*N)",
  complexityAnalysis: {
    time: "O(M*N) time to construct 2D prefix table and perform O(1) queries for all M*N cells.",
    space: "O(M*N) space for integral prefix table and output result matrix.",
  },
  topicGuide: {
    overview:
      "2D Prefix Sums (Summed-Area Tables) are widely used in computer vision (Viola-Jones face detection, box filtering), spatial feature map pooling, and integral image calculations. Pre-computing a 2D integral table allows any arbitrary axis-aligned rectangular region sum to be evaluated in constant $\\mathcal{O}(1)$ time regardless of window size $k$.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "For a 2D matrix, the integral table entry $P[r+1][c+1]$ stores the sum of all elements in submatrix $[0..r, 0..c]$. Construction follows inclusion-exclusion:\n$$P[r+1][c+1] = A[r][c] + P[r][c+1] + P[r+1][c] - P[r][c]$$\nThe top-left corner $P[r][c]$ is subtracted because it is included in both $P[r][c+1]$ and $P[r+1][c]$ neighbor sums.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Box blurs, local contrast normalization in CNNs, and fast bounding box feature aggregation in object detection pipelines leverage summed-area tables to achieve constant-time neighborhood queries across variable filter sizes.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "To query rectangle $[r_1..r_2, c_1..c_2]$:\n1. Start with full region from origin $P[r_2+1][c_2+1]$.\n2. Subtract top strip $P[r_1][c_2+1]$.\n3. Subtract left strip $P[r_2+1][c_1]$.\n4. Add back doubly-subtracted top-left corner $P[r_1][c_1]$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "While prefix sums reduce query complexity from $\\mathcal{O}(k^2)$ to $\\mathcal{O}(1)$, building the prefix table requires an initial $\\mathcal{O}(M \\times N)$ pass and extra memory. On GPUs, parallel 2D prefix scans are implemented using Blelloch scan routines in shared memory.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Table construction takes $\\mathcal{O}(M \\times N)$ time. Each of the $M \\times N$ query steps takes $\\mathcal{O}(1)$ time. Overall time complexity is $\\mathcal{O}(M \\times N)$ with $\\mathcal{O}(M \\times N)$ auxiliary storage.",
      },
    ],
    keyTerms: [
      {
        term: "Summed-Area Table",
        definition: "A 2D array representation where each cell stores the sum of all grid values above and to its left.",
      },
      {
        term: "Inclusion-Exclusion Principle",
        definition: "Mathematical technique to compute union area by summing component areas and subtracting overlapping intersections.",
      },
      {
        term: "Integral Image",
        definition: "Computer vision term for a 2D prefix sum array used for fast box filtering.",
      },
      {
        term: "Submatrix Window",
        definition: "The rectangular region of grid cells bounded by coordinates [r1..r2, c1..c2].",
      },
    ],
  },
  trivia: MATRIXBLOCKSUMFLAT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_MATRIXBLOCKSUMFLAT_INPUT,
  generateSteps: generateMatrixBlockSumFlatSteps,
};
