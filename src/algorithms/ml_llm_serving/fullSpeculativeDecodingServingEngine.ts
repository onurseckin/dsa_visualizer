import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fullSpeculativeDecodingServingEngineInput {
  draft_tokens: number[];
  draft_probs: number[];
  target_probs: number[];
  recovery_token: number;
  target_next_token: number;
}

export const FULLSPECULATIVEDECODINGSERVINGENGINE_CODE = `def full_speculative_decoding_serving_engine(draft_tokens, draft_probs, target_probs, recovery_token, target_next_token):
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
    return accepted_tokens, kv_commit_count, "ALL_ACCEPTED"`;

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

  const { draft_tokens, draft_probs, target_probs, recovery_token, target_next_token } = input;
  const gamma = draft_tokens.length;

  const elements: ArrayElement[] = draft_tokens.map((tok, idx) => ({
    id: `draft-${idx}`,
    value: `Draft ${idx + 1}: tok=${tok} (q=${draft_probs[idx].toFixed(2)}, p=${target_probs[idx].toFixed(2)})`,
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
      else if (activeIdx >= 0 && idx < activeIdx) state = "visited";
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
          gamma: String(gamma),
          recovery_token: String(recovery_token),
          target_next_token: String(target_next_token),
        },
      },
      variables,
    });
  };

  // Step 1: Entry
  addStep(
    1,
    "Enter full_speculative_decoding_serving_engine function",
    "Initializing speculative decoding serving engine for target verification pass.",
    { gamma, recovery_token, target_next_token },
  );

  // Step 2: init accepted_tokens
  addStep(
    8,
    "Initialize accepted_tokens = []",
    "Empty array to accumulate verified accepted tokens and recovery token.",
    { accepted_tokens: "[]" },
  );

  // Step 3: init gamma
  addStep(
    9,
    `Initialize gamma = len(draft_tokens) -> ${gamma}`,
    "Speculative lookahead depth count.",
    { gamma },
  );

  const acceptedTokens: number[] = [];
  let rejected = false;

  for (let i = 0; i < gamma; i++) {
    // For loop check
    addStep(
      11,
      `Loop step i=${i} of gamma=${gamma}`,
      `Beginning evaluation of candidate token index ${i + 1}.`,
      { i, gamma },
      i,
      { [i]: [`i=${i}`] },
    );

    const x_i = draft_tokens[i];
    addStep(
      12,
      `Step ${i + 1}: Read x_i = draft_tokens[${i}] -> token ${x_i}`,
      `Draft candidate token index ${x_i}.`,
      { i, x_i },
      i,
    );

    const q_i = draft_probs[i];
    addStep(
      13,
      `Step ${i + 1}: Read q_i = draft_probs[${i}] -> ${q_i.toFixed(2)}`,
      `Draft model proposal probability $q(x_{${i + 1}}) = ${q_i.toFixed(2)}$.`,
      { i, q_i: Number(q_i.toFixed(2)) },
      i,
    );

    const p_i = target_probs[i];
    addStep(
      14,
      `Step ${i + 1}: Read p_i = target_probs[${i}] -> ${p_i.toFixed(2)}`,
      `Target model verification probability $p(x_{${i + 1}}) = ${p_i.toFixed(2)}$.`,
      { i, p_i: Number(p_i.toFixed(2)) },
      i,
    );

    const ratio = p_i / Math.max(q_i, 1e-7);
    addStep(
      17,
      `Step ${i + 1}: Compute ratio = p_i / max(q_i, 1e-7) -> ${ratio.toFixed(2)}`,
      `Rejection sampling acceptance ratio $p_i / q_i = ${p_i.toFixed(2)} / ${q_i.toFixed(2)} = ${ratio.toFixed(2)}$.`,
      { i, ratio: Number(ratio.toFixed(2)) },
      i,
    );

    const isAccepted = ratio >= 1.0;
    addStep(
      18,
      `Step ${i + 1}: Check if ratio (${ratio.toFixed(2)}) >= 1.0 -> ${isAccepted}`,
      isAccepted
        ? `Ratio ${ratio.toFixed(2)} >= 1.0: token ${x_i} is accepted unconditionally.`
        : `Ratio ${ratio.toFixed(2)} < 1.0: rejection triggered at draft index ${i}.`,
      { i, ratio: Number(ratio.toFixed(2)), isAccepted },
      i,
      { [i]: [isAccepted ? "ACCEPTED" : "REJECTED"] },
    );

    if (isAccepted) {
      acceptedTokens.push(x_i);
      addStep(
        19,
        `Step ${i + 1}: Branch True: accepted_tokens.append(${x_i}) -> [${acceptedTokens.join(", ")}]`,
        `Draft token ${x_i} accepted into final token sequence.`,
        { i, x_i, accepted_tokens: acceptedTokens.join(", ") },
        i,
        { [i]: ["ACCEPTED"] },
      );
    } else {
      rejected = true;
      addStep(
        22,
        `Step ${i + 1}: Branch False: accepted_tokens.append(recovery_token=${recovery_token})`,
        `Rejection at draft index ${i}! Appended recovery token ${recovery_token} sampled from residual distribution.`,
        { i, recovery_token, accepted_tokens: acceptedTokens.join(", ") },
        i,
        { [i]: ["REJECTED", `recovery=${recovery_token}`] },
      );

      acceptedTokens.push(recovery_token);
      const kv_commit_count = i + 1;
      addStep(
        23,
        `Step ${i + 1}: Set kv_commit_count = i + 1 -> ${kv_commit_count}`,
        `Rolling back KV cache for uncommitted draft positions ${i + 1}..${gamma - 1}. Retaining ${kv_commit_count} committed KV slots.`,
        { i, kv_commit_count },
        i,
      );

      addStep(
        24,
        `Step ${i + 1}: Return (accepted_tokens=[${acceptedTokens.join(", ")}], kv_commit_count=${kv_commit_count}, "REJECTED")`,
        `Speculative iteration terminated on rejection at index ${i}. Emitted ${acceptedTokens.length} tokens.`,
        {
          accepted_tokens: acceptedTokens.join(", "),
          kv_commit_count,
          status: "REJECTED",
        },
        i,
      );
      break;
    }
  }

  if (!rejected) {
    addStep(
      27,
      `All ${gamma} draft tokens accepted! Appending target_next_token = ${target_next_token}`,
      `100% draft acceptance! Appending target model's bonus token ${target_next_token} for position ${gamma + 1}.`,
      { target_next_token },
    );
    acceptedTokens.push(target_next_token);

    const kv_commit_count = gamma + 1;
    addStep(
      28,
      `Set kv_commit_count = gamma + 1 -> ${kv_commit_count}`,
      `Committed all ${gamma} draft KV slots plus ${1} bonus token slot = ${kv_commit_count} total KV positions.`,
      { kv_commit_count },
    );

    addStep(
      29,
      `Return (accepted_tokens=[${acceptedTokens.join(", ")}], kv_commit_count=${kv_commit_count}, "ALL_ACCEPTED")`,
      `Full speculative iteration completed with 100% acceptance! Generated ${acceptedTokens.length} tokens in 1 target pass.`,
      {
        accepted_tokens: acceptedTokens.join(", "),
        kv_commit_count,
        status: "ALL_ACCEPTED",
      },
    );
  }

  return steps;
};

const FULLSPECULATIVEDECODINGSERVINGENGINE_TRIVIA: TriviaMeta = {
  skipLines: [2, 3, 4, 5, 6, 7, 10, 15, 16, 21, 25, 26],
  distractors: [
    "accepted_tokens = list(draft_tokens)",
    "ratio = q_i / p_i",
    "kv_commit_count = gamma * 2",
    "if ratio < 1.0: accepted_tokens.append(x_i)",
  ],
  hints: [
    { line: 17, hint: "Compute ratio = p_i / max(q_i, 1e-7) with epsilon guard against division by zero." },
    { line: 22, hint: "On rejection, append recovery token and set kv_commit_count = i + 1." },
    { line: 27, hint: "On 100% acceptance, append target_next_token bonus token and set kv_commit_count = gamma + 1." },
  ],
  lineExplanations: {
    1: "Function signature for Full Speculative Decoding Production Serving Engine taking draft_tokens, draft_probs, target_probs, recovery_token, and target_next_token.",
    2: "Begin docstring describing end-to-end Speculative Decoding verification cycle.",
    3: "Docstring line detailing candidate token evaluation against target model probabilities.",
    4: "Docstring line detailing p(x) / q(x) ratio check.",
    5: "Docstring line detailing rejection recovery and KV cache rollback.",
    6: "Docstring line detailing bonus token addition on full acceptance.",
    7: "End docstring.",
    8: "Initialize empty list accepted_tokens to collect verified tokens.",
    9: "Compute speculative lookahead depth gamma = len(draft_tokens).",
    10: "Blank line before candidate evaluation loop.",
    11: "Loop over each speculative draft token candidate index i from 0 to gamma - 1.",
    12: "Extract draft candidate token x_i at position i.",
    13: "Extract draft model probability q_i for token x_i.",
    14: "Extract target model probability p_i for token x_i.",
    15: "Blank line before ratio calculation.",
    16: "Comment describing rejection sampling ratio check.",
    17: "Compute acceptance ratio = p_i / max(q_i, 1e-7) with epsilon zero-guard.",
    18: "Check if acceptance ratio is greater than or equal to 1.0.",
    19: "If ratio >= 1.0, accept draft token x_i and append to accepted_tokens.",
    20: "Else branch for speculative rejection at position i.",
    21: "Comment detailing rejection handling, recovery token emission, and KV rollback.",
    22: "Append recovery_token sampled from residual distribution to accepted_tokens.",
    23: "Set kv_commit_count = i + 1 to retain KV cache up to accepted recovery position.",
    24: "Return tuple of accepted_tokens, kv_commit_count, and status 'REJECTED'.",
    25: "Blank line before 100% acceptance fallback.",
    26: "Comment detailing 100% acceptance scenario and target model bonus token.",
    27: "Append target_next_token (bonus token x_{gamma+1}) to accepted_tokens.",
    28: "Set kv_commit_count = gamma + 1 to commit all draft KV slots plus bonus token.",
    29: "Return tuple of accepted_tokens, kv_commit_count, and status 'ALL_ACCEPTED'.",
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
      "Production LLM serving engines (vLLM, TensorRT-LLM, SGLang) leverage end-to-end Speculative Decoding engines to accelerate autoregressive token generation. By coupling a fast draft model $M_{\\text{draft}}$ with a high-capacity target model $M_{\\text{target}}$, speculative serving replaces $\\gamma$ sequential, memory-bandwidth bound target forward passes with 1 draft generation phase followed by 1 parallel target verification pass.\n\n### Speculative Acceptance & KV Commitment Math\nAt position $i \\in \\{0, \\dots, \\gamma-1\\}$:\n- Acceptance Ratio: $r_i = \\frac{p_i(x_i)}{\\max(q_i(x_i), \\epsilon)}$\n- **If $r_i \\ge 1.0$**: Token $x_i$ is accepted.\n- **If $r_i < 1.0$**: Token $x_i$ is rejected; emit `recovery_token`, set $\\text{kv\\_commit\\_count} = i + 1$, and truncate uncommitted KV slots $i+1 \\dots \\gamma-1$.\n- **If all $\\gamma$ tokens accepted**: Append `target_next_token` (bonus token $x_{\\gamma+1}$), setting $\\text{kv\\_commit\\_count} = \\gamma + 1$.\n\n### Input Parameters\n- `draft_tokens`: Array of $\\gamma$ draft token candidates.\n- `draft_probs`: Array of draft candidate probabilities $q(x_i)$.\n- `target_probs`: Array of target candidate probabilities $p(x_i)$.\n- `recovery_token`: Token index sampled from residual distribution $p'(x)$ if rejected.\n- `target_next_token`: Bonus token index from target model if all $\\gamma$ accepted.\n\n### Output\n- Returns tuple `(accepted_tokens, kv_commit_count, status)`.",
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
      time: "$O(\\gamma)$ linear scan across $\\gamma$ draft tokens to evaluate acceptance and slice token buffers.",
      space: "$O(\\gamma)$ memory space to store accepted token output arrays and KV commit pointers.",
    },
    topicGuide: {
      overview:
        "Full Speculative Decoding Serving Engines orchestrate draft model token sampling, parallel target model verification, modified rejection sampling, and KV-cache rollbacks.",
      sections: [
        {
          heading: "Overview & Serving Lifecycle",
          body: "Autoregressive generation in large target models (e.g. 70B+ LLMs) spends over 90% of its execution time reading weights from GPU DRAM. Speculative Decoding engines eliminate this bottleneck by running a fast draft model to propose $\\gamma$ tokens, verified simultaneously in 1 parallel target pass.",
        },
        {
          heading: "Verification Math & KV Rollback",
          body: "The engine executes a three-phase pipeline:\n1. **Draft Phase**: $M_{\\text{draft}}$ generates $\\gamma$ candidate tokens $x_1 \\dots x_\\gamma$.\n2. **Target Phase**: $M_{\\text{target}}$ runs a single parallel GEMM pass over $\\gamma+1$ positions.\n3. **Verification Loop**: Evaluates ratios $r_i = p_i(x_i)/q_i(x_i)$. If $r_i \\ge 1$, accept $x_i$. On rejection, emit recovery token and truncate uncommitted PagedAttention KV slots.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "By turning $\\gamma$ memory-bandwidth bound sequential steps into 1 matrix-matrix verification pass, the engine achieves 2.0x-3.2x latency speedup. Memory bandwidth utilization per output token decreases proportionally to the average acceptance rate.",
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

export default fullSpeculativeDecodingServingEngine;
