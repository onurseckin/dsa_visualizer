import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface bitwiseSignExtractionInput {
  values: number[];
}

export const BITWISESIGNEXTRACTION_CODE = `def bitwise_sign_extraction(fp32_values):
    import struct
    signs = []
    for val in fp32_values:
        bits = struct.unpack('>I', struct.pack('>f', val))[0]
        sign_bit = (bits >> 31) & 1
        signs.append(sign_bit)
    return signs`;

export const DEFAULT_BITWISESIGNEXTRACTION_INPUT: bitwiseSignExtractionInput = {
  values: [1.2, -3.4, 5.5, -0.0, 0.0],
};

const floatToUint32 = (val: number): number => {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, val, false);
  return view.getUint32(0, false);
};

const fp32ToBitItems = (val: number): BitItem[] => {
  const u32 = floatToUint32(val);
  const bitStr = u32.toString(2).padStart(32, "0");
  return [
    { index: 31, label: "Sign (MSB)", value: bitStr[0], state: "sign", bitGroup: "sign" },
    { index: 30, label: "Exp [30:23]", value: bitStr.slice(1, 9), state: "exponent", bitGroup: "exp" },
    { index: 22, label: "Mantissa [22:0]", value: bitStr.slice(9), state: "mantissa", bitGroup: "mant" },
  ];
};

export const generateBitwiseSignExtractionSteps = (
  input: bitwiseSignExtractionInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5, -0.0, 0.0];
  const signsBuffer: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currSign?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? arrayValues[0],
        quantizedValue: currSign ?? 0,
        scale: 1,
        zeroPoint: 0,
        bits: fp32ToBitItems(currValue ?? arrayValues[0]),
        title: "IEEE-754 FP32 Bitwise Sign Extraction",
      },
      auxiliaryState: {
        visited: [...signsBuffer],
        customState: {
          signs: `[${signsBuffer.join(", ")}]`,
          values: `[${arrayValues.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize Bitwise Sign Extraction Engine",
    `Preparing to extract IEEE-754 sign bits for ${arrayValues.length} FP32 scalar values.`,
    { n: arrayValues.length },
    arrayValues[0],
    0,
  );

  // Step 2: Import struct
  addStep(
    2,
    "Import struct module",
    "Importing Python binary byte-manipulation module for reinterpreting FP32 memory representation.",
    { module: "struct" },
    arrayValues[0],
    0,
  );

  // Step 3: Allocate signs list
  addStep(
    3,
    "Allocate empty signs output list `signs = []`",
    "Initializing output buffer `signs = []` to bank extracted 1-bit sign indicators.",
    { bufferSize: 0 },
    arrayValues[0],
    0,
  );

  // Multi-step loop per scalar
  arrayValues.forEach((val, idx) => {
    addStep(
      4,
      `Inspect Element ${idx}: val = ${val}`,
      `Reading FP32 scalar input ${val} at index ${idx}.`,
      { idx, val, phase: "INSPECT_VAL" },
      val,
      0,
    );

    const u32Bits = floatToUint32(val);
    const hexBits = `0x${u32Bits.toString(16).padStart(8, "0").toUpperCase()}`;

    addStep(
      5,
      `Pack & Unpack IEEE-754 binary: bits = ${hexBits} (${u32Bits} uint32)`,
      `Packed float ${val} into 4-byte IEEE-754 binary structure and unpacked as 32-bit unsigned integer ${hexBits}.`,
      { idx, val, bitsUint32: u32Bits, bitsHex: hexBits, phase: "STRUCT_UNPACK" },
      val,
      0,
    );

    const signBit = (u32Bits >>> 31) & 1;

    addStep(
      6,
      `Bitwise Right Shift MSB: (bits >> 31) = ${u32Bits >>> 31}`,
      `Shifted 32-bit binary pattern right by 31 bits to position MSB sign bit at bit 0.`,
      { idx, val, shiftedBit: u32Bits >>> 31, phase: "SHIFT_RIGHT_31" },
      val,
      signBit,
    );

    addStep(
      6,
      `Extract Sign Bit: (bits >> 31) & 1 = ${signBit}`,
      `Masked shifted result with & 1. Extracted sign bit: ${signBit} (${signBit === 1 ? "Negative" : "Non-negative"}).`,
      { idx, val, signBit, isNegative: signBit === 1, phase: "MASK_AND_1" },
      val,
      signBit,
    );

    signsBuffer.push(signBit);

    addStep(
      7,
      `Append Sign Bit ${signBit} to Signs Buffer`,
      `Banked sign bit ${signBit} into output list at index ${idx}. Signs buffer: [${signsBuffer.join(", ")}].`,
      { idx, signBit, bufferLength: signsBuffer.length },
      val,
      signBit,
    );
  });

  // Final Return
  addStep(
    8,
    "Return Extracted Sign Bits Array `signs`",
    `Bitwise sign extraction complete across all ${arrayValues.length} values. Output: [${signsBuffer.join(", ")}].`,
    { resultCount: signsBuffer.length },
    arrayValues[arrayValues.length - 1],
    signsBuffer[signsBuffer.length - 1] ?? 0,
  );

  addStep(
    8,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    signsBuffer[signsBuffer.length - 1] ?? 0,
  );

  return steps;
};

const BITWISESIGNEXTRACTION_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "sign_bit = (bits >> 16) & 1",
    "sign_bit = 1 if val < 0 else 0",
    "sign_bit = bits & 0x7FFFFFFF",
    "signs.append(val > 0)",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting list of floating-point values." },
    { line: 5, hint: "Reinterpret raw 32-bit float memory layout as unsigned integer." },
    { line: 6, hint: "Right-shift bit pattern by 31 bits to move MSB sign bit to position 0, then mask with & 1." },
    { line: 7, hint: "Append single-bit sign indicator to output list." },
  ],
  lineExplanations: {
    1: "Declares function signature bitwise_sign_extraction accepting list of FP32 values `fp32_values`.",
    2: "Imports standard Python `struct` module for low-level IEEE-754 binary packing and unpacking.",
    3: "Initializes empty accumulator list `signs` to store extracted 1-bit sign values.",
    4: "Iterates through each FP32 scalar value `val` in input list `fp32_values`.",
    5: "Packs float into 4-byte big-endian buffer and unpacks as 32-bit unsigned integer `bits`.",
    6: "Right-shifts integer bits by 31 positions (`bits >> 31`) and applies bitwise AND (`& 1`) to extract sign bit 31.",
    7: "Appends extracted sign bit (0 for positive/zero, 1 for negative) to output list `signs`.",
    8: "Returns completed list of 1-bit sign indicators.",
  },
};

export const bitwiseSignExtraction: AlgorithmDefinition<bitwiseSignExtractionInput> = {
  id: "bitwise-sign-extraction",
  title: "Bitwise Sign Extraction",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Easy",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### Bitwise Sign Extraction

Bitwise Sign Extraction extracts the IEEE-754 1-bit sign indicator from a 32-bit floating point number (FP32) using bitwise right-shift and masking:
$$s = (b \\gg 31) \\;\\&\\; 1$$

#### Why It Exists & What It Solves
In the single-precision IEEE-754 floating point standard (FP32), a 32-bit float memory representation consists of 3 fields:
- **Sign Bit ($s$)**: 1 bit at position 31 ($0$ for positive, $1$ for negative).
- **Exponent ($e$)**: 8 bits at positions $23 \\dots 30$ with bias $+127$.
- **Mantissa Fraction ($m$)**: 23 bits at positions $0 \\dots 22$.

Evaluating floating point signs via comparison branches (\`if (x < 0)\`) introduces branch mispredictions and floating-point comparison pipeline latency. Bitwise sign extraction executes in 1 clock cycle on GPU SIMD bitwise hardware units, eliminating branch mispredictions in kernels such as LeakyReLU, Copysign, and 1-bit BNN (Binary Neural Network) quantization.

#### Step-by-Step Mechanism
1. **Bit Reinterpretation**: Reinterpret 32-bit float memory bytes as 32-bit unsigned integer $b \\in [0, 2^{32}-1]$.
2. **Bitwise Right-Shift**: Shift bit pattern $31$ positions right ($b \\gg 31$), placing the Most Significant Bit (MSB sign bit 31) into least significant position 0.
3. **Bitwise Masking**: Mask with bitwise AND $1$ (\`& 1\`), discarding any upper residue bits:
   $$s = (b \\gg 31) \\;\\&\\; 1$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time; 1 bitwise shift instruction per element.
- **Space Complexity**: $\\mathcal{O}(N)$ space for output sign bit array.
- **Trade-Off**: Branchless 1-cycle execution on GPU vector units with zero control-flow stalls.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard Sign Extraction",
      inputDisplay: "values = [1.2, -3.4, 5.5]",
      outputDisplay: "Sign Bits = [0, 1, 0]",
      input: { values: [1.2, -3.4, 5.5] },
      output: "[0, 1, 0]",
      explanation: "Extracts sign bits: 1.2 -> 0 (positive), -3.4 -> 1 (negative), 5.5 -> 0 (positive).",
    },
    {
      kind: "complex",
      title: "Signed Zeros & Extremes",
      inputDisplay: "values = [0.0, -0.0, -1e38, 1e38]",
      outputDisplay: "Sign Bits = [0, 1, 1, 0]",
      input: { values: [0.0, -0.0, -1e38, 1e38] },
      output: "[0, 1, 1, 0]",
      explanation: "Correctly distinguishes positive zero (+0.0 -> 0) from negative zero (-0.0 -> 1).",
    },
    {
      kind: "negative",
      inputDisplay: "values = [-100.0, -0.0001]",
      outputDisplay: "[1, 1]",
      input: { values: [-100.0, -0.0001] },
      output: "[1, 1]",
      explanation: "Extracts MSB sign bit 1 for negative float inputs.",
    },
  ],
  code: BITWISESIGNEXTRACTION_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across input elements.",
    space: "Linear space O(N) for output 1-bit sign array.",
  },
  topicGuide: {
    overview:
      "Bitwise sign extraction is used in activation functions (e.g. LeakyReLU, Copysign), sign-based optimization algorithms (SignSGD), and binary neural network quantization (1-bit BNNs).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, an IEEE-754 32-bit float bit string $B = s \\,|\\, e_7 \\dots e_0 \\,|\\, m_{22} \\dots m_0$. Sign bit $s = (B \\gg 31) \\;\\&\\; 1$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Branchless bitwise sign extraction powers SignSGD optimizers and 1-bit BNN activation layers, accelerating GPU vector kernel execution.",
      },
      {
        heading: "Implementation Details & Bitwise Operations",
        body: "Implementation packs float into 4-byte buffer, unpacks as uint32 integer $b$, shifts right by 31 bits ($b \\gg 31$), and applies bitwise AND (\`& 1\`).",
      },
      {
        heading: "Edge Case Analysis & Signed Zero",
        body: "Edge cases include negative zero ($-0.0$), represented in IEEE-754 as \`0x80000000\`, which evaluates to sign bit 1.",
      },
    ],
    keyTerms: [
      {
        term: "Sign Bit (MSB)",
        definition: "Bit 31 in IEEE-754 FP32 floating point format representing number sign.",
      },
      {
        term: "Branchless Execution",
        definition: "Computing conditional results without branch instructions to prevent control-flow stalls.",
      },
      {
        term: "Signed Zero (-0.0)",
        definition: "IEEE-754 floating point representation of zero with sign bit 1 set.",
      },
    ],
  },
  trivia: BITWISESIGNEXTRACTION_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_BITWISESIGNEXTRACTION_INPUT,
  generateSteps: generateBitwiseSignExtractionSteps,
};
