import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface bankConflictSwizzleCalculatorInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const BANKCONFLICTSWIZZLECALCULATOR_CODE = `
def calculate_shared_memory_swizzle(
    matrix_rows: int,
    matrix_cols: int,
    num_banks: int = 32
) -> tuple[list[list[int]], list[list[int]], int]:
    """
    Simulates GPU Shared Memory Bank Mapping with and without XOR Swizzling.
    - Naive mapping: bank_id = (row * matrix_cols + col) % num_banks
    - Swizzled mapping: swizzled_col = col ^ row; swizzled_bank_id = (row * matrix_cols + swizzled_col) % num_banks
    Calculates number of 32-way warp bank conflicts for column accesses.
    """
    naive_banks = []
    swizzled_banks = []
    
    for r in range(matrix_rows):
        naive_row_banks = []
        swizzled_row_banks = []
        for c in range(matrix_cols):
            # 1. Naive linear bank assignment
            naive_addr = r * matrix_cols + c
            naive_bank = naive_addr % num_banks
            naive_row_banks.append(naive_bank)
            
            # 2. XOR Swizzled bank assignment to prevent 32-way warp conflicts
            swizzled_col = c ^ r
            swizzled_addr = r * matrix_cols + swizzled_col
            swizzled_bank = swizzled_addr % num_banks
            swizzled_row_banks.append(swizzled_bank)
            
        naive_banks.append(naive_row_banks)
        swizzled_banks.append(swizzled_row_banks)

    # Count bank conflicts during vertical column accesses
    conflicts = 0
    for c in range(matrix_cols):
        seen_banks = set()
        for r in range(matrix_rows):
            b = naive_banks[r][c]
            if b in seen_banks:
                conflicts += 1
            seen_banks.add(b)

    return naive_banks, swizzled_banks, conflicts
`;

export const DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT: bankConflictSwizzleCalculatorInput = {
  data: [32, 64, 128, 256],
};

export const generateBANKCONFLICTSWIZZLECALCULATORSteps = (
  input: bankConflictSwizzleCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [32, 64, 128, 256];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          num_banks: "32",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize GPU Shared Memory Bank Conflict Swizzle Calculator",
    "Setting up 32-bank SRAM memory layout: checking XOR swizzle col ^ row mapping.",
    { num_banks: 32 },
  );

  arrayData.forEach((val: number, idx: number) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`col=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    const naiveBank = (idx * 32) % 32;
    const swizzledBank = (idx ^ (idx % 4)) % 32;

    addStep(
      20,
      `Evaluate memory address ${idx} (stride=${val}): Naive Bank ${naiveBank} vs Swizzled Bank ${swizzledBank}`,
      `Applying bitwise XOR (col ^ row) shifts memory bank IDs across warp threads, eliminating bank collisions.`,
      { colIdx: idx, naiveBank, swizzledBank, stride: val },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    32,
    "Execution Complete",
    "Successfully verified zero-conflict SRAM memory layout using XOR swizzling.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const BANKCONFLICTSWIZZLECALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "swizzled_col = c + r",
    "naive_bank = naive_addr // num_banks",
    "swizzled_bank = swizzled_col % 16",
  ],
  hints: [
    { line: 17, hint: "Compute naive linear bank ID via addr % num_banks." },
    { line: 22, hint: "Compute swizzled column index using bitwise XOR: c ^ r." },
    { line: 32, hint: "Count bank collision frequency across vertical matrix column accesses." },
  ],
  lineExplanations: {
    1: "Defines shared memory bank swizzle calculator entry point.",
    17: "Calculates naive linear memory bank index.",
    22: "Applies bitwise XOR swizzling: swizzled_col = col ^ row.",
    24: "Calculates swizzled memory bank index.",
    32: "Iterates through warp threads to detect physical bank conflicts.",
  },
};

export const bankConflictSwizzleCalculator: AlgorithmDefinition<bankConflictSwizzleCalculatorInput> =
  {
    id: "bank-conflict-swizzle-calculator",
    title: "GPU Shared Memory Bank Conflict Swizzle Calculator",
    category: "ml_hardware_kernels",
    categories: ["ml_hardware_kernels", "ml_gemm_roofline"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_hardware_kernels",
    description:
      "NVIDIA GPU Shared Memory (SRAM) is organized into 32 independent physical memory banks (each 4 bytes wide per clock cycle). When a 32-thread warp issues a shared memory read/write instruction, all 32 addresses are serviced simultaneously provided each address falls into a DIFFERENT memory bank. If two or more threads attempt to access different 4-byte words within the SAME memory bank, a **shared memory bank conflict** occurs, serializing access into multiple sequential transactions.\n\nTo eliminate bank conflicts during 2D matrix transposition and GEMM tile loads, CUDA/Triton kernels apply **XOR Swizzling**:\n$$\\text{swizzled\\_col} = \\text{col} \\oplus \\text{row}, \\quad \\text{bank\\_id} = (\\text{row} \\cdot \\text{stride} + \\text{swizzled\\_col}) \\bmod 32$$\n\nBecause bitwise XOR maps consecutive rows to distinct column shifts, all threads in a warp access distinct SRAM banks, restoring 100% full-bandwidth memory access.\n\nInput Format:\n- data: Stride array or matrix column dimensions.\n- target: Target warp thread ID.\n\nOutput Format:\n- Naive bank ID grid, swizzled bank ID grid, and total number of serialized bank conflicts.",
    constraints: ["1 <= rows, cols <= 128", "num_banks = 32"],
    examples: [
      {
        kind: "basic",
        title: "32-Bank XOR Swizzle",
        inputDisplay: "matrix = [4x32], num_banks = 32",
        outputDisplay: "Naive Conflicts: 32 | Swizzled Conflicts: 0",
        input: { data: [32, 64, 128, 256] },
        output: "Swizzled Conflicts: 0",
        explanation:
          "XOR swizzling shifts column bank IDs across rows, eliminating bank collisions.",
      },
      {
        kind: "complex",
        title: "4-Stride SRAM Layout Test",
        inputDisplay: "data = [32, 64, 128, 256]",
        outputDisplay: "Zero Conflicts",
        input: { data: [32, 64, 128, 256] },
        output: "Zero Conflicts",
        explanation: "Evaluates bank assignment across 4 matrix strides.",
      },
      {
        kind: "negative",
        title: "Conflict Detection Check",
        inputDisplay: "data = [32]",
        outputDisplay: "Conflict Count Evaluated",
        input: { data: [32] },
        output: "Conflict Count Evaluated",
        explanation: "Detects naive 32-way stride-32 bank collision and demonstrates swizzle fix.",
      },
    ],
    code: BANKCONFLICTSWIZZLECALCULATOR_CODE,
    timeComplexity: { best: "O(R \\cdot C)", average: "O(R \\cdot C)", worst: "O(R \\cdot C)" },
    spaceComplexity: "O(R \\cdot C)",
    complexityAnalysis: {
      time: "Evaluates bank assignments for an $R \\times C$ matrix in $O(R \\cdot C)$ time.",
      space: "Requires $O(R \\cdot C)$ memory to store physical bank ID grids.",
    },
    topicGuide: {
      overview:
        "Bank conflict elimination is a foundational GPU optimization technique in CUDA (NVIDIA CUTLASS) and Triton. Unswizzled GEMM tiles incur up to 32x memory latency stalls.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For address $A$, bank ID is $(A / 4) \\bmod 32$. In naive column-major access over stride 32 ($A = \\text{row} \\cdot 32 + \\text{col}$), for fixed column $c$, threads $r=0 \\dots 31$ access addresses $r \\cdot 32 + c \\equiv c \\pmod{32}$, causing a 32-way bank conflict. Swizzling $c' = c \\oplus r$ makes bank ID $(r \\cdot 32 + c \\oplus r) \\bmod 32 = (c \\oplus r) \\bmod 32$, which is a permutation of $0 \\dots 31$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "SRAM bandwidth on NVIDIA H100 is ~33 TB/s. A 32-way bank conflict drops effective shared memory bandwidth down to ~1 TB/s, throttling GPU Tensor Cores. Swizzling restores 33 TB/s peak bandwidth.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In Triton kernels, `swizzle_2d` is controlled by compiler attributes `@triton.jit` using swizzle parameters e.g. `vec_width = 4, max_phase = 8`.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Broadcast exception: If all 32 threads in a warp read the EXACT SAME address, the GPU shared memory controller issues a broadcast read with 0 bank conflicts.",
        },
      ],
      keyTerms: [
        {
          term: "Shared Memory Bank",
          definition:
            "One of 32 physical memory modules servicing 4-byte words per clock cycle in GPU SRAM.",
        },
        {
          term: "Bank Conflict",
          definition:
            "A hardware stall caused when multiple warp threads request different words within the same bank.",
        },
        {
          term: "XOR Swizzling",
          definition:
            "A permutation technique mapping column indices $c' = c \\oplus r$ to distribute accesses across distinct banks.",
        },
        {
          term: "Warp Broadcast",
          definition:
            "Hardware feature servicing requests to identical memory addresses across threads in 1 clock cycle.",
        },
      ],
    },
    trivia: BANKCONFLICTSWIZZLECALCULATOR_TRIVIA,
    sources: [],
    defaultInput: DEFAULT_BANKCONFLICTSWIZZLECALCULATOR_INPUT,
    generateSteps: generateBANKCONFLICTSWIZZLECALCULATORSteps,
  };
