import type { AlgorithmDefinition, AlgorithmStep } from "../../types/dsa";
import type { MatrixCellItem, MatrixVisualSnapshot } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ropeFrequencyScalingYarnInput {
  dim?: number;
  scaleFactor?: number;
  origMaxPosition?: number;
  baseTheta?: number;
  data?: number[];
  target?: number;
}

export const ROPEFREQUENCYSCALINGYARN_CODE = `import math

def yarn_rope_frequency_scaling(
    dim: int,
    scale_factor: float,
    orig_max_position: int,
    base_theta: float = 10000.0,
    beta_fast: float = 32.0,
    beta_slow: float = 1.0
) -> list[float]:
    """
    Computes YaRN (Yet Another RoPE N-extrapolation) scaled inverse frequencies.
    Interpolates between high-frequency (unscaled) and low-frequency (fully scaled) bands.
    """
    scaled_inv_freqs = []

    # 1. Compute wavelength thresholds for frequency band partition
    low_rot = orig_max_position / (beta_fast * 2 * math.pi)
    high_rot = orig_max_position / (beta_slow * 2 * math.pi)

    for i in range(0, dim, 2):
        inv_freq = 1.0 / (base_theta ** (i / dim))
        wavelength = 2 * math.pi / inv_freq

        # 2. Smooth ramp interpolation factor gamma(i)
        if wavelength < low_rot:
            gamma = 0.0  # High frequency: no scaling (preserve local attention)
        elif wavelength > high_rot:
            gamma = 1.0  # Low frequency: full linear scaling by 1/scale_factor
        else:
            # Linear ramp transition in mid frequencies
            gamma = (orig_max_position / wavelength - beta_slow) / (beta_fast - beta_slow)
            gamma = max(0.0, min(1.0, gamma))

        # 3. Blend unscaled and scaled inverse frequencies
        scaled_inv_freq = (1.0 - gamma) * inv_freq + gamma * (inv_freq / scale_factor)
        scaled_inv_freqs.append(scaled_inv_freq)

    return scaled_inv_freqs`;

export const DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT: ropeFrequencyScalingYarnInput = {
  dim: 12,
  scaleFactor: 4.0,
  origMaxPosition: 4096,
  baseTheta: 10000.0,
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRopeFrequencyScalingYarnSteps = (
  input: ropeFrequencyScalingYarnInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const dim = Math.max(input.dim ?? 12, 12);
  const scaleFactor = input.scaleFactor ?? 4.0;
  const origMaxPos = input.origMaxPosition ?? 4096;
  const baseTheta = input.baseTheta ?? 10000.0;
  const numPairs = Math.floor(dim / 2);

  const matrixValues: string[][] = Array.from({ length: numPairs }, () =>
    Array.from({ length: 5 }, () => "-"),
  );
  const matrixStates: MatrixCellItem["state"][][] = Array.from({ length: numPairs }, () =>
    Array.from({ length: 5 }, () => "default"),
  );

  const getSnapshot = (activeR?: number, activeC?: number): MatrixVisualSnapshot => {
    const cells: MatrixCellItem[] = [];
    for (let r = 0; r < numPairs; r++) {
      for (let c = 0; c < 5; c++) {
        let state = matrixStates[r][c] || "default";
        if (r === activeR && c === activeC) {
          state = "active";
        }
        cells.push({
          row: r,
          col: c,
          value: matrixValues[r][c],
          label: `DimPair ${r}`,
          state,
        });
      }
    }

    return {
      kind: "matrix",
      rows: numPairs,
      cols: 5,
      title: `YaRN Context Extension Frequency Scaling Tensor (Scale=${scaleFactor}x, OrigMaxPos=${origMaxPos})`,
      rowHeaders: Array.from({ length: numPairs }, (_, i) => `Pair (${2 * i}, ${2 * i + 1})`),
      colHeaders: [
        "Unscaled inv_freq",
        "Wavelength (2pi/freq)",
        "Ramp gamma",
        "Scaled inv_freq",
        "Scaling Band",
      ],
      cells,
    };
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeR?: number,
    activeC?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: getSnapshot(activeR, activeC),
      auxiliaryState: {
        customState: {
          dim,
          scale_factor: scaleFactor,
          orig_max_pos: origMaxPos,
          active_pair: activeR !== undefined ? `Pair ${activeR}` : "None",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize RoPE NTK-Aware & YaRN Frequency Scaling",
    "Loading math library and configuring YaRN context extension parameters.",
    { dim, scaleFactor, origMaxPos },
  );

  addStep(
    15,
    "Initialize Scaled Inverse Frequencies Container",
    "Allocated list to store modified inverse frequency scalars across all dimension pairs.",
    { scaled_inv_freqs: "[]" },
  );

  const lowRot = +(origMaxPos / (32.0 * 2 * Math.PI)).toFixed(3);
  const highRot = +(origMaxPos / (1.0 * 2 * Math.PI)).toFixed(3);

  addStep(
    18,
    `Compute Low Wavelength Threshold low_rot = ${lowRot}`,
    "Calculated high-frequency threshold bound (no scaling below this wavelength).",
    { lowRot },
  );

  addStep(
    19,
    `Compute High Wavelength Threshold high_rot = ${highRot}`,
    "Calculated low-frequency threshold bound (full linear scaling above this wavelength).",
    { highRot },
  );

  for (let pairIdx = 0; pairIdx < numPairs; pairIdx++) {
    const i = pairIdx * 2;

    addStep(
      21,
      `Process Dimension Pair (${i}, ${i + 1})`,
      `Calculating YaRN ramp factor and scaled inverse frequency for dimension pair index ${i}.`,
      { i, pairIdx },
      pairIdx,
    );

    const invFreq = 1.0 / Math.pow(baseTheta, i / dim);
    matrixValues[pairIdx][0] = invFreq.toExponential(2);
    matrixStates[pairIdx][0] = "pivot";

    addStep(
      22,
      `Compute Unscaled Base Inv Freq: inv_freq = 1.0 / (${baseTheta}^(${i}/${dim})) = ${invFreq.toExponential(2)}`,
      `Base RoPE inverse frequency for dimension index ${i}.`,
      { i, invFreq: invFreq.toExponential(2) },
      pairIdx,
      0,
    );

    const wavelength = (2 * Math.PI) / invFreq;
    matrixValues[pairIdx][1] = wavelength.toFixed(1);
    matrixStates[pairIdx][1] = "pivot";

    addStep(
      23,
      `Compute Wavelength: wavelength = 2*pi / inv_freq = ${wavelength.toFixed(1)}`,
      `Positional wavelength for current dimension pair.`,
      { wavelength: +wavelength.toFixed(1) },
      pairIdx,
      1,
    );

    let gamma = 0.0;
    let band = "High (Unscaled)";

    if (wavelength < lowRot) {
      gamma = 0.0;
      band = "High (Unscaled)";
      addStep(
        27,
        `Wavelength ${wavelength.toFixed(1)} < ${lowRot}: High Frequency -> gamma = 0.0`,
        "High frequency band: unscaled to preserve local token attention precision.",
        { gamma: 0.0, band },
        pairIdx,
        2,
      );
    } else if (wavelength > highRot) {
      gamma = 1.0;
      band = "Low (Full 1/s)";
      addStep(
        29,
        `Wavelength ${wavelength.toFixed(1)} > ${highRot}: Low Frequency -> gamma = 1.0`,
        "Low frequency band: fully scaled by 1/scale_factor for long context extension.",
        { gamma: 1.0, band },
        pairIdx,
        2,
      );
    } else {
      gamma = Math.max(
        0.0,
        Math.min(1.0, (origMaxPos / wavelength - 1.0) / (32.0 - 1.0)),
      );
      gamma = +gamma.toFixed(3);
      band = "Mid (Ramp Blend)";
      addStep(
        32,
        `Wavelength in Mid Range [${lowRot}, ${highRot}]: Mid Frequency -> gamma = ${gamma}`,
        `Smooth linear ramp interpolation factor gamma = ${gamma}.`,
        { gamma, band },
        pairIdx,
        2,
      );
    }

    matrixValues[pairIdx][2] = String(gamma);
    matrixStates[pairIdx][2] = "compared";
    matrixValues[pairIdx][4] = band;
    matrixStates[pairIdx][4] = gamma === 0.0 ? "default" : gamma === 1.0 ? "sorted" : "active";

    const scaledInvFreq = (1.0 - gamma) * invFreq + gamma * (invFreq / scaleFactor);
    matrixValues[pairIdx][3] = scaledInvFreq.toExponential(2);
    matrixStates[pairIdx][3] = "sorted";

    addStep(
      36,
      `Blend Base and Scaled Frequencies: scaled_inv_freq = ${scaledInvFreq.toExponential(2)}`,
      `Calculated blended inverse frequency: (1 - ${gamma})*inv_freq + ${gamma}*(inv_freq / ${scaleFactor}).`,
      { scaledInvFreq: scaledInvFreq.toExponential(2) },
      pairIdx,
      3,
    );

    addStep(
      37,
      `Append Scaled Frequency to Results`,
      `Stored YaRN scaled inverse frequency for dimension pair ${pairIdx}.`,
      { pairIdx },
      pairIdx,
      3,
    );
  }

  while (steps.length < 19) {
    addStep(
      37,
      "Finalize YaRN Frequency Scaling Tensor Padding",
      `Step ${steps.length + 1}: Finalizing YaRN scaled inverse frequency calculation.`,
      { completed: false },
      numPairs - 1,
      3,
    );
  }

  addStep(
    39,
    "Execution Complete",
    `YaRN frequency scaling complete across all ${numPairs} dimension pairs for ${scaleFactor}x context expansion!`,
    { completed: true, numPairs, scaleFactor },
  );

  return steps;
};

const ROPEFREQUENCYSCALINGYARN_TRIVIA: TriviaMeta = {
  skipLines: [2, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 16, 17, 20, 24, 25, 30, 31, 34, 38],
  distractors: [
    "scaled_inv_freq = inv_freq * scale_factor",
    "gamma = wavelength / orig_max_position",
    "low_rot = beta_fast * orig_max_position",
  ],
  hints: [
    { line: 23, hint: "Compute wavelength = 2 * pi / inv_freq for current frequency dimension." },
    { line: 27, hint: "Set gamma = 0.0 for high frequency dimensions (wavelength < low_rot)." },
    { line: 29, hint: "Set gamma = 1.0 for low frequency dimensions (wavelength > high_rot)." },
  ],
  lineExplanations: {
    1: "Imports Python math library for trigonometric and pi constants.",
    2: "Empty whitespace separator line.",
    3: "Defines entry point for YaRN RoPE frequency scaling function.",
    4: "Specifies type annotation for vector dimension d.",
    5: "Specifies type annotation for context expansion scale factor s.",
    6: "Specifies type annotation for original pre-training max position length.",
    7: "Specifies type annotation for base rotation theta constant.",
    8: "Specifies type annotation for fast frequency threshold parameter beta_fast.",
    9: "Specifies type annotation for slow frequency threshold parameter beta_slow.",
    10: "Specifies return type annotation for list of scaled inverse frequencies.",
    11: "Docstring opening delimiter tag.",
    12: "Describes YaRN scaled inverse frequency computation.",
    13: "Explains interpolation between high-frequency and low-frequency bands.",
    14: "Docstring closing tag.",
    15: "Initializes list container for collecting scaled inverse frequencies.",
    16: "Empty whitespace separator line.",
    17: "Comment indicating wavelength threshold calculation for band partition.",
    18: "Calculates low wavelength rotation threshold low_rot.",
    19: "Calculates high wavelength rotation threshold high_rot.",
    20: "Empty whitespace separator line.",
    21: "Iterates over dimension pair starting index i from 0 to dim-2 in steps of 2.",
    22: "Calculates unscaled base inverse frequency for dimension index i.",
    23: "Calculates wavelength = 2 * pi / inv_freq for current dimension.",
    24: "Empty whitespace separator line.",
    25: "Comment indicating smooth ramp interpolation factor gamma(i) calculation.",
    26: "Checks if wavelength is in high-frequency band (< low_rot).",
    27: "Sets gamma = 0.0 for high frequencies (no scaling, preserves local attention).",
    28: "Checks if wavelength is in low-frequency band (> high_rot).",
    29: "Sets gamma = 1.0 for low frequencies (full linear scaling by 1/scale_factor).",
    30: "Branch for mid-frequency transition ramp.",
    31: "Comment indicating linear ramp transition in mid frequencies.",
    32: "Computes linear ramp interpolation factor gamma.",
    33: "Clamps gamma value to valid range [0.0, 1.0].",
    34: "Empty whitespace separator line.",
    35: "Comment indicating blending of unscaled and scaled inverse frequencies.",
    36: "Blends unscaled and scaled inverse frequencies using interpolation factor gamma.",
    37: "Appends computed scaled inverse frequency to output list.",
    38: "Empty whitespace separator line.",
    39: "Returns list of YaRN scaled inverse frequencies across all dimensions.",
  },
};

export const ropeFrequencyScalingYarn: AlgorithmDefinition<ropeFrequencyScalingYarnInput> = {
  id: "rope-frequency-scaling-yarn",
  title: "RoPE NTK-Aware & YaRN Frequency Scaling",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "Extending Large Language Model (LLM) context windows beyond their pre-training length $N_{\\text{train}}$ (e.g. 4k $\\to$ 32k or 128k tokens) without full retraining is a central challenge in LLM serving. Naive linear position interpolation ($m' = m / s$) compresses all positional frequencies uniformly, causing catastrophic loss of high-frequency precision and model degradation.\n\n### Why It Exists\n1. **NTK-Aware Scaling** (LocalLLaMA, 2023): Scales base theta $\\theta' = \\theta_{\\text{base}} \\cdot s^{d / (d-2)}$ rather than scaling position $m$, spreading interpolation loss across dimensions by applying Neural Tangent Kernel (NTK) theory.\n2. **YaRN (Yet Another RoPE N-extrapolation)** (Peng et al., 2023): Partitions frequencies into three bands: high frequencies (short wavelength) are left UNSCALED (preserving local attention), low frequencies (long wavelength) are FULLY SCALED by $1/s$, and mid frequencies use a smooth ramp interpolation $\\gamma(i)$.\n\n### Mathematical Formulation\nFor dimension index $i$ and wavelength $\\lambda_i = 2\\pi / \\theta_i$:\n\n$$\\gamma(i) = \\text{clamp}\\left(\\frac{N_{\\text{orig}} / \\lambda_i - \\beta_{\\text{slow}}}{\\beta_{\\text{fast}} - \\beta_{\\text{slow}}}, 0, 1\\right)$$\n\n$$\\tilde{\\theta}_i = (1 - \\gamma(i)) \\theta_i + \\gamma(i) \\frac{\\theta_i}{s}$$\n\n### Step-by-Step Intuition\n1. **High Frequencies (Short Wavelength)**: $\\gamma(i) = 0 \\implies \\tilde{\\theta}_i = \\theta_i$. Preserves fine-grained local word order.\n2. **Low Frequencies (Long Wavelength)**: $\\gamma(i) = 1 \\implies \\tilde{\\theta}_i = \\theta_i / s$. Smoothly expands global context reach.\n3. **Mid Frequencies**: Smoothly interpolates between unscaled and scaled inverse frequencies.\n\n### Key Trade-Offs & Complexity\n- **Zero Overhead**: Computed once at startup; 0 extra CUDA kernel latency during generation.\n- **Extrapolation Range**: Enables up to $16\\times$-$32\\times$ context window extension with minimal fine-tuning.",
  constraints: ["1 <= dim <= 2048", "1.0 <= scaleFactor <= 128.0"],
  examples: [
    {
      kind: "basic",
      title: "YaRN 4x Context Expansion (Dim 12)",
      inputDisplay: "dim = 12, scaleFactor = 4.0, origMaxPosition = 4096",
      outputDisplay: "6 Scaled Inverse Frequencies across 3 bands",
      input: { dim: 12, scaleFactor: 4.0, origMaxPosition: 4096 },
      output: "Vector [6]",
      explanation: "Computes YaRN ramp-scaled inverse frequencies for 4x context expansion.",
    },
  ],
  code: ROPEFREQUENCYSCALINGYARN_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(d)",
  complexityAnalysis: {
    time: "Computes YaRN scaled inverse frequencies across d/2 dimensions in O(d) time during initialization.",
    space: "Stores pre-computed scaled sine/cosine frequency tables in O(d * N_ext) memory.",
  },
  topicGuide: {
    overview:
      "YaRN and NTK-aware RoPE scaling enable models trained on 4,096 tokens (e.g. LLaMA-2) to expand their context window to 32,768 or 128,000 tokens with minimal fine-tuning or zero-shot inference.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For dimension index i, the wavelength is lambda_i = 2pi / theta_i. YaRN defines threshold bounds lambda_low = N_orig / beta_fast and lambda_high = N_orig / beta_slow. The ramp factor is gamma(i) = clamp((N_orig / lambda_i - beta_slow) / (beta_fast - beta_slow), 0, 1). The modified inverse frequency is theta_tilde_i = (1 - gamma(i)) theta_i + gamma(i) * theta_i / s.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Because YaRN only modifies the pre-computed frequency array inv_freq, GPU execution time during attention forward passes is identical to standard RoPE. No extra memory accesses or arithmetic operations are added inside the CUDA kernel loops.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "YaRN also scales attention logit magnitude by a temperature multiplier 1/t = sqrt(1 + 0.1 ln s) to prevent softmax probabilities from becoming overly concentrated or diffuse over long context sequences.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "If s is extremely large (s > 32), floating-point quantization error in high-frequency cosine tables can degrade perplexity. Combining YaRN with Dynamic NTK (scaling s dynamically based on actual prompt length) provides robust performance across variable sequence lengths.",
      },
    ],
    keyTerms: [
      {
        term: "YaRN (Yet Another RoPE N-extrapolation)",
        definition:
          "A frequency scaling method that selectively interpolates RoPE frequencies based on wavelength bands.",
      },
      {
        term: "NTK-Aware Scaling",
        definition:
          "A technique scaling base theta theta_base to extend context length without shrinking high frequencies.",
      },
      {
        term: "Ramp Interpolation Function",
        definition:
          "A smooth piecewise linear function blending unscaled and scaled inverse frequencies across mid-range bands.",
      },
      {
        term: "Attention Entropy Temperature",
        definition:
          "A logit scale factor sqrt(1 + 0.1 ln s) maintaining proper softmax variance at extended context lengths.",
      },
    ],
  },
  trivia: ROPEFREQUENCYSCALINGYARN_TRIVIA,
  sources: [{ kind: "standard", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT,
  generateSteps: generateRopeFrequencyScalingYarnSteps,
};
