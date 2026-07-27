import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface asymmetricAffineQuantizationInput {
  values: number[];
  scale: number;
  zeroPoint?: number;
}

export const ASYMMETRICAFFINEQUANTIZATION_CODE = `def asymmetric_affine_quantization(values, scale=0.1, zero_point=5):
    quantized = []
    for x in values:
        q_val = int(round(x / scale)) + zero_point
        clamped = max(-128, min(127, q_val))
        quantized.append(clamped)
    return quantized`;

export const DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT: asymmetricAffineQuantizationInput = {
  values: [1.2, -3.4, 5.5, -0.8, 2.1],
  scale: 0.1,
  zeroPoint: 5,
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

export const generateAsymmetricAffineQuantizationSteps = (
  input: asymmetricAffineQuantizationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5, -0.8, 2.1];
  const scale = input?.scale ?? 0.1;
  const zeroPoint = input?.zeroPoint ?? 5;

  const quantizedBuffer: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currQuantized?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? arrayValues[0],
        quantizedValue: currQuantized ?? 0,
        scale,
        zeroPoint,
        bits: toBitItems(currQuantized ?? 0),
        title: "Asymmetric Affine Quantization (FP32 -> INT8)",
      },
      auxiliaryState: {
        visited: [...quantizedBuffer],
        customState: {
          quantized: `[${quantizedBuffer.join(", ")}]`,
          scale: String(scale),
          zeroPoint: String(zeroPoint),
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Asymmetric Affine Quantization Engine",
    `Preparing to quantize ${arrayValues.length} FP32 values into signed INT8 range [-128, 127] using scale S = ${scale} and zero-point Z = ${zeroPoint}.`,
    { n: arrayValues.length, scale, zeroPoint },
    arrayValues[0],
    0,
  );

  addStep(
    2,
    "Allocate Output Quantized Buffer `quantized = []`",
    "Initializing empty list `quantized = []` to bank packed 8-bit integer outputs.",
    { bufferLength: 0 },
    arrayValues[0],
    0,
  );

  arrayValues.forEach((val, idx) => {
    addStep(
      3,
      `Loop Header: Process Element x = ${val} at Index ${idx}`,
      `Inspecting input scalar x = ${val}. Scale transformation will convert this real float into integer space.`,
      { idx, x: val, scale, zeroPoint },
      val,
      0,
    );

    const scaledUnrounded = val / scale;
    const rounded = Math.round(scaledUnrounded);
    const qVal = rounded + zeroPoint;

    addStep(
      4,
      `Compute Un-clamped q_val = round(${val} / ${scale}) + ${zeroPoint} = ${qVal}`,
      `Divided ${val} by scale ${scale} (${scaledUnrounded.toFixed(4)}), rounded to ${rounded}, and added zero-point offset ${zeroPoint} to align FP32 zero to integer ${zeroPoint}.`,
      { idx, x: val, scaledUnrounded: Number(scaledUnrounded.toFixed(4)), rounded, qVal },
      val,
      qVal,
    );

    const clamped = Math.max(-128, Math.min(127, qVal));

    addStep(
      5,
      `Clamp q_val = ${qVal} to INT8 Bounds [-128, 127] -> ${clamped}`,
      clamped !== qVal
        ? `Value ${qVal} exceeded 8-bit signed range [-128, 127] and was clamped to ${clamped}.`
        : `Value ${qVal} falls strictly within 8-bit signed range [-128, 127]. No saturation occurred.`,
      { qVal, clamped, overflow: clamped !== qVal },
      val,
      clamped,
    );

    quantizedBuffer.push(clamped);

    addStep(
      6,
      `Append Quantized Value ${clamped} to Buffer`,
      `Banked INT8 value ${clamped} into output list at index ${idx}. Quantized buffer: [${quantizedBuffer.join(", ")}].`,
      { idx, clamped, bufferSize: quantizedBuffer.length },
      val,
      clamped,
    );
  });

  addStep(
    7,
    "Return Quantized INT8 Result",
    `Completed asymmetric affine quantization across all ${arrayValues.length} values. Final output: [${quantizedBuffer.join(", ")}].`,
    { resultCount: quantizedBuffer.length },
    arrayValues[arrayValues.length - 1],
    quantizedBuffer[quantizedBuffer.length - 1] ?? 0,
  );

  addStep(
    7,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    quantizedBuffer[quantizedBuffer.length - 1] ?? 0,
  );

  return steps;
};

const ASYMMETRICAFFINEQUANTIZATION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "q_val = int(x * scale) - zero_point",
    "clamped = max(0, min(255, q_val))",
    "quantized.append(x / scale)",
    "return [round(v) for v in values]",
  ],
  hints: [
    { line: 1, hint: "Defines function signature with default scale and zero-point parameters." },
    { line: 3, hint: "Iterate through floating-point values in sequence." },
    { line: 4, hint: "Divide FP32 value by scale, round to integer, and add zero-point offset." },
    { line: 5, hint: "Restrict candidate integer strictly within signed INT8 limits [-128, 127]." },
  ],
  lineExplanations: {
    1: "Declares function signature accepting input FP32 values, scale S, and zero-point offset Z.",
    2: "Initializes an empty list `quantized` to store output 8-bit integer values.",
    3: "Iterates through each scalar value x in the input floating-point array `values`.",
    4: "Computes q_val = int(round(x / scale)) + zero_point, mapping real FP32 value into affine integer space.",
    5: "Clamps q_val strictly within signed 8-bit integer range [-128, 127] to prevent register overflow.",
    6: "Appends the clamped INT8 integer to the output accumulator array `quantized`.",
    7: "Returns the completed list of quantized INT8 integer values.",
  },
};

export const asymmetricAffineQuantization: AlgorithmDefinition<asymmetricAffineQuantizationInput> =
  {
    id: "asymmetric-affine-quantization",
    title: "Asymmetric Affine Quantization",
    category: "ml_precision_quantization",
    categories: ["ml_precision_quantization", "bit_manipulation"],
    difficulty: "Medium",
    isMlInfra: true,
    mlInfraLevel: 4,
    mlInfraCategory: "ml_precision_quantization",
    description: `### Asymmetric Affine Quantization

Asymmetric Affine Quantization maps 32-bit floating point numbers (FP32) into 8-bit integer range (INT8 $[-128, 127]$ or UINT8 $[0, 255]$) using a floating point scale factor $S$ and integer zero-point offset $Z$.

#### Why It Exists & What It Solves
Floating-point neural network activations (e.g. ReLU, GELU) often exhibit asymmetric distributions where values are strictly non-negative or skewed away from zero. Symmetric quantization forces real zero $0.0$ to map to integer $0$, wasting precision grid slots. Asymmetric quantization solves this by introducing an explicit integer zero-point shift $Z$, mapping FP32 $0.0$ to integer $Z$.

#### Step-by-Step Mechanism
1. **Scale & Zero-Point Derivation**: Given real range $[x_{\\text{min}}, x_{\\text{max}}]$ and integer range $[q_{\\text{min}}, q_{\\text{max}}]$:
   $$S = \\frac{x_{\\text{max}} - x_{\\text{min}}}{q_{\\text{max}} - q_{\\text{min}}}, \\quad Z = \\text{round}\\left(\\frac{-x_{\\text{min}}}{S}\\right) + q_{\\text{min}}$$
2. **Affine Quantization**: For each real value $x$, compute candidate integer:
   $$q_{\\text{raw}} = \\text{round}\\left(\\frac{x}{S}\\right) + Z$$
3. **INT8 Saturation Clamping**: Restrict $q_{\\text{raw}}$ within valid integer bounds:
   $$q = \\max(q_{\\text{min}}, \\min(q_{\\text{max}}, q_{\\text{raw}}))$$
4. **De-quantization Formula**: Reconstruct floating-point approximation $\\hat{x}$ during inference:
   $$\\hat{x} = (q - Z) \\cdot S$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear pass over $N$ input tensor elements.
- **Space Complexity**: $\\mathcal{O}(N)$ memory allocation for output quantized INT8 tensor.
- **Trade-Off**: Maximizes grid resolution for skewed activation distributions at the cost of requiring zero-point arithmetic overhead in matrix multiplication kernels.`,
    constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9", "scale > 0"],
    examples: [
      {
        kind: "basic",
        title: "Standard Quantization Case",
        inputDisplay: "values = [1.2, -3.4, 5.5], scale = 0.1",
        outputDisplay: "Quantized INT8 Values",
        input: { values: [1.2, -3.4, 5.5], scale: 0.1, zeroPoint: 5 },
        output: "[17, -29, 60]",
        explanation: "Quantizes FP32 values with scale S = 0.1 and zero-point Z = 5.",
      },
      {
        kind: "complex",
        title: "Larger Values Array",
        inputDisplay: "values = [0.5, -1.5, 2.5, -3.5, 4.5], scale = 0.1",
        outputDisplay: "Quantized INT8 Values",
        input: { values: [0.5, -1.5, 2.5, -3.5, 4.5], scale: 0.1, zeroPoint: 0 },
        output: "[5, -15, 25, -35, 45]",
        explanation: "Evaluates quantization pass across 5 scalar values with Z = 0.",
      },
      {
        kind: "negative",
        title: "Edge Case Overflow",
        inputDisplay: "values = [1000.0, -1000.0], scale = 0.1",
        outputDisplay: "[127, -128]",
        input: { values: [1000.0, -1000.0], scale: 0.1, zeroPoint: 0 },
        output: "[127, -128]",
        explanation: "Clamps extreme values to INT8 integer bounds [-128, 127].",
      },
    ],
    code: ASYMMETRICAFFINEQUANTIZATION_CODE,
    timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
    spaceComplexity: "O(N)",
    complexityAnalysis: {
      time: "Linear time O(N) pass across input tensor elements.",
      space: "Linear space O(N) for quantized INT8 output buffer.",
    },
    topicGuide: {
      overview:
        "Asymmetric quantization is the standard quantization method for neural network activations in PyTorch (`torch.ao.quantization`) and ONNX Runtime. Because activation functions like ReLU and GELU produce non-symmetric non-negative distributions, asymmetric zero-point offsets eliminate quantization precision loss around zero.",
      sections: [
        {
          heading: "Core Concept & Mathematical Formulation",
          body: "Mathematically, quantization is $q = \\text{clamp}(\\text{round}(x / S) + Z, q_{\\text{min}}, q_{\\text{max}})$, and de-quantization is $\\hat{x} = (q - Z) \\cdot S$. Scale $S = \\frac{x_{\\text{max}} - x_{\\text{min}}}{q_{\\text{max}} - q_{\\text{min}}}$ and zero-point $Z = \\text{round}(q_{\\text{min}} - x_{\\text{min}} / S)$.",
        },
        {
          heading: "Systems & Memory Hierarchy Performance",
          body: "On INT8 hardware accelerators (NVIDIA Tensor Cores, ARM NEON, TPU MXU), integer vector operations run at 2x-4x higher throughput and 4x lower DRAM memory bandwidth compared to FP32 floating point operations.",
        },
        {
          heading: "Implementation Details & Zero-Point Shift",
          body: "Implementation computes candidate integer $q_{\\text{raw}} = \\text{round}(x / S) + Z$, clamps to signed INT8 $[-128, 127]$, and appends to output buffer.",
        },
        {
          heading: "Edge Case Analysis & Saturation",
          body: "Edge cases include extreme values exceeding real bounds $[x_{\\text{min}}, x_{\\text{max}}]$, which saturate cleanly at $-128$ or $127$.",
        },
      ],
      keyTerms: [
        {
          term: "Asymmetric Quantization",
          definition: "Quantization scheme introducing non-zero integer zero-point Z.",
        },
        {
          term: "Zero-Point (Z)",
          definition: "Integer value corresponding to floating point 0.0.",
        },
        {
          term: "Scale Factor (S)",
          definition: "Floating-point multiplier mapping integer steps to real FP32 values.",
        },
      ],
    },
    trivia: ASYMMETRICAFFINEQUANTIZATION_TRIVIA,
    sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
    defaultInput: DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
    generateSteps: generateAsymmetricAffineQuantizationSteps,
  };
