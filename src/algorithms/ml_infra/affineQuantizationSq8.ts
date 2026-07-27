import type { AlgorithmDefinition, AlgorithmStep, ArrayElement } from "../../types/dsa";
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

export const generateAffineQuantizationSq8Steps = (
  input: AffineQuantizationInput,
): AlgorithmStep[] => {
  const steps: AlgorithmStep[] = [];
  let stepIndex = 0;

  const { values, qmin, qmax } = input;
  const n = values.length;

  const initialElements: ArrayElement[] = values.map((val, idx) => ({
    id: `val-${idx}`,
    value: Number(val.toFixed(2)),
    state: "default",
    pointers: [`x_${idx}`],
  }));

  const addStep = (
    codeLine: number,
    what: string,
    why: string,
    variables: Record<string, string | number | boolean>,
    customElements?: ArrayElement[],
    customState?: Record<string, string | number>,
  ) => {
    steps.push({
      stepIndex: stepIndex++,
      codeLine,
      explanation: { what, why },
      primarySnapshot: {
        kind: "array",
        elements: (customElements || initialElements).map((el) => ({
          ...el,
          pointers: el.pointers ? [...el.pointers] : undefined,
        })),
      },
      auxiliaryState: {
        customState: customState || {
          targetFormat: `Range [${qmin}, ${qmax}]`,
          numElements: n,
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
      3,
      "Empty input values array",
      "Returning default scale 1.0 and zero_point 0 for empty vector.",
      { scale: 1.0, zero_point: 0, max_error: 0 },
      [],
      { scale: 1.0, zero_point: 0 },
    );
    return steps;
  }

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  let scale = 1.0;
  let zeroPoint = qmin;

  if (maxVal === minVal) {
    scale = 1.0;
    zeroPoint = qmin;
  } else {
    scale = (maxVal - minVal) / (qmax - qmin);
    const rawZ = Math.round(qmin - minVal / scale);
    zeroPoint = Math.max(qmin, Math.min(qmax, rawZ));
  }

  addStep(
    10,
    `Compute Scale S=${scale.toFixed(6)} & Zero-Point Z=${zeroPoint}`,
    `Extracted min=${minVal.toFixed(2)}, max=${maxVal.toFixed(2)}. Derived scale S=(max-min)/(qmax-qmin)=${scale.toFixed(
      6,
    )} and zero-point Z=${zeroPoint}.`,
    { minVal, maxVal, scale: Number(scale.toFixed(6)), zeroPoint },
    initialElements.map((el) => ({ ...el, state: "active" })),
    { minVal, maxVal, scale: scale.toFixed(6), zeroPoint },
  );

  const quantized: number[] = [];
  const dequantized: number[] = [];
  const errors: number[] = [];

  for (let i = 0; i < n; i++) {
    const x = values[i];
    const rawQ = Math.round(x / scale) + zeroPoint;
    const qClamped = Math.max(qmin, Math.min(qmax, rawQ));
    const xRecon = (qClamped - zeroPoint) * scale;
    const err = Math.abs(x - xRecon);

    quantized.push(qClamped);
    dequantized.push(Number(xRecon.toFixed(4)));
    errors.push(err);
  }

  const maxError = Math.max(...errors);

  const finalElements: ArrayElement[] = quantized.map((q, idx) => ({
    id: `q-${idx}`,
    value: q,
    state: "sorted",
    pointers: [`q=${q}`, `~${dequantized[idx]}`],
  }));

  addStep(
    20,
    `Quantize & Dequantize All Elements (Max Reconstruction Error = ${maxError.toFixed(4)})`,
    `Successfully mapped continuous floats to INT8 integers. Max quantization error = ${maxError.toFixed(
      4,
    )}.`,
    {
      scale: Number(scale.toFixed(6)),
      zero_point: zeroPoint,
      max_error: Number(maxError.toFixed(4)),
    },
    finalElements,
    {
      scale: scale.toFixed(6),
      zero_point: zeroPoint,
      quantized: `[${quantized.join(", ")}]`,
      max_error: maxError.toFixed(4),
    },
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
      line: 10,
      hint: "Quantization scale S maps the real value interval [min, max] uniformly to integer grid span [qmin, qmax].",
    },
    {
      line: 11,
      hint: "Zero-point Z maps real 0.0 exactly to an integer value in [qmin, qmax], avoiding precision loss for zero-padding.",
    },
    {
      line: 20,
      hint: "Dequantization reconstructs continuous floating point approximation: x_hat = (q - Z) * S.",
    },
  ],
  lineExplanations: {
    1: "Defines asymmetric affine INT8/UINT8 quantization and dequantization engine.",
    5: "Finds minimum and maximum continuous floating point values in input tensor.",
    10: "Derives FP32 scale factor S and integer zero-point Z.",
    20: "Maps continuous values to clamped integers q in [qmin, qmax] and evaluates dequantization reconstruction error.",
  },
};

export const affineQuantizationSq8: AlgorithmDefinition<AffineQuantizationInput> = {
  id: "affine-quantization-sq8",
  title: "Asymmetric Affine INT8 Quantization & Dequantization",
  category: "ml_precision_quantization",
  difficulty: "Medium",
  isMlInfra: true,
  mlInfraLevel: 3,
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
