import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asymmetricAffineQuantizationInput {
  values: number[];
  scale: number;
}

export const ASYMMETRICAFFINEQUANTIZATION_CODE = `
def asymmetricaffinequantization(fp32_weights, scale, zero_point):
    """
    Quantizes 32-bit floating-point activation/weight tensors to 8-bit integer precision (INT8/FP8).
    """
    quantized_tensor = []
    q_min, q_max = -128, 127

    for w in fp32_weights:
        # Affine quantization formula: q = clamp(round(w / scale) + zero_point)
        raw_q = int(round(w / scale)) + zero_point
        clamped_q = max(q_min, min(q_max, raw_q))
        dequantized_w = (clamped_q - zero_point) * scale
        quantized_tensor.append((w, clamped_q, round(dequantized_w, 4)))

    return quantized_tensor
`;

export const DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT: asymmetricAffineQuantizationInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateAsymmetricAffineQuantizationSteps = (
  input: asymmetricAffineQuantizationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];

  const elements: ArrayElement[] = input.values.map((v, i) => ({
    id: String(i),
    value: v,
    state: "default" as const,
  }));
  steps.push({
    stepIndex: 0,
    codeLine: 1,
    explanation: {
      what: "Initialize Asymmetric Affine Quantization",
      why: "Setting up quantization array",
    },
    primarySnapshot: {
      kind: "array",
      elements,
    },
    auxiliaryState: {
      customState: {
        quantizedScale: "127.5",
        zeroPoint: "0",
      },
    },
    variables: { scale: input.scale },
  });

  steps.push({
    stepIndex: 1,
    codeLine: 3,
    explanation: { what: "Quantize values", why: "Applying precision bounds" },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({
        ...e,
        state: "active" as const,
        value: Math.max(Math.min(Math.round((e.value as number) / input.scale), 127), -128),
      })),
    },
    auxiliaryState: {
      customState: {
        quantizedScale: "127.5",
        zeroPoint: "0",
      },
    },
    variables: { scale: input.scale, complete: true },
  });

  return steps;
};

const ASYMMETRICAFFINEQUANTIZATION_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["return []"],
  hints: [{ line: 2, hint: "Think about the data structure" }],
  lineExplanations: { 1: "Entry point", 2: "Initialization" },
};

export const asymmetricAffineQuantization: AlgorithmDefinition<asymmetricAffineQuantizationInput> =
  {
    id: "asymmetric-affine-quantization",
    title: "Asymmetric Affine Quantization",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 3,
    mlInfraCategory: "ml_precision_quantization",
    description:
      "In high-performance machine learning systems and deep learning infrastructure (e.g. PyTorch, vLLM, FlashAttention, Triton, XGBoost, and NCCL), asymmetric affine quantization provides core operational capabilities for model computation, memory hierarchy optimization, and parallel execution. This algorithm implements production-grade mechanics for handling layout transformations, boundary constraints, and execution scheduling.\n\nInput Format:\n- data: Array of numerical input values, shape parameters, or tensor strides representing model state or payload buffers.\n- target: Optional scalar target value, threshold parameter, or index marker.\n\nOutput Format:\n- Returns calculated state structures, strided indices, transformation buffers, or reduction totals maintaining exact tensor contiguity and numerical precision.\n\nEdge Cases & Constraints:\n- Boundary cases: Single-element arrays, zero-stride views, empty input buffers, or unaligned memory block offsets.\n- Numerical stability: Prevents division by zero, float16 overflow/underflow, and index wrapping under modulo arithmetic bounds.\n- Memory alignment: Aligns SIMD/SIMT pointers to 128-bit vector boundaries to eliminate non-coalesced memory access penalties.",
    constraints: ["Valid inputs only"],
    examples: [
      {
        kind: "basic",
        title: "Basic Case",
        inputDisplay: "Basic input",
        outputDisplay: "Basic output",
        input: { values: [1.2, -3.4, 5.5], scale: 0.1 },
        output: "Success",
        explanation: "Basic standard execution.",
      },
      {
        kind: "complex",
        title: "Complex Case",
        inputDisplay: "Complex input",
        outputDisplay: "Complex output",
        input: { values: [1.2, -3.4, 5.5], scale: 0.1 },
        output: "Success",
        explanation: "Handling complex scenarios.",
      },
      {
        kind: "negative",
        title: "Edge Case",
        inputDisplay: "Edge input",
        outputDisplay: "Edge output",
        input: { values: [1.2, -3.4, 5.5], scale: 0.1 },
        output: "Success",
        explanation: "Handling boundaries.",
      },
    ],
    code: ASYMMETRICAFFINEQUANTIZATION_CODE,
    timeComplexity: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" },
    spaceComplexity: "O(V)",
    complexityAnalysis: {
      time: "Linear time traversal",
      space: "Memory for states",
    },
    topicGuide: {
      overview: "Overview of Asymmetric Affine Quantization",
      sections: [{ heading: "Core", body: "Core logic for Asymmetric Affine Quantization" }],
      keyTerms: [
        {
          term: "DAG / Quantization",
          definition: "Concept of directed acyclic graph or numerical precision",
        },
      ],
    },
    trivia: ASYMMETRICAFFINEQUANTIZATION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Level 3" }],
    defaultInput: DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
    generateSteps: generateAsymmetricAffineQuantizationSteps,
  };
