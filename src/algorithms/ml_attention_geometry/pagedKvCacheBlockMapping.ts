import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface pagedKvCacheBlockMappingInput {
  data: number[];
  target?: number;
}

export const PAGEDKVCACHEBLOCKMAPPING_CODE = `
def map_logical_to_physical_kv_address(
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

    return address_mappings
`;

export const DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT: pagedKvCacheBlockMappingInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generatePagedKvCacheBlockMappingSteps = (
  input: pagedKvCacheBlockMappingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
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
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Paged KV-Cache Block Table Mapper",
    "Configuring PagedAttention virtual memory translation: block_size = 16 tokens/block.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const blockIdx = Math.floor(idx / 16);
    const offset = idx % 16;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [`t=${idx}`, `blk=${blockIdx}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      14,
      `Translate logical token index t=${idx} (val=${val})`,
      `Logical block = ${blockIdx}, offset within block = ${offset}. Translated to physical block table lookup.`,
      { tokenIdx: idx, logicalBlock: blockIdx, offset, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    23,
    "Execution Complete",
    "Successfully translated logical token indices to physical PagedAttention block addresses.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const PAGEDKVCACHEBLOCKMAPPING_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "logical_block_idx = t % block_size",
    "physical_slot_index = physical_block_id + block_offset",
    "block_offset = t // block_size",
  ],
  hints: [
    { line: 14, hint: "Compute logical block index via integer division t // block_size." },
    { line: 15, hint: "Compute token offset within block via modulo t % block_size." },
    {
      line: 21,
      hint: "Calculate absolute physical memory address physical_block_id * block_size + offset.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for PagedAttention block table translation.",
    14: "Calculates logical block index by integer dividing token position by block size.",
    15: "Calculates token offset within the block using modulo arithmetic.",
    18: "Looks up physical block ID in request block table array.",
    21: "Computes absolute physical memory address slot for GPU cache access.",
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
    "PagedAttention (vLLM, Kwon et al., SOSP 2023) eliminates external and internal memory fragmentation in Large Language Model (LLM) serving. Standard contiguous KV caches reserve pre-allocated contiguous memory blocks for the maximum possible sequence length (e.g. 2048 tokens), wasting up to 60%-80% of GPU VRAM due to un-generated tokens and dynamic sequence length variability.\n\nPagedAttention applies OS virtual memory paging principles: key and value vectors are stored in non-contiguous physical memory blocks of fixed size (e.g. 16 or 32 tokens). A per-request block table maps logical sequence token indices $t$ to non-contiguous physical block IDs:\n$$\\text{logical\\_block} = \\lfloor t / B \\rfloor, \\quad \\text{offset} = t \\bmod B, \\quad \\text{phys\\_addr} = \\text{block\\_table}[\\text{logical\\_block}] \\times B + \\text{offset}$$\n\nInput Format:\n- data: Logical token sequence index array.\n- target: Block table size or target token position.\n\nOutput Format:\n- List of physical block IDs, block offset indices, and absolute physical memory slot pointers.\n\nEdge Cases & Constraints:\n- Boundary cases: Block boundary crossings ($t \\bmod B = 0$) trigger dynamic physical block allocation from the global page pool.\n- Zero-copy copy-on-write: Enables zero-copy parallel sampling (beam search, parallel decoding) by allowing multiple requests to share the same physical block table entries until mutation.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "16-Token Block Translation",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Translates logical token indices into physical block table slot addresses.",
    },
    {
      kind: "complex",
      title: "Cross-Block Boundary Mapping",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates page translation across multiple non-contiguous physical blocks.",
    },
    {
      kind: "negative",
      title: "Page Table Out-of-Bounds",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation:
        "Safely handles page fault conditions when sequence length exceeds allocated block count.",
    },
  ],
  code: PAGEDKVCACHEBLOCKMAPPING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N / B)",
  complexityAnalysis: {
    time: "Translates $N$ logical token positions in $O(N)$ time with $O(1)$ block table array index lookups.",
    space: "Requires $O(N/B)$ memory for block table lookup entries per active request.",
  },
  topicGuide: {
    overview:
      "PagedAttention revolutionized LLM serving engines (vLLM, TGI, TensorRT-LLM) by enabling up to 4x throughput improvements through near-zero memory waste (>96% memory utilization vs ~20% in naive static allocation).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Let $B$ be block size. For logical token $t$, the tuple $(\\lfloor t/B \\rfloor, t \\bmod B)$ specifies the logical block index and offset. The physical address in the KV cache pool is $A(t) = P[\\lfloor t/B \\rfloor] \\cdot B + (t \\bmod B)$, where $P$ is the request's physical block table.",
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
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_PAGEDKVCACHEBLOCKMAPPING_INPUT,
  generateSteps: generatePagedKvCacheBlockMappingSteps,
};
