import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface transposeSquareMatrixInput {
  matrix: number[][];
}

export const TRANSPOSESQUAREMATRIX_CODE = `def transpose_square_matrix(matrix):
    """
    Transposes a square matrix in-place by swapping symmetric upper/lower entries.
    """
    n = len(matrix)

    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]

    return matrix`;

export const DEFAULT_TRANSPOSESQUAREMATRIX_INPUT: transposeSquareMatrixInput = {
  matrix: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10],
    [11, 12, 13, 14, 15],
    [16, 17, 18, 19, 20],
    [21, 22, 23, 24, 25],
  ],
};

export const generateTransposeSquareMatrixSteps = (
  input: transposeSquareMatrixInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  // Deep copy matrix so step generation doesn't mutate input
  const matrix: number[][] = input.matrix.map((row) => [...row]);
  const n = matrix.length;

  const buildMatrixSnapshot = (
    activePair: [number, number] | null,
    swappedPairs: Set<string>,
    title: string,
  ) => {
    const cells: MatrixCellItem[] = [];
    const [actR, actC] = activePair ?? [-1, -1];

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let state: MatrixCellItem["state"] = "default";
        if (r === c) {
          state = "pivot"; // Main diagonal
        } else if ((r === actR && c === actC) || (r === actC && c === actR)) {
          state = "active"; // Active swap pair
        } else if (swappedPairs.has(`${r},${c}`)) {
          state = "sorted"; // Already swapped off-diagonal
        }

        cells.push({
          row: r,
          col: c,
          value: matrix[r][c],
          label: `[${r}][${c}]`,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: n,
      cols: n,
      cells,
      rowHeaders: Array.from({ length: n }, (_, i) => `R${i}`),
      colHeaders: Array.from({ length: n }, (_, i) => `C${i}`),
      title,
    };
  };

  const swappedPairs = new Set<string>();

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activePair: [number, number] | null = null,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildMatrixSnapshot(
        activePair,
        swappedPairs,
        `In-Place Square Matrix Transpose (${n}x${n})`,
      ),
      auxiliaryState: {
        customState: {
          matrixSize: `${n}x${n}`,
          swappedCount: swappedPairs.size / 2,
          totalSwaps: (n * (n - 1)) / 2,
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    `Call transpose_square_matrix(matrix) [${n}x${n}]`,
    `Starting in-place matrix transposition for a ${n}x${n} square matrix.`,
    { n },
  );

  // Line 5: n = len(matrix)
  addStep(
    5,
    `n = len(matrix) -> ${n}`,
    `Determined matrix dimension N = ${n}. Total off-diagonal swap pairs = ${n * (n - 1) / 2}.`,
    { n },
  );

  // Loop through rows
  for (let r = 0; r < n; r++) {
    // Line 7: Row loop header
    addStep(
      7,
      `Outer loop: r = ${r} of ${n}`,
      `Inspecting row ${r}. Off-diagonal elements start at column c = ${r + 1}.`,
      { r, n },
    );

    for (let c = r + 1; c < n; c++) {
      // Line 8: Column loop header
      addStep(
        8,
        `Inner loop: c = ${c} (inspecting pair matrix[${r}][${c}] and matrix[${c}][${r}])`,
        `Identified symmetric element pair at (${r}, ${c}) = ${matrix[r][c]} and (${c}, ${r}) = ${matrix[c][r]}.`,
        { r, c, val_rc: matrix[r][c], val_cr: matrix[c][r] },
        [r, c],
      );

      // Line 9: Swap execution
      const valRC = matrix[r][c];
      const valCR = matrix[c][r];
      matrix[r][c] = valCR;
      matrix[c][r] = valRC;

      swappedPairs.add(`${r},${c}`);
      swappedPairs.add(`${c},${r}`);

      addStep(
        9,
        `matrix[${r}][${c}], matrix[${c}][${r}] = matrix[${c}][${r}], matrix[${r}][${c}]`,
        `Swapped symmetric entries! Position (${r}, ${c}) is now ${matrix[r][c]} and (${c}, ${r}) is now ${matrix[c][r]}.`,
        { r, c, new_val_rc: matrix[r][c], new_val_cr: matrix[c][r] },
        [r, c],
      );
    }
  }

  // Line 11: Return matrix
  addStep(
    11,
    `Return transposed matrix [${n}x${n}]`,
    `Completed in-place transposition. All symmetric element pairs swapped cleanly around main diagonal.`,
    { n, completed: true },
  );

  return steps;
};

const TRANSPOSESQUAREMATRIX_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "for c in range(n): matrix[r][c] = matrix[c][r]",
    "matrix[r][c] = matrix[c][r]",
    "return matrix.T",
  ],
  hints: [{ line: 8, hint: "Start column iteration at r + 1 to avoid double-swapping symmetric elements." }],
  lineExplanations: {
    1: "Defines entry point for in-place square matrix transposition.",
    2: "Docstring opening tag.",
    3: "Describes in-place symmetric upper/lower triangle element swapping.",
    4: "Docstring closing tag.",
    5: "Gets dimension size N of square matrix (rows == columns == N).",
    6: "Blank line preceding outer row iteration loop.",
    7: "Iterates through row index r from 0 to N-1.",
    8: "Iterates through upper-triangle column index c from r + 1 to N-1.",
    9: "Swaps upper-triangle element matrix[r][c] with symmetric lower-triangle element matrix[c][r].",
    10: "Blank line preceding matrix return statement.",
    11: "Returns in-place transposed matrix.",
  },
};

export const transposeSquareMatrix: AlgorithmDefinition<transposeSquareMatrixInput> = {
  id: "transpose-square-matrix",
  title: "In-Place Square Matrix Transpose",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "Matrix transposition ($M^T$) flips a matrix over its main diagonal, switching row and column indices: $M^T[r][c] = M[c][r]$. Transposition is a crucial primitive in linear algebra, deep learning backpropagation (computing gradients with respect to weights: $\\frac{\\partial L}{\\partial X} = \\frac{\\partial L}{\\partial Y} W^T$), and self-attention mechanisms (computing Query-Key affinity matrices $Q K^T$).\n\nFor a square $N \\times N$ matrix stored as a 2D memory grid, in-place transposition swaps off-diagonal symmetric elements $(r, c)$ and $(c, r)$ in-place without allocating auxiliary matrix buffers, achieving optimal $\\mathcal{O}(1)$ extra space.\n\nTo avoid undoing swaps by double-processing elements, column loop index $c$ starts strictly above the main diagonal ($c = r + 1$), restricting traversal strictly to the upper triangle of the matrix.",
  constraints: ["1 <= N <= 64", "matrix.length == matrix[i].length"],
  examples: [
    {
      kind: "basic",
      title: "Standard 5x5 Square Matrix",
      inputDisplay: "matrix = [[1..5], [6..10], [11..15], [16..20], [21..25]]",
      outputDisplay: "Transposed 5x5 matrix",
      input: {
        matrix: [
          [1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10],
          [11, 12, 13, 14, 15],
          [16, 17, 18, 19, 20],
          [21, 22, 23, 24, 25],
        ],
      },
      output: "Transposed matrix",
      explanation: "Swapped upper triangle elements with symmetric lower triangle entries in-place.",
    },
    {
      kind: "complex",
      title: "Symmetric 3x3 Matrix",
      inputDisplay: "matrix = [[1, 7, 3], [7, 4, -5], [3, -5, 6]]",
      outputDisplay: "[[1, 7, 3], [7, 4, -5], [3, -5, 6]]",
      input: {
        matrix: [
          [1, 7, 3],
          [7, 4, -5],
          [3, -5, 6],
        ],
      },
      output: "[[1, 7, 3], [7, 4, -5], [3, -5, 6]]",
      explanation: "Symmetric matrix transpose produces identical numerical output.",
    },
    {
      kind: "negative",
      title: "1x1 Single-Element Matrix",
      inputDisplay: "matrix = [[42]]",
      outputDisplay: "[[42]]",
      input: { matrix: [[42]] },
      output: "[[42]]",
      explanation: "Single-element matrix has no off-diagonal elements; loop terminates cleanly.",
    },
  ],
  code: TRANSPOSESQUAREMATRIX_CODE,
  timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(N^2) visits N*(N-1)/2 upper triangle element pairs exactly once.",
    space: "O(1) auxiliary space because element swaps execute in-place.",
  },
  topicGuide: {
    overview:
      "In-place square matrix transposition is a fundamental tensor manipulation primitive used extensively in BLAS libraries, GPU CUDA kernels, and deep learning runtime engines. Swapping off-diagonal entries across the main diagonal reorganizes matrix memory layouts between row-major and column-major orientations without requiring extra DRAM allocations.\n\nWhile conceptually simple, executing high-performance matrix transpose on modern hardware presents significant cache memory and GPU warp coalescing challenges.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "For any matrix $M$, its transpose $M^T$ satisfies $(M^T)_{r,c} = M_{c,r}$. In vector spaces, matrix transposition represents the adjoint of a linear operator. In deep learning backpropagation, computing the gradient of a matrix multiplication $Y = X W$ with respect to input $X$ yields:\n$$\\frac{\\partial L}{\\partial X} = \\frac{\\partial L}{\\partial Y} W^T$$\nnecessitating efficient transposition during every backward pass step.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "In Transformers, multi-head attention computes scaled dot-product attention:\n$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$\nKey tensor $K$ (shape $[B, H, S, D]$) must be transposed along its last two dimensions to match Query tensor $Q$ (shape $[B, H, S, D]$) for batched matrix multiplication.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Consider a $3 \\times 3$ matrix `[[1, 2, 3], [4, 5, 6], [7, 8, 9]]`. Main diagonal elements $[1, 5, 9]$ at $(0,0), (1,1), (2,2)$ remain fixed. Upper triangle pairs $(r, c)$ swapped with $(c, r)$ are:\n1. $(0,1)$ val $2 \\leftrightarrow (1,0)$ val $4$.\n2. $(0,2)$ val $3 \\leftrightarrow (2,0)$ val $7$.\n3. $(1,2)$ val $6 \\leftrightarrow (2,1)$ val $8$.\nResulting transposed matrix is `[[1, 4, 7], [2, 5, 8], [3, 6, 9]]`.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "On CPU and GPU hardware, naive strided matrix transpose suffers from severe memory access penalties. Reading along rows (stride 1) and writing along columns (stride $N$) causes cache line thrashing on CPU and non-coalesced DRAM writes on GPU. High-performance CUDA transpose kernels solve this by loading $32 \\times 32$ tiles into shared memory (SRAM), applying $33 \\times 32$ padding to eliminate bank conflicts, and writing coalesced rows back to DRAM.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(N^2)$ total scalar reads and writes. The inner loop executes $\\frac{N(N-1)}{2}$ iterations. Space Complexity: $\\mathcal{O}(1)$ auxiliary space.",
      },
    ],
    keyTerms: [
      {
        term: "Main Diagonal",
        definition: "The set of matrix entries M[i][i] running from top-left to bottom-right where row index equals column index.",
      },
      {
        term: "Upper Triangle",
        definition: "The set of matrix cells M[r][c] strictly above the main diagonal where r < c.",
      },
      {
        term: "In-Place Algorithm",
        definition: "An algorithm that transforms input data structures using O(1) extra auxiliary memory.",
      },
      {
        term: "Shared Memory Tiling",
        definition: "CUDA kernel optimization caching matrix blocks in fast GPU SRAM to transpose non-coalesced memory reads into coalesced writes.",
      },
    ],
  },
  trivia: TRANSPOSESQUAREMATRIX_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_TRANSPOSESQUAREMATRIX_INPUT,
  generateSteps: generateTransposeSquareMatrixSteps,
};
