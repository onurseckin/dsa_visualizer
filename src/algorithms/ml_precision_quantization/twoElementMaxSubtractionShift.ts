import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface twoElementMaxSubtractionShiftInput {
  values?: number[];
  x1?: number;
  x2?: number;
}

export const TWOELEMENTMAXSUBTRACTIONSHIFT_CODE = `def two_element_max_subtraction_shift(x1, x2):
    import math
    max_x = max(x1, x2)
    shift_x1 = x1 - max_x
    shift_x2 = x2 - max_x
    exp_x1, exp_x2 = math.exp(shift_x1), math.exp(shift_x2)
    return max_x, exp_x1, exp_x2`;

export const DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT: twoElementMaxSubtractionShiftInput = {
  values: [5.5, 8.2, 1.0, 4.0, -10.0, -2.0],
  x1: 5.5,
  x2: 8.2,
};

const toBitItems = (val: number): BitItem[] => {
  const clamped = Math.max(-128, Math.min(127, Math.round(val * 100)));
  const uval = clamped < 0 ? (clamped + 256) & 0xff : clamped & 0xff;
  const bitStr = uval.toString(2).padStart(8, "0");
  return bitStr.split("").map((b, i) => ({
    index: 7 - i,
    label: i === 0 ? "Sign" : `b${7 - i}`,
    value: b,
    state: i === 0 ? "sign" : "quantized",
  }));
};

export const generateTwoElementMaxSubtractionShiftSteps = (
  input: twoElementMaxSubtractionShiftInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const rawVals = input?.values || [input?.x1 ?? 5.5, input?.x2 ?? 8.2];
  const vals = rawVals.length >= 6 ? rawVals : [...rawVals, 1.0, 4.0, -10.0, -2.0];
  const pairs: [number, number][] = [];
  for (let i = 0; i < vals.length; i += 2) {
    if (i + 1 < vals.length) {
      pairs.push([vals[i], vals[i + 1]]);
    } else {
      pairs.push([vals[i], 0.0]);
    }
  }
  if (pairs.length === 0) pairs.push([5.5, 8.2]);

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currExp?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? pairs[0][0],
        quantizedValue: currExp ?? 0,
        scale: 1,
        zeroPoint: 0,
        bits: toBitItems(currExp ?? 0),
        title: "Two-Element Max Subtraction Shift (Butterfly Softmax)",
      },
      auxiliaryState: {
        customState: {
          values: `[${vals.join(", ")}]`,
          pairsCount: String(pairs.length),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Two-Element Max Subtraction Shift Engine",
    `Preparing pairwise max-subtraction exponent shift kernel across ${pairs.length} logit pair(s).`,
    { pairsCount: pairs.length },
    pairs[0][0],
    0,
  );

  // Step 2: Import math
  addStep(
    2,
    "Import math Library",
    "Importing standard math library for exp() function.",
    { module: "math" },
    pairs[0][0],
    0,
  );

  // Multi-step reduction per pair
  pairs.forEach(([x1, x2], pIdx) => {
    addStep(
      1,
      `Inspect Logit Pair ${pIdx + 1}: x1 = ${x1}, x2 = ${x2}`,
      `Reading pairwise logit inputs x1 = ${x1}, x2 = ${x2} for butterfly reduction step ${pIdx + 1}.`,
      { pair: pIdx + 1, x1, x2, phase: "INSPECT_PAIR" },
      x1,
      0,
    );

    const maxX = Math.max(x1, x2);

    addStep(
      3,
      `Compute Pairwise Maximum: max_x = max(${x1}, ${x2}) = ${maxX}`,
      `Found peak magnitude max_x = ${maxX} for logit pair [${x1}, ${x2}].`,
      { pair: pIdx + 1, x1, x2, maxX, phase: "COMPUTE_MAX" },
      x1,
      0,
    );

    const shiftX1 = x1 - maxX;

    addStep(
      4,
      `Calculate Shift for x1: shift_x1 = ${x1} - ${maxX} = ${shiftX1}`,
      `Calculated max-shifted exponent argument shift_x1 = ${shiftX1} (guaranteed <= 0.0).`,
      { pair: pIdx + 1, x1, maxX, shiftX1, phase: "SHIFT_X1" },
      x1,
      shiftX1,
    );

    const shiftX2 = x2 - maxX;

    addStep(
      5,
      `Calculate Shift for x2: shift_x2 = ${x2} - ${maxX} = ${shiftX2}`,
      `Calculated max-shifted exponent argument shift_x2 = ${shiftX2} (guaranteed <= 0.0).`,
      { pair: pIdx + 1, x2, maxX, shiftX2, phase: "SHIFT_X2" },
      x2,
      shiftX2,
    );

    const expX1 = Math.exp(shiftX1);
    const expX2 = Math.exp(shiftX2);
    const expX1Fixed = Number(expX1.toFixed(6));
    const expX2Fixed = Number(expX2.toFixed(6));

    addStep(
      6,
      `Evaluate Exponentials: exp(${shiftX1}) = ${expX1Fixed}, exp(${shiftX2}) = ${expX2Fixed}`,
      `Evaluated exponentials: exp(${shiftX1}) = ${expX1Fixed}, exp(${shiftX2}) = ${expX2Fixed}. Max exponential is strictly 1.0.`,
      {
        pair: pIdx + 1,
        shiftX1,
        shiftX2,
        expX1: expX1Fixed,
        expX2: expX2Fixed,
        phase: "EVAL_EXPS",
      },
      x1,
      expX1Fixed,
    );

    addStep(
      7,
      `Return Dissected Pair ${pIdx + 1} Tuple: (max_x=${maxX}, exp_x1=${expX1Fixed}, exp_x2=${expX2Fixed})`,
      `Completed two-element max-subtraction shift for pair [${x1}, ${x2}].`,
      { pair: pIdx + 1, maxX, expX1: expX1Fixed, expX2: expX2Fixed },
      x1,
      expX1Fixed,
    );
  });

  // Step 7: Complete
  addStep(
    7,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    pairs[pairs.length - 1][0],
    0,
  );

  return steps;
};

const TWOELEMENTMAXSUBTRACTIONSHIFT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "max_x = min(x1, x2)",
    "shift_x1 = x1 + max_x",
    "exp_x1 = math.exp(x1)",
    "return x1 + x2",
  ],
  hints: [
    { line: 3, hint: "Find peak logit value max_x = max(x1, x2) between the two operands." },
    { line: 4, hint: "Subtract max_x from x1 to obtain non-positive shift value x1 - max_x." },
    { line: 5, hint: "Subtract max_x from x2 to obtain non-positive shift value x2 - max_x." },
    { line: 6, hint: "Evaluate exponentials math.exp(shift_x1) and math.exp(shift_x2)." },
  ],
  lineExplanations: {
    1: "Declares function signature two_element_max_subtraction_shift accepting two scalar logits x1 and x2.",
    2: "Imports standard Python math library for exp() calculation.",
    3: "Computes peak logit value max_x = max(x1, x2).",
    4: "Computes max-subtracted shift argument shift_x1 = x1 - max_x.",
    5: "Computes max-subtracted shift argument shift_x2 = x2 - max_x.",
    6: "Evaluates max-shifted exponentials exp_x1 = exp(shift_x1) and exp_x2 = exp(shift_x2).",
    7: "Returns tuple (max_x, exp_x1, exp_x2) containing peak scalar and shifted exponential pair.",
  },
};

export const twoElementMaxSubtractionShift: AlgorithmDefinition<twoElementMaxSubtractionShiftInput> =
  {
    id: "two-element-max-subtraction-shift",
    title: "Two Element Max Subtraction Shift",
    topicIds: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Easy",
    description: `### Two Element Max Subtraction Shift

Two-Element Max Subtraction Shift is the atomic pairwise reduction step used in GPU parallel Softmax kernels (e.g. CUDA warp shuffle butterfly reductions, FlashAttention online tile reductions).

#### Why It Exists & What It Solves
When computing Softmax reductions across a row of logits, threads pair up to combine intermediate maximums $m_1, m_2$ and sum terms $d_1, d_2$. Pairwise max subtraction shifts logits relative to their local maximum $m = \\max(x_1, x_2)$, guaranteeing exponents satisfy $e^{\\text{shift}} \\le 1.0$ and preventing floating point overflow.

#### Step-by-Step Mechanism
1. **Pairwise Maximum**: Find scalar maximum:
   $$m = \\max(x_1, x_2)$$
2. **Shift Calculation**:
   $$\\Delta_1 = x_1 - m \\le 0, \\quad \\Delta_2 = x_2 - m \\le 0$$
3. **Exponential Evaluation**:
   $$e_1 = e^{\\Delta_1}, \\quad e_2 = e^{\\Delta_2}$$
   *(Notice $\\max(e_1, e_2) = 1.0$)*.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(1)$ constant time operations.
- **Space Complexity**: $\\mathcal{O}(1)$ constant auxiliary memory.
- **Trade-Off**: Enables 1-cycle butterfly warp shuffle reductions in CUDA shared memory without floating point overflow.`,
    constraints: ["-10^9 <= x1, x2 <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Standard Pairwise Shift",
        inputDisplay: "x1 = 5.5, x2 = 8.2",
        outputDisplay: "max_x = 8.2, exp_x1 = 0.0672, exp_x2 = 1.0",
        input: { x1: 5.5, x2: 8.2 },
        output: "max_x = 8.2, exp_x1 = 0.0672, exp_x2 = 1.0",
        explanation:
          "Max is 8.2. Shifted exponentials: exp(5.5 - 8.2) = exp(-2.7) = 0.0672, exp(8.2 - 8.2) = 1.0.",
      },
      {
        kind: "complex",
        title: "Identical Logits Pair",
        inputDisplay: "x1 = 4.0, x2 = 4.0",
        outputDisplay: "max_x = 4.0, exp_x1 = 1.0, exp_x2 = 1.0",
        input: { x1: 4.0, x2: 4.0 },
        output: "max_x = 4.0, exp_x1 = 1.0, exp_x2 = 1.0",
        explanation: "Identical logits yield max_x = 4.0 and exponentials [1.0, 1.0].",
      },
      {
        kind: "negative",
        title: "Negative Logits Pair",
        inputDisplay: "x1 = -10.0, x2 = -2.0",
        outputDisplay: "max_x = -2.0, exp_x1 = 0.000335, exp_x2 = 1.0",
        input: { x1: -10.0, x2: -2.0 },
        output: "max_x = -2.0, exp_x1 = 0.000335, exp_x2 = 1.0",
        explanation:
          "Negative logits find max_x = -2.0 and compute shifted exponentials correctly.",
      },
    ],
    code: TWOELEMENTMAXSUBTRACTIONSHIFT_CODE,
    timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Constant time O(1) max comparison and exponential evaluation.",
      space: "Constant space O(1) auxiliary variables.",
    },
    topicGuide: {
      overview:
        "Two-element max subtraction is the fundamental step in parallel reduction trees for online softmax. In GPU warp shuffle butterfly reductions, threads pair up to compute two-element max shifts to reduce attention scores safely in shared memory.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, $m = \\max(x_1, x_2)$. Shifted logits are $\\Delta_1 = x_1 - m$ and $\\Delta_2 = x_2 - m$. Exponentials are $e_1 = e^{\\Delta_1}$ and $e_2 = e^{\\Delta_2}$ where $\\max(e_1, e_2) = 1.0$.",
        },
        {
          heading: "Practical Applications in ML Systems",
          body: "CUDA warp shuffle functions (`__shfl_xor_sync`) use pairwise max subtraction shifts to build parallel LogSumExp trees across GPU SIMD lanes.",
        },
        {
          heading: "Implementation Details & Exp Shift",
          body: "Implementation computes pairwise maximum `max_x`, subtracts `max_x` from operands x1 and x2, and evaluates exponentials `exp(shift_x1)` and `exp(shift_x2)`.",
        },
        {
          heading: "Edge Case Analysis & Dynamic Range",
          body: "Edge cases include identical logits ($x_1 = x_2$) yielding shift 0 and exponential 1.0.",
        },
      ],
      keyTerms: [
        {
          term: "Warp Shuffle Reduction",
          definition:
            "GPU hardware instruction exchanging register values directly between SIMD threads without DRAM memory access.",
        },
        {
          term: "Butterfly Reduction Tree",
          definition:
            "Parallel tree pattern reducing N operands in log2(N) steps across CUDA threads.",
        },
        {
          term: "Pairwise Local Maximum",
          definition: "The local maximum max(x1, x2) computed between two SIMD lane operands.",
        },
      ],
    },
    trivia: TWOELEMENTMAXSUBTRACTIONSHIFT_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT,
    generateSteps: generateTwoElementMaxSubtractionShiftSteps,
  };
