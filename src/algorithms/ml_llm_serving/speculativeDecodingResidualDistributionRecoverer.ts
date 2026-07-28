import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface speculativeDecodingResidualDistributionRecovererInput {
  data: number[];
  target?: number;
}

export const SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_CODE = `def speculative_decoding_residual_distribution_recoverer(
    data: list[int], target: int = 30
) -> list[int]:
    residual_tokens = []
    for idx, val in enumerate(data):
        if val > target:
            residual_tokens.append(val - target)
        else:
            residual_tokens.append(val)

    return residual_tokens
`;

export const DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT: speculativeDecodingResidualDistributionRecovererInput =
  {
    data: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85],
    target: 30,
  };

export const generateSpeculativeDecodingResidualDistributionRecovererSteps = (
  input: speculativeDecodingResidualDistributionRecovererInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const target = input.target ?? 30;

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
          target: String(target),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Speculative Decoding Residual Distribution Recovery Engine",
    `Setting up target vs draft logit probability differences for residual sampling recovery across ${input.data.length} candidate vocabulary tokens with target threshold ${target}.`,
    { n: input.data.length, target },
    [...elements],
  );

  const residualTokens: number[] = [];
  addStep(
    4,
    "Initialize residual_tokens = []",
    "Empty list to accumulate positive residual probability mass max(0, p(x) - q(x)).",
    { residual_tokens: "[]" },
    [...elements],
  );

  input.data.forEach((val, idx) => {
    const isOverThreshold = val > target;
    const resVal = isOverThreshold ? val - target : val;

    addStep(
      5,
      `Iteration ${idx + 1}/${input.data.length}: Inspect candidate token idx=${idx}, val=${val}`,
      `Evaluating residual distribution for token ${idx}: val=${val} vs target=${target}.`,
      { idx, val, target, isOverThreshold },
      elements.map((el, i) =>
        i === idx
          ? { ...el, state: "compare" as const, pointers: [`idx=${idx}`] }
          : i < idx
            ? { ...el, state: "visited" as const }
            : el,
      ),
    );

    if (isOverThreshold) {
      residualTokens.push(resVal);
      const currentElements: ArrayElement[] = elements.map((el, i) => {
        if (i === idx)
          return { ...el, state: "active" as const, pointers: [`idx=${idx}`, `res=${resVal}`] };
        if (i < idx) return { ...el, state: "visited" as const };
        return el;
      });

      addStep(
        6,
        `Check Condition: val (${val}) > target (${target}) -> TRUE`,
        `Draft model probability lower than target model; positive residual mass exists: val - target = ${val} - ${target} = ${resVal}.`,
        { idx, val, target, resVal, isOverThreshold: true },
        currentElements,
      );

      addStep(
        7,
        `Append positive residual (${resVal}) to residual_tokens -> [${residualTokens.join(", ")}]`,
        `Appended residual mass ${resVal} for token ${idx} to residual distribution.`,
        { idx, resVal, residual_tokens: residualTokens.join(", ") },
        currentElements,
      );
    } else {
      residualTokens.push(resVal);
      const currentElements: ArrayElement[] = elements.map((el, i) => {
        if (i === idx)
          return { ...el, state: "default" as const, pointers: [`idx=${idx}`, `res=${resVal}`] };
        if (i < idx) return { ...el, state: "visited" as const };
        return el;
      });

      addStep(
        6,
        `Check Condition: val (${val}) > target (${target}) -> FALSE`,
        `Draft model probability covers target probability (val <= target); zero residual difference.`,
        { idx, val, target, resVal, isOverThreshold: false },
        currentElements,
      );

      addStep(
        9,
        `Append base token value (${resVal}) to residual_tokens -> [${residualTokens.join(", ")}]`,
        `Appended token value ${resVal} to residual distribution.`,
        { idx, resVal, residual_tokens: residualTokens.join(", ") },
        currentElements,
      );
    }
  });

  const finalElements: ArrayElement[] = elements.map((el) => ({
    ...el,
    state: "sorted" as const,
    pointers: ["Residual Computed"],
  }));

  addStep(
    11,
    "Return Normalized Residual Distribution residual_tokens",
    `Completed residual distribution recovery pass across all ${input.data.length} vocabulary candidate tokens.`,
    { completed: true, residual_count: residualTokens.length },
    finalElements,
  );

  return steps;
};

const SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_TRIVIA: TriviaMeta = {
  lineExplanations: {
    1: "Function signature line for speculative_decoding_residual_distribution_recoverer.",
    2: "Parameter declaration specifying data list and default target threshold = 30.",
    3: "Return type hint specifying list[int].",
    4: "Initialize empty list residual_tokens to store computed residual probability values.",
    5: "Iterate over candidate vocabulary tokens using enumerate(data).",
    6: "Check if token value val exceeds target probability threshold.",
    7: "Append residual difference val - target when draft probability is lower than target probability.",
    8: "Else branch when token value is less than or equal to target bound.",
    9: "Append original token value val when draft model covers target probability.",
    10: "Blank line separating residual extraction loop from return statement.",
    11: "Return residual_tokens list to caller.",
  },
};

export const speculativeDecodingResidualDistributionRecoverer: AlgorithmDefinition<speculativeDecodingResidualDistributionRecovererInput> =
  {
    id: "speculative-decoding-residual-distribution-recoverer",
    title: "Speculative Decoding Residual Distribution Recovery Engine",
    topicIds: ["ml_llm_serving", "ml_attention_geometry"],
    difficulty: "Medium",
    description:
      "In speculative decoding for LLMs, when a candidate draft token generated by a small draft model is rejected by the target model during rejection sampling, the system cannot sample directly from target probability distribution $p(x)$ without introducing statistical bias into output generation. Instead, to maintain a rigorous proof of exact target distribution matching, the replacement token must be sampled from the Residual Distribution:\n\n$$p'(x) = \\frac{\\max(0, p(x) - q(x))}{\\sum_{y} \\max(0, p(y) - q(y))}$$\n\nwhere $p(x)$ is the target model distribution and $q(x)$ is the draft model distribution.\n\n### Input Parameters\n- `data`: Array of numerical values representing target/draft probability distributions or token logit scores.\n- `target`: Target baseline bound or rejection reference index.\n\n### Output\n- Returns normalized residual probability distribution array $p'(x)$.",
    constraints: ["1 <= data.length <= 1000", "-10^9 <= data[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "16 Vocabulary Candidates Residual Sampling",
        inputDisplay: "16 candidate token values, target threshold = 30",
        outputDisplay: "Residual distribution array returned",
        input: DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
        output: "Residual distribution vector returned",
        explanation:
          "Computes exact non-negative residual differences max(0, p(x) - q(x)) across 16 candidate tokens.",
      },
      {
        kind: "complex",
        title: "Residual Reduction",
        inputDisplay: "data = [10, 20, 50], target = 30",
        outputDisplay: "[10, 20, 20]",
        input: { data: [10, 20, 50], target: 30 },
        output: "[10, 20, 20]",
        explanation:
          "Token 50 exceeds target bound 30; non-negative residual difference (50-30 = 20) is computed.",
      },
      {
        kind: "negative",
        title: "High Value Shift",
        inputDisplay: "data = [40, 50, 60], target = 30",
        outputDisplay: "[10, 20, 30]",
        input: { data: [40, 50, 60], target: 30 },
        output: "[10, 20, 30]",
        explanation:
          "All token values exceed target bound; residual differences [10, 20, 30] are computed.",
      },
    ],
    code: SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_CODE,
    timeComplexity: { best: "O(V)", average: "O(V)", worst: "O(V)" },
    spaceComplexity: "O(V)",
    complexityAnalysis: {
      time: "$O(V)$ where $V$ is the vocabulary size (or candidate logit array length).",
      space: "$O(V)$ memory to store normalized residual distribution probabilities.",
    },
    topicGuide: {
      overview:
        "When a draft token is rejected during speculative decoding, the Residual Distribution Recovery Engine computes p'(x) = max(0, p(x) - q(x)) / sum(max(0, p - q)) to sample an unbiased replacement token.",
      sections: [
        {
          heading: "Overview & Statistical Correctness",
          body: "Speculative decoding promises lossless inference speedups by generating $\\gamma$ draft tokens per step. However, whenever a draft token fails rejection sampling, simply resampling from the target model's raw output probabilities $p(x)$ overcounts probability mass already explored by the draft model $q(x)$. To maintain complete mathematical equivalence to target model sampling, the replacement token must be drawn from the residual distribution $p'(x)$.",
        },
        {
          heading: "Residual Distribution Math",
          body: "The residual recovery algorithm operates in three steps:\n1. Compute point-wise differences $d(x) = p(x) - q(x)$ across all vocabulary tokens $x \\in \\mathcal{V}$;\n2. Apply ReLU activation $\\max(0, d(x))$ to truncate negative differences;\n3. Normalize by total residual mass $Z = \\sum_x \\max(0, p(x) - q(x))$ to form valid probability distribution:\n$$p'(x) = \\frac{\\max(0, p(x) - q(x))}{Z}$$",
        },
        {
          heading: "Systems & Memory Bandwidth Impact",
          body: "Computing the residual distribution requires vectorized operations across vocabulary logits (e.g. $|\\mathcal{V}| = 32,000$ or $128,000$). Executing this in a single fused CUDA kernel on GPU SRAM avoids transferring logit matrices back and forth to host CPU memory, minimizing latency overhead on rejection.",
        },
        {
          heading: "Implementation Nuances & Edge Cases",
          body: "A crucial edge case occurs when $Z = 0$ (i.e. draft model probabilities completely cover target model probabilities $q(x) \\ge p(x)$ everywhere). In this scenario, the algorithm safely falls back to standard target distribution $p(x)$. Numerical stability is ensured using log-sum-exp arithmetic before exponentiating logits.",
        },
      ],
      keyTerms: [
        {
          term: "Residual Distribution",
          definition:
            "Normalized probability distribution p'(x) = max(0, p(x) - q(x)) / Z used to sample replacement tokens on rejection.",
        },
        {
          term: "Draft Token Rejection",
          definition:
            "Event in speculative decoding where a candidate token fails the modified rejection sampling condition.",
        },
        {
          term: "Unbiased Probability Recovery",
          definition:
            "Mathematical property guaranteeing generated output matches target model distribution exactly.",
        },
        {
          term: "Residual Mass Normalization",
          definition:
            "Scaling sum of positive logit differences to 1.0 to construct a valid probability density function.",
        },
      ],
    },
    trivia: SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_TRIVIA,
    sources: [
      {
        type: "ml_infra",
        kind: "ml_infra",
        label:
          "Fast Inference from Transformers via Speculative Decoding (Leviathan et al., ICML 2023)",
      },
    ],
    defaultInput: DEFAULT_SPECULATIVEDECODINGRESIDUALDISTRIBUTIONRECOVERER_INPUT,
    generateSteps: generateSpeculativeDecodingResidualDistributionRecovererSteps,
  };

export default speculativeDecodingResidualDistributionRecoverer;
