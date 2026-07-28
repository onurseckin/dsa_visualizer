import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface SingleFeatureThresholdSplitInput {
  featureValues: number[];
  threshold: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_SINGLE_FEATURE_SPLIT_INPUT: SingleFeatureThresholdSplitInput = {
  featureValues: [1.2, 1.8, 2.5, 2.9, 3.1, 3.8, 4.2, 4.8, 5.0, 5.5],
  threshold: 3.0,
  data: [1.2, 1.8, 2.5, 2.9, 3.1, 3.8, 4.2, 4.8, 5.0, 5.5],
  target: 3.0,
};

export const SINGLE_FEATURE_THRESHOLD_SPLIT_CODE = `def single_feature_threshold_split(feature_values: list[float], threshold: float) -> tuple[list[int], list[int]]:
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
  const featureValues = input.featureValues ||
    input.data || [1.2, 1.8, 2.5, 2.9, 3.1, 3.8, 4.2, 4.8, 5.0, 5.5];
  const threshold = input.threshold ?? input.target ?? 3.0;
  let stepIndex = 0;

  // Step 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: `Initialize Single Feature Threshold Splitter (Threshold t = ${threshold})`,
      why: `Partitioning ${featureValues.length} continuous feature values into Left (x <= ${threshold}) and Right (x > ${threshold}) partitions.`,
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
        "Threshold t": String(threshold),
        "Total Samples": String(featureValues.length),
        Status: "Function Entry",
      },
    },
    variables: { threshold, totalSamples: featureValues.length },
  });

  // Step 2: Allocate left_indices
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Allocate empty left_indices [] list",
      why: "Initializes sample index list for the left child node (x <= t).",
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((val, idx) => ({
        id: `s-${idx}`,
        value: Math.round(val * 10),
        label: `x=${val}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Left Partition": "[]", "Right Partition": "[]" } },
    variables: { left_indices_count: 0 },
  });

  // Step 3: Allocate right_indices
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 3,
    explanation: {
      what: "Allocate empty right_indices [] list",
      why: "Initializes sample index list for the right child node (x > t).",
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((val, idx) => ({
        id: `s-${idx}`,
        value: Math.round(val * 10),
        label: `x=${val}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Left Partition": "[]", "Right Partition": "[]" } },
    variables: { right_indices_count: 0 },
  });

  const leftIndices: number[] = [];
  const rightIndices: number[] = [];

  featureValues.forEach((val, idx) => {
    const isLeft = val <= threshold;

    // Sub-step A: Loop header
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 5,
      explanation: {
        what: `Iterate over Sample Index ${idx}: Value val = ${val}`,
        why: `Loading sample index ${idx} with continuous feature value ${val}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: featureValues.map((v, i) => {
          let state: ElementState = "default";
          if (i === idx) state = "active";
          else if (leftIndices.includes(i) || rightIndices.includes(i)) state = "visited";
          return {
            id: `s-${i}`,
            value: Math.round(v * 10),
            label: `S${i}=${v}`,
            state,
          };
        }),
      },
      auxiliaryState: {
        customState: {
          "Current Sample": `Index ${idx} (val=${val})`,
          "Left Indices": `[${leftIndices.join(", ")}]`,
          "Right Indices": `[${rightIndices.join(", ")}]`,
        },
      },
      variables: { idx, val },
    });

    // Sub-step B: Test split condition
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 6,
      explanation: {
        what: `Evaluate Condition: val (${val}) <= threshold (${threshold})`,
        why: isLeft
          ? `True (${val} <= ${threshold}) -> Routing sample index ${idx} to Left partition.`
          : `False (${val} > ${threshold}) -> Routing sample index ${idx} to Right partition.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: featureValues.map((v, i) => {
          let state: ElementState = "default";
          if (i === idx) state = "compare";
          else if (leftIndices.includes(i) || rightIndices.includes(i)) state = "visited";
          return {
            id: `s-${i}`,
            value: Math.round(v * 10),
            label: `S${i}=${v}`,
            state,
          };
        }),
      },
      auxiliaryState: {
        customState: {
          "Evaluated Condition": `${val} <= ${threshold} -> ${isLeft}`,
          "Left Count": String(leftIndices.length),
          "Right Count": String(rightIndices.length),
        },
      },
      variables: { idx, val, threshold, isLeft },
    });

    // Sub-step C: Append index
    if (isLeft) {
      leftIndices.push(idx);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 7,
        explanation: {
          what: `Append Index ${idx} to left_indices`,
          why: `Sample S${idx} (x=${val}) assigned to Left node. Left count is now ${leftIndices.length}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: featureValues.map((v, i) => {
            let state: ElementState = "default";
            if (leftIndices.includes(i)) state = "visited";
            else if (rightIndices.includes(i)) state = "sorted";
            return {
              id: `s-${i}`,
              value: Math.round(v * 10),
              label: `S${i}=${v}`,
              state,
            };
          }),
        },
        auxiliaryState: {
          customState: {
            "Left Partition": `[${leftIndices.join(", ")}]`,
            "Right Partition": `[${rightIndices.join(", ")}]`,
          },
        },
        variables: { left_indices_count: leftIndices.length },
      });
    } else {
      rightIndices.push(idx);
      steps.push({
        stepIndex: stepIndex++,
        codeLine: 9,
        explanation: {
          what: `Append Index ${idx} to right_indices`,
          why: `Sample S${idx} (x=${val}) assigned to Right node. Right count is now ${rightIndices.length}.`,
        },
        primarySnapshot: {
          kind: "array",
          elements: featureValues.map((v, i) => {
            let state: ElementState = "default";
            if (leftIndices.includes(i)) state = "visited";
            else if (rightIndices.includes(i)) state = "sorted";
            return {
              id: `s-${i}`,
              value: Math.round(v * 10),
              label: `S${i}=${v}`,
              state,
            };
          }),
        },
        auxiliaryState: {
          customState: {
            "Left Partition": `[${leftIndices.join(", ")}]`,
            "Right Partition": `[${rightIndices.join(", ")}]`,
          },
        },
        variables: { right_indices_count: rightIndices.length },
      });
    }
  });

  // Final step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: "Execution Complete: Return (left_indices, right_indices)",
      why: `Partition complete. Left child received ${leftIndices.length} samples, Right child received ${rightIndices.length} samples.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: featureValues.map((v, i) => ({
        id: `s-${i}`,
        value: Math.round(v * 10),
        label: leftIndices.includes(i) ? `L:${v}` : `R:${v}`,
        state: leftIndices.includes(i) ? ("visited" as ElementState) : ("sorted" as ElementState),
      })),
    },
    auxiliaryState: {
      customState: {
        "Left Indices": `[${leftIndices.join(", ")}] (${leftIndices.length} samples)`,
        "Right Indices": `[${rightIndices.join(", ")}] (${rightIndices.length} samples)`,
        "Partition Split Ratio": `${((leftIndices.length / featureValues.length) * 100).toFixed(1)}% / ${((rightIndices.length / featureValues.length) * 100).toFixed(1)}%`,
      },
    },
    variables: {
      left_count: leftIndices.length,
      right_count: rightIndices.length,
      completed: true,
    },
  });

  return steps;
};

const SINGLE_FEATURE_THRESHOLD_SPLIT_TRIVIA: TriviaMeta = {
  skipLines: [4, 8, 10],
  distractors: [
    "if val > threshold: left_indices.append(idx)",
    "left_indices = feature_values[:threshold]",
    "right_indices = [v for v in feature_values if v == threshold]",
    "return left_indices + right_indices",
  ],
  hints: [
    { line: 6, hint: "Test if feature value is less than or equal to continuous threshold t." },
    { line: 7, hint: "Append index to left_indices for left branch (x <= t)." },
    { line: 9, hint: "Append index to right_indices for right branch (x > t)." },
  ],
  lineExplanations: {
    1: "Defines entry point for Single Feature Threshold Splitter function.",
    2: "Initializes empty list left_indices for left child node sample indices.",
    3: "Initializes empty list right_indices for right child node sample indices.",
    4: "Blank line before sample iteration loop.",
    5: "Iterates over feature values array yielding sample index idx and scalar value val.",
    6: "Evaluates split threshold condition: is feature val <= threshold?",
    7: "Appends sample index idx to left_indices for left branch.",
    8: "Else branch executed when feature val > threshold.",
    9: "Appends sample index idx to right_indices for right branch.",
    10: "Blank line separating partition loop from return statement.",
    11: "Returns tuple of (left_indices, right_indices) sample index lists.",
  },
};

export const singleFeatureThresholdSplit: AlgorithmDefinition<SingleFeatureThresholdSplitInput> = {
  id: "single-feature-threshold-split",
  title: "Single Feature Threshold Splitter",
  topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Easy",
  description:
    "The Single Feature Threshold Splitter is the core dataset partitioning building block inside Decision Trees (CART, C4.5, ID3) and Gradient Boosted Tree Ensembles (XGBoost, LightGBM, CatBoost). Given a continuous feature column $X_j \\in \\mathbb{R}^N$ and a decision threshold $t \\in \\mathbb{R}$, this algorithm partitions sample index set $I = \\{0, 1, \\dots, N-1\\}$ into two disjoint subsets: $I_L = \\{i \\in I \\mid X_{i,j} \\le t\\}$ and $I_R = \\{i \\in I \\mid X_{i,j} > t\\}$.\n\n### Why It Exists\nDecision trees recursively partition multi-dimensional feature space using axis-aligned hyperplanes $X_j \\le t$. Threshold partitioning enables decision trees to construct non-linear decision boundaries for classification and regression tasks.\n\n### Mathematical Formulation\nGiven feature values $x \\in \\mathbb{R}^N$ and threshold $t$, the indicator functions and index partitions $I_L, I_R$ are defined as:\n\n$$I_L(t) = \\{i \\mid x_i \\le t\\}, \\quad I_R(t) = \\{i \\mid x_i > t\\}$$\n\n$$N = |I_L| + |I_R|, \\quad I_L \\cap I_R = \\emptyset, \\quad I_L \\cup I_R = I$$\n\n### Step-by-Step Intuition\n1. **List Allocation**: Allocate empty sample index lists $I_L = []$ and $I_R = []$.\n2. **Sequential Scanning**: Iterate over sample index $i = 0 \\dots N-1$ and feature scalar $x_i$.\n3. **Predicate Comparison**: Test threshold predicate $x_i \\le t$.\n4. **Index Routing**: If $x_i \\le t$, append $i$ to $I_L$; otherwise append $i$ to $I_R$.\n\n### Key Trade-Offs & Hardware Execution\n- **Contiguous Memory Packing**: In C++/CUDA tree engines, storing sample indices rather than copying full feature vectors avoids unnecessary DRAM memory duplication ($O(N)$ indices vs $O(N \\cdot D)$ features).\n- **Vectorized SIMD Predicates**: SIMD vector units (AVX-512, CUDA warps) evaluate threshold comparisons in parallel using bitmask pack instructions (`_mm512_cmp_ps_mask`).",
  constraints: ["1 <= N <= 1000000", "feature_values elements are finite floats"],
  examples: [
    {
      kind: "basic",
      title: "10-Sample Feature Split at Threshold t=3.0",
      inputDisplay:
        "featureValues = [1.2, 1.8, 2.5, 2.9, 3.1, 3.8, 4.2, 4.8, 5.0, 5.5], threshold = 3.0",
      outputDisplay: "Left: [0, 1, 2, 3] (4 samples), Right: [4, 5, 6, 7, 8, 9] (6 samples)",
      input: DEFAULT_SINGLE_FEATURE_SPLIT_INPUT,
      output: "([0, 1, 2, 3], [4, 5, 6, 7, 8, 9])",
      explanation: "Partitions 10 samples into Left (<= 3.0) and Right (> 3.0) index lists.",
    },
  ],
  code: SINGLE_FEATURE_THRESHOLD_SPLIT_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Requires a single pass over $N$ sample feature values, performing $O(N)$ threshold comparisons.",
    space: "Requires $O(N)$ memory to store left and right sample index lists.",
  },
  topicGuide: {
    overview:
      "The Single Feature Threshold Splitter partitions continuous dataset feature values into left and right child node index sets.",
    sections: [
      {
        heading: "Core Concept & Axis-Aligned Hyperplanes",
        body: "Decision trees construct decision boundaries using axis-aligned orthogonal cuts X_j <= t. Single feature threshold splitting routes samples x_i <= t to left child I_L and x_i > t to right child I_R.",
      },
      {
        heading: "Systems & Memory Alignment",
        body: "In production tree algorithms (XGBoost, LightGBM), feature values are pre-sorted or quantized into discrete histogram bins. Storing 32-bit sample indices in contiguous memory avoids copying raw feature rows.",
      },
      {
        heading: "Implementation Nuances & Floating-Point Precision",
        body: "Threshold candidates are chosen as midpoints between adjacent sorted feature values: t = (x_i + x_{i+1}) / 2. Strict inequality handling (<= vs <) must match tree inference runtime conventions.",
      },
      {
        heading: "Edge Case Analysis & Degenerate Splits",
        body: "When all sample values are <= t or all > t, one partition becomes empty (|I_L| = 0 or |I_R| = 0), representing a invalid/zero-gain split attempt.",
      },
    ],
    keyTerms: [
      {
        term: "Threshold Split",
        definition:
          "Binary partition predicate X_j <= t dividing sample indices into left and right child nodes.",
      },
      {
        term: "Axis-Aligned Hyperplane",
        definition:
          "Decision surface orthogonal to a single feature axis in multi-dimensional space.",
      },
      {
        term: "Index Routing",
        definition:
          "Storing 32-bit sample index references in child lists instead of copying full feature rows.",
      },
      {
        term: "Degenerate Split",
        definition: "An invalid split resulting in an empty child node (|I_L| = 0 or |I_R| = 0).",
      },
    ],
  },
  trivia: SINGLE_FEATURE_THRESHOLD_SPLIT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_SINGLE_FEATURE_SPLIT_INPUT,
  generateSteps: generateSingleFeatureSplitSteps,
};
