import React, { useState, useMemo } from "react";
import { HARDWARE_TARGETS, HardwareTarget } from "../../curriculum/performanceProfiler";

export type QuantizationFormat =
  | "fp32"
  | "fp16"
  | "bf16"
  | "fp8_e4m3"
  | "fp8_e5m2"
  | "int8"
  | "int4";

export type QuantizationScheme = "symmetric" | "asymmetric";

export type QuantizationGranularity =
  | "per_tensor"
  | "per_channel"
  | "group_32"
  | "group_64"
  | "group_128";

export type DistributionType = "gaussian" | "uniform" | "outlier" | "custom";

export type ClippingMode = "none" | "percentile_99_9" | "percentile_99_5" | "percentile_99";

export interface FormatConfig {
  format: QuantizationFormat;
  name: string;
  shortName: string;
  bits: number;
  bytesPerElement: number;
  isInteger: boolean;
  signBits: number;
  expBits: number;
  mantissaBits: number;
  exponentBias?: number;
  dynamicRange: [number, number];
  qmin: number;
  qmax: number;
  description: string;
  standardUseCases: string[];
}

export const FORMAT_CONFIGS: Record<QuantizationFormat, FormatConfig> = {
  fp32: {
    format: "fp32",
    name: "FP32 (Single Precision IEEE-754)",
    shortName: "FP32",
    bits: 32,
    bytesPerElement: 4,
    isInteger: false,
    signBits: 1,
    expBits: 8,
    mantissaBits: 23,
    exponentBias: 127,
    dynamicRange: [-3.4028235e38, 3.4028235e38],
    qmin: -2147483648,
    qmax: 2147483647,
    description:
      "IEEE-754 standard single-precision float. Golden baseline for deep learning training, master weights, and high-precision loss scaling.",
    standardUseCases: [
      "Master Weight Accumulator",
      "Loss Scaling Reference",
      "High-Precision Baseline",
    ],
  },
  fp16: {
    format: "fp16",
    name: "FP16 (Half Precision IEEE-754)",
    shortName: "FP16",
    bits: 16,
    bytesPerElement: 2,
    isInteger: false,
    signBits: 1,
    expBits: 5,
    mantissaBits: 10,
    exponentBias: 15,
    dynamicRange: [-65504, 65504],
    qmin: -32768,
    qmax: 32767,
    description:
      "IEEE-754 half-precision standard float. Industry standard for mixed-precision training and fast tensor core inference.",
    standardUseCases: ["Mixed-Precision GEMM", "KV Cache Storage", "Standard LLM Inference"],
  },
  bf16: {
    format: "bf16",
    name: "BF16 (Brain Floating Point 16)",
    shortName: "BF16",
    bits: 16,
    bytesPerElement: 2,
    isInteger: false,
    signBits: 1,
    expBits: 8,
    mantissaBits: 7,
    exponentBias: 127,
    dynamicRange: [-3.3895314e38, 3.3895314e38],
    qmin: -32768,
    qmax: 32767,
    description:
      "Truncated FP32 format preserving the 8-bit dynamic range to eliminate gradient underflow and loss scaling requirements during large-scale pretraining.",
    standardUseCases: [
      "Large-Scale Transformer Pretraining",
      "Megatron-LM",
      "FlashAttention Kernels",
    ],
  },
  fp8_e4m3: {
    format: "fp8_e4m3",
    name: "FP8 E4M3 (Hopper/Ada OCP FP8)",
    shortName: "FP8 E4M3",
    bits: 8,
    bytesPerElement: 1,
    isInteger: false,
    signBits: 1,
    expBits: 4,
    mantissaBits: 3,
    exponentBias: 7,
    dynamicRange: [-448, 448],
    qmin: -128,
    qmax: 127,
    description:
      "Higher-precision 8-bit float optimized for GEMM forward activations and weights on NVIDIA Hopper/Ada architectures.",
    standardUseCases: [
      "Hopper Tensor Core GEMM",
      "Forward Pass Activations & Weights",
      "vLLM FP8 Serving",
    ],
  },
  fp8_e5m2: {
    format: "fp8_e5m2",
    name: "FP8 E5M2 (Hybrid FP8 for Gradients)",
    shortName: "FP8 E5M2",
    bits: 8,
    bytesPerElement: 1,
    isInteger: false,
    signBits: 1,
    expBits: 5,
    mantissaBits: 2,
    exponentBias: 15,
    dynamicRange: [-57344, 57344],
    qmin: -128,
    qmax: 127,
    description:
      "Higher dynamic range 8-bit float with 5 exponent bits matching FP16, tailored for backward pass gradients and optimizer states.",
    standardUseCases: [
      "Hopper Backward Pass Gradients",
      "Optimizer States",
      "Dynamic Range Sensitive Ops",
    ],
  },
  int8: {
    format: "int8",
    name: "INT8 (8-bit Signed Integer)",
    shortName: "INT8",
    bits: 8,
    bytesPerElement: 1,
    isInteger: true,
    signBits: 1,
    expBits: 0,
    mantissaBits: 0,
    dynamicRange: [-128, 127],
    qmin: -128,
    qmax: 127,
    description:
      "8-bit uniform integer quantization with affine scale and zero-point. Delivers 4x memory savings vs FP32 and high-throughput INT8 Tensor Core speed.",
    standardUseCases: [
      "SmoothQuant W8A8 LLM Inference",
      "TensorRT INT8",
      "Quantization-Aware Training (QAT)",
    ],
  },
  int4: {
    format: "int4",
    name: "INT4 (4-bit Uniform Integer)",
    shortName: "INT4",
    bits: 4,
    bytesPerElement: 0.5,
    isInteger: true,
    signBits: 1,
    expBits: 0,
    mantissaBits: 0,
    dynamicRange: [-8, 7],
    qmin: -8,
    qmax: 7,
    description:
      "Ultra-dense 4-bit integer quantization with group-wise scaling (AWQ/GPTQ). Yields 8x memory footprint reduction and massive bandwidth speedups for memory-bound LLM decode.",
    standardUseCases: [
      "AWQ Weight-Only LLM Inference",
      "GPTQ 4-Bit Execution",
      "llama.cpp GGUF Q4 Quantization",
    ],
  },
};

export interface QuantizationConfig {
  format: QuantizationFormat;
  scheme: QuantizationScheme;
  granularity: QuantizationGranularity;
  clippingMode?: ClippingMode;
  customScale?: number;
  customZeroPoint?: number;
  groupSize?: number;
}

export interface ScaleZeroPoint {
  scale: number;
  zeroPoint: number;
  qmin: number;
  qmax: number;
  minVal: number;
  maxVal: number;
}

export interface QuantizedTensorResult {
  original: number[];
  quantizedRaw: number[];
  dequantized: number[];
  errors: number[];
  scales: number[];
  zeroPoints: number[];
  config: QuantizationConfig;
}

export interface QuantizationMetrics {
  mse: number;
  rmse: number;
  mae: number;
  maxError: number;
  snrDb: number;
  sqnrDb: number;
  cosineSim: number;
  compressionRatio: number;
  memoryFootprintBytes: number;
  originalFootprintBytes: number;
  bandwidthSpeedup: number;
  rooflineShiftFactor: number;
  effectiveBandwidthGBs: number;
}

export interface HistogramBin {
  min: number;
  max: number;
  count: number;
  percentage: number;
  isZeroBin: boolean;
}

export interface FloatBitDecomposition {
  format: QuantizationFormat;
  originalValue: number;
  reconstructedValue: number;
  sign: number;
  exponent: number;
  mantissa: number;
  signBitStr: string;
  exponentBitStr: string;
  mantissaBitStr: string;
  fullBitStr: string;
  hexStr: string;
  isSubnormal: boolean;
  isInfinity: boolean;
  isNaN: boolean;
  exponentBias: number;
  unbiasedExponent: number;
}

export interface IntBitDecomposition {
  bits: number;
  originalValue: number;
  decimal: number;
  bitStr: string;
  hexStr: string;
  isNegative: boolean;
  signBitStr: string;
  magnitudeBitStr: string;
}

export interface QuantizationPreset {
  id: string;
  name: string;
  description: string;
  format: QuantizationFormat;
  scheme: QuantizationScheme;
  granularity: QuantizationGranularity;
  distribution: DistributionType;
  hardwareTargetId: string;
  outlierRatio?: number;
  outlierMagnitude?: number;
  groupSize?: number;
}

export const QUANTIZATION_PRESETS: Record<string, QuantizationPreset> = {
  llm_int4_awq: {
    id: "llm_int4_awq",
    name: "LLM Weight-Only INT4 (AWQ / GPTQ)",
    description:
      "Weight-only 4-bit integer quantization with group size 64/128, preserving salient weights to eliminate perplexity degradation while unlocking 3.5x-4x memory bandwidth speedup in LLM token generation.",
    format: "int4",
    scheme: "asymmetric",
    granularity: "group_64",
    distribution: "outlier",
    hardwareTargetId: "nvidia_h100_sxm5",
    outlierRatio: 0.02,
    outlierMagnitude: 8.0,
    groupSize: 64,
  },
  fp8_hopper_gemm: {
    id: "fp8_hopper_gemm",
    name: "FP8 Hopper GEMM (W8A8 FP8 E4M3)",
    description:
      "Hopper Tensor Core FP8 GEMM engine utilizing E4M3 for forward activations and weights with dynamic delayed scaling, unlocking 2x compute throughput (3958 TFLOP/s) over FP16.",
    format: "fp8_e4m3",
    scheme: "symmetric",
    granularity: "per_tensor",
    distribution: "gaussian",
    hardwareTargetId: "nvidia_h100_sxm5",
  },
  smoothquant_int8: {
    id: "smoothquant_int8",
    name: "SmoothQuant INT8 (W8A8 Symmetric)",
    description:
      "W8A8 INT8 quantization for LLMs migrating activation outlier difficulty into weights via per-channel scaling transforms, enabling efficient INT8 Tensor Core execution.",
    format: "int8",
    scheme: "symmetric",
    granularity: "per_tensor",
    distribution: "outlier",
    hardwareTargetId: "nvidia_a100_sxm4_80gb",
    outlierRatio: 0.015,
    outlierMagnitude: 6.0,
  },
  bf16_mixed_precision: {
    id: "bf16_mixed_precision",
    name: "BF16 Mixed-Precision Training Baseline",
    description:
      "Standard Bfloat16 format with 8-bit dynamic range matching FP32, eliminating underflow scaling issues in large-scale transformer pretraining.",
    format: "bf16",
    scheme: "symmetric",
    granularity: "per_tensor",
    distribution: "gaussian",
    hardwareTargetId: "nvidia_h100_sxm5",
  },
  fp16_standard_inference: {
    id: "fp16_standard_inference",
    name: "FP16 Standard Inference Baseline",
    description:
      "IEEE-754 Half Precision baseline used extensively across desktop and datacenter inference engines.",
    format: "fp16",
    scheme: "symmetric",
    granularity: "per_tensor",
    distribution: "gaussian",
    hardwareTargetId: "apple_m3_max",
  },
};

/* =========================================================================
   Mathematical Conversion & Bit-Level Encoding / Decoding Functions
   ========================================================================= */

const f32Buf = new Float32Array(1);
const u32Buf = new Uint32Array(f32Buf.buffer);

export function floatToUint32(val: number): number {
  f32Buf[0] = val;
  return u32Buf[0];
}

export function uint32ToFloat(u: number): number {
  u32Buf[0] = u;
  return f32Buf[0];
}

/**
 * IEEE-754 FP16 (Half Precision) Encoder
 */
export function floatToFp16Uint(val: number): number {
  f32Buf[0] = val;
  const u = u32Buf[0];

  const sign = (u >>> 31) & 0x1;
  const exp = (u >>> 23) & 0xff;
  const mant = u & 0x7fffff;

  if (exp === 0xff) {
    if (mant !== 0) return (sign << 15) | 0x7e00 | (mant >>> 13);
    return (sign << 15) | 0x7c00;
  }

  if (exp === 0 && mant === 0) {
    return sign << 15;
  }

  const newExp = exp - 127 + 15;

  if (newExp >= 31) {
    return (sign << 15) | 0x7bff; // Clamp to 65504
  }

  if (newExp <= 0) {
    if (newExp < -10) return sign << 15;
    const fullMant = mant | 0x800000;
    const shift = 14 - newExp;
    const subMant = (fullMant >>> shift) + ((fullMant >>> (shift - 1)) & 1);
    return (sign << 15) | (subMant & 0x3ff);
  }

  const roundBit = (mant >>> 12) & 1;
  let newMant = (mant >>> 13) + roundBit;
  let finalExp = newExp;

  if (newMant > 0x3ff) {
    newMant = 0;
    finalExp += 1;
    if (finalExp >= 31) return (sign << 15) | 0x7bff;
  }

  return (sign << 15) | (finalExp << 10) | (newMant & 0x3ff);
}

/**
 * IEEE-754 FP16 (Half Precision) Decoder
 */
export function fp16UintToFloat(u16: number): number {
  const sign = (u16 >>> 15) & 0x1;
  const exp = (u16 >>> 10) & 0x1f;
  const mant = u16 & 0x3ff;
  const signMul = sign === 1 ? -1 : 1;

  if (exp === 31) {
    if (mant !== 0) return NaN;
    return signMul * Infinity;
  }
  if (exp === 0) {
    if (mant === 0) return sign === 1 ? -0 : 0;
    return signMul * Math.pow(2, -14) * (mant / 1024);
  }
  return signMul * Math.pow(2, exp - 15) * (1 + mant / 1024);
}

/**
 * BF16 (Brain Float 16) Encoder (Round-to-Nearest-Even)
 */
export function floatToBf16Uint(val: number): number {
  f32Buf[0] = val;
  const u = u32Buf[0];
  const lsb = (u >>> 16) & 1;
  const roundingBias = 0x7fff + lsb;
  const rounded = (u + roundingBias) >>> 16;
  return rounded & 0xffff;
}

/**
 * BF16 (Brain Float 16) Decoder
 */
export function bf16UintToFloat(u16: number): number {
  u32Buf[0] = (u16 & 0xffff) << 16;
  return f32Buf[0];
}

/**
 * OCP FP8 E4M3 Encoder (Max finite = 448)
 */
export function floatToFp8E4M3Uint(val: number): number {
  if (isNaN(val)) return 0x7f;
  const sign = val < 0 || Object.is(val, -0) ? 1 : 0;
  const absVal = Math.abs(val);

  if (absVal === 0) return sign << 7;
  if (absVal >= 448) return (sign << 7) | 0x7e; // Max finite 448

  const exp = Math.floor(Math.log2(absVal));
  let biasedExp = exp + 7;

  if (biasedExp <= 0) {
    const mant = Math.round(absVal / Math.pow(2, -9));
    if (mant <= 0) return sign << 7;
    if (mant >= 8) return (sign << 7) | (1 << 3);
    return (sign << 7) | (mant & 0x7);
  }

  if (biasedExp >= 15) {
    biasedExp = 15;
    let mant = Math.round((absVal / Math.pow(2, 8) - 1) * 8);
    if (mant > 6) mant = 6;
    if (mant < 0) mant = 0;
    return (sign << 7) | (15 << 3) | mant;
  }

  const normVal = absVal / Math.pow(2, biasedExp - 7);
  let mant = Math.round((normVal - 1) * 8);
  if (mant >= 8) {
    mant = 0;
    biasedExp += 1;
    if (biasedExp >= 15) {
      biasedExp = 15;
      mant = 6;
    }
  }

  return (sign << 7) | ((biasedExp & 0xf) << 3) | (mant & 0x7);
}

/**
 * OCP FP8 E4M3 Decoder
 */
export function fp8E4M3UintToFloat(u8: number): number {
  const sign = (u8 >>> 7) & 0x1;
  const exp = (u8 >>> 3) & 0xf;
  const mant = u8 & 0x7;
  const signMul = sign === 1 ? -1 : 1;

  if (exp === 15 && mant === 7) return NaN;
  if (exp === 0) {
    if (mant === 0) return sign === 1 ? -0 : 0;
    return signMul * Math.pow(2, -6) * (mant / 8);
  }
  return signMul * Math.pow(2, exp - 7) * (1 + mant / 8);
}

/**
 * OCP FP8 E5M2 Encoder (Max finite = 57344)
 */
export function floatToFp8E5M2Uint(val: number): number {
  if (isNaN(val)) return 0x7f;
  const sign = val < 0 || Object.is(val, -0) ? 1 : 0;
  const absVal = Math.abs(val);

  if (absVal === 0) return sign << 7;
  if (absVal >= 57344) return (sign << 7) | 0x7b; // Max finite 57344

  const exp = Math.floor(Math.log2(absVal));
  let biasedExp = exp + 15;

  if (biasedExp <= 0) {
    const mant = Math.round(absVal / Math.pow(2, -16));
    if (mant <= 0) return sign << 7;
    if (mant >= 4) return (sign << 7) | (1 << 2);
    return (sign << 7) | (mant & 0x3);
  }

  if (biasedExp >= 31) {
    return (sign << 7) | 0x7b;
  }

  const normVal = absVal / Math.pow(2, biasedExp - 15);
  let mant = Math.round((normVal - 1) * 4);
  if (mant >= 4) {
    mant = 0;
    biasedExp += 1;
    if (biasedExp >= 31) {
      biasedExp = 30;
      mant = 3;
    }
  }

  return (sign << 7) | ((biasedExp & 0x1f) << 2) | (mant & 0x3);
}

/**
 * OCP FP8 E5M2 Decoder
 */
export function fp8E5M2UintToFloat(u8: number): number {
  const sign = (u8 >>> 7) & 0x1;
  const exp = (u8 >>> 2) & 0x1f;
  const mant = u8 & 0x3;
  const signMul = sign === 1 ? -1 : 1;

  if (exp === 31) {
    if (mant !== 0) return NaN;
    return signMul * Infinity;
  }
  if (exp === 0) {
    if (mant === 0) return sign === 1 ? -0 : 0;
    return signMul * Math.pow(2, -14) * (mant / 4);
  }
  return signMul * Math.pow(2, exp - 15) * (1 + mant / 4);
}

/* =========================================================================
   Scale and Zero-Point Calibration
   ========================================================================= */

export function computeQuantizationScaleZeroPoint(
  values: number[],
  qmin: number,
  qmax: number,
  symmetric: boolean = true,
  clipPercentile?: ClippingMode,
): ScaleZeroPoint {
  if (values.length === 0) {
    return { scale: 1.0, zeroPoint: 0, qmin, qmax, minVal: 0, maxVal: 0 };
  }

  let minVal = Infinity;
  let maxVal = -Infinity;

  if (clipPercentile && clipPercentile !== "none" && values.length >= 20) {
    const sorted = [...values].sort((a, b) => a - b);
    let pLow = 0;
    let pHigh = sorted.length - 1;

    if (clipPercentile === "percentile_99_9") {
      pLow = Math.floor(sorted.length * 0.0005);
      pHigh = Math.ceil(sorted.length * 0.9995) - 1;
    } else if (clipPercentile === "percentile_99_5") {
      pLow = Math.floor(sorted.length * 0.0025);
      pHigh = Math.ceil(sorted.length * 0.9975) - 1;
    } else if (clipPercentile === "percentile_99") {
      pLow = Math.floor(sorted.length * 0.005);
      pHigh = Math.ceil(sorted.length * 0.995) - 1;
    }

    minVal = sorted[Math.max(0, Math.min(sorted.length - 1, pLow))];
    maxVal = sorted[Math.max(0, Math.min(sorted.length - 1, pHigh))];
  } else {
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    }
  }

  if (minVal === Infinity || maxVal === -Infinity) {
    minVal = 0;
    maxVal = 0;
  }

  let scale = 1.0;
  let zeroPoint = 0;

  if (symmetric) {
    const maxAbs = Math.max(Math.abs(minVal), Math.abs(maxVal));
    const targetQmax = Math.max(Math.abs(qmin), Math.abs(qmax));
    scale = maxAbs === 0 ? 1.0 : maxAbs / targetQmax;
    zeroPoint = 0;
  } else {
    if (maxVal === minVal) {
      scale = 1.0;
      zeroPoint = qmin;
    } else {
      scale = (maxVal - minVal) / (qmax - qmin);
      const computedZ = Math.round(-minVal / scale) + qmin;
      zeroPoint = Math.max(qmin, Math.min(qmax, computedZ));
    }
  }

  if (scale <= 1e-12) {
    scale = 1e-12;
  }

  return { scale, zeroPoint, qmin, qmax, minVal, maxVal };
}

/* =========================================================================
   Single Value & Full Tensor Quantization / Dequantization
   ========================================================================= */

export function quantizeAndDequantizeValue(
  x: number,
  format: QuantizationFormat,
  scale: number = 1.0,
  zeroPoint: number = 0,
): { quantizedVal: number; dequantizedVal: number; error: number } {
  const cfg = FORMAT_CONFIGS[format];
  const safeScale = scale === 0 ? 1.0 : scale;

  if (cfg.isInteger) {
    const q = Math.max(cfg.qmin, Math.min(cfg.qmax, Math.round(x / safeScale) + zeroPoint));
    const dequant = (q - zeroPoint) * safeScale;
    return {
      quantizedVal: q,
      dequantizedVal: dequant,
      error: x - dequant,
    };
  }

  if (format === "fp32") {
    const dequant = Math.fround(x);
    const q = floatToUint32(dequant);
    return { quantizedVal: q, dequantizedVal: dequant, error: x - dequant };
  }

  if (format === "bf16") {
    const q = floatToBf16Uint(x);
    const dequant = bf16UintToFloat(q);
    return { quantizedVal: q, dequantizedVal: dequant, error: x - dequant };
  }

  if (format === "fp16") {
    const q = floatToFp16Uint(x);
    const dequant = fp16UintToFloat(q);
    return { quantizedVal: q, dequantizedVal: dequant, error: x - dequant };
  }

  if (format === "fp8_e4m3") {
    const scaled = x / safeScale;
    const q = floatToFp8E4M3Uint(scaled);
    const dequant = fp8E4M3UintToFloat(q) * safeScale;
    return { quantizedVal: q, dequantizedVal: dequant, error: x - dequant };
  }

  if (format === "fp8_e5m2") {
    const scaled = x / safeScale;
    const q = floatToFp8E5M2Uint(scaled);
    const dequant = fp8E5M2UintToFloat(q) * safeScale;
    return { quantizedVal: q, dequantizedVal: dequant, error: x - dequant };
  }

  return { quantizedVal: x, dequantizedVal: x, error: 0 };
}

export function quantizeAndDequantizeTensor(
  tensor: number[],
  config: QuantizationConfig,
): QuantizedTensorResult {
  const { format, scheme, granularity, clippingMode, customScale, customZeroPoint } = config;
  const cfg = FORMAT_CONFIGS[format];
  const symmetric = scheme === "symmetric";

  let groupSize = tensor.length;
  if (granularity === "group_32") groupSize = 32;
  else if (granularity === "group_64") groupSize = 64;
  else if (granularity === "group_128") groupSize = 128;
  else if (granularity === "per_channel") groupSize = config.groupSize || 64;

  const numElements = tensor.length;
  const quantizedRaw = new Array<number>(numElements);
  const dequantized = new Array<number>(numElements);
  const errors = new Array<number>(numElements);
  const scales: number[] = [];
  const zeroPoints: number[] = [];

  for (let start = 0; start < numElements; start += groupSize) {
    const end = Math.min(start + groupSize, numElements);
    const chunk = tensor.slice(start, end);

    let scale = 1.0;
    let zeroPoint = 0;

    if (customScale !== undefined) {
      scale = customScale;
      zeroPoint = customZeroPoint ?? 0;
    } else if (cfg.isInteger) {
      const calib = computeQuantizationScaleZeroPoint(
        chunk,
        cfg.qmin,
        cfg.qmax,
        symmetric,
        clippingMode,
      );
      scale = calib.scale;
      zeroPoint = calib.zeroPoint;
    } else if (format === "fp8_e4m3" || format === "fp8_e5m2") {
      const maxRepresentable = format === "fp8_e4m3" ? 448 : 57344;
      let maxAbs = 0;
      for (let i = 0; i < chunk.length; i++) {
        const a = Math.abs(chunk[i]);
        if (a > maxAbs) maxAbs = a;
      }
      scale = maxAbs === 0 ? 1.0 : maxAbs / maxRepresentable;
      zeroPoint = 0;
    }

    scales.push(scale);
    zeroPoints.push(zeroPoint);

    for (let i = start; i < end; i++) {
      const res = quantizeAndDequantizeValue(tensor[i], format, scale, zeroPoint);
      quantizedRaw[i] = res.quantizedVal;
      dequantized[i] = res.dequantizedVal;
      errors[i] = res.error;
    }
  }

  return {
    original: tensor,
    quantizedRaw,
    dequantized,
    errors,
    scales,
    zeroPoints,
    config,
  };
}

/* =========================================================================
   Metrics & Error Analysis Engine
   ========================================================================= */

export function computeQuantizationMetrics(
  original: number[],
  dequantized: number[],
  format: QuantizationFormat,
  hardwareTargetId: string = "nvidia_h100_sxm5",
): QuantizationMetrics {
  const n = original.length;
  if (n === 0) {
    return {
      mse: 0,
      rmse: 0,
      mae: 0,
      maxError: 0,
      snrDb: 100,
      sqnrDb: 100,
      cosineSim: 1,
      compressionRatio: 1,
      memoryFootprintBytes: 0,
      originalFootprintBytes: 0,
      bandwidthSpeedup: 1,
      rooflineShiftFactor: 1,
      effectiveBandwidthGBs: 0,
    };
  }

  let sumSqErr = 0;
  let sumAbsErr = 0;
  let maxErr = 0;
  let sumOrigSq = 0;
  let sumOrig = 0;
  let dotProd = 0;
  let sumQuantSq = 0;

  for (let i = 0; i < n; i++) {
    const x = original[i];
    const xHat = dequantized[i];
    const err = x - xHat;
    const absErr = Math.abs(err);
    const sqErr = err * err;

    sumSqErr += sqErr;
    sumAbsErr += absErr;
    if (absErr > maxErr) maxErr = absErr;

    sumOrigSq += x * x;
    sumOrig += x;
    dotProd += x * xHat;
    sumQuantSq += xHat * xHat;
  }

  const mse = sumSqErr / n;
  const rmse = Math.sqrt(mse);
  const mae = sumAbsErr / n;

  const meanOrig = sumOrig / n;
  let sumVar = 0;
  for (let i = 0; i < n; i++) {
    const diff = original[i] - meanOrig;
    sumVar += diff * diff;
  }
  const varianceOrig = sumVar / n;

  const signalPower = sumOrigSq / n;
  const snrDb = sumSqErr > 1e-18 ? 10 * Math.log10((signalPower + 1e-12) / (mse + 1e-18)) : 100.0;
  const sqnrDb = mse > 1e-18 ? 10 * Math.log10((varianceOrig + 1e-12) / (mse + 1e-18)) : 100.0;

  const normOrig = Math.sqrt(sumOrigSq);
  const normQuant = Math.sqrt(sumQuantSq);
  const cosineSim = normOrig > 0 && normQuant > 0 ? dotProd / (normOrig * normQuant) : 1.0;

  const cfg = FORMAT_CONFIGS[format];
  const compressionRatio = 4.0 / cfg.bytesPerElement;
  const memoryFootprintBytes = Math.ceil(n * cfg.bytesPerElement);
  const originalFootprintBytes = n * 4;
  const bandwidthSpeedup = compressionRatio;
  const rooflineShiftFactor = compressionRatio;

  const hw: HardwareTarget =
    HARDWARE_TARGETS[hardwareTargetId] || HARDWARE_TARGETS.nvidia_h100_sxm5;
  const effectiveBandwidthGBs = hw.peakMemoryBandwidthGBs * bandwidthSpeedup;

  return {
    mse,
    rmse,
    mae,
    maxError: maxErr,
    snrDb,
    sqnrDb,
    cosineSim: Math.max(-1.0, Math.min(1.0, cosineSim)),
    compressionRatio,
    memoryFootprintBytes,
    originalFootprintBytes,
    bandwidthSpeedup,
    rooflineShiftFactor,
    effectiveBandwidthGBs,
  };
}

/* =========================================================================
   Histogram Binning
   ========================================================================= */

export function computeErrorHistogram(
  original: number[],
  dequantized: number[],
  numBins: number = 15,
): HistogramBin[] {
  const n = original.length;
  if (n === 0) return [];

  const errors = new Array<number>(n);
  let minErr = Infinity;
  let maxErr = -Infinity;

  for (let i = 0; i < n; i++) {
    const e = original[i] - dequantized[i];
    errors[i] = e;
    if (e < minErr) minErr = e;
    if (e > maxErr) maxErr = e;
  }

  if (minErr === maxErr) {
    minErr -= 0.005;
    maxErr += 0.005;
  }

  const binWidth = (maxErr - minErr) / numBins;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < numBins; i++) {
    const bMin = minErr + i * binWidth;
    const bMax = minErr + (i + 1) * binWidth;
    const isZeroBin = 0 >= bMin && 0 <= bMax;
    bins.push({
      min: bMin,
      max: bMax,
      count: 0,
      percentage: 0,
      isZeroBin,
    });
  }

  for (let i = 0; i < n; i++) {
    const e = errors[i];
    let binIdx = Math.floor((e - minErr) / binWidth);
    if (binIdx >= numBins) binIdx = numBins - 1;
    if (binIdx < 0) binIdx = 0;
    bins[binIdx].count++;
  }

  for (let i = 0; i < numBins; i++) {
    bins[i].percentage = (bins[i].count / n) * 100;
  }

  return bins;
}

/* =========================================================================
   Bit Decomposition Visualizer Helpers
   ========================================================================= */

export function floatToBitDecomposition(
  val: number,
  format: QuantizationFormat,
): FloatBitDecomposition {
  const cfg = FORMAT_CONFIGS[format];
  const bias = cfg.exponentBias ?? 127;

  if (format === "fp32") {
    const dequant = Math.fround(val);
    const u = floatToUint32(dequant);
    const sign = (u >>> 31) & 1;
    const exp = (u >>> 23) & 0xff;
    const mant = u & 0x7fffff;
    return {
      format,
      originalValue: val,
      reconstructedValue: dequant,
      sign,
      exponent: exp,
      mantissa: mant,
      signBitStr: sign.toString(2),
      exponentBitStr: exp.toString(2).padStart(8, "0"),
      mantissaBitStr: mant.toString(2).padStart(23, "0"),
      fullBitStr: u.toString(2).padStart(32, "0"),
      hexStr: "0x" + u.toString(16).toUpperCase().padStart(8, "0"),
      isSubnormal: exp === 0 && mant !== 0,
      isInfinity: exp === 0xff && mant === 0,
      isNaN: exp === 0xff && mant !== 0,
      exponentBias: bias,
      unbiasedExponent: exp === 0 ? 1 - bias : exp - bias,
    };
  }

  if (format === "bf16") {
    const u = floatToBf16Uint(val);
    const dequant = bf16UintToFloat(u);
    const sign = (u >>> 15) & 1;
    const exp = (u >>> 7) & 0xff;
    const mant = u & 0x7f;
    return {
      format,
      originalValue: val,
      reconstructedValue: dequant,
      sign,
      exponent: exp,
      mantissa: mant,
      signBitStr: sign.toString(2),
      exponentBitStr: exp.toString(2).padStart(8, "0"),
      mantissaBitStr: mant.toString(2).padStart(7, "0"),
      fullBitStr: u.toString(2).padStart(16, "0"),
      hexStr: "0x" + u.toString(16).toUpperCase().padStart(4, "0"),
      isSubnormal: exp === 0 && mant !== 0,
      isInfinity: exp === 0xff && mant === 0,
      isNaN: exp === 0xff && mant !== 0,
      exponentBias: bias,
      unbiasedExponent: exp === 0 ? 1 - bias : exp - bias,
    };
  }

  if (format === "fp16") {
    const u = floatToFp16Uint(val);
    const dequant = fp16UintToFloat(u);
    const sign = (u >>> 15) & 1;
    const exp = (u >>> 10) & 0x1f;
    const mant = u & 0x3ff;
    return {
      format,
      originalValue: val,
      reconstructedValue: dequant,
      sign,
      exponent: exp,
      mantissa: mant,
      signBitStr: sign.toString(2),
      exponentBitStr: exp.toString(2).padStart(5, "0"),
      mantissaBitStr: mant.toString(2).padStart(10, "0"),
      fullBitStr: u.toString(2).padStart(16, "0"),
      hexStr: "0x" + u.toString(16).toUpperCase().padStart(4, "0"),
      isSubnormal: exp === 0 && mant !== 0,
      isInfinity: exp === 0x1f && mant === 0,
      isNaN: exp === 0x1f && mant !== 0,
      exponentBias: bias,
      unbiasedExponent: exp === 0 ? 1 - bias : exp - bias,
    };
  }

  if (format === "fp8_e4m3") {
    const u = floatToFp8E4M3Uint(val);
    const dequant = fp8E4M3UintToFloat(u);
    const sign = (u >>> 7) & 1;
    const exp = (u >>> 3) & 0xf;
    const mant = u & 0x7;
    return {
      format,
      originalValue: val,
      reconstructedValue: dequant,
      sign,
      exponent: exp,
      mantissa: mant,
      signBitStr: sign.toString(2),
      exponentBitStr: exp.toString(2).padStart(4, "0"),
      mantissaBitStr: mant.toString(2).padStart(3, "0"),
      fullBitStr: u.toString(2).padStart(8, "0"),
      hexStr: "0x" + u.toString(16).toUpperCase().padStart(2, "0"),
      isSubnormal: exp === 0 && mant !== 0,
      isInfinity: false,
      isNaN: exp === 15 && mant === 7,
      exponentBias: bias,
      unbiasedExponent: exp === 0 ? 1 - bias : exp - bias,
    };
  }

  // fp8_e5m2
  const u = floatToFp8E5M2Uint(val);
  const dequant = fp8E5M2UintToFloat(u);
  const sign = (u >>> 7) & 1;
  const exp = (u >>> 2) & 0x1f;
  const mant = u & 0x3;
  return {
    format,
    originalValue: val,
    reconstructedValue: dequant,
    sign,
    exponent: exp,
    mantissa: mant,
    signBitStr: sign.toString(2),
    exponentBitStr: exp.toString(2).padStart(5, "0"),
    mantissaBitStr: mant.toString(2).padStart(2, "0"),
    fullBitStr: u.toString(2).padStart(8, "0"),
    hexStr: "0x" + u.toString(16).toUpperCase().padStart(2, "0"),
    isSubnormal: exp === 0 && mant !== 0,
    isInfinity: exp === 31 && mant === 0,
    isNaN: exp === 31 && mant !== 0,
    exponentBias: bias,
    unbiasedExponent: exp === 0 ? 1 - bias : exp - bias,
  };
}

export function intToBitDecomposition(
  val: number,
  bits: number,
  signed: boolean = true,
): IntBitDecomposition {
  const rounded = Math.round(val);
  const qmin = signed ? -Math.pow(2, bits - 1) : 0;
  const qmax = signed ? Math.pow(2, bits - 1) - 1 : Math.pow(2, bits) - 1;
  const clamped = Math.max(qmin, Math.min(qmax, rounded));

  const rawUint = clamped < 0 ? Math.pow(2, bits) + clamped : clamped;
  const bitStr = rawUint.toString(2).padStart(bits, "0");
  const hexStr =
    "0x" +
    rawUint
      .toString(16)
      .toUpperCase()
      .padStart(Math.ceil(bits / 4), "0");

  return {
    bits,
    originalValue: val,
    decimal: clamped,
    bitStr,
    hexStr,
    isNegative: clamped < 0,
    signBitStr: bitStr[0] || "0",
    magnitudeBitStr: bitStr.slice(1),
  };
}

/* =========================================================================
   Synthetic Distribution Generator
   ========================================================================= */

function createRng(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function generateTensorData(
  distribution: DistributionType,
  size: number,
  seed: number = 42,
  outlierRatio: number = 0.02,
  outlierMagnitude: number = 8.0,
  customData?: number[],
): number[] {
  if (distribution === "custom" && customData && customData.length > 0) {
    if (customData.length === size) return [...customData];
    const out: number[] = [];
    for (let i = 0; i < size; i++) {
      out.push(customData[i % customData.length]);
    }
    return out;
  }

  const rng = createRng(seed);
  const tensor = new Array<number>(size);

  const sampleNormal = () => {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };

  if (distribution === "gaussian") {
    for (let i = 0; i < size; i++) {
      tensor[i] = sampleNormal();
    }
  } else if (distribution === "uniform") {
    for (let i = 0; i < size; i++) {
      tensor[i] = (rng() * 2 - 1) * 3.0;
    }
  } else if (distribution === "outlier") {
    for (let i = 0; i < size; i++) {
      tensor[i] = sampleNormal();
    }
    const numOutliers = Math.max(1, Math.floor(size * outlierRatio));
    for (let o = 0; o < numOutliers; o++) {
      const idx = Math.floor(rng() * size);
      const sign = rng() > 0.5 ? 1 : -1;
      tensor[idx] = sign * outlierMagnitude * (0.8 + rng() * 0.4);
    }
  } else {
    // Custom fallback pattern: multi-frequency sinusoids
    for (let i = 0; i < size; i++) {
      tensor[i] =
        Math.sin((i / size) * 4 * Math.PI) * 2.0 + Math.cos((i / size) * 10 * Math.PI) * 0.5;
    }
  }

  return tensor;
}

/* =========================================================================
   Main React Component
   ========================================================================= */

export interface QuantizationKernelWorkbenchProps {
  initialFormat?: QuantizationFormat;
  initialHardwareTarget?: string;
  initialPreset?: string;
  title?: string;
  className?: string;
}

export const QuantizationKernelWorkbench: React.FC<QuantizationKernelWorkbenchProps> = ({
  initialFormat = "int4",
  initialHardwareTarget = "nvidia_h100_sxm5",
  initialPreset = "llm_int4_awq",
  title = "Quantization Kernel & Tensor Profiling Workbench",
  className = "",
}) => {
  const [selectedFormat, setSelectedFormat] = useState<QuantizationFormat>(initialFormat);
  const [scheme, setScheme] = useState<QuantizationScheme>("asymmetric");
  const [granularity, setGranularity] = useState<QuantizationGranularity>("group_64");
  const [distribution, setDistribution] = useState<DistributionType>("outlier");
  const [hardwareTargetId, setHardwareTargetId] = useState<string>(initialHardwareTarget);
  const [tensorSize, setTensorSize] = useState<number>(128);
  const [outlierRatio, setOutlierRatio] = useState<number>(0.02);
  const [outlierMagnitude, setOutlierMagnitude] = useState<number>(8.0);
  const [clippingMode, setClippingMode] = useState<ClippingMode>("none");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset);
  const [probeValue, setProbeValue] = useState<number>(Math.PI);
  const [customInputStr, setCustomInputStr] = useState<string>(
    "-2.5, -1.0, 0.0, 0.75, 1.5, 3.8, 8.2",
  );
  const [useManualScale, setUseManualScale] = useState<boolean>(false);
  const [manualScale, setManualScale] = useState<number>(0.1);
  const [manualZeroPoint, setManualZeroPoint] = useState<number>(0);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = QUANTIZATION_PRESETS[presetId];
    if (preset) {
      setSelectedFormat(preset.format);
      setScheme(preset.scheme);
      setGranularity(preset.granularity);
      setDistribution(preset.distribution);
      setHardwareTargetId(preset.hardwareTargetId);
      if (preset.outlierRatio !== undefined) setOutlierRatio(preset.outlierRatio);
      if (preset.outlierMagnitude !== undefined) setOutlierMagnitude(preset.outlierMagnitude);
      setUseManualScale(false);
    }
  };

  const customDataParsed = useMemo(() => {
    if (distribution !== "custom") return undefined;
    return customInputStr
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
  }, [customInputStr, distribution]);

  const originalTensor = useMemo(() => {
    return generateTensorData(
      distribution,
      tensorSize,
      1337,
      outlierRatio,
      outlierMagnitude,
      customDataParsed,
    );
  }, [distribution, tensorSize, outlierRatio, outlierMagnitude, customDataParsed]);

  const quantConfig: QuantizationConfig = useMemo(() => {
    return {
      format: selectedFormat,
      scheme,
      granularity,
      clippingMode,
      customScale: useManualScale ? manualScale : undefined,
      customZeroPoint: useManualScale ? manualZeroPoint : undefined,
    };
  }, [
    selectedFormat,
    scheme,
    granularity,
    clippingMode,
    useManualScale,
    manualScale,
    manualZeroPoint,
  ]);

  const quantizedResult = useMemo(() => {
    return quantizeAndDequantizeTensor(originalTensor, quantConfig);
  }, [originalTensor, quantConfig]);

  const metrics = useMemo(() => {
    return computeQuantizationMetrics(
      quantizedResult.original,
      quantizedResult.dequantized,
      selectedFormat,
      hardwareTargetId,
    );
  }, [quantizedResult, selectedFormat, hardwareTargetId]);

  const histogramBins = useMemo(() => {
    return computeErrorHistogram(quantizedResult.original, quantizedResult.dequantized, 15);
  }, [quantizedResult]);

  const targetHw: HardwareTarget =
    HARDWARE_TARGETS[hardwareTargetId] || HARDWARE_TARGETS.nvidia_h100_sxm5;
  const currentFormatCfg = FORMAT_CONFIGS[selectedFormat];

  // Bit decomposition for probe value
  const floatBitDecomp = useMemo(() => {
    if (!currentFormatCfg.isInteger) {
      return floatToBitDecomposition(probeValue, selectedFormat);
    }
    return null;
  }, [probeValue, selectedFormat, currentFormatCfg]);

  const intBitDecomp = useMemo(() => {
    if (currentFormatCfg.isInteger) {
      const isSigned = scheme === "symmetric" || currentFormatCfg.qmin < 0;
      return intToBitDecomposition(probeValue, currentFormatCfg.bits, isSigned);
    }
    return null;
  }, [probeValue, currentFormatCfg, scheme]);

  // Scaled probe for integer / FP8 math card
  const probeMathResult = useMemo(() => {
    const scale = quantizedResult.scales[0] || 1.0;
    const zeroPoint = quantizedResult.zeroPoints[0] || 0;
    return quantizeAndDequantizeValue(probeValue, selectedFormat, scale, zeroPoint);
  }, [probeValue, selectedFormat, quantizedResult]);

  // SVG Chart Geometry
  const histW = 540;
  const histH = 200;
  const histPad = { top: 20, right: 20, bottom: 35, left: 45 };
  const histPlotW = histW - histPad.left - histPad.right;
  const histPlotH = histH - histPad.top - histPad.bottom;

  const maxHistPct = Math.max(5, ...histogramBins.map((b) => b.percentage));

  const compW = 540;
  const compH = 200;
  const compPad = { top: 20, right: 20, bottom: 35, left: 45 };
  const compPlotW = compW - compPad.left - compPad.right;
  const compPlotH = compH - compPad.top - compPad.bottom;

  let compMinVal = Math.min(...originalTensor, ...quantizedResult.dequantized);
  let compMaxVal = Math.max(...originalTensor, ...quantizedResult.dequantized);
  if (compMinVal === compMaxVal) {
    compMinVal -= 1;
    compMaxVal += 1;
  }

  const sampleCountToPlot = Math.min(64, originalTensor.length);
  const compStepX = compPlotW / Math.max(1, sampleCountToPlot - 1);

  return (
    <div
      data-testid="quantization-kernel-workbench"
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#090d16",
        borderRadius: "14px",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.95)",
          borderBottom: "1px solid rgba(56, 189, 248, 0.2)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "11px",
                fontWeight: 800,
                color: "#090d16",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Kernel Profiler
            </span>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 800, color: "#38bdf8" }}>
              {title}
            </h2>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Real-time Affine Quantization, IEEE/OCP Bit Decomposition, Error Distribution, and
            Hardware Roofline Speedup Modeling
          </p>
        </div>

        {/* Hardware Target Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
            Silicon Target:
          </span>
          <select
            value={hardwareTargetId}
            onChange={(e) => setHardwareTargetId(e.target.value)}
            style={{
              padding: "6px 12px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {Object.values(HARDWARE_TARGETS).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.peakMemoryBandwidthGBs} GB/s)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Presets Pill Bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "10px 24px",
          background: "rgba(30, 41, 59, 0.4)",
          borderBottom: "1px solid #1e293b",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
          Scenario Presets:
        </span>
        {Object.values(QUANTIZATION_PRESETS).map((p) => {
          const isActive = selectedPresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p.id)}
              style={{
                padding: "5px 12px",
                background: isActive ? "#0284c7" : "#1e293b",
                border: isActive ? "1px solid #38bdf8" : "1px solid #334155",
                color: isActive ? "#ffffff" : "#cbd5e1",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Format Selector Ribbon */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px 24px",
          background: "rgba(15, 23, 42, 0.7)",
          borderBottom: "1px solid #1e293b",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>Numeric Format:</span>
        {(
          ["fp32", "fp16", "bf16", "fp8_e4m3", "fp8_e5m2", "int8", "int4"] as QuantizationFormat[]
        ).map((fmt) => {
          const isSel = selectedFormat === fmt;
          const cfg = FORMAT_CONFIGS[fmt];
          return (
            <button
              key={fmt}
              onClick={() => {
                setSelectedFormat(fmt);
                setSelectedPresetId("custom");
              }}
              style={{
                padding: "6px 14px",
                background: isSel ? "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)" : "#1e293b",
                border: isSel ? "1px solid #38bdf8" : "1px solid #334155",
                color: isSel ? "#ffffff" : "#cbd5e1",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: isSel ? 700 : 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>{cfg.shortName}</span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "4px",
                  background: isSel ? "rgba(255,255,255,0.2)" : "#0f172a",
                  color: isSel ? "#ffffff" : "#94a3b8",
                }}
              >
                {cfg.bits}b
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Controls Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.5)",
          borderBottom: "1px solid #1e293b",
        }}
      >
        {/* Scheme Selector */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            QUANTIZATION SCHEME
          </label>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              onClick={() => {
                setScheme("symmetric");
                setSelectedPresetId("custom");
              }}
              style={{
                flex: 1,
                padding: "6px 8px",
                background: scheme === "symmetric" ? "#0284c7" : "#1e293b",
                border: scheme === "symmetric" ? "1px solid #38bdf8" : "1px solid #334155",
                color: scheme === "symmetric" ? "#ffffff" : "#94a3b8",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Symmetric (z=0)
            </button>
            <button
              onClick={() => {
                setScheme("asymmetric");
                setSelectedPresetId("custom");
              }}
              style={{
                flex: 1,
                padding: "6px 8px",
                background: scheme === "asymmetric" ? "#0284c7" : "#1e293b",
                border: scheme === "asymmetric" ? "1px solid #38bdf8" : "1px solid #334155",
                color: scheme === "asymmetric" ? "#ffffff" : "#94a3b8",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Asymmetric
            </button>
          </div>
        </div>

        {/* Granularity Selector */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            GRANULARITY (GROUPING)
          </label>
          <select
            value={granularity}
            onChange={(e) => {
              setGranularity(e.target.value as QuantizationGranularity);
              setSelectedPresetId("custom");
            }}
            style={{
              width: "100%",
              padding: "6px 10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="per_tensor">Per-Tensor Global Scale</option>
            <option value="group_32">Group-Wise (Block Size 32)</option>
            <option value="group_64">Group-Wise (Block Size 64)</option>
            <option value="group_128">Group-Wise (Block Size 128)</option>
            <option value="per_channel">Per-Channel</option>
          </select>
        </div>

        {/* Distribution Selector */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
              marginBottom: "4px",
            }}
          >
            TENSOR DISTRIBUTION
          </label>
          <select
            value={distribution}
            onChange={(e) => {
              setDistribution(e.target.value as DistributionType);
              setSelectedPresetId("custom");
            }}
            style={{
              width: "100%",
              padding: "6px 10px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <option value="gaussian">Standard Normal (Gaussian μ=0, σ=1)</option>
            <option value="uniform">Uniform Distribution [-3, +3]</option>
            <option value="outlier">Outlier Spikes (LLM Kurtosis)</option>
            <option value="custom">Custom Values / Waveform</option>
          </select>
        </div>

        {/* Tensor Size Slider */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <label style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
              TENSOR SIZE (N)
            </label>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8" }}>
              {tensorSize} items
            </span>
          </div>
          <input
            type="range"
            min={16}
            max={512}
            step={16}
            value={tensorSize}
            onChange={(e) => setTensorSize(parseInt(e.target.value, 10))}
            style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Advanced Clipping & Calibration Bar */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          padding: "10px 24px",
          background: "rgba(15, 23, 42, 0.8)",
          borderBottom: "1px solid #1e293b",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Percentile Clipping dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            Clipping Mode:
          </span>
          <select
            value={clippingMode}
            onChange={(e) => setClippingMode(e.target.value as ClippingMode)}
            style={{
              padding: "4px 8px",
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#e2e8f0",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            <option value="none">None (Full Min/Max Range)</option>
            <option value="percentile_99_9">99.9% Percentile Clip</option>
            <option value="percentile_99_5">99.5% Percentile Clip</option>
            <option value="percentile_99">99.0% Percentile Clip</option>
          </select>
        </div>

        {/* Manual Scale Override Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={useManualScale}
              onChange={(e) => setUseManualScale(e.target.checked)}
              style={{ accentColor: "#38bdf8" }}
            />
            Manual Scale Override
          </label>
          {useManualScale && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="number"
                step="0.01"
                min="0.0001"
                value={manualScale}
                onChange={(e) => setManualScale(parseFloat(e.target.value) || 0.01)}
                placeholder="Scale"
                style={{
                  width: "70px",
                  padding: "2px 6px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#38bdf8",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              />
              <input
                type="number"
                step="1"
                value={manualZeroPoint}
                onChange={(e) => setManualZeroPoint(parseInt(e.target.value, 10) || 0)}
                placeholder="Zero Pt"
                style={{
                  width: "60px",
                  padding: "2px 6px",
                  background: "#1e293b",
                  border: "1px solid #334155",
                  color: "#f59e0b",
                  borderRadius: "4px",
                  fontSize: "11px",
                }}
              />
            </div>
          )}
        </div>

        {distribution === "outlier" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                Outlier Magnitude:
              </span>
              <input
                type="range"
                min={3}
                max={25}
                step={0.5}
                value={outlierMagnitude}
                onChange={(e) => setOutlierMagnitude(parseFloat(e.target.value))}
                style={{ width: "90px", accentColor: "#f43f5e" }}
              />
              <span style={{ fontSize: "11px", color: "#f43f5e", fontWeight: 700 }}>
                ±{outlierMagnitude.toFixed(1)}σ
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
                Outlier Density:
              </span>
              <input
                type="range"
                min={0.005}
                max={0.1}
                step={0.005}
                value={outlierRatio}
                onChange={(e) => setOutlierRatio(parseFloat(e.target.value))}
                style={{ width: "90px", accentColor: "#f43f5e" }}
              />
              <span style={{ fontSize: "11px", color: "#f43f5e", fontWeight: 700 }}>
                {(outlierRatio * 100).toFixed(1)}%
              </span>
            </div>
          </>
        )}

        {distribution === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
            <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
              Custom Vector:
            </span>
            <input
              type="text"
              value={customInputStr}
              onChange={(e) => setCustomInputStr(e.target.value)}
              style={{
                flex: 1,
                padding: "4px 8px",
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#e2e8f0",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            />
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "10px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.6)",
        }}
      >
        {/* Compression Multiplier */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            MEMORY COMPRESSION
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
            {metrics.compressionRatio.toFixed(1)}x{" "}
            <span style={{ fontSize: "11px", color: "#64748b" }}>vs FP32</span>
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
            {metrics.memoryFootprintBytes}B ({currentFormatCfg.bytesPerElement} B/elem)
          </div>
        </div>

        {/* Memory Bandwidth Speedup */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            BANDWIDTH SPEEDUP
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
            {metrics.bandwidthSpeedup.toFixed(1)}x{" "}
            <span style={{ fontSize: "11px", color: "#64748b" }}>effective</span>
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
            {metrics.effectiveBandwidthGBs.toFixed(0)} GB/s on {targetHw.vendor}
          </div>
        </div>

        {/* SNR / SQNR */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            SNR / SQNR PRECISION
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#f59e0b", marginTop: "2px" }}>
            {metrics.snrDb.toFixed(1)}{" "}
            <span style={{ fontSize: "12px", color: "#64748b" }}>dB</span>
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
            SQNR: {metrics.sqnrDb.toFixed(1)} dB
          </div>
        </div>

        {/* RMSE / Max Error */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            RECONSTRUCTION RMSE
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#a855f7", marginTop: "2px" }}>
            {metrics.rmse < 1e-4 ? metrics.rmse.toExponential(2) : metrics.rmse.toFixed(4)}
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
            Max Δ:{" "}
            {metrics.maxError < 1e-4
              ? metrics.maxError.toExponential(2)
              : metrics.maxError.toFixed(4)}
          </div>
        </div>

        {/* Cosine Similarity */}
        <div
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid #1e293b",
          }}
        >
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>
            COSINE SIMILARITY
          </div>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#38bdf8", marginTop: "2px" }}>
            {(metrics.cosineSim * 100).toFixed(3)}%
          </div>
          <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
            MAE: {metrics.mae < 1e-4 ? metrics.mae.toExponential(2) : metrics.mae.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Bit-Level Inspector & Mathematical Ribbon */}
      <div
        style={{
          padding: "16px 24px",
          background: "rgba(30, 41, 59, 0.25)",
          borderTop: "1px solid #1e293b",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#38bdf8" }}>
              🔬 Bit-Level Binary Representation & Interactive Value Probe
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
              Inspect individual sign, exponent, and mantissa fields for {currentFormatCfg.name}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
              Probe Value (x):
            </span>
            <input
              type="number"
              step="0.05"
              value={probeValue}
              onChange={(e) => setProbeValue(parseFloat(e.target.value) || 0)}
              style={{
                width: "90px",
                padding: "4px 8px",
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#38bdf8",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 700,
              }}
            />
          </div>
        </div>

        {/* Bit Breakdown Ribbon */}
        {floatBitDecomp ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
              {/* Sign Bit */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "6px 10px",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                  borderRadius: "6px",
                }}
              >
                <span style={{ fontSize: "9px", color: "#f43f5e", fontWeight: 800 }}>
                  SIGN (1b)
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    color: "#f43f5e",
                  }}
                >
                  {floatBitDecomp.signBitStr}
                </span>
                <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                  {floatBitDecomp.sign === 1 ? "-1" : "+1"}
                </span>
              </div>

              {/* Exponent Bits */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "6px 12px",
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  borderRadius: "6px",
                }}
              >
                <span style={{ fontSize: "9px", color: "#38bdf8", fontWeight: 800 }}>
                  EXPONENT ({currentFormatCfg.expBits}b, Bias {floatBitDecomp.exponentBias})
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    color: "#38bdf8",
                  }}
                >
                  {floatBitDecomp.exponentBitStr}
                </span>
                <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                  raw {floatBitDecomp.exponent} (2^{floatBitDecomp.unbiasedExponent})
                </span>
              </div>

              {/* Mantissa Bits */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "6px 12px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "6px",
                }}
              >
                <span style={{ fontSize: "9px", color: "#10b981", fontWeight: 800 }}>
                  MANTISSA ({currentFormatCfg.mantissaBits}b)
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    color: "#10b981",
                  }}
                >
                  {floatBitDecomp.mantissaBitStr}
                </span>
                <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                  raw {floatBitDecomp.mantissa}
                </span>
              </div>

              {/* Hex / Decoded summary */}
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  background: "#0f172a",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "1px solid #1e293b",
                }}
              >
                <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                  HEX:{" "}
                  <span style={{ fontFamily: "monospace", color: "#f59e0b", fontWeight: 700 }}>
                    {floatBitDecomp.hexStr}
                  </span>
                </div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8" }}>
                  x̂ = {floatBitDecomp.reconstructedValue.toFixed(6)}
                </div>
              </div>
            </div>
          </div>
        ) : intBitDecomp ? (
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "6px 14px",
                background: "rgba(168, 85, 247, 0.15)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                borderRadius: "6px",
              }}
            >
              <span style={{ fontSize: "9px", color: "#a855f7", fontWeight: 800 }}>
                {currentFormatCfg.shortName} TWO'S COMPLEMENT ({currentFormatCfg.bits}b)
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontFamily: "monospace",
                  fontWeight: 800,
                  color: "#a855f7",
                }}
              >
                {intBitDecomp.bitStr}
              </span>
              <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                q = {intBitDecomp.decimal} [{currentFormatCfg.qmin}, {currentFormatCfg.qmax}]
              </span>
            </div>

            {/* Hex / Quantized */}
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                background: "#0f172a",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid #1e293b",
              }}
            >
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                HEX:{" "}
                <span style={{ fontFamily: "monospace", color: "#f59e0b", fontWeight: 700 }}>
                  {intBitDecomp.hexStr}
                </span>
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#10b981" }}>
                q = {probeMathResult.quantizedVal}, x̂ = {probeMathResult.dequantizedVal.toFixed(4)}
              </div>
            </div>
          </div>
        ) : null}

        {/* Mathematical Affine Substitution Card */}
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            background: "#0f172a",
            borderRadius: "6px",
            border: "1px solid #1e293b",
            fontSize: "11px",
            color: "#cbd5e1",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ color: "#38bdf8", fontWeight: 700 }}>Affine Transform:</span>{" "}
            <code>
              q = clamp(round(x / s) + z, {currentFormatCfg.qmin}, {currentFormatCfg.qmax})
            </code>
          </div>
          <div>
            <span style={{ color: "#10b981", fontWeight: 700 }}>Dequantization:</span>{" "}
            <code>x̂ = (q - z) × s</code>
          </div>
          <div style={{ marginLeft: "auto", color: "#94a3b8" }}>
            s ={" "}
            <span style={{ color: "#38bdf8" }}>
              {(quantizedResult.scales[0] || 1.0).toFixed(5)}
            </span>
            , z = <span style={{ color: "#f59e0b" }}>{quantizedResult.zeroPoints[0] ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Charts Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "16px",
          padding: "20px 24px",
          background: "rgba(15, 23, 42, 0.4)",
        }}
      >
        {/* Error Distribution Histogram */}
        <div
          style={{
            background: "#0f172a",
            borderRadius: "10px",
            padding: "16px",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>
              📊 Error Distribution Histogram (e = x - x̂)
            </h4>
            <span style={{ fontSize: "10px", color: "#94a3b8" }}>
              Zero-Centered: {histogramBins.find((b) => b.isZeroBin)?.percentage.toFixed(1) || 0}%
            </span>
          </div>

          <svg
            viewBox={`0 0 ${histW} ${histH}`}
            style={{ width: "100%", height: "auto", background: "#090d16", borderRadius: "6px" }}
          >
            {/* Gridlines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = histPad.top + (1 - pct / 100) * histPlotH;
              return (
                <g key={pct}>
                  <line
                    x1={histPad.left}
                    y1={y}
                    x2={histW - histPad.right}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="2,2"
                  />
                  <text x={histPad.left - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">
                    {((pct / 100) * maxHistPct).toFixed(0)}%
                  </text>
                </g>
              );
            })}

            {/* Histogram Bars */}
            {histogramBins.map((bin, i) => {
              const barW = Math.max(2, histPlotW / histogramBins.length - 2);
              const barX = histPad.left + i * (histPlotW / histogramBins.length) + 1;
              const barH = (bin.percentage / maxHistPct) * histPlotH;
              const barY = histPad.top + histPlotH - barH;

              return (
                <g key={i}>
                  <rect
                    x={barX}
                    y={barY}
                    width={barW}
                    height={Math.max(1, barH)}
                    fill={bin.isZeroBin ? "#10b981" : "#0284c7"}
                    rx={2}
                    opacity={0.85}
                  />
                  {bin.count > 0 && (
                    <text
                      x={barX + barW / 2}
                      y={barY - 3}
                      fill={bin.isZeroBin ? "#34d399" : "#38bdf8"}
                      fontSize="8"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {bin.count}
                    </text>
                  )}
                </g>
              );
            })}

            {/* X Axis Labels */}
            <text x={histPad.left} y={histH - 10} fill="#64748b" fontSize="9" textAnchor="start">
              {histogramBins[0]?.min.toFixed(3)}
            </text>
            <text
              x={histPad.left + histPlotW / 2}
              y={histH - 10}
              fill="#94a3b8"
              fontSize="9"
              textAnchor="middle"
              fontWeight="700"
            >
              Δ Error = 0.00
            </text>
            <text
              x={histW - histPad.right}
              y={histH - 10}
              fill="#64748b"
              fontSize="9"
              textAnchor="end"
            >
              {histogramBins[histogramBins.length - 1]?.max.toFixed(3)}
            </text>
          </svg>
        </div>

        {/* Original vs Quantized Reconstruction Comparison */}
        <div
          style={{
            background: "#0f172a",
            borderRadius: "10px",
            padding: "16px",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#38bdf8" }}>
              📈 Signal Reconstruction (x vs x̂)
            </h4>
            <div style={{ display: "flex", gap: "10px", fontSize: "10px" }}>
              <span style={{ color: "#38bdf8" }}>● Original x</span>
              <span style={{ color: "#f59e0b" }}>▲ Quantized x̂</span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${compW} ${compH}`}
            style={{ width: "100%", height: "auto", background: "#090d16", borderRadius: "6px" }}
          >
            {/* Zero Axis */}
            {(() => {
              const zeroFrac = (0 - compMinVal) / (compMaxVal - compMinVal);
              const zeroY = compPad.top + (1 - zeroFrac) * compPlotH;
              return (
                <line
                  x1={compPad.left}
                  y1={zeroY}
                  x2={compW - compPad.right}
                  y2={zeroY}
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            })()}

            {/* Original Signal Curve */}
            {(() => {
              const pts = originalTensor.slice(0, sampleCountToPlot).map((val, idx) => {
                const x = compPad.left + idx * compStepX;
                const frac = (val - compMinVal) / (compMaxVal - compMinVal);
                const y = compPad.top + (1 - frac) * compPlotH;
                return `${x},${y}`;
              });
              return (
                <polyline
                  points={pts.join(" ")}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity={0.6}
                />
              );
            })()}

            {/* Points & Residual Error Bars */}
            {originalTensor.slice(0, sampleCountToPlot).map((val, idx) => {
              const x = compPad.left + idx * compStepX;
              const origFrac = (val - compMinVal) / (compMaxVal - compMinVal);
              const origY = compPad.top + (1 - origFrac) * compPlotH;

              const quantVal = quantizedResult.dequantized[idx];
              const quantFrac = (quantVal - compMinVal) / (compMaxVal - compMinVal);
              const quantY = compPad.top + (1 - quantFrac) * compPlotH;

              return (
                <g key={idx}>
                  {/* Error line */}
                  <line
                    x1={x}
                    y1={origY}
                    x2={x}
                    y2={quantY}
                    stroke="#f43f5e"
                    strokeWidth="1"
                    opacity={0.7}
                  />
                  {/* Original dot */}
                  <circle cx={x} cy={origY} r="2.5" fill="#38bdf8" />
                  {/* Quantized point */}
                  <circle cx={x} cy={quantY} r="2" fill="#f59e0b" />
                </g>
              );
            })}

            {/* X & Y Axis labels */}
            <text x={compPad.left} y={compPad.top + 10} fill="#64748b" fontSize="8">
              {compMaxVal.toFixed(2)}
            </text>
            <text x={compPad.left} y={compH - compPad.bottom} fill="#64748b" fontSize="8">
              {compMinVal.toFixed(2)}
            </text>
            <text x={compW / 2} y={compH - 10} fill="#64748b" fontSize="9" textAnchor="middle">
              Sample Index (First {sampleCountToPlot} elements)
            </text>
          </svg>
        </div>
      </div>

      {/* Silicon Roofline & Memory Impact Panel */}
      <div
        style={{
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.9)",
          borderTop: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#10b981" }}>
              ⚡ Silicon Footprint & Roofline Operational Regime Shift
            </h4>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
              Projected memory savings and arithmetic intensity boost on {targetHw.name}
            </p>
          </div>

          <span
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              background: "rgba(16, 185, 129, 0.15)",
              color: "#34d399",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              borderRadius: "6px",
              fontWeight: 700,
            }}
          >
            Intensity Boost: +{(metrics.rooflineShiftFactor * 100 - 100).toFixed(0)}%
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "12px",
          }}
        >
          {/* Llama-3-8B */}
          <div
            style={{
              background: "#0f172a",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #1e293b",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8" }}>
              Llama-3-8B (8 Billion Parameters)
            </div>
            <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
              FP32: 32.0 GB ➔{" "}
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                {(32.0 / metrics.compressionRatio).toFixed(1)} GB
              </span>
            </div>
          </div>

          {/* Llama-3-70B */}
          <div
            style={{
              background: "#0f172a",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #1e293b",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8" }}>
              Llama-3-70B (70 Billion Parameters)
            </div>
            <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
              FP32: 280.0 GB ➔{" "}
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                {(280.0 / metrics.compressionRatio).toFixed(1)} GB
              </span>
            </div>
          </div>

          {/* DeepSeek-V3 */}
          <div
            style={{
              background: "#0f172a",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #1e293b",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#38bdf8" }}>
              DeepSeek-V3 (671B MoE)
            </div>
            <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "4px" }}>
              FP32: 2684 GB ➔{" "}
              <span style={{ color: "#10b981", fontWeight: 700 }}>
                {(2684 / metrics.compressionRatio).toFixed(1)} GB
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
