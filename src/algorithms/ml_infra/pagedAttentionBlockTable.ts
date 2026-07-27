import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface PagedAttentionInput {
  blockSize: number; // e.g. 16 tokens per block
  totalPhysicalBlocks: number;
  sequenceTokens: number;
}

export const PAGED_ATTENTION_BLOCK_TABLE_CODE = `def paged_attention_block_table(
    sequence_tokens: int,
    block_size: int,
    total_physical_blocks: int
) -> dict:
    num_logical_blocks = (sequence_tokens + block_size - 1) // block_size
    
    if num_logical_blocks > total_physical_blocks:
        raise MemoryError("Out of GPU physical KV-cache memory blocks")
        
    # Virtual Memory Mapping: Logical Block ID -> Physical Block ID
    block_table = []
    free_blocks = list(range(total_physical_blocks))
    
    for logical_idx in range(num_logical_blocks):
        # Allocate non-contiguous physical block from pool
        physical_idx = free_blocks.pop(0)
        block_table.append(physical_idx)
        
    token_offset = sequence_tokens % block_size
    if token_offset == 0:
        token_offset = block_size
        
    return {
        "num_logical_blocks": num_logical_blocks,
        "block_table": block_table,
        "active_block_tokens": token_offset,
        "remaining_free_blocks": len(free_blocks)
    }`;

export const DEFAULT_PAGED_ATTENTION_INPUT: PagedAttentionInput = {
  blockSize: 4,
  totalPhysicalBlocks: 8,
  sequenceTokens: 10,
};

export const PAGED_ATTENTION_EXAMPLES: ProblemExample<PagedAttentionInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "10 Tokens PagedAttention (Block Size 4, 8 Physical Blocks)",
    input: {
      blockSize: 4,
      totalPhysicalBlocks: 8,
      sequenceTokens: 10,
    },
    output: "Maps 3 Logical Blocks to 3 Physical Blocks [0, 1, 2] with 5 free blocks remaining",
    explanation:
      "Tokens 0..3 -> Physical Block 0; Tokens 4..7 -> Physical Block 1; Tokens 8..9 -> Physical Block 2 (2 tokens active).",
  },
  {
    id: "complex",
    kind: "complex",
    title: "Long Sequence Allocation (25 Tokens, Block Size 4)",
    input: {
      blockSize: 4,
      totalPhysicalBlocks: 10,
      sequenceTokens: 25,
    },
    output: "Allocates 7 Physical Blocks for 25 tokens",
    explanation:
      "Logical blocks 0..6 mapped dynamically without requiring contiguous physical GPU VRAM.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "Minimal 1 Token Allocation",
    input: {
      blockSize: 4,
      totalPhysicalBlocks: 4,
      sequenceTokens: 1,
    },
    output: "1 Physical Block allocated with 3 slots free",
    explanation: "Allocates 1 block for initial token generation.",
  },
];

export function generatePagedAttentionSteps(input: PagedAttentionInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { blockSize: B, totalPhysicalBlocks: P, sequenceTokens: S } = input;

  if (B <= 0 || P <= 0 || S <= 0) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid PagedAttention Configuration",
        why: "Block size, physical blocks, and sequence tokens must be positive.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Invalid parameters" } },
      variables: {},
    });
    return steps;
  }

  const numLogicalBlocks = Math.ceil(S / B);

  if (numLogicalBlocks > P) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: "Out of Physical Memory Blocks",
        why: `Required ${numLogicalBlocks} blocks, but only ${P} physical blocks available in GPU VRAM pool.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Out of physical blocks" } },
      variables: { numLogicalBlocks, totalPhysicalBlocks: P },
    });
    return steps;
  }

  const freeBlocks: number[] = Array.from({ length: P }, (_, i) => i);
  const blockTable: number[] = [];

  const elements: ArrayElement[] = Array.from({ length: P }, (_, idx) => ({
    id: `pblock-${idx}`,
    value: idx,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    _activeLogicalIdx: number,
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => {
          const isAllocated = blockTable.includes(idx);
          return {
            ...el,
            state: isAllocated ? "sorted" : "default",
            pointers: isAllocated ? [`Logical Block #${blockTable.indexOf(idx)}`] : undefined,
          };
        }),
      },
      auxiliaryState: {
        customState: {
          blockSize: B,
          sequenceTokens: S,
          numLogicalBlocks,
          blockTableMapping: blockTable.map((phys, log) => `L${log}->P${phys}`).join(", "),
          freeBlocksCount: freeBlocks.length,
          virtualMemoryFragmentation: "0%",
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize PagedAttention Block Table Allocator",
    `Configured ${P} physical KV-cache blocks of size ${B} tokens. Sequence of ${S} tokens requires ${numLogicalBlocks} logical blocks.`,
    -1,
    { sequenceTokens: S, blockSize: B, totalPhysicalBlocks: P },
  );

  addStep(
    6,
    `Compute num_logical_blocks = ceil(${S} / ${B}) = ${numLogicalBlocks}`,
    `num_logical_blocks = (${S} + ${B} - 1) // ${B} = ${numLogicalBlocks}. This is how many virtual pages the sequence occupies.`,
    -1,
    { sequence_tokens: S, block_size: B, num_logical_blocks: numLogicalBlocks },
  );

  addStep(
    12,
    `Initialize block_table = [], free_blocks = [0..${P - 1}]`,
    `block_table will store logical_block → physical_block mappings. free_blocks is the pool of ${P} available physical pages.`,
    -1,
    { total_physical_blocks: P, free_blocks_count: P },
  );

  for (let lIdx = 0; lIdx < numLogicalBlocks; lIdx++) {
    const physIdx = freeBlocks.shift()!;
    blockTable.push(physIdx);

    const startToken = lIdx * B;
    const endToken = Math.min(S - 1, (lIdx + 1) * B - 1);

    addStep(
      17,
      `Allocated Physical Block #${physIdx} for Logical Block #${lIdx}`,
      `physical_idx = free_blocks.pop(0) = ${physIdx}. Mapped token range [${startToken}..${endToken}] to non-contiguous physical GPU block #${physIdx}. Remaining free blocks: ${freeBlocks.length}.`,
      lIdx,
      { logicalBlock: lIdx, physicalBlock: physIdx, tokens: `${startToken}..${endToken}` },
    );
  }

  addStep(
    20,
    `Compute token_offset = ${S} % ${B} = ${S % B || B}`,
    `Offset of last write position inside the active (last) block. ${S % B === 0 ? `Sequence fills blocks exactly: offset set to block_size=${B}` : `${S % B} tokens used in final block #${numLogicalBlocks - 1}`}.`,
    numLogicalBlocks,
    { sequence_tokens: S, block_size: B, token_offset: S % B || B },
  );

  addStep(
    24,
    "Return PagedAttention Block Table",
    `Successfully constructed Virtual Block Table mapping for ${S} tokens across ${numLogicalBlocks} physical blocks without VRAM fragmentation.`,
    numLogicalBlocks,
    { totalAllocatedBlocks: blockTable.length, freeBlocksRemaining: freeBlocks.length },
  );

  return steps;
}

export const pagedAttentionBlockTable: AlgorithmDefinition<PagedAttentionInput> = {
  id: "paged-attention-block-table",
  title: "PagedAttention Physical Block Table Allocator",
  category: "ml_llm_serving",
  difficulty: "Hard",
  description:
    "Virtual memory management algorithm (vLLM / Kwon et al.) that maps logical sequence KV-cache blocks to non-contiguous physical GPU memory pages, eliminating internal and external VRAM fragmentation.",
  isMlInfra: true,
  mlInfraLevel: 10,
  constraints: ["Block size B > 0", "Total physical blocks P > 0", "Sequence tokens S > 0"],
  examples: PAGED_ATTENTION_EXAMPLES,
  code: PAGED_ATTENTION_BLOCK_TABLE_CODE,
  timeComplexity: {
    best: "O(S / B)",
    average: "O(S / B)",
    worst: "O(S / B)",
  },
  spaceComplexity: "O(P * B)",
  complexityAnalysis: {
    time: "O(S / B) allocation time per request to update block lookup table.",
    space:
      "O(P * B) total KV-cache memory pool utilization, reducing wasted VRAM from 60-80% down to under 4%.",
  },
  topicGuide: {
    overview:
      "PagedAttention (vLLM, Kwon et al. 2023) adapts OS virtual memory paging to LLM KV-cache management. In traditional serving, pre-allocating contiguous memory for max context length wastes up to 80% of GPU memory. PagedAttention divides KV-cache into fixed-size blocks (e.g. 16 tokens) mapped dynamically via block tables.",
    sections: [
      {
        heading: "Logical to Physical Block Mapping",
        body: "Tokens are logically sequential, but their Key/Value tensors are stored in non-contiguous physical GPU blocks, allowing dynamic growth and page sharing.",
      },
      {
        heading: "Copy-on-Write Parallel Sampling",
        body: "Multiple candidate outputs or parallel beam search paths can share physical prompt KV-blocks, using Copy-on-Write when sequences diverge.",
      },
    ],
    keyTerms: [
      {
        term: "PagedAttention",
        definition: "Virtual memory paging for LLM Key-Value cache memory management.",
      },
      {
        term: "Block Table",
        definition:
          "Lookup table translating logical token sequence block IDs to physical GPU memory addresses.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" }],
  defaultInput: DEFAULT_PAGED_ATTENTION_INPUT,
  generateSteps: generatePagedAttentionSteps,
};
