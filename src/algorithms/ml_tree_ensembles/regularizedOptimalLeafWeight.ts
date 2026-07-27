import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface RegularizedOptimalLeafWeightInput {
  gradients: number[];
  hessians: number[];
  lambdaReg: number;
}

export const DEFAULT_OPTIMAL_LEAF_WEIGHT_INPUT: RegularizedOptimalLeafWeightInput = {
  gradients: [-0.8, -0.4, 0.2],
  hessians: [0.25, 0.25, 0.25],
  lambdaReg: 1.0,
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
  const { gradients, hessians, lambdaReg } = input;
  let stepIndex = 0;

  const G = gradients.reduce((acc, v) => acc + v, 0);
  const H = hessians.reduce((acc, v) => acc + v, 0);
  const wStar = -G / (H + lambdaReg);

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 4,
    explanation: {
      what: "Initialize Regularized Optimal Leaf Weight Calculator (XGBoost)",
      why: `Computing optimal leaf weight w* across ${gradients.length} leaf samples with L2 penalty lambda = ${lambdaReg}.`,
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
        totalSamples: String(gradients.length),
        lambdaReg: String(lambdaReg),
        status: "Initialized",
      },
    },
    variables: { lambdaReg, sampleCount: gradients.length },
  });

  // Step 1: Accumulate G and H
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 10,
    explanation: {
      what: `Accumulate Sums: G = sum(g_i) = ${G.toFixed(2)}, H = sum(h_i) = ${H.toFixed(2)}`,
      why: `Summed 1st order gradients G = ${G.toFixed(2)} and 2nd order hessians H = ${H.toFixed(2)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: gradients.map((g, idx) => ({
        id: `s-${idx}`,
        value: Math.round(g * 100),
        label: `g=${g}`,
        state: "active" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        G_sum: G.toFixed(2),
        H_sum: H.toFixed(2),
      },
    },
    variables: { G: Math.round(G * 100) / 100, H: Math.round(H * 100) / 100 },
  });

  // Step Final: Compute w*
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 14,
    explanation: {
      what: `Compute Optimal Leaf Weight: w* = - G / (H + lambda) = - (${G.toFixed(2)}) / (${H.toFixed(
        2,
      )} + ${lambdaReg}) = ${wStar.toFixed(4)}`,
      why: `Calculated regularized Newton-Raphson leaf weight w* = ${wStar.toFixed(4)}.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: gradients.map((_, idx) => ({
        id: `s-${idx}`,
        value: Math.round(wStar * 100),
        label: `w* = ${wStar.toFixed(4)}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        G: G.toFixed(2),
        H: H.toFixed(2),
        lambdaReg: String(lambdaReg),
        optimalLeafWeight: wStar.toFixed(4),
        status: "Completed",
      },
    },
    variables: { wStar: Math.round(wStar * 10000) / 10000, complete: true },
  });

  return steps;
};

export const regularizedOptimalLeafWeight: AlgorithmDefinition<RegularizedOptimalLeafWeightInput> =
  {
    id: "regularizedOptimalLeafWeight",
    title: "Regularized Optimal Leaf Weight Calculator",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Computes optimal leaf output weight w* in regularized XGBoost trees (Chen & Guestrin, 2016). Solves 2nd order Taylor leaf optimization w* = argmin_w [ G * w + 0.5 * (H + lambda) * w^2 ], yielding closed-form solution w* = - G / (H + lambda).\n\nInput Format:\n- gradients: 1st order loss gradients g_i for leaf samples.\n- hessians: 2nd order loss hessians h_i for leaf samples.\n- lambdaReg: L2 leaf weight regularization parameter.\n\nOutput Format:\n- Returns tuple (optimalWeight, G_total, H_total).\n\nEdge Cases & Constraints:\n- High lambdaReg: Shrinks leaf weight w* towards zero.",
    constraints: ["lambdaReg >= 0.0.", "H + lambdaReg > 0."],
    examples: [
      {
        kind: "basic",
        title: "Leaf Weight Calculation with L2 Regularization",
        inputDisplay: "G = -1.0, H = 0.75, lambda = 1.0",
        outputDisplay: "w* = 0.5714",
        input: DEFAULT_OPTIMAL_LEAF_WEIGHT_INPUT,
        output: "w* = 0.5714",
        explanation: "w* = - (-1.0) / (0.75 + 1.0) = 1.0 / 1.75 = 0.5714.",
      },
      {
        kind: "complex",
        title: "Zero L2 Regularization (lambda = 0.0)",
        inputDisplay: "G = -1.0, H = 0.75, lambda = 0.0",
        outputDisplay: "w* = 1.3333",
        input: {
          gradients: [-1.0],
          hessians: [0.75],
          lambdaReg: 0.0,
        },
        output: "w* = 1.3333",
        explanation: "Without L2 penalty, w* = 1.0 / 0.75 = 1.3333.",
      },
      {
        kind: "negative",
        title: "Positive Gradient (Negative Weight)",
        inputDisplay: "gradients = [1.0, 1.0]",
        outputDisplay: "w* = -1.3333",
        input: {
          gradients: [1.0, 1.0],
          hessians: [0.25, 0.25],
          lambdaReg: 1.0,
        },
        output: "w* = -1.3333",
        explanation: "Positive gradient yields negative optimal leaf weight.",
      },
    ],
    defaultInput: DEFAULT_OPTIMAL_LEAF_WEIGHT_INPUT,
    code: REGULARIZED_OPTIMAL_LEAF_WEIGHT_CODE,
    timeComplexity: {
      best: "O(N)",
      average: "O(N)",
      worst: "O(N)",
    },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "O(N) linear time summation across N leaf samples.",
      space: "O(1) auxiliary space.",
    },
    topicGuide: {
      overview:
        "In XGBoost (Chen & Guestrin 2016), once a leaf node's sample set S_j is fixed, the optimal scalar output weight w_j* assigned to that leaf is determined analytically by setting the derivative of the regularized 2nd order Taylor objective to zero.",
      sections: [
        {
          heading: "Core Concept & Closed-Form Derivation",
          body: "Objective d/dw [ G_j w_j + 0.5 (H_j + lambda) w_j^2 ] = G_j + (H_j + lambda) w_j = 0 -> w_j* = - G_j / (H_j + lambda).",
        },
        {
          heading: "Role of L2 Regularization (lambda)",
          body: "L2 regularization parameter lambda dampens leaf weights when sample coverage H_j is small, preventing individual outliers from causing extreme prediction jumps.",
        },
        {
          heading: "Optimal Node Quality Score",
          body: "Substituting w_j* back into the objective yields optimal leaf score Obj* = -0.5 * G_j^2 / (H_j + lambda), which forms the basis of XGBoost split gain evaluation.",
        },
      ],
      keyTerms: [
        {
          term: "Optimal Leaf Weight (w*)",
          definition: "Closed-form scalar value assigned to a leaf node maximizing loss reduction.",
        },
        {
          term: "L2 Leaf Regularization (λ)",
          definition: "Penalty term shrinking leaf output weights to prevent overfitting.",
        },
        {
          term: "Newton-Raphson Step",
          definition: "Optimization step taking ratio of 1st derivative to 2nd derivative.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "XGBoost Regularized Leaf Weight (Chen & Guestrin 2016)",
      },
    ],
    generateSteps: generateOptimalLeafWeightSteps,
  };
