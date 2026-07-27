import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface stableSoftmaxLogsumexpInput {
  values?: number[];
  logits?: number[];
}

export const STABLESOFTMAXLOGSUMEXP_CODE = `def stable_softmax_logsumexp(logits):
    import math
    max_val = max(logits) if logits else 0.0
    sum_exp = sum(math.exp(x - max_val) for x in logits)
    lse = max_val + math.log(sum_exp)
    softmax_probs = [math.exp(x - max_val) / sum_exp for x in logits]
    return lse, softmax_probs`;

export const DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT: stableSoftmaxLogsumexpInput = {
  values: [1.2, -3.4, 5.5, 2.1, 0.8],
};

const toBitItems = (val: number): BitItem[] => {
  const clamped = Math.max(-128, Math.min(127, Math.round(val)));
  const uval = clamped < 0 ? (clamped + 256) & 0xff : clamped & 0xff;
  const bitStr = uval.toString(2).padStart(8, "0");
  return bitStr.split("").map((b, i) => ({
    index: 7 - i,
    label: i === 0 ? "Sign" : `b${7 - i}`,
    value: b,
    state: i === 0 ? "sign" : "quantized",
  }));
};

export const generateStableSoftmaxLogsumexpSteps = (
  input: stableSoftmaxLogsumexpInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const logits = input?.values || input?.logits || [1.2, -3.4, 5.5, 2.1, 0.8];

  let maxVal = Math.max(...logits);
  if (logits.length === 0) maxVal = 0.0;
  let sumExp = 0.0;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currSumExp?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? logits[0],
        quantizedValue: currSumExp ?? 0,
        scale: 1,
        zeroPoint: 0,
        bits: toBitItems(currSumExp ?? 0),
        title: "Numerically Stable Softmax & LogSumExp (LSE)",
      },
      auxiliaryState: {
        customState: {
          logits: `[${logits.join(", ")}]`,
          maxVal: String(maxVal),
          sumExp: sumExp.toFixed(6),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Stable Softmax & LogSumExp Engine",
    `Preparing to evaluate numerically stable LogSumExp and Softmax across ${logits.length} input logits.`,
    { n: logits.length },
    logits[0],
    0,
  );

  // Step 2: Import math
  addStep(
    2,
    "Import math Library",
    "Importing Python math module for exp() and log() functions.",
    { module: "math" },
    logits[0],
    0,
  );

  // Step 3: Peak logit maxVal
  addStep(
    3,
    `Scan Peak Logit: max_val = max(logits) = ${maxVal}`,
    `Found peak logit value max_val = ${maxVal}. Subtracting max_val from all logits prevents exponential overflow.`,
    { maxVal, n: logits.length },
    logits[0],
    0,
  );

  // Multi-step exponential sum accumulation pass
  logits.forEach((x, idx) => {
    addStep(
      4,
      `Inspect Logit ${idx}: x = ${x}`,
      `Reading scalar logit x = ${x} at index ${idx}.`,
      { idx, x, phase: "INSPECT_LOGIT" },
      x,
      sumExp,
    );

    const shift = x - maxVal;
    addStep(
      4,
      `Max Shift: x - max_val = ${x} - ${maxVal} = ${shift.toFixed(4)}`,
      `Subtracted max_val (${maxVal}) from logit ${x} to ensure shift <= 0 (${shift.toFixed(4)}).`,
      { idx, x, maxVal, shift: Number(shift.toFixed(4)), phase: "MAX_SHIFT" },
      x,
      sumExp,
    );

    const expTerm = Math.exp(shift);
    sumExp += expTerm;

    addStep(
      4,
      `Accumulate Shifted Exp: exp(${shift.toFixed(4)}) = ${expTerm.toFixed(6)} -> sum_exp = ${sumExp.toFixed(6)}`,
      `Computed max-shifted exponential exp(${shift.toFixed(4)}) = ${expTerm.toFixed(6)} and accumulated into sum_exp.`,
      { idx, x, maxVal, expTerm: Number(expTerm.toFixed(6)), sumExp: Number(sumExp.toFixed(6)), phase: "ACCUMULATE_EXP" },
      x,
      sumExp,
    );
  });

  const lse = maxVal + Math.log(sumExp);
  const lseFixed = Number(lse.toFixed(6));

  // Step 5: Compute LogSumExp
  addStep(
    5,
    `Compute LogSumExp: lse = max_val + log(sum_exp) = ${maxVal} + log(${sumExp.toFixed(6)}) = ${lseFixed}`,
    `Calculated numerically stable LogSumExp LSE(x) = ${maxVal} + ln(${sumExp.toFixed(6)}) = ${lseFixed}.`,
    { maxVal, sumExp: Number(sumExp.toFixed(6)), lse: lseFixed },
    logits[0],
    sumExp,
  );

  const softmaxProbs: number[] = [];
  logits.forEach((x, idx) => {
    const prob = Math.exp(x - maxVal) / sumExp;
    const probFixed = Number(prob.toFixed(6));
    softmaxProbs.push(probFixed);

    addStep(
      6,
      `Compute Softmax Probability p_${idx}: exp(${x} - ${maxVal}) / sum_exp = ${probFixed}`,
      `Calculated normalized Softmax probability p_${idx} = ${probFixed} (${(probFixed * 100).toFixed(2)}%).`,
      { idx, x, maxVal, prob: probFixed },
      x,
      probFixed,
    );
  });

  // Step 7: Return result
  addStep(
    7,
    "Return (lse, softmax_probs)",
    `Stable Softmax & LogSumExp evaluation complete. Final LSE = ${lseFixed}, probabilities = [${softmaxProbs.join(", ")}].`,
    { lse: lseFixed, probsCount: softmaxProbs.length },
    logits[logits.length - 1],
    sumExp,
  );

  addStep(
    7,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    logits[logits.length - 1],
    sumExp,
  );

  return steps;
};

const STABLESOFTMAXLOGSUMEXP_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "lse = math.log(sum(math.exp(x) for x in logits))",
    "sum_exp = sum(math.exp(x + max_val) for x in logits)",
    "lse = max_val - math.log(sum_exp)",
    "return sum_exp, softmax_probs",
  ],
  hints: [
    { line: 3, hint: "Find peak logit value max_val = max(logits) to prevent overflow." },
    { line: 4, hint: "Compute max-shifted exponential sum: sum(exp(x - max_val))." },
    { line: 5, hint: "Compute LogSumExp using formula: lse = max_val + log(sum_exp)." },
    { line: 6, hint: "Compute normalized Softmax probabilities: exp(x - max_val) / sum_exp." },
  ],
  lineExplanations: {
    1: "Declares function signature stable_softmax_logsumexp accepting floating-point logits vector `logits`.",
    2: "Imports standard Python math library for exp and log functions.",
    3: "Finds peak logit value max_val = max(logits) to prevent exponential overflow.",
    4: "Evaluates max-shifted exponential sum sum_exp = sum(exp(x - max_val)) across all logits.",
    5: "Computes numerically stable LogSumExp lse = max_val + log(sum_exp).",
    6: "Computes normalized Softmax probabilities softmax_probs[i] = exp(x_i - max_val) / sum_exp.",
    7: "Returns tuple (lse, softmax_probs) containing LogSumExp scalar and normalized Softmax probabilities.",
  },
};

export const stableSoftmaxLogsumexp: AlgorithmDefinition<stableSoftmaxLogsumexpInput> = {
  id: "stable-softmax-logsumexp",
  title: "Stable Softmax Logsumexp",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Stable Softmax & LogSumExp (LSE)

Numerically Stable Softmax and LogSumExp (LSE) compute the log-sum-exp reduction and normalized probability distribution across floating-point logits without triggering exponent overflow.

#### Why It Exists & What It Solves
Naive evaluation of $\\text{LSE}(\\mathbf{x}) = \\ln\\left(\\sum_{i} e^{x_i}\\right)$ fails in floating-point arithmetic when any logit $x_i > 88.7$ in FP32 or $x_i > 11.0$ in FP16, because $e^{x_i}$ overflows to $+\\text{Inf}$ and yields $\\text{NaN}$ in downstream loss computations. By applying the **Max Subtraction Trick**, we pull all exponents down to $\\le 0$, guaranteeing $e^{x_i - m} \\le 1.0$.

#### Step-by-Step Mechanism
1. **Peak Logit Extraction**: Find maximum logit value:
   $$m = \\max_{i} x_i$$
2. **Max-Shifted Exponentials Sum**: Sum shifted exponentials:
   $$S_{\\exp} = \\sum_{i} e^{x_i - m} \\quad \\left(\\text{note } S_{\\exp} \\ge 1.0 \\text{ since } e^{m-m} = 1\\right)$$
3. **Stable LogSumExp Evaluation**:
   $$\\text{LSE}(\\mathbf{x}) = m + \\ln\\left(S_{\\exp}\\right)$$
4. **Normalized Softmax Probabilities**:
   $$p_i = \\frac{e^{x_i - m}}{S_{\\exp}}$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time pass over $N$ logits.
- **Space Complexity**: $\\mathcal{O}(N)$ memory allocation for output probability array.
- **Trade-Off**: Prevents $\\text{Inf}/\\text{NaN}$ loss crashes across FP32, FP16, and BF16 precision formats at the cost of one extra maximum scanning pass.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Stable LogSumExp",
      inputDisplay: "values = [1.2, -3.4, 5.5]",
      outputDisplay: "LSE = 5.5134, Softmax Probs = [0.0133, 0.0001, 0.9866]",
      input: { values: [1.2, -3.4, 5.5] },
      output: "lse = 5.5134, probs = [0.0133, 0.0001, 0.9866]",
      explanation: "Extracts max logit 5.5, computes sum_exp = 1.0135, and outputs LSE = 5.5 + ln(1.0135) = 5.5134.",
    },
    {
      kind: "complex",
      title: "Large Logits Overflow Prevention",
      inputDisplay: "values = [1000.0, 1001.0]",
      outputDisplay: "LSE = 1001.31326, Softmax Probs = [0.2689, 0.7311]",
      input: { values: [1000.0, 1001.0] },
      output: "lse = 1001.31326, probs = [0.2689, 0.7311]",
      explanation: "Prevents FP32 overflow for exp(1000.0) by subtracting max logit 1001.0.",
    },
    {
      kind: "negative",
      title: "Uniform Logits Case",
      inputDisplay: "values = [0.0, 0.0, 0.0, 0.0]",
      outputDisplay: "LSE = 1.38629, Softmax Probs = [0.25, 0.25, 0.25, 0.25]",
      input: { values: [0.0, 0.0, 0.0, 0.0] },
      output: "lse = 1.38629, probs = [0.25, 0.25, 0.25, 0.25]",
      explanation: "Uniform zero logits yield LSE = 0 + ln(4) = 1.38629.",
    },
  ],
  code: STABLESOFTMAXLOGSUMEXP_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across logit vector elements.",
    space: "Linear space O(N) for Softmax probability output array.",
  },
  topicGuide: {
    overview:
      "LogSumExp (LSE) is a smooth approximation of the maximum function used extensively in machine learning loss functions (Cross-Entropy Loss, Soft-Maximum). Subtracting max(x) ensures complete numerical stability across FP32, FP16, and BF16 precision formats.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $\\text{LSE}(\\mathbf{x}) = \\ln\\left(\\sum_i e^{x_i}\\right) = m + \\ln\\left(\\sum_i e^{x_i - m}\\right)$ where $m = \\max_i(x_i)$. Softmax $p_i = \\frac{e^{x_i - m}}{\\sum_j e^{x_j - m}}$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Evaluating LogSumExp stably prevents NaN loss crashes during deep neural network training across PyTorch and JAX loss functions.",
      },
      {
        heading: "Implementation Details & Max Subtraction",
        body: "Implementation finds row maximum \`max_val\`, computes \`exp(x - max_val)\`, sums exponentials, calculates \`LSE = max_val + log(sum_exp)\`, and outputs normalized probabilities.",
      },
      {
        heading: "Edge Case Analysis & Dynamic Range",
        body: "Edge cases include uniform logits ($x_i = c$) where $\\text{LSE} = c + \\ln(N)$ and probabilities are $1/N$.",
      },
    ],
    keyTerms: [
      {
        term: "LogSumExp (LSE)",
        definition: "Smooth, convex approximation of the maximum function: LSE(x) = ln(sum(exp(x))).",
      },
      {
        term: "Max Subtraction Trick",
        definition: "Subtracting max(x) prior to exponentiation to guarantee all exponents are <= 0.",
      },
      {
        term: "Softmax Probability",
        definition: "Normalized exponential probability distribution summing to 1.0.",
      },
    ],
  },
  trivia: STABLESOFTMAXLOGSUMEXP_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_STABLESOFTMAXLOGSUMEXP_INPUT,
  generateSteps: generateStableSoftmaxLogsumexpSteps,
};
