import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rotateImageFlatBufferInput {
  matrix?: number[][];
  data?: number[];
}

export const ROTATEIMAGEFLATBUFFER_CODE = `def rotate_image_flat_buffer(matrix):
    """
    Rotates an N x N 2D tensor 90 degrees clockwise in-place.
    """
    n = len(matrix)

    for r in range(n // 2):
        for c in range(r, n - r - 1):
            temp = matrix[r][c]
            matrix[r][c] = matrix[n - 1 - c][r]
            matrix[n - 1 - c][r] = matrix[n - 1 - r][n - 1 - c]
            matrix[n - 1 - r][n - 1 - c] = matrix[c][n - 1 - r]
            matrix[c][n - 1 - r] = temp

    return matrix`;

export const DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT: rotateImageFlatBufferInput = {
  matrix: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ],
};

export const generateRotateImageFlatBufferSteps = (
  input: rotateImageFlatBufferInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const initialMatrix = input.matrix ?? [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ];

  // Deep clone working matrix so we don't mutate input
  const grid = initialMatrix.map((row) => [...row]);
  const n = grid.length;

  const completedCells = new Set<string>();

  const makeMatrixSnapshot = (
    activePos?: {
      r: number;
      c: number;
      tl: [number, number];
      bl: [number, number];
      br: [number, number];
      tr: [number, number];
    },
    titleText?: string,
  ) => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let state: MatrixCellItem["state"] = "default";
        const cellKey = `${r},${c}`;

        if (completedCells.has(cellKey)) {
          state = "sorted";
        }

        if (activePos) {
          const { tl, bl, br, tr } = activePos;
          if (r === tl[0] && c === tl[1]) state = "pivot";
          else if (r === bl[0] && c === bl[1]) state = "active";
          else if (r === br[0] && c === br[1]) state = "active";
          else if (r === tr[0] && c === tr[1]) state = "active";
        }

        cells.push({
          row: r,
          col: c,
          value: grid[r][c],
          label: `[${r}][${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: n,
      cols: n,
      rowHeaders: Array.from({ length: n }, (_, i) => `Row ${i}`),
      colHeaders: Array.from({ length: n }, (_, i) => `Col ${i}`),
      title: titleText ?? "90° In-Place Matrix Rotation State",
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activePos?: {
      r: number;
      c: number;
      tl: [number, number];
      bl: [number, number];
      br: [number, number];
      tr: [number, number];
    },
    titleText?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(activePos, titleText),
      auxiliaryState: {
        customState: {
          matrixSize: `${n}x${n}`,
          totalRings: String(Math.floor(n / 2)),
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize In-Place 90° Matrix Rotation Engine",
    `Entry into rotate_image_flat_buffer with ${n}x${n} input matrix.`,
    { n },
    undefined,
    "Function Entry",
  );

  // Line 2: Docstring start
  addStep(
    2,
    "Parse Docstring & Rotation Strategy",
    "Rotates an N x N square matrix 90 degrees clockwise in-place using 4-way element cycles across concentric rings.",
    { strategy: "4-Way Ring Swaps", spaceComplexity: "O(1)" },
    undefined,
    "Docstring",
  );

  // Line 3: Docstring body
  addStep(
    3,
    "Review Concentric Ring Mapping",
    "Mapping rule: (r, c) -> (c, n - 1 - r) -> (n - 1 - r, n - 1 - c) -> (n - 1 - c, r) -> (r, c).",
    { cycleLength: 4 },
    undefined,
    "Docstring",
  );

  // Line 4: Docstring end
  addStep(
    4,
    "Finalize Matrix Rotation Setup",
    "Readying loop boundaries for ring index r from 0 to n//2 - 1.",
    { n },
    undefined,
    "Docstring End",
  );

  // Line 5: Read n
  addStep(
    5,
    `Get Matrix Dimension: n = ${n}`,
    `Extracting dimension size n = ${n} from matrix length.`,
    { n },
    undefined,
    "Get Size n",
  );

  // Line 6: Blank line
  addStep(
    6,
    "Prepare Ring Layer Rotation Loops",
    `Beginning ring iteration. Outer loop will run for r = 0 to ${Math.floor(n / 2) - 1}.`,
    { numRings: Math.floor(n / 2) },
    undefined,
    "Start Loops",
  );

  // Nested rotation loops
  const maxR = Math.floor(n / 2);
  for (let r = 0; r < maxR; r++) {
    for (let c = r; c < n - r - 1; c++) {
      const tl: [number, number] = [r, c];
      const bl: [number, number] = [n - 1 - c, r];
      const br: [number, number] = [n - 1 - r, n - 1 - c];
      const tr: [number, number] = [c, n - 1 - r];
      const activePos = { r, c, tl, bl, br, tr };

      // Line 7: Outer loop
      addStep(
        7,
        `Ring Layer Loop r = ${r}`,
        `Processing concentric layer ring ${r} of ${maxR}.`,
        { r, maxR },
        activePos,
        `Ring Layer ${r}`,
      );

      // Line 8: Inner loop
      addStep(
        8,
        `Column Offset Loop c = ${c}`,
        `Processing 4-element cycle starting at top-left position (${r}, ${c}).`,
        { r, c, targetTR: `(${tr[0]},${tr[1]})`, targetBR: `(${br[0]},${br[1]})`, targetBL: `(${bl[0]},${bl[1]})` },
        activePos,
        `Ring ${r}, Col ${c} Cycle`,
      );

      // Line 9: temp = matrix[r][c]
      const temp = grid[r][c];
      addStep(
        9,
        `Store Temp = matrix[${r}][${c}] (${temp})`,
        `Saving top-left element grid[${r}][${c}] (${temp}) into scalar temporary variable.`,
        { r, c, temp },
        activePos,
        `Store Temp = ${temp}`,
      );

      // Line 10: matrix[r][c] = matrix[n-1-c][r]
      const blVal = grid[bl[0]][bl[1]];
      grid[r][c] = blVal;
      addStep(
        10,
        `Copy Bottom-Left (${blVal}) to Top-Left (${r}, ${c})`,
        `Moving bottom-left cell grid[${bl[0]}][${bl[1]}] (${blVal}) to top-left position (${r}, ${c}).`,
        { r, c, blVal },
        activePos,
        `TopLeft = ${blVal}`,
      );

      // Line 11: matrix[n-1-c][r] = matrix[n-1-r][n-1-c]
      const brVal = grid[br[0]][br[1]];
      grid[bl[0]][bl[1]] = brVal;
      addStep(
        11,
        `Copy Bottom-Right (${brVal}) to Bottom-Left (${bl[0]}, ${bl[1]})`,
        `Moving bottom-right cell grid[${br[0]}][${br[1]}] (${brVal}) to bottom-left position (${bl[0]}, ${bl[1]}).`,
        { blR: bl[0], blC: bl[1], brVal },
        activePos,
        `BotLeft = ${brVal}`,
      );

      // Line 12: matrix[n-1-r][n-1-c] = matrix[c][n-1-r]
      const trVal = grid[tr[0]][tr[1]];
      grid[br[0]][br[1]] = trVal;
      addStep(
        12,
        `Copy Top-Right (${trVal}) to Bottom-Right (${br[0]}, ${br[1]})`,
        `Moving top-right cell grid[${tr[0]}][${tr[1]}] (${trVal}) to bottom-right position (${br[0]}, ${br[1]}).`,
        { brR: br[0], brC: br[1], trVal },
        activePos,
        `BotRight = ${trVal}`,
      );

      // Line 13: matrix[c][n-1-r] = temp
      grid[tr[0]][tr[1]] = temp;
      addStep(
        13,
        `Copy Temp (${temp}) to Top-Right (${tr[0]}, ${tr[1]})`,
        `Assigning saved temp value (${temp}) into top-right position (${tr[0]}, ${tr[1]}).`,
        { trR: tr[0], trC: tr[1], temp },
        activePos,
        `TopRight = ${temp}`,
      );

      // Mark the 4 swapped cells as completed
      completedCells.add(`${tl[0]},${tl[1]}`);
      completedCells.add(`${bl[0]},${bl[1]}`);
      completedCells.add(`${br[0]},${br[1]}`);
      completedCells.add(`${tr[0]},${tr[1]}`);
    }
  }

  // Line 14: Blank line
  addStep(
    14,
    "All Concentric Ring Cycles Completed",
    "Completed 90° clockwise in-place rotation for all ring layers.",
    { totalRotated: completedCells.size },
    undefined,
    "Rings Complete",
  );

  // Line 15: Return matrix
  addStep(
    15,
    "Return Rotated Matrix",
    "Returning 90° clockwise rotated matrix buffer.",
    { matrix: JSON.stringify(grid) },
    undefined,
    "Return Rotated Matrix",
  );

  return steps;
};

const ROTATEIMAGEFLATBUFFER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "matrix[r][c] = matrix[c][r]",
    "matrix[r][c] = matrix[n-1-r][n-1-c]",
    "temp = matrix[c][r]",
  ],
  hints: [{ line: 10, hint: "Perform 4-way cyclic element swap: top-left <- bottom-left <- bottom-right <- top-right <- temp." }],
  lineExplanations: {
    1: "Function declaration taking N x N matrix input.",
    2: "Opening docstring for 90-degree clockwise matrix rotation.",
    3: "Documentation describing in-place ring-by-ring 4-way cyclic swapping.",
    4: "Closing docstring for 90-degree clockwise matrix rotation.",
    5: "Retrieves grid size n from matrix length.",
    6: "Empty line separating initialization from loop structure.",
    7: "Outer loop iterating over concentric ring layers r from 0 to n//2 - 1.",
    8: "Inner loop iterating over element column offsets c within current ring.",
    9: "Saves top-left cell matrix[r][c] into temporary variable.",
    10: "Moves bottom-left cell matrix[n-1-c][r] into top-left position matrix[r][c].",
    11: "Moves bottom-right cell matrix[n-1-r][n-1-c] into bottom-left position.",
    12: "Moves top-right cell matrix[c][n-1-r] into bottom-right position.",
    13: "Assigns saved temp value into top-right position matrix[c][n-1-r].",
    14: "Empty line separating rotation loops from return statement.",
    15: "Returns rotated N x N matrix in-place.",
  },
};

export const rotateImageFlatBuffer: AlgorithmDefinition<rotateImageFlatBufferInput> = {
  id: "rotate-image-flat-buffer",
  title: "Rotate 2D Tensor 90 Degrees in Flat Memory",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In computer vision data augmentation, tensor layout transformations (e.g. PyTorch `torchvision.transforms.v2`, OpenCV image preprocessing, TensorRT vision pipelines), rotating an image batch 90 degrees clockwise is a fundamental operation.\n\nPerforming matrix rotation in-place without allocating auxiliary memory buffers optimizes memory bandwidth and prevents GPU DRAM allocation overhead.\n\nThis algorithm implements 90-degree clockwise square matrix rotation in $\\mathcal{O}(1)$ auxiliary space by processing concentric square rings from the outermost perimeter inward, rotating groups of 4 elements in a cycle:\n$$(r, c) \\rightarrow (c, N-1-r) \\rightarrow (N-1-r, N-1-c) \\rightarrow (N-1-c, r) \\rightarrow (r, c)$$",
  constraints: [
    "1 <= matrix.length == matrix[i].length <= 100",
    "-1000 <= matrix[i][j] <= 1000",
  ],
  examples: [
    {
      kind: "basic",
      title: "3x3 Matrix 90° Clockwise Rotation",
      inputDisplay: "matrix = [[1,2,3],[4,5,6],[7,8,9]]",
      outputDisplay: "[[7,4,1],[8,5,2],[9,6,3]]",
      input: {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
          [7, 8, 9],
        ],
      },
      output: "[[7,4,1],[8,5,2],[9,6,3]]",
      explanation: "Rotates 3x3 matrix 90 degrees clockwise in-place.",
    },
    {
      kind: "complex",
      title: "4x4 Matrix 90° Clockwise Rotation",
      inputDisplay: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]",
      outputDisplay: "[[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]]",
      input: {
        matrix: [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
        ],
      },
      output: "[[13,9,5,1],[14,10,6,2],[15,11,7,3],[16,12,8,4]]",
      explanation: "Evaluates 2 concentric ring layers across 4x4 grid.",
    },
    {
      kind: "negative",
      title: "1x1 Single Cell Matrix",
      inputDisplay: "matrix = [[42]]",
      outputDisplay: "[[42]]",
      input: { matrix: [[42]] },
      output: "[[42]]",
      explanation: "1x1 matrix rotation is a no-op.",
    },
  ],
  code: ROTATEIMAGEFLATBUFFER_CODE,
  timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(N^2) time to visit each element in the N x N grid exactly once.",
    space: "O(1) auxiliary space since rotation is performed strictly in-place using one scalar temp variable.",
  },
  topicGuide: {
    overview:
      "In-place 90-degree matrix rotation rotates concentric square rings layer-by-layer from the outside in. Each 4-element ring cycle moves elements $(r, c) \\rightarrow (c, N - 1 - r) \\rightarrow (N - 1 - r, N - 1 - c) \\rightarrow (N - 1 - c, r) \\rightarrow (r, c)$. Executing this swap in-place achieves zero memory allocation overhead.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "A 90-degree clockwise rotation maps element $(r, c)$ to position $(c, N - 1 - r)$. Following this mapping 4 times returns to the original cell:\n$$(r, c) \\rightarrow (c, N - 1 - r) \\rightarrow (N - 1 - r, N - 1 - c) \\rightarrow (N - 1 - c, r) \\rightarrow (r, c)$$\nBy saving one element in a scalar temporary variable, all 4 positions are updated in-place without needing a second matrix copy.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Image augmentation in deep learning (random rotations, flipping), spatial image processing in OpenCV/TensorRT, and matrix transposition pipelines rely on efficient in-place ring permutations to save memory bandwidth.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For a $4 \\times 4$ matrix, ring 0 covers corners $(0,0), (0,3), (3,3), (3,0)$ and edge groups. For each cycle, save top-left to `temp`, copy bottom-left to top-left, copy bottom-right to bottom-left, copy top-right to bottom-right, and place `temp` in top-right.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "While in-place rotation saves $\\mathcal{O}(N^2)$ memory footprint, non-contiguous strided writes can cause L1/L2 cache line misses on CPUs and uncoalesced memory access on GPUs. Modern vision accelerators load tiles into shared memory (SRAM) before applying rotation permutations.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Total elements swapped is $\\frac{N^2}{4} \\times 4 = N^2$ elements. Time complexity is $\\mathcal{O}(N^2)$. Space complexity is strictly $\\mathcal{O}(1)$ extra memory.",
      },
    ],
    keyTerms: [
      {
        term: "In-Place Permutation",
        definition: "Rearranging dataset elements within their original memory allocation without extra storage.",
      },
      {
        term: "Concentric Ring Layers",
        definition: "Perimeter rings of a square matrix processed layer-by-layer from outside boundary to center.",
      },
      {
        term: "4-Way Cyclic Swap",
        definition: "Rotating 4 corresponding corner/edge elements simultaneously in a circular assignment.",
      },
      {
        term: "Coordinate Transformation",
        definition: "Mapping matrix index (r, c) to rotated position (c, n - 1 - r).",
      },
    ],
  },
  trivia: ROTATEIMAGEFLATBUFFER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ROTATEIMAGEFLATBUFFER_INPUT,
  generateSteps: generateRotateImageFlatBufferSteps,
};
