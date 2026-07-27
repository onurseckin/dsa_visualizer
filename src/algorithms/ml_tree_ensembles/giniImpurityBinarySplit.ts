import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface GiniImpurityBinarySplitInput {
  labels: number[]; // binary classification labels 0 or 1
  splitIndex: number; // candidate split boundary index (left = 0..splitIndex, right = splitIndex+1..end)
}

export const DEFAULT_GINI_IMPURITY_INPUT: GiniImpurityBinarySplitInput = {
  labels: [0, 0, 0, 1, 1, 1],
  splitIndex: 2, // Left = [0,0,0], Right = [1,1,1]
};

export const GINI_IMPURITY_CODE = `def compute_gini_impurity(labels: list[int]) -> float:
    """
    Computes Gini Impurity for a classification node.
    Gini = 1 - sum(p_i^2) where p_i is class probability.
    """
    if not labels:
        return 0.0
    
    n = len(labels)
    counts = {}
    for y in labels:
        counts[y] = counts.get(y, 0) + 1
        
    return 1.0 - sum((cnt / n) ** 2 for cnt in counts.values())

def gini_binary_split_gain(labels: list[int], split_index: int) -> tuple[float, float, float, float]:
    """
    Calculates Gini Impurity reduction (Gain) for a binary node split.
    Gain = Gini(Parent) - (N_left / N) * Gini(Left) - (N_right / N) * Gini(Right).
    """
    left = labels[:split_index + 1]
    right = labels[split_index + 1:]
    
    parent_gini = compute_gini_impurity(labels)
    left_gini = compute_gini_impurity(left)
    right_gini = compute_gini_impurity(right)
    
    n = len(labels)
    n_left = len(left)
    n_right = len(right)
    
    weighted_child_gini = (n_left / n) * left_gini + (n_right / n) * right_gini
    gini_gain = parent_gini - weighted_child_gini
    
    return parent_gini, left_gini, right_gini, round(gini_gain, 4)`;

export const generateGiniImpuritySteps = (input: GiniImpurityBinarySplitInput): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { labels, splitIndex } = input;
  let stepIndex = 0;

  const calcGini = (lbls: number[]) => {
    if (lbls.length === 0) return 0.0;
    const n = lbls.length;
    const counts: Record<number, number> = {};
    lbls.forEach((y) => (counts[y] = (counts[y] || 0) + 1));
    return 1.0 - Object.values(counts).reduce((acc, cnt) => acc + (cnt / n) ** 2, 0);
  };

  const parentGini = calcGini(labels);
  const leftLabels = labels.slice(0, splitIndex + 1);
  const rightLabels = labels.slice(splitIndex + 1);

  const leftGini = calcGini(leftLabels);
  const rightGini = calcGini(rightLabels);

  const n = labels.length;
  const weightedChildGini =
    (leftLabels.length / n) * leftGini + (rightLabels.length / n) * rightGini;
  const giniGain = parentGini - weightedChildGini;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Initialize Gini Impurity Binary Split Evaluator (CART)",
      why: `Parent node contains ${labels.length} class labels [${labels.join(
        ", ",
      )}]. Evaluating candidate split at index ${splitIndex}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `Class ${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        parentGini: parentGini.toFixed(4),
        totalSamples: String(labels.length),
        splitIndex: String(splitIndex),
        status: "Initialized",
      },
    },
    variables: { parentGini: Math.round(parentGini * 10000) / 10000, totalSamples: labels.length },
  });

  // Step 1: Compute Parent Gini
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Compute Parent Node Gini Impurity: Gini(Parent) = ${parentGini.toFixed(4)}`,
      why: `Parent class distribution: ${leftLabels.length + rightLabels.length} samples. Gini = 1 - sum(p_i^2) = ${parentGini.toFixed(
        4,
      )}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "active" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        parentGini: parentGini.toFixed(4),
        formula: "1.0 - sum((cnt / N)^2)",
      },
    },
    variables: { parentGini: Math.round(parentGini * 10000) / 10000 },
  });

  // Step 2: Compute Child Ginis & Split Gain
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `Compute Left & Right Child Gini Impurities: Gini(Left) = ${leftGini.toFixed(
        4,
      )}, Gini(Right) = ${rightGini.toFixed(4)}`,
      why: `Left child (${leftLabels.length} samples [${leftLabels.join(",")}]), Right child (${rightLabels.length} samples [${rightLabels.join(",")}]).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("active" as ElementState) : ("visited" as ElementState),
        pointers:
          idx === splitIndex
            ? [`Left Gini ${leftGini.toFixed(2)}`]
            : idx === splitIndex + 1
              ? [`Right Gini ${rightGini.toFixed(2)}`]
              : [],
      })),
    },
    auxiliaryState: {
      customState: {
        leftGini: leftGini.toFixed(4),
        rightGini: rightGini.toFixed(4),
        weightedChildGini: weightedChildGini.toFixed(4),
        giniGain: giniGain.toFixed(4),
      },
    },
    variables: {
      leftGini: Math.round(leftGini * 10000) / 10000,
      rightGini: Math.round(rightGini * 10000) / 10000,
      giniGain: Math.round(giniGain * 10000) / 10000,
    },
  });

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: `Gini Impurity Split Evaluation Complete: Gain = ${giniGain.toFixed(4)}`,
      why: `Pure binary split achieved! Gini Gain = ${parentGini.toFixed(4)} - ${weightedChildGini.toFixed(
        4,
      )} = ${giniGain.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        giniGain: giniGain.toFixed(4),
        status: "Completed",
      },
    },
    variables: { giniGain: Math.round(giniGain * 10000) / 10000, complete: true },
  });

  return steps;
};

export const giniImpurityBinarySplit: AlgorithmDefinition<GiniImpurityBinarySplitInput> = {
  id: "giniImpurityBinarySplit",
  title: "Gini Impurity Binary Split (CART)",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Computes Gini Impurity Gini(S) = 1 - sum(p_i^2) and Gini Gain reduction for binary classification decision tree splits (CART, Breiman et al. 1984). Measures node class homogeneity, where Gini = 0.0 indicates a perfectly pure node containing a single class.\n\nInput Format:\n- labels: Array of class labels (0 or 1).\n- splitIndex: Candidate split index boundary.\n\nOutput Format:\n- Returns tuple (parentGini, leftGini, rightGini, giniGain).\n\nEdge Cases & Constraints:\n- Pure node (all class 0 or class 1): Gini = 0.0.\n- 50/50 binary mix: Maximum Gini = 0.5.",
  constraints: ["0 <= splitIndex < labels.length - 1."],
  examples: [
    {
      kind: "basic",
      title: "Perfect Pure Binary Split",
      inputDisplay: "labels = [0, 0, 0, 1, 1, 1], splitIndex = 2",
      outputDisplay: "Gini(Parent)=0.5, Gini(Left)=0.0, Gini(Right)=0.0, Gain=0.5",
      input: DEFAULT_GINI_IMPURITY_INPUT,
      output: "Gain = 0.5000",
      explanation:
        "Splits 50/50 mixed parent (Gini 0.5) into perfectly pure left [0,0,0] and right [1,1,1] nodes (Gini 0.0).",
    },
    {
      kind: "complex",
      title: "Impure Binary Split",
      inputDisplay: "labels = [0, 1, 0, 1, 0, 1], splitIndex = 2",
      outputDisplay: "Gain = 0.0000",
      input: {
        labels: [0, 1, 0, 1, 0, 1],
        splitIndex: 2,
      },
      output: "Gain = 0.0000",
      explanation:
        "Split results in identical 50/50 class distributions in both children, producing zero Gini Gain.",
    },
    {
      kind: "negative",
      title: "Single Class Dataset",
      inputDisplay: "labels = [1, 1, 1, 1]",
      outputDisplay: "Parent Gini = 0.0",
      input: {
        labels: [1, 1, 1, 1],
        splitIndex: 1,
      },
      output: "Gini = 0.0000",
      explanation: "Perfectly pure dataset has zero initial Gini impurity.",
    },
  ],
  defaultInput: DEFAULT_GINI_IMPURITY_INPUT,
  code: GINI_IMPURITY_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(C)",
  complexityAnalysis: {
    time: "O(N) linear time scan across N sample labels.",
    space: "O(C) auxiliary space for class frequency count dictionary.",
  },
  topicGuide: {
    overview:
      "Gini Impurity (Corrado Gini 1912, Leo Breiman CART 1984) is the default split metric in classification decision trees (scikit-learn DecisionTreeClassifier, Random Forest). Gini measures the probability that a randomly chosen element from the set would be incorrectly labeled if it were randomly labeled according to the distribution of labels in the subset.",
    sections: [
      {
        heading: "Overview & Mathematical Formulation",
        body: "Gini(S) = 1 - sum_{i=1}^C p_i^2 = sum_{i != j} p_i p_j. For binary classification with positive fraction p, Gini = 1 - (p^2 + (1-p)^2) = 2p(1-p).",
      },
      {
        heading: "Gini Impurity vs Shannon Entropy",
        body: "Gini Impurity avoids expensive log2 calculations required by Shannon Entropy, executing faster on CPUs and GPUs while yielding nearly identical tree structures.",
      },
      {
        heading: "Weighted Child Gini & Split Selection",
        body: "Gini Gain = Gini(Parent) - [ (N_left / N) Gini(Left) + (N_right / N) Gini(Right) ]. CART searches for the feature threshold that maximizes Gini Gain.",
      },
      {
        heading: "Implementation Nuances & Edge Cases",
        body: "When child subsets contain zero samples (N_left = 0 or N_right = 0), the weighted Gini calculation must guard against division by zero by defining empty node impurity as 0.0.",
      },
    ],
    keyTerms: [
      {
        term: "Gini Impurity",
        definition:
          "Statistical measure of node label variance, ranging from 0.0 (pure) to 0.5 (equal binary mix).",
      },
      {
        term: "CART Algorithm",
        definition: "Classification And Regression Trees algorithm introduced by Breiman et al.",
      },
      {
        term: "Gini Gain",
        definition:
          "Reduction in weighted Gini impurity achieved by splitting a node into child subsets.",
      },
      {
        term: "Node Purity",
        definition:
          "Condition when all samples in a decision tree node belong to a single target class (Gini = 0.0).",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "CART Decision Trees (Breiman et al. 1984)" },
  ],
  generateSteps: generateGiniImpuritySteps,
};
