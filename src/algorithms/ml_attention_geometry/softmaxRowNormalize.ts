import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface softmaxRowNormalizeInput {
  data: number[];
  target?: number;
}

export const SOFTMAXROWNORMALIZE_CODE = `
import math

def safe_softmax_row_normalize(logits: list[float]) -> tuple[list[float], float, float]:
    """
    Computes numerically stable Softmax over a vector of logit scores.
    1. Subtracts maximum logit m = max(logits) to prevent exp() float overflow.
    2. Sums exponentiated values lse = sum(exp(x - m)).
    3. Normalizes p_i = exp(x_i - m) / lse.
    Returns (probabilities, max_logit, log_sum_exp).
    """
    # Step 1: Maximum logit reduction for numerical stability
    max_logit = max(logits)
    
    # Step 2: Subtract max and exponentiate
    exp_vals = [math.exp(x - max_logit) for x in logits]
    
    # Step 3: Sum exponentiated terms (log-sum-exp denominator)
    lse_sum = sum(exp_vals)
    
    # Step 4: Normalize to produce probability distribution summing to 1.0
    probabilities = [val / lse_sum for val in exp_vals]
    
    return probabilities, max_logit, lse_sum
`;

export const DEFAULT_SOFTMAXROWNORMALIZE_INPUT: softmaxRowNormalizeInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateSoftmaxRowNormalizeSteps = (
  input: softmaxRowNormalizeInput,
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
    "Initialize Softmax Row Normalizer",
    "Setting up logit normalization pass: computing row max and sum-exp denominator.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`i=${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Evaluate logit ${idx} (value=${val}): subtract row max for stability`,
      `Computing exp(x - max_logit) to prevent floating-point overflow during probability reduction.`,
      { idx, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    24,
    "Execution Complete",
    "Successfully normalized logit scores into valid probability distribution summing to 1.0.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const SOFTMAXROWNORMALIZE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  distractors: [
    "exp_vals = [math.exp(x) for x in logits]",
    "probabilities = [val / max_logit for val in exp_vals]",
    "max_logit = sum(logits) / len(logits)",
  ],
  hints: [
    { line: 15, hint: "Subtract maximum logit max_logit to ensure exp(x - max) <= 1.0." },
    { line: 21, hint: "Sum exponentiated values to form normalization denominator." },
    { line: 24, hint: "Divide each exp value by sum to form probabilities summing to 1.0." },
  ],
  lineExplanations: {
    1: "Defines safe Softmax row normalization entry point.",
    15: "Finds maximum logit scalar m = max(logits) across row.",
    18: "Subtracts max_logit and exponentiates each score.",
    21: "Accumulates sum-exp denominator lse = sum(exp(x - m)).",
    24: "Divides each exponentiated term by denominator to yield probabilities.",
    26: "Returns normalized probability array, max_logit, and sum-exp scalar.",
  },
};

export const softmaxRowNormalize: AlgorithmDefinition<softmaxRowNormalizeInput> = {
  id: "softmax-row-normalize",
  title: "Softmax Row Normalizer",
  category: "ml_attention_geometry",
  categories: ["ml_attention_geometry", "math_and_number_theory"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 7,
  mlInfraCategory: "ml_attention_geometry",
  description:
    "Softmax Row Normalization converts a vector of un-normalized logit scores $x \\in \\mathbb{R}^N$ into a probability distribution $p \\in [0, 1]^N$ where $\\sum_{i=1}^N p_i = 1.0$. Naive evaluation $p_i = e^{x_i} / \\sum_j e^{x_j}$ suffers from severe floating-point overflow when $x_i > 88.7$ in IEEE 754 float32 or $x_i > 11.0$ in float16 ($e^{88.7} > 3.4 \\times 10^{38}$).\n\nSafe Softmax subtracts the maximum logit $m = \\max_j x_j$ before exponentiation:\n$$p_i = \\frac{e^{x_i - m}}{\\sum_{j=1}^N e^{x_j - m}}$$\nSince $x_i - m \\le 0$, every exponent $e^{x_i - m} \\in (0, 1]$, guaranteeing complete numerical stability against overflow.\n\nInput Format:\n- data: Logit score vector $x \\in \\mathbb{R}^N$.\n- target: Target logit index for step inspection.\n\nOutput Format:\n- Normalized probability vector $p$, maximum logit scalar $m$, and log-sum-exp denominator $\\ell$.\n\nEdge Cases & Constraints:\n- Masked $-\\infty$ logits: Masked positions where $x_i = -\\infty$ yield $e^{-\\infty - m} = 0$, producing zero probability without NaN propagation.\n- All equal logits: If $x_1 = x_2 = \\dots = x_N$, output is exact uniform distribution $1/N$.",
  constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Logit Normalization",
      inputDisplay: "data = [10, 20, 30], target = 30",
      outputDisplay: "[10, 20, 30]",
      input: { data: [10, 20, 30], target: 30 },
      output: "[10, 20, 30]",
      explanation: "Computes safe Softmax probabilities for 3 logit scores.",
    },
    {
      kind: "complex",
      title: "Large Scale Difference",
      inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
      outputDisplay: "[1, 2, 3, 4, 5]",
      input: { data: [1, 2, 3, 4, 5], target: 4 },
      output: "[1, 2, 3, 4, 5]",
      explanation: "Evaluates stable exponentiation across a 5-element logit vector.",
    },
    {
      kind: "negative",
      title: "Uniform Logits Check",
      inputDisplay: "data = [5, 10, 15], target = 99",
      outputDisplay: "[5, 10, 15]",
      input: { data: [5, 10, 15], target: 99 },
      output: "[5, 10, 15]",
      explanation: "Safely handles equal logit scores returning uniform probability distribution.",
    },
  ],
  code: SOFTMAXROWNORMALIZE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Requires two linear passes over $N$ elements: 1 pass for max reduction $m$, 1 pass for sum-exp $\\ell$ and normalization.",
    space: "Requires $O(N)$ auxiliary memory for storing normalized probabilities.",
  },
  topicGuide: {
    overview:
      "Softmax row normalization is the core non-linear activation function in self-attention matrices. Its numerical stability and GPU hardware acceleration (via warp shuffle reductions) are essential for deep neural network training.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Softmax maps $\\mathbb{R}^N \\to \\Delta^{N-1}$ (the standard probability simplex). Mathematically, $\\text{Softmax}(x - c) = \\text{Softmax}(x)$ for any scalar shift $c$. Setting $c = \\max_j x_j$ forces all exponents into $(-\\infty, 0]$, eliminating overflow completely.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "In CUDA kernels, row-wise Softmax reduction uses warp shuffle instructions (`__shfl_xor_sync`) to compute $m = \\max_j x_j$ and $\\ell = \\sum_j e^{x_j - m}$ across 32 threads in 5 clock cycles without shared memory access.",
      },
      {
        heading: "Implementation Nuances & Data Structures",
        body: "Online Softmax (Milakov & Gimelshein 2018, FlashAttention) merges the max reduction and sum-exp computation into a single tile pass by updating running scale factors $e^{m_{\\text{old}} - m_{\\text{new}}}$.",
      },
      {
        heading: "Edge Case Analysis & Production Robustness",
        body: "If all logits in a row are $-\\infty$ (e.g. fully masked causal row), $e^{-\\infty - (-\\infty)} = e^{\\text{NaN}} = \\text{NaN}$. Kernel implementations guard against fully masked rows by defaulting $p = 0.0$.",
      },
    ],
    keyTerms: [
      {
        term: "Safe Softmax",
        definition:
          "Subtracting the maximum logit $m = \\max_j x_j$ prior to exponentiation to prevent numerical overflow.",
      },
      {
        term: "Log-Sum-Exp (LSE)",
        definition:
          "The log-sum-exp normalization factor $\\ln\\left(\\sum_j e^{x_j - m}\\right) + m$.",
      },
      {
        term: "Warp Shuffle Reduction",
        definition:
          "Hardware GPU instruction communicating registers directly between warp threads without DRAM memory access.",
      },
      {
        term: "Probability Simplex",
        definition: "The geometric space of vectors with non-negative entries summing to 1.0.",
      },
    ],
  },
  trivia: SOFTMAXROWNORMALIZE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 7" }],
  defaultInput: DEFAULT_SOFTMAXROWNORMALIZE_INPUT,
  generateSteps: generateSoftmaxRowNormalizeSteps,
};
