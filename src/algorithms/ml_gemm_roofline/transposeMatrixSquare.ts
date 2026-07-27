import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface transposeMatrixSquareInput {
  matrix?: number[][];
}

export const TRANSPOSEMATRIXSQUARE_CODE = `def transpose_matrix_square(matrix):
    """
    Transposes N x N matrix in-place by swapping symmetric upper/lower entries.
    """
    n = len(matrix)
    for r in range(n):
        for c in range(r + 1, n):
            matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]
    return matrix`;

export const DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT: transposeMatrixSquareInput = {
  matrix: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
  ],
};

export const generateTransposeMatrixSquareSteps = (
  input: transposeMatrixSquareInput,
): AlgorithmStep[] => {
  const initialMatrix = input.matrix ?? DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT.matrix!;
  const n = initialMatrix.length;

  // Deep clone matrix for step simulation
  const matrix: number[][] = initialMatrix.map((row) => [...row]);

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const swappedPairs: Set<string> = new Set();

  const createMatrixSnapshot = (
    activeR?: number,
    activeC?: number,
    completed = false,
    titleExtra = "",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const val = matrix[r][c];
        let state: "default" | "active" | "compared" | "sorted" | "pivot" | "inactive" = "default";
        let label: string | undefined;

        if (completed) {
          state = "sorted";
        } else if (r === activeR && c === activeC) {
          state = "active";
          label = `[${r},${c}]`;
        } else if (r === activeC && c === activeR) {
          state = "compared";
          label = `[${c},${r}]`;
        } else if (r === c) {
          state = "pivot"; // Main diagonal
        } else {
          const key1 = `${r},${c}`;
          const key2 = `${c},${r}`;
          if (swappedPairs.has(key1) || swappedPairs.has(key2)) {
            state = "sorted";
          }
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
      rows: n,
      cols: n,
      rowHeaders: Array.from({ length: n }, (_, r) => `Row ${r}`),
      colHeaders: Array.from({ length: n }, (_, c) => `Col ${c}`),
      title: `In-Place Square Matrix Transpose (${n}x${n})${titleExtra}`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
    completed = false,
    titleExtra = "",
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: createMatrixSnapshot(activeR, activeC, completed, titleExtra),
      auxiliaryState: {
        customState: {
          n,
          swappedCount: swappedPairs.size,
          matrixState: matrix.map((r) => `[${r.join(",")}]`).join(", "),
        },
      },
      variables,
    });
  };

  // Line 1: Setup
  addStep(
    1,
    "Initialize In-Place Square Matrix Transpose Operator",
    `Matrix size N = ${n} x ${n}. Preparing symmetric element exchange across main diagonal.`,
    { n },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Transposes N x N matrix in-place by swapping symmetric upper/lower entries.",
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

  // Line 5: n = len(matrix)
  addStep(
    5,
    `Get Matrix Dimension: n = ${n}`,
    `Extract dimension N = ${n} from matrix row length.`,
    { n },
  );

  // Loops for transposition
  for (let r = 0; r < n; r++) {
    addStep(
      6,
      `Outer Loop Row r = ${r}`,
      `Iterate outer loop for row index r = ${r}. Main diagonal entry is matrix[${r}][${r}] = ${matrix[r][r]}.`,
      { r, n },
      r,
      r,
    );

    for (let c = r + 1; c < n; c++) {
      addStep(
        7,
        `Inner Loop Column c = ${c} (r = ${r})`,
        `Select upper-triangle entry matrix[${r}][${c}] and symmetric lower-triangle entry matrix[${c}][${r}].`,
        { r, c, n },
        r,
        c,
      );

      const valUpper = matrix[r][c];
      const valLower = matrix[c][r];

      addStep(
        8,
        `Inspect Symmetric Pair: matrix[${r}][${c}] (${valUpper}) <-> matrix[${c}][${r}] (${valLower})`,
        `Prepare to swap upper-triangle entry matrix[${r}][${c}] with lower-triangle entry matrix[${c}][${r}].`,
        { r, c, valUpper, valLower },
        r,
        c,
      );

      // Perform in-place swap
      matrix[r][c] = valLower;
      matrix[c][r] = valUpper;
      swappedPairs.add(`${r},${c}`);
      swappedPairs.add(`${c},${r}`);

      addStep(
        8,
        `Execute In-Place Swap: matrix[${r}][${c}] becomes ${valLower}, matrix[${c}][${r}] becomes ${valUpper}`,
        `Symmetric pair successfully exchanged across the main diagonal.`,
        { r, c, "new_matrix[r][c]": valLower, "new_matrix[c][r]": valUpper },
        r,
        c,
      );
    }
  }

  // Line 9: Return matrix
  addStep(
    9,
    "In-Place Matrix Transpose Complete",
    `Successfully transposed ${n}x${n} matrix in-place with O(1) auxiliary space.`,
    { completed: true, n },
    undefined,
    undefined,
    true,
    " - Complete",
  );

  return steps;
};

export const TRANSPOSEMATRIXSQUARE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "matrix[r][c] = matrix[c][r]",
    "for c in range(0, n): matrix[r][c], matrix[c][r] = matrix[c][r], matrix[r][c]",
    "return matrix[::-1]",
  ],
  hints: [
    { line: 5, hint: "Matrix dimension n is len(matrix)." },
    { line: 6, hint: "Outer loop iterates rows r from 0 to n-1." },
    { line: 7, hint: "Inner loop must start at c = r + 1 to stay in upper triangle and avoid double swaps." },
    { line: 8, hint: "Swap symmetric entries matrix[r][c] and matrix[c][r] in-place." },
  ],
  lineExplanations: {
    1: "Defines square matrix in-place transpose function.",
    2: "Starts docstring explaining in-place symmetric upper/lower matrix swapping.",
    3: "Describes mathematical contract: transpose N x N square matrix in-place.",
    4: "Ends function docstring.",
    5: "Gets square matrix dimension N = len(matrix).",
    6: "Iterates outer row loop r from 0 up to n - 1.",
    7: "Iterates inner column loop c strictly in upper triangle (c from r + 1 to n - 1).",
    8: "Swaps upper-triangle entry matrix[r][c] with symmetric lower-triangle entry matrix[c][r].",
    9: "Returns in-place transposed square matrix.",
  },
};

export const transposeMatrixSquare: AlgorithmDefinition<transposeMatrixSquareInput> = {
  id: "transpose-matrix-square",
  title: "Square Matrix Transpose Operator",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "Aligning matrix layout representations for GEMM kernels (e.g. converting a row-major matrix $B$ into column-major format for BLAS GEMM or GPU Tensor Core inputs) requires matrix transpose operations $A^T$. For an $N \\times N$ square matrix, performing in-place symmetric element swaps $M[r][c] \\leftrightarrow M[c][r]$ across the main diagonal executes in $\\mathcal{O}(1)$ auxiliary space:\n$$A^T_{ij} = A_{ji}$$\nIn GPU memory hierarchies (CUDA / Triton), performing naive global memory transposes causes non-coalesced DRAM writes. Optimized kernels load $32 \\times 32$ tiles into SRAM shared memory, perform tile transposition inside SRAM registers, and write back coalesced DRAM memory lines.",
  constraints: [
    "matrix.length >= 1",
    "matrix[0].length == matrix.length",
    "-10^9 <= matrix[r][c] <= 10^9",
  ],
  examples: [
    {
      kind: "basic",
      title: "4x4 Matrix Transpose",
      inputDisplay: "matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16]]",
      outputDisplay: "[[1,5,9,13],[2,6,10,14],[3,7,11,15],[4,8,12,16]]",
      input: DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
      output: "[[1,5,9,13],[2,6,10,14],[3,7,11,15],[4,8,12,16]]",
      explanation: "Swaps symmetric element pairs across the main diagonal in-place.",
    },
    {
      kind: "complex",
      title: "2x2 Small Matrix Transpose",
      inputDisplay: "matrix = [[10, 20], [30, 40]]",
      outputDisplay: "[[10, 30], [20, 40]]",
      input: {
        matrix: [
          [10, 20],
          [30, 40],
        ],
      },
      output: "[[10, 30], [20, 40]]",
      explanation: "Evaluates exact in-place transpose for a 2x2 matrix.",
    },
  ],
  code: TRANSPOSEMATRIXSQUARE_CODE,
  timeComplexity: { best: "O(N^2)", average: "O(N^2)", worst: "O(N^2)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(N^2) total operations to inspect entries and execute N*(N-1)/2 swaps across the upper triangle.",
    space: "O(1) auxiliary space because swaps are performed directly in-place within the matrix.",
  },
  topicGuide: {
    overview:
      "In-place transposition of a square matrix swaps off-diagonal symmetric elements $(r, c)$ and $(c, r)$ across the main diagonal. Restricting column iteration to $c > r$ (the strict upper triangle) guarantees every symmetric pair is swapped exactly once without double swapping back to original positions.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "GEMM hardware accelerators (such as NVIDIA Tensor Cores) require specific memory layouts (e.g., matrix A row-major and matrix B column-major) to maximize memory bus utilization. Transposing matrix B converts row reads into contiguous column reads. Performing in-place square matrix transposition eliminates memory allocations.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Matrix transpose is essential in attention mechanism $Q K^T$ computations in Transformers, linear algebra solvers (LU decomposition, QR factorization), image rotations, and GPU layout reordering.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "1. Outer loop iterates $r$ from $0$ to $N-1$.\n2. Inner loop iterates $c$ from $r + 1$ to $N-1$ (upper triangle).\n3. For each pair $(r, c)$, swap `matrix[r][c]` with `matrix[c][r]`.\n4. Elements on the main diagonal ($r = c$) are ignored because $\\text{transpose}(\\text{diag}) = \\text{diag}$.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Naively accessing `matrix[c][r]` in row-major memory jumps across row strides ($N$ elements apart), causing cache line misses on CPU and non-coalesced memory requests on GPU. Production CUDA/Triton kernels use SRAM tile buffers (shared memory) with diagonal bank conflict padding to achieve maximum memory bandwidth.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(N^2)$ with exactly $\\frac{N(N-1)}{2}$ swaps. Space Complexity: $\\mathcal{O}(1)$ auxiliary space.",
      },
    ],
    keyTerms: [
      {
        term: "In-Place Transpose",
        definition:
          "Exchanging matrix elements across the main diagonal without allocating extra matrix memory.",
      },
      {
        term: "Symmetric Element Swap",
        definition: "Swapping values at coordinates (r, c) and (c, r).",
      },
      {
        term: "Upper Triangle Traversal",
        definition:
          "Iterating strictly over cells where column index c > row index r to avoid double-swapping.",
      },
      {
        term: "Memory Coalescing",
        definition:
          "Combining parallel GPU thread memory accesses into single contiguous DRAM transactions.",
      },
    ],
  },
  trivia: TRANSPOSEMATRIXSQUARE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_TRANSPOSEMATRIXSQUARE_INPUT,
  generateSteps: generateTransposeMatrixSquareSteps,
};
