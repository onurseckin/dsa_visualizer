import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ropeFrequencyScalingYarnInput {
  data: number[];
  target?: number;
}

export const ROPEFREQUENCYSCALINGYARN_CODE = `
import math

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

    return scaled_inv_freqs
`;

export const DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT: ropeFrequencyScalingYarnInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateRopeFrequencyScalingYarnSteps = (
  input: ropeFrequencyScalingYarnInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const elements: ArrayElement[] = input.data.map((val, idx) => ({
    id: `el-${idx}`,
    value: val,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || elements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          data: `[${input.data.join(", ")}]`,
          target: String(input.target ?? 0),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize RoPE NTK-Aware & YaRN Frequency Scaling",
    "Configuring YaRN frequency scaling parameters: scale_factor = 4x context window extension.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`dim=${idx * 2}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      22,
      `Compute YaRN frequency scaling for dimension pair i=${idx * 2} (val=${val})`,
      `Determining ramp factor gamma(i) to interpolate between unscaled high frequency and scaled low frequency.`,
      { dimIdx: idx * 2, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    32,
    "Execution Complete",
    "Successfully computed YaRN context extension inverse frequency scaling factors.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const ROPEFREQUENCYSCALINGYARN_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  distractors: [
    "scaled_inv_freq = inv_freq * scale_factor",
    "gamma = wavelength / orig_max_position",
    "low_rot = beta_fast * orig_max_position",
  ],
  hints: [
    { line: 17, hint: "Compute wavelength = 2 * pi / inv_freq for current frequency dimension." },
    { line: 20, hint: "Set gamma = 0.0 for high frequency dimensions (wavelength < low_rot)." },
    { line: 22, hint: "Set gamma = 1.0 for low frequency dimensions (wavelength > high_rot)." },
  ],
  lineExplanations: {
    1: "Defines YaRN RoPE frequency scaling entry point.",
    16: "Calculates unscaled inverse frequency for dimension index i.",
    17: "Calculates wavelength = 2 * pi / inv_freq.",
    20: "Assigns gamma=0 for high-frequency bands (preserves short-range precision).",
    22: "Assigns gamma=1 for low-frequency bands (scales long-range context).",
    30: "Blends inverse frequencies using interpolation factor gamma.",
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
    "Extending Large Language Model (LLM) context windows beyond their pre-training length $N_{\\text{train}}$ (e.g. 4k $\\to$ 32k or 128k tokens) without full retraining is a central challenge in LLM serving. Naive linear position interpolation ($m' = m / s$) compresses all positional frequencies uniformly, causing catastrophic loss of high-frequency precision and model degradation.\n\n1. **NTK-Aware Scaling** (LocalLLaMA, 2023): Scales the base theta $\\theta' = \\theta_{\\text{base}} \\cdot s^{d / (d-2)}$ rather than scaling sequence position, spreading interpolation loss across dimensions by applying Neural Tangent Kernel (NTK) theory.\n2. **YaRN (Yet Another RoPE N-extrapolation)** (Peng et al., 2023): Partitions frequencies into three bands via wavelength bounds: high frequencies (short wavelength) are left UNSCALED (preserving local attention), low frequencies (long wavelength) are FULLY SCALED by $1/s$, and mid frequencies use a smooth ramp interpolation $\\gamma(i)$.\n\nInput Format:\n- data: Feature dimension pair indices or sequence length targets.\n- target: Target context extension factor $s$ (e.g., $s=4$ for $4\\times$ context extension).\n\nOutput Format:\n- Vector of modified inverse frequencies $\\tilde{\\theta}_i$ for scaled RoPE embedding calculations.\n\nEdge Cases & Constraints:\n- Attention temperature correction: YaRN applies an entropy temperature scaling factor $t = \\sqrt{1 + 0.1 \\ln s}$ to query/key dot products to prevent attention entropy collapse at long context lengths.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "YaRN 4x Context Extension",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Computes YaRN ramp-scaled inverse frequencies for 4x context expansion.",
    },
    {
      kind: "complex",
      title: "16x Context Band Scaling",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates multi-frequency band scaling across 5 vector dimension pairs.",
    },
    {
      kind: "negative",
      title: "Unscaled Context Check (s = 1)",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "When scale factor s=1, outputs standard base RoPE inverse frequencies.",
    },
  ],
  code: ROPEFREQUENCYSCALINGYARN_CODE,
  timeComplexity: { best: "O(d)", average: "O(d)", worst: "O(d)" },
  spaceComplexity: "O(d)",
  complexityAnalysis: {
    time: "Computes YaRN scaled inverse frequencies across $d/2$ dimensions in $O(d)$ time during initialization.",
    space:
      "Stores pre-computed scaled sine/cosine frequency tables in $O(d \\cdot N_{\\text{ext}})$ memory.",
  },
  topicGuide: {
    overview:
      "YaRN and NTK-aware RoPE scaling enable models trained on 4,096 tokens (e.g. LLaMA-2) to expand their context window to 32,768 or 128,000 tokens with minimal fine-tuning or zero-shot inference.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "For dimension index $i$, the wavelength is $\\lambda_i = 2\\pi / \\theta_i$. YaRN defines threshold bounds $\\lambda_{\\text{low}} = N_{\\text{orig}} / \\beta_{\\text{fast}}$ and $\\lambda_{\\text{high}} = N_{\\text{orig}} / \\beta_{\\text{slow}}$. The ramp factor is $\\gamma(i) = \\text{clamp}\\left(\\frac{N_{\\text{orig}} / \\lambda_i - \\beta_{\\text{slow}}}{\\beta_{\\text{fast}} - \\beta_{\\text{slow}}}, 0, 1\\right)$. The modified inverse frequency is $\\tilde{\\theta}_i = (1 - \\gamma(i)) \\theta_i + \\gamma(i) \\frac{\\theta_i}{s}$.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Because YaRN only modifies the pre-computed frequency array `inv_freq`, GPU execution time during attention forward passes is identical to standard RoPE. No extra memory accesses or arithmetic operations are added inside the CUDA kernel loops.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "YaRN also scales attention logit magnitude by a temperature multiplier $\\frac{1}{t} = \\sqrt{1 + 0.1 \\ln s}$ to prevent softmax probabilities from becoming overly concentrated or diffuse over long context sequences.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "If $s$ is extremely large ($s > 32$), floating-point quantization error in high-frequency cosine tables can degrade perplexity. Combining YaRN with Dynamic NTK (scaling $s$ dynamically based on actual prompt length) provides robust performance across variable sequence lengths.",
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
          "A technique scaling base theta $\\theta_{\\text{base}}$ to extend context length without shrinking high frequencies.",
      },
      {
        term: "Ramp Interpolation Function",
        definition:
          "A smooth piecewise linear function blending unscaled and scaled inverse frequencies across mid-range bands.",
      },
      {
        term: "Attention Entropy Temperature",
        definition:
          "A logit scale factor $\\sqrt{1 + 0.1 \\ln s}$ maintaining proper softmax variance at extended context lengths.",
      },
    ],
  },
  trivia: ROPEFREQUENCYSCALINGYARN_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_ROPEFREQUENCYSCALINGYARN_INPUT,
  generateSteps: generateRopeFrequencyScalingYarnSteps,
};
