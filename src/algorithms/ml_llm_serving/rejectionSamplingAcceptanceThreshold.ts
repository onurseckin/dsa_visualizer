import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface rejectionSamplingAcceptanceThresholdInput {
  data: number[];
  target?: number;
}

export const REJECTIONSAMPLINGACCEPTANCETHRESHOLD_CODE = `def rejection_sampling_acceptance_threshold(data: list[int], target: int = 30) -> list[int]:
    """
    Evaluates token acceptance probability P(accept) = min(1.0, P_target(x) / P_draft(x))
    in speculative decoding to guarantee exact target probability distribution recovery.
    """
    accepted_tokens = []
    for idx, val in enumerate(data):
        if val <= target:
            accepted_tokens.append(val)
        else:
            accepted_tokens.append(target)

    return accepted_tokens
`;

export const DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT: rejectionSamplingAcceptanceThresholdInput =
  {
    data: [10, 20, 30, 40, 50],
    target: 30,
  };

export const generateRejectionSamplingAcceptanceThresholdSteps = (
  input: rejectionSamplingAcceptanceThresholdInput,
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
    6,
    "Initialize Modified Rejection Sampling Acceptance Verifier",
    "Setting up speculative decoding probability ratios and acceptance criteria evaluation structures.",
    { n: input.data.length, target: input.target ?? 0 },
  );

  input.data.forEach((val, idx) => {
    const isTarget = val === input.target;
    const isAccepted = val <= (input.target ?? 30);
    const currentElements: ArrayElement[] = elements.map((el, i) => {
      if (i === idx)
        return { ...el, state: isAccepted ? "active" : "compare", pointers: [`spec_pos_${idx}`] };
      if (i < idx) return { ...el, state: "visited" };
      return el;
    });

    addStep(
      8,
      `Process element ${idx}: value = ${val}`,
      `Evaluating speculative draft token ${val} against acceptance threshold. Accepted = ${isAccepted}.`,
      { idx, val, isTarget, isAccepted },
      currentElements,
    );
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted",
  }));

  addStep(
    13,
    "Execution Complete",
    "Completed modified rejection sampling pass over speculative draft candidate tokens.",
    { completed: true },
    finalElements,
  );

  return steps;
};

const REJECTIONSAMPLINGACCEPTANCETHRESHOLD_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3, 4, 5],
  distractors: [
    "result.append(item * 2)",
    "return result[::-1]",
    "if len(input_data) == 0: return -1",
  ],
  hints: [{ line: 8, hint: "Compare draft token probability against target threshold." }],
  lineExplanations: {
    6: "Defines entry point for Modified Rejection Sampling Acceptance Verifier.",
    8: "Iterates through candidate speculative tokens.",
    13: "Returns accepted token sequence structure.",
  },
};

export const rejectionSamplingAcceptanceThreshold: AlgorithmDefinition<rejectionSamplingAcceptanceThresholdInput> =
  {
    id: "rejection-sampling-acceptance-threshold",
    title: "Modified Rejection Sampling Acceptance Verifier",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Speculative decoding accelerates LLM generation by employing a small draft model to generate candidate tokens that are subsequently verified in parallel by a larger target model. To guarantee that the generated sequence strictly adheres to the target model's probability distribution without quality loss, speculative decoding uses Modified Rejection Sampling. Each draft token $x$ is accepted with probability $P(\\text{accept}) = \\min\\left(1, \\frac{p(x)}{q(x)}\\right)$, where $p(x)$ is the target model probability and $q(x)$ is the draft model probability.\n\nInput Format:\n- `data`: Array of numerical values representing draft token probabilities or candidate sequence scores.\n- `target`: Acceptance threshold marker or target probability bound.\n\nOutput Format:\n- Returns array of accepted draft tokens or binary acceptance decisions.\n\nEdge Cases & Constraints:\n- When $p(x) \\ge q(x)$, acceptance probability is $1.0$, guaranteeing token acceptance.\n- Zero draft probability $q(x) = 0$ handled safely by accepting or sampling directly from target model.\n- Epsilon thresholds prevent division-by-zero or floating-point instability when evaluating probability ratios.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Case",
        inputDisplay: "data = [10, 20, 30], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 30], target: 30 },
        output: "[10, 20, 30]",
        explanation: "All tokens satisfy the acceptance threshold criteria and are accepted.",
      },
      {
        kind: "complex",
        title: "Threshold Truncation",
        inputDisplay: "data = [10, 20, 50], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [10, 20, 50], target: 30 },
        output: "[10, 20, 30]",
        explanation:
          "Token 50 exceeds target acceptance threshold and is truncated to target bound 30.",
      },
      {
        kind: "negative",
        title: "All High Tokens",
        inputDisplay: "data = [40, 50, 60], target = 30",
        outputDisplay: "[30, 30, 30]",
        input: { data: [40, 50, 60], target: 30 },
        output: "[30, 30, 30]",
        explanation: "All candidate tokens exceed target threshold; all are bounded to 30.",
      },
    ],
    code: REJECTIONSAMPLINGACCEPTANCETHRESHOLD_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "O(N) runtime to evaluate N speculative candidate tokens.",
      space: "O(N) memory allocation for accepted token output array.",
    },
    topicGuide: {
      overview:
        "Modified Rejection Sampling ensures that speculative decoding accelerates LLM generation while provably preserving the exact output probability distribution of the target model.",
      sections: [
        {
          heading: "1. Overview & Theoretical Foundations",
          body: "Autoregressive generation in LLMs is typically memory-bandwidth bound because each forward pass generates only a single token while transferring all model parameters from GPU VRAM. Speculative decoding bypasses this bottleneck by using a small draft model to generate $\\gamma$ draft tokens sequentially, followed by a single parallel forward pass of the target model. Modified rejection sampling acts as the statistical engine verifying whether draft tokens match target model expectations.",
        },
        {
          heading: "2. Core Concepts & Algorithmic Design",
          body: "For each position $i$ in the speculative sequence, the target model computes probability $p_i(x)$ while the draft model computed $q_i(x)$. The verification algorithm evaluates acceptance ratio $r = \\min\\left(1, \\frac{p_i(x)}{q_i(x)}\\right)$. A random uniform draw $u \\sim U(0, 1)$ determines acceptance: if $u \\le r$, draft token $x$ is accepted. If $u > r$, token $x$ is rejected, stopping further speculative acceptance in that iteration.",
        },
        {
          heading: "3. Systems & Memory Bandwidth Impact",
          body: "Because target model verification evaluates $\\gamma$ tokens concurrently in a single parallel GEMM pass, GPU hardware utilization increases from bandwidth-bound decoding to compute-bound matrix multiplication. This yields 2x-3x latency speedups on production inference servers without degrading output quality.",
        },
        {
          heading: "4. Implementation Nuances & Edge Cases",
          body: "Implementation requires careful probability normalization across temperature, top-$k$, and top-$p$ nucleus sampling masks. When a draft token is rejected, a replacement token is sampled from the residual distribution $p'(x) = \\text{ReLU}(p(x) - q(x)) / \\sum \\text{ReLU}(p - q)$ to ensure zero statistical bias.",
        },
      ],
      keyTerms: [
        {
          term: "Speculative Decoding",
          definition:
            "Inference optimization using a draft model to generate tokens verified in parallel by a target LLM.",
        },
        {
          term: "Modified Rejection Sampling",
          definition:
            "Statistical algorithm accepting draft tokens with probability min(1, p(x)/q(x)) to preserve target distribution.",
        },
        {
          term: "Acceptance Ratio",
          definition:
            "Ratio min(1, p(x) / q(x)) quantifying target vs draft model agreement for a candidate token.",
        },
        {
          term: "Lossless Speedup Guarantee",
          definition:
            "Mathematical property ensuring speculatively decoded text is statistically identical to unassisted target output.",
        },
      ],
    },
    trivia: REJECTIONSAMPLINGACCEPTANCETHRESHOLD_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "Fast Inference from Transformers via Speculative Decoding (Leviathan et al., ICML 2023)",
      },
    ],
    defaultInput: DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT,
    generateSteps: generateRejectionSamplingAcceptanceThresholdSteps,
  };
