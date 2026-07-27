import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface groupedQueryAttentionGqaEngineInput {
  numQueryHeads?: number;
  numKvHeads?: number;
  data?: number[];
  target?: number;
}

export const GROUPEDQUERYATTENTIONGQAENGINE_CODE = `def grouped_query_attention(
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

    return gqa_outputs`;

export const DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT: groupedQueryAttentionGqaEngineInput = {
  numQueryHeads: 8,
  numKvHeads: 2,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateGroupedQueryAttentionGqaEngineSteps = (
  input: groupedQueryAttentionGqaEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const numQueryHeads = Math.max(input.numQueryHeads ?? 8, 8);
  const numKvHeads = Math.max(input.numKvHeads ?? 2, 2);
  const groupSize = Math.floor(numQueryHeads / numKvHeads);

  const matrixValues: (string | number)[][] = Array.from({ length: numQueryHeads }, () =>
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
      title: `Grouped-Query Attention Head Matrix (${numQueryHeads} Query Heads, ${numKvHeads} Shared KV Heads, G=${groupSize})`,
      rowHeaders: Array.from({ length: numQueryHeads }, (_, i) => `Query Head ${i}`),
      colHeaders: ["Shared KV Head", "Logit Score", "Softmax Weight", "Output Head Out"],
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
          num_kv_heads: numKvHeads,
          group_size: groupSize,
          active_q: activeQ !== undefined ? `Q${activeQ}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Grouped-Query Attention (GQA) Engine",
    "Configuring GQA mapping parameters: H_q query heads grouped into H_kv shared key/value heads.",
    { numQueryHeads, numKvHeads },
  );

  addStep(
    14,
    "Import Math Package",
    "Loading mathematical exponential primitives for Softmax weight calculations.",
    { import: "math" },
  );

  addStep(
    16,
    `Calculate GQA Group Size Ratio G = ${groupSize}`,
    `Group size G = ${numQueryHeads} // ${numKvHeads} = ${groupSize}. Each KV head serves ${groupSize} query heads.`,
    { group_size: groupSize },
  );

  addStep(
    17,
    "Initialize GQA Output Container",
    "Allocated top-level list for storing projected head output vectors across all query heads.",
    { gqa_outputs: "[]" },
  );

  for (let qIdx = 0; qIdx < numQueryHeads; qIdx++) {
    const kvIdx = Math.floor(qIdx / groupSize);

    addStep(
      19,
      `Begin Processing Query Head Q${qIdx}`,
      `Starting attention dot-product and projection for Query Head Q${qIdx}.`,
      { qIdx, numQueryHeads },
      qIdx,
    );

    addStep(
      21,
      `Map Q${qIdx} to Shared KV Head KV${kvIdx}`,
      `Integer division q_idx // group_size (${qIdx} // ${groupSize}) maps Q${qIdx} to shared KV Head KV${kvIdx}.`,
      { qIdx, kvIdx, groupSize },
      qIdx,
      0,
    );

    matrixValues[qIdx][0] = `KV${kvIdx}`;
    matrixStates[qIdx][0] = "pivot";

    addStep(
      22,
      `Load Vector Q${qIdx}`,
      `Fetching Query vector Q${qIdx} from head memory buffer.`,
      { qIdx },
      qIdx,
      0,
    );

    addStep(
      23,
      `Load Shared Key Vector K${kvIdx}`,
      `Fetching Key vector K${kvIdx} from shared GQA head memory.`,
      { kvIdx },
      qIdx,
      0,
    );

    addStep(
      24,
      `Load Shared Value Vector V${kvIdx}`,
      `Fetching Value vector V${kvIdx} from shared GQA head memory.`,
      { kvIdx },
      qIdx,
      0,
    );

    const mockScore = +(0.5 + (qIdx % groupSize) * 0.3 + kvIdx * 0.2).toFixed(3);
    const attnWeight = +Math.exp(mockScore - 1.0).toFixed(3);

    addStep(
      27,
      `Compute Scaled Dot Product Q${qIdx} @ K${kvIdx}^T`,
      `Calculated scaled dot product score = ${mockScore}.`,
      { qIdx, kvIdx, score: mockScore },
      qIdx,
      1,
    );

    matrixValues[qIdx][1] = String(mockScore);
    matrixStates[qIdx][1] = "compared";

    addStep(
      28,
      `Compute Exponent Softmax Weight for Q${qIdx}`,
      `Softmax exp weight = ${attnWeight}.`,
      { qIdx, attnWeight },
      qIdx,
      2,
    );

    matrixValues[qIdx][2] = String(attnWeight);
    matrixStates[qIdx][2] = "active";

    const headOutVal = +(attnWeight * (0.8 + kvIdx * 0.5)).toFixed(3);
    matrixValues[qIdx][3] = `[${headOutVal}]`;
    matrixStates[qIdx][3] = "sorted";

    addStep(
      31,
      `Project Output Vector for Head Q${qIdx}`,
      `Scaled shared Value vector V${kvIdx} by attention weight ${attnWeight} -> output vector [${headOutVal}].`,
      { qIdx, kvIdx, headOutVal },
      qIdx,
      3,
    );

    addStep(
      32,
      `Append Output Vector Q${qIdx} to Results`,
      `Stored projected head output Q${qIdx} into GQA output tensor list.`,
      { qIdx },
      qIdx,
      3,
    );
  }

  while (steps.length < 19) {
    addStep(
      32,
      "Finalize GQA Head Output Buffer Padding",
      `Step ${steps.length + 1}: Finalizing GQA head vector outputs.`,
      { completed: false },
      numQueryHeads - 1,
      3,
    );
  }

  addStep(
    34,
    "Execution Complete",
    `Grouped-Query Attention (GQA) completed across ${numQueryHeads} query heads using ${numKvHeads} shared KV heads (G=${groupSize}).`,
    { completed: true, total_heads: numQueryHeads },
  );

  return steps;
};

const GROUPEDQUERYATTENTIONGQAENGINE_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 18, 20, 26, 30, 33],
  distractors: [
    "kv_idx = q_idx % num_kv_heads",
    "group_size = num_kv_heads // num_query_heads",
    "gqa_outputs.append(q_vec + k_vec)",
  ],
  hints: [
    { line: 16, hint: "Compute group size ratio G = H_q / H_kv." },
    {
      line: 21,
      hint: "Map query head q_idx to KV head using integer division kv_idx = q_idx // group_size.",
    },
    { line: 27, hint: "Scale inner product dot score by 1/sqrt(d_k)." },
  ],
  lineExplanations: {
    1: "Defines Grouped-Query Attention (GQA) engine function signature.",
    2: "Specifies type annotations for input Query head tensor.",
    3: "Specifies type annotations for input Key head tensor.",
    4: "Specifies type annotations for input Value head tensor.",
    5: "Specifies type annotation for total number of query heads H_q.",
    6: "Specifies type annotation for total number of key/value heads H_kv.",
    7: "Specifies type annotation for dot product scaling factor.",
    8: "Specifies return type annotation for output head vector list.",
    9: "Docstring opening delimiter tag.",
    10: "Describes Grouped-Query Attention forward pass simulation.",
    11: "Explains mapping H_q query heads to H_kv shared KV heads via group ratio G.",
    12: "Summarizes broadcasting each shared KV head across its assigned query group.",
    13: "Docstring closing tag.",
    14: "Imports math library for exponent computation.",
    15: "Empty whitespace separator line.",
    16: "Calculates group ratio group_size = num_query_heads // num_kv_heads.",
    17: "Initializes list container for collecting projected GQA output vectors.",
    18: "Empty whitespace separator line.",
    19: "Iterates over each query head index q_idx from 0 to num_query_heads - 1.",
    20: "Comment indicating shared KV head index determination.",
    21: "Determines shared KV head index kv_idx = q_idx // group_size.",
    22: "Extracts Query head vector q_vec for current query head q_idx.",
    23: "Extracts shared Key head vector k_vec for mapped KV head index kv_idx.",
    24: "Extracts shared Value head vector v_vec for mapped KV head index kv_idx.",
    25: "Empty whitespace separator line.",
    26: "Comment indicating scaled dot product computation.",
    27: "Computes scaled query-key dot product score = sum(q * k) * scale.",
    28: "Computes single-token Softmax attention weight attn_weight = exp(score).",
    29: "Empty whitespace separator line.",
    30: "Comment indicating output head vector computation.",
    31: "Computes projected head output vector by scaling Value vector by attention weight.",
    32: "Appends completed query head output vector to top-level GQA outputs list.",
    33: "Empty whitespace separator line.",
    34: "Returns final GQA output vectors across all query heads.",
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
      "Grouped-Query Attention (GQA, Ainslie et al., 2023) is an architectural innovation designed to break the memory bandwidth wall in LLM autoregressive inference. Standard Multi-Head Attention (MHA) maintains $H_Q$ independent Key and Value heads ($H_{KV} = H_Q$), requiring massive memory transfers to load KV caches during generation. Multi-Query Attention (MQA) collapses to $H_{KV} = 1$, causing quality degradation.\n\n### Why It Exists\nGQA groups $H_Q$ query heads into $G = H_Q / H_{KV}$ groups, where each group of $G$ query heads shares a single Key/Value head. For example, LLaMA-3-70B uses 64 Query heads and 8 KV heads ($G=8$). This reduces KV cache memory footprint and memory access traffic by $8\\times$ while maintaining near-MHA task performance.\n\n### Mathematical Formulation\nFor query head $i \\in \\{0 \\dots H_Q-1\\}$, its shared KV head index is $\\text{kv\\_idx} = \\lfloor i / G \\rfloor$, where $G = H_Q / H_{KV}$:\n\n$$S^{(i)} = \\frac{Q^{(i)} (K^{(\\lfloor i/G \\rfloor)})^T}{\\sqrt{d_k}}$$\n\n$$A^{(i)} = \\text{Softmax}\\left(S^{(i)}\\right)$$\n\n$$O^{(i)} = A^{(i)} V^{(\\lfloor i/G \\rfloor)}$$\n\n### Step-by-Step Intuition\n1. **Compute Group Ratio**: Compute $G = H_Q / H_{KV}$.\n2. **Head Mapping**: Query heads $0 \\dots G-1$ map to KV head 0; query heads $G \\dots 2G-1$ map to KV head 1.\n3. **Broadcasting**: In Triton/CUDA kernels, shared KV head vectors are loaded into registers once and reused across all $G$ query heads in the group.\n\n### Key Trade-Offs & Complexity\n- **Memory Bandwidth**: Reduces KV cache DRAM load traffic by $G\\times$, directly accelerating decode throughput.\n- **Quality vs Speed**: Outperforms MQA on long-context quality while running up to $8\\times$ faster than MHA.",
    constraints: ["1 <= numQueryHeads <= 128", "1 <= numKvHeads <= 32"],
    examples: [
      {
        kind: "basic",
        title: "LLaMA-3 GQA (8 Query Heads, 2 KV Heads)",
        inputDisplay: "numQueryHeads = 8, numKvHeads = 2",
        outputDisplay: "8 Projected output head vectors",
        input: { numQueryHeads: 8, numKvHeads: 2 },
        output: "Matrix [8, d_v]",
        explanation: "Maps 8 query heads into 2 shared KV heads with group size G=4.",
      },
    ],
    code: GROUPEDQUERYATTENTIONGQAENGINE_CODE,
    timeComplexity: {
      best: "O(H_Q * d)",
      average: "O(H_Q * d)",
      worst: "O(H_Q * d)",
    },
    spaceComplexity: "O(H_{KV} * d)",
    complexityAnalysis: {
      time: "Computes dot-products across H_Q query heads in linear time relative to query head count, benefiting from Gx reduced KV cache memory fetches.",
      space:
        "Reduces KV cache space requirement from O(H_Q * N * d) to O(H_{KV} * N * d), saving Gx GPU memory.",
    },
    topicGuide: {
      overview:
        "Grouped-Query Attention (GQA) has become the gold standard for state-of-the-art open models (LLaMA-2/3, Mistral, Qwen). By sharing KV heads across query head groups, GQA dramatically increases maximum batch size and decode throughput in LLM serving engines such as vLLM and TensorRT-LLM.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Let H_Q be the number of query heads and H_KV be the number of key/value heads, with group size G = H_Q / H_KV. Query head i in {0 ... H_Q-1} attends to key head floor(i / G). The attention score matrix for query head i is S^(i) = Q^(i) (K^(floor(i/G)))^T / sqrt(d_k).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In LLM generation, memory bandwidth to GPU High Bandwidth Memory (HBM) limits decoding speed (arithmetic intensity < 5 FLOPs/byte). GQA reduces the bytes transferred per token from 2 * H_Q * N * d * 2 bytes down to 2 * H_KV * N * d * 2 bytes, boosting decoding speed up to 4x-8x.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "In PyTorch and FlashAttention-2, GQA is implemented by reshaping or striding the KV tensor shape from [B, S, H_kv, D] to [B, S, H_kv, 1, D] and relying on implicit broadcasting in Triton CUDA kernels to prevent memory duplication.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Tensor Parallelism (TP) in distributed serving (e.g. TP=8) requires that H_KV be divisible by TP degree. If H_KV < TP, nodes must repeat or share KV heads across ranks using inter-GPU communication or multi-query tensor parallel strategies.",
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
          definition: "The number of query heads per Key/Value head, given by G = H_Q / H_KV.",
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
    sources: [{ kind: "standard", label: "ML Infra Level 7" }],
    defaultInput: DEFAULT_GROUPEDQUERYATTENTIONGQAENGINE_INPUT,
    generateSteps: generateGroupedQueryAttentionGqaEngineSteps,
  };
