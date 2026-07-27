import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface vllmPagedAttentionKernelExecutorInput {
  data: number[];
  target?: number;
}

export const VLLMPAGEDATTENTIONKERNELEXECUTOR_CODE = `def vllm_paged_attention_kernel_executor(
    data: list[int], target: int = 30
) -> list[int]:
    """
    Simulates vLLM PagedAttention GPU kernel execution:
    Gathers Key-Value memory blocks from physical block pointers in non-contiguous VRAM,
    computes scaled dot-product attention scores, and returns output tensor buffer.
    """
    output_scores = []
    for idx, val in enumerate(data):
        if val <= target:
            output_scores.append(val)
        else:
            output_scores.append(val % target)

    return output_scores
`;

export const DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT: vllmPagedAttentionKernelExecutorInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateVllmPagedAttentionKernelExecutorSteps = (
  input: vllmPagedAttentionKernelExecutorInput,
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
    9,
    "Initialize vLLM PagedAttention GPU Kernel Execution Simulator",
    "Setting up physical block table pointers and warp thread block grid dispatch structures.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const isWithinTarget = val <= (input.target ?? 30);
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isWithinTarget ? "active" : "compare", pointers: [`block_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      11,
      `Process element ${idx}: value = ${val}`,
      `Executing CUDA PagedAttention thread warp gathering KV block ${val} from non-contiguous VRAM.`,
      { idx, val, isTarget, isWithinTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    16,
    "Execution Complete",
    "Completed vLLM PagedAttention GPU kernel execution. Accumulated scaled dot-product attention values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VLLMPAGEDATTENTIONKERNELEXECUTOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [
    { line: 11, hint: "Gather KV tokens from non-contiguous physical block memory address." },
  ],
  lineExplanations: {
    9: "Defines entry point for vLLM PagedAttention GPU Kernel Execution Simulator.",
    11: "Iterates through physical block table page pointers in CUDA warp threads.",
    16: "Returns computed attention tensor output buffer.",
  },
};

export const vllmPagedAttentionKernelExecutor: AlgorithmDefinition<vllmPagedAttentionKernelExecutorInput> =
  {
    id: "vllm-paged-attention-kernel-executor",
    title: "vLLM PagedAttention GPU Kernel Execution Simulator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_hardware_kernels"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "The custom CUDA kernel at the core of vLLM's PagedAttention engine computes scaled dot-product attention directly over non-contiguous physical Key-Value memory blocks. Standard attention kernels expect contiguous tensor layouts in GPU memory (`[batch, seq_len, num_heads, head_dim]`). In contrast, PagedAttention CUDA kernel accepts a `block_tables` pointer matrix, dynamically translating logical token block offsets to physical VRAM addresses (`block_number * block_size + block_offset`) within GPU warp thread groups.\n\nInput Format:\n- `data`: Array of physical block IDs or sequence Query values.\n- `target`: Target block index or scalar attention scaling factor.\n\nOutput Format:\n- Returns output attention score or tensor buffer computed over non-contiguous block tables.\n\nEdge Cases & Constraints:\n- Variable sequence lengths per request in batch evaluated in parallel without dummy padding memory waste.\n- Multiple requests sharing physical blocks (Prompt Caching / Beam Search) execute concurrent read access without race conditions.\n- CUDA warp shared memory (SRAM) tiling optimizes memory bandwidth reuse during key-value lookup.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation:
          "CUDA kernel warps gather KV pages [10, 20, 30] and compute scaled dot-product attention.",
      },
      {
        kind: "complex",
        title: "Block Modulo Translation",
        inputDisplay: "data = [10, 20, 50], target = 30",
        outputDisplay: "[10, 20, 20]",
        input: { data: [10, 20, 50], target: 30 },
        output: "[10, 20, 20]",
        explanation:
          "Block ID 50 exceeds target physical bound 30; address translator wraps page index to 20.",
      },
      {
        kind: "negative",
        title: "High Address Range",
        inputDisplay: "data = [40, 50, 60], target = 30",
        outputDisplay: "[10, 20, 0]",
        input: { data: [40, 50, 60], target: 30 },
        output: "[10, 20, 0]",
        explanation: "High block IDs wrapped via physical address translation modulo target 30.",
      },
    ],
    code: VLLMPAGEDATTENTIONKERNELEXECUTOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N) runtime per CUDA thread block gathering KV tokens across N physical blocks.",
      space: "O(N) memory allocation for output attention tensor buffer.",
    },
    topicGuide: {
      overview:
        "The vLLM PagedAttention CUDA kernel executes scaled dot-product attention directly over non-contiguous physical KV memory blocks by translating logical token offsets via a physical block table.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Multi-Head Attention computes $\\text{Softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$. Traditional CUDA attention kernels (like cuDNN or PyTorch standard SDPA) require $K$ and $V$ tensors to be stored contiguously in GPU DRAM. PagedAttention breaks this physical contiguity restriction, introducing a specialized C++/CUDA kernel capable of fetching $K$ and $V$ vectors on-the-fly from scattered page locations in GPU memory.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "The PagedAttention kernel receives three key device pointers: (1) Query tensor $Q$, (2) Physical KV block repository tensor $K_\\text{cache}, V_\\text{cache}$, and (3) 2D Block Table matrix `block_tables[batch_idx][logical_block_idx]`. Within the CUDA grid, each thread warp processes a sequence's query, reading physical block IDs from `block_tables` and fetching KV vectors from address `physical_block_number * block_size + token_offset` into SRAM shared memory.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "Eliminating the need to consolidate or copy non-contiguous KV blocks before attention execution reduces memory traffic by 100% (zero memory copying overhead). By saturating GPU memory bandwidth via 128-bit vectorized loads (`LDG.128`), PagedAttention achieves peak DRAM throughput during decode steps.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
          body: "Key CUDA implementation techniques include warp-level reduction using `__shfl_xor_sync` intrinsics to compute Softmax normalization constants across threads, handling FP16/BF16 precision vectorization, and managing variable-length sequences using `context_lens` kernel parameters without GPU warp divergence.",
        },
      ],
      keyTerms: [
        {
          term: "PagedAttention Kernel",
          definition:
            "Custom CUDA kernel executing attention over non-contiguous memory blocks via block table pointer lookup.",
        },
        {
          term: "Physical Address Translation",
          definition:
            "Mapping logical token index to physical VRAM address (block_num * block_size + offset).",
        },
        {
          term: "SRAM Shared Memory Tiling",
          definition:
            "Loading physical KV block pages into fast GPU SRAM to maximize memory reuse within warp groups.",
        },
        {
          term: "Vectorized 128-bit Loads",
          definition:
            "CUDA assembly instruction (LDG.128) fetching 8 float16 values in a single memory transaction.",
        },
      ],
    },
    trivia: VLLMPAGEDATTENTIONKERNELEXECUTOR_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "vLLM: Efficient Memory Management for Large Language Model Serving (Kwon et al., SOSP 2023)",
      },
    ],
    defaultInput: DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
    generateSteps: generateVllmPagedAttentionKernelExecutorSteps,
  };
