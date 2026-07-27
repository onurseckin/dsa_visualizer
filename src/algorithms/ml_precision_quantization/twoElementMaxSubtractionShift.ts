import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface twoElementMaxSubtractionShiftInput {
  values: number[];
  scale: number;
}

export const TWOELEMENTMAXSUBTRACTIONSHIFT_CODE = `
def two_element_max_subtraction_shift(x1, x2):
    """
    Subtracts maximum of two elements to prevent exponential overflow in Softmax.
    """
    import math
    max_x = max(x1, x2)
    shift_x1 = x1 - max_x
    shift_x2 = x2 - max_x
    exp_x1, exp_x2 = math.exp(shift_x1), math.exp(shift_x2)
    return max_x, exp_x1, exp_x2
`;

export const DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT: twoElementMaxSubtractionShiftInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateTwoElementMaxSubtractionShiftSteps = (
  input: twoElementMaxSubtractionShiftInput,
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
    "Initialize Two Element Max Subtraction Shift",
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

const TWOELEMENTMAXSUBTRACTIONSHIFT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines two-element max subtraction shift function.",
    5: "Finds maximum scalar max_x = max(x1, x2).",
    6: "Calculates max-subtracted shift for x1: shift_x1 = x1 - max_x.",
    7: "Calculates max-subtracted shift for x2: shift_x2 = x2 - max_x.",
    8: "Evaluates exponential values exp_x1 = exp(shift_x1) and exp_x2 = exp(shift_x2).",
    9: "Returns tuple (max_x, exp_x1, exp_x2).",
  },
};

export const twoElementMaxSubtractionShift: AlgorithmDefinition<twoElementMaxSubtractionShiftInput> =
  {
    id: "two-element-max-subtraction-shift",
    title: "Two Element Max Subtraction Shift",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 4,
    mlInfraCategory: "ml_precision_quantization",
    description:
      "The atomic building block of online softmax and reduction kernels (e.g. FlashAttention-2 online reduction, binary softmax classifiers) subtracts max(x1, x2) from two scalar logits before evaluating exponentiation: shift_x1 = x1 - max(x1, x2), shift_x2 = x2 - max(x1, x2).\n\nThis algorithm implements Two Element Max Subtraction Shift, computing maximum scalar max(x1, x2), max-subtracted shifts, and exponential outputs.\n\nInput Format:\n- values: Array containing two floating-point logits [x1, x2].\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns tuple (max_x, exp_x1, exp_x2).\n\nEdge Cases & Constraints:\n- x1 == x2 (both shifted values equal 0.0, exponentials equal 1.0).\n- Large positive difference (e.g. x1 = 100, x2 = 0).\n- Negative input values.",
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
    code: TWOELEMENTMAXSUBTRACTIONSHIFT_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for quantized result array.",
    },
    topicGuide: {
      overview:
        "Two-element max subtraction is the fundamental step in parallel reduction trees for online softmax. In GPU warp shuffle butterfly reductions, threads pair up to compute two-element max shifts to reduce attention scores safely in shared memory.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, max_x = max(x1, x2). Shifted logits are s1 = x1 - max_x and s2 = x2 - max_x. Exponentials are e1 = exp(s1) and e2 = exp(s2) where max(e1, e2) == 1.0.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "Executing two-element max shifts inside GPU warp registers avoids shared memory round-trips during attention reductions.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation finds max_x, subtracts max_x from x1 and x2, and evaluates math.exp().",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes identical logit values x1 == x2.",
        },
      ],
      keyTerms: [
        {
          term: "Max Subtraction Shift",
          definition: "Subtracting peak logit value from operands before exponentiation.",
        },
        {
          term: "Warp Shuffle Reduction",
          definition:
            "Exchanging data between adjacent GPU threads in a warp using shuffle instructions.",
        },
        {
          term: "Online Softmax Reduction",
          definition: "Merging intermediate softmax tile statistics using pairwise max shifts.",
        },
      ],
    },
    trivia: TWOELEMENTMAXSUBTRACTIONSHIFT_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT,
    generateSteps: generateTwoElementMaxSubtractionShiftSteps,
  };
