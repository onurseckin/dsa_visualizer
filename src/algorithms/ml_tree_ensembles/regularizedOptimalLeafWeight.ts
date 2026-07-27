import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface RegularizedOptimalLeafWeightInput {
  gradients: number[];
  hessians: number[];
  lambdaReg: number;
  data?: number[];
  target?: number;
}

export const DEFAULT_OPTIMAL_LEAF_WEIGHT_INPUT: RegularizedOptimalLeafWeightInput = {
  gradients: [-0.8, -0.6, -0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.9, -0.3],
  hessians: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
  lambdaReg: 1.0,
  data: [-0.8, -0.6, -0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.9, -0.3],
  target: 1,
};

export const REGULARIZED_OPTIMAL_LEAF_WEIGHT_CODE = `def compute_regularized_optimal_leaf_weight(gradients: list[float], hessians: list[float], lambda_reg: float = 1.0) -> tuple[float, float, float]:
    """
    Computes optimal leaf weight w* in regularized XGBoost trees (Chen & Guestrin 2016).
    Formula: w* = - G / (H + lambda)
    where G = sum(g_i) and H = sum(h_i).
    """
    G = sum(gradients)
    H = sum(hessians)

    # Compute regularized leaf weight
    w_star = - G / (H + lambda_reg)
    return round(w_star, 4), round(G, 4), round(H, 4)`;

export const generateOptimalLeafWeightSteps = (
  input: RegularizedOptimalLeafWeightInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const gradients = input.gradients || input.data || [-0.8, -0.6, -0.4, -0.2, 0.1, 0.3, 0.5, 0.7, 0.9, -0.3];
  const hessians = input.hessians || [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25];
  const lambdaReg = input.lambdaReg ?? 1.0;
  let stepIndex = 0;
  const n = gradients.length;

  // Step 1: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Initialize Regularized Optimal Leaf Weight Calculator (XGBoost)",
      why: `Computing optimal leaf weight w* across ${n} leaf samples with L2 penalty lambda = ${lambdaReg}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: gradients.map((g, idx) => ({
        id: `s-${idx}`,
        value: Math.round(g * 100),
        label: `S${idx} (g=${g}, h=${hessians[idx]})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Total Samples N": String(n),
        "lambda": String(lambdaReg),
        "Status": "Function Entry",
      },
    },
    variables: { totalSamples: n, lambdaReg },
  });

  // Step 2: Sum gradients (7)
  let G = 0.0;
  gradients.forEach((g, idx) => {
    G += g;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 7,
      explanation: {
        what: `Sum Gradients: Sample ${idx + 1}/${n} (g = ${g.toFixed(2)})`,
        why: `Accumulated gradient sum G = ${G.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: gradients.map((val, i) => ({
          id: `s-${i}`,
          value: Math.round(val * 100),
          label: `g=${val}`,
          state: i === idx ? ("active" as ElementState) : i < idx ? ("visited" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Gradient Sum G": G.toFixed(4) } },
      variables: { idx, g, G },
    });
  });

  // Step 3: Sum hessians (8)
  let H = 0.0;
  hessians.forEach((h, idx) => {
    H += h;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 8,
      explanation: {
        what: `Sum Hessians: Sample ${idx + 1}/${n} (h = ${h.toFixed(2)})`,
        why: `Accumulated hessian sum H = ${H.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: gradients.map((val, i) => ({
          id: `s-${i}`,
          value: Math.round(val * 100),
          label: `h=${hessians[i]}`,
          state: i === idx ? ("active" as ElementState) : i < idx ? ("sorted" as ElementState) : ("default" as ElementState),
        })),
      },
      auxiliaryState: { customState: { "Gradient Sum G": G.toFixed(4), "Hessian Sum H": H.toFixed(4) } },
      variables: { idx, h, H },
    });
  });

  // Step 4: Compute w_star (11)
  const wStar = -G / (H + lambdaReg);
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 11,
    explanation: {
      what: `Compute Optimal Leaf Weight: w* = - G / (H + lambda) = ${wStar.toFixed(4)}`,
      why: `Evaluated w* = - (${G.toFixed(4)}) / (${H.toFixed(4)} + ${lambdaReg}) = ${wStar.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: gradients.map((val, i) => ({
        id: `s-${i}`,
        value: Math.round(val * 100),
        label: `g=${val}`,
        state: "visited" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Gradient Sum G": G.toFixed(4),
        "Hessian Sum H": H.toFixed(4),
        "Optimal Weight w*": wStar.toFixed(4),
      },
    },
    variables: { G, H, lambdaReg, wStar },
  });

  // Step 5: Return (12)
  const roundedW = Math.round(wStar * 10000) / 10000;
  const roundedG = Math.round(G * 10000) / 10000;
  const roundedH = Math.round(H * 10000) / 10000;

  steps.push({
    stepIndex: stepIndex++,
    codeLine: 12,
    explanation: {
      what: `Execution Complete: Return (w*=${roundedW}, G=${roundedG}, H=${roundedH})`,
      why: `Successfully calculated optimal regularized leaf weight w* = ${roundedW}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: gradients.map((val, i) => ({
        id: `s-${i}`,
        value: Math.round(val * 100),
        label: `w*=${roundedW}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Optimal Leaf Weight w*": String(roundedW),
        "Gradient Sum G": String(roundedG),
        "Hessian Sum H": String(roundedH),
      },
    },
    variables: { w_star: roundedW, G: roundedG, H: roundedH, completed: true },
  });

  return steps;
};

const REGULARIZED_OPTIMAL_LEAF_WEIGHT_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 9, 10],
  distractors: [
    "w_star = G / (H + lambda_reg)",
    "w_star = - G / H",
    "w_star = - (G + lambda_reg) / H",
    "return w_star * lambda_reg",
  ],
  hints: [
    { line: 11, hint: "Optimal regularized leaf weight formula in XGBoost: w* = - G / (H + lambda)." },
  ],
  lineExplanations: {
    1: "Defines entry point for compute_regularized_optimal_leaf_weight function.",
    2: "Docstring opening delimiter tag.",
    3: "Describes optimal leaf weight w* computation in regularized XGBoost trees (Chen & Guestrin 2016).",
    4: "Docstring leaf weight formula line: w* = - G / (H + lambda).",
    5: "Docstring parameter detail mapping G = sum(g_i) and H = sum(h_i).",
    6: "Docstring closing delimiter tag.",
    7: "Sums 1st-order gradients G = sum(gradients) across all samples in leaf node.",
    8: "Sums 2nd-order hessians H = sum(hessians) across all samples in leaf node.",
    9: "Blank line before leaf weight computation.",
    10: "Comment for computing regularized leaf weight.",
    11: "Calculates optimal regularized leaf weight w_star = - G / (H + lambda_reg).",
    12: "Returns tuple of (rounded w_star, rounded G, rounded H).",
  },
};

export const regularizedOptimalLeafWeight: AlgorithmDefinition<RegularizedOptimalLeafWeightInput> = {
  id: "regularizedOptimalLeafWeight",
  title: "Regularized Optimal Leaf Weight Calculator",
  category: "ml_tree_ensembles",
  categories: ["ml_tree_ensembles", "advanced_range_queries"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 8,
  mlInfraCategory: "ml_tree_ensembles",
  description:
    "The Regularized Optimal Leaf Weight Calculator computes the optimal output prediction weight $w^*$ for a terminal leaf node inside regularized Gradient Boosted Decision Trees (**XGBoost**, Chen & Guestrin 2016). By expanding loss function $\\mathcal{L}^{(t)}$ into a 2nd-order Taylor series around previous ensemble predictions, the optimal leaf weight is derived analytically by setting the objective gradient to zero.\n\n### Why It Exists\nStandard decision trees set leaf predictions to simple sample means $\\bar{y}$. In Gradient Boosting (XGBoost), leaves predict additive update steps $w^*$ that minimize arbitrary differentiable loss functions. Adding $L_2$ regularization $\\lambda \\|w\\|_2^2$ shrinks leaf weights toward zero, preventing leaf overfitting.\n\n### Mathematical Formulation\nFor a leaf node containing sample set $I_j$, gradient sum $G = \\sum_{i \\in I_j} g_i$, hessian sum $H = \\sum_{i \\in I_j} h_i$, and $L_2$ penalty $\\lambda$:\n\n$$1. \\quad \\mathcal{Obj}(w) = \\sum_{i \\in I_j} \\left[ g_i w + \\frac{1}{2} h_i w^2 \\right] + \\frac{1}{2} \\lambda w^2 = G w + \\frac{1}{2} (H + \\lambda) w^2$$\n\nSetting $\\frac{\\partial \\mathcal{Obj}}{\\partial w} = G + (H + \\lambda) w = 0$ yields:\n\n$$2. \\quad w^* = - \\frac{G}{H + \\lambda} \\quad (\\text{Optimal Regularized Leaf Weight})$$\n\n$$3. \\quad \\mathcal{Obj}(w^*) = - \\frac{1}{2} \\frac{G^2}{H + \\lambda} \\quad (\\text{Optimal Leaf Objective Score})$$\n\n### Step-by-Step Intuition\n1. **Gradient Summation**: Sum 1st-order gradients $G = \\sum g_i$.\n2. **Hessian Summation**: Sum 2nd-order hessians $H = \\sum h_i$.\n3. **Denominator Regularization**: Add $L_2$ penalty $\\lambda$ to total hessian $H \\to H + \\lambda$.\n4. **Weight Calculation**: Compute analytical minimum $w^* = - G / (H + \\lambda)$.\n\n### Key Trade-Offs & Hardware Execution\n- **Impact of L2 Regularization ($\\lambda$)**: Larger $\\lambda$ shrinks leaf weight $w^*$ toward zero, dampening individual tree updates and improving generalization.\n- **Newton-Raphson Step**: $w^*$ is a multi-sample Newton-Raphson step where $G$ is the gradient direction and $H+\\lambda$ is the regularized curvature.",
  constraints: [
    "1 <= N <= 1000000",
    "lambdaReg >= 0.0",
    "Hessian sum H > 0",
  ],
  examples: [
    {
      kind: "basic",
      title: "10-Sample Leaf Weight Evaluation (lambda = 1.0)",
      inputDisplay: "G = -0.8, H = 2.5, lambda = 1.0",
      outputDisplay: "w* = 0.2286, G = -0.8000, H = 2.5000",
      input: DEFAULT_OPTIMAL_LEAF_WEIGHT_INPUT,
      output: "(0.2286, -0.8000, 2.5000)",
      explanation: "Evaluates w* = - (-0.8) / (2.5 + 1.0) = +0.2286.",
    },
  ],
  code: REGULARIZED_OPTIMAL_LEAF_WEIGHT_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Requires a single pass over $N$ leaf samples to sum gradients $G$ and hessians $H$, taking $O(N)$ operations.",
    space: "Requires $O(1)$ auxiliary space.",
  },
  topicGuide: {
    overview:
      "The Regularized Optimal Leaf Weight Calculator computes the analytical optimal leaf prediction weight w* in XGBoost gradient boosted trees.",
    sections: [
      {
        heading: "Core Concept & 2nd-Order Taylor Objective",
        body: "XGBoost expands loss into 2nd-order Taylor series Obj(w) = G*w + 0.5*(H + lambda)*w^2. Setting derivative to zero yields analytical minimum w* = -G / (H + lambda).",
      },
      {
        heading: "Role of L2 Regularization (Lambda)",
        body: "L2 penalty lambda adds to denominator (H + lambda), shrinking leaf weights w* toward 0 to prevent overfitting on small leaf sample sizes.",
      },
      {
        heading: "Connection to Newton-Raphson Optimization",
        body: "Leaf weight w* represents a multi-sample Newton-Raphson update step: step = - Gradient / (Hessian + Regularization).",
      },
      {
        heading: "Edge Case Analysis & Zero Hessian",
        body: "If H + lambda = 0 (e.g. all hessians are 0 and lambda = 0), the division becomes undefined. L2 regularization lambda > 0 guarantees numerical stability.",
      },
    ],
    keyTerms: [
      {
        term: "Optimal Leaf Weight (w*)",
        definition: "Analytical leaf prediction output -G / (H + lambda) minimizing 2nd-order Taylor loss objective.",
      },
      {
        term: "L2 Regularization (Lambda)",
        definition: "Penalty term lambda shrink-controlling leaf weight magnitude to prevent overfitting.",
      },
      {
        term: "Newton-Raphson Step",
        definition: "Optimization step -g/h using 2nd-order derivative curvature.",
      },
      {
        term: "Hessian Sum (H)",
        definition: "Sum of 2nd-order loss derivatives H = sum(h_i) across leaf samples.",
      },
    ],
  },
  trivia: REGULARIZED_OPTIMAL_LEAF_WEIGHT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
  defaultInput: DEFAULT_OPTIMAL_LEAF_WEIGHT_INPUT,
  generateSteps: generateOptimalLeafWeightSteps,
};
