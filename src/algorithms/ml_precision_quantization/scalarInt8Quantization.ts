import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface scalarInt8QuantizationInput {
  values?: number[];
  val?: number;
  scale?: number;
  zeroPoint?: number;
}

export const SCALARINT8QUANTIZATION_CODE = `def scalar_int8_quantization(val, scale=0.1, zero_point=0):
    q_val = int(round(val / scale)) + zero_point
    clamped = max(-128, min(127, q_val))
    return clamped`;

export const DEFAULT_SCALARINT8QUANTIZATION_INPUT: scalarInt8QuantizationInput = {
  values: [1.2, -3.4, 5.5, -15.0, 20.0],
  scale: 0.1,
  zeroPoint: 0,
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

export const generateScalarInt8QuantizationSteps = (
  input: scalarInt8QuantizationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const arrayValues = input?.values || (input?.val !== undefined ? [input.val] : [1.2, -3.4, 5.5, -15.0, 20.0]);
  const scale = input?.scale ?? 0.1;
  const zeroPoint = input?.zeroPoint ?? 0;
  const quantizedResults: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currClamped?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? arrayValues[0],
        quantizedValue: currClamped ?? 0,
        scale,
        zeroPoint,
        bits: toBitItems(currClamped ?? 0),
        title: "Scalar INT8 Quantization",
      },
      auxiliaryState: {
        visited: [...quantizedResults],
        customState: {
          quantized: `[${quantizedResults.join(", ")}]`,
          scale: String(scale),
          zeroPoint: String(zeroPoint),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Scalar INT8 Quantization Engine",
    `Preparing to quantize ${arrayValues.length} FP32 scalar values into signed INT8 range [-128, 127] (scale S = ${scale}, zero_point Z = ${zeroPoint}).`,
    { n: arrayValues.length, scale, zeroPoint },
    arrayValues[0],
    0,
  );

  // Multi-step loop per scalar value
  arrayValues.forEach((val, idx) => {
    addStep(
      1,
      `Inspect FP32 Scalar ${idx}: val = ${val}`,
      `Reading scalar float val = ${val} at index ${idx}.`,
      { idx, val, phase: "INSPECT_VAL" },
      val,
      0,
    );

    const quotient = val / scale;
    addStep(
      2,
      `Scale Division: ${val} / ${scale} = ${quotient.toFixed(4)}`,
      `Divided input scalar float ${val} by scale S = ${scale}. Quotient = ${quotient.toFixed(4)}.`,
      { idx, val, scale, quotient: Number(quotient.toFixed(4)), phase: "SCALE_DIV" },
      val,
      0,
    );

    const rounded = Math.round(quotient);
    addStep(
      2,
      `Round to Nearest Integer: round(${quotient.toFixed(4)}) -> ${rounded}`,
      `Rounded floating quotient ${quotient.toFixed(4)} to nearest whole integer ${rounded}.`,
      { idx, quotient: Number(quotient.toFixed(4)), rounded, phase: "ROUND_INT" },
      val,
      rounded,
    );

    const qVal = rounded + zeroPoint;
    addStep(
      2,
      `Zero-Point Shift: ${rounded} + ${zeroPoint} = ${qVal}`,
      `Added zero-point offset ${zeroPoint} to rounded integer ${rounded}. q_val = ${qVal}.`,
      { idx, rounded, zeroPoint, qVal, phase: "ZERO_POINT_SHIFT" },
      val,
      qVal,
    );

    const minClamped = Math.min(127, qVal);
    addStep(
      3,
      `Upper Bound Check: min(127, ${qVal}) -> ${minClamped}`,
      `Checking upper INT8 bound 127: ${qVal} vs 127 -> ${minClamped}.`,
      { idx, qVal, minClamped, phase: "UPPER_BOUND_CHECK" },
      val,
      minClamped,
    );

    const clamped = Math.max(-128, minClamped);
    const wasClamped = clamped !== qVal;

    addStep(
      3,
      `Lower Bound Check & INT8 Clamp: max(-128, ${minClamped}) -> ${clamped}`,
      wasClamped
        ? `Value ${qVal} exceeded signed 8-bit integer range [-128, 127] and was clamped to ${clamped}.`
        : `Value ${qVal} falls safely within signed 8-bit integer range [-128, 127].`,
      { idx, val, qVal, clamped, wasClamped, phase: "LOWER_BOUND_CHECK" },
      val,
      clamped,
    );

    quantizedResults.push(clamped);

    addStep(
      4,
      `Return Quantized INT8 Scalar: ${clamped}`,
      `Completed scalar INT8 quantization for ${val} -> ${clamped}.`,
      { idx, val, clamped, resultCount: quantizedResults.length },
      val,
      clamped,
    );
  });

  // Step 4: Complete
  addStep(
    4,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    quantizedResults[quantizedResults.length - 1] ?? 0,
  );

  return steps;
};

const SCALARINT8QUANTIZATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "q_val = int(val * scale) - zero_point",
    "clamped = max(0, min(255, q_val))",
    "return val / scale",
    "clamped = val & 0xFF",
  ],
  hints: [
    { line: 1, hint: "Defines scalar INT8 quantization function signature with scale and zero_point parameters." },
    { line: 2, hint: "Divide float by scale, round to nearest integer, and add zero_point offset." },
    { line: 3, hint: "Clamp integer result strictly within 8-bit signed range [-128, 127]." },
  ],
  lineExplanations: {
    1: "Declares function signature scalar_int8_quantization accepting float val, scale = 0.1, and zero_point = 0.",
    2: "Scales input float (val / scale), rounds to nearest integer, and shifts by zero-point offset.",
    3: "Clamps integer value q_val strictly within signed 8-bit integer bounds [-128, 127].",
    4: "Returns final clamped INT8 scalar integer.",
  },
};

export const scalarInt8Quantization: AlgorithmDefinition<scalarInt8QuantizationInput> = {
  id: "scalar-int8-quantization",
  title: "Scalar Int8 Quantization",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Scalar INT8 Quantization

Scalar INT8 Quantization is the fundamental atomic building block of deep learning precision reduction. It converts an individual continuous FP32 scalar value $x \\in \\mathbb{R}$ into a discrete 8-bit signed integer $q \\in [-128, 127]$.

#### Why It Exists & What It Solves
Storing continuous 32-bit floating point numbers requires 4 bytes of memory per weight or activation. INT8 quantization compresses storage to 1 byte ($4\\times$ memory reduction) while enabling hardware SIMD acceleration on GPU Tensor Cores. Scalar quantization defines the element-wise rounding and clamping transformation.

#### Step-by-Step Mechanism
1. **Scale Division**: Divide FP32 scalar $x$ by positive scale factor $S > 0$:
   $$\\text{scaled} = \\frac{x}{S}$$
2. **Nearest Integer Rounding & Zero-Point Shift**: Round scaled quotient to nearest integer and add zero-point offset $Z$:
   $$q_{\\text{raw}} = \\text{round}\\left(\\frac{x}{S}\\right) + Z$$
3. **8-Bit Range Clamping**: Restrict $q_{\\text{raw}}$ strictly to signed INT8 bounds $[-128, 127]$:
   $$q = \\max\\left(-128, \\min\\left(127, q_{\\text{raw}}\\right)\\right)$$
4. **De-quantization Reconstruction**: Reconstruct FP32 scalar approximation $x'$:
   $$x' = (q - Z) \\cdot S$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(1)$ constant time arithmetic operations per scalar.
- **Space Complexity**: $\\mathcal{O}(1)$ auxiliary space.
- **Trade-Off**: Provides fast 1-cycle element-wise quantization with controlled rounding precision loss.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9", "scale > 0"],
  examples: [
    {
      kind: "basic",
      title: "Standard Scalar INT8 Quantization",
      inputDisplay: "values = [1.2, -3.4, 5.5], scale = 0.1, zero_point = 0",
      outputDisplay: "Quantized INT8 = [12, -34, 55]",
      input: { values: [1.2, -3.4, 5.5], scale: 0.1, zeroPoint: 0 },
      output: "[12, -34, 55]",
      explanation: "Divides each float by 0.1, rounds to nearest integer, and clamps within [-128, 127].",
    },
    {
      kind: "complex",
      title: "Zero-Point Shifted Quantization",
      inputDisplay: "values = [0.5, -1.5, 2.5], scale = 0.1, zero_point = 10",
      outputDisplay: "Quantized INT8 = [15, -5, 35]",
      input: { values: [0.5, -1.5, 2.5], scale: 0.1, zeroPoint: 10 },
      output: "[15, -5, 35]",
      explanation: "Adds zero-point offset Z = 10 to scaled integer values.",
    },
    {
      kind: "negative",
      title: "Extreme Overflow Clamping",
      inputDisplay: "values = [1000.0, -1000.0], scale = 0.1, zero_point = 0",
      outputDisplay: "Quantized INT8 = [127, -128]",
      input: { values: [1000.0, -1000.0], scale: 0.1, zeroPoint: 0 },
      output: "[127, -128]",
      explanation: "Clamps values exceeding 8-bit signed range to +127 and -128.",
    },
  ],
  code: SCALARINT8QUANTIZATION_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constant time O(1) arithmetic division, rounding, and clamping operations.",
    space: "Constant space O(1) auxiliary variables.",
  },
  topicGuide: {
    overview:
      "Scalar INT8 quantization is the inner-most kernel atomic step executed billions of times during INT8 tensor quantization. Understanding scalar quantization rounding and clamping rules is fundamental to quantization engineering.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $q = \\max\\left(-128, \\min\\left(127, \\text{round}\\left(\\frac{x}{S}\\right) + Z\\right)\\right)$. De-quantized approximation is $x' = (q - Z) \\cdot S$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Executing scalar INT8 operations on GPU SIMD vector registers enables packed byte operations (4 INT8 values packed into 1 32-bit register).",
      },
      {
        heading: "Implementation Details & Step-by-Step Flow",
        body: "Implementation computes scaled quotient \`val / scale\`, rounds to nearest integer, adds \`zero_point\` offset, and clamps within \`[-128, 127]\`.",
      },
      {
        heading: "Edge Case Analysis & Clamping",
        body: "Edge cases include extreme positive overflow ($q > 127 \\implies 127$) and negative underflow ($q < -128 \\implies -128$).",
      },
    ],
    keyTerms: [
      {
        term: "Scalar Quantization",
        definition:
          "Quantizing an isolated scalar floating point value into an integer representation.",
      },
      {
        term: "Clamping Function",
        definition:
          "Restricting values to lie strictly within lower and upper bounds min(max_val, max(min_val, x)).",
      },
      {
        term: "Rounding-to-Nearest",
        definition: "Rounding fractional float quotients to the closest whole integer value.",
      },
    ],
  },
  trivia: SCALARINT8QUANTIZATION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_SCALARINT8QUANTIZATION_INPUT,
  generateSteps: generateScalarInt8QuantizationSteps,
};
