import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface dynamic2dBlockPrefixSumInput {
  matrix?: number[][];
  blockSize?: number;
  data?: number[];
  target?: number;
}

export const DYNAMIC2DBLOCKPREFIXSUM_CODE = `def dynamic_2d_block_prefix_sum(matrix, block_size=2):
    rows, cols = len(matrix), len(matrix[0])
    prefix = [[0] * cols for _ in range(rows)]
    for r in range(rows):
        row_sum = 0
        for c in range(cols):
            row_sum += matrix[r][c]
            above = prefix[r-1][c] if r > 0 else 0
            prefix[r][c] = row_sum + above
    return prefix`;

export const DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT: dynamic2dBlockPrefixSumInput = {
  matrix: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ],
  blockSize: 2,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateDynamic2dBlockPrefixSumSteps = (
  input: dynamic2dBlockPrefixSumInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrix =
    input.matrix && input.matrix.length > 0
      ? input.matrix
      : [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ];

  const blockSize = Math.max(input.blockSize ?? 2, 1);
  const rows = matrix.length;
  const cols = matrix[0].length;

  const prefix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  const getMatrixSnapshot = (
    currentR?: number,
    currentC?: number,
    phase: string = "init",
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isPastCell =
          currentR !== undefined && (r < currentR || (r === currentR && c < (currentC ?? -1)));
        const isCurrent = r === currentR && c === currentC;
        const isAbove =
          currentR !== undefined && currentC !== undefined && r === currentR - 1 && c === currentC;

        let state: MatrixCellItem["state"] = "default";
        if (isCurrent) {
          state = "active";
        } else if (isAbove) {
          state = "compared";
        } else if (isPastCell || phase === "complete") {
          state = "sorted";
        }

        const isValueStored =
          isPastCell || (isCurrent && phase === "store_prefix") || phase === "complete";
        const valDisplay = isValueStored ? prefix[r][c] : matrix[r][c];

        cells.push({
          row: r,
          col: c,
          value: valDisplay,
          label: `P[${r},${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows,
      cols,
      title: `2D Prefix Sum Matrix (${rows}x${cols}, BlockSize=${blockSize})`,
      rowHeaders: Array.from({ length: rows }, (_, idx) => `Row ${idx}`),
      colHeaders: Array.from({ length: cols }, (_, idx) => `Col ${idx}`),
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentR?: number,
    currentC?: number,
    phase: string = "init",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getMatrixSnapshot(currentR, currentC, phase),
      auxiliaryState: {
        customState: {
          rows: String(rows),
          cols: String(cols),
          blockSize: String(blockSize),
          matrix: JSON.stringify(matrix),
          prefix: JSON.stringify(prefix),
        },
      },
      variables,
    });
  };

  // Line 1: Setup function definition
  addStep(
    1,
    "Initialize Block-Tiled 2D Prefix Sum Engine",
    `Configured ${rows}x${cols} input matrix for 2D cumulative prefix calculation with block size ${blockSize}.`,
    { rows, cols, block_size: blockSize },
  );

  // Line 2: Read dimensions
  addStep(2, "Read Matrix Dimensions", `Matrix has ${rows} rows and ${cols} columns.`, {
    rows,
    cols,
  });

  // Line 3: Allocate prefix matrix
  addStep(
    3,
    "Allocate 2D Prefix Sum Matrix",
    `Allocated ${rows}x${cols} prefix matrix initialized to zeroes.`,
    { rows, cols },
  );

  // Lines 4-9: 2D prefix computation loops
  for (let r = 0; r < rows; r++) {
    addStep(
      4,
      `Begin Row r=${r}`,
      `Iterating across row ${r} of matrix.`,
      { r },
      r,
      undefined,
      "row_start",
    );

    let rowSum = 0;
    addStep(
      5,
      `Initialize Running Row Sum Accumulator (row_sum = 0)`,
      `Reset running row sum accumulator for row ${r}.`,
      { r, row_sum: rowSum },
      r,
      undefined,
      "row_sum_init",
    );

    for (let c = 0; c < cols; c++) {
      addStep(
        6,
        `Iterate Column c=${c}`,
        `Processing element matrix[${r}][${c}] = ${matrix[r][c]}.`,
        { r, c, val: matrix[r][c] },
        r,
        c,
        "col_iter",
      );

      rowSum += matrix[r][c];
      addStep(
        7,
        `Accumulate Row Sum: row_sum += matrix[${r}][${c}] (${rowSum})`,
        `Added matrix[${r}][${c}] (${matrix[r][c]}) to running row accumulator. row_sum = ${rowSum}.`,
        { r, c, val: matrix[r][c], row_sum: rowSum },
        r,
        c,
        "row_sum_add",
      );

      const above = r > 0 ? prefix[r - 1][c] : 0;
      addStep(
        8,
        `Fetch Prefix Above: prefix[${r - 1}][${c}] = ${above}`,
        `Fetched cumulative carry-in sum from row above (${r > 0 ? `prefix[${r - 1}][${c}] = ${above}` : "boundary 0"}).`,
        { r, c, above },
        r,
        c,
        "fetch_above",
      );

      prefix[r][c] = rowSum + above;
      addStep(
        9,
        `Store Prefix Entry: prefix[${r}][${c}] = row_sum + above (${prefix[r][c]})`,
        `Stored cumulative 2D prefix sum value ${prefix[r][c]} at position (${r}, ${c}).`,
        { r, c, row_sum: rowSum, above, prefix_val: prefix[r][c] },
        r,
        c,
        "store_prefix",
      );
    }
  }

  // Line 10: Return
  addStep(
    10,
    "2D Prefix Sum Complete",
    "Successfully computed 2D cumulative prefix matrix.",
    { completed: true },
    undefined,
    undefined,
    "complete",
  );

  return steps;
};

const DYNAMIC2DBLOCKPREFIXSUM_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "prefix[r][c] = matrix[r][c] + prefix[r-1][c-1]  # Missing 2D inclusion-exclusion terms",
    "row_sum = matrix[r][c]  # Resetting row accumulator instead of summing",
    "return matrix[::-1]",
  ],
  hints: [
    { line: 7, hint: "Maintain running row accumulator row_sum across consecutive columns." },
    { line: 9, hint: "Add carry-in sum from preceding row above to compute 2D prefix sum entry." },
  ],
  lineExplanations: {
    1: "Defines dynamic_2d_block_prefix_sum function taking matrix and block_size parameters.",
    2: "Gets row count rows and column count cols of input matrix.",
    3: "Allocates rows x cols prefix matrix initialized to zeroes.",
    4: "Iterates through row indices r from 0 to rows - 1.",
    5: "Initializes running row sum accumulator row_sum to 0 for current row.",
    6: "Iterates through column indices c from 0 to cols - 1.",
    7: "Adds input scalar matrix[r][c] to running row accumulator row_sum.",
    8: "Fetches prefix value from preceding row above (prefix[r-1][c]) if r > 0, else 0.",
    9: "Stores cumulative 2D prefix value: prefix[r][c] = row_sum + above.",
    10: "Returns computed 2D cumulative prefix matrix.",
  },
};

export const dynamic2dBlockPrefixSum: AlgorithmDefinition<dynamic2dBlockPrefixSumInput> = {
  id: "dynamic-2d-block-prefix-sum",
  title: "Block-Tiled 2D Prefix Sum Engine",
  topicIds: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  description: `2D Prefix Sums (also known as Integral Images or Summed-Area Tables) enable $\\mathcal{O}(1)$ constant-time queries for submatrix bounding box sums. They are widely used in Computer Vision, Convolutional Neural Network feature mapping, and GPU data parallel primitives.

On GPUs, computing a 2D prefix sum over large matrices requires partitioning the grid into thread blocks. Each thread block computes intra-block prefix scans in on-chip SRAM before performing a global inter-block scan pass to propagate carry-in sums across block boundaries. The inclusion-exclusion formula for submatrix sum in $[r_1..r_2, c_1..c_2]$ is:
$$\\text{Sum} = P[r_2][c_2] - P[r_1-1][c_2] - P[r_2][c_1-1] + P[r_1-1][c_1-1]$$

This algorithm simulates a Block-Tiled 2D Prefix Sum Engine step-by-step, visualizing row-wise accumulation, column carry-in propagation from preceding rows, and matrix snapshot generation.`,
  constraints: ["1 <= rows, cols <= 64", "1 <= blockSize <= 16"],
  examples: [
    {
      kind: "basic",
      title: "Standard 4x4 2D Prefix Sum",
      inputDisplay: "Matrix (4x4), BlockSize = 2",
      outputDisplay: "4x4 Cumulative Prefix Matrix Generated",
      input: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
      output: "4x4 Cumulative Prefix Matrix Generated",
      explanation:
        "Computes 2D prefix sums by combining horizontal row scans with vertical carry-in propagation.",
    },
    {
      kind: "complex",
      title: "3x3 Identity Grid",
      inputDisplay: "Matrix (3x3 Ones), BlockSize = 2",
      outputDisplay: "Prefix Matrix [[1,2,3],[2,4,6],[3,6,9]]",
      input: {
        matrix: [
          [1, 1, 1],
          [1, 1, 1],
          [1, 1, 1],
        ],
        blockSize: 2,
      },
      output: "Prefix Matrix [[1,2,3],[2,4,6],[3,6,9]]",
      explanation: "Evaluates exact submatrix area sums for a uniform 3x3 grid.",
    },
  ],
  code: DYNAMIC2DBLOCKPREFIXSUM_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Requires O(M * N) linear time to compute 2D prefix entries across M rows and N columns.",
    space: "O(M * N) space to store the output cumulative prefix sum matrix.",
  },
  topicGuide: {
    overview:
      "2D Prefix Sums (Summed-Area Tables) allow calculating the sum of elements in any arbitrary rectangular submatrix in $\\mathcal{O}(1)$ constant time, regardless of bounding box dimensions. Parallel implementations partition work across GPU thread blocks, using shared memory scan algorithms (e.g. Blelloch / Hillis-Steele scans).",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Mathematically, the 2D prefix sum entry $P[r][c]$ represents the sum of all matrix elements in rectangle $[0..r, 0..c]$:\n$$P[r][c] = \\sum_{i=0}^r \\sum_{j=0}^c M[i][j]$$\nThe recurrence relation is $P[r][c] = M[r][c] + P[r-1][c] + P[r][c-1] - P[r-1][c-1]$. Querying any submatrix sum between top-left $(r_1, c_1)$ and bottom-right $(r_2, c_2)$ takes constant time:\n$$\\text{Sum} = P[r_2][c_2] - P[r_1-1][c_2] - P[r_2][c_1-1] + P[r_1-1][c_1-1]$$",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "2D prefix sums solve performance bottlenecks in box filter blurring, Viola-Jones object detection, attention map subgrid pooling, spatial feature extraction, and GPU ray-tracing spatial acceleration.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Given row 0 `[1, 2, 3, 4]` and row 1 `[5, 6, 7, 8]`:\n1. Row 0 running row sums: `[1, 3, 6, 10]`. Prefix Row 0 = `[1, 3, 6, 10]`.\n2. Row 1 running row sums: `[5, 11, 18, 26]`.\n3. Adding Prefix Row 0 above yields Prefix Row 1 = `[5+1=6, 11+3=14, 18+6=24, 26+10=36]`.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Parallel GPU 2D prefix scans require two-pass execution: Pass 1 computes local intra-block prefix scans within SRAM; Pass 2 performs a global block carry-in distribution. While CPU scans execute serially in $\\mathcal{O}(M \\times N)$ steps, GPU parallel scans execute in $\\mathcal{O}(\\log(M \\times N))$ parallel time steps.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(M \\times N)$ total addition operations. Query Complexity: $\\mathcal{O}(1)$ constant time per submatrix bounding box sum. Space Complexity: $\\mathcal{O}(M \\times N)$ auxiliary memory for the prefix matrix.",
      },
    ],
    keyTerms: [
      {
        term: "Integral Image / Summed-Area Table",
        definition:
          "Data structure storing cumulative 2D prefix sums for instant bounding box area queries.",
      },
      {
        term: "Carry-In Sum",
        definition:
          "The cumulative offset value passed from preceding thread blocks or rows into downstream scans.",
      },
      {
        term: "Inclusion-Exclusion Principle",
        definition:
          "Mathematical formula adding top-left and subtracting overlapping bounds to query submatrix sums.",
      },
      {
        term: "Blelloch Parallel Scan",
        definition:
          "Work-efficient work-parallel algorithm executing scan trees in O(N) operations.",
      },
    ],
  },
  trivia: DYNAMIC2DBLOCKPREFIXSUM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_DYNAMIC2DBLOCKPREFIXSUM_INPUT,
  generateSteps: generateDynamic2dBlockPrefixSumSteps,
};
