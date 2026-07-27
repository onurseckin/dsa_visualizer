import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface ShannonEntropyCalculatorInput {
  labels: number[];
}

export const DEFAULT_SHANNON_ENTROPY_INPUT: ShannonEntropyCalculatorInput = {
  labels: [0, 0, 1, 1, 1, 1],
};

export const SHANNON_ENTROPY_CODE = `import math

def compute_shannon_entropy(labels: list[int]) -> float:
    """
    Computes Shannon Entropy H(S) for decision tree Information Gain (ID3 / C4.5).
    Formula: H(S) = - sum(p_i * log2(p_i)) where p_i is class probability.
    """
    if not labels:
        return 0.0

    n = len(labels)
    counts = {}
    for y in labels:
        counts[y] = counts.get(y, 0) + 1

    entropy = 0.0
    for cnt in counts.values():
        p = cnt / n
        if p > 0:
            entropy -= p * math.log2(p)

    return round(entropy, 4)`;

export const generateShannonEntropySteps = (
  input: ShannonEntropyCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { labels } = input;
  let stepIndex = 0;

  const n = labels.length;
  const counts: Record<number, number> = {};
  labels.forEach((y) => (counts[y] = (counts[y] || 0) + 1));

  let entropy = 0.0;
  const probDetails: string[] = [];
  for (const [cls, cnt] of Object.entries(counts)) {
    const p = cnt / n;
    if (p > 0) {
      const term = p * Math.log2(p);
      entropy -= term;
      probDetails.push(`P(class ${cls}) = ${cnt}/${n} = ${p.toFixed(3)}`);
    }
  }

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Shannon Entropy Calculator (ID3 / C4.5)",
      why: `Calculating Shannon Entropy H(S) for ${n} sample labels [${labels.join(", ")}].`,
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
        totalSamples: String(n),
        formula: "H(S) = - sum(p_i * log2(p_i))",
        status: "Initialized",
      },
    },
    variables: { totalSamples: n },
  });

  // Step 1: Class Probabilities
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Compute Class Probability Distribution p_i",
      why: `Class probabilities: ${probDetails.join("; ")}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `Class ${y}`,
        state: "active" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        probabilities: probDetails.join(" | "),
      },
    },
    variables: { totalSamples: n },
  });

  // Step Final: Compute Entropy
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 18,
    explanation: {
      what: `Shannon Entropy H(S) = ${entropy.toFixed(4)} bits`,
      why: `Calculated Shannon Entropy H(S) = - sum(p_i * log2(p_i)) = ${entropy.toFixed(
        4,
      )} bits. (0.0 = pure, 1.0 = equal binary mix).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `y-${idx}`,
        value: y,
        label: `H(S) = ${entropy.toFixed(3)} bits`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        shannonEntropy: `${entropy.toFixed(4)} bits`,
        status: "Completed",
      },
    },
    variables: { entropy: Math.round(entropy * 10000) / 10000, complete: true },
  });

  return steps;
};

export const shannonEntropyCalculator: AlgorithmDefinition<ShannonEntropyCalculatorInput> = {
  id: "shannonEntropyCalculator",
  title: "Shannon Entropy Calculator (ID3 / C4.5)",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Computes Shannon Entropy H(S) = - sum(p_i * log2(p_i)) and Information Gain for decision tree splits (ID3 / C4.5, Quinlan 1986). Quantifies node uncertainty in bits, where H(S) = 0.0 bits represents a pure node and H(S) = 1.0 bit represents an equal 50/50 binary class mixture.\n\nInput Format:\n- labels: Array of class labels (0 or 1).\n\nOutput Format:\n- Returns float entropy in bits.\n\nEdge Cases & Constraints:\n- Pure node: Yields H(S) = 0.0 bits.",
  constraints: ["labels.length >= 1."],
  examples: [
    {
      kind: "basic",
      title: "Shannon Entropy for 2/3 Class Mix",
      inputDisplay: "labels = [0, 0, 1, 1, 1, 1]",
      outputDisplay: "Entropy: 0.9183 bits",
      input: DEFAULT_SHANNON_ENTROPY_INPUT,
      output: "0.9183 bits",
      explanation: "P(0) = 2/6 = 0.333, P(1) = 4/6 = 0.667 -> H(S) = 0.9183 bits.",
    },
    {
      kind: "complex",
      title: "Maximum Entropy (50/50 Mix)",
      inputDisplay: "labels = [0, 0, 1, 1]",
      outputDisplay: "Entropy: 1.0000 bit",
      input: { labels: [0, 0, 1, 1] },
      output: "1.0000 bit",
      explanation: "Equal binary distribution produces maximum uncertainty of 1.0000 bit.",
    },
    {
      kind: "negative",
      title: "Zero Entropy Pure Node",
      inputDisplay: "labels = [1, 1, 1, 1]",
      outputDisplay: "Entropy: 0.0000 bits",
      input: { labels: [1, 1, 1, 1] },
      output: "0.0000 bits",
      explanation: "Zero uncertainty for pure single-class node.",
    },
  ],
  defaultInput: DEFAULT_SHANNON_ENTROPY_INPUT,
  code: SHANNON_ENTROPY_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(C)",
  complexityAnalysis: {
    time: "O(N) linear time scan across N sample labels.",
    space: "O(C) auxiliary space for class frequency map.",
  },
  topicGuide: {
    overview:
      "Shannon Entropy (Claude Shannon 1948, Ross Quinlan ID3 1986) measures information content and disorder. In C4.5 decision trees, Information Gain IG(S, A) = H(S) - sum (|S_v| / |S|) H(S_v) measures the entropy reduction achieved by splitting on feature A.",
    sections: [
      {
        heading: "Overview & Information Gain",
        body: "Entropy H(S) = - sum p_i log2(p_i) measures average bits required to encode class labels. Information Gain IG selects the feature that maximizes entropy reduction.",
      },
      {
        heading: "Gain Ratio (C4.5)",
        body: "To fix Information Gain's bias towards high-cardinality features, Quinlan's C4.5 uses Gain Ratio GR = IG(S, A) / SplitInfo(A), where SplitInfo(A) = - sum (|S_v|/|S|) log2(|S_v|/|S|).",
      },
      {
        heading: "Entropy vs Gini Impurity",
        body: "Gini Impurity 1 - sum p_i^2 is computationally faster because it avoids `log2` evaluation, but entropy offers direct information-theoretic interpretation.",
      },
      {
        heading: "Implementation Nuances & Zero Probability",
        body: "As p_i approaches 0, p_i * log2(p_i) approaches 0 (by limit x log x -> 0 as x -> 0). Code implementations must check `if p > 0` to prevent `log2(0)` domain errors.",
      },
    ],
    keyTerms: [
      {
        term: "Shannon Entropy (H)",
        definition: "Information-theoretic measure of node uncertainty measured in bits.",
      },
      {
        term: "Information Gain (IG)",
        definition: "Reduction in Shannon entropy resulting from splitting a dataset on a feature.",
      },
      {
        term: "Gain Ratio",
        definition:
          "C4.5 metric normalizing Information Gain by split entropy to prevent feature cardinality bias.",
      },
      {
        term: "Bit (Unit of Information)",
        definition:
          "Standard unit measuring binary uncertainty; H = 1.0 bit for a 50/50 binary classification split.",
      },
    ],
  },
  sources: [
    {
      type: "ml_infra",
      kind: "ml_infra",
      label: "Quinlan's ID3 / C4.5 Decision Trees (Machine Learning 1986)",
    },
  ],
  generateSteps: generateShannonEntropySteps,
};
