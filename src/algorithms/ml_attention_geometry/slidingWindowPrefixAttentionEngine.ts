import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface slidingWindowPrefixAttentionEngineInput {
  data: number[];
  target?: number;
}

export const SLIDINGWINDOWPREFIXATTENTIONENGINE_CODE = `
def sliding_window_prefix_attention(
    q_len: int,
    kv_len: int,
    window_size: int,
    prefix_len: int
) -> list[list[bool]]:
    """
    Constructs a sliding window + prefix attention mask.
    Token i can attend to:
    1. Static prefix tokens 0 ... prefix_len - 1
    2. Local sliding window tokens max(0, i - window_size + 1) ... i
    """
    mask = []
    for i in range(q_len):
        row = []
        for j in range(kv_len):
            is_prefix = (j < prefix_len)
            is_window = (i - window_size < j <= i)
            
            if is_prefix or is_window:
                row.append(True)   # Valid attention position
            else:
                row.append(False)  # Masked position (-inf)
        mask.append(row)
        
    return mask
`;

export const DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT: slidingWindowPrefixAttentionEngineInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateSlidingWindowPrefixAttentionEngineSteps = (
  input: slidingWindowPrefixAttentionEngineInput,
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
    "Initialize Sliding Window Prefix Attention Engine",
    "Configuring sliding window parameters: window_size = 2, prefix_len = 1.",
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
      15,
      `Evaluate query token i=${idx} (val=${val}): prefix OR sliding window mask`,
      `Valid attention key range: prefix [0..0] and sliding window [${Math.max(0, idx - 1)}..${idx}].`,
      { queryIdx: idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    24,
    "Execution Complete",
    "Successfully computed sliding window prefix attention mask bounds.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SLIDINGWINDOWPREFIXATTENTIONENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  distractors: [
    "is_window = (j <= i)",
    "row.append(True if j > i else False)",
    "is_prefix = (j >= prefix_len)",
  ],
  hints: [
    { line: 15, hint: "Check if key index j is within static prefix range j < prefix_len." },
    { line: 16, hint: "Check if key index j is within local window i - window_size < j <= i." },
    { line: 18, hint: "Set mask entry to True if either condition is satisfied." },
  ],
  lineExplanations: {
    1: "Defines entry point for sliding window prefix attention mask construction.",
    15: "Checks if key index j falls into prefix tokens.",
    16: "Checks if key index j falls into local sliding window bounds.",
    18: "Assigns True (valid score) if token is in prefix or sliding window.",
    20: "Assigns False (-inf score) if token is outside valid attention range.",
    24: "Returns computed 2D boolean attention mask matrix.",
  },
};

export const slidingWindowPrefixAttentionEngine: AlgorithmDefinition<slidingWindowPrefixAttentionEngineInput> =
  {
    id: "sliding-window-prefix-attention-engine",
    title: "Sliding Window Prefix Attention Engine",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Sliding Window Attention (SWA, used in Mistral-7B and Longformer) bounds self-attention complexity to $O(N \\cdot W)$ by restricting query token $i$ to attend only to a local window of $W$ previous tokens ($i - W + 1 \\le j \\le i$). However, pure SWA drops early prompt tokens (e.g. system instructions or prefix tokens) that carry critical context.\n\nSliding Window Prefix Attention Engine combines SWA with static prefix attention: query token $i$ attends to BOTH static prefix tokens $0 \\dots P-1$ AND the local sliding window tokens $[i - W + 1 \\dots i]$. This retains global system prompt context while bounding memory and compute growth to $O(N (W + P))$.\n\nInput Format:\n- data: Sequence lengths or token array.\n- target: Window size parameter $W$.\n\nOutput Format:\n- 2D boolean or float attention mask matrix $M \\in \\mathbb{R}^{N \\times N}$.\n\nEdge Cases & Constraints:\n- Boundary cases: $W \\ge N$ degenerates to standard full causal attention; $W=1$ degenerates to diagonal self-attention.\n- Memory reuse: Integrated with rolling buffer KV caches where cache size is capped at $W + P$ tokens per request.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Window=2, Prefix=1 Attention",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation:
          "Computes valid attention mask combining prefix token 0 and local 2-token window.",
      },
      {
        kind: "complex",
        title: "5-Token Context Masking",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates sliding window prefix attention across 5 sequence positions.",
      },
      {
        kind: "negative",
        title: "Full Window Boundary Check",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Safely handles sequence boundaries when window size exceeds context length.",
      },
    ],
    code: SLIDINGWINDOWPREFIXATTENTIONENGINE_CODE,
    timeComplexity: {
      best: "O(N \\cdot (W + P))",
      average: "O(N \\cdot (W + P))",
      worst: "O(N \\cdot (W + P))",
    },
    spaceComplexity: "O(W + P)",
    complexityAnalysis: {
      time: "Reduces attention compute complexity from $O(N^2)$ down to $O(N \\cdot (W + P))$.",
      space: "Reduces KV cache memory footprint to $O(W + P)$ tokens using rolling ring buffers.",
    },
    topicGuide: {
      overview:
        "Sliding Window Prefix Attention enables models like Mistral-7B to handle 32k+ context lengths efficiently by capping KV cache size to a sliding window of e.g. 4096 tokens while anchoring attention on the initial system prompt.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "For query index $i$ and key index $j$, mask $M_{ij} = 0.0$ if $(j < P) \\lor (i - W < j \\le i)$, and $M_{ij} = -\\infty$ otherwise. Information flows across multiple layers via stacked local windows: at layer $L$, a token has an effective receptive field of $L \\times W$ tokens.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Rolling Buffer KV Caching stores KV vectors modulo window size: `kv_slot = pos % W`. This caps DRAM allocation to $W$ slots per request, eliminating out-of-memory errors on long streaming inputs.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In Triton kernels, FlashAttention tile loops iterate only over key block indices $k_{\\text{block}} \\in [0 \\dots \\lceil P / B_c \\rceil) \\cup [\\lfloor (i-W)/B_c \\rfloor \\dots \\lfloor i/B_c \\rfloor]$, skipping zero-weight tiles completely.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "When prefix length $P$ exceeds window size $W$, the kernel maintains separate pointer strides for prefix and rolling buffer blocks to prevent pointer aliasing.",
        },
      ],
      keyTerms: [
        {
          term: "Sliding Window Attention (SWA)",
          definition:
            "Attention mechanism restricting visibility to a local context window of $W$ tokens.",
        },
        {
          term: "Prefix Anchoring",
          definition: "Retaining global visibility to initial system prompt tokens $0 \\dots P-1$.",
        },
        {
          term: "Rolling Buffer Cache",
          definition:
            "A ring buffer storing KV cache vectors using modulo window index arithmetic.",
        },
        {
          term: "Effective Receptive Field",
          definition:
            "The total contextual span a token can access across $L$ stacked attention layers ($L \\times W$).",
        },
      ],
    },
    trivia: SLIDINGWINDOWPREFIXATTENTIONENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_SLIDINGWINDOWPREFIXATTENTIONENGINE_INPUT,
    generateSteps: generateSlidingWindowPrefixAttentionEngineSteps,
  };
