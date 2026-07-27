import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface WeightedQuantileSketchHistogramInput {
  featureValues: number[];
  weights: number[];
  eps: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT: WeightedQuantileSketchHistogramInput = {
  featureValues: [1.0, 2.5, 3.2, 4.7, 5.1, 7.8, 9.0],
  weights: [0.5, 1.0, 0.5, 2.0, 1.5, 0.5, 1.0],
  eps: 0.25,
  data: [1.0, 2.5, 3.2, 4.7, 5.1, 7.8, 9.0],
  target: 0,
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
  const featureValues = input.featureValues || DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT.featureValues;
  const weights = input.weights || DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT.weights;
  const eps = input.eps ?? 0.25;
  let stepIndex = 0;

  const samples = featureValues
    .map((val, idx) => ({ val, weight: weights[idx] ?? 1.0, originalIdx: idx }))
    .sort((a, b) => a.val - b.val);

  const totalWeight = samples.reduce((sum, s) => sum + s.weight, 0);
  const targetStep = eps * totalWeight;

  const getSnapshot = (
    currentIdx: number = -1,
    thresholds: number[] = [],
  ) => {
    return {
      kind: "array" as const,
      elements: samples.map((s, idx) => {
        let state: ElementState = "default";
        if (idx === currentIdx) state = "active";
        else if (thresholds.includes(s.val)) state = "sorted";

        return {
          id: `s-${idx}`,
          value: Math.round(s.val * 10),
          label: `x=${s.val} (w=${s.weight})`,
          state,
          pointers: idx === currentIdx ? ["Current"] : [],
        };
      }),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentIdx: number = -1,
    thresholds: number[] = [],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentIdx, thresholds),
      auxiliaryState: {
        customState: {
          "Algorithm": "Weighted Quantile Sketch (XGBoost)",
          "Total Weight W": totalWeight.toFixed(2),
          "eps Target Step": targetStep.toFixed(2),
          "Quantile Thresholds": `[${thresholds.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Weighted Quantile Sketch Entry",
    `Started Weighted Quantile Sketch on ${samples.length} samples with eps = ${eps}.`,
    { n: samples.length, eps },
  );

  // Step 2: Validate inputs (6)
  addStep(
    6,
    "Validate Feature & Weight Input Lists",
    `Validated feature_values and weights are non-empty and equal length (${samples.length} elements).`,
    { isValid: true },
  );

  // Step 3: Sort samples (10)
  addStep(
    10,
    "Sort Samples by Feature Value x",
    `Sorted ${samples.length} samples: [${samples.map((s) => s.val).join(", ")}].`,
    { sorted: true },
  );

  // Step 4: Compute total_weight (11)
  addStep(
    11,
    `Calculate Total Hessian Weight: total_weight = ${totalWeight.toFixed(2)}`,
    `Evaluated total weight sum W = ${totalWeight.toFixed(2)}.`,
    { total_weight: totalWeight },
  );

  // Step 5: Validate total_weight > 0 (12)
  addStep(
    12,
    "Check total_weight > 0",
    `Verified total weight ${totalWeight.toFixed(2)} > 0.`,
    { positiveWeight: true },
  );

  // Step 6: Init quantile_thresholds (15)
  const quantileThresholds: number[] = [samples[0].val];
  addStep(
    15,
    `Initialize Quantile Thresholds List with First Element x = ${samples[0].val}`,
    `Initial boundary set to first sorted feature value: ${samples[0].val}.`,
    { quantile_thresholds: `[${quantileThresholds.join(", ")}]` },
    0,
    quantileThresholds,
  );

  // Step 7: Calculate target_step (16)
  addStep(
    16,
    `Calculate Quantile Target Step: target_step = ${targetStep.toFixed(2)}`,
    `Evaluated target_step = eps * total_weight = ${eps} * ${totalWeight.toFixed(2)} = ${targetStep.toFixed(2)}.`,
    { target_step: targetStep },
  );

  // Step 8: Init accumulated_weight (17)
  let accumulatedWeight = 0.0;
  addStep(
    17,
    "Initialize accumulated_weight = 0.0",
    "Set accumulated_weight accumulator to 0.0.",
    { accumulated_weight: 0.0 },
  );

  // Step 9: Init current_target (18)
  let currentTarget = targetStep;
  addStep(
    18,
    `Initialize current_target = ${currentTarget.toFixed(2)}`,
    `Set next target weight threshold to ${currentTarget.toFixed(2)}.`,
    { current_target: currentTarget },
  );

  // Loop over samples (20..24)
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];

    addStep(
      20,
      `Sample ${i + 1}/${samples.length}: Feature x = ${s.val}, Weight w = ${s.weight}`,
      `Scanning sample ${i}: x=${s.val}, weight w=${s.weight}.`,
      { i, val: s.val, weight: s.weight },
      i,
      quantileThresholds,
    );

    accumulatedWeight += s.weight;
    addStep(
      21,
      `Accumulate Weight: accumulated_weight += ${s.weight} -> ${accumulatedWeight.toFixed(2)}`,
      `Updated accumulated weight sum: ${accumulatedWeight.toFixed(2)}. Target threshold: ${currentTarget.toFixed(2)}.`,
      { accumulated_weight: accumulatedWeight },
      i,
      quantileThresholds,
    );

    const hitTarget = accumulatedWeight >= currentTarget;
    addStep(
      22,
      `Check Quantile Target Condition: ${accumulatedWeight.toFixed(2)} >= ${currentTarget.toFixed(2)}`,
      hitTarget
        ? `True (${accumulatedWeight.toFixed(2)} >= ${currentTarget.toFixed(2)}) -> Quantile boundary candidate found!`
        : `False (${accumulatedWeight.toFixed(2)} < ${currentTarget.toFixed(2)}) -> Continue weight accumulation.`,
      { hitTarget },
      i,
      quantileThresholds,
    );

    if (hitTarget) {
      if (!quantileThresholds.includes(s.val)) {
        quantileThresholds.push(s.val);
      }
      addStep(
        23,
        `Append Quantile Threshold x = ${s.val}`,
        `Recorded quantile threshold boundary x = ${s.val}. Thresholds: [${quantileThresholds.join(", ")}].`,
        { threshold: s.val, quantile_thresholds: `[${quantileThresholds.join(", ")}]` },
        i,
        quantileThresholds,
      );

      currentTarget += targetStep;
      addStep(
        24,
        `Advance Target Weight: current_target += ${targetStep.toFixed(2)} -> ${currentTarget.toFixed(2)}`,
        `Advanced next target weight boundary to ${currentTarget.toFixed(2)}.`,
        { current_target: currentTarget },
        i,
        quantileThresholds,
      );
    }
  }

  // Ensure last element (26..27)
  const lastVal = samples[samples.length - 1].val;
  if (quantileThresholds[quantileThresholds.length - 1] !== lastVal) {
    quantileThresholds.push(lastVal);
    addStep(
      27,
      `Append Max Boundary x = ${lastVal}`,
      `Appended maximum feature value boundary ${lastVal} to ensure full range coverage.`,
      { lastVal },
      samples.length - 1,
      quantileThresholds,
    );
  }

  // Return step (29)
  addStep(
    29,
    "Execution Complete: Return Quantile Thresholds List",
    `Successfully constructed Weighted Quantile Sketch containing ${quantileThresholds.length} candidate split boundaries.`,
    { thresholdsCount: quantileThresholds.length, completed: true },
    -1,
    quantileThresholds,
  );

  return steps;
};

const WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 7, 8, 9, 13, 14, 19, 25, 28],
  distractors: [
    "target_step = total_weight / eps",
    "quantile_thresholds = samples[:eps]",
    "accumulated_weight *= w",
    "return sorted(quantile_thresholds)",
  ],
  hints: [
    { line: 16, hint: "Target weight step formula for quantile bins: target_step = eps * total_weight." },
    { line: 22, hint: "Append feature value to quantile_thresholds when accumulated_weight >= current_target." },
  ],
  lineExplanations: {
    1: "Defines entry point for weighted_quantile_sketch function implementing XGBoost Algorithm 3.",
    2: "Docstring opening delimiter tag.",
    3: "Describes candidate split threshold selection using Weighted Quantile Sketch algorithm (XGBoost, Chen & Guestrin 2016).",
    4: "Docstring detailing iterative selection of quantile boundaries s_j such that cumulative weight between adjacent boundaries is bounded by eps * total_weight.",
    5: "Docstring closing delimiter tag.",
    6: "Validates input lists feature_values and weights are non-empty and of matching length.",
    7: "Returns empty list if input validation fails.",
    8: "Blank line before sorting samples.",
    9: "Comment for sorting samples by feature value x.",
    10: "Sorts samples in ascending feature order as (feature_value, weight) tuples.",
    11: "Sums total hessian weight total_weight = sum(w for _, w in samples).",
    12: "Checks if total_weight <= 0.",
    13: "Returns empty list if total_weight is non-positive.",
    14: "Blank line before quantile accumulators initialization.",
    15: "Initializes quantile_thresholds list with first sorted feature value samples[0][0].",
    16: "Calculates target weight step target_step = eps * total_weight.",
    17: "Initializes accumulated_weight accumulator to 0.0.",
    18: "Initializes current_target to target_step.",
    19: "Blank line before weight accumulation loop.",
    20: "Iterates over sample feature value val and weight w in samples.",
    21: "Accumulates weight w into accumulated_weight: accumulated_weight += w.",
    22: "Checks if accumulated_weight >= current_target quantile threshold.",
    23: "Appends current feature value val to quantile_thresholds list.",
    24: "Advances current_target to next weight step: current_target += target_step.",
    25: "Blank line before maximum boundary check.",
    26: "Checks if last quantile threshold equals maximum feature value samples[-1][0].",
    27: "Appends maximum feature value to quantile_thresholds list to cover full data range.",
    28: "Blank line separating boundary check from return statement.",
    29: "Returns completed list of quantile_thresholds candidate split boundaries.",
  },
};

export const weightedQuantileSketchHistogram: AlgorithmDefinition<WeightedQuantileSketchHistogramInput> = {
  id: "weightedQuantileSketchHistogram",
  title: "Weighted Quantile Sketch Histogram Engine",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Weighted Quantile Sketch Histogram Engine implements **XGBoost Algorithm 3** (Chen & Guestrin 2016) for finding candidate split thresholds on large-scale datasets. When dataset samples carry varying hessian weights $h_i$ (representing 2nd-order loss curvature), standard uniform percentile binning fails. The Weighted Quantile Sketch constructs quantile boundaries $s_1, s_2, \\dots, s_k$ such that the total hessian weight between any two adjacent boundaries is bounded by $\\epsilon \\cdot W_{total}$.\n\n### Why It Exists\nIn GBDTs optimizing non-quadratic losses (such as Logistic Loss or Cox Survival Loss), samples have non-uniform hessian weights $h_i = p_i(1-p_i)$. Regions with high hessian weight contain critical decision boundary information and require finer bin resolution. Weighted Quantile Sketch dynamically allocates dense quantile bins in high-curvature regions.\n\n### Mathematical Formulation\nGiven a multi-set of samples $D_j = \\{(x_{1,j}, h_1), (x_{2,j}, h_2), \\dots, (x_{N,j}, h_N)\\}$ sorted by feature $x_{i,j}$ and rank function $r_j(x) = \\sum_{(x_{i,j} < x)} h_i$:\n\n$$1. \\quad W_{total} = \\sum_{i=1}^{N} h_i \\quad (\\text{Total Hessian Weight})$$\n\n$$2. \\quad \\left| r_j(s_{k+1}) - r_j(s_k) \\right| < \\epsilon \\cdot W_{total} \\quad (\\text{Quantile Approximation Property})$$\n\n$$3. \\quad K \\approx \\frac{1}{\\epsilon} \\quad (\\text{Number of Candidate Split Boundaries})$$\n\n### Step-by-Step Intuition\n1. **Weight Pre-Summation**: Sort samples by feature $x$ and compute total hessian weight $W = \\sum h_i$.\n2. **Target Bin Step**: Define quantile weight step $\\delta = \\epsilon \\cdot W$.\n3. **Accumulated Rank Scanning**: Scan sorted samples, accumulating weight $W_{acc} += h_i$.\n4. **Threshold Selection**: Whenever $W_{acc} \\ge k \\cdot \\delta$, record feature value $x_i$ as candidate split boundary $s_k$.\n5. **Range Covering**: Ensure minimum $s_1 = \\min(x)$ and maximum $s_K = \\max(x)$ boundaries are included.\n\n### Key Trade-Offs & Hardware Execution\n- **Merge & Prune Operations**: Distributed XGBoost merges quantile sketches across GPU worker nodes using $O(\\frac{1}{\\epsilon} \\log(\\epsilon N))$ merge-prune algorithms.\n- **Theoretical Guarantee**: Guarantees that no candidate split evaluation misses the optimal split gain by more than $\\epsilon$.",
  constraints: [
    "1 <= N <= 10000000",
    "0.01 <= eps <= 0.5",
    "weights elements are positive floats h_i > 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "7-Sample Weighted Quantile Sketch (eps = 0.25)",
      inputDisplay: "7 samples with non-uniform weights, eps = 0.25",
      outputDisplay: "Quantile Thresholds: [1.0, 4.7, 7.8, 9.0]",
      input: DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT,
      output: "[1.0, 4.7, 7.8, 9.0]",
      explanation: "Divides total hessian weight W = 7.0 into target steps eps*W = 1.75, selecting 4 quantile boundaries.",
    },
  ],
  code: WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_CODE,
  timeComplexity: {
    best: "O(N \\log N)",
    average: "O(N \\log N)",
    worst: "O(N \\log N)",
  },
  spaceComplexity: "O(1 / \\epsilon)",
  complexityAnalysis: {
    time: "Sorting $N$ samples takes $O(N \\log N)$ time; linear rank accumulation takes $O(N)$ operations.",
    space: "Requires $O(1 / \\epsilon)$ memory to store candidate quantile threshold boundaries.",
  },
  topicGuide: {
    overview:
      "The Weighted Quantile Sketch Histogram Engine constructs candidate split thresholds bounded by eps * total_weight in XGBoost.",
    sections: [
      {
        heading: "Core Concept & XGBoost Algorithm 3",
        body: "Weighted Quantile Sketch (Chen & Guestrin 2016) finds candidate split thresholds s_k such that total hessian weight between adjacent boundaries is bounded by eps * W_total.",
      },
      {
        heading: "Handling Non-Uniform Hessian Weights",
        body: "In GBDTs, sample hessians h_i act as weights. Regions with large hessian curvature receive denser quantile bins, ensuring fine split resolution where loss is steepest.",
      },
      {
        heading: "Distributed & GPU Sketch Merging",
        body: "Quantile sketches can be computed independently on local GPU blocks and merged across distributed worker nodes in O(1/eps * log(eps N)) time.",
      },
      {
        heading: "Theoretical Approximation Guarantee",
        body: "The quantile property guarantees that evaluating splits only at sketch thresholds misses the optimal split gain by at most eps.",
      },
    ],
    keyTerms: [
      {
        term: "Weighted Quantile Sketch",
        definition: "XGBoost Algorithm 3 selecting split thresholds bounded by eps * total_weight.",
      },
      {
        term: "Hessian Weight (h_i)",
        definition: "Sample weight representing 2nd-order loss curvature in gradient boosting.",
      },
      {
        term: "Approximation Factor (eps)",
        definition: "Quantile error bound eps controlling candidate bin density (K approx 1/eps).",
      },
      {
        term: "Rank Function r(x)",
        definition: "Cumulative hessian weight sum of all samples with feature value less than x.",
      },
    ],
  },
  trivia: WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT,
  generateSteps: generateWeightedQuantileSketchSteps,
};
