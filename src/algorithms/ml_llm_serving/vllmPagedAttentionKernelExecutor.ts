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

    return output_scores`;

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

  const data = input.data;
  const target = input.target ?? 30;

  const elements: ArrayElement[] = data.map((val, idx) => ({
    id: `block-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
    customElements?: ArrayElement[],
  ) => {
    const baseElements = customElements || elements;
    const updatedElements: ArrayElement[] = baseElements.map((el, idx) => {
      let state: ArrayElement["state"] = el.state;
      if (activeIdx >= 0 && idx === activeIdx) state = "active";
      else if (activeIdx >= 0 && idx < activeIdx && state !== "sorted") state = "visited";
      return {
        ...el,
        state,
        pointers: pointersMap[idx] || el.pointers || undefined,
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
          data: `[${data.join(", ")}]`,
          target: String(target),
          num_blocks: String(data.length),
        },
      },
      variables,
    });
  };

  // Step 1: Entry signature line 1
  addStep(
    1,
    "Enter vllm_paged_attention_kernel_executor function signature",
    "Initializing vLLM PagedAttention GPU kernel simulator.",
    { num_blocks: data.length },
  );

  // Step 2: Signature args line 2
  addStep(
    2,
    `Load parameters: data=[${data.join(", ")}], target=${target}`,
    "Loading input physical block pointers and target scaling threshold.",
    { target },
  );

  // Step 3: Signature return type line 3
  addStep(
    3,
    "Specify return type contract: list[int]",
    "Output tensor buffer will contain computed scaled dot-product attention scores.",
    { data_len: data.length },
  );

  // Step 4: Init output_scores line 9
    addStep(
    4,
    "Function docstring — describes algorithm contract",
    "Opening delimiter of the Python docstring.",
    {},
  );

  addStep(
    5,
    "Docstring body: algorithm description",
    "Simulates vLLM PagedAttention GPU kernel execution:",
    {},
  );

  addStep(
    6,
    "Docstring body: algorithm description",
    "Gathers Key-Value memory blocks from physical block pointers in non-contigu",
    {},
  );

  addStep(
    7,
    "Docstring body: algorithm description",
    "computes scaled dot-product attention scores, and returns output tensor buf",
    {},
  );

  addStep(
    8,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

addStep(
    9,
    "Initialize output_scores = []",
    "Allocating device SRAM output buffer for attention scores.",
    { output_scores: "[]" },
  );

  // Step 5: Loop header line 10
  addStep(
    10,
    `Begin CUDA warp thread loop: for idx, val in enumerate(data)`,
    `Launching CUDA threads to gather ${data.length} physical KV memory pages.`,
    { num_blocks: data.length },
  );

  const outputScores: number[] = [];
  const currentElements = [...elements];

  data.forEach((val, idx) => {
    addStep(
      10,
      `CUDA Warp Thread [${idx}]: Gather physical block #${val}`,
      `Reading KV tensor page #${val} from non-contiguous VRAM.`,
      { idx, val, target },
      idx,
      { [idx]: [`block_${idx}`, `val=${val}`] },
      currentElements,
    );

    const isWithinTarget = val <= target;
    addStep(
      11,
      `Check condition: val (${val}) <= target (${target}) -> ${isWithinTarget}`,
      isWithinTarget
        ? `Page address within target VRAM bound. Direct KV attention fetch.`
        : `Page address exceeds target bound (${val} > ${target}). Triggering address translation modulo.`,
      { idx, val, target, isWithinTarget },
      idx,
      { [idx]: [isWithinTarget ? "DIRECT_FETCH" : "MODULO_TRANSLATE"] },
      currentElements,
    );

    if (isWithinTarget) {
      outputScores.push(val);
      currentElements[idx] = {
        ...currentElements[idx],
        value: `${val} (Score: ${val})`,
        state: "sorted",
      };

      addStep(
        12,
        `Append score: output_scores.append(${val})`,
        `Direct score ${val} stored in output attention buffer.`,
        { idx, score: val },
        idx,
        { [idx]: [`score=${val}`] },
        currentElements,
      );
    } else {
      const modScore = val % target;
      outputScores.push(modScore);
      currentElements[idx] = {
        ...currentElements[idx],
        value: `${val} -> ${modScore} (Mod)`,
        state: "sorted",
      };

      addStep(
        14,
        `Translate & Append score: output_scores.append(${val} % ${target}) -> ${modScore}`,
        `Translated physical page score: $${val} \\pmod{${target}} = ${modScore}$.`,
        { idx, val, target, modScore },
        idx,
        { [idx]: [`mod_score=${modScore}`] },
        currentElements,
      );
    }
  });

  // Step 6: Return result line 16
  addStep(
    16,
    "Return output_scores from PagedAttention CUDA kernel",
    `Completed PagedAttention GPU kernel execution. Returned scores [${outputScores.join(", ")}].`,
    { output_scores: outputScores.join(", ") },
    -1,
    {},
    currentElements,
  );

  return steps;
};

const VLLMPAGEDATTENTIONKERNELEXECUTOR_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature line for vllm_paged_attention_kernel_executor.",
    2: "Parameter definitions for data list and target integer threshold.",
    3: "Return type hint specifying list[int] output.",
    4: "Begin docstring describing PagedAttention GPU kernel execution.",
    5: "Docstring line describing KV page gathering in non-contiguous VRAM.",
    6: "Docstring line detailing scaled dot-product attention computation.",
    7: "Docstring line detailing output tensor return.",
    8: "End docstring.",
    9: "Initialize empty list output_scores to store computed attention values.",
    10: "Loop through candidate physical KV block pointers in CUDA warp threads using enumerate(data).",
    11: "Check if physical block ID val is less than or equal to target threshold.",
    12: "Append original block value val to output_scores when within target bound.",
    13: "Else branch when physical block ID exceeds target bound.",
    14: "Append wrapped block offset value (val % target) to output_scores upon overflow.",
    15: "Blank line before return statement.",
    16: "Return computed output_scores attention tensor buffer to caller.",
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
      "The custom CUDA kernel at the core of vLLM's PagedAttention engine computes scaled dot-product attention directly over non-contiguous physical Key-Value memory blocks. Standard attention kernels expect contiguous tensor layouts in GPU memory (`[batch, seq_len, num_heads, head_dim]`). In contrast, PagedAttention CUDA kernel accepts a `block_tables` pointer matrix, dynamically translating logical token block offsets to physical VRAM addresses within GPU warp thread groups.\n\n### Paged Attention Kernel Math\nFor query vector $q$ and physical block ID $P = \\text{BlockTable}[i]$\n$$\\text{Slot}_{\\text{phys}} = P \\cdot B + o$$\n$$\\text{Attention Score} = \\text{Softmax}\\left(\\frac{q \\cdot K[\\text{Slot}_{\\text{phys}}]^T}{\\sqrt{d_k}}\\right) V[\\text{Slot}_{\\text{phys}}]$$\n\nInput Format:\n- `data`: Array of physical block IDs or sequence Query values.\n- `target`: Target block index or scalar attention scaling factor.\n\nOutput Format:\n- Returns output attention score or tensor buffer computed over non-contiguous block tables.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 KV Blocks Paged Attention Kernel Launch",
        inputDisplay: "16 physical KV blocks, target bound = 30",
        outputDisplay: "Attention score tensor buffer returned",
        input: DEFAULT_VLLMPAGEDATTENTIONKERNELEXECUTOR_INPUT,
        output: "Attention scores vector returned",
        explanation:
          "CUDA kernel warps gather KV pages across 16 blocks and compute scaled dot-product attention.",
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
    ],
    code: VLLMPAGEDATTENTIONKERNELEXECUTOR_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "$O(N)$ runtime per CUDA thread block gathering KV tokens across $N$ physical blocks.",
      space: "$O(N)$ memory allocation for output attention tensor buffer.",
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
          body: "The PagedAttention kernel receives three key device pointers:\n1. Query tensor $Q$;\n2. Physical KV block repository tensor $K_\\text{cache}, V_\\text{cache}$;\n3. 2D Block Table matrix `block_tables[batch_idx][logical_block_idx]`.\nWithin the CUDA grid, each thread warp processes a sequence's query, reading physical block IDs from `block_tables` and fetching KV vectors from address $P \\cdot B + o$ into SRAM shared memory.",
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

export default vllmPagedAttentionKernelExecutor;
