import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface shannonEntropyCalculatorInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const SHANNONENTROPYCALCULATOR_CODE =
  "def shannon_entropy(labels: list) -> float:\n    import math\n    from collections import Counter\n    counts = Counter(labels)\n    return sum(- (c/len(labels)) * math.log2(c/len(labels)) for c in counts.values())";

export const DEFAULT_SHANNONENTROPYCALCULATOR_INPUT: shannonEntropyCalculatorInput = {
  data: [1, 1, 2, 2],
};

export const generateSHANNONENTROPYCALCULATORSteps = (
  input: shannonEntropyCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayData = input.data || [1, 2, 3];

  const elements: ArrayElement[] = arrayData.map((val: number, idx: number) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: { what: "Initialize algorithm", why: "Setting up memory and local vars." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({ ...e, pointers: ["init"] })),
    },
    auxiliaryState: {
      customState: { initialized: "true" },
    },
    variables: { active: true },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: { what: "Process data", why: "Applying algorithm logic." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e, idx) => ({ ...e, state: idx === 0 ? "active" : "compare" })),
    },
    auxiliaryState: {
      customState: { computing: "true" },
    },
    variables: { step: 1 },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: { what: "Complete", why: "Returning result." },
    primarySnapshot: {
      kind: "array",
      elements: elements.map((e) => ({ ...e, state: "sorted" })),
    },
    auxiliaryState: {
      customState: { done: "true" },
    },
    variables: { result: "calculated" },
  });

  return steps;
};

const SHANNONENTROPYCALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Start" }],
  lineExplanations: { 1: "Defines entry point." },
};

export const shannonEntropyCalculator: AlgorithmDefinition<shannonEntropyCalculatorInput> = {
  id: "shannon-entropy-calculator",
  title: "Shannon Entropy Calculator",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_tree_ensembles",
  description: "Implementation of Shannon Entropy Calculator.",
  constraints: ["Valid input arguments required."],
  examples: [
    {
      kind: "basic",
      title: "Basic Case",
      inputDisplay: "Basic Input",
      outputDisplay: "Basic Output",
      input: { data: [1, 1, 2, 2] },
      output: "Basic Output Result",
      explanation: "Standard execution.",
    },
    {
      kind: "complex",
      title: "Complex Case",
      inputDisplay: "Complex Input",
      outputDisplay: "Complex Output",
      input: { data: [1, 1, 2, 2] },
      output: "Complex Output Result",
      explanation: "Advanced execution.",
    },
    {
      kind: "negative",
      title: "Negative Case",
      inputDisplay: "Negative Input",
      outputDisplay: "Negative Output",
      input: { data: [1, 1, 2, 2] },
      output: "Negative Output Result",
      explanation: "Edge case handling.",
    },
  ],
  code: SHANNONENTROPYCALCULATOR_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Algorithm specific time complexity.",
    space: "Algorithm specific space complexity.",
  },
  topicGuide: {
    overview: "Overview of Shannon Entropy Calculator",
    sections: [{ heading: "Concept", body: "Core algorithm mechanics." }],
    keyTerms: [{ term: "Metric", definition: "A quantifiable measure." }],
  },
  trivia: SHANNONENTROPYCALCULATOR_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_SHANNONENTROPYCALCULATOR_INPUT,
  generateSteps: generateSHANNONENTROPYCALCULATORSteps,
};
