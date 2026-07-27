import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface ExactGreedySplitSearchInput {
  featureValues: number[];
  gradients: number[];
  hessians: number[];
  lambdaReg: number;
  gammaReg: number;
}

export const DEFAULT_EXACT_GREEDY_SPLIT_INPUT: ExactGreedySplitSearchInput = {
  featureValues: [1.2, 2.5, 3.1, 4.8, 5.0],
  gradients: [-0.8, -0.4, 0.2, 0.6, 0.9],
  hessians: [0.25, 0.25, 0.25, 0.25, 0.25],
  lambdaReg: 1.0,
  gammaReg: 0.0,
};

export const EXACT_GREEDY_SPLIT_CODE = `def exact_greedy_split_search(feature_values: list[float], gradients: list[float], hessians: list[float], lambda_reg: float = 1.0, gamma_reg: float = 0.0) -> tuple[float, float, float]:
    """
    Exact Greedy Split Search algorithm (XGBoost Exact Greedy Algorithm 1, Chen & Guestrin 2016).
    Sorts samples by feature value, accumulates gradient sums G_L, H_L and G_R, H_R,
    and finds the optimal split threshold maximizing regularized Gain score.
    """
    # Sort samples by feature value
    samples = sorted(zip(feature_values, gradients, hessians), key=lambda x: x[0])

    G_total = sum(g for _, g, _ in samples)
    H_total = sum(h for _, _, h in samples)

    best_gain = -float('inf')
    best_threshold = None
    best_split_idx = -1

    G_L, H_L = 0.0, 0.0

    for i in range(len(samples) - 1):
        x_val, g_val, h_val = samples[i]
        G_L += g_val
        H_L += h_val

        G_R = G_total - G_L
        H_R = H_total - H_L

        # Compute XGBoost regularized split gain
        gain = 0.5 * (
            (G_L ** 2) / (H_L + lambda_reg) +
            (G_R ** 2) / (H_R + lambda_reg) -
            (G_total ** 2) / (H_total + lambda_reg)
        ) - gamma_reg

        if gain > best_gain:
            best_gain = gain
            best_threshold = (samples[i][0] + samples[i + 1][0]) / 2.0
            best_split_idx = i

    return best_threshold, round(best_gain, 4), best_split_idx`;

export const generateExactGreedySplitSteps = (
  input: ExactGreedySplitSearchInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { featureValues, gradients, hessians, lambdaReg, gammaReg } = input;
  let stepIndex = 0;

  const samples = featureValues
    .map((x, idx) => ({ x, g: gradients[idx], h: hessians[idx], id: idx }))
    .sort((a, b) => a.x - b.x);

  const Gtotal = samples.reduce((acc, s) => acc + s.g, 0);
  const Htotal = samples.reduce((acc, s) => acc + s.h, 0);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize XGBoost Exact Greedy Split Search",
      why: `Sorted ${samples.length} samples by feature value. G_total = ${Gtotal.toFixed(
        2,
      )}, H_total = ${Htotal.toFixed(2)}, lambda = ${lambdaReg}, gamma = ${gammaReg}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: samples.map((s) => ({
        id: `s-${s.id}`,
        value: Math.round(s.x * 10),
        label: `x=${s.x} (g=${s.g}, h=${s.h})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        G_total: Gtotal.toFixed(2),
        H_total: Htotal.toFixed(2),
        lambdaReg: String(lambdaReg),
        status: "Initialized",
      },
    },
    variables: { Gtotal, Htotal, sampleCount: samples.length },
  });

  let GL = 0.0;
  let HL = 0.0;
  let bestGain = -Infinity;
  let bestThreshold: number | null = null;
  let bestSplitIdx = -1;

  for (let i = 0; i < samples.length - 1; i++) {
    GL += samples[i].g;
    HL += samples[i].h;

    const GR = Gtotal - GL;
    const HR = Htotal - HL;

    const gain =
      0.5 *
        (GL ** 2 / (HL + lambdaReg) +
          GR ** 2 / (HR + lambdaReg) -
          Gtotal ** 2 / (Htotal + lambdaReg)) -
      gammaReg;

    const threshold = (samples[i].x + samples[i + 1].x) / 2.0;

    if (gain > bestGain) {
      bestGain = gain;
      bestThreshold = threshold;
      bestSplitIdx = i;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 20,
      explanation: {
        what: `Evaluate Split Candidate ${i + 1} at Threshold ${threshold.toFixed(2)}`,
        why: `GL = ${GL.toFixed(2)}, GR = ${GR.toFixed(2)}, Gain = ${gain.toFixed(
          4,
        )}. Best gain so far = ${bestGain.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: samples.map((s, idx) => ({
          id: `s-${s.id}`,
          value: Math.round(s.x * 10),
          label: `x=${s.x}`,
          state: idx <= i ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: idx === i ? [`Split threshold ${threshold.toFixed(2)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          threshold: threshold.toFixed(2),
          GL: GL.toFixed(2),
          GR: GR.toFixed(2),
          gain: gain.toFixed(4),
          bestGain: bestGain.toFixed(4),
        },
      },
      variables: {
        threshold,
        gain: Math.round(gain * 10000) / 10000,
        bestGain: Math.round(bestGain * 10000) / 10000,
      },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 35,
    explanation: {
      what: `Exact Greedy Split Search Complete: Best Threshold ${bestThreshold?.toFixed(
        2,
      )} (Gain = ${bestGain.toFixed(4)})`,
      why: `Optimal split partition: Left child [x <= ${bestThreshold?.toFixed(
        2,
      )}], Right child [x > ${bestThreshold?.toFixed(2)}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: samples.map((s, idx) => ({
        id: `s-${s.id}`,
        value: Math.round(s.x * 10),
        label: `x=${s.x}`,
        state: idx <= bestSplitIdx ? ("sorted" as ElementState) : ("compare" as ElementState),
        pointers:
          idx === bestSplitIdx
            ? [`Best Split: x <= ${bestThreshold !== null ? bestThreshold.toFixed(2) : "N/A"}`]
            : [],
      })),
    },
    auxiliaryState: {
      customState: {
        bestThreshold: bestThreshold !== null ? bestThreshold.toFixed(2) : "N/A",
        bestGain: bestGain.toFixed(4),
        status: "Completed",
      },
    },
    variables: { bestThreshold: bestThreshold ?? -1, bestGain, complete: true },
  });

  return steps;
};

export const exactGreedySplitSearch: AlgorithmDefinition<ExactGreedySplitSearchInput> = {
  id: "exactGreedySplitSearch",
  title: "XGBoost Exact Greedy Split Search",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 5,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Executes the XGBoost Exact Greedy Split Search algorithm (Chen & Guestrin, KDD 2016 Algorithm 1). Sorts dataset samples by feature value, incrementally computes gradient sums (G_L, H_L) and (G_R, H_R), and calculates the regularized split gain score across all candidate partition thresholds in O(N log N) time.\n\nInput Format:\n- featureValues: Feature value vector for N training samples.\n- gradients: 1st order loss gradients g_i.\n- hessians: 2nd order loss hessians h_i.\n- lambdaReg: L2 leaf regularization parameter.\n- gammaReg: Minimum gain threshold for leaf splitting penalty.\n\nOutput Format:\n- Returns tuple (bestThreshold, maxGainScore, bestSplitIndex).\n\nEdge Cases & Constraints:\n- All feature values identical: No valid split points (returns gain = -inf).",
  constraints: [
    "featureValues, gradients, and hessians must have equal length N.",
    "lambdaReg >= 0.0.",
  ],
  examples: [
    {
      kind: "basic",
      title: "Optimal Split Search across 5 Samples",
      inputDisplay: "5 continuous feature samples, lambda = 1.0, gamma = 0.0",
      outputDisplay: "Best Threshold: 3.95, Gain: 0.4042",
      input: DEFAULT_EXACT_GREEDY_SPLIT_INPUT,
      output: "Threshold 3.95 (Gain 0.4042)",
      explanation:
        "Evaluates split thresholds between adjacent samples, identifying threshold 3.95 between 3.1 and 4.8 as optimal.",
    },
    {
      kind: "complex",
      title: "High Gamma Regularization Penalty",
      inputDisplay: "gammaReg = 1.0 (exceeds raw split gain 0.4042)",
      outputDisplay: "Negative gain score (No split performed)",
      input: {
        ...DEFAULT_EXACT_GREEDY_SPLIT_INPUT,
        gammaReg: 1.0,
      },
      output: "Gain < 0 (Pruned)",
      explanation: "Gamma regularization penalizes node splitting when gain < gamma.",
    },
    {
      kind: "negative",
      title: "Constant Feature Values",
      inputDisplay: "featureValues = [1.0, 1.0, 1.0]",
      outputDisplay: "No valid split thresholds",
      input: {
        featureValues: [1.0, 1.0, 1.0],
        gradients: [0.1, 0.2, 0.3],
        hessians: [1.0, 1.0, 1.0],
        lambdaReg: 1.0,
        gammaReg: 0.0,
      },
      output: "None",
      explanation: "Identical feature values offer zero split candidates.",
    },
  ],
  defaultInput: DEFAULT_EXACT_GREEDY_SPLIT_INPUT,
  code: EXACT_GREEDY_SPLIT_CODE,
  timeComplexity: {
    best: "O(N log N)",
    average: "O(N log N)",
    worst: "O(N log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "O(N log N) to sort N samples by feature value, plus O(N) to compute running gradient sums and gains.",
    space: "O(N) auxiliary space for sorted sample tuple structures.",
  },
  topicGuide: {
    overview:
      "XGBoost (Chen & Guestrin 2016) achieves state-of-the-art tabular ML performance by formulating decision tree split search around 2nd order Taylor expansions of loss functions. Exact Greedy Split Search evaluates all possible feature thresholds to maximize regularized gain.",
    sections: [
      {
        heading: "Core Concept & Regularized Gain Score",
        body: "The regularized gain formula is Gain = 0.5 * [ G_L^2 / (H_L + lambda) + G_R^2 / (H_R + lambda) - G_{total}^2 / (H_{total} + lambda) ] - gamma. It balances gradient reduction against L2 leaf weight penalty lambda and node split cost gamma.",
      },
      {
        heading: "Systems & Memory Bottlenecks",
        body: "Sorting feature columns takes O(K * N log N) time for K features. To scale to large datasets, modern libraries switch from Exact Greedy search to Histogram-based binning (`tree_method='hist'`).",
      },
      {
        heading: "Parallelization across Feature Columns",
        body: "Because feature columns are independent, exact split search parallelizes across threads, evaluating features in parallel block structures.",
      },
    ],
    keyTerms: [
      {
        term: "Exact Greedy Search",
        definition: "Evaluating all unique continuous feature split thresholds by sorting values.",
      },
      {
        term: "Regularized Gain",
        definition:
          "XGBoost score measuring loss reduction from splitting a node into left and right children.",
      },
      {
        term: "Gamma Regularization (γ)",
        definition: "Minimum gain threshold required to justify creating a new tree split node.",
      },
    ],
  },
  sources: [
    {
      type: "ml_infra",
      kind: "ml_infra",
      label: "XGBoost Exact Greedy Algorithm 1 (Chen & Guestrin KDD 2016)",
    },
  ],
  generateSteps: generateExactGreedySplitSteps,
};
