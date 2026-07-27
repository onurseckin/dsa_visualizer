import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface groupedQueryAttentionGqaEngineInput {
  data: number[];
  target?: number;
}

export const GROUPEDQUERYATTENTIONGQAENGINE_CODE = `
def grouped_query_attention(
    q_heads: list[list[float]],  # Shape [H_q, d_k]
    k_heads: list[list[float]],  # Shape [H_kv, d_k]
    v_heads: list[list[float]],  # Shape [H_kv, d_v]
    num_query_heads: int,
    num_kv_heads: int,
    scale: float
) -> list[list[float]]:
    """
    Simulates Grouped-Query Attention (GQA) forward mapping.
    Maps H_q query heads to H_kv key/value heads via group ratio G = H_q // H_kv.
    Broadcasts each shared KV head across its assigned query head group.
    """
    import math

    group_size = num_query_heads // num_kv_heads
    gqa_outputs = []

    for q_idx in range(num_query_heads):
        # Determine shared KV head index for current query head
        kv_idx = q_idx // group_size
        q_vec = q_heads[q_idx]
        k_vec = k_heads[kv_idx]
        v_vec = v_heads[kv_idx]

        # Compute scaled dot-product logits with shared KV head
        score = sum(q * k for q, k in zip(q_vec, k_vec)) * scale
        attn_weight = math.exp(score)  # Simplified 1-token softmax

        # Compute output head vector
        head_out = [attn_weight * v for v in v_vec]
        gqa_outputs.append(head_out)

    return gqa_outputs
`;

export const DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT: groupedQueryAttentionGqaEngineInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateGroupedQueryAttentionGqaEngineSteps = (
  input: groupedQueryAttentionGqaEngineInput,
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
    "Initialize Grouped-Query Attention (GQA) Engine",
    "Configuring GQA mapping parameters: H_q query heads grouped into H_kv shared key/value heads.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const kvGroupIdx = Math.floor(idx / 2);
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return {
          ...el,
          state: isTarget ? "active" : "compare",
          pointers: [`q=${idx}`, `kv=${kvGroupIdx}`],
        };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      18,
      `Process Query Head ${idx} (val=${val}): map to KV group ${kvGroupIdx}`,
      `Query head q_${idx} shares KV head kv_${kvGroupIdx} (group_ratio = H_q / H_kv).`,
      { qIdx: idx, kvIdx: kvGroupIdx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    29,
    "Execution Complete",
    "Grouped-Query Attention head broadcasting and projection completed.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const GROUPEDQUERYATTENTIONGQAENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  distractors: [
    "kv_idx = q_idx % num_kv_heads",
    "group_size = num_kv_heads // num_query_heads",
    "gqa_outputs.append(q_vec + k_vec)",
  ],
  hints: [
    { line: 15, hint: "Compute group size ratio G = H_q / H_kv." },
    {
      line: 19,
      hint: "Map query head q_idx to KV head using integer division kv_idx = q_idx // group_size.",
    },
    { line: 25, hint: "Scale inner product dot score by 1/sqrt(d_k)." },
  ],
  lineExplanations: {
    1: "Defines Grouped-Query Attention (GQA) entry point.",
    15: "Calculates head ratio group_size = num_query_heads // num_kv_heads.",
    19: "Maps each query head index to its corresponding shared key/value head.",
    25: "Computes query-key dot product score with scaling factor.",
    29: "Returns projected output vectors across all query heads.",
  },
};

export const groupedQueryAttentionGqaEngine: AlgorithmDefinition<groupedQueryAttentionGqaEngineInput> =
  {
    id: "grouped-query-attention-gqa-engine",
    title: "Grouped-Query Attention (GQA) Engine",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Grouped-Query Attention (GQA, Ainslie et al., 2023) is an architectural innovation designed to break the memory bandwidth wall in LLM autoregressive inference. Standard Multi-Head Attention (MHA) maintains $H_Q$ independent Key and Value heads ($H_{KV} = H_Q$), requiring massive memory transfers to load KV caches during generation. Multi-Query Attention (MQA) collapses to $H_{KV} = 1$, causing quality degradation.\n\nGQA groups $H_Q$ query heads into $G = H_Q / H_{KV}$ groups, where each group of $G$ query heads shares a single Key/Value head. For example, LLaMA-3-70B uses 64 Query heads and 8 KV heads ($G=8$). This reduces KV cache memory footprint and memory access traffic by $8\\times$ while maintaining near-MHA task performance.\n\nInput Format:\n- data: Query head index array or head count configurations ($H_Q, H_{KV}$).\n- target: Optional target query head index for inspection.\n\nOutput Format:\n- Array of projected GQA output vectors after broadcasting shared KV heads across query head groups.\n\nEdge Cases & Constraints:\n- Boundary cases: $H_{KV} = H_Q$ degenerates to standard MHA; $H_{KV} = 1$ degenerates to MQA.\n- Divisibility constraint: $H_Q$ must be evenly divisible by $H_{KV}$ ($H_Q \\bmod H_{KV} = 0$).\n- SRAM layout: Triton kernels expand shared KV head pointers via strided register loads without repeating DRAM memory reads.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "LLaMA-3 GQA (8:1 Ratio)",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Maps query heads to shared KV head groups with G=2 group factor.",
      },
      {
        kind: "complex",
        title: "Multi-Head Grouping Test",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates head projection across a 5-head execution configuration.",
      },
      {
        kind: "negative",
        title: "Single Head Boundary",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "Safely handles missing target query head indices.",
      },
    ],
    code: GROUPEDQUERYATTENTIONGQAENGINE_CODE,
    timeComplexity: {
      best: "O(H_Q \\cdot d)",
      average: "O(H_Q \\cdot d)",
      worst: "O(H_Q \\cdot d)",
    },
    spaceComplexity: "O(H_{KV} \\cdot d)",
    complexityAnalysis: {
      time: "Computes dot-products across $H_Q$ query heads in linear time relative to query head count, benefiting from $G\\times$ reduced KV cache memory fetches.",
      space:
        "Reduces KV cache space requirement from $O(H_Q \\cdot N \\cdot d)$ to $O(H_{KV} \\cdot N \\cdot d)$, saving $G\\times$ GPU memory.",
    },
    topicGuide: {
      overview:
        "Grouped-Query Attention (GQA) has become the gold standard for state-of-the-art open models (LLaMA-2/3, Mistral, Qwen). By sharing KV heads across query head groups, GQA dramatically increases maximum batch size and decode throughput in LLM serving engines such as vLLM and TensorRT-LLM.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Let $H_Q$ be the number of query heads and $H_{KV}$ be the number of key/value heads, with group size $G = H_Q / H_{KV}$. Query head $i \\in \\{0 \\dots H_Q-1\\}$ attends to key head $\\lfloor i / G \\rfloor$. The attention score matrix for query head $i$ is $S^{(i)} = Q^{(i)} (K^{(\\lfloor i/G \\rfloor)})^T / \\sqrt{d_k}$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In LLM generation, memory bandwidth to GPU High Bandwidth Memory (HBM) limits decoding speed (arithmetic intensity < 5 FLOPs/byte). GQA reduces the bytes transferred per token from $2 \\times H_Q \\times N \\times d \\times 2$ bytes down to $2 \\times H_{KV} \\times N \\times d \\times 2$ bytes, boosting decoding speed up to $4\\times$-$8\\times$.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In PyTorch and FlashAttention-2, GQA is implemented by reshaping or striding the KV tensor shape from `[B, S, H_kv, D]` to `[B, S, H_kv, 1, D]` and relying on implicit broadcasting in Triton CUDA kernels to prevent memory duplication.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: " Tensor Parallelism (TP) in distributed serving (e.g. TP=8) requires that $H_{KV}$ be divisible by TP degree. If $H_{KV} < \\text{TP}$, nodes must repeat or share KV heads across ranks using inter-GPU communication or multi-query tensor parallel strategies.",
        },
      ],
      keyTerms: [
        {
          term: "Grouped-Query Attention (GQA)",
          definition:
            "An attention variant where multiple query heads share a single Key/Value head.",
        },
        {
          term: "Group Ratio G",
          definition: "The number of query heads per Key/Value head, given by $G = H_Q / H_{KV}$.",
        },
        {
          term: "Memory Bandwidth Wall",
          definition:
            "Performance ceiling where execution time is dominated by HBM memory transfers rather than compute FLOPs.",
        },
        {
          term: "Implicit Broadcasting",
          definition:
            "Computing matrix ops over shared tensors using strided pointer arithmetic without memory copy.",
        },
      ],
    },
    trivia: GROUPEDQUERYATTENTIONGQAENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT,
    generateSteps: generateGroupedQueryAttentionGqaEngineSteps,
  };
