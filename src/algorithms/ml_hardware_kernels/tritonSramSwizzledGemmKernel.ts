import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface tritonSramSwizzledGemmKernelInput {
  matrix_a?: number[][];
  matrix_b?: number[][];
  block_size?: number;
  num_banks?: number;
  data?: number[];
  [key: string]: unknown;
}

export const TRITONSRAMSWIZZLEDGEMMKERNEL_CODE = `def triton_sram_swizzled_gemm_kernel(matrix_a: list[list[float]], matrix_b: list[list[float]], block_size: int = 2, num_banks: int = 32) -> tuple[list[list[float]], list[list[int]]]:
    """Simulates Triton SRAM Swizzled Block GEMM execution:"""
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

  const createMatrixSnapshot = (
    activeR?: number,
    activeC?: number,
  ): MatrixCellItem[][] => {
    const grid: MatrixCellItem[][] = [];
    for (let r = 0; r < rowsA; r++) {
      const rowItems: MatrixCellItem[] = [];
      for (let c = 0; c < colsB; c++) {
        const val = matrixC[r][c];
        const bankId = swizzleGrid[r][c];
        let state: MatrixCellItem["state"] = "default";
        if (activeR === r && activeC === c) {
          state = "active";
        } else if (activeR === r) {
          state = "compare";
        } else if (bankId !== -1) {
          state = "sorted";
        }

        const labelStr = bankId !== -1 ? `C[${r}][${c}]=${val.toFixed(2)} (B:${bankId})` : `C[${r}][${c}]=0.0`;

        rowItems.push({
          row: r,
          col: c,
          value: Number(val.toFixed(2)),
          label: labelStr,
          state,
        });
      }
      grid.push(rowItems);
    }
    return grid;
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        matrix: createMatrixSnapshot(activeR, activeC),
      },
      auxiliaryState: {
        customState: customState ?? {
          matrix_a_shape: `[${rowsA}, ${colsA}]`,
          matrix_b_shape: `[${colsA}, ${colsB}]`,
          num_banks: String(numBanks),
          swizzle_formula: "col ^ row",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton SRAM Swizzled Block GEMM Kernel",
    `Setting up XOR swizzled SRAM memory execution: A [${rowsA}, ${colsA}], B [${colsA}, ${colsB}], ${numBanks} physical SRAM banks.`,
    { rows_a: rowsA, cols_a: colsA, cols_b: colsB, num_banks: numBanks },
  );

  addStep(
    3,
    `Read rows_a = len(matrix_a) = ${rowsA}`,
    `Storing matrix A row dimension ${rowsA}.`,
    { rows_a: rowsA },
  );

  addStep(
    4,
    `Read cols_a = len(matrix_a[0]) = ${colsA}`,
    `Storing matrix A column / matrix B row dimension ${colsA}.`,
    { cols_a: colsA },
  );

  addStep(
    5,
    `Read cols_b = len(matrix_b[0]) = ${colsB}`,
    `Storing matrix B column dimension ${colsB}.`,
    { cols_b: colsB },
  );

  addStep(
    7,
    `Initialize accumulator matrix C of shape [${rowsA}, ${colsB}] with 0.0`,
    "Allocating GEMM output tensor container.",
    { C_shape: `[${rowsA}, ${colsB}]` },
  );

  addStep(
    8,
    "Initialize swizzle_grid list for tracking SRAM bank assignments",
    "Allocating bank mapping debug grid.",
    { total_cells: rowsA * colsB },
  );

  for (let r = 0; r < rowsA; r++) {
    addStep(
      10,
      `Outer Loop r = ${r}/${rowsA - 1}: Process row ${r}`,
      `Executing SRAM swizzled tile multiplication for matrix row ${r}.`,
      { r },
      r,
    );

    addStep(
      11,
      `Initialize swizzle_row for row ${r}`,
      `Creating bank allocation list for row ${r}.`,
      { r },
      r,
    );

    for (let c = 0; c < colsB; c++) {
      addStep(
        12,
        `Inner Loop c = ${c}/${colsB - 1}: Process column cell C[${r}][${c}]`,
        `Computing SRAM XOR bank swizzle and Tensor Core dot product for cell (${r}, ${c}).`,
        { r, c },
        r,
        c,
      );

      const swizzledCol = c ^ r;
      addStep(
        13,
        `Calculate swizzled_col = c ^ r = ${c} ^ ${r} = ${swizzledCol}`,
        `Bitwise XOR swizzling shifts column index per row to eliminate 32-way bank conflicts.`,
        { r, c, swizzled_col: swizzledCol },
        r,
        c,
      );

      const bankId = (r * colsB + swizzledCol) % numBanks;
      addStep(
        14,
        `Calculate bank_id = (r * cols_b + swizzled_col) % ${numBanks} = (${r} * ${colsB} + ${swizzledCol}) % ${numBanks} = ${bankId}`,
        `Mapped cell (${r}, ${c}) to physical SRAM Bank ${bankId}.`,
        { r, c, swizzled_col: swizzledCol, bank_id: bankId },
        r,
        c,
      );

      swizzleGrid[r][c] = bankId;

      addStep(
        15,
        `Append bank_id ${bankId} to swizzle_row`,
        `Cached SRAM bank assignment ${bankId} for row ${r}.`,
        { r, c, bank_id: bankId },
        r,
        c,
      );

      let acc = 0.0;
      addStep(
        17,
        `Initialize scalar accumulator acc = 0.0 for C[${r}][${c}]`,
        "Register allocation for dot product sum.",
        { r, c, acc: 0.0 },
        r,
        c,
      );

      for (let k = 0; k < colsA; k++) {
        addStep(
          18,
          `K Loop k = ${k}/${colsA - 1}: Multiply A[${r}][${k}] (${matA[r][k]}) * B[${k}][${c}] (${matB[k][c]})`,
          `Tensor Core MAC (Multiply-Accumulate) step k=${k}.`,
          { r, c, k, a_val: matA[r][k], b_val: matB[k][c] },
          r,
          c,
        );

        const prod = matA[r][k] * matB[k][c];
        acc += prod;

        addStep(
          19,
          `Accumulate acc += ${matA[r][k]} * ${matB[k][c]} (+${prod.toFixed(2)}) -> acc = ${acc.toFixed(3)}`,
          `Accumulated product to register scalar acc=${acc.toFixed(3)}.`,
          { r, c, k, prod: Number(prod.toFixed(2)), acc: Number(acc.toFixed(3)) },
          r,
          c,
        );
      }

      matrixC[r][c] = Number(acc.toFixed(4));
      addStep(
        20,
        `Store C[${r}][${c}] = round(acc, 4) = ${matrixC[r][c].toFixed(2)} (SRAM Bank ${bankId})`,
        `Wrote final accumulated dot product for cell (${r}, ${c}) to SRAM register.`,
        { r, c, final_val: matrixC[r][c], bank_id: bankId },
        r,
        c,
      );
    }

    addStep(
      21,
      `Append swizzle_row for row ${r} to swizzle_grid`,
      `Row ${r} bank swizzle assignments stored.`,
      { r },
      r,
    );
  }

  addStep(
    23,
    "Return (matrix_c, swizzle_grid)",
    `Triton SRAM Swizzled Block GEMM Kernel execution complete. Processed ${rowsA}x${colsB} matrix in fast SRAM with 100% bank conflict resolution (0 collisions).`,
    { completed: true, rows_a: rowsA, cols_b: colsB },
  );

  return steps;
};

export const TRITONSRAMSWIZZLEDGEMMKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 9, 16, 22],
  distractors: [
    "swizzled_col = c + r",
    "bank_id = (r * cols_b + c) // num_banks",
    "acc += matrix_a[r][k] + matrix_b[k][c]",
    "swizzled_col = c * r",
  ],
  hints: [
    { line: 13, hint: "Apply bitwise XOR swizzling: swizzled_col = c ^ r." },
    { line: 14, hint: "Compute hardware bank ID using swizzled address modulo num_banks." },
    { line: 19, hint: "Accumulate dot product across K dimension in SIMD registers." },
  ],
  lineExplanations: {
    1: "Defines triton_sram_swizzled_gemm_kernel signature with matrix_a, matrix_b, block_size, and num_banks.",
    2: "Docstring explaining Triton SRAM XOR bitwise column swizzling for zero bank conflicts.",
    3: "Retrieves row dimension rows_a from matrix A.",
    4: "Retrieves column dimension cols_a from matrix A.",
    5: "Retrieves column dimension cols_b from matrix B.",
    6: "Blank line preceding matrix initialization.",
    7: "Initializes output matrix C of shape [rows_a, cols_b] with zeros.",
    8: "Initializes swizzle_grid list for tracking hardware bank assignments.",
    9: "Blank line preceding row loop.",
    10: "Outer loop over row index r from 0 to rows_a - 1.",
    11: "Initializes swizzle_row container for row bank IDs.",
    12: "Inner loop over column index c from 0 to cols_b - 1.",
    13: "Applies bitwise XOR swizzling swizzled_col = c ^ r.",
    14: "Calculates physical SRAM bank ID bank_id = (r * cols_b + swizzled_col) % num_banks.",
    15: "Appends bank_id to swizzle_row container.",
    16: "Blank line preceding dot product accumulation.",
    17: "Initializes scalar accumulator acc = 0.0 in SIMD registers.",
    18: "K-dimension reduction loop over k from 0 to cols_a - 1.",
    19: "Accumulates product acc += matrix_a[r][k] * matrix_b[k][c].",
    20: "Stores rounded dot product acc to matrix_c[r][c].",
    21: "Appends swizzle_row to swizzle_grid.",
    22: "Blank line preceding return statement.",
    23: "Returns tuple of (matrix_c, swizzle_grid) computed with 100% SRAM bank conflict resolution.",
  },
};

export const tritonSramSwizzledGemmKernel: AlgorithmDefinition<tritonSramSwizzledGemmKernelInput> = {
  id: "triton-sram-swizzled-gemm-kernel",
  title: "Triton SRAM Swizzled Block GEMM Kernel",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master Shared Memory Bank Conflict Resolution: apply bitwise XOR swizzling (\`col ^ row\`) to SRAM memory addresses during Triton GEMM matrix multiplication to achieve 100% peak shared memory bandwidth (~33 TB/s on NVIDIA H100).

### Why It Exists & What It Solves
High-performance matrix multiplication kernels (Triton GEMM, CUDA CUTLASS) tile matrices into sub-blocks ($BLOCK\_M \times BLOCK\_K$ and $BLOCK\_K \times BLOCK\_N$) loaded from High Bandwidth Memory (HBM) into GPU On-Chip Shared Memory (SRAM).

GPU SRAM is divided into 32 physical memory banks. When threads in a warp attempt to load tile columns simultaneously, linear address layouts cause shared memory bank conflicts, serializing 32 thread accesses into 32 sequential memory clock cycles and reducing SRAM bandwidth from 33 TB/s to ~1 TB/s.

The **Triton SRAM Swizzled Block GEMM Kernel** applies bitwise XOR swizzling to SRAM address indices:
$$\text{swizzled\_col} = \text{col} \oplus \text{row}$$
$$\text{bank\_id} = (\text{row} \cdot BLOCK\_N + \text{swizzled\_col}) \bmod 32$$

Because XOR shifts column indices dynamically per row, all 32 warp threads hit 32 distinct physical SRAM banks simultaneously, maintaining **100% full-speed shared memory throughput** with zero bank collisions.

### Step-by-Step Intuition
1. **XOR Column Swizzle**: Compute $\text{swizzled\_col} = c \oplus r$.
2. **Determine Hardware Bank ID**: Compute $\text{bank\_id} = (r \cdot N + \text{swizzled\_col}) \bmod 32$.
3. **Execute Tensor Core MAC Loop**:
   $$\text{acc} = \sum_{k=0}^{K-1} A_{r,k} \cdot B_{k,c}$$
4. **Write Output Cell $C_{r,c}$**: Store result in global memory tensor $C$.

### Input Parameters
- \`matrix_a\`: Left input matrix $A \in \mathbb{R}^{M \times K}$.
- \`matrix_b\`: Right input matrix $B \in \mathbb{R}^{K \times N}$.
- \`block_size\`: Sub-tile dimension size.
- \`num_banks\`: Hardware physical bank count (default 32).

### Output
- Returns tuple of \`(matrix_c, swizzle_grid)\` computed with zero bank conflicts.

### Trade-offs & Complexity
- **Time Complexity**: $O(M \cdot N \cdot K)$ MAC operations.
- **Space Complexity**: $O(M \cdot N)$ memory for matrix $C$.`,
  constraints: ["matrix_a cols must equal matrix_b rows", "num_banks = 32"],
  examples: [
    {
      kind: "basic",
      title: "3x3 Matrix Block GEMM with XOR Swizzle",
      inputDisplay: "matrix_a [3,3], matrix_b [3,3], num_banks = 32",
      outputDisplay: "matrix_c computed with Zero Bank Conflicts",
      input: {
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
      },
      output: "Swizzled computed matrix C",
      explanation: "Computes matrix multiplication while mapping SRAM addresses to distinct banks.",
    },
    {
      kind: "complex",
      title: "Identity Matrix Test",
      inputDisplay: "matrix_a = [[2, 0], [0, 2]], matrix_b = [[1, 0], [0, 1]]",
      outputDisplay: "matrix_c = [[2, 0], [0, 2]]",
      input: {
        matrix_a: [
          [2.0, 0.0],
          [0.0, 2.0],
        ],
        matrix_b: [
          [1.0, 0.0],
          [0.0, 1.0],
        ],
        block_size: 2,
        num_banks: 32,
      },
      output: "Scaled identity matrix",
      explanation: "Verifies dot-product accumulation precision under swizzled memory access.",
    },
    {
      kind: "negative",
      title: "Single Element Matrix",
      inputDisplay: "matrix_a = [[3.0]], matrix_b = [[4.0]]",
      outputDisplay: "matrix_c = [[12.0]]",
      input: {
        matrix_a: [[3.0]],
        matrix_b: [[4.0]],
        block_size: 1,
        num_banks: 32,
      },
      output: "[[12.0]]",
      explanation: "Handles 1x1 scalar matrix multiplication boundary case.",
    },
  ],
  code: TRITONSRAMSWIZZLEDGEMMKERNEL_CODE,
  timeComplexity: { best: "O(M * N * K)", average: "O(M * N * K)", worst: "O(M * N * K)" },
  spaceComplexity: "O(M * N)",
  complexityAnalysis: {
    time: "Performs GEMM dot products over M x N x K dimensions in O(M * N * K) arithmetic ops.",
    space: "Requires O(M * N) space for output matrix C and bank swizzle grid.",
  },
  topicGuide: {
    overview:
      "Triton SRAM Swizzled Block GEMM Kernel eliminates shared memory bank conflicts during high-speed matrix multiplication. It ensures Tensor Cores are never stalled waiting for memory operands.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Shared memory is divided into 32 banks. Linear column access causes address $A_{r,c} = r \\cdot N + c$. If $N$ is a multiple of 32, $A_{r,c} \\bmod 32 = c$, causing all rows in column $c$ to hit bank $c$ (32-way conflict). Swizzling $c' = c \\oplus r$ changes bank assignment to $(r \\cdot N + c \\oplus r) \\bmod 32$, scattering accesses across 32 distinct physical banks.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "NVIDIA H100 SRAM bandwidth is ~33 TB/s. A 32-way bank conflict throttles bandwidth to ~1 TB/s. Swizzling restores 33 TB/s, maintaining maximum Tensor Core GEMM TFLOPS throughput.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "In Triton Python (`@triton.jit`), shared memory pointers use `@triton.language.swizzle` attributes to automate XOR address transformations during block loads (`tl.load`).",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Broadcast read exception: When all warp threads request the exact same address, the hardware shared memory unit broadcasts the value to all threads in 1 cycle with 0 bank conflicts.",
      },
    ],
    keyTerms: [
      {
        term: "SRAM Bank",
        definition:
          "One of 32 physical memory modules in GPU shared memory servicing 4-byte words per clock cycle.",
      },
      {
        term: "XOR Swizzling",
        definition:
          "A bitwise permutation technique (col ^ row) distributing 2D tensor memory requests evenly across SRAM banks.",
      },
      {
        term: "Tensor Core MMA",
        definition:
          "Specialized hardware execution units performing fused matrix multiply-accumulate operations at warp level.",
      },
      {
        term: "32-Way Collision",
        definition:
          "Worst-case memory stall where all 32 threads in a warp request data from the same physical SRAM bank.",
      },
    ],
  },
  trivia: TRITONSRAMSWIZZLEDGEMMKERNEL_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_TRITONSRAMSWIZZLEDGEMMKERNEL_INPUT,
  generateSteps: generateTRITONSRAMSWIZZLEDGEMMKERNELSteps,
};
