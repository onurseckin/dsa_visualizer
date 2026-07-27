import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface bitwiseSignExtractionInput {
  values: number[];
  scale: number;
}

export const BITWISESIGNEXTRACTION_CODE = `
def bitwise_sign_extraction(fp32_values):
    """
    Extracts IEEE-754 1-bit sign indicator using bitwise right-shift (bits >> 31) & 1.
    """
    import struct
    signs = []
    for val in fp32_values:
        bits = struct.unpack('>I', struct.pack('>f', val))[0]
        sign_bit = (bits >> 31) & 1
        signs.append(sign_bit)
    return signs
`;

export const DEFAULT_BITWISESIGNEXTRACTION_INPUT: bitwiseSignExtractionInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateBitwiseSignExtractionSteps = (
  input: bitwiseSignExtractionInput,
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
    "Initialize Bitwise Sign Extraction",
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
    11,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const BITWISESIGNEXTRACTION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines bitwise sign extraction function.",
    5: "Initializes signs output array.",
    6: "Iterates through input FP32 floating point values.",
    7: "Reinterprets FP32 float bytes as 32-bit unsigned integer bit pattern.",
    8: "Extracts sign bit via bitwise right-shift (bits >> 31) and bitwise-AND 1.",
    9: "Appends extracted 1-bit sign indicator (0 or 1) to result array.",
    10: "Returns array of extracted sign bits.",
  },
};

export const bitwiseSignExtraction: AlgorithmDefinition<bitwiseSignExtractionInput> = {
  id: "bitwise-sign-extraction",
  title: "Bitwise Sign Extraction",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "In IEEE-754 single-precision floating point standard (FP32), a 32-bit float consists of 1 sign bit (bit 31), 8 exponent bits (bits 23-30), and 23 mantissa fraction bits (bits 0-22). Extracting the sign bit via bitwise right-shift (bits >> 31) & 1 operates in 1 clock cycle on GPU SIMD bitwise hardware.\n\nThis algorithm implements Bitwise Sign Extraction, converting FP32 floats to 32-bit unsigned integer bit patterns and extracting the most significant sign bit (0 for positive, 1 for negative).\n\nInput Format:\n- values: Array of FP32 floating-point numbers.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns array of 1-bit sign values (0 for non-negative, 1 for negative).\n\nEdge Cases & Constraints:\n- Negative zero (-0.0) having sign bit 1.\n- Positive zero (+0.0) having sign bit 0.\n- NaN and Infinity bit patterns.",
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
  code: BITWISESIGNEXTRACTION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "Bitwise sign extraction is used in activation functions (e.g. ReLU, Copysign, LeakyReLU), sign-based optimization algorithms (SignSGD), and binary neural network quantization (1-bit BNNs).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, an IEEE-754 32-bit float bit string B = s | e_7..e_0 | m_22..m_0. Sign bit s = (B >> 31) bitwise-AND 1.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Bitwise shift operations execute on GPU ALU bitwise units in 1 clock cycle, avoiding floating-point comparison instructions.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation reinterprets float bytes as 32-bit unsigned integers, applies right-shift >> 31, and masks with bitwise AND 1.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes distinguishing positive zero (+0.0 -> 0) from negative zero (-0.0 -> 1).",
      },
    ],
    keyTerms: [
      {
        term: "Sign Bit",
        definition:
          "The most significant bit (bit 31 in FP32) indicating number sign (0 positive, 1 negative).",
      },
      {
        term: "Bitwise Shift",
        definition:
          "Moving binary bit positions right or left using hardware bitwise shift operators.",
      },
      {
        term: "IEEE-754 Floating Point",
        definition:
          "Standard binary format representing real numbers using sign, exponent, and mantissa fields.",
      },
    ],
  },
  trivia: BITWISESIGNEXTRACTION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_BITWISESIGNEXTRACTION_INPUT,
  generateSteps: generateBitwiseSignExtractionSteps,
};
