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
    """
    Calculates the XGBoost 2nd-order Taylor expansion split gain score (Chen & Guestrin 2016).
    Gain = 0.5 * [ G_L^2 / (H_L + lambda) + G_R^2 / (H_R + lambda) - (G_L + G_R)^2 / (H_L + H_R + lambda) ] - gamma.
    Returns (left_score, right_score, root_score, gain).
    """
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

  const getSnapshot = (
    activeIdx: number = -1,
  ) => {
    return {
      kind: "array" as const,
      elements: [
        { id: "e-0", value: Math.round(GL * 10), label: `G_L=${GL.toFixed(2)}`, state: activeIdx === 0 ? ("active" as ElementState) : ("default" as ElementState) },
        { id: "e-1", value: Math.round(HL * 10), label: `H_L=${HL.toFixed(2)}`, state: activeIdx === 1 ? ("active" as ElementState) : ("default" as ElementState) },
        { id: "e-2", value: Math.round(GR * 10), label: `G_R=${GR.toFixed(2)}`, state: activeIdx === 2 ? ("active" as ElementState) : ("default" as ElementState) },
        { id: "e-3", value: Math.round(HR * 10), label: `H_R=${HR.toFixed(2)}`, state: activeIdx === 3 ? ("active" as ElementState) : ("default" as ElementState) },
        { id: "e-4", value: Math.round(Gtotal * 10), label: `G_total=${Gtotal.toFixed(2)}`, state: activeIdx === 4 ? ("visited" as ElementState) : ("default" as ElementState) },
        { id: "e-5", value: Math.round(Htotal * 10), label: `H_total=${Htotal.toFixed(2)}`, state: activeIdx === 5 ? ("visited" as ElementState) : ("default" as ElementState) },
      ],
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number = -1,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeIdx),
      auxiliaryState: {
        customState: {
          "Algorithm": "XGBoost 2nd-Order Split Gain Score",
          "G_L": GL.toFixed(4),
          "H_L": HL.toFixed(4),
          "G_R": GR.toFixed(4),
          "H_R": HR.toFixed(4),
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
    "Initialize XGBoost 2nd-Order Split Gain Score Calculation",
    `Started XGBoost split gain calculation for Left (G_L=${GL}, H_L=${HL}) and Right (G_R=${GR}, H_R=${HR}) with lambda=${lambdaReg}, gamma=${gammaReg}.`,
    { GL, HL, GR, HR, lambdaReg, gammaReg },
  );

  // Step 2: Read G_L
  addStep(
    1,
    `Read Left Child Gradient: G_L = ${GL.toFixed(4)}`,
    `Loaded left child gradient sum G_L = ${GL.toFixed(4)}.`,
    { GL },
    0,
  );

  // Step 3: Read H_L
  addStep(
    1,
    `Read Left Child Hessian: H_L = ${HL.toFixed(4)}`,
    `Loaded left child hessian sum H_L = ${HL.toFixed(4)}.`,
    { HL },
    1,
  );

  // Step 4: Read G_R
  addStep(
    1,
    `Read Right Child Gradient: G_R = ${GR.toFixed(4)}`,
    `Loaded right child gradient sum G_R = ${GR.toFixed(4)}.`,
    { GR },
    2,
  );

  // Step 5: Read H_R
  addStep(
    1,
    `Read Right Child Hessian: H_R = ${HR.toFixed(4)}`,
    `Loaded right child hessian sum H_R = ${HR.toFixed(4)}.`,
    { HR },
    3,
  );

  // Step 6: Read lambda
  addStep(
    1,
    `Read L2 Regularization Parameter: lambda_reg = ${lambdaReg}`,
    `Loaded L2 leaf weight regularization parameter lambda_reg = ${lambdaReg}.`,
    { lambdaReg },
  );

  // Step 7: Read gamma
  addStep(
    1,
    `Read Tree Complexity Penalty: gamma_reg = ${gammaReg}`,
    `Loaded minimum gain complexity penalty gamma_reg = ${gammaReg}.`,
    { gammaReg },
  );

  // Step 8: Compute G_total (7)
    addStep(
    2,
    "Function docstring — describes algorithm contract",
    "Opening delimiter of the Python docstring.",
    {},
  );

  addStep(
    3,
    "Docstring body: algorithm description",
    "Calculates the XGBoost 2nd-order Taylor expansion split gain score (Chen & ",
    {},
  );

  addStep(
    4,
    "Docstring body: algorithm description",
    "Gain = 0.5 * [ G_L^2 / (H_L + lambda) + G_R^2 / (H_R + lambda) - (G_L + G_R",
    {},
  );

  addStep(
    5,
    "Docstring body: algorithm description",
    "Returns (left_score, right_score, root_score, gain).",
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
    `Calculate Total Parent Gradient: G_total = G_L + G_R = ${Gtotal.toFixed(4)}`,
    `Evaluated G_total = ${GL.toFixed(4)} + ${GR.toFixed(4)} = ${Gtotal.toFixed(4)}.`,
    { Gtotal, GL, GR },
    4,
  );

  // Step 9: Compute H_total (8)
  addStep(
    8,
    `Calculate Total Parent Hessian: H_total = H_L + H_R = ${Htotal.toFixed(4)}`,
    `Evaluated H_total = ${HL.toFixed(4)} + ${HR.toFixed(4)} = ${Htotal.toFixed(4)}.`,
    { Htotal, HL, HR },
    5,
  );

  // Step 10: Compute left_score (10)
  addStep(
    10,
    `Calculate Left Child Regularized Score: left_score = ${leftScore.toFixed(4)}`,
    `Evaluated left_score = (G_L^2) / (H_L + lambda) = (${GL.toFixed(2)}^2) / (${HL.toFixed(2)} + ${lambdaReg}) = ${leftScore.toFixed(4)}.`,
    { leftScore, GL, HL, lambdaReg },
    0,
  );

  // Step 11: Compute right_score (11)
  addStep(
    11,
    `Calculate Right Child Regularized Score: right_score = ${rightScore.toFixed(4)}`,
    `Evaluated right_score = (G_R^2) / (H_R + lambda) = (${GR.toFixed(2)}^2) / (${HR.toFixed(2)} + ${lambdaReg}) = ${rightScore.toFixed(4)}.`,
    { rightScore, GR, HR, lambdaReg },
    2,
  );

  // Step 12: Compute root_score (12)
  addStep(
    12,
    `Calculate Parent Root Regularized Score: root_score = ${rootScore.toFixed(4)}`,
    `Evaluated root_score = (G_total^2) / (H_total + lambda) = (${Gtotal.toFixed(2)}^2) / (${Htotal.toFixed(2)} + ${lambdaReg}) = ${rootScore.toFixed(4)}.`,
    { rootScore, Gtotal, Htotal, lambdaReg },
    4,
  );

  // Step 13: Calculate raw gain
  const rawGain = 0.5 * (leftScore + rightScore - rootScore);
  addStep(
    14,
    `Calculate Raw Unpenalized Split Gain = ${rawGain.toFixed(4)}`,
    `Evaluated raw gain = 0.5 * (${leftScore.toFixed(4)} + ${rightScore.toFixed(4)} - ${rootScore.toFixed(4)}) = ${rawGain.toFixed(4)}.`,
    { rawGain, leftScore, rightScore, rootScore },
  );

  // Step 14: Subtract gamma_reg (14)
  addStep(
    14,
    `Subtract Tree Complexity Penalty gamma_reg = ${gammaReg}: Gain = ${gain.toFixed(4)}`,
    `Evaluated net Gain = raw_gain (${rawGain.toFixed(4)}) - gamma (${gammaReg}) = ${gain.toFixed(4)}.`,
    { gain, rawGain, gammaReg },
  );

  // Step 15: Check pruning
  const shouldPrune = gain <= 0;
  addStep(
    14,
    `Check Tree Pruning Condition: Should Node Split?`,
    shouldPrune
      ? `Net Gain (${gain.toFixed(4)}) <= 0 -> Node should be pre-pruned (split rejected).`
      : `Net Gain (${gain.toFixed(4)}) > 0 -> Split accepted! Node expansion continues.`,
    { gain, shouldPrune },
  );

  // Step 16..20: Round results and return (15)
  const roundedLeft = Math.round(leftScore * 10000) / 10000;
  const roundedRight = Math.round(rightScore * 10000) / 10000;
  const roundedRoot = Math.round(rootScore * 10000) / 10000;
  const roundedGain = Math.round(gain * 10000) / 10000;

  addStep(
    15,
    "Round Left Score to 4 Decimal Places",
    `Rounded left_score to ${roundedLeft}.`,
    { roundedLeft },
  );

  addStep(
    15,
    "Round Right Score to 4 Decimal Places",
    `Rounded right_score to ${roundedRight}.`,
    { roundedRight },
  );

  addStep(
    15,
    "Round Root Score to 4 Decimal Places",
    `Rounded root_score to ${roundedRoot}.`,
    { roundedRoot },
  );

  addStep(
    15,
    "Round Final Gain to 4 Decimal Places",
    `Rounded gain to ${roundedGain}.`,
    { roundedGain },
  );

  addStep(
    15,
    `Execution Complete: Return (left=${roundedLeft}, right=${roundedRight}, root=${roundedRoot}, gain=${roundedGain})`,
    `Successfully calculated XGBoost split gain score. Net Gain = ${roundedGain}.`,
    { left: roundedLeft, right: roundedRight, root: roundedRoot, gain: roundedGain, completed: true },
  );

  return steps;
};

const XGBOOST_SPLIT_GAIN_SCORE_CALCULATOR_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 9, 13],
  distractors: [
    "gain = (G_L ** 2) / H_L + (G_R ** 2) / H_R",
    "gain = 0.5 * (left_score + right_score) + gamma_reg",
    "root_score = (G_L + G_R) / (H_L + H_R)",
    "gain = left_score - right_score",
  ],
  hints: [
    { line: 14, hint: "XGBoost split gain equation: 0.5 * [ G_L^2/(H_L+lambda) + G_R^2/(H_R+lambda) - G_total^2/(H_total+lambda) ] - gamma." },
  ],
  lineExplanations: {
    1: "Defines entry point for xgboost_split_gain_score function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes calculation of XGBoost 2nd-order Taylor expansion split gain score (Chen & Guestrin 2016).",
    4: "Docstring XGBoost split gain formula line.",
    5: "Docstring return signature tuple detail.",
    6: "Docstring closing delimiter tag.",
    7: "Sums total parent gradient G_total = G_L + G_R.",
    8: "Sums total parent hessian H_total = H_L + H_R.",
    9: "Blank line before score evaluations.",
    10: "Evaluates left child regularized score: left_score = (G_L ** 2) / (H_L + lambda_reg).",
    11: "Evaluates right child regularized score: right_score = (G_R ** 2) / (H_R + lambda_reg).",
    12: "Evaluates parent root regularized score: root_score = (G_total ** 2) / (H_total + lambda_reg).",
    13: "Blank line before gain calculation.",
    14: "Evaluates net regularized split gain score subtracting tree complexity penalty gamma_reg.",
    15: "Returns tuple of (rounded left_score, right_score, root_score, gain).",
  },
};

export const xgboostSplitGainScoreCalculator: AlgorithmDefinition<XgboostSplitGainScoreCalculatorInput> =
  {
    id: "xgboostSplitGainScoreCalculator",
    title: "XGBoost Split Gain Score Calculator",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 8,
    mlInfraCategory: "ml_tree_ensembles",
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
          definition: "Penalty term lambda adding to denominator (H + lambda) to control leaf weights.",
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
