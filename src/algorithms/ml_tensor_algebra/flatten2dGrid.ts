import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flatten2dGridInput {
  data: number[];
  rows?: number;
  cols?: number;
  target?: number;
}

export const FLATTEN2DGRID_CODE = `def flatten_2d_grid(grid):
    """
    Flattens a 2D matrix into a 1D contiguous row-major memory buffer.
    """
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    flat_buffer = []

    for r in range(rows):
        for c in range(cols):
            flat_idx = r * cols + c
            flat_buffer.append((flat_idx, grid[r][c]))

    return flat_buffer`;

export const DEFAULT_FLATTEN2DGRID_INPUT: flatten2dGridInput = {
  data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120],
  rows: 3,
  cols: 4,
  target: 30,
};

export const generateFlatten2dGridSteps = (input: flatten2dGridInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numRows = Math.max(1, input.rows ?? 3);
  const numCols = Math.max(1, input.cols ?? 4);
  const totalElements = numRows * numCols;
  const rawData =
    input.data && input.data.length >= totalElements
      ? input.data.slice(0, totalElements)
      : [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

  const grid: number[][] = [];
  for (let r = 0; r < numRows; r++) {
    grid.push(rawData.slice(r * numCols, (r + 1) * numCols));
  }

  const buildCells = (
    activeR?: number,
    activeC?: number,
    completedCells: { r: number; c: number }[] = [],
  ): MatrixCellItem[] => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const val = grid[r][c];
        const flatIdx = r * numCols + c;
        const isCompleted = completedCells.some((cell) => cell.r === r && cell.c === c);
        let state: MatrixCellItem["state"] = "default";

        if (isCompleted) {
          state = "sorted";
        } else if (r === activeR && c === activeC) {
          state = "active";
        }

        cells.push({
          row: r,
          col: c,
          value: val,
          label: `(${r},${c})->[${flatIdx}]`,
          state,
        });
      }
    }
    return cells;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
    completedCells: { r: number; c: number }[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: numRows,
        cols: numCols,
        cells: buildCells(activeR, activeC, completedCells),
        rowHeaders: Array.from({ length: numRows }, (_, i) => `Row ${i}`),
        colHeaders: Array.from({ length: numCols }, (_, i) => `Col ${i}`),
        title: "Row-Major 2D Grid Linearization",
      },
      auxiliaryState: {
        customState: {
          rows: String(numRows),
          cols: String(numCols),
          totalElements: String(totalElements),
        },
      },
      variables,
    });
  };

  // Step 1: Init function
  addStep(
    1,
    "Initialize 2D Grid Flattening Engine",
    "Setting up data structures to serialize 2D matrix into a contiguous 1D row-major memory buffer.",
    { rows: numRows, cols: numCols },
  );

  // Step 2: Extract rows
  addStep(
    5,
    "Extract Matrix Row Count",
    `Measured rows = ${numRows}.`,
    { rows: numRows },
  );

  // Step 3: Extract cols
  addStep(
    6,
    "Extract Matrix Column Count",
    `Measured cols = ${numCols}.`,
    { cols: numCols },
  );

  // Step 4: Init flat_buffer
  addStep(
    7,
    "Initialize Flat Buffer Container",
    "Created empty list flat_buffer to store linearized index tuples.",
    { flat_buffer_len: 0 },
  );

  const completedCells: { r: number; c: number }[] = [];

  for (let r = 0; r < numRows; r++) {
    addStep(
      9,
      `Begin Row Iteration r = ${r}`,
      `Iterating outer loop for row index r = ${r} of ${numRows}.`,
      { r, total_rows: numRows },
      r,
    );

    for (let c = 0; c < numCols; c++) {
      const val = grid[r][c];
      const flatIdx = r * numCols + c;

      addStep(
        10,
        `Evaluate Column Index c = ${c} in Row ${r}`,
        `Iterating inner loop for column index c = ${c} of ${numCols}.`,
        { r, c, total_cols: numCols },
        r,
        c,
        completedCells,
      );

      addStep(
        11,
        `Calculate Row-Major Linear Index flat_idx = ${r} * ${numCols} + ${c} = ${flatIdx}`,
        `Mapped 2D coordinate (${r}, ${c}) to 1D physical memory offset flat_idx = ${flatIdx}.`,
        { r, c, flat_idx: flatIdx, cols: numCols },
        r,
        c,
        completedCells,
      );

      completedCells.push({ r, c });
      addStep(
        12,
        `Append Tuple (${flatIdx}, ${val}) to Flat Buffer`,
        `Stored serialized element value ${val} at physical offset ${flatIdx}.`,
        { flat_idx: flatIdx, val, total_flattened: completedCells.length },
        r,
        c,
        completedCells,
      );
    }
  }

  // Return step
  addStep(
    14,
    "Return Serialized 1D Contiguous Buffer",
    `Successfully linearized ${numRows}x${numCols} matrix (${completedCells.length} total elements) into 1D row-major buffer.`,
    { completed: true, total_flattened: completedCells.length },
    undefined,
    undefined,
    completedCells,
  );

  return steps;
};

const FLATTEN2DGRID_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4],
  distractors: [
    "flat_idx = c * rows + r",
    "flat_buffer = grid.T",
    "return grid[0]",
  ],
  hints: [
    {
      line: 11,
      hint: "The row-major indexing formula flat_idx = r * cols + c maps 2D grid coordinates to physical 1D memory offsets.",
    },
    {
      line: 12,
      hint: "Appending (flat_idx, val) tuples preserves physical sequence order for ML tensor serializations.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for 2D grid flattening function.",
    2: "Starts docstring for 2D grid flattening function.",
    3: "Explains serialization of 2D matrix into contiguous 1D row-major memory buffer.",
    4: "Closes docstring for 2D grid flattening function.",
    5: "Measures total row count M in input 2D grid.",
    6: "Measures column count N from first row, defaulting to 0 for empty grid.",
    7: "Initializes empty list flat_buffer to accumulate linearized element tuples.",
    8: "Blank line before row-major iteration loops.",
    9: "Iterates through row index r from 0 to rows - 1.",
    10: "Iterates through column index c from 0 to cols - 1.",
    11: "Calculates physical 1D linear memory index flat_idx = r * cols + c.",
    12: "Appends tuple (flat_idx, grid[r][c]) into flat_buffer container.",
    13: "Blank line before return statement.",
    14: "Returns final flattened contiguous 1D memory buffer array.",
  },
};

export const flatten2dGrid: AlgorithmDefinition<flatten2dGridInput> = {
  id: "flatten-2d-grid",
  title: "Flatten 2D Grid into 1D Contiguous Buffer",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "Deep learning frameworks (PyTorch, TensorFlow, JAX) store multi-dimensional tensors as contiguous 1D memory buffers on CPU and GPU DRAM. Translating 2D grid coordinates $(r, c)$ into 1D physical addresses $\\text{flat\\_idx} = r \\cdot \\text{cols} + c$ is the standard row-major (C-style) memory layout convention.\n\nThis algorithm serializes 2D matrix elements into a flat linear memory buffer while recording row-major index calculations, converting spatial grid structures into contiguous memory layouts.\n\n### Problem Solved & ML Compiler Relevance\nGPU memory controllers issue coalesced 128-bit memory transactions when adjacent SIMT threads access adjacent 1D physical memory addresses. By serializing 2D image patches, activation matrices, or attention weight grids in row-major order, ML kernels ensure maximum memory bandwidth utilization during forward and backward passes.\n\n### Step-by-Step Execution\n1. **Dimension Extraction**: Read row count $M$ and column count $N$.\n2. **Buffer Allocation**: Initialize empty list `flat_buffer` for linearized entries.\n3. **Nested Traversal**: Loop row $r$ from 0 to $M-1$ and column $c$ from 0 to $N-1$.\n4. **Linear Address Calculation**: Compute $\\text{flat\\_idx} = r \\cdot N + c$ and append $(\\text{flat\\_idx}, grid[r][c])$.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard 3x4 Matrix Flattening",
      inputDisplay: "data = [10..120], rows = 3, cols = 4",
      outputDisplay: "12 Tuples: [(0, 10), (1, 20), ..., (11, 120)]",
      input: { data: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120], rows: 3, cols: 4 },
      output: "12 linearized tuples in row-major order",
      explanation: "Serializes a 3x4 2D matrix into a 12-element 1D contiguous memory array.",
    },
    {
      kind: "complex",
      title: "Square 2x2 Matrix Linearization",
      inputDisplay: "data = [1, 2, 3, 4], rows = 2, cols = 2",
      outputDisplay: "4 Tuples: [(0, 1), (1, 2), (2, 3), (3, 4)]",
      input: { data: [1, 2, 3, 4], rows: 2, cols: 2 },
      output: "[(0, 1), (1, 2), (2, 3), (3, 4)]",
      explanation: "Maps 2x2 grid coordinates to physical linear offsets 0, 1, 2, 3.",
    },
    {
      kind: "negative",
      title: "Single Row Matrix Edge Case",
      inputDisplay: "data = [5, 10, 15], rows = 1, cols = 3",
      outputDisplay: "3 Tuples: [(0, 5), (1, 10), (2, 15)]",
      input: { data: [5, 10, 15], rows: 1, cols: 3 },
      output: "[(0, 5), (1, 10), (2, 15)]",
      explanation: "A 1x3 matrix flattens directly into matching 1D offsets.",
    },
  ],
  code: FLATTEN2DGRID_CODE,
  timeComplexity: { best: "O(rows * cols)", average: "O(rows * cols)", worst: "O(rows * cols)" },
  spaceComplexity: "O(rows * cols)",
  complexityAnalysis: {
    time: "O(M * N) linear time visiting each 2D cell exactly once.",
    space: "O(M * N) memory storage for serialized output tuples.",
  },
  topicGuide: {
    overview:
      "Row-major memory linearization is fundamental to C/C++, PyTorch, and CUDA memory layouts. When a 2D matrix is passed to a GPU kernel, it resides in memory as a single contiguous 1D array. Knowing how row-major indexing maps $(r, c)$ coordinates to linear offsets $\\text{idx} = r \\times C + c$ is essential for writing custom ML kernels.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Physical DRAM storage is fundamentally 1-dimensional—it consists of a linear sequence of byte addresses. Multi-dimensional concepts like 2D grids or 4D image tensors are abstractions imposed by compilers. Row-major ordering serializes elements row by row, ensuring element $(r, c+1)$ immediately follows $(r, c)$ in physical RAM with physical address:\n$$\\text{Address}(r, c) = \\text{Base} + (r \\times C + c) \\times \\text{sizeof}(\\text{T})$$",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Row-major flattening is used in Vision Transformer (ViT) patch embedding extraction, flattening activation maps before linear/dense layers, passing 2D tensors to C++ ATen/CUDA extensions, and serializing model checkpoints to disk.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider a $2 \\times 3$ matrix ($R=2, C=3$):\n```\n[ 10, 20, 30 ]\n[ 40, 50, 60 ]\n```\n1. $r=0, c=0$: $\\text{flat\\_idx} = 0 \\times 3 + 0 = 0 \\rightarrow (0, 10)$\n2. $r=0, c=1$: $\\text{flat\\_idx} = 0 \\times 3 + 1 = 1 \\rightarrow (1, 20)$\n3. $r=0, c=2$: $\\text{flat\\_idx} = 0 \\times 3 + 2 = 2 \\rightarrow (2, 30)$\n4. $r=1, c=0$: $\\text{flat\\_idx} = 1 \\times 3 + 0 = 3 \\rightarrow (3, 40)$\n5. $r=1, c=1$: $\\text{flat\\_idx} = 1 \\times 3 + 1 = 4 \\rightarrow (4, 50)$\n6. $r=1, c=2$: $\\text{flat\\_idx} = 1 \\times 3 + 2 = 5 \\rightarrow (5, 60)$",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Row-major layout allows continuous sequential reads along rows with unit stride. However, iterating down columns in row-major memory introduces strided reads with stride $C$, causing DRAM cache line misses unless transposed or loaded into GPU shared memory.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(R \\times C)$ linear sweep over all matrix cells. Space Complexity: $\\mathcal{O}(R \\times C)$ memory allocation for linear output buffer.",
      },
    ],
    keyTerms: [
      {
        term: "Row-Major Order",
        definition:
          "Memory storage layout where consecutive elements of a matrix row are stored in contiguous memory addresses.",
      },
      {
        term: "Linearization",
        definition:
          "Mapping multidimensional grid coordinates into a 1D linear physical memory offset.",
      },
      {
        term: "Stride Arithmetic",
        definition:
          "Mathematical formula (r * cols + c) converting 2D spatial coordinates into 1D memory pointers.",
      },
      {
        term: "Coalesced Memory Access",
        definition:
          "GPU global memory transaction pattern where adjacent threads read contiguous 1D memory addresses in a single DRAM cycle.",
      },
    ],
  },
  trivia: FLATTEN2DGRID_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_FLATTEN2DGRID_INPUT,
  generateSteps: generateFlatten2dGridSteps,
};
