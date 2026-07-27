import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface ieee754BitwiseDissectorInput {
  values?: number[];
  val?: number;
}

export const IEEE754BITWISEDISSECTOR_CODE = `def ieee754_bitwise_dissector(fp32_val):
    import struct
    bits = struct.unpack('>I', struct.pack('>f', fp32_val))[0]
    sign = (bits >> 31) & 1
    exponent = (bits >> 23) & 0xFF
    mantissa = bits & 0x7FFFFF
    unbiased_exp = exponent - 127
    return sign, exponent, unbiased_exp, mantissa`;

export const DEFAULT_IEEE754BITWISEDISSECTOR_INPUT: ieee754BitwiseDissectorInput = {
  values: [1.2, -3.4, 5.5, -0.15625, 65504.0],
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
    { index: 31, label: "Sign (s)", value: bitStr[0], state: "sign", bitGroup: "sign" },
    { index: 30, label: "Biased Exp (e) [30:23]", value: bitStr.slice(1, 9), state: "exponent", bitGroup: "exp" },
    { index: 22, label: "Mantissa (m) [22:0]", value: bitStr.slice(9), state: "mantissa", bitGroup: "mant" },
  ];
};

export const generateIeee754BitwiseDissectorSteps = (
  input: ieee754BitwiseDissectorInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || (input?.val !== undefined ? [input.val] : [1.2, -3.4, 5.5, -0.15625, 65504.0]);

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
        title: "IEEE-754 Single-Precision (FP32) Bitwise Dissector",
      },
      auxiliaryState: {
        customState: {
          values: `[${arrayValues.join(", ")}]`,
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize IEEE-754 Bitwise Dissector Engine",
    `Preparing to dissect ${arrayValues.length} FP32 scalar values into sign, exponent, and mantissa fields.`,
    { n: arrayValues.length },
    arrayValues[0],
    0,
  );

  // Step 2: Import struct
  addStep(
    2,
    "Import struct module",
    "Importing Python binary byte manipulation module `struct` for raw IEEE-754 bit reinterpretation.",
    { module: "struct" },
    arrayValues[0],
    0,
  );

  // Multi-step dissection per element
  arrayValues.forEach((val, idx) => {
    addStep(
      1,
      `Inspect Scalar Value ${idx}: fp32_val = ${val}`,
      `Reading FP32 scalar input ${val} at index ${idx}.`,
      { idx, val, phase: "INSPECT_VAL" },
      val,
      0,
    );

    const u32Bits = floatToUint32(val);
    const hexBits = `0x${u32Bits.toString(16).padStart(8, "0").toUpperCase()}`;

    addStep(
      3,
      `Pack & Unpack Float Bytes: bits = ${hexBits} (${u32Bits} uint32)`,
      `Packed float ${val} into 4-byte IEEE-754 structure and unpacked as 32-bit unsigned integer ${hexBits}.`,
      { idx, val, bitsUint32: u32Bits, bitsHex: hexBits, phase: "UNPACK_UINT32" },
      val,
      0,
    );

    const sign = (u32Bits >>> 31) & 1;

    addStep(
      4,
      `Extract 1-bit Sign MSB: (bits >> 31) & 1 = ${sign}`,
      `Right-shifted 31 positions to extract 1-bit sign indicator MSB: ${sign} (${sign === 1 ? "Negative" : "Positive"}).`,
      { idx, val, sign, isNegative: sign === 1, phase: "EXTRACT_SIGN" },
      val,
      sign,
    );

    const exponent = (u32Bits >>> 23) & 0xff;

    addStep(
      5,
      `Extract 8-bit Biased Exponent: (bits >> 23) & 0xFF = ${exponent}`,
      `Right-shifted 23 positions and masked with 0xFF to isolate 8-bit biased exponent: E = ${exponent}.`,
      { idx, val, biasedExponent: exponent, phase: "EXTRACT_EXPONENT" },
      val,
      exponent,
    );

    const mantissa = u32Bits & 0x7fffff;
    const mantissaHex = `0x${mantissa.toString(16).padStart(6, "0").toUpperCase()}`;

    addStep(
      6,
      `Extract 23-bit Mantissa Fraction: bits & 0x7FFFFF = ${mantissaHex} (${mantissa})`,
      `Masked lower 23 bits with 0x7FFFFF to isolate fractional mantissa field: M = ${mantissaHex}.`,
      { idx, val, mantissa, mantissaHex, phase: "EXTRACT_MANTISSA" },
      val,
      mantissa,
    );

    const unbiasedExp = exponent - 127;

    addStep(
      7,
      `Compute Unbiased Base-2 Exponent: exponent - 127 = ${exponent} - 127 = ${unbiasedExp}`,
      `Subtracted IEEE-754 bias 127 from biased exponent ${exponent} to find true base-2 exponent e = 2^${unbiasedExp}.`,
      { idx, val, biasedExponent: exponent, unbiasedExp, powerOfTwo: `2^${unbiasedExp}`, phase: "UNBIAS_EXPONENT" },
      val,
      unbiasedExp,
    );

    addStep(
      8,
      `Return Dissected Tuple for ${val}: (sign=${sign}, exp=${exponent}, unbiased_exp=${unbiasedExp}, mantissa=${mantissaHex})`,
      `Successfully dissected ${val}: sign=${sign}, 2^(${unbiasedExp}), mantissa=${mantissaHex}. Reconstructed value = (-1)^${sign} * 2^(${unbiasedExp}) * (1 + ${mantissa}/2^23).`,
      { idx, val, sign, exponent, unbiasedExp, mantissa, phase: "RETURN_TUPLE" },
      val,
      sign,
    );
  });

  // Step 8: Return complete
  addStep(
    8,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    0,
  );

  return steps;
};

const IEEE754BITWISEDISSECTOR_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "exponent = (bits >> 16) & 0xFF",
    "unbiased_exp = exponent - 255",
    "mantissa = bits >> 23",
    "sign = bits & 1",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting a single FP32 floating point number." },
    { line: 4, hint: "Right-shift 31 bits to extract MSB sign bit 31." },
    { line: 5, hint: "Right-shift 23 bits and mask with 0xFF to isolate 8-bit biased exponent." },
    { line: 6, hint: "Mask lower 23 bits with 0x7FFFFF to isolate fractional mantissa." },
    { line: 7, hint: "Subtract IEEE-754 bias +127 from biased exponent to obtain true exponent." },
  ],
  lineExplanations: {
    1: "Declares function signature ieee754_bitwise_dissector accepting FP32 float `fp32_val`.",
    2: "Imports standard Python `struct` module for low-level binary byte packing/unpacking.",
    3: "Packs float into 4-byte big-endian buffer and unpacks as 32-bit unsigned integer `bits`.",
    4: "Extracts 1-bit sign indicator: (bits >> 31) & 1.",
    5: "Extracts 8-bit biased exponent field: (bits >> 23) & 0xFF.",
    6: "Extracts 23-bit mantissa fraction field: bits & 0x7FFFFF.",
    7: "Calculates unbiased base-2 exponent: unbiased_exp = exponent - 127.",
    8: "Returns tuple (sign, exponent, unbiased_exp, mantissa) containing dissected bitfield components.",
  },
};

export const ieee754BitwiseDissector: AlgorithmDefinition<ieee754BitwiseDissectorInput> = {
  id: "ieee-754-bitwise-dissector",
  title: "Ieee754 Bitwise Dissector",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### IEEE-754 Bitwise Dissector

IEEE-754 Single-Precision Floating Point Dissector parses a 32-bit floating point number (FP32) into its constituent binary bitfields: 1-bit sign $S$, 8-bit biased exponent $E$, and 23-bit mantissa fraction $M$.

#### Why It Exists & What It Solves
Understanding the low-level bitfield representation of floating-point numbers is mandatory for custom GPU kernel development, quantization, and numerical debugging. IEEE-754 FP32 decomposes a real number $V$ as:
$$V = (-1)^S \\times 2^{E - 127} \\times \\left(1 + \\frac{M}{2^{23}}\\right)$$

#### Step-by-Step Mechanism
1. **Bit Reinterpretation**: Reinterpret FP32 float memory bytes as 32-bit unsigned integer $B \\in [0, 2^{32}-1]$.
2. **Sign Extraction ($S$)**: Shift right by 31 bits ($B \\gg 31$) and mask with $1$:
   $$S = (B \\gg 31) \\;\\&\\; 1$$
3. **Biased Exponent Extraction ($E$)**: Shift right by 23 bits ($B \\gg 23$) and mask 8 bits ($0\\text{xFF}$):
   $$E = (B \\gg 23) \\;\\&\\; 0\\text{xFF}$$
4. **Mantissa Extraction ($M$)**: Mask lower 23 bits ($0\\text{x7FFFFF}$):
   $$M = B \\;\\&\\; 0\\text{x7FFFFF}$$
5. **Unbiasing Exponent**: Subtract bias $+127$:
   $$e = E - 127$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(1)$ constant time bitwise shift and mask operations per float.
- **Space Complexity**: $\\mathcal{O}(1)$ auxiliary space.
- **Trade-Off**: Enables exact 1-cycle bitfield inspection for precision conversions (e.g. FP32 $\\to$ BF16 by truncating 16 mantissa bits).`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "Standard FP32 Dissection",
      inputDisplay: "values = [1.2, -3.4, 5.5]",
      outputDisplay: "Sign = 0, Biased Exp = 127 (Unbiased = 0), Mantissa = 0x19999A",
      input: { values: [1.2, -3.4, 5.5] },
      output: "(sign=0, exp=127, unbiased_exp=0, mantissa=0x19999A)",
      explanation: "Dissects FP32 1.2 into sign 0, biased exponent 127 (2^0), and mantissa fraction 0x19999A.",
    },
    {
      kind: "complex",
      title: "Powers of Two & Extremes",
      inputDisplay: "values = [1.0, -0.15625, 65504.0]",
      outputDisplay: "Sign = 0, Biased Exp = 127, Mantissa = 0x0",
      input: { values: [1.0, -0.15625, 65504.0] },
      output: "(sign=0, exp=127, unbiased_exp=0, mantissa=0x0)",
      explanation: "Dissects exact power-of-two 1.0 (sign=0, 2^0, mantissa=0).",
    },
    {
      kind: "negative",
      title: "Negative Signed Zero",
      inputDisplay: "values = [-0.0]",
      outputDisplay: "Sign = 1, Biased Exp = 0, Mantissa = 0x0",
      input: { values: [-0.0] },
      output: "(sign=1, exp=0, unbiased_exp=-127, mantissa=0x0)",
      explanation: "Dissects IEEE-754 negative zero (-0.0 -> 0x80000000).",
    },
  ],
  code: IEEE754BITWISEDISSECTOR_CODE,
  timeComplexity: { best: "O(1)", average: "O(1)", worst: "O(1)" },
  spaceComplexity: "O(1)",
  complexityAnalysis: {
    time: "Constant time O(1) bitwise shift and mask operations.",
    space: "Constant space O(1) auxiliary variables.",
  },
  topicGuide: {
    overview:
      "IEEE-754 Float32 dissection reveals how computers store real numbers. Unpacking bitfields via bitwise right-shift and masking enables custom precision conversions (e.g. FP32 -> BF16 by truncating 16 mantissa bits).",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, FP32 value $V = (-1)^S \\cdot 2^{E - 127} \\cdot (1 + M / 2^{23})$. Sign $S = (B \\gg 31) \\& 1$, Exponent $E = (B \\gg 23) \\& 0\\text{xFF}$, Mantissa $M = B \\& 0\\text{x7FFFFF}$.",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "Dissecting float bitfields is foundational for BFloat16/FP16 conversion kernels, flash-attention numerical guards, and FP8 quantization implementations.",
      },
      {
        heading: "Implementation Details & Bitwise Shift",
        body: "Implementation packs float into 4-byte buffer, unpacks as uint32 integer $B$, shifts right by 31 bits for sign, 23 bits for exponent, and masks lower 23 bits for mantissa.",
      },
      {
        heading: "Edge Case Analysis & Special Numbers",
        body: "Edge cases include denormalized numbers ($E=0$), infinities ($E=255, M=0$), and NaNs ($E=255, M \\ne 0$).",
      },
    ],
    keyTerms: [
      {
        term: "Biased Exponent (+127)",
        definition: "8-bit exponent field offset by +127 to represent negative powers of two without a sign bit.",
      },
      {
        term: "Implicit Leading One",
        definition: "The implicit 1 in normalized IEEE-754 floats (1 + M/2^23) omitting 1 bit of storage.",
      },
      {
        term: "Mantissa Fraction (M)",
        definition: "23-bit fractional mantissa field specifying precision offset.",
      },
    ],
  },
  trivia: IEEE754BITWISEDISSECTOR_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_IEEE754BITWISEDISSECTOR_INPUT,
  generateSteps: generateIeee754BitwiseDissectorSteps,
};
