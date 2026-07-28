import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface onePassOnlineSoftmaxSramKernelInput {
  values?: number[];
  logits?: number[];
}

export const ONEPASSONLINESOFTMAXSRAMKERNEL_CODE = `def one_pass_online_softmax_sram_kernel(logits):
    import math
    d_max = float('-inf')
    d_sum = 0.0
    for x in logits:
        if x > d_max:
            d_sum = d_sum * math.exp(d_max - x) if d_max != float('-inf') else 0.0
            d_max = x
        d_sum += math.exp(x - d_max)
    probs = [math.exp(x - d_max) / d_sum for x in logits]
    return probs, d_max, d_sum`;

export const DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT: onePassOnlineSoftmaxSramKernelInput = {
  values: [1.2, -3.4, 5.5, -0.8, 2.1],
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

export const generateOnePassOnlineSoftmaxSramKernelSteps = (
  input: onePassOnlineSoftmaxSramKernelInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const logits = input?.values || input?.logits || [1.2, -3.4, 5.5, -0.8, 2.1];

  let dMax = Number.NEGATIVE_INFINITY;
  let dSum = 0.0;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currSum?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? logits[0],
        quantizedValue: currSum ?? 0,
        scale: 1,
        zeroPoint: 0,
        bits: toBitItems(currSum ?? 0),
        title: "One-Pass Online Softmax SRAM Kernel (FlashAttention)",
      },
      auxiliaryState: {
        customState: {
          logits: `[${logits.join(", ")}]`,
          dMax: dMax === Number.NEGATIVE_INFINITY ? "-inf" : dMax.toFixed(4),
          dSum: dSum.toFixed(6),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize One-Pass Online Softmax SRAM Kernel Engine",
    `Preparing to compute streaming online Softmax reduction across ${logits.length} logits in high-speed GPU SRAM memory.`,
    { n: logits.length },
    logits[0],
    0,
  );

  // Step 2: Import math
  addStep(
    2,
    "Import math Module",
    "Importing standard math library for exponential calculation.",
    { module: "math" },
    logits[0],
    0,
  );

  // Step 3: d_max = -inf
  addStep(
    3,
    "Initialize Running Row Maximum Tracker `d_max = -inf`",
    "Setting running row maximum tracker `d_max = -inf`.",
    { dMax: "-inf" },
    logits[0],
    0,
  );

  // Step 4: d_sum = 0.0
  addStep(
    4,
    "Initialize Running Exponential Sum Accumulator `d_sum = 0.0`",
    "Setting running exponential sum accumulator `d_sum = 0.0`.",
    { dSum: 0.0 },
    logits[0],
    0,
  );

  // Multi-step online reduction per logit
  logits.forEach((x, idx) => {
    addStep(
      5,
      `Inspect Streaming Logit ${idx}: x = ${x}`,
      `Reading streaming logit x = ${x} at index ${idx}.`,
      { idx, x, phase: "INSPECT_LOGIT" },
      x,
      dSum,
    );

    const isNewMax = x > dMax;

    addStep(
      6,
      `Check Max Condition: x (${x}) > d_max (${dMax === Number.NEGATIVE_INFINITY ? "-inf" : dMax.toFixed(4)}) -> ${isNewMax}`,
      isNewMax
        ? `New maximum detected! ${x} > ${dMax === Number.NEGATIVE_INFINITY ? "-inf" : dMax.toFixed(4)}. Rescaling existing running sum d_sum.`
        : `Logit ${x} <= running max ${dMax.toFixed(4)}. No sum rescaling needed.`,
      {
        idx,
        x,
        dMax: dMax === Number.NEGATIVE_INFINITY ? "-inf" : Number(dMax.toFixed(4)),
        isNewMax,
        phase: "CHECK_MAX",
      },
      x,
      dSum,
    );

    if (isNewMax) {
      const prevMax = dMax;
      if (prevMax !== Number.NEGATIVE_INFINITY) {
        const rescaleFactor = Math.exp(prevMax - x);
        dSum = dSum * rescaleFactor;

        addStep(
          7,
          `Rescale Running Sum: d_sum * exp(${prevMax.toFixed(4)} - ${x}) -> ${dSum.toFixed(6)}`,
          `Rescaled previous running sum d_sum by exp(m_old - m_new) factor ${rescaleFactor.toFixed(6)} to align with new maximum.`,
          {
            prevMax: Number(prevMax.toFixed(4)),
            x,
            rescaleFactor: Number(rescaleFactor.toFixed(6)),
            dSum: Number(dSum.toFixed(6)),
            phase: "RESCALE_SUM",
          },
          x,
          dSum,
        );
      } else {
        dSum = 0.0;
        addStep(
          7,
          "Initial Logit: Reset d_sum = 0.0",
          "First logit encountered. Setting initial d_sum to 0.0 prior to accumulation.",
          { dSum: 0.0, phase: "INIT_SUM" },
          x,
          0,
        );
      }

      dMax = x;

      addStep(
        8,
        `Update Running Max: d_max = ${x}`,
        `Updated running maximum d_max to ${x}.`,
        { dMax, phase: "UPDATE_MAX" },
        x,
        dSum,
      );
    }

    const expTerm = Math.exp(x - dMax);
    dSum += expTerm;

    addStep(
      9,
      `Accumulate Normalized Exp: d_sum += exp(${x} - ${dMax.toFixed(4)}) = ${expTerm.toFixed(6)} -> d_sum = ${dSum.toFixed(6)}`,
      `Accumulated normalized exponent term ${expTerm.toFixed(6)} into running sum d_sum = ${dSum.toFixed(6)}.`,
      {
        idx,
        x,
        dMax: Number(dMax.toFixed(4)),
        expTerm: Number(expTerm.toFixed(6)),
        dSum: Number(dSum.toFixed(6)),
        phase: "ACCUMULATE_EXP",
      },
      x,
      dSum,
    );
  });

  const probs = logits.map((x) => Number((Math.exp(x - dMax) / dSum).toFixed(6)));

  // Step 10: Compute probs
  addStep(
    10,
    `Compute Normalized Softmax Probabilities: probs = [${probs.join(", ")}]`,
    `Computed final Softmax probabilities p_i = exp(x_i - d_max) / d_sum across all ${logits.length} logits. Sum of probabilities = ${probs.reduce((a, b) => a + b, 0).toFixed(4)}.`,
    { dMax: Number(dMax.toFixed(4)), dSum: Number(dSum.toFixed(6)), probsCount: probs.length },
    logits[logits.length - 1],
    dSum,
  );

  // Step 11: Return result
  addStep(
    11,
    "Return Online Softmax Tuple `(probs, d_max, d_sum)`",
    `FlashAttention online Softmax completed in SRAM. Final d_max = ${dMax.toFixed(4)}, d_sum = ${dSum.toFixed(6)}.`,
    { dMax: Number(dMax.toFixed(4)), dSum: Number(dSum.toFixed(6)) },
    logits[logits.length - 1],
    dSum,
  );

  addStep(
    11,
    "Execution Complete",
    "Successfully processed all streaming logits and computed normalized Softmax probabilities in SRAM.",
    { completed: true, totalSteps: stepIndex },
    logits[logits.length - 1],
    dSum,
  );

  return steps;
};

const ONEPASSONLINESOFTMAXSRAMKERNEL_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "d_sum = sum(logits)",
    "d_sum = d_sum + exp(x + d_max)",
    "probs = [x / d_sum for x in logits]",
    "d_max = max(logits) / len(logits)",
  ],
  hints: [
    { line: 3, hint: "Initialize running row maximum tracker d_max to negative infinity." },
    { line: 6, hint: "Check if streaming logit x exceeds running maximum d_max." },
    {
      line: 7,
      hint: "Rescale running sum d_sum by exp(d_max_old - x) when a new maximum is found.",
    },
    { line: 9, hint: "Accumulate exp(x - d_max) into running sum d_sum." },
    { line: 10, hint: "Compute final normalized probabilities p_i = exp(x_i - d_max) / d_sum." },
  ],
  lineExplanations: {
    1: "Declares function signature one_pass_online_softmax_sram_kernel accepting logits vector.",
    2: "Imports standard Python math library for exp calculations.",
    3: "Initializes running row maximum tracker d_max to float('-inf').",
    4: "Initializes running exponential sum tracker d_sum to 0.0.",
    5: "Iterates through each scalar logit x in streaming input array `logits`.",
    6: "Checks if current logit x strictly exceeds running maximum d_max.",
    7: "Rescales existing running sum d_sum = d_sum * exp(d_max_old - x) to account for new maximum.",
    8: "Updates running row maximum d_max = x.",
    9: "Accumulates exp(x - d_max) into running sum d_sum.",
    10: "Computes final normalized softmax probabilities p_i = exp(x_i - d_max) / d_sum.",
    11: "Returns tuple (probs, d_max, d_sum) containing normalized probabilities and reduction statistics.",
  },
};

export const onePassOnlineSoftmaxSramKernel: AlgorithmDefinition<onePassOnlineSoftmaxSramKernelInput> =
  {
    id: "one-pass-online-softmax-sram-kernel",
    title: "One Pass Online Softmax Sram Kernel",
    topicIds: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Hard",
    description: `### One Pass Online Softmax SRAM Kernel

One-Pass Online Softmax Kernel is the core mathematical innovation behind **FlashAttention** (Dao et al., 2022). It computes row-wise Softmax reductions dynamically inside high-speed GPU SRAM, eliminating $N \\times N$ intermediate attention score writes to HBM DRAM.

#### Why It Exists & What It Solves
Standard Softmax requires 3 sequential passes over HBM DRAM memory:
1. **Pass 1**: Find max $m = \\max_{i} x_i$.
2. **Pass 2**: Compute exponential sum $d = \\sum_{i} e^{x_i - m}$.
3. **Pass 3**: Normalize probabilities $p_i = \\frac{e^{x_i - m}}{d}$.

For sequence length $N = 8192$, standard Softmax creates massive memory bandwidth bottlenecks. Online Softmax (Milakov & Gimelshein) computes $m$ and $d$ in a single streaming pass in GPU SRAM.

#### Step-by-Step Mechanism
When streaming logit $x_i$ arrives:
1. If $x_i > m_{\\text{old}}$:
   $$m_{\\text{new}} = x_i$$
   $$d_{\\text{new}} = d_{\\text{old}} \\cdot e^{m_{\\text{old}} - m_{\\text{new}}} + e^{x_i - m_{\\text{new}}}$$
2. If $x_i \\le m_{\\text{old}}$:
   $$m_{\\text{new}} = m_{\\text{old}}$$
   $$d_{\\text{new}} = d_{\\text{old}} + e^{x_i - m_{\\text{old}}}$$
3. **Final Normalization**: $p_i = \\frac{e^{x_i - m_{\\text{final}}}}{d_{\\text{final}}}$.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ single streaming pass over $N$ logits.
- **Space Complexity**: $\\mathcal{O}(1)$ auxiliary SRAM memory for running max $m$ and sum $d$.
- **Trade-Off**: Eliminates HBM DRAM memory bandwidth bottlenecks by fusing Softmax reduction inside GPU SRAM tiles.`,
    constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
    examples: [
      {
        kind: "basic",
        title: "Online Softmax Pass",
        inputDisplay: "values = [1.2, -3.4, 5.5]",
        outputDisplay: "Probs = [0.01323, 0.00013, 0.98664]",
        input: { values: [1.2, -3.4, 5.5] },
        output: "([0.01323, 0.00013, 0.98664], d_max=5.5, d_sum=247.97)",
        explanation: "Computes streaming online Softmax reduction with final d_max = 5.5.",
      },
      {
        kind: "complex",
        title: "Larger Logit Vector",
        inputDisplay: "values = [0.5, -1.5, 2.5, -3.5, 4.5]",
        outputDisplay: "Probs = [0.0157, 0.0021, 0.1166, 0.0003, 0.8653]",
        input: { values: [0.5, -1.5, 2.5, -3.5, 4.5] },
        output: "([0.0157, 0.0021, 0.1166, 0.0003, 0.8653], d_max=4.5, d_sum=104.03)",
        explanation: "Evaluates single-pass online Softmax reduction across 5 streaming logits.",
      },
      {
        kind: "negative",
        title: "Edge Case Large Positive Logits",
        inputDisplay: "values = [100.0, 105.0, 102.0]",
        outputDisplay: "Probs = [0.0066, 0.9820, 0.0114]",
        input: { values: [100.0, 105.0, 102.0] },
        output: "([0.0066, 0.9820, 0.0114], d_max=105.0, d_sum=1.018)",
        explanation: "Prevents overflow for large logits via online max subtraction.",
      },
    ],
    code: ONEPASSONLINESOFTMAXSRAMKERNEL_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(1)",
    complexityAnalysis: {
      time: "Single-pass streaming scan processes N logits in O(N) linear time.",
      space: "Requires O(1) constant SRAM memory for running max and sum scalars.",
    },
    topicGuide: {
      overview:
        "One-Pass Online Softmax enables FlashAttention by computing Softmax reductions in a single streaming pass in GPU SRAM, bypassing HBM memory traffic.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, $m_{\\text{new}} = \\max(m_{\\text{old}}, x_i)$, $d_{\\text{new}} = d_{\\text{old}} \\cdot e^{m_{\\text{old}} - m_{\\text{new}}} + e^{x_i - m_{\\text{new}}}$. Normalization $p_i = e^{x_i - m} / d$.",
        },
        {
          heading: "Practical Applications in ML Systems",
          body: "FlashAttention 1, 2, and 3 use online Softmax to fuse matrix multiplication and Softmax reduction inside CUDA SRAM shared memory tiles.",
        },
        {
          heading: "Implementation Details & SRAM Tiling",
          body: "Implementation maintains running maximum d_max and rescales running sum d_sum whenever a larger logit x > d_max is observed.",
        },
        {
          heading: "Edge Case Analysis & Numerical Stability",
          body: "Edge cases include initial negative infinity max $m = -\\infty$ and large logit values where max subtraction prevents float overflow.",
        },
      ],
      keyTerms: [
        {
          term: "FlashAttention",
          definition:
            "IO-aware attention algorithm fusing matmul and Softmax inside GPU SRAM memory.",
        },
        {
          term: "Online Softmax",
          definition: "Computing Softmax log-sum-exp reductions in a single streaming pass.",
        },
        {
          term: "SRAM Shared Memory",
          definition: "High-bandwidth GPU on-chip memory operating 10x faster than HBM DRAM.",
        },
      ],
    },
    trivia: ONEPASSONLINESOFTMAXSRAMKERNEL_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_ONEPASSONLINESOFTMAXSRAMKERNEL_INPUT,
    generateSteps: generateOnePassOnlineSoftmaxSramKernelSteps,
  };
