import type {
  AlgorithmDefinition,
  AlgorithmStep,
  ArrayElement,
  ProblemExample,
} from "../../types/dsa";

export interface SpeculativeDecodingInput {
  draftTokens: number[]; // K draft tokens proposed by draft model
  draftProbabilities: number[]; // Draft model probabilities p_draft(x_i)
  targetProbabilities: number[]; // Target model probabilities p_target(x_i)
  gamma: number; // K draft length
}

export const SPECULATIVE_DECODING_VERIFIER_CODE = `def speculative_decoding_verifier(
    draft_tokens: list[int],
    p_draft: list[float],
    p_target: list[float],
    gamma: int
) -> list[int]:
    accepted_tokens = []
    
    # Evaluate draft tokens step by step via rejection sampling
    for i in range(gamma):
        token = draft_tokens[i]
        p_d = p_draft[i]
        p_t = p_target[i]
        
        # Acceptance condition: accept with probability min(1, p_target / p_draft)
        acceptance_ratio = p_t / p_d if p_d > 0 else 1.0
        
        # Deterministic simulation threshold (0.5 for visual step reproducibility)
        if acceptance_ratio >= 1.0 or 0.5 < acceptance_ratio:
            accepted_tokens.append(token)
        else:
            # Rejection: stop draft acceptance early and sample recovery token from target
            recovery_token = token + 100 # Target resampling
            accepted_tokens.append(recovery_token)
            break
            
    return accepted_tokens`;

export const DEFAULT_SPECULATIVE_DECODING_INPUT: SpeculativeDecodingInput = {
  draftTokens: [42, 108, 999, 15],
  draftProbabilities: [0.8, 0.7, 0.4, 0.6],
  targetProbabilities: [0.9, 0.75, 0.1, 0.5],
  gamma: 4,
};

export const SPECULATIVE_DECODING_EXAMPLES: ProblemExample<SpeculativeDecodingInput>[] = [
  {
    id: "basic",
    kind: "basic",
    title: "4-Token Speculative Draft Verification",
    input: {
      draftTokens: [42, 108, 999, 15],
      draftProbabilities: [0.8, 0.7, 0.4, 0.6],
      targetProbabilities: [0.9, 0.75, 0.1, 0.5],
      gamma: 4,
    },
    output: "Accepts tokens 42 and 108; rejects token 999 at position 3 and samples recovery token",
    explanation: "Draft tokens 1 and 2 pass target model verification ratio (p_target >= p_draft). Token 3 fails (0.1 < 0.4) and triggers target recovery.",
  },
  {
    id: "complex",
    kind: "complex",
    title: "Full Draft Acceptance (5 Tokens Verified in 1 Parallel Target Pass)",
    input: {
      draftTokens: [1, 2, 3, 4, 5],
      draftProbabilities: [0.5, 0.6, 0.4, 0.7, 0.5],
      targetProbabilities: [0.8, 0.9, 0.7, 0.85, 0.9],
      gamma: 5,
    },
    output: "All 5 draft tokens accepted in 1 target forward pass",
    explanation: "Achieves 5x speedup per target forward pass when all proposed tokens match target distribution.",
  },
  {
    id: "negative",
    kind: "negative",
    title: "First Token Rejection",
    input: {
      draftTokens: [77],
      draftProbabilities: [0.9],
      targetProbabilities: [0.1],
      gamma: 1,
    },
    output: "Token 77 rejected; target samples 177",
    explanation: "First token fails verification, falling back to standard 1-token target generation.",
  },
];

export function generateSpeculativeDecodingSteps(input: SpeculativeDecodingInput): AlgorithmStep[] {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { draftTokens, draftProbabilities, targetProbabilities, gamma } = input;

  if (
    gamma <= 0 ||
    !draftTokens ||
    !draftProbabilities ||
    !targetProbabilities ||
    draftTokens.length < gamma ||
    draftProbabilities.length < gamma ||
    targetProbabilities.length < gamma
  ) {
    steps.push({
      stepIndex: stepIndex++,
      codeLine: 1,
      explanation: {
        what: "Invalid Speculative Decoding Input",
        why: "Draft tokens, draft probabilities, and target probabilities must match gamma length.",
      },
      primarySnapshot: {
        kind: "array",
        elements: [],
      },
      auxiliaryState: { customState: { error: "Mismatch in draft and target lengths" } },
      variables: {},
    });
    return steps;
  }

  const acceptedTokens: number[] = [];

  const elements: ArrayElement[] = draftTokens.slice(0, gamma).map((token, idx) => ({
    id: `draft-${idx}`,
    value: token,
    state: "default",
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    activeIdx: number,
    vars: Record<string, string | number | boolean>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el, idx) => ({
          ...el,
          state: idx === activeIdx ? "active" : idx < activeIdx && acceptedTokens.length > idx ? "sorted" : "default",
          pointers: idx === activeIdx ? [`Draft #${idx}`] : undefined,
        })),
      },
      auxiliaryState: {
        customState: {
          draftTokensProposed: gamma,
          acceptedTokens: acceptedTokens.join(", "),
          targetParallelForwardPass: "1 forward pass evaluates all K tokens in parallel",
          speedupMultiplier: `${acceptedTokens.length}x vs single token generation`,
        },
      },
      variables: vars,
    });
  };

  addStep(
    1,
    "Initialize Speculative Decoding Verification",
    `Small draft model proposed ${gamma} candidate tokens. Launching 1 parallel target LLM forward pass to compute target probabilities.`,
    -1,
    { gamma, draftTokens: draftTokens.slice(0, gamma).join(", ") }
  );

  let rejected = false;

  for (let i = 0; i < gamma; i++) {
    const token = draftTokens[i];
    const pD = draftProbabilities[i];
    const pT = targetProbabilities[i];
    const ratio = pD > 0 ? pT / pD : 1.0;

    if (ratio >= 1.0 || 0.5 < ratio) {
      acceptedTokens.push(token);
      elements[i].state = "sorted";
      addStep(
        12,
        `Draft Token #${i} (Val: ${token}) Accepted`,
        `Target probability (${pT}) >= Draft probability (${pD}). Ratio: ${ratio.toFixed(2)}. Token accepted into final output sequence.`,
        i,
        { tokenIndex: i, token, pDraft: pD, pTarget: pT, ratio: ratio.toFixed(2) }
      );
    } else {
      const recoveryToken = token + 100;
      acceptedTokens.push(recoveryToken);
      elements[i].state = "swap";
      rejected = true;
      addStep(
        16,
        `Draft Token #${i} (Val: ${token}) Rejected`,
        `Target probability (${pT}) < Draft probability (${pD}). Ratio: ${ratio.toFixed(2)}. Draft sequence truncated; sampled recovery token (${recoveryToken}) from target distribution.`,
        i,
        { tokenIndex: i, draftToken: token, recoveryToken, pDraft: pD, pTarget: pT, ratio: ratio.toFixed(2) }
      );
      break;
    }
  }

  if (!rejected) {
    addStep(
      22,
      "All Draft Tokens Verified & Accepted",
      `Target model validated all ${gamma} draft tokens in 1 single forward pass. Achieved maximum ${gamma}x generation speedup.`,
      gamma - 1,
      { totalAccepted: acceptedTokens.length, speedup: `${acceptedTokens.length}x` }
    );
  }

  return steps;
}

export const speculativeDecodingVerifier: AlgorithmDefinition<SpeculativeDecodingInput> = {
  id: "speculative-decoding-verifier",
  title: "Speculative Decoding Draft & Verify",
  category: "ml_llm_serving",
  difficulty: "Hard",
  description:
    "Lossless LLM inference acceleration algorithm (Leviathan et al. / Chen et al.) that uses a small fast draft model to propose K candidate tokens, followed by a single parallel target model forward pass and rejection sampling verification.",
  isMlInfra: true,
  mlInfraLevel: 10,
  constraints: [
    "Draft length K (gamma) > 0",
    "Draft and target probabilities must be valid [0, 1] numbers",
    "Draft tokens array matching length gamma",
  ],
  examples: SPECULATIVE_DECODING_EXAMPLES,
  code: SPECULATIVE_DECODING_VERIFIER_CODE,
  timeComplexity: {
    best: "O(1) Target Forward Pass per K tokens",
    average: "O(1) Target Forward Pass per K tokens",
    worst: "O(1) Target Forward Pass per K tokens",
  },
  spaceComplexity: "O(K * d)",
  complexityAnalysis: {
    time: "Target LLM executes 1 parallel forward pass for K tokens instead of K sequential passes, reducing latency by 2x-3x with exact distribution preservation.",
    space: "Requires KV-cache allocation for K draft tokens during parallel verification pass.",
  },
  topicGuide: {
    overview:
      "Speculative Decoding (Leviathan et al. 2023, Chen et al. 2023) breaks the memory-bandwidth bottleneck of autoregressive LLM decoding. Since single-token generation is IO-bound, speculative decoding uses a fast, lightweight draft model (e.g. 1B params) to generate K tokens sequentially, then verifies all K tokens in a single parallel pass of the large target model (e.g. 70B params).",
    sections: [
      {
        heading: "Rejection Sampling",
        body: "Draft tokens are accepted with probability min(1, p_target(x) / p_draft(x)). This guarantees that the final generated token distribution is mathematically identical to sampling directly from the target model.",
      },
      {
        heading: "Speedup Dynamics",
        body: "Because target model matrix multiplications are matrix-vector (M = 1) during standard decoding, evaluating K draft tokens in parallel (M = K) achieves high GPU compute utilization without increasing latency.",
      },
    ],
    keyTerms: [
      {
        term: "Speculative Decoding",
        definition: "Accelerating LLM serving by verifying K draft model tokens in 1 parallel target model pass.",
      },
      {
        term: "Draft Model",
        definition: "Small, fast neural network used to propose candidate token sequences.",
      },
      {
        term: "Rejection Sampling",
        definition: "Statistical verification mechanism maintaining exact mathematical output distribution of the target model.",
      },
    ],
  },
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 10" }],
  defaultInput: DEFAULT_SPECULATIVE_DECODING_INPUT,
  generateSteps: generateSpeculativeDecodingSteps,
};
