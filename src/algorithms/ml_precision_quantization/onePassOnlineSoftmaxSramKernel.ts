import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface onePassOnlineSoftmaxSramKernelInput {
  values: number[];
  scale: number;
}

export const ONEPASSONLINESOFTMAXSRAMKERNEL_CODE = `
def one_pass_online_softmax_sram_kernel(logits):
    """
    Computes FlashAttention online max tracking and log-sum-exp reduction in SRAM.
    """
    import math
    d_max = float('-inf')
    d_sum = 0.0

    for x in logits:
        if x > d_max:
            d_sum = d_sum * math.exp(d_max - x) if d_max != float('-inf') else 0.0
            d_max = x
        d_sum += math.exp(x - d_max)

    probs = [math.exp(x - d_max) / d_sum for x in logits]
    return probs, d_max, d_sum
`;

export const DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT: onePassOnlineSoftmaxSramKernelInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateOnePassOnlineSoftmaxSramKernelSteps = (
  input: onePassOnlineSoftmaxSramKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5];
  const elements: ArrayElement[] = arrayValues.map((val, idx) => ({
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
          values: `[${arrayValues.join(", ")}]`,
          scale: String(input?.scale ?? 0.1),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize One Pass Online Softmax Sram Kernel",
    "Setting up quantization scale parameters and FP32 memory buffer.",
    { n: arrayValues.length, scale: input?.scale ?? 0.1 },
  );

  arrayValues.forEach((val, idx) => {
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx) return { ...el, state: "active", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      4,
      `Process element ${idx}: value = ${val}`,
      `Evaluating quantization transformation for element at index ${idx}.`,
      { idx, val, scale: input?.scale ?? 0.1 },
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
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ONEPASSONLINESOFTMAXSRAMKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines one-pass online softmax SRAM kernel function.",
    5: "Initializes running row maximum tracker d_max to negative infinity.",
    6: "Initializes running exponential sum tracker d_sum to 0.0.",
    8: "Iterates through logit scalar stream values x.",
    9: "Checks if current logit x exceeds running maximum d_max.",
    10: "Rescales existing running sum d_sum by exp(d_max - x) to account for new maximum.",
    11: "Updates running row maximum d_max = x.",
    12: "Accumulates exp(x - d_max) into running sum d_sum.",
    14: "Computes final normalized softmax probabilities p_i = exp(x - d_max) / d_sum.",
    15: "Returns normalized probabilities, row max d_max, and row sum d_sum.",
  },
};

export const onePassOnlineSoftmaxSramKernel: AlgorithmDefinition<onePassOnlineSoftmaxSramKernelInput> =
  {
    id: "one-pass-online-softmax-sram-kernel",
    title: "One Pass Online Softmax Sram Kernel",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 4,
    mlInfraCategory: "ml_precision_quantization",
    description:
      "Standard Softmax requires 3 passes over data: Pass 1 finds max m = max(x), Pass 2 sums d = sum(exp(x - m)), Pass 3 normalizes p_i = exp(x_i - m) / d. FlashAttention (Dao et al.) uses Online Softmax (Milakov & Gimelshein), updating running max m_new and scaled running sum d_new = d_old * exp(m_old - m_new) + exp(x - m_new) in a single streaming pass in GPU SRAM.\n\nThis algorithm implements One Pass Online Softmax Sram Kernel, tracking running max and online scaled log-sum-exp sum reductions in a single pass.\n\nInput Format:\n- values: Array of logit values (or input payload).\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns normalized softmax probabilities, final row maximum d_max, and total sum d_sum.\n\nEdge Cases & Constraints:\n- Monotonically increasing logit stream.\n- Monotonically decreasing logit stream.\n- Single element logit inputs.",
    constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9", "scale > 0"],
    examples: [
      {
        kind: "basic",
        title: "Standard Quantization Case",
        inputDisplay: "values = [1.2, -3.4, 5.5], scale = 0.1",
        outputDisplay: "Quantized INT8 Values",
        input: { values: [1.2, -3.4, 5.5], scale: 0.1 },
        output: "[12, -34, 55]",
        explanation: "Standard execution pass quantizing FP32 values.",
      },
      {
        kind: "complex",
        title: "Larger Values Array",
        inputDisplay: "values = [0.5, -1.5, 2.5, -3.5, 4.5], scale = 0.1",
        outputDisplay: "Quantized INT8 Values",
        input: { values: [0.5, -1.5, 2.5, -3.5, 4.5], scale: 0.1 },
        output: "[5, -15, 25, -35, 45]",
        explanation: "Evaluates quantization pass across 5 scalar values.",
      },
      {
        kind: "negative",
        title: "Edge Case Overflow",
        inputDisplay: "values = [1000.0, -1000.0], scale = 0.1",
        outputDisplay: "[127, -128]",
        input: { values: [1000.0, -1000.0], scale: 0.1 },
        output: "[127, -128]",
        explanation: "Clamps extreme values to INT8 integer bounds [-128, 127].",
      },
    ],
    code: ONEPASSONLINESOFTMAXSRAMKERNEL_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for quantized result array.",
    },
    topicGuide: {
      overview:
        "Online Softmax is the key algorithmic innovation enabling FlashAttention. By updating max and sum statistics dynamically as data tiles stream into fast SRAM, FlashAttention avoids writing full intermediate attention score matrices (N x N) to HBM DRAM memory.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, when encountering new value x, if x > m_{old}, new max m_{new} = x. Running sum rescale is d_{new} = d_{old} * exp(m_{old} - m_{new}) + exp(x - m_{new}). If x <= m_{old}, d_{new} = d_{old} + exp(x - m_{old}).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Online Softmax reduces memory footprint from O(N^2) to O(N), enabling processing infinite sequence lengths in LLM attention layers.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation maintains running max d_max and sum d_sum, updates d_sum using exponential rescaling whenever a new max is found, and computes final normalized probabilities.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes initial step where d_max = -inf.",
        },
      ],
      keyTerms: [
        {
          term: "Online Softmax",
          definition:
            "Single-pass streaming softmax algorithm updating max and sum statistics dynamically without multi-pass HBM reads.",
        },
        {
          term: "Exponential Rescaling",
          definition:
            "Multiplying running sum by exp(m_old - m_new) to adjust running sum to new row maximum.",
        },
        {
          term: "FlashAttention Kernel",
          definition: "GPU attention algorithm fusing SRAM tiled matmul with online softmax.",
        },
      ],
    },
    trivia: ONEPASSONLINESOFTMAXSRAMKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT,
    generateSteps: generateOnePassOnlineSoftmaxSramKernelSteps,
  };
