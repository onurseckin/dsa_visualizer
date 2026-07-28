import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface XgboostSplitGainScoreCalculatorInput {
  GL?: number;
  HL?: number;
  GR?: number;
  HR?: number;
  lambdaReg?: number;
  gammaReg?: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_XGBOOST_SPLIT_GAIN_INPUT: XgboostSplitGainScoreCalculatorInput = {
  GL: -1.2,
  HL: 0.5,
  GR: 0.8,
  HR: 0.5,
  lambdaReg: 1.0,
  gammaReg: 0.0,
  data: [-1.2, 0.5, 0.8, 0.5],
  target: 0,
};

export const XGBOOST_SPLIT_GAIN_SCORE_CALCULATOR_CODE = `def xgboost_split_gain_score(G_L: float, H_L: float, G_R: float, H_R: float, lambda_reg: float = 1.0, gamma_reg: float = 0.0) -> tuple[float, float, float, float]:
    G_total = G_L + G_R
    H_total = H_L + H_R

    left_score = (G_L ** 2) / (H_L + lambda_reg)
    right_score = (G_R ** 2) / (H_R + lambda_reg)
    root_score = (G_total ** 2) / (H_total + lambda_reg)

    gain = 0.5 * (left_score + right_score - root_score) - gamma_reg
    return round(left_score, 4), round(right_score, 4), round(root_score, 4), round(gain, 4)`;

export const generateXgboostSplitGainScoreSteps = (
  input: XgboostSplitGainScoreCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const GL = input.GL ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.GL!;
  const HL = input.HL ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.HL!;
  const GR = input.GR ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.GR!;
  const HR = input.HR ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.HR!;
  const lambdaReg = input.lambdaReg ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.lambdaReg!;
  const gammaReg = input.gammaReg ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.gammaReg!;

  const Gtotal = GL + GR;
  const Htotal = HL + HR;
  const leftScore = (GL * GL) / (HL + lambdaReg);
  const rightScore = (GR * GR) / (HR + lambdaReg);
  const rootScore = (Gtotal * Gtotal) / (Htotal + lambdaReg);
  const gain = 0.5 * (leftScore + rightScore - rootScore) - gammaReg;

  const roundedLeft = Math.round(leftScore * 10000) / 10000;
  const roundedRight = Math.round(rightScore * 10000) / 10000;
  const roundedRoot = Math.round(rootScore * 10000) / 10000;
  const roundedGain = Math.round(gain * 10000) / 10000;

  const getSnapshot = (states: Record<string, ElementState> = {}) => {
    return {
      kind: "array" as const,
      elements: [
        {
          id: "e-gl",
          value: Number(GL.toFixed(2)),
          label: `G_L=${GL.toFixed(2)}`,
          state: states["gl"] || "default",
        },
        {
          id: "e-hl",
          value: Number(HL.toFixed(2)),
          label: `H_L=${HL.toFixed(2)}`,
          state: states["hl"] || "default",
        },
        {
          id: "e-gr",
          value: Number(GR.toFixed(2)),
          label: `G_R=${GR.toFixed(2)}`,
          state: states["gr"] || "default",
        },
        {
          id: "e-hr",
          value: Number(HR.toFixed(2)),
          label: `H_R=${HR.toFixed(2)}`,
          state: states["hr"] || "default",
        },
        {
          id: "e-gt",
          value: Number(Gtotal.toFixed(2)),
          label: `G_tot=${Gtotal.toFixed(2)}`,
          state: states["gt"] || "default",
        },
        {
          id: "e-ht",
          value: Number(Htotal.toFixed(2)),
          label: `H_tot=${Htotal.toFixed(2)}`,
          state: states["ht"] || "default",
        },
        {
          id: "e-sl",
          value: Number(roundedLeft.toFixed(4)),
          label: `Score_L=${roundedLeft.toFixed(4)}`,
          state: states["sl"] || "default",
        },
        {
          id: "e-sr",
          value: Number(roundedRight.toFixed(4)),
          label: `Score_R=${roundedRight.toFixed(4)}`,
          state: states["sr"] || "default",
        },
        {
          id: "e-sp",
          value: Number(roundedRoot.toFixed(4)),
          label: `Score_P=${roundedRoot.toFixed(4)}`,
          state: states["sp"] || "default",
        },
        {
          id: "e-gain",
          value: Number(roundedGain.toFixed(4)),
          label: `Gain=${roundedGain.toFixed(4)}`,
          state: states["gain"] || "default",
        },
      ],
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    states: Record<string, ElementState> = {},
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(states),
      auxiliaryState: {
        customState: {
          Algorithm: "XGBoost 2nd-Order Split Gain Score",
          G_L: GL.toFixed(4),
          H_L: HL.toFixed(4),
          G_R: GR.toFixed(4),
          H_R: HR.toFixed(4),
          lambda: String(lambdaReg),
          gamma: String(gammaReg),
          G_total: Gtotal.toFixed(4),
          H_total: Htotal.toFixed(4),
          left_score: roundedLeft.toFixed(4),
          right_score: roundedRight.toFixed(4),
          root_score: roundedRoot.toFixed(4),
          gain: roundedGain.toFixed(4),
        },
      },
      variables,
    });
  };

  // Line 1: Function entry
  addStep(
    1,
    "Initialize XGBoost Split Gain Score Calculator",
    `Started split gain evaluation with parameters: G_L=${GL}, H_L=${HL}, G_R=${GR}, H_R=${HR}, lambda=${lambdaReg}, gamma=${gammaReg}.`,
    { GL, HL, GR, HR, lambdaReg, gammaReg },
    { gl: "active", hl: "active", gr: "active", hr: "active" },
  );

  // Line 2: G_total = G_L + G_R
  addStep(
    2,
    `Calculate Parent Gradient Sum: G_total = G_L + G_R = ${Gtotal.toFixed(4)}`,
    `Summed left (${GL.toFixed(4)}) and right (${GR.toFixed(4)}) leaf gradients into G_total = ${Gtotal.toFixed(4)}.`,
    { G_total: Gtotal, G_L: GL, G_R: GR },
    { gl: "visited", gr: "visited", gt: "active" },
  );

  // Line 3: H_total = H_L + H_R
  addStep(
    3,
    `Calculate Parent Hessian Sum: H_total = H_L + H_R = ${Htotal.toFixed(4)}`,
    `Summed left (${HL.toFixed(4)}) and right (${HR.toFixed(4)}) leaf hessians into H_total = ${Htotal.toFixed(4)}.`,
    { H_total: Htotal, H_L: HL, H_R: HR },
    { hl: "visited", hr: "visited", ht: "active" },
  );

  // Line 5: left_score = (G_L ** 2) / (H_L + lambda_reg)
  addStep(
    5,
    `Calculate Left Leaf Regularized Score: left_score = ${roundedLeft.toFixed(4)}`,
    `Evaluated left_score = G_L^2 / (H_L + lambda) = (${GL.toFixed(2)})^2 / (${HL.toFixed(2)} + ${lambdaReg}) = ${roundedLeft.toFixed(4)}.`,
    { left_score: roundedLeft, G_L: GL, H_L: HL, lambda_reg: lambdaReg },
    { gl: "visited", hl: "visited", sl: "active" },
  );

  // Line 6: right_score = (G_R ** 2) / (H_R + lambda_reg)
  addStep(
    6,
    `Calculate Right Leaf Regularized Score: right_score = ${roundedRight.toFixed(4)}`,
    `Evaluated right_score = G_R^2 / (H_R + lambda) = (${GR.toFixed(2)})^2 / (${HR.toFixed(2)} + ${lambdaReg}) = ${roundedRight.toFixed(4)}.`,
    { right_score: roundedRight, G_R: GR, H_R: HR, lambda_reg: lambdaReg },
    { gr: "visited", hr: "visited", sr: "active" },
  );

  // Line 7: root_score = (G_total ** 2) / (H_total + lambda_reg)
  addStep(
    7,
    `Calculate Parent Root Regularized Score: root_score = ${roundedRoot.toFixed(4)}`,
    `Evaluated root_score = G_total^2 / (H_total + lambda) = (${Gtotal.toFixed(2)})^2 / (${Htotal.toFixed(2)} + ${lambdaReg}) = ${roundedRoot.toFixed(4)}.`,
    { root_score: roundedRoot, G_total: Gtotal, H_total: Htotal, lambda_reg: lambdaReg },
    { gt: "visited", ht: "visited", sp: "active" },
  );

  // Line 9: gain = 0.5 * (left_score + right_score - root_score) - gamma_reg
  const rawGain = 0.5 * (leftScore + rightScore - rootScore);
  addStep(
    9,
    `Calculate Net Regularized Split Gain: Gain = ${roundedGain.toFixed(4)}`,
    `Evaluated Gain = 0.5 * (${roundedLeft.toFixed(4)} + ${roundedRight.toFixed(4)} - ${roundedRoot.toFixed(4)}) - ${gammaReg} = ${roundedGain.toFixed(4)}.`,
    {
      gain: roundedGain,
      rawGain,
      left_score: roundedLeft,
      right_score: roundedRight,
      root_score: roundedRoot,
      gamma_reg: gammaReg,
    },
    { sl: "visited", sr: "visited", sp: "visited", gain: "active" },
  );

  // Line 9 (continued logic step): Evaluate Pruning Decision
  const shouldPrune = gain <= 0;
  addStep(
    9,
    `Evaluate Split Pruning Decision: ${shouldPrune ? "Pre-prune (Reject Split)" : "Accept Split"}`,
    shouldPrune
      ? `Net Gain (${roundedGain.toFixed(4)}) <= 0: Tree regularization penalty exceeds loss reduction. Node split is rejected (pruned).`
      : `Net Gain (${roundedGain.toFixed(4)}) > 0: Regularized objective improves by splitting. Candidate node split is accepted!`,
    { gain: roundedGain, shouldPrune, splitAccepted: !shouldPrune },
    { sl: "visited", sr: "visited", sp: "visited", gain: shouldPrune ? "compare" : "sorted" },
  );

  // Line 10: return round(...)
  addStep(
    10,
    `Return Final Scores: (left=${roundedLeft}, right=${roundedRight}, root=${roundedRoot}, gain=${roundedGain})`,
    `Algorithm completed. Returned regularized leaf scores and net split gain tuple.`,
    {
      left_score: roundedLeft,
      right_score: roundedRight,
      root_score: roundedRoot,
      gain: roundedGain,
    },
    { sl: "sorted", sr: "sorted", sp: "sorted", gain: "sorted" },
  );

  return steps;
};

const XGBOOST_SPLIT_GAIN_SCORE_CALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [4, 8],
  distractors: [
    "gain = (G_L ** 2) / H_L + (G_R ** 2) / H_R",
    "gain = 0.5 * (left_score + right_score) + gamma_reg",
    "root_score = (G_L + G_R) / (H_L + H_R)",
    "gain = left_score - right_score",
  ],
  hints: [
    {
      line: 9,
      hint: "XGBoost split gain equation: 0.5 * [ G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G_total^2/(H_total+lambda) ] - gamma.",
    },
  ],
  lineExplanations: {
    1: "Defines entry point for xgboost_split_gain_score function with leaf gradients, hessians, and regularization parameters.",
    2: "Calculates parent node gradient sum G_total = G_L + G_R.",
    3: "Calculates parent node hessian sum H_total = H_L + H_R.",
    4: "Empty line separator.",
    5: "Computes regularized left child objective improvement score = G_L^2 / (H_L + lambda).",
    6: "Computes regularized right child objective improvement score = G_R^2 / (H_R + lambda).",
    7: "Computes regularized parent root objective score = G_total^2 / (H_total + lambda).",
    8: "Empty line separator.",
    9: "Computes net regularized split gain score = 0.5 * (left_score + right_score - root_score) - gamma.",
    10: "Returns tuple of rounded (left_score, right_score, root_score, gain).",
  },
};

export const xgboostSplitGainScoreCalculator: AlgorithmDefinition<XgboostSplitGainScoreCalculatorInput> =
  {
    id: "xgboost-split-gain-score-calculator",
    title: "XGBoost Split Gain Score Calculator",
    topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Medium",
    description:
      "The XGBoost Split Gain Score Calculator evaluates the regularized 2nd-order objective reduction (Gain) achieved when splitting a node into left and right children in **XGBoost (Extreme Gradient Boosting)**. Derived by Tianqi Chen & Carlos Guestrin (KDD 2016), this formula measures the exact reduction in the 2nd-order Taylor loss expansion, penalizing tree structure complexity via $L_2$ leaf regularization $\\lambda$ and leaf expansion penalty $\\gamma$.\n\n### Why It Exists\nStandard decision trees (CART) maximize variance reduction or Gini gain. XGBoost generalizes tree splitting to arbitrary differentiable loss functions (Logistic Loss, Softmax, Cox, Huber) by approximating loss via 2nd-order Taylor expansion $L^{(t)} \\approx \\sum [g_i f + \\frac{1}{2} h_i f^2] + \\gamma T + \\frac{1}{2} \\lambda \\sum w_j^2$.\n\n### Mathematical Formulation\nFor left child gradient/hessian $(G_L, H_L)$, right child $(G_R, H_R)$, total parent $(G_{total}, H_{total})$, $L_2$ penalty $\\lambda$, and leaf penalty $\\gamma$:\n\n$$1. \\quad \\text{Score}(L) = \\frac{G_L^2}{H_L + \\lambda}, \\quad \\text{Score}(R) = \\frac{G_R^2}{H_R + \\lambda}, \\quad \\text{Score}(P) = \\frac{G_{total}^2}{H_{total} + \\lambda}$$\n\n$$2. \\quad \\text{Gain} = \\frac{1}{2} \\left[ \\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{(G_L + G_R)^2}{H_L + H_R + \\lambda} \\right] - \\gamma$$\n\n### Step-by-Step Intuition\n1. **Total Sums**: Sum parent gradients $G_{total} = G_L + G_R$ and hessians $H_{total} = H_L + H_R$.\n2. **Left Score**: Compute regularized objective improvement for left child $\\frac{G_L^2}{H_L + \\lambda}$.\n3. **Right Score**: Compute regularized objective improvement for right child $\\frac{G_R^2}{H_R + \\lambda}$.\n4. **Parent Subtraction**: Subtract un-split parent node objective score $\\frac{G_{total}^2}{H_{total} + \\lambda}$.\n5. **Gamma Complexity Penalty**: Multiply by $0.5$ and subtract minimum gain requirement $\\gamma$.\n\n### Key Trade-Offs & Hardware Execution\n- **Post-Pruning vs Pre-Pruning**: If net $\\text{Gain} \\le 0$, expanding the node increases overall objective cost. Nodes with negative gain are pruned.\n- **L2 Regularization ($\\lambda$)**: High $\\lambda$ dampens individual score terms, favoring balanced splits with large hessian counts.",
    constraints: [
      "lambdaReg >= 0.0",
      "gammaReg >= 0.0",
      "H_L + lambdaReg > 0",
      "H_R + lambdaReg > 0",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard Split Gain Evaluation (lambda=1.0, gamma=0.0)",
        inputDisplay: "G_L = -1.2, H_L = 0.5, G_R = 0.8, H_R = 0.5, lambda = 1.0",
        outputDisplay: "Left = 0.96, Right = 0.4267, Root = 0.08, Gain = 0.6533",
        input: DEFAULT_XGBOOST_SPLIT_GAIN_INPUT,
        output: "(0.96, 0.4267, 0.08, 0.6533)",
        explanation: "Evaluates split gain: 0.5 * (0.96 + 0.4267 - 0.08) - 0.0 = 0.6533.",
      },
    ],
    code: XGBOOST_SPLIT_GAIN_SCORE_CALCULATOR_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Evaluates closed-form 2nd-order split gain formula in $O(1)$ constant time.",
      space: "Requires $O(1)$ auxiliary space.",
    },
    topicGuide: {
      overview:
        "The XGBoost Split Gain Score Calculator computes regularized 2nd-order Taylor expansion split gain across candidate node partitions.",
      sections: [
        {
          heading: "Core Concept & 2nd-Order Taylor Objective",
          body: "XGBoost evaluates split quality by calculating net objective reduction: Gain = 0.5 * [ G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G_total^2/(H_total+lambda) ] - gamma.",
        },
        {
          heading: "Role of L2 Regularization (Lambda)",
          body: "L2 penalty lambda adds to denominators (H + lambda), dampening leaf weights and preventing over-fitting on small sample partitions.",
        },
        {
          heading: "Tree Pruning via Complexity Penalty (Gamma)",
          body: "Gamma defines the minimum required Gain score for expanding a node. If net Gain < 0, the split is pruned.",
        },
        {
          heading: "Closed-Form O(1) Evaluation",
          body: "Because G_L, H_L, G_R, H_R are pre-accumulated, evaluating XGBoost split gain takes O(1) time per candidate split.",
        },
      ],
      keyTerms: [
        {
          term: "XGBoost Split Gain",
          definition: "Net 2nd-order objective reduction score evaluating candidate node splits.",
        },
        {
          term: "L2 Regularization (Lambda)",
          definition:
            "Penalty term lambda adding to denominator (H + lambda) to control leaf weights.",
        },
        {
          term: "Gamma Complexity Penalty",
          definition: "Minimum required gain threshold gamma for expanding a decision tree node.",
        },
        {
          term: "Root Score",
          definition: "Un-split parent node score term G_total^2 / (H_total + lambda).",
        },
      ],
    },
    trivia: XGBOOST_SPLIT_GAIN_SCORE_CALCULATOR_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_XGBOOST_SPLIT_GAIN_INPUT,
    generateSteps: generateXgboostSplitGainScoreSteps,
  };
