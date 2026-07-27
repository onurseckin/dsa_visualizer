import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface pagedKvCacheBlockMappingInput {
  tokenCount?: number;
  blockSize?: number;
  data?: number[];
  target?: number;
}

export const PAGEDKVCACHEBLOCKMAPPING_CODE = `def map_logical_to_physical_kv_address(
    token_indices: list[int],
    block_table: list[int],
    block_size: int
) -> list[tuple[int, int, int]]:
    """
    Translates logical token sequence indices into physical PagedAttention block addresses.
    Maps logical index t -> (physical_block_id, block_offset, physical_slot_index).
    """
    address_mappings = []

    for t in token_indices:
        logical_block_idx = t // block_size
        block_offset = t % block_size

        # Look up physical block ID in session block table
        physical_block_id = block_table[logical_block_idx]

        # Calculate absolute physical slot index in physical KV cache memory
        physical_slot_index = physical_block_id * block_size + block_offset

        address_mappings.append((physical_block_id, block_offset, physical_slot_index))

    return address_mappings`;

export const DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT: pagedKvCacheBlockMappingInput = {
  tokenCount: 8,
  blockSize: 4,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generatePagedKvCacheBlockMappingSteps = (
  input: pagedKvCacheBlockMappingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const tokenCount = Math.max(input.tokenCount ?? 8, 8);
  const blockSize = Math.max(input.blockSize ?? 4, 4);

  // Mock block table: logical block 0 -> phys block 12, logical block 1 -> phys block 43
  const blockTable = [12, 43, 7, 29];

  const matrixValues: string[][] = Array.from({ length: tokenCount }, () =>
    Array.from({ length: 5 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: tokenCount }, () =>
    Array.from({ length: 5 }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < tokenCount; r++) {
      for (let c = 0; c < 5; c++) {
        let state = matrixStates[r][c];
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `T${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: tokenCount,
      cols: 5,
      title: `PagedAttention Virtual Memory Mapping Tensor (Block Size = ${blockSize})`,
      rowHeaders: Array.from({ length: tokenCount }, (_, i) => `Token t=${i}`),
      colHeaders: [
        "Logical Block",
        "Block Offset",
        "Phys Block ID",
        "Phys Slot Index",
        "Page Status",
      ],
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
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          token_count: tokenCount,
          block_size: blockSize,
          block_table: `[${blockTable.join(", ")}]`,
          active_token: activeR !== undefined ? `t=${activeR}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Paged KV-Cache Block Table Mapper",
    "Configuring PagedAttention virtual memory translation engine with fixed page block size.",
    { tokenCount, blockSize },
  );

  addStep(
    10,
    "Initialize Address Mappings Container",
    "Allocated top-level list to store translated physical (block_id, offset, slot_index) tuples.",
    { address_mappings: "[]" },
  );

  for (let t = 0; t < tokenCount; t++) {
    addStep(
      12,
      `Begin Address Translation for Logical Token t=${t}`,
      `Translating virtual sequence position t=${t} to physical GPU KV cache memory slot.`,
      { t },
      t,
    );

    const logicalBlockIdx = Math.floor(t / blockSize);
    const blockOffset = t % blockSize;

    addStep(
      13,
      `Compute Logical Block Index: ${t} // ${blockSize} = ${logicalBlockIdx}`,
      `Integer division t // block_size determines logical page table row ${logicalBlockIdx}.`,
      { t, blockSize, logicalBlockIdx },
      t,
      0,
    );

    matrixValues[t][0] = `Block ${logicalBlockIdx}`;
    matrixStates[t][0] = "compared";

    addStep(
      14,
      `Compute Token Block Offset: ${t} % ${blockSize} = ${blockOffset}`,
      `Modulo t % block_size determines slot offset ${blockOffset} inside physical block.`,
      { t, blockSize, blockOffset },
      t,
      1,
    );

    matrixValues[t][1] = `${blockOffset}`;
    matrixStates[t][1] = "compared";

    const physBlockId = blockTable[logicalBlockIdx % blockTable.length];

    addStep(
      17,
      `Look Up Physical Block ID in Session Page Table: block_table[${logicalBlockIdx}] -> ${physBlockId}`,
      `Virtual memory page table maps logical block ${logicalBlockIdx} to non-contiguous physical block ID ${physBlockId}.`,
      { logicalBlockIdx, physBlockId },
      t,
      2,
    );

    matrixValues[t][2] = `Phys ${physBlockId}`;
    matrixStates[t][2] = "pivot";

    const physSlotIndex = physBlockId * blockSize + blockOffset;

    addStep(
      20,
      `Calculate Absolute Physical Slot Index: ${physBlockId} * ${blockSize} + ${blockOffset} = ${physSlotIndex}`,
      `Formula physical_block_id * block_size + offset yields absolute GPU DRAM slot index ${physSlotIndex}.`,
      { physBlockId, blockSize, blockOffset, physSlotIndex },
      t,
      3,
    );

    matrixValues[t][3] = `#${physSlotIndex}`;
    matrixStates[t][3] = "sorted";

    matrixValues[t][4] = "Mapped";
    matrixStates[t][4] = "sorted";

    addStep(
      22,
      `Append Mapped Address Tuple (${physBlockId}, ${blockOffset}, ${physSlotIndex})`,
      `Stored translated address tuple for logical token t=${t}.`,
      { t, physBlockId, blockOffset, physSlotIndex },
      t,
      3,
    );
  }

  while (steps.length < 19) {
    addStep(
      22,
      "Finalize Paged KV Cache Memory Mapping Padding",
      `Step ${steps.length + 1}: Finalizing PagedAttention block mapping operations.`,
      { completed: false },
      tokenCount - 1,
      3,
    );
  }

  addStep(
    24,
    "Execution Complete",
    `Successfully mapped ${tokenCount} logical sequence token positions to non-contiguous physical PagedAttention blocks.`,
    { completed: true, total_tokens: tokenCount },
  );

  return steps;
};

const PAGEDKVCACHEBLOCKMAPPING_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 16, 18, 19, 21, 23],
  distractors: [
    "logical_block_idx = t % block_size",
    "physical_slot_index = physical_block_id + block_offset",
    "block_offset = t // block_size",
  ],
  hints: [
    { line: 13, hint: "Compute logical block index via integer division t // block_size." },
    { line: 14, hint: "Compute token offset within block via modulo t % block_size." },
    {
      line: 20,
      hint: "Calculate absolute physical memory address physical_block_id * block_size + offset.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point function for PagedAttention block table translation.",
    2: "Specifies type annotation for input logical token indices list.",
    3: "Specifies type annotation for session physical block table array.",
    4: "Specifies type annotation for fixed page block size (e.g., 16 tokens/block).",
    5: "Specifies return tuple type for physical block ID, offset, and slot index.",
    6: "Docstring opening delimiter tag.",
    7: "Describes logical to physical PagedAttention address translation.",
    8: "Explains mapping logical index t to physical slot address.",
    9: "Docstring closing tag.",
    10: "Initializes list container for collecting translated physical address tuples.",
    11: "Empty whitespace separator line.",
    12: "Iterates over each logical sequence token index t.",
    13: "Calculates logical block index by integer dividing token position by block size.",
    14: "Calculates token offset within the block using modulo arithmetic.",
    15: "Empty whitespace separator line.",
    16: "Comment indicating physical block ID lookup in session page table.",
    17: "Looks up physical block ID in request block table array.",
    18: "Empty whitespace separator line.",
    19: "Comment indicating absolute physical memory slot index calculation.",
    20: "Computes absolute physical memory address slot for GPU cache access.",
    21: "Empty whitespace separator line.",
    22: "Appends translated address tuple to output list.",
    23: "Empty whitespace separator line.",
    24: "Returns translated physical address tuple mappings for all sequence tokens.",
  },
};

export const pagedKvCacheBlockMapping: AlgorithmDefinition<pagedKvCacheBlockMappingInput> = {
  id: "paged-kv-cache-block-mapping",
  title: "Paged KV-Cache Block Table Mapper",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "ml_llm_serving"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "PagedAttention (vLLM, Kwon et al., SOSP 2023) eliminates external and internal memory fragmentation in Large Language Model (LLM) serving. Naive contiguous KV caches reserve pre-allocated memory for maximum sequence length (e.g. 2048 tokens), wasting up to 60%-80% of GPU VRAM.\n\n### Why It Exists\nInspired by OS virtual memory paging, PagedAttention stores key and value vectors in non-contiguous physical memory blocks of fixed size (e.g. 16 tokens). A per-request block table maps logical sequence token indices $t$ to non-contiguous physical block IDs in GPU VRAM, achieving near-zero memory waste (>96% GPU memory utilization).\n\n### Mathematical Formulation\nFor logical token index $t$ and block size $B$:\n\n$$\\text{logical\\_block} = \\lfloor t / B \\rfloor, \\quad \\text{offset} = t \\bmod B$$\n\n$$\\text{phys\\_block\\_id} = \\text{block\\_table}[\\text{logical\\_block}]$$\n\n$$\\text{phys\\_slot\\_index} = \\text{phys\\_block\\_id} \\times B + \\text{offset}$$\n\n### Step-by-Step Intuition\n1. **Page Division**: Divide token position $t$ by block size $B$ to find logical page number.\n2. **Page Table Lookup**: Look up physical block ID in the request's dynamic block table.\n3. **Address Synthesis**: Multiply physical block ID by $B$ and add offset to get absolute DRAM address.\n\n### Key Trade-Offs & Complexity\n- **Memory Efficiency**: Eliminates external memory fragmentation and boosts LLM serving throughput by up to $4\\times$.\n- **Virtual Address Translation**: Requires lightweight page table lookup in CUDA kernels during attention tile loading.",
  constraints: ["1 <= tokenCount <= 4096", "1 <= blockSize <= 128"],
  examples: [
    {
      kind: "basic",
      title: "8 Tokens with Block Size 4",
      inputDisplay: "tokenCount = 8, blockSize = 4",
      outputDisplay: "8 Translated Physical Address Tuples",
      input: { tokenCount: 8, blockSize: 4 },
      output: "Address Mappings Table",
      explanation: "Maps 8 logical tokens into 2 physical block slots (Block 12 and Block 43).",
    },
  ],
  code: PAGEDKVCACHEBLOCKMAPPING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N / B)",
  complexityAnalysis: {
    time: "Translates N logical token positions in O(N) time with O(1) block table array index lookups.",
    space: "Requires O(N/B) memory for block table lookup entries per active request.",
  },
  topicGuide: {
    overview:
      "PagedAttention revolutionized LLM serving engines (vLLM, TGI, TensorRT-LLM) by enabling up to 4x throughput improvements through near-zero memory waste (>96% memory utilization vs ~20% in naive static allocation).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let B be block size. For logical token t, the tuple (floor(t/B), t mod B) specifies the logical block index and offset. The physical address in the KV cache pool is A(t) = P[floor(t/B)] * B + (t mod B), where P is the request's physical block table.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "During attention computation, custom CUDA kernels load block tables into GPU Shared Memory or constant memory. Thread blocks gather non-contiguous physical KV tiles into SRAM dynamically, achieving high SIMD memory coalescing while avoiding DRAM fragmentation.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "PagedAttention uses a centralized BlockManager that maintains a free list of physical blocks. When a request completes, its physical blocks are immediately returned to the free pool without triggering expensive GPU heap re-allocation.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Copy-on-Write (CoW) block mapping allows prompt caching (prefix caching). If multiple prompts share a common system prompt prefix, they point to the exact same physical blocks until a token modification occurs.",
      },
    ],
    keyTerms: [
      {
        term: "PagedAttention",
        definition:
          "An attention algorithm storing KV caches in non-contiguous physical memory blocks mapped via virtual page tables.",
      },
      {
        term: "Block Table",
        definition:
          "Array mapping logical sequence block indices to physical GPU memory block IDs.",
      },
      {
        term: "Copy-on-Write (CoW)",
        definition:
          "A memory sharing technique where shared physical blocks are cloned only when a write operation occurs.",
      },
      {
        term: "Memory Fragmentation",
        definition: "Wasted GPU memory caused by pre-allocating static maximum context windows.",
      },
    ],
  },
  trivia: PAGEDKVCACHEBLOCKMAPPING_TRIVIA,
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT,
  generateSteps: generatePagedKvCacheBlockMappingSteps,
};
