import type { AlgorithmDefinition, AlgorithmStep, ElementState } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface LoglossGradientHessianCalculatorInput {
  yTrue: number[];
  rawPredictions: number[];
  data?: number[];
  target?: number;
}

export const DEFAULT_LOGLOSS_GRAD_HESS_INPUT: LoglossGradientHessianCalculatorInput = {
  yTrue: [1, 0, 1, 0, 1, 1, 0, 0, 1, 0],
  rawPredictions: [0.0, 0.5, 1.2, -0.8, -1.5, 2.0, -0.4, 0.8, 1.1, -1.2],
  data: [1, 0, 1, 0, 1, 1, 0, 0, 1, 0],
  target: 0,
};

export const LOGLOSS_GRADIENT_HESSIAN_CODE = `import math

def sigmoid(z: float) -> float:
    return 1.0 / (1.0 + math.exp(-z))

def compute_logloss_gradients_hessians(y_true: list[int], raw_predictions: list[float]) -> tuple[list[float], list[float]]:
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
  const yTrue = input.yTrue || input.data || [1, 0, 1, 0, 1, 1, 0, 0, 1, 0];
  const rawPredictions = input.rawPredictions || [
    0.0, 0.5, 1.2, -0.8, -1.5, 2.0, -0.4, 0.8, 1.1, -1.2,
  ];
  let stepIndex = 0;
  const n = yTrue.length;

  const sigmoid = (z: number) => 1.0 / (1.0 + Math.exp(-z));

  // Step 1: Import math
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 1,
    explanation: {
      what: "Import Python math Module",
      why: "Imports math module for exponential function math.exp(-z).",
    },
    primarySnapshot: {
      kind: "array",
      elements: yTrue.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}, z=${rawPredictions[idx]}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { Module: "math" } },
    variables: { imported: true },
  });

  // Step 2: Function entry
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 6,
    explanation: {
      what: "Initialize Logistic Loss Gradient & Hessian Calculator",
      why: `Computing 1st order gradients g_i = p_i - y_i and 2nd order hessians h_i = p_i(1-p_i) across ${n} binary target samples.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: yTrue.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}, z=${rawPredictions[idx]}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Total Samples N": String(n),
        "Loss Function": "Binary Cross-Entropy (Logloss)",
        Status: "Function Entry",
      },
    },
    variables: { totalSamples: n },
  });

  // Step 3: Allocate gradients
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 7,
    explanation: {
      what: "Allocate empty gradients [] list",
      why: "Initializes list to store 1st-order gradients g_i = p_i - y_i.",
    },
    primarySnapshot: {
      kind: "array",
      elements: yTrue.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}, z=${rawPredictions[idx]}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Gradients List": "[]" } },
    variables: { gradientsCount: 0 },
  });

  // Step 4: Allocate hessians
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 8,
    explanation: {
      what: "Allocate empty hessians [] list",
      why: "Initializes list to store 2nd-order hessians h_i = p_i * (1 - p_i).",
    },
    primarySnapshot: {
      kind: "array",
      elements: yTrue.map((y, idx) => ({
        id: `s-${idx}`,
        value: y,
        label: `y=${y}, z=${rawPredictions[idx]}`,
        state: "default" as ElementState,
      })),
    },
    auxiliaryState: { customState: { "Hessians List": "[]" } },
    variables: { hessiansCount: 0 },
  });

  const gradients: number[] = [];
  const hessians: number[] = [];

  const getElementLabel = (
    i: number,
    currentIdx: number,
    currentP?: number,
    currentG?: number,
    currentH?: number,
    currentStage?: "zip" | "p" | "g" | "h" | "append_g" | "append_h",
  ) => {
    if (i < currentIdx) {
      return `g=${gradients[i]}, h=${hessians[i]}`;
    }
    if (i > currentIdx) {
      return `y=${yTrue[i]}, z=${rawPredictions[i]}`;
    }
    switch (currentStage) {
      case "zip":
        return `y=${yTrue[i]}, z=${rawPredictions[i]}`;
      case "p":
        return `p=${currentP?.toFixed(4)}`;
      case "g":
        return `p=${currentP?.toFixed(4)}, g=${currentG?.toFixed(4)}`;
      case "h":
        return `g=${currentG?.toFixed(4)}, h=${currentH?.toFixed(4)}`;
      case "append_g":
        return `g=${currentG !== undefined ? Math.round(currentG * 10000) / 10000 : 0}`;
      case "append_h":
      default:
        return `g=${gradients[i]}, h=${hessians[i]}`;
    }
  };

  const getElementState = (i: number, currentIdx: number, currentStage?: string): ElementState => {
    if (i < currentIdx) return "sorted";
    if (i > currentIdx) return "default";
    if (currentStage === "zip") return "active";
    if (currentStage === "append_h") return "sorted";
    if (currentStage === "append_g") return "visited";
    return "compare";
  };

  yTrue.forEach((y, idx) => {
    const z = rawPredictions[idx];

    // Sub-step A: Zip loop header
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 10,
      explanation: {
        what: `Sample ${idx + 1}/${n}: Process Target y = ${y}, Margin z = ${z}`,
        why: `Loading sample index ${idx} with binary target y = ${y} and raw prediction margin z = ${z}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: getElementLabel(i, idx, undefined, undefined, undefined, "zip"),
          state: getElementState(i, idx, "zip"),
        })),
      },
      auxiliaryState: {
        customState: {
          "Current Sample": `Index ${idx} (y=${y}, z=${z})`,
          Gradients: `[${gradients.join(", ")}]`,
          Hessians: `[${hessians.join(", ")}]`,
        },
      },
      variables: { idx, y, z },
    });

    // Sub-step B: Compute sigmoid p
    const p = sigmoid(z);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 11,
      explanation: {
        what: `Evaluate Probability: p = sigmoid(${z}) = ${p.toFixed(4)}`,
        why: `Evaluated logistic sigmoid p = 1 / (1 + exp(-${z})) = ${p.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: getElementLabel(i, idx, p, undefined, undefined, "p"),
          state: getElementState(i, idx, "p"),
        })),
      },
      auxiliaryState: {
        customState: {
          "Predicted Probability p": p.toFixed(4),
          Gradients: `[${gradients.join(", ")}]`,
          Hessians: `[${hessians.join(", ")}]`,
        },
      },
      variables: { z, p },
    });

    // Sub-step C: Compute gradient g
    const g = p - y;
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 12,
      explanation: {
        what: `Evaluate Gradient: g = p - y = ${p.toFixed(4)} - ${y} = ${g.toFixed(4)}`,
        why: `Evaluated 1st-order loss derivative g = p - y = ${g.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: getElementLabel(i, idx, p, g, undefined, "g"),
          state: getElementState(i, idx, "g"),
        })),
      },
      auxiliaryState: {
        customState: {
          "1st Order Gradient g": g.toFixed(4),
          Gradients: `[${gradients.join(", ")}]`,
          Hessians: `[${hessians.join(", ")}]`,
        },
      },
      variables: { p, y, g },
    });

    // Sub-step D: Compute hessian h
    const rawH = p * (1.0 - p);
    const h = Math.max(1e-6, rawH);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 13,
      explanation: {
        what: `Evaluate Hessian: h = max(1e-6, p * (1 - p)) = ${h.toFixed(4)}`,
        why: `Evaluated 2nd-order loss derivative h = ${p.toFixed(4)} * (1 - ${p.toFixed(4)}) = ${h.toFixed(4)}.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: getElementLabel(i, idx, p, g, h, "h"),
          state: getElementState(i, idx, "h"),
        })),
      },
      auxiliaryState: {
        customState: {
          "2nd Order Hessian h": h.toFixed(4),
          Gradients: `[${gradients.join(", ")}]`,
          Hessians: `[${hessians.join(", ")}]`,
        },
      },
      variables: { p, h },
    });

    // Sub-step E: Append rounded g
    const roundedG = Math.round(g * 10000) / 10000;
    gradients.push(roundedG);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 14,
      explanation: {
        what: `Append Gradient g = ${roundedG} to gradients`,
        why: `Recorded rounded gradient ${roundedG} in gradients array.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: getElementLabel(i, idx, p, g, h, "append_g"),
          state: getElementState(i, idx, "append_g"),
        })),
      },
      auxiliaryState: { customState: { "Gradients List": `[${gradients.join(", ")}]` } },
      variables: { roundedG, gradientsCount: gradients.length },
    });

    // Sub-step F: Append rounded h
    const roundedH = Math.round(h * 10000) / 10000;
    hessians.push(roundedH);
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 15,
      explanation: {
        what: `Append Hessian h = ${roundedH} to hessians`,
        why: `Recorded rounded hessian ${roundedH} in hessians array.`,
      },
      primarySnapshot: {
        kind: "array",
        elements: yTrue.map((val, i) => ({
          id: `s-${i}`,
          value: val,
          label: getElementLabel(i, idx, p, g, h, "append_h"),
          state: getElementState(i, idx, "append_h"),
        })),
      },
      auxiliaryState: { customState: { "Hessians List": `[${hessians.join(", ")}]` } },
      variables: { roundedH, hessiansCount: hessians.length },
    });
  });

  // Final step
  steps.push({
    stepIndex: stepIndex++,
    codeLine: 17,
    explanation: {
      what: "Execution Complete: Return (gradients, hessians)",
      why: `Successfully calculated ${n} gradient and hessian pairs for binary logistic loss.`,
    },
    primarySnapshot: {
      kind: "array",
      elements: yTrue.map((val, i) => ({
        id: `s-${i}`,
        value: val,
        label: `g=${gradients[i]}, h=${hessians[i]}`,
        state: "sorted" as ElementState,
      })),
    },
    auxiliaryState: {
      customState: {
        "Computed Gradients": `[${gradients.join(", ")}]`,
        "Computed Hessians": `[${hessians.join(", ")}]`,
        "Total Samples N": String(n),
      },
    },
    variables: {
      gradientsCount: gradients.length,
      hessiansCount: hessians.length,
      completed: true,
    },
  });

  return steps;
};

const LOGLOSS_GRADIENT_HESSIAN_TRIVIA: TriviaMeta = {
  skipLines: [2, 5, 9, 16],
  distractors: ["g = y - p", "h = p * p", "g = sigmoid(z) - 1.0", "h = p * (1.0 + p)"],
  hints: [
    { line: 4, hint: "Sigmoid activation formula: 1.0 / (1.0 + math.exp(-z))." },
    { line: 12, hint: "Binary Logistic Loss 1st order gradient: g_i = p_i - y_i." },
    { line: 13, hint: "Binary Logistic Loss 2nd order hessian: h_i = p_i * (1.0 - p_i)." },
  ],
  lineExplanations: {
    1: "Imports Python math module for exponential math.exp().",
    2: "Blank line before sigmoid helper definition.",
    3: "Defines sigmoid helper function converting log-odds prediction z to probability p.",
    4: "Evaluates and returns logistic sigmoid: 1.0 / (1.0 + math.exp(-z)).",
    5: "Blank line before main loss gradient function definition.",
    6: "Defines entry point for compute_logloss_gradients_hessians function.",
    7: "Initializes empty list gradients to store 1st-order loss derivatives.",
    8: "Initializes empty list hessians to store 2nd-order loss derivatives.",
    9: "Blank line before sample zip iteration loop.",
    10: "Iterates over binary target y and prediction margin z in zip(y_true, raw_predictions).",
    11: "Calculates predicted probability p = sigmoid(z).",
    12: "Calculates 1st-order gradient derivative g = p - y.",
    13: "Calculates 2nd-order hessian derivative h = max(1e-6, p * (1.0 - p)).",
    14: "Appends rounded gradient g to gradients list.",
    15: "Appends rounded hessian h to hessians list.",
    16: "Blank line separating sample loop from return statement.",
    17: "Returns tuple of (gradients, hessians) lists.",
  },
};

export const loglossGradientHessianCalculator: AlgorithmDefinition<LoglossGradientHessianCalculatorInput> =
  {
    id: "logloss-gradient-hessian-calculator",
    title: "Binary Logistic Loss Gradient & Hessian Calculator",
    topicIds: ["ml_tree_ensembles", "advanced_range_queries"],
    difficulty: "Medium",
    description:
      "The Binary Logistic Loss Gradient & Hessian Calculator evaluates 1st-order gradients $g_i$ and 2nd-order hessians $h_i$ for Binary Cross-Entropy (Logloss) in Gradient Boosted Decision Trees (**XGBoost**, **LightGBM**, **CatBoost**). Given true binary targets $y_i \\in \\{0, 1\\}$ and current ensemble log-odds margin predictions $z_i \\in \\mathbb{R}$, this algorithm computes exact point-wise derivatives used by Newton-Raphson tree split search.\n\n### Why It Exists\nGradient Boosting algorithms optimize loss functions $\\mathcal{L}(y, z)$ by growing decision trees on pseudo-residuals. For Binary Cross-Entropy, 2nd-order Taylor expansions require both the first derivative $g_i = \\frac{\\partial \\mathcal{L}}{\\partial z_i}$ and second derivative $h_i = \\frac{\\partial^2 \\mathcal{L}}{\\partial z_i^2}$.\n\n### Mathematical Formulation\nFor binary target $y_i \\in \\{0, 1\\}$, raw prediction margin $z_i$, and predicted probability $p_i = \\sigma(z_i) = \\frac{1}{1 + e^{-z_i}}$:\n\n$$1. \\quad \\mathcal{L}(y_i, z_i) = - \\left[ y_i \\ln(p_i) + (1 - y_i) \\ln(1 - p_i) \\right] \\quad (\\text{Binary Cross-Entropy})$$\n\n$$2. \\quad g_i = \\frac{\\partial \\mathcal{L}}{\\partial z_i} = p_i - y_i \\quad (\\text{1st-Order Gradient Residual})$$\n\n$$3. \\quad h_i = \\frac{\\partial^2 \\mathcal{L}}{\\partial z_i^2} = p_i (1 - p_i) \\quad (\\text{2nd-Order Hessian Curvature})$$\n\nNotice that $0 < h_i \\le 0.25$. Max hessian $h_i = 0.25$ occurs at $p_i = 0.5$.\n\n### Step-by-Step Intuition\n1. **Sigmoid Probability Mapping**: Map continuous margin $z_i \\to p_i = \\frac{1}{1 + e^{-z_i}} \\in (0, 1)$.\n2. **Residual Gradient Calculation**: Subtract binary target $y_i$ from $p_i$: $g_i = p_i - y_i$. If $p_i > y_i$, $g_i > 0$ (prediction too high); if $p_i < y_i$, $g_i < 0$ (prediction too low).\n3. **Hessian Curvature Calculation**: Evaluate Variance-like curvature $h_i = p_i (1 - p_i)$. Clamp $h_i \\ge 10^{-6}$ to prevent division by zero.\n4. **Accumulation for Tree Search**: Store $g_i, h_i$ pairs to build tree split histograms.\n\n### Key Trade-Offs & Hardware Execution\n- **Vectorized SIMD Math**: Exponential math operations $e^{-z_i}$ are evaluated using SIMD vector instructions (AVX-512 `_mm512_exp_ps` or CUDA `__expf`).\n- **Numerical Floor (Clipping)**: Extremely confident predictions ($p_i \\approx 0$ or $p_i \\approx 1$) yield $h_i \\to 0$. Clamping $h_i \\ge 10^{-6}$ avoids division-by-zero errors in leaf weight formula $w^* = -G / (H + \\lambda)$.",
    constraints: [
      "1 <= N <= 1000000",
      "yTrue elements are 0 or 1",
      "rawPredictions elements are finite floats",
    ],
    examples: [
      {
        kind: "basic",
        title: "10-Sample Binary Logloss Derivative Computation",
        inputDisplay:
          "yTrue = [1, 0, 1, 0, 1, 1, 0, 0, 1, 0], rawPredictions = [0.0, 0.5, 1.2, -0.8, -1.5, 2.0, -0.4, 0.8, 1.1, -1.2]",
        outputDisplay:
          "Gradients g = [-0.5, 0.6225, -0.2315, 0.31, ...], Hessians h = [0.25, 0.235, 0.1779, 0.2139, ...]",
        input: DEFAULT_LOGLOSS_GRAD_HESS_INPUT,
        output: "([gradients], [hessians])",
        explanation:
          "Evaluates exact 1st-order gradients g_i = p_i - y_i and 2nd-order hessians h_i = p_i(1-p_i) across 10 samples.",
      },
    ],
    code: LOGLOSS_GRADIENT_HESSIAN_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Requires a single pass over $N$ samples, performing $O(N)$ sigmoid, gradient, and hessian evaluations.",
      space: "Requires $O(N)$ memory to store gradient and hessian output arrays.",
    },
    topicGuide: {
      overview:
        "The Binary Logistic Loss Gradient & Hessian Calculator evaluates 1st-order gradients and 2nd-order hessians for Binary Cross-Entropy in GBDTs.",
      sections: [
        {
          heading: "Core Concept & Binary Cross-Entropy Derivatives",
          body: "Logloss derivative w.r.t margin z yields gradient g_i = p_i - y_i and hessian h_i = p_i * (1 - p_i), where p_i = sigmoid(z_i).",
        },
        {
          heading: "Role of Hessian Curvature in XGBoost Split Search",
          body: "Hessians h_i represent the curvature of the loss surface. In XGBoost split gain and leaf weight formulas, H = sum(h_i) acts as sample weight scaling.",
        },
        {
          heading: "Numerical Stability & Hessian Floor Clamping",
          body: "When predictions become highly confident (p_i -> 0 or 1), hessian h_i -> 0. Clamping h_i >= 1e-6 prevents division by zero in leaf weight w* = -G / (H + lambda).",
        },
        {
          heading: "SIMD Vectorization & Fast Exp",
          body: "Production GBDT engines (LightGBM, CatBoost) compute sigmoid activations using AVX-512 or CUDA GPU kernels, processing 16-64 samples per instruction.",
        },
      ],
      keyTerms: [
        {
          term: "Logloss (Binary Cross-Entropy)",
          definition: "Loss function -[y log(p) + (1-y) log(1-p)] for binary classification.",
        },
        {
          term: "Gradient Residual (g_i)",
          definition:
            "1st-order derivative g_i = p_i - y_i measuring directional prediction error.",
        },
        {
          term: "Hessian Curvature (h_i)",
          definition: "2nd-order derivative h_i = p_i (1 - p_i) measuring loss surface curvature.",
        },
        {
          term: "Margin Prediction (z_i)",
          definition: "Un-transformed continuous log-odds prediction output of GBDT tree ensemble.",
        },
      ],
    },
    trivia: LOGLOSS_GRADIENT_HESSIAN_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 8" }],
    defaultInput: DEFAULT_LOGLOSS_GRAD_HESS_INPUT,
    generateSteps: generateLoglossGradHessSteps,
  };
