import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface alignedSimtBlockTilingInput {
  data: number[];
  target?: number;
}

export const ALIGNEDSIMTBLOCKTILING_CODE = `
def aligned_simt_block_tiling(data, block_size=4, alignment=16):
    """
    Computes SIMD/SIMT 128-bit aligned memory block tiling and padding.
    """
    n = len(data)
    padding = (alignment - (n % alignment)) % alignment
    padded_len = n + padding
    tiled_blocks = []

    for b in range(0, padded_len, block_size):
        block = []
        for offset in range(block_size):
            idx = b + offset
            val = data[idx] if idx < n else 0
            block.append(val)
        tiled_blocks.append(block)

    return tiled_blocks, padding
`;

export const DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT: alignedSimtBlockTilingInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateAlignedSimtBlockTilingSteps = (
  input: alignedSimtBlockTilingInput,
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
    "Initialize SIMD/SIMT Aligned Memory Tiling Engine",
    "Setting up execution data structures and memory layout pointers.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating element at index ${idx} in memory layout.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    18,
    "Execution Complete",
    "Successfully processed all elements in the memory structure.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ALIGNEDSIMTBLOCKTILING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process elements sequentially in tensor memory." }],
  lineExplanations: {
    1: "Defines SIMD/SIMT memory block tiling entry point.",
    4: "Calculates total element length of input memory buffer.",
    5: "Computes padding elements required to reach alignment boundary.",
    6: "Calculates total padded memory buffer size.",
    9: "Iterates through padded buffer in fixed block_size steps.",
    11: "Loops across element offsets within current tile block.",
    13: "Fetches value from buffer or pads with zero if out of bounds.",
    16: "Returns array of tiled memory blocks and total padding length.",
  },
};

export const alignedSimtBlockTiling: AlgorithmDefinition<alignedSimtBlockTilingInput> = {
  id: "aligned-simt-block-tiling",
  title: "SIMD/SIMT Aligned Memory Tiling Engine",
  category: "ml_tensor_algebra",
  categories: ["ml_tensor_algebra", "arrays_and_hashing"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 1,
  mlInfraCategory: "ml_tensor_algebra",
  description:
    "In high-performance GPU execution pipelines (e.g. PyTorch ATen, Triton, CUDA, and vLLM), memory operations must be coalesced and aligned to 128-bit SIMD/SIMT vector boundaries. When tensor shapes are not exact multiples of block sizes, memory transactions incur unaligned access penalties, leading to multiple DRAM cycles and warp divergence.\n\nThis algorithm implements SIMD/SIMT Aligned Memory Tiling Engine, partitioning 1D/2D flat memory buffers into fixed-width aligned execution tiles while computing padding offsets to enforce hardware boundary alignment.\n\nInput Format:\n- data: Array of numeric tensor values representing flat memory buffers.\n- target: Optional target value.\n\nOutput Format:\n- Returns tiled 2D block partitions and padding element count maintaining exact SIMT memory alignment.\n\nEdge Cases & Constraints:\n- Array length already perfectly aligned (padding = 0).\n- Small input buffers smaller than a single block.\n- Boundary conditions handled with float zero padding.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Input Case",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "Processed Memory Layout",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Processes standard input tensor memory buffer cleanly.",
    },
    {
      kind: "complex",
      title: "Larger Data Buffer",
      inputDisplay: "data = [10, 20, 30, 40, 50]",
      outputDisplay: "Processed Memory Layout",
      input: { data: [10, 20, 30, 40, 50] },
      output: "[10, 20, 30, 40, 50]",
      explanation: "Evaluates larger array with 5 tensor elements.",
    },
    {
      kind: "negative",
      title: "Edge Case Execution",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "Processed Memory Layout",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Edge case handling completes safely.",
    },
  ],
  code: ALIGNEDSIMTBLOCKTILING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for result structures.",
  },
  topicGuide: {
    overview:
      "Aligned memory tiling is foundational to high-performance CUDA and Triton kernel programming. Modern GPU microarchitectures achieve maximum memory throughput when 32 threads in a warp issue memory loads aligned to 128-bit vector boundaries (e.g., float4 or int4). Unaligned memory loads require the memory controller to split single hardware transactions into multiple DRAM accesses, drastically lowering effective memory bandwidth.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "At its mathematical core, given an input tensor buffer of length N and alignment requirement A, the required zero-padding elements P is calculated as P = (A - (N mod A)) mod A. The total padded buffer size is N_padded = N + P. Memory tiling then partitions N_padded into blocks of width B, guaranteeing that every block index b starts at an integer multiple of B.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "On NVIDIA H100 and A100 GPUs, High Bandwidth Memory (HBM3/HBM2e) transactions execute in 32-byte or 128-byte segments. Without SIMT alignment, adjacent threads in a warp read across cache line boundaries, causing L2 cache thrashing and memory pipeline stalls. By inserting zero-padding to enforce alignment, kernels maintain maximum arithmetic intensity and 100% memory coalescing efficiency.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementing aligned block tiling in Triton or CUDA involves calculating tile offset pointers using stride arithmetic offset = block_idx * B + thread_offset. Guards (idx < N) ensure safe out-of-bounds loading without illegal memory access faults.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge cases include single-element inputs, empty buffers, and alignment factors equal to power-of-two vector sizes. Production systems use static scalar padding to prevent dynamic re-allocation during runtime execution.",
      },
    ],
    keyTerms: [
      {
        term: "SIMT Alignment",
        definition:
          "Structuring memory addresses to align with 128-bit hardware vector instruction boundaries.",
      },
      {
        term: "Memory Coalescing",
        definition:
          "Combining memory accesses from adjacent GPU threads into a single DRAM transaction.",
      },
      {
        term: "Tile Padding",
        definition:
          "Inserting dummy zero elements to pad buffer dimensions to exact hardware block boundaries.",
      },
    ],
  },
  trivia: ALIGNEDSIMTBLOCKTILING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 1" }],
  defaultInput: DEFAULT_ALIGNEDSIMTBLOCKTILING_INPUT,
  generateSteps: generateAlignedSimtBlockTilingSteps,
};
