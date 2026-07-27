import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fullSpeculativeDecodingServingEngineInput {
  draft_tokens: number[];
  draft_probs: number[];
  target_probs: number[];
  recovery_token: number;
  target_next_token: number;
}

export const FULLSPECULATIVEDECODINGSERVINGENGINE_CODE = `
def full_speculative_decoding_serving_engine(draft_tokens, draft_probs, target_probs, recovery_token, target_next_token):
    """
    Executes one iteration of end-to-end Speculative Decoding verification & KV cache state update.
    Evaluates candidate tokens against target probabilities p(x) / q(x).
    On rejection: emits recovery token, rolls back KV cache for remaining draft positions.
    On full acceptance: appends target model's bonus token.
    """
    accepted_tokens = []
    gamma = len(draft_tokens)

    for i in range(gamma):
        x_i = draft_tokens[i]
        q_i = draft_probs[i]
        p_i = target_probs[i]
        
        # Speculative rejection sampling threshold check p_i / q_i
        ratio = p_i / max(q_i, 1e-7)
        if ratio >= 1.0:
            accepted_tokens.append(x_i)
        else:
            # Rejection occurs at step i: append recovery token and terminate draft loop
            accepted_tokens.append(recovery_token)
            kv_commit_count = i + 1
            return accepted_tokens, kv_commit_count, "REJECTED"

    # All gamma tokens accepted! Append target model's next bonus token x_{gamma+1}
    accepted_tokens.append(target_next_token)
    kv_commit_count = gamma + 1
    return accepted_tokens, kv_commit_count, "ALL_ACCEPTED"
`;

export const DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT: fullSpeculativeDecodingServingEngineInput =
  {
    draft_tokens: [12, 45, 89, 23],
    draft_probs: [0.85, 0.72, 0.91, 0.6],
    target_probs: [0.9, 0.8, 0.4, 0.75],
    recovery_token: 99,
    target_next_token: 105,
  };

export const generateFullSpeculativeDecodingServingEngineSteps = (
  input: fullSpeculativeDecodingServingEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.draft_tokens.map((tok, idx) => ({
    id: `draft-${idx}`,
    value: `Draft ${idx + 1}: tok=${tok} (q=${input.draft_probs[idx].toFixed(2)}, p=${input.target_probs[idx].toFixed(2)})`,
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
          gamma: String(input.draft_tokens.length),
          recovery_token: String(input.recovery_token),
          target_next_token: String(input.target_next_token),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Full Speculative Decoding Production Serving Engine",
    "Setting up candidate tokens, draft probabilities q(x), target probabilities p(x), and KV cache rollback manager.",
    { gamma: input.draft_tokens.length },
  );

  const currentElements = elements.map((el) => ({ ...el }));
  const acceptedTokens: number[] = [];
  let rejectedAt = -1;

  for (let i = 0; i < input.draft_tokens.length; i++) {
    const tok = input.draft_tokens[i];
    const q = input.draft_probs[i];
    const p = input.target_probs[i];
    const ratio = p / Math.max(q, 1e-7);

    if (ratio >= 1.0) {
      acceptedTokens.push(tok);
      currentElements[i] = {
        ...currentElements[i],
        state: "active",
        pointers: [`ACCEPTED`, `ratio=${ratio.toFixed(2)}`],
      };
      addStep(
        16,
        `Step ${i + 1}: Accept draft token ${tok}`,
        `Ratio p(x)/q(x) = ${ratio.toFixed(2)} >= 1.0. Token ${tok} accepted into output sequence.`,
        { step: i + 1, token: tok, ratio: Number(ratio.toFixed(2)), status: "ACCEPTED" },
        currentElements,
      );
    } else {
      rejectedAt = i;
      acceptedTokens.push(input.recovery_token);
      currentElements[i] = {
        ...currentElements[i],
        state: "compare",
        pointers: [`REJECTED`, `ratio=${ratio.toFixed(2)}`, `recovery=${input.recovery_token}`],
      };
      for (let j = i + 1; j < input.draft_tokens.length; j++) {
        currentElements[j] = {
          ...currentElements[j],
          state: "default",
          pointers: [`KV_ROLLBACK`],
        };
      }
      addStep(
        20,
        `Step ${i + 1}: Reject draft token ${tok} and Rollback KV Cache`,
        `Ratio p(x)/q(x) = ${ratio.toFixed(2)} < 1.0. Rejected token ${tok}. Appended recovery token ${input.recovery_token} and discarded downstream KV cache slots.`,
        {
          step: i + 1,
          token: tok,
          ratio: Number(ratio.toFixed(2)),
          recovery: input.recovery_token,
          status: "REJECTED",
        },
        currentElements,
      );
      break;
    }
  }

  if (rejectedAt === -1) {
    acceptedTokens.push(input.target_next_token);
    addStep(
      26,
      `All ${input.draft_tokens.length} draft tokens accepted! Append target bonus token ${input.target_next_token}`,
      "Target model parallel pass generated an extra bonus token. Total generated tokens = gamma + 1.",
      { bonus_token: input.target_next_token, total_accepted: acceptedTokens.length },
      currentElements.map((el) => ({ ...el, state: "sorted" as const })),
    );
  }

  const finalElements: ArrayElement[] = currentElements.map((el) => ({
    ...el,
    state: el.state === "default" ? "default" : "sorted",
  }));

  addStep(
    29,
    "Execution Complete",
    "Speculative decoding iteration complete. KV cache state updated and accepted token stream emitted.",
    { accepted_count: acceptedTokens.length, accepted_tokens: acceptedTokens.join(", ") },
    finalElements,
  );

  return steps;
};

const FULLSPECULATIVEDECODINGSERVINGENGINE_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "if ratio < 0.5: accepted_tokens.append(x_i)",
    "kv_commit_count = len(draft_tokens) # committing all KV cache regardless of rejection",
    "accepted_tokens = draft_tokens + [recovery_token]",
  ],
  hints: [{ line: 16, hint: "Accept draft token x_i if target ratio p_i / q_i >= 1.0." }],
  lineExplanations: {
    1: "Entry point for Full Speculative Decoding Production Serving Engine.",
    16: "Evaluates speculative rejection ratio p(x) / q(x) for candidate token x_i.",
    20: "Triggers rejection branch: appends recovery token and truncates uncommitted KV cache.",
    26: "Handles full acceptance scenario: appends target model bonus token x_{gamma+1}.",
    29: "Returns accepted token sequence and number of KV cache slots committed.",
  },
};

export const fullSpeculativeDecodingServingEngine: AlgorithmDefinition<fullSpeculativeDecodingServingEngineInput> =
  {
    id: "full-speculative-decoding-serving-engine",
    title: "Full Speculative Decoding Production Serving Engine",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Hard",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Production LLM serving engines (vLLM, TensorRT-LLM, SGLang) leverage end-to-end Speculative Decoding engines to accelerate autoregressive token generation. By coupling a fast draft model M_draft with a high-capacity target model M_target, speculative serving replaces gamma sequential, memory-bandwidth bound target forward passes with 1 draft generation phase followed by 1 parallel target verification pass.\n\nThis algorithm implements the core serving engine lifecycle for one speculative step: (1) Accept draft candidate tokens x_i while ratio p(x_i)/q(x_i) >= 1.0; (2) On rejection at index i, emit a recovery token sampled from the modified residual distribution, roll back the KV-cache to position i, and release uncommitted PagedAttention blocks; (3) If all gamma draft tokens are accepted, append the target model's bonus token x_{gamma+1}, achieving gamma + 1 tokens in a single target forward pass.\n\nInput Format:\n- draft_tokens: Array of gamma draft token candidates.\n- draft_probs: Array of draft candidate probabilities q(x_i).\n- target_probs: Array of target candidate probabilities p(x_i).\n- recovery_token: Token index sampled from residual distribution p'(x) if rejected.\n- target_next_token: Bonus token index from target model if all gamma accepted.\n\nOutput Format:\n- Returns a tuple of (accepted_tokens, kv_commit_count, status) containing accepted tokens, committed KV length, and execution status.\n\nEdge Cases & Constraints:\n- First-token rejection: If draft_tokens[0] is rejected, commits 1 token (recovery_token) and rolls back all draft KV blocks.\n- Full gamma acceptance: Emits gamma + 1 tokens, maximizing serving throughput speedup.\n- Zero-probability protection: Safeguards q(x) denominator with 1e-7 epsilon.",
    constraints: ["1 <= draft_tokens.length <= 16", "draft_probs[i] > 0", "target_probs[i] >= 0"],
    examples: [
      {
        kind: "basic",
        title: "Partial Draft Acceptance with KV Rollback",
        inputDisplay:
          "draft_tokens=[12, 45, 89], q=[0.85, 0.72, 0.91], p=[0.90, 0.80, 0.40], recovery=99",
        outputDisplay: "Accepted: [12, 45, 99], KV Committed: 3, Status: REJECTED",
        input: {
          draft_tokens: [12, 45, 89],
          draft_probs: [0.85, 0.72, 0.91],
          target_probs: [0.9, 0.8, 0.4],
          recovery_token: 99,
          target_next_token: 105,
        },
        output: "Accepted: [12, 45, 99], Status: REJECTED",
        explanation:
          "Tokens 0 and 1 are accepted (p/q >= 1). Token 2 is rejected (0.40/0.91 < 1), substituting recovery token 99.",
      },
      {
        kind: "complex",
        title: "100% Acceptance with Bonus Token",
        inputDisplay: "draft_tokens=[10, 20], q=[0.5, 0.5], p=[0.8, 0.9], bonus=30",
        outputDisplay: "Accepted: [10, 20, 30], KV Committed: 3, Status: ALL_ACCEPTED",
        input: {
          draft_tokens: [10, 20],
          draft_probs: [0.5, 0.5],
          target_probs: [0.8, 0.9],
          recovery_token: 99,
          target_next_token: 30,
        },
        output: "Accepted: [10, 20, 30], Status: ALL_ACCEPTED",
        explanation:
          "Both draft tokens accepted. Bonus token 30 appended for a total of 3 tokens generated.",
      },
    ],
    code: FULLSPECULATIVEDECODINGSERVINGENGINE_CODE,
    timeComplexity: { best: "O(gamma)", average: "O(gamma)", worst: "O(gamma)" },
    spaceComplexity: "O(gamma)",
    complexityAnalysis: {
      time: "O(gamma) linear scan across gamma draft tokens to evaluate acceptance and slice token buffers.",
      space: "O(gamma) memory space to store accepted token output arrays and KV commit pointers.",
    },
    topicGuide: {
      overview:
        "Full Speculative Decoding Serving Engines orchestrate draft model token sampling, parallel target model verification, modified rejection sampling, and KV-cache rollbacks.",
      sections: [
        {
          heading: "Overview",
          body: "Autoregressive generation in large target models (e.g. 70B+ LLMs) spends over 90% of its execution time reading weights from GPU DRAM. Speculative Decoding engines eliminate this bottleneck by running a fast draft model to propose gamma tokens, verified simultaneously in 1 parallel target pass.",
        },
        {
          heading: "Core Concepts",
          body: "The engine executes a three-phase pipeline: (1) Draft sampling yields gamma candidate tokens x_1..gamma; (2) Target model runs a parallel forward pass over gamma+1 positions; (3) Verification loop compares p(x)/q(x) ratios. If ratio >= 1, token is accepted. If rejected, a recovery token is sampled and downstream KV cache positions are rolled back.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "By turning gamma memory-bandwidth bound sequential steps into 1 matrix-matrix verification pass, the engine achieves 2.0x-3.2x latency speedup. Memory bandwidth utilization per output token decreases proportionally to the average acceptance rate.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key system requirements include atomic KV-cache rollbacks in PagedAttention block tables, thread-safe draft probability logging, handling tree-structured speculation (Medusa/Eagle), and managing residual sampling distributions without statistical bias.",
        },
      ],
      keyTerms: [
        {
          term: "Speculative Decoding Engine",
          definition:
            "System orchestration component coordinating draft proposal, target verification, and KV state management.",
        },
        {
          term: "Target Verification Pass",
          definition: "Single parallel target model forward pass over gamma + 1 token positions.",
        },
        {
          term: "Rejection Sampling Theorem",
          definition:
            "Statistical proof guaranteeing speculative outputs strictly match the exact target model distribution.",
        },
        {
          term: "KV Cache Rollback",
          definition:
            "Truncating uncommitted key-value tensor slots in PagedAttention when a draft token is rejected.",
        },
      ],
    },
    trivia: FULLSPECULATIVEDECODINGSERVINGENGINE_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_FULLSPECULATIVEDECODINGSERVINGENGINE_INPUT,
    generateSteps: generateFullSpeculativeDecodingServingEngineSteps,
  };
