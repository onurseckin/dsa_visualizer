import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface cudaTritonSramTiledGemmInput {
  matrixA?: number[][];
  matrixB?: number[][];
  tileK?: number;
  data?: number[];
  target?: number;
}

export const CUDATRITONSRAMTILEDGEMM_CODE = `def cuda_triton_sram_tiled_gemm(matrix_a, matrix_b, tile_k=2):
    """
    Computes block-tiled GEMM in SRAM iterating over K-dimension blocks.
    """
    m, k_dim = len(matrix_a), len(matrix_a[0])
    n = len(matrix_b[0])
    matrix_c = [[0] * n for _ in range(m)]
    for k_start in range(0, k_dim, tile_k):
        for r in range(m):
            for c in range(n):
                for k in range(k_start, min(k_dim, k_start + tile_k)):
                    matrix_c[r][c] += matrix_a[r][k] * matrix_b[k][c]
    return matrix_c`;

export const DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT: cudaTritonSramTiledGemmInput = {
  matrixA: [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
  ],
  matrixB: [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
  ],
  tileK: 2,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateCudaTritonSramTiledGemmSteps = (
  input: cudaTritonSramTiledGemmInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matrixA =
    input.matrixA && input.matrixA.length > 0
      ? input.matrixA
      : [
          [1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
        ];

  const matrixB =
    input.matrixB && input.matrixB.length > 0
      ? input.matrixB
      : [
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
        ];

  const tileK = Math.max(input.tileK ?? 2, 1);

  const m = matrixA.length;
  const kDim = matrixA[0].length;
  const n = matrixB[0].length;

  const matrixC: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));

  const getMatrixSnapshot = (
    activeR?: number,
    activeC?: number,
    _activeK?: number,
    titleExt?: string,
  ): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];

    for (let r = 0; r < m; r++) {
      for (let c = 0; c < n; c++) {
        const isCurrent = r === activeR && c === activeC;
        cells.push({
          row: r,
          col: c,
          value: matrixC[r][c],
          label: `C[${r},${c}]`,
          state: isCurrent ? "active" : matrixC[r][c] > 0 ? "sorted" : "default",
        });
      }
    }

    return {
      kind: "matrix",
      rows: m,
      cols: n,
      title: titleExt
        ? `Output Matrix C (${titleExt})`
        : `Output Matrix C (${m}x${n}, TileK=${tileK})`,
      rowHeaders: Array.from({ length: m }, (_, idx) => `Row ${idx}`),
      colHeaders: Array.from({ length: n }, (_, idx) => `Col ${idx}`),
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
    activeK?: number,
    titleExt?: string,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getMatrixSnapshot(activeR, activeC, activeK, titleExt),
      auxiliaryState: {
        customState: {
          dimensions: `M=${m}, K=${kDim}, N=${n}, TileK=${tileK}`,
          matrixA: JSON.stringify(matrixA),
          matrixB: JSON.stringify(matrixB),
          matrixC: JSON.stringify(matrixC),
        },
      },
      variables,
    });
  };

  // Line 1: Setup
  addStep(
    1,
    "Initialize CUDA/Triton SRAM Tiled GEMM Engine",
    `Configuring matrix dimensions M=${m}, K=${kDim}, N=${n} with contraction tile size TileK=${tileK}.`,
    { m, kDim, n, tileK },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Computes block-tiled GEMM in SRAM iterating over K-dimension blocks.",
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

  // Line 5: Read M and K dimensions
  addStep(
    5,
    "Inspect Matrix A Dimensions",
    `Matrix A has ${m} rows and ${kDim} columns (K-dimension).`,
    { m, k_dim: kDim },
  );

  // Line 6: Read N dimension
  addStep(
    6,
    "Inspect Matrix B Dimensions",
    `Matrix B has ${n} columns. Output matrix C will be ${m}x${n}.`,
    { n },
  );

  // Line 7: Allocate matrix C
  addStep(
    7,
    "Allocate Accumulator Matrix C",
    `Allocated ${m}x${n} output matrix C initialized to zeroes in fast register/SRAM storage.`,
    { m, n },
  );

  // Lines 8-12: K-tile loop nest
  for (let kStart = 0; kStart < kDim; kStart += tileK) {
    const kEnd = Math.min(kDim, kStart + tileK);
    addStep(
      8,
      `Begin K-Tile Block [${kStart}..${kEnd - 1}]`,
      `Loading sub-block tile of K contraction dimension [k_start=${kStart} to ${kEnd - 1}] into SRAM.`,
      { k_start: kStart, k_end: kEnd, tile_k: tileK },
      undefined,
      undefined,
      undefined,
      `K-Tile [${kStart}..${kEnd - 1}]`,
    );

    for (let r = 0; r < m; r++) {
      addStep(
        9,
        `Iterate Row r=${r}`,
        `Processing row ${r} of Matrix A across current K-tile block.`,
        { r, k_start: kStart },
        r,
        undefined,
        undefined,
        `Row ${r}, K-Tile [${kStart}..${kEnd - 1}]`,
      );

      for (let c = 0; c < n; c++) {
        addStep(
          10,
          `Iterate Column c=${c}`,
          `Accumulating inner dot products into Output C[${r}, ${c}].`,
          { r, c, k_start: kStart },
          r,
          c,
          undefined,
          `Tile C[${r},${c}] Accumulation`,
        );

        for (let k = kStart; k < kEnd; k++) {
          addStep(
            11,
            `Fetch Contraction Element k=${k}`,
            `Reading A[${r}, ${k}] = ${matrixA[r][k]} and B[${k}, ${c}] = ${matrixB[k][c]} from SRAM tile.`,
            { r, c, k, a_val: matrixA[r][k], b_val: matrixB[k][c] },
            r,
            c,
            k,
            `Read K=${k}`,
          );

          const prod = matrixA[r][k] * matrixB[k][c];
          matrixC[r][c] += prod;

          addStep(
            12,
            `Multiply-Accumulate (MAC): C[${r},${c}] += ${matrixA[r][k]} * ${matrixB[k][c]} (+${prod})`,
            `Added product ${prod} to accumulator C[${r},${c}]. New value = ${matrixC[r][c]}.`,
            { r, c, k, prod, c_val: matrixC[r][c] },
            r,
            c,
            k,
            `Updated C[${r},${c}] = ${matrixC[r][c]}`,
          );
        }
      }
    }
  }

  // Line 13: Return matrix C
  addStep(
    13,
    "SRAM Tiled GEMM Complete",
    "Successfully computed matrix multiplication product C = A @ B using SRAM block tiling.",
    { completed: true },
    undefined,
    undefined,
    undefined,
    "Complete",
  );

  return steps;
};

const CUDATRITONSRAMTILEDGEMM_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "matrix_c[r][c] = matrix_a[r][c] * matrix_b[r][c]  # Hadamard product error",
    "for k_start in range(k_dim):  # Missing tile_k step size",
    "return matrix_a",
  ],
  hints: [
    { line: 8, hint: "Loop over the K contraction dimension in blocks of tile_k to fit SRAM capacity." },
    { line: 12, hint: "Accumulate partial products into matrix_c[r][c] across successive K tile blocks." },
  ],
  lineExplanations: {
    1: "Defines cuda_triton_sram_tiled_gemm function taking matrix_a, matrix_b, and tile_k parameters.",
    2: "Starts docstring describing SRAM block-tiled GEMM matrix multiplication.",
    3: "Explains partitioning K contraction dimension into SRAM-sized blocks.",
    4: "Closes function docstring.",
    5: "Gets rows M and inner contraction dimension K of matrix A.",
    6: "Gets columns N of matrix B.",
    7: "Allocates M x N output accumulator matrix C initialized to zero vectors.",
    8: "Iterates over K contraction dimension starting at k_start with block stride tile_k.",
    9: "Iterates through row index r from 0 to M - 1.",
    10: "Iterates through column index c from 0 to N - 1.",
    11: "Iterates through inner contraction offset k within current tile block [k_start..k_start + tile_k].",
    12: "Executes MAC step accumulating matrix_a[r][k] * matrix_b[k][c] into matrix_c[r][c].",
    13: "Returns completed M x N output matrix product matrix_c.",
  },
};

export const cudaTritonSramTiledGemm: AlgorithmDefinition<cudaTritonSramTiledGemmInput> = {
  id: "cuda-triton-sram-tiled-gemm",
  title: "CUDA/Triton SRAM Tiled GEMM Engine",
  category: "ml_gemm_roofline",
  categories: ["ml_gemm_roofline", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 2,
  mlInfraCategory: "ml_gemm_roofline",
  description: `In high-performance GPU computing (NVIDIA CUDA CUTLASS, OpenAI Triton, cuBLAS), **SRAM Tiled Matrix Multiplication (GEMM)** is the core algorithm used to achieve peak TFLOPS performance.

Standard naive matrix multiplication $C = A \\times B$ requires reading $2 \\times M \\times N \\times K$ elements from High Bandwidth Memory (HBM/DRAM), placing the kernel in a severe memory bandwidth bound regime. 

By partitioning the contraction dimension $K$ into smaller tiles of size $B_{\\text{tile}}$ (\`tileK\`), CUDA thread blocks cooperatively stage tiles of $A$ and $B$ into fast on-chip shared memory (SRAM) once:
$$C_{ij} = \\sum_{t=0}^{\\lceil K / B_{\\text{tile}} \\rceil - 1} \\sum_{k=t \\cdot B_{\\text{tile}}}^{(t+1)B_{\\text{tile}} - 1} A_{ik} B_{kj}$$
By reusing SRAM data $B_{\\text{tile}}$ times inside warp registers, HBM memory accesses drop by a factor of $B_{\\text{tile}}$, elevating Arithmetic Intensity (FLOPs/Byte) onto the compute-bound plateau of the Roofline Model.`,
  constraints: ["1 <= M, K, N <= 128", "1 <= tileK <= K"],
  examples: [
    {
      kind: "basic",
      title: "Standard Tiled Matrix Multiply",
      inputDisplay: "Matrix A (3x4), Matrix B (4x2), TileK = 2",
      outputDisplay: "Matrix C (3x2) Computed via 2 K-Tiles",
      input: DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
      output: "Matrix C (3x2) Computed via 2 K-Tiles",
      explanation: "Computes 3x2 matrix product by accumulating partial products across 2 K-tiles of size 2.",
    },
    {
      kind: "complex",
      title: "Single K-Tile Execution",
      inputDisplay: "Matrix A (2x2), Matrix B (2x2), TileK = 2",
      outputDisplay: "Matrix C (2x2) Computed in Single Tile Pass",
      input: {
        matrixA: [
          [1, 2],
          [3, 4],
        ],
        matrixB: [
          [5, 6],
          [7, 8],
        ],
        tileK: 2,
      },
      output: "Matrix C (2x2) Computed in Single Tile Pass",
      explanation: "Evaluates exact SRAM sub-block matmul for 2x2 square inputs.",
    },
  ],
  code: CUDATRITONSRAMTILEDGEMM_CODE,
  timeComplexity: { best: "O(M * N * K)", average: "O(M * N * K)", worst: "O(M * N * K)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Requires O(M * N * K) total arithmetic operations. Tiling reduces HBM memory access transactions from O(M * N * K) down to O((M * N * K) / TileK).",
    space: "O(M * N) space to store the output matrix C accumulators.",
  },
  topicGuide: {
    overview:
      "SRAM tiled matrix multiplication is the core architectural principle behind NVIDIA CUTLASS C++ library and OpenAI Triton GPU compiler algorithms. In GPU memory hierarchies, moving data from DRAM to registers incurs ~300 clock cycles of latency, whereas accessing shared memory (SRAM) takes ~20 clock cycles.\n\nBy tiling the $K$ contraction dimension into blocks of size $B_K$, thread blocks copy sub-tiles of $A$ and $B$ into SRAM cooperatively, execute Tensor Core matrix operations, and accumulate partial results into registers before writing final $C$ entries to DRAM.",
    sections: [
      {
        heading: "Why It Exists & Theoretical Foundations",
        body: "Under the Roofline model, Arithmetic Intensity is defined as FLOPs per Byte of memory transferred:\n$$\\text{AI} = \\frac{2 \\times M \\times N \\times K}{\\text{sizeof}(\\text{elem}) \\times (M K + K N + M N)}$$\nIn naive GEMM, $\\text{AI} \\approx \\mathcal{O}(1)$, placing execution deep in the memory-bound region. With block tiling ($B_M = B_N = B$), $\\text{AI}$ scales to $\\mathcal{O}(B)$, crossing the ridge point onto the compute-bound plateau.",
      },
      {
        heading: "What It Solves & Real-World Applications",
        body: "SRAM tiled GEMM solves memory bandwidth bottlenecking in LLM training and inference (LLaMA, DeepSeek), vision transformers, and recommendation models. It is the fundamental building block of NVIDIA cuBLAS, PyTorch Inductor, vLLM, and Triton `@triton.jit` matmul kernels.",
      },
      {
        heading: "Step-by-Step Intuition & Worked Example",
        body: "Suppose we multiply $3 \\times 4$ Matrix A by $4 \\times 2$ Matrix B with $B_K=2$.\n1. Tile 0 ($k=0..1$): load sub-matrices $A[:, 0..1]$ and $B[0..1, :]$ into SRAM. Multiply and accumulate into $C$.\n2. Tile 1 ($k=2..3$): load sub-matrices $A[:, 2..3]$ and $B[2..3, :]$ into SRAM. Multiply and accumulate into $C$.\nAfter 2 tile passes, Matrix C contains the exact full matrix product.",
      },
      {
        heading: "Trade-offs & Hardware Realities",
        body: "Tile sizing involves complex hardware trade-offs. Larger tiles ($128 \\times 128$) increase data reuse and arithmetic intensity, but consume more SRAM and registers per thread block. If SRAM usage exceeds $228\\text{ KB}$ per SM, thread block occupancy drops. Triton performs autotuning across tile sizes ($B_M, B_N, B_K$) to find optimal peak performance.",
      },
      {
        heading: "Time & Space Complexity Analysis",
        body: "Time Complexity: $\\mathcal{O}(M \\times N \\times K)$ total Multiply-Accumulate operations. HBM traffic is reduced by a factor of $B_K$. Space Complexity: $\\mathcal{O}(M \\times N)$ memory for output accumulators.",
      },
    ],
    keyTerms: [
      {
        term: "Contraction Dimension (K)",
        definition:
          "The shared inner dimension along which dot products are accumulated during matrix multiplication.",
      },
      {
        term: "Block Tiling",
        definition:
          "Decomposing large matrices into small sub-matrix tiles that fit inside high-speed on-chip SRAM.",
      },
      {
        term: "Arithmetic Intensity",
        definition:
          "The ratio of floating-point operations executed to bytes of memory accessed (FLOPs / Byte).",
      },
      {
        term: "Tensor Core MMA",
        definition:
          "Hardware Matrix Multiply-Accumulate execution units on modern GPUs capable of executing 16x16 matrix operations in a single clock cycle.",
      },
    ],
  },
  trivia: CUDATRITONSRAMTILEDGEMM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 2" }],
  defaultInput: DEFAULT_CUDATRITONSRAMTILEDGEMM_INPUT,
  generateSteps: generateCudaTritonSramTiledGemmSteps,
};
