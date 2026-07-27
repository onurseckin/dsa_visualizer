import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface sequenceLengthPaddingWasteCalculatorInput {
  data: number[];
  target?: number;
}

export const SEQUENCELENGTHPADDINGWASTECALCULATOR_CODE = `def sequence_length_padding_waste_calculator(sequence_lengths: list[int]) -> dict:
    """
    Calculates VRAM padding waste and compute overhead when variable-length
    sequences are padded to max_seq_len under traditional static batching.
    """
    if not sequence_lengths:
        return {"max_len": 0, "useful_tokens": 0, "padded_tokens": 0, "waste_pct": 0.0}

    max_len = max(sequence_lengths)
    batch_size = len(sequence_lengths)
    padded_tokens = max_len * batch_size
    useful_tokens = sum(sequence_lengths)
    wasted_tokens = padded_tokens - useful_tokens
    waste_pct = (wasted_tokens / padded_tokens) * 100.0 if padded_tokens > 0 else 0.0

    return {
        "max_len": max_len,
        "useful_tokens": useful_tokens,
        "padded_tokens": padded_tokens,
        "wasted_tokens": wasted_tokens,
        "waste_pct": waste_pct,
    }`;

export const DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT: sequenceLengthPaddingWasteCalculatorInput =
  {
    data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    target: 85,
  };

export const generateSequenceLengthPaddingWasteCalculatorSteps = (
  input: sequenceLengthPaddingWasteCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const sequenceLengths = input.data;
  const elements: ArrayElement[] = sequenceLengths.map((val, idx) => ({
    id: `el-${idx}`,
    value: `Req ${idx + 1}: ${val} tok`,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = elements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (idx === activeIdx) state = "active";
      else if (activeIdx >= 0 && idx < activeIdx) state = "visited";
      return {
        ...el,
        state,
        pointers: pointersMap[idx] || undefined,
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
          sequence_lengths: `[${sequenceLengths.join(", ")}]`,
          batch_size: String(sequenceLengths.length),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Enter sequence_length_padding_waste_calculator function",
    `Initializing padding waste calculator for batch of ${sequenceLengths.length} variable-length requests.`,
    { batch_size: sequenceLengths.length },
  );

  addStep(
    6,
    `Check if not sequence_lengths (len = ${sequenceLengths.length})`,
    "Verifying batch is non-empty.",
    { is_empty: sequenceLengths.length === 0 },
  );

  if (sequenceLengths.length === 0) {
    addStep(
      7,
      "Return zeroed metrics dictionary for empty input",
      "Empty batch has 0 padding waste.",
      { max_len: 0, useful_tokens: 0, padded_tokens: 0, waste_pct: 0 },
    );
    return steps;
  }

  const maxLen = Math.max(...sequenceLengths);
  addStep(
    9,
    `Compute max_len = max(sequence_lengths) -> ${maxLen}`,
    `Longest sequence in batch is ${maxLen} tokens. All other sequences will be padded to ${maxLen}.`,
    { max_len: maxLen },
  );

  const batchSize = sequenceLengths.length;
  addStep(
    10,
    `Compute batch_size = len(sequence_lengths) -> ${batchSize}`,
    `Batch contains ${batchSize} parallel requests.`,
    { batch_size: batchSize },
  );

  const paddedTokens = maxLen * batchSize;
  addStep(
    11,
    `Compute padded_tokens = max_len * batch_size -> ${maxLen} * ${batchSize} = ${paddedTokens}`,
    `Static batching allocates a rectangular matrix of shape [${batchSize}, ${maxLen}] = ${paddedTokens} total token slots.`,
    { max_len: maxLen, batch_size: batchSize, padded_tokens: paddedTokens },
  );

  let sumUseful = 0;
  sequenceLengths.forEach((len, idx) => {
    sumUseful += len;
    addStep(
      12,
      `Step ${idx + 1}/${batchSize}: Inspect req ${idx + 1} len = ${len}. Running useful_tokens sum -> ${sumUseful}`,
      `Accumulating useful unpadded token counts: +${len} tokens.`,
      { idx: idx + 1, req_len: len, running_useful_tokens: sumUseful },
      idx,
      { [idx]: [`len=${len}`, `sum=${sumUseful}`] },
    );
  });

  const usefulTokens = sumUseful;
  addStep(
    12,
    `Compute useful_tokens = sum(sequence_lengths) -> ${usefulTokens}`,
    `Total useful token payload generated across all requests: ${usefulTokens} tokens.`,
    { useful_tokens: usefulTokens },
  );

  const wastedTokens = paddedTokens - usefulTokens;
  addStep(
    13,
    `Compute wasted_tokens = padded_tokens - useful_tokens -> ${paddedTokens} - ${usefulTokens} = ${wastedTokens}`,
    `Total dummy padding token slots allocated in GPU VRAM: ${wastedTokens} wasted tokens.`,
    { padded_tokens: paddedTokens, useful_tokens: usefulTokens, wasted_tokens: wastedTokens },
  );

  const wastePct = paddedTokens > 0 ? (wastedTokens / paddedTokens) * 100 : 0;
  addStep(
    14,
    `Compute waste_pct = (wasted_tokens / padded_tokens) * 100.0 -> ${wastePct.toFixed(1)}%`,
    `VRAM and HBM memory bandwidth waste ratio: $${wastedTokens} / ${paddedTokens} = ${wastePct.toFixed(1)}\\%$.`,
    { wasted_tokens: wastedTokens, padded_tokens: paddedTokens, waste_pct: Number(wastePct.toFixed(1)) },
  );

  addStep(
    16,
    "Construct return dictionary with computed metrics",
    "Packaging padding waste metrics for reporting.",
    { max_len: maxLen, useful_tokens: usefulTokens, padded_tokens: paddedTokens, wasted_tokens: wastedTokens, waste_pct: Number(wastePct.toFixed(1)) },
  );

  addStep(
    22,
    `Return {max_len: ${maxLen}, useful: ${usefulTokens}, padded: ${paddedTokens}, wasted: ${wastedTokens}, waste_pct: ${wastePct.toFixed(1)}%}`,
    `Completed static batch padding waste calculation: ${wastePct.toFixed(1)}% of allocated VRAM is wasted padding!`,
    {
      max_len: maxLen,
      useful_tokens: usefulTokens,
      padded_tokens: paddedTokens,
      wasted_tokens: wastedTokens,
      waste_pct: Number(wastePct.toFixed(1)),
    },
  );

  return steps;
};

const SEQUENCELENGTHPADDINGWASTECALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 8, 15],
  distractors: [
    "padded_tokens = sum(sequence_lengths) * batch_size",
    "waste_pct = (useful_tokens / padded_tokens) * 100.0",
    "wasted_tokens = max_len - useful_tokens",
    "return max(sequence_lengths)",
  ],
  hints: [
    { line: 11, hint: "Compute padded_tokens as max_len * batch_size." },
    { line: 13, hint: "Subtract useful_tokens from padded_tokens to find wasted_tokens." },
    { line: 14, hint: "Calculate waste_pct as (wasted_tokens / padded_tokens) * 100.0." },
  ],
  lineExplanations: {
    1: "Function signature for sequence_length_padding_waste_calculator taking list of sequence lengths.",
    2: "Begin docstring describing static batching VRAM padding waste calculation.",
    3: "Docstring line detailing VRAM memory waste and compute overhead of padding.",
    4: "Docstring line detailing traditional static batching vs continuous batching.",
    5: "End docstring.",
    6: "Check if sequence_lengths list is empty.",
    7: "Return zeroed metrics dictionary if input sequence list is empty.",
    8: "Blank line after empty list check.",
    9: "Find maximum sequence length in batch: max_len = max(sequence_lengths).",
    10: "Determine batch size: batch_size = len(sequence_lengths).",
    11: "Compute total padded token slots: padded_tokens = max_len * batch_size.",
    12: "Sum useful non-padded token counts across all requests.",
    13: "Calculate wasted padding token count: wasted_tokens = padded_tokens - useful_tokens.",
    14: "Compute percentage of VRAM memory wasted: waste_pct = (wasted_tokens / padded_tokens) * 100.0.",
    15: "Blank line before return dictionary construction.",
    16: "Begin construction of output metrics dictionary.",
    17: "Dictionary key max_len storing peak sequence length.",
    18: "Dictionary key useful_tokens storing sum of actual sequence lengths.",
    19: "Dictionary key padded_tokens storing total rectangular tensor size.",
    20: "Dictionary key wasted_tokens storing count of dummy padding tokens.",
    21: "Dictionary key waste_pct storing floating-point VRAM waste percentage.",
    22: "Closing brace for metrics dictionary return statement.",
  },
};

export const sequenceLengthPaddingWasteCalculator: AlgorithmDefinition<sequenceLengthPaddingWasteCalculatorInput> =
  {
    id: "sequence-length-padding-waste-calculator",
    title: "Static Batching VRAM Padding Waste Calculator",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "arrays_and_hashing"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "In traditional deep learning serving frameworks, batching variable-length sequences requires padding shorter sequences with dummy tokens up to the maximum sequence length (`max_seq_len`) in the batch. Because transformer attention memory allocation scales linearly with padded sequence length and attention FLOPs scale quadratically $O(N^2)$, static padding wastes tremendous GPU memory bandwidth and VRAM capacity (often 50%-80% wasted memory).\n\n### Analytical Waste Formulas\nFor a batch of $B$ requests with lengths $L_1, L_2, \\dots, L_B$:\n- Padded Tokens: $T_{\\text{padded}} = B \\times \\max_i(L_i)$\n- Useful Tokens: $T_{\\text{useful}} = \\sum_{i=1}^B L_i$\n- Wasted Tokens: $T_{\\text{wasted}} = T_{\\text{padded}} - T_{\\text{useful}}$\n- Waste Percentage: $W = \\left(\\frac{T_{\\text{wasted}}}{T_{\\text{padded}}}\\right) \\times 100\\%$\n\nInput Format:\n- `data`: Array of sequence lengths (token counts) for requests in a batch.\n- `target`: Optional reference sequence length bound.\n\nOutput Format:\n- Returns metrics dictionary detailing `max_len`, `useful_tokens`, `padded_tokens`, `wasted_tokens`, and `waste_pct`.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 Requests Skewed Batch Waste",
        inputDisplay: "16 request sequence lengths from 10 to 85 tokens",
        outputDisplay: "Waste metrics dictionary returned",
        input: DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
        output: "Waste metrics dictionary returned",
        explanation: "Quantifies static batching VRAM waste across 16 variable-length requests.",
      },
      {
        kind: "complex",
        title: "Skewed Batch",
        inputDisplay: "seq_lens = [1, 2, 3, 4, 5]",
        outputDisplay: "{max_len: 5, useful: 15, padded: 25, waste_pct: 40.0%}",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "{max_len: 5, useful: 15, padded: 25, waste_pct: 40.0%}",
        explanation: "Padded batch tensor size is 5x5 = 25. Useful tokens = 15. Waste = 40%.",
      },
      {
        kind: "negative",
        title: "Uniform Batch",
        inputDisplay: "seq_lens = [10, 10, 10]",
        outputDisplay: "{max_len: 10, useful: 30, padded: 30, waste_pct: 0.0%}",
        input: { data: [10, 10, 10], target: 10 },
        output: "{max_len: 10, useful: 30, padded: 30, waste_pct: 0.0%}",
        explanation: "All sequences are identical length 10. Padding waste is 0%.",
      },
    ],
    code: SEQUENCELENGTHPADDINGWASTECALCULATOR_CODE,
    timeComplexity: { best: "O(B)", average: "O(B)", worst: "O(B)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "$O(B)$ where $B$ is the batch size (number of active requests).",
      space: "$O(1)$ auxiliary space storing summary metric counts.",
    },
    topicGuide: {
      overview:
        "Static batching pads all requests in a batch to the longest request's sequence length (`max_seq_len`), incurring massive VRAM and memory bandwidth waste.",
      sections: [
        {
          heading: "Overview & Static Batching Bottlenecks",
          body: "Standard deep learning frameworks (like PyTorch or TensorFlow) require rectangular tensors to perform batched GPU matrix multiplications (GEMMs). When serving requests of varying prompt and response lengths, requests must be padded with dummy pad tokens. Because LLM memory footprint and attention operations scale with padded sequence length, dummy tokens consume valuable HBM capacity and memory bandwidth while contributing nothing to output text generation.",
        },
        {
          heading: "Analytical Waste Math",
          body: "For a batch of $B$ requests with individual sequence lengths $L_1, L_2, \\dots, L_B$, static batching allocates memory for $B \\times \\max_i(L_i)$ tokens. Useful memory is $\\sum_{i=1}^B L_i$. The padding waste percentage is calculated as:\n$$W = \\frac{B \\times \\max(L_i) - \\sum L_i}{B \\times \\max(L_i)} \\times 100\\%$$\nContinuous batching eliminates this waste completely.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Padding tokens waste GPU HBM memory bandwidth during read/write cycles in multi-head attention. Transitioning from static batching to unpadded memory layouts (such as FlashAttention `cu_seqlens` or vLLM PagedAttention continuous batching) reclaims up to 80% of lost VRAM, effectively doubling server request throughput.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Even in unpadded serving engines, micro-padding may occur to align sequence token offsets to Tensor Core SIMD alignment boundaries (multiples of 8 or 16 tokens). Calculating padding waste helps inference engineers tune batch packing algorithms and sequence bucket sizes.",
        },
      ],
      keyTerms: [
        {
          term: "Static Batching",
          definition:
            "Batching technique padding all sequence inputs to a fixed rectangular max sequence dimension.",
        },
        {
          term: "Padding Waste Percentage",
          definition:
            "Proportion of total VRAM allocation consumed by dummy non-informative padding tokens.",
        },
        {
          term: "Continuous Batching",
          definition:
            "Serving mechanism operating at iteration granularities, removing sequence padding entirely.",
        },
        {
          term: "Tensor Core Alignment",
          definition:
            "Hardware requirement padding matrix dimensions to multiples of 8 or 16 for optimal FP16/INT8 SIMD speed.",
        },
      ],
    },
    trivia: SEQUENCELENGTHPADDINGWASTECALCULATOR_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "Orca: A Distributed Serving System for Transformer-Based Generative Models (Yu et al., OSDI 2022)",
      },
    ],
    defaultInput: DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT,
    generateSteps: generateSequenceLengthPaddingWasteCalculatorSteps,
  };

export default sequenceLengthPaddingWasteCalculator;
