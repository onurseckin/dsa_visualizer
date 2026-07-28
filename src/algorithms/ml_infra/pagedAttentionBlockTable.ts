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
        
    block_table = []
    free_blocks = list(range(total_physical_blocks))
    
    for logical_idx in range(num_logical_blocks):
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

  const freeBlocks: number[] = Array.from({ length: P }, (_, i) => i);
  const blockTable: number[] = [];

  const elements: ArrayElement[] = Array.from({ length: P }, (_, idx) => ({
    id: `pblock-${idx}`,
    value: `Block ${idx}`,
    state: "default",
  }));

  const makeSnapshotElements = (activePhysIdx: number | null) => {
    return elements.map((el, idx) => {
      const mappedLogicalIdx = blockTable.indexOf(idx);
      const isAllocated = mappedLogicalIdx !== -1;
      const isActive = activePhysIdx === idx;

      let state: ArrayElement["state"] = "default";
      if (isActive) state = "active";
      else if (isAllocated) state = "sorted";

      let pointers: string[] | undefined;
      if (isActive && !isAllocated) {
        pointers = [`Popped for allocation`];
      } else if (isAllocated) {
        const startT = mappedLogicalIdx * B;
        const endT = Math.min(S - 1, (mappedLogicalIdx + 1) * B - 1);
        pointers = [`L${mappedLogicalIdx} (T${startT}..${endT})`];
      }

      return {
        ...el,
        state,
        pointers,
      };
    });
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activePhysIdx: number | null,
    vars: Record<string, string | number | boolean>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: makeSnapshotElements(activePhysIdx),
      },
      auxiliaryState: {
        customState: {
          blockSize: B,
          sequenceTokens: S,
          numLogicalBlocks,
          blockTableMapping:
            blockTable.length > 0
              ? blockTable.map((phys, log) => `L${log}->P${phys}`).join(", ")
              : "[]",
          freeBlocksCount: freeBlocks.length,
          virtualMemoryFragmentation: "0%",
        },
      },
      variables: vars,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize PagedAttention Block Table Allocator",
    `Configured ${P} physical KV-cache memory blocks of size ${B} tokens for a sequence of ${S} tokens.`,
    null,
    { sequence_tokens: S, block_size: B, total_physical_blocks: P },
  );

  // Line 6: Calculate logical blocks needed
  addStep(
    6,
    `Compute num_logical_blocks = (${S} + ${B} - 1) // ${B} = ${numLogicalBlocks}`,
    `Ceil division determines sequence requires ${numLogicalBlocks} virtual logical pages of ${B} tokens each.`,
    null,
    { sequence_tokens: S, block_size: B, num_logical_blocks: numLogicalBlocks },
  );

  // Line 8: Check if physical memory is sufficient
  addStep(
    8,
    `Check capacity: ${numLogicalBlocks} <= ${P}`,
    `Required ${numLogicalBlocks} logical blocks fit within the total ${P} available physical GPU memory pages.`,
    null,
    { num_logical_blocks: numLogicalBlocks, total_physical_blocks: P },
  );

  if (numLogicalBlocks > P) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 9,
      explanation: {
        what: "Raise MemoryError: Out of GPU physical KV-cache memory blocks",
        why: `Sequence requires ${numLogicalBlocks} logical blocks, exceeding the total physical GPU capacity of ${P} blocks.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: makeSnapshotElements(null),
      },
      auxiliaryState: { customState: { error: "Out of physical blocks" } },
      variables: { num_logical_blocks: numLogicalBlocks, total_physical_blocks: P },
    });
    return steps;
  }

  // Line 11 & 12: Initialize block_table and free_blocks
  addStep(
    11,
    `Initialize block_table = [], free_blocks = list(range(${P}))`,
    `Created empty virtual block table and populated free_blocks pool with physical indices [0..${P - 1}].`,
    null,
    { total_physical_blocks: P, free_blocks_count: freeBlocks.length },
  );

  // Allocation loop
  for (let lIdx = 0; lIdx < numLogicalBlocks; lIdx++) {
    const startToken = lIdx * B;
    const endToken = Math.min(S - 1, (lIdx + 1) * B - 1);

    // Line 14: Loop header
    addStep(
      14,
      `For iteration: logical_idx = ${lIdx}`,
      `Allocating physical GPU block for Logical Block #${lIdx} covering token range [${startToken}..${endToken}].`,
      null,
      {
        logical_idx: lIdx,
        num_logical_blocks: numLogicalBlocks,
        start_token: startToken,
        end_token: endToken,
      },
    );

    const physIdx = freeBlocks.shift()!;

    // Line 15: Pop free block
    addStep(
      15,
      `physical_idx = free_blocks.pop(0) -> #${physIdx}`,
      `Popped non-contiguous physical page #${physIdx} from free pool. ${freeBlocks.length} free blocks remain in pool.`,
      physIdx,
      { logical_idx: lIdx, physical_idx: physIdx, free_blocks_remaining: freeBlocks.length },
    );

    blockTable.push(physIdx);

    // Line 16: Append to block table
    addStep(
      16,
      `block_table.append(${physIdx}) -> [${blockTable.join(", ")}]`,
      `Mapped Logical Block #${lIdx} to Physical Block #${physIdx}. Virtual block table updated.`,
      physIdx,
      { logical_idx: lIdx, physical_idx: physIdx, block_table: `[${blockTable.join(", ")}]` },
    );
  }

  // Line 18: Calculate raw token offset
  const rawOffset = S % B;
  addStep(
    18,
    `Compute token_offset = ${S} % ${B} = ${rawOffset}`,
    `Calculates number of active tokens occupied in the final allocated logical block.`,
    null,
    { sequence_tokens: S, block_size: B, token_offset: rawOffset },
  );

  let finalOffset = rawOffset;
  if (rawOffset === 0) {
    finalOffset = B;
    // Line 20: Full block adjustment
    addStep(
      20,
      `token_offset = block_size = ${B}`,
      `Sequence tokens divide block size evenly: final block is fully filled with ${B} tokens.`,
      null,
      { token_offset: B, block_size: B },
    );
  } else {
    // Line 19: Check condition (evaluated to false)
    addStep(
      19,
      `Check token_offset == 0 (false, offset remains ${rawOffset})`,
      `Final block #${numLogicalBlocks - 1} contains ${rawOffset} active tokens (partial block).`,
      null,
      { token_offset: rawOffset, block_size: B },
    );
  }

  // Line 22: Return result
  addStep(
    22,
    "Return PagedAttention block allocation dict",
    `Completed mapping for ${S} tokens: ${numLogicalBlocks} blocks allocated, active_block_tokens=${finalOffset}, ${freeBlocks.length} physical blocks remaining free.`,
    null,
    {
      num_logical_blocks: numLogicalBlocks,
      block_table: `[${blockTable.join(", ")}]`,
      active_block_tokens: finalOffset,
      remaining_free_blocks: freeBlocks.length,
    },
  );

  return steps;
}

export const pagedAttentionBlockTable: AlgorithmDefinition<PagedAttentionInput> = {
  id: "paged-attention-block-table",
  title: "PagedAttention Physical Block Table Allocator",
  topicIds: ["ml_llm_serving"],
  difficulty: "Hard",
  description:
    "Virtual memory management algorithm (vLLM / Kwon et al.) that maps logical sequence KV-cache blocks to non-contiguous physical GPU memory pages, eliminating internal and external VRAM fragmentation.",
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
