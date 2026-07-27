import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface basicSymmetricInt8ScaleInput {
  values: number[];
}

export const BASICSYMMETRICINT8SCALE_CODE = `def basic_symmetric_int8_scale(values):
    max_abs = max(abs(x) for x in values) if values else 1.0
    scale = max_abs / 127.0 if max_abs > 0 else 1.0
    quantized = [max(-128, min(127, int(round(x / scale)))) for x in values]
    return scale, quantized`;

export const DEFAULT_BASICSYMMETRICINT8SCALE_INPUT: basicSymmetricInt8ScaleInput = {
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

export const generateBasicSymmetricInt8ScaleSteps = (
  input: basicSymmetricInt8ScaleInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5, -0.8, 2.1];
  const quantizedBuffer: number[] = [];

  let maxAbs = 0;
  arrayValues.forEach((v) => {
    const absVal = Math.abs(v);
    if (absVal > maxAbs) maxAbs = absVal;
  });
  if (arrayValues.length === 0) maxAbs = 1.0;
  const scale = maxAbs > 0 ? maxAbs / 127.0 : 1.0;

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
        scale: Number(scale.toFixed(6)),
        zeroPoint: 0,
        bits: toBitItems(currQuantized ?? 0),
        title: "Basic Symmetric INT8 Quantization",
      },
      auxiliaryState: {
        visited: [...quantizedBuffer],
        customState: {
          quantized: `[${quantizedBuffer.join(", ")}]`,
          values: `[${arrayValues.join(", ")}]`,
          maxAbs: String(maxAbs),
          scale: scale.toFixed(6),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Basic Symmetric Int8 Quantization Engine",
    `Preparing to calculate symmetric scale and INT8 quantized vector for ${arrayValues.length} FP32 elements.`,
    { n: arrayValues.length },
    arrayValues[0],
    0,
  );

  // Step 2: Peak magnitude scanning pass
  addStep(
    2,
    `Scan Input Tensor Peak Magnitude: max_abs = max(|x|) = ${maxAbs}`,
    `Scanned input vector to determine dynamic magnitude peak max_abs = ${maxAbs}.`,
    { maxAbs, n: arrayValues.length },
    arrayValues[0],
    0,
  );

  // Step 3: Compute scale factor
  addStep(
    3,
    `Compute Symmetric Scale: S = max_abs / 127.0 = ${scale.toFixed(6)}`,
    `Calculated quantization scale S = ${scale.toFixed(6)}, mapping max_abs ${maxAbs} to INT8 maximum +127.`,
    { maxAbs, scale: Number(scale.toFixed(6)) },
    arrayValues[0],
    0,
  );

  // Multi-step quantization pass per element
  arrayValues.forEach((val, idx) => {
    const scaledUnrounded = val / scale;
    const rounded = Math.round(scaledUnrounded);
    const clamped = Math.max(-128, Math.min(127, rounded));

    addStep(
      4,
      `Inspect Element ${idx}: x = ${val}`,
      `Reading FP32 scalar input x = ${val} at index ${idx}.`,
      { idx, x: val, phase: "INSPECT_ELEMENT" },
      val,
      0,
    );

    addStep(
      4,
      `Scale Transformation: x / S = ${val} / ${scale.toFixed(4)} -> ${scaledUnrounded.toFixed(4)}`,
      `Divided real value ${val} by scale factor S = ${scale.toFixed(4)}.`,
      { idx, x: val, scaledUnrounded: Number(scaledUnrounded.toFixed(4)), phase: "SCALE_DIV" },
      val,
      0,
    );

    addStep(
      4,
      `Round to Nearest Integer: round(${scaledUnrounded.toFixed(4)}) -> ${rounded}`,
      `Rounding unrounded floating scalar ${scaledUnrounded.toFixed(4)} to integer ${rounded}.`,
      { idx, rounded, phase: "ROUND_INT" },
      val,
      rounded,
    );

    addStep(
      4,
      `Clamp to INT8 Bound [-128, 127]: q = ${clamped}`,
      `Restricting candidate integer strictly within 8-bit signed range [-128, 127].`,
      { idx, clamped, phase: "CLAMP_INT8" },
      val,
      clamped,
    );

    quantizedBuffer.push(clamped);

    addStep(
      4,
      `Append Quantized INT8 Value ${clamped} to Buffer`,
      `Banked INT8 value ${clamped} into output array at index ${idx}. Buffer: [${quantizedBuffer.join(", ")}].`,
      { idx, clamped, bufferLength: quantizedBuffer.length },
      val,
      clamped,
    );
  });

  addStep(
    5,
    "Return Scale Factor and Quantized INT8 Array `(scale, quantized)`",
    `Symmetric quantization complete. Output scale S = ${scale.toFixed(6)}, quantized vector: [${quantizedBuffer.join(", ")}].`,
    { scale: Number(scale.toFixed(6)), resultCount: quantizedBuffer.length },
    arrayValues[arrayValues.length - 1],
    quantizedBuffer[quantizedBuffer.length - 1] ?? 0,
  );

  addStep(
    5,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    quantizedBuffer[quantizedBuffer.length - 1] ?? 0,
  );

  return steps;
};

const BASICSYMMETRICINT8SCALE_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "scale = max_abs / 255.0",
    "quantized = [int(x * scale) for x in values]",
    "max_abs = min(abs(x) for x in values)",
    "return scale + quantized",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting list of floating-point values." },
    { line: 2, hint: "Scan values to compute peak absolute magnitude max_abs." },
    { line: 3, hint: "Divide peak magnitude by 127.0 to calculate symmetric scale factor S." },
    { line: 4, hint: "Divide each element by scale S, round to nearest integer, and clamp to [-128, 127]." },
  ],
  lineExplanations: {
    1: "Declares function signature basic_symmetric_int8_scale accepting input array `values`.",
    2: "Finds maximum absolute value max_abs = max(|x|) across all tensor elements.",
    3: "Calculates symmetric quantization scale factor S = max_abs / 127.0 (or 1.0 if max_abs is 0).",
    4: "Quantizes each FP32 scalar x via q = clamp(round(x / S), -128, 127).",
    5: "Returns tuple (scale, quantized) containing scale factor S and quantized INT8 array.",
  },
};

export const basicSymmetricInt8Scale: AlgorithmDefinition<basicSymmetricInt8ScaleInput> = {
  id: "basic-symmetric-int8-scale",
  title: "Basic Symmetric Int8 Scale",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Basic Symmetric INT8 Scale Quantization

Symmetric INT8 Quantization maps 32-bit floating point values (FP32) into signed 8-bit integer range $[-127, 127]$ symmetrically around zero without using a zero-point offset ($Z = 0$).

#### Why It Exists & What It Solves
Neural network weight matrices (W8) exhibit symmetric zero-centered distributions. Using asymmetric quantization requires keeping track of an extra integer zero-point $Z$, adding zero-point cross-term additions during matrix multiplication GEMM kernels. Symmetric quantization sets $Z = 0$, eliminating zero-point arithmetic overhead and simplifying GEMM execution to:
$$\\mathbf{C}_{\\text{FP32}} = (\\mathbf{A}_{\\text{INT8}} \\cdot \\mathbf{B}_{\\text{INT8}}) \\cdot (S_A \\cdot S_B)$$

#### Step-by-Step Mechanism
1. **Dynamic Peak Finding**: Find maximum absolute magnitude across all input values:
   $$\\alpha = \\max_{x \\in X} |x|$$
2. **Scale Factor Calculation**: Map peak magnitude $\\alpha$ to 8-bit signed maximum $+127$:
   $$S = \\frac{\\alpha}{127.0}$$
3. **Integer Projection**: Scale each float $x$ and round to nearest integer:
   $$q_{\\text{raw}} = \\text{round}\\left(\\frac{x}{S}\\right)$$
4. **INT8 Saturation Clamping**: Clamp $q_{\\text{raw}}$ strictly within $[-128, 127]$ bounds:
   $$q = \\max(-128, \\min(127, q_{\\text{raw}}))$$
5. **De-quantization**: Reconstruct float approximation $\\hat{x} = q \\cdot S$.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time across $N$ elements.
- **Space Complexity**: $\\mathcal{O}(N)$ memory for storing quantized INT8 output array.
- **Trade-Off**: Eliminates zero-point arithmetic overhead in matrix multiplication at the cost of potential precision loss on non-symmetric activation distributions.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Quantization Case",
      inputDisplay: "values = [1.2, -3.4, 5.5]",
      outputDisplay: "Scale S = 0.043307, Quantized = [28, -79, 127]",
      input: { values: [1.2, -3.4, 5.5] },
      output: "S = 0.043307, q = [28, -79, 127]",
      explanation: "Calculates max_abs = 5.5, scale S = 5.5/127 = 0.043307, and quantizes values.",
    },
    {
      kind: "complex",
      title: "Larger Values Array",
      inputDisplay: "values = [0.5, -1.5, 2.5, -3.5, 4.5]",
      outputDisplay: "Scale S = 0.035433",
      input: { values: [0.5, -1.5, 2.5, -3.5, 4.5] },
      output: "S = 0.035433, q = [14, -42, 71, -99, 127]",
      explanation: "Evaluates symmetric quantization pass with max_abs = 4.5.",
    },
    {
      kind: "negative",
      title: "Edge Case Overflow",
      inputDisplay: "values = [1000.0, -1000.0]",
      outputDisplay: "Scale S = 7.874016",
      input: { values: [1000.0, -1000.0] },
      output: "S = 7.874016, q = [127, -127]",
      explanation: "Clamps extreme values cleanly to INT8 symmetric limits [-127, 127].",
    },
  ],
  code: BASICSYMMETRICINT8SCALE_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across input tensor elements.",
    space: "Linear space O(N) for quantized INT8 output array.",
  },
  topicGuide: {
    overview:
      "Symmetric INT8 quantization sets zero-point $Z = 0$. De-quantization simplifies to $\\hat{x} = q \\cdot S$. In INT8 matrix multiplication ($\\mathbf{C} = \\mathbf{A}_{\\text{INT8}} \\mathbf{B}_{\\text{INT8}} \\cdot (S_A S_B)$), zero-point-free matrix multiplication executes directly on hardware Tensor Cores without cross-term additions.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, $\\alpha = \\max_{x \\in X} |x|$. Scale $S = \\alpha / 127.0$. Quantized values $q = \\text{clamp}(\\text{round}(x / S), -128, 127)$. Time complexity is $\\mathcal{O}(N)$ with $\\mathcal{O}(N)$ space.",
      },
      {
        heading: "Systems & Memory Hierarchy Performance",
        body: "Symmetric quantization reduces memory bandwidth requirements by 4x (1 byte per weight instead of 4 bytes FP32), doubling L2 cache effective capacity on GPUs.",
      },
      {
        heading: "Implementation Details & Zero-Point Elimination",
        body: "Implementation finds absolute maximum value in input array, calculates scale factor $S$, and divides each input element by $S$.",
      },
      {
        heading: "Edge Case Analysis & Dynamic Range",
        body: "Edge case analysis includes handling zero vectors where $\\alpha = 0$, enforcing scale fallback $S = 1.0$.",
      },
    ],
    keyTerms: [
      {
        term: "Symmetric Quantization",
        definition:
          "Quantization scheme where FP32 zero maps directly to integer zero without offset ($Z = 0$).",
      },
      {
        term: "Maximum Absolute Value (max_abs)",
        definition:
          "The peak magnitude $\\max(|x|)$ used to define the symmetric quantization dynamic range.",
      },
      {
        term: "Zero-Point Elimination",
        definition:
          "Omitting zero-point shifts to accelerate INT8 GEMM tensor core matrix multiplication.",
      },
    ],
  },
  trivia: BASICSYMMETRICINT8SCALE_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_BASICSYMMETRICINT8SCALE_INPUT,
  generateSteps: generateBasicSymmetricInt8ScaleSteps,
};
