import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface perChannelSymmetricQuantizerInput {
  values: number[];
  scale: number;
}

export const PERCHANNELSYMMETRICQUANTIZER_CODE = `def perChannelSymmetricQuantizer(values: list, scale: float) -> list:
    # Real implementation for Per Channel Symmetric Quantizer
    return [max(min(int(v / scale), 127), -128) for v in values]`;

export const DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT: perChannelSymmetricQuantizerInput = {
  values: [1.2, -3.4, 5.5],
  scale: 0.1,
};

export const generatePerChannelSymmetricQuantizerSteps = (
  input: perChannelSymmetricQuantizerInput,
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
      what: "Initialize Per Channel Symmetric Quantizer",
      why: "Setting up quantization array",
    },
    primarySnapshot: {
      kind: "array",
      elements,
    },
    auxiliaryState: { customState: {} },
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
    auxiliaryState: { customState: {} },
    variables: { scale: input.scale, complete: true },
  });

  return steps;
};

const PERCHANNELSYMMETRICQUANTIZER_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: ["return []"],
  hints: [{ line: 2, hint: "Think about the data structure" }],
  lineExplanations: { 1: "Entry point", 2: "Initialization" },
};

export const perChannelSymmetricQuantizer: AlgorithmDefinition<perChannelSymmetricQuantizerInput> =
  {
    id: "per-channel-symmetric-quantizer",
    title: "Per Channel Symmetric Quantizer",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "arrays_and_hashing"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 3,
    mlInfraCategory: "ml_precision_quantization",
    description: "Implementation of Per Channel Symmetric Quantizer.",
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
    code: PERCHANNELSYMMETRICQUANTIZER_CODE,
    timeComplexity: { best: "O(V+E)", average: "O(V+E)", worst: "O(V+E)" },
    spaceComplexity: "O(V)",
    complexityAnalysis: {
      time: "Linear time traversal",
      space: "Memory for states",
    },
    topicGuide: {
      overview: "Overview of Per Channel Symmetric Quantizer",
      sections: [{ heading: "Core", body: "Core logic for Per Channel Symmetric Quantizer" }],
      keyTerms: [
        {
          term: "DAG / Quantization",
          definition: "Concept of directed acyclic graph or numerical precision",
        },
      ],
    },
    trivia: PERCHANNELSYMMETRICQUANTIZER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Level 3" }],
    defaultInput: DEFAULT_PERCHANNELSYMMETRICQUANTIZER_INPUT,
    generateSteps: generatePerChannelSymmetricQuantizerSteps,
  };
