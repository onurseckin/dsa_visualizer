import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface l1BlockTiledMatmulInput {
  matrixA?: number[][];
  matrixB?: number[][];
  blockSize?: number;
  data?: number[];
}

export const L1BLOCKTILEDMATMUL_CODE = `def l1_block_tiled_matmul(matrix_a, matrix_b, block_size=2):
    """
    Tiles GEMM loop nest to fit sub-matrices inside CPU L1 cache lines.
    """
    n = len(matrix_a)
    matrix_c = [[0] * n for _ in range(n)]

    for bi in range(0, n, block_size):
        for bj in range(0, n, block_size):
            for bk in range(0, n, block_size):
                for i in range(bi, min(n, bi + block_size)):
                    for j in range(bj, min(n, bj + block_size)):
                        for k in range(bk, min(n, bk + block_size)):
                            matrix_c[i][j] += matrix_a[i][k] * matrix_b[k][j]

    return matrix_c`;

export const DEFAULT_L1BLOCKTILEDMATMUL_INPUT: l1BlockTiledMatmulInput = {
  matrixA: [
    [1, 2, 1, 0],
    [0, 1, 2, 1],
    [1, 0, 1, 2],
    [2, 1, 0, 1],
  ],
  matrixB: [
    [1, 0, 2, 1],
    [2, 1, 0, 1],
    [0, 2, 1, 0],
    [1, 1, 2, 0],
  ],
  blockSize: 2,
};

export const generateL1BlockTiledMatmulSteps = (
  input: l1BlockTiledMatmulInput,
): AlgorithmStep[] => {
  const matrixA = input.matrixA ?? [
    [1, 2, 1, 0],
    [0, 1, 2, 1],
    [1, 0, 1, 2],
    [2, 1, 0, 1],
  ];
  const matrixB = input.matrixB ?? [
    [1, 0, 2, 1],
    [2, 1, 0, 1],
    [0, 2, 1, 0],
    [1, 1, 2, 0],
  ];
  const blockSize = input.blockSize ?? 2;

  const n = matrixA.length;
  const matrixC: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const makeMatrixSnapshot = (
    activeI?: number,
    activeJ?: number,
    activeBi?: number,
    activeBj?: number,
    title: string = "L1 Cache Tiled Matrix C State",
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        let cellState: MatrixCellItem["state"] = "default";
        if (r === activeI && c === activeJ) {
          cellState = "active";
        } else if (
          activeBi !== undefined &&
          activeBj !== undefined &&
          r >= activeBi &&
          r < activeBi + blockSize &&
          c >= activeBj &&
          c < activeBj + blockSize
        ) {
          cellState = "compared";
        } else if (
          activeBi !== undefined &&
          (r < activeBi || (r < activeBi + blockSize && c < (activeBj ?? 0)))
        ) {
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
      rows: n,
      cols: n,
      cells,
      rowHeaders: Array.from({ length: n }, (_, i) => `Row ${i}`),
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
    activeBi?: number,
    activeBj?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: makeMatrixSnapshot(
        activeI,
        activeJ,
        activeBi,
        activeBj,
        `L1 Block-Tiled MatMul (Block [${activeBi ?? "-"}:${(activeBi ?? 0) + blockSize}, ${activeBj ?? "-"}:${(activeBj ?? 0) + blockSize}])`,
      ),
      auxiliaryState: {
        customState: {
          n: String(n),
          blockSize: String(blockSize),
          matrixA: JSON.stringify(matrixA),
          matrixB: JSON.stringify(matrixB),
        },
      },
      variables,
    });
  };

  // Step 1: Definition
  addStep(
    1,
    "Initialize L1 Cache Block-Tiled MatMul Engine",
    "Configuring 6-loop nested GEMM block tiling to enforce L1 data cache spatial and temporal locality.",
    { n, blockSize },
  );

  // Step 2: Docstring start
  addStep(
    2,
    "Load L1 Cache Tiling Architecture Spec",
    "Dividing N x N matrix multiplication into sub-blocks of size B x B matching CPU 32KB/64KB L1 cache capacity.",
    { n, blockSize },
  );

  // Step 3: Docstring description
  addStep(
    3,
    "Verify Block Size Constraint",
    `Ensuring sub-matrix block size (B = ${blockSize}) fits within L1 cache lines (3 * B^2 * sizeof(float) <= 32KB).`,
    { n, blockSize },
  );

  // Step 4: Docstring end
  addStep(
    4,
    "Inspect Matrix Dimensions",
    `Matrix A and B are ${n} x ${n} square matrices.`,
    { n },
  );

  // Step 5: Get dimension N
  addStep(
    5,
    `Get Matrix Dimension N (${n})`,
    "Reading dimension length N for outer loop range bound.",
    { n },
  );

  // Step 6: Allocate matrix C
  addStep(
    6,
    `Allocate ${n} x ${n} Output Matrix C`,
    "Zero-initializing output matrix C in RAM memory workspace.",
    { n, totalCells: n * n },
  );

  // Outer loop bi
  for (let bi = 0; bi < n; bi += blockSize) {
    addStep(
      8,
      `Outer Tile Loop bi=${bi}: Processing Row Block [${bi} .. ${Math.min(n, bi + blockSize) - 1}]`,
      `Iterating outer row tile block index bi from ${bi} with step size B=${blockSize}.`,
      { bi, blockSize },
      undefined,
      undefined,
      bi,
      undefined,
    );

    // Outer loop bj
    for (let bj = 0; bj < n; bj += blockSize) {
      addStep(
        9,
        `Outer Tile Loop bj=${bj}: Processing Column Block [${bj} .. ${Math.min(n, bj + blockSize) - 1}]`,
        `Iterating outer column tile block index bj from ${bj} with step size B=${blockSize}.`,
        { bi, bj, blockSize },
        undefined,
        undefined,
        bi,
        bj,
      );

      // Outer loop bk
      for (let bk = 0; bk < n; bk += blockSize) {
        addStep(
          10,
          `Outer Tile Loop bk=${bk}: Loading Contraction Block K [${bk} .. ${Math.min(n, bk + blockSize) - 1}]`,
          `Loading sub-matrices A[${bi}:${bi + blockSize}][${bk}:${bk + blockSize}] and B[${bk}:${bk + blockSize}][${bj}:${bj + blockSize}] into fast L1 cache lines.`,
          { bi, bj, bk, blockSize },
          undefined,
          undefined,
          bi,
          bj,
        );

        // Inner loop i
        for (let i = bi; i < Math.min(n, bi + blockSize); i++) {
          addStep(
            11,
            `Inner Loop i=${i} (Row ${i} in Current Row Tile)`,
            `Iterating inner row index i within L1 cache resident row block.`,
            { bi, bj, bk, i },
            i,
            undefined,
            bi,
            bj,
          );

          // Inner loop j
          for (let j = bj; j < Math.min(n, bj + blockSize); j++) {
            addStep(
              12,
              `Inner Loop j=${j} (Column ${j} in Current Column Tile)`,
              `Targeting output cell C[${i}][${j}] in L1 cache accumulator.`,
              { bi, bj, bk, i, j },
              i,
              j,
              bi,
              bj,
            );

            // Inner loop k
            for (let k = bk; k < Math.min(n, bk + blockSize); k++) {
              addStep(
                13,
                `Inner Contraction Loop k=${k}`,
                `Fetching A[${i}][${k}] and B[${k}][${j}] directly from L1 cache lines.`,
                { bi, bj, bk, i, j, k },
                i,
                j,
                bi,
                bj,
              );

              const valA = matrixA[i][k];
              const valB = matrixB[k][j];
              const prod = valA * valB;
              matrixC[i][j] += prod;

              addStep(
                14,
                `L1 Multiply-Accumulate: C[${i}][${j}] += A[${i}][${k}] * B[${k}][${j}]`,
                `C[${i}][${j}] += ${valA} * ${valB} (${prod}) -> New C[${i}][${j}] = ${matrixC[i][j]}`,
                { i, j, k, valA, valB, prod, currentC: matrixC[i][j] },
                i,
                j,
                bi,
                bj,
              );
            }
          }
        }
      }
    }
  }

  // Step 16: Return matrix C
  addStep(
    16,
    "Execution Complete: Return Product Matrix C",
    "L1 cache block-tiled GEMM completed with optimal cache line reuse.",
    { completed: true, matrixSize: `${n}x${n}` },
    undefined,
    undefined,
    undefined,
    undefined,
  );

  return steps;
};

const L1BLOCKTILEDMATMUL_TRIVIA: TriviaMeta = {
  skipLines: [7, 15],
  distractors: [
    "for bi in range(0, n): for bj in range(0, n):",
    "matrix_c[i][j] = matrix_a[i][k] + matrix_b[k][j]",
    "matrix_c[bi][bj] += matrix_a[bi][bk] * matrix_b[bk][bj]",
    "return matrix_c[::-1]",
  ],
  hints: [
    { line: 8, hint: "Outer 3 loops (bi, bj, bk) iterate over matrix block tiles with step block_size." },
    { line: 11, hint: "Inner 3 loops (i, j, k) iterate over scalar elements inside L1 cache resident sub-tiles." },
    { line: 14, hint: "Multiply element A[i][k] by B[k][j] and accumulate into C[i][j]." },
  ],
  lineExplanations: {
    1: "Defines L1 cache block-tiled matrix multiplication function signature.",
    2: "Start of docstring explaining cache-tiled loop nesting.",
    3: "Describes partitioning GEMM loops into L1 cache-sized sub-blocks.",
    4: "End of docstring.",
    5: "Gets square matrix dimension length N from matrix A.",
    6: "Allocates N x N output matrix C initialized to zero.",
    7: "Blank line between initialization and 6-loop nest.",
    8: "Outer loop bi iterates through row block tiles starting at 0 with step block_size.",
    9: "Outer loop bj iterates through column block tiles starting at 0 with step block_size.",
    10: "Outer loop bk iterates through K contraction block tiles with step block_size.",
    11: "Inner loop i iterates through rows within current row block tile bi to min(N, bi + block_size).",
    12: "Inner loop j iterates through columns within current column block tile bj to min(N, bj + block_size).",
    13: "Inner loop k iterates through contraction elements within current K block tile bk.",
    14: "Accumulates element product matrix_a[i][k] * matrix_b[k][j] into output matrix_c[i][j].",
    15: "Blank line prior to returning matrix C.",
    16: "Returns computed N x N product matrix C.",
  },
};

export const l1BlockTiledMatmul: AlgorithmDefinition<l1BlockTiledMatmulInput> = {
  id: "l1-block-tiled-matmul",
  title: "L1 Cache Block-Tiled MatMul Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description:
    "On modern CPU microarchitectures (x86 AVX-512, ARM Neon, Apple Silicon Firestorm), L1 data cache access latency is 4-5 clock cycles (bandwidth > 3 TB/s), whereas main memory (DRAM) access takes 200+ clock cycles (bandwidth ~50-100 GB/s). Naive 3-loop matrix multiplication leads to non-strided column reads on matrix B, evicting cache lines before they can be reused.\n\nL1 Block Tiling reorganizes the 3-loop matmul nest $(i, j, k)$ into a 6-loop nest $(bi, bj, bk, i, j, k)$. The outer 3 loops iterate across matrix sub-blocks of size $B \\times B$, ensuring that active sub-matrix tiles fit entirely within the CPU's 32KB/64KB L1 data cache lines. This reduces DRAM memory bus traffic by a factor of $B$, boosting throughput by up to 50x.\n\nInput Format:\n- matrixA: N x N square input matrix A.\n- matrixB: N x N square input matrix B.\n- blockSize: Sub-matrix tile dimension B (default B=2 or 32).\n\nOutput Format:\n- Returns N x N product matrix C.\n\nEdge Cases & Constraints:\n- Matrix dimension N not evenly divisible by B (handled via `min(N, bi + B)` bounds).\n- Small 1x1 matrix inputs.\n- Block size B exceeding L1 cache capacity.",
  constraints: ["1 <= matrixA.length <= 64", "1 <= blockSize <= 32"],
  examples: [
    {
      kind: "basic",
      title: "4x4 Matrix L1 Block Tiling (B=2)",
      inputDisplay: "matrixA = 4x4, matrixB = 4x4, blockSize = 2",
      outputDisplay: "Matrix C (4x4 product matrix)",
      input: DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
      output: "4x4 product matrix",
      explanation: "Tiles 4x4 matrix into four 2x2 sub-blocks, maximizing L1 cache line hit rates.",
    },
  ],
  code: L1BLOCKTILEDMATMUL_CODE,
  timeComplexity: { best: "O(N^3)", average: "O(N^3)", worst: "O(N^3)" },
  spaceComplexity: "O(N^2)",
  complexityAnalysis: {
    time: "Requires 2 * N^3 floating-point operations ($O(N^3)$ total FLOPs). Tiling does not change the FLOP count, but drastically improves hardware operational efficiency.",
    space: "Allocates $O(N^2)$ space for output matrix C. Sub-matrix tile buffers reside in CPU registers/L1 cache.",
  },
  topicGuide: {
    overview:
      "Block tiling is the core structural transformation in OpenBLAS, MKL, and vendor GEMM libraries. By introducing outer tile loops $(bi, bj, bk)$ and inner scalar loops $(i, j, k)$, memory access patterns are localized into ultra-fast L1 CPU data cache lines.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Memory access latency dominates execution time on modern microprocessors. For a matrix of size $N$, naive 3-loop GEMM loads $O(N^3)$ words from DRAM. L1 tiling reduces DRAM loads to $O(N^3 / B)$ words, where $B$ is the tile block dimension, increasing operational intensity by a factor of $B$.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "Solves cache thrashing and memory bandwidth saturation in CPU tensor calculations. Used in High-Performance Computing (HPC), BLAS Level 3 matrix routines, and CPU inference engines (ONNX Runtime, OpenVINO, PyTorch CPU backend).",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "For a 4x4 matrix with block_size=2: (1) $bi=0, bj=0$: Target top-left 2x2 block of matrix C. (2) $bk=0$: Load A[0..1][0..1] and B[0..1][0..1] into L1 cache. (3) Inner loops $(i, j, k)$ compute partial products. (4) $bk=2$: Load A[0..1][2..3] and B[2..3][0..1] to accumulate remaining products.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Selecting block size $B$ requires balancing L1 cache size and register availability. If $B$ is too large ($3 \\cdot B^2 \\cdot 4 \\text{ bytes} > 32\\text{KB}$), tiles spill to L2 cache. If $B$ is too small, loop overhead dominates.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $O(N^3)$ arithmetic FLOPs. Space Complexity: $O(N^2)$ for output matrix C ($O(1)$ additional auxiliary memory).",
      },
    ],
    keyTerms: [
      {
        term: "6-Loop Nest",
        definition:
          "Loop layout with 3 outer tile loops (bi, bj, bk) and 3 inner element loops (i, j, k).",
      },
      {
        term: "L1 Data Cache",
        definition:
          "Smallest and fastest CPU cache (typically 32KB - 64KB per core) operating at clock cycle speeds.",
      },
      {
        term: "Temporal Locality",
        definition:
          "Re-referencing the same memory locations multiple times within a short time window while retained in cache.",
      },
      {
        term: "Spatial Locality",
        definition:
          "Accessing memory locations that are close together in contiguous memory addresses.",
      },
    ],
  },
  trivia: L1BLOCKTILEDMATMUL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_L1BLOCKTILEDMATMUL_INPUT,
  generateSteps: generateL1BlockTiledMatmulSteps,
};
