import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface WeightedQuantileSketchHistogramInput {
  featureValues: number[];
  weights: number[];
  eps: number;
}

export const DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT: WeightedQuantileSketchHistogramInput = {
  featureValues: [1.0, 2.5, 3.2, 4.7, 5.1, 7.8, 9.0],
  weights: [0.5, 1.0, 0.5, 2.0, 1.5, 0.5, 1.0],
  eps: 0.25,
};

export const WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_CODE = `def weighted_quantile_sketch(feature_values: list[float], weights: list[float], eps: float = 0.25) -> list[float]:
    """
    Computes candidate split thresholds using the Weighted Quantile Sketch algorithm (XGBoost, Chen & Guestrin 2016).
    Iteratively selects quantile boundaries s_j such that the cumulative weight between adjacent boundaries is bounded by eps * total_weight.
    """
    if not feature_values or not weights or len(feature_values) != len(weights):
        return []
    
    # Sort samples by feature value
    samples = sorted(zip(feature_values, weights), key=lambda x: x[0])
    total_weight = sum(w for _, w in samples)
    if total_weight <= 0:
        return []

    quantile_thresholds = [samples[0][0]]
    target_step = eps * total_weight
    accumulated_weight = 0.0
    current_target = target_step

    for val, w in samples:
        accumulated_weight += w
        if accumulated_weight >= current_target:
            quantile_thresholds.append(val)
            current_target += target_step

    if quantile_thresholds[-1] != samples[-1][0]:
        quantile_thresholds.append(samples[-1][0])

    return quantile_thresholds`;

export const generateWeightedQuantileSketchSteps = (
  input: WeightedQuantileSketchHistogramInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const featureValues = input.featureValues || DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT.featureValues;
  const weights = input.weights || DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT.weights;
  const eps = input.eps ?? 0.25;

  const samples = featureValues
    .map((val, idx) => ({ val, weight: weights[idx] ?? 1.0, originalIdx: idx }))
    .sort((a, b) => a.val - b.val);

  const totalWeight = samples.reduce((sum, s) => sum + s.weight, 0);
  const targetStep = eps * totalWeight;

  // Step 0: Initial state & setup
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize Weighted Quantile Sketch",
      why: `Sorted ${samples.length} samples by feature value. Total Hessian Weight W = ${totalWeight.toFixed(
        2,
      )}, Target Bin Step ε*W = ${targetStep.toFixed(2)} (ε = ${eps}).`,
    },
    primarySnapshot: {
      kind: "array",
      elements: samples.map((s, idx) => ({
        id: `s-${idx}`,
        value: Math.round(s.val * 10),
        label: `x=${s.val} (w=${s.weight})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        totalWeight: totalWeight.toFixed(2),
        eps: String(eps),
        targetStep: targetStep.toFixed(2),
        boundariesCount: "1",
        status: "Initialized",
      },
    },
    variables: { totalWeight, eps, targetStep, sampleCount: samples.length },
  });

  const quantileThresholds: number[] = [samples[0].val];
  let accumulatedWeight = 0.0;
  let currentTarget = targetStep;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    accumulatedWeight += s.weight;
    const isBoundary = accumulatedWeight >= currentTarget;

    if (isBoundary) {
      quantileThresholds.push(s.val);
      currentTarget += targetStep;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Process Sample ${i + 1}: x = ${s.val}, weight = ${s.weight}`,
        why: `Accumulated Weight = ${accumulatedWeight.toFixed(2)} / ${totalWeight.toFixed(
          2,
        )}. Target threshold = ${currentTarget.toFixed(2)}. ${
          isBoundary ? `Added boundary candidate s = ${s.val}` : "Below target step threshold."
        }`,
      },
      primarySnapshot: {
        kind: "array",
        elements: samples.map((elem, idx) => ({
          id: `s-${idx}`,
          value: Math.round(elem.val * 10),
          label: `x=${elem.val}`,
          state:
            idx === i
              ? ("active" as ElementState)
              : quantileThresholds.includes(elem.val)
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`Acc W = ${accumulatedWeight.toFixed(2)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          accumulatedWeight: accumulatedWeight.toFixed(2),
          currentTarget: currentTarget.toFixed(2),
          boundaries: quantileThresholds.join(", "),
        },
      },
      variables: {
        currentVal: s.val,
        accumulatedWeight,
        boundariesCount: quantileThresholds.length,
      },
    });
  }

  if (quantileThresholds[quantileThresholds.length - 1] !== samples[samples.length - 1].val) {
    quantileThresholds.push(samples[samples.length - 1].val);
  }

  // Final Step: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 25,
    explanation: {
      what: "Weighted Quantile Sketch Complete",
      why: `Identified ${quantileThresholds.length} candidate split thresholds: [${quantileThresholds.join(
        ", ",
      )}]. Guaranteeing max error bound ε = ${eps}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: samples.map((s, idx) => ({
        id: `s-${idx}`,
        value: Math.round(s.val * 10),
        label: `x=${s.val}`,
        state: quantileThresholds.includes(s.val)
          ? ("sorted" as ElementState)
          : ("compare" as ElementState),
        pointers: quantileThresholds.includes(s.val) ? ["Quantile Boundary"] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        finalQuantiles: quantileThresholds.join(", "),
        totalThresholds: String(quantileThresholds.length),
        status: "Completed",
      },
    },
    variables: { quantileThresholds: quantileThresholds.join(", "), complete: true },
  });

  return steps;
};

const WEIGHTED_QUANTILE_SKETCH_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Sort samples by feature values." }],
  lineExplanations: { 1: "Entry point for Weighted Quantile Sketch algorithm." },
};

export const weightedQuantileSketchHistogram: AlgorithmDefinition<WeightedQuantileSketchHistogramInput> =
  {
    id: "weightedQuantileSketchHistogram",
    title: "Weighted Quantile Sketch Feature Binning",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles", "tree_fundamentals"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Computes approximate candidate split thresholds for continuous feature values using the Weighted Quantile Sketch algorithm (Chen & Guestrin, XGBoost Section 3.3). When dataset instances have non-uniform sample weights (e.g., 2nd-order loss Hessians h_i), standard quantile binning fails. The Weighted Quantile Sketch guarantees that candidate split boundaries s_0, s_1, ..., s_k partition cumulative Hessian weight into balanced intervals with relative error bounded by ε.\n\nInput Format:\n- featureValues: Continuous feature values for training samples.\n- weights: Sample weight / Hessian vector h_i corresponding to featureValues.\n- eps: Approximation error parameter ε (e.g., 0.25 for ~4 quantile bins).\n\nOutput Format:\n- Returns a list of candidate split boundary thresholds s_j maintaining max weight delta ε * H_total.\n\nEdge Cases & Constraints:\n- Zero or uniform weights: Degenerates to standard unweighted rank percentile binning.\n- Equal feature values with high weight: Handled seamlessly by merging cumulative weight at distinct feature value steps.",
    constraints: [
      "featureValues and weights must have equal length N > 0.",
      "weights[i] >= 0.0.",
      "0.0 < eps <= 1.0.",
    ],
    examples: [
      {
        kind: "basic",
        title: "Weighted Quantile Binning across 7 Samples",
        inputDisplay: "7 continuous samples with Hessian weights, eps = 0.25",
        outputDisplay: "Split Thresholds: [1.0, 4.7, 7.8, 9.0]",
        input: DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT,
        output: "[1.0, 4.7, 7.8, 9.0]",
        explanation:
          "Accumulates Hessian weights across sorted samples to pick quantile boundaries with step size eps * W_total.",
      },
      {
        kind: "complex",
        title: "Fine Granularity (eps = 0.1)",
        inputDisplay: "eps = 0.1 for 10 quantile bins",
        outputDisplay: "Dense candidate split boundaries",
        input: {
          ...DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT,
          eps: 0.1,
        },
        output: "10 quantile threshold boundaries",
        explanation: "Smaller eps produces finer quantile candidate splits for split search.",
      },
      {
        kind: "negative",
        title: "Single Sample Input",
        inputDisplay: "featureValues = [5.0], weights = [1.0], eps = 0.25",
        outputDisplay: "[5.0]",
        input: {
          featureValues: [5.0],
          weights: [1.0],
          eps: 0.25,
        },
        output: "[5.0]",
        explanation: "Single sample returns that value as sole boundary candidate.",
      },
    ],
    code: WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_CODE,
    timeComplexity: {
      best: "O(N log N)",
      average: "O(N log N)",
      worst: "O(N log N)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N log N) to sort N samples by feature value, plus O(N) linear sweep to accumulate weights and sample quantile split points.",
      space: "O(N) space for sorted sample pairs and output quantile thresholds list.",
    },
    topicGuide: {
      overview:
        "In gradient boosted decision trees (XGBoost), sample weights correspond to second-order loss Hessians h_i. When loss functions exhibit non-uniform curvature, standard rank quantiles produce unbalanced split candidates. The Weighted Quantile Sketch solves this by constructing a streaming data structure with provable relative error guarantees under non-uniform weights.",
      sections: [
        {
          heading: "Overview & Mathematical Formulation",
          body: "Given a multi-set of samples D = {(x_1, h_1), (x_2, h_2), ..., (x_n, h_n)}, define rank function r_D(x) = (1 / sum h_i) * sum_{x_i < x} h_i. The algorithm finds candidate split points {s_1, s_2, ..., s_k} such that |r_D(s_j) - r_D(s_{j-1})| < eps, ensuring equal distribution of Hessian curvature across feature bins.",
        },
        {
          heading: "Core Concepts & Distributed Sketch Merging",
          body: "The Weighted Quantile Sketch uses a summary structure with merge and prune operations. When distributed across multiple GPU worker nodes, local sketches can be combined into a global sketch with zero memory overhead.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "By generating fixed quantile split candidates upfront, XGBoost replaces expensive O(N log N) exact greedy evaluation with fast O(B) histogram split search, accelerating training by up to 50x on large datasets.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Handling duplicate feature values requires aggregating weights at identical value steps before evaluating quantile step boundaries to prevent redundant split candidates.",
        },
      ],
      keyTerms: [
        {
          term: "Weighted Quantile Sketch",
          definition:
            "A data structure for computing quantile boundaries under non-uniform sample weights with relative error bounds.",
        },
        {
          term: "Hessian Weight (h_i)",
          definition:
            "Second-order derivative of the loss function measuring curvature and sample importance in GBDTs.",
        },
        {
          term: "Epsilon Approximation Bound (ε)",
          definition:
            "Maximum allowable rank error bound between adjacent candidate quantile thresholds.",
        },
        {
          term: "Distributed Sketching",
          definition:
            "Merging local quantile sketches from multi-GPU node workers into a unified global feature distribution summary.",
        },
      ],
    },
    trivia: WEIGHTED_QUANTILE_SKETCH_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "XGBoost Section 3.3 Weighted Quantile Sketch (Chen & Guestrin 2016)",
      },
    ],
    defaultInput: DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT,
    generateSteps: generateWeightedQuantileSketchSteps,
  };
