import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface basicSymmetricInt8ScaleInput {
  values: number[];
  scale: number;
}

export const BASICSYMMETRICINT8SCALE_CODE = `
def basic_symmetric_int8_scale(values):
    """
    Calculates symmetric INT8 quantization scale factor S = max(|x|) / 127.
    """
    max_abs = max(abs(x) for x in values) if values else 1.0
    scale = max_abs / 127.0 if max_abs > 0 else 1.0
    quantized = [max(-128, min(127, int(round(x / scale)))) for x in values]
    return scale, quantized
`;

export const DEFAULT_BASICSYMMETRICINT8SCALE_INPUT: basicSymmetricInt8ScaleInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateBasicSymmetricInt8ScaleSteps = (
  input: basicSymmetricInt8ScaleInput,
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
    "Initialize Basic Symmetric Int8 Scale",
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

const BASICSYMMETRICINT8SCALE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines basic symmetric INT8 scale calculation function.",
    4: "Finds maximum absolute value max_abs among input scalar values.",
    5: "Calculates symmetric scale factor S = max_abs / 127.0.",
    6: "Quantizes input FP32 values into INT8 integer range [-128, 127].",
    7: "Returns scale factor S and quantized INT8 values array.",
  },
};

export const basicSymmetricInt8Scale: AlgorithmDefinition<basicSymmetricInt8ScaleInput> = {
  id: "basic-symmetric-int8-scale",
  title: "Basic Symmetric Int8 Scale",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "Symmetric INT8 Quantization maps FP32 floating point values into signed 8-bit integer range [-127, 127] symmetrically around zero without using a zero-point offset (Z = 0): q = clamp(round(x / S), -128, 127). Symmetric quantization is widely used for neural network weight matrices (W8) because setting Z = 0 eliminates zero-point addition overhead in matrix multiplication GEMM kernels.\n\nThis algorithm implements Basic Symmetric Int8 Scale, finding the maximum absolute value max(|x|), calculating symmetric scale factor S = max(|x|) / 127, and quantizing input values.\n\nInput Format:\n- values: Array of FP32 floating-point values.\n- scale: Optional scale parameter.\n\nOutput Format:\n- Returns calculated scale factor S and array of quantized INT8 integer values.\n\nEdge Cases & Constraints:\n- All zero input values (max_abs = 0, scale defaults to 1.0).\n- Negative symmetric extremes (clamped to -128).\n- Single element inputs.",
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
  code: BASICSYMMETRICINT8SCALE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "Symmetric INT8 quantization sets zero-point Z = 0. De-quantization simplifies to x_approx = q * S. In INT8 matrix multiplication (C = A_int8 @ B_int8 * (S_a * S_b)), zero-point-free matrix multiplication executes directly on hardware Tensor Cores without cross-term additions.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, max_abs = max_{x in X} |x|. Scale S = max_abs / 127. Quantized values q = clamp(round(x / S), -128, 127). Time complexity is O(N) with O(N) space.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Symmetric quantization reduces memory bandwidth requirement by 4x (1 byte per weight instead of 4 bytes FP32), doubling L2 cache effective capacity.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation finds absolute maximum value in input array, calculates scale factor S, and divides each input element by S.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling zero vectors where max_abs == 0.",
      },
    ],
    keyTerms: [
      {
        term: "Symmetric Quantization",
        definition:
          "Quantization scheme where FP32 zero maps directly to integer zero without offset (Z = 0).",
      },
      {
        term: "Maximum Absolute Value (max_abs)",
        definition:
          "The peak magnitude max(|x|) used to define the symmetric quantization dynamic range.",
      },
      {
        term: "Zero-Point Elimination",
        definition:
          "Removing zero-point terms from INT8 GEMM math to increase hardware kernel execution speed.",
      },
    ],
  },
  trivia: BASICSYMMETRICINT8SCALE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_BASICSYMMETRICINT8SCALE_INPUT,
  generateSteps: generateBasicSymmetricInt8ScaleSteps,
};
