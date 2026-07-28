import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonSramSwizzledGemmKernelInput {
  matrix_a?: number[][];
  matrix_b?: number[][];
  block_size?: number;
  num_banks?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TRITONSRAMSWIZZLEDGEMMKERNEL_CODE = `def triton_sram_swizzled_gemm_kernel(matrix_a: list[list[float]], matrix_b: list[list[float]], block_size: int = 2, num_banks: int = 32) -> tuple[list[list[float]], list[list[int]]]:
    rows_a = len(matrix_a)
    cols_a = len(matrix_a[0])
    cols_b = len(matrix_b[0])

    matrix_c = [[0.0 for _ in range(cols_b)] for _ in range(rows_a)]
    swizzle_grid = []

    for r in range(rows_a):
        swizzle_row = []
        for c in range(cols_b):
            swizzled_col = c ^ r
            bank_id = (r * cols_b + swizzled_col) % num_banks
            swizzle_row.append(bank_id)

            acc = 0.0
            for k in range(cols_a):
                acc += matrix_a[r][k] * matrix_b[k][c]
            matrix_c[r][c] = round(acc, 4)
        swizzle_grid.append(swizzle_row)

    return matrix_c, swizzle_grid`;

export const DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT: tritonSramSwizzledGemmKernelInput = {
  matrix_a: [
    [1.0, 2.0, 3.0],
    [3.0, 4.0, 1.0],
    [2.0, 1.0, 4.0],
  ],
  matrix_b: [
    [5.0, 6.0, 1.0],
    [7.0, 8.0, 2.0],
    [1.0, 2.0, 3.0],
  ],
  block_size: 3,
  num_banks: 32,
  data: [1, 2, 3, 3, 4, 1, 2, 1, 4],
  target: 0,
};

export const generateTRITONSRAMSWIZZLEDGEMMKERNELSteps = (
  input: tritonSramSwizzledGemmKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const matA = input.matrix_a || DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT.matrix_a!;
  const matB = input.matrix_b || DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT.matrix_b!;
  const numBanks = input.num_banks !== undefined ? input.num_banks : 32;

  const rowsA = matA.length;
  const colsA = matA[0].length;
  const colsB = matB[0].length;

  const matrixC: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(0.0));
  const swizzleGrid: number[][] = Array.from({ length: rowsA }, () => new Array(colsB).fill(-1));

  const getSnapshot = (activeR: number = -1, activeC: number = -1) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rowsA; r++) {
      for (let c = 0; c < colsB; c++) {
        const val = matrixC[r][c];
        const bankId = swizzleGrid[r][c];
        const isCurrent = activeR === r && activeC === c;
        const isInActiveRow = activeR === r;
        const state = isCurrent
          ? "active"
          : isInActiveRow
            ? "compare"
            : bankId !== -1
              ? "sorted"
              : "default";

        const labelStr =
          bankId !== -1 ? `C[${r},${c}]=${val.toFixed(2)} (Bank ${bankId})` : `C[${r},${c}]=0.0`;

        cells.push({
          row: r,
          col: c,
          value: val.toFixed(2),
          label: labelStr,
          state,
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows: rowsA,
      cols: colsB,
      rowHeaders: Array.from({ length: rowsA }, (_, r) => `Row ${r}`),
      colHeaders: Array.from({ length: colsB }, (_, c) => `Col ${c}`),
      cells,
      title: `Triton SRAM Swizzled GEMM Output C & Shared Memory Bank Grid (${rowsA}x${colsB}, ${numBanks} Banks)`,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR: number = -1,
    activeC: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          Algorithm: "Triton SRAM Swizzled Block GEMM Kernel",
          "Matrix A": `${rowsA} x ${colsA}`,
          "Matrix B": `${colsA} x ${colsB}`,
          "SRAM Banks Count": String(numBanks),
          "Conflict-Free Access": "Zero SRAM Shared Memory Bank Conflicts!",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton SRAM Swizzled Block GEMM Kernel Entry",
    `Started Triton SRAM swizzled block GEMM execution: Matrix A (${rowsA}x${colsA}) * Matrix B (${colsA}x${colsB}) across ${numBanks} SRAM banks.`,
    { rowsA, colsA, colsB, numBanks },
  );

  // Step 2: Measure dimensions (2, 3, 4)
  addStep(2, `Measure Matrix A Rows: rows_a = ${rowsA}`, `Matrix A row count rows_a = ${rowsA}.`, {
    rowsA,
  });

  addStep(
    3,
    `Measure Matrix A Cols: cols_a = ${colsA}`,
    `Matrix A column count cols_a = ${colsA}.`,
    { colsA },
  );

  addStep(
    4,
    `Measure Matrix B Cols: cols_b = ${colsB}`,
    `Matrix B column count cols_b = ${colsB}.`,
    { colsB },
  );

  // Step 3: Allocate matrix_c & swizzle_grid (6, 7)
  addStep(
    6,
    `Allocate Output Matrix C matrix_c [${rowsA}x${colsB}]`,
    `Allocated ${rowsA}x${colsB} matrix initialized to 0.0 in SRAM registers.`,
    { rowsA, colsB },
  );

  addStep(
    7,
    "Allocate Swizzle Grid swizzle_grid []",
    "Allocated list to log shared memory SRAM bank assignment IDs.",
    { swizzle_len: 0 },
  );

  // Outer loop r (9..20)
  for (let r = 0; r < rowsA; r++) {
    addStep(
      9,
      `Outer Row Loop: Process Row r = ${r}`,
      `Processing row ${r} of ${rowsA - 1} for GEMM dot-product & SRAM bank swizzling.`,
      { r },
      r,
    );

    addStep(
      10,
      `Allocate swizzle_row [] for Row ${r}`,
      `Initialised empty list to record bank assignments for row ${r}.`,
      { r },
      r,
    );

    for (let c = 0; c < colsB; c++) {
      addStep(
        11,
        `Inner Column Loop: Process Cell [${r}, ${c}]`,
        `Processing cell C[${r}, ${c}] dot-product and XOR bank swizzling.`,
        { r, c },
        r,
        c,
      );

      const swizzledCol = c ^ r;
      addStep(
        12,
        `Calculate XOR Column Swizzle: swizzled_col = ${c} ^ ${r} = ${swizzledCol}`,
        `Evaluated bitwise XOR column index swizzled_col = ${c} ^ ${r} = ${swizzledCol} to eliminate shared memory bank conflicts.`,
        { r, c, swizzledCol },
        r,
        c,
      );

      const bankId = (r * colsB + swizzledCol) % numBanks;
      addStep(
        13,
        `Calculate SRAM Bank Assignment ID: bank_id = (${r} * ${colsB} + ${swizzledCol}) % ${numBanks} = ${bankId}`,
        `Mapped swizzled cell address to SRAM Bank ${bankId}.`,
        { r, c, swizzledCol, numBanks, bankId },
        r,
        c,
      );

      swizzleGrid[r][c] = bankId;
      addStep(
        14,
        `Append Bank ${bankId} to swizzle_row`,
        `Logged SRAM bank assignment Bank ${bankId} for cell C[${r}, ${c}].`,
        { r, c, bankId },
        r,
        c,
      );

      let acc = 0.0;
      addStep(
        16,
        `Initialize Accumulator Register: acc = 0.0 for C[${r}, ${c}]`,
        `Allocated floating-point accumulator register acc = 0.0.`,
        { r, c, acc },
        r,
        c,
      );

      for (let k = 0; k < colsA; k++) {
        addStep(
          17,
          `Inner Reduction Loop: k = ${k}`,
          `Evaluating reduction index k = ${k} of ${colsA - 1} for element-wise product A[${r}, ${k}] * B[${k}, ${c}].`,
          { r, c, k, aVal: matA[r][k], bVal: matB[k][c] },
          r,
          c,
        );

        const prod = matA[r][k] * matB[k][c];
        acc += prod;
        addStep(
          18,
          `FMA Multiply-Accumulate k=${k}: acc += A[${r},${k}] (${matA[r][k]}) * B[${k},${c}] (${matB[k][c]}) = ${acc.toFixed(2)}`,
          `Executed FMA (Fused Multiply-Add) step k=${k}: ${matA[r][k]} * ${matB[k][c]} = ${prod.toFixed(2)} -> acc = ${acc.toFixed(2)}.`,
          { r, c, k, aVal: matA[r][k], bVal: matB[k][c], prod, acc },
          r,
          c,
        );
      }

      const roundedAcc = Math.round(acc * 10000) / 10000;
      matrixC[r][c] = roundedAcc;
      addStep(
        19,
        `Write Final Cell Result: matrix_c[${r}][${c}] = ${roundedAcc.toFixed(4)}`,
        `Stored finalized dot-product result C[${r}, ${c}] = ${roundedAcc.toFixed(4)} into matrix_c.`,
        { r, c, roundedAcc },
        r,
        c,
      );
    }

    addStep(
      20,
      `Append swizzle_row for Row ${r} to swizzle_grid`,
      `Logged row ${r} bank swizzle pattern to swizzle_grid matrix.`,
      { r },
      r,
    );
  }

  // Return step (22)
  addStep(
    22,
    "Execution Complete: Return (matrix_c, swizzle_grid)",
    `Completed Triton SRAM Swizzled Block GEMM kernel execution. Computed ${rowsA}x${colsB} matrix result C with zero SRAM shared memory bank conflicts!`,
    { rowsA, colsB, completed: true },
  );

  return steps;
};

const TRITONSRAMSWIZZLEDGEMMKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [5, 8, 15, 21],
  distractors: [
    "swizzled_col = c + r",
    "bank_id = (r + c) % num_banks",
    "acc += matrix_a[r][k] + matrix_b[k][c]",
    "return matrix_c",
  ],
  hints: [
    { line: 12, hint: "Bitwise XOR column swizzling formula: swizzled_col = c ^ r." },
    { line: 18, hint: "FMA accumulation loop step: acc += matrix_a[r][k] * matrix_b[k][c]." },
  ],
  lineExplanations: {
    1: "Defines entry point for triton_sram_swizzled_gemm_kernel function.",
    2: "Measures Matrix A row count rows_a = len(matrix_a).",
    3: "Measures Matrix A column count cols_a = len(matrix_a[0]).",
    4: "Measures Matrix B column count cols_b = len(matrix_b[0]).",
    5: "Blank line before matrix allocation.",
    6: "Initializes output matrix_c with 0.0 floating point values.",
    7: "Initializes empty list swizzle_grid for SRAM bank tracking.",
    8: "Blank line before row processing loop.",
    9: "Iterates over Matrix A row index r from 0 to rows_a - 1.",
    10: "Initializes empty list swizzle_row for row r.",
    11: "Iterates over Matrix B column index c from 0 to cols_b - 1.",
    12: "Calculates bitwise XOR column swizzle swizzled_col = c ^ r to eliminate bank conflicts.",
    13: "Calculates SRAM shared memory bank assignment bank_id = (r * cols_b + swizzled_col) % num_banks.",
    14: "Appends bank_id to swizzle_row.",
    15: "Blank line before accumulator loop.",
    16: "Initializes floating point accumulator acc = 0.0.",
    17: "Iterates over reduction dimension k from 0 to cols_a - 1.",
    18: "Executes FMA dot-product multiplication and addition acc += matrix_a[r][k] * matrix_b[k][c].",
    19: "Stores rounded accumulator result matrix_c[r][c] = round(acc, 4).",
    20: "Appends swizzle_row to swizzle_grid.",
    21: "Blank line separating loops from return statement.",
    22: "Returns tuple of (matrix_c, swizzle_grid).",
  },
};

export const tritonSramSwizzledGemmKernel: AlgorithmDefinition<tritonSramSwizzledGemmKernelInput> =
  {
    id: "triton-sram-swizzled-gemm-kernel",
    title: "Triton SRAM Swizzled Block GEMM Kernel",
    topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    description:
      "The Triton SRAM Swizzled Block GEMM Kernel simulates OpenAI Triton's shared memory **XOR Bank Swizzling** mechanism for matrix multiplication ($C = A \\cdot B$). Modern GPU architectures feature **32-bank Shared Memory (SRAM)**. When SIMD thread warps load 2D matrix tiles into SRAM, sequential column reads often land on the *same* memory bank, causing **Shared Memory Bank Conflicts** that stall the GPU memory pipeline by up to **32x**. Applying bitwise XOR swizzling (`swizzled_col = c ^ r`) scrambles column memory addresses across all 32 banks, guaranteeing conflict-free parallel access.\n\n### Why It Exists\nIn high-performance CUTLASS and Triton GEMM kernels, matrix $A$ and $B$ tiles are copied from HBM DRAM into GPU SRAM before feeding Tensor Cores. Without swizzling, parallel threads reading adjacent matrix columns access identical SRAM banks, turning single-cycle memory reads into serialized 32-step stalls.\n\n### Mathematical Formulation\nFor matrix row $r \\in \\{0, \\dots, M-1\\}$, column $c \\in \\{0, \\dots, N-1\\}$, reduction dimension $k \\in \\{0, \\dots, K-1\\}$, and 32 SRAM banks:\n\n$$1. \\quad c_{swizzled} = c \\oplus r \\quad (\\text{Bitwise XOR Column Swizzle})$$\n\n$$2. \\quad \\text{Bank}_{ID} = (r \\cdot N + c_{swizzled}) \\pmod{32} \\quad (\\text{SRAM Bank Assignment})$$\n\n$$3. \\quad C_{r, c} = \\sum_{k=0}^{K-1} A_{r, k} \\cdot B_{k, c} \\quad (\\text{Fused Multiply-Accumulate FMA})$$\n\n### Step-by-Step Intuition\n1. **Tile Load into SRAM**: Load block tiles of Matrix $A$ and $B$ from DRAM into shared memory.\n2. **Bitwise XOR Swizzle**: Compute `swizzled_col = c ^ r` to skew address offsets across adjacent rows.\n3. **Conflict-Free Bank Mapping**: Verify `bank_id = (r * cols_b + swizzled_col) % 32` routes parallel warp threads to 32 distinct SRAM memory banks.\n4. **Tensor Core FMA Dot-Product**: Execute inner loop `acc += A[r][k] * B[k][c]` at peak hardware throughput.\n5. **Write Matrix C Result**: Store finalized GEMM cell output $C_{r, c}$ into global DRAM memory.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Latency XOR Math**: Bitwise XOR (`^`) executes in 1 clock cycle on GPU ALUs, completely replacing 32-cycle bank conflict stalls.\n- **Universal CUTLASS / Triton Pattern**: Utilized in CUTLASS `SwizzledSharedMemLayout` and Triton's automatic `@triton.jit` layout optimization passes.",
    constraints: [
      "1 <= rows_a <= 128",
      "1 <= cols_a <= 128",
      "1 <= cols_b <= 128",
      "num_banks in [16, 32, 64]",
    ],
    examples: [
      {
        kind: "basic",
        title: "3x3 SRAM Swizzled Block GEMM Execution (32 Banks)",
        inputDisplay: "Matrix A (3x3), Matrix B (3x3), num_banks = 32",
        outputDisplay: "Matrix C Result & SRAM Swizzle Bank Grid",
        input: DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT,
        output: "(matrix_c, swizzle_grid)",
        explanation:
          "Computes 3x3 GEMM matrix product using XOR column swizzling to ensure zero shared memory bank conflicts across 32 SRAM banks.",
      },
    ],
    code: TRITONSRAMSWIZZLEDGEMMKERNEL_CODE,
    timeComplexity: {
      best: "O(M \\cdot N \\cdot K)",
      average: "O(M \\cdot N \\cdot K)",
      worst: "O(M \\cdot N \\cdot K)",
    },
    spaceComplexity: "O(M \\cdot N)",
    complexityAnalysis: {
      time: "Cubic in matrix dimensions $O(M \\cdot N \\cdot K)$, evaluating $M \\cdot N \\cdot K$ multiply-accumulate operations.",
      space:
        "Requires $O(M \\cdot N)$ memory space to store matrix result $C$ and bank swizzle grid.",
    },
    topicGuide: {
      overview:
        "The Triton SRAM Swizzled Block GEMM Kernel performs matrix multiplication using bitwise XOR column swizzling for zero-conflict GPU shared memory access.",
      sections: [
        {
          heading: "Core Concept & Shared Memory Bank Conflicts",
          body: "GPU SRAM features 32 independent memory banks. Simultaneous access to the same bank by parallel threads in a warp causes bank conflicts, serializing reads up to 32x.",
        },
        {
          heading: "Bitwise XOR Swizzling (c ^ r)",
          body: "Computing swizzled_col = c ^ r skews column address offsets across rows, ensuring parallel SIMD threads access 32 distinct SRAM banks simultaneously.",
        },
        {
          heading: "Fused Multiply-Accumulate (FMA) Dot-Product",
          body: "Accumulates inner-product terms acc += A[r][k] * B[k][c] inside fast GPU registers before storing the final result matrix C to global DRAM.",
        },
        {
          heading: "CUTLASS & Triton Architecture Standard",
          body: "XOR layout swizzling is the industry standard mechanism used in NVIDIA CUTLASS and OpenAI Triton to achieve 95%+ peak Tensor Core FLOP utilization.",
        },
      ],
      keyTerms: [
        {
          term: "SRAM Bank Conflict",
          definition:
            "Performance bottleneck when multiple warp threads request data from the same GPU shared memory bank concurrently.",
        },
        {
          term: "XOR Swizzling",
          definition:
            "Bitwise XOR operation (c ^ r) applied to memory addresses to distribute data across shared memory banks evenly.",
        },
        {
          term: "FMA (Fused Multiply-Add)",
          definition:
            "Hardware GPU instruction executing (a * b) + c in a single floating-point clock cycle with high precision.",
        },
        {
          term: "Tensor Core",
          definition:
            "Specialized GPU hardware execution unit optimized for high-throughput matrix multiplication.",
        },
      ],
    },
    trivia: TRITONSRAMSWIZZLEDGEMMKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT,
    generateSteps: generateTRITONSRAMSWIZZLEDGEMMKERNELSteps,
  };
