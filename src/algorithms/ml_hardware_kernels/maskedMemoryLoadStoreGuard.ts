import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface maskedMemoryLoadStoreGuardInput {
  globalPtr?: number[];
  blockStart?: number;
  blockSize?: number;
  validBoundary?: number;
  otherVal?: number;
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const MASKEDMEMORYLOADSTOREGUARD_CODE = `def triton_masked_load_store(global_ptr: list[float], block_start: int, block_size: int, valid_boundary: int, other_val: float = 0.0) -> tuple[list[float], list[bool], list[float]]:
    offsets = [block_start + i for i in range(block_size)]

    mask = [offset < valid_boundary for offset in offsets]

    loaded_vals = []
    for offset, is_valid in zip(offsets, mask):
        if is_valid:
            loaded_vals.append(global_ptr[offset])
        else:
            loaded_vals.append(other_val)

    stored_output = list(global_ptr)
    for offset, val, is_valid in zip(offsets, loaded_vals, mask):
        if is_valid:
            stored_output[offset] = val

    return loaded_vals, mask, stored_output`;

export const DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT: maskedMemoryLoadStoreGuardInput = {
  globalPtr: [10.0, 20.0, 30.0, 40.0, 50.0, 0.0, 0.0, 0.0],
  blockStart: 0,
  blockSize: 8,
  validBoundary: 5,
  otherVal: 0.0,
  data: [10.0, 20.0, 30.0, 40.0, 50.0, 0.0, 0.0, 0.0],
  target: 0,
};

export const generateMASKEDMEMORYLOADSTOREGUARDSteps = (
  input: maskedMemoryLoadStoreGuardInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const globalPtr = input.globalPtr || DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT.globalPtr!;
  const blockStart = input.blockStart ?? 0;
  const blockSize = input.blockSize ?? 8;
  const validBoundary = input.validBoundary ?? 5;
  const otherVal = input.otherVal ?? 0.0;

  const offsets: number[] = Array.from({ length: blockSize }, (_, i) => blockStart + i);
  const mask: boolean[] = offsets.map((off) => off < validBoundary);
  const loadedVals: number[] = new Array(blockSize).fill(otherVal);
  const storedOutput: number[] = [...globalPtr];

  const getSnapshot = (activeLaneIdx: number = -1) => {
    const rows = blockSize + 1;
    const cols = 5;
    const cells: MatrixCellItem[] = [];

    const headers = ["SIMD Lane", "Byte Offset", "Predicate Mask", "Loaded Register", "DRAM Store"];
    for (let c = 0; c < 5; c++) {
      cells.push({ row: 0, col: c, value: headers[c], label: "Header", state: "default" });
    }

    for (let i = 0; i < blockSize; i++) {
      const rowIdx = i + 1;
      const off = offsets[i];
      const isValid = mask[i];
      const loadVal = loadedVals[i];
      const storeVal = storedOutput[off];
      const isCurrent = i === activeLaneIdx;
      const state = isCurrent ? "active" : !isValid ? "compared" : "sorted";

      cells.push(
        { row: rowIdx, col: 0, value: `Lane ${i}`, state },
        { row: rowIdx, col: 1, value: off, state },
        { row: rowIdx, col: 2, value: isValid ? "TRUE" : "FALSE", state },
        { row: rowIdx, col: 3, value: loadVal.toFixed(1), state },
        { row: rowIdx, col: 4, value: storeVal !== undefined ? storeVal.toFixed(1) : "-", state },
      );
    }

    return {
      kind: "matrix" as const,
      rows,
      cols,
      title: `Triton SIMD Masked Load/Store Guard Matrix (Block ${blockStart}..${blockStart + blockSize - 1}, Boundary ${validBoundary})`,
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeLaneIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeLaneIdx),
      auxiliaryState: {
        customState: {
          Algorithm: "Triton SIMD Masked Load/Store Guard",
          "Block Size (Lanes)": String(blockSize),
          "Valid Tensor Boundary": String(validBoundary),
          "Fallback Padding Other": String(otherVal),
          "Hardware Safety": "Guards Out-of-Bounds CUDA Memory Segfaults",
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Triton SIMD Masked Load/Store Guard Engine Entry",
    `Started Triton SIMD masked memory guard for block size ${blockSize} (start=${blockStart}, boundary=${validBoundary}, fallback=${otherVal}).`,
    { blockStart, blockSize, validBoundary, otherVal },
  );

  // Step 2: Compute offsets (2)
  addStep(
    2,
    `Calculate SIMD Lane Offset Vector: offsets = [${offsets.join(", ")}]`,
    `Evaluated linear memory address offsets for ${blockSize} SIMD lanes: [${offsets.join(", ")}].`,
    { offsets: JSON.stringify(offsets) },
  );

  // Step 3: Compute mask (4)
  addStep(
    4,
    `Calculate Predicate Vector Mask: offset < ${validBoundary}`,
    `Evaluated boolean mask vector: [${mask.map((m) => (m ? "TRUE" : "FALSE")).join(", ")}]. ${mask.filter(Boolean).length} valid lanes, ${mask.filter((m) => !m).length} masked out-of-bounds lanes.`,
    { validLanes: mask.filter(Boolean).length, invalidLanes: mask.filter((m) => !m).length },
  );

  // Step 4: Init loaded_vals (6)
  addStep(
    6,
    "Allocate Loaded Values Register List loaded_vals []",
    "Allocated list to log values loaded into SIMD vector registers.",
    { loaded_count: 0 },
  );

  // Loop over loads (7..11)
  for (let i = 0; i < blockSize; i++) {
    const off = offsets[i];
    const isValid = mask[i];

    addStep(
      7,
      `Lane ${i} Load Guard: Check offset ${off} < boundary ${validBoundary}`,
      `Checking SIMD lane ${i} (offset ${off}): Mask is ${isValid ? "TRUE (In-Bounds)" : "FALSE (Out-of-Bounds)"}.`,
      { lane: i, offset: off, isValid },
      i,
    );

    addStep(
      8,
      `Lane ${i} Branch Condition: if is_valid (${isValid})`,
      isValid
        ? `Branch TRUE: Offset ${off} is within valid boundary ${validBoundary}. Reading from global_ptr[${off}].`
        : `Branch FALSE: Offset ${off} >= boundary ${validBoundary}. Returning fallback other_val=${otherVal}.`,
      { lane: i, isValid },
      i,
    );

    if (isValid) {
      loadedVals[i] = globalPtr[off];
      addStep(
        9,
        `Lane ${i} Valid Read: loaded_vals.append(global_ptr[${off}] = ${globalPtr[off].toFixed(1)})`,
        `Loaded valid value ${globalPtr[off].toFixed(1)} from HBM DRAM into SIMD register.`,
        { lane: i, val: globalPtr[off] },
        i,
      );
    } else {
      loadedVals[i] = otherVal;
      addStep(
        11,
        `Lane ${i} Masked Fallback: loaded_vals.append(other_val = ${otherVal.toFixed(1)})`,
        `Safely loaded fallback value ${otherVal.toFixed(1)} into SIMD register without triggering HBM DRAM segfault!`,
        { lane: i, fallback: otherVal },
        i,
      );
    }
  }

  // Step 5: Init stored_output (13)
  addStep(
    13,
    "Copy Output Memory State stored_output = list(global_ptr)",
    "Copied global memory state prior to masked store execution.",
    { stored_output_len: storedOutput.length },
  );

  // Loop over stores (14..16)
  for (let i = 0; i < blockSize; i++) {
    const off = offsets[i];
    const val = loadedVals[i];
    const isValid = mask[i];

    addStep(
      14,
      `Lane ${i} Store Guard: Check offset ${off} < boundary ${validBoundary}`,
      `Checking SIMD lane ${i} store guard: Mask is ${isValid ? "TRUE (Execute Store)" : "FALSE (Skip Store)"}.`,
      { lane: i, offset: off, isValid },
      i,
    );

    addStep(
      15,
      `Lane ${i} Branch Condition: if is_valid (${isValid})`,
      isValid
        ? `Branch TRUE: Executing masked store into stored_output[${off}] = ${val.toFixed(1)}.`
        : `Branch FALSE: Masked out! Skipping write to memory offset ${off} to preserve memory integrity.`,
      { lane: i, isValid },
      i,
    );

    if (isValid) {
      storedOutput[off] = val;
      addStep(
        16,
        `Lane ${i} Masked Store Write: stored_output[${off}] = ${val.toFixed(1)}`,
        `Wrote SIMD register value ${val.toFixed(1)} into HBM DRAM memory offset ${off}.`,
        { lane: i, offset: off, val },
        i,
      );
    }
  }

  // Return step (18)
  addStep(
    18,
    "Execution Complete: Return (loaded_vals, mask, stored_output)",
    `Completed Triton SIMD masked memory load/store guard. Successfully processed ${mask.filter(Boolean).length} valid entries and protected ${mask.filter((m) => !m).length} out-of-bounds accesses.`,
    {
      validLanes: mask.filter(Boolean).length,
      invalidLanes: mask.filter((m) => !m).length,
      completed: true,
    },
  );

  return steps;
};

const MASKEDMEMORYLOADSTOREGUARD_TRIVIA: TriviaMeta = {
  skipLines: [3, 5, 12, 17],
  distractors: [
    "mask = [offset > valid_boundary for offset in offsets]",
    "loaded_vals.append(global_ptr[other_val])",
    "stored_output[offset] = other_val if not is_valid else val",
    "return offsets, mask, loaded_vals",
  ],
  hints: [
    { line: 4, hint: "Triton boolean predicate mask equation: offset < valid_boundary." },
    { line: 11, hint: "Fallback value for masked out-of-bounds load: other_val." },
  ],
  lineExplanations: {
    1: "Defines entry point for triton_masked_load_store function simulating Triton tl.load and tl.store.",
    2: "Calculates SIMD lane offset vector offsets = [block_start + i for i in range(block_size)].",
    3: "Blank line before mask calculation.",
    4: "Evaluates boolean predicate vector mask = [offset < valid_boundary for offset in offsets].",
    5: "Blank line before load loop.",
    6: "Initializes empty list loaded_vals to log SIMD register values.",
    7: "Iterates over SIMD lane offset and boolean mask is_valid in zip(offsets, mask).",
    8: "Checks if lane mask is_valid is TRUE.",
    9: "Reads valid HBM DRAM memory value global_ptr[offset] into SIMD register.",
    10: "Branch condition for out-of-bounds lane.",
    11: "Returns fallback padding other_val for masked out-of-bounds lane.",
    12: "Blank line before store loop.",
    13: "Copies global_ptr to simulate output memory array stored_output.",
    14: "Iterates over offset, value val, and mask is_valid for SIMD store.",
    15: "Checks if lane mask is_valid is TRUE.",
    16: "Writes register value val to memory stored_output[offset] for valid lane.",
    17: "Blank line separating store loop from return statement.",
    18: "Returns tuple of (loaded_vals, mask, stored_output).",
  },
};

export const maskedMemoryLoadStoreGuard: AlgorithmDefinition<maskedMemoryLoadStoreGuardInput> = {
  id: "masked-memory-load-store-guard",
  title: "Triton SIMD Masked Load/Store Guard Engine",
  topicIds: ["ml_hardware_kernels", "ml_gemm_roofline"],
  difficulty: "Medium",
  description:
    "The Triton SIMD Masked Load/Store Guard Engine simulates the boundary safety mechanism utilized in OpenAI Triton GPU kernels (`tl.load(ptr, mask=mask, other=0.0)` and `tl.store(ptr, val, mask=mask)`). In GPU parallel computing, matrix dimensions ($M, N, K$) are rarely exact multiples of SIMD block sizes (`BLOCK_M = 128`, `BLOCK_N = 64`). Without predicate masking, trailing SIMD lanes attempt to read or write past valid array boundaries, causing severe **CUDA Illegal Address Memory Segfaults** or data corruption.\n\n### Why It Exists\nStandard CUDA C++ kernels require complex boundary `if (index < N)` scalar checks that cause warp thread divergence. Triton compiles vectorized **SIMD Predicate Masks** down to PTX predicate instructions (`@p1 ld.global.nc.f32` and `@p1 st.global.f32`), enabling hardware-level masked vector loads and stores without warp branching stalls.\n\n### Mathematical Formulation\nFor SIMD block offset $i \\in \\{0, 1, \\dots, \\text{BLOCK}-1\\}$, global pointer base $P_{start}$, valid tensor boundary $N_{valid}$, and padding value $V_{other}$:\n\n$$1. \\quad \\text{offset}_i = P_{start} + i \\quad (\\text{SIMD Lane Byte Offset})$$\n\n$$2. \\quad m_i = (\\text{offset}_i < N_{valid}) \\in \\{\\text{TRUE}, \\text{FALSE}\\} \\quad (\\text{Boolean Predicate Mask})$$\n\n$$3. \\quad R_{loaded, i} = \\begin{cases} \\text{Memory}[P_{start} + i] & \\text{if } m_i = \\text{TRUE} \\\\ V_{other} & \\text{if } m_i = \\text{FALSE} \\end{cases} \\quad (\\text{Triton } \\text{tl.load})$$\n\n$$4. \\quad \\text{Memory}[P_{start} + i] \\xleftarrow{\\text{write}} R_{val, i} \\quad \\text{if } m_i = \\text{TRUE} \\quad (\\text{Triton } \\text{tl.store})$$\n\n### Step-by-Step Intuition\n1. **Offset Vector Generation**: Compute 1D or 2D SIMD lane offsets $\\text{offset}_i = P_{start} + i$.\n2. **Predicate Mask Evaluation**: Evaluate element-wise comparison $\\text{mask}_i = (\\text{offset}_i < N_{valid})$.\n3. **Masked Vector Load**: For valid lanes ($m_i = \\text{TRUE}$), read values from HBM DRAM; for invalid out-of-bounds lanes ($m_i = \\text{FALSE}$), return fallback `other_val` (e.g. `0.0` for GEMM, `-inf` for Softmax).\n4. **Masked Vector Store**: Write register outputs to HBM DRAM memory *only* for valid lanes ($m_i = \\text{TRUE}$), suppressing writes to out-of-bounds locations.\n\n### Key Trade-Offs & Hardware Execution\n- **Zero Warp Divergence**: PTX predicate registers (`p0...p7`) control vector memory pipelines directly, eliminating `if/else` control flow branch divergence.\n- **Padding Value Selection**: Selecting `other=0.0` for matrix multiplication ensures out-of-bounds elements add zero to dot-product sums without distorting GEMM output.",
  constraints: [
    "1 <= blockSize <= 1024",
    "0 <= validBoundary <= 1000000",
    "globalPtr.length >= validBoundary",
  ],
  examples: [
    {
      kind: "basic",
      title: "8-Lane SIMD Block with 5 Valid Tensor Entries",
      inputDisplay: "8 SIMD Lanes (start=0), 5 Valid Entries, other=0.0",
      outputDisplay: "Loaded: [10, 20, 30, 40, 50, 0, 0, 0], Mask: [T, T, T, T, T, F, F, F]",
      input: DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT,
      output:
        "([10, 20, 30, 40, 50, 0, 0, 0], [True, True, True, True, True, False, False, False], stored_output)",
      explanation:
        "Loads 5 valid values into SIMD registers, padding 3 out-of-bounds lanes with fallback 0.0 while guarding DRAM memory writes.",
    },
  ],
  code: MASKEDMEMORYLOADSTOREGUARD_CODE,
  timeComplexity: { best: "O(B)", average: "O(B)", worst: "O(B)" },
  spaceComplexity: "O(B)",
  complexityAnalysis: {
    time: "Linear in SIMD block size $O(B)$, evaluating loads and stores across $B$ vector lanes.",
    space: "Requires $O(B)$ memory space to store predicate mask and vector register values.",
  },
  topicGuide: {
    overview:
      "The Triton SIMD Masked Load/Store Guard Engine simulates vector predicate masking (tl.load and tl.store) for boundary safety in GPU kernels.",
    sections: [
      {
        heading: "Core Concept & Predicate Masking",
        body: "Triton tl.load and tl.store use boolean predicate vector masks (mask = offset < valid_boundary) to guard vector memory accesses near array boundaries.",
      },
      {
        heading: "Eliminating CUDA Illegal Address Segfaults",
        body: "Matrix dimensions (M, N, K) are rarely exact multiples of block sizes (BLOCK_M = 128). Masking prevents out-of-bounds SIMD lanes from triggering CUDA illegal memory access segfaults.",
      },
      {
        heading: "Zero-Cost PTX Predicate Instructions",
        body: "Triton compiles masked operations to PTX predicate instructions (@p1 ld.global), avoiding scalar if/else control flow branch divergence in CUDA warps.",
      },
      {
        heading: "Fallback Value Selection (other_val)",
        body: "Using other=0.0 for GEMM or other=-inf for Softmax ensures out-of-bounds SIMD lanes compute mathematically correct result padding.",
      },
    ],
    keyTerms: [
      {
        term: "Predicate Mask",
        definition:
          "Vector of boolean flags controlling which SIMD vector lanes execute memory loads/stores.",
      },
      {
        term: "Triton tl.load",
        definition:
          "Vectorized GPU memory load instruction with built-in mask and fallback value parameters.",
      },
      {
        term: "Triton tl.store",
        definition:
          "Vectorized GPU memory store instruction executing writes only on true predicate lanes.",
      },
      {
        term: "Illegal Address Segfault",
        definition:
          "Fatal CUDA runtime crash triggered when a thread reads/writes out-of-bounds GPU DRAM memory.",
      },
    ],
  },
  trivia: MASKEDMEMORYLOADSTOREGUARD_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT,
  generateSteps: generateMASKEDMEMORYLOADSTOREGUARDSteps,
};
