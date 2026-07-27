import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface treeNodePredictionTraverserInput {
  data?: number[];
  target?: number;
  [key: string]: unknown;
}

export const TREENODEPREDICTIONTRAVERSER_CODE = `
def treenodepredictiontraverser(feature_values, targets, split_threshold):
    """
    Gradient boosted decision tree histogram split optimization and XGBoost gain calculation.
    """
    g_left, h_left = 0.0, 0.0
    g_right = sum(targets)
    h_right = len(targets) * 1.0

    best_gain_score = -1.0
    best_split_val = None

    for val, target in zip(feature_values, targets):
        if val <= split_threshold:
            g_left += target
            h_left += 1.0
            g_right -= target
            h_right -= 1.0

            # Calculate XGBoost split gain score: G_L^2 / (H_L + lambda) + G_R^2 / (H_R + lambda)
            split_gain = (g_left**2 / (h_left + 1e-5)) + (g_right**2 / (h_right + 1e-5))
            if split_gain > best_gain_score:
                best_gain_score = split_gain
                best_split_val = val

    return best_split_val, best_gain_score
`;

export const DEFAULT_TREENODEPREDICTIONTRAVERSER_INPUT: treeNodePredictionTraverserInput = {
  data: [1, 2, 3],
};

export const generateTREENODEPREDICTIONTRAVERSERSteps = (
  input: treeNodePredictionTraverserInput,
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

const TREENODEPREDICTIONTRAVERSER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Start" }],
  lineExplanations: { 1: "Defines entry point." },
};

export const treeNodePredictionTraverser: AlgorithmDefinition<treeNodePredictionTraverserInput> = {
  id: "tree-node-prediction-traverser",
  title: "Decision Tree Prediction Traverser",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_tree_ensembles",
  description: "Implementation of Decision Tree Prediction Traverser.",
  constraints: ["Valid input arguments required."],
  examples: [
    {
      kind: "basic",
      title: "Basic Case",
      inputDisplay: "Basic Input",
      outputDisplay: "Basic Output",
      input: { data: [1, 2, 3] },
      output: "Basic Output Result",
      explanation: "Standard execution.",
    },
    {
      kind: "complex",
      title: "Complex Case",
      inputDisplay: "Complex Input",
      outputDisplay: "Complex Output",
      input: { data: [1, 2, 3] },
      output: "Complex Output Result",
      explanation: "Advanced execution.",
    },
    {
      kind: "negative",
      title: "Negative Case",
      inputDisplay: "Negative Input",
      outputDisplay: "Negative Output",
      input: { data: [1, 2, 3] },
      output: "Negative Output Result",
      explanation: "Edge case handling.",
    },
  ],
  code: TREENODEPREDICTIONTRAVERSER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Algorithm specific time complexity.",
    space: "Algorithm specific space complexity.",
  },
  topicGuide: {
    overview: "Overview of Decision Tree Prediction Traverser",
    sections: [{ heading: "Concept", body: "Core algorithm mechanics." }],
    keyTerms: [{ term: "Metric", definition: "A quantifiable measure." }],
  },
  trivia: TREENODEPREDICTIONTRAVERSER_TRIVIA,
  sources: [],
  defaultInput: DEFAULT_TREENODEPREDICTIONTRAVERSER_INPUT,
  generateSteps: generateTREENODEPREDICTIONTRAVERSERSteps,
};
