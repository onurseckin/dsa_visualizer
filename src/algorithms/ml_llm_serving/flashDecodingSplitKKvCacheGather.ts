import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface flashDecodingSplitKKvCacheGatherInput {
  split_maxes: number[];
  split_sums: number[];
  split_outputs: number[][];
}

export const FLASHDECODINGSPLITKKVCACHEGATHER_CODE = `import math

def flash_decoding_split_k_gather(split_maxes, split_sums, split_outputs):
    num_splits = len(split_maxes)
    if num_splits == 0:
        return [], 0.0, 0.0

    global_max = max(split_maxes)

    rescaled_sums = []
    global_sum = 0.0
    for k in range(num_splits):
        rescaled_w = split_sums[k] * math.exp(split_maxes[k] - global_max)
        rescaled_sums.append(rescaled_w)
        global_sum += rescaled_w

    dim = len(split_outputs[0])
    global_output = [0.0] * dim

    for k in range(num_splits):
        weight_factor = rescaled_sums[k] / max(global_sum, 1e-12)
        for d in range(dim):
            global_output[d] += split_outputs[k][d] * weight_factor

    return global_output, global_max, global_sum`;

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

  const { split_maxes, split_sums, split_outputs } = input;
  const numSplits = split_maxes.length;

  const elements: ArrayElement[] = split_maxes.map((m, idx) => ({
    id: `split-${idx}`,
    value: `Split ${idx}: m=${m.toFixed(1)}, l=${split_sums[idx].toFixed(1)}`,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeSplitIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
    customElements?: ArrayElement[],
  ) => {
    const baseElements = customElements || elements;
    const updatedElements: ArrayElement[] = baseElements.map((el, idx) => {
      let state: ArrayElement["state"] = el.state;
      if (activeSplitIdx >= 0 && idx === activeSplitIdx) state = "active";
      else if (activeSplitIdx >= 0 && idx < activeSplitIdx && state !== "sorted") state = "visited";
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
          num_splits: String(numSplits),
          dim: String(split_outputs[0]?.length ?? 0),
        },
      },
      variables,
    });
  };

  // Step 1: Import line 1
  addStep(
    1,
    "import math",
    "Importing math module for exponential calculation exp(m_k - m_global).",
    { num_splits: numSplits },
  );

  // Step 2: Function signature line 3
  addStep(
    3,
    "Enter flash_decoding_split_k_gather function",
    "Initializing online log-sum-exp reduction gather for Split-K decoding attention splits.",
    { num_splits: numSplits },
  );

  // Step 3: num_splits line 4
  addStep(
    4,
    `Compute num_splits = len(split_maxes) -> ${numSplits}`,
    `Found ${numSplits} parallel GPU thread block splits to reduce.`,
    { num_splits: numSplits },
  );

  // Step 4: empty check line 5
  addStep(
    5,
    `Check if num_splits == 0 -> ${numSplits === 0}`,
    "Verifying non-empty split partition list.",
    { num_splits: numSplits },
  );

  if (numSplits === 0) {
    addStep(6, "Return [], 0.0, 0.0 for empty splits", "Early exit.", { empty: true });
    return steps;
  }

  // Step 5: Global max line 8
  const globalMax = Math.max(...split_maxes);
  addStep(
    8,
    `Compute global_max = max(split_maxes) -> ${globalMax.toFixed(2)}`,
    `Global maximum attention score across all ${numSplits} splits: $m_{\\text{global}} = ${globalMax.toFixed(2)}$.`,
    { global_max: Number(globalMax.toFixed(2)) },
  );

  // Step 6: rescaled_sums init line 10
  addStep(
    10,
    "Initialize rescaled_sums = []",
    "Allocating list to store rescaled sum-exponent denominators $l_k \\cdot e^{m_k - m_{\\text{global}}}$.",
    { rescaled_sums: "[]" },
  );

  // Step 7: global_sum init line 11
  addStep(
    11,
    "Initialize global_sum = 0.0",
    "Accumulator for global softmax denominator $L_{\\text{global}}$.",
    { global_sum: 0.0 },
  );

  const rescaledSums: number[] = [];
  let globalSum = 0.0;
  const currentElements = [...elements];

  // Step 8: Loop for rescaled sums lines 12-15
  for (let k = 0; k < numSplits; k++) {
    addStep(
      12,
      `Loop k=${k} of num_splits=${numSplits}`,
      `Rescaling split ${k} partial softmax sum-exponent.`,
      { k, split_max: split_maxes[k], split_sum: split_sums[k] },
      k,
      { [k]: [`m_${k}=${split_maxes[k]}`] },
      currentElements,
    );

    const diff = split_maxes[k] - globalMax;
    const expFactor = Math.exp(diff);
    const rescaledW = split_sums[k] * expFactor;

    addStep(
      13,
      `Split ${k}: rescaled_w = ${split_sums[k]} * exp(${split_maxes[k]} - ${globalMax.toFixed(1)}) -> ${rescaledW.toFixed(4)}`,
      `Rescaled weight $w_${k} = ${split_sums[k]} \\cdot e^{${diff.toFixed(2)}} = ${rescaledW.toFixed(4)}$.`,
      {
        k,
        diff: Number(diff.toFixed(2)),
        expFactor: Number(expFactor.toFixed(4)),
        rescaledW: Number(rescaledW.toFixed(4)),
      },
      k,
      { [k]: [`rescaled_w=${rescaledW.toFixed(3)}`] },
      currentElements,
    );

    rescaledSums.push(rescaledW);
    addStep(
      14,
      `Split ${k}: rescaled_sums.append(${rescaledW.toFixed(4)})`,
      `Appended rescaled weight for split ${k}.`,
      { k, rescaledW: Number(rescaledW.toFixed(4)) },
      k,
      {},
      currentElements,
    );

    globalSum += rescaledW;
    currentElements[k] = {
      ...currentElements[k],
      value: `Split ${k}: w=${rescaledW.toFixed(2)}`,
      state: "sorted",
    };

    addStep(
      15,
      `Split ${k}: global_sum += ${rescaledW.toFixed(4)} -> ${globalSum.toFixed(4)}`,
      `Updated global denominator sum: $L_{\\text{global}} = ${globalSum.toFixed(4)}$.`,
      { k, global_sum: Number(globalSum.toFixed(4)) },
      k,
      { [k]: [`global_sum=${globalSum.toFixed(2)}`] },
      currentElements,
    );
  }

  // Step 9: Dim line 17
  const dim = split_outputs[0]?.length || 0;
  addStep(
    17,
    `Compute dim = len(split_outputs[0]) -> ${dim}`,
    `Attention head vector dimension $D = ${dim}$.`,
    { dim },
  );

  // Step 10: global_output init line 18
  const globalOutput = new Array(dim).fill(0.0);
  addStep(
    18,
    `Initialize global_output = [0.0] * ${dim}`,
    "Allocating zero-initialized global output attention accumulator vector.",
    { global_output: `[${globalOutput.join(", ")}]` },
  );

  // Step 11: Loop for weighted accumulation lines 20-23
  for (let k = 0; k < numSplits; k++) {
    addStep(
      20,
      `Loop k=${k}: Accumulate split output vector O_${k}`,
      `Calculating global weight factor for split ${k}.`,
      { k },
      k,
      { [k]: [`split_${k}`] },
      currentElements,
    );

    const weightFactor = rescaledSums[k] / Math.max(globalSum, 1e-12);
    addStep(
      21,
      `Split ${k}: weight_factor = ${rescaledSums[k].toFixed(4)} / ${globalSum.toFixed(4)} -> ${weightFactor.toFixed(4)}`,
      `Normalized attention weight for split ${k}: $\\alpha_${k} = ${weightFactor.toFixed(4)}$ (${(weightFactor * 100).toFixed(1)}%).`,
      { k, weight_factor: Number(weightFactor.toFixed(4)) },
      k,
      { [k]: [`weight=${(weightFactor * 100).toFixed(1)}%`] },
      currentElements,
    );

    for (let d = 0; d < dim; d++) {
      addStep(
        22,
        `Split ${k}, Dim ${d}: inner loop over vector dimensions`,
        `Multiplying dimension ${d} of split vector $O_{${k}, ${d}}$ by weight $\\alpha_${k}$.`,
        { k, d, val: split_outputs[k][d] },
        k,
      );

      const term = split_outputs[k][d] * weightFactor;
      globalOutput[d] += term;
      addStep(
        23,
        `Split ${k}, Dim ${d}: global_output[${d}] += ${split_outputs[k][d]} * ${weightFactor.toFixed(4)} -> ${globalOutput[d].toFixed(4)}`,
        `Accumulated dimension ${d}: $O_{\\text{global}}[${d}] = ${globalOutput[d].toFixed(4)}$.`,
        { k, d, term: Number(term.toFixed(4)), global_out_d: Number(globalOutput[d].toFixed(4)) },
        k,
      );
    }
  }

  // Step 12: Final return line 25
  addStep(
    25,
    "Return global_output, global_max, global_sum",
    `Completed FlashDecoding Split-K gather reduction! $O_{\\text{global}} = [${globalOutput.map((v) => v.toFixed(3)).join(", ")}]$, $m_{\\text{global}} = ${globalMax.toFixed(2)}$, $L_{\\text{global}} = ${globalSum.toFixed(3)}$.`,
    {
      global_max: Number(globalMax.toFixed(2)),
      global_sum: Number(globalSum.toFixed(3)),
      global_output: `[${globalOutput.map((v) => v.toFixed(3)).join(", ")}]`,
    },
    -1,
    {},
    currentElements,
  );

  return steps;
};

const FLASHDECODINGSPLITKKVCACHEGATHER_TRIVIA: TriviaMeta = {
  skipLines: [2, 7, 9, 16, 19, 24],
  distractors: [
    "global_max = sum(split_maxes)",
    "rescaled_w = split_sums[k] * split_maxes[k]",
    "weight_factor = rescaled_sums[k] * global_sum",
    "global_output[d] = split_outputs[k][d]",
  ],
  hints: [
    { line: 8, hint: "Find global maximum attention score across all splits: max(split_maxes)." },
    { line: 13, hint: "Rescale split sum-exponent using math.exp(split_maxes[k] - global_max)." },
    {
      line: 21,
      hint: "Compute normalized weight factor: rescaled_sums[k] / max(global_sum, 1e-12).",
    },
  ],
  lineExplanations: {
    1: "Import math module for exponential function math.exp.",
    2: "Blank line after imports.",
    3: "Function signature for flash_decoding_split_k_gather taking split_maxes, split_sums, and split_outputs.",
    4: "Compute number of splits: num_splits = len(split_maxes).",
    5: "Check if num_splits equals zero.",
    6: "Return empty results if zero splits.",
    7: "Blank line before global max calculation.",
    8: "Compute global maximum score across all K splits: global_max = max(split_maxes).",
    9: "Blank line before rescaling sum-exponents.",
    10: "Initialize empty list rescaled_sums for rescaled sum-exponents.",
    11: "Initialize global_sum counter to 0.0.",
    12: "Loop over split indices k in range(num_splits).",
    13: "Rescale partial sum-exponent for split k: rescaled_w = split_sums[k] * math.exp(split_maxes[k] - global_max).",
    14: "Append rescaled_w to rescaled_sums.",
    15: "Accumulate rescaled_w into global_sum.",
    16: "Blank line before output vector allocation.",
    17: "Get vector dimension dim = len(split_outputs[0]).",
    18: "Initialize global_output list with zeroes of length dim.",
    19: "Blank line before weighted output accumulation loop.",
    20: "Loop over split indices k in range(num_splits) for weighted sum accumulation.",
    21: "Compute weight_factor = rescaled_sums[k] / max(global_sum, 1e-12).",
    22: "Loop over output vector dimensions d in range(dim).",
    23: "Accumulate weighted split output into global_output[d] += split_outputs[k][d] * weight_factor.",
    24: "Blank line before return statement.",
    25: "Return tuple of global_output vector, global_max scalar, and global_sum scalar.",
  },
};

export const flashDecodingSplitKKvCacheGather: AlgorithmDefinition<flashDecodingSplitKKvCacheGatherInput> =
  {
    id: "flash-decoding-split-k-kv-cache-gather",
    title: "FlashDecoding Split-K KV Cache Gather Engine",
    topicIds: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Hard",
    description:
      "FlashDecoding (Tri Dao et al.) parallelizes single-query LLM decode attention across long KV-cache sequence lengths. In traditional FlashAttention decode, a single query token Q (1 x D) scans the entire KV-cache sequence sequentially within a single thread block. When sequence length N exceeds 64k-1M tokens, single-query decode cannot saturate GPU Streaming Multiprocessors (SMs), resulting in under 5% hardware utilization.\n\n### FlashDecoding Split-K Reduction Math\nFlashDecoding splits the K and V sequence dimension into $K_{\\text{splits}}$ partition blocks processed concurrently by independent GPU thread blocks. Each thread block computes partial attention rowmax $m_k$, partial sum-exponent $l_k$, and partial output vector $O_k$.\n\nA lightweight final reduction gather kernel computes:\n1. **Global Rowmax**: $m_{\\text{global}} = \\max_k(m_k)$\n2. **Rescaled Sum-Exponents**: $l_{k, \\text{rescaled}} = l_k \\cdot e^{m_k - m_{\\text{global}}}$\n3. **Global Softmax Denominator**: $L_{\\text{global}} = \\sum_k l_{k, \\text{rescaled}}$\n4. **Global Output Vector**: $O_{\\text{global}} = \\sum_k O_k \\cdot \\frac{l_{k, \\text{rescaled}}}{L_{\\text{global}}}$\n\n### Input Parameters\n- `split_maxes`: Array of partial maximum attention scores $m_k$.\n- `split_sums`: Array of partial softmax sum-exponents $l_k$.\n- `split_outputs`: 2D array of partial attention output vectors $O_k$.\n\n### Output\n- Returns tuple `(global_output, global_max, global_sum)`.",
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
      time: "$O(K \\cdot D)$ where $K$ is number of splits and $D$ is head dimension to perform rescaled vector accumulation.",
      space: "$O(K + D)$ auxiliary space for rescaled weights and final reduced output vector.",
    },
    topicGuide: {
      overview:
        "FlashDecoding Split-K Gather parallelizes long-context single-query decode attention by reducing partial block attention outputs via online Log-Sum-Exp rescaling.",
      sections: [
        {
          heading: "Overview & Decoding Bottlenecks",
          body: "During the decode phase of LLM serving, each step processes a single query token (Q length = 1) per sequence. In long-context scenarios (32k to 1M tokens), scanning the entire KV-cache sequentially with a single thread block severely limits GPU occupancy and underutilizes Tensor Cores.",
        },
        {
          heading: "Split-K Parallelism & Online Log-Sum-Exp",
          body: "FlashDecoding partitions the KV sequence into $K_{\\text{splits}}$ chunks, running parallel thread blocks on GPU SMs. Each block produces partial online Softmax statistics (partial rowmax $m_k$ and partial sum-exp $l_k$) and partial output vector $O_k$. The Gather step unifies these splits via global log-sum-exp rescaling.",
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

export default flashDecodingSplitKKvCacheGather;
