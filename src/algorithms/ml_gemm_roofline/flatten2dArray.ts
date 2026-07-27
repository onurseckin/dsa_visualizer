import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flatten2dArrayInput {
  matrix?: number[][];
  data?: number[];
  target?: number;
}

export const FLATTEN2DARRAY_CODE = `def flatten_2d_array(matrix):
    """
    Linearizes 2D row-major matrix into contiguous 1D memory array.
    """
    flat = []
    for row in matrix:
        for val in row:
            flat.append(val)
    return flat`;

export const DEFAULT_FLATTEN2DARRAY_INPUT: flatten2dArrayInput = {
  matrix: [
    [10, 20, 30, 40],
    [50, 60, 70, 80],
    [90, 100, 110, 120],
    [130, 140, 150, 160],
  ],
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateFlatten2dArraySteps = (input: flatten2dArrayInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrix =
    input.matrix && input.matrix.length > 0
      ? input.matrix
      : [
          [10, 20, 30, 40],
          [50, 60, 70, 80],
          [90, 100, 110, 120],
          [130, 140, 150, 160],
        ];

  const m = matrix.length;
  const n = matrix[0].length;
  const flat: number[] = [];

  const getMatrixSnapshot = (
    currentR?: number,
    currentC?: number,
    phase: string = "init",
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];

    // Rows 0..m-1: Input 2D Matrix
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        const isCurrent = r === currentR && c === currentC;
        const flatIdx = r * n + c;
        const isProcessed = flatIdx < flat.length;

        let state: MatrixCellItem["state"] = "default";
        if (isCurrent) {
          state = "active";
        } else if (isProcessed || phase === "complete") {
          state = "sorted";
        } else if (r === currentR) {
          state = "compared";
        }

        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: `M[${r},${c}]`,
          state,
        });
      }
    }

    // Row m: Linearized 1D Buffer Preview
    for (let c = 0; c < n; c++) {
      const showVal = c < flat.length ? flat[c] : "-";
      cells.push({
        row: m,
        col: c,
        value: showVal,
        label: `Flat[${c}]`,
        state: c < flat.length ? "sorted" : "inactive",
      });
    }

    return {
      kind: "matrix",
      rows: m + 1,
      cols: n,
      title: `1D Memory Linearization (${m}x${n} Grid -> Flat Buffer [${flat.length}/${m * n}])`,
      rowHeaders: [
        ...Array.from({ length: m }, (_, idx) => `Grid Row ${idx}`),
        "1D Flat Buffer",
      ],
      colHeaders: Array.from({ length: n }, (_, idx) => `Col ${idx}`),
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
          m: String(m),
          n: String(n),
          matrix: JSON.stringify(matrix),
          flat: `[${flat.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Line 1: Setup
  addStep(
    1,
    "Initialize 1D Buffer Matrix Linearization Engine",
    `Setting up row-major serialization for ${m}x${n} 2D matrix input.`,
    { m, n },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Linearizes 2D row-major matrix into contiguous 1D memory array.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Line 5: Allocate flat array
  addStep(
    5,
    "Initialize 1D Linear Output Array",
    "Allocated flat list for contiguous 1D memory layout.",
    { flat: "[]" },
  );

  // Lines 6-8: Row and Val iteration
  for (let r = 0; r < m; r++) {
    addStep(
      6,
      `Iterate Matrix Row r=${r}`,
      `Traversing row ${r} of 2D matrix [${matrix[r].join(", ")}].`,
      { r, row_data: `[${matrix[r].join(", ")}]` },
      r,
      undefined,
      "row_iter",
    );

    for (let c = 0; c < n; c++) {
      const val = matrix[r][c];
      addStep(
        7,
        `Read Scalar Value matrix[${r}][${c}] = ${val}`,
        `Fetched element ${val} at 2D grid position (${r}, ${c}).`,
        { r, c, val },
        r,
        c,
        "val_read",
      );

      flat.push(val);
      const flatIndex = flat.length - 1;
      addStep(
        8,
        `Append Value ${val} to 1D Buffer Index ${flatIndex}`,
        `Serialized grid element (${r}, ${c}) into 1D memory offset ${flatIndex} (Index = ${r}*${n} + ${c} = ${flatIndex}).`,
        { r, c, val, flat_index: flatIndex, flat: `[${flat.join(", ")}]` },
        r,
        c,
        "val_append",
      );
    }
  }

  // Line 9: Return
  addStep(
    9,
    "Matrix Linearization Complete",
    `Successfully flattened ${m}x${n} 2D matrix into ${flat.length}-element 1D contiguous memory buffer.`,
    { completed: true, total_elements: flat.length },
    undefined,
    undefined,
    "complete",
  );

  return steps;
};

const FLATTEN2DARRAY_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "flat.extend(row[::-1])  # Reversing row elements breaking row-major order",
    "flat.append(row)  # Appending 1D rows resulting in 2D list instead of flat array",
    "return matrix[::-1]",
  ],
  hints: [
    { line: 6, hint: "Iterate row-by-row to preserve row-major memory order." },
    { line: 8, hint: "Append scalar elements to build contiguous 1D memory buffer." },
  ],
  lineExplanations: {
    1: "Defines flatten_2d_array function accepting a 2D matrix parameter.",
    2: "Starts docstring detailing 2D row-major matrix linearization into 1D memory.",
    3: "Explains serializing 2D grid structures into contiguous 1D memory buffers.",
    4: "Closes function docstring.",
    5: "Initializes empty flat list to store linear 1D memory elements.",
    6: "Iterates through each 1D row array in the 2D matrix grid.",
    7: "Iterates through each scalar value entry val in the current row.",
    8: "Appends scalar value entry val into the 1D flat memory array.",
    9: "Returns linearized 1D contiguous memory array.",
  },
};

export const flatten2dArray: AlgorithmDefinition<flatten2dArrayInput> = {
  id: "flatten-2d-array",
  title: "1D Buffer Matrix Flattening",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description: `High-performance linear algebra libraries (such as cuBLAS \`sgemm\`, PyTorch C++ ATen, NumPy C API, and C++ SIMD vector routines) require matrix data to be stored as 1D contiguous memory buffers in physical RAM/VRAM.

While human software abstractions represent matrices as 2D grids (rows and columns), physical memory chips (DRAM/SRAM) are strictly 1D arrays of bytes addressed linearly. Flattening (linearizing) an $M \\times N$ matrix into a 1D contiguous array using Row-Major Order maps element $(r, c)$ to 1D linear memory address offset:
$$\\text{idx} = r \\times N + c$$

This algorithm simulates 1D Buffer Matrix Flattening step-by-step, visualizing row-major grid traversal, scalar extraction, 1D index offset computation, and output buffer generation.`,
  constraints: ["1 <= rows, cols <= 64", "-10^9 <= matrix[r][c] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard 4x4 Row-Major Flattening",
      inputDisplay: "Matrix (4x4 Grid)",
      outputDisplay: "Flat Array [10, 20, 30, ..., 160]",
      input: DEFAULT_FLATTEN2DARRAY_INPUT,
      output: "Flat Array [10, 20, 30, ..., 160]",
      explanation: "Serializes 4x4 matrix into a 16-element contiguous 1D linear array in row-major order.",
    },
    {
      kind: "complex",
      title: "Asymmetric 2x3 Grid Flattening",
      inputDisplay: "Matrix [[1, 2, 3], [4, 5, 6]]",
      outputDisplay: "Flat Array [1, 2, 3, 4, 5, 6]",
      input: {
        matrix: [
          [1, 2, 3],
          [4, 5, 6],
        ],
      },
      output: "Flat Array [1, 2, 3, 4, 5, 6]",
      explanation: "Evaluates exact row-major mapping for a 2x3 asymmetric matrix.",
    },
  ],
  code: FLATTEN2DARRAY_CODE,
  timeComplexity: { best: "O(M * N)", average: "O(M * N)", worst: "O(M * N)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Requires O(M * N) linear time to iterate through M rows and N columns.",
    space: "O(M * N) space to store the output 1D linear buffer array.",
  },
  topicGuide: {
    overview:
      "Buffer linearization is the foundational step bridging high-level multi-dimensional tensor abstractions with low-level physical memory hardware. In C, Python (NumPy/PyTorch), and CUDA C++, 2D matrices are stored in Row-Major order where elements of consecutive row entries occupy contiguous memory addresses.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Physical computer memory (DRAM/SRAM) is indexed linearly by 64-bit integer byte addresses. To store a 2D matrix $M$ of shape $R \\times C$ in memory, software defines mapping function $\\text{Index}(r, c) = r \\times C + c$. In Column-Major order (Fortran/BLAS), $\\text{Index}(r, c) = c \\times R + r$. Hardware cache lines load contiguous memory blocks (e.g. 64 bytes), so row-major iteration matches cache prefetching patterns.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Matrix flattening solves format incompatibilities between tensor libraries, C++ CUDA kernel interfaces, SIMD vector instructions (AVX-512, ARM Neon), and neural network linear dense layers. In PyTorch, calling `tensor.view(-1)` or `tensor.flatten()` performs this exact operation.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider a $2 \\times 3$ matrix `[[10, 20, 30], [40, 50, 60]]` ($C=3$):\n1. Row 0 appends 10 (idx 0), 20 (idx 1), 30 (idx 2).\n2. Row 1 appends 40 (idx $3 = 1 \\times 3 + 0$), 50 (idx $4 = 1 \\times 3 + 1$), 60 (idx $5 = 1 \\times 3 + 2$).\nThe resulting 1D buffer `[10, 20, 30, 40, 50, 60]` can be directly passed to C/CUDA BLAS subroutines.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "If a tensor is sliced or transposed in PyTorch, its underlying memory stride changes (non-contiguous tensor). Passing a non-contiguous tensor to CUDA kernels causes invalid memory access or incorrect calculation unless `.contiguous()` is invoked to re-flatten the tensor into contiguous memory.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(R \\times C)$ linear time to copy all grid elements. Space Complexity: $\\mathcal{O}(R \\times C)$ memory for output 1D linear buffer.",
      },
    ],
    keyTerms: [
      {
        term: "Row-Major Order",
        definition:
          "Memory layout storing elements of a row in contiguous sequential memory addresses.",
      },
      {
        term: "Buffer Linearization",
        definition:
          "Converting multi-dimensional matrix grid structures into a 1D flat array.",
      },
      {
        term: "Memory Stride",
        definition:
          "The number of elements in memory between successive entries along a given tensor dimension.",
      },
      {
        term: "Contiguous Memory",
        definition:
          "Memory allocation occupying an uninterrupted sequence of physical byte addresses.",
      },
    ],
  },
  trivia: FLATTEN2DARRAY_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_FLATTEN2DARRAY_INPUT,
  generateSteps: generateFlatten2dArraySteps,
};
