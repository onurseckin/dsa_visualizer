import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface targetModelParallelVerificationPassInput {
  data: number[];
  target?: number;
}

export const TARGETMODELPARALLELVERIFICATIONPASS_CODE = `def target_model_parallel_verification_pass(
    draft_tokens: list[int], target_threshold: int = 30
) -> list[bool]:
    verification_results = []
    for pos, token in enumerate(draft_tokens):
        if token <= target_threshold:
            verification_results.append(True)
        else:
            verification_results.append(False)
            break

    return verification_results
`;

export const DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT: targetModelParallelVerificationPassInput =
  {
    data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    target: 85,
  };

export const generateTargetModelParallelVerificationPassSteps = (
  input: targetModelParallelVerificationPassInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const targetThreshold = input.target ?? 85;

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
          target_threshold: String(targetThreshold),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Speculative Decoding Target Model Parallel Verification Pass",
    `Setting up target model parallel forward pass to verify ${input.data.length} candidate draft tokens in batch with threshold ${targetThreshold}.`,
    { n: input.data.length, target_threshold: targetThreshold },
    [...elements],
  );

  const verificationResults: boolean[] = [];

  addStep(
    4,
    "Initialize verification_results = []",
    "Empty array to accumulate boolean verification outcomes for candidate draft tokens.",
    { verification_results: "[]" },
    [...elements],
  );

  for (let idx = 0; idx < input.data.length; idx++) {
    const val = input.data[idx];
    const isAccepted = val <= targetThreshold;

    addStep(
      5,
      `Iteration ${idx + 1}/${input.data.length}: Inspect draft candidate token pos=${idx}, token=${val}`,
      `Evaluating target model verification for draft token ${val} at position ${idx}.`,
      { pos: idx, token: val, target_threshold: targetThreshold, isAccepted },
      elements.map((el, i) =>
        i === idx
          ? { ...el, state: "compare" as const, pointers: [`pos_${idx}`] }
          : i < idx
            ? { ...el, state: "visited" as const }
            : el,
      ),
    );

    if (isAccepted) {
      verificationResults.push(true);
      const currentElements: ArrayElement[] = elements.map((el, i) => {
        if (i === idx)
          return { ...el, state: "active" as const, pointers: [`pos_${idx}`, "ACCEPTED"] };
        if (i < idx) return { ...el, state: "visited" as const, pointers: ["ACCEPTED"] };
        return el;
      });

      addStep(
        6,
        `Check Condition: token (${val}) <= target_threshold (${targetThreshold}) -> TRUE`,
        `Draft token ${val} meets target model acceptance criteria.`,
        { pos: idx, token: val, isAccepted: true },
        currentElements,
      );

      addStep(
        7,
        `Append True to verification_results -> [${verificationResults.join(", ")}]`,
        `Accepted candidate token ${val} at position ${idx}.`,
        { pos: idx, token: val, verification_results: verificationResults.join(", ") },
        currentElements,
      );
    } else {
      verificationResults.push(false);
      const currentElements: ArrayElement[] = elements.map((el, i) => {
        if (i === idx)
          return { ...el, state: "compare" as const, pointers: [`pos_${idx}`, "REJECTED"] };
        if (i < idx) return { ...el, state: "visited" as const, pointers: ["ACCEPTED"] };
        return el;
      });

      addStep(
        6,
        `Check Condition: token (${val}) <= target_threshold (${targetThreshold}) -> FALSE`,
        `Draft token ${val} failed target model verification at position ${idx}!`,
        { pos: idx, token: val, isAccepted: false },
        currentElements,
      );

      addStep(
        9,
        `Append False to verification_results -> [${verificationResults.join(", ")}]`,
        `Rejected candidate token ${val} at position ${idx}.`,
        { pos: idx, token: val, verification_results: verificationResults.join(", ") },
        currentElements,
      );

      addStep(
        10,
        "Break loop: speculative verification terminates early on first rejection",
        `Truncating remaining draft candidate tokens from position ${idx + 1} onward.`,
        { pos: idx, token: val, break: true },
        currentElements,
      );
      break;
    }
  }

  const finalElements: ArrayElement[] = elements.map((el, i) => ({
    ...el,
    state:
      i < verificationResults.length
        ? verificationResults[i]
          ? ("sorted" as const)
          : ("compare" as const)
        : ("default" as const),
    pointers:
      i < verificationResults.length
        ? verificationResults[i]
          ? ["VERIFIED"]
          : ["REJECTED_BOUND"]
        : ["DISCARDED"],
  }));

  addStep(
    12,
    "Return verification_results boolean mask",
    `Completed target model parallel verification pass. Accepted ${verificationResults.filter(Boolean).length} draft tokens.`,
    {
      completed: true,
      accepted_count: verificationResults.filter(Boolean).length,
      total_evaluated: verificationResults.length,
    },
    finalElements,
  );

  return steps;
};

const TARGETMODELPARALLELVERIFICATIONPASS_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature for target_model_parallel_verification_pass taking draft_tokens and target_threshold.",
    2: "Parameter declaration specifying draft_tokens list and default target_threshold = 30.",
    3: "Return type hint specifying list[bool].",
    4: "Initialize empty list verification_results to store boolean acceptance flags.",
    5: "Iterate over draft tokens in parallel forward pass output using enumerate(draft_tokens).",
    6: "Check if candidate draft token is less than or equal to target_threshold.",
    7: "Append True to verification_results when candidate token is accepted.",
    8: "Else branch for candidate tokens failing target model verification.",
    9: "Append False to verification_results when candidate token is rejected.",
    10: "Break loop immediately upon first rejection to halt further draft lookahead.",
    11: "Blank line before return statement.",
    12: "Return verification_results boolean mask array to caller.",
  },
};

export const targetModelParallelVerificationPass: AlgorithmDefinition<targetModelParallelVerificationPassInput> =
  {
    id: "target-model-parallel-verification-pass",
    title: "Speculative Decoding Target Model Parallel Verification Pass",
    topicIds: ["ml_llm_serving", "ml_distributed_systems"],
    difficulty: "Medium",
    description:
      "Speculative decoding speeds up LLM generation by replacing $\\gamma$ sequential forward passes of a large target model with $\\gamma$ fast forward passes of a small draft model, followed by a single parallel forward pass of the target model. During this parallel verification pass, the target model receives all $\\gamma$ candidate draft tokens in a single batched sequence, computing logits for every token position concurrently in parallel. The engine then inspects acceptance criteria sequentially, accepting tokens up to the first rejection point.\n\n### Parallel Target GEMM Math\nInstead of evaluating 1 token at a time with matrix shape $[1, D]$, the parallel verification pass evaluates $\\gamma$ candidate tokens simultaneously with matrix shape $[\\gamma, D]$:\n$$\\text{Logits}_{1 \\dots \\gamma} = \\text{GEMM}\\left(X_{1 \\dots \\gamma}, W_{\\text{target}}\\right)$$\nThis converts memory-bandwidth-bound vector-matrix operations into compute-bound matrix-matrix multiplications.\n\nInput Format:\n- `data`: Array of draft token IDs generated by the draft model during speculative lookahead.\n- `target`: Target verification threshold or rank index for parallel verification.\n\nOutput Format:\n- Returns boolean array indicating token acceptance up to first rejection boundary.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 Candidate Tokens Parallel Verification",
        inputDisplay: "16 candidate draft tokens, target threshold = 85",
        outputDisplay: "Verification boolean mask returned",
        input: DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT,
        output: "Verification booleans array returned",
        explanation: "Verifies 16 candidate tokens concurrently in 1 parallel target forward pass.",
      },
      {
        kind: "complex",
        title: "Early Rejection",
        inputDisplay: "draft_tokens = [10, 20, 50, 10], threshold = 30",
        outputDisplay: "[True, True, False]",
        input: { data: [10, 20, 50, 10], target: 30 },
        output: "[True, True, False]",
        explanation: "Token 50 at index 2 fails verification; acceptance halts early at index 2.",
      },
      {
        kind: "negative",
        title: "First Token Rejected",
        inputDisplay: "draft_tokens = [50, 10, 20], threshold = 30",
        outputDisplay: "[False]",
        input: { data: [50, 10, 20], target: 30 },
        output: "[False]",
        explanation: "First token fails verification immediately; 0 draft tokens accepted.",
      },
    ],
    code: TARGETMODELPARALLELVERIFICATIONPASS_CODE,
    timeComplexity: { best: "O(gamma)", average: "O(gamma)", worst: "O(gamma)" },
    spaceComplexity: "O(gamma)",
    complexityAnalysis: {
      time: "$O(\\gamma)$ time to verify $\\gamma$ draft tokens sequentially after 1 target model GEMM forward pass.",
      space: "$O(\\gamma)$ memory to store verification output booleans.",
    },
    topicGuide: {
      overview:
        "The Target Model Parallel Verification Pass converts sequential autoregressive LLM decoding iterations into a single batched parallel forward pass across speculative draft tokens.",
      sections: [
        {
          heading: "Overview & Arithmetic Intensity",
          body: "Standard LLM decoding generates 1 token per forward pass, causing low compute intensity (arithmetic intensity $\\approx 1$ FLOP/byte) because GPU Memory Bandwidth is spent loading model weights for every single token. Speculative decoding batches $\\gamma$ draft tokens into a single parallel forward pass on the target model. This transforms matrix-vector multiplications into matrix-matrix multiplications (GEMM), dramatically increasing Tensor Core utilization.",
        },
        {
          heading: "Parallel Target GEMM Mechanics",
          body: "During parallel verification:\n1. The draft model sequentially generates $\\gamma$ tokens $x_1, x_2, \\dots, x_\\gamma$;\n2. The target model executes a single forward pass over input sequence $[x_1, \\dots, x_\\gamma]$, producing logit distributions $p_1, \\dots, p_{\\gamma+1}$ simultaneously using causal attention masks;\n3. The engine sequentially checks rejection sampling criteria for each position $i \\in [1, \\gamma]$.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Evaluating $\\gamma$ draft tokens in 1 target pass increases batch size in the target GEMM kernels from 1 to $\\gamma$. GPU memory bandwidth utilization drops as FLOP-to-byte ratio rises, accelerating overall inference latency by 2x-3x on large models (e.g. LLaMA-70B).",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "If a rejection occurs at position $k < \\gamma$, the KV cache entries for rejected tokens $x_{k+1}, \\dots, x_\\gamma$ must be rolled back or truncated in the block table. For tree-based speculative decoding (e.g. Medusa or SpecInfer), tree causal attention masks are constructed to verify multiple draft branches simultaneously.",
        },
      ],
      keyTerms: [
        {
          term: "Parallel Verification Pass",
          definition:
            "A single target model forward pass evaluating gamma speculative draft tokens concurrently.",
        },
        {
          term: "Speculative Horizon (gamma)",
          definition:
            "The number of candidate tokens generated by the draft model per verification iteration.",
        },
        {
          term: "Causal Mask Tree",
          definition:
            "Attention mask layout permitting parallel evaluation of tree-structured speculative draft tokens.",
        },
        {
          term: "KV Cache Rollback",
          definition:
            "Truncating physical block table pointers for speculatively generated tokens rejected by the target model.",
        },
      ],
    },
    trivia: TARGETMODELPARALLELVERIFICATIONPASS_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "Fast Inference from Transformers via Speculative Decoding (Leviathan et al., ICML 2023)",
      },
    ],
    defaultInput: DEFAULT_TARGETMODELPARALLELVERIFICATIONPASS_INPUT,
    generateSteps: generateTargetModelParallelVerificationPassSteps,
  };

export default targetModelParallelVerificationPass;
