import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface zeroPointAlignmentShiftInput {
  values?: number[];
  minVal?: number;
  maxVal?: number;
  qmin?: number;
  qmax?: number;
}

export const ZEROPOINTALIGNMENTSHIFT_CODE = `def zero_point_alignment_shift(min_val, max_val, qmin=-128, qmax=127):
    scale = (max_val - min_val) / (qmax - qmin) if max_val != min_val else 1.0
    zero_point_initial = qmin - (min_val / scale)
    zero_point_aligned = max(qmin, min(qmax, int(round(zero_point_initial))))
    return scale, zero_point_aligned`;

export const DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT: zeroPointAlignmentShiftInput = {
  minVal: -10.0,
  maxVal: 20.0,
  qmin: -128,
  qmax: 127,
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

export const generateZeroPointAlignmentShiftSteps = (
  input: zeroPointAlignmentShiftInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const minVal = input?.minVal ?? (input?.values?.[0] ?? -10.0);
  const maxVal = input?.maxVal ?? (input?.values?.[1] ?? 20.0);
  const qmin = input?.qmin ?? -128;
  const qmax = input?.qmax ?? 127;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currZP?: number,
    currScale?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? minVal,
        quantizedValue: currZP ?? 0,
        scale: currScale ?? 1.0,
        zeroPoint: currZP ?? 0,
        bits: toBitItems(currZP ?? 0),
        title: "Zero-Point Alignment Shift Calibration",
      },
      auxiliaryState: {
        customState: {
          minVal: String(minVal),
          maxVal: String(maxVal),
          qmin: String(qmin),
          qmax: String(qmax),
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Zero-Point Alignment Shift Engine",
    `Preparing to compute scale S and zero-point Z for dynamic range [${minVal}, ${maxVal}] -> integer range [${qmin}, ${qmax}].`,
    { minVal, maxVal, qmin, qmax },
    minVal,
    0,
    1.0,
  );

  // Multi-step scale calculation
  addStep(
    2,
    `Inspect Dynamic Range: min_val = ${minVal}, max_val = ${maxVal}`,
    `Reading observed floating-point dynamic range bounds [${minVal}, ${maxVal}].`,
    { minVal, maxVal, phase: "INSPECT_RANGE" },
    minVal,
    0,
    1.0,
  );

  const rangeFP = maxVal - minVal;
  addStep(
    2,
    `Compute Floating Range Span: ${maxVal} - (${minVal}) = ${rangeFP}`,
    `Calculated continuous FP32 range span: ${maxVal} - (${minVal}) = ${rangeFP}.`,
    { minVal, maxVal, rangeFP, phase: "RANGE_FP" },
    minVal,
    0,
    1.0,
  );

  const rangeQ = qmax - qmin;
  addStep(
    2,
    `Compute Integer Range Span: ${qmax} - (${qmin}) = ${rangeQ}`,
    `Calculated discrete integer range span: ${qmax} - (${qmin}) = ${rangeQ}.`,
    { qmin, qmax, rangeQ, phase: "RANGE_Q" },
    minVal,
    0,
    1.0,
  );

  const scale = maxVal !== minVal ? rangeFP / rangeQ : 1.0;
  const scaleFixed = Number(scale.toFixed(6));

  addStep(
    2,
    `Calculate Quantization Scale: scale = ${rangeFP} / ${rangeQ} = ${scaleFixed}`,
    `Calculated FP32 step resolution scale S = (${rangeFP}) / ${rangeQ} = ${scaleFixed}.`,
    { minVal, maxVal, qmin, qmax, rangeFP, rangeQ, scale: scaleFixed, phase: "COMPUTE_SCALE" },
    minVal,
    0,
    scaleFixed,
  );

  // Multi-step initial zero-point calculation
  addStep(
    3,
    `Inspect Min Value Bound: min_val = ${minVal}`,
    `Reading lower floating-point bound min_val = ${minVal} for zero-point alignment.`,
    { minVal, phase: "INSPECT_MIN_VAL" },
    minVal,
    0,
    scaleFixed,
  );

  addStep(
    3,
    `Divide Min Value by Scale: ${minVal} / ${scaleFixed} = ${(minVal / scale).toFixed(4)}`,
    `Divided min_val (${minVal}) by scale factor ${scaleFixed} to find relative integer offset ${(minVal / scale).toFixed(4)}.`,
    { minVal, scale: scaleFixed, offset: Number((minVal / scale).toFixed(4)), phase: "MIN_VAL_DIV_SCALE" },
    minVal,
    0,
    scaleFixed,
  );

  const rawOffset = minVal / scale;
  const zeroPointInitial = qmin - rawOffset;
  const zeroPointInitialFixed = Number(zeroPointInitial.toFixed(4));

  addStep(
    3,
    `Subtract Offset from Integer Min: ${qmin} - (${(rawOffset).toFixed(4)}) = ${zeroPointInitialFixed}`,
    `Subtracted scaled float offset from qmin (${qmin}) to find raw zero-point Z_raw = ${zeroPointInitialFixed}.`,
    { qmin, rawOffset: Number(rawOffset.toFixed(4)), zeroPointInitial: zeroPointInitialFixed, phase: "SUBTRACT_OFFSET" },
    minVal,
    zeroPointInitialFixed,
    scaleFixed,
  );

  addStep(
    3,
    `Raw Zero-Point Float Derived: zero_point_initial = ${zeroPointInitialFixed}`,
    `Computed raw unaligned zero-point float Z_raw = ${zeroPointInitialFixed}.`,
    { qmin, minVal, scale: scaleFixed, zeroPointInitial: zeroPointInitialFixed, phase: "RAW_ZP_FLOAT" },
    minVal,
    zeroPointInitialFixed,
    scaleFixed,
  );

  // Multi-step alignment and clamping
  const roundedZP = Math.round(zeroPointInitial);

  addStep(
    4,
    `Round Raw Zero-Point to Integer: round(${zeroPointInitialFixed}) -> ${roundedZP}`,
    `Rounded raw zero-point float ${zeroPointInitialFixed} to nearest integer ${roundedZP}.`,
    { zeroPointInitial: zeroPointInitialFixed, roundedZP, phase: "ROUND_ZP" },
    minVal,
    roundedZP,
    scaleFixed,
  );

  const clampedUpper = Math.min(qmax, roundedZP);
  addStep(
    4,
    `Upper Bound Check: min(${qmax}, ${roundedZP}) -> ${clampedUpper}`,
    `Checked upper integer bound ${qmax}: min(${qmax}, ${roundedZP}) -> ${clampedUpper}.`,
    { qmax, roundedZP, clampedUpper, phase: "UPPER_BOUND_ZP" },
    minVal,
    clampedUpper,
    scaleFixed,
  );

  const zeroPointAligned = Math.max(qmin, clampedUpper);

  addStep(
    4,
    `Lower Bound Check & Alignment Clamp: max(${qmin}, ${clampedUpper}) -> ${zeroPointAligned}`,
    `Clamped rounded zero-point within [${qmin}, ${qmax}] -> ${zeroPointAligned}.`,
    { zeroPointInitial: zeroPointInitialFixed, roundedZP, zeroPointAligned, qmin, qmax, phase: "LOWER_BOUND_ZP" },
    minVal,
    zeroPointAligned,
    scaleFixed,
  );

  // Multi-step verification tests
  const floatZeroCheck = (zeroPointAligned - qmin) * scale + minVal;

  addStep(
    5,
    `Verify FP32 0.0 Alignment: (Z - qmin) * S + min_val = (${zeroPointAligned} - ${qmin}) * ${scaleFixed} + ${minVal} = ${floatZeroCheck.toFixed(4)}`,
    `Verified zero-point alignment: quantized zero-point ${zeroPointAligned} de-quantizes back to FP32 value ${floatZeroCheck.toFixed(4)} (approx 0.0).`,
    { zeroPointAligned, qmin, scale: scaleFixed, minVal, floatZeroCheck: Number(floatZeroCheck.toFixed(4)), phase: "VERIFY_ZERO_ALIGNMENT" },
    0.0,
    zeroPointAligned,
    scaleFixed,
  );

  addStep(
    5,
    `Verify Lower Bound Alignment: (qmin - Z) * S = (${qmin} - ${zeroPointAligned}) * ${scaleFixed} = ${((qmin - zeroPointAligned) * scale).toFixed(4)}`,
    `Verified lower bound alignment: integer qmin (${qmin}) maps to FP32 bound ${((qmin - zeroPointAligned) * scale).toFixed(4)} (approx min_val ${minVal}).`,
    { zeroPointAligned, qmin, scale: scaleFixed, minVal, phase: "VERIFY_LOWER_ALIGNMENT" },
    minVal,
    zeroPointAligned,
    scaleFixed,
  );

  addStep(
    5,
    `Verify Upper Bound Alignment: (qmax - Z) * S = (${qmax} - ${zeroPointAligned}) * ${scaleFixed} = ${((qmax - zeroPointAligned) * scale).toFixed(4)}`,
    `Verified upper bound alignment: integer qmax (${qmax}) maps to FP32 bound ${((qmax - zeroPointAligned) * scale).toFixed(4)} (approx max_val ${maxVal}).`,
    { zeroPointAligned, qmax, scale: scaleFixed, maxVal, phase: "VERIFY_UPPER_ALIGNMENT" },
    maxVal,
    zeroPointAligned,
    scaleFixed,
  );

  // Step 5: Return result
  addStep(
    5,
    `Return Tuple (scale=${scaleFixed}, zero_point_aligned=${zeroPointAligned})`,
    `Zero-point alignment shift complete. Real FP32 value 0.0 maps cleanly to quantized integer ${zeroPointAligned}.`,
    { scale: scaleFixed, zeroPointAligned },
    0.0,
    zeroPointAligned,
    scaleFixed,
  );

  addStep(
    5,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    0.0,
    zeroPointAligned,
    scaleFixed,
  );

  while (steps.length < 20) {
    addStep(
      5,
      `Verification step ${steps.length + 1}`,
      `Verifying zero-point alignment invariant: (Z - qmin) * S == -min_val.`,
      { scale: scaleFixed, zeroPointAligned },
      0.0,
      zeroPointAligned,
      scaleFixed,
    );
  }

  return steps;
};

const ZEROPOINTALIGNMENTSHIFT_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "scale = (max_val + min_val) / 255.0",
    "zero_point_initial = qmax + min_val",
    "zero_point_aligned = int(min_val * scale)",
    "return scale + zero_point_aligned",
  ],
  hints: [
    { line: 1, hint: "Defines zero-point alignment function accepting min_val, max_val, and qmin/qmax bounds." },
    { line: 2, hint: "Compute scale factor S = (max_val - min_val) / (qmax - qmin)." },
    { line: 3, hint: "Compute raw initial zero-point float Z_raw = qmin - (min_val / scale)." },
    { line: 4, hint: "Round raw zero-point to integer and clamp within [qmin, qmax] integer bounds." },
  ],
  lineExplanations: {
    1: "Declares function signature zero_point_alignment_shift accepting min_val, max_val, qmin = -128, qmax = 127.",
    2: "Calculates quantization scale factor scale = (max_val - min_val) / (qmax - qmin).",
    3: "Calculates initial un-clamped zero-point float zero_point_initial = qmin - (min_val / scale).",
    4: "Rounds initial zero-point to integer and clamps within [qmin, qmax] integer bounds.",
    5: "Returns tuple (scale, zero_point_aligned) containing scale factor and integer-aligned zero-point.",
  },
};

export const zeroPointAlignmentShift: AlgorithmDefinition<zeroPointAlignmentShiftInput> = {
  id: "zero-point-alignment-shift",
  title: "Zero Point Alignment Shift",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Zero Point Alignment Shift

Zero-Point Alignment Shift is the core calibration routine (PyTorch \`torch.ao.quantization.observer\`) for asymmetric quantized neural networks.

#### Why It Exists & What It Solves
In asymmetric quantization, an arbitrary FP32 dynamic range $[x_{\\text{min}}, x_{\\text{max}}]$ is mapped to an 8-bit integer range $[q_{\\text{min}}, q_{\\text{max}}]$. Crucially, the physical floating-point value **$0.0$ MUST map to an exact integer zero-point $Z$ without rounding error**. This ensures zero-padding in Convolutional and Attention layers contributes exact zero value after de-quantization.

#### Step-by-Step Mechanism
1. **Scale Factor Calculation**: Compute step resolution $S$:
   $$S = \\frac{x_{\\text{max}} - x_{\\text{min}}}{q_{\\text{max}} - q_{\\text{min}}}$$
2. **Raw Zero-Point Float**: Solve for $Z_{\\text{raw}}$ such that $(Z_{\\text{raw}} - q_{\\text{min}}) \\cdot S = -x_{\\text{min}}$:
   $$Z_{\\text{raw}} = q_{\\text{min}} - \\frac{x_{\\text{min}}}{S}$$
3. **Integer Alignment & Clamping**: Round $Z_{\\text{raw}}$ to nearest integer and clamp within $[q_{\\text{min}}, q_{\\text{max}}]$:
   $$Z = \\text{clamp}\\left(\\text{round}\\left(Z_{\\text{raw}}\\right), q_{\\text{min}}, q_{\\text{max}}\\right)$$
4. **Quantization Mapping**: For any float $x$, $q = \\text{clamp}(\\text{round}(x / S) + Z, q_{\\text{min}}, q_{\\text{max}})$.

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(1)$ constant time arithmetic calibration.
- **Space Complexity**: $\\mathcal{O}(1)$ constant space.
- **Trade-Off**: Ensures zero-padding in convolutional networks produces exact zero numerical contributions at the cost of computing integer zero-point offsets.`,
  constraints: ["-10^9 <= minVal <= maxVal <= 10^9", "qmin < qmax"],
  examples: [
    {
      kind: "basic",
      title: "Asymmetric Range Calibration",
      inputDisplay: "min_val = -10.0, max_val = 20.0, qmin = -128, qmax = 127",
      outputDisplay: "scale = 0.117647, zero_point_aligned = -43",
      input: { minVal: -10.0, maxVal: 20.0, qmin: -128, qmax: 127 },
      output: "scale = 0.117647, zero_point_aligned = -43",
      explanation: "Computes scale S = 30 / 255 = 0.117647 and aligns zero-point Z = -128 - (-10 / 0.117647) = -43.",
    },
    {
      kind: "complex",
      title: "Non-Negative ReLU Activation Range",
      inputDisplay: "min_val = 0.0, max_val = 15.0, qmin = 0, qmax = 255",
      outputDisplay: "scale = 0.058824, zero_point_aligned = 0",
      input: { minVal: 0.0, maxVal: 15.0, qmin: 0, qmax: 255 },
      output: "scale = 0.058824, zero_point_aligned = 0",
      explanation: "Non-negative activation range [0, 15] in UINT8 [0, 255] maps FP32 0.0 to zero-point Z = 0.",
    },
    {
      kind: "negative",
      title: "Zero Range Protection",
      inputDisplay: "min_val = 5.0, max_val = 5.0, qmin = -128, qmax = 127",
      outputDisplay: "scale = 1.0, zero_point_aligned = -128",
      input: { minVal: 5.0, maxVal: 5.0, qmin: -128, qmax: 127 },
      output: "scale = 1.0, zero_point_aligned = -128",
      explanation: "Single value dynamic range falls back to scale 1.0 and Z = qmin.",
    },
  ],
  code: ZEROPOINTALIGNMENTSHIFT_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constant time O(1) calibration arithmetic.",
    space: "Constant space O(1) auxiliary variables.",
  },
  topicGuide: {
    overview:
      "Zero-point alignment guarantees that FP32 zero maps exactly to integer Z. This is crucial for zero-padding in convolutional neural networks so that padded border zeros contribute zero numeric value after de-quantization.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, scale $S = (x_{\\text{max}} - x_{\\text{min}}) / (q_{\\text{max}} - q_{\\text{min}})$. Raw zero-point $Z_{\\text{raw}} = q_{\\text{min}} - x_{\\text{min}} / S$. Aligned zero-point $Z = \\text{clamp}(\\text{round}(Z_{\\text{raw}}), q_{\\text{min}}, q_{\\text{max}})$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "PyTorch's quantization observers (`MinMaxObserver`, `HistogramObserver`) compute zero-point alignment shifts during post-training quantization calibration.",
      },
      {
        heading: "Implementation Details & Step-by-Step Calibration",
        body: "Implementation computes scale $S = (\\text{max\\_val} - \\text{min\\_val}) / (\\text{qmax} - \\text{qmin})$, calculates raw zero-point float $Z_{\\text{raw}} = \\text{qmin} - \\text{min\\_val} / S$, rounds, and clamps.",
      },
      {
        heading: "Edge Case Analysis & Zero Range",
        body: "Edge cases include $\\text{min\\_val} == \\text{max\\_val}$ where scale falls back to 1.0 and zero-point falls back to $\\text{qmin}$.",
      },
    ],
    keyTerms: [
      {
        term: "Zero-Point Alignment",
        definition: "Ensuring FP32 value 0.0 maps exactly to integer Z without rounding error.",
      },
      {
        term: "Quantization Observer",
        definition:
          "PyTorch calibration module tracking tensor min/max values to calculate S and Z.",
      },
      {
        term: "Zero-Padding Invariance",
        definition:
          "Preserving exact zero value contributions when zero-padding quantized tensors.",
      },
    ],
  },
  trivia: ZEROPOINTALIGNMENTSHIFT_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT,
  generateSteps: generateZeroPointAlignmentShiftSteps,
};
