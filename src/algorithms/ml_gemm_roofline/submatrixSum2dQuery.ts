import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface submatrixSum2dQueryInput {
  prefix_matrix?: number[][];
  r1?: number;
  c1?: number;
  r2?: number;
  c2?: number;
}

export const SUBMATRIXSUM2DQUERY_CODE = `def submatrix_sum_2d_query(prefix_matrix, r1, c1, r2, c2):
    """
    Queries 2D submatrix region sum using 4-corner integral image prefix table.
    """
    total = (prefix_matrix[r2+1][c2+1] - prefix_matrix[r1][c2+1] - 
             prefix_matrix[r2+1][c1] + prefix_matrix[r1][c1])
    return total`;

export const DEFAULT_SUBMATRIXSUM2DQUERY_INPUT: submatrixSum2dQueryInput = {
  prefix_matrix: [
    [0, 0, 0, 0, 0],
    [0, 1, 3, 6, 10],
    [0, 6, 14, 24, 36],
    [0, 15, 33, 54, 78],
    [0, 28, 60, 96, 136],
  ],
  r1: 1,
  c1: 1,
  r2: 3,
  c2: 3,
};

export const generateSubmatrixSum2dQuerySteps = (
  input: submatrixSum2dQueryInput,
): AlgorithmStep[] => {
  const prefix_matrix = input.prefix_matrix ?? DEFAULT_SUBMATRIXSUM2DQUERY_INPUT.prefix_matrix!;
  const r1 = input.r1 ?? 1;
  const c1 = input.c1 ?? 1;
  const r2 = input.r2 ?? 3;
  const c2 = input.c2 ?? 3;

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numRows = prefix_matrix.length;
  const numCols = prefix_matrix[0]?.length ?? 0;

  const createMatrixSnapshot = (
    cornerMap: {
      bottomRight?: boolean;
      topRight?: boolean;
      bottomLeft?: boolean;
      topLeft?: boolean;
    } = {},
    submatrixHighlight = false,
    activeCell?: [number, number],
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const val = prefix_matrix[r][c];
        let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
        let label: string | undefined;

        if (r === r2 + 1 && c === c2 + 1 && cornerMap.bottomRight) {
          state = "active";
          label = `+P[${r}][${c}]`;
        } else if (r === r1 && c === c2 + 1 && cornerMap.topRight) {
          state = "compared";
          label = `-P[${r}][${c}]`;
        } else if (r === r2 + 1 && c === c1 && cornerMap.bottomLeft) {
          state = "compared";
          label = `-P[${r}][${c}]`;
        } else if (r === r1 && c === c1 && cornerMap.topLeft) {
          state = "pivot";
          label = `+P[${r}][${c}]`;
        } else if (activeCell && activeCell[0] === r && activeCell[1] === c) {
          state = "active";
          label = `Cell(${r},${c})`;
        } else if (submatrixHighlight && r >= r1 + 1 && r <= r2 + 1 && c >= c1 + 1 && c <= c2 + 1) {
          state = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: numRows,
      cols: numCols,
      rowHeaders: Array.from({ length: numRows }, (_, r) => `Row ${r}`),
      colHeaders: Array.from({ length: numCols }, (_, c) => `Col ${c}`),
      title: `2D Integral Prefix Matrix (${numRows}x${numCols})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    cornerMap: {
      bottomRight?: boolean;
      topRight?: boolean;
      bottomLeft?: boolean;
      topLeft?: boolean;
    } = {},
    submatrixHighlight = false,
    activeCell?: [number, number],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(cornerMap, submatrixHighlight, activeCell),
      auxiliaryState: {
        customState: {
          r1,
          c1,
          r2,
          c2,
          corner_bottom_right: prefix_matrix[r2 + 1]?.[c2 + 1] ?? 0,
          corner_top_right: prefix_matrix[r1]?.[c2 + 1] ?? 0,
          corner_bottom_left: prefix_matrix[r2 + 1]?.[c1] ?? 0,
          corner_top_left: prefix_matrix[r1]?.[c1] ?? 0,
        },
      },
      variables,
    });
  };

  // Line 1: Entry
  addStep(
    1,
    "Initialize 2D Submatrix Region Sum Query Engine",
    `Target submatrix bounds: rows [${r1}..${r2}], cols [${c1}..${c2}].`,
    { r1, c1, r2, c2 },
  );

  // Line 1 (detail): Bounds validation
  addStep(
    1,
    `Map Submatrix Bounding Box: [r1=${r1}, c1=${c1}] to [r2=${r2}, c2=${c2}]`,
    "Identify 4 corner prefix table coordinates required for inclusion-exclusion query.",
    { r1, c1, r2, c2, submatrix_rows: r2 - r1 + 1, submatrix_cols: c2 - c1 + 1 },
  );

  // Line 1 (detail 2): Matrix dimension inspection
  addStep(
    1,
    `Inspect Integral Matrix Grid Dimensions (${numRows}x${numCols})`,
    "Verify 0-indexed padding requirements and grid boundaries.",
    { numRows, numCols, r1, c1, r2, c2 },
  );

  const valBR = prefix_matrix[r2 + 1][c2 + 1];
  const valTR = prefix_matrix[r1][c2 + 1];
  const valBL = prefix_matrix[r2 + 1][c1];
  const valTL = prefix_matrix[r1][c1];

  // Line 5: Bottom-Right corner
  addStep(
    5,
    `Lookup Corner 1 (Bottom-Right): P[${r2 + 1}][${c2 + 1}] = ${valBR}`,
    `Sum of full rectangle [0..${r2}, 0..${c2}] from origin.`,
    { corner_br: valBR },
    { bottomRight: true },
  );

  // Line 5: Top-Right corner
  addStep(
    5,
    `Lookup Corner 2 (Top-Right): P[${r1}][${c2 + 1}] = ${valTR}`,
    `Sum of top rectangle [0..${r1 - 1}, 0..${c2}] to subtract.`,
    { corner_br: valBR, corner_tr: valTR },
    { bottomRight: true, topRight: true },
  );

  // Line 6: Bottom-Left corner
  addStep(
    6,
    `Lookup Corner 3 (Bottom-Left): P[${r2 + 1}][${c1}] = ${valBL}`,
    `Sum of left rectangle [0..${r2}, 0..${c1 - 1}] to subtract.`,
    { corner_br: valBR, corner_tr: valTR, corner_bl: valBL },
    { bottomRight: true, topRight: true, bottomLeft: true },
  );

  // Line 6: Top-Left corner
  addStep(
    6,
    `Lookup Corner 4 (Top-Left): P[${r1}][${c1}] = ${valTL}`,
    `Sum of top-left overlap rectangle [0..${r1 - 1}, 0..${c1 - 1}] to re-add.`,
    { corner_br: valBR, corner_tr: valTR, corner_bl: valBL, corner_tl: valTL },
    { bottomRight: true, topRight: true, bottomLeft: true, topLeft: true },
  );

  const total = valBR - valTR - valBL + valTL;

  // Line 6: Evaluate total
  addStep(
    6,
    `Evaluate 4-Corner Equation: ${valBR} - ${valTR} - ${valBL} + ${valTL} = ${total}`,
    `Compute exact submatrix sum in O(1) time via inclusion-exclusion.`,
    { total, valBR, valTR, valBL, valTL },
    { bottomRight: true, topRight: true, bottomLeft: true, topLeft: true },
    true,
  );

  // Verification steps cell by cell across original submatrix cells
  addStep(
    6,
    "Begin Cell-by-Cell Sum Verification",
    "Verifying that cell-by-cell sum of original elements matches O(1) 4-corner formula.",
    { total },
    {},
    true,
  );

  let manualSum = 0;
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      // original cell value = P[r+1][c+1] - P[r][c+1] - P[r+1][c] + P[r][c]
      const cellVal =
        prefix_matrix[r + 1][c + 1] -
        prefix_matrix[r][c + 1] -
        prefix_matrix[r + 1][c] +
        prefix_matrix[r][c];
      manualSum += cellVal;
      addStep(
        6,
        `Verify Cell (${r}, ${c}): value = ${cellVal}, running sum = ${manualSum}`,
        `Inspect element at submatrix coordinate (${r}, ${c}) and add to verification total.`,
        { r, c, cellVal, manualSum, total },
        {},
        true,
        [r + 1, c + 1],
      );
    }
  }

  addStep(
    6,
    `Verification Asserted: Manual Cell Sum (${manualSum}) == O(1) Formula Total (${total})`,
    "Confirmed exact match between element accumulation and 4-corner prefix lookup.",
    { total, manualSum, match: manualSum === total },
    { bottomRight: true, topRight: true, bottomLeft: true, topLeft: true },
    true,
  );

  // Line 7: Return total
  addStep(
    7,
    `Return Total Submatrix Sum: ${total}`,
    `Return final scalar region sum for bounds [r1=${r1}, c1=${c1}] to [r2=${r2}, c2=${c2}].`,
    { total, completed: true },
    { bottomRight: true, topRight: true, bottomLeft: true, topLeft: true },
    true,
  );

  return steps;
};

export const SUBMATRIXSUM2DQUERY_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "total = prefix_matrix[r2][c2] - prefix_matrix[r1][c1]",
    "total = prefix_matrix[r2+1][c2+1] + prefix_matrix[r1][c1]",
    "total = prefix_matrix[r2][c2] - prefix_matrix[r1][c2] - prefix_matrix[r2][c1]",
  ],
  hints: [
    { line: 5, hint: "Corner 1 is bottom-right at P[r2+1][c2+1]." },
    { line: 5, hint: "Subtract top region P[r1][c2+1]." },
    { line: 6, hint: "Subtract left region P[r2+1][c1] and re-add top-left overlap P[r1][c1]." },
  ],
  lineExplanations: {
    1: "Defines 2D submatrix region sum query function.",
    2: "Starts docstring explaining 4-corner 2D integral prefix table lookup.",
    3: "Describes mathematical contract: query sum in O(1) time.",
    4: "Ends function docstring.",
    5: "Evaluates bottom-right corner inclusion and top-right region subtraction.",
    6: "Evaluates bottom-left region subtraction and top-left overlap re-addition.",
    7: "Returns computed total scalar submatrix region sum.",
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
    "In object detection models (e.g. R-CNN, YOLO, Region of Interest Pooling), spatial attention windowing, and 2D convolution feature extractions, computing the sum of matrix elements inside arbitrary rectangular bounding boxes $[r_1..r_2, c_1..c_2]$ in $\\mathcal{O}(1)$ constant time is achieved using 2D integral images (prefix sum grids).\n\nGiven a pre-computed 2D prefix matrix $P$ of dimension $(M+1) \\times (N+1)$ where $P[r+1][c+1]$ holds the sum of all elements in submatrix $[0..r, 0..c]$, any arbitrary rectangular submatrix sum is computed with 4 corner lookups via the inclusion-exclusion principle:\n$$\\text{Sum} = P[r_2+1][c_2+1] - P[r_1][c_2+1] - P[r_2+1][c_1] + P[r_1][c_1]$$",
  constraints: [
    "prefix_matrix.length >= 2",
    "prefix_matrix[0].length >= 2",
    "0 <= r1 <= r2 < M",
    "0 <= c1 <= c2 < N",
  ],
  examples: [
    {
      kind: "basic",
      title: "3x3 Submatrix Query",
      inputDisplay: "r1=1, c1=1, r2=3, c2=3 on 4x4 matrix",
      outputDisplay: "99",
      input: DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
      output: "99",
      explanation: "Evaluates 4-corner formula: 136 - 10 - 28 + 1 = 99.",
    },
    {
      kind: "complex",
      title: "1x1 Single Cell Query",
      inputDisplay: "r1=0, c1=0, r2=0, c2=0 on 4x4 matrix",
      outputDisplay: "1",
      input: {
        ...DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
        r1: 0,
        c1: 0,
        r2: 0,
        c2: 0,
      },
      output: "1",
      explanation: "Single element at (0,0): P[1][1] - P[0][1] - P[1][0] + P[0][0] = 1 - 0 - 0 + 0 = 1.",
    },
  ],
  code: SUBMATRIXSUM2DQUERY_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(1) constant time to perform 4 array lookups and arithmetic operations.",
    space: "O(1) auxiliary space beyond the pre-computed integral image grid.",
  },
  topicGuide: {
    overview:
      "2D Submatrix Region Sum Querying using integral images is a core algorithmic primitive in computer vision, image processing, and spatial neural network layers. By building a 2D cumulative sum grid $P$, any bounding box sum across millions of candidate regions can be computed in guaranteed $\\mathcal{O}(1)$ time.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Calculating submatrix sums naively by looping over rows $r_1..r_2$ and columns $c_1..c_2$ takes $\\mathcal{O}(H \\times W)$ time per query. When performing millions of region queries per frame, naive scanning degrades throughput. 2D prefix sum tables (integral images) pre-calculate cumulative rectangular sums from origin $(0,0)$ to $(r,c)$, reducing region sum queries to $\\mathcal{O}(1)$ constant time.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Real-world applications include Box Blur filters, Viola-Jones face detection, Region of Interest (RoI) Pooling in Faster R-CNN, sliding window spatial feature extraction, and fast 2D attention mask summation.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "To find the sum of submatrix $[r_1..r_2, c_1..c_2]$:\n1. Take total sum from $(0,0)$ to $(r_2, c_2)$: $P[r_2+1][c_2+1]$.\n2. Subtract top rectangle above $r_1$: $P[r_1][c_2+1]$.\n3. Subtract left rectangle left of $c_1$: $P[r_2+1][c_1]$.\n4. Re-add top-left overlap subtracted twice: $P[r_1][c_1]$.\n$$\\text{Result} = P[r_2+1][c_2+1] - P[r_1][c_2+1] - P[r_2+1][c_1] + P[r_1][c_1]$$",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Preprocessing the integral image takes $\\mathcal{O}(M \\times N)$ time and $\\mathcal{O}(M \\times N)$ memory storage. Once built, queries take $\\mathcal{O}(1)$ time. For dynamic matrices with frequent updates, dynamic segment trees or binary indexed trees are preferred.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Query Time Complexity: $\\mathcal{O}(1)$. Preprocessing Time: $\\mathcal{O}(M \\times N)$. Space Complexity: $\\mathcal{O}(M \\times N)$ for the prefix table.",
      },
    ],
    keyTerms: [
      {
        term: "Integral Image",
        definition: "A 2D prefix table storing cumulative sums from top-left matrix origin.",
      },
      {
        term: "Inclusion-Exclusion Principle",
        definition:
          "Mathematical technique subtracting overlapping sub-regions and re-adding double-subtracted intersections.",
      },
      {
        term: "4-Corner Query",
        definition:
          "Evaluating rectangular region sums using four specific corner entries of an integral matrix.",
      },
      {
        term: "RoI Pooling",
        definition:
          "Region of Interest pooling aggregating feature map sub-regions in neural network object detection.",
      },
    ],
  },
  trivia: SUBMATRIXSUM2DQUERY_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_SUBMATRIXSUM2DQUERY_INPUT,
  generateSteps: generateSubmatrixSum2dQuerySteps,
};
