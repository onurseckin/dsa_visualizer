import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface draftModelLookaheadTokenSamplerInput {
  logits_seq: number[][];
  gamma: number;
  temperature: number;
}

export const DRAFTMODELLOOKAHEADTOKENSAMPLER_CODE = `import math

def draft_model_lookahead_token_sampler(logits_seq, gamma=4, temperature=1.0):
    draft_tokens = []
    draft_probs = []

    for step in range(min(gamma, len(logits_seq))):
        logits = logits_seq[step]
        temp = max(temperature, 1e-5)
        scaled_logits = [l / temp for l in logits]
        
        max_l = max(scaled_logits)
        exp_logits = [math.exp(l - max_l) for l in scaled_logits]
        sum_exp = sum(exp_logits)
        probs = [e / sum_exp for e in exp_logits]

        best_token = max(range(len(probs)), key=lambda i: probs[i])
        
        draft_tokens.append(best_token)
        draft_probs.append(probs[best_token])

    return draft_tokens, draft_probs`;

export const DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT: draftModelLookaheadTokenSamplerInput = {
  logits_seq: [
    [2.1, 0.5, 3.8, 1.2],
    [0.1, 4.2, 1.0, 0.3],
    [3.1, 1.1, 0.2, 2.5],
    [0.5, 0.8, 5.0, 1.0],
    [1.5, 3.5, 0.2, 0.9],
    [0.2, 1.0, 4.5, 2.0],
  ],
  gamma: 6,
  temperature: 1.0,
};

export const generateDraftModelLookaheadTokenSamplerSteps = (
  input: draftModelLookaheadTokenSamplerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { logits_seq, gamma, temperature } = input;
  const maxSteps = Math.min(gamma, logits_seq.length);

  const elements: ArrayElement[] = logits_seq.slice(0, maxSteps).map((logits, idx) => ({
    id: `step-${idx}`,
    value: `Step ${idx + 1} Logits: [${logits.map((l) => l.toFixed(1)).join(", ")}]`,
    state: "default",
  }));

  const draftTokens: number[] = [];
  const draftProbs: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    activeStepIdx: number = -1,
    pointersMap: Record<number, string[]> = {},
  ) => {
    const updatedElements: ArrayElement[] = elements.map((el, idx) => {
      let state: ArrayElement["state"] = "default";
      if (idx === activeStepIdx) state = "active";
      else if (idx < activeStepIdx) state = "visited";
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
          temperature: String(temperature),
          totalLookaheadSteps: String(maxSteps),
          draft_tokens: `[${draftTokens.join(", ")}]`,
          draft_probs: `[${draftProbs.map((p) => p.toFixed(3)).join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Function entry
  addStep(
    3,
    "Enter draft_model_lookahead_token_sampler function",
    "Initializing speculative decoding token sampler with draft model logits sequence and gamma lookahead budget.",
    { gamma, temperature, stepsAvailable: logits_seq.length },
  );

  // Step 2: Init draft_tokens
  addStep(
    4,
    "Initialize draft_tokens = []",
    "Empty array to store sampled candidate token indices $x_1, x_2, \\dots, x_{\\gamma}$.",
    { draft_tokens: "[]" },
  );

  // Step 3: Init draft_probs
  addStep(
    5,
    "Initialize draft_probs = []",
    "Empty array to store candidate sampling probabilities $q(x_i)$ for target model verification.",
    { draft_probs: "[]" },
  );

  for (let step = 0; step < maxSteps; step++) {
    addStep(
      7,
      `Loop step ${step + 1} of ${maxSteps}: range(min(gamma=${gamma}, len(logits_seq)=${logits_seq.length}))`,
      `Beginning lookahead sampling iteration for step ${step + 1}.`,
      { step: step + 1, gamma, maxSteps },
      step,
      { [step]: [`step=${step + 1}`] },
    );

    const logits = logits_seq[step];
    addStep(
      8,
      `Step ${step + 1}: Extract raw logits = [${logits.join(", ")}]`,
      `Unnormalized output vector from draft model at position ${step + 1}.`,
      { step: step + 1, logits: logits.join(", ") },
      step,
    );

    const temp = Math.max(temperature, 1e-5);
    addStep(
      9,
      `Step ${step + 1}: Clamp temperature temp = max(${temperature}, 1e-5) -> ${temp}`,
      "Guarantees positive non-zero temperature scaling divisor to prevent division by zero.",
      { step: step + 1, temp },
      step,
    );

    const scaledLogits = logits.map((l) => l / temp);
    addStep(
      10,
      `Step ${step + 1}: Compute scaled_logits = [${scaledLogits.map((l) => l.toFixed(2)).join(", ")}]`,
      `Applied temperature scaling: $z_i / T$ for $T = ${temp}$.`,
      { step: step + 1, scaled_logits: scaledLogits.map((l) => l.toFixed(2)).join(", ") },
      step,
    );

    const maxL = Math.max(...scaledLogits);
    addStep(
      12,
      `Step ${step + 1}: Find max_l = max(scaled_logits) = ${maxL.toFixed(2)}`,
      "Max logit subtraction ensures numerical stability: $\\exp(z_i - \\max(z)) \\le 1.0$, preventing overflow.",
      { step: step + 1, max_l: Number(maxL.toFixed(2)) },
      step,
    );

    const expLogits = scaledLogits.map((l) => Math.exp(l - maxL));
    addStep(
      13,
      `Step ${step + 1}: Compute exp_logits = [${expLogits.map((e) => e.toFixed(4)).join(", ")}]`,
      "Exponentiating shifted logits: $\\exp(z_i - \\max(z))$.",
      { step: step + 1, exp_logits: expLogits.map((e) => e.toFixed(4)).join(", ") },
      step,
    );

    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    addStep(
      14,
      `Step ${step + 1}: Compute sum_exp = sum(exp_logits) = ${sumExp.toFixed(4)}`,
      "Summing exponentiated values to compute Softmax denominator.",
      { step: step + 1, sum_exp: Number(sumExp.toFixed(4)) },
      step,
    );

    const probs = expLogits.map((e) => e / sumExp);
    addStep(
      15,
      `Step ${step + 1}: Compute Softmax probs = [${probs.map((p) => p.toFixed(4)).join(", ")}]`,
      "Probability distribution $q(x)$: $q_i = \\exp(z_i - \\max(z)) / \\sum \\exp(z_j - \\max(z))$.",
      { step: step + 1, probs: probs.map((p) => p.toFixed(4)).join(", ") },
      step,
    );

    let bestToken = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[bestToken]) bestToken = i;
    }
    addStep(
      17,
      `Step ${step + 1}: Pick greedy best_token = ${bestToken} (prob q(x) = ${probs[bestToken].toFixed(4)})`,
      `Token ${bestToken} achieves highest candidate probability $q(x_{${step + 1}}) = ${probs[bestToken].toFixed(4)}$.`,
      { step: step + 1, best_token: bestToken, prob: Number(probs[bestToken].toFixed(4)) },
      step,
      { [step]: [`token=${bestToken}`, `q=${probs[bestToken].toFixed(3)}`] },
    );

    draftTokens.push(bestToken);
    addStep(
      19,
      `Step ${step + 1}: Append ${bestToken} to draft_tokens -> [${draftTokens.join(", ")}]`,
      `Candidate sequence updated: [${draftTokens.join(", ")}].`,
      { step: step + 1, draft_tokens: draftTokens.join(", ") },
      step,
    );

    draftProbs.push(probs[bestToken]);
    addStep(
      20,
      `Step ${step + 1}: Append ${probs[bestToken].toFixed(4)} to draft_probs -> [${draftProbs.map((p) => p.toFixed(3)).join(", ")}]`,
      "Draft probability distribution updated for target verification.",
      { step: step + 1, draft_probs: draftProbs.map((p) => p.toFixed(3)).join(", ") },
      step,
    );
  }

  // Step return
  addStep(
    22,
    `Return (draft_tokens=[${draftTokens.join(", ")}], draft_probs=[${draftProbs.map((p) => p.toFixed(3)).join(", ")}])`,
    `Completed generation of ${draftTokens.length} speculative lookahead candidate tokens for target verification pass.`,
    {
      draft_tokens: draftTokens.join(", "),
      draft_probs: draftProbs.map((p) => p.toFixed(3)).join(", "),
      count: draftTokens.length,
    },
  );

  return steps;
};

const DRAFTMODELLOOKAHEADTOKENSAMPLER_TRIVIA: TriviaMeta = {
  skipLines: [2, 6, 11, 16, 18, 21],
  distractors: [
    "draft_tokens = [0] * gamma",
    "probs = [l / sum(logits) for l in logits]",
    "best_token = min(range(len(probs)), key=lambda i: probs[i])",
    "temp = min(temperature, 1.0)",
  ],
  hints: [
    {
      line: 9,
      hint: "Clamp temperature using max(temperature, 1e-5) to prevent division by zero.",
    },
    { line: 12, hint: "Subtract max_l before exponentiation for numerical stability." },
    { line: 17, hint: "Select best_token via greedy argmax or multinomial sampling over probs." },
  ],
  lineExplanations: {
    1: "Import math module for floating-point exponential calculation math.exp.",
    2: "Blank line after imports.",
    3: "Function signature for Speculative Decoding Draft Token Sampler taking logits_seq, gamma, and temperature.",
    4: "Initialize empty list draft_tokens to store sampled candidate token indices.",
    5: "Initialize empty list draft_probs to store candidate sampling probabilities q(x_i).",
    6: "Blank line before lookahead sampling loop.",
    7: "Loop over each lookahead step from 0 up to min(gamma, len(logits_seq)).",
    8: "Extract raw logits vector for current lookahead step.",
    9: "Clamp temperature to minimum epsilon (1e-5) to prevent division by zero.",
    10: "Scale raw logits by temperature factor: scaled_logits = [l / temp for l in logits].",
    11: "Blank line before Softmax computation.",
    12: "Find maximum scaled logit max_l for numerical stability during Softmax.",
    13: "Exponentiate shifted logits: exp_logits = [math.exp(l - max_l) for l in scaled_logits].",
    14: "Sum exponentiated values to compute Softmax normalization denominator.",
    15: "Compute normalized Softmax probability distribution: probs = [e / sum_exp for e in exp_logits].",
    16: "Blank line before candidate token selection.",
    17: "Select candidate token index with highest probability (argmax greedy selection).",
    18: "Blank line before updating output lists.",
    19: "Append selected best_token index to draft_tokens list.",
    20: "Append candidate probability probs[best_token] to draft_probs list.",
    21: "Blank line before returning results.",
    22: "Return tuple of draft_tokens and draft_probs to caller for target verification.",
  },
};

export const draftModelLookaheadTokenSampler: AlgorithmDefinition<draftModelLookaheadTokenSamplerInput> =
  {
    id: "draft-model-lookahead-token-sampler",
    title: "Speculative Decoding Draft Token Sampler",
    topicIds: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Easy",
    description:
      "Speculative Decoding uses a small, fast draft model $M_{\\text{draft}}$ (or speculative draft heads like Medusa / Eagle) to autoregressively sample $\\gamma$ lookahead candidate tokens $(x_{t+1}, x_{t+2}, \\dots, x_{t+\\gamma})$ prior to running the target model $M_{\\text{target}}$. Because draft models are 10x-100x smaller than the target LLM, generating $\\gamma$ tokens sequentially with $M_{\\text{draft}}$ consumes minimal time and GPU memory bandwidth.\n\n### Softmax & Sampling Formula\n$$\\text{Softmax}(z_i) = \\frac{\\exp\\left((z_i - \\max(z)) / T\\right)}{\\sum_j \\exp\\left((z_j - \\max(z)) / T\\right)}$$\n\nwhere:\n- $z_i$: Raw draft model logit for token $i$.\n- $T$: Sampling temperature parameter.\n- $\\max(z)$: Maximum scaled logit subtracted for numerical stability (preventing IEEE 754 overflow).\n\n### Input Parameters\n- `logits_seq`: 2D array of draft model logit vectors, shape $[\\gamma, V]$.\n- `gamma`: Speculative lookahead depth $\\gamma$.\n- `temperature`: Sampling temperature $T > 0$.\n\n### Output\n- Returns tuple `(draft_tokens, draft_probs)` containing candidate token IDs and probabilities $q(x_i)$.",
    constraints: [
      "1 <= gamma <= 16",
      "0.01 <= temperature <= 5.0",
      "1 <= logits_seq[i].length <= 32000",
    ],
    examples: [
      {
        kind: "basic",
        title: "6-Token Lookahead Sampling",
        inputDisplay: "6-step logits sequence, gamma = 6, temp = 1.0",
        outputDisplay: "Draft tokens and candidate probabilities generated",
        input: DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
        output: "Draft tokens and probs tuple returned",
        explanation: "Evaluates 6 speculative lookahead sampling iterations.",
      },
      {
        kind: "complex",
        title: "High Temperature Softmax Flattening",
        inputDisplay: "logits_seq = [[10.0, 0.0]], gamma = 1, temp = 5.0",
        outputDisplay: "Draft Tokens: [0], Draft Probs: [0.880]",
        input: {
          logits_seq: [[10.0, 0.0]],
          gamma: 1,
          temperature: 5.0,
        },
        output: "Draft Tokens: [0], Draft Prob: 0.880",
        explanation:
          "Temperature T=5.0 scales logits to [2.0, 0.0], reducing peak probability to ~0.88.",
      },
    ],
    code: DRAFTMODELLOOKAHEADTOKENSAMPLER_CODE,
    timeComplexity: { best: "O(gamma * V)", average: "O(gamma * V)", worst: "O(gamma * V)" },
    spaceComplexity: "O(gamma * V)",
    complexityAnalysis: {
      time: "$O(\\gamma \\cdot V)$ to scale logits and compute Softmax over vocabulary size $V$ for $\\gamma$ steps.",
      space: "$O(\\gamma \\cdot V)$ for scaled logits and output candidate token buffers.",
    },
    topicGuide: {
      overview:
        "Speculative Decoding draft samplers generate gamma lookahead token proposals fast using small draft models, setting up target model parallel verification.",
      sections: [
        {
          heading: "Overview & Speculative Architecture",
          body: "Autoregressively generating tokens in large models is memory-bandwidth bound: each token requires transferring hundreds of gigabytes of model weights from DRAM to GPU SRAM. Speculative Decoding breaks this memory bottleneck by using a small draft model (10x-100x smaller) to quickly speculate $\\gamma$ future tokens in sequence.",
        },
        {
          heading: "Core Sampling & Softmax Math",
          body: "The Draft Sampler runs $\\gamma$ forward passes of $M_{\\text{draft}}$. At each step $\\text{step}=1..\\gamma$, logits are scaled by temperature $T$ and normalized via Softmax to yield draft probability distribution $q_i(x)$:\n$$\\text{Softmax}(z_i) = \\frac{\\exp\\left((z_i - \\max(z)) / T\\right)}{\\sum_j \\exp\\left((z_j - \\max(z)) / T\\right)}$$\nCandidates $x_i$ are sampled and appended to a candidate sequence along with $q_i(x_i)$.",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Because $M_{\\text{draft}}$ parameters fit within L2 cache or require minimal DRAM bandwidth, draft sampling latency is negligible (e.g. 1-2 ms total for $\\gamma=5$). When combined with a single parallel target pass, system latency is reduced by 2x-3x without changing output quality.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "Key implementation details include numerical stability for float16 exponentiation (subtracting max logit), maintaining tree KV-caches for draft heads (Medusa architecture), handling zero-temperature limits gracefully, and preserving candidate log-probability logs.",
        },
      ],
      keyTerms: [
        {
          term: "Draft Model",
          definition:
            "A small, lightweight language model used to speculate candidate output tokens.",
        },
        {
          term: "Speculative Depth (gamma)",
          definition:
            "The number of lookahead candidate tokens generated per draft sampling phase.",
        },
        {
          term: "Temperature Softmax",
          definition:
            "Softmax transformation scaled by 1/T to control probability distribution sharpness.",
        },
        {
          term: "Candidate Probability q(x)",
          definition: "The probability assigned to a draft candidate token by the draft model.",
        },
      ],
    },
    trivia: DRAFTMODELLOOKAHEADTOKENSAMPLER_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 12" }],
    defaultInput: DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT,
    generateSteps: generateDraftModelLookaheadTokenSamplerSteps,
  };

export default draftModelLookaheadTokenSampler;
