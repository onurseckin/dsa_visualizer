import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface naive3LoopMatmulInput {
  matrixA?: number[][];
  matrixB?: number[][];
  data?: number[];
}

export const NAIVE3LOOPMATMUL_CODE = `def naive_3_loop_matmul(matrix_a, matrix_b):
    m, k_dim = len(matrix_a), len(matrix_a[0])
    n = len(matrix_b[0])
    matrix_c = [[0] * n for _ in range(m)]

    for i in range(m):
        for j in range(n):
            for k in range(k_dim):
                matrix_c[i][j] += matrix_a[i][k] * matrix_b[k][j]

    return matrix_c`;

export const DEFAULT_NAIVE3LOOPMATMUL_INPUT: naive3LoopMatmulInput = {
  matrixA: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  matrixB: [
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1],
  ],
};

export const generateNaive3LoopMatmulSteps = (input: naive3LoopMatmulInput): AlgorithmStep[] => {
  const matrixA = input.matrixA ?? [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];
  const matrixB = input.matrixB ?? [
    [9, 8, 7],
    [6, 5, 4],
    [3, 2, 1],
  ];

  const m = matrixA.length;
  const kDim = matrixA[0]?.length ?? 0;
  const n = matrixB[0]?.length ?? 0;

  const matrixC: number[][] = Array.from({ length: m }, () => Array(n).fill(0));

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const makeMatrixSnapshot = (
    activeI?: number,
    activeJ?: number,
    title: string = "Naive 3-Loop MatMul Output State C",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        if (r === activeI && c === activeJ) {
          cellState = "active";
        } else if (r === activeI) {
          cellState = "compared";
        } else if (r < (activeI ?? -1)) {
          cellState = "sorted";
        }

        cells.push({
          row: r,
          col: c,
          value: matrixC[r][c],
          state: cellState,
          label: `c[${r}][${c}]`,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: m,
      cols: n,
      cells,
      rowHeaders: Array.from({ length: m }, (_, i) => `Row ${i}`),
      colHeaders: Array.from({ length: n }, (_, j) => `Col ${j}`),
      title,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeI?: number,
    activeJ?: number,
    activeK?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(activeI, activeJ, `Naive GEMM Step ${stepIndex}`),
      auxiliaryState: {
        customState: {
          m: String(m),
          n: String(n),
          kDim: String(kDim),
          matrixA: JSON.stringify(matrixA),
          matrixB: JSON.stringify(matrixB),
          ...(activeI !== undefined ? { activeI: String(activeI) } : {}),
          ...(activeJ !== undefined ? { activeJ: String(activeJ) } : {}),
          ...(activeK !== undefined ? { activeK: String(activeK) } : {}),
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize Naive Triply-Nested Loop GEMM O(N^3)",
    `Configuring classical 3-loop nest (i, j, k) un-tiled matrix multiplication of size M=${m}, N=${n}, K=${kDim}.`,
    { m, n, kDim },
  );

  // Line 2: Read dimensions M and K
  addStep(
    2,
    `Get Matrix A Dimensions: M=${m}, K=${kDim}`,
    `Extracted matrix A row count M=${m} and inner contraction dimension K=${kDim}.`,
    { m, kDim },
  );

  // Line 3: Read dimension N
  addStep(
    3,
    `Get Matrix B Column Dimension: N=${n}`,
    `Extracted matrix B column count N=${n}. Output matrix C shape will be ${m} x ${n}.`,
    { n },
  );

  // Line 4: Allocate output matrix C
  addStep(
    4,
    `Allocate ${m} x ${n} Output Matrix C`,
    `Zero-initialized output matrix C of shape ${m}x${n} (${m * n} elements) in DRAM memory.`,
    { m, n, totalCells: m * n },
  );

  for (let i = 0; i < m; i++) {
    // Line 6: Outer loop i
    addStep(
      6,
      `Outer Loop i=${i}: Target Row ${i} of Matrix A`,
      `Iterating through row index i=${i} (0 to ${m - 1}) of matrix A.`,
      { i, m },
      i,
    );

    for (let j = 0; j < n; j++) {
      // Line 7: Middle loop j
      addStep(
        7,
        `Middle Loop j=${j}: Target Cell C[${i}][${j}]`,
        `Iterating through column index j=${j} (0 to ${n - 1}) for output cell C[${i}][${j}].`,
        { i, j, n },
        i,
        j,
      );

      for (let k = 0; k < kDim; k++) {
        // Line 8: Inner loop k
        addStep(
          8,
          `Inner Contraction Loop k=${k}: Contraction Dimension`,
          `Accessing A[${i}][${k}] = ${matrixA[i][k]} and B[${k}][${j}] = ${matrixB[k][j]} along contraction index k=${k}.`,
          { i, j, k, valA: matrixA[i][k], valB: matrixB[k][j] },
          i,
          j,
          k,
        );

        const valA = matrixA[i][k];
        const valB = matrixB[k][j];
        const prod = valA * valB;
        matrixC[i][j] += prod;

        // Line 9: Multiply-accumulate
        addStep(
          9,
          `Multiply-Accumulate: C[${i}][${j}] += A[${i}][${k}] * B[${k}][${j}]`,
          `Multiplying A[${i}][${k}] (${valA}) * B[${k}][${j}] (${valB}) = ${prod}; adding to C[${i}][${j}] yields ${matrixC[i][j]}.`,
          { i, j, k, valA, valB, prod, currentC: matrixC[i][j] },
          i,
          j,
          k,
        );
      }
    }
  }

  // Line 11: Return statement
  addStep(
    11,
    "Execution Complete: Return Product Matrix C",
    `Completed all ${m * n * kDim} multiply-accumulate operations for ${m}x${n} product matrix C.`,
    { completed: true, resultShape: `${m}x${n}` },
  );

  return steps;
};

const NAIVE3LOOPMATMUL_TRIVIA: TriviaMeta = {
  skipLines: [5, 10],
  distractors: [
    "matrix_c[i][j] += matrix_a[i][j] * matrix_b[i][j]",
    "matrix_c[i][k] += matrix_a[i][j] * matrix_b[j][k]",
    "return matrix_a * matrix_b",
    "for i in range(n): for j in range(m): for k in range(k_dim):",
  ],
  hints: [
    { line: 6, hint: "Outer loop i iterates through output rows 0 to M-1." },
    { line: 7, hint: "Middle loop j iterates through output columns 0 to N-1." },
    { line: 8, hint: "Inner loop k iterates through contraction index 0 to K-1." },
    { line: 9, hint: "Multiply element A[i][k] by B[k][j] and accumulate into C[i][j]." },
  ],
  lineExplanations: {
    1: "Defines naive triply-nested loop matrix multiplication function signature.",
    2: "Gets rows M and inner contraction dimension K from matrix A.",
    3: "Gets column count N from matrix B.",
    4: "Allocates M x N output matrix C initialized to zero.",
    5: "Blank line prior to outer 3-loop nest.",
    6: "Outer loop i iterates through row index 0 to M-1.",
    7: "Middle loop j iterates through column index 0 to N-1.",
    8: "Inner loop k iterates through contraction index 0 to K-1.",
    9: "Accumulates element product matrix_a[i][k] * matrix_b[k][j] into matrix_c[i][j].",
    10: "Blank line prior to return statement.",
    11: "Returns computed M x N output matrix product C.",
  },
};

export const naive3LoopMatmul: AlgorithmDefinition<naive3LoopMatmulInput> = {
  id: "naive-3-loop-matmul",
  title: "Naive Triply-Nested Loop GEMM O(N^3)",
  topicIds: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Easy",
  description:
    "The triply-nested loop algorithm $(i, j, k)$ is the baseline definition of General Matrix Multiplication (GEMM: $C = A \\times B$). For an $M \\times K$ matrix $A$ and $K \\times N$ matrix $B$, entry $C_{ij}$ is evaluated as $C_{ij} = \\sum_{k=0}^{K-1} A_{ik} \\cdot B_{kj}$.\n\nWhile mathematically simple, naive 3-loop GEMM exhibits terrible memory subsystem performance on modern hardware. Because elements of $B$ are stored in row-major memory order ($B_{k, j}$ and $B_{k+1, j}$ are separated by $N$ elements in RAM), inner loop step $k \\to k+1$ jumps across memory cache lines, resulting in non-strided reads, frequent cache evictions, and low ALU utilization (< 5% of peak hardware GFLOPS).\n\nInput Format:\n- matrixA: M x K input matrix A.\n- matrixB: K x N input matrix B.\n\nOutput Format:\n- Returns M x N output matrix product C.\n\nEdge Cases & Constraints:\n- Non-square matrix dimensions ($M \\ne N \\ne K$).\n- Single element 1x1 matrix multiplies.\n- Mismatched inner dimensions ($K_A \\ne K_B$).",
  constraints: ["1 <= matrixA.length <= 100", "matrixA[0].length == matrixB.length"],
  examples: [
    {
      kind: "basic",
      title: "3x3 Naive Matrix Multiplication",
      inputDisplay: "matrixA = 3x3, matrixB = 3x3",
      outputDisplay: "Matrix C (3x3 product matrix)",
      input: DEFAULT_NAIVE3LOOPMATMUL_INPUT,
      output: "3x3 product matrix",
      explanation: "Computes 27 scalar multiply-accumulate operations across i, j, k loops.",
    },
  ],
  code: NAIVE3LOOPMATMUL_CODE,
  timeComplexity: { best: "O(M * N * K)", average: "O(M * N * K)", worst: "O(M * N * K)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Requires $2 \\cdot M \\cdot N \\cdot K$ floating-point operations ($O(M \\cdot N \\cdot K)$ time complexity). For $N \\times N$ matrices, this is $O(N^3)$.",
    space: "Allocates $O(M \\cdot N)$ space for output matrix C.",
  },
  topicGuide: {
    overview:
      "Naive 3-loop matrix multiplication serves as the primary benchmark against which high-performance GEMM optimizations (loop reordering, block tiling, SIMD vectorization, SRAM swizzling) are measured.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Represents the direct algebraic definition of matrix multiplication: $C_{ij} = \\sum_k A_{ik} B_{kj}$. It serves as the starting point for computational linear algebra and compiler loop transformation theory.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Demonstrates the necessity of hardware-aware kernel design. Running naive 3-loop matmul on a modern GPU yields < 5% of peak TFLOPS due to memory latency stalls.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For row 0 col 0 of 3x3 matrices: $C_{00} = (A_{00} B_{00}) + (A_{01} B_{10}) + (A_{02} B_{20})$. The inner loop $k$ steps across row 0 of A and down column 0 of B.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Loop reordering from $(i, j, k)$ to $(i, k, j)$ improves performance by 5x on CPUs simply by ensuring matrix B is accessed sequentially in memory order ($B_{k, j} \\to B_{k, j+1}$).",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $O(M \\cdot N \\cdot K)$ operations ($O(N^3)$ for square matrices). Space Complexity: $O(M \\cdot N)$ for result matrix storage.",
      },
    ],
    keyTerms: [
      {
        term: "Triply-Nested Loop",
        definition:
          "The three nested loops (i, j, k) evaluating matrix multiplication element by element.",
      },
      {
        term: "Contraction Index",
        definition:
          "The inner index k that is multiplied and reduced to produce scalar cell values.",
      },
      {
        term: "Non-Strided Read",
        definition:
          "Accessing non-contiguous memory locations (e.g. stepping down columns in row-major layout) causing cache line misses.",
      },
      {
        term: "Loop Reordering",
        definition:
          "Permuting loop order (e.g., i, k, j) to optimize cache line access patterns without changing computation results.",
      },
    ],
  },
  trivia: NAIVE3LOOPMATMUL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_NAIVE3LOOPMATMUL_INPUT,
  generateSteps: generateNaive3LoopMatmulSteps,
};
