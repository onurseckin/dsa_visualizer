import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface minMaxRangeClippingInput {
  values: number[];
  scale: number;
}

export const MINMAXRANGECLIPPING_CODE = `
def min_max_range_clipping(values, min_val=-2.0, max_val=2.0):
    """
    Clips floating point activation values to dynamic min/max range bounds.
    """
    clipped = []
    for x in values:
        val = max(min_val, min(max_val, x))
        clipped.append(val)
    return clipped
`;

export const DEFAULT_MINMAXRANGECLIPPING_INPUT: minMaxRangeClippingInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateMinMaxRangeClippingSteps = (
  input: minMaxRangeClippingInput,
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
    "Initialize Min Max Range Clipping",
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
    9,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const MINMAXRANGECLIPPING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines min-max range clipping function.",
    4: "Initializes clipped output array.",
    5: "Iterates through floating point input values.",
    6: "Clips scalar value x within range bounds: max(min_val, min(max_val, x)).",
    7: "Appends clipped scalar value to output array.",
    8: "Returns array of clipped activation values.",
  },
};

export const minMaxRangeClipping: AlgorithmDefinition<minMaxRangeClippingInput> = {
  id: "min-max-range-clipping",
  title: "Min Max Range Clipping",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "Outlier activation spikes in deep neural networks (e.g. LLM activation outliers in Transformer layers) degrade quantization precision if scale factors expand to cover extreme outlier values. Range Clipping (clipping activations to [min_val, max_val] percentiles) truncates extreme outliers, improving quantization resolution for 99.9% of normal activation values.\n\nThis algorithm implements Min Max Range Clipping, bounding scalar activation values strictly within [min_val, max_val] range limits.\n\nInput Format:\n- values: Array of FP32 floating-point values.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns array of clipped activation values.\n\nEdge Cases & Constraints:\n- Values strictly inside range (unaffected).\n- Extreme positive or negative outliers clamped to bounds.\n- Identical min_val and max_val bounds.",
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
  code: MINMAXRANGECLIPPING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "Range clipping is a standard pre-quantization calibration step in TensorRT and PyTorch static quantization. By truncating extreme outlier tails (e.g., using 99.99% KL-divergence calibration or min/max percentile bounds), the quantization scale factor S achieves significantly higher precision for non-outlier activations.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, Clip(x, [a, b]) = max(a, min(b, x)). Time complexity is O(N) with O(N) space.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Clipping outlier values reduces Mean Squared Error (MSE) in quantized activation tensors, preventing gradient explosion in QAT training.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation iterates over input values, applies nested min/max bounds clamping, and appends clipped values to output array.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling min_val > max_val validation.",
      },
    ],
    keyTerms: [
      {
        term: "Outlier Truncation",
        definition:
          "Clipping extreme activation spike values to preserve high quantization resolution for remaining data.",
      },
      {
        term: "Quantization Calibration",
        definition:
          "Analyzing sample activation distributions to select optimal [min_val, max_val] clipping bounds.",
      },
      {
        term: "KL-Divergence Calibration",
        definition:
          "Finding clipping bounds that minimize information loss between FP32 and INT8 probability distributions.",
      },
    ],
  },
  trivia: MINMAXRANGECLIPPING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_MINMAXRANGECLIPPING_INPUT,
  generateSteps: generateMinMaxRangeClippingSteps,
};
