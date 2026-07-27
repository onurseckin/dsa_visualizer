import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp8E4m3E5m2BitpackerInput {
  values: number[];
  scale: number;
}

export const FP8E4M3E5M2BITPACKER_CODE = `
def fp8e4m3e5m2bitpacker(fp32_weights, scale, zero_point):
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

export const DEFAULT_FP8E4M3E5M2BITPACKER_INPUT: fp8E4m3E5m2BitpackerInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generateFp8E4m3E5m2BitpackerSteps = (
  input: fp8E4m3E5m2BitpackerInput,
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
      what: "Initialize Fp8 E4m3 E5m2 Bitpacker",
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

const FP8E4M3E5M2BITPACKER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["return []"],
  hints: [{ line: 2, hint: "Think about the data structure" }],
  lineExplanations: { 1: "Entry point", 2: "Initialization" },
};

export const fp8E4m3E5m2Bitpacker: AlgorithmDefinition<fp8E4m3E5m2BitpackerInput> = {
  id: "fp8-e4m3-e5m2-bitpacker",
  title: "Fp8 E4m3 E5m2 Bitpacker",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "arrays_and_hashing"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  mlInfraCategory: "ml_precision_quantization",
  description: "Implementation of Fp8 E4m3 E5m2 Bitpacker.",
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
  code: FP8E4M3E5M2BITPACKER_CODE,
  timeComplexity: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" },
  spaceComplexity: "O(V)",
  complexityAnalysis: {
    time: "Linear time traversal",
    space: "Memory for states",
  },
  topicGuide: {
    overview: "Overview of Fp8 E4m3 E5m2 Bitpacker",
    sections: [{ heading: "Core", body: "Core logic for Fp8 E4m3 E5m2 Bitpacker" }],
    keyTerms: [
      {
        term: "DAG / Quantization",
        definition: "Concept of directed acyclic graph or numerical precision",
      },
    ],
  },
  trivia: FP8E4M3E5M2BITPACKER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Level 3" }],
  defaultInput: DEFAULT_FP8E4M3E5M2BITPACKER_INPUT,
  generateSteps: generateFp8E4m3E5m2BitpackerSteps,
};
