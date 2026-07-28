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
        exps.append(math.exp(x))
        
    sum_exps = sum(exps)
    if sum_exps == 0 or math.isinf(sum_exps) or math.isnan(sum_exps):
        return [0.0] * len(logits)
        
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

  const formatVal = (v: number): number | string => {
    if (!Number.isFinite(v)) return "inf";
    return Math.abs(v) < 0.0001 && v !== 0
      ? Number(v.toExponential(2))
      : Math.round(v * 1000) / 1000;
  };

  const buildElements = (
    vals: (number | string)[],
    state: ArrayElement["state"],
    ptrs?: string[],
  ): ArrayElement[] => {
    return vals.map((v, i) => ({
      id: `elem-${i}`,
      value: typeof v === "number" ? formatVal(v) : v,
      state,
      pointers: ptrs ? [ptrs[i] || ""] : [`i=${i}`],
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
    addStep(2, "Check empty logits input", "Logits array is empty.", [], { n: 0 });
    addStep(
      3,
      "Return empty list",
      "Logits array is empty. Returning empty probabilities array.",
      [],
      { valid: false },
    );
    return steps;
  }

  addStep(
    5,
    `Check numerical stabilization flag (useStabilized: ${useStabilized})`,
    `Input logits: [${logits.join(", ")}]. Testing numerical stability of exponential calculations.`,
    buildElements(
      logits,
      "default",
      logits.map((v) => `logit=${v}`),
    ),
    { n, useStabilized },
  );

  let shifted: number[] = [];
  let maxVal = 0;

  if (useStabilized) {
    maxVal = Math.max(...logits);
    addStep(
      6,
      `Compute max(logits) = ${maxVal}`,
      `Find the maximum logit value maxVal = ${maxVal} to shift all logits down to <= 0.`,
      buildElements(
        logits,
        "active",
        logits.map((v) => (v === maxVal ? "maxVal" : "")),
      ),
      { maxVal },
      { maxVal: String(maxVal) },
    );

    shifted = logits.map((x) => x - maxVal);
    addStep(
      7,
      `Shift logits: x - max_val`,
      `Shifted logits: [${shifted.join(", ")}]. All shifted logits are <= 0, guaranteeing exp(x) <= 1.0 and preventing float overflow.`,
      buildElements(
        shifted,
        "visited",
        shifted.map((s) => `shifted=${s}`),
      ),
      { maxVal },
      { shifted: `[${shifted.join(", ")}]` },
    );
  } else {
    shifted = [...logits];
    addStep(
      9,
      "Naive Softmax: Keep raw logits",
      "Using raw logits without subtracting max value. Large positive logits will cause exponentiation overflow (exp(x) -> inf).",
      buildElements(
        shifted,
        "compare",
        shifted.map((v) => `raw=${v}`),
      ),
      { maxVal: 0 },
      { shifted: `[${shifted.join(", ")}]` },
    );
  }

  addStep(
    11,
    "Initialize exps list",
    "Prepare buffer array to collect exponentiated values math.exp(x).",
    buildElements(shifted, "default"),
    { expsCount: 0 },
  );

  const exps: number[] = [];
  let overflowOccurred = false;

  for (let i = 0; i < n; i++) {
    const x = shifted[i];

    addStep(
      12,
      `Loop header: for x in shifted (index ${i}, x = ${x})`,
      `Accessing element at index ${i} with shifted value ${x}.`,
      buildElements(
        shifted.map((val, idx) => (idx < i ? exps[idx] : val)),
        "active",
        shifted.map((_, idx) => (idx === i ? `idx=${i}` : idx < i ? "computed" : "")),
      ),
      { i, x, expsCount: exps.length },
    );

    const e = Math.exp(x);
    exps.push(e);
    const isInf = !Number.isFinite(e) || e > 1e300;
    if (isInf) {
      overflowOccurred = true;
    }

    const expDisplay = isInf ? "inf" : formatVal(e);
    addStep(
      13,
      `Compute exp(${x}) = ${expDisplay}`,
      isInf
        ? "WARNING: Value exceeded IEEE 754 float64 bounds! Resulted in +inf overflow."
        : `Successfully computed exp(${x}) = ${expDisplay}.`,
      buildElements(
        exps.concat(shifted.slice(i + 1)),
        isInf ? "compare" : "visited",
        exps.map((ev) => (!Number.isFinite(ev) ? "OVERFLOW" : `exp=${formatVal(ev)}`)),
      ),
      { i, x, expVal: isInf ? "inf" : formatVal(e), overflowOccurred },
    );
  }

  const sumExps = exps.reduce((acc, v) => acc + v, 0);
  const isInvalidSum = overflowOccurred || !Number.isFinite(sumExps) || sumExps === 0;

  addStep(
    15,
    `Compute sum_exps = sum(exps) = ${isInvalidSum ? "inf" : formatVal(sumExps)}`,
    "Sum all exponentials to form the normalization denominator for Softmax.",
    buildElements(
      exps,
      isInvalidSum ? "compare" : "visited",
      exps.map(() => `sum=${isInvalidSum ? "inf" : formatVal(sumExps)}`),
    ),
    { sumExps: isInvalidSum ? "inf" : formatVal(sumExps) },
  );

  addStep(
    16,
    `Check stability condition: sum_exps (${isInvalidSum ? "inf/NaN" : formatVal(sumExps)})`,
    isInvalidSum
      ? "Denominator sum_exps is infinite or zero! Softmax division would produce NaNs."
      : `Denominator sum_exps is finite and valid (${formatVal(sumExps)}). Safe to perform division.`,
    buildElements(exps, isInvalidSum ? "compare" : "visited"),
    { isInvalidSum },
  );

  if (isInvalidSum) {
    addStep(
      17,
      "Numerical Failure: Return fallback zero probabilities",
      "Dividing by inf/NaN produces [NaN, NaN, ...]. Softmax failed due to floating-point overflow! Returning [0.0, 0.0, ...].",
      buildElements(
        exps.map(() => 0),
        "compare",
        exps.map(() => "OVERFLOW"),
      ),
      { sumExps: "inf", success: false },
    );
    return steps;
  }

  const probs = exps.map((e) => e / sumExps);

  addStep(
    19,
    `Compute Softmax Probabilities: [${probs.map((p) => p.toFixed(3)).join(", ")}]`,
    "Divide each exponential by sum_exps to convert shifted logits into a probability distribution.",
    buildElements(
      probs,
      "active",
      probs.map((p) => `p=${p.toFixed(3)}`),
    ),
    { sumExps: formatVal(sumExps), success: true },
  );

  addStep(
    20,
    `Return Softmax probabilities`,
    "Successfully normalized exponentiated values into a valid probability distribution (sum = 1.0).",
    buildElements(
      probs,
      "sorted",
      probs.map((p) => `p=${p.toFixed(3)}`),
    ),
    { sumExps: formatVal(sumExps), success: true },
  );

  return steps;
};

export const FLOATING_POINT_OVERFLOW_TRIVIA: TriviaMeta = {
  skipLines: [1, 4, 10, 14, 18],
  hints: [
    { line: 6, hint: "Find max logit value for normalization" },
    { line: 7, hint: "Subtract max value for stable Log-Sum-Exp" },
    { line: 13, hint: "Exponentiate shifted logit: exp(x - max)" },
    { line: 16, hint: "Check for inf or NaN before division" },
    { line: 19, hint: "Normalize exponentials into probabilities: e / sum_exps" },
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
  topicIds: ["ml_precision_quantization"],
  difficulty: "Medium",
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
