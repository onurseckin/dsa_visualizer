import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface multiQueryAttentionBroadcastInput {
  numQueryHeads?: number;
  data?: number[];
  target?: number;
}

export const MULTIQUERYATTENTIONBROADCAST_CODE = `def mqa_broadcast_attention(
    q_heads: list[list[float]],
    shared_k: list[float],
    shared_v: list[float],
    scale: float
) -> list[list[float]]:
    import math

    num_query_heads = len(q_heads)
    mqa_outputs = []

    for q_idx in range(num_query_heads):
        q_vec = q_heads[q_idx]

        score = sum(q * k for q, k in zip(q_vec, shared_k)) * scale
        attn_weight = math.exp(score)

        head_out = [attn_weight * v for v in shared_v]
        mqa_outputs.append(head_out)

    return mqa_outputs`;

export const DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT: multiQueryAttentionBroadcastInput = {
  numQueryHeads: 8,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateMultiQueryAttentionBroadcastSteps = (
  input: multiQueryAttentionBroadcastInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numQueryHeads = Math.max(input.numQueryHeads ?? 8, 4);

  const matrixValues: string[][] = Array.from({ length: numQueryHeads }, () =>
    Array.from({ length: 4 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: numQueryHeads }, () =>
    Array.from({ length: 4 }, () => "default"),
  );

  const getSnapshot = (activeQ?: number, activeCol?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numQueryHeads; r++) {
      for (let c = 0; c < 4; c++) {
        let state = matrixStates[r][c];
        if (r === activeQ && c === activeCol) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `Q${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: numQueryHeads,
      cols: 4,
      title: `Multi-Query Attention Broadcast Matrix (${numQueryHeads} Query Heads, 1 Single Shared KV Head)`,
      rowHeaders: Array.from({ length: numQueryHeads }, (_, i) => `Query Head ${i}`),
      colHeaders: [
        "Broadcast Shared KV",
        "Logit Score (Q @ Shared K)",
        "Softmax Weight",
        "Head Output",
      ],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeQ?: number,
    activeCol?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeQ, activeCol),
      auxiliaryState: {
        customState: {
          num_query_heads: numQueryHeads,
          num_kv_heads: 1,
          active_q: activeQ !== undefined ? `Q${activeQ}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Multi-Query Attention (MQA) Broadcaster",
    "Configuring MQA broadcaster: 1 shared KV head broadcasted to all H_q query heads.",
    { numQueryHeads, shared_kv_count: 1 },
  );

  addStep(
    7,
    "Import Math Module",
    "Loading exponential primitives for Softmax score calculation.",
    { import: "math" },
  );

  addStep(
    9,
    `Get Query Head Count (num_query_heads=${numQueryHeads})`,
    `Identified ${numQueryHeads} independent query heads sharing 1 KV head in SRAM.`,
    { num_query_heads: numQueryHeads },
  );

  addStep(
    10,
    "Initialize MQA Outputs Tensor Container",
    "Allocated top-level list to collect projected head outputs.",
    { mqa_outputs: "[]" },
  );

  for (let qIdx = 0; qIdx < numQueryHeads; qIdx++) {
    addStep(
      12,
      `Begin Processing Query Head Q${qIdx}`,
      `Broadcasting single shared KV head to Query Head Q${qIdx}.`,
      { qIdx, numQueryHeads },
      qIdx,
    );

    addStep(
      13,
      `Load Vector Q${qIdx}`,
      `Fetching Query head vector Q${qIdx} from head memory buffer.`,
      { qIdx },
      qIdx,
      0,
    );

    matrixValues[qIdx][0] = "Shared KV0";
    matrixStates[qIdx][0] = "pivot";

    const mockScore = +(0.4 + (qIdx % 4) * 0.25).toFixed(3);
    const attnWeight = +Math.exp(mockScore - 0.8).toFixed(3);
    const headOutVal = +(attnWeight * 0.95).toFixed(3);

    addStep(
      15,
      `Compute Scaled Dot Product Q${qIdx} @ Shared_K^T`,
      `Calculated score = sum(Q${qIdx} * Shared_K) * scale = ${mockScore}.`,
      { qIdx, score: mockScore },
      qIdx,
      1,
    );

    matrixValues[qIdx][1] = String(mockScore);
    matrixStates[qIdx][1] = "compared";

    addStep(
      16,
      `Compute Softmax Weight for Q${qIdx}`,
      `Calculated attention weight = exp(${mockScore}) = ${attnWeight}.`,
      { qIdx, attnWeight },
      qIdx,
      2,
    );

    matrixValues[qIdx][2] = String(attnWeight);
    matrixStates[qIdx][2] = "active";

    addStep(
      18,
      `Scale Single Shared Value Vector for Q${qIdx}`,
      `Scaled shared V vector by attention weight ${attnWeight} -> output [${headOutVal}].`,
      { qIdx, headOutVal },
      qIdx,
      3,
    );

    matrixValues[qIdx][3] = `[${headOutVal}]`;
    matrixStates[qIdx][3] = "sorted";

    addStep(
      19,
      `Append Output Vector Q${qIdx} to Results`,
      `Stored projected head output Q${qIdx} into MQA output list.`,
      { qIdx },
      qIdx,
      3,
    );
  }

  addStep(
    21,
    "Execution Complete",
    `Multi-Query Attention (MQA) broadcasting complete across ${numQueryHeads} query heads using 1 shared KV head.`,
    { completed: true, total_heads: numQueryHeads },
  );

  return steps;
};

const MULTIQUERYATTENTIONBROADCAST_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 8, 11, 14, 17, 20],
  distractors: [
    "shared_k = [k * num_query_heads for k in shared_k]",
    "score = sum(q * k for q, k in zip(q_vec, k_heads[q_idx]))",
    "attn_weight = math.exp(score) / num_query_heads",
  ],
  hints: [
    { line: 12, hint: "Loop over all query heads q_idx in range(num_query_heads)." },
    { line: 15, hint: "Compute dot product between q_vec and single shared_k vector." },
    { line: 18, hint: "Scale single shared_v vector by attention weight." },
  ],
  lineExplanations: {
    1: "Defines entry point for Multi-Query Attention (MQA) broadcasting function.",
    2: "Specifies shape type annotation for query head vector list.",
    3: "Specifies type annotation for single shared Key vector.",
    4: "Specifies type annotation for single shared Value vector.",
    5: "Specifies type annotation for dot product scaling factor.",
    6: "Specifies return type annotation for projected head output vectors.",
    7: "Imports math module for exponential calculations.",
    8: "Empty whitespace separator line.",
    9: "Reads number of query heads H_q from q_heads list.",
    10: "Initializes list container for collecting MQA output head vectors.",
    11: "Empty whitespace separator line.",
    12: "Iterates over query head index q_idx from 0 to num_query_heads - 1.",
    13: "Extracts Query head vector q_vec for position q_idx.",
    14: "Empty whitespace separator line.",
    15: "Computes query-key dot product score with single shared Key head.",
    16: "Computes single-token Softmax attention weight = math.exp(score).",
    17: "Empty whitespace separator line.",
    18: "Scales single shared Value vector by computed attention weight.",
    19: "Appends completed query head output vector to top-level MQA outputs list.",
    20: "Empty whitespace separator line.",
    21: "Returns per-query-head attention output vectors.",
  },
};

export const multiQueryAttentionBroadcast: AlgorithmDefinition<multiQueryAttentionBroadcastInput> =
  {
    id: "multi-query-attention-broadcast",
    title: "Multi-Query Attention (MQA) Broadcaster",
    topicIds: ["ml_attention_geometry", "ml_llm_serving"],
    difficulty: "Medium",
    description:
      "Multi-Query Attention (MQA, Shazeer 2019) is an extreme memory bandwidth optimization for LLM decoding. While standard MHA uses $H_Q$ Key and $H_Q$ Value heads, MQA collapses the Key/Value heads down to $H_{KV} = 1$.\n\n### Why It Exists\nDuring autoregressive token generation, the memory bottleneck is caused by loading KV cache tensors from High Bandwidth Memory (HBM) into GPU SRAM for every generated token. MQA reduces the KV cache memory footprint and bandwidth consumption by $H_Q \\times$ (e.g. $32\\times$ or $64\\times$). MQA Broadcaster handles the implicit spatial broadcasting of the single KV head across all $H_Q$ query heads during kernel execution.\n\n### Mathematical Formulation\nFor query head $i \\in \\{0 \\dots H_Q-1\\}$:\n\n$$S^{(i)} = \\frac{Q^{(i)} (K^{(\\text{shared})})^T}{\\sqrt{d_k}}$$\n\n$$A^{(i)} = \\text{Softmax}\\left(S^{(i)}\\right)$$\n\n$$O^{(i)} = A^{(i)} V^{(\\text{shared})}$$\n\n### Step-by-Step Intuition\n1. **Load Single Shared KV**: Load the single Key ($K^{(\\text{shared})}$) and Value ($V^{(\\text{shared})}$) vectors into GPU SRAM once.\n2. **Broadcast across Query Threads**: Each GPU warp thread block reads its assigned query head vector $Q^{(i)}$ and computes dot products against the same shared $K, V$ vectors in registers.\n3. **Zero DRAM Copy**: Reuses shared memory registers across all $H_Q$ query heads without allocating additional HBM memory.\n\n### Key Trade-Offs & Complexity\n- **Maximum Decoding Speed**: Reduces KV cache HBM load traffic by $H_Q\\times$.\n- **Capacity Trade-Off**: Reduces model capacity for multi-faceted relationships; largely superseded by Grouped-Query Attention (GQA).",
    constraints: ["1 <= numQueryHeads <= 128"],
    examples: [
      {
        kind: "basic",
        title: "8-Query Head MQA Broadcast",
        inputDisplay: "numQueryHeads = 8",
        outputDisplay: "8 Projected output head vectors",
        input: { numQueryHeads: 8 },
        output: "Matrix [8, d_v]",
        explanation: "Broadcasts single shared KV head across 8 query heads.",
      },
    ],
    code: MULTIQUERYATTENTIONBROADCAST_CODE,
    timeComplexity: {
      best: "O(H_Q * d)",
      average: "O(H_Q * d)",
      worst: "O(H_Q * d)",
    },
    spaceComplexity: "O(1 * d)",
    complexityAnalysis: {
      time: "Requires O(H_Q * d) compute operations while loading only O(d) KV bytes from HBM.",
      space: "Reduces KV cache storage to O(1 * N * d), saving (H_Q-1) * N * d bytes per sequence.",
    },
    topicGuide: {
      overview:
        "Multi-Query Attention (Shazeer, 2019) introduced the concept of shared KV heads to remove the memory wall in LLM inference. Models like Falcon-40B and StarCoder adopted MQA to achieve extreme decoding throughput.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Given Q_1 ... Q_H in R^(S x d_k) and a single shared pair K, V in R^(S x d_k), the h-th query head output is O_h = Softmax(Q_h K^T / sqrt(d_k)) V. K and V are identical for all h in {1 ... H}.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In standard MHA, reading the KV cache requires transferring 2 * H * N * d * 2 bytes per token from HBM. MQA reduces this to 2 * 1 * N * d * 2 bytes, elevating the arithmetic intensity by Hx and making generation compute-bound rather than memory-bound.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In CUDA/Triton kernels, the shared K and V vectors are loaded into GPU Shared Memory (SRAM) or register files once by warp lane 0, then broadcasted across threads executing different query heads.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Because MQA collapses key expressivity to a single head, training stability can require higher scaling factors or larger head dimensions (d_k = 128). In modern architectures, Grouped-Query Attention (GQA) is often preferred as a trade-off.",
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
          definition: "Reducing VRAM allocation for stored keys/values by H_Qx.",
        },
        {
          term: "Arithmetic Intensity",
          definition: "The ratio of floating-point operations to memory access bytes (FLOPs/byte).",
        },
      ],
    },
    trivia: MULTIQUERYATTENTIONBROADCAST_TRIVIA,
    sources: [{ kind: "standard", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_MULTIQUERYATTENTIONBROADCAST_INPUT,
    generateSteps: generateMultiQueryAttentionBroadcastSteps,
  };
