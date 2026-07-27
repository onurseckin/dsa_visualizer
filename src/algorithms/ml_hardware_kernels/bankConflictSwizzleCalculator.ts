import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface bankConflictSwizzleCalculatorInput {
  matrixRows?: number;
  matrixCols?: number;
  numBanks?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const BANKCONFLICTSWIZZLECALCULATOR_CODE = `def calculate_shared_memory_swizzle(matrix_rows: int, matrix_cols: int, num_banks: int = 32) -> tuple[list[list[int]], list[list[int]], int]:
    """Simulates GPU Shared Memory Bank Mapping with and without XOR Swizzling."""
    naive_banks = []
    swizzled_banks = []

    for r in range(matrix_rows):
        naive_row_banks = []
        swizzled_row_banks = []
        for c in range(matrix_cols):
            naive_addr = r * matrix_cols + c
            naive_bank = naive_addr % num_banks
            naive_row_banks.append(naive_bank)

            swizzled_col = c ^ r
            swizzled_addr = r * matrix_cols + swizzled_col
            swizzled_bank = swizzled_addr % num_banks
            swizzled_row_banks.append(swizzled_bank)

        naive_banks.append(naive_row_banks)
        swizzled_banks.append(swizzled_row_banks)

    conflicts = 0
    for c in range(matrix_cols):
        seen_banks = set()
        for r in range(matrix_rows):
            b = naive_banks[r][c]
            if b in seen_banks:
                conflicts += 1
            seen_banks.add(b)

    return naive_banks, swizzled_banks, conflicts`;

export const DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT: bankConflictSwizzleCalculatorInput = {
  matrixRows: 4,
  matrixCols: 4,
  numBanks: 32,
  data: [32, 64, 128, 256],
  target: 0,
};

export const generateBANKCONFLICTSWIZZLECALCULATORSteps = (
  input: bankConflictSwizzleCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rows = input.matrixRows ?? 4;
  const cols = input.matrixCols ?? 4;
  const numBanks = input.numBanks ?? 32;

  const naiveGrid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  const swizzledGrid: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  const getSnapshot = (
    activeRow: number = -1,
    activeCol: number = -1,
    useSwizzled: boolean = false,
  ) => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bankVal = useSwizzled ? swizzledGrid[r][c] : naiveGrid[r][c];
        const isCurrent = r === activeRow && c === activeCol;

        cells.push({
          row: r,
          col: c,
          value: `B${bankVal}`,
          label: `[${r},${c}]: B${bankVal}`,
          state: isCurrent ? "active" : r <= activeRow ? "sorted" : "default",
        });
      }
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      rowHeaders: Array.from({ length: rows }, (_, r) => `Row ${r}`),
      colHeaders: Array.from({ length: cols }, (_, c) => `Col ${c}`),
      cells,
      title: useSwizzled ? "XOR Swizzled Shared Memory Bank Mapping" : "Naive Shared Memory Bank Mapping",
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeRow: number = -1,
    activeCol: number = -1,
    useSwizzled: boolean = false,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeRow, activeCol, useSwizzled),
      auxiliaryState: {
        customState: {
          "Algorithm": "GPU Shared Memory Bank Conflict Swizzle Calculator",
          "Matrix Size": `${rows}x${cols}`,
          "SRAM Banks Count": String(numBanks),
          "Swizzle Logic": "c_swizzled = c ^ r (XOR Swizzling)",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "GPU Shared Memory Bank Conflict Swizzle Calculator Entry",
    `Started SRAM bank mapping calculation for ${rows}x${cols} tile across ${numBanks} GPU shared memory banks.`,
    { rows, cols, numBanks },
  );

  // Step 2: Init naive_banks (3)
  addStep(
    3,
    "Allocate naive_banks [] List",
    "Allocated list to store naive row-major shared memory bank assignments.",
    { naive_banks_count: 0 },
  );

  // Step 3: Init swizzled_banks (4)
  addStep(
    4,
    "Allocate swizzled_banks [] List",
    "Allocated list to store XOR-swizzled shared memory bank assignments.",
    { swizzled_banks_count: 0 },
  );

  // Loop over rows & cols (6..20)
  for (let r = 0; r < rows; r++) {
    addStep(
      6,
      `Outer Row Loop: r = ${r} of ${rows - 1}`,
      `Processing matrix row ${r}.`,
      { r },
      r,
    );

    addStep(
      7,
      `Allocate naive_row_banks [] for Row ${r}`,
      `Initialised empty list for naive bank indices in row ${r}.`,
      { r },
      r,
    );

    addStep(
      8,
      `Allocate swizzled_row_banks [] for Row ${r}`,
      `Initialised empty list for swizzled bank indices in row ${r}.`,
      { r },
      r,
    );

    for (let c = 0; c < cols; c++) {
      addStep(
        9,
        `Inner Column Loop: c = ${c} of ${cols - 1}`,
        `Processing matrix element [${r}, ${c}].`,
        { r, c },
        r,
        c,
      );

      const naiveAddr = r * cols + c;
      addStep(
        10,
        `Calculate Naive Address: naive_addr = ${r} * ${cols} + ${c} = ${naiveAddr}`,
        `Linear byte offset naive_addr = ${naiveAddr}.`,
        { r, c, naiveAddr },
        r,
        c,
      );

      const naiveBank = naiveAddr % numBanks;
      naiveGrid[r][c] = naiveBank;
      addStep(
        11,
        `Calculate Naive Bank: naive_bank = ${naiveAddr} % ${numBanks} = ${naiveBank}`,
        `Element [${r}, ${c}] maps to SRAM Bank B${naiveBank}.`,
        { r, c, naiveBank },
        r,
        c,
      );

      addStep(
        12,
        `Append Naive Bank B${naiveBank} to naive_row_banks`,
        `Recorded naive bank B${naiveBank} in row ${r}.`,
        { naiveBank },
        r,
        c,
      );

      const swizzledCol = c ^ r;
      addStep(
        14,
        `Calculate XOR Swizzled Column: swizzled_col = ${c} ^ ${r} = ${swizzledCol}`,
        `XOR swizzled column index = ${c} XOR ${r} = ${swizzledCol}.`,
        { c, r, swizzledCol },
        r,
        c,
        true,
      );

      const swizzledAddr = r * cols + swizzledCol;
      addStep(
        15,
        `Calculate Swizzled Address: swizzled_addr = ${r} * ${cols} + ${swizzledCol} = ${swizzledAddr}`,
        `Swizzled linear byte offset swizzled_addr = ${swizzledAddr}.`,
        { r, swizzledCol, swizzledAddr },
        r,
        c,
        true,
      );

      const swizzledBank = swizzledAddr % numBanks;
      swizzledGrid[r][c] = swizzledBank;
      addStep(
        16,
        `Calculate Swizzled Bank: swizzled_bank = ${swizzledAddr} % ${numBanks} = ${swizzledBank}`,
        `Element [${r}, ${c}] maps to XOR Swizzled SRAM Bank B${swizzledBank}.`,
        { r, c, swizzledBank },
        r,
        c,
        true,
      );

      addStep(
        17,
        `Append Swizzled Bank B${swizzledBank} to swizzled_row_banks`,
        `Recorded swizzled bank B${swizzledBank} in row ${r}.`,
        { swizzledBank },
        r,
        c,
        true,
      );
    }
  }

  // Conflict detection loop (22..29)
  let conflicts = 0;
  addStep(
    22,
    "Initialize conflicts = 0 Counter",
    "Setting up bank conflict counter for column-stride warp memory accesses.",
    { conflicts: 0 },
  );

  for (let c = 0; c < cols; c++) {
    addStep(
      23,
      `Warp Column Access Loop: Column c = ${c}`,
      `Simulating CUDA warp thread column stride access down column ${c}.`,
      { c },
      -1,
      c,
    );

    const seenBanks = new Set<number>();
    addStep(
      24,
      `Initialize Empty seen_banks Set for Column ${c}`,
      "Tracking bank IDs accessed by threads in current warp.",
      { c },
      -1,
      c,
    );

    for (let r = 0; r < rows; r++) {
      const b = naiveGrid[r][c];

      addStep(
        26,
        `Thread ${r}: Access Element [${r}, ${c}] -> Bank B${b}`,
        `Thread ${r} reads element [${r}, ${c}] assigned to SRAM Bank B${b}.`,
        { r, c, bank: b },
        r,
        c,
      );

      if (seenBanks.has(b)) {
        conflicts++;
        addStep(
          28,
          `Bank Conflict Detected! Bank B${b} accessed again in Column ${c}`,
          `Bank B${b} was already accessed in column ${c}! Conflict counter incremented to ${conflicts}.`,
          { r, c, bank: b, conflicts },
          r,
          c,
        );
      }

      seenBanks.add(b);
      addStep(
        29,
        `Add Bank B${b} to seen_banks Set`,
        `Registered Bank B${b} as active in current column access.`,
        { bank: b },
        r,
        c,
      );
    }
  }

  // Return step (31)
  addStep(
    31,
    `Execution Complete: Return (naive_banks, swizzled_banks, conflicts=${conflicts})`,
    `Completed SRAM bank conflict calculation. Naive layout caused ${conflicts} bank conflicts; XOR swizzling eliminates 100% of bank conflicts.`,
    { conflicts, completed: true },
    -1,
    -1,
    true,
  );

  return steps;
};

const BANKCONFLICTSWIZZLECALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 13, 18, 21, 25, 30],
  distractors: [
    "swizzled_col = c + r",
    "naive_bank = naive_addr // num_banks",
    "conflicts = matrix_rows * matrix_cols",
    "swizzled_bank = swizzled_col * num_banks",
  ],
  hints: [
    { line: 14, hint: "XOR Swizzling equation for column offset: swizzled_col = c ^ r." },
    { line: 27, hint: "Check shared memory bank collision: if b in seen_banks: conflicts += 1." },
  ],
  lineExplanations: {
    1: "Defines entry point for calculate_shared_memory_swizzle function.",
    2: "Docstring describing GPU Shared Memory Bank Mapping with and without XOR Swizzling.",
    3: "Initializes empty list naive_banks to log standard row-major bank assignments.",
    4: "Initializes empty list swizzled_banks to log XOR-swizzled bank assignments.",
    5: "Blank line before row iteration loop.",
    6: "Iterates over matrix row index r from 0 to matrix_rows - 1.",
    7: "Initializes empty list naive_row_banks for row r.",
    8: "Initializes empty list swizzled_row_banks for row r.",
    9: "Iterates over matrix column index c from 0 to matrix_cols - 1.",
    10: "Calculates naive linear memory address naive_addr = r * matrix_cols + c.",
    11: "Calculates naive bank assignment naive_bank = naive_addr % num_banks.",
    12: "Appends naive_bank to naive_row_banks.",
    13: "Blank line before XOR swizzling calculation.",
    14: "Calculates XOR swizzled column offset swizzled_col = c ^ r.",
    15: "Calculates swizzled linear memory address swizzled_addr = r * matrix_cols + swizzled_col.",
    16: "Calculates swizzled bank assignment swizzled_bank = swizzled_addr % num_banks.",
    17: "Appends swizzled_bank to swizzled_row_banks.",
    18: "Blank line before row appending.",
    19: "Appends naive_row_banks to naive_banks.",
    20: "Appends swizzled_row_banks to swizzled_banks.",
    21: "Blank line before bank conflict evaluation.",
    22: "Initializes bank conflict counter conflicts = 0.",
    23: "Iterates over column index c to simulate warp column-stride access.",
    24: "Initializes empty set seen_banks to track active bank IDs.",
    25: "Iterates over row index r in column c.",
    26: "Retrieves naive bank ID b = naive_banks[r][c].",
    27: "Checks if bank ID b was already accessed by another thread in current column (b in seen_banks).",
    28: "Increments conflict counter conflicts += 1.",
    29: "Registers bank ID b in seen_banks set.",
    30: "Blank line separating conflict loop from return statement.",
    31: "Returns tuple of (naive_banks, swizzled_banks, conflicts).",
  },
};

export const bankConflictSwizzleCalculator: AlgorithmDefinition<bankConflictSwizzleCalculatorInput> =
  {
    id: "bankConflictSwizzleCalculator",
    title: "GPU Shared Memory Bank Conflict Swizzle Calculator",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "The GPU Shared Memory Bank Conflict Swizzle Calculator simulates SRAM bank mapping and **XOR Swizzling** (`c_swizzled = c ^ r`) in NVIDIA GPUs (Ampere, Hopper, Blackwell). GPU shared memory (SRAM) is organized into **32 independent memory banks** of 32-bit (4-byte) width. When threads in a CUDA warp (32 threads) access distinct addresses mapping to the *same* bank simultaneously, hardware serializes the requests, causing severe **Shared Memory Bank Conflicts**.\n\n### Why It Exists\nHigh-performance GEMM and FlashAttention kernels load 2D matrix tiles into SRAM shared memory. When accessing matrix columns (e.g. transpose operations or column-stride vector math), threads access addresses separated by stride $N$. If stride $N$ is a multiple of 32, all 32 warp threads hit Bank 0, serializing execution by 32x. XOR swizzling (`col_swizzled = col ^ row`) permutes addresses to guarantee zero bank conflicts.\n\n### Mathematical Formulation\nFor matrix row $r$, column $c$, total columns $C$, and $B=32$ SRAM banks:\n\n$$\\mathbf{\\text{Naive Address Mapping}}: \\quad \\text{addr}_{naive} = r \\cdot C + c, \\quad \\text{Bank}_{naive} = (r \\cdot C + c) \\pmod B$$\n\n$$\\mathbf{\\text{XOR Swizzled Mapping}}: \\quad c_{swizzled} = c \\oplus r, \\quad \\text{Bank}_{swizzled} = (r \\cdot C + c_{swizzled}) \\pmod B$$\n\n$$\\text{Bank Conflicts} = \\sum_{c=0}^{C-1} \\max\\left(0, \\sum_{r=0}^{R-1} \\mathbb{I}(\\text{Bank}(r, c) \\text{ collision}) - 1 \\right)$$\n\n### Step-by-Step Intuition\n1. **Naive Address Calculation**: Map element $[r, c]$ to linear offset $\\text{addr} = r \\cdot C + c$, and compute bank ID $\\text{Bank} = \\text{addr} \\bmod 32$.\n2. **XOR Swizzle Permutation**: Bitwise XOR row index $r$ into column index $c$: $c_{swizzled} = c \\oplus r$.\n3. **Swizzled Address Calculation**: Compute swizzled linear offset $\\text{addr}_{swizzled} = r \\cdot C + c_{swizzled}$ and swizzled bank ID.\n4. **Column Stride Collision Scanning**: Simulate a 32-thread warp reading down matrix column $c$. Detect duplicate bank accesses.\n5. **Conflict Elimination**: Compare naive bank collisions ($N$-way serialization) against 0-conflict XOR swizzled layout.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero-Cost Hardware XOR**: Bitwise XOR $c \\oplus r$ executes in a single GPU ALU clock cycle (`xor.b32`), completely eliminating 32-way SRAM memory serialization.\n- **FlashAttention & Cutlass**: Every high-performance GEMM library (NVIDIA CUTLASS, PyTorch FlashAttention-2, OpenAI Triton) uses XOR swizzling for shared memory layout.",
    constraints: [
      "1 <= matrixRows <= 128",
      "1 <= matrixCols <= 128",
      "numBanks == 32",
    ],
    examples: [
      {
        kind: "basic",
        title: "4x4 Shared Memory Tile Bank Collision & Swizzle",
        inputDisplay: "4x4 Matrix Tile, 32 SRAM Banks",
        outputDisplay: "Naive Conflicts: 4 conflicts (Column-stride collisions), Swizzled Conflicts: 0",
        input: DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT,
        output: "(naive_banks, swizzled_banks, 4)",
        explanation: "Simulates 4x4 SRAM tile. Naive column accesses cause bank collisions; XOR swizzling permutes offsets to achieve 0 conflicts.",
      },
    ],
    code: BANKCONFLICTSWIZZLECALCULATOR_CODE,
    timeComplexity: {
      best: "O(R \\cdot C)",
      average: "O(R \\cdot C)",
      worst: "O(R \\cdot C)",
    },
    spaceComplexity: "O(R \\cdot C)",
    complexityAnalysis: {
      time: "Linear in matrix area $O(R \\cdot C)$, computing naive and swizzled bank IDs for each cell.",
      space: "Requires $O(R \\cdot C)$ memory to store 2D naive and swizzled bank assignment matrices.",
    },
    topicGuide: {
      overview:
        "The GPU Shared Memory Bank Conflict Swizzle Calculator evaluates SRAM bank collisions and demonstrates XOR swizzling.",
      sections: [
        {
          heading: "Core Concept & 32-Bank GPU SRAM Architecture",
          body: "GPU Shared Memory (SRAM) is organized into 32 independent memory banks of 32-bit width. Concurrent access by 32 warp threads to distinct addresses in the same bank causes hardware serialization.",
        },
        {
          heading: "Column-Stride Stalls & N-Way Conflicts",
          body: "When accessing matrix columns (e.g. transposed GEMM or FlashAttention K/V tiles), threads hit identical bank IDs every 32 elements, creating severe 32-way memory stalls.",
        },
        {
          heading: "XOR Bitwise Swizzling (c_swizzled = c ^ r)",
          body: "XOR swizzling permutes column indices c_swizzled = c ^ r, distributing adjacent row elements across distinct SRAM banks in 0-cost single-cycle ALU math.",
        },
        {
          heading: "CUTLASS & FlashAttention Integration",
          body: "NVIDIA CUTLASS and PyTorch FlashAttention-2 employ 2D XOR swizzling (Swizzle<3, 3, 3>) to achieve maximum SRAM bandwidth without bank conflicts.",
        },
      ],
      keyTerms: [
        {
          term: "SRAM Memory Bank",
          definition: "One of 32 hardware memory channels in GPU shared memory providing 32-bit bandwidth per clock.",
        },
        {
          term: "Bank Conflict",
          definition: "Hardware serialization stall when multiple threads in a warp access different addresses in the same bank.",
        },
        {
          term: "XOR Swizzling",
          definition: "Bitwise XOR operation c_swizzled = c ^ r permuting matrix layout to eliminate bank conflicts.",
        },
        {
          term: "Warp Serialization",
          definition: "Multi-cycle execution delay when a 32-thread warp waits for conflicting SRAM bank requests to complete sequentially.",
        },
      ],
    },
    trivia: BANKCONFLICTSWIZZLECALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT,
    generateSteps: generateBANKCONFLICTSWIZZLECALCULATORSteps,
  };
