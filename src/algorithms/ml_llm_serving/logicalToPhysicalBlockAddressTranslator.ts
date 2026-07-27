import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface logicalToPhysicalBlockAddressTranslatorInput {
  token_index: number;
  block_size: number;
  block_table: number[];
}

export const LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_CODE = `def logical_to_physical_block_address_translator(token_index, block_size=16, block_table=None):
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
    }`;

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

  const { token_index, block_size, block_table: inputTable } = input;
  const block_table = inputTable || [102, 405, 89];

  const elements: ArrayElement[] = block_table.map((physId, logIdx) => ({
    id: `block-${logIdx}`,
    value: `Logical Block ${logIdx} -> Physical Page #${physId}`,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeLogIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = elements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (idx === activeLogIdx) state = "active";
      else if (activeLogIdx >= 0 && idx < activeLogIdx) state = "visited";
      return {
        ...el,
        state,
        pointers: pointersMap[idx] || undefined,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: updatedElements,
      },
      auxiliaryState: {
        customState: {
          token_index: String(token_index),
          block_size: String(block_size),
          block_table: `[${block_table.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Enter logical_to_physical_block_address_translator function",
    "Initializing PagedAttention virtual memory address translator for logical token index.",
    { token_index, block_size, table_len: block_table.length },
  );

  addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Translates a logical sequence token index into physical GPU VRAM block address a",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "See the Python docstring for the contract and purpose of this algorithm.",
    {},
  );

  addStep(
    4,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  // Step 2: Check block_table None
  addStep(
    5,
    "Check if block_table is None",
    "Verifying block_table parameter.",
    { is_none: false },
  );

  // Step 3: Default block_table
  addStep(
    6,
    `Set block_table = [${block_table.join(", ")}]`,
    "Active sequence block table loaded into local frame.",
    { block_table: block_table.join(", ") },
  );

  // Step 4: Token index read
  addStep(
    8,
    `Read token_index = ${token_index}`,
    `Logical token offset $t = ${token_index}$ within sequence.`,
    { token_index },
  );

  // Step 5: Block size read
  addStep(
    8,
    `Read block_size = ${block_size}`,
    `Physical page capacity $B = ${block_size}$ tokens.`,
    { block_size },
  );

  // Step 6: Division calculation
  const divVal = token_index / block_size;
  addStep(
    8,
    `Compute token_index / block_size = ${token_index} / ${block_size} = ${divVal.toFixed(2)}`,
    "Floating-point division to find block boundary ratio.",
    { div_val: Number(divVal.toFixed(2)) },
  );

  // Step 7: Logical block index floor
  const logical_block_idx = Math.floor(token_index / block_size);
  addStep(
    8,
    `Compute logical_block_idx = token_index // block_size -> ${logical_block_idx}`,
    `Logical block index $i = \\lfloor ${token_index} / ${block_size} \\rfloor = ${logical_block_idx}$.`,
    { logical_block_idx },
  );

  // Step 8: Modulo calculation
  const block_offset = token_index % block_size;
  addStep(
    9,
    `Compute block_offset = token_index % block_size -> ${block_offset}`,
    `Token offset within physical block $o = ${token_index} \\pmod{${block_size}} = ${block_offset}$.`,
    { block_offset },
  );

  // Step 9: Read table length
  addStep(
    11,
    `Read len(block_table) -> ${block_table.length}`,
    `Block table has ${block_table.length} allocated physical page slots.`,
    { table_length: block_table.length },
  );

  // Step 10: Boundary check
  const isOutOfBounds = logical_block_idx >= block_table.length;
  addStep(
    11,
    `Check condition: logical_block_idx (${logical_block_idx}) >= len(block_table) (${block_table.length}) -> ${isOutOfBounds}`,
    isOutOfBounds
      ? "Page fault! Logical block index exceeds block table size."
      : `Bounds valid! Logical block index ${logical_block_idx} is within allocated block table bounds.`,
    { isOutOfBounds },
  );

  if (isOutOfBounds) {
    addStep(
      12,
      "Raise IndexError",
      "Token index exceeds allocated logical block table bounds.",
      { error: "IndexError" },
    );
    return steps;
  }

  // Step 11: Inspect block table entries
  for (let b = 0; b < block_table.length; b++) {
    const isTarget = b === logical_block_idx;
    addStep(
      14,
      `Inspect Block Table entry at index [${b}]: physical_block_id = ${block_table[b]}`,
      isTarget
        ? `FOUND TARGET BLOCK! Logical index [${b}] maps to Physical Page #${block_table[b]}.`
        : `Logical index [${b}] maps to Physical Page #${block_table[b]}.`,
      { log_idx: b, phys_id: block_table[b], isTarget },
      b,
      { [b]: isTarget ? ["TARGET_LOGICAL_BLOCK"] : [] },
    );
  }

  const physical_block_id = block_table[logical_block_idx];

  // Step 12: Calculate base physical address
  const baseSlot = physical_block_id * block_size;
  addStep(
    15,
    `Compute base physical slot = physical_block_id * block_size = ${physical_block_id} * ${block_size} = ${baseSlot}`,
    `Base physical VRAM token slot offset for Physical Page #${physical_block_id}.`,
    { physical_block_id, block_size, baseSlot },
    logical_block_idx,
  );

  // Step 13: Add block offset
  const physical_token_slot = baseSlot + block_offset;
  addStep(
    15,
    `Compute physical_token_slot = base_slot (${baseSlot}) + block_offset (${block_offset}) -> ${physical_token_slot}`,
    `Absolute physical GPU VRAM slot address: $\\text{Slot}_{\\text{phys}} = ${physical_block_id} \\cdot ${block_size} + ${block_offset} = ${physical_token_slot}$.`,
    { physical_token_slot },
    logical_block_idx,
    { [logical_block_idx]: [`slot=${physical_token_slot}`] },
  );

  // Step 14: Return dict construct
  addStep(
    17,
    "Construct return dictionary",
    "Packaging address translation metrics into result dictionary.",
    { token_index, logical_block_idx, block_offset, physical_block_id, physical_token_slot },
    logical_block_idx,
  );

  // Step 15: Set token_index
  addStep(18, `Set 'token_index': ${token_index}`, "Original logical token index.", { token_index }, logical_block_idx);

  // Step 16: Set logical_block_idx
  addStep(19, `Set 'logical_block_idx': ${logical_block_idx}`, "Computed logical block table index.", { logical_block_idx }, logical_block_idx);

  // Step 17: Set block_offset
  addStep(20, `Set 'block_offset': ${block_offset}`, "Token offset within page.", { block_offset }, logical_block_idx);

  // Step 18: Set physical_block_id
  addStep(21, `Set 'physical_block_id': ${physical_block_id}`, "Mapped physical GPU VRAM page ID.", { physical_block_id }, logical_block_idx);

  // Step 19: Set physical_token_slot
  addStep(22, `Set 'physical_token_slot': ${physical_token_slot}`, "Absolute VRAM slot address for KV cache kernel.", { physical_token_slot }, logical_block_idx);

  // Step 20: Final return
  addStep(
    23,
    "Return completed address translation dictionary",
    `Address translation complete! Token ${token_index} -> Physical Page #${physical_block_id}, Offset ${block_offset} (Absolute VRAM Slot ${physical_token_slot}).`,
    {
      token_index,
      logical_block_idx,
      block_offset,
      physical_block_id,
      physical_token_slot,
    },
    logical_block_idx,
  );

  return steps;
};

const LOGICALTOPHYSICALBLOCKADDRESSTRANSLATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 7, 10, 13, 16],
  distractors: [
    "logical_block_idx = token_index % block_size",
    "block_offset = token_index // block_size",
    "physical_token_slot = physical_block_id + block_offset",
    "if logical_block_idx < len(block_table): raise IndexError()",
  ],
  hints: [
    { line: 8, hint: "Compute logical block index via integer division: token_index // block_size." },
    { line: 9, hint: "Compute offset within block via modulo: token_index % block_size." },
    { line: 15, hint: "Calculate absolute physical VRAM slot address as physical_block_id * block_size + block_offset." },
  ],
  lineExplanations: {
    1: "Function signature for PagedAttention Logical to Physical Address Translator taking token_index, block_size, and block_table.",
    2: "Begin docstring describing PagedAttention address translation mechanism.",
    3: "Docstring line detailing translation of logical sequence token index to physical GPU VRAM slot address.",
    4: "End docstring.",
    5: "Check if block_table parameter is None.",
    6: "Initialize default block_table mapping array if None provided.",
    7: "Blank line before coordinate calculations.",
    8: "Calculate logical block table index using integer division: logical_block_idx = token_index // block_size.",
    9: "Calculate token offset within block using modulo: block_offset = token_index % block_size.",
    10: "Blank line before bounds checking.",
    11: "Check if logical_block_idx exceeds allocated block_table bounds.",
    12: "Raise IndexError if token index exceeds allocated block table capacity.",
    13: "Blank line before physical address lookup.",
    14: "Retrieve mapped physical GPU VRAM block ID from block_table[logical_block_idx].",
    15: "Calculate absolute physical VRAM token slot address: physical_token_slot = physical_block_id * block_size + block_offset.",
    16: "Blank line before return dictionary construction.",
    17: "Start returning result dictionary containing address translation metrics.",
    18: "Set 'token_index' in return dictionary.",
    19: "Set 'logical_block_idx' in return dictionary.",
    20: "Set 'block_offset' in return dictionary.",
    21: "Set 'physical_block_id' in return dictionary.",
    22: "Set 'physical_token_slot' in return dictionary.",
    23: "Complete return of dictionary to caller.",
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
      "PagedAttention (Kwon et al., vLLM) introduces virtual memory paging to LLM serving KV-caches. In traditional LLM serving engines, KV-cache memory for a request is allocated as a contiguous memory block in GPU VRAM based on the maximum context length (e.g. 4096 tokens). Because actual sequence lengths are unpredictable, this causes severe external and internal memory fragmentation (wasting 60%-80% of VRAM).\n\nPagedAttention divides the KV cache into fixed-size physical blocks (e.g., $B = 16$ tokens per block). Non-contiguous physical GPU VRAM blocks are mapped to contiguous logical token indices via per-sequence Block Tables. For any logical token index $t$:\n1. **Logical Block Index**: $i_{\\text{logical}} = \\lfloor t / B \\rfloor$\n2. **Block Offset**: $o = t \\pmod B$\n3. **Physical Block ID**: $P = \\text{BlockTable}[i_{\\text{logical}}]$\n4. **Absolute Physical VRAM Slot**: $\\text{Slot}_{\\text{phys}} = P \\cdot B + o$\n\n### Input Parameters\n- `token_index`: Logical integer index of token $t$ in sequence (0-indexed).\n- `block_size`: Number of tokens stored per physical block $B$.\n- `block_table`: Array mapping logical block index -> physical GPU block ID.\n\n### Output\n- Returns dictionary containing `token_index`, `logical_block_idx`, `block_offset`, `physical_block_id`, and `physical_token_slot`.",
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
      time: "$O(1)$ constant time integer division and array lookup.",
      space: "$O(1)$ constant memory allocation.",
    },
    topicGuide: {
      overview:
        "PagedAttention Address Translators map dynamic, contiguous logical token indices into non-contiguous physical GPU VRAM memory pages.",
      sections: [
        {
          heading: "Overview & Virtual Memory Inspiration",
          body: "Virtual memory is a foundational concept in Operating Systems that translates virtual addresses to physical RAM pages via page tables. PagedAttention adapts this concept to GPU VRAM for Large Language Model serving. Instead of requiring contiguous memory for growing KV-caches, PagedAttention allocates fixed-size memory blocks dynamically.",
        },
        {
          heading: "Translation Algorithm & Math",
          body: "Each sequence maintains a Logical Block Table. Given token index $t$ and block size $B$, the translator computes:\n1. Logical Block Index: $i = \\lfloor t / B \\rfloor$\n2. Block Offset: $o = t \\pmod B$\n3. Physical Block: $P = \\text{Table}[i]$\n4. Physical VRAM Slot: $\\text{Slot}_{\\text{phys}} = P \\cdot B + o$",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "PagedAttention reduces VRAM memory fragmentation from 60-80% down to under 4% (limited only to the last un-filled block of a sequence). This space reclamation enables serving engines to increase batch sizes by 2x-4x, doubling total system output throughput.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key system details include selecting block size $B$ ($B=16$ or $B=32$ balances memory overhead against GPU SIMD cache line locality), Copy-on-Write for branch forks in parallel beam search, and low-latency CUDA kernel execution.",
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

export default logicalToPhysicalBlockAddressTranslator;
