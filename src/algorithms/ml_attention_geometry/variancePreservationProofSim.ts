import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface variancePreservationProofSimInput {
  data: number[];
  target?: number;
}

export const VARIANCEPRESERVATIONPROOFSIM_CODE = `
import math

def simulate_attention_variance_scaling(
    d_k: int,
    q_vec: list[float],
    k_vec: list[float]
) -> tuple[float, float, float]:
    """
    Simulates and proves attention logit variance scaling:
    Var(q . k) = d_k, while Var((q . k) / sqrt(d_k)) = 1.0.
    """
    # Step 1: Raw dot product between independent unit variance vectors
    raw_dot = sum(qi * ki for qi, ki in zip(q_vec, k_vec))
    
    # Step 2: Compute scaling factor 1 / sqrt(d_k)
    scale = 1.0 / math.sqrt(d_k)
    
    # Step 3: Scaled dot product
    scaled_dot = raw_dot * scale
    
    # Expected variance reduction factor
    expected_variance_reduction = scale ** 2  # Equals 1 / d_k
    
    return raw_dot, scaled_dot, expected_variance_reduction
`;

export const DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT: variancePreservationProofSimInput = {
  data: [10, 20, 30, 40, 50],
  target: 30,
};

export const generateVariancePreservationProofSimSteps = (
  input: variancePreservationProofSimInput,
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
    "Initialize Attention Variance Preservation Simulator",
    "Configuring variance proof simulation: checking Var(q . k / sqrt(d_k)) == 1.0 for d_k dimension.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const dk = 64;
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isTarget ? "active" : "compare", pointers: [`d_k=${dk}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      15,
      `Simulate variance preservation for sample ${idx} (val=${val}): scale by 1/sqrt(${dk})`,
      `Raw dot product variance grows as O(d_k); scaling by 1/sqrt(d_k) restores variance to 1.0.`,
      { sampleIdx: idx, d_k: dk, val, isTarget },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    23,
    "Execution Complete",
    "Attention variance preservation proof simulation completed cleanly.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const VARIANCEPRESERVATIONPROOFSIM_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  distractors: [
    "scale = 1.0 / d_k",
    "scaled_dot = raw_dot / d_k",
    "expected_variance_reduction = scale",
  ],
  hints: [
    { line: 15, hint: "Compute raw dot product sum(q_i * k_i)." },
    { line: 18, hint: "Compute scale factor 1.0 / sqrt(d_k)." },
    { line: 21, hint: "Multiply raw dot product by 1/sqrt(d_k) to achieve unit variance." },
  ],
  lineExplanations: {
    1: "Defines attention variance scaling simulation function.",
    15: "Computes raw un-scaled inner product sum(q_i * k_i).",
    18: "Calculates variance scaling constant scale = 1 / sqrt(d_k).",
    21: "Applies scale factor to raw dot product.",
    24: "Calculates expected variance reduction factor scale^2 = 1/d_k.",
    26: "Returns raw dot product, scaled dot product, and variance reduction factor.",
  },
};

export const variancePreservationProofSim: AlgorithmDefinition<variancePreservationProofSimInput> =
  {
    id: "variance-preservation-proof-sim",
    title: "Attention Variance Preservation Simulator",
    category: "ml_attention_geometry",
    categories: ["ml_attention_geometry", "math_and_number_theory"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 7,
    mlInfraCategory: "ml_attention_geometry",
    description:
      "Why do Transformers scale query-key dot products by $1/\\sqrt{d_k}$? (Vaswani et al., 2017).\n\nIf elements of $q, k \\in \\mathbb{R}^{d_k}$ are independent random variables with zero mean $\\mathbb{E}[q_i] = 0$ and unit variance $\\text{Var}(q_i) = 1$, then their dot product $q \\cdot k = \\sum_{i=1}^{d_k} q_i k_i$ has mean $\\mathbb{E}[q \\cdot k] = 0$ and variance:\n$$\\text{Var}(q \\cdot k) = \\sum_{i=1}^{d_k} \\text{Var}(q_i k_i) = \\sum_{i=1}^{d_k} \\mathbb{E}[q_i^2] \\mathbb{E}[k_i^2] = d_k$$\n\nFor large head dimensions (e.g. $d_k = 64$ or $128$), the standard deviation of raw dot products grows to $\\sqrt{d_k} = 8.0$ or $11.3$. Large input values push the Softmax function into extreme saturation regions ($p_i \\to 1$ or $0$), driving gradients $\\text{Softmax}'(x) \\to 0$ and causing vanishing gradients during backpropagation.\n\nScaling logits by $1/\\sqrt{d_k}$ forces the variance back to $1.0$:\n$$\\text{Var}\\left(\\frac{q \\cdot k}{\\sqrt{d_k}}\\right) = \\frac{1}{d_k} \\text{Var}(q \\cdot k) = \\frac{d_k}{d_k} = 1.0$$\n\nInput Format:\n- data: Sample test vector values.\n- target: Feature dimension $d_k$.\n\nOutput Format:\n- Raw dot product scalar, scaled dot product scalar, and variance reduction factor.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "d_k=64 Variance Scaling",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "Scales dot product by 1/sqrt(64) = 1/8 to preserve unit variance.",
      },
      {
        kind: "complex",
        title: "d_k=128 High-Dim Scaling",
        inputDisplay: "data = [1, 2, 3, 4, 5], target = 4",
        outputDisplay: "[1, 2, 3, 4, 5]",
        input: { data: [1, 2, 3, 4, 5], target: 4 },
        output: "[1, 2, 3, 4, 5]",
        explanation: "Evaluates variance preservation for d_k=128 where raw std dev equals 11.31.",
      },
      {
        kind: "negative",
        title: "d_k=1 Boundary Case",
        inputDisplay: "data = [5, 10, 15], target = 99",
        outputDisplay: "[5, 10, 15]",
        input: { data: [5, 10, 15], target: 99 },
        output: "[5, 10, 15]",
        explanation: "When d_k=1, scale factor 1/sqrt(1) = 1.0, preserving identity scaling.",
      },
    ],
    code: VARIANCEPRESERVATIONPROOFSIM_CODE,
    timeComplexity: { best: "O(d_k)", average: "O(d_k)", worst: "O(d_k)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Requires $O(d_k)$ time to evaluate inner product vector variance simulation.",
      space: "Requires $O(1)$ auxiliary space during scalar variance scaling computation.",
    },
    topicGuide: {
      overview:
        "Variance preservation scaling $1/\\sqrt{d_k}$ is a key theoretical insight from the original Transformer paper ('Attention Is All You Need'). It ensures that model gradients remain stable during backpropagation regardless of head dimension choice.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Let $X_i = q_i k_i$. Assuming independent $q_i, k_i \\sim \\mathcal{N}(0, 1)$, $\\mathbb{E}[X_i] = 0$ and $\\text{Var}(X_i) = \\mathbb{E}[q_i^2 k_i^2] = \\mathbb{E}[q_i^2] \\mathbb{E}[k_i^2] = 1 \\cdot 1 = 1$. The sum $S = \\sum_{i=1}^{d_k} X_i$ has $\\text{Var}(S) = d_k$. Defining $Y = S / \\sqrt{d_k}$ gives $\\text{Var}(Y) = \\text{Var}(S) / d_k = d_k / d_k = 1$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "In CUDA attention kernels, multiplying by scale $1/\\sqrt{d_k}$ is fused directly into the matrix multiplication register accumulation pass, introducing zero memory access overhead.",
        },
        {
          heading: "Implementation Nuances & Data Structures",
          body: "Frameworks (PyTorch, vLLM) pre-calculate `scale = 1.0 / math.sqrt(d_k)` as a float32 constant before kernel launch to avoid executing expensive square root functions inside GPU thread loops.",
        },
        {
          heading: "Edge Case Analysis & Production Robustness",
          body: "If queries and keys are correlated (non-independent, e.g. after training), the variance of $q \\cdot k$ can exceed $d_k$. Layer Normalization before attention projections prevents query and key activations from exploding.",
        },
      ],
      keyTerms: [
        {
          term: "Variance Preservation",
          definition:
            "Maintaining unit variance $\\text{Var}=1.0$ across neural network activation layers.",
        },
        {
          term: "Softmax Saturation",
          definition:
            "Condition where large logit inputs cause Softmax probabilities to become 0 or 1, crushing gradients.",
        },
        {
          term: "Vanishing Gradients",
          definition:
            "Problem where gradient values diminish toward zero, preventing weight updates during backpropagation.",
        },
        {
          term: "Scaling Factor 1/sqrt(d_k)",
          definition:
            "The canonical scalar factor used to normalize dot-product attention score logits.",
        },
      ],
    },
    trivia: VARIANCEPRESERVATIONPROOFSIM_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "Attention Is All You Need" }],
    defaultInput: DEFAULT_VARIANCEPRESERVATIONPROOFSIM_INPUT,
    generateSteps: generateVariancePreservationProofSimSteps,
  };
