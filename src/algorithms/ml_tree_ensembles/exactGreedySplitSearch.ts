import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ExactGreedySplitSearchInput {
  featureValues: number[];
  gradients: number[];
  hessians: number[];
  lambdaReg: number;
  gammaReg: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_EXACT_GREEDY_SPLIT_INPUT: ExactGreedySplitSearchInput = {
  featureValues: [1.2, 2.1, 2.8, 3.5, 4.2, 5.0, 5.8, 6.5, 7.3, 8.0],
  gradients: [-0.9, -0.7, -0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.8, 1.0],
  hessians: [0.3, 0.25, 0.3, 0.2, 0.35, 0.25, 0.3, 0.4, 0.25, 0.3],
  lambdaReg: 1.0,
  gammaReg: 0.1,
  data: [1.2, 2.1, 2.8, 3.5, 4.2, 5.0, 5.8, 6.5, 7.3, 8.0],
  target: 1,
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
  const featureValues = input.featureValues || input.data || [1.2, 2.1, 2.8, 3.5, 4.2, 5.0, 5.8, 6.5, 7.3, 8.0];
  const gradients = input.gradients || [-0.9, -0.7, -0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.8, 1.0];
  const hessians = input.hessians || [0.3, 0.25, 0.3, 0.2, 0.35, 0.25, 0.3, 0.4, 0.25, 0.3];
  const lambdaReg = input.lambdaReg ?? 1.0;
  const gammaReg = input.gammaReg ?? 0.1;
  let stepIndex = 0;

  const samples = featureValues
    .map((x, idx) => ({ x, g: gradients[idx], h: hessians[idx], id: idx }))
    .sort((a, b) => a.x - b.x);

  const Gtotal = samples.reduce((acc, s) => acc + s.g, 0);
  const Htotal = samples.reduce((acc, s) => acc + s.h, 0);

  const getSnapshot = (
    currentSplitIdx: number = -1,
    bestSplitIdx: number = -1,
  ) => {
    return {
      kind: "array" as const,
      elements: samples.map((s, idx) => {
        let state: ElementState = "default";
        if (idx === currentSplitIdx) state = "active";
        else if (idx === bestSplitIdx) state = "sorted";
        else if (currentSplitIdx >= 0 && idx <= currentSplitIdx) state = "visited";

        return {
          id: `s-${s.id}`,
          value: Math.round(s.x * 10),
          label: `x=${s.x}`,
          state,
          pointers: idx === currentSplitIdx ? [`i=${idx}`] : [],
        };
      }),
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currentSplitIdx: number = -1,
    bestSplitIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(currentSplitIdx, bestSplitIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "XGBoost Exact Greedy Algorithm 1",
          "G_total": Gtotal.toFixed(4),
          "H_total": Htotal.toFixed(4),
          "lambda": String(lambdaReg),
          "gamma": String(gammaReg),
        },
      },
      variables,
    });
  };

  // Step 1: Signature
  addStep(
    1,
    "Exact Greedy Split Search Entry",
    `Started XGBoost Exact Greedy Split Search on ${samples.length} samples with lambda = ${lambdaReg}, gamma = ${gammaReg}.`,
    { lambdaReg, gammaReg, n: samples.length },
  );

  // Step 2: Sort samples
    addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Opening delimiter of the Python docstring.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "Exact Greedy Split Search algorithm (XGBoost Exact Greedy Algorithm 1, Chen",
    {},
  );

  addStep(
    4,
    "Docstring body: algorithm description",
    "Sorts samples by feature value, accumulates gradient sums G_L, H_L and G_R,",
    {},
  );

  addStep(
    5,
    "Docstring body: algorithm description",
    "and finds the optimal split threshold maximizing regularized Gain score.",
    {},
  );

  addStep(
    6,
    "End of docstring",
    "Docstring complete. Entering the function body.",
    {},
  );

  addStep(
    7,
    "Docstring body: algorithm description",
    "# Sort samples by feature value",
    {},
  );

addStep(
    8,
    "Sort Samples by Feature Value x",
    `Sorted ${samples.length} samples in ascending feature order: [${samples.map((s) => s.x).join(", ")}].`,
    { sorted: true },
  );

  // Step 3: Compute G_total
  addStep(
    10,
    `Sum Total Gradients G_total = ${Gtotal.toFixed(4)}`,
    `Evaluated total gradient sum G_total = ${Gtotal.toFixed(4)}.`,
    { G_total: Gtotal },
  );

  // Step 4: Compute H_total
  addStep(
    11,
    `Sum Total Hessians H_total = ${Htotal.toFixed(4)}`,
    `Evaluated total hessian sum H_total = ${Htotal.toFixed(4)}.`,
    { H_total: Htotal },
  );

  // Step 5: Init best_gain
  let bestGain = -Infinity;
  addStep(
    13,
    "Initialize best_gain = -inf",
    "Set best_gain accumulator to negative infinity.",
    { best_gain: "-inf" },
  );

  // Step 6: Init best_threshold
  let bestThreshold: number | null = null;
  addStep(
    14,
    "Initialize best_threshold = None",
    "Set best_threshold to None.",
    { best_threshold: "None" },
  );

  // Step 7: Init best_split_idx
  let bestSplitIdx = -1;
  addStep(
    15,
    "Initialize best_split_idx = -1",
    "Set best_split_idx to -1.",
    { best_split_idx: -1 },
  );

  // Step 8: Init G_L, H_L
  let GL = 0.0;
  let HL = 0.0;
  addStep(
    17,
    "Initialize Left Accumulators G_L = 0.0, H_L = 0.0",
    "Set left gradient sum G_L = 0.0 and left hessian sum H_L = 0.0.",
    { G_L: 0.0, H_L: 0.0 },
  );

  // Loop over candidate split boundaries
  for (let i = 0; i < samples.length - 1; i++) {
    addStep(
      19,
      `Split Search Loop: i = ${i} of ${samples.length - 2}`,
      `Evaluating candidate split boundary between sample ${i} (x=${samples[i].x}) and sample ${i + 1} (x=${samples[i + 1].x}).`,
      { i },
      i,
      bestSplitIdx,
    );

    const s = samples[i];
    addStep(
      20,
      `Read Sample i=${i}: x=${s.x}, g=${s.g}, h=${s.h}`,
      `Loaded sample ${i} feature x=${s.x}, gradient g=${s.g}, hessian h=${s.h}.`,
      { i, x: s.x, g: s.g, h: s.h },
      i,
      bestSplitIdx,
    );

    GL += s.g;
    addStep(
      21,
      `Accumulate Left Gradient: G_L += ${s.g} -> G_L = ${GL.toFixed(4)}`,
      `Updated left gradient sum G_L = ${GL.toFixed(4)}.`,
      { G_L: GL },
      i,
      bestSplitIdx,
    );

    HL += s.h;
    addStep(
      22,
      `Accumulate Left Hessian: H_L += ${s.h} -> H_L = ${HL.toFixed(4)}`,
      `Updated left hessian sum H_L = ${HL.toFixed(4)}.`,
      { H_L: HL },
      i,
      bestSplitIdx,
    );

    const GR = Gtotal - GL;
    addStep(
      24,
      `Compute Right Gradient: G_R = G_total - G_L = ${GR.toFixed(4)}`,
      `Evaluated right gradient sum G_R = ${Gtotal.toFixed(4)} - ${GL.toFixed(4)} = ${GR.toFixed(4)}.`,
      { G_R: GR },
      i,
      bestSplitIdx,
    );

    const HR = Htotal - HL;
    addStep(
      25,
      `Compute Right Hessian: H_R = H_total - H_L = ${HR.toFixed(4)}`,
      `Evaluated right hessian sum H_R = ${Htotal.toFixed(4)} - ${HL.toFixed(4)} = ${HR.toFixed(4)}.`,
      { H_R: HR },
      i,
      bestSplitIdx,
    );

    const scoreL = (GL * GL) / (HL + lambdaReg);
    const scoreR = (GR * GR) / (HR + lambdaReg);
    const scoreP = (Gtotal * Gtotal) / (Htotal + lambdaReg);
    const gain = 0.5 * (scoreL + scoreR - scoreP) - gammaReg;

    addStep(
      28,
      `Compute Regularized XGBoost Split Gain = ${gain.toFixed(4)}`,
      `Evaluated Gain = 0.5 * [(${GL.toFixed(2)}^2)/(${HL.toFixed(2)}+${lambdaReg}) + (${GR.toFixed(2)}^2)/(${HR.toFixed(2)}+${lambdaReg}) - (${Gtotal.toFixed(2)}^2)/(${Htotal.toFixed(2)}+${lambdaReg})] - ${gammaReg} = ${gain.toFixed(4)}.`,
      { gain, scoreL, scoreR, scoreP },
      i,
      bestSplitIdx,
    );

    if (gain > bestGain) {
      bestGain = gain;
      bestThreshold = (samples[i].x + samples[i + 1].x) / 2.0;
      bestSplitIdx = i;

      addStep(
        34,
        `New Best Split Found! Threshold t = ${bestThreshold.toFixed(2)}, Gain = ${bestGain.toFixed(4)}`,
        `Updated best threshold to ${bestThreshold.toFixed(2)} at split index ${i} with Gain = ${bestGain.toFixed(4)}.`,
        { bestGain, bestThreshold, bestSplitIdx },
        i,
        bestSplitIdx,
      );
    }
  }

  // Final step
  const roundedGain = Math.round(bestGain * 10000) / 10000;
  addStep(
    38,
    `Execution Complete: Return Best Threshold t = ${bestThreshold?.toFixed(2)}, Gain = ${roundedGain}`,
    `Completed Exact Greedy Split Search. Optimal split threshold t = ${bestThreshold?.toFixed(2)} at index ${bestSplitIdx} with Gain = ${roundedGain}.`,
    { bestThreshold: bestThreshold ?? 0, bestGain: roundedGain, bestSplitIdx, completed: true },
    -1,
    bestSplitIdx,
  );

  return steps;
};

const EXACT_GREEDY_SPLIT_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 9, 12, 16, 18, 23, 26, 27, 29, 30, 31, 32, 37],
  distractors: [
    "gain = (G_L / H_L) + (G_R / H_R)",
    "G_R = G_L + G_total",
    "best_threshold = samples[i][0]",
    "gain = 0.5 * (G_L + G_R)",
  ],
  hints: [
    { line: 28, hint: "XGBoost regularized gain formula: 0.5 * [ G_L^2/(H_L + lambda) + G_R^2/(H_R + lambda) - G_total^2/(H_total + lambda) ] - gamma." },
    { line: 35, hint: "Midpoint threshold formula between adjacent sorted feature values: (samples[i].x + samples[i+1].x) / 2." },
  ],
  lineExplanations: {
    1: "Defines entry point for exact_greedy_split_search function implementing XGBoost Algorithm 1.",
    2: "Docstring opening delimiter tag.",
    3: "Describes Exact Greedy Split Search algorithm (Chen & Guestrin 2016).",
    4: "Docstring continuation detailing sorting samples and accumulating gradient sums G_L, H_L and G_R, H_R.",
    5: "Docstring continuation detailing optimal threshold selection maximizing regularized Gain score.",
    6: "Docstring closing delimiter tag.",
    7: "Comment for sorting samples by feature value x.",
    8: "Sorts samples in ascending feature order as tuples (feature_values, gradients, hessians).",
    9: "Blank line before total sums computation.",
    10: "Sums total gradient G_total across all node samples.",
    11: "Sums total hessian H_total across all node samples.",
    12: "Blank line before best split accumulators initialization.",
    13: "Initializes best_gain to negative infinity.",
    14: "Initializes best_threshold to None.",
    15: "Initializes best_split_idx to -1.",
    16: "Blank line before left accumulators initialization.",
    17: "Initializes left gradient sum G_L = 0.0 and left hessian sum H_L = 0.0.",
    18: "Blank line before split search loop.",
    19: "Iterates over sample index i from 0 to len(samples) - 2.",
    20: "Unpacks sample i feature value x_val, gradient g_val, and hessian h_val.",
    21: "Accumulates sample gradient g_val into G_L: G_L += g_val.",
    22: "Accumulates sample hessian h_val into H_L: H_L += h_val.",
    23: "Blank line before right accumulators subtraction.",
    24: "Computes right gradient sum G_R = G_total - G_L in O(1) time.",
    25: "Computes right hessian sum H_R = H_total - H_L in O(1) time.",
    26: "Blank line before XGBoost gain calculation.",
    27: "Comment for XGBoost regularized split gain score.",
    28: "Evaluates XGBoost split gain equation with L2 regularization lambda and tree complexity penalty gamma.",
    29: "Left child score term: (G_L**2) / (H_L + lambda_reg).",
    30: "Right child score term: (G_R**2) / (H_R + lambda_reg).",
    31: "Parent node score subtraction term: (G_total**2) / (H_total + lambda_reg).",
    32: "Subtracts L1 tree complexity penalty gamma_reg.",
    33: "Checks if evaluated split gain exceeds current best_gain.",
    34: "Updates best_gain to current split gain.",
    35: "Calculates midpoint decision threshold best_threshold = (samples[i][0] + samples[i+1][0]) / 2.0.",
    36: "Updates best_split_idx to current index i.",
    37: "Blank line separating split search loop from return statement.",
    38: "Returns tuple (best_threshold, rounded best_gain, best_split_idx).",
    39: "Blank line at end of file.",
  },
};

export const exactGreedySplitSearch: AlgorithmDefinition<ExactGreedySplitSearchInput> = {
  id: "exactGreedySplitSearch",
  title: "XGBoost Exact Greedy Split Search",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Exact Greedy Split Search algorithm (XGBoost Algorithm 1, Chen & Guestrin 2016) finds the optimal split threshold $t^*$ across continuous feature values by accumulating 1st-order gradients $g_i$ and 2nd-order hessians $h_i$. By pre-sorting $N$ samples by feature value, the algorithm scans candidate split boundaries in a single pass, updating left gradient sums $G_L, H_L$ and right gradient sums $G_R, H_R$ in $O(1)$ time to maximize regularized Split Gain.\n\n### Why It Exists\nStandard decision trees (CART) use target values directly. Gradient Boosting Decision Trees (GBDTs) optimize arbitrary loss functions (Logistic Loss, MSE, Poisson, Cox) by fitting 2nd-order Taylor expansions $L^{(t)} \\approx \\sum [g_i f_t(x_i) + \\frac{1}{2} h_i f_t^2(x_i)] + \\Omega(f_t)$.\n\n### Mathematical Formulation\nFor node samples sorted by feature $X_j$, total gradients $G_{total} = \\sum g_i, H_{total} = \\sum h_i$, L2 regularization $\\lambda$, and leaf penalty $\\gamma$:\n\n$$1. \\quad G_L = \\sum_{i \\in I_L} g_i, \\quad H_L = \\sum_{i \\in I_L} h_i$$\n\n$$2. \\quad G_R = G_{total} - G_L, \\quad H_R = H_{total} - H_L$$\n\n$$3. \\quad \\text{Gain} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{G_{total}^2}{H_{total} + \\lambda} \\right] - \\gamma$$\n\n$$4. \\quad w_L^* = - \\frac{G_L}{H_L + \\lambda}, \\quad w_R^* = - \\frac{G_R}{H_R + \\lambda} \\quad (\\text{Optimal Leaf Weights})$$\n\n### Step-by-Step Intuition\n1. **Pre-sorting**: Sort samples by feature value $X_j$. Total time $O(N \\log N)$.\n2. **Total Sum Accumulation**: Compute $G_{total} = \\sum g_i$ and $H_{total} = \\sum h_i$.\n3. **Sequential Linear Scan**: Iterate from left to right, accumulating $G_L += g_i, H_L += h_i$.\n4. **O(1) Right Partition Evaluation**: Compute $G_R = G_{total} - G_L$ and $H_R = H_{total} - H_L$.\n5. **XGBoost Gain Evaluation**: Compute regularized Gain score and track maximum gain threshold $t^* = \\frac{x_i + x_{i+1}}{2}$.\n\n### Key Trade-Offs & Hardware Execution\n- **Exact vs Approximate (Histogram)**: Exact Greedy evaluates all $N-1$ candidate split points. For massive datasets ($N > 10^7$), histogram-based split search (Quantized Histograms in LightGBM/XGBoost) reduces candidates to $B \\approx 256$ bins, speeding up training by 10x-100x.\n- **L2 & Gamma Pruning**: If maximum Gain $< 0$ (due to $\\gamma > 0$), the node is pruned (pre-pruning).",
  constraints: [
    "1 <= N <= 1000000",
    "lambdaReg >= 0.0",
    "gammaReg >= 0.0",
  ],
  examples: [
    {
      kind: "basic",
      title: "10-Sample XGBoost Exact Greedy Split Search",
      inputDisplay: "10 samples sorted by x, lambda=1.0, gamma=0.1",
      outputDisplay: "Best Threshold t = 4.60, Gain = 0.5821",
      input: DEFAULT_EXACT_GREEDY_SPLIT_INPUT,
      output: "(4.6, 0.5821, 4)",
      explanation: "Scans 9 candidate split boundaries; optimal split between x=4.2 and x=5.0 (t=4.60) yields maximum Gain = 0.5821.",
    },
  ],
  code: EXACT_GREEDY_SPLIT_CODE,
  timeComplexity: {
    best: "O(N \\log N)",
    average: "O(N \\log N)",
    worst: "O(N \\log N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Sorting $N$ samples takes $O(N \\log N)$ time; linear scan takes $O(N)$ operations.",
    space: "Requires $O(N)$ memory to store sorted sample structs.",
  },
  topicGuide: {
    overview:
      "The Exact Greedy Split Search algorithm evaluates regularized split gain across pre-sorted feature values using gradient and hessian accumulators.",
    sections: [
      {
        heading: "Core Concept & XGBoost Algorithm 1",
        body: "XGBoost Algorithm 1 scans sorted feature values, accumulating G_L, H_L and computing G_R = G_total - G_L, H_R = H_total - H_L in O(1) time per candidate split.",
      },
      {
        heading: "Second-Order Taylor Loss Expansion",
        body: "Gradient boosting fits 2nd-order Taylor expansions L approx sum(g_i * f + 0.5 * h_i * f^2). Optimal leaf weight w = -G / (H + lambda) maximizes objective reduction.",
      },
      {
        heading: "Regularization & Pre-Pruning (Lambda and Gamma)",
        body: "L2 regularization lambda prevents extreme leaf weights. Complexity penalty gamma sets the minimum required Gain score for expanding a node (pre-pruning).",
      },
      {
        heading: "Exact Greedy vs Histogram-Based Split Search",
        body: "Exact Greedy scans all N-1 candidate splits in O(N log N) time. Histogram engines bin feature values into B bins (B=256), reducing split search time to O(B).",
      },
    ],
    keyTerms: [
      {
        term: "Exact Greedy Algorithm",
        definition: "XGBoost Algorithm 1 scanning all pre-sorted feature split boundaries to find exact global maximum Gain.",
      },
      {
        term: "Gradient (g_i)",
        definition: "First-order derivative of loss function with respect to current ensemble prediction.",
      },
      {
        term: "Hessian (h_i)",
        definition: "Second-order derivative of loss function measuring loss curvature.",
      },
      {
        term: "XGBoost Split Gain",
        definition: "Regularized score 0.5 * [ G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G_total^2/(H_total+lambda) ] - gamma.",
      },
    ],
  },
  trivia: EXACT_GREEDY_SPLIT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_EXACT_GREEDY_SPLIT_INPUT,
  generateSteps: generateExactGreedySplitSteps,
};
