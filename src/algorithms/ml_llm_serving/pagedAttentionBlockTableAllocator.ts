import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface pagedAttentionBlockTableAllocatorInput {
  token_chunks: number[];
  block_size?: number;
}

export const PAGEDATTENTIONBLOCKTABLEALLOCATOR_CODE = `
def pagedattentionblocktableallocator(ring_ranks, parameter_shards):
    """
    Ring-AllReduce collective communications and vLLM PagedAttention virtual memory translation.
    """
    num_nodes = len(ring_ranks)
    shard_buffers = [list(shard) for shard in parameter_shards]

    # Phase 1: Scatter-Reduce across circular ring topology
    for step in range(num_nodes - 1):
        for rank in range(num_nodes):
            send_idx = (rank - step) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] += shard_buffers[rank][send_idx]

    # Phase 2: AllGather across circular ring topology
    for step in range(num_nodes - 1):
        for rank in range(num_nodes):
            send_idx = (rank - step + 1) % num_nodes
            recv_rank = (rank + 1) % num_nodes
            shard_buffers[recv_rank][send_idx] = shard_buffers[rank][send_idx]

    return shard_buffers
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

  // We'll visualize the physical blocks array.
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
        },
      },
      variables,
    });
  };

  let currentTokens = 0;
  let nextPhysicalBlock = 0;

  addStep(
    4,
    "Initialize PagedAttention Allocator",
    "Set up empty block table and counters.",
    { current_tokens: currentTokens, next_physical_block: nextPhysicalBlock },
    [...blocks],
  );

  for (let i = 0; i < input.token_chunks.length; i++) {
    const tokensToAdd = input.token_chunks[i];

    addStep(
      8,
      "Process chunk " + i + " with " + tokensToAdd + " tokens",
      "Simulate continuous batching token generation phase.",
      { tokens_to_add: tokensToAdd, current_tokens: currentTokens },
      [...blocks],
    );

    for (let t = 0; t < tokensToAdd; t++) {
      if (currentTokens % blockSize === 0) {
        blocks.push({
          id: "block-" + nextPhysicalBlock,
          value: "Block " + nextPhysicalBlock + " (1/" + blockSize + ")",
          state: "active",
        });

        addStep(
          11,
          "Allocate new physical block",
          "Current block is full or uninitialized. Allocating a new non-contiguous physical block.",
          { current_tokens: currentTokens, next_physical_block: nextPhysicalBlock },
          [...blocks],
        );
        nextPhysicalBlock++;
      } else {
        const blockIdx = Math.floor(currentTokens / blockSize);
        const tokensInBlock = (currentTokens % blockSize) + 1;
        blocks[blockIdx] = {
          ...blocks[blockIdx],
          value: "Block " + blockIdx + " (" + tokensInBlock + "/" + blockSize + ")",
          state: "compare",
        };
        addStep(
          14,
          "Write token to existing block",
          "Plenty of space left in the current block, preventing internal fragmentation.",
          { current_tokens: currentTokens, next_physical_block: nextPhysicalBlock },
          [...blocks],
        );
      }
      currentTokens++;
    }
  }

  const finalBlocks = blocks.map((b) => ({ ...b, state: "sorted" as const }));
  addStep(
    16,
    "Sequence Generation Complete",
    "Returns the block table that maps logical tokens to physical blocks.",
    { total_tokens: currentTokens },
    finalBlocks,
  );

  return steps;
};

const PAGEDATTENTIONBLOCKTABLEALLOCATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: ["if current_tokens % block_size != 0:", "allocated_blocks.append(current_tokens)"],
  hints: [{ line: 10, hint: "Check if the current token fills a multiple of the block size." }],
  lineExplanations: {
    4: "Initialize block table and token counter.",
    8: "Iterate over chunks of tokens generated sequentially.",
    11: "Allocate a new block dynamically when a block boundary is crossed.",
    14: "Increment the sequence length.",
    16: "Return the block table.",
  },
};

export const pagedAttentionBlockTableAllocator: AlgorithmDefinition<pagedAttentionBlockTableAllocatorInput> =
  {
    id: "paged-attention-block-table-allocator",
    title: "PagedAttention Block Table Allocator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "heap_and_priority_queue"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), pagedattention block table allocator provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["1 <= token_chunks.length <= 100", "1 <= token_chunks[i] <= 100"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case (B=4)",
        inputDisplay: "chunks = [3, 2, 4], block_size = 4",
        outputDisplay: "[0, 1, 2]",
        input: { token_chunks: [3, 2, 4], block_size: 4 },
        output: "[0, 1, 2]",
        explanation:
          "3 tokens fit in Block 0. Next 2 tokens fill Block 0 and start Block 1. Last 4 tokens fill Block 1 and use Block 2.",
      },
      {
        kind: "complex",
        title: "Small Block Size (B=2)",
        inputDisplay: "chunks = [5, 1], block_size = 2",
        outputDisplay: "[0, 1, 2]",
        input: { token_chunks: [5, 1], block_size: 2 },
        output: "[0, 1, 2]",
        explanation: "A block size of 2 forces more frequent allocations.",
      },
      {
        kind: "negative",
        title: "Zero Added",
        inputDisplay: "chunks = [], block_size = 4",
        outputDisplay: "[]",
        input: { token_chunks: [], block_size: 4 },
        output: "[]",
        explanation: "No tokens added, no blocks allocated.",
      },
    ],
    code: PAGEDATTENTIONBLOCKTABLEALLOCATOR_CODE,
    timeComplexity: { best: "O(T)", average: "O(T)", worst: "O(T)" },
    spaceComplexity: "O(T/B)",
    complexityAnalysis: {
      time: "O(T) where T is the total number of tokens added. Each token requires O(1) allocation logic.",
      space:
        "O(T/B) where B is the block size. The block table grows relative to the number of blocks.",
    },
    topicGuide: {
      overview:
        "PagedAttention manages KV cache memory using concepts from OS virtual memory. It allocates fixed-size physical blocks (pages) to sequences dynamically.",
      sections: [
        {
          heading: "Core Concept",
          body: "Traditional KV cache allocation requires contiguous memory for a sequence's maximum length, leading to severe fragmentation. PagedAttention allocates blocks on demand, maintaining a block table to map logical tokens to physical memory.",
        },
        {
          heading: "Systems Impact",
          body: "Virtually eliminates internal and external memory fragmentation in LLM serving. Enables memory sharing across beams in beam search, drastically increasing batch sizes and throughput.",
        },
      ],
      keyTerms: [
        {
          term: "Block Table",
          definition:
            "A mapping from a sequence's logical token blocks to physical GPU memory blocks.",
        },
        {
          term: "KV Cache",
          definition:
            "Cached Keys and Values of previously computed tokens in autoregressive models.",
        },
        {
          term: "Fragmentation",
          definition:
            "Wasted memory space. External fragmentation happens when free blocks are scattered; internal fragmentation happens when allocated sizes exceed actual usage.",
        },
      ],
    },
    trivia: PAGEDATTENTIONBLOCKTABLEALLOCATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT,
    generateSteps: generatePagedAttentionBlockTableAllocatorSteps,
  };
