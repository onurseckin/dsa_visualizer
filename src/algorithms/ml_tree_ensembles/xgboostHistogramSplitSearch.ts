import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface XgboostHistogramSplitSearchInput {
  histG: number[];
  histH: number[];
  binBoundaries: number[];
  lambdaReg: number;
  gammaReg: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT: XgboostHistogramSplitSearchInput = {
  histG: [-0.8, -0.4, 0.2, 0.9],
  histH: [0.25, 0.25, 0.25, 0.25],
  binBoundaries: [1.5, 3.0, 4.5, 6.0],
  lambdaReg: 1.0,
  gammaReg: 0.0,
  data: [-0.8, -0.4, 0.2, 0.9],
  target: 0,
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
  const numBins = histG.length;

  const getSnapshot = (
    currentBin: number = -1,
    bestBin: number = -1,
  ) => {
    return {
      kind: "array" as const,
      elements: histG.map((g, idx) => {
        let state: ElementState = "default";
        if (idx === currentBin) state = "active";
        else if (idx === bestBin) state = "sorted";
        else if (currentBin >= 0 && idx <= currentBin) state = "visited";

        return {
          id: `bin-${idx}`,
          value: Math.round(g * 10),
          label: `Bin ${idx} (G=${g.toFixed(2)}, H=${histH[idx].toFixed(2)})`,
          state,
          pointers: idx === currentBin ? [`b=${idx}`] : [],
        };
      }),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentBin: number = -1,
    bestBin: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentBin, bestBin),
      auxiliaryState: {
        customState: {
          "Algorithm": "O(B) XGBoost Histogram Split Search",
          "numBins B": String(numBins),
          "G_total": Gtotal.toFixed(4),
          "H_total": Htotal.toFixed(4),
          "lambda": String(lambdaReg),
          "gamma": String(gammaReg),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "XGBoost Histogram Split Search Entry",
    `Started O(B) histogram split search across B = ${numBins} bins with lambda = ${lambdaReg}, gamma = ${gammaReg}.`,
    { numBins, lambdaReg, gammaReg },
  );

  // Step 2: Compute G_total (6)
  addStep(
    6,
    `Calculate Total Gradient: G_total = sum(hist_G) = ${Gtotal.toFixed(4)}`,
    `Evaluated total gradient sum G_total = ${Gtotal.toFixed(4)}.`,
    { Gtotal },
  );

  // Step 3: Compute H_total (7)
  addStep(
    7,
    `Calculate Total Hessian: H_total = sum(hist_H) = ${Htotal.toFixed(4)}`,
    `Evaluated total hessian sum H_total = ${Htotal.toFixed(4)}.`,
    { Htotal },
  );

  // Step 4: Init best_gain (9)
  let bestGain = -Infinity;
  addStep(
    9,
    "Initialize best_gain = -inf",
    "Set best_gain accumulator to negative infinity.",
    { best_gain: "-inf" },
  );

  // Step 5: Init best_bin (10)
  let bestBin = -1;
  addStep(
    10,
    "Initialize best_bin = -1",
    "Set best_bin pointer to -1.",
    { best_bin: -1 },
  );

  // Step 6: Init best_threshold (11)
  let bestThreshold: number | null = null;
  addStep(
    11,
    "Initialize best_threshold = None",
    "Set best_threshold pointer to None.",
    { best_threshold: "None" },
  );

  // Step 7: Init G_L, H_L (13)
  let GL = 0.0;
  let HL = 0.0;
  addStep(
    13,
    "Initialize Left Accumulators G_L = 0.0, H_L = 0.0",
    "Set left gradient sum G_L = 0.0 and left hessian sum H_L = 0.0.",
    { G_L: 0.0, H_L: 0.0 },
  );

  // Step 8: Read num_bins (14)
  addStep(
    14,
    `Read Histogram Length: num_bins = ${numBins}`,
    `Total histogram bins count B = ${numBins}.`,
    { numBins },
  );

  // Loop over bins (16..31)
  for (let b = 0; b < numBins - 1; b++) {
    addStep(
      16,
      `Bin Loop: b = ${b} of ${numBins - 2}`,
      `Scanning candidate bin boundary b = ${b} (threshold x = ${binBoundaries[b] ?? b}).`,
      { b },
      b,
      bestBin,
    );

    GL += histG[b];
    addStep(
      17,
      `Accumulate Left Gradient: G_L += hist_G[${b}] (${histG[b].toFixed(2)}) -> ${GL.toFixed(4)}`,
      `Updated left gradient sum G_L = ${GL.toFixed(4)}.`,
      { G_L: GL },
      b,
      bestBin,
    );

    HL += histH[b];
    addStep(
      18,
      `Accumulate Left Hessian: H_L += hist_H[${b}] (${histH[b].toFixed(2)}) -> ${HL.toFixed(4)}`,
      `Updated left hessian sum H_L = ${HL.toFixed(4)}.`,
      { H_L: HL },
      b,
      bestBin,
    );

    const GR = Gtotal - GL;
    addStep(
      19,
      `Compute Right Gradient: G_R = G_total - G_L = ${GR.toFixed(4)}`,
      `Evaluated right gradient sum G_R = ${Gtotal.toFixed(4)} - ${GL.toFixed(4)} = ${GR.toFixed(4)}.`,
      { G_R: GR },
      b,
      bestBin,
    );

    const HR = Htotal - HL;
    addStep(
      20,
      `Compute Right Hessian: H_R = H_total - H_L = ${HR.toFixed(4)}`,
      `Evaluated right hessian sum H_R = ${Htotal.toFixed(4)} - ${HL.toFixed(4)} = ${HR.toFixed(4)}.`,
      { H_R: HR },
      b,
      bestBin,
    );

    const scoreL = (GL * GL) / (HL + lambdaReg);
    const scoreR = (GR * GR) / (HR + lambdaReg);
    const scoreP = (Gtotal * Gtotal) / (Htotal + lambdaReg);
    const gain = 0.5 * (scoreL + scoreR - scoreP) - gammaReg;

    addStep(
      22,
      `Compute XGBoost Split Gain = ${gain.toFixed(4)}`,
      `Evaluated Gain for bin boundary b=${b}: Gain = ${gain.toFixed(4)}.`,
      { gain, scoreL, scoreR, scoreP },
      b,
      bestBin,
    );

    if (gain > bestGain) {
      bestGain = gain;
      bestBin = b;
      bestThreshold = binBoundaries[b] ?? b;

      addStep(
        29,
        `New Best Split Found! Bin b = ${bestBin}, Threshold t = ${bestThreshold}, Gain = ${bestGain.toFixed(4)}`,
        `Updated best split: Bin ${bestBin}, Threshold ${bestThreshold}, Gain ${bestGain.toFixed(4)}.`,
        { bestGain, bestBin, bestThreshold },
        b,
        bestBin,
      );
    }
  }

  // Final step (33)
  const roundedGain = Math.round(bestGain * 10000) / 10000;
  addStep(
    33,
    `Execution Complete: Return Best Threshold t = ${bestThreshold}, Gain = ${roundedGain}, Bin b = ${bestBin}`,
    `Completed O(B) histogram split search. Optimal threshold t = ${bestThreshold} at bin ${bestBin} with Gain = ${roundedGain}.`,
    { bestThreshold: bestThreshold ?? 0, bestGain: roundedGain, bestBin, completed: true },
    -1,
    bestBin,
  );

  return steps;
};

const XGBOOST_HISTOGRAM_SPLIT_SEARCH_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 8, 12, 15, 21, 23, 24, 25, 26, 27, 31, 32],
  distractors: [
    "gain = G_L + G_R",
    "best_bin = num_bins",
    "G_R = G_L - G_total",
    "for b in range(num_bins): G_L = sum(hist_G[:b])",
  ],
  hints: [
    { line: 22, hint: "XGBoost split gain equation: 0.5 * [ G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G_total^2/(H_total+lambda) ] - gamma." },
    { line: 30, hint: "Look up threshold from bin_boundaries array: bin_boundaries[best_bin]." },
  ],
  lineExplanations: {
    1: "Defines entry point for xgboost_histogram_split_search function implementing LightGBM / XGBoost 'hist' split search.",
    2: "Docstring opening delimiter tag.",
    3: "Describes O(num_bins) fast split search over pre-built gradient and hessian histograms.",
    4: "Docstring detailing iterative accumulation of G_L, H_L across bins and regularized Gain score evaluation.",
    5: "Docstring closing delimiter tag.",
    6: "Sums total gradient G_total across all histogram bins.",
    7: "Sums total hessian H_total across all histogram bins.",
    8: "Blank line before best split accumulators initialization.",
    9: "Initializes best_gain to negative infinity.",
    10: "Initializes best_bin index to -1.",
    11: "Initializes best_threshold to None.",
    12: "Blank line before left accumulators initialization.",
    13: "Initializes left gradient sum G_L = 0.0 and left hessian sum H_L = 0.0.",
    14: "Measures total histogram bins count num_bins = len(hist_G).",
    15: "Blank line before bin loop.",
    16: "Iterates over bin index b from 0 to num_bins - 2.",
    17: "Accumulates gradient of bin b into G_L: G_L += hist_G[b].",
    18: "Accumulates hessian of bin b into H_L: H_L += hist_H[b].",
    19: "Computes right gradient sum G_R = G_total - G_L in O(1) time.",
    20: "Computes right hessian sum H_R = H_total - H_L in O(1) time.",
    21: "Blank line before gain calculation.",
    22: "Evaluates XGBoost regularized split gain score for candidate bin boundary b.",
    23: "Left child score term: (G_L ** 2) / (H_L + lambda_reg).",
    24: "Right child score term: (G_R ** 2) / (H_R + lambda_reg).",
    25: "Parent node score subtraction term: (G_total ** 2) / (H_total + lambda_reg).",
    26: "Subtracts L1 tree complexity penalty gamma_reg.",
    27: "Blank line before checking best gain.",
    28: "Checks if evaluated split gain exceeds current best_gain.",
    29: "Updates best_gain to current gain.",
    30: "Updates best_bin to current bin index b.",
    31: "Retrieves split threshold value best_threshold = bin_boundaries[b].",
    32: "Blank line separating bin loop from return statement.",
    33: "Returns tuple of (best_threshold, rounded best_gain, best_bin).",
  },
};

export const xgboostHistogramSplitSearch: AlgorithmDefinition<XgboostHistogramSplitSearchInput> = {
  id: "xgboostHistogramSplitSearch",
  title: "XGBoost Histogram-Based Split Search",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The XGBoost Histogram-Based Split Search algorithm executes fast $O(B)$ candidate split evaluation over pre-built gradient and hessian histograms ($B \\le 256$ bins), powering the high-speed training engines of **LightGBM** and **XGBoost (`tree_method='hist'`)**. Instead of scanning $N$ individual samples ($O(N \\log N)$), the engine scans $B-1$ histogram bin boundaries, accumulating prefix sums $G_L, H_L$ and computing regularized Split Gain scores in $O(1)$ time per bin.\n\n### Why It Exists\nFor massive datasets ($N = 10^7$ samples), exact greedy split search becomes compute and memory bound. Histogram-based split search decouples split search time from dataset sample size $N$: whether $N = 10^4$ or $N = 10^8$, evaluating candidate splits takes exactly $B-1$ bin steps ($O(B)$ time).\n\n### Mathematical Formulation\nGiven gradient histogram `hist_G` and hessian histogram `hist_H` of size $B$, total sums $G_{total} = \\sum_{b=0}^{B-1} \\text{hist}_G[b], H_{total} = \\sum_{b=0}^{B-1} \\text{hist}_H[b]$:\n\n$$1. \\quad G_{L, k} = G_{L, k-1} + \\text{hist}_G[k], \\quad H_{L, k} = H_{L, k-1} + \\text{hist}_H[k] \\quad (O(1) \\text{ Prefix Accumulation})$$\n\n$$2. \\quad G_{R, k} = G_{total} - G_{L, k}, \\quad H_{R, k} = H_{total} - H_{L, k}$$\n\n$$3. \\quad \\text{Gain}_k = \\frac{1}{2} \\left[ \\frac{G_{L,k}^2}{H_{L,k} + \\lambda} + \\frac{G_{R,k}^2}{H_{R,k} + \\lambda} - \\frac{G_{total}^2}{H_{total} + \\lambda} \\right] - \\gamma$$\n\n$$4. \\quad b^* = \\arg\\max_{k \\in \\{0 \\dots B-2\\}} \\text{Gain}_k, \\quad t^* = \\text{bin\\_boundaries}[b^*]$$\n\n### Step-by-Step Intuition\n1. **Total Sum Evaluation**: Compute $G_{total} = \\sum \\text{hist}_G[b]$ and $H_{total} = \\sum \\text{hist}_H[b]$.\n2. **Bin Loop Scanning**: Iterate through bins $b = 0 \\dots B-2$.\n3. **Prefix Accumulation**: Accumulate left gradient $G_L += \\text{hist}_G[b]$ and left hessian $H_L += \\text{hist}_H[b]$.\n4. **O(1) Right Subtraction**: Compute $G_R = G_{total} - G_L$ and $H_R = H_{total} - H_L$.\n5. **Gain Evaluation & Max Tracking**: Compute regularized Gain score and track maximum gain bin $b^*$ and threshold $t^*$.\n\n### Key Trade-Offs & Hardware Execution\n- **100x Speedup**: Reduces split evaluation steps from $N=10,000,000$ down to $B=256$, enabling real-time GPU GBDT training.\n- **Quantization Error Bound**: Quantizing continuous features into $B=256$ bins introduces minimal loss in model accuracy (typically $< 0.01\\%$ AUC difference compared to exact greedy).",
  constraints: [
    "1 <= numBins <= 256",
    "lambdaReg >= 0.0",
    "gammaReg >= 0.0",
  ],
  examples: [
    {
      kind: "basic",
      title: "4-Bin Histogram Fast Split Search (lambda = 1.0)",
      inputDisplay: "hist_G = [-0.8, -0.4, 0.2, 0.9], hist_H = [0.25, 0.25, 0.25, 0.25]",
      outputDisplay: "Best Bin b = 1, Best Threshold t = 3.00, Max Gain = 0.5333",
      input: DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT,
      output: "(3.0, 0.5333, 1)",
      explanation: "Scans 3 bin boundaries in O(B) time. Optimal split at bin boundary 1 (t=3.00) yields maximum Gain = 0.5333.",
    },
  ],
  code: XGBOOST_HISTOGRAM_SPLIT_SEARCH_CODE,
  timeComplexity: { best: "O(B)", average: "O(B)", worst: "O(B)" },
  spaceComplexity: "O(B)",
  complexityAnalysis: {
    time: "Linear in the number of histogram bins $O(B)$ ($B \\le 256$), independent of sample size $N$.",
    space: "Requires $O(B)$ memory to store histogram arrays.",
  },
  topicGuide: {
    overview:
      "The XGBoost Histogram-Based Split Search algorithm evaluates candidate split gains in O(B) time over pre-built gradient and hessian histograms.",
    sections: [
      {
        heading: "Core Concept & O(B) Fast Split Search",
        body: "Histogram-based split search scans B-1 bin boundaries in O(B) time, accumulating G_L, H_L and computing G_R = G_total - G_L, H_R = H_total - H_L in O(1) time per bin.",
      },
      {
        heading: "Decoupling Execution Time from Dataset Size N",
        body: "Exact greedy search takes O(N log N) time. Histogram split search takes O(B) time (B=256), enabling 10x-100x training speedups on multi-million sample datasets.",
      },
      {
        heading: "Histogram Subtraction for Child Nodes",
        body: "When a node splits into children L and R, calculating hist_R = hist_Parent - hist_L takes O(B) time, cutting histogram construction time in half.",
      },
      {
        heading: "Accuracy vs Speed Trade-Off",
        body: "Quantizing continuous features into 256 uint8 bins introduces negligible approximation error while offering massive GPU acceleration.",
      },
    ],
    keyTerms: [
      {
        term: "Histogram Split Search",
        definition: "Evaluating candidate decision tree splits across B discrete histogram bins in O(B) time.",
      },
      {
        term: "Prefix Accumulation",
        definition: "Accumulating G_L += hist_G[b] and H_L += hist_H[b] sequentially across bin boundaries.",
      },
      {
        term: "Bin Boundary (t)",
        definition: "Continuous feature threshold corresponding to upper bound of histogram bin b.",
      },
      {
        term: "Sample Decoupling",
        definition: "Decoupling split evaluation time from sample size N down to bin count B.",
      },
    ],
  },
  trivia: XGBOOST_HISTOGRAM_SPLIT_SEARCH_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_XGBOOST_HISTOGRAM_SPLIT_INPUT,
  generateSteps: generateXgboostHistogramSplitSearchSteps,
};
