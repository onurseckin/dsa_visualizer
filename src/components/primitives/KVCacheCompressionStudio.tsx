import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Copy,
  Check,
  Code2,
  Layers,
  Cpu,
  Activity,
  Database,
  BarChart3,
  Gauge,
  Boxes,
  AlertTriangle,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type KVCachePresetId =
  | "llama3_8b_gqa"
  | "llama3_70b_gqa"
  | "mistral_7b_gqa"
  | "deepseek_v3_mla"
  | "falcon_40b_mqa"
  | "gpt3_175b_mha"
  | "qwen25_72b_gqa"
  | "custom";

export type KVCacheTabId =
  | "architecture_footprint"
  | "quantization_lab"
  | "streaming_eviction"
  | "serving_capacity"
  | "kernel_code_gen";

export type AttentionArchitecture = "mha" | "mqa" | "gqa" | "mla";

export type KVCachePrecision =
  | "fp32"
  | "fp16"
  | "bf16"
  | "fp8_e4m3"
  | "fp8_e5m2"
  | "int8"
  | "int4"
  | "fp4";

export type QuantizationScheme = "symmetric" | "asymmetric";

export type INT4GroupSize = 16 | 32 | 64 | 128 | 256;

export type StreamingEvictionPolicy = "streaming_llm" | "h2o" | "lru_window" | "full_cache";

export type TokenRole = "sink" | "heavy_hitter" | "recent_window" | "evicted";

export interface GpuHardwareSpec {
  readonly id: string;
  readonly name: string;
  readonly architecture: string;
  readonly vramGb: number;
  readonly hbmBandwidthGbs: number;
  readonly tflopsFp16: number;
  readonly tflopsFp8: number;
  readonly smCount: number;
  readonly memoryBusWidthBits: number;
}

export interface KVCacheModelConfig {
  readonly name: string;
  readonly totalParamsB: number;
  readonly activeParamsB: number;
  readonly layers: number;
  readonly numHeads: number;
  readonly numKvHeads: number;
  readonly headDim: number;
  readonly hiddenDim: number;
  readonly contextLen: number;
  readonly arch: AttentionArchitecture;
  readonly mlaKvLoraRank?: number;
  readonly mlaRopeRank?: number;
}

export interface KVCachePreset {
  readonly id: KVCachePresetId;
  readonly name: string;
  readonly description: string;
  readonly config: KVCacheModelConfig;
}

export interface QuantizationResult {
  readonly original: readonly number[];
  readonly quantized: readonly number[];
  readonly dequantized: readonly number[];
  readonly scales: readonly number[];
  readonly zeroPoints: readonly number[];
  readonly mse: number;
  readonly mae: number;
  readonly maxError: number;
  readonly snrDb: number;
  readonly cosineSim: number;
  readonly effectiveBitsPerWeight: number;
  readonly compressionRatio: number;
  readonly outlierIndices: readonly number[];
}

export interface StreamingSimulationStep {
  readonly step: number;
  readonly currentTokenIndex: number;
  readonly cachedTokenIndices: readonly number[];
  readonly tokenRoles: Readonly<Record<number, TokenRole>>;
  readonly attentionScores: readonly number[];
  readonly capturedAttentionMass: number;
  readonly perplexity: number;
  readonly cacheMemoryBytes: number;
}

export interface StreamingSimulationResult {
  readonly policy: StreamingEvictionPolicy;
  readonly maxCapacity: number;
  readonly sinkTokens: number;
  readonly windowTokens: number;
  readonly totalSteps: number;
  readonly steps: readonly StreamingSimulationStep[];
  readonly finalPerplexity: number;
  readonly avgCapturedAttentionMass: number;
}

export interface ServingWaterfallBudget {
  readonly totalVramGb: number;
  readonly modelWeightsGb: number;
  readonly activationsGb: number;
  readonly cudaRuntimeGb: number;
  readonly availableKvGb: number;
  readonly kvPerRequestMb: number;
  readonly maxConcurrentRequests: number;
  readonly maxTokensInPool: number;
  readonly pagedBlocks: number;
  readonly internalFragmentationPct: number;
}

export interface ServingPerformanceMetrics {
  readonly ttftMs: number;
  readonly tpotMs: number;
  readonly throughputTokensSec: number;
  readonly isMemoryBound: boolean;
  readonly arithmeticIntensity: number;
  readonly hbmUtilizationPct: number;
  readonly computeUtilizationPct: number;
}

export interface KVCacheStudioProps {
  readonly initialPreset?: KVCachePresetId;
  readonly initialTab?: KVCacheTabId;
  readonly initialGpu?: string;
  readonly className?: string;
  readonly title?: string;
}

// ============================================================================
// 2. HARDWARE SPECS & PRESETS
// ============================================================================

export const KV_CACHE_GPU_SPECS: Record<string, GpuHardwareSpec> = {
  h100_sxm: {
    id: "h100_sxm",
    name: "NVIDIA H100 SXM5",
    architecture: "Hopper",
    vramGb: 80,
    hbmBandwidthGbs: 3350,
    tflopsFp16: 1979,
    tflopsFp8: 3958,
    smCount: 132,
    memoryBusWidthBits: 5120,
  },
  a100_80gb: {
    id: "a100_80gb",
    name: "NVIDIA A100 SXM4 80GB",
    architecture: "Ampere",
    vramGb: 80,
    hbmBandwidthGbs: 2039,
    tflopsFp16: 312,
    tflopsFp8: 624,
    smCount: 108,
    memoryBusWidthBits: 5120,
  },
  b200: {
    id: "b200",
    name: "NVIDIA B200 SXM",
    architecture: "Blackwell",
    vramGb: 192,
    hbmBandwidthGbs: 8000,
    tflopsFp16: 4500,
    tflopsFp8: 9000,
    smCount: 180,
    memoryBusWidthBits: 8192,
  },
  rtx_4090: {
    id: "rtx_4090",
    name: "NVIDIA RTX 4090",
    architecture: "Ada Lovelace",
    vramGb: 24,
    hbmBandwidthGbs: 1008,
    tflopsFp16: 330,
    tflopsFp8: 660,
    smCount: 128,
    memoryBusWidthBits: 384,
  },
  l40s: {
    id: "l40s",
    name: "NVIDIA L40S",
    architecture: "Ada Lovelace",
    vramGb: 48,
    hbmBandwidthGbs: 864,
    tflopsFp16: 362,
    tflopsFp8: 733,
    smCount: 142,
    memoryBusWidthBits: 384,
  },
  m3_max: {
    id: "m3_max",
    name: "Apple M3 Max (Unified)",
    architecture: "Apple Silicon",
    vramGb: 128,
    hbmBandwidthGbs: 400,
    tflopsFp16: 100,
    tflopsFp8: 200,
    smCount: 40,
    memoryBusWidthBits: 512,
  },
};

export const KV_CACHE_PRESETS: Record<KVCachePresetId, KVCachePreset> = {
  llama3_8b_gqa: {
    id: "llama3_8b_gqa",
    name: "Llama-3-8B (GQA 4:1)",
    description:
      "Meta Llama 3 8B with 32 Q heads and 8 KV heads (Grouped-Query Attention 4:1 sharing)",
    config: {
      name: "Llama-3-8B",
      totalParamsB: 8.03,
      activeParamsB: 8.03,
      layers: 32,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      hiddenDim: 4096,
      contextLen: 8192,
      arch: "gqa",
    },
  },
  llama3_70b_gqa: {
    id: "llama3_70b_gqa",
    name: "Llama-3-70B (GQA 8:1)",
    description:
      "Meta Llama 3 70B with 64 Q heads and 8 KV heads (Grouped-Query Attention 8:1 sharing)",
    config: {
      name: "Llama-3-70B",
      totalParamsB: 70.6,
      activeParamsB: 70.6,
      layers: 80,
      numHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      hiddenDim: 8192,
      contextLen: 8192,
      arch: "gqa",
    },
  },
  mistral_7b_gqa: {
    id: "mistral_7b_gqa",
    name: "Mistral-7B-v0.3 (GQA 4:1)",
    description: "Mistral 7B with 32k context, 32 Q heads and 8 KV heads (GQA 4:1 sharing)",
    config: {
      name: "Mistral-7B-v0.3",
      totalParamsB: 7.24,
      activeParamsB: 7.24,
      layers: 32,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      hiddenDim: 4096,
      contextLen: 32768,
      arch: "gqa",
    },
  },
  deepseek_v3_mla: {
    id: "deepseek_v3_mla",
    name: "DeepSeek-V3 (MLA 576-dim)",
    description:
      "DeepSeek-V3 671B MoE (37B active) with Multi-Head Latent Attention (kv_lora_rank=512 + rope_rank=64)",
    config: {
      name: "DeepSeek-V3",
      totalParamsB: 671.0,
      activeParamsB: 37.0,
      layers: 61,
      numHeads: 128,
      numKvHeads: 128,
      headDim: 128,
      hiddenDim: 7168,
      contextLen: 131072,
      arch: "mla",
      mlaKvLoraRank: 512,
      mlaRopeRank: 64,
    },
  },
  falcon_40b_mqa: {
    id: "falcon_40b_mqa",
    name: "Falcon-40B (MQA 128:1)",
    description: "TII Falcon 40B with Multi-Query Attention (128 Q heads sharing 1 single KV head)",
    config: {
      name: "Falcon-40B",
      totalParamsB: 40.0,
      activeParamsB: 40.0,
      layers: 60,
      numHeads: 128,
      numKvHeads: 1,
      headDim: 64,
      hiddenDim: 8192,
      contextLen: 2048,
      arch: "mqa",
    },
  },
  gpt3_175b_mha: {
    id: "gpt3_175b_mha",
    name: "GPT-3 175B (Standard MHA)",
    description:
      "OpenAI GPT-3 175B baseline with standard Multi-Head Attention (96 Q heads, 96 KV heads)",
    config: {
      name: "GPT-3-175B",
      totalParamsB: 175.0,
      activeParamsB: 175.0,
      layers: 96,
      numHeads: 96,
      numKvHeads: 96,
      headDim: 128,
      hiddenDim: 12288,
      contextLen: 2048,
      arch: "mha",
    },
  },
  qwen25_72b_gqa: {
    id: "qwen25_72b_gqa",
    name: "Qwen-2.5-72B (GQA 8:1)",
    description: "Alibaba Qwen 2.5 72B with 64 Q heads, 8 KV heads, and 32k native context length",
    config: {
      name: "Qwen-2.5-72B",
      totalParamsB: 72.7,
      activeParamsB: 72.7,
      layers: 80,
      numHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      hiddenDim: 8192,
      contextLen: 32768,
      arch: "gqa",
    },
  },
  custom: {
    id: "custom",
    name: "Custom Configuration",
    description: "User-defined architecture, sequence length, precision, and hardware parameters",
    config: {
      name: "Custom-Model",
      totalParamsB: 8.0,
      activeParamsB: 8.0,
      layers: 32,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      hiddenDim: 4096,
      contextLen: 8192,
      arch: "gqa",
    },
  },
};

// ============================================================================
// 3. PURE MATHEMATICAL & PROFILING ENGINES
// ============================================================================

/**
 * Calculates KV cache memory footprint with pure Stanford CS336 / MIT 6.5940 precision.
 */
export function calculateKvCacheMemoryBytes(
  batchSize: number,
  seqLen: number,
  layers: number,
  numHeads: number,
  numKvHeads: number,
  headDim: number,
  precision: KVCachePrecision,
  arch: AttentionArchitecture = "gqa",
  mlaKvLoraRank: number = 512,
  mlaRopeRank: number = 64,
  groupSize: INT4GroupSize = 64,
  isAsymmetric: boolean = false,
): {
  totalBytes: number;
  bytesPerToken: number;
  elementsPerTokenPerLayer: number;
  totalElements: number;
  bitsPerWeight: number;
  compressionRatioVsFp16Mha: number;
  kvPerTokenLayerBytes: number;
} {
  if (batchSize <= 0 || seqLen <= 0 || layers <= 0) {
    return {
      totalBytes: 0,
      bytesPerToken: 0,
      elementsPerTokenPerLayer: 0,
      totalElements: 0,
      bitsPerWeight: 0,
      compressionRatioVsFp16Mha: 1,
      kvPerTokenLayerBytes: 0,
    };
  }

  let effectiveKvHeads = numKvHeads;
  if (arch === "mha") {
    effectiveKvHeads = numHeads;
  } else if (arch === "mqa") {
    effectiveKvHeads = 1;
  } else if (arch === "gqa") {
    effectiveKvHeads = Math.max(1, Math.min(numHeads, numKvHeads));
  }

  // Calculate elements per token per layer
  let elementsPerTokenPerLayer = 0;
  if (arch === "mla") {
    // MLA caches compressed latent vector c_t^{KV} and decoupled key RoPE vector k_t^R
    elementsPerTokenPerLayer = mlaKvLoraRank + mlaRopeRank;
  } else {
    // MHA / MQA / GQA caches Key and Value: 2 * H_KV * d_k
    elementsPerTokenPerLayer = 2 * effectiveKvHeads * headDim;
  }

  const elementsPerTokenAllLayers = elementsPerTokenPerLayer * layers;
  const totalElements = batchSize * seqLen * elementsPerTokenAllLayers;

  // Bits per weight including group scale/zero metadata overhead
  let bitsPerWeight = 16;
  if (precision === "fp32") {
    bitsPerWeight = 32;
  } else if (precision === "fp16" || precision === "bf16") {
    bitsPerWeight = 16;
  } else if (precision === "fp8_e4m3" || precision === "fp8_e5m2" || precision === "int8") {
    bitsPerWeight = 8;
  } else if (precision === "int4") {
    // INT4 stores 4 bits per element + 16-bit FP16 scale per group (+ 16-bit zero point if asymmetric)
    const scaleBitsPerElem = 16 / groupSize;
    const zeroBitsPerElem = isAsymmetric ? 16 / groupSize : 0;
    bitsPerWeight = 4 + scaleBitsPerElem + zeroBitsPerElem;
  } else if (precision === "fp4") {
    // FP4 stores 4 bits + 16-bit scale per group
    bitsPerWeight = 4 + 16 / groupSize;
  }

  const bytesPerElem = bitsPerWeight / 8;
  const totalBytes = totalElements * bytesPerElem;
  const bytesPerToken = elementsPerTokenAllLayers * bytesPerElem;
  const kvPerTokenLayerBytes = elementsPerTokenPerLayer * bytesPerElem;

  // Baseline FP16 MHA (H_Q heads, 16 bits = 2 bytes)
  const baselineElementsPerTokenPerLayer = 2 * numHeads * headDim;
  const baselineBytes = batchSize * seqLen * layers * baselineElementsPerTokenPerLayer * 2;

  const compressionRatioVsFp16Mha = totalBytes > 0 ? baselineBytes / totalBytes : 1;

  return {
    totalBytes,
    bytesPerToken,
    elementsPerTokenPerLayer,
    totalElements,
    bitsPerWeight,
    compressionRatioVsFp16Mha,
    kvPerTokenLayerBytes,
  };
}

/**
 * Group-wise Quantization Engine with exact clipping, scaling, dequantization and MSE/SNR metrics.
 */
export function calculateGroupQuantizationParams(
  inputVector: number[],
  precision: KVCachePrecision,
  scheme: QuantizationScheme = "symmetric",
  groupSize: INT4GroupSize = 64,
): QuantizationResult {
  if (!inputVector || inputVector.length === 0) {
    return {
      original: [],
      quantized: [],
      dequantized: [],
      scales: [],
      zeroPoints: [],
      mse: 0,
      mae: 0,
      maxError: 0,
      snrDb: 100,
      cosineSim: 1,
      effectiveBitsPerWeight: 16,
      compressionRatio: 1,
      outlierIndices: [],
    };
  }

  const n = inputVector.length;
  const quantized: number[] = new Array(n).fill(0);
  const dequantized: number[] = new Array(n).fill(0);
  const scales: number[] = [];
  const zeroPoints: number[] = [];

  // Identify outliers (> 2.8 standard deviations)
  const mean = inputVector.reduce((acc, v) => acc + v, 0) / n;
  const variance = inputVector.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / n;
  const stdDev = Math.sqrt(variance) || 1e-6;
  const outlierIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    if (Math.abs(inputVector[i] - mean) > 2.8 * stdDev) {
      outlierIndices.push(i);
    }
  }

  if (precision === "fp32" || precision === "fp16" || precision === "bf16") {
    // High-precision pass-through with minimal numerical jitter
    const roundStep = precision === "fp32" ? 0 : precision === "bf16" ? 1 / 128 : 1 / 2048;
    for (let i = 0; i < n; i++) {
      const val = inputVector[i];
      const qVal = roundStep > 0 ? Math.round(val / roundStep) * roundStep : val;
      quantized[i] = qVal;
      dequantized[i] = qVal;
    }
    scales.push(1.0);
    zeroPoints.push(0);
  } else if (precision === "fp8_e4m3") {
    // FP8 E4M3: max = 448.0, 1 sign, 4 exp, 3 mantissa
    const maxVal = Math.max(...inputVector.map((v) => Math.abs(v))) || 1.0;
    const scale = maxVal / 448.0;
    scales.push(scale);
    zeroPoints.push(0);
    for (let i = 0; i < n; i++) {
      const scaled = inputVector[i] / scale;
      const clamped = Math.max(-448.0, Math.min(448.0, scaled));
      const q = Math.round(clamped * 2) / 2; // Simulated discrete E4M3 step
      quantized[i] = q;
      dequantized[i] = q * scale;
    }
  } else if (precision === "fp8_e5m2") {
    // FP8 E5M2: max = 57344.0, wider range, coarser mantissa (2 bits)
    const maxVal = Math.max(...inputVector.map((v) => Math.abs(v))) || 1.0;
    const scale = maxVal / 57344.0;
    scales.push(scale);
    zeroPoints.push(0);
    for (let i = 0; i < n; i++) {
      const scaled = inputVector[i] / scale;
      const clamped = Math.max(-57344.0, Math.min(57344.0, scaled));
      const q = Math.round(clamped / 4) * 4; // Simulated coarser E5M2 step
      quantized[i] = q;
      dequantized[i] = q * scale;
    }
  } else if (precision === "int8") {
    if (scheme === "symmetric") {
      const maxAbs = Math.max(...inputVector.map((v) => Math.abs(v))) || 1e-6;
      const scale = maxAbs / 127.0;
      scales.push(scale);
      zeroPoints.push(0);
      for (let i = 0; i < n; i++) {
        const q = Math.max(-128, Math.min(127, Math.round(inputVector[i] / scale)));
        quantized[i] = q;
        dequantized[i] = q * scale;
      }
    } else {
      const minVal = Math.min(...inputVector);
      const maxVal = Math.max(...inputVector);
      const scale = Math.max((maxVal - minVal) / 255.0, 1e-6);
      const zeroPoint = Math.max(0, Math.min(255, Math.round(-minVal / scale)));
      scales.push(scale);
      zeroPoints.push(zeroPoint);
      for (let i = 0; i < n; i++) {
        const q = Math.max(0, Math.min(255, Math.round(inputVector[i] / scale) + zeroPoint));
        quantized[i] = q;
        dequantized[i] = (q - zeroPoint) * scale;
      }
    }
  } else if (precision === "int4") {
    // Group-wise INT4
    const gSize = groupSize;
    const numGroups = Math.ceil(n / gSize);
    for (let g = 0; g < numGroups; g++) {
      const start = g * gSize;
      const end = Math.min(n, start + gSize);
      const groupSlice = inputVector.slice(start, end);

      if (scheme === "symmetric") {
        const maxAbs = Math.max(...groupSlice.map((v) => Math.abs(v))) || 1e-6;
        const scale = maxAbs / 7.0;
        scales.push(scale);
        zeroPoints.push(0);
        for (let i = start; i < end; i++) {
          const q = Math.max(-8, Math.min(7, Math.round(inputVector[i] / scale)));
          quantized[i] = q;
          dequantized[i] = q * scale;
        }
      } else {
        const minVal = Math.min(...groupSlice);
        const maxVal = Math.max(...groupSlice);
        const scale = Math.max((maxVal - minVal) / 15.0, 1e-6);
        const zeroPoint = Math.max(0, Math.min(15, Math.round(-minVal / scale)));
        scales.push(scale);
        zeroPoints.push(zeroPoint);
        for (let i = start; i < end; i++) {
          const q = Math.max(0, Math.min(15, Math.round(inputVector[i] / scale) + zeroPoint));
          quantized[i] = q;
          dequantized[i] = (q - zeroPoint) * scale;
        }
      }
    }
  } else if (precision === "fp4") {
    // Group-wise FP4 (E2M1): max = 6.0
    const gSize = groupSize;
    const numGroups = Math.ceil(n / gSize);
    const fp4Levels = [
      -6.0, -4.0, -3.0, -2.0, -1.5, -1.0, -0.5, 0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0,
    ];
    for (let g = 0; g < numGroups; g++) {
      const start = g * gSize;
      const end = Math.min(n, start + gSize);
      const groupSlice = inputVector.slice(start, end);
      const maxAbs = Math.max(...groupSlice.map((v) => Math.abs(v))) || 1e-6;
      const scale = maxAbs / 6.0;
      scales.push(scale);
      zeroPoints.push(0);
      for (let i = start; i < end; i++) {
        const scaledVal = inputVector[i] / scale;
        let closest = fp4Levels[0];
        let minDist = Math.abs(scaledVal - closest);
        for (let k = 1; k < fp4Levels.length; k++) {
          const dist = Math.abs(scaledVal - fp4Levels[k]);
          if (dist < minDist) {
            minDist = dist;
            closest = fp4Levels[k];
          }
        }
        quantized[i] = closest;
        dequantized[i] = closest * scale;
      }
    }
  }

  // Calculate Accuracy & Error Metrics
  let sumSqErr = 0;
  let sumAbsErr = 0;
  let maxError = 0;
  let signalPower = 0;
  let dotProd = 0;
  let normOrigSq = 0;
  let normDqSq = 0;

  for (let i = 0; i < n; i++) {
    const orig = inputVector[i];
    const deq = dequantized[i];
    const diff = orig - deq;
    const absDiff = Math.abs(diff);

    sumSqErr += diff * diff;
    sumAbsErr += absDiff;
    if (absDiff > maxError) {
      maxError = absDiff;
    }
    signalPower += orig * orig;
    dotProd += orig * deq;
    normOrigSq += orig * orig;
    normDqSq += deq * deq;
  }

  const mse = sumSqErr / n;
  const mae = sumAbsErr / n;
  const noisePower = sumSqErr;
  const snrDb =
    noisePower <= 1e-12
      ? 100
      : Math.max(-20, Math.min(100, 10 * Math.log10((signalPower + 1e-9) / (noisePower + 1e-9))));

  const denom = Math.sqrt(normOrigSq * normDqSq);
  const cosineSim = denom <= 1e-12 ? 1.0 : Math.max(-1, Math.min(1, dotProd / denom));

  let effectiveBitsPerWeight = 16;
  if (precision === "fp32") effectiveBitsPerWeight = 32;
  else if (precision === "fp16" || precision === "bf16") effectiveBitsPerWeight = 16;
  else if (precision === "fp8_e4m3" || precision === "fp8_e5m2" || precision === "int8")
    effectiveBitsPerWeight = 8;
  else if (precision === "int4") {
    effectiveBitsPerWeight = 4 + (scheme === "asymmetric" ? 32 : 16) / groupSize;
  } else if (precision === "fp4") {
    effectiveBitsPerWeight = 4 + 16 / groupSize;
  }

  const compressionRatio = 16 / effectiveBitsPerWeight;

  return {
    original: inputVector,
    quantized,
    dequantized,
    scales,
    zeroPoints,
    mse,
    mae,
    maxError,
    snrDb,
    cosineSim,
    effectiveBitsPerWeight,
    compressionRatio,
    outlierIndices,
  };
}

/**
 * Simulates StreamingLLM attention sinks vs H2O vs LRU window eviction step-by-step.
 */
export function simulateStreamingEviction(
  totalTokens: number,
  cacheBudget: number,
  sinkTokens: number = 4,
  policy: StreamingEvictionPolicy = "streaming_llm",
  bytesPerToken: number = 1024,
): StreamingSimulationResult {
  const steps: StreamingSimulationStep[] = [];
  const safeTotalTokens = Math.max(1, Math.min(256, totalTokens));
  const safeBudget = Math.max(4, Math.min(128, cacheBudget));
  const safeSinks = Math.max(1, Math.min(Math.floor(safeBudget / 2), sinkTokens));

  // Cumulative attention accumulation for H2O
  const accumulatedAttention: number[] = new Array(safeTotalTokens).fill(0);

  let totalPerplexitySum = 0;
  let totalCapturedMassSum = 0;

  for (let t = 0; t < safeTotalTokens; t++) {
    // Synthesize raw attention weights from query at pos t to all keys 0..t
    const rawScores: number[] = [];
    let sumScore = 0;

    for (let k = 0; k <= t; k++) {
      let score = 0;
      if (k < safeSinks) {
        // Massive attention sink weight (Softmax normalization anchor)
        score = 8.5 / (k + 1);
      } else if (t - k <= 8) {
        // High local recency attention
        score = 4.0 * Math.exp(-(t - k) * 0.2);
      } else {
        // Intermediate semantic attention
        score = 0.5 + 0.3 * Math.sin(k * 1.5 + t);
      }
      rawScores.push(score);
      sumScore += score;
    }

    // Normalized attention distribution
    const attentionScores = rawScores.map((s) => (sumScore > 0 ? s / sumScore : 0));

    // Update cumulative attention for H2O
    for (let k = 0; k <= t; k++) {
      accumulatedAttention[k] += attentionScores[k];
    }

    // Determine which tokens are retained under the selected policy
    const cachedTokenIndices: number[] = [];
    const tokenRoles: Record<number, TokenRole> = {};

    if (t < safeBudget || policy === "full_cache") {
      // Entire sequence fits in cache
      for (let k = 0; k <= t; k++) {
        cachedTokenIndices.push(k);
        if (k < safeSinks) tokenRoles[k] = "sink";
        else tokenRoles[k] = "recent_window";
      }
    } else if (policy === "streaming_llm") {
      // Permanent Attention Sinks + Rolling Local Window
      const windowSize = safeBudget - safeSinks;
      const windowStart = Math.max(safeSinks, t - windowSize + 1);

      // Keep Sinks
      for (let k = 0; k < safeSinks; k++) {
        cachedTokenIndices.push(k);
        tokenRoles[k] = "sink";
      }
      // Evicted middle tokens
      for (let k = safeSinks; k < windowStart; k++) {
        tokenRoles[k] = "evicted";
      }
      // Keep Recent Window
      for (let k = windowStart; k <= t; k++) {
        cachedTokenIndices.push(k);
        tokenRoles[k] = "recent_window";
      }
    } else if (policy === "h2o") {
      // Sinks + Top-K Heavy Hitters + Local Window
      const localWindowSize = Math.max(2, Math.floor(safeBudget * 0.35));
      const windowStart = Math.max(safeSinks, t - localWindowSize + 1);
      const heavyHitterSlots = Math.max(0, safeBudget - safeSinks - (t - windowStart + 1));

      // Sinks
      for (let k = 0; k < safeSinks; k++) {
        cachedTokenIndices.push(k);
        tokenRoles[k] = "sink";
      }

      // Middle candidates for heavy hitter selection
      const candidates: { idx: number; score: number }[] = [];
      for (let k = safeSinks; k < windowStart; k++) {
        candidates.push({ idx: k, score: accumulatedAttention[k] });
      }
      candidates.sort((a, b) => b.score - a.score);
      const heavyHitterSet = new Set(candidates.slice(0, heavyHitterSlots).map((c) => c.idx));

      for (let k = safeSinks; k < windowStart; k++) {
        if (heavyHitterSet.has(k)) {
          cachedTokenIndices.push(k);
          tokenRoles[k] = "heavy_hitter";
        } else {
          tokenRoles[k] = "evicted";
        }
      }

      // Recent Window
      for (let k = windowStart; k <= t; k++) {
        cachedTokenIndices.push(k);
        tokenRoles[k] = "recent_window";
      }
    } else if (policy === "lru_window") {
      // LRU Window (No sinks preserved)
      const windowStart = t - safeBudget + 1;
      for (let k = 0; k < windowStart; k++) {
        tokenRoles[k] = "evicted";
      }
      for (let k = windowStart; k <= t; k++) {
        cachedTokenIndices.push(k);
        tokenRoles[k] = "recent_window";
      }
    }

    // Calculate captured attention mass
    let capturedMass = 0;
    for (const idx of cachedTokenIndices) {
      if (idx < attentionScores.length) {
        capturedMass += attentionScores[idx];
      }
    }
    capturedMass = Math.min(1.0, capturedMass);

    // Calculate simulated perplexity
    let perplexity = 4.15;
    if (policy === "full_cache") {
      perplexity = 4.15 + (t * 0.02) / 100;
    } else if (policy === "streaming_llm") {
      perplexity = 4.2 + (t * 0.05) / 100;
    } else if (policy === "h2o") {
      perplexity = 4.18 + (t * 0.03) / 100;
    } else if (policy === "lru_window") {
      if (t >= safeBudget) {
        // Catastrophic attention collapse when initial sinks are lost!
        const evictionDepth = t - safeBudget + 1;
        perplexity = 4.15 * Math.exp(Math.min(8.0, evictionDepth * 0.45));
      }
    }

    const cacheMemoryBytes = cachedTokenIndices.length * bytesPerToken;

    totalPerplexitySum += perplexity;
    totalCapturedMassSum += capturedMass;

    steps.push({
      step: t,
      currentTokenIndex: t,
      cachedTokenIndices,
      tokenRoles,
      attentionScores,
      capturedAttentionMass: capturedMass,
      perplexity,
      cacheMemoryBytes,
    });
  }

  const finalPerplexity = steps[steps.length - 1]?.perplexity || 4.15;
  const avgCapturedAttentionMass = totalCapturedMassSum / steps.length;

  return {
    policy,
    maxCapacity: safeBudget,
    sinkTokens: safeSinks,
    windowTokens: safeBudget - safeSinks,
    totalSteps: steps.length,
    steps,
    finalPerplexity,
    avgCapturedAttentionMass,
  };
}

/**
 * Calculates Multi-Tenant GPU Serving Capacity, VRAM Waterfall & Roofline Latencies.
 */
export function calculateServingCapacityAndLatency(
  gpu: GpuHardwareSpec,
  model: KVCacheModelConfig,
  precision: KVCachePrecision,
  groupSize: INT4GroupSize = 64,
  isAsymmetric: boolean = false,
  promptTokens: number = 2048,
  decodeTokens: number = 512,
  vramUtilization: number = 0.9,
  cudaOverheadGb: number = 2.5,
  pagedBlockSize: number = 16,
  batchSizeOverride?: number,
): {
  waterfall: ServingWaterfallBudget;
  performance: ServingPerformanceMetrics;
} {
  const totalSeqLen = Math.max(1, promptTokens + decodeTokens);
  const totalParams = model.totalParamsB * 1e9;
  const activeParams = model.activeParamsB * 1e9;

  // Model weights size (assume FP16 weights baseline unless quantized)
  let weightBytesPerParam = 2.0;
  if (precision === "int4" || precision === "fp4") weightBytesPerParam = 0.5;
  else if (precision === "fp8_e4m3" || precision === "fp8_e5m2" || precision === "int8")
    weightBytesPerParam = 1.0;

  const modelWeightsGb = (totalParams * weightBytesPerParam) / 1e9;
  const totalVramGb = gpu.vramGb;
  const usableVramGb = totalVramGb * vramUtilization;
  const activationsGb = Math.min(6.0, Math.max(0.5, (model.hiddenDim * totalSeqLen * 2) / 1e9));

  const availableKvGb = Math.max(0, usableVramGb - modelWeightsGb - activationsGb - cudaOverheadGb);

  // KV Cache memory per request
  const singleReqKv = calculateKvCacheMemoryBytes(
    1,
    totalSeqLen,
    model.layers,
    model.numHeads,
    model.numKvHeads,
    model.headDim,
    precision,
    model.arch,
    model.mlaKvLoraRank,
    model.mlaRopeRank,
    groupSize,
    isAsymmetric,
  );

  const kvPerRequestMb = singleReqKv.totalBytes / 1e6;
  const kvPerRequestGb = singleReqKv.totalBytes / 1e9;

  const maxConcurrentRequests = kvPerRequestGb > 0 ? Math.floor(availableKvGb / kvPerRequestGb) : 0;

  const bytesPerTokenAllLayers = singleReqKv.bytesPerToken;
  const maxTokensInPool =
    bytesPerTokenAllLayers > 0 ? Math.floor((availableKvGb * 1e9) / bytesPerTokenAllLayers) : 0;

  const pagedBlocks = Math.floor(maxTokensInPool / pagedBlockSize);
  const internalFragmentationPct = totalSeqLen > 0 ? (pagedBlockSize / 2 / totalSeqLen) * 100 : 0;

  // Serving Batch Size for performance analysis
  const batchSize =
    batchSizeOverride !== undefined
      ? Math.max(1, batchSizeOverride)
      : Math.max(1, Math.min(maxConcurrentRequests, 64));

  // 1. Prefill Phase (Compute-Bound)
  // FLOPs = 2 * P * promptTokens + 2 * L * H * d_k * promptTokens^2
  const prefillFlops =
    2 * activeParams * promptTokens +
    2 * model.layers * model.numHeads * model.headDim * promptTokens * promptTokens;
  const computeTflops =
    precision === "fp8_e4m3" || precision === "fp8_e5m2" ? gpu.tflopsFp8 : gpu.tflopsFp16;
  const computeEfficiency = 0.55;
  const ttftMs = (prefillFlops / (computeTflops * 1e12 * computeEfficiency)) * 1000 + 1.2;

  // 2. Decode Phase (Memory-Bandwidth Bound)
  // Per token decode: read model weights + read KV cache for B requests
  const weightReadBytesPerStep = activeParams * weightBytesPerParam;
  const kvReadBytesPerStep = batchSize * singleReqKv.kvPerTokenLayerBytes * model.layers * 2;
  const totalStreamedBytes = weightReadBytesPerStep + kvReadBytesPerStep;

  const bandwidthEfficiency = 0.75;
  const hbmBandwidthBytesSec = gpu.hbmBandwidthGbs * 1e9 * bandwidthEfficiency;
  const memoryTimeMs = (totalStreamedBytes / hbmBandwidthBytesSec) * 1000;

  // Compute time for decode step: 2 * B * P FLOPs
  const decodeFlops = 2 * batchSize * activeParams;
  const computeTimeMs = (decodeFlops / (computeTflops * 1e12 * computeEfficiency)) * 1000;

  const isMemoryBound = memoryTimeMs >= computeTimeMs;
  const tpotMs = Math.max(memoryTimeMs, computeTimeMs) + 0.35; // + launch overhead
  const throughputTokensSec = batchSize / (tpotMs / 1000);

  const arithmeticIntensity = totalStreamedBytes > 0 ? decodeFlops / totalStreamedBytes : 0;
  const hbmUtilizationPct = Math.min(
    100,
    (totalStreamedBytes / (tpotMs / 1000) / (gpu.hbmBandwidthGbs * 1e9)) * 100,
  );
  const computeUtilizationPct = Math.min(
    100,
    (decodeFlops / (tpotMs / 1000) / (computeTflops * 1e12)) * 100,
  );

  return {
    waterfall: {
      totalVramGb,
      modelWeightsGb,
      activationsGb,
      cudaRuntimeGb: cudaOverheadGb,
      availableKvGb,
      kvPerRequestMb,
      maxConcurrentRequests,
      maxTokensInPool,
      pagedBlocks,
      internalFragmentationPct,
    },
    performance: {
      ttftMs,
      tpotMs,
      throughputTokensSec,
      isMemoryBound,
      arithmeticIntensity,
      hbmUtilizationPct,
      computeUtilizationPct,
    },
  };
}

// ============================================================================
// 4. FORMATTING & CODE GENERATION UTILITIES
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes <= 0 || isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${val >= 100 ? val.toFixed(1) : val.toFixed(2)} ${units[i]}`;
}

export function formatNumberWithCommas(n: number): string {
  if (isNaN(n)) return "0";
  return Math.round(n).toLocaleString("en-US");
}

export function formatLatencyMs(ms: number): string {
  if (isNaN(ms)) return "0.00 ms";
  if (ms < 1.0) return `${(ms * 1000).toFixed(1)} µs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatBandwidthGbps(gbps: number): string {
  return `${formatNumberWithCommas(gbps)} GB/s`;
}

export function formatTflops(tflops: number): string {
  return `${formatNumberWithCommas(tflops)} TFLOPS`;
}

/**
 * Generates high-performance OpenAI Triton GPU kernel for block-dequantized INT4/FP8 KV cache load & attention.
 */
export function generateTritonQuantizedKvKernel(
  arch: AttentionArchitecture,
  precision: KVCachePrecision,
  groupSize: INT4GroupSize = 64,
  isAsymmetric: boolean = false,
): string {
  return `"""
Production OpenAI Triton Fused Quantized KV-Cache Attention Decode Kernel
Architecture: ${arch.toUpperCase()} | Precision: ${precision.toUpperCase()} | Group Size: ${groupSize} | Mode: ${isAsymmetric ? "Asymmetric Affine" : "Symmetric"}
Target: Hopper (H100) / Blackwell (B200) / Ada (RTX 4090)
"""

import triton
import triton.language as tl
import torch

@triton.jit
def _fused_dequant_kv_attention_decode_kernel(
    # Pointers to Inputs
    Q_ptr,              # [BATCH, NUM_HEADS_Q, HEAD_DIM]
    K_quant_ptr,        # [BATCH, NUM_HEADS_KV, SEQ_LEN, HEAD_DIM // (2 if int4 else 1)]
    V_quant_ptr,        # [BATCH, NUM_HEADS_KV, SEQ_LEN, HEAD_DIM // (2 if int4 else 1)]
    K_scale_ptr,        # [BATCH, NUM_HEADS_KV, SEQ_LEN, HEAD_DIM // GROUP_SIZE]
    V_scale_ptr,        # [BATCH, NUM_HEADS_KV, SEQ_LEN, HEAD_DIM // GROUP_SIZE]
    ${isAsymmetric ? "K_zp_ptr, V_zp_ptr," : ""}
    Out_ptr,            # [BATCH, NUM_HEADS_Q, HEAD_DIM]
    # Strides
    stride_qb, stride_qh, stride_qd,
    stride_kb, stride_kh, stride_ks, stride_kd,
    stride_vb, stride_vh, stride_vs, stride_vd,
    stride_ob, stride_oh, stride_od,
    # Dimensions
    BATCH_SIZE: tl.constexpr,
    NUM_HEADS_Q: tl.constexpr,
    NUM_HEADS_KV: tl.constexpr,
    SEQ_LEN: tl.constexpr,
    HEAD_DIM: tl.constexpr,
    GROUP_SIZE: tl.constexpr,
    BLOCK_M: tl.constexpr,
    BLOCK_N: tl.constexpr,
):
    # Program ID & Head grouping (GQA / MQA mapping)
    pid_batch = tl.program_id(0)
    pid_head_q = tl.program_id(1)
    
    # GQA Head Sharing Ratio: G = H_Q / H_KV
    HEAD_RATIO: tl.constexpr = NUM_HEADS_Q // NUM_HEADS_KV
    pid_head_kv = pid_head_q // HEAD_RATIO

    # Load Query Vector into Shared Memory / Registers: [1, HEAD_DIM]
    offs_d = tl.arange(0, HEAD_DIM)
    q_ptrs = Q_ptr + pid_batch * stride_qb + pid_head_q * stride_qh + offs_d * stride_qd
    q = tl.load(q_ptrs)
    
    # Softmax scaling factor: 1 / sqrt(d_k)
    sm_scale = 1.0 / tl.sqrt(HEAD_DIM.to(tl.float32))

    # Online Softmax accumulators (FlashAttention-style)
    m_prev = -float("inf")
    l_prev = 0.0
    acc = tl.zeros([HEAD_DIM], dtype=tl.float32)

    # Loop over Sequence Length in chunks of BLOCK_N
    for start_n in range(0, SEQ_LEN, BLOCK_N):
        offs_n = start_n + tl.arange(0, BLOCK_N)
        mask_n = offs_n < SEQ_LEN

        # -------------------------------------------------------------
        # 1. LOAD & DEQUANTIZE KEY BLOCK: [BLOCK_N, HEAD_DIM]
        # -------------------------------------------------------------
        k_ptrs = (K_quant_ptr + pid_batch * stride_kb + 
                  pid_head_kv * stride_kh + 
                  offs_n[:, None] * stride_ks + 
                  offs_d[None, :] * stride_kd)
        
        # Load scales for group-wise dequantization
        scale_k_ptrs = (K_scale_ptr + pid_batch * stride_kb + 
                        pid_head_kv * stride_kh + 
                        offs_n[:, None] * stride_ks + 
                        (offs_d[None, :] // GROUP_SIZE))
        scale_k = tl.load(scale_k_ptrs, mask=mask_n[:, None], other=1.0)
        
        ${
          precision === "int4"
            ? `# Fast INT4 Nibble Unpacking & Scale Dequantization
        raw_k = tl.load(k_ptrs, mask=mask_n[:, None], other=0)
        # Unpack low and high 4-bit nibbles
        k_val = ((raw_k.to(tl.int8) & 0x0F) - 8).to(tl.float32) * scale_k`
            : precision === "fp8_e4m3"
              ? `# Fast FP8 E4M3 Dequantization via Scale Multiply
        raw_k = tl.load(k_ptrs, mask=mask_n[:, None], other=0.0)
        k_val = raw_k.to(tl.float32) * scale_k`
              : `# Direct FP16 / BF16 Load
        k_val = tl.load(k_ptrs, mask=mask_n[:, None], other=0.0).to(tl.float32)`
        }

        # Compute Q * K^T dot products for this block
        scores = tl.sum(q[None, :] * k_val, axis=1) * sm_scale
        scores = tl.where(mask_n, scores, -float("inf"))

        # Online Softmax update
        m_curr = tl.maximum(m_prev, tl.max(scores, axis=0))
        p = tl.exp(scores - m_curr)
        l_curr = tl.exp(m_prev - m_curr) * l_prev + tl.sum(p, axis=0)

        # -------------------------------------------------------------
        # 2. LOAD & DEQUANTIZE VALUE BLOCK: [BLOCK_N, HEAD_DIM]
        # -------------------------------------------------------------
        v_ptrs = (V_quant_ptr + pid_batch * stride_vb + 
                  pid_head_kv * stride_vh + 
                  offs_n[:, None] * stride_vs + 
                  offs_d[None, :] * stride_vd)
        scale_v_ptrs = (V_scale_ptr + pid_batch * stride_vb + 
                        pid_head_kv * stride_vh + 
                        offs_n[:, None] * stride_vs + 
                        (offs_d[None, :] // GROUP_SIZE))
        scale_v = tl.load(scale_v_ptrs, mask=mask_n[:, None], other=1.0)
        
        ${
          precision === "int4"
            ? `raw_v = tl.load(v_ptrs, mask=mask_n[:, None], other=0)
        v_val = ((raw_v.to(tl.int8) & 0x0F) - 8).to(tl.float32) * scale_v`
            : precision === "fp8_e4m3"
              ? `raw_v = tl.load(v_ptrs, mask=mask_n[:, None], other=0.0)
        v_val = raw_v.to(tl.float32) * scale_v`
              : `v_val = tl.load(v_ptrs, mask=mask_n[:, None], other=0.0).to(tl.float32)`
        }

        # Accumulate output: acc = acc * alpha + P * V
        alpha = tl.exp(m_prev - m_curr)
        acc = acc * alpha + tl.sum(p[:, None] * v_val, axis=0)

        # Update running statistics
        m_prev = m_curr
        l_prev = l_curr

    # Final Softmax Normalization and Store
    out = acc / l_prev
    out_ptrs = Out_ptr + pid_batch * stride_ob + pid_head_q * stride_oh + offs_d * stride_od
    tl.store(out_ptrs, out.to(tl.float16))
`;
}

/**
 * Generates production vLLM Engine CLI launch command & Python configuration.
 */
export function generateVllmServingConfig(
  modelPresetId: KVCachePresetId,
  gpuId: string,
  precision: KVCachePrecision,
  groupSize: INT4GroupSize = 64,
  maxModelLen: number = 8192,
  gpuMemoryUtil: number = 0.9,
  maxNumSeqs: number = 256,
): string {
  const modelMap: Record<KVCachePresetId, string> = {
    llama3_8b_gqa: "meta-llama/Meta-Llama-3-8B-Instruct",
    llama3_70b_gqa: "meta-llama/Meta-Llama-3-70B-Instruct",
    mistral_7b_gqa: "mistralai/Mistral-7B-Instruct-v0.3",
    deepseek_v3_mla: "deepseek-ai/DeepSeek-V3",
    falcon_40b_mqa: "tiiuae/falcon-40b-instruct",
    gpt3_175b_mha: "meta-llama/Llama-2-70b-hf",
    qwen25_72b_gqa: "Qwen/Qwen2.5-72B-Instruct",
    custom: "custom-org/custom-model",
  };

  const vllmKvDtype =
    precision === "fp8_e4m3"
      ? "fp8_e4m3"
      : precision === "fp8_e5m2"
        ? "fp8_e5m2"
        : precision === "int4"
          ? "fp8" // vLLM uses FP8 or Marlin/AWQ INT4
          : "auto";

  const modelPath = modelMap[modelPresetId] || "meta-llama/Meta-Llama-3-8B-Instruct";

  return `#!/usr/bin/env bash
# ==============================================================================
# Production vLLM Engine High-Throughput Serving Launch Configuration
# Target Hardware: ${gpuId.toUpperCase()} | KV Cache Precision: ${precision.toUpperCase()} | Group Size: ${groupSize}
# ==============================================================================

vllm serve ${modelPath} \\
    --port 8000 \\
    --gpu-memory-utilization ${gpuMemoryUtil.toFixed(2)} \\
    --max-model-len ${maxModelLen} \\
    --max-num-seqs ${maxNumSeqs} \\
    --kv-cache-dtype ${vllmKvDtype} \\
    --kv-cache-group-size ${groupSize} \\
    --block-size 16 \\
    --enable-chunked-prefill \\
    --enable-prefix-caching \\
    --tensor-parallel-size 1 \\
    --trust-remote-code

# ------------------------------------------------------------------------------
# Python AsyncEngine API Integration Example
# ------------------------------------------------------------------------------
import asyncio
from vllm import AsyncLLMEngine, AsyncEngineArgs, SamplingParams

engine_args = AsyncEngineArgs(
    model="${modelPath}",
    gpu_memory_utilization=${gpuMemoryUtil.toFixed(2)},
    max_model_len=${maxModelLen},
    max_num_seqs=${maxNumSeqs},
    kv_cache_dtype="${vllmKvDtype}",
    block_size=16,
    enable_chunked_prefill=True,
    enable_prefix_caching=True,
    trust_remote_code=True,
)

engine = AsyncLLMEngine.from_engine_args(engine_args)
sampling_params = SamplingParams(temperature=0.7, top_p=0.9, max_tokens=512)
`;
}

/**
 * Generates PyTorch reference implementation for StreamingLLM Attention Sinks KV Cache.
 */
export function generatePyTorchStreamingCacheReference(
  sinkTokens: number = 4,
  windowTokens: number = 1024,
  layers: number = 32,
  heads: number = 8,
  headDim: number = 128,
): string {
  return `import torch
import torch.nn as nn
from typing import Optional, Tuple

class StreamingKVCache:
    """
    StreamingLLM Attention Sinks KV Cache (Xiao et al., 2023 / MIT & Stanford CS336).
    Preserves initial attention sinks (first S tokens) + rolling local window (W tokens)
    achieving O(1) constant memory footprint and stable infinite-context perplexity.
    """
    def __init__(
        self,
        num_layers: int = ${layers},
        num_kv_heads: int = ${heads},
        head_dim: int = ${headDim},
        num_sink_tokens: int = ${sinkTokens},
        window_size: int = ${windowTokens},
        dtype: torch.dtype = torch.float16,
        device: str = "cuda"
    ):
        self.num_layers = num_layers
        self.num_kv_heads = num_kv_heads
        self.head_dim = head_dim
        self.num_sink_tokens = num_sink_tokens
        self.window_size = window_size
        self.max_capacity = num_sink_tokens + window_size
        self.dtype = dtype
        self.device = device
        
        # Preallocated KV buffers: [L, B, H_KV, Max_Capacity, d_k]
        self.k_cache = [None] * num_layers
        self.v_cache = [None] * num_layers
        self.current_seq_len = 0

    def update(
        self,
        layer_idx: int,
        k_new: torch.Tensor, # [B, H_KV, 1, d_k]
        v_new: torch.Tensor  # [B, H_KV, 1, d_k]
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        """
        Appends new token KV and evicts intermediate tokens while strictly preserving sinks.
        """
        B, H, S_new, D = k_new.shape
        
        if self.k_cache[layer_idx] is None:
            self.k_cache[layer_idx] = k_new
            self.v_cache[layer_idx] = v_new
            return self.k_cache[layer_idx], self.v_cache[layer_idx]
            
        k_prev = self.k_cache[layer_idx]
        v_prev = self.v_cache[layer_idx]
        
        # Concat along sequence dimension
        k_cat = torch.cat([k_prev, k_new], dim=2)
        v_cat = torch.cat([v_prev, v_new], dim=2)
        
        current_len = k_cat.shape[2]
        
        if current_len <= self.max_capacity:
            self.k_cache[layer_idx] = k_cat
            self.v_cache[layer_idx] = v_cat
        else:
            # SINK PRESERVATION LOGIC:
            # 1. Keep the first S sink tokens
            k_sinks = k_cat[:, :, :self.num_sink_tokens, :]
            v_sinks = v_cat[:, :, :self.num_sink_tokens, :]
            
            # 2. Keep the most recent W window tokens
            k_window = k_cat[:, :, -self.window_size:, :]
            v_window = v_cat[:, :, -self.window_size:, :]
            
            # 3. Concatenate Sinks + Window (evicting middle tokens)
            self.k_cache[layer_idx] = torch.cat([k_sinks, k_window], dim=2)
            self.v_cache[layer_idx] = torch.cat([v_sinks, v_window], dim=2)
            
        return self.k_cache[layer_idx], self.v_cache[layer_idx]

    def reset(self):
        """Clears all KV buffers for fresh sequence generation."""
        self.k_cache = [None] * self.num_layers
        self.v_cache = [None] * self.num_layers
        self.current_seq_len = 0
`;
}

/**
 * Generates CUDA C++ vectorized header for INT4 / FP8 GEMV dequantization.
 */
export function generateCudaDequantHeader(
  precision: KVCachePrecision,
  groupSize: INT4GroupSize = 64,
  isAsymmetric: boolean = false,
): string {
  return `/**
 * Optimized CUDA C++ Dequantization Header for LLM Serving & FlashDecoding
 * Precision: ${precision.toUpperCase()} | Group Size: ${groupSize} | Architecture: SM90 (Hopper) / SM80 (Ampere)
 */

#pragma once
#include <cuda_fp16.h>
#include <cuda_bf16.h>
#include <stdint.h>

namespace ml_systems {

// Fast INT4 packed nibble to half2 vectorized conversion
__device__ __forceinline__ half2 dequantize_int4_packed_half2(
    uint8_t packed_val,
    half scale,
    ${isAsymmetric ? "half zero_point" : ""}
) {
    // Extract lower and upper 4-bit signed integers [-8, 7]
    int8_t low_nibble = static_cast<int8_t>((packed_val & 0x0F) - 8);
    int8_t high_nibble = static_cast<int8_t>(((packed_val >> 4) & 0x0F) - 8);

    half h_low = __float2half(static_cast<float>(low_nibble));
    half h_high = __float2half(static_cast<float>(high_nibble));

    ${
      isAsymmetric
        ? `h_low = __hsub(h_low, zero_point);
    h_high = __hsub(h_high, zero_point);`
        : ""
    }

    half2 h2;
    h2.x = __hmul(h_low, scale);
    h2.y = __hmul(h_high, scale);
    return h2;
}

// Vectorized 128-bit warp-collective KV cache loader & dot product
template <int HEAD_DIM, int GROUP_SIZE>
__device__ float compute_gemv_int4_dot_product(
    const half* __restrict__ q_vec,
    const uint8_t* __restrict__ k_quant_row,
    const half* __restrict__ k_scale_row,
    int head_dim_idx
) {
    float thread_dot = 0.0f;
    #pragma unroll
    for (int d = threadIdx.x * 2; d < HEAD_DIM; d += blockDim.x * 2) {
        uint8_t packed_byte = k_quant_row[d / 2];
        half scale = k_scale_row[d / GROUP_SIZE];
        half2 k_h2 = dequantize_int4_packed_half2(packed_byte, scale);
        
        half2 q_h2;
        q_h2.x = q_vec[d];
        q_h2.y = q_vec[d + 1];

        half2 prod = __hmul2(q_h2, k_h2);
        thread_dot += __half2float(prod.x) + __half2float(prod.y);
    }
    
    // Warp Shuffle Reduction (__shfl_down_sync)
    #pragma unroll
    for (int offset = 16; offset > 0; offset /= 2) {
        thread_dot += __shfl_down_sync(0xFFFFFFFF, thread_dot, offset);
    }
    return thread_dot;
}

} // namespace ml_systems
`;
}

// ============================================================================
// 5. MAIN REACT COMPONENT
// ============================================================================

export const KVCacheCompressionStudio: React.FC<KVCacheStudioProps> = ({
  initialPreset = "llama3_8b_gqa",
  initialTab = "architecture_footprint",
  initialGpu = "h100_sxm",
  className = "",
  title = "KV Cache Compression & Quantization Studio",
}) => {
  // Preset & Tab State
  const [selectedPresetId, setSelectedPresetId] = useState<KVCachePresetId>(initialPreset);
  const [selectedTab, setSelectedTab] = useState<KVCacheTabId>(initialTab);
  const [selectedGpuId, setSelectedGpuId] = useState<string>(initialGpu);

  // Model & Architecture Configuration State
  const [modelConfig, setModelConfig] = useState<KVCacheModelConfig>(
    KV_CACHE_PRESETS[initialPreset]?.config || KV_CACHE_PRESETS.llama3_8b_gqa.config,
  );

  // Precision & Quantization Parameters
  const [precision, setPrecision] = useState<KVCachePrecision>("fp16");
  const [groupSize, setGroupSize] = useState<INT4GroupSize>(64);
  const [scheme, setScheme] = useState<QuantizationScheme>("symmetric");
  const [enableOutlierSpikes, setEnableOutlierSpikes] = useState<boolean>(true);

  // Interactive Serving & Sequence Sliders
  const [batchSize, setBatchSize] = useState<number>(16);
  const [seqLen, setSeqLen] = useState<number>(modelConfig.contextLen || 8192);
  const [promptTokens, setPromptTokens] = useState<number>(2048);
  const [decodeTokens, setDecodeTokens] = useState<number>(512);
  const [vramUtilization, setVramUtilization] = useState<number>(0.9);
  const [pagedBlockSize] = useState<number>(16);

  // Streaming Eviction Simulation State
  const [streamingPolicy, setStreamingPolicy] = useState<StreamingEvictionPolicy>("streaming_llm");
  const [cacheBudget] = useState<number>(32);
  const [sinkTokens] = useState<number>(4);
  const [simSeqLength] = useState<number>(64);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [copiedCodeTab, setCopiedCodeTab] = useState<string | null>(null);

  // Code Gen Tab Substate
  const [codeGenTab, setCodeGenTab] = useState<"triton" | "vllm" | "pytorch" | "cuda">("triton");

  // Load preset on change
  const handlePresetChange = useCallback((presetId: KVCachePresetId) => {
    setSelectedPresetId(presetId);
    const preset = KV_CACHE_PRESETS[presetId];
    if (preset) {
      setModelConfig(preset.config);
      setSeqLen(preset.config.contextLen);
    }
  }, []);

  // Hardware Spec Memo
  const currentGpu = useMemo(() => {
    return KV_CACHE_GPU_SPECS[selectedGpuId] || KV_CACHE_GPU_SPECS.h100_sxm;
  }, [selectedGpuId]);

  // KV Cache Memory Calculation Memo
  const kvMemoryMetrics = useMemo(() => {
    return calculateKvCacheMemoryBytes(
      batchSize,
      seqLen,
      modelConfig.layers,
      modelConfig.numHeads,
      modelConfig.numKvHeads,
      modelConfig.headDim,
      precision,
      modelConfig.arch,
      modelConfig.mlaKvLoraRank || 512,
      modelConfig.mlaRopeRank || 64,
      groupSize,
      scheme === "asymmetric",
    );
  }, [batchSize, seqLen, modelConfig, precision, groupSize, scheme]);

  // Synthetic Activation Vector Memo for Quantization Lab
  const syntheticVector = useMemo(() => {
    const dim = 64;
    const vec: number[] = [];
    // Pseudo-random deterministic normal distribution
    for (let i = 0; i < dim; i++) {
      const u1 = Math.sin(i * 12.9898 + 78.233) * 0.5 + 0.5;
      const u2 = Math.cos(i * 4.1414 + 13.37) * 0.5 + 0.5;
      const z = Math.sqrt(-2.0 * Math.log(Math.max(1e-5, u1))) * Math.cos(2.0 * Math.PI * u2);
      vec.push(z * 1.2);
    }
    // Inject realistic 6x-10x outlier channel spikes (SmoothQuant / QuaRot / KIVI empirical profile)
    if (enableOutlierSpikes) {
      vec[12] = 8.85;
      vec[45] = -9.2;
    }
    return vec;
  }, [enableOutlierSpikes]);

  // Quantization Result Memo
  const quantResult = useMemo(() => {
    return calculateGroupQuantizationParams(syntheticVector, precision, scheme, groupSize);
  }, [syntheticVector, precision, scheme, groupSize]);

  // Streaming Eviction Simulation Result Memo
  const streamingResult = useMemo(() => {
    return simulateStreamingEviction(
      simSeqLength,
      cacheBudget,
      sinkTokens,
      streamingPolicy,
      kvMemoryMetrics.bytesPerToken,
    );
  }, [simSeqLength, cacheBudget, sinkTokens, streamingPolicy, kvMemoryMetrics.bytesPerToken]);

  // Step clamp when simulation parameters change
  useEffect(() => {
    if (currentStep >= streamingResult.steps.length) {
      setCurrentStep(Math.max(0, streamingResult.steps.length - 1));
    }
  }, [streamingResult.steps.length, currentStep]);

  // Animation Timer for StreamingLLM playback
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(80, Math.floor(400 / playbackSpeed));
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= streamingResult.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, streamingResult.steps.length]);

  // Serving Waterfall & Roofline Memo
  const servingMetrics = useMemo(() => {
    return calculateServingCapacityAndLatency(
      currentGpu,
      modelConfig,
      precision,
      groupSize,
      scheme === "asymmetric",
      promptTokens,
      decodeTokens,
      vramUtilization,
      2.5,
      pagedBlockSize,
      batchSize,
    );
  }, [
    currentGpu,
    modelConfig,
    precision,
    groupSize,
    scheme,
    promptTokens,
    decodeTokens,
    vramUtilization,
    pagedBlockSize,
    batchSize,
  ]);

  // Copy code helper
  const handleCopyCode = useCallback((codeText: string, tabName: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeTab(tabName);
    setTimeout(() => {
      setCopiedCodeTab(null);
    }, 2000);
  }, []);

  return (
    <div
      className={`w-full max-w-7xl mx-auto rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-6 ${className}`}
    >
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-cyan-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                {title}
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  CS336 / MIT 6.5940
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                High-Performance KV Cache Profiler, Group-Wise Quantization & Serving Roofline
                Engine
              </p>
            </div>
          </div>
        </div>

        {/* Global Hardware & Preset Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Model:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value as KVCachePresetId)}
              className="bg-transparent text-cyan-300 font-medium focus:outline-none cursor-pointer"
            >
              {Object.entries(KV_CACHE_PRESETS).map(([id, preset]) => (
                <option key={id} value={id} className="bg-slate-900 text-slate-200">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Hardware GPU Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-medium">GPU:</span>
            <select
              value={selectedGpuId}
              onChange={(e) => setSelectedGpuId(e.target.value)}
              className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer"
            >
              {Object.entries(KV_CACHE_GPU_SPECS).map(([id, gpu]) => (
                <option key={id} value={id} className="bg-slate-900 text-slate-200">
                  {gpu.name} ({gpu.vramGb}GB, {gpu.hbmBandwidthGbs} GB/s)
                </option>
              ))}
            </select>
          </div>

          {/* Precision Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            {(["fp16", "fp8_e4m3", "int8", "int4", "fp4"] as KVCachePrecision[]).map((prec) => (
              <button
                key={prec}
                onClick={() => setPrecision(prec)}
                className={`px-2 py-1 rounded font-mono text-[11px] transition-all ${
                  precision === prec
                    ? "bg-cyan-600 text-white font-bold shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {prec.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
        {(
          [
            {
              id: "architecture_footprint",
              label: "Architecture & Footprint",
              icon: Layers,
            },
            {
              id: "quantization_lab",
              label: "Quantization Lab",
              icon: Activity,
            },
            {
              id: "streaming_eviction",
              label: "Streaming Eviction",
              icon: Play,
            },
            {
              id: "serving_capacity",
              label: "Serving Capacity & Roofline",
              icon: Gauge,
            },
            {
              id: "kernel_code_gen",
              label: "Kernel & Code Generator",
              icon: Code2,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isActive
                  ? "bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-950/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: ARCHITECTURE FOOTPRINT & TENSOR COMPRESSION MULTIPLIERS
          ===================================================================== */}
      {selectedTab === "architecture_footprint" && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Total KV Memory
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">
                {formatBytes(kvMemoryMetrics.totalBytes)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="text-emerald-400 font-mono">
                  {formatBytes(kvMemoryMetrics.bytesPerToken)}
                </span>
                / token
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Compression vs FP16 MHA
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                {kvMemoryMetrics.compressionRatioVsFp16Mha.toFixed(1)}x
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {((1 - 1 / kvMemoryMetrics.compressionRatioVsFp16Mha) * 100).toFixed(1)}% VRAM
                reduction
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Architecture Type
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1 uppercase">
                {modelConfig.arch}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {modelConfig.arch === "gqa"
                  ? `G = ${modelConfig.numHeads / modelConfig.numKvHeads}:1 Sharing`
                  : modelConfig.arch === "mla"
                    ? "576-dim Low-Rank Latent"
                    : modelConfig.arch === "mqa"
                      ? "1 Shared KV Head"
                      : "Standard Multi-Head"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Elements / Token / Layer
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">
                {formatNumberWithCommas(kvMemoryMetrics.elementsPerTokenPerLayer)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {kvMemoryMetrics.bitsPerWeight.toFixed(2)} bits/weight effective
              </div>
            </div>
          </div>

          {/* Interactive Parameter Sliders & Formula Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sliders Panel */}
            <div className="lg:col-span-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Inference Hyperparameters
              </h2>

              <div className="space-y-3.5 text-xs">
                {/* Batch Size Slider */}
                <div>
                  <div className="flex justify-between font-mono text-slate-300 mb-1">
                    <span>Batch Size (B):</span>
                    <span className="text-cyan-400 font-bold">{batchSize}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="128"
                    value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Sequence Length Slider */}
                <div>
                  <div className="flex justify-between font-mono text-slate-300 mb-1">
                    <span>Sequence Length (S):</span>
                    <span className="text-cyan-400 font-bold">
                      {formatNumberWithCommas(seqLen)} tokens
                    </span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="65536"
                    step="512"
                    value={seqLen}
                    onChange={(e) => setSeqLen(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Number of Layers */}
                <div>
                  <div className="flex justify-between font-mono text-slate-300 mb-1">
                    <span>Number of Layers (L):</span>
                    <span className="text-cyan-400 font-bold">{modelConfig.layers}</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="128"
                    value={modelConfig.layers}
                    onChange={(e) =>
                      setModelConfig({
                        ...modelConfig,
                        layers: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* Query Heads & KV Heads */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between font-mono text-slate-300 mb-1">
                      <span>Query Heads:</span>
                      <span className="text-indigo-400 font-bold">{modelConfig.numHeads}</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="128"
                      value={modelConfig.numHeads}
                      onChange={(e) =>
                        setModelConfig({
                          ...modelConfig,
                          numHeads: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-mono text-slate-300 mb-1">
                      <span>KV Heads:</span>
                      <span className="text-emerald-400 font-bold">{modelConfig.numKvHeads}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={modelConfig.numHeads}
                      value={modelConfig.numKvHeads}
                      onChange={(e) =>
                        setModelConfig({
                          ...modelConfig,
                          numKvHeads: Number(e.target.value),
                        })
                      }
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>

                {/* Head Dim */}
                <div>
                  <div className="flex justify-between font-mono text-slate-300 mb-1">
                    <span>Head Dimension (d_k):</span>
                    <span className="text-amber-400 font-bold">{modelConfig.headDim}</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="256"
                    step="32"
                    value={modelConfig.headDim}
                    onChange={(e) =>
                      setModelConfig({
                        ...modelConfig,
                        headDim: Number(e.target.value),
                      })
                    }
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Architecture Comparison SVG Chart */}
            <div className="lg:col-span-6 p-5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  KV Cache Footprint by Architecture & Quantization
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  S = {formatNumberWithCommas(seqLen)} | B = {batchSize}
                </span>
              </h2>

              {/* Comparative SVG Bar Chart */}
              <div className="space-y-2.5">
                {[
                  {
                    name: "MHA (FP16 Baseline)",
                    bytes: calculateKvCacheMemoryBytes(
                      batchSize,
                      seqLen,
                      modelConfig.layers,
                      modelConfig.numHeads,
                      modelConfig.numHeads,
                      modelConfig.headDim,
                      "fp16",
                      "mha",
                    ).totalBytes,
                    color: "bg-red-500",
                    border: "border-red-500/40",
                  },
                  {
                    name: `GQA ${modelConfig.numHeads / modelConfig.numKvHeads}:1 (FP16)`,
                    bytes: calculateKvCacheMemoryBytes(
                      batchSize,
                      seqLen,
                      modelConfig.layers,
                      modelConfig.numHeads,
                      modelConfig.numKvHeads,
                      modelConfig.headDim,
                      "fp16",
                      "gqa",
                    ).totalBytes,
                    color: "bg-amber-500",
                    border: "border-amber-500/40",
                  },
                  {
                    name: `GQA ${modelConfig.numHeads / modelConfig.numKvHeads}:1 (FP8 E4M3)`,
                    bytes: calculateKvCacheMemoryBytes(
                      batchSize,
                      seqLen,
                      modelConfig.layers,
                      modelConfig.numHeads,
                      modelConfig.numKvHeads,
                      modelConfig.headDim,
                      "fp8_e4m3",
                      "gqa",
                    ).totalBytes,
                    color: "bg-cyan-500",
                    border: "border-cyan-500/40",
                  },
                  {
                    name: `GQA ${modelConfig.numHeads / modelConfig.numKvHeads}:1 (INT4 g=64)`,
                    bytes: calculateKvCacheMemoryBytes(
                      batchSize,
                      seqLen,
                      modelConfig.layers,
                      modelConfig.numHeads,
                      modelConfig.numKvHeads,
                      modelConfig.headDim,
                      "int4",
                      "gqa",
                      512,
                      64,
                      64,
                    ).totalBytes,
                    color: "bg-emerald-500",
                    border: "border-emerald-500/40",
                  },
                  {
                    name: "DeepSeek MLA (FP16)",
                    bytes: calculateKvCacheMemoryBytes(
                      batchSize,
                      seqLen,
                      modelConfig.layers,
                      modelConfig.numHeads,
                      modelConfig.numKvHeads,
                      modelConfig.headDim,
                      "fp16",
                      "mla",
                      512,
                      64,
                    ).totalBytes,
                    color: "bg-indigo-500",
                    border: "border-indigo-500/40",
                  },
                  {
                    name: "DeepSeek MLA (INT4 g=64)",
                    bytes: calculateKvCacheMemoryBytes(
                      batchSize,
                      seqLen,
                      modelConfig.layers,
                      modelConfig.numHeads,
                      modelConfig.numKvHeads,
                      modelConfig.headDim,
                      "int4",
                      "mla",
                      512,
                      64,
                      64,
                    ).totalBytes,
                    color: "bg-purple-500",
                    border: "border-purple-500/40",
                  },
                ].map((item, idx) => {
                  const maxVal = calculateKvCacheMemoryBytes(
                    batchSize,
                    seqLen,
                    modelConfig.layers,
                    modelConfig.numHeads,
                    modelConfig.numHeads,
                    modelConfig.headDim,
                    "fp16",
                    "mha",
                  ).totalBytes;
                  const pct = Math.max(3, (item.bytes / maxVal) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-300">
                        <span>{item.name}</span>
                        <span className="font-bold text-white">{formatBytes(item.bytes)}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mathematical Tensor Formula Card */}
              <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5">
                <div className="text-cyan-400 font-bold">
                  M_KV = 2 · B · L · S · H_KV · d_k × (bits / 8)
                </div>
                <div className="text-slate-400 text-[11px]">
                  MLA Equation: M_MLA = B · L · S · (d_c + d_r) × (bits / 8) where d_c=512, d_r=64.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: QUANTIZATION LAB & OUTLIER SENSITIVITY
          ===================================================================== */}
      {selectedTab === "quantization_lab" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Precision selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Precision:</span>
                <select
                  value={precision}
                  onChange={(e) => setPrecision(e.target.value as KVCachePrecision)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-mono"
                >
                  <option value="fp16">FP16 (16-bit)</option>
                  <option value="fp8_e4m3">FP8 E4M3 (8-bit)</option>
                  <option value="fp8_e5m2">FP8 E5M2 (8-bit)</option>
                  <option value="int8">INT8 (8-bit)</option>
                  <option value="int4">INT4 Group-Wise (4-bit)</option>
                  <option value="fp4">FP4 E2M1 (4-bit)</option>
                </select>
              </div>

              {/* Group Size selector */}
              {(precision === "int4" || precision === "fp4") && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Group Size (g):</span>
                  <select
                    value={groupSize}
                    onChange={(e) => setGroupSize(Number(e.target.value) as INT4GroupSize)}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-emerald-300 font-mono"
                  >
                    <option value={16}>16 elements</option>
                    <option value={32}>32 elements</option>
                    <option value={64}>64 elements</option>
                    <option value={128}>128 elements</option>
                    <option value={256}>256 elements</option>
                  </select>
                </div>
              )}

              {/* Scheme Toggle */}
              {(precision === "int8" || precision === "int4") && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Scheme:</span>
                  <button
                    onClick={() => setScheme(scheme === "symmetric" ? "asymmetric" : "symmetric")}
                    className={`px-2.5 py-1 rounded-lg border font-mono ${
                      scheme === "symmetric"
                        ? "bg-indigo-950 border-indigo-500/50 text-indigo-300"
                        : "bg-amber-950 border-amber-500/50 text-amber-300"
                    }`}
                  >
                    {scheme.toUpperCase()}
                  </button>
                </div>
              )}
            </div>

            {/* Outlier Channel Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEnableOutlierSpikes(!enableOutlierSpikes)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  enableOutlierSpikes
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {enableOutlierSpikes ? "Outliers Active (8.8x spike)" : "No Outliers"}
              </button>
            </div>
          </div>

          {/* Quantization Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Signal-to-Noise (SNR)
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${
                  quantResult.snrDb > 30
                    ? "text-emerald-400"
                    : quantResult.snrDb > 18
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {quantResult.snrDb.toFixed(2)} dB
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {quantResult.snrDb > 25 ? "High Fidelity" : "Quant Lossy"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Mean Squared Error (MSE)
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">
                {quantResult.mse.toExponential(3)}
              </div>
              <div className="text-xs text-slate-400 mt-1">MAE: {quantResult.mae.toFixed(4)}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Cosine Similarity
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1">
                {(quantResult.cosineSim * 100).toFixed(3)}%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Max Err: {quantResult.maxError.toFixed(3)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Effective Bits / Weight
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1">
                {quantResult.effectiveBitsPerWeight.toFixed(2)} b
              </div>
              <div className="text-xs text-slate-400 mt-1">incl. scale / zero metadata</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                VRAM Compression
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                {quantResult.compressionRatio.toFixed(2)}x
              </div>
              <div className="text-xs text-slate-400 mt-1">vs FP16 tensor</div>
            </div>
          </div>

          {/* Interactive Visual Reconstruction & Residual Chart */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Channel Vector Reconstruction: Original vs Dequantized Values
              </h3>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Original (FP16)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Dequantized
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  Error Residual
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800 p-2 relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 800 160" preserveAspectRatio="none">
                {/* Zero line */}
                <line
                  x1="0"
                  y1="80"
                  x2="800"
                  y2="80"
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Original Polyline */}
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2"
                  points={syntheticVector
                    .map((val, idx) => {
                      const x = (idx / (syntheticVector.length - 1)) * 800;
                      const y = 80 - (val / 10) * 70;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {/* Dequantized Polyline */}
                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  points={quantResult.dequantized
                    .map((val, idx) => {
                      const x = (idx / (quantResult.dequantized.length - 1)) * 800;
                      const y = 80 - (val / 10) * 70;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                />

                {/* Error Residual Bars */}
                {syntheticVector.map((val, idx) => {
                  const deq = quantResult.dequantized[idx] || 0;
                  const err = val - deq;
                  const x = (idx / (syntheticVector.length - 1)) * 800;
                  const yZero = 80;
                  const yErr = 80 - ((err * 8) / 10) * 70;
                  return (
                    <line
                      key={idx}
                      x1={x}
                      y1={yZero}
                      x2={x}
                      y2={yErr}
                      stroke="#f87171"
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Mathematical explanation of Group-Wise Clipping */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono space-y-1">
              <span className="text-cyan-400 font-bold">Affine Quantization Equation:</span> q =
              clamp(round(x / s) + z, 0, 2^b - 1) | s = (max - min) / (2^b - 1) | z = round(-min /
              s)
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: STREAMING EVICTION & ATTENTION SINKS
          ===================================================================== */}
      {selectedTab === "streaming_eviction" && (
        <div className="space-y-6">
          {/* Policy & Control Toolbar */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            {/* Eviction Policy Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 mr-1">Policy:</span>
              {(
                [
                  { id: "streaming_llm", label: "StreamingLLM (Sinks + Window)" },
                  { id: "h2o", label: "H2O (Heavy Hitter Oracle)" },
                  { id: "lru_window", label: "LRU Window (No Sinks - Blowup)" },
                  { id: "full_cache", label: "Full Cache (Infinite VRAM)" },
                ] as const
              ).map((pol) => (
                <button
                  key={pol.id}
                  onClick={() => setStreamingPolicy(pol.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    streamingPolicy === pol.id
                      ? "bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950"
                      : "bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {pol.label}
                </button>
              ))}
            </div>

            {/* Scrubber Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(0)}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                title="Step Back"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-medium text-xs flex items-center gap-1.5 shadow"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Play
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  setCurrentStep((prev) => Math.min(streamingResult.steps.length - 1, prev + 1))
                }
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
                title="Step Forward"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono"
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={5}>5x</option>
              </select>
            </div>
          </div>

          {/* Simulation Status & Perplexity Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Current Token Step
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">
                t = {currentStep}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                out of {streamingResult.steps.length - 1} generated
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Simulated Perplexity (PPL)
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${
                  (streamingResult.steps[currentStep]?.perplexity || 4) > 10
                    ? "text-red-400 animate-pulse"
                    : "text-emerald-400"
                }`}
              >
                {(streamingResult.steps[currentStep]?.perplexity || 4.15).toFixed(2)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {(streamingResult.steps[currentStep]?.perplexity || 4) > 10
                  ? "Catastrophic Failure!"
                  : "Stable & Coherent"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Captured Attention Mass
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1">
                {((streamingResult.steps[currentStep]?.capturedAttentionMass || 1.0) * 100).toFixed(
                  1,
                )}
                %
              </div>
              <div className="text-xs text-slate-400 mt-1">of total softmax mass</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Cache Budget / VRAM Bound
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1">
                {streamingResult.steps[currentStep]?.cachedTokenIndices.length || 0} / {cacheBudget}
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                {formatBytes(streamingResult.steps[currentStep]?.cacheMemoryBytes || 0)}
              </div>
            </div>
          </div>

          {/* Interactive 2D Attention KV Retention Grid */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                2D KV Cache Retention Map (Tokens 0 to {currentStep})
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  Sink Token (Fixed)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  Heavy Hitter
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500" />
                  Local Window
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                  Evicted
                </span>
              </div>
            </div>

            {/* Token Slots Grid */}
            <div className="grid grid-cols-8 sm:grid-cols-16 gap-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 max-h-64 overflow-y-auto">
              {Array.from({ length: currentStep + 1 }).map((_, idx) => {
                const stepData = streamingResult.steps[currentStep];
                const role = stepData?.tokenRoles[idx] || "evicted";
                const isCached = stepData?.cachedTokenIndices.includes(idx) || false;

                let bgClass = "bg-slate-900 text-slate-600 border-slate-800";
                if (role === "sink")
                  bgClass =
                    "bg-emerald-600/90 text-white font-bold border-emerald-400/50 shadow-sm";
                else if (role === "heavy_hitter")
                  bgClass = "bg-amber-600/90 text-white font-bold border-amber-400/50 shadow-sm";
                else if (role === "recent_window")
                  bgClass = "bg-blue-600/90 text-white font-medium border-blue-400/50";

                return (
                  <div
                    key={idx}
                    className={`h-9 rounded-lg border flex flex-col items-center justify-center text-[10px] font-mono transition-all duration-300 ${bgClass}`}
                    title={`Token #${idx} | Role: ${role} | ${isCached ? "CACHED" : "EVICTED"}`}
                  >
                    <span>#{idx}</span>
                    <span className="text-[8px] opacity-80">
                      {role === "sink"
                        ? "SINK"
                        : role === "heavy_hitter"
                          ? "H2O"
                          : role === "recent_window"
                            ? "WIN"
                            : "DROP"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Perplexity Curve SVG */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                Perplexity (PPL) Trajectory across Sequence Generation
              </span>
              <div className="w-full h-28 bg-slate-950 rounded-xl border border-slate-800 p-2 relative">
                <svg className="w-full h-full" viewBox="0 0 800 100" preserveAspectRatio="none">
                  {/* Stable baseline guide */}
                  <line
                    x1="0"
                    y1="80"
                    x2="800"
                    y2="80"
                    stroke="#059669"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />

                  {/* Perplexity Line */}
                  <polyline
                    fill="none"
                    stroke={streamingPolicy === "lru_window" ? "#f87171" : "#22d3ee"}
                    strokeWidth="2.5"
                    points={streamingResult.steps
                      .slice(0, currentStep + 1)
                      .map((s, idx) => {
                        const x = (idx / Math.max(1, streamingResult.steps.length - 1)) * 800;
                        const cappedPpl = Math.min(50, s.perplexity);
                        const y = 80 - ((cappedPpl - 4) / 46) * 75;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: MULTI-TENANT GPU SERVING CAPACITY & ROOFLINE
          ===================================================================== */}
      {selectedTab === "serving_capacity" && (
        <div className="space-y-6">
          {/* Serving Parameters Toolbar */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Prompt Tokens:</span>
                <span className="text-cyan-400 font-bold">{promptTokens}</span>
              </div>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                value={promptTokens}
                onChange={(e) => setPromptTokens(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Decode Output Tokens:</span>
                <span className="text-indigo-400 font-bold">{decodeTokens}</span>
              </div>
              <input
                type="range"
                min="32"
                max="2048"
                step="32"
                value={decodeTokens}
                onChange={(e) => setDecodeTokens(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>GPU VRAM Utilization Target:</span>
                <span className="text-emerald-400 font-bold">
                  {(vramUtilization * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={vramUtilization}
                onChange={(e) => setVramUtilization(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* VRAM Waterfall Budget Breakdown */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                VRAM Waterfall Budget Allocation ({currentGpu.name} - {currentGpu.vramGb}GB Total)
              </span>
              <span className="text-xs font-mono text-emerald-400">
                {servingMetrics.waterfall.availableKvGb.toFixed(1)} GB Available for KV
              </span>
            </h3>

            {/* Waterfall Stacked Bar */}
            <div className="space-y-2">
              <div className="w-full h-7 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 text-[10px] font-mono font-bold text-white">
                {/* Model Weights */}
                <div
                  className="bg-blue-600 flex items-center justify-center transition-all duration-500"
                  style={{
                    width: `${(servingMetrics.waterfall.modelWeightsGb / currentGpu.vramGb) * 100}%`,
                  }}
                  title={`Model Weights: ${servingMetrics.waterfall.modelWeightsGb.toFixed(1)} GB`}
                >
                  Weights ({servingMetrics.waterfall.modelWeightsGb.toFixed(1)}G)
                </div>

                {/* Activations & CUDA Context */}
                <div
                  className="bg-amber-600 flex items-center justify-center transition-all duration-500"
                  style={{
                    width: `${((servingMetrics.waterfall.activationsGb + servingMetrics.waterfall.cudaRuntimeGb) / currentGpu.vramGb) * 100}%`,
                  }}
                  title={`CUDA Context + Activations: ${(servingMetrics.waterfall.activationsGb + servingMetrics.waterfall.cudaRuntimeGb).toFixed(1)} GB`}
                >
                  Overhead
                </div>

                {/* Available KV Cache */}
                <div
                  className="bg-emerald-600 flex items-center justify-center transition-all duration-500"
                  style={{
                    width: `${(servingMetrics.waterfall.availableKvGb / currentGpu.vramGb) * 100}%`,
                  }}
                  title={`KV Cache Pool: ${servingMetrics.waterfall.availableKvGb.toFixed(1)} GB`}
                >
                  KV Cache Pool ({servingMetrics.waterfall.availableKvGb.toFixed(1)}G)
                </div>
              </div>

              <div className="flex flex-wrap justify-between text-[11px] font-mono text-slate-400">
                <span>Model Weights: {servingMetrics.waterfall.modelWeightsGb.toFixed(2)} GB</span>
                <span>
                  Context & Overhead:{" "}
                  {(
                    servingMetrics.waterfall.activationsGb + servingMetrics.waterfall.cudaRuntimeGb
                  ).toFixed(2)}{" "}
                  GB
                </span>
                <span>
                  Available KV Pool: {servingMetrics.waterfall.availableKvGb.toFixed(2)} GB
                </span>
              </div>
            </div>
          </div>

          {/* Roofline Performance & Concurrency Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Max Concurrent Requests
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1">
                B_max = {servingMetrics.waterfall.maxConcurrentRequests}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                at S = {promptTokens + decodeTokens} tokens/req
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Time to First Token (TTFT)
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 mt-1">
                {formatLatencyMs(servingMetrics.performance.ttftMs)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Prefill ({promptTokens} tokens)</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Time Per Output Token (TPOT)
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-1">
                {formatLatencyMs(servingMetrics.performance.tpotMs)}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {servingMetrics.performance.isMemoryBound
                  ? "Memory-Bandwidth Bound"
                  : "Compute Bound"}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                Token Throughput
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1">
                {formatNumberWithCommas(servingMetrics.performance.throughputTokensSec)} tok/s
              </div>
              <div className="text-xs text-slate-400 mt-1">at batch size {batchSize}</div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: KERNEL & CODE GENERATOR
          ===================================================================== */}
      {selectedTab === "kernel_code_gen" && (
        <div className="space-y-4">
          {/* Code Tabs & Copy Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "triton", label: "Triton GPU Kernel" },
                  { id: "vllm", label: "vLLM Serving Config" },
                  { id: "pytorch", label: "PyTorch Streaming Cache" },
                  { id: "cuda", label: "CUDA C++ Header" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCodeGenTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    codeGenTab === tab.id
                      ? "bg-cyan-600 text-white font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                let code = "";
                if (codeGenTab === "triton")
                  code = generateTritonQuantizedKvKernel(
                    modelConfig.arch,
                    precision,
                    groupSize,
                    scheme === "asymmetric",
                  );
                else if (codeGenTab === "vllm")
                  code = generateVllmServingConfig(
                    selectedPresetId,
                    selectedGpuId,
                    precision,
                    groupSize,
                    seqLen,
                    vramUtilization,
                    servingMetrics.waterfall.maxConcurrentRequests,
                  );
                else if (codeGenTab === "pytorch")
                  code = generatePyTorchStreamingCacheReference(
                    sinkTokens,
                    cacheBudget - sinkTokens,
                    modelConfig.layers,
                    modelConfig.numKvHeads,
                    modelConfig.headDim,
                  );
                else if (codeGenTab === "cuda")
                  code = generateCudaDequantHeader(precision, groupSize, scheme === "asymmetric");
                handleCopyCode(code, codeGenTab);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-cyan-400 hover:bg-slate-800 transition-all font-mono"
            >
              {copiedCodeTab === codeGenTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Code Container */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
            <pre>
              {codeGenTab === "triton" &&
                generateTritonQuantizedKvKernel(
                  modelConfig.arch,
                  precision,
                  groupSize,
                  scheme === "asymmetric",
                )}
              {codeGenTab === "vllm" &&
                generateVllmServingConfig(
                  selectedPresetId,
                  selectedGpuId,
                  precision,
                  groupSize,
                  seqLen,
                  vramUtilization,
                  servingMetrics.waterfall.maxConcurrentRequests,
                )}
              {codeGenTab === "pytorch" &&
                generatePyTorchStreamingCacheReference(
                  sinkTokens,
                  cacheBudget - sinkTokens,
                  modelConfig.layers,
                  modelConfig.numKvHeads,
                  modelConfig.headDim,
                )}
              {codeGenTab === "cuda" &&
                generateCudaDequantHeader(precision, groupSize, scheme === "asymmetric")}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
