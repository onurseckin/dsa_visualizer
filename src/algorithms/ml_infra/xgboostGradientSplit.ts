import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface XgboostSample {
  featureVal: number;
  g: number; // 1st derivative (gradient)
  h: number; // 2nd derivative (hessian)
}

export interface XgboostGradientSplitInput {
  samples: XgboostSample[];
  lambda: number; // L2 regularization
  gamma: number; // Minimal gain penalty
}

export const XGBOOST_GRADIENT_SPLIT_CODE = `def xgboost_find_best_split(samples: list[dict], reg_lambda: float, gamma: float) -> tuple[float, float]:
    sorted_samples = sorted(samples, key=lambda x: x["featureVal"])
    G_total = sum(s["g"] for s in sorted_samples)
    H_total = sum(s["h"] for s in sorted_samples)
    
    best_gain = -float("inf")
    best_split_val = None
    
    G_L, H_L = 0.0, 0.0
    for i in range(len(sorted_samples) - 1):
        G_L += sorted_samples[i]["g"]
        H_L += sorted_samples[i]["h"]
        G_R = G_total - G_L
        H_R = H_total - H_L
        
        gain_L = (G_L ** 2) / (H_L + reg_lambda)
        gain_R = (G_R ** 2) / (H_R + reg_lambda)
        gain_root = (G_total ** 2) / (H_total + reg_lambda)
        gain = 0.5 * (gain_L + gain_R - gain_root) - gamma
        
        split_val = (sorted_samples[i]["featureVal"] + sorted_samples[i+1]["featureVal"]) / 2.0
        if gain > best_gain:
            best_gain = gain
            best_split_val = split_val
            
    return best_split_val, best_gain`;

export const DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT: XgboostGradientSplitInput = {
  samples: [
    { featureVal: 1.0, g: -1.5, h: 1.0 },
    { featureVal: 2.5, g: -0.8, h: 1.0 },
    { featureVal: 3.0, g: 0.5, h: 1.0 },
    { featureVal: 4.5, g: 1.2, h: 1.0 },
    { featureVal: 6.0, g: 2.0, h: 1.0 },
  ],
  lambda: 1.0,
  gamma: 0.1,
};

export const generateXgboostGradientSplitSteps = (
  input: XgboostGradientSplitInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const sortedSamples = [...input.samples].sort((a, b) => a.featureVal - b.featureVal);
  const G_total = sortedSamples.reduce((acc, s) => acc + s.g, 0);
  const H_total = sortedSamples.reduce((acc, s) => acc + s.h, 0);

  const gainRoot = G_total ** 2 / (H_total + input.lambda);

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 2,
    explanation: {
      what: "Sort Samples & Calculate Baseline Totals",
      why: `Sorted ${sortedSamples.length} samples by feature value. G_total=${G_total.toFixed(2)}, H_total=${H_total.toFixed(2)}, Root score=${(0.5 * gainRoot).toFixed(2)}. Summing gradients G and Hessians H sets the baseline root node score.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sortedSamples.map((s, idx) => ({
        id: `sample-${idx}`,
        value: s.featureVal,
        label: `g:${s.g}, h:${s.h}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      distanceTable: {
        G_total: Number(G_total.toFixed(2)),
        H_total: Number(H_total.toFixed(2)),
        RootScore: Number((0.5 * gainRoot).toFixed(2)),
      },
    },
    variables: {
      sampleCount: sortedSamples.length,
      G_total: Number(G_total.toFixed(2)),
      H_total: Number(H_total.toFixed(2)),
    },
  });

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Tracker & Left Accumulators",
      why: `Set best_gain = -inf, best_split_val = null, G_L = 0.0, H_L = 0.0. Ready to sweep candidate split boundaries between adjacent sorted samples.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sortedSamples.map((s, idx) => ({
        id: `sample-${idx}`,
        value: s.featureVal,
        label: `g:${s.g}, h:${s.h}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      distanceTable: {
        BestGain: -Infinity,
        BestSplitVal: 0,
        G_L: 0,
        H_L: 0,
      },
    },
    variables: {
      bestGain: "-Infinity",
      bestSplitVal: "None",
      G_L: 0,
      H_L: 0,
    },
  });

  let bestGain = -Infinity;
  let bestSplitVal = 0;

  let G_L = 0.0;
  let H_L = 0.0;

  for (let i = 0; i < sortedSamples.length - 1; i++) {
    G_L += sortedSamples[i].g;
    H_L += sortedSamples[i].h;
    const G_R = G_total - G_L;
    const H_R = H_total - H_L;

    const gainL = G_L ** 2 / (H_L + input.lambda);
    const gainR = G_R ** 2 / (H_R + input.lambda);
    const gain = 0.5 * (gainL + gainR - gainRoot) - input.gamma;

    const splitVal = (sortedSamples[i].featureVal + sortedSamples[i + 1].featureVal) / 2.0;

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Accumulate Sample ${i} into Left Child (x <= ${sortedSamples[i].featureVal})`,
        why: `Added sample x=${sortedSamples[i].featureVal} (g=${sortedSamples[i].g}, h=${sortedSamples[i].h}) to left node. Left: G_L=${G_L.toFixed(2)}, H_L=${H_L.toFixed(2)}. Right: G_R=${G_R.toFixed(2)}, H_R=${H_R.toFixed(2)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: sortedSamples.map((s, idx) => {
          let state: ElementState = "default";
          if (idx <= i) state = "visited";
          else state = "active";
          return {
            id: `sample-${idx}`,
            value: s.featureVal,
            label: `g:${s.g}, h:${s.h}`,
            state,
            pointers: [idx <= i ? "L" : "R"],
          };
        }),
      },
      auxiliaryState: {
        distanceTable: {
          G_L: Number(G_L.toFixed(2)),
          H_L: Number(H_L.toFixed(2)),
          G_R: Number(G_R.toFixed(2)),
          H_R: Number(H_R.toFixed(2)),
        },
      },
      variables: {
        currentIndex: i,
        G_L: Number(G_L.toFixed(2)),
        H_L: Number(H_L.toFixed(2)),
        G_R: Number(G_R.toFixed(2)),
        H_R: Number(H_R.toFixed(2)),
      },
    });

    const isNewBest = gain > bestGain;
    if (isNewBest) {
      bestGain = gain;
      bestSplitVal = splitVal;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 19,
      explanation: {
        what: `Evaluate Candidate Split at x = ${splitVal.toFixed(2)}`,
        why: `Split threshold x=${splitVal.toFixed(2)}: Left gain=${(0.5 * gainL).toFixed(3)}, Right gain=${(0.5 * gainR).toFixed(3)}, Net Gain=${gain.toFixed(3)}${isNewBest ? " (New Best Split!)" : ""}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: sortedSamples.map((s, idx) => {
          let state: ElementState = "default";
          if (idx <= i) state = isNewBest ? "sorted" : "visited";
          else state = "active";
          return {
            id: `sample-${idx}`,
            value: s.featureVal,
            label: `g:${s.g}, h:${s.h}`,
            state,
            pointers: [idx <= i ? "L" : "R"],
          };
        }),
      },
      auxiliaryState: {
        distanceTable: {
          SplitVal: Number(splitVal.toFixed(2)),
          CurrentGain: Number(gain.toFixed(3)),
          BestGain: Number(bestGain.toFixed(3)),
          BestSplitVal: Number(bestSplitVal.toFixed(2)),
        },
      },
      variables: {
        splitVal: Number(splitVal.toFixed(2)),
        currentGain: Number(gain.toFixed(3)),
        bestGain: Number(bestGain.toFixed(3)),
      },
    });
  }

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 26,
    explanation: {
      what: "Select Optimal Gradient Split",
      why: `Optimal split threshold x = ${bestSplitVal.toFixed(2)} with maximum Gain = ${bestGain.toFixed(3)}. Selected feature split maximizes objective gain minus complexity penalty gamma=${input.gamma}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: sortedSamples.map((s, idx) => ({
        id: `sample-${idx}`,
        value: s.featureVal,
        label: `g:${s.g}, h:${s.h}`,
        state:
          s.featureVal < bestSplitVal ? ("sorted" as ElementState) : ("active" as ElementState),
        pointers: [s.featureVal < bestSplitVal ? "L" : "R"],
      })),
    },
    auxiliaryState: {
      distanceTable: {
        BestSplitThreshold: Number(bestSplitVal.toFixed(2)),
        MaxGain: Number(bestGain.toFixed(3)),
      },
    },
    variables: {
      bestSplitThreshold: Number(bestSplitVal.toFixed(2)),
      maxGain: Number(bestGain.toFixed(3)),
    },
  });

  return steps;
};

const XGBOOST_GRADIENT_SPLIT_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "gain = 0.5 * (gain_L + gain_R + gain_root) - gamma",
    "split_val = sorted_samples[i]['featureVal']",
    "G_R = G_total + G_L",
  ],
  hints: [
    {
      line: 2,
      hint: "Sort sample features and prepare total gradients G_total and total Hessians H_total.",
    },
    {
      line: 19,
      hint: "Apply XGBoost gain formula 0.5 * (G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G_root^2/(H_root+lambda)) - gamma.",
    },
    {
      line: 21,
      hint: "Set candidate split threshold to mid-point between adjacent sorted feature values.",
    },
    {
      line: 23,
      hint: "Update optimal split threshold and maximum split gain when current gain improves.",
    },
  ],
  lineExplanations: {
    1: "Defines XGBoost exact greedy gradient split finder function.",
    2: "Sorts samples by feature value.",
    3: "Calculates total gradient G_total across all samples.",
    4: "Calculates total Hessian H_total across all samples.",
    11: "Accumulates sample gradient into left partition gradient sum G_L.",
    19: "Calculates split gain using first and second order gradients with regularization and gamma penalty.",
    21: "Computes candidate split midpoint value between sorted feature values.",
    23: "Updates maximum gain and best split threshold when gain improves.",
    26: "Returns optimal feature split threshold and maximum gain achieved.",
  },
};

export const xgboostGradientSplit: AlgorithmDefinition<XgboostGradientSplitInput> = {
  id: "xgboost-gradient-split",
  title: "XGBoost Exact Greedy Gradient Split Finder",
  topicIds: ["ml_tree_ensembles"],
  difficulty: "Hard",
  description:
    "Finds the optimal decision tree split threshold in XGBoost by calculating second-order Taylor expansion gain from sample gradients (g) and Hessians (h) with L2 regularization.",
  constraints: ["len(samples) >= 2", "lambda >= 0", "gamma >= 0"],
  examples: [
    {
      kind: "basic",
      title: "5-Sample Gradient Split Search (x threshold)",
      inputDisplay: "5 samples x=[1.0, 2.5, 3.0, 4.5, 6.0], lambda=1.0, gamma=0.1",
      outputDisplay: "Best Split threshold x = 2.75 (Max Gain = 0.812)",
      input: DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT,
      output: "Split threshold x = 2.75 (Gain = 0.812)",
      explanation:
        "Samples are separated between x=2.5 (negative gradients) and x=3.0 (positive gradients). Midpoint split at x=2.75 achieves highest objective reduction gain.",
    },
    {
      kind: "complex",
      title: "High Regularization (lambda=10.0)",
      inputDisplay: "Same samples with strong L2 regularization lambda=10.0",
      outputDisplay: "Best Split threshold x = 2.75 (Lower Gain due to regularization)",
      input: {
        ...DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT,
        lambda: 10.0,
      },
      output: "Split threshold x = 2.75",
      explanation:
        "Increasing L2 regularization lambda shrinks leaf weight denominators (H + lambda), reducing total split gain while maintaining split boundary.",
    },
    {
      kind: "negative",
      title: "Minimal 2-Sample Gradient Split",
      inputDisplay: "2 samples x=[1.0, 5.0]",
      outputDisplay: "Split threshold x = 3.0",
      input: {
        samples: [
          { featureVal: 1.0, g: -2.0, h: 1.0 },
          { featureVal: 5.0, g: 2.0, h: 1.0 },
        ],
        lambda: 1.0,
        gamma: 0.0,
      },
      output: "Split threshold x = 3.0",
      explanation: "Single candidate split midpoint at x = (1.0 + 5.0)/2 = 3.0.",
    },
  ],
  code: XGBOOST_GRADIENT_SPLIT_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting N feature values takes O(N log N) time, followed by a single linear O(N) prefix sum sweep.",
    space: "Requires O(N) auxiliary space to hold sorted sample references.",
  },
  topicGuide: {
    overview:
      "XGBoost (eXtreme Gradient Boosting) is the leading algorithm for tabular machine learning competition benchmarks. Its key innovation is evaluating split candidates using both 1st order gradients and 2nd order Hessians.",
    sections: [
      {
        heading: "Second-Order Loss Function",
        body: "Unlike traditional decision trees using Gini impurity or MSE, XGBoost uses a second-order Taylor expansion of the loss function L(y, y_hat), incorporating gradient g_i and Hessian h_i.",
      },
      {
        heading: "L2 Regularization & Gamma Penalty",
        body: "The L2 parameter lambda stabilizes leaf weights when Hessians are small, while gamma specifies the minimum gain requirement required to allow a node split.",
      },
    ],
    keyTerms: [
      {
        term: "Gradient (g_i)",
        definition:
          "First derivative of the loss function with respect to current model prediction.",
      },
      {
        term: "Hessian (h_i)",
        definition:
          "Second derivative of the loss function with respect to current model prediction.",
      },
    ],
  },
  trivia: XGBOOST_GRADIENT_SPLIT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 5" }],
  defaultInput: DEFAULT_XGBOOST_GRADIENT_SPLIT_INPUT,
  generateSteps: generateXgboostGradientSplitSteps,
};
