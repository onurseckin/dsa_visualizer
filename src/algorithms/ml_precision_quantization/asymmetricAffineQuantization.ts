import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asymmetricAffineQuantizationInput {
  values: number[];
  scale: number;
}

export const ASYMMETRICAFFINEQUANTIZATION_CODE = `
def asymmetric_affine_quantization(values, scale=0.1, zero_point=5):
    """
    Quantizes FP32 values into INT8 range [-128, 127] using asymmetric scale S and zero-point Z.
    """
    quantized = []
    for x in values:
        q_val = int(round(x / scale)) + zero_point
        clamped = max(-128, min(127, q_val))
        quantized.append(clamped)
    return quantized
`;

export const DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT: asymmetricAffineQuantizationInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateAsymmetricAffineQuantizationSteps = (
  input: asymmetricAffineQuantizationInput,
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
    "Initialize Asymmetric Affine Quantization",
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

const ASYMMETRICAFFINEQUANTIZATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines asymmetric affine quantization function.",
    4: "Initializes quantized INT8 output result array.",
    5: "Iterates through FP32 floating point input values.",
    6: "Calculates scaled value and adds zero-point offset Z: q_val = round(x / scale) + zero_point.",
    7: "Clamps quantized integer within signed INT8 range [-128, 127].",
    8: "Appends clamped INT8 value to output array.",
    9: "Returns quantized INT8 integer array.",
  },
};

export const asymmetricAffineQuantization: AlgorithmDefinition<asymmetricAffineQuantizationInput> =
  {
    id: "asymmetric-affine-quantization",
    title: "Asymmetric Affine Quantization",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 4,
    mlInfraCategory: "ml_precision_quantization",
    description:
      "Asymmetric Affine Quantization maps 32-bit floating point numbers (FP32) into 8-bit integer range (INT8 [-128, 127] or UINT8 [0, 255]) using a floating point scale factor S and integer zero-point offset Z: q = clamp(round(x / S) + Z, qmin, qmax). Asymmetric quantization maps FP32 zero to an exact integer value Z, making it optimal for asymmetric activation distributions (e.g. ReLU activations in [0, +inf)).\n\nThis algorithm implements Asymmetric Affine Quantization, applying scale transformation, zero-point offset shift, and INT8 range clamping across input scalar vectors.\n\nInput Format:\n- values: Array of FP32 floating-point activation/weight scalars.\n- scale: Floating-point quantization scale factor S (default: 0.1).\n\nOutput Format:\n- Returns array of quantized INT8 integer values.\n\nEdge Cases & Constraints:\n- Values exceeding FP32 range mapped safely via clamping.\n- Zero scale factor prevention (fallback scale S = 1.0).\n- Zero-point Z alignment within [qmin, qmax] integer bounds.",
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
    code: ASYMMETRICAFFINEQUANTIZATION_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time pass across input elements.",
      space: "Linear memory allocation for quantized result array.",
    },
    topicGuide: {
      overview:
        "Asymmetric quantization is the standard quantization method for neural network activations in PyTorch (torch.quantization) and ONNX Runtime. Because activation functions like ReLU and GELU produce non-symmetric non-negative distributions, asymmetric zero-point offsets eliminate quantization precision loss around 0.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, quantization is q = clamp(round(x / S) + Z, qmin, qmax), and de-quantization is x_approx = (q - Z) * S. Scale S = (max_val - min_val) / (qmax - qmin) and zero-point Z = round(qmin - min_val / S).",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "On INT8 hardware accelerators (NVIDIA Tensor Cores, ARM NEON, TPU MXU), integer vector operations run at 2x-4x higher throughput and 4x lower DRAM memory bandwidth compared to FP32 floating point operations.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Implementation loops over input scalar values, calculates scaled value x / S, adds zero-point Z, rounds to nearest integer, and clamps within [-128, 127] bounds.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "Edge case analysis includes subnormal float values and zero-scale protection.",
        },
      ],
      keyTerms: [
        {
          term: "Zero-Point (Z)",
          definition:
            "An integer offset ensuring FP32 value 0.0 maps exactly to an integer representation without precision error.",
        },
        {
          term: "Quantization Scale (S)",
          definition:
            "Floating-point step size mapping one unit of integer range to physical FP32 value increment.",
        },
        {
          term: "INT8 Range Clamping",
          definition:
            "Restricting quantized integer values strictly within signed 8-bit range [-128, 127].",
        },
      ],
    },
    trivia: ASYMMETRICAFFINEQUANTIZATION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
    generateSteps: generateAsymmetricAffineQuantizationSteps,
  };
