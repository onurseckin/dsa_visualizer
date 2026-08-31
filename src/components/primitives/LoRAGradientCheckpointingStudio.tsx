import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Zap,
  Layers,
  BarChart3,
  Activity,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  ShieldCheck,
  Sparkles,
  Server,
  Scale,
  Boxes,
  HardDrive,
  Terminal,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type LoRAStudioTabId =
  | "lora_matrix"
  | "qlora_nf4"
  | "vram_breakdown"
  | "checkpointing_timeline"
  | "hardware_fit"
  | "training_stepper";

export type LoRAPresetId =
  | "llama3_8b_lora"
  | "mistral_7b_qlora"
  | "deepseek_v3_moe"
  | "gpt4_70b_oom_stress"
  | "vit_huge_lora"
  | "edge_device_1_5b"
  | "custom";

export type BasePrecision = "FP32" | "FP16" | "BF16" | "INT8" | "NF4" | "INT4";

export type CheckpointingMode = "none" | "full" | "sqrt" | "selective";

export type OptimizerType = "adamw_fp32" | "adamw_8bit" | "paged_adamw" | "sgd";

export type TargetModule =
  | "q_proj"
  | "k_proj"
  | "v_proj"
  | "o_proj"
  | "gate_proj"
  | "up_proj"
  | "down_proj";

export interface LoRAStudioConfig {
  readonly modelName: string;
  readonly totalParamsB: number; // in Billions (e.g. 8.0 for 8B)
  readonly hiddenDim: number; // d_model (e.g. 4096)
  readonly intermediateDim: number; // d_ffn (e.g. 14336)
  readonly numLayers: number; // L (e.g. 32)
  readonly numAttentionHeads: number; // n_heads (e.g. 32)
  readonly numKvHeads: number; // n_kv (e.g. 8 for GQA or 32 for MHA)
  readonly seqLength: number; // S (e.g. 4096)
  readonly batchSize: number; // B (e.g. 4)
  readonly rank: number; // r (e.g. 16)
  readonly alpha: number; // alpha scaling (e.g. 32)
  readonly dropout: number; // LoRA dropout (e.g. 0.05)
  readonly basePrecision: BasePrecision;
  readonly doubleQuantization: boolean; // QLoRA Double Quantization
  readonly quantBlockSize1: number; // B1 (default 64)
  readonly quantBlockSize2: number; // B2 (default 256)
  readonly checkpointingMode: CheckpointingMode;
  readonly targetModules: readonly TargetModule[];
  readonly optimizerType: OptimizerType;
  readonly selectedGpuId: string;
}

export interface LoRAPreset {
  readonly id: LoRAPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly architectureFamily: string;
  readonly config: LoRAStudioConfig;
  readonly highlights: readonly string[];
}

export interface GpuHardwareSpec {
  readonly id: string;
  readonly name: string;
  readonly vramGb: number;
  readonly bandwidthGbs: number;
  readonly memoryType: string;
  readonly architecture: string;
  readonly tdpWatts: number;
}

export type HardwareStatus = "safe" | "tight" | "oom_danger" | "impossible";

export interface HardwareFitEvaluation {
  readonly gpu: GpuHardwareSpec;
  readonly status: HardwareStatus;
  readonly utilizationPct: number;
  readonly totalVramRequiredGb: number;
  readonly vramHeadroomGb: number;
  readonly maxBatchSize: number;
  readonly recommendation: string;
}

export interface MemoryBreakdownItem {
  readonly name: string;
  readonly sizeGb: number;
  readonly color: string;
  readonly pct: number;
}

export interface MemoryBreakdown {
  readonly baseWeightsGb: number;
  readonly baseWeightsBpp: number;
  readonly loraAdaptersGb: number;
  readonly loraParamsCount: number;
  readonly baseParamsCount: number;
  readonly paramReductionPct: number;
  readonly gradientsGb: number;
  readonly optimizerStatesGb: number;
  readonly peakActivationsGb: number;
  readonly kvCacheGb: number;
  readonly cudaContextGb: number;
  readonly totalVramGb: number;
  readonly fullFineTuningVramGb: number;
  readonly vramSavingsPct: number;
  readonly breakdownItems: readonly MemoryBreakdownItem[];
}

export interface CheckpointingTradeoff {
  readonly mode: CheckpointingMode;
  readonly peakActivationMemoryMb: number;
  readonly storedActivationTensors: number;
  readonly recomputationFlopsRatio: number; // e.g. 0.0 for none, 0.333 for full
  readonly boundaryMemoryMb: number;
  readonly layerPeakMemoryMb: number;
  readonly speedPenaltyPct: number;
  readonly summary: string;
}

export interface TrainingPipelineStep {
  readonly id: string;
  readonly stepNumber: number;
  readonly phase:
    | "forward"
    | "checkpoint"
    | "loss"
    | "backward"
    | "recompute"
    | "lora_grad"
    | "optimizer";
  readonly layerIndex: number;
  readonly title: string;
  readonly description: string;
  readonly formula: string;
  readonly vramCurrentGb: number;
  readonly flopsAccumulatedGFlops: number;
  readonly activeTensor: string;
  readonly isCheckpointStored: boolean;
  readonly isRecomputed: boolean;
}

export interface SVDSpectrumResult {
  readonly singularValues: readonly number[];
  readonly energyCumulative: readonly number[];
  readonly effectiveRank90: number;
  readonly effectiveRank99: number;
  readonly totalEnergy: number;
}

export interface LoRAStudioProps {
  readonly initialPreset?: LoRAPresetId;
  readonly initialConfig?: Partial<LoRAStudioConfig>;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly onPresetChange?: (presetId: LoRAPresetId) => void;
  readonly onTabChange?: (tab: LoRAStudioTabId) => void;
}

// ============================================================================
// 2. CONSTANTS & HARDWARE SPECS
// ============================================================================

/**
 * Exact 16 NormalFloat4 (NF4) quantile levels derived from standard normal distribution N(0, 1)
 * (Dettmers et al. 2023 "QLoRA: Efficient Finetuning of Quantized LLMs")
 */
export const NF4_QUANTILES: readonly number[] = [
  -1.0, -0.6961928009986877, -0.5250730514526367, -0.39491748809814453, -0.28444138169288635,
  -0.18477343022823334, -0.09105003625154495, 0.0, 0.07958029955625534, 0.16093020141124725,
  0.24611230194568634, 0.33791524171829224, 0.44070982933044434, 0.5626170039176941,
  0.7229568362236023, 1.0,
];

export const GPU_HARDWARE_SPECS: readonly GpuHardwareSpec[] = [
  {
    id: "rtx_4090",
    name: "NVIDIA GeForce RTX 4090",
    vramGb: 24,
    bandwidthGbs: 1008,
    memoryType: "GDDR6X",
    architecture: "Ada Lovelace",
    tdpWatts: 450,
  },
  {
    id: "a100_80gb",
    name: "NVIDIA A100 SXM4",
    vramGb: 80,
    bandwidthGbs: 2039,
    memoryType: "HBM2e",
    architecture: "Ampere",
    tdpWatts: 400,
  },
  {
    id: "h100_80gb",
    name: "NVIDIA H100 SXM5",
    vramGb: 80,
    bandwidthGbs: 3350,
    memoryType: "HBM3",
    architecture: "Hopper",
    tdpWatts: 700,
  },
  {
    id: "rtx_3090",
    name: "NVIDIA GeForce RTX 3090",
    vramGb: 24,
    bandwidthGbs: 936,
    memoryType: "GDDR6X",
    architecture: "Ampere",
    tdpWatts: 350,
  },
  {
    id: "tesla_t4",
    name: "NVIDIA Tesla T4",
    vramGb: 16,
    bandwidthGbs: 320,
    memoryType: "GDDR6",
    architecture: "Turing",
    tdpWatts: 70,
  },
  {
    id: "rtx_4060",
    name: "NVIDIA GeForce RTX 4060",
    vramGb: 8,
    bandwidthGbs: 272,
    memoryType: "GDDR6",
    architecture: "Ada Lovelace",
    tdpWatts: 115,
  },
  {
    id: "apple_m4_max",
    name: "Apple M4 Max Unified (128GB)",
    vramGb: 128,
    bandwidthGbs: 546,
    memoryType: "Unified LPDDR5X",
    architecture: "Apple Silicon",
    tdpWatts: 75,
  },
  {
    id: "apple_m3_pro",
    name: "Apple M3 Pro Unified (36GB)",
    vramGb: 36,
    bandwidthGbs: 150,
    memoryType: "Unified LPDDR5",
    architecture: "Apple Silicon",
    tdpWatts: 45,
  },
];

export const ALL_TARGET_MODULES: readonly TargetModule[] = [
  "q_proj",
  "k_proj",
  "v_proj",
  "o_proj",
  "gate_proj",
  "up_proj",
  "down_proj",
];

// ============================================================================
// 3. PRESETS
// ============================================================================

export const LORA_STUDIO_PRESETS: Record<LoRAPresetId, LoRAPreset> = {
  llama3_8b_lora: {
    id: "llama3_8b_lora",
    name: "Llama-3-8B LoRA Fine-Tuning",
    subtitle: "Rank r=16, Alpha=32, Full Checkpointing on RTX 4090",
    description:
      "Production-grade LLaMA-3 8B parameter adaptation with rank 16 on all attention & MLP projection layers. Full activation checkpointing ensures safe fitting into 24GB VRAM.",
    architectureFamily: "Meta LLaMA 3 Architecture",
    config: {
      modelName: "Meta-Llama-3-8B",
      totalParamsB: 8.03,
      hiddenDim: 4096,
      intermediateDim: 14336,
      numLayers: 32,
      numAttentionHeads: 32,
      numKvHeads: 8,
      seqLength: 4096,
      batchSize: 4,
      rank: 16,
      alpha: 32,
      dropout: 0.05,
      basePrecision: "BF16",
      doubleQuantization: false,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "full",
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
      optimizerType: "adamw_8bit",
      selectedGpuId: "rtx_4090",
    },
    highlights: [
      "LoRA Rank r=16 on all 7 Linear projections",
      "BF16 Base Weights (16.0 GB)",
      "8-bit AdamW optimizer for adapters",
      "Full Checkpointing reduces activations by 88%",
    ],
  },

  mistral_7b_qlora: {
    id: "mistral_7b_qlora",
    name: "Mistral-7B QLoRA (NF4 + Double Quant)",
    subtitle: "4.127 bpp Base Model with Rank 64 Adapters",
    description:
      "Cutting-edge QLoRA fine-tuning using NormalFloat4 with 2-stage Double Quantization (B1=64, B2=256) and Paged AdamW, achieving lossless 16-bit quality in under 9GB VRAM.",
    architectureFamily: "Mistral AI Architecture",
    config: {
      modelName: "Mistral-7B-v0.3",
      totalParamsB: 7.24,
      hiddenDim: 4096,
      intermediateDim: 14336,
      numLayers: 32,
      numAttentionHeads: 32,
      numKvHeads: 8,
      seqLength: 4096,
      batchSize: 4,
      rank: 64,
      alpha: 128,
      dropout: 0.05,
      basePrecision: "NF4",
      doubleQuantization: true,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "full",
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
      optimizerType: "paged_adamw",
      selectedGpuId: "rtx_4090",
    },
    highlights: [
      "NF4 Base Quantization: 4.127 bits per param",
      "Double Quantization saves 0.373 bpp (~330MB on 7B)",
      "Rank r=64 allows rich expressive updates",
      "Fits easily on consumer 16GB / 24GB GPUs",
    ],
  },

  deepseek_v3_moe: {
    id: "deepseek_v3_moe",
    name: "DeepSeek-V3 671B (Active 37B) Latent LoRA",
    subtitle: "Multi-Head Latent Attention + Selective Checkpointing",
    description:
      "Massive Mixture-of-Experts architecture fine-tuning targeting query/key/value compression projections with selective activation checkpointing across 61 transformer layers.",
    architectureFamily: "DeepSeek MLA MoE Architecture",
    config: {
      modelName: "DeepSeek-V3-671B",
      totalParamsB: 37.0, // active params during forward pass
      hiddenDim: 7168,
      intermediateDim: 18432,
      numLayers: 61,
      numAttentionHeads: 128,
      numKvHeads: 128,
      seqLength: 8192,
      batchSize: 2,
      rank: 32,
      alpha: 64,
      dropout: 0.0,
      basePrecision: "NF4",
      doubleQuantization: true,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "selective",
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj"],
      optimizerType: "paged_adamw",
      selectedGpuId: "h100_80gb",
    },
    highlights: [
      "Selective Attention Checkpointing (saves 65% memory at +15% FLOPs)",
      "Multi-Head Latent Attention LoRA Rank 32",
      "Double Quantized NF4 Active Weights",
      "Scale: 8K sequence length on 80GB H100",
    ],
  },

  gpt4_70b_oom_stress: {
    id: "gpt4_70b_oom_stress",
    name: "Llama-3-70B OOM Stress Test",
    subtitle: "OOM on 24GB without QLoRA vs Clean Fit with NF4",
    description:
      "Demonstrates how 70B models instantly trigger Out-Of-Memory (>140GB needed in 16-bit) but compress to ~38GB with QLoRA NF4 and optimal sqrt(L) checkpointing.",
    architectureFamily: "70B Ultra-Scale LLM",
    config: {
      modelName: "Meta-Llama-3-70B",
      totalParamsB: 70.6,
      hiddenDim: 8192,
      intermediateDim: 28672,
      numLayers: 80,
      numAttentionHeads: 64,
      numKvHeads: 8,
      seqLength: 4096,
      batchSize: 2,
      rank: 16,
      alpha: 32,
      dropout: 0.05,
      basePrecision: "FP16",
      doubleQuantization: false,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "none",
      targetModules: ["q_proj", "v_proj"],
      optimizerType: "adamw_fp32",
      selectedGpuId: "rtx_4090",
    },
    highlights: [
      "Simulates Severe OOM (requires >160 GB in FP16)",
      "Turn on NF4 + Full Checkpointing to resolve OOM",
      "Illustrates VRAM breakdown across activations vs weights",
      "Full fine-tuning AdamW state alone is ~840 GB!",
    ],
  },

  vit_huge_lora: {
    id: "vit_huge_lora",
    name: "Vision Transformer ViT-H/14 LoRA",
    subtitle: "632M Vision Model Fine-Tuning on Edge Hardware",
    description:
      "Adaptation of high-resolution Vision Transformer patch projections and multi-head self-attention for high-accuracy downstream segmentation and classification.",
    architectureFamily: "Vision Transformer (ViT)",
    config: {
      modelName: "ViT-Huge-Patch14",
      totalParamsB: 0.632,
      hiddenDim: 1280,
      intermediateDim: 5120,
      numLayers: 32,
      numAttentionHeads: 16,
      numKvHeads: 16,
      seqLength: 1024,
      batchSize: 16,
      rank: 8,
      alpha: 16,
      dropout: 0.1,
      basePrecision: "FP16",
      doubleQuantization: false,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "sqrt",
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj"],
      optimizerType: "adamw_fp32",
      selectedGpuId: "tesla_t4",
    },
    highlights: [
      "Optimal Sqrt(L) segment checkpointing",
      "High batch size B=16 with 1K tokens",
      "Rank r=8 on self-attention heads",
      "Fits within 16GB T4 / 8GB RTX 4060",
    ],
  },

  edge_device_1_5b: {
    id: "edge_device_1_5b",
    name: "Edge Device 1.5B (8GB GPU Feasible)",
    subtitle: "Qwen-2.5-1.5B on RTX 4060 / Apple M3",
    description:
      "Ultra-compact fine-tuning configuration tailored for consumer edge GPUs with 8GB VRAM, utilizing QLoRA NF4 and Sqrt checkpointing with minimal latency impact.",
    architectureFamily: "Compact Edge LLM",
    config: {
      modelName: "Qwen-2.5-1.5B",
      totalParamsB: 1.54,
      hiddenDim: 1536,
      intermediateDim: 8960,
      numLayers: 28,
      numAttentionHeads: 12,
      numKvHeads: 2,
      seqLength: 2048,
      batchSize: 2,
      rank: 8,
      alpha: 16,
      dropout: 0.05,
      basePrecision: "NF4",
      doubleQuantization: true,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "sqrt",
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
      optimizerType: "adamw_8bit",
      selectedGpuId: "rtx_4060",
    },
    highlights: [
      "Entire VRAM budget under 3.5 GB",
      "Smooth execution on 8GB RTX 4060 / Apple Silicon",
      "Sqrt checkpointing balances VRAM and compute speed",
      "QLoRA double quantization achieves 0.95 GB base weight footprint",
    ],
  },

  custom: {
    id: "custom",
    name: "Custom Architecture Sandbox",
    subtitle: "Fully Configurable LoRA, QLoRA, and Memory Allocator",
    description:
      "Interactive research sandbox to test arbitrary parameter counts, rank configurations, activation checkpointing schemes, and multi-GPU VRAM feasibility.",
    architectureFamily: "User Defined Architecture",
    config: {
      modelName: "Custom-LLM",
      totalParamsB: 8.0,
      hiddenDim: 4096,
      intermediateDim: 14336,
      numLayers: 32,
      numAttentionHeads: 32,
      numKvHeads: 8,
      seqLength: 4096,
      batchSize: 4,
      rank: 16,
      alpha: 32,
      dropout: 0.05,
      basePrecision: "BF16",
      doubleQuantization: true,
      quantBlockSize1: 64,
      quantBlockSize2: 256,
      checkpointingMode: "full",
      targetModules: ["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
      optimizerType: "adamw_8bit",
      selectedGpuId: "rtx_4090",
    },
    highlights: [
      "Full parameter tuner with live memory breakdown",
      "Custom rank r, scaling alpha, and checkpointing mode",
      "Dynamic hardware feasibility calculator",
      "Live interactive training stepper",
    ],
  },
};

// ============================================================================
// 4. PURE MATHEMATICAL & ALGORITHMIC FUNCTIONS
// ============================================================================

/**
 * Quantizes an array of floating point values into 4-bit NormalFloat4 (NF4) representation
 * using block-wise normalization: c1 = max(|x|), mapped to nearest NF4 quantile.
 */
export function quantizeNF4(
  values: readonly number[],
  blockSize: number = 64,
): {
  readonly quantizedIndices: number[];
  readonly scales: number[];
  readonly blockSize: number;
} {
  const safeBlockSize = Math.max(1, blockSize);
  const quantizedIndices: number[] = [];
  const scales: number[] = [];
  const N = values.length;

  for (let bStart = 0; bStart < N; bStart += safeBlockSize) {
    const bEnd = Math.min(N, bStart + safeBlockSize);
    let maxAbs = 0;

    for (let i = bStart; i < bEnd; i++) {
      const absVal = Math.abs(values[i] ?? 0);
      if (absVal > maxAbs) maxAbs = absVal;
    }

    const scale = maxAbs === 0 ? 1.0 : maxAbs;
    scales.push(scale);

    for (let i = bStart; i < bEnd; i++) {
      const normalized = (values[i] ?? 0) / scale;
      // Find closest NF4 quantile index
      let bestIdx = 0;
      let minDiff = Infinity;

      for (let q = 0; q < NF4_QUANTILES.length; q++) {
        const diff = Math.abs((NF4_QUANTILES[q] ?? 0) - normalized);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = q;
        }
      }
      quantizedIndices.push(bestIdx);
    }
  }

  return {
    quantizedIndices,
    scales,
    blockSize: safeBlockSize,
  };
}

/**
 * Dequantizes 4-bit NF4 quantized indices back to floating point values:
 * x_hat = NF4_QUANTILES[idx] * scale
 */
export function dequantizeNF4(
  quantizedIndices: readonly number[],
  scales: readonly number[],
  blockSize: number = 64,
): number[] {
  const safeBlockSize = Math.max(1, blockSize);
  const result: number[] = [];
  const N = quantizedIndices.length;

  for (let i = 0; i < N; i++) {
    const blockIdx = Math.floor(i / safeBlockSize);
    const scale = scales[blockIdx] ?? 1.0;
    const qIdx = quantizedIndices[i] ?? 0;
    const qVal = NF4_QUANTILES[qIdx] ?? 0;
    result.push(qVal * scale);
  }

  return result;
}

/**
 * Calculates theoretical and empirical bits-per-parameter for QLoRA Double Quantization.
 * Stage 1: Block size B1 = 64 FP16 weights -> 4-bit NF4 + FP32 scale (0.5 bpp overhead).
 * Stage 2: Block size B2 = 256 first-stage FP32 scales quantized to FP8 + second-stage FP32 scale.
 * Double Quant total bpp = 4.0 + 8/64 + 32/(64 * 256) = 4.0 + 0.125 + 0.001953125 = 4.126953 bpp.
 */
export function computeDoubleQuantizationSavings(
  totalParams: number,
  block1Size: number = 64,
  block2Size: number = 256,
): {
  readonly naiveBpp: number;
  readonly doubleQuantBpp: number;
  readonly fp16Bpp: number;
  readonly bitSavingsBpp: number;
  readonly memoryReductionBytes: number;
  readonly memorySavingsPct: number;
} {
  const b1 = Math.max(1, block1Size);
  const b2 = Math.max(1, block2Size);

  const fp16Bpp = 16.0;
  const naiveBpp = 4.0 + 32.0 / b1; // e.g. 4.5 bpp for b1=64
  const doubleQuantBpp = 4.0 + 8.0 / b1 + 32.0 / (b1 * b2); // 4.126953 bpp for 64, 256
  const bitSavingsBpp = naiveBpp - doubleQuantBpp;

  const naiveBytes = (totalParams * naiveBpp) / 8;
  const dqBytes = (totalParams * doubleQuantBpp) / 8;
  const memoryReductionBytes = Math.max(0, naiveBytes - dqBytes);
  const memorySavingsPct = naiveBytes > 0 ? (memoryReductionBytes / naiveBytes) * 100 : 0;

  return {
    naiveBpp,
    doubleQuantBpp,
    fp16Bpp,
    bitSavingsBpp,
    memoryReductionBytes,
    memorySavingsPct,
  };
}

/**
 * Computes quantization error metrics: MSE, SNR (dB), and Cosine Similarity
 */
export function computeQuantizationMetrics(
  original: readonly number[],
  reconstructed: readonly number[],
): {
  readonly mse: number;
  readonly snrDb: number;
  readonly cosineSimilarity: number;
  readonly maxAbsError: number;
} {
  const N = Math.min(original.length, reconstructed.length);
  if (N === 0) {
    return { mse: 0, snrDb: 100, cosineSimilarity: 1.0, maxAbsError: 0 };
  }

  let sumSqErr = 0;
  let sumSqOrig = 0;
  let sumSqRecon = 0;
  let dotProduct = 0;
  let maxAbsError = 0;

  for (let i = 0; i < N; i++) {
    const o = original[i] ?? 0;
    const r = reconstructed[i] ?? 0;
    const err = o - r;
    const absErr = Math.abs(err);

    sumSqErr += err * err;
    sumSqOrig += o * o;
    sumSqRecon += r * r;
    dotProduct += o * r;
    if (absErr > maxAbsError) maxAbsError = absErr;
  }

  const mse = sumSqErr / N;
  const snrDb = sumSqErr < 1e-12 ? 100 : 10 * Math.log10((sumSqOrig + 1e-12) / (sumSqErr + 1e-12));

  const denom = Math.sqrt(sumSqOrig) * Math.sqrt(sumSqRecon);
  const cosineSimilarity = denom < 1e-12 ? 1.0 : Math.max(-1.0, Math.min(1.0, dotProduct / denom));

  return {
    mse,
    snrDb: Math.round(snrDb * 100) / 100,
    cosineSimilarity: Math.round(cosineSimilarity * 10000) / 10000,
    maxAbsError: Math.round(maxAbsError * 10000) / 10000,
  };
}

/**
 * Computes LoRA low-rank parameter count and reduction ratio:
 * Base: d_in * d_out
 * LoRA: r * (d_in + d_out)
 */
export function computeLoRAParameters(
  inDim: number,
  outDim: number,
  rank: number,
  targetModulesCount: number = 7,
): {
  readonly baseParamsPerModule: number;
  readonly loraParamsPerModule: number;
  readonly totalBaseParams: number;
  readonly totalLoRAParams: number;
  readonly paramReductionPct: number;
  readonly scalingFactor: number;
} {
  const safeIn = Math.max(1, inDim);
  const safeOut = Math.max(1, outDim);
  const safeRank = Math.max(1, rank);
  const safeModules = Math.max(1, targetModulesCount);

  const baseParamsPerModule = safeIn * safeOut;
  const loraParamsPerModule = safeRank * (safeIn + safeOut);
  const totalBaseParams = baseParamsPerModule * safeModules;
  const totalLoRAParams = loraParamsPerModule * safeModules;

  const paramReductionPct = totalBaseParams > 0 ? (1 - totalLoRAParams / totalBaseParams) * 100 : 0;

  return {
    baseParamsPerModule,
    loraParamsPerModule,
    totalBaseParams,
    totalLoRAParams,
    paramReductionPct: Math.round(paramReductionPct * 100) / 100,
    scalingFactor: 1.0, // alpha / r
  };
}

/**
 * Deterministically generates synthetic matrices for visualizer:
 * W0 (dOut x dIn), A (rank x dIn), B (dOut x rank), DeltaW = (alpha/r) * B * A, W_merged = W0 + DeltaW
 */
export function generateLoRAMatrices(
  dOut: number,
  dIn: number,
  rank: number,
  alpha: number,
  seed: number = 42,
): {
  readonly w0: number[][];
  readonly a: number[][];
  readonly b: number[][];
  readonly deltaW: number[][];
  readonly wMerged: number[][];
  readonly frobeniusNormW0: number;
  readonly frobeniusNormDeltaW: number;
  readonly frobeniusNormMerged: number;
  readonly perturbationRatio: number;
} {
  const safeDOut = Math.min(16, Math.max(2, dOut));
  const safeDIn = Math.min(16, Math.max(2, dIn));
  const safeRank = Math.min(safeDIn, Math.max(1, rank));
  const scale = alpha / safeRank;

  // Pseudo-random deterministic generator
  let state = seed;
  const pseudoRandom = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  // Generate W0 ~ N(0, 0.5)
  const w0: number[][] = [];
  let sumSqW0 = 0;
  for (let i = 0; i < safeDOut; i++) {
    const row: number[] = [];
    for (let j = 0; j < safeDIn; j++) {
      const u1 = Math.max(1e-7, pseudoRandom());
      const u2 = pseudoRandom();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const val = Math.round(z * 0.45 * 100) / 100;
      row.push(val);
      sumSqW0 += val * val;
    }
    w0.push(row);
  }

  // Generate A ~ N(0, 1/sqrt(rank)) (Kaiming uniform/normal init)
  const a: number[][] = [];
  const stdA = 1.0 / Math.sqrt(safeRank);
  for (let r = 0; r < safeRank; r++) {
    const row: number[] = [];
    for (let j = 0; j < safeDIn; j++) {
      const u1 = Math.max(1e-7, pseudoRandom());
      const u2 = pseudoRandom();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const val = Math.round(z * stdA * 0.5 * 100) / 100;
      row.push(val);
    }
    a.push(row);
  }

  // Generate B (trained representation for visualization, small nonzero weights)
  const b: number[][] = [];
  for (let i = 0; i < safeDOut; i++) {
    const row: number[] = [];
    for (let r = 0; r < safeRank; r++) {
      const u1 = Math.max(1e-7, pseudoRandom());
      const u2 = pseudoRandom();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const val = Math.round(z * 0.35 * 100) / 100;
      row.push(val);
    }
    b.push(row);
  }

  // Compute DeltaW = scale * (B * A)
  const deltaW: number[][] = [];
  let sumSqDeltaW = 0;
  for (let i = 0; i < safeDOut; i++) {
    const row: number[] = [];
    for (let j = 0; j < safeDIn; j++) {
      let dot = 0;
      for (let r = 0; r < safeRank; r++) {
        dot += (b[i]?.[r] ?? 0) * (a[r]?.[j] ?? 0);
      }
      const val = Math.round(scale * dot * 100) / 100;
      row.push(val);
      sumSqDeltaW += val * val;
    }
    deltaW.push(row);
  }

  // Compute W_merged = W0 + DeltaW
  const wMerged: number[][] = [];
  let sumSqMerged = 0;
  for (let i = 0; i < safeDOut; i++) {
    const row: number[] = [];
    for (let j = 0; j < safeDIn; j++) {
      const val = Math.round(((w0[i]?.[j] ?? 0) + (deltaW[i]?.[j] ?? 0)) * 100) / 100;
      row.push(val);
      sumSqMerged += val * val;
    }
    wMerged.push(row);
  }

  const frobeniusNormW0 = Math.round(Math.sqrt(sumSqW0) * 100) / 100;
  const frobeniusNormDeltaW = Math.round(Math.sqrt(sumSqDeltaW) * 100) / 100;
  const frobeniusNormMerged = Math.round(Math.sqrt(sumSqMerged) * 100) / 100;
  const perturbationRatio =
    frobeniusNormW0 > 0 ? Math.round((frobeniusNormDeltaW / frobeniusNormW0) * 1000) / 10 : 0;

  return {
    w0,
    a,
    b,
    deltaW,
    wMerged,
    frobeniusNormW0,
    frobeniusNormDeltaW,
    frobeniusNormMerged,
    perturbationRatio,
  };
}

/**
 * Computes SVD Singular Value Spectrum using Power Iteration with Hotelling Deflation on C = M * M^T.
 * Returns singular values, cumulative energy ratio, and effective rank thresholds.
 */
export function computeSVDSpectrum(
  matrix: readonly (readonly number[])[],
  topK: number = 8,
): SVDSpectrumResult {
  const m = matrix.length;
  if (m === 0) {
    return {
      singularValues: [],
      energyCumulative: [],
      effectiveRank90: 0,
      effectiveRank99: 0,
      totalEnergy: 0,
    };
  }
  const n = matrix[0]?.length ?? 0;
  if (n === 0) {
    return {
      singularValues: [],
      energyCumulative: [],
      effectiveRank90: 0,
      effectiveRank99: 0,
      totalEnergy: 0,
    };
  }

  const maxK = Math.min(topK, Math.min(m, n));

  // Compute Covariance C = M * M^T (m x m)
  const C: number[][] = Array.from({ length: m }, () => Array.from({ length: m }, () => 0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += (matrix[i]?.[k] ?? 0) * (matrix[j]?.[k] ?? 0);
      }
      C[i]![j] = sum;
    }
  }

  const singularValues: number[] = [];
  const currentC = C.map((r) => [...r]);

  for (let k = 0; k < maxK; k++) {
    // Power iteration vector
    let v: number[] = Array.from({ length: m }, (_, idx) => 1.0 / Math.sqrt(m) + idx * 0.01);
    let normV = Math.sqrt(v.reduce((acc, val) => acc + val * val, 0));
    v = v.map((x) => x / (normV || 1));

    for (let iter = 0; iter < 30; iter++) {
      const nextV: number[] = Array.from({ length: m }, () => 0);
      for (let i = 0; i < m; i++) {
        let sum = 0;
        for (let j = 0; j < m; j++) {
          sum += (currentC[i]?.[j] ?? 0) * (v[j] ?? 0);
        }
        nextV[i] = sum;
      }
      normV = Math.sqrt(nextV.reduce((acc, val) => acc + val * val, 0));
      if (normV < 1e-12) break;
      v = nextV.map((x) => x / normV);
    }

    // Rayleigh quotient eigenvalue lambda = v^T C v
    let lambda = 0;
    for (let i = 0; i < m; i++) {
      let cv_i = 0;
      for (let j = 0; j < m; j++) {
        cv_i += (currentC[i]?.[j] ?? 0) * (v[j] ?? 0);
      }
      lambda += (v[i] ?? 0) * cv_i;
    }

    const sigma = Math.sqrt(Math.max(0, lambda));
    singularValues.push(Math.round(sigma * 100) / 100);

    // Deflate: C = C - lambda * v * v^T
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        currentC[i]![j] -= lambda * (v[i] ?? 0) * (v[j] ?? 0);
      }
    }
  }

  // Sort descending
  singularValues.sort((a, b) => b - a);

  // Cumulative energy calculation: E(k) = sum(sigma_1..k^2) / sum(sigma_all^2)
  const totalEnergy = singularValues.reduce((acc, val) => acc + val * val, 0) || 1;
  let runningSum = 0;
  const energyCumulative: number[] = [];
  let effectiveRank90 = singularValues.length;
  let effectiveRank99 = singularValues.length;

  for (let k = 0; k < singularValues.length; k++) {
    const s = singularValues[k] ?? 0;
    runningSum += s * s;
    const ratio = Math.round((runningSum / totalEnergy) * 1000) / 10;
    energyCumulative.push(Math.min(100, ratio));

    if (ratio >= 90 && effectiveRank90 === singularValues.length) {
      effectiveRank90 = k + 1;
    }
    if (ratio >= 99 && effectiveRank99 === singularValues.length) {
      effectiveRank99 = k + 1;
    }
  }

  return {
    singularValues,
    energyCumulative,
    effectiveRank90,
    effectiveRank99,
    totalEnergy: Math.round(totalEnergy * 100) / 100,
  };
}

/**
 * Detailed VRAM Memory Allocator Calculator for Full vs LoRA vs QLoRA fine-tuning.
 */
export function computeFullVsLoRAMemoryBreakdown(config: LoRAStudioConfig): MemoryBreakdown {
  const GB = 1024 * 1024 * 1024;
  const N_base = config.totalParamsB * 1e9;

  // 1. Base Weights Footprint (GB)
  let bytesPerParam = 2.0; // Default FP16/BF16
  let bpp = 16.0;

  if (config.basePrecision === "FP32") {
    bytesPerParam = 4.0;
    bpp = 32.0;
  } else if (config.basePrecision === "INT8") {
    bytesPerParam = 1.0;
    bpp = 8.0;
  } else if (config.basePrecision === "NF4") {
    if (config.doubleQuantization) {
      const dq = computeDoubleQuantizationSavings(
        N_base,
        config.quantBlockSize1,
        config.quantBlockSize2,
      );
      bpp = dq.doubleQuantBpp;
      bytesPerParam = bpp / 8.0;
    } else {
      bpp = 4.0 + 32.0 / config.quantBlockSize1;
      bytesPerParam = bpp / 8.0;
    }
  } else if (config.basePrecision === "INT4") {
    bytesPerParam = 0.5;
    bpp = 4.0;
  }

  const baseWeightsGb = (N_base * bytesPerParam) / GB;

  // 2. LoRA Adapter Parameters Count
  // Modules per layer: attention (q, k, v, o) + MLP (gate, up, down)
  const H = config.hiddenDim;
  const I = config.intermediateDim;
  const r = config.rank;
  const L = config.numLayers;

  let loraParamsPerLayer = 0;
  const targets = new Set(config.targetModules);

  if (targets.has("q_proj")) loraParamsPerLayer += r * (H + H);
  if (targets.has("k_proj"))
    loraParamsPerLayer += r * (H + Math.round((H * config.numKvHeads) / config.numAttentionHeads));
  if (targets.has("v_proj"))
    loraParamsPerLayer += r * (H + Math.round((H * config.numKvHeads) / config.numAttentionHeads));
  if (targets.has("o_proj")) loraParamsPerLayer += r * (H + H);
  if (targets.has("gate_proj")) loraParamsPerLayer += r * (H + I);
  if (targets.has("up_proj")) loraParamsPerLayer += r * (H + I);
  if (targets.has("down_proj")) loraParamsPerLayer += r * (I + H);

  const loraParamsCount = loraParamsPerLayer * L;
  const paramReductionPct = N_base > 0 ? (1 - loraParamsCount / N_base) * 100 : 0;

  // LoRA Adapter Weights Memory (FP16/BF16: 2 bytes per param)
  const loraAdaptersGb = (loraParamsCount * 2.0) / GB;

  // 3. Gradients Footprint (Only trainable parameters have gradients!)
  const trainableParams = loraParamsCount;
  const gradientsGb = (trainableParams * 2.0) / GB; // FP16 gradients

  // 4. Optimizer States Footprint
  // AdamW stores 1st moment (m) + 2nd moment (v) in FP32 (8 bytes) + Master FP32 weights (4 bytes)
  let optimizerBytesPerParam = 8.0;
  if (config.optimizerType === "adamw_fp32") {
    optimizerBytesPerParam = 8.0;
  } else if (config.optimizerType === "adamw_8bit" || config.optimizerType === "paged_adamw") {
    optimizerBytesPerParam = 2.0; // 8-bit quantized states
  } else if (config.optimizerType === "sgd") {
    optimizerBytesPerParam = 4.0;
  }

  const optimizerStatesGb = (trainableParams * optimizerBytesPerParam) / GB;

  // 5. Peak Activation Memory (Transformers FlashAttention & Checkpointing Model)
  const B = config.batchSize;
  const S = config.seqLength;

  const bytesPerAct = 2.0; // FP16
  const boundaryTensorBytes = B * S * H * bytesPerAct; // Layer input hidden state
  const layerIntermediateBytes = B * S * H * 6.0 * bytesPerAct; // Layer intra-block Peak
  const actPerLayerNoCkptBytes = B * S * H * 16.0 * bytesPerAct; // Full activations retained

  let peakActivationsBytes = 0;
  if (config.checkpointingMode === "none") {
    peakActivationsBytes = L * actPerLayerNoCkptBytes;
  } else if (config.checkpointingMode === "full") {
    peakActivationsBytes = L * boundaryTensorBytes + layerIntermediateBytes;
  } else if (config.checkpointingMode === "sqrt") {
    const sqrtL = Math.ceil(Math.sqrt(L));
    peakActivationsBytes = sqrtL * boundaryTensorBytes + sqrtL * layerIntermediateBytes;
  } else if (config.checkpointingMode === "selective") {
    // Recomputes attention softmax/MLP, stores boundary
    peakActivationsBytes = 0.3 * (L * actPerLayerNoCkptBytes) + L * boundaryTensorBytes;
  }

  const peakActivationsGb = peakActivationsBytes / GB;

  // 6. KV Cache Footprint (during forward pass with GQA)
  const kvHeadsRatio = config.numKvHeads / config.numAttentionHeads;
  const kvCacheBytes = L * B * S * H * kvHeadsRatio * bytesPerAct * 0.5;
  const kvCacheGb = kvCacheBytes / GB;

  // 7. CUDA Context & Driver Overhead
  const cudaContextGb = 1.25;

  // Total LoRA VRAM
  const totalVramGb =
    baseWeightsGb +
    loraAdaptersGb +
    gradientsGb +
    optimizerStatesGb +
    peakActivationsGb +
    kvCacheGb +
    cudaContextGb;

  // Full Fine-Tuning Comparison VRAM (Base in FP16, Gradients on all params, FP32 AdamW on all params, No Checkpoint)
  const fullBaseWeightsGb = (N_base * 2.0) / GB;
  const fullGradientsGb = (N_base * 2.0) / GB;
  const fullOptimizerGb = (N_base * 12.0) / GB; // 8B moments + 4B master weights
  const fullActivationsGb = (L * actPerLayerNoCkptBytes) / GB;
  const fullFineTuningVramGb =
    fullBaseWeightsGb +
    fullGradientsGb +
    fullOptimizerGb +
    fullActivationsGb +
    kvCacheGb +
    cudaContextGb;

  const vramSavingsPct =
    fullFineTuningVramGb > 0 ? Math.max(0, (1 - totalVramGb / fullFineTuningVramGb) * 100) : 0;

  const breakdownItems: MemoryBreakdownItem[] = [
    {
      name: "Base Model Weights",
      sizeGb: Math.round(baseWeightsGb * 100) / 100,
      color: "#38bdf8", // sky-400
      pct: Math.round((baseWeightsGb / totalVramGb) * 1000) / 10,
    },
    {
      name: "LoRA Adapters",
      sizeGb: Math.round(loraAdaptersGb * 1000) / 1000,
      color: "#a855f7", // purple-500
      pct: Math.round((loraAdaptersGb / totalVramGb) * 1000) / 10,
    },
    {
      name: "Gradients",
      sizeGb: Math.round(gradientsGb * 1000) / 1000,
      color: "#f43f5e", // rose-500
      pct: Math.round((gradientsGb / totalVramGb) * 1000) / 10,
    },
    {
      name: "Optimizer States",
      sizeGb: Math.round(optimizerStatesGb * 1000) / 1000,
      color: "#eab308", // yellow-500
      pct: Math.round((optimizerStatesGb / totalVramGb) * 1000) / 10,
    },
    {
      name: "Peak Activations",
      sizeGb: Math.round(peakActivationsGb * 100) / 100,
      color: "#10b981", // emerald-500
      pct: Math.round((peakActivationsGb / totalVramGb) * 1000) / 10,
    },
    {
      name: "KV Cache & Context",
      sizeGb: Math.round((kvCacheGb + cudaContextGb) * 100) / 100,
      color: "#64748b", // slate-500
      pct: Math.round(((kvCacheGb + cudaContextGb) / totalVramGb) * 1000) / 10,
    },
  ];

  return {
    baseWeightsGb: Math.round(baseWeightsGb * 100) / 100,
    baseWeightsBpp: Math.round(bpp * 1000) / 1000,
    loraAdaptersGb: Math.round(loraAdaptersGb * 1000) / 1000,
    loraParamsCount,
    baseParamsCount: N_base,
    paramReductionPct: Math.round(paramReductionPct * 100) / 100,
    gradientsGb: Math.round(gradientsGb * 1000) / 1000,
    optimizerStatesGb: Math.round(optimizerStatesGb * 1000) / 1000,
    peakActivationsGb: Math.round(peakActivationsGb * 100) / 100,
    kvCacheGb: Math.round(kvCacheGb * 100) / 100,
    cudaContextGb: Math.round(cudaContextGb * 100) / 100,
    totalVramGb: Math.round(totalVramGb * 100) / 100,
    fullFineTuningVramGb: Math.round(fullFineTuningVramGb * 100) / 100,
    vramSavingsPct: Math.round(vramSavingsPct * 10) / 10,
    breakdownItems,
  };
}

/**
 * Evaluates activation checkpointing memory and FLOPs overhead tradeoffs across modes.
 */
export function computeCheckpointingTradeoffs(
  numLayers: number,
  batchSize: number,
  seqLen: number,
  hiddenDim: number,
  mode: CheckpointingMode,
): CheckpointingTradeoff {
  const MB = 1024 * 1024;
  const L = Math.max(1, numLayers);
  const B = Math.max(1, batchSize);
  const S = Math.max(1, seqLen);
  const H = Math.max(1, hiddenDim);

  const bytesPerAct = 2.0;
  const boundaryTensorBytes = B * S * H * bytesPerAct;
  const layerIntermediateBytes = B * S * H * 6.0 * bytesPerAct;
  const actPerLayerNoCkptBytes = B * S * H * 16.0 * bytesPerAct;

  let peakActivationMemoryMb = 0;
  let storedActivationTensors = 0;
  let recomputationFlopsRatio = 0.0;
  let speedPenaltyPct = 0.0;
  let summary = "";

  if (mode === "none") {
    peakActivationMemoryMb = (L * actPerLayerNoCkptBytes) / MB;
    storedActivationTensors = L * 12;
    recomputationFlopsRatio = 0.0;
    speedPenaltyPct = 0.0;
    summary =
      "Stores all intermediate layer activations during forward pass. O(L) memory, 0% FLOPs recompute overhead.";
  } else if (mode === "full") {
    peakActivationMemoryMb = (L * boundaryTensorBytes + layerIntermediateBytes) / MB;
    storedActivationTensors = L;
    recomputationFlopsRatio = 0.3333; // +33.3% FLOPs (1 extra forward pass per layer)
    speedPenaltyPct = 25.0; // ~25% slower wall-clock time
    summary =
      "Only stores layer boundary tensors. Recomputes forward pass layer-by-layer during backprop. Reduces activations up to 90% at +33.3% compute cost.";
  } else if (mode === "sqrt") {
    const sqrtL = Math.ceil(Math.sqrt(L));
    peakActivationMemoryMb = (sqrtL * boundaryTensorBytes + sqrtL * layerIntermediateBytes) / MB;
    storedActivationTensors = sqrtL * 4;
    recomputationFlopsRatio = 0.3333;
    speedPenaltyPct = 22.0;
    summary =
      "Optimal Griewank/Chen sqrt(L) segment checkpointing. Memory scales as O(sqrt(L)), providing ideal balance for medium-depth networks.";
  } else if (mode === "selective") {
    peakActivationMemoryMb = (0.3 * (L * actPerLayerNoCkptBytes) + L * boundaryTensorBytes) / MB;
    storedActivationTensors = L * 3;
    recomputationFlopsRatio = 0.15;
    speedPenaltyPct = 10.0;
    summary =
      "Selectively checkpoints memory-heavy attention QK^T and Softmax while keeping low-cost RMSNorm/GeLU in memory. Saves ~65% activation VRAM at only +15% FLOPs.";
  }

  return {
    mode,
    peakActivationMemoryMb: Math.round(peakActivationMemoryMb),
    storedActivationTensors,
    recomputationFlopsRatio: Math.round(recomputationFlopsRatio * 1000) / 1000,
    boundaryMemoryMb: Math.round((boundaryTensorBytes / MB) * 10) / 10,
    layerPeakMemoryMb: Math.round((actPerLayerNoCkptBytes / MB) * 10) / 10,
    speedPenaltyPct,
    summary,
  };
}

/**
 * Evaluates GPU hardware compatibility across all known GPUs.
 */
export function evaluateGpuHardwareFit(totalVramRequiredGb: number): HardwareFitEvaluation[] {
  return GPU_HARDWARE_SPECS.map((gpu) => {
    const utilization = (totalVramRequiredGb / gpu.vramGb) * 100;
    let status: HardwareStatus = "safe";
    let recommendation = "Optimal execution. Ample VRAM headroom for larger batch sizes.";

    if (utilization > 100) {
      status = "impossible";
      const deficit = (totalVramRequiredGb - gpu.vramGb).toFixed(1);
      recommendation = `CUDA Out Of Memory! Exceeds capacity by ${deficit} GB. Enable QLoRA NF4 or Full Checkpointing.`;
    } else if (utilization > 92) {
      status = "oom_danger";
      recommendation =
        "Severe OOM Risk! Memory headroom < 8%. Spikes during gradient accumulation may crash training.";
    } else if (utilization > 75) {
      status = "tight";
      recommendation = "Tight fit. Feasible but limit batch size and monitor KV cache spikes.";
    }

    const vramHeadroomGb = Math.max(0, gpu.vramGb - totalVramRequiredGb);

    // Calculate maximum batch size feasible
    // Rough linear activation scaling: maxBatch = floor(B * (vramGb - fixed) / act)
    const fixedMemory = Math.min(gpu.vramGb * 0.7, totalVramRequiredGb * 0.6);
    const variablePerBatch = Math.max(0.1, (totalVramRequiredGb - fixedMemory) / 4);
    const maxBatchSize = Math.max(
      1,
      Math.floor((gpu.vramGb - fixedMemory) / (variablePerBatch || 1)),
    );

    return {
      gpu,
      status,
      utilizationPct: Math.round(utilization * 10) / 10,
      totalVramRequiredGb: Math.round(totalVramRequiredGb * 100) / 100,
      vramHeadroomGb: Math.round(vramHeadroomGb * 100) / 100,
      maxBatchSize: status === "impossible" ? 0 : Math.min(128, maxBatchSize),
      recommendation,
    };
  });
}

/**
 * Simulates a single LoRA forward-backward step for unit testing and interactive validation:
 * Forward: Y = X * W0^T + (alpha / r) * (X * A^T) * B^T
 * Backward: dB = (alpha / r) * dY^T * H, dA = (alpha / r) * (B^T * dY^T) * X
 */
export function simulateLoRAForwardBackwardStep(
  x: readonly number[], // input vector of dim dIn
  w0: readonly (readonly number[])[], // dOut x dIn
  a: readonly (readonly number[])[], // rank x dIn
  b: readonly (readonly number[])[], // dOut x rank
  alpha: number,
  rank: number,
  targetLossGrad?: readonly number[], // upstream dY of dim dOut
): {
  readonly output: number[];
  readonly deltaOutput: number[];
  readonly intermediateH: number[];
  readonly gradB: number[][];
  readonly gradA: number[][];
  readonly gradX: number[];
  readonly lossEstimate: number;
} {
  const dOut = w0.length;
  const dIn = x.length;
  const r = Math.max(1, rank);
  const scale = alpha / r;

  // 1. Forward Base: Y0 = W0 * x
  const y0: number[] = [];
  for (let i = 0; i < dOut; i++) {
    let sum = 0;
    for (let j = 0; j < dIn; j++) {
      sum += (w0[i]?.[j] ?? 0) * (x[j] ?? 0);
    }
    y0.push(sum);
  }

  // 2. Forward LoRA Down-proj: H = A * x (dim r)
  const intermediateH: number[] = [];
  for (let k = 0; k < r; k++) {
    let sum = 0;
    for (let j = 0; j < dIn; j++) {
      sum += (a[k]?.[j] ?? 0) * (x[j] ?? 0);
    }
    intermediateH.push(sum);
  }

  // 3. Forward LoRA Up-proj: DeltaY = scale * (B * H)
  const deltaOutput: number[] = [];
  const output: number[] = [];
  for (let i = 0; i < dOut; i++) {
    let sum = 0;
    for (let k = 0; k < r; k++) {
      sum += (b[i]?.[k] ?? 0) * (intermediateH[k] ?? 0);
    }
    const deltaVal = scale * sum;
    deltaOutput.push(deltaVal);
    output.push((y0[i] ?? 0) + deltaVal);
  }

  // 4. Loss Gradient (default to MSE w.r.t zero target or provided dY)
  const dY: number[] =
    targetLossGrad && targetLossGrad.length === dOut
      ? [...targetLossGrad]
      : output.map((v) => v * 0.5);

  let lossEstimate = 0;
  for (let i = 0; i < dOut; i++) {
    lossEstimate += (dY[i] ?? 0) * (dY[i] ?? 0);
  }

  // 5. Backward Gradient w.r.t B: dB = scale * (dY * H^T) (dOut x r)
  const gradB: number[][] = [];
  for (let i = 0; i < dOut; i++) {
    const row: number[] = [];
    for (let k = 0; k < r; k++) {
      row.push(scale * (dY[i] ?? 0) * (intermediateH[k] ?? 0));
    }
    gradB.push(row);
  }

  // 6. Backward Gradient w.r.t H: dH = scale * (B^T * dY) (dim r)
  const dH: number[] = [];
  for (let k = 0; k < r; k++) {
    let sum = 0;
    for (let i = 0; i < dOut; i++) {
      sum += (b[i]?.[k] ?? 0) * (dY[i] ?? 0);
    }
    dH.push(scale * sum);
  }

  // 7. Backward Gradient w.r.t A: dA = dH * x^T (r x dIn)
  const gradA: number[][] = [];
  for (let k = 0; k < r; k++) {
    const row: number[] = [];
    for (let j = 0; j < dIn; j++) {
      row.push((dH[k] ?? 0) * (x[j] ?? 0));
    }
    gradA.push(row);
  }

  // 8. Backward Gradient w.r.t X: dX = W0^T * dY + A^T * dH
  const gradX: number[] = [];
  for (let j = 0; j < dIn; j++) {
    let sumW0 = 0;
    for (let i = 0; i < dOut; i++) {
      sumW0 += (w0[i]?.[j] ?? 0) * (dY[i] ?? 0);
    }
    let sumA = 0;
    for (let k = 0; k < r; k++) {
      sumA += (a[k]?.[j] ?? 0) * (dH[k] ?? 0);
    }
    gradX.push(sumW0 + sumA);
  }

  return {
    output,
    deltaOutput,
    intermediateH,
    gradB,
    gradA,
    gradX,
    lossEstimate: Math.round(lossEstimate * 1000) / 1000,
  };
}

/**
 * Generates discrete step sequence for the Training Pipeline Simulator
 */
export function generateTrainingPipelineSteps(
  numLayers: number,
  checkpointingMode: CheckpointingMode,
  baseVramGb: number,
  loraRank: number,
): readonly TrainingPipelineStep[] {
  const L = Math.min(8, Math.max(2, numLayers)); // Simulates up to 8 representative layers
  const steps: TrainingPipelineStep[] = [];
  let stepIdx = 0;
  let vramCurrent = baseVramGb;
  let flopsAcc = 0;

  // --- Phase 1: Forward Pass ---
  for (let l = 1; l <= L; l++) {
    stepIdx++;
    const isCkpt = checkpointingMode === "full" || (checkpointingMode === "sqrt" && l % 2 === 1);
    const actDelta = isCkpt ? 0.15 : 0.45;
    vramCurrent += actDelta;
    flopsAcc += 12.5;

    steps.push({
      id: `fwd_layer_${l}`,
      stepNumber: stepIdx,
      phase: isCkpt ? "checkpoint" : "forward",
      layerIndex: l,
      title: `Forward Pass — Layer ${l}/${L}`,
      description: isCkpt
        ? `Layer ${l} input stored to checkpoint boundary buffer. Intermediate tensors discarded.`
        : `Computed self-attention & MLP. Activations retained in VRAM for backward pass.`,
      formula: `h_{${l}} = \\text{LayerNorm}(h_{${l - 1}} + \\text{LoRA-Attn}(h_{${l - 1}}))`,
      vramCurrentGb: Math.round(vramCurrent * 100) / 100,
      flopsAccumulatedGFlops: Math.round(flopsAcc * 10) / 10,
      activeTensor: `Activation Tensor h_${l}`,
      isCheckpointStored: isCkpt,
      isRecomputed: false,
    });
  }

  // --- Phase 2: Loss Computation ---
  stepIdx++;
  flopsAcc += 2.0;
  steps.push({
    id: "loss_computation",
    stepNumber: stepIdx,
    phase: "loss",
    layerIndex: L,
    title: "Loss Calculation & Backward Seed",
    description: "Evaluated cross-entropy loss. Seeded upstream gradient dL/dh_L.",
    formula:
      "\\mathcal{L} = -\\sum y \\log(\\hat{y}), \\quad \\nabla_{h_L} \\mathcal{L} = \\hat{y} - y",
    vramCurrentGb: Math.round(vramCurrent * 100) / 100,
    flopsAccumulatedGFlops: Math.round(flopsAcc * 10) / 10,
    activeTensor: "dL / dh_L",
    isCheckpointStored: false,
    isRecomputed: false,
  });

  // --- Phase 3: Backward & Recompute Pass ---
  for (let l = L; l >= 1; l--) {
    const isCkpt = checkpointingMode === "full" || (checkpointingMode === "sqrt" && l % 2 === 1);

    if (isCkpt) {
      // Recomputation Step
      stepIdx++;
      flopsAcc += 12.5; // +1 extra forward pass
      steps.push({
        id: `recompute_layer_${l}`,
        stepNumber: stepIdx,
        phase: "recompute",
        layerIndex: l,
        title: `Recompute Layer ${l} Forward`,
        description: `Activation checkpoint triggered: Recomputing forward activations of Layer ${l} from stored boundary.`,
        formula: `h_{${l}}^{\\text{recomputed}} = \\text{ForwardBlock}(h_{${l - 1}}^{\\text{stored}})`,
        vramCurrentGb: Math.round((vramCurrent + 0.35) * 100) / 100,
        flopsAccumulatedGFlops: Math.round(flopsAcc * 10) / 10,
        activeTensor: `Recomputed Act_${l}`,
        isCheckpointStored: false,
        isRecomputed: true,
      });
    }

    // LoRA Gradient Accumulation Step
    stepIdx++;
    vramCurrent = Math.max(baseVramGb + 0.2, vramCurrent - 0.3);
    flopsAcc += 25.0; // Backward pass is 2x forward FLOPs
    steps.push({
      id: `bwd_lora_layer_${l}`,
      stepNumber: stepIdx,
      phase: "lora_grad",
      layerIndex: l,
      title: `LoRA Gradient Step — Layer ${l}`,
      description: `Computed low-rank gradients: dB = s * dY * H^T and dA = dH * X^T for rank r=${loraRank}. Base weights W0 remain frozen.`,
      formula: `\\nabla_B = \\frac{\\alpha}{r} dY \\cdot (X A^T)^T, \\quad \\nabla_A = \\frac{\\alpha}{r} (B^T dY) \\cdot X^T`,
      vramCurrentGb: Math.round(vramCurrent * 100) / 100,
      flopsAccumulatedGFlops: Math.round(flopsAcc * 10) / 10,
      activeTensor: `Grads dA_${l}, dB_${l}`,
      isCheckpointStored: false,
      isRecomputed: false,
    });
  }

  // --- Phase 4: Optimizer Update ---
  stepIdx++;
  flopsAcc += 5.0;
  steps.push({
    id: "optimizer_step",
    stepNumber: stepIdx,
    phase: "optimizer",
    layerIndex: 0,
    title: "AdamW LoRA Optimizer Step",
    description:
      "Applied first & second moment updates to adapter matrices A and B with weight decay.",
    formula:
      "A_{t+1} = A_t - \\eta \\frac{\\hat{m}_A}{\\sqrt{\\hat{v}_A} + \\epsilon}, \\quad B_{t+1} = B_t - \\eta \\frac{\\hat{m}_B}{\\sqrt{\\hat{v}_B} + \\epsilon}",
    vramCurrentGb: Math.round(baseVramGb * 100) / 100,
    flopsAccumulatedGFlops: Math.round(flopsAcc * 10) / 10,
    activeTensor: "Updated LoRA Adapters",
    isCheckpointStored: false,
    isRecomputed: false,
  });

  return steps;
}

// ============================================================================
// 5. MAIN REACT COMPONENT
// ============================================================================

export const LoRAGradientCheckpointingStudio: React.FC<LoRAStudioProps> = ({
  initialPreset = "llama3_8b_lora",
  initialConfig,
  width = "100%",
  height = "auto",
  standalone = true,
  onPresetChange,
  onTabChange,
}) => {
  // Preset state
  const [selectedPresetId, setSelectedPresetId] = useState<LoRAPresetId>(initialPreset);
  const activePreset = LORA_STUDIO_PRESETS[selectedPresetId] ?? LORA_STUDIO_PRESETS.llama3_8b_lora;

  // Active Tab
  const [activeTab, setActiveTab] = useState<LoRAStudioTabId>("lora_matrix");

  // Config State
  const [config, setConfig] = useState<LoRAStudioConfig>(() => ({
    ...activePreset.config,
    ...initialConfig,
  }));

  // Drawer toggle
  const [showTunerDrawer, setShowTunerDrawer] = useState<boolean>(false);

  // Stepper state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Switch Preset Handler
  const handlePresetSelect = useCallback(
    (presetId: LoRAPresetId) => {
      setSelectedPresetId(presetId);
      const preset = LORA_STUDIO_PRESETS[presetId];
      if (preset) {
        setConfig({ ...preset.config });
      }
      setCurrentStepIndex(0);
      setIsPlaying(false);
      onPresetChange?.(presetId);
    },
    [onPresetChange],
  );

  // Tab switch handler
  const handleTabSelect = useCallback(
    (tab: LoRAStudioTabId) => {
      setActiveTab(tab);
      onTabChange?.(tab);
    },
    [onTabChange],
  );

  // Synchronize Preset changes if initialPreset prop changes
  useEffect(() => {
    if (initialPreset && initialPreset !== selectedPresetId) {
      handlePresetSelect(initialPreset);
    }
  }, [initialPreset, handlePresetSelect, selectedPresetId]);

  // Calculations: LoRA Matrices
  const matrixData = useMemo(() => {
    return generateLoRAMatrices(8, 8, config.rank, config.alpha, 42);
  }, [config.rank, config.alpha]);

  // Calculations: SVD Spectrum
  const svdSpectrum = useMemo(() => {
    return computeSVDSpectrum(matrixData.deltaW, 8);
  }, [matrixData.deltaW]);

  // Calculations: Memory Breakdown
  const memoryBreakdown = useMemo(() => {
    return computeFullVsLoRAMemoryBreakdown(config);
  }, [config]);

  // Calculations: Checkpointing Tradeoffs
  const checkpointTradeoff = useMemo(() => {
    return computeCheckpointingTradeoffs(
      config.numLayers,
      config.batchSize,
      config.seqLength,
      config.hiddenDim,
      config.checkpointingMode,
    );
  }, [
    config.numLayers,
    config.batchSize,
    config.seqLength,
    config.hiddenDim,
    config.checkpointingMode,
  ]);

  // Calculations: Hardware Compatibility Matrix
  const hardwareFit = useMemo(() => {
    return evaluateGpuHardwareFit(memoryBreakdown.totalVramGb);
  }, [memoryBreakdown.totalVramGb]);

  // Selected GPU spec
  const selectedGpuSpec = useMemo(() => {
    return GPU_HARDWARE_SPECS.find((g) => g.id === config.selectedGpuId) ?? GPU_HARDWARE_SPECS[0]!;
  }, [config.selectedGpuId]);

  const selectedGpuFit = useMemo(() => {
    return hardwareFit.find((h) => h.gpu.id === config.selectedGpuId) ?? hardwareFit[0]!;
  }, [hardwareFit, config.selectedGpuId]);

  // Calculations: Pipeline Stepper Steps
  const pipelineSteps = useMemo(() => {
    return generateTrainingPipelineSteps(
      config.numLayers,
      config.checkpointingMode,
      memoryBreakdown.baseWeightsGb + memoryBreakdown.loraAdaptersGb,
      config.rank,
    );
  }, [
    config.numLayers,
    config.checkpointingMode,
    memoryBreakdown.baseWeightsGb,
    memoryBreakdown.loraAdaptersGb,
    config.rank,
  ]);

  const currentStep = pipelineSteps[currentStepIndex] ?? pipelineSteps[0]!;

  // Pipeline playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(300, Math.floor(1200 / playbackSpeed));
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % pipelineSteps.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, pipelineSteps.length]);

  // Target Module toggle handler
  const handleToggleModule = (mod: TargetModule) => {
    setConfig((prev) => {
      const exists = prev.targetModules.includes(mod);
      const updated = exists
        ? prev.targetModules.filter((m) => m !== mod)
        : [...prev.targetModules, mod];
      return {
        ...prev,
        targetModules: updated.length === 0 ? [mod] : updated,
      };
    });
  };

  // Helper for heatmap cell color
  const getHeatmapColor = (
    val: number,
    min: number,
    max: number,
    colorFamily: "blue" | "purple" | "emerald" | "amber",
  ) => {
    const range = max - min || 1;
    const norm = Math.max(0, Math.min(1, (val - min) / range));
    if (colorFamily === "blue") {
      return `rgba(56, 189, 248, ${0.15 + norm * 0.85})`;
    }
    if (colorFamily === "purple") {
      return `rgba(168, 85, 247, ${0.15 + norm * 0.85})`;
    }
    if (colorFamily === "emerald") {
      return `rgba(16, 185, 129, ${0.15 + norm * 0.85})`;
    }
    return `rgba(245, 158, 11, ${0.15 + norm * 0.85})`;
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "max-w-7xl mx-auto my-6" : ""
      }`}
      style={{ width, height }}
    >
      {/* ==================================================================== */}
      {/* 1. HEADER & GLOBAL CONTROLS */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-sky-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                LoRA & Gradient Checkpointing Studio
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                v3.2 ML Systems
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Low-Rank Adaptation • NF4 Double Quantization • Activation Checkpointing • Deep VRAM
              Allocator
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="relative">
            <select
              value={selectedPresetId}
              onChange={(e) => handlePresetSelect(e.target.value as LoRAPresetId)}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-sky-500 transition cursor-pointer font-medium"
            >
              {Object.values(LORA_STUDIO_PRESETS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stepper Play/Pause Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() =>
                setCurrentStepIndex(
                  (prev) => (prev - 1 + pipelineSteps.length) % pipelineSteps.length,
                )
              }
              className="p-1 text-slate-400 hover:text-white rounded transition"
              title="Previous Step"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1 rounded transition ${
                isPlaying ? "bg-amber-500/20 text-amber-400" : "text-slate-300 hover:text-white"
              }`}
              title={isPlaying ? "Pause Simulation" : "Play Simulation"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => setCurrentStepIndex((prev) => (prev + 1) % pipelineSteps.length)}
              className="p-1 text-slate-400 hover:text-white rounded transition"
              title="Next Step"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className="p-1 text-slate-400 hover:text-white rounded transition"
              title="Reset Simulation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Speed Toggle */}
          <button
            onClick={() =>
              setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 0.5 : 1)
            }
            className="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
          >
            {playbackSpeed}x
          </button>

          {/* Tuner Drawer Toggle */}
          <button
            onClick={() => setShowTunerDrawer(!showTunerDrawer)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
              showTunerDrawer
                ? "bg-sky-500 text-white font-semibold border-sky-400 shadow-md shadow-sky-500/20"
                : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tuner</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. COLLAPSIBLE PARAMETER TUNER DRAWER */}
      {/* ==================================================================== */}
      {showTunerDrawer && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 px-5 py-3.5 bg-slate-900/95 border-b border-sky-500/20 text-xs">
          {/* LoRA Rank r */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>LoRA Rank (r)</span>
              <span className="text-sky-400 font-mono font-bold">{config.rank}</span>
            </div>
            <select
              value={config.rank}
              onChange={(e) => setConfig((prev) => ({ ...prev, rank: Number(e.target.value) }))}
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              {[1, 2, 4, 8, 16, 32, 64, 128].map((v) => (
                <option key={v} value={v}>
                  r = {v}
                </option>
              ))}
            </select>
          </div>

          {/* Scaling Alpha */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>Alpha (α)</span>
              <span className="text-purple-400 font-mono font-bold">{config.alpha}</span>
            </div>
            <select
              value={config.alpha}
              onChange={(e) => setConfig((prev) => ({ ...prev, alpha: Number(e.target.value) }))}
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              {[1, 8, 16, 32, 64, 128, 256].map((v) => (
                <option key={v} value={v}>
                  α = {v} (Scale: {(v / config.rank).toFixed(2)}x)
                </option>
              ))}
            </select>
          </div>

          {/* Base Precision */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>Base Precision</span>
              <span className="text-emerald-400 font-mono font-bold">{config.basePrecision}</span>
            </div>
            <select
              value={config.basePrecision}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, basePrecision: e.target.value as BasePrecision }))
              }
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              <option value="FP32">FP32 (32-bit float)</option>
              <option value="BF16">BF16 (16-bit bfloat)</option>
              <option value="FP16">FP16 (16-bit float)</option>
              <option value="INT8">INT8 (8-bit int)</option>
              <option value="NF4">NF4 (4-bit NormalFloat)</option>
              <option value="INT4">INT4 (4-bit int)</option>
            </select>
          </div>

          {/* Checkpointing Mode */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>Checkpointing</span>
              <span className="text-amber-400 font-mono font-bold capitalize">
                {config.checkpointingMode}
              </span>
            </div>
            <select
              value={config.checkpointingMode}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  checkpointingMode: e.target.value as CheckpointingMode,
                }))
              }
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              <option value="none">None (Full VRAM, 0% FLOPs)</option>
              <option value="full">Full Layer-by-Layer (+33% FLOPs)</option>
              <option value="sqrt">Optimal Sqrt(L) Griewank</option>
              <option value="selective">Selective Attention (+15% FLOPs)</option>
            </select>
          </div>

          {/* Batch Size & Seq Length */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>Batch (B) × Seq (S)</span>
              <span className="text-sky-400 font-mono font-bold">
                {config.batchSize} × {config.seqLength}
              </span>
            </div>
            <div className="flex gap-1">
              <select
                value={config.batchSize}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, batchSize: Number(e.target.value) }))
                }
                className="bg-slate-800 border border-slate-700 text-white rounded p-1 w-1/2"
              >
                {[1, 2, 4, 8, 16, 32].map((b) => (
                  <option key={b} value={b}>
                    B={b}
                  </option>
                ))}
              </select>
              <select
                value={config.seqLength}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, seqLength: Number(e.target.value) }))
                }
                className="bg-slate-800 border border-slate-700 text-white rounded p-1 w-1/2"
              >
                {[512, 1024, 2048, 4096, 8192, 16384].map((s) => (
                  <option key={s} value={s}>
                    S={s >= 1024 ? `${s / 1024}k` : s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optimizer Selection */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>Optimizer</span>
              <span className="text-purple-400 font-mono font-bold">
                {config.optimizerType === "paged_adamw"
                  ? "Paged"
                  : config.optimizerType.replace("adamw_", "")}
              </span>
            </div>
            <select
              value={config.optimizerType}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, optimizerType: e.target.value as OptimizerType }))
              }
              className="bg-slate-800 border border-slate-700 text-white rounded p-1"
            >
              <option value="adamw_8bit">AdamW (8-bit Quantized)</option>
              <option value="paged_adamw">Paged AdamW (CUDA Unified)</option>
              <option value="adamw_fp32">AdamW (FP32 Standard)</option>
              <option value="sgd">SGD with Momentum</option>
            </select>
          </div>

          {/* Target Modules Selector (Full Span Row) */}
          <div className="col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Target Modules:</span>
            {ALL_TARGET_MODULES.map((mod) => {
              const active = config.targetModules.includes(mod);
              return (
                <button
                  key={mod}
                  onClick={() => handleToggleModule(mod)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                    active
                      ? "bg-sky-500/20 text-sky-300 border-sky-500/50 font-semibold"
                      : "bg-slate-800/60 text-slate-500 border-slate-700/60 hover:text-slate-300"
                  }`}
                >
                  {mod}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. GLOBAL KPI SUMMARY CARDS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 px-5 py-3 bg-slate-900/50 border-b border-slate-800/80 text-xs">
        {/* Metric 1: Total VRAM Required */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Total VRAM Budget</span>
            <HardDrive className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-white font-mono">
              {memoryBreakdown.totalVramGb.toFixed(2)} GB
            </span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            {memoryBreakdown.vramSavingsPct}% savings vs Full FT (
            {memoryBreakdown.fullFineTuningVramGb.toFixed(0)} GB)
          </div>
        </div>

        {/* Metric 2: Base Weights vs Precision */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Base Model Weight</span>
            <Layers className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-sky-300 font-mono">
              {memoryBreakdown.baseWeightsGb.toFixed(2)} GB
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({config.basePrecision})</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {memoryBreakdown.baseWeightsBpp.toFixed(3)} bits/param
          </div>
        </div>

        {/* Metric 3: LoRA Parameters & Reduction */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>LoRA Adapters (r={config.rank})</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-purple-300 font-mono">
              {(memoryBreakdown.loraParamsCount / 1e6).toFixed(2)}M
            </span>
            <span className="text-[10px] text-purple-400 font-mono">params</span>
          </div>
          <div className="text-[10px] text-purple-400 font-mono">
            {memoryBreakdown.paramReductionPct}% param reduction
          </div>
        </div>

        {/* Metric 4: Gradients & Optimizer */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Trainable VRAM</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-amber-300 font-mono">
              {((memoryBreakdown.gradientsGb + memoryBreakdown.optimizerStatesGb) * 1024).toFixed(
                0,
              )}{" "}
              MB
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Grads: {(memoryBreakdown.gradientsGb * 1024).toFixed(0)}MB • Opt:{" "}
            {(memoryBreakdown.optimizerStatesGb * 1024).toFixed(0)}MB
          </div>
        </div>

        {/* Metric 5: Peak Activations & Checkpointing */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>Peak Activations</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-emerald-300 font-mono">
              {memoryBreakdown.peakActivationsGb.toFixed(2)} GB
            </span>
            <span className="text-[10px] text-slate-400 font-mono capitalize">
              ({config.checkpointingMode})
            </span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono">
            FLOPs Overhead: +{(checkpointTradeoff.recomputationFlopsRatio * 100).toFixed(1)}%
          </div>
        </div>

        {/* Metric 6: Selected GPU Status */}
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span>{selectedGpuSpec.name.split(" ")[1] ?? "GPU"} Feasibility</span>
            <Server className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold uppercase ${
                selectedGpuFit.status === "safe"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : selectedGpuFit.status === "tight"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : selectedGpuFit.status === "oom_danger"
                      ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}
            >
              {selectedGpuFit.status.replace("_", " ")}
            </span>
            <span className="text-[11px] text-slate-300 font-mono">
              {selectedGpuFit.utilizationPct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {selectedGpuFit.vramHeadroomGb.toFixed(1)} GB Free / {selectedGpuSpec.vramGb} GB
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. MODALITY / NAVIGATION TAB BAR */}
      {/* ==================================================================== */}
      <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950 px-5 pt-2 gap-1.5 text-xs scrollbar-none">
        {[
          {
            id: "lora_matrix" as LoRAStudioTabId,
            name: "LoRA Decomposition",
            icon: Sparkles,
            badge: `r=${config.rank}`,
          },
          {
            id: "qlora_nf4" as LoRAStudioTabId,
            name: "QLoRA NF4 & Double Quant",
            icon: Boxes,
            badge: `${memoryBreakdown.baseWeightsBpp.toFixed(2)} bpp`,
          },
          {
            id: "vram_breakdown" as LoRAStudioTabId,
            name: "VRAM Budget Allocator",
            icon: HardDrive,
            badge: `${memoryBreakdown.totalVramGb.toFixed(1)} GB`,
          },
          {
            id: "checkpointing_timeline" as LoRAStudioTabId,
            name: "Activation Checkpointing",
            icon: ShieldCheck,
            badge: config.checkpointingMode,
          },
          {
            id: "hardware_fit" as LoRAStudioTabId,
            name: "Multi-GPU Compatibility",
            icon: Server,
            badge: `${selectedGpuFit.status}`,
          },
          {
            id: "training_stepper" as LoRAStudioTabId,
            name: "Training Pipeline Simulator",
            icon: Terminal,
            badge: `Step ${currentStepIndex + 1}/${pipelineSteps.length}`,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-lg font-medium transition-all whitespace-nowrap border-t border-l border-r ${
                isActive
                  ? "bg-slate-900 text-sky-400 border-slate-700/80 font-bold shadow-sm"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
              <span>{tab.name}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isActive ? "bg-sky-500/20 text-sky-300" : "bg-slate-800 text-slate-500"
                }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* 5. TAB CONTENT PANELS */}
      {/* ==================================================================== */}
      <div className="p-5 flex-1 bg-slate-950 overflow-y-auto">
        {/* ================================================================== */}
        {/* TAB 1: LoRA MATRIX DECOMPOSITION VISUALIZER */}
        {/* ================================================================== */}
        {activeTab === "lora_matrix" && (
          <div className="space-y-6">
            {/* Mathematical Header Banner */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Low-Rank Matrix Factorization Equation</span>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                    Hu et al. 2021
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Freezes pre-trained base weight <span className="text-sky-400 font-mono">W₀</span>{" "}
                  and injects trainable rank-<span className="text-purple-400 font-mono">r</span>{" "}
                  matrices <span className="text-purple-400 font-mono">B</span> and{" "}
                  <span className="text-emerald-400 font-mono">A</span>.
                </p>
              </div>

              <div className="px-4 py-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-sm text-sky-300 shadow-inner">
                {"W = W₀ + (α/r) · (B · A)"}
              </div>
            </div>

            {/* Matrix Heatmaps Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Matrix W0 */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-sky-400 font-mono">Base W₀ (8×8)</span>
                  <span className="text-[10px] text-slate-500 font-mono">Frozen</span>
                </div>
                <div className="grid grid-cols-8 gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  {matrixData.w0.map((row, i) =>
                    row.map((val, j) => (
                      <div
                        key={`w0_${i}_${j}`}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-all hover:scale-125 hover:z-10 shadow-sm"
                        style={{
                          backgroundColor: getHeatmapColor(val, -1.0, 1.0, "blue"),
                          color: Math.abs(val) > 0.4 ? "#020617" : "#cbd5e1",
                        }}
                        title={`W0[${i},${j}] = ${val}`}
                      >
                        {val > 0 ? "+" : val < 0 ? "-" : "0"}
                      </div>
                    )),
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-2 text-center">
                  ‖W₀‖_F = {matrixData.frobeniusNormW0}
                </div>
              </div>

              {/* Matrix B */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-purple-400 font-mono">Up-proj B (8×r)</span>
                  <span className="text-[10px] text-purple-400 font-mono">Trainable</span>
                </div>
                <div
                  className="grid gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80"
                  style={{
                    gridTemplateColumns: `repeat(${Math.min(8, config.rank)}, minmax(0, 1fr))`,
                  }}
                >
                  {matrixData.b.map((row, i) =>
                    row.map((val, rIdx) => (
                      <div
                        key={`b_${i}_${rIdx}`}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-all hover:scale-125 hover:z-10 shadow-sm"
                        style={{
                          backgroundColor: getHeatmapColor(val, -0.8, 0.8, "purple"),
                          color: Math.abs(val) > 0.3 ? "#020617" : "#cbd5e1",
                        }}
                        title={`B[${i},${rIdx}] = ${val}`}
                      >
                        {val > 0 ? "+" : val < 0 ? "-" : "0"}
                      </div>
                    )),
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-2 text-center">
                  Init: Zero / Small N(0, σ)
                </div>
              </div>

              {/* Matrix A */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-emerald-400 font-mono">Down-proj A (r×8)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Trainable</span>
                </div>
                <div className="grid grid-cols-8 gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  {matrixData.a.map((row, rIdx) =>
                    row.map((val, j) => (
                      <div
                        key={`a_${rIdx}_${j}`}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-all hover:scale-125 hover:z-10 shadow-sm"
                        style={{
                          backgroundColor: getHeatmapColor(val, -0.6, 0.6, "emerald"),
                          color: Math.abs(val) > 0.25 ? "#020617" : "#cbd5e1",
                        }}
                        title={`A[${rIdx},${j}] = ${val}`}
                      >
                        {val > 0 ? "+" : val < 0 ? "-" : "0"}
                      </div>
                    )),
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-2 text-center">
                  Init: Gaussian N(0, 1/r)
                </div>
              </div>

              {/* Matrix Delta W */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-amber-400 font-mono">ΔW = (α/r)·B·A</span>
                  <span className="text-[10px] text-amber-400 font-mono">Rank {config.rank}</span>
                </div>
                <div className="grid grid-cols-8 gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  {matrixData.deltaW.map((row, i) =>
                    row.map((val, j) => (
                      <div
                        key={`dw_${i}_${j}`}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-all hover:scale-125 hover:z-10 shadow-sm"
                        style={{
                          backgroundColor: getHeatmapColor(val, -0.5, 0.5, "amber"),
                          color: Math.abs(val) > 0.2 ? "#020617" : "#cbd5e1",
                        }}
                        title={`ΔW[${i},${j}] = ${val}`}
                      >
                        {val > 0 ? "+" : val < 0 ? "-" : "0"}
                      </div>
                    )),
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-2 text-center">
                  ‖ΔW‖_F = {matrixData.frobeniusNormDeltaW}
                </div>
              </div>

              {/* Merged Matrix W */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-sky-300 font-mono">W_merged (8×8)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Zero Latency</span>
                </div>
                <div className="grid grid-cols-8 gap-1 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                  {matrixData.wMerged.map((row, i) =>
                    row.map((val, j) => (
                      <div
                        key={`wm_${i}_${j}`}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-all hover:scale-125 hover:z-10 shadow-sm"
                        style={{
                          backgroundColor: getHeatmapColor(val, -1.2, 1.2, "blue"),
                          color: Math.abs(val) > 0.5 ? "#020617" : "#cbd5e1",
                        }}
                        title={`W_merged[${i},${j}] = ${val}`}
                      >
                        {val > 0 ? "+" : val < 0 ? "-" : "0"}
                      </div>
                    )),
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-2 text-center">
                  ‖W_m‖_F = {matrixData.frobeniusNormMerged}
                </div>
              </div>
            </div>

            {/* SVD Singular Value Spectrum & Energy Retention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    SVD Singular Value Spectrum σ(ΔW)
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Effective Rank 90%:{" "}
                    <strong className="text-purple-400">{svdSpectrum.effectiveRank90}</strong>
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {svdSpectrum.singularValues.map((sigma, idx) => {
                    const energyPct = svdSpectrum.energyCumulative[idx] ?? 0;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-slate-400 w-8 text-right">
                          σ_{idx + 1}:
                        </span>
                        <div className="flex-1 bg-slate-950 rounded-full h-3.5 overflow-hidden border border-slate-800 flex">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, (sigma / (svdSpectrum.singularValues[0] || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-purple-300 w-12 text-right font-bold">
                          {sigma.toFixed(2)}
                        </span>
                        <span className="font-mono text-slate-500 w-14 text-right text-[10px]">
                          ({energyPct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parameter & Latency Analysis Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Parameter Efficiency & Weight Merging
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    LoRA freezes the original{" "}
                    <span className="font-mono text-sky-400">d_in × d_out</span> weights and trains
                    two low-rank matrices. For inference,{" "}
                    <span className="font-mono text-amber-400">ΔW = (α/r)·B·A</span> is added
                    directly to <span className="font-mono text-sky-400">W₀</span> with{" "}
                    <strong>zero added inference latency or memory overhead</strong>.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Perturbation Ratio:</span>
                    <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                      {matrixData.perturbationRatio}%
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">‖ΔW‖ / ‖W₀‖</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Parameter Reduction:</span>
                    <div className="text-base font-bold text-emerald-300 font-mono mt-0.5">
                      {memoryBreakdown.paramReductionPct}%
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">LoRA vs Base</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: QLoRA NF4 & DOUBLE QUANTIZATION ENGINE */}
        {/* ================================================================== */}
        {activeTab === "qlora_nf4" && (
          <div className="space-y-6">
            {/* Header description */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>NormalFloat4 (NF4) & 2-Stage Double Quantization</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    Dettmers et al. NeurIPS 2023
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Information-theoretically optimal 4-bit quantile mapping for standard normal
                  distributions, combined with nested scale factor quantization.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-300">
                {"Footprint: 4.0 + 8/64 + 32/(64 × 256) = 4.127 bpp"}
              </div>
            </div>

            {/* 16 Quantile Levels Visualizer */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-400" />
                  Exact 16 NF4 Quantiles Mapping from Standard Normal N(0, 1)
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  Bins 0000₂ to 1111₂ (16 discrete states)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                {NF4_QUANTILES.map((qVal, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-col items-center justify-between text-center transition hover:border-sky-500"
                  >
                    <div className="flex items-center justify-between w-full text-[10px] text-slate-500 font-mono">
                      <span>q_{idx}</span>
                      <span>{idx.toString(2).padStart(4, "0")}₂</span>
                    </div>
                    <div className="text-xs font-bold text-sky-300 font-mono my-1">
                      {qVal.toFixed(4)}
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-sky-400 rounded-full"
                        style={{ width: `${Math.max(5, ((qVal + 1) / 2) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Double Quantization Architecture Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Block 1: Weights Quantization */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-sky-400">
                      1. Block-wise Quantization
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">B₁ = 64 weights</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Divides 16-bit weight tensor into chunks of 64. Each chunk computes scale{" "}
                    <span className="font-mono text-sky-300">c₁ = max(|W|)</span>, mapping weights
                    to 4-bit NF4 bins.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  Naive 4-bit overhead: 32 bits / 64 = <strong>0.500 bpp</strong>
                </div>
              </div>

              {/* Block 2: Double Quantization */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-400">
                      2. Double Quantization (DQ)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">B₂ = 256 scales</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    First-level scales <span className="font-mono text-sky-300">c₁</span> are
                    themselves grouped into chunks of 256 and quantized to 8-bit FP8 with a
                    second-level FP32 scale <span className="font-mono text-emerald-300">c₂</span>.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
                  DQ scale overhead: 8/64 + 32/16384 = <strong>0.127 bpp</strong>
                </div>
              </div>

              {/* Block 3: Paged Optimizers */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-purple-400">
                      3. Paged AdamW Optimizers
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">CUDA Unified Mem</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses CUDA page-locked memory to dynamically page optimizer states to CPU RAM
                    during temporary memory spikes (such as long-sequence activation peaks),
                    eliminating sudden OOM crashes.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-purple-300">
                  Zero memory overhead on GPU when inactive
                </div>
              </div>
            </div>

            {/* Precision & Savings Metric Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 text-[10px]">FP16 Full Precision</span>
                <div className="text-base font-bold text-slate-300 mt-1">16.000 bpp</div>
                <span className="text-[10px] text-slate-500">2.000 Bytes/Param</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-500 text-[10px]">Naive 4-Bit (B₁=64)</span>
                <div className="text-base font-bold text-amber-300 mt-1">4.500 bpp</div>
                <span className="text-[10px] text-slate-500">0.563 Bytes/Param</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 bg-emerald-950/10">
                <span className="text-emerald-400 text-[10px]">QLoRA NF4 + DQ</span>
                <div className="text-base font-bold text-emerald-300 mt-1">4.127 bpp</div>
                <span className="text-[10px] text-emerald-400/80">0.516 Bytes/Param</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30 bg-purple-950/10">
                <span className="text-purple-400 text-[10px]">DQ Savings on 70B</span>
                <div className="text-base font-bold text-purple-300 mt-1">~3.26 GB VRAM</div>
                <span className="text-[10px] text-purple-400/80">0.373 bpp saved</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: DEEP MEMORY BUDGET ALLOCATOR */}
        {/* ================================================================== */}
        {activeTab === "vram_breakdown" && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Byte-Level VRAM Memory Allocator & Stack Breakdown</span>
                  <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                    Live Formula Evaluator
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Comprehensive memory budget accounting for Base Weights, Adapters, Gradients,
                  AdamW Optimizer States, Activations, and CUDA Driver Context.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">
                  Full FT: {memoryBreakdown.fullFineTuningVramGb.toFixed(1)} GB
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-emerald-300 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
                  LoRA: {memoryBreakdown.totalVramGb.toFixed(2)} GB (
                  {memoryBreakdown.vramSavingsPct}% Saved)
                </span>
              </div>
            </div>

            {/* Stacked Memory Bar Chart */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">
                  VRAM Stack Composition ({memoryBreakdown.totalVramGb.toFixed(2)} GB Total)
                </span>
                <span className="text-slate-400 font-mono">100% of Allocated Budget</span>
              </div>

              {/* Stacked Bar */}
              <div className="w-full h-8 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
                {memoryBreakdown.breakdownItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-300 hover:brightness-125"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                    title={`${item.name}: ${item.sizeGb} GB (${item.pct}%)`}
                  />
                ))}
              </div>

              {/* Legend Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
                {memoryBreakdown.breakdownItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-300 font-medium truncate">{item.name}</span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="font-bold text-white">{item.sizeGb} GB</span>
                      <span className="text-[10px] text-slate-500">{item.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Exact Mathematical Formula Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-sky-400 flex items-center justify-between">
                  <span>1. Base Model Weights</span>
                  <span className="font-mono text-white">{memoryBreakdown.baseWeightsGb} GB</span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  M_base = N_base × (bpp / 8)
                </div>
                <p className="text-[11px] text-slate-400">
                  {config.totalParamsB}B params × {memoryBreakdown.baseWeightsBpp.toFixed(3)} bpp /
                  8 bytes.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-purple-400 flex items-center justify-between">
                  <span>2. LoRA Adapters & Gradients</span>
                  <span className="font-mono text-white">
                    {(memoryBreakdown.loraAdaptersGb + memoryBreakdown.gradientsGb).toFixed(3)} GB
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  M_grad = N_lora × 2 bytes (FP16)
                </div>
                <p className="text-[11px] text-slate-400">
                  Gradients only allocated for {(memoryBreakdown.loraParamsCount / 1e6).toFixed(2)}M
                  trainable adapter params.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>3. AdamW Optimizer States</span>
                  <span className="font-mono text-white">
                    {memoryBreakdown.optimizerStatesGb} GB
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  M_opt = N_lora × {config.optimizerType === "adamw_8bit" ? "2" : "8"} bytes
                </div>
                <p className="text-[11px] text-slate-400">
                  First (m) & second (v) moments for LoRA weights under {config.optimizerType}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-emerald-400 flex items-center justify-between">
                  <span>4. Peak Activation Memory</span>
                  <span className="font-mono text-white">
                    {memoryBreakdown.peakActivationsGb} GB
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  M_act ={" "}
                  {config.checkpointingMode === "full" ? "L × 2BSH + Act_layer" : "L × Act_layer"}
                </div>
                <p className="text-[11px] text-slate-400">
                  Batch {config.batchSize} × Seq {config.seqLength} × Hidden {config.hiddenDim}.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-slate-300 flex items-center justify-between">
                  <span>5. KV Cache & Context</span>
                  <span className="font-mono text-white">
                    {(memoryBreakdown.kvCacheGb + memoryBreakdown.cudaContextGb).toFixed(2)} GB
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  M_kv = 2 × L × B × S × (n_kv · d_head) × 2B
                </div>
                <p className="text-[11px] text-slate-400">
                  Includes static 1.25 GB CUDA runtime buffers and workspace tensors.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="font-bold text-rose-400 flex items-center justify-between">
                  <span>6. Full Fine-Tuning Comparison</span>
                  <span className="font-mono text-rose-300">
                    {memoryBreakdown.fullFineTuningVramGb.toFixed(1)} GB
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                  M_full = Base(16B) + Grad(16B) + AdamW(96B)
                </div>
                <p className="text-[11px] text-slate-400">
                  Requires multi-node A100/H100 clusters without LoRA parameter isolation.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: ACTIVATION CHECKPOINTING & RECOMPUTATION TIMELINE */}
        {/* ================================================================== */}
        {activeTab === "checkpointing_timeline" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Activation Checkpointing & Recomputation Engine</span>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Griewank / Chen et al.
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Trades arithmetic recomputation (+33.3% FLOPs during backward pass) to drop
                  intermediate forward activations, reducing activation memory from O(L) to O(1) or
                  O(√L).
                </p>
              </div>

              {/* Mode Selector Buttons */}
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 gap-1 text-xs">
                {(["none", "full", "sqrt", "selective"] as CheckpointingMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setConfig((prev) => ({ ...prev, checkpointingMode: m }))}
                    className={`px-3 py-1.5 rounded-md font-mono capitalize transition ${
                      config.checkpointingMode === m
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer-by-Layer Activation Timeline Simulation Grid */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Layer Memory Footprint Over Training Cycle (32 Layers)
                </h4>
                <span className="text-[11px] font-mono text-slate-400">
                  Peak Memory:{" "}
                  <strong className="text-emerald-400">
                    {checkpointTradeoff.peakActivationMemoryMb} MB
                  </strong>
                </span>
              </div>

              {/* Visual Layer Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5 pt-2">
                {Array.from({ length: 32 }, (_, idx) => {
                  const layerNum = idx + 1;
                  const isCheckpoint =
                    config.checkpointingMode === "full" ||
                    (config.checkpointingMode === "sqrt" && layerNum % 4 === 1);
                  const isStored = config.checkpointingMode === "none";
                  const isSelective =
                    config.checkpointingMode === "selective" && layerNum % 2 === 1;

                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg border flex flex-col items-center justify-between text-center min-h-[70px] transition-all ${
                        isCheckpoint
                          ? "bg-amber-950/20 border-amber-500/40 text-amber-300"
                          : isStored
                            ? "bg-rose-950/20 border-rose-500/30 text-rose-300"
                            : isSelective
                              ? "bg-purple-950/20 border-purple-500/30 text-purple-300"
                              : "bg-slate-950 border-slate-800 text-slate-500"
                      }`}
                    >
                      <span className="text-[10px] font-mono font-bold">L{layerNum}</span>
                      <div className="my-1">
                        {isCheckpoint ? (
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                        ) : isStored ? (
                          <HardDrive className="w-4 h-4 text-rose-400" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>
                      <span className="text-[9px] font-mono">
                        {isCheckpoint ? "Boundary" : isStored ? "Stored" : "Recomputed"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison Matrix Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 cursor-pointer transition ${
                  config.checkpointingMode === "none"
                    ? "bg-slate-900 border-sky-400 shadow-md shadow-sky-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
                onClick={() => setConfig((prev) => ({ ...prev, checkpointingMode: "none" }))}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">1. No Checkpointing</span>
                    <span className="text-[10px] font-mono text-rose-400">O(L) VRAM</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Stores all intermediate activations during forward pass. Maximum VRAM footprint
                    with zero FLOPs overhead.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Recompute Overhead:</span>
                    <strong className="text-emerald-400">+0.0% FLOPs</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Act VRAM:</span>
                    <strong className="text-rose-400">
                      {
                        computeCheckpointingTradeoffs(
                          config.numLayers,
                          config.batchSize,
                          config.seqLength,
                          config.hiddenDim,
                          "none",
                        ).peakActivationMemoryMb
                      }{" "}
                      MB
                    </strong>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 cursor-pointer transition ${
                  config.checkpointingMode === "full"
                    ? "bg-slate-900 border-amber-400 shadow-md shadow-amber-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
                onClick={() => setConfig((prev) => ({ ...prev, checkpointingMode: "full" }))}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">2. Full Checkpointing</span>
                    <span className="text-[10px] font-mono text-emerald-400">O(1) VRAM</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Discards all intermediate activations. Only stores layer boundaries and
                    recomputes forward pass during backprop.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Recompute Overhead:</span>
                    <strong className="text-amber-400">+33.3% FLOPs</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Act VRAM:</span>
                    <strong className="text-emerald-400">
                      {
                        computeCheckpointingTradeoffs(
                          config.numLayers,
                          config.batchSize,
                          config.seqLength,
                          config.hiddenDim,
                          "full",
                        ).peakActivationMemoryMb
                      }{" "}
                      MB
                    </strong>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 cursor-pointer transition ${
                  config.checkpointingMode === "sqrt"
                    ? "bg-slate-900 border-purple-400 shadow-md shadow-purple-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
                onClick={() => setConfig((prev) => ({ ...prev, checkpointingMode: "sqrt" }))}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">3. Optimal Sqrt(L)</span>
                    <span className="text-[10px] font-mono text-purple-400">O(√L) VRAM</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Griewank optimal segment checkpointing. Stores √L boundary tensors and
                    recomputes within √L layer segments.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Recompute Overhead:</span>
                    <strong className="text-purple-400">+33.3% FLOPs</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Act VRAM:</span>
                    <strong className="text-purple-300">
                      {
                        computeCheckpointingTradeoffs(
                          config.numLayers,
                          config.batchSize,
                          config.seqLength,
                          config.hiddenDim,
                          "sqrt",
                        ).peakActivationMemoryMb
                      }{" "}
                      MB
                    </strong>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 cursor-pointer transition ${
                  config.checkpointingMode === "selective"
                    ? "bg-slate-900 border-sky-400 shadow-md shadow-sky-500/10"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
                onClick={() => setConfig((prev) => ({ ...prev, checkpointingMode: "selective" }))}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">4. Selective Attention</span>
                    <span className="text-[10px] font-mono text-sky-400">Balanced</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Only recomputes attention Softmax & QK^T while retaining lightweight RMSNorm &
                    GeLU tensors.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Recompute Overhead:</span>
                    <strong className="text-sky-400">+15.0% FLOPs</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Act VRAM:</span>
                    <strong className="text-sky-300">
                      {
                        computeCheckpointingTradeoffs(
                          config.numLayers,
                          config.batchSize,
                          config.seqLength,
                          config.hiddenDim,
                          "selective",
                        ).peakActivationMemoryMb
                      }{" "}
                      MB
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: MULTI-GPU & HARDWARE COMPATIBILITY MATRIX */}
        {/* ================================================================== */}
        {activeTab === "hardware_fit" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Multi-GPU & Edge Hardware Compatibility Matrix</span>
                  <span className="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                    OOM Feasibility Engine
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Target Workload:{" "}
                  <strong className="text-white font-mono">
                    {memoryBreakdown.totalVramGb.toFixed(2)} GB VRAM
                  </strong>{" "}
                  required across Base Weights, LoRA Adapters, Gradients, and Peak Activations.
                </p>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Evaluated across 8 GPU architectures
              </div>
            </div>

            {/* GPU Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {hardwareFit.map((evalItem) => {
                const isSelected = config.selectedGpuId === evalItem.gpu.id;

                return (
                  <div
                    key={evalItem.gpu.id}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, selectedGpuId: evalItem.gpu.id }))
                    }
                    className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 border-sky-400 shadow-lg shadow-sky-500/10 ring-1 ring-sky-400"
                        : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-xs text-white truncate">
                          {evalItem.gpu.name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            evalItem.status === "safe"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : evalItem.status === "tight"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : evalItem.status === "oom_danger"
                                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          }`}
                        >
                          {evalItem.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono">
                        {evalItem.gpu.vramGb} GB {evalItem.gpu.memoryType} •{" "}
                        {evalItem.gpu.bandwidthGbs} GB/s
                      </div>
                    </div>

                    {/* VRAM Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Utilization:</span>
                        <span className="font-bold text-white">{evalItem.utilizationPct}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            evalItem.status === "safe"
                              ? "bg-emerald-500"
                              : evalItem.status === "tight"
                                ? "bg-amber-500"
                                : evalItem.status === "oom_danger"
                                  ? "bg-orange-500"
                                  : "bg-rose-500"
                          }`}
                          style={{ width: `${Math.min(100, evalItem.utilizationPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Footer */}
                    <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1 font-mono">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-slate-500">Max Batch Size (B_max):</span>
                        <strong className="text-sky-300">{evalItem.maxBatchSize}</strong>
                      </div>
                      <p className="text-[10px] text-slate-400 font-sans pt-1 leading-snug">
                        {evalItem.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 6: LIVE INTERACTIVE TRAINING PIPELINE SIMULATOR */}
        {/* ================================================================== */}
        {activeTab === "training_stepper" && (
          <div className="space-y-6">
            {/* Stepper Header */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Live Interactive LoRA & Checkpointing Training Stepper</span>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                    Forward • Recompute • Backward • Update
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Step-by-step state machine tracking exact VRAM allocations, tensor lifetime
                  caching, and FLOPs accumulation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentStepIndex(
                      (prev) => (prev - 1 + pipelineSteps.length) % pipelineSteps.length,
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs border border-slate-700 flex items-center gap-1 font-medium"
                >
                  <SkipBack className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                    isPlaying
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "Pause" : "Auto-Step"}</span>
                </button>
                <button
                  onClick={() => setCurrentStepIndex((prev) => (prev + 1) % pipelineSteps.length)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs border border-slate-700 flex items-center gap-1 font-medium"
                >
                  Next <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Current Active Step Hero Card */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-sky-500/40 shadow-xl shadow-sky-500/5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-xs font-mono font-bold text-sky-400">
                    {currentStep.stepNumber}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{currentStep.title}</h3>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Phase: <strong className="text-sky-400">{currentStep.phase}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                    VRAM:{" "}
                    <strong className="text-sky-300">
                      {currentStep.vramCurrentGb.toFixed(2)} GB
                    </strong>
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300">
                    Compute:{" "}
                    <strong className="text-purple-300">
                      {currentStep.flopsAccumulatedGFlops} GFLOPs
                    </strong>
                  </div>
                </div>
              </div>

              {/* Step Description & Equation */}
              <div className="space-y-2">
                <p className="text-xs text-slate-300 leading-relaxed">{currentStep.description}</p>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300">
                  {currentStep.formula}
                </div>
              </div>

              {/* Active Tensor Badge */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-mono">
                  Active Tensor:{" "}
                  <strong className="text-amber-300">{currentStep.activeTensor}</strong>
                </span>
                {currentStep.isCheckpointStored && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                    Boundary Tensor Cached in Memory
                  </span>
                )}
                {currentStep.isRecomputed && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                    Arithmetic Recomputation Pass
                  </span>
                )}
              </div>
            </div>

            {/* Pipeline Step Sequence Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400">
                Execution Trace Timeline ({pipelineSteps.length} steps):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {pipelineSteps.map((step, idx) => {
                  const isActive = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setIsPlaying(false);
                      }}
                      className={`p-2 rounded-lg border text-left flex flex-col justify-between min-h-[64px] transition ${
                        isActive
                          ? "bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/10 text-sky-300 font-bold"
                          : isPast
                            ? "bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-600"
                            : "bg-slate-950 border-slate-800/80 text-slate-500 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span>#{step.stepNumber}</span>
                        <span className="capitalize">{step.phase}</span>
                      </div>
                      <div className="text-[11px] truncate mt-1">{step.title.split("—")[0]}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 6. FOOTER BAR */}
      {/* ==================================================================== */}
      <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Active Architecture: <strong className="text-slate-200">{config.modelName}</strong> (
            {config.totalParamsB}B)
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Rank: <strong className="text-purple-400">r={config.rank}</strong> • Precision:{" "}
          <strong className="text-sky-400">{config.basePrecision}</strong> • Checkpoint:{" "}
          <strong className="text-amber-400">{config.checkpointingMode}</strong>
        </div>
      </div>
    </div>
  );
};

export default LoRAGradientCheckpointingStudio;
