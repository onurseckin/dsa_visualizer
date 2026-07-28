import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface GiniImpurityBinarySplitInput {
  labels: number[];
  splitIndex: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_GINI_IMPURITY_INPUT: GiniImpurityBinarySplitInput = {
  labels: [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  splitIndex: 5,
  data: [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1],
  target: 5,
};

export const GINI_IMPURITY_CODE = `def compute_gini_impurity(labels: list[int]) -> float:
    if not labels:
        return 0.0

    n = len(labels)
    counts = {}
    for y in labels:
        counts[y] = counts.get(y, 0) + 1

    return 1.0 - sum((cnt / n) ** 2 for cnt in counts.values())

def gini_binary_split_gain(labels: list[int], split_index: int) -> tuple[float, float, float, float]:
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
  const labels = input.labels || input.data || [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1];
  const splitIndex = input.splitIndex ?? input.target ?? 5;
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
  const nLeft = leftLabels.length;
  const nRight = rightLabels.length;
  const weightedChildGini = (nLeft / n) * leftGini + (nRight / n) * rightGini;
  const giniGain = parentGini - weightedChildGini;

  // Step 1: Entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Initialize Gini Impurity Binary Split Evaluator (CART)",
      why: `Parent node contains ${labels.length} class labels [${labels.join(", ")}]. Evaluating candidate split at index ${splitIndex}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Total Samples N": String(n),
        "Split Index": String(splitIndex),
        Status: "Initialized",
      },
    },
    variables: { n, splitIndex },
  });

  // Step 2: Slice left
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Slice Left Partition: labels[0..${splitIndex}]`,
      why: `Created left child node partition containing ${nLeft} samples [${leftLabels.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("default" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: { "Left Partition": `[${leftLabels.join(", ")}]`, N_left: String(nLeft) },
    },
    variables: { n_left: nLeft },
  });

  // Step 3: Slice right
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Slice Right Partition: labels[${splitIndex + 1}..${n - 1}]`,
      why: `Created right child node partition containing ${nRight} samples [${rightLabels.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Left Partition": `[${leftLabels.join(", ")}]`,
        "Right Partition": `[${rightLabels.join(", ")}]`,
        N_right: String(nRight),
      },
    },
    variables: { n_right: nRight },
  });

  // Compute Parent Gini sub-steps
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "Compute Parent Node Gini Impurity",
      why: "Calling compute_gini_impurity(labels) on parent dataset.",
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
    auxiliaryState: { customState: { Target: "Parent Node Gini" } },
    variables: { target: "Parent" },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Parent Gini: Measure N = ${n}`,
      why: `Parent node sample count N = ${n}.`,
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
    auxiliaryState: { customState: { "Parent N": String(n) } },
    variables: { parent_n: n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Class Frequency Dictionary",
      why: "Initializes hash map counts to store frequency of each label in parent node.",
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
    auxiliaryState: { customState: { "Parent Class Frequencies": "{}" } },
    variables: { counts: {} },
  });

  // Count parent frequencies
  const parentCounts: Record<number, number> = {};
  labels.forEach((y, idx) => {
    parentCounts[y] = (parentCounts[y] || 0) + 1;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Parent Frequency Scan: Sample ${idx} (Class y=${y})`,
        why: `Class ${y} count is now ${parentCounts[y]}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((v, i) => ({
          id: `y-${i}`,
          value: v,
          label: `y=${v}`,
          state:
            i === idx
              ? ("compare" as ElementState)
              : i < idx
                ? ("visited" as ElementState)
                : ("default" as ElementState),
        })),
      },
      auxiliaryState: {
        customState: {
          "Parent Class Frequencies": JSON.stringify(parentCounts),
        },
      },
      variables: { idx, y, count: parentCounts[y] },
    });
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Evaluated Parent Gini Impurity: Gini(Parent) = ${parentGini.toFixed(4)}`,
      why: `Evaluated Gini = 1 - sum(p_i^2) = ${parentGini.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "visited" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Parent Gini": parentGini.toFixed(4) } },
    variables: { parent_gini: parentGini },
  });

  // Compute Left Gini
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Compute Left Child Node Gini Impurity: Gini(Left) = ${leftGini.toFixed(4)}`,
      why: `Evaluated Left Gini on ${nLeft} samples [${leftLabels.join(", ")}]: Gini(Left) = ${leftGini.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("default" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Gini": parentGini.toFixed(4),
        "Left Gini": leftGini.toFixed(4),
      },
    },
    variables: { left_gini: leftGini },
  });

  // Compute Right Gini
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: `Compute Right Child Node Gini Impurity: Gini(Right) = ${rightGini.toFixed(4)}`,
      why: `Evaluated Right Gini on ${nRight} samples [${rightLabels.join(", ")}]: Gini(Right) = ${rightGini.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Gini": parentGini.toFixed(4),
        "Left Gini": leftGini.toFixed(4),
        "Right Gini": rightGini.toFixed(4),
      },
    },
    variables: { right_gini: rightGini },
  });

  // Extract lengths
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Extract Dataset Length: n = ${n}`,
      why: `Total sample count n = ${n}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { n: String(n) } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Extract Left Child Length: n_left = ${nLeft}`,
      why: `Left child sample count n_left = ${nLeft}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { n_left: String(nLeft) } },
    variables: { n_left: nLeft },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Extract Right Child Length: n_right = ${nRight}`,
      why: `Right child sample count n_right = ${nRight}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { n_right: String(nRight) } },
    variables: { n_right: nRight },
  });

  // Weighted child Gini
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: `Calculate Weighted Child Gini = ${weightedChildGini.toFixed(4)}`,
      why: `Evaluated weighted child Gini = (${nLeft}/${n}) * ${leftGini.toFixed(4)} + (${nRight}/${n}) * ${rightGini.toFixed(4)} = ${weightedChildGini.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Gini": parentGini.toFixed(4),
        "Weighted Child Gini": weightedChildGini.toFixed(4),
      },
    },
    variables: { weightedChildGini },
  });

  // Gini Gain
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: `Calculate Gini Gain = ${giniGain.toFixed(4)}`,
      why: `Evaluated Gini Gain = Parent Gini (${parentGini.toFixed(4)}) - Weighted Child Gini (${weightedChildGini.toFixed(4)}) = ${giniGain.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Gini": parentGini.toFixed(4),
        "Weighted Child Gini": weightedChildGini.toFixed(4),
        "Gini Gain": giniGain.toFixed(4),
      },
    },
    variables: { giniGain },
  });

  // Return step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 27,
    explanation: {
      what: `Execution Complete: Return Gini Split Gain Summary`,
      why: `Returned tuple (Parent Gini=${parentGini.toFixed(4)}, Left Gini=${leftGini.toFixed(4)}, Right Gini=${rightGini.toFixed(4)}, Gain=${giniGain.toFixed(4)}).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: idx <= splitIndex ? `L:y=${y}` : `R:y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Gini": parentGini.toFixed(4),
        "Left Gini": leftGini.toFixed(4),
        "Right Gini": rightGini.toFixed(4),
        "Gini Gain": giniGain.toFixed(4),
      },
    },
    variables: { parentGini, leftGini, rightGini, giniGain, completed: true },
  });

  return steps;
};

const GINI_IMPURITY_TRIVIA: TriviaMeta = {
  skipLines: [4, 9, 11, 15, 19, 23, 26],
  distractors: [
    "gini = 1.0 - sum(cnt / n)",
    "gain = weighted_child_gini - parent_gini",
    "gini = -sum(p * log2(p))",
    "weighted_child_gini = left_gini + right_gini",
  ],
  hints: [
    { line: 10, hint: "Gini impurity equation: 1.0 - sum( (count / N)^2 )." },
    { line: 25, hint: "Gini gain equation: Gini(Parent) - Weighted_Child_Gini." },
  ],
  lineExplanations: {
    1: "Defines helper function compute_gini_impurity calculating node classification variance.",
    2: "Checks if labels list is empty; returns 0.0 for empty node.",
    3: "Returns 0.0 Gini impurity for empty label list.",
    4: "Blank line before sample count calculation.",
    5: "Measures total sample count n in labels list.",
    6: "Initializes dictionary counts to store class label frequencies.",
    7: "Iterates over classification class label y in labels list.",
    8: "Increments class label frequency counter counts[y].",
    9: "Blank line before Gini sum evaluation.",
    10: "Evaluates and returns Gini impurity: 1.0 - sum( (cnt / n)**2 ).",
    11: "Blank line before split gain function definition.",
    12: "Defines entry point for gini_binary_split_gain function.",
    13: "Slices left child node labels list labels[:split_index + 1].",
    14: "Slices right child node labels list labels[split_index + 1:].",
    15: "Blank line before Gini evaluations.",
    16: "Calls compute_gini_impurity on full parent labels list.",
    17: "Calls compute_gini_impurity on left child node labels list.",
    18: "Calls compute_gini_impurity on right child node labels list.",
    19: "Blank line before sample count extraction.",
    20: "Extracts total parent sample count n.",
    21: "Extracts left child sample count n_left.",
    22: "Extracts right child sample count n_right.",
    23: "Blank line before weighted sum calculation.",
    24: "Calculates weighted child Gini impurity sum: (n_left/n)*left_gini + (n_right/n)*right_gini.",
    25: "Calculates Gini Gain reduction: parent_gini - weighted_child_gini.",
    26: "Blank line before return statement.",
    27: "Returns tuple of (parent_gini, left_gini, right_gini, gini_gain).",
  },
};

export const giniImpurityBinarySplit: AlgorithmDefinition<GiniImpurityBinarySplitInput> = {
  id: "gini-impurity-binary-split",
  title: "Gini Impurity Binary Split Evaluator",
  topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Easy",
  description:
    "The Gini Impurity Binary Split Evaluator measures the classification purity reduction (Gain) when splitting a decision tree node into left and right children using the **CART (Classification and Regression Trees)** algorithm. Gini Impurity measures the probability of misclassifying a randomly chosen element from a set if it were randomly labeled according to the class distribution in the subset.\n\n### Why It Exists\nDecision tree construction algorithms (CART, Random Forest, Scikit-Learn DecisionTreeClassifier) evaluate hundreds of candidate threshold splits across features to choose the split that maximizes purity gain, driving node samples toward homogeneous single-class clusters.\n\n### Mathematical Formulation\nFor a node containing $N$ samples across $K$ classes with class counts $N_k$ and class probabilities $p_k = N_k / N$:\n\n$$1. \\quad I_G(\\text{Node}) = 1 - \\sum_{k=1}^{K} p_k^2 \\quad (\\text{Gini Impurity})$$\n\n$$2. \\quad \\text{Weighted Child Gini} = \\frac{N_L}{N} I_G(L) + \\frac{N_R}{N} I_G(R)$$\n\n$$3. \\quad \\text{Gini Gain} = I_G(\\text{Parent}) - \\left[ \\frac{N_L}{N} I_G(L) + \\frac{N_R}{N} I_G(R) \\right]$$\n\nwhere $0 \\le I_G \\le 1 - 1/K$. A pure node containing a single class has $I_G = 0.0$.\n\n### Step-by-Step Intuition\n1. **Parent Gini Evaluation**: Count class frequencies in parent node $S$ and compute $I_G(\\text{Parent})$.\n2. **Partition Slicing**: Divide parent labels into Left child $S_L = S[0..idx]$ and Right child $S_R = S[idx+1..end]$.\n3. **Child Gini Evaluation**: Compute $I_G(S_L)$ and $I_G(S_R)$ independently.\n4. **Weighted Gain Subtraction**: Subtract the sample-weighted average child Gini from Parent Gini.\n\n### Key Trade-Offs & Hardware Execution\n- **Gini vs Entropy (LogLoss)**: Gini Impurity does not compute transcendental logarithms (no $\\log_2$), making it computationally faster to compute on CPUs and GPUs than Shannon Entropy.\n- **Histogram Acceleration**: In XGBoost and LightGBM, Gini is evaluated directly from integer class histograms in $O(K)$ time per split candidate.",
  constraints: [
    "1 <= N <= 1000000",
    "0 <= splitIndex < N",
    "Class labels are non-negative integers",
  ],
  examples: [
    {
      kind: "basic",
      title: "12-Sample Binary Classification Split",
      inputDisplay: "Labels = [0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1], Split at Index 5",
      outputDisplay: "Parent Gini = 0.4861, Left Gini = 0.2778, Right Gini = 0.2778, Gain = 0.2083",
      input: DEFAULT_GINI_IMPURITY_INPUT,
      output: "(0.4861, 0.2778, 0.2778, 0.2083)",
      explanation:
        "Splitting at index 5 separates mostly class 0 (left) from mostly class 1 (right), yielding Gini Gain = 0.2083.",
    },
  ],
  code: GINI_IMPURITY_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "Requires a single pass over $N$ sample labels to build frequency map, performing $O(N)$ operations.",
    space: "Requires $O(K)$ space to store class label frequencies for $K$ distinct classes.",
  },
  topicGuide: {
    overview:
      "The Gini Impurity Binary Split Evaluator computes CART Gini impurity reduction across candidate split points.",
    sections: [
      {
        heading: "Core Concept & Impurity Reduction",
        body: "Gini Impurity measures classification variance: Gini = 1 - sum(p_i^2). Maximizing Gini Gain = Gini(Parent) - Weighted_Child_Gini selects splits that separate classes into pure nodes.",
      },
      {
        heading: "CART vs C4.5 (Gini vs Entropy)",
        body: "CART uses Gini Impurity while C4.5 uses Shannon Entropy. Gini avoids expensive log2 calculations, executing faster on SIMD hardware.",
      },
      {
        heading: "Histogram Tiling & Prefix Sums",
        body: "In production tree implementations (Scikit-Learn, LightGBM), class frequencies are accumulated in histogram bins. Moving split candidates updates histograms in O(K) time without rescanning dataset.",
      },
      {
        heading: "Edge Case Analysis & Pure Nodes",
        body: "If a node contains samples of only one class, Gini = 0.0. Splitting a pure node yields Gini Gain = 0.0, halting tree growth.",
      },
    ],
    keyTerms: [
      {
        term: "Gini Impurity",
        definition:
          "Purity metric 1 - sum(p_i^2) measuring misclassification variance at a tree node.",
      },
      {
        term: "CART Algorithm",
        definition:
          "Classification and Regression Trees framework introduced by Breiman et al. using Gini impurity.",
      },
      {
        term: "Gini Gain",
        definition:
          "Impurity reduction achieved by splitting a node: Parent_Gini - Weighted_Child_Gini.",
      },
      {
        term: "Pure Node",
        definition:
          "A tree node containing samples from exactly one class, having Gini Impurity = 0.0.",
      },
    ],
  },
  trivia: GINI_IMPURITY_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_GINI_IMPURITY_INPUT,
  generateSteps: generateGiniImpuritySteps,
};
