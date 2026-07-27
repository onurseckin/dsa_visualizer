import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ieee754BitwiseDissectorInput {
  values: number[];
  scale: number;
}

export const IEEE754BITWISEDISSECTOR_CODE = `
def ieee754_bitwise_dissector(fp32_val):
    """
    Dissects 32-bit float into 1-bit sign, 8-bit biased exponent, and 23-bit mantissa.
    """
    import struct
    bits = struct.unpack('>I', struct.pack('>f', fp32_val))[0]
    sign = (bits >> 31) & 1
    exponent = (bits >> 23) & 0xFF
    mantissa = bits & 0x7FFFFF
    unbiased_exp = exponent - 127
    return sign, exponent, unbiased_exp, mantissa
`;

export const DEFAULT_IEEE754BITWISEDISSECTOR_INPUT: ieee754BitwiseDissectorInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateIeee754BitwiseDissectorSteps = (
  input: ieee754BitwiseDissectorInput,
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
    "Initialize Ieee754 Bitwise Dissector",
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

const IEEE754BITWISEDISSECTOR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines IEEE-754 bitwise dissector function.",
    5: "Packs FP32 float into bytes and unpacks as 32-bit unsigned integer bits.",
    6: "Extracts 1-bit sign indicator: (bits >> 31) & 1.",
    7: "Extracts 8-bit biased exponent: (bits >> 23) & 0xFF.",
    8: "Extracts 23-bit mantissa fraction: bits & 0x7FFFFF.",
    9: "Calculates unbiased exponent = exponent - 127.",
    10: "Returns tuple of unpacked bitfields (sign, exponent, unbiased_exp, mantissa).",
  },
};

export const ieee754BitwiseDissector: AlgorithmDefinition<ieee754BitwiseDissectorInput> = {
  id: "ieee-754-bitwise-dissector",
  title: "Ieee754 Bitwise Dissector",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "Understanding IEEE-754 single precision floating point representation is essential for numerical stability engineering and custom quantization. An FP32 number is decomposed into 1-bit sign S, 8-bit biased exponent E (bias = 127), and 23-bit fractional mantissa M: Value = (-1)^S * 2^(E - 127) * (1 + M / 2^23).\n\nThis algorithm implements Ieee754 Bitwise Dissector, unpacking FP32 binary bit strings into sign bit, biased exponent, unbiased exponent, and 23-bit mantissa components.\n\nInput Format:\n- values: Array of FP32 floating-point values (or scalar input).\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns tuple (sign, biased_exp, unbiased_exp, mantissa).\n\nEdge Cases & Constraints:\n- Subnormal numbers (exponent = 0, no implicit leading 1 bit).\n- Infinity values (exponent = 255, mantissa = 0).\n- NaN values (exponent = 255, mantissa != 0).",
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
  code: IEEE754BITWISEDISSECTOR_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "IEEE-754 Float32 dissection reveals how computers store real numbers. Unpacking bitfields via bitwise right-shift and masking enables custom precision conversions (e.g. FP32 -> BF16 by truncating 16 mantissa bits).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, FP32 value = (-1)^S * 2^(E-127) * (1.M_23). Sign S = (bits >> 31) & 1, Exponent E = (bits >> 23) & 0xFF, Mantissa M = bits & 0x7FFFFF. Unbiased exponent e = E - 127.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "BF16 (Bfloat16) truncates the lower 16 bits of FP32 mantissa while preserving all 8 exponent bits, maintaining identical dynamic range [1e-38, 3e38] with 16-bit memory storage.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation packs float into 4 bytes, unpacks as 32-bit unsigned int, applies bitwise shifts and masks, and calculates unbiased exponent E - 127.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes subnormal numbers (E = 0) and NaN representations.",
      },
    ],
    keyTerms: [
      {
        term: "Biased Exponent",
        definition:
          "Exponent stored with an added bias (+127 for FP32) to allow unsigned integer bit comparison.",
      },
      {
        term: "Implicit Leading One",
        definition:
          "The normalized 1.M format where the integer 1 before the binary point is omitted from storage.",
      },
      {
        term: "Mantissa (Significand)",
        definition: "The 23-bit fractional precision field defining number accuracy in IEEE-754.",
      },
    ],
  },
  trivia: IEEE754BITWISEDISSECTOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_IEEE754BITWISEDISSECTOR_INPUT,
  generateSteps: generateIeee754BitwiseDissectorSteps,
};
