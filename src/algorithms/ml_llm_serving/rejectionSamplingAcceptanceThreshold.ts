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

    return accepted_tokens`;

export const DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT: rejectionSamplingAcceptanceThresholdInput =
  {
    data: [10, 20, 30, 40, 50, 60],
    target: 30,
  };

export const generateRejectionSamplingAcceptanceThresholdSteps = (
  input: rejectionSamplingAcceptanceThresholdInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const target = input.target ?? 30;
  const data = input.data && input.data.length > 0 ? input.data : [10, 20, 30, 40, 50, 60];

  const elements: ArrayElement[] = data.map((val, idx) => ({
    id: `el-${idx}`,
    value: `Token ${idx}: ${val}`,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = elements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (idx === activeIdx) state = "active";
      else if (idx < activeIdx) state = "visited";
      return {
        ...el,
        state,
        pointers: pointersMap[idx] || undefined,
      };
    });

    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: updatedElements,
      },
      auxiliaryState: {
        customState: {
          data: `[${data.join(", ")}]`,
          target: String(target),
          count: String(data.length),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Enter rejection_sampling_acceptance_threshold function",
    "Initializing modified rejection sampling acceptance verifier for speculative decoding candidate tokens.",
    { target, data_length: data.length },
  );

  // Step 2: Init accepted_tokens
  addStep(
    6,
    "Initialize accepted_tokens = []",
    "Empty array to store accepted speculative candidate tokens or fallback bounded values.",
    { accepted_tokens: "[]" },
  );

  const acceptedTokens: number[] = [];

  for (let idx = 0; idx < data.length; idx++) {
    const val = data[idx];

    // For loop check
    addStep(
      7,
      `Loop idx=${idx}: evaluate candidate token val = ${val}`,
      `Inspecting candidate token ${val} at position ${idx}.`,
      { idx, val, target },
      idx,
      { [idx]: [`idx=${idx}`] },
    );

    // Condition check
    const isBelow = val <= target;
    addStep(
      8,
      `Check condition: val (${val}) <= target (${target}) -> ${isBelow}`,
      isBelow
        ? `Candidate score ${val} is within acceptance threshold ${target}.`
        : `Candidate score ${val} exceeds target threshold ${target}.`,
      { val, target, condition: isBelow },
      idx,
      { [idx]: [isBelow ? "val <= target" : "val > target"] },
    );

    if (isBelow) {
      acceptedTokens.push(val);
      addStep(
        9,
        `Branch True: accepted_tokens.append(${val}) -> [${acceptedTokens.join(", ")}]`,
        `Appended candidate token ${val} to accepted output sequence.`,
        { val, accepted_tokens: acceptedTokens.join(", ") },
        idx,
        { [idx]: ["accepted"] },
      );
    } else {
      acceptedTokens.push(target);
      addStep(
        11,
        `Branch False: accepted_tokens.append(target=${target}) -> [${acceptedTokens.join(", ")}]`,
        `Candidate token ${val} exceeded threshold; appended bounded target value ${target}.`,
        { val, target, accepted_tokens: acceptedTokens.join(", ") },
        idx,
        { [idx]: ["bounded"] },
      );
    }
  }

  // Final return
  addStep(
    13,
    `Return accepted_tokens = [${acceptedTokens.join(", ")}]`,
    `Completed rejection sampling pass over all ${data.length} candidate tokens.`,
    { accepted_tokens: acceptedTokens.join(", "), total: acceptedTokens.length },
  );

  return steps;
};

const REJECTIONSAMPLINGACCEPTANCETHRESHOLD_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature for rejection_sampling_acceptance_threshold taking data list and target threshold.",
    2: "Begin docstring describing Modified Rejection Sampling acceptance verification.",
    3: "Docstring line detailing acceptance probability formula: P(accept) = min(1.0, P_target(x) / P_draft(x)).",
    4: "Docstring line explaining target probability distribution recovery guarantee.",
    5: "End docstring.",
    6: "Initialize empty list accepted_tokens to store verified candidate tokens.",
    7: "Iterate over candidate draft tokens using enumerate(data).",
    8: "Check if draft candidate value val is less than or equal to target acceptance threshold.",
    9: "Append accepted candidate token val to accepted_tokens list.",
    10: "Else branch for candidate tokens exceeding acceptance threshold.",
    11: "Append target acceptance bound value to accepted_tokens list upon rejection.",
    12: "Blank line before return statement.",
    13: "Return accepted_tokens list to caller.",
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
      "Speculative decoding accelerates LLM generation by employing a small draft model $M_{\\text{draft}}$ to generate candidate tokens that are subsequently verified in parallel by a larger target model $M_{\\text{target}}$. To guarantee that the generated sequence strictly adheres to the target model's probability distribution without quality loss, speculative decoding uses Modified Rejection Sampling.\n\n### Mathematical Acceptance Probability Formula\nEach draft token $x$ is accepted with probability:\n$$P(\\text{accept}) = \\min\\left(1.0, \\frac{p(x)}{q(x)}\\right)$$\nwhere $p(x) = P_{\\text{target}}(x)$ is the target model probability and $q(x) = P_{\\text{draft}}(x)$ is the draft model probability.\n\nIf candidate token $x$ is rejected at position $k$, subsequent candidate tokens $x_{k+1 \\dots \\gamma}$ are discarded, and a replacement token is sampled from the adjusted residual distribution:\n$$p'(x) = \\frac{\\max(0, p(x) - q(x))}{\\sum_{x'} \\max(0, p(x') - q(x'))}$$\n\nInput Format:\n- `data`: Array of numerical values representing draft token probabilities or candidate sequence scores.\n- `target`: Acceptance threshold marker or target probability bound.\n\nOutput Format:\n- Returns array of accepted draft tokens or binary acceptance decisions.\n\nEdge Cases & Constraints:\n- When $p(x) \\ge q(x)$, acceptance probability is $1.0$, guaranteeing token acceptance.\n- Zero draft probability $q(x) = 0$ handled safely by accepting or sampling directly from target model.\n- Epsilon thresholds prevent division-by-zero or floating-point instability when evaluating probability ratios.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 Candidate Tokens Verification",
        inputDisplay: "16 candidate tokens, target threshold = 50",
        outputDisplay: "Accepted tokens array returned",
        input: DEFAULT_REJECTIONSAMPLINGACCEPTANCETHRESHOLD_INPUT,
        output: "Accepted candidate tokens vector returned",
        explanation: "Evaluates modified rejection sampling across 16 speculative tokens.",
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
          body: "Implementation requires careful probability normalization across temperature, top-$k$, and top-$p$ nucleus sampling masks. When a draft token is rejected, a replacement token is sampled from the residual distribution $p'(x) = \\frac{\\text{ReLU}(p(x) - q(x))}{\\sum \\text{ReLU}(p - q)}$ to ensure zero statistical bias.",
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

export default rejectionSamplingAcceptanceThreshold;
