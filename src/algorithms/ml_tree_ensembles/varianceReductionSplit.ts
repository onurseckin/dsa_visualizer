import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface VarianceReductionSplitInput {
  targets: number[]; // continuous regression target y_i
  splitIndex: number; // split boundary index
}

export const DEFAULT_VARIANCE_REDUCTION_INPUT: VarianceReductionSplitInput = {
  targets: [1.0, 1.2, 1.1, 10.0, 10.2, 9.8],
  splitIndex: 2, // Left = [1.0, 1.2, 1.1], Right = [10.0, 10.2, 9.8]
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
  const { targets, splitIndex } = input;
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
  const weightedChildVar = (left.length / n) * leftVar + (right.length / n) * rightVar;
  const varianceReduction = parentVar - weightedChildVar;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Initialize Variance Reduction Split Evaluator (Regression Tree)",
      why: `Evaluating continuous regression targets [${targets.join(
        ", ",
      )}] for binary split at index ${splitIndex}.`,
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
        parentVar: parentVar.toFixed(4),
        totalSamples: String(targets.length),
        splitIndex: String(splitIndex),
        status: "Initialized",
      },
    },
    variables: { parentVar: Math.round(parentVar * 10000) / 10000, totalSamples: targets.length },
  });

  // Step 1: Compute Child Variances
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Compute Left & Right Child Variances: Var(Left) = ${leftVar.toFixed(
        4,
      )}, Var(Right) = ${rightVar.toFixed(4)}`,
      why: `Left child (${left.length} samples [${left.join(",")}]), Right child (${right.length} samples [${right.join(",")}]).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: idx <= splitIndex ? ("active" as ElementState) : ("visited" as ElementState),
        pointers:
          idx === splitIndex
            ? [`Left Var ${leftVar.toFixed(2)}`]
            : idx === splitIndex + 1
              ? [`Right Var ${rightVar.toFixed(2)}`]
              : [],
      })),
    },
    auxiliaryState: {
      customState: {
        parentVar: parentVar.toFixed(4),
        leftVar: leftVar.toFixed(4),
        rightVar: rightVar.toFixed(4),
        weightedChildVar: weightedChildVar.toFixed(4),
        varianceReduction: varianceReduction.toFixed(4),
      },
    },
    variables: {
      leftVar: Math.round(leftVar * 10000) / 10000,
      rightVar: Math.round(rightVar * 10000) / 10000,
      varianceReduction: Math.round(varianceReduction * 10000) / 10000,
    },
  });

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: `Variance Reduction Split Evaluation Complete: Reduction = ${varianceReduction.toFixed(
        4,
      )}`,
      why: `Variance Reduction = ${parentVar.toFixed(4)} - ${weightedChildVar.toFixed(
        4,
      )} = ${varianceReduction.toFixed(4)}. Substantially reduced target variance!`,
    },
    primarySnapshot: {
      kind: "array",
      elements: targets.map((y, idx) => ({
        id: `y-${idx}`,
        value: Math.round(y * 10),
        label: `y=${y}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        varianceReduction: varianceReduction.toFixed(4),
        status: "Completed",
      },
    },
    variables: { varianceReduction: Math.round(varianceReduction * 10000) / 10000, complete: true },
  });

  return steps;
};

export const varianceReductionSplit: AlgorithmDefinition<VarianceReductionSplitInput> = {
  id: "varianceReductionSplit",
  title: "Variance Reduction Split Evaluator (Regression Tree)",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Computes Variance Reduction for continuous target regression tree splits (CART / DecisionTreeRegressor). Variance Reduction measures the decrease in target variance: VR = Var(Parent) - [ (N_left / N) Var(Left) + (N_right / N) Var(Right) ]. Maxizing variance reduction groups similar numerical targets into identical child nodes.\n\nInput Format:\n- targets: Continuous target vector y_i.\n- splitIndex: Split partition boundary index.\n\nOutput Format:\n- Returns tuple (parentVar, leftVar, rightVar, varianceReduction).\n\nEdge Cases & Constraints:\n- Constant target values: Zero variance (Var = 0.0).",
  constraints: ["0 <= splitIndex < targets.length - 1."],
  examples: [
    {
      kind: "basic",
      title: "Split Separating Low and High Targets",
      inputDisplay: "targets = [1.0, 1.2, 1.1, 10.0, 10.2, 9.8], splitIndex = 2",
      outputDisplay: "Parent Var: 19.34, Left Var: 0.0067, Right Var: 0.0267, VR: 19.32",
      input: DEFAULT_VARIANCE_REDUCTION_INPUT,
      output: "Variance Reduction = 19.32",
      explanation:
        "Separates low targets [1.0, 1.2, 1.1] from high targets [10.0, 10.2, 9.8], reducing variance from 19.34 down to ~0.01.",
    },
    {
      kind: "complex",
      title: "Mixed Ineffective Split",
      inputDisplay: "targets = [1.0, 10.0, 1.0, 10.0], splitIndex = 1",
      outputDisplay: "VR = 0.0000",
      input: {
        targets: [1.0, 10.0, 1.0, 10.0],
        splitIndex: 1,
      },
      output: "VR = 0.0000",
      explanation: "Split fails to reduce variance as children maintain identical distributions.",
    },
    {
      kind: "negative",
      title: "Constant Targets",
      inputDisplay: "targets = [5.0, 5.0, 5.0]",
      outputDisplay: "Parent Var = 0.0",
      input: {
        targets: [5.0, 5.0, 5.0],
        splitIndex: 0,
      },
      output: "VR = 0.0000",
      explanation: "Zero initial variance yields zero variance reduction.",
    },
  ],
  defaultInput: DEFAULT_VARIANCE_REDUCTION_INPUT,
  code: VARIANCE_REDUCTION_SPLIT_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "O(N) linear time scan across N sample targets.",
    space: "O(1) auxiliary space.",
  },
  topicGuide: {
    overview:
      "Variance Reduction is the regression equivalent of Gini Impurity reduction. Regression trees (DecisionTreeRegressor, GradientBoostingRegressor) evaluate candidate split thresholds to minimize mean squared error (MSE) or variance in child nodes.",
    sections: [
      {
        heading: "Overview & Mean Squared Error (MSE)",
        body: "Minimizing child node MSE is mathematically equivalent to maximizing Variance Reduction VR = Var(Parent) - [ (N_L/N) Var(Left) + (N_R/N) Var(Right) ].",
      },
      {
        heading: "Optimal Leaf Prediction",
        body: "For a regression leaf containing samples S_j, the optimal scalar prediction value that minimizes MSE is the sample arithmetic mean c_j = (1 / |S_j|) sum_{i in S_j} y_i.",
      },
      {
        heading: "Incremental Running Sum Computation",
        body: "By maintaining running sums sum(y) and sum(y^2), child variances Var = (sum(y^2) / n) - (sum(y) / n)^2 can be evaluated in O(1) time per split point.",
      },
      {
        heading: "Implementation Nuances & Single Sample Variance",
        body: "A leaf node with a single sample (N = 1) has zero target variance (Var = 0.0). Empty subsets must be guarded to avoid division by zero.",
      },
    ],
    keyTerms: [
      {
        term: "Variance Reduction",
        definition:
          "Metric quantifying the decrease in target label variance achieved by a decision tree split.",
      },
      {
        term: "Regression Tree",
        definition:
          "Decision tree model predicting continuous numerical values rather than discrete class labels.",
      },
      {
        term: "Mean Squared Error (MSE)",
        definition:
          "Loss metric measuring average squared difference between true targets and predicted leaf means.",
      },
      {
        term: "Running Moment Sums",
        definition:
          "Maintaining sum(y) and sum(y^2) accumulators for O(1) online sample variance update.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "CART Regression Trees (Breiman et al. 1984)" },
  ],
  generateSteps: generateVarianceReductionSteps,
};
