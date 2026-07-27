import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface DecisionTreeGiniSplitInput {
  featureValues: number[];
  labels: number[];
}

export const DECISION_TREE_GINI_SPLIT_CODE = `def best_gini_split(feature_values: list[float], labels: list[int]) -> tuple[float, float]:
    if not feature_values or len(feature_values) != len(labels):
        return (-1.0, 1.0)
        
    def gini(sub_labels: list[int]) -> float:
        if not sub_labels:
            return 0.0
        n = len(sub_labels)
        p0 = sum(1 for y in sub_labels if y == 0) / n
        p1 = 1.0 - p0
        return 1.0 - (p0**2 + p1**2)
        
    sorted_pairs = sorted(zip(feature_values, labels), key=lambda x: x[0])
    best_thresh = -1.0
    best_gini = 1.0
    
    for i in range(len(sorted_pairs) - 1):
        thresh = (sorted_pairs[i][0] + sorted_pairs[i+1][0]) / 2.0
        left = [y for x, y in sorted_pairs if x <= thresh]
        right = [y for x, y in sorted_pairs if x > thresh]
        
        w_gini = (len(left)/len(labels)) * gini(left) + (len(right)/len(labels)) * gini(right)
        if w_gini < best_gini:
            best_gini = w_gini
            best_thresh = thresh
            
    return (best_thresh, round(best_gini, 4))`;

export const DEFAULT_DECISION_TREE_GINI_SPLIT_INPUT: DecisionTreeGiniSplitInput = {
  featureValues: [2.5, 1.0, 3.5, 5.0, 4.0],
  labels: [0, 0, 1, 1, 1],
};

export const generateDecisionTreeGiniSplitSteps = (
  input: DecisionTreeGiniSplitInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { featureValues, labels } = input;
  const n = featureValues.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    pairs: { val: number; label: number }[],
    activeThresh: number | null,
    bestThresh: number | null,
    bestGini: number,
    vars: Record<string, string | number | boolean>,
  ) => {
    const elements: ArrayElement[] = pairs.map((p, idx) => {
      const isLeft = activeThresh !== null && p.val <= activeThresh;
      let state: ArrayElement["state"] = "default";
      if (activeThresh !== null) {
        state = isLeft ? "visited" : "active";
      }

      return {
        id: `pair-${idx}`,
        value: p.val,
        state,
        pointers: [`val:${p.val} (y=${p.label})`],
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements,
      },
      auxiliaryState: {
        customState: {
          activeThreshold: activeThresh !== null ? String(activeThresh) : "None",
          bestThreshold: bestThresh !== null ? String(bestThresh) : "None",
          bestGiniImpurity: bestGini.toFixed(4),
        },
      },
      variables: vars,
    });
  };

  if (n < 2 || n !== labels.length) {
    addStep(
      3,
      "Invalid input arrays",
      "Feature values and labels must contain at least 2 matching length elements to perform split.",
      [],
      null,
      null,
      1.0,
      { valid: false },
    );
    return steps;
  }

  const pairs = featureValues
    .map((val, i) => ({ val, label: labels[i] }))
    .sort((a, b) => a.val - b.val);

  addStep(
    13,
    "Sort feature values and pair with labels",
    `Sorted data points: ${pairs.map((p) => `(${p.val}, y=${p.label})`).join(", ")}.`,
    pairs,
    null,
    null,
    1.0,
    { n },
  );

  const calcGini = (subLabels: number[]): number => {
    if (subLabels.length === 0) return 0.0;
    const count0 = subLabels.filter((y) => y === 0).length;
    const p0 = count0 / subLabels.length;
    const p1 = 1.0 - p0;
    return 1.0 - (p0 * p0 + p1 * p1);
  };

  let bestThresh = -1.0;
  let bestGini = 1.0;

  for (let i = 0; i < n - 1; i++) {
    const thresh = (pairs[i].val + pairs[i + 1].val) / 2.0;
    const left = pairs.filter((p) => p.val <= thresh).map((p) => p.label);
    const right = pairs.filter((p) => p.val > thresh).map((p) => p.label);

    const giniL = calcGini(left);
    const giniR = calcGini(right);
    const weightedGini = (left.length / n) * giniL + (right.length / n) * giniR;

    const isNewBest = weightedGini < bestGini;
    if (isNewBest) {
      bestGini = weightedGini;
      bestThresh = thresh;
    }

    addStep(
      21,
      `Evaluate threshold ${thresh}: Weighted Gini = ${weightedGini.toFixed(4)}`,
      `Left split (${left.length} items, Gini=${giniL.toFixed(3)}), Right split (${
        right.length
      } items, Gini=${giniR.toFixed(3)}). ${isNewBest ? "NEW BEST SPLIT!" : ""}`,
      pairs,
      thresh,
      bestThresh,
      bestGini,
      {
        thresh,
        weightedGini: Math.round(weightedGini * 10000) / 10000,
        leftSize: left.length,
        rightSize: right.length,
        isNewBest,
      },
    );
  }

  addStep(
    25,
    `Optimal Decision Tree Split Found: Threshold = ${bestThresh}, Gini = ${bestGini.toFixed(4)}`,
    `Optimal feature threshold ${bestThresh} minimizes impurity across dataset splits.`,
    pairs,
    bestThresh,
    bestThresh,
    bestGini,
    { bestThresh, bestGini, complete: true },
  );

  return steps;
};

export const DECISION_TREE_GINI_SPLIT_TRIVIA: TriviaMeta = {
  skipLines: [2, 4],
  hints: [
    { line: 10, hint: "Gini impurity formula: 1 - (p0^2 + p1^2)" },
    { line: 13, hint: "Sort dataset by feature value to evaluate split midpoints" },
    { line: 21, hint: "Weighted Gini = (n_left/n)*Gini(L) + (n_right/n)*Gini(R)" },
  ],
  distractors: [
    "return p0**2 + p1**2",
    "thresh = (sorted_pairs[i][0] * sorted_pairs[i+1][0])",
    "if w_gini > best_gini: best_gini = w_gini",
  ],
};

export const decisionTreeGiniSplit: AlgorithmDefinition<DecisionTreeGiniSplitInput> = {
  id: "decision-tree-gini-split",
  title: "Decision Tree Gini Impurity Split",
  category: "ml_tree_ensembles",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 5,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Evaluate candidate feature split thresholds using weighted Gini Impurity to construct decision trees.",
  code: DECISION_TREE_GINI_SPLIT_CODE,
  defaultInput: DEFAULT_DECISION_TREE_GINI_SPLIT_INPUT,
  examples: [
    {
      kind: "basic",
      title: "Clean Feature Split",
      input: DEFAULT_DECISION_TREE_GINI_SPLIT_INPUT,
      output: "(3.0, 0.0)",
      explanation:
        "Threshold 3.0 perfectly separates class 0 (<=2.5) from class 1 (>=3.5) with 0.0 Gini impurity.",
    },
    {
      kind: "complex",
      title: "Overlapping Feature Values",
      input: {
        featureValues: [1.0, 2.0, 3.0, 4.0],
        labels: [0, 1, 0, 1],
      },
      output: "(1.5, 0.375)",
      explanation: "Impure dataset yields minimum weighted Gini of 0.375.",
    },
    {
      kind: "negative",
      title: "Single Element Array",
      input: {
        featureValues: [1.0],
        labels: [0],
      },
      output: "(-1.0, 1.0)",
      explanation: "Cannot evaluate split on single data point.",
    },
  ],
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N log N) sorting feature values, followed by O(N) linear threshold evaluation pass.",
    space: "O(N) space for sorted pairs and split arrays.",
  },
  topicGuide: {
    overview:
      "Decision trees and Gradient Boosted Trees (XGBoost, LightGBM) split nodes by finding feature threshold s that maximize information gain or minimize Gini impurity: Gini = 1 - sum(p_i^2).",
    sections: [
      {
        heading: "Gini Impurity vs Entropy",
        body: "Gini impurity measures how often a randomly chosen element would be incorrectly labeled. It is computationally faster than logarithmic entropy: H = -sum(p_i * log2(p_i)).",
      },
    ],
    keyTerms: [
      { term: "Gini Impurity", definition: "1 - sum(p_k^2), measuring node class heterogeneity." },
      {
        term: "Split Threshold",
        definition:
          "Midpoint between adjacent sorted feature values tested as a node decision boundary.",
      },
    ],
  },
  trivia: DECISION_TREE_GINI_SPLIT_TRIVIA,
  generateSteps: generateDecisionTreeGiniSplitSteps,
};
