import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fakeQuantizedW8a8MatmulInput {
  values: number[];
  scale: number;
}

export const FAKEQUANTIZEDW8A8MATMUL_CODE = `
def fake_quantized_w8a8_matmul(matrix_a, matrix_b, scale_a=0.1, scale_b=0.1):
    """
    Simulates W8A8 INT8 matrix multiplication with fake quantization and dequantization.
    """
    m, k_dim = len(matrix_a), len(matrix_a[0])
    n = len(matrix_b[0])

    q_a = [[max(-128, min(127, int(round(matrix_a[i][j] / scale_a)))) for j in range(k_dim)] for i in range(m)]
    q_b = [[max(-128, min(127, int(round(matrix_b[i][j] / scale_b)))) for j in range(n)] for i in range(k_dim)]

    output = [[0.0] * n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            acc = sum(q_a[i][k] * q_b[k][j] for k in range(k_dim))
            output[i][j] = acc * (scale_a * scale_b)

    return output
`;

export const DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT: fakeQuantizedW8a8MatmulInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateFakeQuantizedW8a8MatmulSteps = (
  input: fakeQuantizedW8a8MatmulInput,
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
    "Initialize Fake Quantized W8a8 Matmul",
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
    17,
    "Execution Complete",
    "Successfully processed quantization transformation across all values.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const FAKEQUANTIZEDW8A8MATMUL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 4, hint: "Process FP32 values in quantization pipeline." }],
  lineExplanations: {
    1: "Defines fake quantized W8A8 matrix multiplication function.",
    4: "Gets rows M and inner dimension K of matrix A.",
    5: "Gets columns N of matrix B.",
    7: "Quantizes FP32 input matrix A into INT8 matrix q_a using scale_a.",
    8: "Quantizes FP32 weight matrix B into INT8 matrix q_b using scale_b.",
    10: "Allocates output M x N FP32 result matrix initialized to 0.0.",
    12: "Iterates through output rows i and columns j.",
    13: "Computes INT8 integer matrix multiplication accumulator sum(q_a[i][k] * q_b[k][j]).",
    14: "Dequantizes integer accumulator into FP32: output[i][j] = acc * (scale_a * scale_b).",
    16: "Returns de-quantized simulated FP32 matrix result.",
  },
};

export const fakeQuantizedW8a8Matmul: AlgorithmDefinition<fakeQuantizedW8a8MatmulInput> = {
  id: "fake-quantized-w8a8-matmul",
  title: "Fake Quantized W8a8 Matmul",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description:
    "In Quantization-Aware Training (QAT, PyTorch torch.ao.quantization), Fake Quantization simulates low-precision INT8 W8A8 matrix multiplication during FP32 forward training passes. FP32 weight and activation matrices are quantized to INT8, multiplied in integer precision, and de-quantized back to FP32, exposing model gradients to quantization rounding noise during backpropagation.\n\nThis algorithm implements Fake Quantized W8a8 Matmul, performing INT8 quantization on input matrices A and B, executing integer GEMM accumulation, and de-quantizing back to FP32 using combined scales (scale_a * scale_b).\n\nInput Format:\n- values: Array representing matrix data or inputs.\n- scale: Quantization scale factor.\n\nOutput Format:\n- Returns de-quantized FP32 result matrix simulating W8A8 INT8 GEMM accuracy.\n\nEdge Cases & Constraints:\n- Large activation values experiencing INT8 clamping saturation.\n- Combined scale factor underflow (scale_a * scale_b -> 0).\n- 1x1 matrix multiplications.",
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
  code: FAKEQUANTIZEDW8A8MATMUL_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time pass across input elements.",
    space: "Linear memory allocation for quantized result array.",
  },
  topicGuide: {
    overview:
      "Fake quantization enables Quantization-Aware Training (QAT). By introducing quantization clamping noise into FP32 forward execution passes while computing continuous gradients via Straight-Through Estimators (STE), neural networks adjust weights to maintain accuracy under INT8 inference.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, Q(X) = clamp(round(X / S), -128, 127). Fake Quantized MatMul is C_approx = (Q(A) @ Q(B)) * (S_a * S_b). Time complexity is O(M * N * K).",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Simulating W8A8 integer matrix multiplication in FP32 allows neural network engineers to measure precision degradation prior to exporting models to TensorRT or ONNX INT8 runtimes.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Implementation quantizes A to q_a and B to q_b, computes integer matrix inner products, and scales accumulator totals by (scale_a * scale_b).",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "Edge case analysis includes handling zero scale inputs and floating point overflow.",
      },
    ],
    keyTerms: [
      {
        term: "Fake Quantization",
        definition:
          "Simulating low-precision integer quantization rounding and clamping noise during FP32 model training.",
      },
      {
        term: "W8A8 INT8 GEMM",
        definition:
          "Matrix multiplication where both Weights (W8) and Activations (A8) are quantized to 8-bit integers.",
      },
      {
        term: "De-quantization Scale",
        definition:
          "Multiplying integer accumulator results by combined scale factor (S_a * S_b) to restore FP32 scale.",
      },
    ],
  },
  trivia: FAKEQUANTIZEDW8A8MATMUL_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_FAKEQUANTIZEDW8A8MATMUL_INPUT,
  generateSteps: generateFakeQuantizedW8a8MatmulSteps,
};
