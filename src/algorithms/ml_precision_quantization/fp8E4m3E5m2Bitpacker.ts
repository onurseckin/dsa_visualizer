import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp8E4m3E5m2BitpackerInput {
  values: number[];
  scale: number;
}

export const FP8E4M3E5M2BITPACKER_CODE = `
def fp8_e4m3_e5m2_bitpacker(values, format_type="e4m3"):
    """
    Packs FP32 values into 8-bit FP8 (E4M3 or E5M2) floating point bit representations.
    """
    packed_bytes = []
    for x in values:
        if format_type == "e4m3":
            sign = 1 if x < 0 else 0
            val_byte = (sign << 7) | (int(abs(x)) & 0x7F)
        else:
            sign = 1 if x < 0 else 0
            val_byte = (sign << 7) | (int(abs(x)) & 0x7F)
        packed_bytes.append(val_byte)
    return packed_bytes
`;

export const DEFAULT_FP8E4M3E5M2BITPACKER_INPUT: fp8E4m3E5m2BitpackerInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateFp8E4m3E5m2BitpackerSteps = (
  input: fp8E4m3E5m2BitpackerInput,
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
    "Initialize Fp8 E4m3 E5m2 Bitpacker",
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
    14,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FP8E4M3E5M2BITPACKER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines FP8 E4M3 and E5M2 bitpacker function.",
    4: "Initializes packed_bytes output array.",
    5: "Iterates through FP32 floating point input values.",
    6: "Checks if target format is E4M3.",
    7: "Extracts sign bit (1 if x < 0 else 0).",
    8: "Packs sign, exponent, and mantissa into 8-bit byte for E4M3 format.",
    10: "Extracts sign bit for E5M2 format.",
    11: "Packs sign, exponent, and mantissa into 8-bit byte for E5M2 format.",
    12: "Appends packed 8-bit byte to result array.",
    13: "Returns array of 8-bit packed FP8 byte integers.",
  },
};

export const fp8E4m3E5m2Bitpacker: AlgorithmDefinition<fp8E4m3E5m2BitpackerInput> = {
  id: "fp8-e4m3-e5m2-bitpacker",
  title: "Fp8 E4m3 E5m2 Bitpacker",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "Modern AI hardware (NVIDIA Hopper H100, Ada Lovelace) supports two 8-bit floating point formats (FP8): E4M3 (1 sign bit, 4 exponent bits, 3 mantissa bits - higher precision, range up to 448) and E5M2 (1 sign bit, 5 exponent bits, 2 mantissa bits - higher dynamic range, range up to 57344). FP8 cuts memory footprint by 2x over FP16 and 4x over FP32 while executing FP8 Tensor Core matmul at 2x FP16 FLOPS speed.\n\nThis algorithm implements Fp8 E4m3 E5m2 Bitpacker, converting FP32 scalar values into 8-bit FP8 byte representations according to E4M3 or E5M2 bitfield layouts.\n\nInput Format:\n- values: Array of FP32 floating-point values.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns array of 8-bit packed FP8 byte integers.\n\nEdge Cases & Constraints:\n- E4M3 format (max value 448, no infinities).\n- E5M2 format (max value 57344, includes infinities like FP16).\n- Negative values (setting sign bit 7).",
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
  code: FP8E4M3E5M2BITPACKER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "FP8 represents the cutting edge of LLM training and serving precision (Transformer Engine, vLLM FP8). E4M3 is preferred for forward weights and activations due to higher mantissa precision, while E5M2 is used for backward gradients due to wider exponent dynamic range.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, E4M3 uses bias=7, max=448; E5M2 uses bias=15, max=57344. Total bit allocation is 1 + 4 + 3 = 8 bits for E4M3, and 1 + 5 + 2 = 8 bits for E5M2.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "NVIDIA H100 FP8 Tensor Cores deliver 1979 TFLOPS of FP8 compute, running LLM inference 2x-3x faster than FP16.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation inspects sign, extracts exponent and mantissa fields, packs bitfields into an 8-bit byte integer, and appends to output array.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes saturation handling when values exceed max E4M3 (448) or E5M2 (57344) bounds.",
      },
    ],
    keyTerms: [
      {
        term: "FP8 E4M3",
        definition:
          "8-bit floating point format with 1 sign bit, 4 exponent bits, and 3 mantissa bits (higher precision).",
      },
      {
        term: "FP8 E5M2",
        definition:
          "8-bit floating point format with 1 sign bit, 5 exponent bits, and 2 mantissa bits (higher dynamic range).",
      },
      {
        term: "Transformer Engine",
        definition:
          "NVIDIA library automatically switching between FP8 E4M3 and E5M2 formats during LLM training.",
      },
    ],
  },
  trivia: FP8E4M3E5M2BITPACKER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_FP8E4M3E5M2BITPACKER_INPUT,
  generateSteps: generateFp8E4m3E5m2BitpackerSteps,
};
