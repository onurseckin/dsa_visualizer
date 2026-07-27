import type {
  AlgorithmDefinition,
  AlgorithmStep,
  MatrixCellItem,
  MatrixVisualSnapshot,
} from "../../types/dsa";
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

    return block_table`;

export const DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT: pagedAttentionBlockTableAllocatorInput =
  {
    token_chunks: [4, 3, 5, 2, 4],
    block_size: 4,
  };

function buildBlockTableMatrixSnapshot(
  blockTable: number[],
  currentTokens: number,
  blockSize: number,
  activeLogicalBlock: number | null,
): MatrixVisualSnapshot {
  const colHeaders = [
    "Logical Block Index",
    "Physical Block ID",
    "Tokens Occupied",
    "Block Capacity",
    "Status",
  ];
  const rows = Math.max(blockTable.length, 1);
  const cells: MatrixCellItem[] = [];

  if (blockTable.length === 0) {
    cells.push(
      { row: 0, col: 0, value: "-", state: "default" },
      { row: 0, col: 1, value: "-", state: "default" },
      { row: 0, col: 2, value: 0, state: "default" },
      { row: 0, col: 3, value: blockSize, state: "default" },
      { row: 0, col: 4, value: "No Blocks Allocated", state: "default" },
    );
  } else {
    blockTable.forEach((physBlock, logIdx) => {
      let state: MatrixCellItem["state"] = "sorted";
      let occupied = blockSize;
      let statusText = "Full Page";

      if (logIdx === blockTable.length - 1) {
        occupied = currentTokens % blockSize === 0 ? blockSize : currentTokens % blockSize;
        if (occupied < blockSize) {
          state = "active";
          statusText = `Partial Page (${occupied}/${blockSize})`;
        }
      }

      if (logIdx === activeLogicalBlock) {
        state = "pivot";
        statusText = `Allocating Block ${physBlock}`;
      }

      cells.push(
        { row: logIdx, col: 0, value: logIdx, state },
        { row: logIdx, col: 1, value: physBlock, state },
        { row: logIdx, col: 2, value: occupied, state },
        { row: logIdx, col: 3, value: blockSize, state },
        { row: logIdx, col: 4, value: statusText, state },
      );
    });
  }

  return {
    kind: "matrix",
    rows,
    cols: 5,
    colHeaders,
    cells,
    title: `PagedAttention Physical Block Table (Total Tokens: ${currentTokens})`,
  };
}

export const generatePagedAttentionBlockTableAllocatorSteps = (
  input: pagedAttentionBlockTableAllocatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const blockSize = input.block_size ?? 4;
  const tokenChunks = input.token_chunks;
  const blockTable: number[] = [];
  let currentTokens = 0;
  let nextPhysicalBlock = 0;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeLogBlock: number | null,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: buildBlockTableMatrixSnapshot(
        [...blockTable],
        currentTokens,
        blockSize,
        activeLogBlock,
      ),
      auxiliaryState: {
        customState: {
          blockSize: String(blockSize),
          totalChunks: String(tokenChunks.length),
          allocatedBlocks: String(blockTable.length),
          currentTokens: String(currentTokens),
          nextPhysicalBlock: String(nextPhysicalBlock),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize PagedAttention Allocator",
    `Configuring PagedAttention allocator with page size block_size = ${blockSize} tokens.`,
    { blockSize, numChunks: tokenChunks.length },
    null,
  );

  addStep(
    6,
    "Initialize Container block_table",
    "Creating physical block table mapping array for sequence KV cache.",
    { blockSize },
    null,
  );

  addStep(
    7,
    "Initialize current_tokens and next_physical_block",
    "Setting token offset current_tokens = 0 and available physical page allocator next_physical_block = 0.",
    { current_tokens: 0, next_physical_block: 0 },
    null,
  );

  tokenChunks.forEach((tokens, chunkIdx) => {
    addStep(
      10,
      `Process Token Chunk ${chunkIdx + 1}/${tokenChunks.length} (${tokens} Tokens)`,
      `Incoming token chunk contains ${tokens} new tokens to append to KV cache.`,
      { chunkIdx, tokens, current_tokens: currentTokens },
      null,
    );

    for (let t = 0; t < tokens; t++) {
      addStep(
        11,
        `Evaluate Boundary for Token ${t + 1}/${tokens} in Chunk ${chunkIdx + 1} (Total Offset ${currentTokens})`,
        `Checking if current_tokens (${currentTokens}) % block_size (${blockSize}) == 0.`,
        { chunkIdx, tokenInChunk: t, current_tokens: currentTokens, rem: currentTokens % blockSize },
        null,
      );

      if (currentTokens % blockSize === 0) {
        const allocatedPhys = nextPhysicalBlock;
        blockTable.push(allocatedPhys);
        nextPhysicalBlock += 1;

        addStep(
          13,
          `Allocate New Physical Page ${allocatedPhys} for Logical Block ${blockTable.length - 1}`,
          `Page boundary crossed! Allocated physical GPU memory page ${allocatedPhys} to logical block index ${blockTable.length - 1}.`,
          {
            logicalBlock: blockTable.length - 1,
            physicalBlock: allocatedPhys,
            next_physical_block: nextPhysicalBlock,
          },
          blockTable.length - 1,
        );
      }

      currentTokens += 1;

      addStep(
        14,
        `Increment current_tokens to ${currentTokens}`,
        `Token appended to active page slot ${((currentTokens - 1) % blockSize) + 1}/${blockSize}.`,
        { current_tokens: currentTokens },
        blockTable.length - 1,
      );
    }
  });

  addStep(
    16,
    "PagedAttention Block Table Allocation Complete",
    `Successfully allocated ${blockTable.length} physical GPU memory pages [${blockTable.join(", ")}] for ${currentTokens} total tokens. Zero internal fragmentation outside final page.`,
    { complete: true, totalTokens: currentTokens, allocatedPages: blockTable.length },
    null,
  );

  return steps;
};

const PAGEDATTENTIONBLOCKTABLEALLOCATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 8, 15],
  distractors: [
    "block_table.append(current_tokens) # using token offset as physical block",
    "next_physical_block += block_size # over-allocating physical blocks",
    "if current_tokens % block_size != 0: block_table.append(next_physical_block)",
    "return len(block_table)",
  ],
  hints: [
    { line: 11, hint: "Check if current_tokens % block_size == 0 to detect page boundary crossing." },
    { line: 13, hint: "Append next_physical_block to block_table and increment allocator index." },
    { line: 16, hint: "Return block_table containing mapped physical GPU page indices." },
  ],
  lineExplanations: {
    1: "Function signature for paged_attention_block_table_allocator taking token_chunks list and block_size.",
    2: "Docstring start describing PagedAttention virtual block memory allocator.",
    3: "Explains mapping of logical token sequence offsets to physical GPU memory block IDs.",
    4: "Explains dynamic allocation behavior per token chunk.",
    5: "Docstring end.",
    6: "Initializes block_table list to store physical GPU memory page numbers allocated to sequence.",
    7: "Initializes current_tokens count to zero.",
    8: "Initializes next_physical_block allocator counter tracking available physical GPU DRAM pages.",
    9: "Blank line before token chunk processing loop.",
    10: "Loop iterating over each token chunk index and token count in token_chunks list.",
    11: "Inner loop running once per token in current chunk to track exact page boundary crossings.",
    12: "Checks if current_tokens offset aligns with block_size page boundary.",
    13: "Appends next_physical_block to block_table physical page table.",
    14: "Increments next_physical_block allocator index for next GPU memory page allocation.",
    15: "Increments total current_tokens count for sequence.",
    16: "Blank line before final return.",
    17: "Returns block_table array mapping logical sequence blocks to physical GPU page numbers.",
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
      "PagedAttention (introduced in vLLM by Kwon et al.) revolutionizes LLM serving memory management by borrowing virtual memory paging principles from operating systems. In traditional Transformer serving engines, Key-Value (KV) cache tensors for each request were allocated as contiguous memory slabs sized to the maximum possible sequence length (e.g. $L_{\\text{max}} = 4096$ or $8192$ tokens). This resulted in severe memory fragmentation (over $60\\%-80\\%$ waste due to internal fragmentation, external fragmentation, and reserved buffer allocations), limiting multi-user GPU serving capacity.\n\n### Mathematical Formulation & Paging Mechanics\nFor a total sequence length of $T$ tokens and block size $B$ (e.g. $B = 16$ tokens per physical page), total allocated physical blocks $N_{\\text{blocks}}$ is:\n$$N_{\\text{blocks}} = \\left\\lceil \\frac{T}{B} \\right\\rceil$$\nLogical block index $i = \\lfloor t / B \\rfloor$ maps token offset $t \\in [0, T-1]$ to physical block $P_i = \\text{BlockTable}[i]$. Inside physical block $P_i$, token offset is $o = t \\pmod B$.\n\nInternal memory fragmentation waste $W_{\\text{internal}}$ is strictly bounded by the last block:\n$$W_{\\text{internal}} = (B - (T \\pmod B)) \\pmod B < B$$\nRelative memory waste is $\\frac{W_{\\text{internal}}}{T} < \\frac{B}{T} \\ll 4\\%$, compared to traditional contiguous allocation waste $W_{\\text{trad}} = L_{\\text{max}} - T$.\n\nInput Format:\n- `token_chunks`: Array of integers representing token counts in incoming sequence chunks.\n- `block_size`: Integer size (token count) per physical KV-cache page (default: 4).\n\nOutput Format:\n- Returns an array of physical block IDs assigned to the sequence in the block table.\n\nEdge Cases & Constraints:\n- Exact multiple of `block_size`: When token count is an exact multiple ($T \\pmod B = 0$), no extra trailing block is allocated.\n- Partial block filling: The last allocated physical page stores partial tokens until full.",
    constraints: [
      "1 <= block_size <= 64",
      "1 <= token_chunks.length <= 128",
      "1 <= token_chunks[i] <= 1024",
    ],
    examples: [
      {
        kind: "basic",
        title: "PagedAttention 18 Tokens into Block Size 4",
        inputDisplay: "token_chunks = [4, 3, 5, 2, 4], block_size = 4",
        outputDisplay: "block_table = [0, 1, 2, 3, 4] (5 physical blocks allocated)",
        input: DEFAULT_PAGEDATTENTIONBLOCKTABLEALLOCATOR_INPUT,
        output: "[0, 1, 2, 3, 4]",
        explanation:
          "18 tokens require ceil(18 / 4) = 5 physical pages. Dynamic page allocation triggers at token offsets 0, 4, 8, 12, 16.",
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
          body: "Autoregressive LLM generation requires storing computed Keys and Values for all past tokens to prevent redundant attention computation. Traditional frameworks pre-allocate a contiguous memory tensor sized for $L_{\\text{max}}$ for every sequence. Because generation lengths are unpredictable, this causes severe external memory fragmentation (unallocated space reserved for sequences that terminate early) and internal fragmentation (unused space inside oversized allocations). PagedAttention eliminates these inefficiencies by introducing virtual memory paging to GPU VRAM.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "The PagedAttention allocator manages a physical block pool of GPU memory pages (e.g., each block storing KV tensors for $B = 16$ tokens). Each active sequence maintains a dynamic Block Table—an array mapping logical token block indices ($0, 1, 2 \\dots$) to non-contiguous physical block IDs (e.g., $42, 7, 108$). When a sequence requires a new token, the allocator checks if the current physical block has space available ($t \\pmod B = 0$). If full, it requests a new physical block from the global free pool and appends the block ID to the sequence's Block Table.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "By allowing physical KV cache blocks to reside anywhere in non-contiguous VRAM, PagedAttention reduces memory waste from $>60\\%$ down to under $4\\%$ (limited only to internal fragmentation in the very last block of a sequence). This dramatic memory saving allows serving engines to increase batch sizes by $2\\times-4\\times$ on identical GPU hardware, leading to massive throughput improvements in high-concurrency production deployments.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
          body: "Key implementation considerations include selecting optimal block sizes: smaller blocks (e.g., size $B = 8$) minimize internal fragmentation but increase block table overhead and CUDA kernel launch latency; larger blocks (e.g., size $B = 32$) improve Tensor Core vectorization (`LDG.128`) but increase memory waste for short sequences. Furthermore, during beam search or parallel decoding, multiple block tables can point to the exact same physical block IDs with reference counting (Copy-on-Write).",
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
            "An abstraction technique partitioning physical memory into fixed-size pages ($B$ tokens) to prevent fragmentation.",
        },
        {
          term: "Internal Fragmentation",
          definition:
            "Unused memory remaining inside an allocated physical block when total tokens $T$ are not a multiple of block size $B$: $W_{\\text{internal}} = B - (T \\pmod B)$.",
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
