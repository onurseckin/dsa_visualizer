import type { AlgorithmDefinition, AlgorithmStep, BitItem } from "../../types/dsa";
import type { TriviaMeta } from "../../types/trivia";

export interface AffineQuantizationInput {
  values: number[];
  qmin: number;
  qmax: number;
}

export const AFFINE_QUANTIZATION_SQ8_CODE = `def affine_quantize_dequantize(values: list[float], qmin: int = -128, qmax: int = 127) -> dict:
    if not values:
        return {"scale": 1.0, "zero_point": 0, "quantized": [], "dequantized": [], "max_error": 0.0}
        
    min_val = min(values)
    max_val = max(values)
    
    if max_val == min_val:
        scale = 1.0
        zero_point = qmin
    else:
        scale = (max_val - min_val) / (qmax - qmin)
        zero_point = round(qmin - min_val / scale)
        zero_point = max(qmin, min(qmax, zero_point))
        
    quantized = []
    dequantized = []
    errors = []
    
    for x in values:
        q = round(x / scale) + zero_point
        q_clamped = max(qmin, min(qmax, q))
        x_recon = (q_clamped - zero_point) * scale
        
        quantized.append(q_clamped)
        dequantized.append(round(x_recon, 4))
        errors.append(abs(x - x_recon))
        
    return {
        "scale": round(scale, 6),
        "zero_point": zero_point,
        "quantized": quantized,
        "dequantized": dequantized,
        "max_error": round(max(errors), 4)
    }`;

export const DEFAULT_AFFINE_QUANTIZATION_INPUT: AffineQuantizationInput = {
  values: [-2.5, 0.0, 1.2, 3.8, 5.0],
  qmin: -128,
  qmax: 127,
};

const toBitItems = (val: number, qmin: number, qmax: number): BitItem[] => {
  const clamped = Math.max(qmin, Math.min(qmax, Math.round(val)));
  const uval = clamped < 0 ? (clamped + 256) & 0xff : clamped & 0xff;
  const bitStr = uval.toString(2).padStart(8, "0");
  return bitStr.split("").map((b, i) => ({
    index: 7 - i,
    label: i === 0 && qmin < 0 ? "Sign" : `b${7 - i}`,
    value: b,
    state: i === 0 && qmin < 0 ? "sign" : "quantized",
  }));
};

export const generateAffineQuantizationSq8Steps = (
  input: AffineQuantizationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { values, qmin, qmax } = input;
  const n = values ? values.length : 0;

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    currValue?: number,
    currQuantized?: number,
    currScale?: number,
    currZeroPoint?: number,
    quantizedList?: number[],
  ) => {
    const s = currScale ?? 1.0;
    const z = currZeroPoint ?? 0;
    const qVal = currQuantized ?? 0;
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "quantization",
        originalValue: currValue !== undefined ? Number(currValue.toFixed(4)) : undefined,
        quantizedValue: currQuantized !== undefined ? qVal : undefined,
        scale: Number(s.toFixed(6)),
        zeroPoint: z,
        bits: toBitItems(qVal, qmin, qmax),
        title: `Asymmetric Affine INT8 Quantization (Target Range [${qmin}, ${qmax}])`,
      },
      auxiliaryState: {
        customState: {
          targetFormat: `Range [${qmin}, ${qmax}]`,
          numElements: n,
          scale: s.toFixed(6),
          zeroPoint: z,
          quantized: quantizedList ? `[${quantizedList.join(", ")}]` : "[]",
        },
      },
      variables,
    });
  };

  addStep(
    1,
    "Initialize Asymmetric Affine INT8 Quantization",
    `Input FP32 values vector of length ${n} targeting integer grid bounds [${qmin}, ${qmax}].`,
    { n, qmin, qmax },
  );

  if (n === 0) {
    addStep(
      2,
      "Empty input values array — early return",
      "Returning default scale 1.0 and zero_point 0 for empty vector.",
      { scale: 1.0, zero_point: 0, max_error: 0 },
      undefined,
      0,
      1.0,
      0,
      [],
    );
    return steps;
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  addStep(
    5,
    `Extract Range Bounds: min_val = ${minVal.toFixed(4)}, max_val = ${maxVal.toFixed(4)}`,
    `Scanning ${n} input FP32 values to determine minimum (${minVal.toFixed(4)}) and maximum (${maxVal.toFixed(4)}) tensor bounds.`,
    { min_val: Number(minVal.toFixed(4)), max_val: Number(maxVal.toFixed(4)) },
    minVal,
    0,
    1.0,
    qmin,
  );

  let scale = 1.0;
  let zeroPoint = qmin;

  if (maxVal === minVal) {
    scale = 1.0;
    zeroPoint = qmin;

    addStep(
      8,
      `Constant Input (max_val == min_val = ${minVal.toFixed(4)}) — scale=1.0, zero_point=${qmin}`,
      "When all values are identical, scale defaults to 1.0 and zero_point is set to qmin.",
      { scale: 1.0, zero_point: qmin },
      minVal,
      qmin,
      scale,
      zeroPoint,
    );
  } else {
    scale = (maxVal - minVal) / (qmax - qmin);
    const rawZ = Math.round(qmin - minVal / scale);
    zeroPoint = Math.max(qmin, Math.min(qmax, rawZ));

    addStep(
      12,
      `Compute Scale S=${scale.toFixed(6)} & Zero-Point Z=${zeroPoint}`,
      `Scale S = (${maxVal.toFixed(4)} - ${minVal.toFixed(4)}) / (${qmax} - ${qmin}) = ${scale.toFixed(6)}. Zero-point Z = clamp(round(${qmin} - ${minVal.toFixed(4)} / ${scale.toFixed(6)}), ${qmin}, ${qmax}) = ${zeroPoint}.`,
      {
        min_val: Number(minVal.toFixed(4)),
        max_val: Number(maxVal.toFixed(4)),
        scale: Number(scale.toFixed(6)),
        zero_point: zeroPoint,
      },
      minVal,
      zeroPoint,
      scale,
      zeroPoint,
    );
  }

  addStep(
    16,
    "Initialize Quantization & Dequantization Buffers",
    "Allocated empty output lists for quantized INT8 integers, dequantized FP32 floats, and absolute reconstruction errors.",
    { scale: Number(scale.toFixed(6)), zero_point: zeroPoint },
    values[0],
    0,
    scale,
    zeroPoint,
    [],
  );

  const quantized: number[] = [];
  const dequantized: number[] = [];
  const errors: number[] = [];

  for (let i = 0; i < n; i++) {
    const x = values[i];

    addStep(
      20,
      `Loop Header: Process x = ${x.toFixed(4)} (Element ${i + 1}/${n})`,
      `Inspecting continuous FP32 scalar value x = ${x.toFixed(4)}.`,
      { i, x: Number(x.toFixed(4)), scale: Number(scale.toFixed(6)), zero_point: zeroPoint },
      x,
      quantized[i - 1] ?? 0,
      scale,
      zeroPoint,
      [...quantized],
    );

    const rawQ = Math.round(x / scale) + zeroPoint;

    addStep(
      21,
      `Affine Map: q = round(${x.toFixed(4)} / ${scale.toFixed(6)}) + ${zeroPoint} = ${rawQ}`,
      `Divided ${x.toFixed(4)} by scale ${scale.toFixed(6)}, rounded to integer, and shifted by zero-point offset ${zeroPoint}.`,
      { i, x: Number(x.toFixed(4)), raw_q: rawQ },
      x,
      rawQ,
      scale,
      zeroPoint,
      [...quantized],
    );

    const qClamped = Math.max(qmin, Math.min(qmax, rawQ));

    addStep(
      22,
      `Clamp INT8 Bounds: clamp(${rawQ}, ${qmin}, ${qmax}) = ${qClamped}`,
      qClamped !== rawQ
        ? `Value ${rawQ} exceeded integer grid limits [${qmin}, ${qmax}] and was clamped to ${qClamped}.`
        : `Value ${rawQ} falls strictly within integer grid limits [${qmin}, ${qmax}].`,
      { i, raw_q: rawQ, q_clamped: qClamped },
      x,
      qClamped,
      scale,
      zeroPoint,
      [...quantized],
    );

    const xRecon = (qClamped - zeroPoint) * scale;
    const err = Math.abs(x - xRecon);

    addStep(
      23,
      `Dequantize & Error: x_recon = (${qClamped} - ${zeroPoint}) * ${scale.toFixed(6)} = ${xRecon.toFixed(4)} (err = ${err.toFixed(4)})`,
      `Reconstructed continuous float approximation x_recon = ${xRecon.toFixed(4)} with error |${x.toFixed(4)} - ${xRecon.toFixed(4)}| = ${err.toFixed(4)}.`,
      { i, q_clamped: qClamped, x_recon: Number(xRecon.toFixed(4)), err: Number(err.toFixed(4)) },
      x,
      qClamped,
      scale,
      zeroPoint,
      [...quantized],
    );

    quantized.push(qClamped);
    dequantized.push(Number(xRecon.toFixed(4)));
    errors.push(err);

    addStep(
      25,
      `Append Quantized Output: [${quantized.join(", ")}]`,
      `Stored quantized integer ${qClamped} into output array at index ${i}.`,
      { i, q_clamped: qClamped, count: quantized.length },
      x,
      qClamped,
      scale,
      zeroPoint,
      [...quantized],
    );
  }

  const maxError = Math.max(...errors);

  addStep(
    29,
    `Return Quantization Summary: Scale=${scale.toFixed(6)}, Zero-Point=${zeroPoint}, Max Error=${maxError.toFixed(4)}`,
    `Completed asymmetric affine INT8 quantization & dequantization across all ${n} elements. Max reconstruction error = ${maxError.toFixed(4)}.`,
    {
      scale: Number(scale.toFixed(6)),
      zero_point: zeroPoint,
      max_error: Number(maxError.toFixed(4)),
      quantized_count: quantized.length,
    },
    values[n - 1],
    quantized[n - 1],
    scale,
    zeroPoint,
    [...quantized],
  );

  return steps;
};

const AFFINE_QUANTIZATION_SQ8_TRIVIA: TriviaMeta = {
  skipLines: [1],
  distractors: [
    "scale = (max_val - min_val) * (qmax - qmin)",
    "zero_point = round(min_val * scale)",
    "q_clamped = round(x * scale)",
    "x_recon = q_clamped * zero_point",
  ],
  hints: [
    {
      line: 12,
      hint: "Quantization scale S maps the real value interval [min, max] uniformly to integer grid span [qmin, qmax].",
    },
    {
      line: 13,
      hint: "Zero-point Z maps real 0.0 exactly to an integer value in [qmin, qmax], avoiding precision loss for zero-padding.",
    },
    {
      line: 23,
      hint: "Dequantization reconstructs continuous floating point approximation: x_hat = (q - Z) * S.",
    },
  ],
  lineExplanations: {
    1: "Defines asymmetric affine INT8/UINT8 quantization and dequantization engine.",
    5: "Finds minimum and maximum continuous floating point values in input tensor.",
    12: "Derives FP32 scale factor S and integer zero-point Z.",
    20: "Loops over continuous values to calculate quantized integer q and clamped value.",
    23: "Reconstructs FP32 value and evaluates dequantization reconstruction error.",
    29: "Returns dictionary containing scale, zero_point, quantized INT8 array, dequantized values, and max error.",
  },
};

export const affineQuantizationSq8: AlgorithmDefinition<AffineQuantizationInput> = {
  id: "affine-quantization-sq8",
  title: "Asymmetric Affine INT8 Quantization & Dequantization",
  topicIds: ["ml_precision_quantization"],
  difficulty: "Medium",
  description:
    "Quantizes continuous FP32 tensor values into asymmetric 8-bit integers (INT8/UINT8) using scale S and zero-point Z parameters, evaluating reconstruction error during dequantization.",
  constraints: ["qmin < qmax", "values contains valid non-infinite numbers"],
  examples: [
    {
      kind: "basic",
      title: "Standard Asymmetric INT8 Quantization ([-128, 127])",
      inputDisplay: "values = [-2.5, 0.0, 1.2, 3.8, 5.0], qmin = -128, qmax = 127",
      outputDisplay: "scale ≈ 0.0294, zero_point = -43, max_error ≈ 0.0147",
      input: DEFAULT_AFFINE_QUANTIZATION_INPUT,
      output:
        "{scale: 0.029412, zero_point: -43, quantized: [-128, -43, -2, 86, 127], max_error: 0.0147}",
      explanation:
        "Maps range [-2.5, 5.0] to [-128, 127]. Scale S = 7.5 / 255 = 0.029412. Zero-point Z = round(-128 - (-2.5/0.029412)) = -43.",
    },
    {
      kind: "complex",
      title: "Unsigned UINT8 Quantization ([0, 255])",
      inputDisplay: "values = [-10.0, 0.0, 15.0, 30.0], qmin = 0, qmax = 255",
      outputDisplay: "scale ≈ 0.1569, zero_point = 64",
      input: {
        values: [-10.0, 0.0, 15.0, 30.0],
        qmin: 0,
        qmax: 255,
      },
      output: "{scale: 0.156863, zero_point: 64, quantized: [0, 64, 160, 255]}",
      explanation:
        "UINT8 mapping maps -10.0 to 0 and 30.0 to 255. Zero-point 64 represents real value 0.0.",
    },
    {
      kind: "negative",
      title: "Empty Values Array",
      inputDisplay: "values = []",
      outputDisplay: "scale = 1.0, zero_point = 0, max_error = 0.0",
      input: {
        values: [],
        qmin: -128,
        qmax: 127,
      },
      output: "{scale: 1.0, zero_point: 0, max_error: 0.0}",
      explanation: "Empty vector yields default scale and zero point.",
    },
  ],
  code: AFFINE_QUANTIZATION_SQ8_CODE,
  timeComplexity: {
    best: "O(N)",
    average: "O(N)",
    worst: "O(N)",
  },
  spaceComplexity: "O(N)",
  complexityAnalysis: {
    time: "Requires two linear passes over N elements (one for min/max extraction, one for quantization mapping), completing in O(N) time.",
    space: "Allocates output vectors for quantized integer representation and dequantized floats.",
  },
  topicGuide: {
    overview:
      "Asymmetric Affine Quantization (PyTorch `torch.quantize_per_tensor`, ONNX QuantizeLinear) maps continuous float range [min, max] to discrete integer range [qmin, qmax] via affine transform q = clamp(round(x / S) + Z). The zero-point Z guarantees that exact real 0.0 maps to an integer, enabling exact zero-padding without numerical error.",
    sections: [
      {
        heading: "Scale and Zero-Point Equations",
        body: "Scale S = (max - min) / (qmax - qmin). Zero-point Z = round(qmin - min / S). Dequantization formula: x_recon = (q - Z) * S.",
      },
      {
        heading: "Symmetric vs Asymmetric Quantization",
        body: "Symmetric quantization forces Z=0 (used heavily in weight quantization for hardware simplicity). Asymmetric quantization allows Z != 0, essential for non-symmetric activation distributions (e.g. post-ReLU activations [0, max]).",
      },
    ],
    keyTerms: [
      {
        term: "Affine Quantization",
        definition:
          "Quantization scheme incorporating both a scale factor S and integer shift zero-point Z.",
      },
      {
        term: "Zero-Point (Z)",
        definition: "Integer value representing real float zero in quantized space.",
      },
    ],
  },
  trivia: AFFINE_QUANTIZATION_SQ8_TRIVIA,
  sources: [{ type: "ml_infra", kind: "ml_infra", label: "ML Infra" }],
  defaultInput: DEFAULT_AFFINE_QUANTIZATION_INPUT,
  generateSteps: generateAffineQuantizationSq8Steps,
};
