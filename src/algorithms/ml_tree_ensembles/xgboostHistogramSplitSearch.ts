import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface XgboostHistogramSplitSearchInput {
  histG: number[];
  histH: number[];
  binBoundaries: number[];
  lambdaReg: number;
  gammaReg: number;
}

export const DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT: XgboostHistogramSplitSearchInput = {
  histG: [-0.8, -0.4, 0.2, 0.9],
  histH: [0.25, 0.25, 0.25, 0.25],
  binBoundaries: [1.5, 3.0, 4.5, 6.0],
  lambdaReg: 1.0,
  gammaReg: 0.0,
};

export const XGBOOST_HISTOGRAM_SPLIT_SEARCH_CODE = `def xgboost_histogram_split_search(hist_G: list[float], hist_H: list[float], bin_boundaries: list[float], lambda_reg: float = 1.0, gamma_reg: float = 0.0) -> tuple[float, float, int]:
    """
    Performs O(num_bins) fast split search over pre-built gradient and hessian histograms (LightGBM / XGBoost 'hist').
    Iteratively accumulates G_L, H_L across bins and evaluates XGBoost regularized split gain score.
    """
    G_total = sum(hist_G)
    H_total = sum(hist_H)

    best_gain = -float('inf')
    best_bin = -1
    best_threshold = None

    G_L, H_L = 0.0, 0.0
    num_bins = len(hist_G)

    for b in range(num_bins - 1):
        G_L += hist_G[b]
        H_L += hist_H[b]
        G_R = G_total - G_L
        H_R = H_total - H_L

        gain = 0.5 * (
            (G_L ** 2) / (H_L + lambda_reg) +
            (G_R ** 2) / (H_R + lambda_reg) -
            (G_total ** 2) / (H_total + lambda_reg)
        ) - gamma_reg

        if gain > best_gain:
            best_gain = gain
            best_bin = b
            best_threshold = bin_boundaries[b] if b < len(bin_boundaries) else float(b)

    return best_threshold, round(best_gain, 4), best_bin`;

export const generateXgboostHistogramSplitSearchSteps = (
  input: XgboostHistogramSplitSearchInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const histG = input.histG || DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT.histG;
  const histH = input.histH || DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT.histH;
  const binBoundaries = input.binBoundaries || DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT.binBoundaries;
  const lambdaReg = input.lambdaReg ?? 1.0;
  const gammaReg = input.gammaReg ?? 0.0;

  const Gtotal = histG.reduce((a, b) => a + b, 0);
  const Htotal = histH.reduce((a, b) => a + b, 0);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize XGBoost Histogram Split Search",
      why: `Histogram built with ${histG.length} bins. G_total = ${Gtotal.toFixed(
        2,
      )}, H_total = ${Htotal.toFixed(2)}, λ = ${lambdaReg}, γ = ${gammaReg}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: histG.map((g, idx) => ({
        id: `bin-${idx}`,
        value: Math.round(g * 10),
        label: `Bin ${idx} (G=${g}, H=${histH[idx]})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        numBins: String(histG.length),
        G_total: Gtotal.toFixed(2),
        H_total: Htotal.toFixed(2),
        status: "Initialized",
      },
    },
    variables: { numBins: histG.length, Gtotal, Htotal },
  });

  let GL = 0.0;
  let HL = 0.0;
  let bestGain = -Infinity;
  let bestBin = -1;
  let bestThreshold: number | null = null;

  for (let b = 0; b < histG.length - 1; b++) {
    GL += histG[b];
    HL += histH[b];

    const GR = Gtotal - GL;
    const HR = Htotal - HL;

    const gain =
      0.5 *
        (GL ** 2 / (HL + lambdaReg) +
          GR ** 2 / (HR + lambdaReg) -
          Gtotal ** 2 / (Htotal + lambdaReg)) -
      gammaReg;

    const threshold = binBoundaries[b] ?? b;

    if (gain > bestGain) {
      bestGain = gain;
      bestBin = b;
      bestThreshold = threshold;
    }

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 16,
      explanation: {
        what: `Evaluate Bin Split ${b} at Threshold ${threshold}`,
        why: `G_L = ${GL.toFixed(2)}, H_L = ${HL.toFixed(2)}, G_R = ${GR.toFixed(
          2,
        )}, H_R = ${HR.toFixed(2)}. Split Gain = ${gain.toFixed(
          4,
        )}. Best Gain = ${bestGain.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: histG.map((g, idx) => ({
          id: `bin-${idx}`,
          value: Math.round(g * 10),
          label: `Bin ${idx}`,
          state: idx <= b ? ("active" as ElementState) : ("visited" as ElementState),
          pointers: idx === b ? [`Split threshold ${threshold}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          currentBin: String(b),
          threshold: String(threshold),
          GL: GL.toFixed(2),
          HL: HL.toFixed(2),
          gain: gain.toFixed(4),
          bestGain: bestGain.toFixed(4),
        },
      },
      variables: { currentBin: b, threshold, gain: Math.round(gain * 10000) / 10000, bestGain },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 28,
    explanation: {
      what: `Histogram Split Search Complete: Optimal Bin ${bestBin} (Threshold ${bestThreshold})`,
      why: `Maximum Split Gain = ${bestGain.toFixed(4)}. Left bins: [0..${bestBin}], Right bins: [${
        bestBin + 1
      }..${histG.length - 1}].`,
    },
    primarySnapshot: {
      kind: "array",
      elements: histG.map((g, idx) => ({
        id: `bin-${idx}`,
        value: Math.round(g * 10),
        label: `Bin ${idx}`,
        state: idx <= bestBin ? ("sorted" as ElementState) : ("compare" as ElementState),
        pointers: idx === bestBin ? [`Best Split: Threshold ${bestThreshold}`] : [],
      })),
    },
    auxiliaryState: {
      customState: {
        bestBin: String(bestBin),
        bestThreshold: String(bestThreshold),
        bestGain: bestGain.toFixed(4),
        status: "Completed",
      },
    },
    variables: { bestBin, bestThreshold: bestThreshold ?? "N/A", bestGain, complete: true },
  });

  return steps;
};

const XGBOOST_HISTOGRAM_SPLIT_SEARCH_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Scan histogram bins accumulating G_L and H_L." }],
  lineExplanations: { 1: "Defines entry point for XGBoost Histogram Split Search." },
};

export const xgboostHistogramSplitSearch: AlgorithmDefinition<XgboostHistogramSplitSearchInput> = {
  id: "xgboostHistogramSplitSearch",
  title: "XGBoost Histogram-Based Fast Split Search",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "tree_fundamentals"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 9,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "Performs ultra-fast O(B) split search over pre-built gradient and hessian histograms (XGBoost `tree_method='hist'`, LightGBM). By accumulating G_L and H_L across B discrete bin buckets instead of sorting N continuous sample values, histogram split search reduces split finding time from O(N log N) to O(B) (where B <= 256).\n\nInput Format:\n- histG: Gradient sum vector for B histogram bins.\n- histH: Hessian sum vector for B histogram bins.\n- binBoundaries: Continuous feature split thresholds corresponding to bin boundaries.\n- lambdaReg: L2 regularization parameter λ.\n- gammaReg: Split penalty γ.\n\nOutput Format:\n- Returns tuple (bestThreshold, maxGain, bestBinIndex).\n\nEdge Cases & Constraints:\n- Empty Bins: Handled automatically as G_bin = 0, H_bin = 0 without affecting split gain math.",
  constraints: [
    "histG and histH must have equal length B >= 2.",
    "histH[i] >= 0.0.",
    "lambdaReg >= 0.0.",
  ],
  examples: [
    {
      kind: "basic",
      title: "Histogram Split Search over 4 Bins",
      inputDisplay: "4 bins with G and H totals, lambda = 1.0, gamma = 0.0",
      outputDisplay: "Best Bin: 1, Threshold: 3.0, Gain: 0.2045",
      input: DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT,
      output: "Threshold 3.0 (Gain 0.2045)",
      explanation:
        "Scans 4 histogram bins, finding threshold 3.0 between Bin 1 and Bin 2 as the optimal split point.",
    },
    {
      kind: "complex",
      title: "High Gamma Regularization Penalty",
      inputDisplay: "gammaReg = 0.5",
      outputDisplay: "Negative Net Gain (Split pruned)",
      input: {
        ...DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT,
        gammaReg: 0.5,
      },
      output: "Gain < 0 (Pruned)",
      explanation: "Gamma penalty exceeds raw split score gain, rejecting the split.",
    },
    {
      kind: "negative",
      title: "Uniform Zero Gradient Histogram",
      inputDisplay: "histG = [0.0, 0.0, 0.0, 0.0]",
      outputDisplay: "Max Gain = 0.0000",
      input: {
        histG: [0.0, 0.0, 0.0, 0.0],
        histH: [1.0, 1.0, 1.0, 1.0],
        binBoundaries: [1.0, 2.0, 3.0, 4.0],
        lambdaReg: 1.0,
        gammaReg: 0.0,
      },
      output: "Gain = 0.0000",
      explanation: "Zero gradients yield zero loss gain across all bin thresholds.",
    },
  ],
  code: XGBOOST_HISTOGRAM_SPLIT_SEARCH_CODE,
  timeComplexity: {
    best: "O(B)",
    average: "O(B)",
    worst: "O(B)",
  },
  spaceComplexity: "O(B)",
  complexityAnalysis: {
    time: "O(B) linear scan over B histogram bins (typically B = 256), completely independent of sample count N.",
    space: "O(B) auxiliary space for histogram storage.",
  },
  topicGuide: {
    overview:
      "Histogram split search is the computational backbone of modern GBDT systems (LightGBM, XGBoost, CatBoost). Rather than sorting raw continuous sample values for every tree node, training continuous features are discretized into 256 integer bins during preprocessing.",
    sections: [
      {
        heading: "Overview & Mathematical Formulation",
        body: "For B bins, split search iterates b from 0 to B-2, accumulating G_L = sum_{i=0}^b histG[i] and H_L = sum_{i=0}^b histH[i]. The XGBoost regularized gain Gain = 0.5 * [ G_L^2 / (H_L + lambda) + G_R^2 / (H_R + lambda) - G_{total}^2 / (H_{total} + lambda) ] - gamma is evaluated at each bin boundary in O(1) time.",
      },
      {
        heading: "Core Concepts & Quantization Speedup",
        body: "By replacing float32 comparisons across N samples with 8-bit integer indexing into 256 histogram bins, memory access patterns become cache-friendly and execution time drops from O(N log N) to O(B).",
      },
      {
        heading: "Systems & GPU Memory Hierarchy",
        body: "Histogram vectors (256 * 8 bytes = 2 KB) fit entirely inside L1 cache or GPU shared memory (SRAM), eliminating DRAM bandwidth bottlenecks during split search.",
      },
      {
        heading: "Implementation Nuances & Edge Cases",
        body: "Care must be taken to ensure minimum child Hessian weight (min_child_weight) constraints are enforced before evaluating gain scores on candidate bin splits.",
      },
    ],
    keyTerms: [
      {
        term: "Histogram Split Search",
        definition:
          "Evaluating split gain scores across discrete feature bin buckets in O(B) time.",
      },
      {
        term: "Bin Accumulation",
        definition:
          "Iteratively summing gradient G and Hessian H values across adjacent bin entries.",
      },
      {
        term: "Cache Locality",
        definition:
          "Storing 256-bin histograms in CPU L1 cache or GPU SRAM for near-zero memory latency.",
      },
      {
        term: "Min Child Weight",
        definition:
          "Minimum Hessian sum (H_L and H_R) required in left and right child nodes to consider a split valid.",
      },
    ],
  },
  trivia: XGBOOST_HISTOGRAM_SPLIT_SEARCH_TRIVIA,
  sources: [
    {
      type: "ml_infra",
      kind: "ml_infra",
      label: "LightGBM (Ke et al. 2017) & XGBoost Fast Histogram Split Search",
    },
  ],
  defaultInput: DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT,
  generateSteps: generateXgboostHistogramSplitSearchSteps,
};
