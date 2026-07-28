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
    if not feature_values or not weights or len(feature_values) != len(weights):
        return []

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

  // Step 1: Function entry (Line 1)
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Weighted Quantile Sketch Entry",
      why: `Started Weighted Quantile Sketch on ${featureValues?.length ?? 0} samples with eps = ${eps}.`,
    },
    primarySnapshot: {
      kind: "array" as const,
      elements: (featureValues || []).map((val, idx) => ({
        id: `s-${idx}`,
        value: val,
        label: `x=${val} (w=${weights[idx] ?? 1.0})`,
        state: "default" as ElementState,
        pointers: [],
      })),
    },
    auxiliaryState: {
      customState: {
        Algorithm: "Weighted Quantile Sketch (XGBoost)",
        "eps Target Step": "Calculating...",
        "Quantile Thresholds": "[]",
      },
    },
    variables: { n: featureValues?.length ?? 0, eps },
  });

  // Step 2: Validate inputs (Line 2)
  const isValid =
    Boolean(featureValues) &&
    Boolean(weights) &&
    featureValues.length > 0 &&
    weights.length > 0 &&
    featureValues.length === weights.length;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Validate Feature & Weight Input Lists",
      why: isValid
        ? `Validated feature_values and weights are non-empty and equal length (${featureValues.length} elements).`
        : "Input validation failed: feature_values and weights are empty or length mismatch.",
    },
    primarySnapshot: {
      kind: "array" as const,
      elements: (featureValues || []).map((val, idx) => ({
        id: `s-${idx}`,
        value: val,
        label: `x=${val} (w=${weights[idx] ?? 1.0})`,
        state: (isValid ? "default" : "error") as ElementState,
        pointers: [],
      })),
    },
    auxiliaryState: {
      customState: {
        Algorithm: "Weighted Quantile Sketch (XGBoost)",
        "Input Status": isValid ? "Valid" : "Invalid",
      },
    },
    variables: { isValid },
  });

  if (!isValid) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 3,
      explanation: {
        what: "Return Empty List",
        why: "Returned empty thresholds list due to invalid inputs.",
      },
      primarySnapshot: { kind: "array" as const, elements: [] },
      auxiliaryState: { customState: { Algorithm: "Weighted Quantile Sketch (XGBoost)" } },
      variables: { return: [] },
    });
    return steps;
  }

  // Step 3: Sort samples (Line 5)
  const samples = featureValues
    .map((val, idx) => ({ val, weight: weights[idx] ?? 1.0, originalIdx: idx }))
    .sort((a, b) => a.val - b.val);

  const getSnapshot = (currentIdx: number = -1, thresholds: number[] = []) => {
    return {
      kind: "array" as const,
      elements: samples.map((s, idx) => {
        let state: ElementState = "default";
        if (idx === currentIdx) state = "active";
        else if (thresholds.includes(s.val)) state = "sorted";

        return {
          id: `s-${idx}`,
          value: s.val,
          label: `x=${s.val} (w=${s.weight})`,
          state,
          pointers: idx === currentIdx ? ["Current"] : [],
        };
      }),
    };
  };

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 5,
    explanation: {
      what: "Sort Samples by Feature Value x",
      why: `Sorted ${samples.length} samples in ascending feature order: [${samples.map((s) => s.val).join(", ")}].`,
    },
    primarySnapshot: getSnapshot(),
    auxiliaryState: {
      customState: {
        Algorithm: "Weighted Quantile Sketch (XGBoost)",
        "Sorted Samples": `[${samples.map((s) => s.val).join(", ")}]`,
      },
    },
    variables: { sorted: true },
  });

  // Step 4: Compute total_weight (Line 6)
  const totalWeight = samples.reduce((sum, s) => sum + s.weight, 0);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: `Calculate Total Hessian Weight: total_weight = ${totalWeight.toFixed(2)}`,
      why: `Evaluated total weight sum W = sum(w) = ${totalWeight.toFixed(2)}.`,
    },
    primarySnapshot: getSnapshot(),
    auxiliaryState: {
      customState: {
        Algorithm: "Weighted Quantile Sketch (XGBoost)",
        "Total Weight W": totalWeight.toFixed(2),
      },
    },
    variables: { total_weight: totalWeight },
  });

  // Step 5: Validate total_weight > 0 (Line 7)
  const positiveWeight = totalWeight > 0;
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Check total_weight > 0",
      why: positiveWeight
        ? `Verified total weight sum ${totalWeight.toFixed(2)} > 0.`
        : `Total weight sum ${totalWeight.toFixed(2)} <= 0; invalid weights.`,
    },
    primarySnapshot: getSnapshot(),
    auxiliaryState: {
      customState: {
        Algorithm: "Weighted Quantile Sketch (XGBoost)",
        "Total Weight W": totalWeight.toFixed(2),
        "Weight Status": positiveWeight ? "Valid (>0)" : "Invalid (<=0)",
      },
    },
    variables: { positiveWeight },
  });

  if (!positiveWeight) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: "Return Empty List",
        why: "Returned empty list because total weight sum is non-positive.",
      },
      primarySnapshot: getSnapshot(),
      auxiliaryState: { customState: { Algorithm: "Weighted Quantile Sketch (XGBoost)" } },
      variables: { return: [] },
    });
    return steps;
  }

  // Step 6: Init quantile_thresholds (Line 10)
  const quantileThresholds: number[] = [samples[0].val];
  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentIdx, quantileThresholds),
      auxiliaryState: {
        customState: {
          Algorithm: "Weighted Quantile Sketch (XGBoost)",
          "Total Weight W": totalWeight.toFixed(2),
          "eps Target Step": (eps * totalWeight).toFixed(2),
          "Quantile Thresholds": `[${quantileThresholds.join(", ")}]`,
        },
      },
      variables,
    });
  };

  addStep(
    10,
    `Initialize Quantile Thresholds with First Sample x = ${samples[0].val}`,
    `Set initial quantile boundary to first sorted feature value: ${samples[0].val}.`,
    { quantile_thresholds: `[${quantileThresholds.join(", ")}]` },
    0,
  );

  // Step 7: Calculate target_step (Line 11)
  const targetStep = eps * totalWeight;
  addStep(
    11,
    `Calculate Target Step: target_step = ${targetStep.toFixed(2)}`,
    `Evaluated target_step = eps * total_weight = ${eps} * ${totalWeight.toFixed(2)} = ${targetStep.toFixed(2)}.`,
    { target_step: targetStep },
  );

  // Step 8: Init accumulated_weight (Line 12)
  let accumulatedWeight = 0.0;
  addStep(12, "Initialize accumulated_weight = 0.0", "Set accumulated weight accumulator to 0.0.", {
    accumulated_weight: 0.0,
  });

  // Step 9: Init current_target (Line 13)
  let currentTarget = targetStep;
  addStep(
    13,
    `Initialize current_target = ${currentTarget.toFixed(2)}`,
    `Set next target weight threshold to ${currentTarget.toFixed(2)}.`,
    { current_target: currentTarget },
  );

  // Loop over samples (Lines 15..19)
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];

    addStep(
      15,
      `Sample ${i + 1}/${samples.length}: Feature x = ${s.val}, Weight w = ${s.weight}`,
      `Scanning sample at index ${i}: x=${s.val}, weight w=${s.weight}.`,
      { i, val: s.val, weight: s.weight },
      i,
    );

    accumulatedWeight += s.weight;
    addStep(
      16,
      `Accumulate Weight: accumulated_weight += ${s.weight} -> ${accumulatedWeight.toFixed(2)}`,
      `Updated accumulated weight sum to ${accumulatedWeight.toFixed(2)}. Current target threshold is ${currentTarget.toFixed(2)}.`,
      { accumulated_weight: accumulatedWeight },
      i,
    );

    const hitTarget = accumulatedWeight >= currentTarget;
    addStep(
      17,
      `Check Target Condition: ${accumulatedWeight.toFixed(2)} >= ${currentTarget.toFixed(2)}`,
      hitTarget
        ? `True (${accumulatedWeight.toFixed(2)} >= ${currentTarget.toFixed(2)}) -> Reached weight threshold! Record quantile boundary.`
        : `False (${accumulatedWeight.toFixed(2)} < ${currentTarget.toFixed(2)}) -> Continue weight accumulation.`,
      { hitTarget },
      i,
    );

    if (hitTarget) {
      if (!quantileThresholds.includes(s.val)) {
        quantileThresholds.push(s.val);
      }
      addStep(
        18,
        `Append Quantile Threshold x = ${s.val}`,
        `Recorded quantile threshold boundary x = ${s.val}. Current thresholds: [${quantileThresholds.join(", ")}].`,
        { threshold: s.val, quantile_thresholds: `[${quantileThresholds.join(", ")}]` },
        i,
      );

      currentTarget += targetStep;
      addStep(
        19,
        `Advance Target Weight: current_target += ${targetStep.toFixed(2)} -> ${currentTarget.toFixed(2)}`,
        `Advanced next target weight boundary to ${currentTarget.toFixed(2)}.`,
        { current_target: currentTarget },
        i,
      );
    }
  }

  // Ensure last element (Lines 21..22)
  const lastVal = samples[samples.length - 1].val;
  const isLastMissing = quantileThresholds[quantileThresholds.length - 1] !== lastVal;
  addStep(
    21,
    `Check Maximum Boundary Coverage: ${quantileThresholds[quantileThresholds.length - 1]} != ${lastVal}`,
    isLastMissing
      ? `Last quantile boundary ${quantileThresholds[quantileThresholds.length - 1]} does not equal maximum feature value ${lastVal}. Must append max value.`
      : `Last quantile boundary already equals maximum feature value ${lastVal}.`,
    { isLastMissing, lastVal },
    samples.length - 1,
  );

  if (isLastMissing) {
    quantileThresholds.push(lastVal);
    addStep(
      22,
      `Append Max Boundary x = ${lastVal}`,
      `Appended maximum feature value boundary ${lastVal} to ensure full range coverage.`,
      { lastVal },
      samples.length - 1,
    );
  }

  // Return step (Line 24)
  addStep(
    24,
    "Execution Complete: Return Quantile Thresholds List",
    `Successfully constructed Weighted Quantile Sketch containing ${quantileThresholds.length} candidate split boundaries: [${quantileThresholds.join(", ")}].`,
    { thresholdsCount: quantileThresholds.length, completed: true },
    -1,
  );

  return steps;
};

const WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_TRIVIA: TriviaMeta = {
  skipLines: [3, 4, 8, 9, 14, 20, 23],
  distractors: [
    "target_step = total_weight / eps",
    "quantile_thresholds = samples[:eps]",
    "accumulated_weight *= w",
    "return sorted(quantile_thresholds)",
  ],
  hints: [
    {
      line: 11,
      hint: "Target weight step formula for quantile bins: target_step = eps * total_weight.",
    },
    {
      line: 17,
      hint: "Append feature value to quantile_thresholds when accumulated_weight >= current_target.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for weighted_quantile_sketch function implementing XGBoost Algorithm 3.",
    2: "Validates input lists feature_values and weights are non-empty and of matching length.",
    3: "Returns empty list if input validation fails.",
    4: "Blank line separating input validation from sample sorting.",
    5: "Sorts samples in ascending feature order as (feature_value, weight) tuples.",
    6: "Sums total hessian weight total_weight = sum(w for _, w in samples).",
    7: "Checks if total_weight <= 0.",
    8: "Returns empty list if total_weight is non-positive.",
    9: "Blank line before quantile accumulators initialization.",
    10: "Initializes quantile_thresholds list with first sorted feature value samples[0][0].",
    11: "Calculates target weight step target_step = eps * total_weight.",
    12: "Initializes accumulated_weight accumulator to 0.0.",
    13: "Initializes current_target to target_step.",
    14: "Blank line before weight accumulation loop.",
    15: "Iterates over sample feature value val and weight w in samples.",
    16: "Accumulates weight w into accumulated_weight: accumulated_weight += w.",
    17: "Checks if accumulated_weight >= current_target quantile threshold.",
    18: "Appends current feature value val to quantile_thresholds list.",
    19: "Advances current_target to next weight step: current_target += target_step.",
    20: "Blank line before maximum boundary check.",
    21: "Checks if last quantile threshold equals maximum feature value samples[-1][0].",
    22: "Appends maximum feature value to quantile_thresholds list to cover full data range.",
    23: "Blank line separating boundary check from return statement.",
    24: "Returns completed list of quantile_thresholds candidate split boundaries.",
  },
};

export const weightedQuantileSketchHistogram: AlgorithmDefinition<WeightedQuantileSketchHistogramInput> =
  {
    id: "weighted-quantile-sketch-histogram",
    title: "Weighted Quantile Sketch Histogram Engine",
    topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Hard",
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
        explanation:
          "Divides total hessian weight W = 7.0 into target steps eps*W = 1.75, selecting 4 quantile boundaries.",
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
          definition:
            "XGBoost Algorithm 3 selecting split thresholds bounded by eps * total_weight.",
        },
        {
          term: "Hessian Weight (h_i)",
          definition: "Sample weight representing 2nd-order loss curvature in gradient boosting.",
        },
        {
          term: "Approximation Factor (eps)",
          definition:
            "Quantile error bound eps controlling candidate bin density (K approx 1/eps).",
        },
        {
          term: "Rank Function r(x)",
          definition:
            "Cumulative hessian weight sum of all samples with feature value less than x.",
        },
      ],
    },
    trivia: WEIGHTED_QUANTILE_SKETCH_HISTOGRAM_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_WEIGHTED_QUANTILE_SKETCH_INPUT,
    generateSteps: generateWeightedQuantileSketchSteps,
  };
