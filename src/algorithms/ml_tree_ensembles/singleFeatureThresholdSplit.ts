import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface SingleFeatureThresholdSplitInput {
  featureValues: number[];
  threshold: number;
}

export const DEFAULT_SINGLE_FEATURE_SPLIT_INPUT: SingleFeatureThresholdSplitInput = {
  featureValues: [1.2, 2.5, 3.1, 4.8, 5.0],
  threshold: 3.0,
};

export const SINGLE_FEATURE_THRESHOLD_SPLIT_CODE = `def single_feature_threshold_split(feature_values: list[float], threshold: float) -> tuple[list[int], list[int]]:
    """
    Partitions dataset sample indices based on a single continuous feature threshold X[j] <= threshold.
    Returns (leftIndices, rightIndices).
    """
    left_indices = []
    right_indices = []

    for idx, val in enumerate(feature_values):
        if val <= threshold:
            left_indices.append(idx)
        else:
            right_indices.append(idx)

    return left_indices, right_indices`;

export const generateSingleFeatureSplitSteps = (
  input: SingleFeatureThresholdSplitInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { featureValues, threshold } = input;
  let stepIndex = 0;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: `Initialize Single Feature Threshold Splitter (Threshold = ${threshold})`,
      why: `Partitioning ${featureValues.length} samples into Left (x <= ${threshold}) and Right (x > ${threshold}) subsets.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((val, idx) => ({
        id: `s-${idx}`,
        value: Math.round(val * 10),
        label: `S${idx} (x=${val})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        threshold: String(threshold),
        totalSamples: String(featureValues.length),
        status: "Initialized",
      },
    },
    variables: { threshold, totalSamples: featureValues.length },
  });

  const left: number[] = [];
  const right: number[] = [];

  for (let i = 0; i < featureValues.length; i++) {
    const val = featureValues[i];
    const isLeft = val <= threshold;

    if (isLeft) left.push(i);
    else right.push(i);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Evaluate Sample S${i} (x = ${val}): ${val} <= ${threshold} -> ${isLeft ? "LEFT Child" : "RIGHT Child"}`,
        why: `Sample x value ${val} is ${isLeft ? "<=" : ">"} threshold ${threshold}. Routed to ${isLeft ? "Left" : "Right"} child.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: featureValues.map((v, idx) => ({
          id: `s-${idx}`,
          value: Math.round(v * 10),
          label: `S${idx} (x=${v})`,
          state:
            idx === i
              ? ("active" as ElementState)
              : left.includes(idx)
                ? ("sorted" as ElementState)
                : right.includes(idx)
                  ? ("visited" as ElementState)
                  : ("default" as ElementState),
          pointers: idx === i ? [isLeft ? "To Left" : "To Right"] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          sample: `S${i}`,
          val: String(val),
          route: isLeft ? "LEFT" : "RIGHT",
          leftCount: String(left.length),
          rightCount: String(right.length),
        },
      },
      variables: { i, val, isLeft },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 15,
    explanation: {
      what: `Single Feature Threshold Split Complete: Left (${left.length} samples), Right (${right.length} samples)`,
      why: `Left subset indices: [${left.join(", ")}], Right subset indices: [${right.join(", ")}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((v, idx) => ({
        id: `s-${idx}`,
        value: Math.round(v * 10),
        label: `S${idx} (${v <= threshold ? "LEFT" : "RIGHT"})`,
        state: v <= threshold ? ("sorted" as ElementState) : ("visited" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        leftIndices: `[${left.join(", ")}]`,
        rightIndices: `[${right.join(", ")}]`,
        status: "Completed",
      },
    },
    variables: { leftSize: left.length, rightSize: right.length, complete: true },
  });

  return steps;
};

export const singleFeatureThresholdSplit: AlgorithmDefinition<SingleFeatureThresholdSplitInput> = {
  id: "singleFeatureThresholdSplit",
  title: "Single Feature Threshold Split Evaluator",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Partitions a dataset sample array into Left and Right child subsets based on a single continuous feature condition X[j] <= threshold. Serves as the fundamental binary branching primitive for decision trees.\n\nInput Format:\n- featureValues: Feature array for N samples.\n- threshold: Scalar partition threshold value.\n\nOutput Format:\n- Returns tuple (leftSampleIndices, rightSampleIndices).\n\nEdge Cases & Constraints:\n- Threshold below all values: All samples route Right.\n- Threshold above all values: All samples route Left.",
  constraints: ["featureValues.length >= 1."],
  examples: [
    {
      kind: "basic",
      title: "Split 5 Samples at Threshold 3.0",
      inputDisplay: "featureValues = [1.2, 2.5, 3.1, 4.8, 5.0], threshold = 3.0",
      outputDisplay: "Left: [S0, S1], Right: [S2, S3, S4]",
      input: DEFAULT_SINGLE_FEATURE_SPLIT_INPUT,
      output: "Left: 2 samples, Right: 3 samples",
      explanation:
        "Samples <= 3.0 (1.2, 2.5) route Left; samples > 3.0 (3.1, 4.8, 5.0) route Right.",
    },
    {
      kind: "complex",
      title: "Threshold Higher Than All Values",
      inputDisplay: "threshold = 10.0",
      outputDisplay: "Left: All 5 samples, Right: 0 samples",
      input: {
        featureValues: [1.2, 2.5, 3.1, 4.8, 5.0],
        threshold: 10.0,
      },
      output: "Left: 5, Right: 0",
      explanation: "All samples satisfy x <= 10.0.",
    },
    {
      kind: "negative",
      title: "Threshold Lower Than All Values",
      inputDisplay: "threshold = 0.0",
      outputDisplay: "Left: 0 samples, Right: All 5 samples",
      input: {
        featureValues: [1.2, 2.5, 3.1, 4.8, 5.0],
        threshold: 0.0,
      },
      output: "Left: 0, Right: 5",
      explanation: "No samples satisfy x <= 0.0.",
    },
  ],
  defaultInput: DEFAULT_SINGLE_FEATURE_SPLIT_INPUT,
  code: SINGLE_FEATURE_THRESHOLD_SPLIT_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N) single-pass scan across N samples.",
    space: "O(N) auxiliary space to store left and right index arrays.",
  },
  topicGuide: {
    overview:
      "Every decision tree split node represents an axis-aligned hyperplane partition X[j] <= threshold. Feature threshold splitting is the fundamental decision logic executed at millions of decision tree nodes in Random Forests and XGBoost models.",
    sections: [
      {
        heading: "Core Concept & Axis-Aligned Hyperplanes",
        body: "A single feature threshold split divides R^D feature space into two half-spaces along the j-th coordinate axis.",
      },
      {
        heading: "Vectorized SIMD Branching",
        body: "In C++ decision tree runtimes, threshold comparisons use bit-masking `_mm256_cmp_ps` instructions to evaluate 8 feature values simultaneously.",
      },
      {
        heading: "Continuous vs Categorical Feature Splits",
        body: "Continuous features use inequality `x <= v`. Categorical features use subset membership `x in S_left`.",
      },
    ],
    keyTerms: [
      {
        term: "Threshold Split",
        definition:
          "Binary partition dividing samples based on scalar inequality X[j] <= threshold.",
      },
      {
        term: "Left Child / Right Child",
        definition: "Sub-datasets resulting from splitting a node into two child branches.",
      },
      {
        term: "Axis-Aligned Partition",
        definition: "Hyperplane boundary perpendicular to a single feature axis.",
      },
    ],
  },
  sources: [
    { type: "ml_infra", kind: "ml_infra", label: "CART Decision Trees (Breiman et al. 1984)" },
  ],
  generateSteps: generateSingleFeatureSplitSteps,
};
