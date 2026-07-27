import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface VarianceReductionSplitInput {
  targets: number[];
  splitIndex: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_VARIANCE_REDUCTION_INPUT: VarianceReductionSplitInput = {
  targets: [1.0, 1.2, 1.1, 10.0, 10.2, 9.8],
  splitIndex: 2,
  data: [1.0, 1.2, 1.1, 10.0, 10.2, 9.8],
  target: 2,
};

export const VARIANCE_REDUCTION_SPLIT_CODE = `def compute_variance(values: list[float]) -> float:
    if not values:
        return 0.0
    mean_val = sum(values) / len(values)
    return sum((x - mean_val) ** 2 for x in values) / len(values)

def variance_reduction_split(targets: list[float], split_index: int) -> tuple[float, float, float, float]:
    """
    Computes Variance Reduction split score for regression decision trees.
    Variance Reduction = Var(Parent) - (N_left / N) * Var(Left) - (N_right / N) * Var(Right).
    """
    left = targets[:split_index + 1]
    right = targets[split_index + 1:]

    parent_var = compute_variance(targets)
    left_var = compute_variance(left)
    right_var = compute_variance(right)

    n = len(targets)
    n_left = len(left)
    n_right = len(right)

    weighted_child_var = (n_left / n) * left_var + (n_right / n) * right_var
    variance_reduction = parent_var - weighted_child_var

    return parent_var, left_var, right_var, round(variance_reduction, 4)`;

export const generateVarianceReductionSteps = (
  input: VarianceReductionSplitInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const targets = input.targets || input.data || [1.0, 1.2, 1.1, 10.0, 10.2, 9.8];
  const splitIndex = input.splitIndex ?? input.target ?? 2;
  let stepIndex = 0;

  const calcVar = (vals: number[]) => {
    if (vals.length === 0) return 0.0;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return vals.reduce((acc, x) => acc + (x - mean) ** 2, 0) / vals.length;
  };

  const parentVar = calcVar(targets);
  const left = targets.slice(0, splitIndex + 1);
  const right = targets.slice(splitIndex + 1);

  const leftVar = calcVar(left);
  const rightVar = calcVar(right);

  const n = targets.length;
  const nLeft = left.length;
  const nRight = right.length;
  const weightedChildVar = (nLeft / n) * leftVar + (nRight / n) * rightVar;
  const varianceReduction = parentVar - weightedChildVar;

  // Step 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Initialize Variance Reduction Split Evaluator (CART Regression Tree)",
      why: `Evaluating continuous regression targets [${targets.join(", ")}] for binary split at index ${splitIndex}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Total Samples N": String(n),
        "Split Index": String(splitIndex),
        "Status": "Initialized",
      },
    },
    variables: { n, splitIndex },
  });

  // Step 2: Slice left
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Slice Left Partition: targets[0..${splitIndex}]`,
      why: `Created left child regression partition containing ${nLeft} targets [${left.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("default" as ElementState),
      })),
    },
    auxiliaryState: { customState: { "Left Targets": `[${left.join(", ")}]`, "n_left": String(nLeft) } },
    variables: { n_left: nLeft },
  });

  // Step 3: Slice right
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 13,
    explanation: {
      what: `Slice Right Partition: targets[${splitIndex + 1}..${n - 1}]`,
      why: `Created right child regression partition containing ${nRight} targets [${right.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Left Targets": `[${left.join(", ")}]`,
        "Right Targets": `[${right.join(", ")}]`,
        "n_right": String(nRight),
      },
    },
    variables: { n_right: nRight },
  });

  // Compute Parent Variance step-by-step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: "Compute Parent Target Variance: Call compute_variance(targets)",
      why: "Computing mean and squared error variance for all parent targets.",
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: "active" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Target": "Parent Variance" } },
    variables: { target: "Parent" },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Enter compute_variance(values)",
      why: "Evaluating mean and variance for target values.",
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "active" as ElementState })),
    },
    auxiliaryState: { customState: { "Target": "Parent Variance" } },
    variables: { fn: "compute_variance" },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Check if Target Values List is Empty",
      why: `Target values list has length ${n} (not empty).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "active" as ElementState })),
    },
    auxiliaryState: { customState: { "Empty Check": "False" } },
    variables: { is_empty: false },
  });

  const parentMean = targets.reduce((a, b) => a + b, 0) / n;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Calculate Parent Target Mean: mean_val = ${parentMean.toFixed(4)}`,
      why: `Evaluated sum(targets) / ${n} = ${parentMean.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "active" as ElementState })),
    },
    auxiliaryState: { customState: { "Parent Mean": parentMean.toFixed(4) } },
    variables: { parentMean },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: `Calculate Parent Target Variance: Var(Parent) = ${parentVar.toFixed(4)}`,
      why: `Evaluated mean squared error sum((x - mean)^2) / ${n} = ${parentVar.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "visited" as ElementState })),
    },
    auxiliaryState: { customState: { "Parent Variance": parentVar.toFixed(4) } },
    variables: { parentVar },
  });

  // Step Left Var
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Compute Left Child Target Variance: Var(Left) = ${leftVar.toFixed(4)}`,
      why: `Evaluated variance on ${nLeft} left targets [${left.join(", ")}]: Var(Left) = ${leftVar.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("default" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Variance": parentVar.toFixed(4),
        "Left Variance": leftVar.toFixed(4),
      },
    },
    variables: { leftVar },
  });

  // Step Right Var
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: `Compute Right Child Target Variance: Var(Right) = ${rightVar.toFixed(4)}`,
      why: `Evaluated variance on ${nRight} right targets [${right.join(", ")}]: Var(Right) = ${rightVar.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Variance": parentVar.toFixed(4),
        "Left Variance": leftVar.toFixed(4),
        "Right Variance": rightVar.toFixed(4),
      },
    },
    variables: { rightVar },
  });

  // Extract lengths (19..21)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 19,
    explanation: {
      what: `Extract Dataset Length: n = ${n}`,
      why: `Total sample count n = ${n}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "default" as ElementState })),
    },
    auxiliaryState: { customState: { n: String(n) } },
    variables: { n },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Extract Left Child Length: n_left = ${nLeft}`,
      why: `Left child sample count n_left = ${nLeft}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "default" as ElementState })),
    },
    auxiliaryState: { customState: { n_left: String(nLeft) } },
    variables: { n_left: nLeft },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 21,
    explanation: {
      what: `Extract Right Child Length: n_right = ${nRight}`,
      why: `Right child sample count n_right = ${nRight}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({ id: `y-${idx}`, value: Math.round(y * 10), label: `y=${y}`, state: "default" as ElementState })),
    },
    auxiliaryState: { customState: { n_right: String(nRight) } },
    variables: { n_right: nRight },
  });

  // Weighted child variance (23)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 23,
    explanation: {
      what: `Calculate Weighted Child Variance = ${weightedChildVar.toFixed(4)}`,
      why: `Evaluated weighted child variance = (${nLeft}/${n}) * ${leftVar.toFixed(4)} + (${nRight}/${n}) * ${rightVar.toFixed(4)} = ${weightedChildVar.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Variance": parentVar.toFixed(4),
        "Weighted Child Variance": weightedChildVar.toFixed(4),
      },
    },
    variables: { weightedChildVar },
  });

  // Variance Reduction (24)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 24,
    explanation: {
      what: `Calculate Variance Reduction = ${varianceReduction.toFixed(4)}`,
      why: `Evaluated Variance Reduction = Var(Parent) (${parentVar.toFixed(4)}) - Weighted Child Var (${weightedChildVar.toFixed(4)}) = ${varianceReduction.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Variance": parentVar.toFixed(4),
        "Weighted Child Variance": weightedChildVar.toFixed(4),
        "Variance Reduction": varianceReduction.toFixed(4),
      },
    },
    variables: { varianceReduction },
  });

  // Return step (26)
  const finalReduction = Math.round(varianceReduction * 10000) / 10000;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: `Execution Complete: Return Variance Reduction Summary`,
      why: `Returned tuple (Parent Var=${parentVar.toFixed(4)}, Left Var=${leftVar.toFixed(4)}, Right Var=${rightVar.toFixed(4)}, Reduction=${finalReduction}).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: idx <= splitIndex ? `L:y=${y}` : `R:y=${y}`,
        state: idx <= splitIndex ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Parent Variance": parentVar.toFixed(4),
        "Left Variance": leftVar.toFixed(4),
        "Right Variance": rightVar.toFixed(4),
        "Variance Reduction": finalReduction.toFixed(4),
      },
    },
    variables: { parentVar, leftVar, rightVar, finalReduction, completed: true },
  });

  return steps;
};

const VARIANCE_REDUCTION_SPLIT_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 6, 8, 9, 10, 11, 14, 18, 22, 25],
  distractors: [
    "variance_reduction = weighted_child_var - parent_var",
    "mean_val = sum(values)",
    "return sum((x - mean_val) for x in values)",
    "weighted_child_var = left_var + right_var",
  ],
  hints: [
    { line: 4, hint: "Compute mean of target values: sum(values) / len(values)." },
    { line: 24, hint: "Variance Reduction equation: Var(Parent) - Weighted_Child_Var." },
  ],
  lineExplanations: {
    1: "Defines helper function compute_variance calculating variance of continuous values.",
    2: "Checks if values list is empty; returns 0.0 for empty list.",
    3: "Returns 0.0 variance for empty values list.",
    4: "Calculates sample mean mean_val = sum(values) / len(values).",
    5: "Evaluates and returns mean squared error variance sum((x - mean)^2) / len(values).",
    6: "Blank line before main split function definition.",
    7: "Defines entry point for variance_reduction_split function.",
    8: "Docstring opening delimiter tag.",
    9: "Describes Variance Reduction split score computation for regression decision trees.",
    10: "Docstring Variance Reduction formula line.",
    11: "Docstring closing delimiter tag.",
    12: "Slices left child target values list targets[:split_index + 1].",
    13: "Slices right child target values list targets[split_index + 1:].",
    14: "Blank line before variance computations.",
    15: "Calls compute_variance on full parent targets list.",
    16: "Calls compute_variance on left child targets list.",
    17: "Calls compute_variance on right child targets list.",
    18: "Blank line before sample size extraction.",
    19: "Extracts total parent sample count n.",
    20: "Extracts left child sample count n_left.",
    21: "Extracts right child sample count n_right.",
    22: "Blank line before weighted variance subtraction.",
    23: "Calculates weighted child target variance sum: (n_left/n)*left_var + (n_right/n)*right_var.",
    24: "Calculates Variance Reduction: parent_var - weighted_child_var.",
    25: "Blank line before return statement.",
    26: "Returns tuple of (parent_var, left_var, right_var, rounded variance_reduction).",
  },
};

export const varianceReductionSplit: AlgorithmDefinition<VarianceReductionSplitInput> = {
  id: "varianceReductionSplit",
  title: "Variance Reduction Split Evaluator",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Variance Reduction Split Evaluator measures the reduction in continuous target variance (MSE Gain) achieved when splitting a regression decision tree node using the **CART (Regression Trees)** algorithm. In regression trees, leaf node predictions equal the sample mean $\\bar{y}$, and split quality is measured by how much the split reduces target variance across children.\n\n### Why It Exists\nRegression decision trees (DecisionTreeRegressor in Scikit-Learn, LightGBM, Gradient Boosting Regressor) fit continuous response surfaces $y \\in \\mathbb{R}$. Variance Reduction selects threshold splits that minimize Mean Squared Error (MSE), grouping similar target values into tight, low-variance clusters.\n\n### Mathematical Formulation\nFor a node containing $N$ continuous target values $y \\in \\mathbb{R}^N$ with mean $\\bar{y} = \\frac{1}{N} \\sum y_i$:\n\n$$1. \\quad \\text{Var}(\\text{Node}) = \\frac{1}{N} \\sum_{i=1}^{N} (y_i - \\bar{y})^2 \\quad (\\text{Mean Squared Error Variance})$$\n\n$$2. \\quad \\text{Weighted Child Var} = \\frac{N_L}{N} \\text{Var}(L) + \\frac{N_R}{N} \\text{Var}(R)$$\n\n$$3. \\quad \\text{Variance Reduction} = \\text{Var}(\\text{Parent}) - \\left[ \\frac{N_L}{N} \\text{Var}(L) + \\frac{N_R}{N} \\text{Var}(R) \\right]$$\n\n### Step-by-Step Intuition\n1. **Parent Variance**: Compute mean $\\bar{y}$ and variance $\\text{Var}(\\text{Parent})$ for all targets in the node.\n2. **Partition Slicing**: Divide target values into Left child $y_L = y[0..idx]$ and Right child $y_R = y[idx+1..end]$.\n3. **Child Variances**: Compute $\\text{Var}(y_L)$ and $\\text{Var}(y_R)$ independently.\n4. **Weighted Reduction**: Subtract sample-weighted average child variance from parent variance.\n\n### Key Trade-Offs & Hardware Execution\n- **Equivalence to Sum of Squares**: Minimizing Variance is mathematically equivalent to minimizing Sum of Squared Errors (SSE): $SSE = N \\cdot \\text{Var}$.\n- **Single-Pass Running Means**: Running sums $\\sum y_i$ and $\\sum y_i^2$ allow updating variance across pre-sorted split candidates in $O(1)$ time per split.",
  constraints: [
    "1 <= N <= 1000000",
    "0 <= splitIndex < N",
    "Target values are finite floats",
  ],
  examples: [
    {
      kind: "basic",
      title: "6-Sample Regression Target Split",
      inputDisplay: "Targets = [1.0, 1.2, 1.1, 10.0, 10.2, 9.8], Split at Index 2",
      outputDisplay: "Parent Var = 19.3492, Left Var = 0.0067, Right Var = 0.0267, Reduction = 19.3325",
      input: DEFAULT_VARIANCE_REDUCTION_INPUT,
      output: "(19.3492, 0.0067, 0.0267, 19.3325)",
      explanation: "Splitting between 1.1 and 10.0 isolates low targets (~1.1) from high targets (~10.0), reducing target variance by 19.3325.",
    },
  ],
  code: VARIANCE_REDUCTION_SPLIT_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Requires a single pass over $N$ target values to compute mean and variance $O(N)$.",
    space: "Requires $O(1)$ auxiliary space.",
  },
  topicGuide: {
    overview:
      "The Variance Reduction Split Evaluator computes CART regression tree variance reduction (MSE Gain) across candidate splits.",
    sections: [
      {
        heading: "Core Concept & Regression Tree Splitting",
        body: "Regression trees predict continuous targets using node sample means. Variance Reduction = Var(Parent) - Weighted_Child_Var selects splits that maximize target homogeneity.",
      },
      {
        heading: "MSE Minimization & SSE Equivalence",
        body: "Minimizing node variance is equivalent to minimizing Sum of Squared Errors SSE = sum((y_i - mean)^2). Maximizing variance reduction yields optimal MSE loss reduction.",
      },
      {
        heading: "O(1) Running Statistics Acceleration",
        body: "By maintaining running sums S_1 = sum(y_i) and S_2 = sum(y_i^2), moving split candidates updates left and right variances in O(1) time without rescanning data.",
      },
      {
        heading: "Edge Case Analysis & Identical Targets",
        body: "If all target values in a node are identical, Var = 0.0, yielding zero variance reduction for any split attempt.",
      },
    ],
    keyTerms: [
      {
        term: "Variance Reduction",
        definition: "MSE loss reduction achieved by splitting regression targets: Var(Parent) - Weighted_Child_Var.",
      },
      {
        term: "Mean Squared Error (MSE)",
        definition: "Average squared difference between continuous target values and node sample mean.",
      },
      {
        term: "CART Regression Tree",
        definition: "Regression tree model introduced by Breiman et al. fitting continuous response surfaces.",
      },
      {
        term: "Running Statistics",
        definition: "Maintaining sum(y) and sum(y^2) to compute variance across candidate splits in O(1) time.",
      },
    ],
  },
  trivia: VARIANCE_REDUCTION_SPLIT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_VARIANCE_REDUCTION_INPUT,
  generateSteps: generateVarianceReductionSteps,
};
