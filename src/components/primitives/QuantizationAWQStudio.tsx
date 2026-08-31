import React, { useState, useMemo, useCallback } from "react";
import {
  Binary,
  Layers,
  Sparkles,
  Sliders,
  BarChart3,
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  Boxes,
  HelpCircle,
  TrendingDown,
  Gauge,
  ArrowRightLeft,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type FP8FormatType = "fp8_e4m3" | "fp8_e5m2";
export type INT4Scheme = "symmetric" | "asymmetric";
export type INT4GroupSizeOption = 16 | 32 | 64 | 128 | "channel" | "tensor";

export type QuantStudioTabId =
  | "awq_salience"
  | "smoothquant"
  | "fp8_inspector"
  | "int4_groupwise"
  | "weight_heatmap_error"
  | "metrics_dashboard"
  | "theory_deep_dive";

export type QuantizationPresetId =
  | "llama3_8b_attn_proj"
  | "mistral_7b_mlp_gate"
  | "deepseek_v3_moe_down"
  | "outlier_stress_matrix"
  | "fp8_dynamic_range_challenge"
  | "symmetric_vs_asymmetric"
  | "custom";

export interface FP8BitDecomposition {
  readonly format: FP8FormatType;
  readonly byte: number;
  readonly sign: number;
  readonly exponentBiased: number;
  readonly exponentUnbiased: number;
  readonly mantissaFraction: number;
  readonly mantissaInt: number;
  readonly isSubnormal: boolean;
  readonly isZero: boolean;
  readonly isInfinity: boolean;
  readonly isNaN: boolean;
  readonly reconstructedValue: number;
  readonly bitString: string;
  readonly signBitStr: string;
  readonly exponentBitStr: string;
  readonly mantissaBitStr: string;
}

export interface INT4QuantOptions {
  readonly scheme: INT4Scheme;
  readonly groupSize: INT4GroupSizeOption;
}

export interface INT4GroupData {
  readonly groupIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly scale: number;
  readonly zeroPoint: number;
  readonly minVal: number;
  readonly maxVal: number;
  readonly originalValues: readonly number[];
  readonly quantizedValues: readonly number[];
  readonly dequantizedValues: readonly number[];
  readonly errors: readonly number[];
  readonly mse: number;
  readonly maxAbsError: number;
}

export interface INT4QuantResult {
  readonly format: "int4";
  readonly scheme: INT4Scheme;
  readonly groupSize: number;
  readonly numGroups: number;
  readonly scales: readonly number[];
  readonly zeroPoints: readonly number[];
  readonly quantizedMatrix: readonly (readonly number[])[];
  readonly dequantizedMatrix: readonly (readonly number[])[];
  readonly groups: readonly INT4GroupData[];
  readonly frobeniusError: number;
  readonly relativeFrobeniusError: number;
  readonly sqnrDb: number;
  readonly cosineSimilarity: number;
  readonly mae: number;
  readonly maxError: number;
  readonly compressionRatio: number;
  readonly bitsPerWeight: number;
}

export interface AWQSearchOptions {
  readonly alphaMin?: number;
  readonly alphaMax?: number;
  readonly step?: number;
  readonly groupSize?: INT4GroupSizeOption;
  readonly scheme?: INT4Scheme;
}

export interface AWQSweepPoint {
  readonly alpha: number;
  readonly loss: number;
  readonly sqnr: number;
  readonly frobeniusError: number;
  readonly maxError: number;
}

export interface AWQSearchResult {
  readonly optimalAlpha: number;
  readonly minLoss: number;
  readonly baselineLoss: number; // Loss at alpha = 0 (unprotected INT4)
  readonly baselineSqnr: number;
  readonly optimalSqnr: number;
  readonly sqnrGainDb: number;
  readonly lossReductionPct: number;
  readonly channelSalience: readonly number[];
  readonly optimalChannelScales: readonly number[];
  readonly sweepPoints: readonly AWQSweepPoint[];
  readonly protectedDequantizedMatrix: readonly (readonly number[])[];
  readonly baselineDequantizedMatrix: readonly (readonly number[])[];
  readonly topSalientChannels: readonly number[];
}

export interface SmoothQuantChannelData {
  readonly channelIndex: number;
  readonly actMax: number;
  readonly weightMax: number;
  readonly scaleFactor: number;
  readonly actMaxSmoothed: number;
  readonly weightMaxSmoothed: number;
}

export interface SmoothQuantResult {
  readonly alpha: number;
  readonly channelScales: readonly number[];
  readonly smoothedActivations: readonly (readonly number[])[];
  readonly smoothedWeights: readonly (readonly number[])[];
  readonly originalGemmOutput: readonly (readonly number[])[];
  readonly smoothedGemmOutput: readonly (readonly number[])[];
  readonly gemmInvarianceError: number; // || \hat{X} \hat{W} - X W ||_F
  readonly isInvariant: boolean;
  readonly actDynamicRangeBefore: number;
  readonly actDynamicRangeAfter: number;
  readonly weightDynamicRangeBefore: number;
  readonly weightDynamicRangeAfter: number;
  readonly channelData: readonly SmoothQuantChannelData[];
  readonly naiveQuantSqnr: number;
  readonly smoothQuantSqnr: number;
  readonly sqnrImprovementDb: number;
}

export interface FrobeniusResult {
  readonly absoluteError: number;
  readonly relativeError: number;
  readonly originalNorm: number;
  readonly quantizedNorm: number;
}

export interface PerplexityDeltaResult {
  readonly deltaPpl: number;
  readonly status: "lossless" | "negligible" | "mild" | "severe" | "catastrophic";
  readonly badgeColor: string;
  readonly description: string;
  readonly recommendation: string;
}

export interface MemorySavingsResult {
  readonly format: string;
  readonly bitsPerWeight: number;
  readonly bytesPerWeight: number;
  readonly compressionVsFP16: number;
  readonly vram8BModelGb: number;
  readonly vram70BModelGb: number;
  readonly vram405BModelGb: number;
  readonly effectiveBandwidthMultiplier: number;
}

export interface HistogramBin {
  readonly binIndex: number;
  readonly minVal: number;
  readonly maxVal: number;
  readonly centerVal: number;
  readonly count: number;
  readonly percentage: number;
  readonly isZeroBin: boolean;
}

export interface PresetData {
  readonly weights: readonly (readonly number[])[];
  readonly activations: readonly (readonly number[])[];
  readonly rows: number;
  readonly cols: number;
  readonly numTokens: number;
  readonly description: string;
}

export interface QuantizationPreset {
  readonly id: QuantizationPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly architectureFamily: string;
  readonly defaultGroupSize: INT4GroupSizeOption;
  readonly defaultScheme: INT4Scheme;
  readonly defaultAwqAlpha: number;
  readonly defaultSmoothQuantAlpha: number;
  readonly highlightConcepts: readonly string[];
  readonly data: PresetData;
}

export interface QuantizationAWQStudioProps {
  readonly initialPreset?: QuantizationPresetId;
  readonly initialTab?: QuantStudioTabId;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onPresetChange?: (presetId: QuantizationPresetId) => void;
  readonly onTabChange?: (tabId: QuantStudioTabId) => void;
}

// ============================================================================
// 2. PURE NUMERICAL FUNCTIONS (FP8, INT4, AWQ, SMOOTHQUANT, METRICS)
// ============================================================================

/**
 * Encodes an IEEE 64-bit float into an 8-bit FP8 E4M3FN representation.
 * Range: [-448, 448], 1 Sign, 4 Exponent (bias 7), 3 Mantissa.
 * 0x7F / 0xFF are NaNs. No Infinities.
 */
export function floatToFP8E4M3(val: number): number {
  if (Number.isNaN(val)) return 0x7f;
  if (val === 0) return Object.is(val, -0) ? 0x80 : 0x00;

  const sign = val < 0 ? 1 : 0;
  const absVal = Math.abs(val);

  // Clamping at max representable finite normal (448.0)
  if (absVal >= 448.0) {
    return (sign << 7) | (15 << 3) | 6;
  }

  // Underflow limit (2^-10 = 1/1024)
  if (absVal < Math.pow(2, -10)) {
    return sign << 7;
  }

  // Subnormal range: absVal < 2^-6 = 0.015625
  if (absVal < Math.pow(2, -6)) {
    const mantissa = Math.round(absVal * 512); // absVal / 2^-9
    if (mantissa === 8) {
      return (sign << 7) | (1 << 3) | 0;
    }
    return (sign << 7) | (0 << 3) | (mantissa & 0x07);
  }

  // Normal range: E in 1..15
  let e = Math.floor(Math.log2(absVal));
  let E = e + 7;
  if (E < 1) E = 1;
  if (E > 15) E = 15;

  const scale = Math.pow(2, e);
  const frac = absVal / scale - 1.0;
  let mantissa = Math.round(frac * 8);

  if (mantissa === 8) {
    E += 1;
    mantissa = 0;
    if (E > 15) {
      E = 15;
      mantissa = 6;
    }
  }

  if (E === 15 && mantissa > 6) {
    mantissa = 6;
  }

  return (sign << 7) | ((E & 0x0f) << 3) | (mantissa & 0x07);
}

/**
 * Decodes an 8-bit FP8 E4M3FN byte back to float.
 */
export function fp8E4M3ToFloat(byte: number): number {
  const b = byte & 0xff;
  const sign = (b & 0x80) !== 0 ? -1 : 1;
  const exp = (b & 0x78) >> 3;
  const mantissa = b & 0x07;

  if (exp === 15 && mantissa === 7) {
    return NaN;
  }

  if (exp === 0) {
    if (mantissa === 0) return sign === -1 ? -0.0 : 0.0;
    return sign * Math.pow(2, -6) * (mantissa / 8);
  }

  return sign * Math.pow(2, exp - 7) * (1 + mantissa / 8);
}

/**
 * Encodes an IEEE 64-bit float into an 8-bit FP8 E5M2 representation.
 * Range: [-57344, 57344], 1 Sign, 5 Exponent (bias 15), 2 Mantissa.
 * 0x7C / 0xFC are +/- Infinity, 0x7D..0x7F / 0xFD..0xFF are NaNs.
 */
export function floatToFP8E5M2(val: number): number {
  if (Number.isNaN(val)) return 0x7f;
  if (val === Infinity) return 0x7c;
  if (val === -Infinity) return 0xfc;
  if (val === 0) return Object.is(val, -0) ? 0x80 : 0x00;

  const sign = val < 0 ? 1 : 0;
  const absVal = Math.abs(val);

  if (absVal > 57344.0) {
    return (sign << 7) | 0x7c; // Overflow to Infinity
  }

  // Underflow limit (2^-17 = 1/131072)
  if (absVal < Math.pow(2, -17)) {
    return sign << 7;
  }

  // Subnormal range: absVal < 2^-14 ~ 6.1035e-5
  if (absVal < Math.pow(2, -14)) {
    const mantissa = Math.round(absVal * 65536); // absVal / 2^-16
    if (mantissa === 4) {
      return (sign << 7) | (1 << 2) | 0;
    }
    return (sign << 7) | (0 << 2) | (mantissa & 0x03);
  }

  // Normal range: E in 1..30
  let e = Math.floor(Math.log2(absVal));
  let E = e + 15;
  if (E < 1) E = 1;
  if (E > 30) E = 30;

  const scale = Math.pow(2, e);
  const frac = absVal / scale - 1.0;
  let mantissa = Math.round(frac * 4);

  if (mantissa === 4) {
    E += 1;
    mantissa = 0;
    if (E > 30) {
      return (sign << 7) | 0x7c; // Overflow to Infinity
    }
  }

  return (sign << 7) | ((E & 0x1f) << 2) | (mantissa & 0x03);
}

/**
 * Decodes an 8-bit FP8 E5M2 byte back to float.
 */
export function fp8E5M2ToFloat(byte: number): number {
  const b = byte & 0xff;
  const sign = (b & 0x80) !== 0 ? -1 : 1;
  const exp = (b & 0x7c) >> 2;
  const mantissa = b & 0x03;

  if (exp === 31) {
    if (mantissa === 0) return sign === -1 ? -Infinity : Infinity;
    return NaN;
  }

  if (exp === 0) {
    if (mantissa === 0) return sign === -1 ? -0.0 : 0.0;
    return sign * Math.pow(2, -14) * (mantissa / 4);
  }

  return sign * Math.pow(2, exp - 15) * (1 + mantissa / 4);
}

/**
 * Inspects any float or byte in either FP8 format and provides structured bitfields.
 */
export function decomposeFP8(
  valOrByte: number,
  format: FP8FormatType,
  isByte = false,
): FP8BitDecomposition {
  const byte = isByte
    ? valOrByte & 0xff
    : format === "fp8_e4m3"
      ? floatToFP8E4M3(valOrByte)
      : floatToFP8E5M2(valOrByte);

  const sign = (byte & 0x80) !== 0 ? 1 : 0;
  const signBitStr = sign.toString();

  if (format === "fp8_e4m3") {
    const expBiased = (byte & 0x78) >> 3;
    const expUnbiased = expBiased === 0 ? -6 : expBiased - 7;
    const mantissaInt = byte & 0x07;
    const isSubnormal = expBiased === 0 && mantissaInt > 0;
    const isZero = expBiased === 0 && mantissaInt === 0;
    const isNaNVal = expBiased === 15 && mantissaInt === 7;
    const isInfinity = false;
    const reconstructed = isNaNVal ? NaN : fp8E4M3ToFloat(byte);

    const expBitStr = expBiased.toString(2).padStart(4, "0");
    const mantissaBitStr = mantissaInt.toString(2).padStart(3, "0");
    const bitString = `${signBitStr} ${expBitStr} ${mantissaBitStr}`;

    return {
      format,
      byte,
      sign,
      exponentBiased: expBiased,
      exponentUnbiased: expUnbiased,
      mantissaFraction: expBiased === 0 ? mantissaInt / 8 : 1 + mantissaInt / 8,
      mantissaInt,
      isSubnormal,
      isZero,
      isInfinity,
      isNaN: isNaNVal,
      reconstructedValue: reconstructed,
      bitString,
      signBitStr,
      exponentBitStr: expBitStr,
      mantissaBitStr,
    };
  } else {
    const expBiased = (byte & 0x7c) >> 2;
    const expUnbiased = expBiased === 0 ? -14 : expBiased - 15;
    const mantissaInt = byte & 0x03;
    const isInfinity = expBiased === 31 && mantissaInt === 0;
    const isNaNVal = expBiased === 31 && mantissaInt > 0;
    const isSubnormal = expBiased === 0 && mantissaInt > 0;
    const isZero = expBiased === 0 && mantissaInt === 0;
    const reconstructed = fp8E5M2ToFloat(byte);

    const expBitStr = expBiased.toString(2).padStart(5, "0");
    const mantissaBitStr = mantissaInt.toString(2).padStart(2, "0");
    const bitString = `${signBitStr} ${expBitStr} ${mantissaBitStr}`;

    return {
      format,
      byte,
      sign,
      exponentBiased: expBiased,
      exponentUnbiased: expUnbiased,
      mantissaFraction: expBiased === 0 ? mantissaInt / 4 : 1 + mantissaInt / 4,
      mantissaInt,
      isSubnormal,
      isZero,
      isInfinity,
      isNaN: isNaNVal,
      reconstructedValue: reconstructed,
      bitString,
      signBitStr,
      exponentBitStr: expBitStr,
      mantissaBitStr,
    };
  }
}

/**
 * Flattens a 2D or 1D array into a 1D number array.
 */
function flattenArray(input: number[][] | number[]): number[] {
  if (input.length === 0) return [];
  if (Array.isArray(input[0])) {
    return (input as number[][]).flat();
  }
  return [...(input as number[])];
}

/**
 * Group-wise INT4 Quantization with support for Symmetric ([-8, 7]) and Asymmetric ([0, 15]) modes.
 */
export function quantizeINT4Groupwise(
  matrix: number[][] | number[],
  options?: Partial<INT4QuantOptions>,
): INT4QuantResult {
  const scheme: INT4Scheme = options?.scheme ?? "symmetric";
  const groupSizeOption: INT4GroupSizeOption = options?.groupSize ?? 32;

  const is2D = matrix.length > 0 && Array.isArray(matrix[0]);
  const rows = is2D ? matrix.length : 1;
  const cols = is2D ? (matrix[0] as number[]).length : matrix.length;
  const flat = flattenArray(matrix);
  const totalElements = flat.length;

  let groupSizeNumeric: number;
  if (groupSizeOption === "tensor") {
    groupSizeNumeric = Math.max(1, totalElements);
  } else if (groupSizeOption === "channel") {
    groupSizeNumeric = Math.max(1, cols);
  } else {
    groupSizeNumeric = Math.max(1, groupSizeOption);
  }

  const numGroups = Math.ceil(totalElements / groupSizeNumeric);
  const groupResults: INT4GroupData[] = [];
  const scales: number[] = [];
  const zeroPoints: number[] = [];
  const flatQuantized: number[] = new Array(totalElements);
  const flatDequantized: number[] = new Array(totalElements);

  for (let g = 0; g < numGroups; g++) {
    const startIdx = g * groupSizeNumeric;
    const endIdx = Math.min(totalElements, startIdx + groupSizeNumeric);
    const originalSlice = flat.slice(startIdx, endIdx);

    let minVal = Infinity;
    let maxVal = -Infinity;
    let maxAbs = 0;

    for (const v of originalSlice) {
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
      const absV = Math.abs(v);
      if (absV > maxAbs) maxAbs = absV;
    }

    if (!Number.isFinite(minVal)) minVal = 0;
    if (!Number.isFinite(maxVal)) maxVal = 0;

    let scale = 1.0;
    let zeroPoint = 0;

    if (scheme === "symmetric") {
      scale = Math.max(maxAbs, 1e-8) / 7.0; // [-8, 7] symmetric scale
      zeroPoint = 0;
    } else {
      const range = Math.max(maxVal - minVal, 1e-8);
      scale = range / 15.0;
      zeroPoint = Math.round(-minVal / scale);
      zeroPoint = Math.max(0, Math.min(15, zeroPoint));
    }

    scales.push(scale);
    zeroPoints.push(zeroPoint);

    const quantizedSlice: number[] = [];
    const dequantizedSlice: number[] = [];
    const errorsSlice: number[] = [];
    let sumSqErr = 0;
    let maxAbsErr = 0;

    for (let i = 0; i < originalSlice.length; i++) {
      const orig = originalSlice[i]!;
      let q: number;
      let dequant: number;

      if (scheme === "symmetric") {
        q = Math.round(orig / scale);
        q = Math.max(-8, Math.min(7, q));
        dequant = q * scale;
      } else {
        q = Math.round(orig / scale) + zeroPoint;
        q = Math.max(0, Math.min(15, q));
        dequant = (q - zeroPoint) * scale;
      }

      const err = orig - dequant;
      const absErr = Math.abs(err);
      if (absErr > maxAbsErr) maxAbsErr = absErr;
      sumSqErr += err * err;

      quantizedSlice.push(q);
      dequantizedSlice.push(dequant);
      errorsSlice.push(err);

      flatQuantized[startIdx + i] = q;
      flatDequantized[startIdx + i] = dequant;
    }

    const mse = originalSlice.length > 0 ? sumSqErr / originalSlice.length : 0;

    groupResults.push({
      groupIndex: g,
      startIndex: startIdx,
      endIndex: endIdx,
      scale,
      zeroPoint,
      minVal,
      maxVal,
      originalValues: originalSlice,
      quantizedValues: quantizedSlice,
      dequantizedValues: dequantizedSlice,
      errors: errorsSlice,
      mse,
      maxAbsError: maxAbsErr,
    });
  }

  // Reconstruct 2D matrices if input was 2D
  let quantizedMatrix: number[][];
  let dequantizedMatrix: number[][];

  if (is2D) {
    quantizedMatrix = [];
    dequantizedMatrix = [];
    for (let r = 0; r < rows; r++) {
      quantizedMatrix.push(flatQuantized.slice(r * cols, (r + 1) * cols));
      dequantizedMatrix.push(flatDequantized.slice(r * cols, (r + 1) * cols));
    }
  } else {
    quantizedMatrix = [flatQuantized];
    dequantizedMatrix = [flatDequantized];
  }

  const frob = computeFrobeniusError(flat, flatDequantized);
  const sqnrDb = computeSQNR(flat, flatDequantized);
  const cosineSimilarity = computeCosineSimilarity(flat, flatDequantized);
  const mae = computeMAE(flat, flatDequantized);
  const maxError = computeMaxError(flat, flatDequantized);

  // Group overhead: 16 bits (FP16 scale) + 4 bits (INT4 zero point if asymmetric) per group
  const bitsPerScaleZero = scheme === "asymmetric" ? 20 : 16;
  const overheadBitsPerWeight = (bitsPerScaleZero * numGroups) / Math.max(1, totalElements);
  const bitsPerWeight = 4.0 + overheadBitsPerWeight;
  const compressionRatio = 16.0 / bitsPerWeight;

  return {
    format: "int4",
    scheme,
    groupSize: groupSizeNumeric,
    numGroups,
    scales,
    zeroPoints,
    quantizedMatrix,
    dequantizedMatrix,
    groups: groupResults,
    frobeniusError: frob.absoluteError,
    relativeFrobeniusError: frob.relativeError,
    sqnrDb,
    cosineSimilarity,
    mae,
    maxError,
    compressionRatio,
    bitsPerWeight,
  };
}

/**
 * Computes channel-wise activation salience s_X(j) = (1 / B) * \sum_i |X_{i, j}|
 */
export function computeActivationSalience(activations: number[][]): number[] {
  if (!activations || activations.length === 0 || !activations[0]) return [];
  const B = activations.length;
  const K = activations[0].length;
  const salience = new Array<number>(K).fill(0);

  for (let i = 0; i < B; i++) {
    const row = activations[i]!;
    for (let j = 0; j < K; j++) {
      salience[j] += Math.abs(row[j] ?? 0);
    }
  }

  for (let j = 0; j < K; j++) {
    salience[j] = salience[j]! / B;
  }

  return salience;
}

/**
 * Multiplies two 2D matrices A (N x K) and B (K x M) => C (N x M).
 */
export function gemmMatrixMultiply(A: number[][], B: number[][]): number[][] {
  if (!A || A.length === 0 || !B || B.length === 0) return [];
  const N = A.length;
  const K = A[0]?.length ?? 0;
  const M = B[0]?.length ?? 0;

  const C: number[][] = Array.from({ length: N }, () => Array.from({ length: M }, () => 0));

  for (let i = 0; i < N; i++) {
    const aRow = A[i]!;
    const cRow = C[i]!;
    for (let k = 0; k < K; k++) {
      const aVal = aRow[k] ?? 0;
      const bRow = B[k]!;
      for (let j = 0; j < M; j++) {
        cRow[j] += aVal * (bRow[j] ?? 0);
      }
    }
  }

  return C;
}

/**
 * Transposes a 2D matrix.
 */
function transposeMatrix(A: number[][]): number[][] {
  if (!A || A.length === 0 || !A[0]) return [];
  const R = A.length;
  const C = A[0].length;
  const T: number[][] = Array.from({ length: C }, () => Array.from({ length: R }, () => 0));
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      T[c]![r] = A[r]![c]!;
    }
  }
  return T;
}

/**
 * AWQ Grid Search to find optimal alpha hyperparameter: s = s_X^alpha.
 * Minimizes || X W^T - X \hat{W}^T ||_F^2.
 */
export function searchOptimalAWQAlpha(
  weights: number[][],
  activations: number[][],
  options?: Partial<AWQSearchOptions>,
): AWQSearchResult {
  const alphaMin = options?.alphaMin ?? 0.0;
  const alphaMax = options?.alphaMax ?? 1.0;
  const step = options?.step ?? 0.05;
  const groupSize = options?.groupSize ?? 32;
  const scheme = options?.scheme ?? "symmetric";

  const M = weights.length;
  const K = weights[0]?.length ?? 0;
  const B = activations.length;

  const salience = computeActivationSalience(activations);
  const meanSalience = salience.reduce((acc, v) => acc + v, 0) / Math.max(1, K);
  const normalizedSalience = salience.map((s) => s / Math.max(meanSalience, 1e-8));

  // Determine top 20% salient channels
  const indexedSalience = salience.map((s, idx) => ({ s, idx }));
  indexedSalience.sort((a, b) => b.s - a.s);
  const topCount = Math.max(1, Math.round(K * 0.2));
  const topSalientChannels = indexedSalience.slice(0, topCount).map((item) => item.idx);

  // Exact baseline GEMM output Y = X * W^T
  const WT = transposeMatrix(weights);
  const Y_exact = gemmMatrixMultiply(activations, WT);

  // Baseline INT4 (alpha = 0)
  const baselineQuant = quantizeINT4Groupwise(weights, { groupSize, scheme });
  const baselineDequantized = baselineQuant.dequantizedMatrix as number[][];
  const baselineWT = transposeMatrix(baselineDequantized);
  const Y_baseline = gemmMatrixMultiply(activations, baselineWT);
  const baselineFrob = computeFrobeniusError(Y_exact, Y_baseline);
  const baselineLoss =
    (baselineFrob.absoluteError * baselineFrob.absoluteError) / Math.max(1, B * M);
  const baselineSqnr = computeSQNR(Y_exact, Y_baseline);

  const sweepPoints: AWQSweepPoint[] = [];
  let optimalAlpha = 0.0;
  let minLoss = Infinity;
  let optimalSqnr = -Infinity;
  let optimalDequantizedMatrix = baselineDequantized;
  let optimalScales = new Array<number>(K).fill(1.0);

  const numSteps = Math.round((alphaMax - alphaMin) / step) + 1;

  for (let i = 0; i < numSteps; i++) {
    const alpha = Math.round((alphaMin + i * step) * 1000) / 1000;

    // Per-channel protection scale: s_j = (s_X(j))^\alpha
    const rawScales = normalizedSalience.map((s) => Math.pow(Math.max(s, 1e-5), alpha));
    const meanScale = rawScales.reduce((a, b) => a + b, 0) / Math.max(1, K);
    const normalizedScales = rawScales.map((s) => s / Math.max(meanScale, 1e-8));

    // Scale weights: W' = W * diag(s)
    const scaledWeights: number[][] = Array.from({ length: M }, (_, r) =>
      Array.from({ length: K }, (_, c) => weights[r]![c]! * normalizedScales[c]!),
    );

    // Quantize scaled weights
    const quantScaled = quantizeINT4Groupwise(scaledWeights, { groupSize, scheme });
    const dequantScaled = quantScaled.dequantizedMatrix as number[][];

    // Reconstruct weights: \hat{W} = \hat{W'} * diag(s)^-1
    const reconstructedWeights: number[][] = Array.from({ length: M }, (_, r) =>
      Array.from({ length: K }, (_, c) => dequantScaled[r]![c]! / normalizedScales[c]!),
    );

    // Compute activation output Y_hat = X * \hat{W}^T
    const recWT = transposeMatrix(reconstructedWeights);
    const Y_hat = gemmMatrixMultiply(activations, recWT);

    const frob = computeFrobeniusError(Y_exact, Y_hat);
    const loss = (frob.absoluteError * frob.absoluteError) / Math.max(1, B * M);
    const sqnr = computeSQNR(Y_exact, Y_hat);
    const maxErr = computeMaxError(Y_exact, Y_hat);

    sweepPoints.push({
      alpha,
      loss,
      sqnr,
      frobeniusError: frob.absoluteError,
      maxError: maxErr,
    });

    if (loss < minLoss) {
      minLoss = loss;
      optimalAlpha = alpha;
      optimalSqnr = sqnr;
      optimalDequantizedMatrix = reconstructedWeights;
      optimalScales = normalizedScales;
    }
  }

  const lossReductionPct =
    baselineLoss > 0 ? Math.max(0, ((baselineLoss - minLoss) / baselineLoss) * 100) : 0;
  const sqnrGainDb = Math.max(0, optimalSqnr - baselineSqnr);

  return {
    optimalAlpha,
    minLoss,
    baselineLoss,
    baselineSqnr,
    optimalSqnr,
    sqnrGainDb,
    lossReductionPct,
    channelSalience: salience,
    optimalChannelScales: optimalScales,
    sweepPoints,
    protectedDequantizedMatrix: optimalDequantizedMatrix,
    baselineDequantizedMatrix: baselineDequantized,
    topSalientChannels,
  };
}

/**
 * SmoothQuant Mathematical Migration Transform:
 * s_j = max(|X_{:, j}|)^\alpha / max(|W_{j, :}|)^{1 - \alpha}
 * \hat{X} = X * diag(s)^{-1}, \hat{W} = diag(s) * W
 * Preserves GEMM: \hat{X} * \hat{W}^T = X * W^T
 */
export function applySmoothQuantTransform(
  activations: number[][],
  weights: number[][],
  alpha = 0.5,
): SmoothQuantResult {
  const B = activations.length;
  const K = activations[0]?.length ?? 0;
  const M = weights.length;

  const actMax: number[] = new Array(K).fill(0);
  const weightMax: number[] = new Array(K).fill(0);

  // Compute activation column maximums
  for (let i = 0; i < B; i++) {
    for (let j = 0; j < K; j++) {
      const val = Math.abs(activations[i]![j] ?? 0);
      if (val > actMax[j]!) actMax[j] = val;
    }
  }

  // Compute weight column maximums
  for (let r = 0; r < M; r++) {
    for (let c = 0; c < K; c++) {
      const val = Math.abs(weights[r]![c] ?? 0);
      if (val > weightMax[c]!) weightMax[c] = val;
    }
  }

  const channelScales: number[] = new Array(K);
  const channelData: SmoothQuantChannelData[] = [];

  for (let j = 0; j < K; j++) {
    const aM = Math.max(actMax[j]!, 1e-6);
    const wM = Math.max(weightMax[j]!, 1e-6);
    const s = Math.pow(aM, alpha) / Math.pow(wM, 1 - alpha);
    const scale = Math.max(s, 1e-6);
    channelScales[j] = scale;

    channelData.push({
      channelIndex: j,
      actMax: aM,
      weightMax: wM,
      scaleFactor: scale,
      actMaxSmoothed: aM / scale,
      weightMaxSmoothed: wM * scale,
    });
  }

  // Transformed activations: \hat{X}_{i, j} = X_{i, j} / s_j
  const smoothedActivations: number[][] = Array.from({ length: B }, (_, i) =>
    Array.from({ length: K }, (_, j) => activations[i]![j]! / channelScales[j]!),
  );

  // Transformed weights: \hat{W}_{r, c} = W_{r, c} * s_c
  const smoothedWeights: number[][] = Array.from({ length: M }, (_, r) =>
    Array.from({ length: K }, (_, c) => weights[r]![c]! * channelScales[c]!),
  );

  // Verification of GEMM mathematical invariance
  const WT = transposeMatrix(weights);
  const originalGemm = gemmMatrixMultiply(activations, WT);

  const smoothedWT = transposeMatrix(smoothedWeights);
  const smoothedGemm = gemmMatrixMultiply(smoothedActivations, smoothedWT);

  const gemmFrob = computeFrobeniusError(originalGemm, smoothedGemm);
  const gemmInvarianceError = gemmFrob.absoluteError;
  const isInvariant = gemmInvarianceError < 1e-4;

  const actDynamicRangeBefore = Math.max(...actMax) / Math.max(1e-6, Math.min(...actMax));
  const smoothedActMax = channelData.map((d) => d.actMaxSmoothed);
  const actDynamicRangeAfter =
    Math.max(...smoothedActMax) / Math.max(1e-6, Math.min(...smoothedActMax));

  const weightDynamicRangeBefore = Math.max(...weightMax) / Math.max(1e-6, Math.min(...weightMax));
  const smoothedWeightMax = channelData.map((d) => d.weightMaxSmoothed);
  const weightDynamicRangeAfter =
    Math.max(...smoothedWeightMax) / Math.max(1e-6, Math.min(...smoothedWeightMax));

  // Compute simulated INT8 W8A8 Quantization SQNR before and after SmoothQuant
  const naiveQuantW = quantizeINT4Groupwise(weights, { groupSize: "channel" });
  const naiveQuantA = quantizeINT4Groupwise(activations, { groupSize: "channel" });
  const naiveQuantWT = transposeMatrix(naiveQuantW.dequantizedMatrix as number[][]);
  const naiveOutput = gemmMatrixMultiply(naiveQuantA.dequantizedMatrix as number[][], naiveQuantWT);
  const naiveQuantSqnr = computeSQNR(originalGemm, naiveOutput);

  const smoothQuantW = quantizeINT4Groupwise(smoothedWeights, { groupSize: "channel" });
  const smoothQuantA = quantizeINT4Groupwise(smoothedActivations, { groupSize: "channel" });
  const smoothQuantWT = transposeMatrix(smoothQuantW.dequantizedMatrix as number[][]);
  const smoothOutput = gemmMatrixMultiply(
    smoothQuantA.dequantizedMatrix as number[][],
    smoothQuantWT,
  );
  const smoothQuantSqnr = computeSQNR(originalGemm, smoothOutput);
  const sqnrImprovementDb = Math.max(0, smoothQuantSqnr - naiveQuantSqnr);

  return {
    alpha,
    channelScales,
    smoothedActivations,
    smoothedWeights,
    originalGemmOutput: originalGemm,
    smoothedGemmOutput: smoothedGemm,
    gemmInvarianceError,
    isInvariant,
    actDynamicRangeBefore,
    actDynamicRangeAfter,
    weightDynamicRangeBefore,
    weightDynamicRangeAfter,
    channelData,
    naiveQuantSqnr,
    smoothQuantSqnr,
    sqnrImprovementDb,
  };
}

/**
 * Calculates absolute and relative Frobenius Norm Error: || A - B ||_F.
 */
export function computeFrobeniusError(
  original: number[][] | number[],
  quantized: number[][] | number[],
): FrobeniusResult {
  const flatA = flattenArray(original);
  const flatB = flattenArray(quantized);
  const len = Math.min(flatA.length, flatB.length);

  let sumSqErr = 0;
  let sumSqOrig = 0;
  let sumSqQuant = 0;

  for (let i = 0; i < len; i++) {
    const a = flatA[i] ?? 0;
    const b = flatB[i] ?? 0;
    const diff = a - b;
    sumSqErr += diff * diff;
    sumSqOrig += a * a;
    sumSqQuant += b * b;
  }

  const absoluteError = Math.sqrt(sumSqErr);
  const originalNorm = Math.sqrt(sumSqOrig);
  const quantizedNorm = Math.sqrt(sumSqQuant);
  const relativeError = originalNorm > 0 ? absoluteError / originalNorm : 0;

  return {
    absoluteError,
    relativeError,
    originalNorm,
    quantizedNorm,
  };
}

/**
 * Computes Signal-to-Quantization-Noise Ratio (SQNR in dB).
 */
export function computeSQNR(
  original: number[][] | number[],
  quantized: number[][] | number[],
): number {
  const flatA = flattenArray(original);
  const flatB = flattenArray(quantized);
  const len = Math.min(flatA.length, flatB.length);

  let signalPower = 0;
  let noisePower = 0;

  for (let i = 0; i < len; i++) {
    const s = flatA[i] ?? 0;
    const n = s - (flatB[i] ?? 0);
    signalPower += s * s;
    noisePower += n * n;
  }

  if (noisePower < 1e-12) return 100.0;
  if (signalPower < 1e-12) return 0.0;

  const sqnr = 10 * Math.log10(signalPower / noisePower);
  return Math.max(0, Math.min(100.0, sqnr));
}

/**
 * Computes Cosine Similarity between two tensors.
 */
export function computeCosineSimilarity(
  a: number[][] | number[],
  b: number[][] | number[],
): number {
  const flatA = flattenArray(a);
  const flatB = flattenArray(b);
  const len = Math.min(flatA.length, flatB.length);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    const va = flatA[i] ?? 0;
    const vb = flatB[i] ?? 0;
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-12) return 1.0;
  return Math.max(-1.0, Math.min(1.0, dot / denom));
}

/**
 * Computes Mean Absolute Error (MAE).
 */
export function computeMAE(
  original: number[][] | number[],
  quantized: number[][] | number[],
): number {
  const flatA = flattenArray(original);
  const flatB = flattenArray(quantized);
  const len = Math.min(flatA.length, flatB.length);
  if (len === 0) return 0;

  let sumAbs = 0;
  for (let i = 0; i < len; i++) {
    sumAbs += Math.abs((flatA[i] ?? 0) - (flatB[i] ?? 0));
  }
  return sumAbs / len;
}

/**
 * Computes Maximum Absolute Error.
 */
export function computeMaxError(
  original: number[][] | number[],
  quantized: number[][] | number[],
): number {
  const flatA = flattenArray(original);
  const flatB = flattenArray(quantized);
  const len = Math.min(flatA.length, flatB.length);
  let maxE = 0;
  for (let i = 0; i < len; i++) {
    const e = Math.abs((flatA[i] ?? 0) - (flatB[i] ?? 0));
    if (e > maxE) maxE = e;
  }
  return maxE;
}

/**
 * Estimates Perplexity Degradation (\Delta PPL) from SQNR and outlier retention.
 */
export function estimatePerplexityDelta(
  sqnr: number,
  _compressionRatio: number,
  hasOutlierProtection = true,
): PerplexityDeltaResult {
  let deltaPpl = 0.0;

  if (sqnr >= 40.0) {
    deltaPpl = 0.01;
  } else if (sqnr >= 32.0) {
    deltaPpl = 0.05 + (40.0 - sqnr) * 0.02;
  } else if (sqnr >= 25.0) {
    deltaPpl = 0.2 + (32.0 - sqnr) * 0.08;
  } else if (sqnr >= 18.0) {
    deltaPpl = 0.8 + (25.0 - sqnr) * 0.35;
  } else {
    deltaPpl = 3.5 + (18.0 - sqnr) * 0.8;
  }

  if (!hasOutlierProtection) {
    deltaPpl *= 2.5; // Unprotected outliers cause severe compounding degradation
  }

  deltaPpl = Math.round(deltaPpl * 100) / 100;

  if (deltaPpl <= 0.05) {
    return {
      deltaPpl,
      status: "lossless",
      badgeColor: "#10b981", // Emerald
      description:
        "Mathematically lossless representation. Zero noticeable downstream perplexity regression.",
      recommendation: "Ideal for production LLM inference serving at peak memory savings.",
    };
  } else if (deltaPpl <= 0.25) {
    return {
      deltaPpl,
      status: "negligible",
      badgeColor: "#38bdf8", // Sky
      description: "Negligible degradation. Near-perfect token sequence generation accuracy.",
      recommendation: "Standard production sweet-spot for INT4-AWQ and FP8 deployments.",
    };
  } else if (deltaPpl <= 1.0) {
    return {
      deltaPpl,
      status: "mild",
      badgeColor: "#f59e0b", // Amber
      description:
        "Mild perplexity increase. Minor degradation in complex reasoning or code synthesis.",
      recommendation: "Acceptable for memory-constrained edge hardware. Calibration recommended.",
    };
  } else if (deltaPpl <= 3.0) {
    return {
      deltaPpl,
      status: "severe",
      badgeColor: "#f97316", // Orange
      description: "Noticeable quality loss and increased token repetition rate.",
      recommendation: "Switch to group size 64/32 or enable AWQ alpha protection.",
    };
  } else {
    return {
      deltaPpl,
      status: "catastrophic",
      badgeColor: "#ef4444", // Red
      description:
        "Model breakdown. Severe quantization noise corrupts internal attention weights.",
      recommendation: "Unusable. Outliers require scaling migration or higher precision.",
    };
  }
}

/**
 * Calculates theoretical memory savings and bandwidth multipliers.
 */
export function calculateMemorySavings(
  _numRows: number,
  _numCols: number,
  format: "fp16" | "fp8" | "int8" | "int4",
  groupSize = 32,
): MemorySavingsResult {
  let bitsPerWeight = 16.0;
  if (format === "fp8") bitsPerWeight = 8.0;
  if (format === "int8") bitsPerWeight = 8.0;
  if (format === "int4") {
    const scaleOverhead = 16.0 / Math.max(1, groupSize);
    bitsPerWeight = 4.0 + scaleOverhead;
  }

  const bytesPerWeight = bitsPerWeight / 8.0;
  const compressionVsFP16 = 16.0 / bitsPerWeight;
  const vram8BModelGb = 8.0 * bytesPerWeight * 1.05; // 5% KV/overhead slack
  const vram70BModelGb = 70.0 * bytesPerWeight * 1.05;
  const vram405BModelGb = 405.0 * bytesPerWeight * 1.05;

  return {
    format,
    bitsPerWeight: Math.round(bitsPerWeight * 100) / 100,
    bytesPerWeight: Math.round(bytesPerWeight * 1000) / 1000,
    compressionVsFP16: Math.round(compressionVsFP16 * 100) / 100,
    vram8BModelGb: Math.round(vram8BModelGb * 10) / 10,
    vram70BModelGb: Math.round(vram70BModelGb * 10) / 10,
    vram405BModelGb: Math.round(vram405BModelGb * 10) / 10,
    effectiveBandwidthMultiplier: Math.round(compressionVsFP16 * 10) / 10,
  };
}

/**
 * Computes histogram bins for quantization residual errors.
 */
export function computeErrorHistogramBins(
  original: number[][] | number[],
  quantized: number[][] | number[],
  numBins = 15,
): HistogramBin[] {
  const flatA = flattenArray(original);
  const flatB = flattenArray(quantized);
  const len = Math.min(flatA.length, flatB.length);
  if (len === 0) return [];

  const errors: number[] = new Array(len);
  let minErr = Infinity;
  let maxErr = -Infinity;

  for (let i = 0; i < len; i++) {
    const e = (flatA[i] ?? 0) - (flatB[i] ?? 0);
    errors[i] = e;
    if (e < minErr) minErr = e;
    if (e > maxErr) maxErr = e;
  }

  // Symmetrize range around zero for clean visual display
  const maxBound = Math.max(Math.abs(minErr), Math.abs(maxErr), 1e-4);
  const binWidth = (2 * maxBound) / numBins;

  const bins: HistogramBin[] = Array.from({ length: numBins }, (_, idx) => {
    const bMin = -maxBound + idx * binWidth;
    const bMax = bMin + binWidth;
    const center = (bMin + bMax) / 2;
    const isZeroBin = bMin <= 0 && bMax >= 0;
    return {
      binIndex: idx,
      minVal: bMin,
      maxVal: bMax,
      centerVal: center,
      count: 0,
      percentage: 0,
      isZeroBin,
    };
  });

  for (const e of errors) {
    let bIdx = Math.floor((e + maxBound) / binWidth);
    if (bIdx < 0) bIdx = 0;
    if (bIdx >= numBins) bIdx = numBins - 1;
    (bins[bIdx] as { count: number }).count += 1;
  }

  for (const b of bins) {
    (b as { percentage: number }).percentage = Math.round((b.count / Math.max(1, len)) * 1000) / 10;
  }

  return bins;
}

// ============================================================================
// 3. PRESET GENERATOR & PRESETS DATA
// ============================================================================

/**
 * Deterministic pseudo-random number generator for reproducible matrix generation.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pseudoNormal(seed: number): number {
  const u1 = Math.max(1e-7, pseudoRandom(seed));
  const u2 = Math.max(1e-7, pseudoRandom(seed + 1000));
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

export function generatePresetMatrices(
  presetId: QuantizationPresetId,
  customConfig?: Partial<PresetData>,
): PresetData {
  const rows = customConfig?.rows ?? 16;
  const cols = customConfig?.cols ?? 16;
  const numTokens = customConfig?.numTokens ?? 8;

  const weights: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );
  const activations: number[][] = Array.from({ length: numTokens }, () =>
    Array.from({ length: cols }, () => 0),
  );

  let desc = "";

  if (presetId === "llama3_8b_attn_proj") {
    desc =
      "Llama-3 8B Query/Key Attention Projection weight slice with realistic kurtosis and isolated token outlier channels.";
    // Standard normal weights with small std dev
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        weights[r]![c] = pseudoNormal(r * cols + c + 1) * 0.15;
      }
    }
    // Activations with 2 salient channels (channel 2 and channel 11) having 10x magnitude
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        let base = pseudoNormal((t + 50) * cols + c + 200) * 0.4;
        if (c === 2) base *= 8.5; // Salient outlier channel
        if (c === 11) base *= 6.2; // Moderate salient channel
        activations[t]![c] = base;
      }
    }
  } else if (presetId === "mistral_7b_mlp_gate") {
    desc =
      "Mistral 7B SwiGLU Gate Projection exhibiting massive activation channel skew where 2 channels dominate 65% variance.";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        weights[r]![c] = pseudoNormal(r * cols + c + 300) * 0.12;
      }
    }
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        let base = pseudoNormal((t + 10) * cols + c + 500) * 0.3;
        if (c === 4) base *= 14.0; // Extreme outlier
        if (c === 13) base *= 9.5;
        activations[t]![c] = base;
      }
    }
  } else if (presetId === "deepseek_v3_moe_down") {
    desc =
      "DeepSeek V3 MoE Down Projection Routing Layer with high dynamic range and group-wise INT4 scaling requirement.";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const groupIndex = Math.floor(c / 8);
        const groupMultiplier = groupIndex === 0 ? 0.05 : 0.35;
        weights[r]![c] = pseudoNormal(r * cols + c + 700) * groupMultiplier;
      }
    }
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        activations[t]![c] = pseudoNormal((t + 20) * cols + c + 900) * 0.8;
      }
    }
  } else if (presetId === "outlier_stress_matrix") {
    desc =
      "Extreme Outlier Stress Test: 50x activation spikes on channels 3 & 12 causing catastrophic naive INT4 clipping without AWQ.";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        weights[r]![c] = pseudoNormal(r * cols + c + 1100) * 0.2;
      }
    }
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        let base = pseudoNormal((t + 30) * cols + c + 1300) * 0.25;
        if (c === 3) base *= 35.0; // Extreme 35x outlier
        if (c === 12) base *= 28.0; // Extreme 28x outlier
        activations[t]![c] = base;
      }
    }
  } else if (presetId === "fp8_dynamic_range_challenge") {
    desc =
      "FP8 Dynamic Range Challenge: Values spanning 0.002 to 420.0 testing E4M3 precision vs E5M2 range tradeoffs.";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * cols + c + 1500;
        const u = pseudoRandom(seed);
        if (u < 0.2) {
          weights[r]![c] = 0.001953125 * (1 + pseudoRandom(seed + 1) * 3); // Subnormal range
        } else if (u < 0.8) {
          weights[r]![c] = pseudoNormal(seed) * 2.5; // Normal range
        } else {
          weights[r]![c] = 150.0 + pseudoRandom(seed) * 280.0; // High range near 448
        }
      }
    }
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        activations[t]![c] = pseudoNormal((t + 40) * cols + c + 1700) * 1.5;
      }
    }
  } else if (presetId === "symmetric_vs_asymmetric") {
    desc =
      "Asymmetric Positively Shifted Distribution [0.2, 5.0] demonstrating +6dB SQNR gain with Asymmetric zero-point calibration.";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Shifted distribution centered at 2.6
        weights[r]![c] = 2.6 + pseudoNormal(r * cols + c + 1900) * 0.8;
      }
    }
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        activations[t]![c] = Math.abs(pseudoNormal((t + 50) * cols + c + 2100) * 0.7);
      }
    }
  } else {
    // Custom sandbox
    desc =
      "Custom User Sandbox: Fully interactive dimension, distribution, and group size controls.";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        weights[r]![c] = pseudoNormal(r * cols + c + 2300) * 0.25;
      }
    }
    for (let t = 0; t < numTokens; t++) {
      for (let c = 0; c < cols; c++) {
        let base = pseudoNormal((t + 60) * cols + c + 2500) * 0.5;
        if (c === 1 || c === 7) base *= 5.0;
        activations[t]![c] = base;
      }
    }
  }

  return {
    weights,
    activations,
    rows,
    cols,
    numTokens,
    description: desc,
  };
}

export const QUANTIZATION_AWQ_PRESETS: Record<QuantizationPresetId, QuantizationPreset> = {
  llama3_8b_attn_proj: {
    id: "llama3_8b_attn_proj",
    name: "Llama-3 8B Attention Projection",
    subtitle: "Attention Q-Proj (4096 dim) with Token Outlier Channels",
    description:
      "Meta Llama-3 8B attention projection layer with isolated activation channel outliers. Applying AWQ alpha protection prevents attention score degradation.",
    architectureFamily: "Llama-3 Transformer Attention",
    defaultGroupSize: 32,
    defaultScheme: "symmetric",
    defaultAwqAlpha: 0.65,
    defaultSmoothQuantAlpha: 0.5,
    highlightConcepts: [
      "Activation-Aware Salience Protection",
      "Group-wise INT4 Scaling (G=32)",
      "Attention Map Fidelity Preservation",
      "Alpha Grid Search Error Minimization",
    ],
    data: generatePresetMatrices("llama3_8b_attn_proj"),
  },

  mistral_7b_mlp_gate: {
    id: "mistral_7b_mlp_gate",
    name: "Mistral 7B SwiGLU MLP Gate",
    subtitle: "Hidden Dim (14336) with Heavy Activation Kurtosis",
    description:
      "Mistral 7B SwiGLU feedforward gate projection where 2 salient channels carry 65% of total layer energy. SmoothQuant migrates activation scale into weights for seamless W8A8 GEMMs.",
    architectureFamily: "Mistral SwiGLU FFN",
    defaultGroupSize: 32,
    defaultScheme: "symmetric",
    defaultAwqAlpha: 0.75,
    defaultSmoothQuantAlpha: 0.55,
    highlightConcepts: [
      "SmoothQuant Scale Migration",
      "Exact GEMM Invariance X W^T = \\hat{X} \\hat{W}^T",
      "SwiGLU Non-Linear Outlier Suppression",
      "High Kurtosis Dynamic Range Compression",
    ],
    data: generatePresetMatrices("mistral_7b_mlp_gate"),
  },

  deepseek_v3_moe_down: {
    id: "deepseek_v3_moe_down",
    name: "DeepSeek V3 MoE Down Projection",
    subtitle: "Routed Expert Down-Proj (2048 x 1408) Multi-Scale Grouping",
    description:
      "DeepSeek V3 MoE fine-grained expert down-projection layer requiring fine group-wise quantization (G=64/32) to prevent expert straggler accumulation.",
    architectureFamily: "DeepSeek MoE Architecture",
    defaultGroupSize: 64,
    defaultScheme: "symmetric",
    defaultAwqAlpha: 0.6,
    defaultSmoothQuantAlpha: 0.5,
    highlightConcepts: [
      "MoE Sparse Router Quantization",
      "Group-wise INT4 (G=64)",
      "Fine-Grained Expert Memory Packing",
      "Low VRAM Overhead per Expert",
    ],
    data: generatePresetMatrices("deepseek_v3_moe_down"),
  },

  outlier_stress_matrix: {
    id: "outlier_stress_matrix",
    name: "Extreme Activation Outlier Stress",
    subtitle: "50x Channel Spikes - Naive INT4 Failure Benchmark",
    description:
      "Adversarial matrix with 50x activation spikes on specific channels. Naive INT4 clips these channels completely, while AWQ salience scaling retains full signal precision.",
    architectureFamily: "Adversarial Stress Suite",
    defaultGroupSize: 32,
    defaultScheme: "symmetric",
    defaultAwqAlpha: 0.85,
    defaultSmoothQuantAlpha: 0.7,
    highlightConcepts: [
      "Severe Quantization Noise Clamping",
      "Top 1% Salient Channel Isolation",
      "AWQ Alpha Sweep Convexity",
      "Clipping vs Rounding Error Tradeoff",
    ],
    data: generatePresetMatrices("outlier_stress_matrix"),
  },

  fp8_dynamic_range_challenge: {
    id: "fp8_dynamic_range_challenge",
    name: "FP8 Dynamic Range Frontier",
    subtitle: "Subnormals to 448.0: E4M3 vs E5M2 Bitfield Inspector",
    description:
      "Precision stress test comparing Hopper FP8 E4M3 (1-4-3, max 448) vs IEEE E5M2 (1-5-2, max 57344). Demonstrates mantissa precision vs exponent dynamic range frontiers.",
    architectureFamily: "Silicon Microarchitecture Hardware",
    defaultGroupSize: "tensor",
    defaultScheme: "symmetric",
    defaultAwqAlpha: 0.5,
    defaultSmoothQuantAlpha: 0.5,
    highlightConcepts: [
      "OCP FP8 E4M3 vs IEEE FP8 E5M2",
      "Subnormal Underflow Thresholds",
      "Hopper / Blackwell FP8 Tensor Cores",
      "Mantissa Bit Precision Tradeoffs",
    ],
    data: generatePresetMatrices("fp8_dynamic_range_challenge"),
  },

  symmetric_vs_asymmetric: {
    id: "symmetric_vs_asymmetric",
    name: "Symmetric vs Asymmetric Quantization",
    subtitle: "Positively Shifted Tensor [0.2, 5.0] with Zero-Point Offset",
    description:
      "Asymmetric positively shifted distribution showing how affine zero-point calibration (Z in [0, 15]) gains +6dB SQNR over symmetric clamping.",
    architectureFamily: "Affine Calibration Suite",
    defaultGroupSize: 32,
    defaultScheme: "asymmetric",
    defaultAwqAlpha: 0.5,
    defaultSmoothQuantAlpha: 0.5,
    highlightConcepts: [
      "Affine Zero-Point Calibration Z = round(-min/S)",
      "Unsigned INT4 [0, 15] vs Signed [-8, 7]",
      "Quantization Dynamic Range Utilization",
      "Memory Overhead of Storing Zero-Points",
    ],
    data: generatePresetMatrices("symmetric_vs_asymmetric"),
  },

  custom: {
    id: "custom",
    name: "Custom Matrix & Quantization Sandbox",
    subtitle: "Interactive Dimensions, Group Sizes, and Alpha Tuning",
    description:
      "Fully configurable playground to test arbitrary activation distributions, weight tensors, INT4 grouping granularity, and SmoothQuant migration factors.",
    architectureFamily: "User Interactive Sandbox",
    defaultGroupSize: 32,
    defaultScheme: "symmetric",
    defaultAwqAlpha: 0.6,
    defaultSmoothQuantAlpha: 0.5,
    highlightConcepts: [
      "Live Parameter Tweaking",
      "Interactive Alpha Sweep Optimization",
      "Real-time Heatmap & Residual Diff",
      "Hardware Roofline Multipliers",
    ],
    data: generatePresetMatrices("custom"),
  },
};

// ============================================================================
// 4. MAIN REACT COMPONENT: QuantizationAWQStudio
// ============================================================================

export const QuantizationAWQStudio: React.FC<QuantizationAWQStudioProps> = ({
  initialPreset = "llama3_8b_attn_proj",
  initialTab = "awq_salience",
  standalone = true,
  title = "FP8 / INT4 & AWQ / SmoothQuant Quantization Studio",
  onPresetChange,
  onTabChange,
}) => {
  // Preset and Tab State
  const [selectedPresetId, setSelectedPresetId] = useState<QuantizationPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<QuantStudioTabId>(initialTab);

  // Hyperparameters
  const currentPreset =
    QUANTIZATION_AWQ_PRESETS[selectedPresetId] ?? QUANTIZATION_AWQ_PRESETS.llama3_8b_attn_proj;
  const [groupSize, setGroupSize] = useState<INT4GroupSizeOption>(currentPreset.defaultGroupSize);
  const [scheme, setScheme] = useState<INT4Scheme>(currentPreset.defaultScheme);
  const [awqAlpha, setAwqAlpha] = useState<number>(currentPreset.defaultAwqAlpha);
  const [smoothQuantAlpha, setSmoothQuantAlpha] = useState<number>(
    currentPreset.defaultSmoothQuantAlpha,
  );

  // FP8 Bitfield Inspector State
  const [fp8Format, setFp8Format] = useState<FP8FormatType>("fp8_e4m3");
  const [fp8FloatInput, setFp8FloatInput] = useState<number>(1.75);
  const [fp8ByteState, setFp8ByteState] = useState<number>(() => floatToFP8E4M3(1.75));

  // Heatmap Inspection State
  const [heatmapViewMode, setHeatmapViewMode] = useState<
    "original" | "quantized" | "error" | "scaled"
  >("error");
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
    orig: number;
    quant: number;
    err: number;
  } | null>(null);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState<number>(0);

  // Synchronize on Preset change
  const handleSelectPreset = useCallback(
    (presetId: QuantizationPresetId) => {
      setSelectedPresetId(presetId);
      const p = QUANTIZATION_AWQ_PRESETS[presetId];
      if (p) {
        setGroupSize(p.defaultGroupSize);
        setScheme(p.defaultScheme);
        setAwqAlpha(p.defaultAwqAlpha);
        setSmoothQuantAlpha(p.defaultSmoothQuantAlpha);
      }
      onPresetChange?.(presetId);
    },
    [onPresetChange],
  );

  const handleTabSwitch = useCallback(
    (tabId: QuantStudioTabId) => {
      setActiveTab(tabId);
      onTabChange?.(tabId);
    },
    [onTabChange],
  );

  // Memoized Computations
  const weights = useMemo(() => currentPreset.data.weights as number[][], [currentPreset]);
  const activations = useMemo(() => currentPreset.data.activations as number[][], [currentPreset]);

  // 1. INT4 Quantization Result
  const int4Result = useMemo(() => {
    return quantizeINT4Groupwise(weights, { scheme, groupSize });
  }, [weights, scheme, groupSize]);

  // 2. AWQ Search Result
  const awqResult = useMemo(() => {
    return searchOptimalAWQAlpha(weights, activations, {
      groupSize,
      scheme,
      alphaMin: 0.0,
      alphaMax: 1.0,
      step: 0.05,
    });
  }, [weights, activations, groupSize, scheme]);

  // 3. SmoothQuant Result
  const smoothQuantResult = useMemo(() => {
    return applySmoothQuantTransform(activations, weights, smoothQuantAlpha);
  }, [activations, weights, smoothQuantAlpha]);

  // 4. Memory Savings & Perplexity Gauge
  const memoryStats = useMemo(() => {
    return calculateMemorySavings(
      currentPreset.data.rows,
      currentPreset.data.cols,
      "int4",
      int4Result.groupSize,
    );
  }, [currentPreset, int4Result.groupSize]);

  const pplGauge = useMemo(() => {
    return estimatePerplexityDelta(int4Result.sqnrDb, int4Result.compressionRatio, true);
  }, [int4Result.sqnrDb, int4Result.compressionRatio]);

  // 5. Error Histogram
  const histogramBins = useMemo(() => {
    return computeErrorHistogramBins(weights, int4Result.dequantizedMatrix as number[][], 15);
  }, [weights, int4Result.dequantizedMatrix]);

  // FP8 Bitfield Decomposition
  const fp8Decomposition = useMemo(() => {
    return decomposeFP8(fp8ByteState, fp8Format, true);
  }, [fp8ByteState, fp8Format]);

  // Handle float input change for FP8
  const handleFp8FloatChange = useCallback(
    (val: number) => {
      setFp8FloatInput(val);
      const byte = fp8Format === "fp8_e4m3" ? floatToFP8E4M3(val) : floatToFP8E5M2(val);
      setFp8ByteState(byte);
    },
    [fp8Format],
  );

  // Toggle individual FP8 bit
  const handleToggleFp8Bit = useCallback((bitIndex: number) => {
    setFp8ByteState((prev) => {
      const mask = 1 << (7 - bitIndex);
      const nextByte = prev ^ mask;
      return nextByte & 0xff;
    });
  }, []);

  // Set FP8 quick value
  const handleFp8QuickVal = useCallback(
    (val: number) => {
      setFp8FloatInput(val);
      const byte = fp8Format === "fp8_e4m3" ? floatToFP8E4M3(val) : floatToFP8E5M2(val);
      setFp8ByteState(byte);
    },
    [fp8Format],
  );

  return (
    <div
      className={`flex flex-col w-full min-h-[750px] bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "my-4" : ""
      }`}
    >
      {/* -------------------------------------------------------------------- */}
      {/* HEADER & PRESET SELECTOR                                              */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Binary className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                FP8 · INT4 · AWQ · SmoothQuant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive numerical workbench for low-precision tensor quantization, salience
              protection, and migration transforms
            </p>
          </div>
        </div>

        {/* Preset Selector Dropdown / Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Boxes className="w-3.5 h-3.5 text-emerald-400" /> Presets:
          </span>
          {Object.values(QUANTIZATION_AWQ_PRESETS).map((preset) => {
            const isSelected = preset.id === selectedPresetId;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                title={preset.description}
              >
                {preset.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* GLOBAL TELEMETRY PILL BAR                                            */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-slate-900/60 border-b border-slate-800/80 text-xs">
        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Format / Scheme
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-white capitalize">INT4 ({scheme})</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-cyan-300">
              G={int4Result.groupSize}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Bits / Weight
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-emerald-400">{int4Result.bitsPerWeight} bpp</span>
            <span className="text-slate-400 text-[10px]">
              {int4Result.compressionRatio.toFixed(1)}x vs FP16
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            SQNR (Signal Quality)
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-amber-400">{int4Result.sqnrDb.toFixed(1)} dB</span>
            <span className="text-slate-400 text-[10px]">
              Cosine: {int4Result.cosineSimilarity.toFixed(4)}
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Frobenius Error ||W - Ŵ||
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-rose-400">
              {int4Result.frobeniusError.toFixed(3)}
            </span>
            <span className="text-slate-400 text-[10px]">
              Rel: {(int4Result.relativeFrobeniusError * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            AWQ Optimal α*
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-semibold text-cyan-400">
              α = {awqResult.optimalAlpha.toFixed(2)}
            </span>
            <span className="text-emerald-400 text-[10px] font-bold">
              +{awqResult.sqnrGainDb.toFixed(1)} dB gain
            </span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex flex-col">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
            Perplexity ΔPPL
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="font-bold" style={{ color: pplGauge.badgeColor }}>
              +{pplGauge.deltaPpl.toFixed(2)}
            </span>
            <span
              className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase"
              style={{
                backgroundColor: `${pplGauge.badgeColor}22`,
                color: pplGauge.badgeColor,
              }}
            >
              {pplGauge.status}
            </span>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TABS NAVIGATION                                                      */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex overflow-x-auto bg-slate-900/90 border-b border-slate-800 px-4 py-2 gap-2 scrollbar-thin">
        {[
          {
            id: "awq_salience" as QuantStudioTabId,
            label: "AWQ Salience & Alpha Search",
            icon: Sparkles,
          },
          {
            id: "smoothquant" as QuantStudioTabId,
            label: "SmoothQuant Scale Migration",
            icon: ArrowRightLeft,
          },
          {
            id: "fp8_inspector" as QuantStudioTabId,
            label: "FP8 Bitfield Inspector",
            icon: Binary,
          },
          {
            id: "int4_groupwise" as QuantStudioTabId,
            label: "INT4 Group Workbench",
            icon: Sliders,
          },
          {
            id: "weight_heatmap_error" as QuantStudioTabId,
            label: "Matrix Heatmap & Error Residuals",
            icon: Layers,
          },
          {
            id: "metrics_dashboard" as QuantStudioTabId,
            label: "Metrics & VRAM Footprint",
            icon: BarChart3,
          },
          {
            id: "theory_deep_dive" as QuantStudioTabId,
            label: "Theory & Hardware Mechanics",
            icon: Info,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TAB CONTENT AREA                                                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        {/* ================================================================== */}
        {/* TAB 1: AWQ SALIENCE & ALPHA SEARCH                                */}
        {/* ================================================================== */}
        {activeTab === "awq_salience" && (
          <div className="flex flex-col gap-6">
            {/* Top Concept Callout */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    AWQ: Activation-aware Weight Quantization
                    <span className="text-[11px] font-normal text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Lin et al. MLSys 2024
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    LLM weights are not equally important. Top 1% salient weights correspond to
                    channels carrying high activation magnitudes{" "}
                    <code className="text-emerald-300 font-mono">{"s_X(j) = E[|X_{:, j}|]"}</code>.
                    AWQ protects salient weights by per-channel scaling{" "}
                    <code className="text-cyan-300 font-mono">{"s_j = s_X(j)^α"}</code>, reducing
                    relative quantization noise without mixed-precision memory fragmentation.
                  </p>
                </div>
              </div>

              {/* Quick Alpha Slider */}
              <div className="w-full md:w-64 bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Protection α:</span>
                  <span className="font-mono font-bold text-cyan-400">{awqAlpha.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={awqAlpha}
                  onChange={(e) => setAwqAlpha(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.0 (Naive)</span>
                  <button
                    onClick={() => setAwqAlpha(awqResult.optimalAlpha)}
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    Set Optimal (α*={awqResult.optimalAlpha})
                  </button>
                  <span>1.0 (Full)</span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Naive INT4 (α = 0.0)
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-amber-400">
                      {awqResult.baselineSqnr.toFixed(1)} dB
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Output Loss: {awqResult.baselineLoss.toFixed(4)}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  Unprotected outliers suffer severe rounding distortion and clipping noise.
                </div>
              </div>

              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between bg-gradient-to-br from-emerald-950/20 to-slate-900">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      AWQ Protected INT4 (α* = {awqResult.optimalAlpha})
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-bold text-emerald-400">
                      {awqResult.optimalSqnr.toFixed(1)} dB
                    </div>
                    <div className="text-xs text-emerald-300 mt-1">
                      Output Loss: {awqResult.minLoss.toFixed(4)} (
                      <span className="font-bold">
                        -{awqResult.lossReductionPct.toFixed(1)}% error
                      </span>
                      )
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-emerald-300 font-medium">
                  Salient channels protected by s = s_X^α*. SQNR increased by +
                  {awqResult.sqnrGainDb.toFixed(1)} dB.
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Top Salient Channels
                    </span>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {awqResult.topSalientChannels.map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-1 bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono font-semibold rounded"
                      >
                        Ch #{ch} ({awqResult.channelSalience[ch]?.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                  {"Identified by mean activation magnitude E[|X[:, j]|]."}
                </div>
              </div>
            </div>

            {/* Grid Search Curve & Channel Salience Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alpha Sweep Curve (SVG) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    Grid Search α vs Output MSE Loss
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    L(α) = || X W^T - X Ŵ(α)^T ||_F^2
                  </span>
                </div>

                <div className="relative w-full h-56 bg-slate-950 rounded-lg border border-slate-800 p-2 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 500 200">
                    {/* Grid lines */}
                    <line
                      x1="40"
                      y1="20"
                      x2="480"
                      y2="20"
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1="40"
                      y1="90"
                      x2="480"
                      y2="90"
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1="40"
                      y1="160"
                      x2="480"
                      y2="160"
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />

                    {/* Y Axis Labels */}
                    <text x="35" y="24" fill="#94a3b8" fontSize="10" textAnchor="end">
                      {Math.max(...awqResult.sweepPoints.map((p) => p.loss)).toFixed(3)}
                    </text>
                    <text x="35" y="164" fill="#94a3b8" fontSize="10" textAnchor="end">
                      {Math.min(...awqResult.sweepPoints.map((p) => p.loss)).toFixed(3)}
                    </text>

                    {/* Loss Curve */}
                    {(() => {
                      const pts = awqResult.sweepPoints;
                      if (pts.length === 0) return null;
                      const minL = Math.min(...pts.map((p) => p.loss));
                      const maxL = Math.max(...pts.map((p) => p.loss), minL + 1e-4);
                      const lRange = maxL - minL;

                      const svgCoords = pts.map((p) => {
                        const x = 50 + (p.alpha / 1.0) * 420;
                        const y = 160 - ((p.loss - minL) / lRange) * 135;
                        return { x, y, alpha: p.alpha, loss: p.loss };
                      });

                      const pathD = svgCoords.reduce(
                        (acc, curr, idx) =>
                          idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`,
                        "",
                      );

                      const optPoint = svgCoords.find(
                        (c) => Math.abs(c.alpha - awqResult.optimalAlpha) < 0.01,
                      );

                      return (
                        <g>
                          {/* Gradient fill area */}
                          <path
                            d={`${pathD} L 470 160 L 50 160 Z`}
                            fill="url(#awqGradient)"
                            opacity="0.25"
                          />
                          <defs>
                            <linearGradient id="awqGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Line */}
                          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" />

                          {/* Data points */}
                          {svgCoords.map((c, i) => (
                            <circle
                              key={i}
                              cx={c.x}
                              cy={c.y}
                              r={Math.abs(c.alpha - awqResult.optimalAlpha) < 0.01 ? 5 : 2.5}
                              fill={
                                Math.abs(c.alpha - awqResult.optimalAlpha) < 0.01
                                  ? "#38bdf8"
                                  : "#10b981"
                              }
                              stroke="#0f172a"
                              strokeWidth="1.5"
                            />
                          ))}

                          {/* Optimal Marker */}
                          {optPoint && (
                            <g>
                              <circle
                                cx={optPoint.x}
                                cy={optPoint.y}
                                r="8"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2"
                                strokeDasharray="2 2"
                              />
                              <text
                                x={optPoint.x}
                                y={optPoint.y - 12}
                                fill="#38bdf8"
                                fontSize="10"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                Optimal α* = {awqResult.optimalAlpha}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })()}

                    {/* X Axis labels */}
                    <text x="50" y="185" fill="#94a3b8" fontSize="10" textAnchor="middle">
                      α=0.0
                    </text>
                    <text x="260" y="185" fill="#94a3b8" fontSize="10" textAnchor="middle">
                      α=0.5
                    </text>
                    <text x="470" y="185" fill="#94a3b8" fontSize="10" textAnchor="middle">
                      α=1.0
                    </text>
                  </svg>
                </div>
              </div>

              {/* Channel Salience Bar Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Channel Activation Salience s_X(j)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    K = {currentPreset.data.cols} channels
                  </span>
                </div>

                <div className="relative w-full h-56 bg-slate-950 rounded-lg border border-slate-800 p-2 overflow-hidden flex items-end justify-between gap-1">
                  {awqResult.channelSalience.map((val, idx) => {
                    const maxSalience = Math.max(...awqResult.channelSalience, 1e-4);
                    const heightPct = Math.min(100, Math.max(6, (val / maxSalience) * 90));
                    const isTop = awqResult.topSalientChannels.includes(idx);
                    const scaleFactor = awqResult.optimalChannelScales[idx] ?? 1.0;

                    return (
                      <div
                        key={idx}
                        className="flex-1 flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-12 bg-slate-800 text-[10px] text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap border border-slate-700">
                          Ch #{idx}: Salience={val.toFixed(2)}, Scale={scaleFactor.toFixed(2)}
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t transition-all ${
                            isTop
                              ? "bg-gradient-to-t from-cyan-600 to-cyan-400 shadow-sm shadow-cyan-500/50"
                              : "bg-slate-700 hover:bg-slate-600"
                          }`}
                        />
                        <span className="text-[9px] text-slate-500 mt-1 font-mono">{idx}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: SMOOTHQUANT SCALE MIGRATION                                */}
        {/* ================================================================== */}
        {activeTab === "smoothquant" && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    SmoothQuant: Mathematical Migration Transform
                    <span className="text-[11px] font-normal text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Xiao et al. ICML 2023
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Activations have extreme outlier channels while weights are uniform. SmoothQuant
                    mathematically migrates activation quantization difficulty to weights via
                    per-channel scale{" "}
                    <code className="text-cyan-300 font-mono">
                      {"s_j = max(|X[:, j]|)^α / max(|W[j, :]|)^(1-α)"}
                    </code>
                    . Preserves GEMM output:{" "}
                    <code className="text-emerald-300 font-mono">
                      {"(X · diag(s)^(-1)) · (diag(s) · W)^T = X · W^T"}
                    </code>
                    .
                  </p>
                </div>
              </div>

              {/* Migration Strength Alpha Slider */}
              <div className="w-full md:w-64 bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Migration Strength α:</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {smoothQuantAlpha.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={smoothQuantAlpha}
                  onChange={(e) => setSmoothQuantAlpha(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.0 (All on X)</span>
                  <span className="text-cyan-400 font-semibold">0.5 (Balanced)</span>
                  <span>1.0 (All on W)</span>
                </div>
              </div>
            </div>

            {/* Invariance Badge & Dynamic Range Compression */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    GEMM Invariance
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2">
                  <div className="text-xl font-bold text-white">
                    ||X̂ Ŵ^T - X W^T||_F = {smoothQuantResult.gemmInvarianceError.toExponential(2)}
                  </div>
                  <div className="text-xs text-emerald-400 mt-1 font-semibold">
                    ✓ Mathematically Exact Invariant
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Act Dynamic Range
                </span>
                <div className="mt-2">
                  <div className="text-xl font-bold text-white">
                    {smoothQuantResult.actDynamicRangeBefore.toFixed(1)}x →{" "}
                    <span className="text-emerald-400">
                      {smoothQuantResult.actDynamicRangeAfter.toFixed(1)}x
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Reduced by{" "}
                    {(
                      (1 -
                        smoothQuantResult.actDynamicRangeAfter /
                          smoothQuantResult.actDynamicRangeBefore) *
                      100
                    ).toFixed(0)}
                    %
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Weight Dynamic Range
                </span>
                <div className="mt-2">
                  <div className="text-xl font-bold text-white">
                    {smoothQuantResult.weightDynamicRangeBefore.toFixed(1)}x →{" "}
                    <span className="text-amber-400">
                      {smoothQuantResult.weightDynamicRangeAfter.toFixed(1)}x
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Absorbed by weight tensor</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  W8A8 SQNR Gain
                </span>
                <div className="mt-2">
                  <div className="text-xl font-bold text-emerald-400">
                    +{smoothQuantResult.sqnrImprovementDb.toFixed(1)} dB
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {smoothQuantResult.naiveQuantSqnr.toFixed(1)} dB →{" "}
                    {smoothQuantResult.smoothQuantSqnr.toFixed(1)} dB
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Mathematical Transform Pipeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Step-by-Step SmoothQuant Transformation Pipeline
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase">
                    Step 1: Outlier Channel Scale
                  </span>
                  <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                    {`s_j = (max |X[:, j]|)^${smoothQuantAlpha.toFixed(2)} / (max |W[j, :]|^${(1 - smoothQuantAlpha).toFixed(2)})`}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Calculates smoothing vector <code className="text-cyan-300 font-mono">s</code>{" "}
                    balancing activation outlier suppression and weight dynamic range.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">
                    Step 2: Equivalent Transform
                  </span>
                  <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                    {"X̂ = X · diag(s)^(-1), Ŵ = diag(s) · W"}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Scale is divided from activations (e.g. folded into preceding LayerNorm) and
                    multiplied into weights.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-amber-400 uppercase">
                    Step 3: INT8 / INT4 GEMM
                  </span>
                  <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-800">
                    Y = Q(X̂) · Q(Ŵ)^T
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Both X̂ and Ŵ have uniform distributions, executing at peak tensor core INT8/INT4
                    GEMM speeds.
                  </p>
                </div>
              </div>
            </div>

            {/* Channel-by-Channel Scale Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-x-auto">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                Channel Scale Factors & Dynamic Range Attenuation
              </h4>
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Channel</th>
                    <th className="pb-2 font-semibold">Act Max |X|</th>
                    <th className="pb-2 font-semibold">Weight Max |W|</th>
                    <th className="pb-2 font-semibold text-cyan-400">Scale Factor s_j</th>
                    <th className="pb-2 font-semibold text-emerald-400">Smoothed Act |X̂|</th>
                    <th className="pb-2 font-semibold text-amber-400">Smoothed Weight |Ŵ|</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {smoothQuantResult.channelData.slice(0, 8).map((d) => (
                    <tr key={d.channelIndex} className="hover:bg-slate-800/40">
                      <td className="py-1.5 font-bold text-white">Ch #{d.channelIndex}</td>
                      <td className="py-1.5">{d.actMax.toFixed(3)}</td>
                      <td className="py-1.5">{d.weightMax.toFixed(3)}</td>
                      <td className="py-1.5 font-bold text-cyan-400">{d.scaleFactor.toFixed(3)}</td>
                      <td className="py-1.5 font-bold text-emerald-400">
                        {d.actMaxSmoothed.toFixed(3)}
                      </td>
                      <td className="py-1.5 font-bold text-amber-400">
                        {d.weightMaxSmoothed.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: FP8 BITFIELD INSPECTOR                                     */}
        {/* ================================================================== */}
        {activeTab === "fp8_inspector" && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 mt-0.5">
                  <Binary className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Interactive FP8 Bitfield Inspector: E4M3 vs E5M2
                    <span className="text-[11px] font-normal text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                      NVIDIA Hopper & Blackwell
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Toggle individual bits or enter arbitrary float numbers. Compare OCP FP8 E4M3
                    (1-4-3, max 448.0, bias 7, for forward weights/activations) vs IEEE FP8 E5M2
                    (1-5-2, max 57344.0, bias 15, for gradients).
                  </p>
                </div>
              </div>

              {/* Format Toggle */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => {
                    setFp8Format("fp8_e4m3");
                    setFp8ByteState(floatToFP8E4M3(fp8FloatInput));
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    fp8Format === "fp8_e4m3"
                      ? "bg-rose-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  FP8 E4M3 (Forward)
                </button>
                <button
                  onClick={() => {
                    setFp8Format("fp8_e5m2");
                    setFp8ByteState(floatToFP8E5M2(fp8FloatInput));
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                    fp8Format === "fp8_e5m2"
                      ? "bg-rose-500 text-slate-950 shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  FP8 E5M2 (Gradients)
                </button>
              </div>
            </div>

            {/* Float Input & Quick Presets */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <label className="text-xs font-bold text-slate-300 whitespace-nowrap">
                  Float Input:
                </label>
                <input
                  type="number"
                  step="any"
                  value={fp8FloatInput}
                  onChange={(e) => handleFp8FloatChange(parseFloat(e.target.value) || 0)}
                  className="bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-rose-500 w-36"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-semibold mr-1">Quick Numbers:</span>
                {[
                  { label: "1.0", val: 1.0 },
                  { label: "-1.0", val: -1.0 },
                  { label: "0.00195", val: 0.001953125 },
                  { label: "3.14", val: 3.140625 },
                  { label: "448.0 (Max E4)", val: 448.0 },
                  { label: "57344.0 (Max E5)", val: 57344.0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleFp8QuickVal(item.val)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded font-mono text-slate-300 hover:text-white"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive 8-Bit Box Array */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center gap-6">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Click any bit to flip (MSB b7 → LSB b0)
              </div>

              {/* Bit buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {Array.from({ length: 8 }).map((_, bitIdx) => {
                  const bitVal = (fp8ByteState & (1 << (7 - bitIdx))) !== 0 ? 1 : 0;
                  const isSign = bitIdx === 0;
                  const isExp =
                    fp8Format === "fp8_e4m3"
                      ? bitIdx >= 1 && bitIdx <= 4
                      : bitIdx >= 1 && bitIdx <= 5;

                  let bitColor = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                  let label = `M${fp8Format === "fp8_e4m3" ? 7 - bitIdx : 7 - bitIdx}`;
                  if (isSign) {
                    bitColor = "border-rose-500 bg-rose-500/10 text-rose-300";
                    label = "S";
                  } else if (isExp) {
                    bitColor = "border-sky-500 bg-sky-500/10 text-sky-300";
                    label = `E${fp8Format === "fp8_e4m3" ? 4 - bitIdx : 5 - bitIdx}`;
                  }

                  return (
                    <button
                      key={bitIdx}
                      onClick={() => handleToggleFp8Bit(bitIdx)}
                      className={`w-11 h-16 sm:w-14 sm:h-20 rounded-xl border-2 flex flex-col items-center justify-between p-2 font-mono font-bold transition-all transform hover:scale-105 active:scale-95 ${bitColor}`}
                    >
                      <span className="text-[10px] text-slate-400 font-semibold">{label}</span>
                      <span className="text-xl sm:text-2xl">{bitVal}</span>
                      <span className="text-[9px] text-slate-500">b{7 - bitIdx}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bit Legend */}
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500" />
                  <span className="text-slate-300">1 Sign Bit (b7)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-500" />
                  <span className="text-slate-300">
                    {fp8Format === "fp8_e4m3"
                      ? "4 Exponent Bits (bias 7)"
                      : "5 Exponent Bits (bias 15)"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span className="text-slate-300">
                    {fp8Format === "fp8_e4m3" ? "3 Mantissa Bits" : "2 Mantissa Bits"}
                  </span>
                </div>
              </div>

              {/* Mathematical Decoding Breakdown */}
              <div className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Byte Representation:</span>
                  <span className="text-white font-bold">
                    0x{fp8ByteState.toString(16).toUpperCase().padStart(2, "0")} (
                    {fp8Decomposition.bitString})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">Sign Factor</span>
                    <span className="text-rose-400 font-bold text-sm">
                      (-1)^{fp8Decomposition.sign} = {fp8Decomposition.sign === 1 ? "-1" : "+1"}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">
                      Exponent 2^(E - Bias)
                    </span>
                    <span className="text-sky-400 font-bold text-sm">
                      2^({fp8Decomposition.exponentBiased} - {fp8Format === "fp8_e4m3" ? 7 : 15}) =
                      2^{fp8Decomposition.exponentUnbiased}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase block">
                      Mantissa Fraction
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      {fp8Decomposition.isSubnormal
                        ? `(0 + ${fp8Decomposition.mantissaInt}/${fp8Format === "fp8_e4m3" ? 8 : 4})`
                        : `(1 + ${fp8Decomposition.mantissaInt}/${fp8Format === "fp8_e4m3" ? 8 : 4}) = ${fp8Decomposition.mantissaFraction.toFixed(3)}`}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-900 p-3 rounded-lg border border-slate-800 mt-1">
                  <span className="text-slate-300 font-bold">Reconstructed Float:</span>
                  <span className="text-lg font-bold text-emerald-400">
                    {Number.isNaN(fp8Decomposition.reconstructedValue)
                      ? "NaN"
                      : fp8Decomposition.reconstructedValue}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: INT4 GROUP-WISE QUANTIZATION WORKBENCH                      */}
        {/* ================================================================== */}
        {activeTab === "int4_groupwise" && (
          <div className="flex flex-col gap-6">
            {/* Group Configuration Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    INT4 Group-Wise Quantization Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configurable group sizes with independent scale and zero-point parameters
                  </p>
                </div>
              </div>

              {/* Group Size and Scheme Selectors */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Scheme */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setScheme("symmetric")}
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      scheme === "symmetric"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Symmetric [-8, 7]
                  </button>
                  <button
                    onClick={() => setScheme("asymmetric")}
                    className={`px-3 py-1 text-xs font-bold rounded ${
                      scheme === "asymmetric"
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Asymmetric [0, 15]
                  </button>
                </div>

                {/* Group Size */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <span className="text-slate-400 px-1 font-semibold">Group Size G:</span>
                  {([16, 32, 64, 128, "channel", "tensor"] as INT4GroupSizeOption[]).map((sz) => (
                    <button
                      key={String(sz)}
                      onClick={() => setGroupSize(sz)}
                      className={`px-2 py-0.5 rounded font-mono font-semibold ${
                        groupSize === sz
                          ? "bg-cyan-500 text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {String(sz)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Group Grid Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Quantization Groups ({int4Result.numGroups} Total Groups)
                </h4>
                <span className="text-xs text-slate-400">
                  Select a group to inspect element-wise rounding noise
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {int4Result.groups.map((grp) => {
                  const isSel = grp.groupIndex === selectedGroupIdx;
                  return (
                    <button
                      key={grp.groupIndex}
                      onClick={() => setSelectedGroupIdx(grp.groupIndex)}
                      className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                        isSel
                          ? "bg-emerald-950 border-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span>Group #{grp.groupIndex}</span>
                        <span className="font-mono text-cyan-400">S={grp.scale.toFixed(3)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        MSE: {grp.mse.toFixed(4)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Group Element Breakdown */}
            {int4Result.groups[selectedGroupIdx] && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Group #{selectedGroupIdx} Detailed Element Inspection
                  </h4>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-cyan-400 font-semibold">
                      Scale (S): {int4Result.groups[selectedGroupIdx]?.scale.toFixed(4)}
                    </span>
                    <span className="text-amber-400 font-semibold">
                      Zero-Point (Z): {int4Result.groups[selectedGroupIdx]?.zeroPoint}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2">Idx</th>
                        <th className="pb-2">Original Float (W)</th>
                        <th className="pb-2 text-cyan-400">Quantized INT4 (Q)</th>
                        <th className="pb-2 text-emerald-400">Dequantized Float (Ŵ)</th>
                        <th className="pb-2 text-rose-400">Error (W - Ŵ)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {int4Result.groups[selectedGroupIdx]?.originalValues
                        .slice(0, 16)
                        .map((orig, i) => {
                          const q = int4Result.groups[selectedGroupIdx]?.quantizedValues[i] ?? 0;
                          const dequant =
                            int4Result.groups[selectedGroupIdx]?.dequantizedValues[i] ?? 0;
                          const err = int4Result.groups[selectedGroupIdx]?.errors[i] ?? 0;
                          return (
                            <tr key={i} className="hover:bg-slate-800/40">
                              <td className="py-1.5 text-slate-500">#{i}</td>
                              <td className="py-1.5 font-bold text-white">{orig.toFixed(4)}</td>
                              <td className="py-1.5 font-bold text-cyan-400">{q}</td>
                              <td className="py-1.5 font-bold text-emerald-400">
                                {dequant.toFixed(4)}
                              </td>
                              <td className="py-1.5 font-bold text-rose-400">{err.toFixed(4)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: WEIGHT MATRIX HEATMAP & RESIDUALS                          */}
        {/* ================================================================== */}
        {activeTab === "weight_heatmap_error" && (
          <div className="flex flex-col gap-6">
            {/* View Mode Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  2D Weight Matrix Heatmap & Residual Inspector
                </h3>
                <p className="text-xs text-slate-400">
                  Hover over cells to view exact float values and quantization noise
                </p>
              </div>

              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {[
                  { id: "error", label: "Error |W - Ŵ|" },
                  { id: "original", label: "Original Float W" },
                  { id: "quantized", label: "Quantized Ŵ" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setHeatmapViewMode(mode.id as typeof heatmapViewMode)}
                    className={`px-3 py-1.5 font-semibold rounded ${
                      heatmapViewMode === mode.id
                        ? "bg-emerald-500 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Heatmap Grid */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
              <div
                className="grid gap-1 p-2 bg-slate-950 rounded-lg border border-slate-800"
                style={{
                  gridTemplateColumns: `repeat(${currentPreset.data.cols}, minmax(0, 1fr))`,
                }}
              >
                {weights.map((rowArr, rIdx) =>
                  rowArr.map((origVal, cIdx) => {
                    const dequantVal = (int4Result.dequantizedMatrix[rIdx]?.[cIdx] as number) ?? 0;
                    const err = origVal - dequantVal;
                    const absErr = Math.abs(err);

                    // Heatmap color logic
                    let cellBg = "rgba(16, 185, 129, 0.2)";
                    if (heatmapViewMode === "error") {
                      const maxErrBound = Math.max(int4Result.maxError, 1e-4);
                      const intensity = Math.min(1.0, absErr / maxErrBound);
                      cellBg = `rgba(244, 63, 94, ${0.15 + intensity * 0.8})`;
                    } else if (heatmapViewMode === "original") {
                      const normalized = Math.min(1.0, Math.abs(origVal) / 2.0);
                      cellBg =
                        origVal >= 0
                          ? `rgba(56, 189, 248, ${0.15 + normalized * 0.8})`
                          : `rgba(245, 158, 11, ${0.15 + normalized * 0.8})`;
                    } else {
                      const normalized = Math.min(1.0, Math.abs(dequantVal) / 2.0);
                      cellBg = `rgba(16, 185, 129, ${0.15 + normalized * 0.8})`;
                    }

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        onMouseEnter={() =>
                          setHoveredCell({
                            row: rIdx,
                            col: cIdx,
                            orig: origVal,
                            quant: dequantVal,
                            err,
                          })
                        }
                        onMouseLeave={() => setHoveredCell(null)}
                        style={{ backgroundColor: cellBg }}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded flex items-center justify-center cursor-pointer transition-transform hover:scale-125 hover:z-10 border border-slate-800/40 text-[9px] font-mono text-white/80"
                      >
                        {heatmapViewMode === "error" ? absErr.toFixed(2) : origVal.toFixed(1)}
                      </div>
                    );
                  }),
                )}
              </div>

              {/* Hovered Cell Detail Pill */}
              <div className="h-8 flex items-center">
                {hoveredCell ? (
                  <div className="flex items-center gap-3 bg-slate-950 px-3 py-1 rounded-full border border-slate-700 text-xs font-mono">
                    <span className="text-slate-400">
                      Cell [{hoveredCell.row}, {hoveredCell.col}]:
                    </span>
                    <span className="text-white">Orig: {hoveredCell.orig.toFixed(4)}</span>
                    <span className="text-emerald-400">Quant: {hoveredCell.quant.toFixed(4)}</span>
                    <span className="text-rose-400 font-bold">
                      Err: {hoveredCell.err.toFixed(4)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">
                    Hover over any matrix cell to inspect error telemetry
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 6: METRICS DASHBOARD & VRAM SAVINGS                            */}
        {/* ================================================================== */}
        {activeTab === "metrics_dashboard" && (
          <div className="flex flex-col gap-6">
            {/* Error Histogram */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Live Quantization Error Distribution Histogram
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  MAE: {int4Result.mae.toFixed(4)} · Max Error: {int4Result.maxError.toFixed(4)}
                </span>
              </div>

              <div className="relative w-full h-48 bg-slate-950 rounded-lg border border-slate-800 p-3 flex items-end justify-between gap-1.5 overflow-hidden">
                {histogramBins.map((bin) => {
                  const maxPct = Math.max(...histogramBins.map((b) => b.percentage), 1.0);
                  const heightPct = Math.min(100, Math.max(4, (bin.percentage / maxPct) * 90));

                  return (
                    <div
                      key={bin.binIndex}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div className="absolute -top-10 bg-slate-800 text-[10px] text-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap border border-slate-700 font-mono">
                        [{bin.minVal.toFixed(2)}, {bin.maxVal.toFixed(2)}]: {bin.percentage}% (
                        {bin.count})
                      </div>

                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full rounded-t transition-all ${
                          bin.isZeroBin
                            ? "bg-emerald-500 shadow-md shadow-emerald-500/40"
                            : "bg-slate-700 hover:bg-slate-600"
                        }`}
                      />
                      <span className="text-[9px] text-slate-500 mt-1 font-mono">
                        {bin.centerVal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Memory Footprint & Roofline Multiplier Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                VRAM Memory Footprint & Throughput Scaling Across LLM Scales
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="pb-2">Precision Format</th>
                      <th className="pb-2">Bits / Weight</th>
                      <th className="pb-2">Compression</th>
                      <th className="pb-2 text-cyan-400">8B LLM VRAM</th>
                      <th className="pb-2 text-emerald-400">70B LLM VRAM</th>
                      <th className="pb-2 text-amber-400">405B LLM VRAM</th>
                      <th className="pb-2">Memory Bandwidth Boost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-white">FP16 Baseline</td>
                      <td className="py-2.5">16.0 bpp</td>
                      <td className="py-2.5">1.0x</td>
                      <td className="py-2.5 text-cyan-400 font-bold">16.8 GB</td>
                      <td className="py-2.5 text-emerald-400 font-bold">147.0 GB</td>
                      <td className="py-2.5 text-amber-400 font-bold">850.5 GB</td>
                      <td className="py-2.5">1.0x</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-bold text-white">FP8 (E4M3 / E5M2)</td>
                      <td className="py-2.5">8.0 bpp</td>
                      <td className="py-2.5 font-bold text-emerald-400">2.0x</td>
                      <td className="py-2.5 text-cyan-400 font-bold">8.4 GB</td>
                      <td className="py-2.5 text-emerald-400 font-bold">73.5 GB</td>
                      <td className="py-2.5 text-amber-400 font-bold">425.3 GB</td>
                      <td className="py-2.5 font-bold text-emerald-400">2.0x</td>
                    </tr>
                    <tr className="hover:bg-slate-800/30 bg-emerald-950/20">
                      <td className="py-2.5 font-bold text-emerald-400">
                        INT4 (Group Size {int4Result.groupSize})
                      </td>
                      <td className="py-2.5">{memoryStats.bitsPerWeight} bpp</td>
                      <td className="py-2.5 font-bold text-emerald-400">
                        {memoryStats.compressionVsFP16}x
                      </td>
                      <td className="py-2.5 text-cyan-400 font-bold">
                        {memoryStats.vram8BModelGb} GB
                      </td>
                      <td className="py-2.5 text-emerald-400 font-bold">
                        {memoryStats.vram70BModelGb} GB
                      </td>
                      <td className="py-2.5 text-amber-400 font-bold">
                        {memoryStats.vram405BModelGb} GB
                      </td>
                      <td className="py-2.5 font-bold text-emerald-400">
                        {memoryStats.effectiveBandwidthMultiplier}x
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 7: THEORY & HARDWARE EXECUTION MECHANICS                      */}
        {/* ================================================================== */}
        {activeTab === "theory_deep_dive" && (
          <div className="flex flex-col gap-6 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-400" />
                Mathematical Foundations & Hardware Acceleration Mechanics
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <h4 className="font-bold text-emerald-400 text-xs">
                    1. AWQ: Activation-Aware Weight Quantization
                  </h4>
                  <p>
                    Standard PTQ treats all weights uniformly, causing catastrophic error when
                    clipping outlier channels. AWQ observes that weights corresponding to salient
                    activation channels carry disproportionate output variance. By scaling weights
                    by <code className="text-cyan-300 font-mono">s = s_X^α</code>, the effective
                    quantization grid for salient channels is sharpened without mixed-precision SIMD
                    overhead.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <h4 className="font-bold text-cyan-400 text-xs">
                    2. SmoothQuant: Scale Migration Transform
                  </h4>
                  <p>
                    SmoothQuant migrates dynamic range variance from activations to weights via{" "}
                    <code className="text-cyan-300 font-mono">
                      {"s_j = max(|X|)^α / max(|W|)^(1-α)"}
                    </code>
                    . Since{" "}
                    <code className="text-emerald-300 font-mono">
                      {"X W^T = (X diag(s)^(-1)) (diag(s) W)^T"}
                    </code>
                    , the transformation is mathematically lossless and enables standard W8A8 and
                    W4A4 Tensor Core GEMM kernels.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <h4 className="font-bold text-rose-400 text-xs">
                    3. FP8 E4M3 vs E5M2 Hardware Formats
                  </h4>
                  <p>
                    Hopper and Blackwell GPUs feature native FP8 Tensor Cores. E4M3 (1-4-3) provides
                    3 mantissa bits (12.5% step size) with max value 448.0 for forward activations
                    and weights. E5M2 (1-5-2) provides 5 exponent bits with dynamic range up to
                    57344.0 for backward gradients and optimizer states.
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col gap-2">
                  <h4 className="font-bold text-amber-400 text-xs">
                    4. Marlin & Fast INT4 GEMV Kernels
                  </h4>
                  <p>
                    Modern INT4 serving kernels (e.g. Marlin, AWQ, AutoGPTQ) pack two 4-bit weights
                    per byte. During inference GEMV, weights are dequantized into FP16 registers
                    on-the-fly in SRAM, achieving memory bandwidth saturation multipliers up to 3.8x
                    over FP16 baselines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
