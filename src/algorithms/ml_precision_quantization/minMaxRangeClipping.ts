import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface minMaxRangeClippingInput {
  values: number[];
  minVal?: number;
  maxVal?: number;
}

export const MINMAXRANGECLIPPING_CODE = `def min_max_range_clipping(values, min_val=-2.0, max_val=2.0):
    clipped = []
    for x in values:
        val = max(min_val, min(max_val, x))
        clipped.append(val)
    return clipped`;

export const DEFAULT_MINMAXRANGECLIPPING_INPUT: minMaxRangeClippingInput = {
  values: [1.2, -3.4, 5.5, -0.8, 2.1],
  minVal: -2.0,
  maxVal: 2.0,
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

export const generateMinMaxRangeClippingSteps = (
  input: minMaxRangeClippingInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5, -0.8, 2.1];
  const minVal = input?.minVal ?? -2.0;
  const maxVal = input?.maxVal ?? 2.0;
  const clippedBuffer: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currClipped?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? arrayValues[0],
        quantizedValue: currClipped ?? 0,
        scale: 1,
        zeroPoint: 0,
        bits: toBitItems(currClipped ?? 0),
        title: "Min-Max Range Clipping",
      },
      auxiliaryState: {
        visited: [...clippedBuffer],
        customState: {
          clipped: `[${clippedBuffer.join(", ")}]`,
          bounds: `[${minVal}, ${maxVal}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Min-Max Range Clipping Engine",
    `Preparing to clip ${arrayValues.length} FP32 activation values into dynamic range bounds [${minVal}, ${maxVal}].`,
    { n: arrayValues.length, minVal, maxVal },
    arrayValues[0],
    arrayValues[0],
  );

  // Step 2: Allocate clipped buffer
  addStep(
    2,
    "Allocate Empty Clipped Output Buffer `clipped = []`",
    "Initializing empty list `clipped = []` to bank range-bounded float outputs.",
    { bufferSize: 0 },
    arrayValues[0],
    arrayValues[0],
  );

  // Multi-step loop per element
  arrayValues.forEach((val, idx) => {
    addStep(
      3,
      `Inspect Element ${idx}: x = ${val}`,
      `Reading scalar activation x = ${val}. Evaluating range clipping limits [${minVal}, ${maxVal}].`,
      { idx, x: val, minVal, maxVal, phase: "INSPECT_VAL" },
      val,
      val,
    );

    const minClamped = Math.min(maxVal, val);
    addStep(
      4,
      `Upper Bound Check: min(${maxVal}, ${val}) -> ${minClamped}`,
      `Evaluating upper limit min(max_val, x): ${val} vs ${maxVal} -> ${minClamped}.`,
      { idx, val, maxVal, minClamped, phase: "MIN_MAX_CHECK" },
      val,
      minClamped,
    );

    const clampedVal = Math.max(minVal, minClamped);
    const wasClipped = clampedVal !== val;

    addStep(
      4,
      `Lower Bound Check: max(${minVal}, ${minClamped}) -> ${clampedVal}`,
      wasClipped
        ? `Value ${val} fell outside range [${minVal}, ${maxVal}] and was clipped to boundary ${clampedVal}.`
        : `Value ${val} falls strictly within bounds [${minVal}, ${maxVal}]. Unchanged.`,
      { idx, x: val, minVal, maxVal, clampedVal, wasClipped, phase: "MAX_MIN_CHECK" },
      val,
      clampedVal,
    );

    clippedBuffer.push(clampedVal);

    addStep(
      5,
      `Append Clipped Value ${clampedVal} to Buffer`,
      `Banked clipped value ${clampedVal} into output array at index ${idx}. Clipped buffer: [${clippedBuffer.join(", ")}].`,
      { idx, clampedVal, bufferLength: clippedBuffer.length },
      val,
      clampedVal,
    );
  });

  // Step 6: Return result
  addStep(
    6,
    "Return Range-Clipped Activation Array `clipped`",
    `Range clipping complete across all ${arrayValues.length} elements. Final output: [${clippedBuffer.join(", ")}].`,
    { resultCount: clippedBuffer.length },
    arrayValues[arrayValues.length - 1],
    clippedBuffer[clippedBuffer.length - 1] ?? 0,
  );

  addStep(
    6,
    "Execution Complete",
    "Successfully completed min-max range clipping for all values in the input tensor.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    clippedBuffer[clippedBuffer.length - 1] ?? 0,
  );

  return steps;
};

const MINMAXRANGECLIPPING_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "val = min(min_val, max(max_val, x))",
    "clipped.append(x * min_val)",
    "val = x if x > 0 else min_val",
    "return [abs(x) for x in values]",
  ],
  hints: [
    {
      line: 1,
      hint: "Defines function accepting values list and optional min_val/max_val parameters.",
    },
    { line: 3, hint: "Iterate through activation values in sequence." },
    {
      line: 4,
      hint: "Apply max(min_val, min(max_val, x)) to clamp scalar value within range bounds.",
    },
    { line: 5, hint: "Append range-clamped scalar value to output list." },
  ],
  lineExplanations: {
    1: "Declares function signature min_max_range_clipping with default min_val = -2.0 and max_val = 2.0.",
    2: "Initializes empty accumulator list `clipped` to store range-bounded float values.",
    3: "Iterates through each scalar value x in input array `values`.",
    4: "Clamps scalar x strictly within range bounds: val = max(min_val, min(max_val, x)).",
    5: "Appends range-clipped float `val` to output array `clipped`.",
    6: "Returns completed list of range-clipped activation values.",
  },
};

export const minMaxRangeClipping: AlgorithmDefinition<minMaxRangeClippingInput> = {
  id: "min-max-range-clipping",
  title: "Min Max Range Clipping",
  topicIds: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  description: `### Min-Max Range Clipping

Min-Max Range Clipping bounds floating-point activation values strictly within a specified percentile range $[x_{\\text{min}}, x_{\\text{max}}]$ prior to quantization.

#### Why It Exists & What It Solves
Outlier activation spikes in deep neural networks (e.g. LLM activation outliers in Transformer layers) degrade quantization precision if scale factors $S$ expand to cover extreme outlier values. Range Clipping truncates extreme outliers, improving quantization resolution for 99.9% of normal activation values.

#### Step-by-Step Mechanism
1. **Boundary Selection**: Select calibration bounds $[x_{\\text{min}}, x_{\\text{max}}]$ (e.g. via KL-divergence calibration or 99.99% percentile analysis).
2. **Element-wise Clamping**: For each float $x$, compute:
   $$\\text{val} = \\max(x_{\\text{min}}, \\min(x_{\\text{max}}, x))$$
3. **Quantization Precision Enhancement**: The scale factor $S = \\frac{x_{\\text{max}} - x_{\\text{min}}}{q_{\\text{max}} - q_{\\text{min}}}$ is significantly smaller, reducing quantization noise across non-outlier data.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time pass across $N$ elements.
- **Space Complexity**: $\\mathcal{O}(N)$ memory for range-clipped output array.
- **Trade-Off**: Eliminates quantization precision degradation caused by extreme activation outliers at the cost of minor clipping noise on extreme tails.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Range Clipping",
      inputDisplay: "values = [1.2, -3.4, 5.5], min_val = -2.0, max_val = 2.0",
      outputDisplay: "Clipped Values = [1.2, -2.0, 2.0]",
      input: { values: [1.2, -3.4, 5.5], minVal: -2.0, maxVal: 2.0 },
      output: "[1.2, -2.0, 2.0]",
      explanation:
        "Clips -3.4 to min_val -2.0 and 5.5 to max_val 2.0, while 1.2 remains unchanged.",
    },
    {
      kind: "complex",
      title: "Wider Bounds Clipping",
      inputDisplay: "values = [0.5, -1.5, 2.5, -3.5, 4.5], min_val = -3.0, max_val = 3.0",
      outputDisplay: "Clipped Values = [0.5, -1.5, 2.5, -3.0, 3.0]",
      input: { values: [0.5, -1.5, 2.5, -3.5, 4.5], minVal: -3.0, maxVal: 3.0 },
      output: "[0.5, -1.5, 2.5, -3.0, 3.0]",
      explanation: "Evaluates range clipping with min_val = -3.0 and max_val = 3.0.",
    },
    {
      kind: "negative",
      title: "Extreme Outliers Truncation",
      inputDisplay: "values = [1000.0, -1000.0], min_val = -10.0, max_val = 10.0",
      outputDisplay: "[10.0, -10.0]",
      input: { values: [1000.0, -1000.0], minVal: -10.0, maxVal: 10.0 },
      output: "[10.0, -10.0]",
      explanation: "Truncates extreme activation outliers down to [-10.0, 10.0] bounds.",
    },
  ],
  code: MINMAXRANGECLIPPING_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across input tensor elements.",
    space: "Linear space O(N) for clipped FP32 output array.",
  },
  topicGuide: {
    overview:
      "Range clipping is a standard pre-quantization calibration step in TensorRT and PyTorch static quantization. By truncating extreme outlier tails (e.g., using 99.99% KL-divergence calibration or min/max percentile bounds), the quantization scale factor S achieves significantly higher precision for non-outlier activations.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $\\text{Clip}(x, [a, b]) = \\max(a, \\min(b, x))$. Time complexity is $\\mathcal{O}(N)$ with $\\mathcal{O}(N)$ space.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Clipping outlier values reduces Mean Squared Error (MSE) in quantized activation tensors, preventing gradient explosion in QAT training.",
      },
      {
        heading: "Implementation Details & Nested Min/Max",
        body: "Implementation iterates over input values, applies nested min/max bounds clamping, and appends clipped values to output array.",
      },
      {
        heading: "Edge Case Analysis & Dynamic Range",
        body: "Edge cases include values within bounds $x_{\\text{min}} \\le x \\le x_{\\text{max}}$ which pass through unmodified.",
      },
    ],
    keyTerms: [
      {
        term: "Outlier Truncation",
        definition:
          "Clipping extreme activation spike values to preserve high quantization resolution for remaining data.",
      },
      {
        term: "KL-Divergence Calibration",
        definition:
          "Finding optimal clipping threshold bounds [min, max] that minimize information loss between float and quantized distributions.",
      },
      {
        term: "Quantization Resolution",
        definition:
          "The spacing S between discrete integer grid steps in quantized tensor representations.",
      },
    ],
  },
  trivia: MINMAXRANGECLIPPING_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_MINMAXRANGECLIPPING_INPUT,
  generateSteps: generateMinMaxRangeClippingSteps,
};
