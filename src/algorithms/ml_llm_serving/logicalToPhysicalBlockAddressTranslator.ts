import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface logicalToPhysicalBlockAddressTranslatorInput {
  token_index: number;
  block_size: number;
  block_table: number[];
}

export const LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_CODE = `
def logical_to_physical_block_address_translator(token_index, block_size=16, block_table=None):
    """
    Translates a logical sequence token index into physical GPU VRAM block address and offset using PagedAttention.
    """
    if block_table is None:
        block_table = [102, 405, 89]

    logical_block_idx = token_index // block_size
    block_offset = token_index % block_size

    if logical_block_idx >= len(block_table):
        raise IndexError("Token index exceeds allocated logical block table bounds")

    physical_block_id = block_table[logical_block_idx]
    physical_token_slot = physical_block_id * block_size + block_offset

    return {
        'token_index': token_index,
        'logical_block_idx': logical_block_idx,
        'block_offset': block_offset,
        'physical_block_id': physical_block_id,
        'physical_token_slot': physical_token_slot
    }
`;

export const DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT: logicalToPhysicalBlockAddressTranslatorInput =
  {
    token_index: 35,
    block_size: 16,
    block_table: [102, 405, 89],
  };

export const generateLogicalToPhysicalBlockAddressTranslatorSteps = (
  input: logicalToPhysicalBlockAddressTranslatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.block_table.map((physId, logIdx) => ({
    id: `block-${logIdx}`,
    value: `Logical Block ${logIdx} -> Physical Block #${physId}`,
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
          token_index: String(input.token_index),
          block_size: String(input.block_size),
          block_table: `[${input.block_table.join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize PagedAttention Logical to Physical Address Translator",
    "Loading input token index t, block size B, and sequence block table.",
    { token_index: input.token_index, block_size: input.block_size },
  );

  const logicalBlockIdx = Math.floor(input.token_index / input.block_size);
  const blockOffset = input.token_index % input.block_size;

  const currentElements = elements.map((el) => ({ ...el }));

  addStep(
    11,
    `Calculate Logical Block Index and Offset for token t=${input.token_index}`,
    `Logical block index = floor(${input.token_index} / ${input.block_size}) = ${logicalBlockIdx}. Offset within block = ${input.token_index} mod ${input.block_size} = ${blockOffset}.`,
    {
      token_index: input.token_index,
      logical_block_idx: logicalBlockIdx,
      block_offset: blockOffset,
    },
  );

  if (logicalBlockIdx >= input.block_table.length) {
    addStep(
      14,
      "IndexError: Token index exceeds block table bounds",
      "Token index requires more logical blocks than currently allocated in sequence block table.",
      { logical_block_idx: logicalBlockIdx, table_length: input.block_table.length },
      currentElements,
    );
    return steps;
  }

  const physicalBlockId = input.block_table[logicalBlockIdx];
  const physicalTokenSlot = physicalBlockId * input.block_size + blockOffset;

  currentElements[logicalBlockIdx] = {
    ...currentElements[logicalBlockIdx],
    state: "active",
    pointers: [`TARGET_BLOCK`, `phys_id=${physicalBlockId}`, `slot=${physicalTokenSlot}`],
  };

  addStep(
    16,
    `Lookup Physical Block ID #${physicalBlockId} in Block Table`,
    `Block table at index ${logicalBlockIdx} maps to GPU physical VRAM block #${physicalBlockId}.`,
    { logical_block_idx: logicalBlockIdx, physical_block_id: physicalBlockId },
    currentElements,
  );

  const finalElements = currentElements.map((el) => ({
    ...el,
    state: "sorted" as const,
  }));

  addStep(
    17,
    "Execution Complete",
    `Address translation complete. Logical token index ${input.token_index} translates to Physical VRAM Slot ${physicalTokenSlot} (Block #${physicalBlockId}, Offset ${blockOffset}).`,
    {
      token_index: input.token_index,
      physical_block_id: physicalBlockId,
      block_offset: blockOffset,
      physical_token_slot: physicalTokenSlot,
    },
    finalElements,
  );

  return steps;
};

const LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "logical_block_idx = token_index % block_size # confusing modulo and division",
    "physical_token_slot = physical_block_id + block_offset # missing block_size stride multiplier",
    "block_offset = token_index // block_size",
  ],
  hints: [
    {
      line: 11,
      hint: "Logical block index is floor(token_index / block_size); offset is token_index % block_size.",
    },
  ],
  lineExplanations: {
    1: "Entry point for PagedAttention Logical to Physical Address Translator.",
    11: "Calculates logical block index and token offset within block.",
    14: "Validates that requested logical block exists within allocated sequence block table.",
    16: "Retrieves physical block ID from sequence logical block table.",
    17: "Calculates absolute physical VRAM token slot index.",
  },
};

export const logicalToPhysicalBlockAddressTranslator: AlgorithmDefinition<logicalToPhysicalBlockAddressTranslatorInput> =
  {
    id: "logical-to-physical-block-address-translator",
    title: "PagedAttention Logical to Physical Address Translator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "PagedAttention (Kwon et al., vLLM) introduces virtual memory paging to LLM serving KV-caches. In traditional LLM serving engines, KV-cache memory for a request is allocated as a contiguous memory block in GPU VRAM based on the maximum context length (e.g. 4096 tokens). Because actual sequence lengths are unpredictable, this causes severe external and internal memory fragmentation (wasting 60%-80% of VRAM).\n\nPagedAttention divides the KV cache into fixed-size physical blocks (e.g., B = 16 tokens per block). Non-contiguous physical GPU VRAM blocks are mapped to contiguous logical token indices via per-sequence Block Tables. For any logical token index t:\n  1. Logical Block Index: i_logical = floor(t / B)\n  2. Block Offset: o = t mod B\n  3. Physical Block ID: P = BlockTable[i_logical]\n  4. Absolute Physical VRAM Slot: Slot_phys = P * B + o\n\nInput Format:\n- token_index: Logical integer index of token t in sequence (0-indexed).\n- block_size: Number of tokens stored per physical block B (e.g. 16).\n- block_table: Array mapping logical block index -> physical GPU block ID.\n\nOutput Format:\n- Returns a dictionary with token_index, logical_block_idx, block_offset, physical_block_id, and physical_token_slot.\n\nEdge Cases & Constraints:\n- Out-of-bounds access: If logical_block_idx >= block_table.length, raises IndexError (triggering page fault allocation).\n- Block alignment: Token index 0 maps to physical_block_id = block_table[0] with offset 0.",
    constraints: [
      "0 <= token_index <= 1048576",
      "1 <= block_size <= 64",
      "1 <= block_table.length <= 65536",
    ],
    examples: [
      {
        kind: "basic",
        title: "Token Index 35 in Block Size 16 Table",
        inputDisplay: "token_index=35, block_size=16, block_table=[102, 405, 89]",
        outputDisplay: "Logical Block: 2, Offset: 3, Physical Block ID: 89, Physical Slot: 1427",
        input: {
          token_index: 35,
          block_size: 16,
          block_table: [102, 405, 89],
        },
        output: "Physical Block: 89, Slot: 1427",
        explanation:
          "35 // 16 = block 2. 35 % 16 = offset 3. BlockTable[2] = 89. Physical slot = 89 * 16 + 3 = 1427.",
      },
      {
        kind: "complex",
        title: "First Token Alignment",
        inputDisplay: "token_index=0, block_size=16, block_table=[50]",
        outputDisplay: "Logical Block: 0, Offset: 0, Physical Block ID: 50, Slot: 800",
        input: {
          token_index: 0,
          block_size: 16,
          block_table: [50],
        },
        output: "Physical Block: 50, Slot: 800",
        explanation:
          "Token 0 maps directly to physical block 50 at offset 0 (slot = 50 * 16 + 0 = 800).",
      },
    ],
    code: LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) constant time integer division and array lookup.",
      space: "O(1) constant memory allocation.",
    },
    topicGuide: {
      overview:
        "PagedAttention Address Translators map dynamic, contiguous logical token indices into non-contiguous physical GPU VRAM memory pages.",
      sections: [
        {
          heading: "Overview",
          body: "Virtual memory is a foundational concept in Operating Systems that translates virtual addresses to physical RAM pages via page tables. PagedAttention adapts this concept to GPU VRAM for Large Language Model serving. Instead of requiring contiguous memory for growing KV-caches, PagedAttention allocates fixed-size memory blocks dynamically.",
        },
        {
          heading: "Core Concepts",
          body: "Each sequence maintains a Logical Block Table. Given token index t and block size B, the translator computes: Logical Block Index i = floor(t / B), Offset o = t mod B, Physical Block P = Table[i], and Physical Slot = P * B + o.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "PagedAttention reduces VRAM memory fragmentation from 60-80% down to under 4% (limited only to the last un-filled block of a sequence). This space reclamation enables serving engines to increase batch sizes by 2x-4x, doubling total system output throughput.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key system details include selecting block size B (B=16 or B=32 balances memory overhead against GPU SIMD cache line locality), Copy-on-Write for branch forks in parallel beam search, and low-latency CUDA kernel execution.",
        },
      ],
      keyTerms: [
        {
          term: "PagedAttention Virtual Memory",
          definition:
            "Memory management technique storing KV caches in non-contiguous physical GPU blocks.",
        },
        {
          term: "Logical Block Table",
          definition:
            "Per-sequence page table mapping sequence logical block indices to GPU physical block IDs.",
        },
        {
          term: "Physical Block ID",
          definition: "Unique index identifying a fixed-size memory page in GPU VRAM pool.",
        },
        {
          term: "Block Offset",
          definition:
            "Relative position of a token within a physical KV block (0 <= offset < block_size).",
        },
      ],
    },
    trivia: LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_INPUT,
    generateSteps: generateLogicalToPhysicalBlockAddressTranslatorSteps,
  };
