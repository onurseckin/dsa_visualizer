import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface pagedAttentionBlockTableAllocatorInput {
  token_chunks: number[];
  block_size?: number;
}

export const PAGEDATTENTIONBLOCKTABLEALLOCATOR_CODE = `def paged_attention_block_table_allocator(token_chunks: list[int], block_size: int = 4) -> list[int]:
    """
    Dynamically allocates physical GPU memory blocks (pages) for incoming sequence token chunks,
    mapping logical token block indices to physical block table entries.
    """
    block_table = []
    current_tokens = 0
    next_physical_block = 0

    for chunk_idx, tokens in enumerate(token_chunks):
        for _ in range(tokens):
            if current_tokens % block_size == 0:
                block_table.append(next_physical_block)
                next_physical_block += 1
            current_tokens += 1

    return block_table
`;

export const DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT: pagedAttentionBlockTableAllocatorInput =
  {
    token_chunks: [3, 2, 4],
    block_size: 4,
  };

export const generatePagedAttentionBlockTableAllocatorSteps = (
  input: pagedAttentionBlockTableAllocatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const blockSize = input.block_size ?? 4;
  const blocks: ArrayElement[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customBlocks: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: customBlocks.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          token_chunks: JSON.stringify(input.token_chunks),
          block_size: String(blockSize),
        },
      },
      variables,
    });
  };

  let currentTokens = 0;
  let nextPhysicalBlock = 0;

  addStep(
    6,
    "Initialize PagedAttention Allocator",
    "Set up empty physical block table and token counters for dynamic memory mapping.",
    { current_tokens: currentTokens, next_physical_block: nextPhysicalBlock },
    [...blocks],
  );

  for (let i = 0; i < input.token_chunks.length; i++) {
    const tokensToAdd = input.token_chunks[i];

    addStep(
      10,
      `Process chunk ${i} with ${tokensToAdd} tokens`,
      "Simulate continuous batching token generation iteration.",
      { tokens_to_add: tokensToAdd, current_tokens: currentTokens },
      [...blocks],
    );

    for (let t = 0; t < tokensToAdd; t++) {
      if (currentTokens % blockSize === 0) {
        blocks.push({
          id: `block-${nextPhysicalBlock}`,
          value: `Block ${nextPhysicalBlock} (1/${blockSize})`,
          state: "active",
        });

        addStep(
          12,
          "Allocate new physical block",
          "Current page boundary crossed. Allocating a new non-contiguous physical memory block from pool.",
          { current_tokens: currentTokens, next_physical_block: nextPhysicalBlock },
          [...blocks],
        );
        nextPhysicalBlock++;
      } else {
        const blockIdx = Math.floor(currentTokens / blockSize);
        const tokensInBlock = (currentTokens % blockSize) + 1;
        blocks[blockIdx] = {
          ...blocks[blockIdx],
          value: `Block ${blockIdx} (${tokensInBlock}/${blockSize})`,
          state: "compare",
        };
        addStep(
          15,
          "Write token to existing block",
          "Token fits into currently allocated active physical block without triggering allocation.",
          { current_tokens: currentTokens, next_physical_block: nextPhysicalBlock },
          [...blocks],
        );
      }
      currentTokens++;
    }
  }

  const finalBlocks = blocks.map((b) => ({ ...b, state: "sorted" as const }));
  addStep(
    17,
    "Sequence Generation Complete",
    "Returns the block table that maps logical sequence token blocks to physical GPU memory blocks.",
    { total_tokens: currentTokens },
    finalBlocks,
  );

  return steps;
};

const PAGEDATTENTIONBLOCKTABLEALLOCATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5],
  distractors: ["if current_tokens % block_size != 0:", "allocated_blocks.append(current_tokens)"],
  hints: [{ line: 12, hint: "Check if the current token fills a multiple of the block size." }],
  lineExplanations: {
    6: "Initialize block table and token counter.",
    10: "Iterate over chunks of tokens generated sequentially.",
    12: "Allocate a new block dynamically when a block boundary is crossed.",
    15: "Increment the sequence length.",
    17: "Return the block table mapping.",
  },
};

export const pagedAttentionBlockTableAllocator: AlgorithmDefinition<pagedAttentionBlockTableAllocatorInput> =
  {
    id: "paged-attention-block-table-allocator",
    title: "PagedAttention Block Table Allocator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "In modern high-performance LLM serving engines (such as vLLM, TGI, and TensorRT-LLM), Key-Value (KV) cache memory grows dynamically as tokens are generated autoregressively. Traditional static contiguous allocation reserves memory for maximum sequence lengths (`max_seq_len`), incurring up to 60-80% VRAM memory fragmentation. PagedAttention solves this by applying operating system virtual memory concepts: partitioning the KV cache into fixed-size physical blocks (pages) and allocating them dynamically on-demand via a logical-to-physical Block Table.\n\nInput Format:\n- `token_chunks`: Array of positive integers, where each element represents the count of new tokens generated or added to the sequence per batch iteration.\n- `block_size`: Number of tokens stored per physical memory block (default = 4).\n\nOutput Format:\n- Returns an array `block_table` representing physical block IDs allocated to the sequence in logical order.\n\nEdge Cases & Constraints:\n- Empty token chunk lists (`[]`) return an empty block table `[]`.\n- Tokens filling existing partial blocks update page state without triggering new physical allocations.\n- Block size selection balances GPU hardware kernel launch overhead versus internal page fragmentation.",
    constraints: [
      "1 <= token_chunks.length <= 100",
      "1 <= token_chunks[i] <= 100",
      "1 <= block_size <= 64",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard Case (B=4)",
        inputDisplay: "chunks = [3, 2, 4], block_size = 4",
        outputDisplay: "[0, 1, 2]",
        input: { token_chunks: [3, 2, 4], block_size: 4 },
        output: "[0, 1, 2]",
        explanation:
          "First 3 tokens fit into Block 0. The next 2 tokens fill Block 0 and allocate Block 1. The final 4 tokens fill Block 1 and allocate Block 2.",
      },
      {
        kind: "complex",
        title: "Small Block Size (B=2)",
        inputDisplay: "chunks = [5, 1], block_size = 2",
        outputDisplay: "[0, 1, 2]",
        input: { token_chunks: [5, 1], block_size: 2 },
        output: "[0, 1, 2]",
        explanation:
          "A block size of 2 forces page allocation every 2 tokens, creating 3 blocks total for 6 tokens.",
      },
      {
        kind: "negative",
        title: "Empty Input",
        inputDisplay: "chunks = [], block_size = 4",
        outputDisplay: "[]",
        input: { token_chunks: [], block_size: 4 },
        output: "[]",
        explanation: "No tokens processed; zero blocks allocated.",
      },
    ],
    code: PAGEDATTENTIONBLOCKTABLEALLOCATOR_CODE,
    timeComplexity: { best: "O(T)", average: "O(T)", worst: "O(T)" },
    spaceComplexity: "O(T/B)",
    complexityAnalysis: {
      time: "O(T) where T is total tokens generated across all iterations. Each token requires O(1) page boundary lookup.",
      space:
        "O(T/B) memory where B is block size, storing physical block pointers proportional to total required pages.",
    },
    topicGuide: {
      overview:
        "PagedAttention replaces monolithic contiguous KV cache tensors with virtual memory paging. It dynamically allocates fixed-size physical memory pages to sequences as tokens are generated, keeping track of page locations using a per-sequence Block Table.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Autoregressive LLM generation requires storing computed Keys and Values for all past tokens to prevent redundant attention computation. Traditional frameworks pre-allocate a contiguous memory tensor sized for `max_seq_len` for every sequence. Because generation lengths are unpredictable, this causes severe external memory fragmentation (unallocated space reserved for sequences that terminate early) and internal fragmentation (unused space inside oversized allocations). PagedAttention eliminates these inefficiencies by introducing virtual memory paging to GPU VRAM.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "The PagedAttention allocator manages a physical block pool of GPU memory pages (e.g., each block storing KV tensors for 16 tokens). Each active sequence maintains a dynamic Block Table—an array mapping logical token block indices (0, 1, 2...) to non-contiguous physical block IDs (e.g., 42, 7, 108). When a sequence requires a new token, the allocator checks if the current physical block has space available. If full, it requests a new physical block from the global free pool and appends the block ID to the sequence's Block Table.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "By allowing physical KV cache blocks to reside anywhere in non-contiguous VRAM, PagedAttention reduces memory waste from >60% down to under 4% (limited only to internal fragmentation in the very last block of a sequence). This dramatic memory saving allows serving engines to increase batch sizes by 2x-4x on identical GPU hardware, leading to massive throughput improvements in high-concurrency production deployments.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
          body: "Key implementation considerations include selecting optimal block sizes: smaller blocks (e.g., size 8) minimize internal fragmentation but increase block table overhead and CUDA kernel launch latency; larger blocks (e.g., size 32) improve Tensor Core vectorization (`LDG.128`) but increase memory waste for short sequences. Furthermore, during beam search or parallel decoding, multiple block tables can point to the exact same physical block IDs with reference counting (Copy-on-Write).",
        },
      ],
      keyTerms: [
        {
          term: "Block Table",
          definition:
            "A dynamic data structure mapping sequence logical token blocks to physical GPU memory blocks.",
        },
        {
          term: "KV Cache",
          definition:
            "Cached Key and Value tensor representations of past sequence tokens used in multi-head attention.",
        },
        {
          term: "Virtual Memory Paging",
          definition:
            "An abstraction technique partitioning physical memory into fixed-size pages to prevent fragmentation.",
        },
        {
          term: "Internal Fragmentation",
          definition:
            "Unused memory remaining inside an allocated physical block when total tokens are not a multiple of block size.",
        },
      ],
    },
    trivia: PAGEDATTENTIONBLOCKTABLEALLOCATOR_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "vLLM: Efficient Memory Management for Large Language Model Serving (Kwon et al., SOSP 2023)",
      },
    ],
    defaultInput: DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT,
    generateSteps: generatePagedAttentionBlockTableAllocatorSteps,
  };
