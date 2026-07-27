import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ShannonEntropyCalculatorInput {
  labels: number[];
  data?: number[];
  target?: number;
}

export const DEFAULT_SHANNON_ENTROPY_INPUT: ShannonEntropyCalculatorInput = {
  labels: [0, 0, 0, 1, 1, 1, 2, 2, 0, 1, 2, 1],
  data: [0, 0, 0, 1, 1, 1, 2, 2, 0, 1, 2, 1],
  target: 0,
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
  const labels = input.labels || input.data || [0, 0, 0, 1, 1, 1, 2, 2, 0, 1, 2, 1];
  let stepIndex = 0;
  const n = labels.length;

  // Step 1: Import math
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Import Python math Module",
      why: "Imports math module for binary logarithm function math.log2().",
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Module": "math", "Function": "math.log2" } },
    variables: { imported: true },
  });

  // Step 2: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Initialize Shannon Entropy Calculator (ID3 / C4.5)",
      why: `Computing H(S) = - sum(p_i log2 p_i) across ${n} classification sample labels.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `Class ${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Total Samples N": String(n),
        "Status": "Function Entry",
      },
    },
    variables: { totalSamples: n },
  });

  // Step 3: Check empty
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Check if labels List is Empty",
      why: `Labels list has length N = ${n} (not empty). Proceed to frequency counting.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `Class ${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Empty Check": "False" } },
    variables: { is_empty: false },
  });

  // Step 4: Measure n
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Measure Total Sample Count: n = ${n}`,
      why: `Total sample count n = ${n}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { n: String(n) } },
    variables: { n },
  });

  // Step 5: Allocate counts
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Allocate Empty counts Dictionary",
      why: "Initializes frequency map to accumulate class label occurrences.",
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Class Counts": "{}" } },
    variables: { allocated_counts: true },
  });

  // Frequency loop (13..14)
  const counts: Record<number, number> = {};
  labels.forEach((y, idx) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Frequency Loop: Scan Sample ${idx + 1}/${n} (Class y=${y})`,
        why: `Loading sample index ${idx} with class label ${y}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: `y=${val}`,
          state: i === idx ? ("active" as ElementState) : i < idx ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Current Sample": `Index ${idx} (y=${y})` } },
      variables: { idx, y },
    });

    counts[y] = (counts[y] || 0) + 1;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Increment Count for Class ${y}: count = ${counts[y]}`,
        why: `Updated frequency of class ${y} to ${counts[y]}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: `y=${val}`,
          state: i === idx ? ("compare" as ElementState) : i < idx ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Class Frequencies": JSON.stringify(counts) } },
      variables: { y, count: counts[y] },
    });
  });

  // Step 6: Initialize entropy accumulator
  let entropy = 0.0;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: "Initialize Entropy Accumulator: entropy = 0.0",
      why: "Initializes floating point accumulator H = 0.0 for Shannon entropy summation.",
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}`,
        state: "visited" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Entropy H(S)": "0.0000" } },
    variables: { entropy },
  });

  // Entropy sum loop (17..20)
  Object.entries(counts).forEach(([classLabel, cnt]) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 17,
      explanation: {
        what: `Entropy Loop: Process Class ${classLabel} (Frequency count = ${cnt})`,
        why: `Evaluating entropy contribution for class ${classLabel} with frequency ${cnt}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((y, idx) => ({
          id: `s-${idx}`,
          value: y,
          label: `y=${y}`,
          state: String(y) === classLabel ? ("active" as ElementState) : ("visited" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Current Class": classLabel, "Count": String(cnt) } },
      variables: { classLabel, cnt },
    });

    const p = cnt / n;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 18,
      explanation: {
        what: `Calculate Class Probability: p_${classLabel} = ${cnt} / ${n} = ${p.toFixed(4)}`,
        why: `Evaluated empirical probability p = ${cnt}/${n} = ${p.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((y, idx) => ({
          id: `s-${idx}`,
          value: y,
          label: `y=${y}`,
          state: String(y) === classLabel ? ("active" as ElementState) : ("visited" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Probability p": p.toFixed(4) } },
      variables: { p },
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Check Probability p > 0: ${p.toFixed(4)} > 0`,
        why: "Class probability p is positive; proceed to accumulate -p * log2(p).",
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((y, idx) => ({
          id: `s-${idx}`,
          value: y,
          label: `y=${y}`,
          state: String(y) === classLabel ? ("compare" as ElementState) : ("visited" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "p > 0": "True" } },
      variables: { p_positive: true },
    });

    const term = p * Math.log2(p);
    entropy -= term;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Accumulate Entropy Term: entropy -= ${p.toFixed(4)} * log2(${p.toFixed(4)}) = ${(-term).toFixed(4)}`,
        why: `Updated accumulated Shannon entropy H(S) to ${entropy.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: labels.map((y, idx) => ({
          id: `s-${idx}`,
          value: y,
          label: `y=${y}`,
          state: String(y) === classLabel ? ("sorted" as ElementState) : ("visited" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Accumulated H(S)": entropy.toFixed(4) } },
      variables: { term: -term, entropy },
    });
  });

  // Final step (22)
  const finalEntropy = Math.round(entropy * 10000) / 10000;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 22,
    explanation: {
      what: `Execution Complete: Return Shannon Entropy H(S) = ${finalEntropy}`,
      why: `Successfully evaluated Shannon Entropy H(S) = ${finalEntropy} bits.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: labels.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `Class ${y}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Shannon Entropy H(S)": `${finalEntropy} bits`,
        "Class Frequencies": JSON.stringify(counts),
        "Total Samples N": String(n),
      },
    },
    variables: { finalEntropy, completed: true },
  });

  return steps;
};

const SHANNON_ENTROPY_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 7, 10, 15, 21],
  distractors: [
    "entropy = 1.0 - sum(p ** 2)",
    "entropy += p * math.log(p)",
    "p = cnt / len(counts)",
    "return sum(counts.values())",
  ],
  hints: [
    { line: 17, hint: "Iterate over frequency counts of each unique class in the dataset." },
    { line: 20, hint: "Shannon Entropy term accumulation: entropy -= p * math.log2(p)." },
  ],
  lineExplanations: {
    1: "Imports Python standard math module for binary logarithm math.log2().",
    2: "Blank line before function definition.",
    3: "Defines entry point for compute_shannon_entropy function.",
    4: "Docstring opening delimiter tag.",
    5: "Describes Shannon Entropy H(S) computation for decision tree Information Gain (ID3 / C4.5).",
    6: "Docstring Shannon Entropy formula line: H(S) = - sum(p_i * log2(p_i)).",
    7: "Docstring closing delimiter tag.",
    8: "Checks if labels list is empty.",
    9: "Returns 0.0 entropy for empty label list.",
    10: "Blank line before sample size extraction.",
    11: "Measures total sample count n in labels list.",
    12: "Initializes empty dictionary counts to accumulate class frequencies.",
    13: "Iterates over class label y in labels list.",
    14: "Increments frequency counter counts[y] for current class y.",
    15: "Blank line before entropy accumulation loop.",
    16: "Initializes floating point accumulator entropy = 0.0.",
    17: "Iterates over sample frequency counts cnt in counts.values().",
    18: "Calculates class probability p = cnt / n.",
    19: "Checks if probability p is positive (p > 0).",
    20: "Subtracts p * math.log2(p) from entropy accumulator.",
    21: "Blank line separating accumulation loop from return statement.",
    22: "Rounds accumulated entropy to 4 decimal places and returns final float value.",
  },
};

export const shannonEntropyCalculator: AlgorithmDefinition<ShannonEntropyCalculatorInput> = {
  id: "shannonEntropyCalculator",
  title: "Shannon Entropy Calculator (ID3 / C4.5)",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Shannon Entropy Calculator evaluates information uncertainty $H(S)$ for classification nodes inside **ID3 (Iterative Dichotomiser 3)** and **C4.5** decision tree algorithms. Derived from Claude Shannon's Information Theory (1948), Shannon Entropy measures the expected number of bits required to encode class labels drawn from a discrete probability distribution.\n\n### Why It Exists\nDecision tree engines compute **Information Gain $IG(S, A) = H(S) - H(S \\mid A)$** to select feature splits $A$ that reduce class uncertainty most dramatically. Higher entropy indicates maximum disorder (equal class mixture), while zero entropy indicates complete purity.\n\n### Mathematical Formulation\nFor a discrete dataset $S$ containing $N$ samples across $K$ classes with class probabilities $p_i = \\frac{N_i}{N}$:\n\n$$1. \\quad H(S) = - \\sum_{i=1}^{K} p_i \\log_2(p_i) \\quad (\\text{Shannon Entropy in Bits})$$\n\n$$2. \\quad 0 \\le H(S) \\le \\log_2(K)$$\n\nWhere:\n- $H(S) = 0.0$ if all samples belong to a single class ($p_1 = 1.0$).\n- $H(S) = \\log_2(K) = 1.0$ bit for a uniform binary class split ($p_1 = 0.5, p_2 = 0.5$).\n\n### Step-by-Step Intuition\n1. **Frequency Counting**: Count class occurrences $N_i$ for every unique label $y$ in $S$.\n2. **Probability Evaluation**: Evaluate empirical class probabilities $p_i = N_i / N$.\n3. **Information Expectation**: For each class, calculate information content $-\\log_2(p_i)$ weighted by probability $p_i$.\n4. **Entropy Accumulation**: Sum $-p_i \\log_2(p_i)$ across all $K$ classes.\n\n### Key Trade-Offs & Hardware Execution\n- **Logarithm Compute Cost**: $\\log_2(p_i)$ requires transcendental floating-point hardware instructions (F2I/LOG2), making Entropy slightly slower than Gini Impurity ($1 - \\sum p_i^2$).\n- **C4.5 Gain Ratio**: C4.5 normalizes Information Gain by Split Information $H_A(S)$ to avoid over-favoring high-cardinality features.",
  constraints: [
    "1 <= N <= 1000000",
    "Class labels are non-negative integers",
  ],
  examples: [
    {
      kind: "basic",
      title: "12-Sample 3-Class Entropy Evaluation",
      inputDisplay: "Labels = [0, 0, 0, 1, 1, 1, 2, 2, 0, 1, 2, 1] (Count: c0=4, c1=5, c2=3)",
      outputDisplay: "Shannon Entropy H(S) = 1.5546 bits",
      input: DEFAULT_SHANNON_ENTROPY_INPUT,
      output: "1.5546",
      explanation: "Evaluates H(S) = -(4/12 log2(4/12) + 5/12 log2(5/12) + 3/12 log2(3/12)) = 1.5546 bits.",
    },
  ],
  code: SHANNON_ENTROPY_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(K)",
  complexityAnalysis: {
    time: "Requires a single pass over $N$ sample labels to compute frequencies, followed by $O(K)$ logarithm operations.",
    space: "Requires $O(K)$ memory to store class frequencies for $K$ distinct classes.",
  },
  topicGuide: {
    overview:
      "The Shannon Entropy Calculator computes information uncertainty H(S) for decision tree Information Gain algorithms.",
    sections: [
      {
        heading: "Core Concept & Information Theory",
        body: "Shannon Entropy measures average information content H(S) = - sum(p_i log2 p_i) in bits. High entropy indicates mixed classes; zero entropy indicates a pure node.",
      },
      {
        heading: "Information Gain in ID3 and C4.5",
        body: "ID3 selects feature splits maximizing Information Gain IG = H(Parent) - Weighted_Child_Entropy. C4.5 extends ID3 by using Gain Ratio to prevent bias toward high-cardinality features.",
      },
      {
        heading: "Entropy vs Gini Impurity Comparison",
        body: "Entropy H(S) uses log2(p_i) while Gini uses 1 - sum(p_i^2). While mathematically similar in behavior, Gini avoids expensive logarithm instructions.",
      },
      {
        heading: "Edge Case Analysis & Zero Probability",
        body: "By limit definition lim_{p->0} p log2(p) = 0. Classes with zero occurrences contribute 0.0 to total entropy.",
      },
    ],
    keyTerms: [
      {
        term: "Shannon Entropy",
        definition: "Expected information content H(S) = - sum(p_i log2 p_i) measured in bits.",
      },
      {
        term: "Information Gain",
        definition: "Reduction in entropy achieved by partitioning a dataset: H(Parent) - Weighted_Child_Entropy.",
      },
      {
        term: "ID3 Algorithm",
        definition: "Iterative Dichotomiser 3 decision tree algorithm developed by Ross Quinlan using Information Gain.",
      },
      {
        term: "Logarithm Bit Unit",
        definition: "Base-2 logarithm output measuring information content in bits.",
      },
    ],
  },
  trivia: SHANNON_ENTROPY_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_SHANNON_ENTROPY_INPUT,
  generateSteps: generateShannonEntropySteps,
};
