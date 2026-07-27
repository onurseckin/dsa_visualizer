import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface FusedSoftmaxLseInput {
  logits: number[];
}

export const FUSED_SOFTMAX_LSE_CODE = `import math

def fused_softmax_lse(logits: list[float]) -> tuple[list[float], float]:
    if not logits:
        return [], 0.0
    # Step 1: Maximum logit extraction for numerical stability
    m = max(logits)
    
    # Step 2: Fused exponent summation and Log-Sum-Exp (LSE)
    exp_sum = 0.0
    for x in logits:
        exp_sum += math.exp(x - m)
    lse = m + math.log(exp_sum)
    
    # Step 3: Probability normalization via exp(x - LSE)
    probs = [math.exp(x - lse) for x in logits]
    return probs, lse`;

export const DEFAULT_FUSED_SOFTMAX_LSE_INPUT: FusedSoftmaxLseInput = {
  logits: [2.0, 1.0, 0.1, 3.0],
};

export const generateFusedSoftmaxLseSteps = (
  input: FusedSoftmaxLseInput
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const logits = input.logits;
  const n = logits.length;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    elements: ArrayElement[],
    auxState?: Record<string, string | number>
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: elements.map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: auxState || {
          n,
          lse: String(variables.lse ?? "undefined"),
        },
      },
      variables,
    });
  };

  const initialElements: ArrayElement[] = logits.map((val, idx) => ({
    id: `logit-${idx}`,
    value: Number(val.toFixed(2)),
    state: "default",
  }));

  addStep(
    1,
    "Initialize Fused Log-Sum-Exp & Softmax",
    `Input logits vector: [${logits.map((v) => v.toFixed(2)).join(", ")}].`,
    { n },
    initialElements
  );

  if (n === 0) {
    addStep(
      4,
      "Empty logits vector provided",
      "Returning empty probability array [] and LSE 0.0.",
      { n: 0, lse: 0.0 },
      []
    );
    return steps;
  }

  // Step 1: Max extraction
  let maxLogit = -Infinity;
  let maxIdx = -1;

  for (let i = 0; i < n; i++) {
    if (logits[i] > maxLogit) {
      maxLogit = logits[i];
      maxIdx = i;
    }
  }

  const maxElements: ArrayElement[] = initialElements.map((el, i) =>
    i === maxIdx ? { ...el, state: "pivot", pointers: ["MAX (m)"] } : el
  );

  addStep(
    7,
    `Extract max logit m = ${maxLogit.toFixed(2)}`,
    `Subtracting max logit prevents floating point overflow in exp(x). All exp inputs will be <= 0.`,
    { m: maxLogit, maxIdx },
    maxElements,
    { maxLogit }
  );

  // Step 2: Exp summation
  let expSum = 0.0;
  for (let i = 0; i < n; i++) {
    const shift = logits[i] - maxLogit;
    const expVal = Math.exp(shift);
    expSum += expVal;

    const accumElements: ArrayElement[] = maxElements.map((el, idx) =>
      idx === i
        ? {
            ...el,
            state: "active",
            pointers: [`exp(${shift.toFixed(2)}) = ${expVal.toFixed(4)}`],
          }
        : el
    );

    addStep(
      11,
      `Accumulate exp(logits[${i}] - m) = exp(${shift.toFixed(2)}) = ${expVal.toFixed(4)}`,
      `Running exp sum: ${expSum.toFixed(4)}.`,
      { i, logit: logits[i], shift, expVal, expSum },
      accumElements,
      { maxLogit, expSum }
    );
  }

  const lse = maxLogit + Math.log(expSum);

  addStep(
    13,
    `Compute Log-Sum-Exp (LSE) = m + ln(exp_sum) = ${lse.toFixed(4)}`,
    `Fused LSE scalar denominator computed safely in log-space.`,
    { m: maxLogit, expSum, lse },
    maxElements,
    { maxLogit, expSum, lse }
  );

  // Step 3: Probabilities
  const probs: number[] = [];
  const probElements: ArrayElement[] = [];

  for (let i = 0; i < n; i++) {
    const prob = Math.exp(logits[i] - lse);
    probs.push(prob);
    probElements.push({
      id: `prob-${i}`,
      value: Number((prob * 100).toFixed(1)), // Percentage for visual bar
      state: "sorted",
      pointers: [`p_${i} = ${prob.toFixed(4)}`],
    });
  }

  addStep(
    16,
    `Compute final normalized Softmax probabilities p_i = exp(logit_i - LSE)`,
    `Probabilities: [${probs.map((p) => p.toFixed(4)).join(", ")}]. Sum = ${probs
      .reduce((a, b) => a + b, 0)
      .toFixed(4)}.`,
    { lse, sumProbs: 1.0 },
    probElements,
    { lse, probabilities: probs.map((p) => p.toFixed(4)).join(", ") }
  );

  return steps;
};

const FUSED_SOFTMAX_LSE_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "exp_sum += math.exp(x)",
    "lse = math.log(sum(logits))",
    "probs = [x / exp_sum for x in logits]",
    "m = sum(logits) / len(logits)",
  ],
  hints: [
    {
      line: 7,
      hint: "Extract maximum logit to subtract from all logits, guaranteeing all exponents are non-positive.",
    },
    {
      line: 11,
      hint: "Sum exp(x - m) for numerical stability.",
    },
    {
      line: 16,
      hint: "Compute Softmax probabilities in log-space via exp(x - LSE).",
    },
  ],
  lineExplanations: {
    1: "Defines fused Log-Sum-Exp and numerical stable Softmax function.",
    4: "Handles empty logits input boundary condition.",
    7: "Extracts max logit m for numerical overflow prevention.",
    11: "Accumulates exponentiated shifted logits exp(x - m).",
    13: "Calculates total Log-Sum-Exp denominator m + ln(exp_sum).",
    16: "Normalizes logits into Softmax probability distribution.",
  },
};

export const fusedSoftmaxLse: AlgorithmDefinition<FusedSoftmaxLseInput> = {
  id: "fused-softmax-lse",
  title: "Fused Log-Sum-Exp & Numerically Stable Softmax",
  category: "ml_precision_quantization",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  description:
    "Computes numerically stable Softmax probabilities and Log-Sum-Exp (LSE) denominator in a single fused pass, preventing floating point overflow and underflow.",
  constraints: [
    "logits element values within float bounds",
    "Works safely even with logits > 1000",
  ],
  examples: [
    {
      kind: "basic",
      title: "Standard Logits Softmax",
      inputDisplay: "logits = [2.0, 1.0, 0.1, 3.0]",
      outputDisplay: "probs ≈ [0.237, 0.087, 0.035, 0.641], LSE ≈ 3.444",
      input: DEFAULT_FUSED_SOFTMAX_LSE_INPUT,
      output: "[0.2369, 0.0872, 0.0355, 0.6404]",
      explanation: "Max m=3.0. exp_sum = exp(-1) + exp(-2) + exp(-2.9) + exp(0) = 0.3679 + 0.1353 + 0.0550 + 1.0 = 1.5582. LSE = 3.0 + ln(1.5582) = 3.4436.",
    },
    {
      kind: "complex",
      title: "Extreme Logits (Float Overflow Prevention)",
      inputDisplay: "logits = [1000.0, 1002.0, 999.0]",
      outputDisplay: "probs ≈ [0.1192, 0.8808, 0.0438], LSE ≈ 1002.127",
      input: {
        logits: [1000.0, 1002.0, 999.0],
      },
      output: "[0.1192, 0.8808, 0.0438]",
      explanation: "Standard exp(1000) causes float overflow Inf -> NaN. Subtraction of m=1002 shifts exponents to [-2, 0, -3], yielding exact stable probabilities.",
    },
    {
      kind: "negative",
      title: "Empty Logits Vector",
      inputDisplay: "logits = []",
      outputDisplay: "probs = [], LSE = 0.0",
      input: { logits: [] },
      output: "[]",
      explanation: "Empty input yields empty probability array and 0.0 LSE.",
    },
  ],
  code: FUSED_SOFTMAX_LSE_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Performs two linear passes over the N logits (one for max extraction, one for exp summation & normalization), running in O(N) time.",
    space: "Allocates an array of size N to hold output Softmax probability distribution.",
  },
  topicGuide: {
    overview:
      "Direct evaluation of Softmax p_i = exp(x_i) / sum(exp(x_j)) is numerically unstable in floating point arithmetic. Large values (e.g. x_i > 88 in FP32 or x_i > 709 in FP64) overflow exp(x_i) to Infinity, causing 0/0 -> NaN errors. Fusing max subtraction and Log-Sum-Exp computation guarantees all exponent terms lie in (-Infinity, 0], ensuring flawless numerical stability.",
    sections: [
      {
        heading: "The Log-Sum-Exp (LSE) Identity",
        body: "By factoring out m = max(x_i), we use the identity LSE(x) = m + ln(sum(exp(x_i - m))). Because x_i - m <= 0 for all i, exp(x_i - m) is bounded in (0, 1], guaranteeing no overflow.",
      },
      {
        heading: "FlashAttention & Fused CUDA Kernels",
        body: "Modern LLM attention kernels (e.g., FlashAttention-1/2/3) rely heavily on keeping online running max (m) and LSE scalars per GPU thread-block to compute attention Softmax without writing giant N x N attention matrices to high-bandwidth memory (HBM).",
      },
    ],
    keyTerms: [
      {
        term: "Log-Sum-Exp (LSE)",
        definition: "A smooth, convex approximation of the maximum function: LSE(x) = log(sum(exp(x_i))).",
      },
      {
        term: "Numerical Overflow",
        definition: "A condition in computer hardware floating point arithmetic where a calculation yields a magnitude greater than the maximum representable limit.",
      },
    ],
  },
  trivia: FUSED_SOFTMAX_LSE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 3" }],
  defaultInput: DEFAULT_FUSED_SOFTMAX_LSE_INPUT,
  generateSteps: generateFusedSoftmaxLseSteps,
};
