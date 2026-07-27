import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface XgboostSplitGainScoreCalculatorInput {
  GL: number;
  HL: number;
  GR: number;
  HR: number;
  lambdaReg: number;
  gammaReg: number;
}

export const DEFAULT_XGBOOST_SPLIT_GAIN_INPUT: XgboostSplitGainScoreCalculatorInput = {
  GL: -1.2,
  HL: 0.5,
  GR: 0.8,
  HR: 0.5,
  lambdaReg: 1.0,
  gammaReg: 0.0,
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

  const GL = input.GL ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.GL;
  const HL = input.HL ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.HL;
  const GR = input.GR ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.GR;
  const HR = input.HR ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.HR;
  const lambdaReg = input.lambdaReg ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.lambdaReg;
  const gammaReg = input.gammaReg ?? DEFAULT_XGBOOST_SPLIT_GAIN_INPUT.gammaReg;

  const Gtotal = GL + GR;
  const Htotal = HL + HR;

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize XGBoost 2nd-Order Split Gain Score Calculation",
      why: `Left node (G_L = ${GL}, H_L = ${HL}), Right node (G_R = ${GR}, H_R = ${HR}), L2 lambda = ${lambdaReg}, Gamma penalty γ = ${gammaReg}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: [
        {
          id: "e-0",
          value: Math.round(GL * 10),
          label: `G_L = ${GL}`,
          state: "default" as ElementState,
        },
        {
          id: "e-1",
          value: Math.round(HL * 10),
          label: `H_L = ${HL}`,
          state: "default" as ElementState,
        },
        {
          id: "e-2",
          value: Math.round(GR * 10),
          label: `G_R = ${GR}`,
          state: "default" as ElementState,
        },
        {
          id: "e-3",
          value: Math.round(HR * 10),
          label: `H_R = ${HR}`,
          state: "default" as ElementState,
        },
      ],
    },
    auxiliaryState: {
      customState: {
        G_total: Gtotal.toFixed(2),
        H_total: Htotal.toFixed(2),
        lambdaReg: String(lambdaReg),
        gammaReg: String(gammaReg),
        status: "Initialized",
      },
    },
    variables: { GL, HL, GR, HR, Gtotal, Htotal },
  });

  // Step 1: Parent Root Score
  const rootScore = Gtotal ** 2 / (Htotal + lambdaReg);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: "Compute Parent Node Root Score",
      why: `Root Score = G_total^2 / (H_total + λ) = (${Gtotal.toFixed(2)})^2 / (${Htotal.toFixed(
        2,
      )} + ${lambdaReg}) = ${rootScore.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: [
        {
          id: "e-0",
          value: Math.round(Gtotal * 10),
          label: `G_tot=${Gtotal.toFixed(2)}`,
          state: "active" as ElementState,
        },
        {
          id: "e-1",
          value: Math.round(Htotal * 10),
          label: `H_tot=${Htotal.toFixed(2)}`,
          state: "active" as ElementState,
        },
        {
          id: "e-2",
          value: Math.round(rootScore * 10),
          label: `Score=${rootScore.toFixed(2)}`,
          state: "visited" as ElementState,
        },
      ],
    },
    auxiliaryState: {
      customState: {
        rootScore: rootScore.toFixed(4),
      },
    },
    variables: { rootScore: Math.round(rootScore * 10000) / 10000 },
  });

  // Step 2: Left and Right Child Scores
  const leftScore = GL ** 2 / (HL + lambdaReg);
  const rightScore = GR ** 2 / (HR + lambdaReg);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: "Compute Left and Right Child Node Scores",
      why: `Left Score = ${leftScore.toFixed(4)}, Right Score = ${rightScore.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: [
        {
          id: "e-0",
          value: Math.round(leftScore * 10),
          label: `Left=${leftScore.toFixed(2)}`,
          state: "active" as ElementState,
        },
        {
          id: "e-1",
          value: Math.round(rightScore * 10),
          label: `Right=${rightScore.toFixed(2)}`,
          state: "active" as ElementState,
        },
      ],
    },
    auxiliaryState: {
      customState: {
        leftScore: leftScore.toFixed(4),
        rightScore: rightScore.toFixed(4),
        rootScore: rootScore.toFixed(4),
      },
    },
    variables: { leftScore, rightScore, rootScore },
  });

  // Step 3: Gain & Gamma Penalty
  const rawGain = 0.5 * (leftScore + rightScore - rootScore);
  const netGain = rawGain - gammaReg;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 16,
    explanation: {
      what: `Compute Final Regularized Gain Score: ${netGain.toFixed(4)}`,
      why: `Gain = 0.5 * (${leftScore.toFixed(4)} + ${rightScore.toFixed(4)} - ${rootScore.toFixed(
        4,
      )}) - ${gammaReg} = ${netGain.toFixed(4)}. ${
        netGain > 0 ? "Split accepted (Gain > 0)." : "Split rejected / pruned (Gain <= 0)."
      }`,
    },
    primarySnapshot: {
      kind: "array",
      elements: [
        {
          id: "e-0",
          value: Math.round(netGain * 100),
          label: `Gain=${netGain.toFixed(4)}`,
          state: netGain > 0 ? ("sorted" as ElementState) : ("compare" as ElementState),
        },
      ],
    },
    auxiliaryState: {
      customState: {
        rawGain: rawGain.toFixed(4),
        gammaReg: String(gammaReg),
        netGain: netGain.toFixed(4),
        accepted: String(netGain > 0),
        status: "Completed",
      },
    },
    variables: { netGain, accepted: netGain > 0, complete: true },
  });

  return steps;
};

const XGBOOST_SPLIT_GAIN_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: ["return None"],
  hints: [{ line: 1, hint: "Calculate 2nd order Taylor expansion gain." }],
  lineExplanations: { 1: "Defines entry point for XGBoost Gain calculation." },
};

export const xgboostSplitGainScoreCalculator: AlgorithmDefinition<XgboostSplitGainScoreCalculatorInput> =
  {
    id: "xgboostSplitGainScoreCalculator",
    title: "XGBoost 2nd-Order Split Gain Score Calculator",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles", "tree_fundamentals"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 9,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Calculates the exact regularized split gain score in XGBoost (Chen & Guestrin 2016) using 2nd-order Taylor expansions of the loss function. The Gain measures the loss reduction achieved when partitioning a parent node into left and right children, balancing gradient reduction against L2 regularization (λ) and node complexity penalty (γ).\n\nInput Format:\n- GL: Sum of 1st-order gradients in Left child.\n- HL: Sum of 2nd-order Hessians in Left child.\n- GR: Sum of 1st-order gradients in Right child.\n- HR: Sum of 2nd-order Hessians in Right child.\n- lambdaReg: L2 leaf weight regularization parameter λ.\n- gammaReg: Split complexity penalty γ.\n\nOutput Format:\n- Returns tuple (leftScore, rightScore, rootScore, netGain).\n\nEdge Cases & Constraints:\n- Negative Net Gain: Indicates that split quality is insufficient to justify adding a tree node (triggering tree pruning).\n- Zero Hessians + Zero Lambda: Division by zero avoided by requiring λ > 0 or adding ε smoothing.",
    constraints: [
      "HL + lambdaReg > 0.0.",
      "HR + lambdaReg > 0.0.",
      "lambdaReg >= 0.0.",
      "gammaReg >= 0.0.",
    ],
    examples: [
      {
        kind: "basic",
        title: "Standard Split Gain Calculation",
        inputDisplay: "GL = -1.2, HL = 0.5, GR = 0.8, HR = 0.5, lambda = 1.0, gamma = 0.0",
        outputDisplay: "Net Gain = 0.3227",
        input: DEFAULT_XGBOOST_SPLIT_GAIN_INPUT,
        output: "Gain = 0.3227",
        explanation:
          "Computes regularized scores for left, right, and root nodes to determine net loss gain.",
      },
      {
        kind: "complex",
        title: "Split Pruning via Gamma Penalty",
        inputDisplay: "gammaReg = 0.5 (exceeds raw gain 0.3227)",
        outputDisplay: "Net Gain = -0.1773 (Pruned)",
        input: {
          ...DEFAULT_XGBOOST_SPLIT_GAIN_INPUT,
          gammaReg: 0.5,
        },
        output: "Gain = -0.1773 (Pruned)",
        explanation: "Gamma complexity penalty reduces net gain below zero, pruning the split.",
      },
      {
        kind: "negative",
        title: "Symmetric Zero Gradient Split",
        inputDisplay: "GL = 0.0, GR = 0.0",
        outputDisplay: "Gain = 0.0000",
        input: {
          GL: 0.0,
          HL: 1.0,
          GR: 0.0,
          HR: 1.0,
          lambdaReg: 1.0,
          gammaReg: 0.0,
        },
        output: "Gain = 0.0000",
        explanation: "Zero gradients yield zero loss gain across children.",
      },
    ],
    code: XGBOOST_SPLIT_GAIN_SCORE_CALCULATOR_CODE,
    timeComplexity: {
      best: "O(1)",
      average: "O(1)",
      worst: "O(1)",
    },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(1) constant time floating-point arithmetic operations.",
      space: "O(1) constant space requirement.",
    },
    topicGuide: {
      overview:
        "The XGBoost split gain score is derived from a 2nd-order Taylor expansion of the objective function L^(t) approx sum [ g_i w_q(x_i) + 0.5 h_i w_q(x_i)^2 ] + gamma T + 0.5 lambda sum w_j^2. This enables unified split evaluation across arbitrary differentiable loss functions.",
      sections: [
        {
          heading: "Overview & Mathematical Formulation",
          body: "The optimal score of a tree node is max_w [ G w + 0.5 (H + lambda) w^2 ] = -0.5 G^2 / (H + lambda). The net gain from splitting a parent into left and right children is Gain = 0.5 * [ G_L^2 / (H_L + lambda) + G_R^2 / (H_R + lambda) - G_{total}^2 / (H_{total} + lambda) ] - gamma.",
        },
        {
          heading: "Core Concepts & Role of Regularization",
          body: "L2 regularization lambda prevents extreme leaf weights in sparse feature regions (where H is small). Gamma regularization serves as an explicit cost-complexity penalty for model tree size control.",
        },
        {
          heading: "Systems & Performance Impact",
          body: "Because Gain relies only on scalar aggregates (G_L, H_L, G_R, H_R), hardware kernels can compute millions of candidate split gain scores per second in SIMD/CUDA loops without accessing sample data.",
        },
        {
          heading: "Implementation Nuances & Pruning Strategies",
          body: "In post-pruning GBDTs, splits with negative net gain (Gain < 0) are recursively collapsed back into leaf nodes from bottom up.",
        },
      ],
      keyTerms: [
        {
          term: "2nd-Order Gain Score",
          definition:
            "Formula for loss reduction derived from Taylor expansion of objective functions.",
        },
        {
          term: "L2 Leaf Regularization (λ)",
          definition:
            "Penalty term added to leaf Hessians preventing unbounded leaf weight magnitudes.",
        },
        {
          term: "Tree Complexity Penalty (γ)",
          definition: "Minimum gain threshold required to add a split node to the decision tree.",
        },
        {
          term: "Bottom-Up Tree Pruning",
          definition:
            "Collapsing child nodes back into leaves when split gain fails to exceed gamma.",
        },
      ],
    },
    trivia: XGBOOST_SPLIT_GAIN_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "XGBoost Section 3.1 Split Finding & Gain Score (Chen & Guestrin 2016)",
      },
    ],
    defaultInput: DEFAULT_XGBOOST_SPLIT_GAIN_INPUT,
    generateSteps: generateXgboostSplitGainScoreSteps,
  };
