import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface stableSoftmaxLogsumexpInput {
  values: number[];
  scale: number;
}

export const STABLESOFTMAXLOGSUMEXP_CODE = `
def stable_softmax_logsumexp(logits):
    """
    Evaluates numerically stable log(sum(exp(x - max(x)))) + max(x).
    """
    import math
    max_val = max(logits) if logits else 0.0
    sum_exp = sum(math.exp(x - max_val) for x in logits)
    lse = max_val + math.log(sum_exp)
    softmax_probs = [math.exp(x - max_val) / sum_exp for x in logits]
    return lse, softmax_probs
`;

export const DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT: stableSoftmaxLogsumexpInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateStableSoftmaxLogsumexpSteps = (
  input: stableSoftmaxLogsumexpInput,
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
    "Initialize Stable Softmax Logsumexp",
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
    10,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const STABLESOFTMAXLOGSUMEXP_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines numerically stable Softmax and LogSumExp function.",
    5: "Finds maximum logit value max_val in input vector.",
    6: "Calculates sum of max-shifted exponentials sum_exp = sum(exp(x - max_val)).",
    7: "Calculates numerically stable LogSumExp lse = max_val + log(sum_exp).",
    8: "Calculates normalized Softmax probability distribution: exp(x - max_val) / sum_exp.",
    9: "Returns LogSumExp scalar lse and normalized Softmax probabilities array.",
  },
};

export const stableSoftmaxLogsumexp: AlgorithmDefinition<stableSoftmaxLogsumexpInput> = {
  id: "stable-softmax-logsumexp",
  title: "Stable Softmax Logsumexp",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "In cross-entropy loss functions and attention score normalization (PyTorch torch.logsumexp, F.softmax), naive evaluation of exp(x) causes floating-point overflow when logits exceed 88.7 in FP32 or 11.0 in FP16. Max Subtraction Trick evaluates LogSumExp as LSE(x) = max(x) + log(sum(exp(x - max(x)))), guaranteeing exponentials never exceed exp(0) = 1.0.\n\nThis algorithm implements Stable Softmax Logsumexp, evaluating max-subtracted LogSumExp and normalized Softmax probability distributions.\n\nInput Format:\n- values: Array of logit floating-point values.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns scalar LogSumExp result (LSE) and array of normalized Softmax probabilities.\n\nEdge Cases & Constraints:\n- Large positive logits (e.g., logits = [1000, 1001], naive exp overflows to infinity).\n- Large negative logits.\n- Single element logit array.",
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
  code: STABLESOFTMAXLOGSUMEXP_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "LogSumExp (LSE) is a smooth approximation of the maximum function used extensively in machine learning loss functions (Cross-Entropy Loss, Soft-Maximum). Subtracting max(x) ensures complete numerical stability across FP32, FP16, and BF16 precision formats.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, LSE(x) = log(sum_i exp(x_i)) = m + log(sum_i exp(x_i - m)) where m = max_i(x_i). Softmax p_i = exp(x_i - m) / sum_j exp(x_j - m).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Evaluating LogSumExp stably prevents NaN loss crashes during deep neural network training.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation finds row maximum max_val, computes exp(x - max_val), sums exponentials, calculates LSE = max_val + log(sum_exp), and outputs normalized probabilities.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes empty logit vectors.",
      },
    ],
    keyTerms: [
      {
        term: "LogSumExp (LSE)",
        definition:
          "Smooth maximum function log(sum(exp(x))) used in cross-entropy loss and attention normalization.",
      },
      {
        term: "Max Subtraction Trick",
        definition:
          "Subtracting max(x) from logits before exponentiation to prevent floating point overflow.",
      },
      {
        term: "Floating Point Overflow",
        definition:
          "Calculation exceeding maximum floating point exponent capacity, producing Infinity/NaN.",
      },
    ],
  },
  trivia: STABLESOFTMAXLOGSUMEXP_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT,
  generateSteps: generateStableSoftmaxLogsumexpSteps,
};
