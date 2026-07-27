import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface scalarInt8QuantizationInput {
  values: number[];
  scale: number;
}

export const SCALARINT8QUANTIZATION_CODE = `
def scalar_int8_quantization(val, scale=0.1, zero_point=0):
    """
    Quantizes a single floating point scalar into 8-bit signed integer INT8.
    """
    q_val = int(round(val / scale)) + zero_point
    clamped = max(-128, min(127, q_val))
    return clamped
`;

export const DEFAULT_SCALARINT8QUANTIZATION_INPUT: scalarInt8QuantizationInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateScalarInt8QuantizationSteps = (
  input: scalarInt8QuantizationInput,
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
    "Initialize Scalar Int8 Quantization",
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
    7,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SCALARINT8QUANTIZATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines scalar INT8 quantization function.",
    4: "Scales input val by scale factor S, rounds to nearest integer, and adds zero-point Z.",
    5: "Clamps result integer strictly within signed 8-bit range [-128, 127].",
    6: "Returns quantized INT8 integer value.",
  },
};

export const scalarInt8Quantization: AlgorithmDefinition<scalarInt8QuantizationInput> = {
  id: "scalar-int8-quantization",
  title: "Scalar Int8 Quantization",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "The scalar quantization primitive maps an individual FP32 floating point value into an 8-bit signed integer INT8 [-128, 127] given scale factor S and zero-point Z: q = clamp(round(x / S) + Z, -128, 127).\n\nThis algorithm implements Scalar Int8 Quantization, performing division by scale factor S, adding zero-point offset Z, rounding to nearest integer, and clamping to 8-bit bounds.\n\nInput Format:\n- values: Array of values (or scalar query value).\n- scale: Floating-point scale parameter S (default: 0.1).\n\nOutput Format:\n- Returns 8-bit quantized signed INT8 integer value.\n\nEdge Cases & Constraints:\n- Scalar value exceeding positive INT8 bound (+127).\n- Scalar value below negative INT8 bound (-128).\n- Exact scale alignment (x / S is an exact integer).",
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
  code: SCALARINT8QUANTIZATION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "Scalar INT8 quantization is the inner-most kernel atomic step executed billions of times during INT8 tensor quantization. Understanding scalar quantization rounding and clamping rules is fundamental to quantization engineering.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, q = max(-128, min(127, round(x / S) + Z)). De-quantized approximation is x_approx = (q - Z) * S.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Executing scalar INT8 operations on GPU SIMD vector registers enables packed byte operations (4 INT8 values packed into 1 32-bit register).",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation computes scaled quotient val / scale, rounds to nearest integer, adds zero_point offset, and clamps within [-128, 127].",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes round-half-to-even rounding behavior.",
      },
    ],
    keyTerms: [
      {
        term: "Scalar Quantization",
        definition:
          "Quantizing an isolated scalar floating point value into an integer representation.",
      },
      {
        term: "Clamping Function",
        definition:
          "Restricting values to lie strictly within lower and upper bounds min(max_val, max(min_val, x)).",
      },
      {
        term: "Rounding-to-Nearest",
        definition: "Rounding fractional float quotients to the closest whole integer value.",
      },
    ],
  },
  trivia: SCALARINT8QUANTIZATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_SCALARINT8QUANTIZATION_INPUT,
  generateSteps: generateScalarInt8QuantizationSteps,
};
