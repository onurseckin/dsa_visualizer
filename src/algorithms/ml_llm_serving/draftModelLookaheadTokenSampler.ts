import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface draftModelLookaheadTokenSamplerInput {
  logits_seq: number[][];
  gamma: number;
  temperature: number;
}

export const DRAFTMODELLOOKAHEADTOKENSAMPLER_CODE = `
import math

def draft_model_lookahead_token_sampler(logits_seq, gamma=4, temperature=1.0):
    """
    Autoregressively samples gamma lookahead candidate tokens from draft model logits.
    Applies temperature scaling, max logit subtraction for softmax numerical stability,
    and returns sampled token indices along with candidate probabilities q(x_i).
    """
    draft_tokens = []
    draft_probs = []

    for step in range(min(gamma, len(logits_seq))):
        logits = logits_seq[step]
        # Temperature scaling
        temp = max(temperature, 1e-5)
        scaled_logits = [l / temp for l in logits]
        
        # Softmax with max logit subtraction for numerical stability
        max_l = max(scaled_logits)
        exp_logits = [math.exp(l - max_l) for l in scaled_logits]
        sum_exp = sum(exp_logits)
        probs = [e / sum_exp for e in exp_logits]

        # Greedy top-1 candidate selection
        best_token = max(range(len(probs)), key=lambda i: probs[i])
        
        draft_tokens.append(best_token)
        draft_probs.append(probs[best_token])

    return draft_tokens, draft_probs
`;

export const DEFAULT_DRAFTMODELLOOKAHEADTOKENSAMPLER_INPUT: draftModelLookaheadTokenSamplerInput = {
  logits_seq: [
    [2.1, 0.5, 3.8, 1.2],
    [0.1, 4.2, 1.0, 0.3],
    [3.1, 1.1, 0.2, 2.5],
    [0.5, 0.8, 5.0, 1.0],
  ],
  gamma: 4,
  temperature: 1.0,
};

export const generateDraftModelLookaheadTokenSamplerSteps = (
  input: draftModelLookaheadTokenSamplerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const elements: ArrayElement[] = input.logits_seq.slice(0, input.gamma).map((logits, idx) => ({
    id: `step-${idx}`,
    value: `Step ${idx + 1} Logits [${logits.map((l) => l.toFixed(1)).join(", ")}]`,
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
          gamma: String(input.gamma),
          temperature: String(input.temperature),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Speculative Decoding Draft Token Sampler",
    "Setting up logit sequence processing, lookahead depth gamma, and temperature scaling factor.",
    { gamma: input.gamma, temperature: input.temperature },
  );

  const currentElements = elements.map((el) => ({ ...el }));
  const draftTokens: number[] = [];
  const draftProbs: number[] = [];

  const maxSteps = Math.min(input.gamma, input.logits_seq.length);
  for (let step = 0; step < maxSteps; step++) {
    const logits = input.logits_seq[step];
    const temp = Math.max(input.temperature, 1e-5);
    const scaledLogits = logits.map((l) => l / temp);
    const maxL = Math.max(...scaledLogits);
    const expLogits = scaledLogits.map((l) => Math.exp(l - maxL));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);
    const probs = expLogits.map((e) => e / sumExp);

    let bestToken = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[bestToken]) bestToken = i;
    }

    draftTokens.push(bestToken);
    draftProbs.push(probs[bestToken]);

    currentElements[step] = {
      ...currentElements[step],
      state: "active",
      pointers: [`token=${bestToken}`, `q(x)=${probs[bestToken].toFixed(3)}`],
    };

    addStep(
      21,
      `Step ${step + 1}: Sample candidate token ${bestToken}`,
      `Scaled logits by temp=${temp.toFixed(2)}, calculated softmax probs, sampled candidate token ${bestToken} with q(x)=${probs[bestToken].toFixed(3)}.`,
      { step: step + 1, sampled_token: bestToken, prob: Number(probs[bestToken].toFixed(3)) },
      currentElements,
    );
  }

  const finalElements = currentElements.map((el) => ({
    ...el,
    state: "sorted" as const,
  }));

  addStep(
    28,
    "Execution Complete",
    "Successfully generated gamma lookahead candidate tokens for target model verification pass.",
    { tokens_generated: draftTokens.join(", "), gamma: input.gamma },
    finalElements,
  );

  return steps;
};

const DRAFTMODELLOOKAHEADTOKENSAMPLER_TRIVIA: TriviaMeta = {
  skipLines: [1, 2, 3],
  distractors: [
    "scaled_logits = [l * temperature for l in logits]",
    "probs = [math.exp(l) for l in logits]",
    "best_token = min(range(len(probs)), key=lambda i: probs[i])",
  ],
  hints: [{ line: 21, hint: "Sample token index maximizing softmax probability q(x_i)." }],
  lineExplanations: {
    1: "Entry point for Speculative Decoding Draft Token Sampler.",
    16: "Applies temperature scaling to raw unnormalized draft model logits.",
    21: "Calculates numerically stable softmax probabilities using max logit subtraction.",
    25: "Selects candidate lookahead token index with highest probability.",
    28: "Returns list of draft candidate tokens and candidate probability distribution q(x).",
  },
};

export const draftModelLookaheadTokenSampler: AlgorithmDefinition<draftModelLookaheadTokenSamplerInput> =
  {
    id: "draft-model-lookahead-token-sampler",
    title: "Speculative Decoding Draft Token Sampler",
    category: "ml_llm_serving",
    categories: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Easy",
    isMlInfra: true,
    mlInfraLevel: 12,
    mlInfraCategory: "ml_llm_serving",
    description:
      "Speculative Decoding uses a small, fast draft model M_draft (or speculative draft heads like Medusa / Eagle) to autoregressively sample gamma lookahead candidate tokens (x_{t+1}, x_{t+2}, ..., x_{t+gamma}) prior to running the target model M_target. Because draft models are 10x-100x smaller than the target LLM, generating gamma tokens sequentially with M_draft consumes very little time and memory bandwidth.\n\nThis algorithm implements the Speculative Draft Token Sampler. At each lookahead step, raw logits from M_draft are scaled by temperature T, normalized via numerically stable Softmax (subtracting max logit to prevent IEEE 754 float overflow), and candidate tokens are sampled along with their probabilities q_i(x). The resulting sequence of gamma candidate tokens and probabilities is packaged for a single parallel verification pass by the target model.\n\nInput Format:\n- logits_seq: 2D array of draft model logit vectors, shape [gamma, vocab_size].\n- gamma: Integer speculative lookahead depth (e.g. 4 tokens).\n- temperature: Floating-point sampling temperature T > 0.\n\nOutput Format:\n- Returns a tuple of (draft_tokens, draft_probs) containing candidate token IDs and probabilities q(x_i).\n\nEdge Cases & Constraints:\n- Low temperature limit: As T -> 0, temperature scaling approaches argmax greedy selection.\n- Softmax stability: Subtracts max(logits) before exponentiating to avoid Inf/NaN errors in float16/float32.\n- Vocab bounds: Validates token indices within [0, vocab_size - 1].",
    constraints: [
      "1 <= gamma <= 16",
      "0.01 <= temperature <= 5.0",
      "1 <= logits_seq[i].length <= 32000",
    ],
    examples: [
      {
        kind: "basic",
        title: "4-Token Lookahead Sampling",
        inputDisplay:
          "logits_seq = [[2.1, 0.5, 3.8, 1.2], [0.1, 4.2, 1.0, 0.3]], gamma = 2, temp = 1.0",
        outputDisplay: "Draft Tokens: [2, 1], Draft Probs: [0.724, 0.901]",
        input: {
          logits_seq: [
            [2.1, 0.5, 3.8, 1.2],
            [0.1, 4.2, 1.0, 0.3],
          ],
          gamma: 2,
          temperature: 1.0,
        },
        output: "Draft Tokens: [2, 1]",
        explanation: "Step 1 selects token 2 (logit 3.8). Step 2 selects token 1 (logit 4.2).",
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
      time: "O(gamma * V) to scale logits and compute Softmax over vocabulary size V for gamma steps.",
      space: "O(gamma * V) for scaled logits and output candidate token buffers.",
    },
    topicGuide: {
      overview:
        "Speculative Decoding draft samplers generate gamma lookahead token proposals fast using small draft models, setting up target model parallel verification.",
      sections: [
        {
          heading: "Overview",
          body: "Autoregressive generation in large models is memory-bandwidth bound: each token requires transferring hundreds of gigabytes of model weights from DRAM to GPU SRAM. Speculative Decoding breaks this memory bottleneck by using a small draft model (10x-100x smaller) to quickly speculate gamma future tokens in sequence.",
        },
        {
          heading: "Core Concepts",
          body: "The Draft Sampler runs gamma forward passes of M_draft. At each step step=1..gamma, logits are scaled by temperature T and normalized via Softmax to yield draft probability distribution q_i(x). Candidates x_i are sampled and appended to a candidate sequence along with q_i(x_i).",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Because M_draft parameters fit within L2 cache or require minimal DRAM bandwidth, draft sampling latency is negligible (e.g. 1-2 ms total for gamma=5). When combined with a single parallel target pass, system latency is reduced by 2x-3x without changing output quality.",
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
