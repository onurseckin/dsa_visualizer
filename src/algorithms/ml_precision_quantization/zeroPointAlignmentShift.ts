import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zeroPointAlignmentShiftInput {
  values: number[];
  scale: number;
}

export const ZEROPOINTALIGNMENTSHIFT_CODE = `
def zero_point_alignment_shift(min_val, max_val, qmin=-128, qmax=127):
    """
    Aligns floating-point zero value to integer zero-point Z in asymmetric quantization.
    """
    scale = (max_val - min_val) / (qmax - qmin) if max_val != min_val else 1.0
    zero_point_initial = qmin - (min_val / scale)
    zero_point_aligned = max(qmin, min(qmax, int(round(zero_point_initial))))
    return scale, zero_point_aligned
`;

export const DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT: zeroPointAlignmentShiftInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateZeroPointAlignmentShiftSteps = (
  input: zeroPointAlignmentShiftInput,
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
    "Initialize Zero Point Alignment Shift",
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
    8,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ZEROPOINTALIGNMENTSHIFT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines zero-point alignment shift calculation function.",
    4: "Calculates quantization scale factor S = (max_val - min_val) / (qmax - qmin).",
    5: "Calculates unaligned raw zero-point zero_point_initial = qmin - (min_val / scale).",
    6: "Rounds zero-point to integer and clamps within [qmin, qmax] integer bounds.",
    7: "Returns calculated scale factor S and aligned zero-point Z.",
  },
};

export const zeroPointAlignmentShift: AlgorithmDefinition<zeroPointAlignmentShiftInput> = {
  id: "zero-point-alignment-shift",
  title: "Zero Point Alignment Shift",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "In asymmetric quantization calibration (PyTorch torch.ao.quantization.observer), computing the integer zero-point Z ensures that physical FP32 value 0.0 aligns exactly to integer Z without rounding error. Given data range [min_val, max_val] and target integer range [qmin, qmax], zero-point Z is computed as Z = round(qmin - min_val / scale) and clamped within [qmin, qmax].\n\nThis algorithm implements Zero Point Alignment Shift, calculating quantization scale factor S and computing integer-aligned zero-point Z.\n\nInput Format:\n- values: Array containing min_val and max_val bounds.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns tuple (scale, zero_point_aligned).\n\nEdge Cases & Constraints:\n- min_val == max_val (scale fallback = 1.0, Z = 0).\n- Symmetric input range around zero (min_val = -max_val, Z maps to midpoint).\n- Non-negative activation distributions (min_val >= 0, Z maps to qmin).",
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
  code: ZEROPOINTALIGNMENTSHIFT_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "Zero-point alignment guarantees that FP32 zero maps exactly to integer Z. This is crucial for zero-padding in convolutional neural networks so that padded border zeros contribute zero numeric value after de-quantization.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, scale S = (max_val - min_val) / (qmax - qmin). Raw zero-point Z_raw = qmin - min_val / S. Aligned zero-point Z = clamp(round(Z_raw), qmin, qmax).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Correct zero-point alignment eliminates boundary padding artifacts in INT8 image classification and object detection models.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes range ratio scale, calculates initial float zero-point Z_raw, rounds to nearest integer, and clamps to [qmin, qmax].",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling min_val == max_val.",
      },
    ],
    keyTerms: [
      {
        term: "Zero-Point Alignment",
        definition: "Ensuring FP32 value 0.0 maps exactly to integer Z without rounding error.",
      },
      {
        term: "Quantization Observer",
        definition:
          "PyTorch calibration module tracking tensor min/max values to calculate S and Z.",
      },
      {
        term: "Zero-Padding Invariance",
        definition:
          "Preserving exact zero value contributions when zero-padding quantized tensors.",
      },
    ],
  },
  trivia: ZEROPOINTALIGNMENTSHIFT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT,
  generateSteps: generateZeroPointAlignmentShiftSteps,
};
