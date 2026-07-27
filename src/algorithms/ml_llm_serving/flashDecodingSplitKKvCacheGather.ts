import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashDecodingSplitKKvCacheGatherInput {
  split_maxes: number[];
  split_sums: number[];
  split_outputs: number[][];
}

export const FLASHDECODINGSPLITKKVCACHEGATHER_CODE = `
import math

def flash_decoding_split_k_gather(split_maxes, split_sums, split_outputs):
    """
    Reduces split-K partial attention outputs from parallel GPU thread blocks using online log-sum-exp rescaled gather.
    Computes global rowmax, rescales partial softmax denominators, and performs weighted sum over split output vectors.
    """
    num_splits = len(split_maxes)
    if num_splits == 0:
        return [], 0.0, 0.0

    # Step 1: Compute global maximum score m_global across all K splits
    global_max = max(split_maxes)

    # Step 2: Rescale partial sum-exponents l_k * exp(m_k - m_global)
    rescaled_sums = []
    global_sum = 0.0
    for k in range(num_splits):
        rescaled_w = split_sums[k] * math.exp(split_maxes[k] - global_max)
        rescaled_sums.append(rescaled_w)
        global_sum += rescaled_w

    # Step 3: Weighted sum of split output vectors O_k rescaled by global denominator
    dim = len(split_outputs[0])
    global_output = [0.0] * dim

    for k in range(num_splits):
        weight_factor = rescaled_sums[k] / max(global_sum, 1e-12)
        for d in range(dim):
            global_output[d] += split_outputs[k][d] * weight_factor

    return global_output, global_max, global_sum
`;

export const DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT: flashDecodingSplitKKvCacheGatherInput =
  {
    split_maxes: [12.5, 14.2, 11.0, 13.8],
    split_sums: [4.2, 8.1, 2.3, 6.5],
    split_outputs: [
      [0.2, 0.8],
      [0.9, 0.1],
      [0.4, 0.6],
      [0.7, 0.3],
    ],
  };

export const generateFlashDecodingSplitKKvCacheGatherSteps = (
  input: flashDecodingSplitKKvCacheGatherInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.split_maxes.map((m, idx) => ({
    id: `split-${idx}`,
    value: `Split ${idx}: max=${m.toFixed(1)}, sum=${input.split_sums[idx].toFixed(1)}`,
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
          num_splits: String(input.split_maxes.length),
          dim: String(input.split_outputs[0]?.length ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize FlashDecoding Split-K KV Cache Gather Engine",
    "Loading partial max score array split_maxes, sumexp array split_sums, and partial output vectors.",
    { num_splits: input.split_maxes.length },
  );

  const globalMax = Math.max(...input.split_maxes);
  const currentElements = elements.map((el) => ({ ...el }));

  addStep(
    14,
    `Compute Global Maximum Score m_global = ${globalMax.toFixed(2)}`,
    "Finding maximum score across all K sequence splits to prevent float exponent overflow.",
    { global_max: Number(globalMax.toFixed(2)) },
  );

  let globalSum = 0;
  const rescaledWeights: number[] = [];

  input.split_maxes.forEach((m, k) => {
    const w = input.split_sums[k] * Math.exp(m - globalMax);
    rescaledWeights.push(w);
    globalSum += w;

    currentElements[k] = {
      ...currentElements[k],
      state: "active",
      pointers: [`rescaled_w=${w.toFixed(3)}`],
    };

    addStep(
      18,
      `Rescale Split ${k} partial sumexp: w_${k} = ${w.toFixed(3)}`,
      `Applying log-sum-exp correction factor exp(${m.toFixed(1)} - ${globalMax.toFixed(1)}). Cumulative global sum is now ${globalSum.toFixed(3)}.`,
      {
        split_idx: k,
        split_max: m,
        rescaled_w: Number(w.toFixed(3)),
        global_sum: Number(globalSum.toFixed(3)),
      },
      currentElements,
    );
  });

  const dim = input.split_outputs[0]?.length || 0;
  const globalOutput = new Array(dim).fill(0);

  input.split_maxes.forEach((_, k) => {
    const factor = rescaledWeights[k] / Math.max(globalSum, 1e-12);
    for (let d = 0; d < dim; d++) {
      globalOutput[d] += input.split_outputs[k][d] * factor;
    }
  });

  const finalElements = currentElements.map((el) => ({
    ...el,
    state: "sorted" as const,
  }));

  addStep(
    30,
    "Execution Complete",
    "Successfully accumulated rescaled partial outputs into global attention output vector O_global.",
    {
      global_max: Number(globalMax.toFixed(2)),
      global_sum: Number(globalSum.toFixed(3)),
      global_output: `[${globalOutput.map((v) => v.toFixed(3)).join(", ")}]`,
    },
    finalElements,
  );

  return steps;
};

const FLASHDECODINGSPLITKKVCACHEGATHER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "global_max = sum(split_maxes) / len(split_maxes)",
    "rescaled_w = split_sums[k] * math.exp(global_max - split_maxes[k])",
    "global_output[d] += split_outputs[k][d] * split_sums[k]",
  ],
  hints: [{ line: 18, hint: "Rescale partial sum by exp(m_k - m_global) before accumulating." }],
  lineExplanations: {
    1: "Entry point for FlashDecoding Split-K KV Cache Gather Engine.",
    14: "Finds maximum score across all sequence split blocks for numerical stability.",
    18: "Rescales partial sum-exponents using online log-sum-exp identity.",
    27: "Computes weighted average of partial split output vectors.",
    30: "Returns final global attention output vector O_global and reduced log-sum-exp metadata.",
  },
};

export const flashDecodingSplitKKvCacheGather: AlgorithmDefinition<flashDecodingSplitKKvCacheGatherInput> =
  {
    id: "flash-decoding-split-k-kv-cache-gather",
    title: "FlashDecoding Split-K KV Cache Gather Engine",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "FlashDecoding (Tri Dao et al.) parallelizes single-query LLM decode attention across long KV-cache sequence lengths. In traditional FlashAttention decode, a single query token Q (1 x D) scans the entire KV-cache sequence sequentially within a single thread block. When sequence length N exceeds 64k-1M tokens, single-query decode cannot saturate GPU Streaming Multiprocessors (SMs), resulting in under 5% hardware utilization.\n\nFlashDecoding splits the K and V sequence dimension into K_splits partition blocks processed concurrently by independent GPU thread blocks. Each thread block computes partial attention rowmax m_k, partial sum-exponent l_k, and partial output vector O_k. A lightweight final reduction gather kernel computes global rowmax m_global = max_k(m_k), rescales partial sumexps l_k_rescaled = l_k * exp(m_k - m_global), and combines partial outputs O_global = sum(O_k * l_k_rescaled) / l_global.\n\nInput Format:\n- split_maxes: Array of partial maximum attention scores m_k across K splits.\n- split_sums: Array of partial softmax sum-exponents l_k across K splits.\n- split_outputs: 2D array of partial attention output vectors O_k [K_splits, head_dim].\n\nOutput Format:\n- Returns a tuple of (global_output, global_max, global_sum) containing the reduced attention vector and log-sum-exp scalars.\n\nEdge Cases & Constraints:\n- Single split: When K_splits = 1, reduction degenerates gracefully into standard FlashAttention.\n- Extreme score disparity: Handles large negative m_k values by clamping exp(m_k - m_global) to 0 without underflow NaN.\n- Zero denominator protection: Safeguards global_sum with 1e-12 threshold against zero division.",
    constraints: [
      "1 <= split_maxes.length <= 256",
      "split_sums[i] > 0",
      "1 <= split_outputs[i].length <= 128",
    ],
    examples: [
      {
        kind: "basic",
        title: "4-Split KV Cache Reduction Gather",
        inputDisplay:
          "split_maxes=[12.5, 14.2, 11.0, 13.8], split_sums=[4.2, 8.1, 2.3, 6.5], dim=2",
        outputDisplay: "Global Max: 14.20, Global Output: [0.803, 0.197]",
        input: {
          split_maxes: [12.5, 14.2, 11.0, 13.8],
          split_sums: [4.2, 8.1, 2.3, 6.5],
          split_outputs: [
            [0.2, 0.8],
            [0.9, 0.1],
            [0.4, 0.6],
            [0.7, 0.3],
          ],
        },
        output: "Global Max: 14.20, Global Output computed",
        explanation:
          "Global max is 14.2 (split 1). Split 1 receives the highest weight, dominating the final output vector.",
      },
      {
        kind: "complex",
        title: "Equal Partial Maxes Uniform Blend",
        inputDisplay: "split_maxes=[10.0, 10.0], split_sums=[1.0, 1.0], O=[[0, 1], [1, 0]]",
        outputDisplay: "Global Max: 10.0, Global Output: [0.5, 0.5]",
        input: {
          split_maxes: [10.0, 10.0],
          split_sums: [1.0, 1.0],
          split_outputs: [
            [0.0, 1.0],
            [1.0, 0.0],
          ],
        },
        output: "Global Output: [0.5, 0.5]",
        explanation:
          "Identical partial maxes and sums produce equal 50/50 weighting of partial output vectors.",
      },
    ],
    code: FLASHDECODINGSPLITKKVCACHEGATHER_CODE,
    timeComplexity: { best: "O(K * D)", average: "O(K * D)", worst: "O(K * D)" },
    spaceComplexity: "O(K + D)",
    complexityAnalysis: {
      time: "O(K * D) where K is number of splits and D is head dimension to perform rescaled vector accumulation.",
      space: "O(K + D) auxiliary space for rescaled weights and final reduced output vector.",
    },
    topicGuide: {
      overview:
        "FlashDecoding Split-K Gather parallelizes long-context single-query decode attention by reducing partial block attention outputs via online Log-Sum-Exp rescaling.",
      sections: [
        {
          heading: "Overview",
          body: "During the decode phase of LLM serving, each step processes a single query token (Q length = 1) per sequence. In long-context scenarios (32k to 1M tokens), scanning the entire KV-cache sequentially with a single thread block severely limits GPU occupancy and underutilizes Tensor Cores.",
        },
        {
          heading: "Core Concepts",
          body: "FlashDecoding partitions the KV sequence into K_splits chunks, running parallel thread blocks on GPU SMs. Each block produces partial online Softmax statistics (partial rowmax m_k and partial sum-exp l_k) and partial output vector O_k. The Gather step unifies these splits via global log-sum-exp rescaling.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "By converting sequence-length reduction from sequential to parallel Split-K execution, FlashDecoding increases GPU SM occupancy from ~5% to near 100%. Decode speed for 64k context windows accelerates by up to 8x-10x, turning memory-bound decode latency into a predictable flat curve.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key implementation details include maintaining double-precision or max-subtracted float exponents for log-sum-exp stability, inter-threadblock SRAM reduction via atomic add or workspace buffers, and handling dynamic tile sizes aligned with PagedAttention block boundaries.",
        },
      ],
      keyTerms: [
        {
          term: "FlashDecoding",
          definition:
            "Attention kernel technique that parallelizes single-query decode attention along the KV sequence dimension.",
        },
        {
          term: "Split-K Parallelism",
          definition:
            "Decomposing sequence dimension reduction across multiple independent GPU thread blocks.",
        },
        {
          term: "Log-Sum-Exp Rescaling",
          definition:
            "Mathematical identity used to combine softmax partial sums with different maximum exponentials.",
        },
        {
          term: "Partial Softmax Reduction",
          definition:
            "Gathering partial attention output vectors O_k and normalizing by global sum-exponent l_global.",
        },
      ],
    },
    trivia: FLASHDECODINGSPLITKKVCACHEGATHER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_FLASHDECODINGSPLITKKVCACHEGATHER_INPUT,
    generateSteps: generateFlashDecodingSplitKKvCacheGatherSteps,
  };
