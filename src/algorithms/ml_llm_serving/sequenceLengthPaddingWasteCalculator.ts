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
    }
`;

export const DEFAULT_SEQUENCELENGTHPADDINGWASTECALCULATOR_INPUT: sequenceLengthPaddingWasteCalculatorInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateSequenceLengthPaddingWasteCalculatorSteps = (
  input: sequenceLengthPaddingWasteCalculatorInput,
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
    6,
    "Initialize Static Batching VRAM Padding Waste Calculator",
    "Setting up request sequence length metrics and tensor padding overhead tracking.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`seq_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      12,
      `Process element ${idx}: value = ${val}`,
      `Measuring sequence ${idx} length ${val} against batch max sequence length.`,
      { idx, val, isTarget },
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
    "Completed static batch padding waste calculation. Quantified useful vs wasted VRAM memory allocations.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SEQUENCELENGTHPADDINGWASTECALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [
    { line: 12, hint: "Sum useful sequence lengths and compare against max_seq_len * batch_size." },
  ],
  lineExplanations: {
    6: "Defines entry point for Static Batching VRAM Padding Waste Calculator.",
    12: "Accumulates active sequence token lengths across batch.",
    16: "Returns padding metrics dictionary.",
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
      "In traditional deep learning serving frameworks, batching variable-length sequences requires padding shorter sequences with dummy tokens up to the maximum sequence length (`max_seq_len`) in the batch. Because transformer attention memory allocation scales linearly with padded sequence length and attention FLOPs scale quadratically $O(N^2)$, static padding wastes tremendous GPU memory bandwidth and VRAM capacity (often 50%-80% wasted memory). This calculator quantifies useful vs padded token volume, providing empirical metrics to justify continuous/iteration-level batching (e.g. vLLM or Orca).\n\nInput Format:\n- `data`: Array of sequence lengths (token counts) for requests in a batch.\n- `target`: Optional reference sequence length bound.\n\nOutput Format:\n- Returns metrics dictionary detailing `max_len`, `useful_tokens`, `padded_tokens`, `wasted_tokens`, and `waste_pct`.\n\nEdge Cases & Constraints:\n- Uniform sequence lengths (e.g. all sequences 100 tokens) incur 0% padding waste.\n- Highly skewed batch (one sequence of 1000 tokens, rest of 10 tokens) causes >90% VRAM waste.\n- Empty request input returns zeroed metrics safely.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "seq_lens = [10, 20, 30, 40, 50]",
        outputDisplay: "{max_len: 50, useful: 150, padded: 250, waste_pct: 40.0%}",
        input: { data: [10, 20, 30, 40, 50], target: 30 },
        output: "{max_len: 50, useful: 150, padded: 250, waste_pct: 40.0%}",
        explanation:
          "Padded batch tensor dimension is 5x50 = 250 tokens. Useful tokens sum to 150. Waste is (250-150)/250 = 40%.",
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
      time: "O(B) where B is the batch size (number of active requests).",
      space: "O(1) auxiliary space storing summary metric counts.",
    },
    topicGuide: {
      overview:
        "Static batching pads all requests in a batch to the longest request's sequence length (`max_seq_len`), incurring massive VRAM and memory bandwidth waste.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Standard deep learning frameworks (like PyTorch or TensorFlow) require rectangular tensors to perform batched GPU matrix multiplications (GEMMs). When serving requests of varying prompt and response lengths, requests must be padded with dummy pad tokens. Because LLM memory footprint and attention operations scale with padded sequence length, dummy tokens consume valuable HBM capacity and memory bandwidth while contributing nothing to output text generation.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "For a batch of $B$ requests with individual sequence lengths $L_1, L_2, \\dots, L_B$, static batching allocates memory for $B \\times \\max_i(L_i)$ tokens. Useful memory is $\\sum_{i=1}^B L_i$. The padding waste percentage is calculated as $W = \\frac{B \\times \\max(L_i) - \\sum L_i}{B \\times \\max(L_i)} \\times 100\\%$.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "Padding tokens waste GPU HBM memory bandwidth during read/write cycles in multi-head attention. Transitioning from static batching to unpadded memory layouts (such as FlashAttention `cu_seqlens` or vLLM PagedAttention continuous batching) reclaims up to 80% of lost VRAM, effectively doubling server request throughput.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
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
