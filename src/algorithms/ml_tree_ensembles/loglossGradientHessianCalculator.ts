import { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";

export interface LoglossGradientHessianCalculatorInput {
  yTrue: number[]; // binary target 0 or 1
  rawPredictions: number[]; // log-odds predictions margin margin z_i
}

export const DEFAULT_LOGLOSS_GRAD_HESS_INPUT: LoglossGradientHessianCalculatorInput = {
  yTrue: [1, 0, 1, 0],
  rawPredictions: [0.0, 0.0, 1.5, -1.5],
};

export const LOGLOSS_GRADIENT_HESSIAN_CODE = `import math

def sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-z))

def compute_logloss_gradients_hessians(y_true: list[int], raw_predictions: list[float]) -> tuple[list[float], list[float]]:
    """
    Computes 1st order Gradients g_i and 2nd order Hessians h_i for Binary Logistic Loss in XGBoost / GBDT.
    Loss: L(y, z) = - [y * log(p) + (1 - y) * log(1 - p)] where p = sigmoid(z).
    Gradient: g_i = p_i - y_i.
    Hessian:  h_i = p_i * (1 - p_i).
    """
    gradients = []
    hessians = []

    for y, z in zip(y_true, raw_predictions):
        p = sigmoid(z)
        g = p - y
        h = max(1e-6, p * (1.0 - p))
        gradients.append(round(g, 4))
        hessians.append(round(h, 4))

    return gradients, hessians`;

export const generateLoglossGradHessSteps = (
  input: LoglossGradientHessianCalculatorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  const { yTrue, rawPredictions } = input;
  let stepIndex = 0;

  const sigmoid = (z: number) => 1.0 / (1.0 + Math.exp(-z));

  // Step 0: Init
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Logistic Loss Gradient & Hessian Calculator",
      why: `Calculating 1st order gradients g_i = p_i - y_i and 2nd order hessians h_i = p_i(1-p_i) for ${yTrue.length} binary samples.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: yTrue.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `S${idx} (y=${y}, z=${rawPredictions[idx]})`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        totalSamples: String(yTrue.length),
        lossFunction: "Binary Logistic Loss",
        status: "Initialized",
      },
    },
    variables: { sampleCount: yTrue.length },
  });

  const gradients: number[] = [];
  const hessians: number[] = [];

  for (let i = 0; i < yTrue.length; i++) {
    const y = yTrue[i];
    const z = rawPredictions[i];
    const p = sigmoid(z);
    const g = p - y;
    const h = Math.max(1e-6, p * (1.0 - p));

    gradients.push(g);
    hessians.push(h);

    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Sample S${i}: z = ${z.toFixed(2)} -> p = sigmoid(z) = ${p.toFixed(4)}`,
        why: `Gradient g_${i} = p - y = ${p.toFixed(4)} - ${y} = ${g.toFixed(
          4,
        )}. Hessian h_${i} = p(1-p) = ${h.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, idx) => ({
          id: `s-${idx}`,
          value: val,
          label: `S${idx} (g=${idx <= i ? gradients[idx].toFixed(2) : "?"})`,
          state:
            idx === i
              ? ("active" as ElementState)
              : idx < i
                ? ("visited" as ElementState)
                : ("default" as ElementState),
          pointers: idx === i ? [`g=${g.toFixed(3)}, h=${h.toFixed(3)}`] : [],
        })),
      },
      auxiliaryState: {
        customState: {
          activeSample: `S${i}`,
          targetY: String(y),
          rawPredictionZ: z.toFixed(2),
          probabilityP: p.toFixed(4),
          gradientG: g.toFixed(4),
          hessianH: h.toFixed(4),
        },
      },
      variables: {
        i,
        z,
        p: Math.round(p * 10000) / 10000,
        g: Math.round(g * 10000) / 10000,
        h: Math.round(h * 10000) / 10000,
      },
    });
  }

  // Step Final: Complete
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 20,
    explanation: {
      what: "Logistic Loss Gradient & Hessian Computation Complete",
      why: `Gradients: [${gradients.map((g) => g.toFixed(3)).join(", ")}], Hessians: [${hessians
        .map((h) => h.toFixed(3))
        .join(", ")}]. Ready for XGBoost split search!`,
    },
    primarySnapshot: {
      kind: "array",
      elements: gradients.map((g, idx) => ({
        id: `res-${idx}`,
        value: Math.round(g * 100),
        label: `S${idx}: g=${g.toFixed(2)}, h=${hessians[idx].toFixed(2)}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        gradients: gradients.map((g) => g.toFixed(3)).join(", "),
        hessians: hessians.map((h) => h.toFixed(3)).join(", "),
        status: "Completed",
      },
    },
    variables: { sampleCount: gradients.length, complete: true },
  });

  return steps;
};

export const loglossGradientHessianCalculator: AlgorithmDefinition<LoglossGradientHessianCalculatorInput> =
  {
    id: "loglossGradientHessianCalculator",
    title: "Logistic Loss Gradient & Hessian Calculator",
    category: "ml_tree_ensembles",
    categories: ["ml_tree_ensembles"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 5,
    mlInfraCategory: "ml_tree_ensembles",
    description:
      "Computes 1st order gradients g_i = dL/dz_i and 2nd order Hessians h_i = d^2 L / d z_i^2 for Binary Logistic Loss L(y, z) = - [y log(p) + (1-y) log(1-p)] in XGBoost and GBDT ensembles. For sigmoid probability p = 1 / (1 + exp(-z)), the gradient simplifies to g_i = p_i - y_i and Hessian simplifies to h_i = p_i (1 - p_i).\n\nInput Format:\n- yTrue: Binary ground truth targets (0 or 1).\n- rawPredictions: Raw log-odds margin predictions z_i.\n\nOutput Format:\n- Returns tuple (gradientsList, hessiansList).\n\nEdge Cases & Constraints:\n- Extreme raw prediction z -> +/-inf: Hessian is clamped to min value 1e-6 to avoid zero division in split gain formulas.",
    constraints: ["yTrue and rawPredictions must have matching length N."],
    examples: [
      {
        kind: "basic",
        title: "Logistic Gradients for 4 Samples at Margin z = 0.0",
        inputDisplay: "yTrue = [1, 0, 1, 0], rawPredictions = [0.0, 0.0, 1.5, -1.5]",
        outputDisplay: "g = [-0.5, 0.5, -0.182, 0.182], h = [0.25, 0.25, 0.149, 0.149]",
        input: DEFAULT_LOGLOSS_GRAD_HESS_INPUT,
        output: "g: [-0.5, 0.5, ...], h: [0.25, 0.25, ...]",
        explanation: "At z = 0.0, p = 0.5 -> g = 0.5 - 1 = -0.5, h = 0.5 * 0.5 = 0.25.",
      },
      {
        kind: "complex",
        title: "High Confidence Prediction (z = 5.0)",
        inputDisplay: "y = 1, z = 5.0 (p ~ 0.993)",
        outputDisplay: "g ~ -0.0067, h ~ 0.0066",
        input: {
          yTrue: [1],
          rawPredictions: [5.0],
        },
        output: "g = -0.0067, h = 0.0066",
        explanation: "High confidence correct prediction produces small gradient and hessian.",
      },
      {
        kind: "negative",
        title: "Wrong High Confidence Prediction (z = -5.0 for y = 1)",
        inputDisplay: "y = 1, z = -5.0 (p ~ 0.0067)",
        outputDisplay: "g ~ -0.9933, h ~ 0.0066",
        input: {
          yTrue: [1],
          rawPredictions: [-5.0],
        },
        output: "g = -0.9933",
        explanation: "Large error produces maximum gradient magnitude g ~ -0.9933.",
      },
    ],
    defaultInput: DEFAULT_LOGLOSS_GRAD_HESS_INPUT,
    code: LOGLOSS_GRADIENT_HESSIAN_CODE,
    timeComplexity: {
      best: "O(N)",
      average: "O(N)",
      worst: "O(N)",
    },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N) single pass time across N samples.",
      space: "O(N) auxiliary space to store output gradient and hessian arrays.",
    },
    topicGuide: {
      overview:
        "XGBoost (Chen & Guestrin 2016) reformulates gradient boosting via a 2nd order Taylor expansion of the loss function. Computing analytical 1st gradients g_i and 2nd hessians h_i allows XGBoost to support any custom differentiable loss function.",
      sections: [
        {
          heading: "Core Concept & Taylor Expansion",
          body: "Loss approximation L^{(t)} approx sum_{i=1}^N [ L(y_i, hat{y}^{(t-1)}) + g_i f_t(x_i) + 0.5 h_i f_t(x_i)^2 ]. Omitting constants leaves objective sum [ g_i f_t(x_i) + 0.5 h_i f_t(x_i)^2 ] + Omega(f_t).",
        },
        {
          heading: "Logistic Loss Derivatives",
          body: "For binary cross-entropy loss L = - [ y log(p) + (1-y) log(1-p) ] with logit link z = log(p / (1-p)), 1st derivative is g = p - y and 2nd derivative is h = p(1-p).",
        },
        {
          heading: "Hessian Clamping & Numerical Stability",
          body: "When probability p approaches 0 or 1, Hessian h = p(1-p) approaches 0. Systems enforce a lower bound `h = max(1e-6, h)` to prevent division by zero in leaf weight calculations w = -G / (H + lambda).",
        },
      ],
      keyTerms: [
        {
          term: "Gradient (g_i)",
          definition:
            "1st derivative of loss function with respect to current raw model prediction.",
        },
        {
          term: "Hessian (h_i)",
          definition:
            "2nd derivative of loss function acting as a curvature weight in GBDT leaf optimization.",
        },
        {
          term: "Second-Order Boosting",
          definition:
            "Optimization technique using both 1st and 2nd derivatives (Newton-Raphson step) to accelerate convergence.",
        },
      ],
    },
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label: "XGBoost 2nd Order Boosting Theory (Chen & Guestrin 2016)",
      },
    ],
    generateSteps: generateLoglossGradHessSteps,
  };
