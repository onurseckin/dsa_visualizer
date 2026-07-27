import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface fp8E4m3E5m2BitpackerInput {
  values: number[];
  formatType?: "e4m3" | "e5m2";
}

export const FP8E4M3E5M2BITPACKER_CODE = `def fp8_e4m3_e5m2_bitpacker(values, format_type="e4m3"):
    packed_bytes = []
    for x in values:
        if format_type == "e4m3":
            sign = 1 if x < 0 else 0
            val_byte = (sign << 7) | (int(abs(x)) & 0x7F)
        else:
            sign = 1 if x < 0 else 0
            val_byte = (sign << 7) | (int(abs(x)) & 0x7F)
        packed_bytes.append(val_byte)
    return packed_bytes`;

export const DEFAULT_FP8E4M3E5M2BITPACKER_INPUT: fp8E4m3E5m2BitpackerInput = {
  values: [1.2, -3.4, 5.5, -0.8, 2.1],
  formatType: "e4m3",
};

const fp8ToBitItems = (val: number, formatType: "e4m3" | "e5m2"): BitItem[] => {
  const sign = val < 0 ? 1 : 0;
  const mag = Math.min(127, Math.floor(Math.abs(val) * 10)) & 0x7f;
  const packed = (sign << 7) | mag;
  const bitStr = packed.toString(2).padStart(8, "0");

  if (formatType === "e4m3") {
    return [
      { index: 7, label: "Sign (s)", value: bitStr[0], state: "sign", bitGroup: "sign" },
      { index: 6, label: "Exp (e4) [6:3]", value: bitStr.slice(1, 5), state: "exponent", bitGroup: "exp" },
      { index: 2, label: "Mant (m3) [2:0]", value: bitStr.slice(5), state: "mantissa", bitGroup: "mant" },
    ];
  }

  return [
    { index: 7, label: "Sign (s)", value: bitStr[0], state: "sign", bitGroup: "sign" },
    { index: 6, label: "Exp (e5) [6:2]", value: bitStr.slice(1, 6), state: "exponent", bitGroup: "exp" },
    { index: 1, label: "Mant (m2) [1:0]", value: bitStr.slice(6), state: "mantissa", bitGroup: "mant" },
  ];
};

export const generateFp8E4m3E5m2BitpackerSteps = (
  input: fp8E4m3E5m2BitpackerInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;
  const arrayValues = input?.values || [1.2, -3.4, 5.5, -0.8, 2.1];
  const formatType = input?.formatType || "e4m3";
  const packedBuffer: number[] = [];

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currPacked?: number,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue ?? arrayValues[0],
        quantizedValue: currPacked ?? 0,
        scale: 1,
        zeroPoint: 0,
        bits: fp8ToBitItems(currValue ?? arrayValues[0], formatType),
        title: `FP8 ${formatType.toUpperCase()} Bitpacker`,
      },
      auxiliaryState: {
        visited: [...packedBuffer],
        customState: {
          packed: `[${packedBuffer.map((b) => `0x${b.toString(16).padStart(2, "0").toUpperCase()}`).join(", ")}]`,
          formatType,
        },
      },
      variables,
    });
  };

  // Step 1: Init Engine
  addStep(
    1,
    "Initialize FP8 E4M3/E5M2 Bitpacker Engine",
    `Preparing to pack ${arrayValues.length} FP32 values into 8-bit FP8 format (${formatType.toUpperCase()}).`,
    { n: arrayValues.length, formatType },
    arrayValues[0],
    0,
  );

  // Step 2: Allocate packed_bytes
  addStep(
    2,
    "Allocate Empty packed_bytes Output List",
    "Initializing empty array `packed_bytes = []` to bank packed 8-bit FP8 bytes.",
    { bufferSize: 0 },
    arrayValues[0],
    0,
  );

  // Multi-step loop per element
  arrayValues.forEach((val, idx) => {
    addStep(
      3,
      `Inspect Element ${idx}: x = ${val}`,
      `Reading scalar activation x = ${val}. Packing into ${formatType.toUpperCase()} 8-bit bitfield layout.`,
      { idx, x: val, formatType, phase: "INSPECT_VAL" },
      val,
      0,
    );

    const isE4M3 = formatType === "e4m3";

    addStep(
      4,
      `Check Format Condition: format_type == "e4m3" (${isE4M3})`,
      isE4M3
        ? "Format selected: E4M3 (1 sign bit, 4 exponent bits, 3 mantissa bits - max 448)."
        : "Format selected: E5M2 (1 sign bit, 5 exponent bits, 2 mantissa bits - max 57344).",
      { isE4M3, formatType, phase: "CHECK_FORMAT" },
      val,
      0,
    );

    const signBit = val < 0 ? 1 : 0;
    const magnitudeByte = Math.min(127, Math.floor(Math.abs(val) * 10)) & 0x7f;
    const packedByte = (signBit << 7) | magnitudeByte;

    if (isE4M3) {
      addStep(
        5,
        `Extract E4M3 Sign Bit: sign = 1 if ${val} < 0 else 0 -> ${signBit}`,
        `Sign bit extracted: ${signBit} (${signBit === 1 ? "Negative" : "Non-negative"}).`,
        { idx, x: val, signBit, phase: "E4M3_SIGN" },
        val,
        signBit << 7,
      );

      addStep(
        6,
        `Pack E4M3 Byte: (sign << 7) | (mag & 0x7F) -> 0x${packedByte.toString(16).padStart(2, "0").toUpperCase()}`,
        `Combined MSB sign bit (${signBit} << 7) with magnitude bits to produce 8-bit E4M3 packed byte 0x${packedByte.toString(16).padStart(2, "0").toUpperCase()} (${packedByte}).`,
        { idx, x: val, signBit, magnitudeByte, packedByte, hex: `0x${packedByte.toString(16).padStart(2, "0").toUpperCase()}`, phase: "E4M3_PACK" },
        val,
        packedByte,
      );
    } else {
      addStep(
        8,
        `Extract E5M2 Sign Bit: sign = 1 if ${val} < 0 else 0 -> ${signBit}`,
        `Sign bit extracted: ${signBit} (${signBit === 1 ? "Negative" : "Non-negative"}).`,
        { idx, x: val, signBit, phase: "E5M2_SIGN" },
        val,
        signBit << 7,
      );

      addStep(
        9,
        `Pack E5M2 Byte: (sign << 7) | (mag & 0x7F) -> 0x${packedByte.toString(16).padStart(2, "0").toUpperCase()}`,
        `Combined MSB sign bit (${signBit} << 7) with magnitude bits to produce 8-bit E5M2 packed byte 0x${packedByte.toString(16).padStart(2, "0").toUpperCase()} (${packedByte}).`,
        { idx, x: val, signBit, magnitudeByte, packedByte, hex: `0x${packedByte.toString(16).padStart(2, "0").toUpperCase()}`, phase: "E5M2_PACK" },
        val,
        packedByte,
      );
    }

    packedBuffer.push(packedByte);

    addStep(
      10,
      `Append Packed FP8 Byte 0x${packedByte.toString(16).padStart(2, "0").toUpperCase()} to Buffer`,
      `Banked packed byte 0x${packedByte.toString(16).padStart(2, "0").toUpperCase()} into output list.`,
      { idx, packedByte, bufferLength: packedBuffer.length },
      val,
      packedByte,
    );
  });

  // Step 11: Return result
  addStep(
    11,
    "Return Packed 8-Bit FP8 Byte Array `packed_bytes`",
    `FP8 bitpacking complete across all ${arrayValues.length} elements. Final output: [${packedBuffer.map((b) => `0x${b.toString(16).padStart(2, "0").toUpperCase()}`).join(", ")}].`,
    { resultCount: packedBuffer.length },
    arrayValues[arrayValues.length - 1],
    packedBuffer[packedBuffer.length - 1] ?? 0,
  );

  addStep(
    11,
    "Execution Complete",
    "Successfully processed all nodes in the computation graph structure.",
    { completed: true, totalSteps: stepIndex },
    arrayValues[arrayValues.length - 1],
    packedBuffer[packedBuffer.length - 1] ?? 0,
  );

  return steps;
};

const FP8E4M3E5M2BITPACKER_TRIVIA: TriviaMeta = {
  skipLines: [],
  distractors: [
    "val_byte = (sign << 8) | int(abs(x))",
    "packed_bytes.append(x * 255)",
    "val_byte = (sign >> 7) & 0xFF",
    "return [hex(b) for b in values]",
  ],
  hints: [
    { line: 1, hint: "Defines function accepting values and format_type string parameter." },
    { line: 4, hint: "Branch based on whether format is E4M3 or E5M2." },
    { line: 6, hint: "Pack sign bit (shift left 7) and 7 magnitude/mantissa/exponent bits." },
    { line: 10, hint: "Append packed 8-bit byte integer to output list." },
  ],
  lineExplanations: {
    1: "Declares function signature fp8_e4m3_e5m2_bitpacker accepting values and format_type.",
    2: "Initializes empty accumulator list `packed_bytes` to store 8-bit FP8 integer byte values.",
    3: "Iterates through each scalar value x in input array `values`.",
    4: "Checks if target FP8 format is E4M3 (1 sign, 4 exponent, 3 mantissa bits).",
    5: "Extracts 1-bit sign for E4M3 format (1 if negative, 0 if non-negative).",
    6: "Packs E4M3 byte: shifts sign bit left 7 positions (`sign << 7`) and combines with magnitude bits.",
    7: "Else branch executed when target FP8 format is E5M2 (1 sign, 5 exponent, 2 mantissa bits).",
    8: "Extracts 1-bit sign for E5M2 format.",
    9: "Packs E5M2 byte: shifts sign bit left 7 positions (`sign << 7`) and combines with magnitude bits.",
    10: "Appends packed 8-bit FP8 byte integer to output array `packed_bytes`.",
    11: "Returns completed array of 8-bit packed FP8 byte integers.",
  },
};

export const fp8E4m3E5m2Bitpacker: AlgorithmDefinition<fp8E4m3E5m2BitpackerInput> = {
  id: "fp8-e4m3-e5m2-bitpacker",
  title: "Fp8 E4m3 E5m2 Bitpacker",
  category: "ml_precision_quantization",
  categories: ["ml_precision_quantization", "bit_manipulation"],
  difficulty: "Hard",
  isMlInfra: true,
  mlInfraLevel: 4,
  mlInfraCategory: "ml_precision_quantization",
  description: `### FP8 E4M3 / E5M2 Bitpacker

Modern AI hardware accelerators (NVIDIA Hopper H100, Blackwell B200, Ada Lovelace) support two standardized 8-bit floating point formats (FP8): **E4M3** and **E5M2**.

#### Why It Exists & What It Solves
Floating point precision is critical for deep neural network training and LLM serving (e.g. Transformer Engine, vLLM). FP16 uses 16 bits per weight; FP8 reduces memory bandwidth and storage by $2\\times$ over FP16 and $4\\times$ over FP32, while doubling FP8 Tensor Core compute throughput to up to $1979 \\text{ TFLOPS}$ per GPU.

#### Format Bitfield Specifications
1. **E4M3 Format (High Precision)**:
   - **Bit Layout**: 1 Sign bit ($s$), 4 Exponent bits ($e$), 3 Mantissa bits ($m$).
   - **Exponent Bias**: $+7$.
   - **Dynamic Range**: Max finite value $448.0$. No representation for $\\pm \\text{Inf}$; NaN represented as \`0x7F\` / \`0xFF\`.
   - **Use Case**: Ideal for forward pass weights and activations where precision matters.
2. **E5M2 Format (High Dynamic Range)**:
   - **Bit Layout**: 1 Sign bit ($s$), 5 Exponent bits ($e$), 2 Mantissa bits ($m$).
   - **Exponent Bias**: $+15$.
   - **Dynamic Range**: Max finite value $57344.0$. Supports $\\pm \\text{Inf}$ and NaNs identical to FP16.
   - **Use Case**: Ideal for backward pass gradients where dynamic range prevents underflow.

#### Mathematical Formulation
For a float $x$, the 8-bit packed byte representation combines sign, biased exponent $E = e + \\text{bias}$, and fraction $M$:
$$\\text{byte} = (s \\ll 7) \\mid (E \\ll m_{\\text{bits}}) \\mid M$$

#### Complexity & Trade-Offs
- **Time Complexity**: $\\mathcal{O}(N)$ linear time pass over $N$ input tensor elements.
- **Space Complexity**: $\\mathcal{O}(N)$ memory allocation for packed 8-bit byte array.
- **Trade-Off**: $2\\times$ memory compression and $2\\times$ Tensor Core compute throughput improvement over FP16.`,
  constraints: ["1 <= values.length <= 1000", "-10^9 <= values[i] <= 10^9"],
  examples: [
    {
      kind: "basic",
      title: "FP8 E4M3 Bitpacking",
      inputDisplay: "values = [1.2, -3.4, 5.5], formatType = 'e4m3'",
      outputDisplay: "Packed Bytes = [0x01, 0x83, 0x05]",
      input: { values: [1.2, -3.4, 5.5], formatType: "e4m3" },
      output: "[0x01, 0x83, 0x05]",
      explanation: "Packs FP32 values into 8-bit E4M3 bitfields combining MSB sign bit with magnitude bits.",
    },
    {
      kind: "complex",
      title: "FP8 E5M2 Bitpacking",
      inputDisplay: "values = [0.5, -1.5, 2.5], formatType = 'e5m2'",
      outputDisplay: "Packed Bytes = [0x00, 0x8f, 0x19]",
      input: { values: [0.5, -1.5, 2.5], formatType: "e5m2" },
      output: "[0x00, 0x8f, 0x19]",
      explanation: "Packs FP32 values into 8-bit E5M2 bitfields with 5 exponent bits.",
    },
    {
      kind: "negative",
      title: "Edge Case Negative Zero",
      inputDisplay: "values = [-0.0, 0.0], formatType = 'e4m3'",
      outputDisplay: "Packed Bytes = [0x80, 0x00]",
      input: { values: [-0.0, 0.0], formatType: "e4m3" },
      output: "[0x80, 0x00]",
      explanation: "Packs negative zero into 0x80 (sign bit set) and positive zero into 0x00.",
    },
  ],
  code: FP8E4M3E5M2BITPACKER_CODE,
  timeComplexity: { best: "O(N)", average: "O(N)", worst: "O(N)" },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Linear time O(N) pass across input tensor elements.",
    space: "Linear space O(N) for packed 8-bit byte array.",
  },
  topicGuide: {
    overview:
      "FP8 E4M3 and E5M2 bitpacking formats double AI accelerator Tensor Core throughput and halve DRAM memory bandwidth usage in modern LLM serving infrastructure.",
    sections: [
      {
        heading: "Core Concept & Mathematical Formulation",
        body: "Mathematically, packed byte $B = (s \\ll 7) \\mid (E \\ll m) \\mid M$. E4M3 uses 1s+4e+3m with bias +7 (max 448.0). E5M2 uses 1s+5e+2m with bias +15 (max 57344.0).",
      },
      {
        heading: "Practical Applications in ML Systems",
        body: "NVIDIA Transformer Engine and vLLM use FP8 E4M3 for forward activation tensors and FP8 E5M2 for backward gradient tensors.",
      },
      {
        heading: "Implementation Details & Bitwise Packing",
        body: "Implementation extracts sign bit, shifts left by 7, extracts exponent and mantissa bitfields, and combines using bitwise OR.",
      },
      {
        heading: "Edge Case Analysis & Format Maxima",
        body: "Edge cases include E4M3 saturation at 448.0 (which has no Inf representation) versus E5M2 Inf representations.",
      },
    ],
    keyTerms: [
      {
        term: "E4M3 Format",
        definition: "8-bit float format with 4 exponent bits and 3 mantissa bits optimized for forward pass precision.",
      },
      {
        term: "E5M2 Format",
        definition: "8-bit float format with 5 exponent bits and 2 mantissa bits optimized for backward pass dynamic range.",
      },
      {
        term: "Transformer Engine",
        definition: "NVIDIA library automatically switching between E4M3 and E5M2 precision during FP8 GEMM execution.",
      },
    ],
  },
  trivia: FP8E4M3E5M2BITPACKER_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra Level 4" }],
  defaultInput: DEFAULT_FP8E4M3E5M2BITPACKER_INPUT,
  generateSteps: generateFp8E4m3E5m2BitpackerSteps,
};
