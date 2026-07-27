import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface multiQueryAttentionBroadcastInput {
  data: number[];
  target?: number;
}

export const MULTIQUERYATTENTIONBROADCAST_CODE = `
def mqa_broadcast_attention(
    q_heads: list[list[float]],  # Shape [H_q, d_k]
    shared_k: list[float],       # Single shared K vector [d_k]
    shared_v: list[float],       # Single shared V vector [d_v]
    scale: float
) -> list[list[float]]:
    """
    Simulates Multi-Query Attention (MQA) head broadcasting.
    Shares a SINGLE Key and Value head across all H_q Query heads.
    Computes per-head attention outputs without duplicating KV memory in DRAM.
    """
    import math

    num_query_heads = len(q_heads)
    mqa_outputs = []

    # Iterate through all Query heads using the same shared K and V vectors
    for q_idx in range(num_query_heads):
        q_vec = q_heads[q_idx]

        # Dot product with single shared Key vector
        score = sum(q * k for q, k in zip(q_vec, shared_k)) * scale
        attn_weight = math.exp(score)

        # Scale single shared Value vector
        head_out = [attn_weight * v for v in shared_v]
        mqa_outputs.append(head_out)

    return mqa_outputs
`;

export const DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT: multiQueryAttentionBroadcastInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMultiQueryAttentionBroadcastSteps = (
  input: multiQueryAttentionBroadcastInput,
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
    "Initialize Multi-Query Attention (MQA) Broadcaster",
    "Configuring MQA broadcaster: 1 shared KV head broadcasted to all H_q query heads.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`q=${idx}`, "kv=0"] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      16,
      `Broadcast shared KV head to Query Head ${idx} (val=${val})`,
      `Query head ${idx} computes dot product against single shared Key vector.`,
      { qIdx: idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    25,
    "Execution Complete",
    "Multi-Query Attention head broadcasting completed cleanly.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MULTIQUERYATTENTIONBROADCAST_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "shared_k = [k * num_query_heads for k in shared_k]",
    "score = sum(q * k for q, k in zip(q_vec, k_heads[q_idx]))",
    "attn_weight = math.exp(score) / num_query_heads",
  ],
  hints: [
    { line: 16, hint: "Loop over all query heads q_idx in range(num_query_heads)." },
    { line: 20, hint: "Compute dot product between q_vec and single shared_k vector." },
    { line: 24, hint: "Scale single shared_v vector by attention weight." },
  ],
  lineExplanations: {
    1: "Defines entry point for Multi-Query Attention (MQA) broadcasting.",
    16: "Loops across query heads $q_0 \\dots q_{H-1}$.",
    20: "Computes query-key dot product score with shared Key head.",
    24: "Scales shared Value vector by computed attention weight.",
    27: "Returns per-query-head attention output vectors.",
  },
};

export const multiQueryAttentionBroadcast: AlgorithmDefinition<multiQueryAttentionBroadcastInput> =
  {
    id: "multi-query-attention-broadcast",
    title: "Multi-Query Attention (MQA) Broadcaster",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Multi-Query Attention (MQA, Shazeer 2019) is an extreme memory bandwidth optimization for LLM decoding. While standard MHA uses $H_Q$ Key and $H_Q$ Value heads, MQA collapses the Key/Value heads down to $H_{KV} = 1$.\n\nDuring autoregressive token generation, the memory bottleneck is caused by loading KV cache tensors from High Bandwidth Memory (HBM) into GPU SRAM for every generated token. MQA reduces the KV cache memory footprint and bandwidth consumption by $H_Q \\times$ (e.g. $32\\times$ or $64\\times$). MQA Broadcaster handles the implicit spatial broadcasting of the single KV head across all $H_Q$ query heads during kernel execution.\n\nInput Format:\n- data: Query head index array or head counts.\n- target: Target query head index.\n\nOutput Format:\n- Attention output matrix after broadcasting shared KV head across all query heads.\n\nEdge Cases & Constraints:\n- Quality trade-off: MQA provides maximum memory speedup but may reduce capacity for capturing multi-faceted relationships compared to GQA/MHA.\n- Hardware alignment: Single KV head tensors are loaded once into GPU SRAM and retained in shared registers while warps process multiple query heads.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard MQA Broadcast",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Broadcasts single KV head across 3 query heads.",
      },
      {
        kind: "complex",
        title: "5-Head Query Broadcast",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates MQA broadcasting across 5 query heads.",
      },
      {
        kind: "negative",
        title: "Target Boundary Check",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation:
          "Safely processes sequence boundaries when target index exceeds current length.",
      },
    ],
    code: MULTIQUERYATTENTIONBROADCAST_CODE,
    timeComplexity: {
      best: "O(H_Q \\cdot d)",
      average: "O(H_Q \\cdot d)",
      worst: "O(H_Q \\cdot d)",
    },
    spaceComplexity: "O(1 \\cdot d)",
    complexityAnalysis: {
      time: "Requires $O(H_Q \\cdot d)$ compute operations while loading only $O(d)$ KV bytes from HBM.",
      space:
        "Reduces KV cache storage to $O(1 \\cdot N \\cdot d)$, saving $(H_Q-1) \\times N \\cdot d$ bytes per sequence.",
    },
    topicGuide: {
      overview:
        "Multi-Query Attention (Shazeer, 2019) introduced the concept of shared KV heads to remove the memory wall in LLM inference. Models like Falcon-40B and StarCoder adopted MQA to achieve extreme decoding throughput.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Given $Q_1 \\dots Q_H \\in \\mathbb{R}^{S \\times d_k}$ and a single shared pair $K, V \\in \\mathbb{R}^{S \\times d_k}$, the $h$-th query head output is $O_h = \\text{Softmax}(Q_h K^T / \\sqrt{d_k}) V$. $K$ and $V$ are identical for all $h \\in \\{1 \\dots H\\}$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In standard MHA, reading the KV cache requires transferring $2 \\times H \\times N \\times d \\times 2$ bytes per token from HBM. MQA reduces this to $2 \\times 1 \\times N \\times d \\times 2$ bytes, elevating the arithmetic intensity by $H\\times$ and making generation compute-bound rather than memory-bound.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In CUDA/Triton kernels, the shared $K$ and $V$ vectors are loaded into GPU Shared Memory (SRAM) or register files once by warp lane 0, then broadcasted across threads executing different query heads.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Because MQA collapses key expressivity to a single head, training stability can require higher scaling factors or larger head dimensions ($d_k = 128$). In modern architectures, Grouped-Query Attention (GQA) is often preferred as a trade-off.",
        },
      ],
      keyTerms: [
        {
          term: "Multi-Query Attention (MQA)",
          definition:
            "An attention variant sharing a single Key/Value head across all Query heads.",
        },
        {
          term: "Implicit Broadcasting",
          definition:
            "Reusing shared memory pointers across warps without duplicating data in DRAM.",
        },
        {
          term: "KV Cache Contraction",
          definition: "Reducing VRAM allocation for stored keys/values by $H_Q\\times$.",
        },
        {
          term: "Arithmetic Intensity",
          definition: "The ratio of floating-point operations to memory access bytes (FLOPs/byte).",
        },
      ],
    },
    trivia: MULTIQUERYATTENTIONBROADCAST_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT,
    generateSteps: generateMultiQueryAttentionBroadcastSteps,
  };
