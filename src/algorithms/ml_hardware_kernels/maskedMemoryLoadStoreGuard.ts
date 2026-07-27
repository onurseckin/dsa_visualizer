import type { AlgorithmDefinition, AlgorithmStep, MatrixCellItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface maskedMemoryLoadStoreGuardInput {
  globalPtr?: number[];
  blockStart?: number;
  blockSize?: number;
  validBoundary?: number;
  otherVal?: number;
  data?: number[];
  [key: string]: unknown;
}

export const MASKEDMEMORYLOADSTOREGUARD_CODE = `def triton_masked_load_store(global_ptr: list[float], block_start: int, block_size: int, valid_boundary: int, other_val: float = 0.0) -> tuple[list[float], list[bool], list[float]]:
    """Simulates Triton tl.load(ptr, mask=mask, other=other_val) and tl.store(ptr, val, mask=mask)."""
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

  const offsets: number[] = [];
  const mask: boolean[] = [];
  const loadedVals: number[] = [];
  const storedOutput: number[] = [...globalPtr];

  const createMatrixSnapshot = (
    activeLaneIdx?: number,
  ): MatrixCellItem[] => {
    const grid: MatrixCellItem[][] = [];
    for (let i = 0; i < blockSize; i++) {
      const off = offsets[i] !== undefined ? offsets[i] : blockStart + i;
      const isValid = mask[i] !== undefined ? mask[i] : off < validBoundary;
      const loadVal = loadedVals[i] !== undefined ? loadedVals[i] : 0;
      const storeVal = storedOutput[off] !== undefined ? storedOutput[off] : 0;

      let state: MatrixCellItem["state"] = "default";
      if (activeLaneIdx === i) {
        state = "active";
      } else if (!isValid) {
        state = "compared"; // Highlight masked/out-of-bounds lanes
      } else if (loadedVals[i] !== undefined) {
        state = "sorted";
      }

      grid.push([
        {
          row: i,
          col: 0,
          value: i,
          label: `Lane ${i}`,
          state,
        },
        {
          row: i,
          col: 1,
          value: off,
          label: `Off=${off}`,
          state,
        },
        {
          row: i,
          col: 2,
          value: isValid ? 1 : 0,
          label: isValid ? "MASK=TRUE" : "MASK=FALSE",
          state,
        },
        {
          row: i,
          col: 3,
          value: Number(loadVal.toFixed(1)),
          label: `Load=${loadVal.toFixed(1)}`,
          state,
        },
        {
          row: i,
          col: 4,
          value: Number(storeVal.toFixed(1)),
          label: `Store=${storeVal.toFixed(1)}`,
          state,
        },
      ]);
    }
    return grid.flat();
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeLaneIdx?: number,
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "matrix",
        rows: blockSize,
        cols: 5,
        cells: createMatrixSnapshot(activeLaneIdx),
      },
      auxiliaryState: {
        customState: customState ?? {
          block_start: String(blockStart),
          block_size: String(blockSize),
          valid_boundary: String(validBoundary),
          other_val: String(otherVal),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Triton Masked Memory Load & Store Guard",
    `Configuring SIMD predicate masking: block_start=${blockStart}, block_size=${blockSize}, valid_boundary=${validBoundary}, other_val=${otherVal}.`,
    { block_start: blockStart, block_size: blockSize, valid_boundary: validBoundary },
  );

  addStep(
    2,
    "Inspect SIMD thread block memory layout",
    `Preparing SIMD thread lanes for tail tile execution beyond valid boundary ${validBoundary}.`,
    { block_size: blockSize, valid_boundary: validBoundary },
  );

  for (let i = 0; i < blockSize; i++) {
    offsets.push(blockStart + i);
  }

  addStep(
    3,
    `Compute SIMD offset vector offsets = [${offsets.join(", ")}]`,
    `Generated ${blockSize} memory byte offsets for SIMD threads.`,
    { offsets: JSON.stringify(offsets) },
  );

  for (let i = 0; i < blockSize; i++) {
    mask.push(offsets[i] < validBoundary);
  }

  addStep(
    5,
    `Compute SIMD predicate boolean array mask = [${mask.map((m) => (m ? "True" : "False")).join(", ")}]`,
    `Evaluated boolean mask vector: offsets < ${validBoundary}. Out-of-bounds lanes will be masked out.`,
    { mask: JSON.stringify(mask) },
  );

  addStep(
    7,
    "Initialize loaded_vals register container",
    "Allocating fast SRAM register slots for block load.",
    { loaded_vals_capacity: blockSize },
  );

  for (let i = 0; i < blockSize; i++) {
    const off = offsets[i];
    const isValid = mask[i];

    addStep(
      8,
      `SIMD Load Lane ${i}: offset = ${off}, is_valid = ${isValid ? "True" : "False"}`,
      `Evaluating hardware memory load predicate for thread lane ${i}.`,
      { lane: i, offset: off, is_valid: isValid },
      i,
    );

    addStep(
      9,
      `Check predicate is_valid == ${isValid ? "True" : "False"}`,
      `Branching on SIMD predicate boolean.`,
      { lane: i, is_valid: isValid },
      i,
    );

    if (isValid) {
      const val = globalPtr[off];
      loadedVals.push(val);

      addStep(
        10,
        `Lane ${i} (Valid): Read global_ptr[${off}] = ${val.toFixed(1)} from HBM DRAM into register`,
        `Issued hardware DRAM read for valid offset ${off}.`,
        { lane: i, offset: off, read_val: val },
        i,
      );
    } else {
      loadedVals.push(otherVal);

      addStep(
        12,
        `Lane ${i} (Masked): Suppress DRAM read! Inject fallback other_val = ${otherVal.toFixed(1)}`,
        `Out-of-bounds offset ${off} >= boundary ${validBoundary}: injected fallback value without issuing illegal DRAM read.`,
        { lane: i, offset: off, injected_val: otherVal },
        i,
      );
    }
  }

  addStep(
    14,
    "Initialize stored_output buffer with global_ptr copy",
    "Preparing memory buffer for SIMD masked store pass.",
    { global_ptr_len: globalPtr.length },
  );

  for (let i = 0; i < blockSize; i++) {
    const off = offsets[i];
    const val = loadedVals[i];
    const isValid = mask[i];

    addStep(
      15,
      `SIMD Store Lane ${i}: offset = ${off}, val = ${val.toFixed(1)}, is_valid = ${isValid ? "True" : "False"}`,
      `Evaluating hardware memory store predicate for thread lane ${i}.`,
      { lane: i, offset: off, val, is_valid: isValid },
      i,
    );

    addStep(
      16,
      `Check predicate is_valid == ${isValid ? "True" : "False"}`,
      `Branching on SIMD predicate boolean for write operation.`,
      { lane: i, is_valid: isValid },
      i,
    );

    if (isValid) {
      storedOutput[off] = val;

      addStep(
        17,
        `Lane ${i} (Valid): Write stored_output[${off}] = ${val.toFixed(1)} to HBM DRAM`,
        `Executed hardware DRAM write for valid offset ${off}.`,
        { lane: i, offset: off, written_val: val },
        i,
      );
    } else {
      addStep(
        17,
        `Lane ${i} (Masked): Suppress DRAM write! (No-Op)`,
        `Out-of-bounds offset ${off} >= boundary ${validBoundary}: store suppressed without modifying global memory.`,
        { lane: i, offset: off, store_suppressed: true },
        i,
      );
    }
  }

  addStep(
    19,
    "Return (loaded_vals, mask, stored_output)",
    `Triton masked load/store execution complete. Processed ${blockSize} SIMD lanes with 0 illegal memory accesses.`,
    { completed: true, total_lanes: blockSize, valid_lanes: mask.filter(Boolean).length },
  );

  return steps;
};

export const MASKEDMEMORYLOADSTOREGUARD_TRIVIA: TriviaMeta = {
  skipLines: [4, 6, 13, 18],
  distractors: [
    "mask = [offset > valid_boundary for offset in offsets]",
    "loaded_vals.append(global_ptr[offset] if not is_valid else other_val)",
    "stored_output[offset] = other_val",
    "mask = [offset == valid_boundary for offset in offsets]",
  ],
  hints: [
    { line: 5, hint: "Compute SIMD predicate boolean array mask = [offset < valid_boundary for offset in offsets]." },
    { line: 12, hint: "Return other_val for out-of-bounds offsets to prevent illegal memory reads." },
    { line: 17, hint: "Suppress store operations when is_valid is False." },
  ],
  lineExplanations: {
    1: "Defines triton_masked_load_store signature with global memory pointer, tile block params, boundary, and fallback padding value.",
    2: "Docstring explaining Triton tl.load and tl.store SIMD predicate memory protection.",
    3: "Computes SIMD lane offset vector offsets = block_start + thread_ids.",
    4: "Blank line preceding predicate mask generation.",
    5: "Generates SIMD boolean predicate array mask = offsets < valid_boundary.",
    6: "Blank line preceding masked load loop.",
    7: "Initializes loaded_vals container for SRAM register loads.",
    8: "Loops through offsets and predicate mask booleans in parallel SIMD lanes.",
    9: "Checks if lane predicate is_valid is True.",
    10: "Valid lane (is_valid=True): issues hardware HBM DRAM read global_ptr[offset].",
    11: "Out-of-bounds lane (is_valid=False): enters fallback branch.",
    12: "Masked lane (is_valid=False): returns fallback other_val (0.0 or -inf) without DRAM access.",
    13: "Blank line preceding masked store loop.",
    14: "Copies global_ptr to initialize stored_output buffer.",
    15: "Loops through offsets, register values, and predicate mask booleans.",
    16: "Checks if lane predicate is_valid is True.",
    17: "Valid lane (is_valid=True): executes DRAM write stored_output[offset] = val; masked lanes are suppressed (no-op).",
    18: "Blank line preceding return statement.",
    19: "Returns tuple of (loaded_vals, mask, stored_output) with zero illegal memory accesses.",
  },
};

export const maskedMemoryLoadStoreGuard: AlgorithmDefinition<maskedMemoryLoadStoreGuardInput> = {
  id: "masked-memory-load-store-guard",
  title: "Triton Masked Memory Load & Store Guard",
  category: "ml_hardware_kernels",
  categories: ["ml_hardware_kernels", "ml_tensor_algebra"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_hardware_kernels",
  description: `Master Triton SIMD Predicate Memory Protection: safeguard tail tile memory loads (\`tl.load\`) and stores (\`tl.store\`) against CUDA segmentation faults when tensor dimensions are unaligned.

### Why It Exists & What It Solves
In GPU parallel kernel programming (OpenAI Triton, CUDA C++), memory tiles are processed in fixed SIMD block sizes (e.g. \`BLOCK_M = 128\`). However, real-world tensor dimensions $N$ (e.g. sequence length $N = 350$) are rarely exact multiples of block sizes.

When a thread block processes the tail tile of a matrix, thread offsets $i \\in [384 \\dots 512)$ extend beyond the valid matrix boundary $N = 350$. Issuing un-guarded memory reads or writes to these addresses causes **illegal memory accesses** (CUDA Segmentation Fault) or silent data corruption in adjacent HBM memory pages.

**Masked Memory Load/Store Guard** evaluates a SIMD boolean predicate array:
$$\\text{mask} = \\text{offsets} < N$$

- **Masked Load (\`tl.load(ptr + offsets, mask=mask, other=0.0)\`)**:
  Out-of-bounds positions return \`0.0\` (or \`-\\infty\` for Softmax attention logits) directly into registers without issuing HBM DRAM read transactions.
- **Masked Store (\`tl.store(ptr + offsets, values, mask=mask)\`)**:
  Out-of-bounds positions suppress DRAM writes (no-op), protecting global memory.

### Step-by-Step Intuition
1. **Compute Thread Offsets**: $\\text{offsets} = \\text{block\\_start} + [0, 1, \\dots, B-1]$.
2. **Evaluate Predicate Mask**: $\\text{mask}_i = (\\text{offsets}_i < \\text{valid\\_boundary})$.
3. **Execute Masked Load**:
   - For valid lanes ($\\text{mask}_i = \\text{True}$): read $\\text{global\\_ptr}[\\text{offsets}_i]$.
   - For masked lanes ($\\text{mask}_i = \\text{False}$): return $\\text{other\\_val}$.
4. **Execute Masked Store**:
   - For valid lanes ($\\text{mask}_i = \\text{True}$): write $\\text{stored\\_output}[\\text{offsets}_i] = \\text{val}_i$.
   - For masked lanes ($\\text{mask}_i = \\text{False}$): suppress DRAM write.

### Input Parameters
- \`globalPtr\`: Global memory array.
- \`blockStart\`: Starting memory offset for thread tile.
- \`blockSize\`: Number of SIMD thread lanes ($B$).
- \`validBoundary\`: Valid boundary limit $N$.
- \`otherVal\`: Fallback padding value (default \`0.0\`).

### Output
- Returns loaded vector values with padding, boolean predicate mask vector, and safely stored output array.

### Trade-offs & Complexity
- **Time Complexity**: $O(B)$ parallel SIMD instructions for tile size $B$.
- **Space Complexity**: $O(B)$ auxiliary space for predicate mask registers.`,
  constraints: ["1 <= block_size <= 1024", "valid_boundary >= 0"],
  examples: [
    {
      kind: "basic",
      title: "Triton Masked Load (N=5, Block=8)",
      inputDisplay: "offsets = [0..7], N = 5, other = 0.0",
      outputDisplay: "Mask: [T,T,T,T,T,F,F,F], Padding: 0.0",
      input: {
        globalPtr: [10.0, 20.0, 30.0, 40.0, 50.0, 0.0, 0.0, 0.0],
        blockStart: 0,
        blockSize: 8,
        validBoundary: 5,
        otherVal: 0.0,
      },
      output: "Out-of-bounds padded with 0.0",
      explanation: "Offsets >= 5 set mask=False and return other_val=0.0 without DRAM access.",
    },
    {
      kind: "complex",
      title: "Tail Tile Guard Test",
      inputDisplay: "blockStart = 0, blockSize = 8, validBoundary = 5",
      outputDisplay: "Zero Illegal Memory Access",
      input: {
        globalPtr: [10.0, 20.0, 30.0, 40.0, 50.0, 0.0, 0.0, 0.0],
        blockStart: 0,
        blockSize: 8,
        validBoundary: 5,
        otherVal: 0.0,
      },
      output: "Zero Illegal Memory Access",
      explanation: "Evaluates predicate masks across 5 valid elements and 3 tail padding slots.",
    },
    {
      kind: "negative",
      title: "Full Alignment Check",
      inputDisplay: "blockSize = 4, validBoundary = 4",
      outputDisplay: "All Mask True",
      input: {
        globalPtr: [10.0, 20.0, 30.0, 40.0],
        blockStart: 0,
        blockSize: 4,
        validBoundary: 4,
        otherVal: 0.0,
      },
      output: "All Mask True",
      explanation: "When sequence length equals block size, all predicate mask entries evaluate to True.",
    },
  ],
  code: MASKEDMEMORYLOADSTOREGUARD_CODE,
  timeComplexity: { best: "O(B)", average: "O(B)", worst: "O(B)" },
  spaceComplexity: "O(B)",
  complexityAnalysis: {
    time: "Evaluates SIMD predicate masks over block size B in O(B) parallel thread instructions.",
    space: "Requires O(B) memory to store boolean mask predicates.",
  },
  topicGuide: {
    overview:
      "Masked loads and stores are a core building block of Triton kernels (`tl.load` and `tl.store`). They allow kernels to process arbitrary matrix dimensions without needing specialized fallback loops.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let $P$ be a pointer vector $P_i = \\text{ptr} + \\text{offsets}_i$. The predicate $M_i = (\\text{offsets}_i < N)$. The load operator is $V_i = M_i ? *P_i : v_{\\text{other}}$. The store operator is $M_i ? (*P_i = V_i) : \\text{nop}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "PTX Translation: In CUDA PTX assembly, `tl.load` with a mask compiles to predicated vector load instructions `@p1 ld.global.v4.f32`. Threads where predicate `@p1` is false skip memory transactions entirely.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Padding values in Attention: In FlashAttention / Triton softmax kernels, out-of-bounds logit loads MUST set `other=-float('inf')` so that Softmax exponentiation $e^{-\\infty} = 0.0$ naturally zeroes out padded key tokens.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "2D Masking: For 2D tile loads (`BLOCK_M, BLOCK_N`), masks are constructed via broadcasting: `mask = (offs_m[:, None] < M) & (offs_n[None, :] < N)`. Out-of-bounds elements in either dimension are masked out.",
      },
    ],
    keyTerms: [
      {
        term: "SIMD Predicate Mask",
        definition:
          "A boolean vector controlling which SIMD thread lanes execute memory load/store operations.",
      },
      {
        term: "tl.load / tl.store",
        definition: "OpenAI Triton intrinsic functions for masked block memory transfers.",
      },
      {
        term: "Tail Tile",
        definition:
          "The final block tile of a tensor when dimensions are not evenly divisible by block size.",
      },
      {
        term: "Illegal Memory Access",
        definition:
          "GPU hardware fault triggered when a thread reads/writes un-allocated memory addresses.",
      },
    ],
  },
  trivia: MASKEDMEMORYLOADSTOREGUARD_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_MASKEDMEMORYLOADSTOREGUARD_INPUT,
  generateSteps: generateMASKEDMEMORYLOADSTOREGUARDSteps,
};
