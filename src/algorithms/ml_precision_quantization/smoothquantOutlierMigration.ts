import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface smoothquantOutlierMigrationInput {
  values?: number[];
  activations?: number[];
  weights?: number[];
  alpha?: number;
}

export const SMOOTHQUANTOUTLIERMIGRATION_CODE = `def smoothquant_outlier_migration(activations, weights, alpha=0.5):
    s_vector = [abs(x) ** alpha if abs(x) > 0 else 1.0 for x in activations]
    smoothed_act = [a / s for a, s in zip(activations, s_vector)]
    smoothed_weights = [w * s for w, s in zip(weights, s_vector)]
    return smoothed_act, smoothed_weights, s_vector`;

export const DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT: smoothquantOutlierMigrationInput = {
  activations: [10.0, -25.0, 4.0, -1.0, 16.0],
  weights: [0.5, 0.2, 1.5, -2.0, 0.8],
  alpha: 0.5,
};

const toBitItems = (val: number): BitItem[] => {
  const clamped = Math.max(-128, Math.min(127, Math.round(val)));
  const uval = clamped < 0 ? (clamped + 256) & 0xff : clamped & 0xff;
  const bitStr = uval.toString(2).padStart(8, "0");
  return bitStr.split("").map((b, i) => ({
    index: 7 - i,
    label: i === 0 ? "Sign" : `b${7 - i}`,
    value: b,
    state: i === 0 ? "sign" : "quantized",
  }));
};

export const generateSmoothquantOutlierMigrationSteps = (
  input: smoothquantOutlierMigrationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const activations = input?.activations || input?.values || [10.0, -25.0, 4.0, -1.0, 16.0];
  const weights = input?.weights || [0.5, 0.2, 1.5, -2.0, 0.8];
  const alpha = input?.alpha ?? 0.5;

  const sVector: number[] = [];
  const smoothedAct: number[] = [];
  const smoothedWeights: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currSmoothed?: number,
    currScale?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? activations[0],
        quantizedValue: currSmoothed ?? 0,
        scale: currScale ?? 1.0,
        zeroPoint: 0,
        bits: toBitItems(currSmoothed ?? 0),
        title: "SmoothQuant Outlier Migration (LLM W8A8)",
      },
      auxiliaryState: {
        customState: {
          activations: `[${activations.join(", ")}]`,
          weights: `[${weights.join(", ")}]`,
          sVector: `[${sVector.map((s) => s.toFixed(4)).join(", ")}]`,
          alpha: String(alpha),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize SmoothQuant Outlier Migration Engine",
    `Preparing to migrate activation quantization difficulty to weight channels across ${activations.length} features (alpha = ${alpha}).`,
    { n: activations.length, alpha },
    activations[0],
    0,
    1.0,
  );

  // Multi-step scale calculation per channel
  activations.forEach((act, idx) => {
    addStep(
      2,
      `Inspect Activation Outlier ${idx}: x = ${act}`,
      `Reading activation channel x = ${act} at index ${idx}.`,
      { idx, act, phase: "INSPECT_ACTIVATION" },
      act,
      0,
      1.0,
    );

    const absAct = Math.abs(act);
    const sVal = absAct > 0 ? Math.pow(absAct, alpha) : 1.0;
    const sFixed = Number(sVal.toFixed(6));
    sVector.push(sFixed);

    addStep(
      2,
      `Compute Migration Scale Factor s_${idx}: |${act}|^${alpha} = ${sFixed}`,
      `Calculated per-channel smoothing scale factor s_${idx} = |${act}|^${alpha} = ${sFixed}.`,
      { idx, act, alpha, absAct, sVal: sFixed, phase: "COMPUTE_SCALE" },
      act,
      0,
      sFixed,
    );
  });

  // Multi-step activation scaling down pass
  activations.forEach((act, idx) => {
    const s = sVector[idx];

    addStep(
      3,
      `Activation Scaling Down Header: Channel ${idx}`,
      `Dividing activation ${act} by smoothing scale s_${idx} (${s.toFixed(4)}).`,
      { idx, act, s: Number(s.toFixed(4)), phase: "ACT_SCALE_HEADER" },
      act,
      0,
      s,
    );

    const smA = act / s;
    const smAFixed = Number(smA.toFixed(4));
    smoothedAct.push(smAFixed);

    addStep(
      3,
      `Scale Down Activation: smoothed_act[${idx}] = ${act} / ${s.toFixed(4)} -> ${smAFixed}`,
      `Divided activation ${act} by smoothing scale ${s.toFixed(4)} to produce smoothed activation ${smAFixed}. Outlier magnitude reduced.`,
      { idx, act, s: Number(s.toFixed(4)), smoothedAct: smAFixed, phase: "ACT_SCALE_DIV" },
      act,
      smAFixed,
      s,
    );
  });

  // Multi-step weight scaling up pass
  weights.forEach((w, idx) => {
    const s = sVector[idx];

    addStep(
      4,
      `Weight Scaling Up Header: Channel ${idx}`,
      `Multiplying weight ${w} by smoothing scale s_${idx} (${s.toFixed(4)}).`,
      { idx, weight: w, s: Number(s.toFixed(4)), phase: "WEIGHT_SCALE_HEADER" },
      w,
      0,
      s,
    );

    const smW = w * s;
    const smWFixed = Number(smW.toFixed(4));
    smoothedWeights.push(smWFixed);

    addStep(
      4,
      `Scale Up Weight: smoothed_weights[${idx}] = ${w} * ${s.toFixed(4)} -> ${smWFixed}`,
      `Multiplied weight ${w} by smoothing scale ${s.toFixed(4)} to absorb activation difficulty into weight channel ${smWFixed}.`,
      { idx, weight: w, s: Number(s.toFixed(4)), smoothedWeight: smWFixed, phase: "WEIGHT_SCALE_MUL" },
      w,
      smWFixed,
      s,
    );
  });

  // Step 5: Return result
  addStep(
    5,
    "Return Smoothed Activations, Weights, and Scale Vector `(smoothed_act, smoothed_weights, s_vector)`",
    `SmoothQuant migration complete. Preserves exact matrix multiplication identity (X_sm * W_sm == X * W).`,
    { n: activations.length, alpha },
    activations[activations.length - 1],
    smoothedAct[smoothedAct.length - 1] ?? 0,
    sVector[sVector.length - 1] ?? 1.0,
  );

  addStep(
    5,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    activations[activations.length - 1],
    smoothedAct[smoothedAct.length - 1] ?? 0,
    sVector[sVector.length - 1] ?? 1.0,
  );

  return steps;
};

const SMOOTHQUANTOUTLIERMIGRATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "smoothed_act = [a * s for a, s in zip(activations, s_vector)]",
    "s_vector = [a * alpha for a in activations]",
    "smoothed_weights = [w / s for w, s in zip(weights, s_vector)]",
    "return activations + weights",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting activations, weights, and hyperparameter alpha = 0.5." },
    { line: 2, hint: "Compute per-channel scale vector s_vector = |activations|^alpha." },
    { line: 3, hint: "Divide activations by smoothing scale vector to compress activation dynamic range." },
    { line: 4, hint: "Multiply weights by smoothing scale vector to absorb difficulty into weight channels." },
  ],
  lineExplanations: {
    1: "Declares function signature smoothquant_outlier_migration accepting activations, weights, and alpha = 0.5.",
    2: "Computes per-channel migration scale vector s_vector = |activations|^alpha.",
    3: "Scales down activation channel magnitudes by dividing by scale vector: smoothed_act = [a / s].",
    4: "Scales up weight channel magnitudes by multiplying by scale vector: smoothed_weights = [w * s].",
    5: "Returns tuple (smoothed_act, smoothed_weights, s_vector) maintaining mathematical GEMM equivalence.",
  },
};

export const smoothquantOutlierMigration: AlgorithmDefinition<smoothquantOutlierMigrationInput> = {
  id: "smoothquant-outlier-migration",
  title: "Smoothquant Outlier Migration",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### SmoothQuant Outlier Migration

SmoothQuant (Xiao et al., 2023) is a post-training quantization (PTQ) algorithm designed for Large Language Models (LLMs like OPT, LLaMA, Falcon). It solves the fundamental barrier in W8A8 INT8 LLM serving: **activation channel outliers**.

#### Why It Exists & What It Solves
In LLMs with over $6.7\\text{B}$ parameters, activation channels develop persistent numerical outliers that can be up to $100\\times$ larger than typical activation values. Quantizing activations directly to INT8 causes massive precision loss. Weights, however, are smooth and easy to quantize. SmoothQuant mathematically migrates quantization difficulty from activations to weights by introducing a per-channel diagonal scaling matrix $\\mathbf{S} = \\text{diag}(\\mathbf{s})$:
$$\\mathbf{Y} = \\mathbf{X} \\cdot \\mathbf{W} = \\left(\\mathbf{X} \\mathbf{S}^{-1}\\right) \\cdot \\left(\\mathbf{S} \\mathbf{W}\\right) = \\mathbf{\\hat{X}} \\cdot \\mathbf{\\hat{W}}$$

#### Step-by-Step Mechanism
1. **Per-Channel Scale Derivation**: For feature channel $j$, compute migration scale $s_j$ controlled by hyperparameter $\\alpha \\in [0, 1]$:
   $$s_j = \\frac{\\max(|X_j|)^{\\alpha}}{\\max(|W_j|)^{1 - \\alpha}}$$
   *(For $\\alpha = 0.5$, $s_j = \\sqrt{|X_j|}$)*.
2. **Activation Scaling Down**: Divide activation channel by $s_j$:
   $$\\hat{X}_j = \\frac{X_j}{s_j}$$
3. **Weight Scaling Up**: Multiply weight channel by $s_j$:
   $$\\hat{W}_j = W_j \\cdot s_j$$
4. **Exact Mathematical Identity**: $(\\hat{X}_j) \\cdot (\\hat{W}_j) = \\left(\\frac{X_j}{s_j}\\right) \\cdot (W_j \\cdot s_j) = X_j \\cdot W_j$.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time pass over $N$ feature channels.
- **Space Complexity**: $\\mathcal{O}(N)$ memory for scale vector and smoothed activation/weight arrays.
- **Trade-Off**: Enables $100\\%$ W8A8 INT8 LLM inference serving without accuracy degradation by balancing quantization difficulty between weights and activations.`,
  constraints: ["1 <= activations.length <= 1000", "-10^9 <= activations[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "SmoothQuant Outlier Migration",
      inputDisplay: "activations = [10.0, -25.0, 4.0], weights = [0.5, 0.2, 1.5], alpha = 0.5",
      outputDisplay: "s = [3.1623, 5.0, 2.0], act_sm = [3.1623, -5.0, 2.0], w_sm = [1.5811, 1.0, 3.0]",
      input: {
        activations: [10.0, -25.0, 4.0],
        weights: [0.5, 0.2, 1.5],
        alpha: 0.5,
      },
      output: "s = [3.1623, 5.0, 2.0], act_sm = [3.1623, -5.0, 2.0], w_sm = [1.5811, 1.0, 3.0]",
      explanation: "Scales down activation outlier -25.0 to -5.0 while scaling up weight 0.2 to 1.0, preserving exact product -5.0 * 1.0 = -5.0.",
    },
    {
      kind: "complex",
      title: "Full Migration (alpha = 1.0)",
      inputDisplay: "activations = [16.0, 9.0], weights = [1.0, 1.0], alpha = 1.0",
      outputDisplay: "s = [16.0, 9.0], act_sm = [1.0, 1.0], w_sm = [16.0, 9.0]",
      input: {
        activations: [16.0, 9.0],
        weights: [1.0, 1.0],
        alpha: 1.0,
      },
      output: "s = [16.0, 9.0], act_sm = [1.0, 1.0], w_sm = [16.0, 9.0]",
      explanation: "Full migration alpha = 1.0 collapses all activation dynamic range into weights.",
    },
    {
      kind: "negative",
      title: "Zero Activation Channel Protection",
      inputDisplay: "activations = [0.0], weights = [2.0], alpha = 0.5",
      outputDisplay: "s = [1.0], act_sm = [0.0], w_sm = [2.0]",
      input: {
        activations: [0.0],
        weights: [2.0],
        alpha: 0.5,
      },
      output: "s = [1.0], act_sm = [0.0], w_sm = [2.0]",
      explanation: "Zero activation channel falls back to scale 1.0, avoiding division by zero.",
    },
  ],
  code: SMOOTHQUANTOUTLIERMIGRATION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across feature channels.",
    space: "Linear space O(N) for smoothed activation, weight, and scale buffers.",
  },
  topicGuide: {
    overview:
      "SmoothQuant enables W8A8 INT8 quantization for 100B+ parameter LLMs without loss of accuracy. By smoothing out activation magnitude spikes across channels, both activations and weights can be quantized cleanly to INT8 using standard per-tensor/per-channel quantizers.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $\\mathbf{Y} = \\mathbf{X} \\cdot \\mathbf{W} = (\\mathbf{X} \\mathbf{S}^{-1}) \\cdot (\\mathbf{S} \\mathbf{W}) = \\mathbf{X}_{\\text{smooth}} \\cdot \\mathbf{W}_{\\text{smooth}}$. Smoothing scale $s_c = \\max(|X_c|)^\\alpha / \\max(|W_c|)^{1-\\alpha}$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "SmoothQuant is integrated into TensorRT-LLM and vLLM to serve LLMs (LLaMA-3, Mistral) in INT8 W8A8 precision.",
      },
      {
        heading: "Implementation Details & Scaling Vectors",
        body: "Implementation computes scale vector $s_j = |X_j|^\\alpha$, divides activation channels by $s_j$, and multiplies weight channels by $s_j$.",
      },
      {
        heading: "Edge Case Analysis & Alpha Parameter",
        body: "Edge cases include $\\alpha = 0.5$ balancing difficulty equally versus $\\alpha = 1.0$ migrating all outlier difficulty into weights.",
      },
    ],
    keyTerms: [
      {
        term: "Activation Outliers",
        definition: "Systematic 100x magnitude spikes occurring in specific LLM feature channels.",
      },
      {
        term: "Migration Scale (S)",
        definition: "Per-channel scaling factor shifting numerical dynamic range from activations to weights.",
      },
      {
        term: "W8A8 INT8 GEMM",
        definition: "Matrix multiplication where both weights and activations are stored and computed in 8-bit integers.",
      },
    ],
  },
  trivia: SMOOTHQUANTOUTLIERMIGRATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_SMOOTHQUANTOUTLIERMIGRATION_INPUT,
  generateSteps: generateSmoothquantOutlierMigrationSteps,
};
