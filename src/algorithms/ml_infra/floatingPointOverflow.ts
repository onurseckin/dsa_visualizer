import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface FloatingPointOverflowInput {
  logits: number[];
  useStabilized: boolean;
}

export const FLOATING_POINT_OVERFLOW_CODE = `def stable_softmax(logits: list[float], use_stabilized: bool) -> list[float]:
    if not logits:
        return []
    
    if use_stabilized:
        max_val = max(logits)
        shifted = [x - max_val for x in logits]
    else:
        shifted = logits
        
    exps = []
    for x in shifted:
        exps.append(math.exp(x))  # May overflow to inf if un-stabilized!
        
    sum_exps = sum(exps)
    if sum_exps == 0 or math.isinf(sum_exps) or math.isnan(sum_exps):
        return [0.0] * len(logits)  # Numerical instability
        
    probs = [e / sum_exps for e in exps]
    return probs`;

export const DEFAULT_FLOATING_POINT_OVERFLOW_INPUT: FloatingPointOverflowInput = {
  logits: [1000.0, 1001.0, 1002.0],
  useStabilized: true,
};

export const generateFloatingPointOverflowSteps = (
  input: FloatingPointOverflowInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { logits, useStabilized } = input;
  const n = logits.length;

  const buildElements = (
    vals: number[],
    state: ArrayElement["state"],
    ptrs?: string[],
  ): ArrayElement[] => {
    return vals.map((v, i) => ({
      id: `elem-${i}`,
      value: Number.isFinite(v) ? Math.round(v * 100) / 100 : 9999,
      state,
      pointers: ptrs ? [ptrs[i] || ""] : [`${v}`],
    }));
  };

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    elements: ArrayElement[],
    vars: Record<string, string | number | boolean>,
    customState?: Record<string, string>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements,
      },
      auxiliaryState: {
        customState: {
          useStabilized: String(useStabilized),
          logits: `[${logits.join(", ")}]`,
          ...customState,
        },
      },
      variables: vars,
    });
  };

  if (n === 0) {
    addStep(3, "Empty logits input", "Logits array is empty. Returning empty probabilities.", [], {
      valid: false,
    });
    return steps;
  }

  addStep(
    5,
    `Start Softmax computation (Stabilized: ${useStabilized})`,
    `Input logits: [${logits.join(
      ", ",
    )}]. Testing numerical stability of exponential calculations.`,
    buildElements(logits, "default"),
    { n, useStabilized },
  );

  let shifted: number[] = [];
  let maxVal = 0;

  if (useStabilized) {
    maxVal = Math.max(...logits);
    shifted = logits.map((x) => x - maxVal);

    addStep(
      6,
      `Compute max(logits) = ${maxVal} and shift logits`,
      `Subtracting maxVal = ${maxVal} guarantees all shifted logits are <= 0, preventing exp(x) overflow.`,
      buildElements(shifted, "active"),
      { maxVal },
      { shifted: `[${shifted.join(", ")}]` },
    );
  } else {
    shifted = [...logits];
    addStep(
      8,
      "Naive Softmax: Skipping logit shift",
      "Using raw logits without subtracting max value. Large positive logits will cause float overflow (inf).",
      buildElements(shifted, "compare"),
      { maxVal: 0 },
    );
  }

  const exps: number[] = [];
  let overflowOccurred = false;

  for (let i = 0; i < n; i++) {
    const x = shifted[i];
    const e = Math.exp(x);
    exps.push(e);

    if (!Number.isFinite(e) || e > 1e300) {
      overflowOccurred = true;
    }

    addStep(
      12,
      `Compute exp(${x}) = ${Number.isFinite(e) ? e.toExponential(3) : "inf/NaN"}`,
      `Calculating e^(${x}). ${
        overflowOccurred
          ? "WARNING: Value exceeded float64 overflow limit! Resulted in inf."
          : "Value successfully computed within bounds."
      }`,
      buildElements(exps, overflowOccurred ? "compare" : "visited"),
      { i, x, expVal: Number.isFinite(e) ? e : "inf", overflowOccurred },
    );
  }

  const sumExps = exps.reduce((acc, v) => acc + v, 0);

  if (overflowOccurred || !Number.isFinite(sumExps) || sumExps === 0) {
    addStep(
      16,
      "Numerical Failure: Sum of exps is inf/NaN",
      "Dividing by inf/NaN produces [NaN, NaN, ...]. Softmax failed due to floating-point overflow!",
      buildElements(
        exps,
        "compare",
        exps.map(() => "OVERFLOW"),
      ),
      { sumExps: "inf", success: false },
    );
    return steps;
  }

  const probs = exps.map((e) => e / sumExps);

  addStep(
    18,
    `Compute Softmax Probabilities: [${probs.map((p) => p.toFixed(4)).join(", ")}]`,
    `Successfully normalized exponentiated values into valid probability distribution (sum = 1.0).`,
    buildElements(
      probs,
      "sorted",
      probs.map((p) => `p=${p.toFixed(3)}`),
    ),
    { sumExps, success: true },
  );

  return steps;
};

export const FLOATING_POINT_OVERFLOW_TRIVIA: TriviaMeta = {
  skipLines: [2, 4],
  hints: [
    { line: 6, hint: "Subtract max value for stable Log-Sum-Exp" },
    { line: 12, hint: "Exponentiate shifted logits exp(x - max)" },
    { line: 15, hint: "Check for inf or NaN before division" },
  ],
  distractors: [
    "shifted = [x + max_val for x in logits]",
    "exps.append(math.log(x))",
    "probs = [e * sum_exps for e in exps]",
  ],
};

export const floatingPointOverflow: AlgorithmDefinition<FloatingPointOverflowInput> = {
  id: "floating-point-overflow",
  title: "Floating-Point Overflow & Underflow (Log-Sum-Exp Trick)",
  category: "ml_precision_quantization",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "Foundational Math & DSA" }],
  description:
    "Demonstrate numerical instability in exponential calculations (Softmax) and stabilization via the Log-Sum-Exp trick.",
  code: FLOATING_POINT_OVERFLOW_CODE,
  defaultInput: DEFAULT_FLOATING_POINT_OVERFLOW_INPUT,
  examples: [
    {
      kind: "basic",
      title: "Stabilized Large Logits Softmax",
      input: { logits: [1000.0, 1001.0, 1002.0], useStabilized: true },
      output: "[0.090, 0.245, 0.665]",
      explanation: "Subtracting max (1002) shifts logits to [-2, -1, 0], avoiding float overflow.",
    },
    {
      kind: "complex",
      title: "Negative Logits Softmax",
      input: { logits: [-10.0, -5.0, 0.0], useStabilized: true },
      output: "[0.000, 0.007, 0.993]",
      explanation: "Stabilized softmax handles both negative and zero logits reliably.",
    },
    {
      kind: "negative",
      title: "Un-stabilized Large Logits Overflow",
      input: { logits: [1000.0, 1001.0, 1002.0], useStabilized: false },
      output: "[0.0, 0.0, 0.0]",
      explanation: "Un-stabilized exp(1000) causes float overflow to inf/NaN.",
    },
  ],
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Three linear passes (max, shift+exp, normalize) yield O(N) time complexity.",
    space: "O(N) memory for storing shifted logits, exponentials, and output probabilities.",
  },
  topicGuide: {
    overview:
      "IEEE 754 float64 overflows at ~1.79e308 (exp(709)), while float32 overflows at ~3.4e38 (exp(88)). In ML, neural network logits before Softmax can easily reach hundreds, causing catastrophic exp(x) overflow to infinity.",
    sections: [
      {
        heading: "Log-Sum-Exp Numerical Trick",
        body: "softmax(x_i) = exp(x_i) / sum(exp(x_j)) = exp(x_i - m) / sum(exp(x_j - m)) where m = max(x). Since x_i - m <= 0, exp(x_i - m) is strictly in (0, 1], guaranteeing no overflow.",
      },
    ],
    keyTerms: [
      {
        term: "Softmax",
        definition: "Function mapping a vector of real numbers to a probability distribution.",
      },
      {
        term: "Log-Sum-Exp",
        definition: "Smooth approximation to the max function: LSE(x) = log(sum(exp(x_i))).",
      },
    ],
  },
  trivia: FLOATING_POINT_OVERFLOW_TRIVIA,
  generateSteps: generateFloatingPointOverflowSteps,
};
