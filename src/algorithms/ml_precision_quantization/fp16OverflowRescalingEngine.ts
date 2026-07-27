import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp16OverflowRescalingEngineInput {
  values: number[];
  maxFp16?: number;
}

export const FP16OVERFLOWRESCALINGENGINE_CODE = `def fp16_overflow_rescaling_engine(values, max_fp16=65504.0):
    rescaled = []
    max_val = max(abs(x) for x in values) if values else 1.0
    scale_factor = 1.0
    if max_val > max_fp16:
        scale_factor = max_fp16 / max_val
    for x in values:
        rescaled.append(x * scale_factor)
    return rescaled, scale_factor`;

export const DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT: fp16OverflowRescalingEngineInput = {
  values: [70000.0, -85000.0, 30000.0, -12000.0, 50000.0],
  maxFp16: 65504.0,
};

const toBitItems = (val: number): BitItem[] => {
  const clamped = Math.max(-32768, Math.min(32767, Math.round(val)));
  const uval = clamped < 0 ? (clamped + 65536) & 0xffff : clamped & 0xffff;
  const bitStr = uval.toString(2).padStart(16, "0");
  return [
    { index: 15, label: "Sign", value: bitStr[0], state: "sign", bitGroup: "sign" },
    { index: 14, label: "Exp [14:10]", value: bitStr.slice(1, 6), state: "exponent", bitGroup: "exp" },
    { index: 9, label: "Mantissa [9:0]", value: bitStr.slice(6), state: "mantissa", bitGroup: "mant" },
  ];
};

export const generateFp16OverflowRescalingEngineSteps = (
  input: fp16OverflowRescalingEngineInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [70000.0, -85000.0, 30000.0, -12000.0, 50000.0];
  const maxFp16 = input?.maxFp16 ?? 65504.0;
  const rescaledBuffer: number[] = [];

  let maxVal = 0;
  arrayValues.forEach((v) => {
    const absVal = Math.abs(v);
    if (absVal > maxVal) maxVal = absVal;
  });
  if (arrayValues.length === 0) maxVal = 1.0;
  let scaleFactor = 1.0;
  if (maxVal > maxFp16) {
    scaleFactor = maxFp16 / maxVal;
  }

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currRescaled?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? arrayValues[0],
        quantizedValue: currRescaled ?? 0,
        scale: Number(scaleFactor.toFixed(6)),
        zeroPoint: 0,
        bits: toBitItems(currRescaled ?? 0),
        title: "FP16 Overflow Rescaling Engine",
      },
      auxiliaryState: {
        visited: [...rescaledBuffer],
        customState: {
          rescaled: `[${rescaledBuffer.join(", ")}]`,
          maxFp16: String(maxFp16),
          maxVal: String(maxVal),
          scaleFactor: scaleFactor.toFixed(6),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize FP16 Overflow Rescaling Engine",
    `Preparing to evaluate FP16 overflow threshold max_fp16 = ${maxFp16} for ${arrayValues.length} activation values.`,
    { n: arrayValues.length, maxFp16 },
    arrayValues[0],
    0,
  );

  // Step 2: Allocate rescaled buffer
  addStep(
    2,
    "Allocate Empty Rescaled Buffer `rescaled = []`",
    "Initializing empty list `rescaled = []` to bank overflow-protected activation values.",
    { bufferSize: 0 },
    arrayValues[0],
    0,
  );

  // Step 3: Scan peak magnitude
  addStep(
    3,
    `Scan Peak Magnitude: max_val = max(|x|) = ${maxVal}`,
    `Scanned input array to discover peak absolute magnitude max_val = ${maxVal}.`,
    { maxVal, n: arrayValues.length },
    arrayValues[0],
    0,
  );

  // Step 4: Initial scale_factor = 1.0
  addStep(
    4,
    "Set Initial scale_factor = 1.0",
    "Defaulting downscaling scale_factor to 1.0 (no scaling needed unless overflow detected).",
    { scaleFactor: 1.0 },
    arrayValues[0],
    0,
  );

  const isOverflow = maxVal > maxFp16;

  // Step 5: Check overflow condition
  addStep(
    5,
    `Check Overflow Condition: max_val (${maxVal}) > max_fp16 (${maxFp16}) -> ${isOverflow}`,
    isOverflow
      ? `Overflow detected! Peak magnitude ${maxVal} exceeds FP16 max representable bound ${maxFp16}. Downscaling required.`
      : `No overflow. Peak magnitude ${maxVal} fits safely within FP16 max bound ${maxFp16}.`,
    { maxVal, maxFp16, isOverflow },
    arrayValues[0],
    0,
  );

  if (isOverflow) {
    // Step 6: Compute downscaling scale_factor
    addStep(
      6,
      `Calculate scale_factor = ${maxFp16} / ${maxVal} = ${scaleFactor.toFixed(6)}`,
      `Computed safe downscaling factor scale_factor = ${scaleFactor.toFixed(6)} to pull max magnitude ${maxVal} down to exactly ${maxFp16}.`,
      { maxVal, maxFp16, scaleFactor: Number(scaleFactor.toFixed(6)) },
      arrayValues[0],
      0,
    );
  }

  // Multi-step rescaling pass per element
  arrayValues.forEach((val, idx) => {
    addStep(
      7,
      `Inspect Activation ${idx}: x = ${val}`,
      `Reading FP32 scalar activation x = ${val} at index ${idx}.`,
      { idx, x: val, phase: "INSPECT_ACTIVATION" },
      val,
      0,
    );

    const rescaledVal = Number((val * scaleFactor).toFixed(4));

    addStep(
      8,
      `Apply Rescaling Factor: ${val} * ${scaleFactor.toFixed(6)} -> ${rescaledVal}`,
      `Multiplied ${val} by scale_factor ${scaleFactor.toFixed(6)} = ${rescaledVal}. Fits safely within FP16 limit 65504.0.`,
      { idx, x: val, scaleFactor: Number(scaleFactor.toFixed(6)), rescaledVal, phase: "MUL_SCALE" },
      val,
      rescaledVal,
    );

    rescaledBuffer.push(rescaledVal);

    addStep(
      8,
      `Append Rescaled Value ${rescaledVal} to Buffer`,
      `Banked rescaled value ${rescaledVal} into output buffer at index ${idx}. Buffer: [${rescaledBuffer.join(", ")}].`,
      { idx, rescaledVal, bufferLength: rescaledBuffer.length },
      val,
      rescaledVal,
    );
  });

  // Step 9: Return result
  addStep(
    9,
    "Return Rescaled Activation Array & scale_factor `(rescaled, scale_factor)`",
    `Rescaling engine complete. Applied scale_factor = ${scaleFactor.toFixed(6)}, rescaled vector: [${rescaledBuffer.join(", ")}].`,
    { scaleFactor: Number(scaleFactor.toFixed(6)), resultCount: rescaledBuffer.length },
    arrayValues[arrayValues.length - 1],
    rescaledBuffer[rescaledBuffer.length - 1] ?? 0,
  );

  addStep(
    9,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    rescaledBuffer[rescaledBuffer.length - 1] ?? 0,
  );

  return steps;
};

const FP16OVERFLOWRESCALINGENGINE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "scale_factor = max_val / max_fp16",
    "if max_val < max_fp16: scale_factor = 65504.0",
    "rescaled = [x / 65504.0 for x in values]",
    "return rescaled + scale_factor",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting values list and max FP16 threshold 65504.0." },
    { line: 3, hint: "Find peak absolute magnitude max_val across input vector." },
    { line: 5, hint: "Check if peak magnitude max_val exceeds FP16 limit 65504.0." },
    { line: 6, hint: "Compute downscaling ratio scale_factor = max_fp16 / max_val." },
  ],
  lineExplanations: {
    1: "Declares function signature fp16_overflow_rescaling_engine with default max_fp16 = 65504.0.",
    2: "Initializes empty accumulator list `rescaled` to store scaled float values.",
    3: "Finds peak absolute value max_val = max(|x|) in input array.",
    4: "Initializes scale_factor to 1.0 (defaulting to no scaling).",
    5: "Checks if max_val strictly exceeds FP16 finite limit 65504.0.",
    6: "Calculates safe downscaling ratio scale_factor = 65504.0 / max_val.",
    7: "Iterates through each activation scalar x in input array `values`.",
    8: "Multiplies x by scale_factor and appends rescaled float to output list `rescaled`.",
    9: "Returns tuple (rescaled, scale_factor) containing rescaled values and applied scale factor.",
  },
};

export const fp16OverflowRescalingEngine: AlgorithmDefinition<fp16OverflowRescalingEngineInput> = {
  id: "fp16-overflow-rescaling-engine",
  title: "Fp16 Overflow Rescaling Engine",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### FP16 Overflow Rescaling Engine

In the IEEE-754 half-precision floating point standard (FP16), the maximum representable finite positive value is:
$$\\text{MAX}_{\\text{FP16}} = 65504.0 = 2^{15} \\times \\left(1 + \\frac{1023}{1024}\\right)$$
Any intermediate activation or gradient value exceeding $65504.0$ triggers exponent overflow, evaluating to $+\\text{Inf}$ and corrupting downstream neural network loss computations with $\\text{NaN}$ values.

#### Why It Exists & What It Solves
During deep neural network training and LLM inference (e.g. Mixed Precision Training via PyTorch \`torch.cuda.amp.GradScaler\`), layer activations can spike above $65504.0$. FP16 Overflow Rescaling Engine detects peak activation magnitudes $\\alpha = \\max(|x|)$ and dynamically computes a downscaling factor $S_{\\text{factor}} = \\frac{65504.0}{\\alpha}$ to scale activations safely into the finite FP16 range $[ -65504.0, 65504.0 ]$.

#### Step-by-Step Mechanism
1. **Peak Magnitude Discovery**: Scan activation vector $X$ to discover peak magnitude:
   $$\\alpha = \\max_{x \\in X} |x|$$
2. **Overflow Threshold Check**: Evaluate if $\\alpha > 65504.0$.
3. **Rescaling Ratio Derivation**: If overflow occurs, calculate downscaling factor:
   $$S_{\\text{factor}} = \\frac{65504.0}{\\alpha}$$
   If $\\alpha \\le 65504.0$, set $S_{\\text{factor}} = 1.0$.
4. **Linear Tensor Rescaling**: Scale all tensor elements:
   $$x' = x \\cdot S_{\\text{factor}} \\implies |x'| \\le 65504.0$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time pass over $N$ activation elements.
- **Space Complexity**: $\\mathcal{O}(N)$ memory allocation for rescaled output tensor.
- **Trade-Off**: Dynamically prevents $\\text{Inf}/\\text{NaN}$ loss corruption during FP16 mixed-precision training at the cost of two tensor scanning passes.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "FP16 Overflow Rescaling",
      inputDisplay: "values = [70000.0, -85000.0, 30000.0]",
      outputDisplay: "scale_factor = 0.770635, rescaled = [53944.4, -65504.0, 23119.0]",
      input: { values: [70000.0, -85000.0, 30000.0] },
      output: "scale = 0.770635, rescaled = [53944.4, -65504.0, 23119.0]",
      explanation: "Detects max_val 85000 > 65504, applies downscaling scale_factor = 65504/85000 = 0.770635.",
    },
    {
      kind: "complex",
      title: "No Overflow Standard Case",
      inputDisplay: "values = [1.2, -3.4, 5.5]",
      outputDisplay: "scale_factor = 1.0, rescaled = [1.2, -3.4, 5.5]",
      input: { values: [1.2, -3.4, 5.5] },
      output: "scale = 1.0, rescaled = [1.2, -3.4, 5.5]",
      explanation: "All values fit within FP16 limit 65504; scale_factor remains 1.0.",
    },
    {
      kind: "negative",
      title: "Extreme Activation Outliers",
      inputDisplay: "values = [1000000.0, -500000.0]",
      outputDisplay: "scale_factor = 0.065504",
      input: { values: [1000000.0, -500000.0] },
      output: "scale = 0.065504, rescaled = [65504.0, -32752.0]",
      explanation: "Downscales extreme 1,000,000 outlier magnitude safely into FP16 bounds.",
    },
  ],
  code: FP16OVERFLOWRESCALINGENGINE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across input tensor elements.",
    space: "Linear space O(N) for rescaled output buffer.",
  },
  topicGuide: {
    overview:
      "FP16 Overflow Rescaling dynamically scales tensor values to prevent floating point overflow (+Inf/-Inf) during mixed-precision neural network training.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $\\alpha = \\max_{x \\in X} |x|$. If $\\alpha > 65504.0$, $S_{\\text{factor}} = 65504.0 / \\alpha$. Otherwise $S_{\\text{factor}} = 1.0$. Rescaled values $x' = x \\cdot S_{\\text{factor}}$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "PyTorch Automatic Mixed Precision (`torch.cuda.amp.GradScaler`) and NVIDIA Megatron-LM use dynamic loss scaling and activation rescaling to prevent Inf/NaN gradient corruptions in FP16 training.",
      },
      {
        heading: "Implementation Details & Rescaling Ratio",
        body: "Implementation computes peak magnitude, evaluates overflow condition $\\alpha > 65504.0$, computes downscaling ratio, and scales elements linearly.",
      },
      {
        heading: "Edge Case Analysis & Dynamic Range",
        body: "Edge cases include no-op non-overflow cases where scale_factor remains 1.0.",
      },
    ],
    keyTerms: [
      {
        term: "FP16 Maximum Finite Value (65504.0)",
        definition: "The largest finite positive number representable in IEEE-754 half precision.",
      },
      {
        term: "Gradient / Activation Scaling",
        definition: "Multiplying tensors by scale factors to stay within hardware float dynamic ranges.",
      },
      {
        term: "Mixed Precision Training",
        definition: "Executing neural network forward and backward passes in FP16/BF16 while maintaining FP32 master weights.",
      },
    ],
  },
  trivia: FP16OVERFLOWRESCALINGENGINE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_FP16OVERFLOWRESCALINGENGINE_INPUT,
  generateSteps: generateFp16OverflowRescalingEngineSteps,
};
