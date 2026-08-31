import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Server,
  HardDrive,
  Copy,
  Check,
  Clock,
  Code2,
  Split,
  Workflow,
  Terminal,
  ShieldAlert,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type ParallelPresetId =
  | "llama3_8b_8x_h100"
  | "llama3_70b_64x_h100"
  | "llama3_405b_512x_h100"
  | "deepseek_v3_256x_h100"
  | "gpt3_175b_64x_a100"
  | "custom";

export type StudioTabId =
  | "cluster_planner"
  | "tensor_parallel"
  | "pipeline_schedules"
  | "sequence_parallel"
  | "code_generator";

export type PipelineType = "gpipe" | "1f1b" | "1f1b_interleaved";

export type PrecisionFormat = "fp32" | "fp16" | "bf16" | "fp8";

export type OptimizerType = "adamw_fp32" | "adamw_8bit" | "sgd_momentum" | "sgd";

export type ActivationCheckpointMode = "none" | "selective" | "full";

export type ZeROStage = "none" | "zero1" | "zero2" | "zero3";

export type SequenceParallelType = "none" | "megatron_sp" | "deepspeed_ulysses" | "ring_attention";

export interface GpuHardwareSpec {
  readonly id: string;
  readonly name: string;
  readonly vramGb: number;
  readonly bandwidthGbs: number;
  readonly tflopsBf16: number;
  readonly tflopsFp8: number;
  readonly memoryType: string;
  readonly architecture: string;
  readonly tdpWatts: number;
  readonly nvlinkBandwidthGbs: number;
}

export interface ModelArchitectureConfig {
  readonly name: string;
  readonly totalParamsB: number; // in billions (e.g. 8.0 for 8B)
  readonly numLayers: number;
  readonly hiddenDim: number;
  readonly intermediateDim: number; // FFN hidden size (e.g. 4 * hiddenDim or SwiGLU ~ 3.5 * hiddenDim)
  readonly numAttentionHeads: number;
  readonly numKvHeads: number;
  readonly vocabSize: number;
  readonly maxSeqLen: number;
  readonly isMoE?: boolean;
  readonly numExperts?: number;
  readonly topKExperts?: number;
}

export interface ParallelismConfig {
  readonly dp: number; // Data Parallelism
  readonly tp: number; // Tensor Parallelism
  readonly pp: number; // Pipeline Parallelism
  readonly cp: number; // Context / Sequence Parallelism
  readonly ep: number; // Expert Parallelism (for MoE)
  readonly microbatchSize: number; // b
  readonly globalBatchSize: number; // B
  readonly seqLen: number; // S
  readonly virtualStages: number; // v (for 1F1B-Interleaved, default 1)
  readonly precision: PrecisionFormat;
  readonly optimizer: OptimizerType;
  readonly activationCheckpointing: ActivationCheckpointMode;
  readonly zeroStage: ZeROStage;
  readonly sequenceParallel: SequenceParallelType;
  readonly useFlashAttention: boolean;
}

export interface MemoryBreakdownResult {
  readonly weightsGb: number;
  readonly optimizerGb: number;
  readonly gradientsGb: number;
  readonly activationsGb: number;
  readonly kvCacheGb: number;
  readonly workingBufferGb: number;
  readonly totalGb: number;
  readonly freeGb: number;
  readonly maxVramGb: number;
  readonly isOOM: boolean;
  readonly oomDeficitGb: number;
  readonly breakdownPct: {
    readonly weights: number;
    readonly optimizer: number;
    readonly gradients: number;
    readonly activations: number;
    readonly kvCache: number;
    readonly workingBuffer: number;
  };
}

export interface CommunicationVolumeResult {
  readonly tpVolumeBytesPerLayer: number;
  readonly ppVolumeBytesPerMicrobatch: number;
  readonly dpVolumeBytesPerStep: number;
  readonly spVolumeBytesPerLayer: number;
  readonly cpVolumeBytesPerStep: number;
  readonly epVolumeBytesPerStep: number;
  readonly totalVolumeBytesPerStep: number;
  readonly tpBandwidthRequiredGbs: number;
  readonly ppBandwidthRequiredGbs: number;
  readonly dpBandwidthRequiredGbs: number;
}

export interface MFUThroughputResult {
  readonly flopsPerToken: number;
  readonly totalFlopsPerStep: number;
  readonly tokensPerStep: number;
  readonly stepTimeMs: number;
  readonly achievedTflopsPerGpu: number;
  readonly mfuPct: number;
  readonly hfuPct: number;
  readonly tokensPerSecPerGpu: number;
  readonly totalClusterTokensPerSec: number;
}

export interface PipelineScheduleEvent {
  readonly id: string;
  readonly stageId: number; // Physical stage / GPU (0..pp-1)
  readonly virtualStageId: number; // 0..virtualStages-1
  readonly microbatchId: number; // 0..numMicrobatches-1
  readonly type: "forward" | "backward" | "weight_update" | "idle";
  readonly startCycle: number;
  readonly duration: number;
  readonly endCycle: number;
  readonly label: string;
  readonly color: string;
}

export interface PipelineScheduleResult {
  readonly pipelineType: PipelineType;
  readonly numStages: number;
  readonly numMicrobatches: number;
  readonly virtualStages: number;
  readonly totalCycles: number;
  readonly computeCyclesPerStage: number;
  readonly bubbleCyclesPerStage: number;
  readonly bubbleFraction: number;
  readonly peakActivationsPerStage: number[];
  readonly events: readonly PipelineScheduleEvent[];
  readonly stageMemoryCurves: readonly (readonly number[])[]; // stage -> cycle -> microbatches in VRAM
}

export interface TensorParallelGEMMStep {
  readonly stepNumber: number;
  readonly name: string;
  readonly component:
    | "qkv_column"
    | "attn_core"
    | "out_row"
    | "mlp_gate_col"
    | "mlp_act"
    | "mlp_down_row"
    | "norm_residual";
  readonly operation: string;
  readonly equation: string;
  readonly inputShape: string;
  readonly weightShape: string;
  readonly outputShape: string;
  readonly communicationType:
    | "none"
    | "f_identity"
    | "g_allreduce"
    | "allgather_sp"
    | "reducescatter_sp";
  readonly commVolumeBytes: number;
  readonly description: string;
  readonly rankSlices: readonly {
    readonly rank: number;
    readonly weightSlice: string;
    readonly outputSlice: string;
    readonly partialSum: boolean;
  }[];
}

export interface TensorParallelTraceResult {
  readonly layerType: "mlp" | "attention" | "transformer_block";
  readonly tpDegree: number;
  readonly hiddenDim: number;
  readonly intermediateDim: number;
  readonly numHeads: number;
  readonly headsPerRank: number;
  readonly steps: readonly TensorParallelGEMMStep[];
  readonly totalCommBytesForward: number;
  readonly totalCommBytesBackward: number;
}

export interface SequenceParallelSavingsResult {
  readonly standardTpActivationMb: number;
  readonly megatronSpActivationMb: number;
  readonly deepspeedUlyssesActivationMb: number;
  readonly ringAttentionActivationMb: number;
  readonly savingsPctVsStandardTp: number;
  readonly maxSupportedSeqLenStandard: number;
  readonly maxSupportedSeqLenSP: number;
}

export interface DeviceMeshCoordinate {
  readonly globalRank: number;
  readonly dpRank: number;
  readonly ppRank: number;
  readonly cpRank: number;
  readonly tpRank: number;
  readonly epRank: number;
  readonly nodeIndex: number;
  readonly localGpuIndex: number;
}

export interface DeviceMeshMappingResult {
  readonly worldSize: number;
  readonly meshShape: {
    readonly dp: number;
    readonly pp: number;
    readonly cp: number;
    readonly tp: number;
  };
  readonly ranks: readonly DeviceMeshCoordinate[];
  readonly tpGroups: readonly (readonly number[])[];
  readonly ppGroups: readonly (readonly number[])[];
  readonly dpGroups: readonly (readonly number[])[];
  readonly cpGroups: readonly (readonly number[])[];
}

export interface ParallelPreset {
  readonly id: ParallelPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly model: ModelArchitectureConfig;
  readonly hardware: GpuHardwareSpec;
  readonly parallelism: ParallelismConfig;
  readonly targetMfu: number;
}

export interface PipelineTensorParallelStudioProps {
  readonly initialPreset?: ParallelPresetId;
  readonly initialTab?: StudioTabId;
  readonly className?: string;
  readonly title?: string;
}

// ============================================================================
// 2. HARDWARE SPECS & PRESETS
// ============================================================================

export const GPU_HARDWARE_SPECS: Record<string, GpuHardwareSpec> = {
  h100_sxm5: {
    id: "h100_sxm5",
    name: "NVIDIA H100 SXM5 80GB",
    vramGb: 80,
    bandwidthGbs: 3350,
    tflopsBf16: 989,
    tflopsFp8: 1978,
    memoryType: "HBM3",
    architecture: "Hopper",
    tdpWatts: 700,
    nvlinkBandwidthGbs: 900,
  },
  a100_sxm4: {
    id: "a100_sxm4",
    name: "NVIDIA A100 SXM4 80GB",
    vramGb: 80,
    bandwidthGbs: 2039,
    tflopsBf16: 312,
    tflopsFp8: 624,
    memoryType: "HBM2e",
    architecture: "Ampere",
    tdpWatts: 400,
    nvlinkBandwidthGbs: 600,
  },
  b200_sxm: {
    id: "b200_sxm",
    name: "NVIDIA B200 SXM 192GB",
    vramGb: 192,
    bandwidthGbs: 8000,
    tflopsBf16: 2250,
    tflopsFp8: 4500,
    memoryType: "HBM3e",
    architecture: "Blackwell",
    tdpWatts: 1000,
    nvlinkBandwidthGbs: 1800,
  },
  l40s: {
    id: "l40s",
    name: "NVIDIA L40S 48GB",
    vramGb: 48,
    bandwidthGbs: 864,
    tflopsBf16: 366,
    tflopsFp8: 733,
    memoryType: "GDDR6",
    architecture: "Ada Lovelace",
    tdpWatts: 350,
    nvlinkBandwidthGbs: 64, // PCIe Gen4
  },
  rtx_4090: {
    id: "rtx_4090",
    name: "NVIDIA RTX 4090 24GB",
    vramGb: 24,
    bandwidthGbs: 1008,
    tflopsBf16: 165,
    tflopsFp8: 330,
    memoryType: "GDDR6X",
    architecture: "Ada Lovelace",
    tdpWatts: 450,
    nvlinkBandwidthGbs: 32, // PCIe Gen4
  },
  mi300x: {
    id: "mi300x",
    name: "AMD Instinct MI300X 192GB",
    vramGb: 192,
    bandwidthGbs: 5300,
    tflopsBf16: 1300,
    tflopsFp8: 2600,
    memoryType: "HBM3",
    architecture: "CDNA 3",
    tdpWatts: 750,
    nvlinkBandwidthGbs: 896, // Infinity Fabric
  },
};

export const PARALLEL_PRESETS: Record<ParallelPresetId, ParallelPreset> = {
  llama3_8b_8x_h100: {
    id: "llama3_8b_8x_h100",
    name: "LLaMA-3-8B (8x H100)",
    subtitle: "Dense 8B • 1 Node • Pure DP / FSDP",
    description:
      "Standard single-node 8x H100 configuration for LLaMA-3-8B. Fits entirely on single GPU with DP=8, TP=1, PP=1.",
    model: {
      name: "LLaMA-3-8B",
      totalParamsB: 8.03,
      numLayers: 32,
      hiddenDim: 4096,
      intermediateDim: 14336,
      numAttentionHeads: 32,
      numKvHeads: 8,
      vocabSize: 128256,
      maxSeqLen: 8192,
    },
    hardware: GPU_HARDWARE_SPECS.h100_sxm5,
    parallelism: {
      dp: 8,
      tp: 1,
      pp: 1,
      cp: 1,
      ep: 1,
      microbatchSize: 2,
      globalBatchSize: 64,
      seqLen: 4096,
      virtualStages: 1,
      precision: "bf16",
      optimizer: "adamw_fp32",
      activationCheckpointing: "selective",
      zeroStage: "none",
      sequenceParallel: "none",
      useFlashAttention: true,
    },
    targetMfu: 0.52,
  },
  llama3_70b_64x_h100: {
    id: "llama3_70b_64x_h100",
    name: "LLaMA-3-70B (64x H100)",
    subtitle: "Dense 70B • 8 Nodes • 3D (TP4 x PP4 x DP4)",
    description:
      "Classic 3D Parallelism setup across 8 nodes. TP=4 (intra-node NVLink), PP=4 (inter-node 1F1B schedule), DP=4 with Sequence Parallelism.",
    model: {
      name: "LLaMA-3-70B",
      totalParamsB: 70.6,
      numLayers: 80,
      hiddenDim: 8192,
      intermediateDim: 28672,
      numAttentionHeads: 64,
      numKvHeads: 8,
      vocabSize: 128256,
      maxSeqLen: 8192,
    },
    hardware: GPU_HARDWARE_SPECS.h100_sxm5,
    parallelism: {
      dp: 4,
      tp: 4,
      pp: 4,
      cp: 1,
      ep: 1,
      microbatchSize: 1,
      globalBatchSize: 128,
      seqLen: 8192,
      virtualStages: 2,
      precision: "bf16",
      optimizer: "adamw_fp32",
      activationCheckpointing: "selective",
      zeroStage: "zero1",
      sequenceParallel: "megatron_sp",
      useFlashAttention: true,
    },
    targetMfu: 0.48,
  },
  llama3_405b_512x_h100: {
    id: "llama3_405b_512x_h100",
    name: "LLaMA-3-405B (512x H100)",
    subtitle: "Flagship 405B • 64 Nodes • Full 3D (TP8 x PP8 x DP8)",
    description:
      "Hyperscale cluster configuration with TP=8 (full 8-GPU NVLink domain), PP=8 with 1F1B-Interleaved (v=4), DP=8, and Sequence Parallelism.",
    model: {
      name: "LLaMA-3-405B",
      totalParamsB: 405.0,
      numLayers: 126,
      hiddenDim: 16384,
      intermediateDim: 53248,
      numAttentionHeads: 128,
      numKvHeads: 16,
      vocabSize: 128256,
      maxSeqLen: 8192,
    },
    hardware: GPU_HARDWARE_SPECS.h100_sxm5,
    parallelism: {
      dp: 8,
      tp: 8,
      pp: 8,
      cp: 1,
      ep: 1,
      microbatchSize: 1,
      globalBatchSize: 512,
      seqLen: 8192,
      virtualStages: 4,
      precision: "bf16",
      optimizer: "adamw_fp32",
      activationCheckpointing: "full",
      zeroStage: "zero1",
      sequenceParallel: "megatron_sp",
      useFlashAttention: true,
    },
    targetMfu: 0.44,
  },
  deepseek_v3_256x_h100: {
    id: "deepseek_v3_256x_h100",
    name: "DeepSeek-V3 671B MoE (256x H100)",
    subtitle: "MoE 671B • 32 Nodes • 4D (TP4 x PP4 x DP16 x EP16)",
    description:
      "Mixture of Experts architecture with Expert Parallelism (EP=16), TP=4, PP=4, DP=16 with DeepSpeed Ulysses Context Parallelism.",
    model: {
      name: "DeepSeek-V3",
      totalParamsB: 671.0,
      numLayers: 61,
      hiddenDim: 7168,
      intermediateDim: 18432,
      numAttentionHeads: 128,
      numKvHeads: 128,
      vocabSize: 129280,
      maxSeqLen: 4096,
      isMoE: true,
      numExperts: 256,
      topKExperts: 8,
    },
    hardware: GPU_HARDWARE_SPECS.h100_sxm5,
    parallelism: {
      dp: 16,
      tp: 4,
      pp: 4,
      cp: 1,
      ep: 16,
      microbatchSize: 1,
      globalBatchSize: 256,
      seqLen: 4096,
      virtualStages: 2,
      precision: "bf16",
      optimizer: "adamw_fp32",
      activationCheckpointing: "selective",
      zeroStage: "zero1",
      sequenceParallel: "deepspeed_ulysses",
      useFlashAttention: true,
    },
    targetMfu: 0.41,
  },
  gpt3_175b_64x_a100: {
    id: "gpt3_175b_64x_a100",
    name: "GPT-3-175B (64x A100)",
    subtitle: "Dense 175B • 8 Nodes • (TP8 x PP8 x DP1)",
    description:
      "Historical benchmark 175B parameter model trained across 64 A100 GPUs with Megatron-LM TP=8 and Megatron PP=8.",
    model: {
      name: "GPT-3-175B",
      totalParamsB: 175.0,
      numLayers: 96,
      hiddenDim: 12288,
      intermediateDim: 49152,
      numAttentionHeads: 96,
      numKvHeads: 96,
      vocabSize: 50257,
      maxSeqLen: 2048,
    },
    hardware: GPU_HARDWARE_SPECS.a100_sxm4,
    parallelism: {
      dp: 1,
      tp: 8,
      pp: 8,
      cp: 1,
      ep: 1,
      microbatchSize: 1,
      globalBatchSize: 64,
      seqLen: 2048,
      virtualStages: 1,
      precision: "fp16",
      optimizer: "adamw_fp32",
      activationCheckpointing: "full",
      zeroStage: "none",
      sequenceParallel: "none",
      useFlashAttention: false,
    },
    targetMfu: 0.46,
  },
  custom: {
    id: "custom",
    name: "Custom 3D Architecture",
    subtitle: "Fully Configurable Cluster & Model Dimensions",
    description:
      "Design and benchmark your custom Transformer model, cluster dimensions, precision formats, and pipeline scheduling strategies.",
    model: {
      name: "Custom Transformer",
      totalParamsB: 13.0,
      numLayers: 40,
      hiddenDim: 5120,
      intermediateDim: 13824,
      numAttentionHeads: 40,
      numKvHeads: 40,
      vocabSize: 32000,
      maxSeqLen: 4096,
    },
    hardware: GPU_HARDWARE_SPECS.h100_sxm5,
    parallelism: {
      dp: 4,
      tp: 2,
      pp: 2,
      cp: 1,
      ep: 1,
      microbatchSize: 2,
      globalBatchSize: 64,
      seqLen: 4096,
      virtualStages: 1,
      precision: "bf16",
      optimizer: "adamw_fp32",
      activationCheckpointing: "selective",
      zeroStage: "none",
      sequenceParallel: "megatron_sp",
      useFlashAttention: true,
    },
    targetMfu: 0.5,
  },
};

// ============================================================================
// 3. PURE COMPUTATIONAL ALGORITHMS & HELPERS
// ============================================================================

export function getBytesPerElement(precision: PrecisionFormat): number {
  switch (precision) {
    case "fp32":
      return 4;
    case "fp16":
    case "bf16":
      return 2;
    case "fp8":
      return 1;
    default:
      return 2;
  }
}

export function getOptimizerBytesPerParam(optimizer: OptimizerType): number {
  switch (optimizer) {
    case "adamw_fp32":
      // Master weight (4B) + Momentum (4B) + Variance (4B) = 12B per parameter
      return 12;
    case "adamw_8bit":
      // Master weight (2/4B) + 8-bit Momentum (1B) + 8-bit Variance (1B) ~ 6-8B
      return 6;
    case "sgd_momentum":
      // Master weight (4B) + Momentum (4B) = 8B
      return 8;
    case "sgd":
      // Master weight (4B) = 4B
      return 4;
    default:
      return 12;
  }
}

/**
 * Computes comprehensive 3D memory breakdown per GPU for weights, optimizer,
 * gradients, activations, KV cache, and transient communication buffers.
 */
export function calculate3DMemoryBreakdown(
  config: ModelArchitectureConfig,
  hardware: GpuHardwareSpec,
  parallelism: ParallelismConfig,
): MemoryBreakdownResult {
  const totalParams = config.totalParamsB * 1e9;
  const bpp = getBytesPerElement(parallelism.precision);
  const optBpp = getOptimizerBytesPerParam(parallelism.optimizer);
  const gradBpp = parallelism.precision === "fp32" ? 4 : 2;

  const tp = Math.max(1, parallelism.tp);
  const pp = Math.max(1, parallelism.pp);
  const dp = Math.max(1, parallelism.dp);
  const cp = Math.max(1, parallelism.cp);
  const ep = Math.max(1, parallelism.ep);

  // 1. Model Weights Memory (Bytes)
  // Sharded across TP (matrix columns/rows) and PP (layers).
  // If ZeRO-3 is active, parameters are further sharded across DP.
  const zero3Divisor = parallelism.zeroStage === "zero3" ? dp : 1;
  const moeWeightDivisor = config.isMoE && ep > 1 ? ep : 1;
  const weightShardingDivisor = tp * pp * zero3Divisor * (config.isMoE ? 1 : 1);
  const weightsBytes =
    (totalParams * bpp) /
    (weightShardingDivisor * (config.isMoE ? Math.sqrt(moeWeightDivisor) : 1));

  // 2. Optimizer States Memory (Bytes)
  // Sharded across TP and PP.
  // In ZeRO-1/2/3, optimizer states are sharded across DP.
  const zeroOptimDivisor = parallelism.zeroStage !== "none" ? dp : 1;
  const optimizerBytes = (totalParams * optBpp) / (tp * pp * zeroOptimDivisor);

  // 3. Gradients Memory (Bytes)
  // Sharded across TP and PP.
  // In ZeRO-2/3, gradients are sharded across DP.
  const zeroGradDivisor =
    parallelism.zeroStage === "zero2" || parallelism.zeroStage === "zero3" ? dp : 1;
  const gradientsBytes = (totalParams * gradBpp) / (tp * pp * zeroGradDivisor);

  // 4. Activations Memory (Bytes)
  // Per layer activation calculation
  const b = parallelism.microbatchSize;
  const s = parallelism.seqLen;
  const h = config.hiddenDim;
  const l = config.numLayers;
  const layersPerStage = Math.max(1, Math.ceil(l / pp));
  const spFactor = parallelism.sequenceParallel !== "none" ? tp * cp : cp;

  // Linear projections in attention + MLP per token
  // QKV + OutProj: (1 + 2*aKv/a + 1) * h
  const kvRatio = config.numKvHeads / Math.max(1, config.numAttentionHeads);
  const attnLinearPerToken = (2 + 2 * kvRatio) * h * bpp;
  // SwiGLU MLP: Gate + Up + Down = 3 * d_ffn
  const mlpLinearPerToken = (3 * config.intermediateDim + h) * bpp;
  // LayerNorms + Residuals
  const normPerToken = 4 * h * bpp;

  // With FlashAttention, O(s^2) attention matrix is kept in SRAM tile, not HBM
  const attnMatrixPerToken = parallelism.useFlashAttention
    ? 0
    : (s * config.numAttentionHeads * bpp) / spFactor;

  const perLayerTokensOnGpu = (b * s) / spFactor;
  const perLayerUncheckpointedBytes =
    perLayerTokensOnGpu *
    ((attnLinearPerToken + mlpLinearPerToken) / tp +
      normPerToken / (parallelism.sequenceParallel === "megatron_sp" ? tp : 1) +
      attnMatrixPerToken);

  // Calculate microbatch multiplier based on Pipeline schedule
  let microbatchesInFlight = 1;
  if (pp > 1) {
    if (parallelism.virtualStages > 1) {
      microbatchesInFlight = Math.max(1, Math.ceil(pp / parallelism.virtualStages) + 1);
    } else {
      microbatchesInFlight = pp;
    }
  }

  let totalActivationBytes = 0;
  switch (parallelism.activationCheckpointing) {
    case "full":
      // Stores only the input activation tensor per transformer block: 1 * b * s * h * bpp / spFactor
      totalActivationBytes =
        microbatchesInFlight * layersPerStage * (perLayerTokensOnGpu * h * bpp);
      break;
    case "selective":
      // Recomputes non-GEMM cheap ops, stores GEMM inputs (~40% of uncheckpointed)
      totalActivationBytes =
        microbatchesInFlight * layersPerStage * (perLayerUncheckpointedBytes * 0.4);
      break;
    case "none":
    default:
      totalActivationBytes = microbatchesInFlight * layersPerStage * perLayerUncheckpointedBytes;
      break;
  }

  // 5. KV Cache Memory (Bytes)
  // 2 * b * s * h * (aKv / a) * layersPerStage * bpp / tp
  const kvRatioSafe = Number.isFinite(kvRatio) && kvRatio > 0 ? kvRatio : 1;
  const kvCacheBytes = (2 * b * s * h * kvRatioSafe * layersPerStage * bpp) / (tp * cp);

  // 6. Working / Transient Buffer
  // For ZeRO-3 parameter gathering & all-reduce scratchpads
  const workingBufferBytes =
    parallelism.zeroStage === "zero3" ? 2 * (totalParams / l) * bpp : (b * s * h * bpp * 2) / tp;

  // Convert all to Gigabytes (GB)
  const toGb = (bytes: number) => bytes / (1024 * 1024 * 1024);
  const weightsGb = toGb(weightsBytes);
  const optimizerGb = toGb(optimizerBytes);
  const gradientsGb = toGb(gradientsBytes);
  const activationsGb = toGb(totalActivationBytes);
  const kvCacheGb = toGb(kvCacheBytes);
  const workingBufferGb = toGb(workingBufferBytes);

  const totalGb =
    weightsGb + optimizerGb + gradientsGb + activationsGb + kvCacheGb + workingBufferGb;
  const maxVramGb = hardware.vramGb;
  const isOOM = totalGb > maxVramGb;
  const oomDeficitGb = isOOM ? totalGb - maxVramGb : 0;
  const freeGb = Math.max(0, maxVramGb - totalGb);

  const safeTotal = Math.max(0.001, totalGb);
  const breakdownPct = {
    weights: (weightsGb / safeTotal) * 100,
    optimizer: (optimizerGb / safeTotal) * 100,
    gradients: (gradientsGb / safeTotal) * 100,
    activations: (activationsGb / safeTotal) * 100,
    kvCache: (kvCacheGb / safeTotal) * 100,
    workingBuffer: (workingBufferGb / safeTotal) * 100,
  };

  return {
    weightsGb,
    optimizerGb,
    gradientsGb,
    activationsGb,
    kvCacheGb,
    workingBufferGb,
    totalGb,
    freeGb,
    maxVramGb,
    isOOM,
    oomDeficitGb,
    breakdownPct,
  };
}

/**
 * Computes theoretical bubble fraction for GPipe, 1F1B, and 1F1B-Interleaved.
 */
export function computeBubbleFraction(
  pipelineType: PipelineType,
  numStages: number,
  numMicrobatches: number,
  virtualStages = 1,
  forwardTime = 1,
  backwardTime = 2,
): {
  readonly bubbleFraction: number;
  readonly totalExecutionTime: number;
  readonly idealExecutionTime: number;
  readonly bubbleTime: number;
} {
  const p = Math.max(1, numStages);
  const m = Math.max(1, numMicrobatches);
  const v = Math.max(1, virtualStages);
  const tf = Math.max(0.1, forwardTime);
  const tb = Math.max(0.1, backwardTime);

  const idealExecutionTime = m * (tf + tb);

  if (p === 1) {
    return {
      bubbleFraction: 0,
      totalExecutionTime: idealExecutionTime,
      idealExecutionTime,
      bubbleTime: 0,
    };
  }

  let bubbleTime = 0;
  let totalExecutionTime = idealExecutionTime;

  switch (pipelineType) {
    case "gpipe":
      // GPipe bubble time = (p - 1) * (tf + tb)
      bubbleTime = (p - 1) * (tf + tb);
      totalExecutionTime = idealExecutionTime + bubbleTime;
      break;

    case "1f1b":
      // 1F1B bubble time = (p - 1) * (tf + tb)
      bubbleTime = (p - 1) * (tf + tb);
      totalExecutionTime = idealExecutionTime + bubbleTime;
      break;

    case "1f1b_interleaved":
      // 1F1B-Interleaved reduces bubble by factor of v: (p - 1) * (tf + tb) / v
      bubbleTime = ((p - 1) * (tf + tb)) / v;
      totalExecutionTime = idealExecutionTime + bubbleTime;
      break;
  }

  const bubbleFraction = totalExecutionTime > 0 ? bubbleTime / totalExecutionTime : 0;

  return {
    bubbleFraction,
    totalExecutionTime,
    idealExecutionTime,
    bubbleTime,
  };
}

/**
 * Generates exact step-by-step Gantt schedule events, cycle timestamps, and stage
 * activation memory curves for GPipe, 1F1B, and 1F1B-Interleaved.
 */
export function generatePipelineSchedule(
  pipelineType: PipelineType,
  numStages: number,
  numMicrobatches: number,
  virtualStages = 1,
  forwardTime = 1,
  backwardTime = 2,
  commTime = 0,
): PipelineScheduleResult {
  const p = Math.max(1, numStages);
  const m = Math.max(1, numMicrobatches);
  const v = Math.max(1, virtualStages);

  // Microbatch distinct colors (accessible 12-palette)
  const mbColors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#14b8a6", // teal
    "#6366f1", // indigo
    "#84cc16", // lime
    "#d946ef", // fuchsia
    "#64748b", // slate
  ];

  const getColor = (mbId: number) => mbColors[mbId % mbColors.length] ?? "#3b82f6";

  const events: PipelineScheduleEvent[] = [];

  if (pipelineType === "gpipe" || (pipelineType === "1f1b_interleaved" && v === 1) || p === 1) {
    if (pipelineType === "gpipe" || p === 1) {
      // -------------------------------------------------------------
      // GPipe Schedule Implementation
      // -------------------------------------------------------------
      // Forward phase: For each stage s from 0 to p-1, run F0..F(m-1)
      for (let stage = 0; stage < p; stage++) {
        for (let mb = 0; mb < m; mb++) {
          const startCycle = stage * forwardTime + mb * forwardTime;
          events.push({
            id: `f_${stage}_${mb}`,
            stageId: stage,
            virtualStageId: 0,
            microbatchId: mb,
            type: "forward",
            startCycle,
            duration: forwardTime,
            endCycle: startCycle + forwardTime,
            label: `F${mb + 1}`,
            color: getColor(mb),
          });
        }
      }

      // Backward phase: Starts after last forward on stage p-1 finishes: (p - 1 + m) * forwardTime
      const lastForwardEnd = (p - 1 + m) * forwardTime;
      for (let stage = p - 1; stage >= 0; stage--) {
        const stageOffsetFromEnd = (p - 1 - stage) * backwardTime;
        for (let mb = 0; mb < m; mb++) {
          const startCycle = lastForwardEnd + stageOffsetFromEnd + mb * backwardTime;
          events.push({
            id: `b_${stage}_${mb}`,
            stageId: stage,
            virtualStageId: 0,
            microbatchId: mb,
            type: "backward",
            startCycle,
            duration: backwardTime,
            endCycle: startCycle + backwardTime,
            label: `B${mb + 1}`,
            color: getColor(mb),
          });
        }
      }
    } else {
      // -------------------------------------------------------------
      // Standard 1F1B Schedule Implementation (v = 1)
      // -------------------------------------------------------------
      // Stage s warmup forwards: p - 1 - s
      const stageNextAvailableCycle: number[] = new Array(p).fill(0);
      const forwardCompletionCycle: number[][] = Array.from({ length: p }, () =>
        new Array(m).fill(0),
      );
      const backwardCompletionCycle: number[][] = Array.from({ length: p }, () =>
        new Array(m).fill(0),
      );

      // Warmup forwards
      for (let stage = 0; stage < p; stage++) {
        const warmupCount = Math.min(m, p - stage);
        for (let mb = 0; mb < warmupCount; mb++) {
          const prevStageReady =
            stage === 0 ? 0 : (forwardCompletionCycle[stage - 1]?.[mb] ?? 0) + commTime;
          const start = Math.max(stageNextAvailableCycle[stage] ?? 0, prevStageReady);
          const end = start + forwardTime;
          if (forwardCompletionCycle[stage]) {
            forwardCompletionCycle[stage][mb] = end;
          }
          stageNextAvailableCycle[stage] = end;

          events.push({
            id: `f_${stage}_${mb}`,
            stageId: stage,
            virtualStageId: 0,
            microbatchId: mb,
            type: "forward",
            startCycle: start,
            duration: forwardTime,
            endCycle: end,
            label: `F${mb + 1}`,
            color: getColor(mb),
          });
        }
      }

      // 1F1B Steady state & cooldown
      for (let stage = p - 1; stage >= 0; stage--) {
        const warmupCount = Math.min(m, p - stage);
        let completedBackwards = 0;
        let scheduledForwards = warmupCount;

        while (completedBackwards < m) {
          const mbToBack = completedBackwards;
          // Check when backward data is ready from downstream stage (stage + 1)
          const downStageReady =
            stage === p - 1
              ? (forwardCompletionCycle[stage]?.[mbToBack] ?? 0)
              : (backwardCompletionCycle[stage + 1]?.[mbToBack] ?? 0) + commTime;

          const bStart = Math.max(stageNextAvailableCycle[stage] ?? 0, downStageReady);
          const bEnd = bStart + backwardTime;
          if (backwardCompletionCycle[stage]) {
            backwardCompletionCycle[stage][mbToBack] = bEnd;
          }
          stageNextAvailableCycle[stage] = bEnd;

          events.push({
            id: `b_${stage}_${mbToBack}`,
            stageId: stage,
            virtualStageId: 0,
            microbatchId: mbToBack,
            type: "backward",
            startCycle: bStart,
            duration: backwardTime,
            endCycle: bEnd,
            label: `B${mbToBack + 1}`,
            color: getColor(mbToBack),
          });
          completedBackwards++;

          // Schedule next forward if any remain
          if (scheduledForwards < m) {
            const mbToFwd = scheduledForwards;
            const prevStageReady =
              stage === 0 ? 0 : (forwardCompletionCycle[stage - 1]?.[mbToFwd] ?? 0) + commTime;
            const fStart = Math.max(stageNextAvailableCycle[stage] ?? 0, prevStageReady);
            const fEnd = fStart + forwardTime;
            if (forwardCompletionCycle[stage]) {
              forwardCompletionCycle[stage][mbToFwd] = fEnd;
            }
            stageNextAvailableCycle[stage] = fEnd;

            events.push({
              id: `f_${stage}_${mbToFwd}`,
              stageId: stage,
              virtualStageId: 0,
              microbatchId: mbToFwd,
              type: "forward",
              startCycle: fStart,
              duration: forwardTime,
              endCycle: fEnd,
              label: `F${mbToFwd + 1}`,
              color: getColor(mbFwdColor(mbToFwd)),
            });
            scheduledForwards++;
          }
        }
      }
    }
  } else {
    // -------------------------------------------------------------
    // 1F1B-Interleaved Schedule Implementation (v > 1)
    // -------------------------------------------------------------
    const totalVirtualStages = p * v;
    const stageNextAvailableCycle: number[] = new Array(p).fill(0);
    // Track completions per virtual stage: [vStage][mb]
    const fwdVCompletion: number[][] = Array.from({ length: totalVirtualStages }, () =>
      new Array(m).fill(0),
    );
    const bwdVCompletion: number[][] = Array.from({ length: totalVirtualStages }, () =>
      new Array(m).fill(0),
    );

    // Warmup across virtual stages
    for (let vs = 0; vs < totalVirtualStages; vs++) {
      const physicalStage = vs % p;
      const vChunk = Math.floor(vs / p);
      const warmupFwds = Math.min(m, 2);

      for (let mb = 0; mb < warmupFwds; mb++) {
        const prevVsReady = vs === 0 ? 0 : (fwdVCompletion[vs - 1]?.[mb] ?? 0) + commTime;
        const start = Math.max(stageNextAvailableCycle[physicalStage] ?? 0, prevVsReady);
        const end = start + forwardTime;
        if (fwdVCompletion[vs]) {
          fwdVCompletion[vs][mb] = end;
        }
        stageNextAvailableCycle[physicalStage] = end;

        events.push({
          id: `f_${physicalStage}_v${vChunk}_${mb}`,
          stageId: physicalStage,
          virtualStageId: vChunk,
          microbatchId: mb,
          type: "forward",
          startCycle: start,
          duration: forwardTime,
          endCycle: end,
          label: `F${mb + 1}v${vChunk}`,
          color: getColor(mb),
        });
      }
    }

    // Steady state: alternate backwards and forwards across virtual stages
    for (let vs = totalVirtualStages - 1; vs >= 0; vs--) {
      const physicalStage = vs % p;
      const vChunk = Math.floor(vs / p);

      for (let mb = 0; mb < m; mb++) {
        // Schedule backward
        const downVsReady =
          vs === totalVirtualStages - 1
            ? (fwdVCompletion[vs]?.[mb] ?? 0)
            : (bwdVCompletion[vs + 1]?.[mb] ?? 0) + commTime;

        const bStart = Math.max(stageNextAvailableCycle[physicalStage] ?? 0, downVsReady);
        const bEnd = bStart + backwardTime;
        if (bwdVCompletion[vs]) {
          bwdVCompletion[vs][mb] = endBwdTime(bStart, backwardTime);
        }
        stageNextAvailableCycle[physicalStage] = bEnd;

        events.push({
          id: `b_${physicalStage}_v${vChunk}_${mb}`,
          stageId: physicalStage,
          virtualStageId: vChunk,
          microbatchId: mb,
          type: "backward",
          startCycle: bStart,
          duration: backwardTime,
          endCycle: bEnd,
          label: `B${mb + 1}v${vChunk}`,
          color: getColor(mb),
        });

        // If this virtual stage has remaining forwards, schedule them
        if (mb + 2 < m) {
          const nextMb = mb + 2;
          const prevVsReady = vs === 0 ? 0 : (fwdVCompletion[vs - 1]?.[nextMb] ?? 0) + commTime;
          const fStart = Math.max(stageNextAvailableCycle[physicalStage] ?? 0, prevVsReady);
          const fEnd = fStart + forwardTime;
          if (fwdVCompletion[vs]) {
            fwdVCompletion[vs][nextMb] = fEnd;
          }
          stageNextAvailableCycle[physicalStage] = fEnd;

          events.push({
            id: `f_${physicalStage}_v${vChunk}_${nextMb}`,
            stageId: physicalStage,
            virtualStageId: vChunk,
            microbatchId: nextMb,
            type: "forward",
            startCycle: fStart,
            duration: forwardTime,
            endCycle: fEnd,
            label: `F${nextMb + 1}v${vChunk}`,
            color: getColor(nextMb),
          });
        }
      }
    }
  }

  function mbFwdColor(mb: number) {
    return mb;
  }

  function endBwdTime(start: number, dur: number) {
    return start + dur;
  }

  // Sort events chronologically by startCycle
  events.sort((a, b) => a.startCycle - b.startCycle);

  const totalCycles = events.reduce((max, ev) => Math.max(max, ev.endCycle), 0);
  const computeCyclesPerStage = m * (forwardTime + backwardTime);
  const bubbleCyclesPerStage = Math.max(0, totalCycles - computeCyclesPerStage);
  const bubbleFraction = totalCycles > 0 ? bubbleCyclesPerStage / totalCycles : 0;

  // Build stage activation memory curves over time (0..totalCycles)
  const stageMemoryCurves: number[][] = Array.from({ length: p }, () =>
    new Array(totalCycles + 1).fill(0),
  );
  const peakActivationsPerStage: number[] = new Array(p).fill(0);

  for (let stage = 0; stage < p; stage++) {
    const stageEvents = events.filter((e) => e.stageId === stage);
    let activeMicrobatches = 0;
    const mbActiveSet = new Set<number>();

    for (let c = 0; c <= totalCycles; c++) {
      // Check which events started or ended at cycle c
      for (const ev of stageEvents) {
        if (ev.type === "forward" && ev.endCycle === c) {
          mbActiveSet.add(ev.microbatchId);
        }
        if (ev.type === "backward" && ev.endCycle === c) {
          mbActiveSet.delete(ev.microbatchId);
        }
      }
      activeMicrobatches = mbActiveSet.size;
      if (stageMemoryCurves[stage]) {
        stageMemoryCurves[stage][c] = activeMicrobatches;
      }
      peakActivationsPerStage[stage] = Math.max(
        peakActivationsPerStage[stage] ?? 0,
        activeMicrobatches,
      );
    }
  }

  return {
    pipelineType,
    numStages: p,
    numMicrobatches: m,
    virtualStages: v,
    totalCycles,
    computeCyclesPerStage,
    bubbleCyclesPerStage,
    bubbleFraction,
    peakActivationsPerStage,
    events,
    stageMemoryCurves,
  };
}

/**
 * Computes communication volume breakdown (in Bytes) per training step across
 * TP, PP, DP, SP, CP, and EP.
 */
export function computeCommunicationVolume(
  config: ModelArchitectureConfig,
  parallelism: ParallelismConfig,
  microbatchSize: number,
  seqLen: number,
): CommunicationVolumeResult {
  const bpp = getBytesPerElement(parallelism.precision);
  const tp = Math.max(1, parallelism.tp);
  const pp = Math.max(1, parallelism.pp);
  const dp = Math.max(1, parallelism.dp);
  const cp = Math.max(1, parallelism.cp);
  const ep = Math.max(1, parallelism.ep);
  const numLayers = config.numLayers;
  const layersPerStage = Math.max(1, Math.ceil(numLayers / pp));
  const hiddenDim = config.hiddenDim;
  const totalParams = config.totalParamsB * 1e9;
  const numMicrobatches = Math.max(
    1,
    Math.round(parallelism.globalBatchSize / (microbatchSize * dp)),
  );

  // 1. TP Volume per layer:
  // Standard Megatron TP: 2 All-Reduces in forward (Attn Out + MLP Down) and 2 in backward.
  // Ring All-Reduce volume per layer = 4 * (2 * (tp - 1) / tp) * (b * s * h * bpp)
  const tpRingFactor = tp > 1 ? (2 * (tp - 1)) / tp : 0;
  const tpVolumeBytesPerLayer =
    tp > 1 ? 4 * tpRingFactor * microbatchSize * seqLen * hiddenDim * bpp : 0;

  // 2. PP Volume per microbatch:
  // Point-to-point boundary transfers: Forward activation send + Backward gradient send
  const ppVolumeBytesPerMicrobatch = pp > 1 ? 2 * microbatchSize * seqLen * hiddenDim * bpp : 0;

  // 3. DP Volume per training step:
  // Gradient synchronization across DP ranks:
  // Standard All-Reduce = 2 * (dp - 1) / dp * (Total Params / (tp * pp)) * gradBpp
  const gradBpp = parallelism.precision === "fp32" ? 4 : 2;
  const dpRingFactor = dp > 1 ? (2 * (dp - 1)) / dp : 0;
  const dpVolumeBytesPerStep = dp > 1 ? dpRingFactor * (totalParams / (tp * pp)) * gradBpp : 0;

  // 4. SP Volume per layer:
  // Megatron SP replaces All-Reduce with 1 Reduce-Scatter + 1 All-Gather per forward & backward.
  // Communication volume is identical to standard TP, but memory is saved.
  const spVolumeBytesPerLayer =
    parallelism.sequenceParallel === "megatron_sp" && tp > 1 ? tpVolumeBytesPerLayer : 0;

  // 5. CP Context Parallel Volume (e.g. Ring Attention / Ulysses)
  const cpVolumeBytesPerStep =
    cp > 1
      ? 2 *
        numMicrobatches *
        layersPerStage *
        ((2 * (cp - 1)) / cp) *
        microbatchSize *
        seqLen *
        hiddenDim *
        bpp
      : 0;

  // 6. EP Expert Parallel Volume (MoE All-to-All dispatch & combine)
  const epVolumeBytesPerStep =
    config.isMoE && ep > 1
      ? 2 *
        numMicrobatches *
        layersPerStage *
        (config.topKExperts ?? 2) *
        microbatchSize *
        seqLen *
        hiddenDim *
        bpp *
        ((ep - 1) / ep)
      : 0;

  // Total volume per step per GPU
  const totalVolumeBytesPerStep =
    numMicrobatches * layersPerStage * tpVolumeBytesPerLayer +
    numMicrobatches * ppVolumeBytesPerMicrobatch +
    dpVolumeBytesPerStep +
    cpVolumeBytesPerStep +
    epVolumeBytesPerStep;

  // Bandwidth requirements (assuming typical 500ms step time)
  const stepDurationSec = 0.5;
  const toGbs = (bytes: number) => (bytes * 8) / (stepDurationSec * 1e9);

  return {
    tpVolumeBytesPerLayer,
    ppVolumeBytesPerMicrobatch,
    dpVolumeBytesPerStep,
    spVolumeBytesPerLayer,
    cpVolumeBytesPerStep,
    epVolumeBytesPerStep,
    totalVolumeBytesPerStep,
    tpBandwidthRequiredGbs: toGbs(numMicrobatches * layersPerStage * tpVolumeBytesPerLayer),
    ppBandwidthRequiredGbs: toGbs(numMicrobatches * ppVolumeBytesPerMicrobatch),
    dpBandwidthRequiredGbs: toGbs(dpVolumeBytesPerStep),
  };
}

/**
 * Computes theoretical FLOPs, MFU (Model FLOPs Utilization), HFU, and token throughput.
 */
export function computeMFUAndThroughput(
  config: ModelArchitectureConfig,
  hardware: GpuHardwareSpec,
  parallelism: ParallelismConfig,
  stepTimeMs = 600,
): MFUThroughputResult {
  const totalParams = config.totalParamsB * 1e9;
  const s = parallelism.seqLen;
  const l = config.numLayers;
  const h = config.hiddenDim;
  const dp = Math.max(1, parallelism.dp);
  const tp = Math.max(1, parallelism.tp);
  const pp = Math.max(1, parallelism.pp);
  const cp = Math.max(1, parallelism.cp);
  const ep = Math.max(1, parallelism.ep);

  const totalGpus = dp * tp * pp * cp * (config.isMoE ? Math.max(1, ep / dp) : 1);
  const globalBatchSize = parallelism.globalBatchSize;
  const tokensPerStep = globalBatchSize * s;

  // Theoretical training FLOPs per token:
  // Dense GEMMs = 6 * totalParams (2 for forward + 4 for backward / weight gradients)
  // Attention quadratic FLOPs = 12 * l * h * s (for QK^T and Softmax*V forward & backward)
  const flopsPerToken = 6 * totalParams + 12 * l * h * s;
  const totalFlopsPerStep = flopsPerToken * tokensPerStep;

  const stepTimeSec = Math.max(0.01, stepTimeMs / 1000);
  const achievedTotalTflops = totalFlopsPerStep / (stepTimeSec * 1e12);
  const achievedTflopsPerGpu = achievedTotalTflops / Math.max(1, totalGpus);

  const peakTflopsBf16 = hardware.tflopsBf16;
  const mfuPct = Math.min(100, Math.max(0, (achievedTflopsPerGpu / peakTflopsBf16) * 100));
  // HFU accounts for activation recomputation overhead
  const recomputeMultiplier =
    parallelism.activationCheckpointing === "full"
      ? 1.33
      : parallelism.activationCheckpointing === "selective"
        ? 1.12
        : 1.0;
  const hfuPct = Math.min(100, mfuPct * recomputeMultiplier);

  const totalClusterTokensPerSec = tokensPerStep / stepTimeSec;
  const tokensPerSecPerGpu = totalClusterTokensPerSec / Math.max(1, totalGpus);

  return {
    flopsPerToken,
    totalFlopsPerStep,
    tokensPerStep,
    stepTimeMs,
    achievedTflopsPerGpu,
    mfuPct,
    hfuPct,
    tokensPerSecPerGpu,
    totalClusterTokensPerSec,
  };
}

/**
 * Computes Megatron-LM Column & Row GEMM Slicing trace across MLP and Self-Attention.
 */
export function computeTensorParallelGEMMTrace(
  layerType: "mlp" | "attention" | "transformer_block",
  hiddenDim: number,
  intermediateDim: number,
  numHeads: number,
  tpDegree: number,
  seqLen = 2048,
  batchSize = 2,
): TensorParallelTraceResult {
  const tp = Math.max(1, tpDegree);
  const h = hiddenDim;
  const dFfn = intermediateDim;
  const b = batchSize;
  const s = seqLen;
  const totalTokens = b * s;
  const headsPerRank = Math.max(1, Math.floor(numHeads / tp));
  const headDim = Math.floor(h / numHeads);

  const steps: TensorParallelGEMMStep[] = [];
  let totalCommBytesForward = 0;
  let totalCommBytesBackward = 0;

  if (layerType === "attention" || layerType === "transformer_block") {
    // 1. QKV Column Parallel GEMM
    const qkvOutDimPerRank = 3 * headsPerRank * headDim;
    const qkvRankSlices = Array.from({ length: tp }, (_, r) => ({
      rank: r,
      weightSlice: `W_QKV[:, ${r * qkvOutDimPerRank} : ${(r + 1) * qkvOutDimPerRank}]`,
      outputSlice: `[${totalTokens}, ${qkvOutDimPerRank}] (Heads ${r * headsPerRank}..${(r + 1) * headsPerRank - 1})`,
      partialSum: false,
    }));

    steps.push({
      stepNumber: 1,
      name: "QKV Projection (Column-Parallel GEMM)",
      component: "qkv_column",
      operation: "X · W_QKV",
      equation:
        "Y_i = X \\cdot W_{QKV}^{(i)}, \\quad W_{QKV}^{(i)} \\in \\mathbb{R}^{h \\times \\frac{3h}{TP}}",
      inputShape: `[${totalTokens}, ${h}]`,
      weightShape: `[${h}, ${(3 * h) / tp}]`,
      outputShape: `[${totalTokens}, ${(3 * h) / tp}]`,
      communicationType: "f_identity",
      commVolumeBytes: 0,
      description:
        "Input X is copied to all TP ranks (f is Identity). Weight matrix W_QKV is sliced column-wise. Each rank computes Q, K, V for its local heads without communication.",
      rankSlices: qkvRankSlices,
    });

    // 2. Attention Core (Local Softmax & Context)
    const attnRankSlices = Array.from({ length: tp }, (_, r) => ({
      rank: r,
      weightSlice: `None (Compute Core)`,
      outputSlice: `[${b}, ${headsPerRank}, ${s}, ${headDim}]`,
      partialSum: false,
    }));

    steps.push({
      stepNumber: 2,
      name: "Local Self-Attention Core",
      component: "attn_core",
      operation: "Softmax(Q_i · K_i^T / √d_k) · V_i",
      equation:
        "A_i = \\text{Softmax}\\left(\\frac{Q_i K_i^T}{\\sqrt{d_k}}\\right) V_i \\quad (\\text{Heads } i)",
      inputShape: `[${b}, ${headsPerRank}, ${s}, ${headDim}]`,
      weightShape: `None (Pure tensor algebra)`,
      outputShape: `[${totalTokens}, ${h / tp}]`,
      communicationType: "none",
      commVolumeBytes: 0,
      description:
        "Each rank evaluates multi-head self-attention independently over its local heads. No inter-GPU communication is required.",
      rankSlices: attnRankSlices,
    });

    // 3. Out-Projection (Row-Parallel GEMM + g All-Reduce)
    const outCommBytes = 2 * ((2 * (tp - 1)) / tp) * totalTokens * h * 2;
    totalCommBytesForward += tp > 1 ? outCommBytes / 2 : 0;
    totalCommBytesBackward += tp > 1 ? outCommBytes / 2 : 0;

    const outRankSlices = Array.from({ length: tp }, (_, r) => ({
      rank: r,
      weightSlice: `W_O[${r * (h / tp)} : ${(r + 1) * (h / tp)}, :]`,
      outputSlice: `[${totalTokens}, ${h}] (Partial sum on rank ${r})`,
      partialSum: true,
    }));

    steps.push({
      stepNumber: 3,
      name: "Out-Projection & All-Reduce (Row-Parallel GEMM)",
      component: "out_row",
      operation: "All-Reduce( ∑_i A_i · W_O^{(i)} )",
      equation:
        "Z = g\\left( \\sum_{i=0}^{TP-1} A_i W_O^{(i)} \\right) = \\text{All-Reduce-Sum}(Z_i)",
      inputShape: `[${totalTokens}, ${h / tp}]`,
      weightShape: `[${h / tp}, ${h}]`,
      outputShape: `[${totalTokens}, ${h}]`,
      communicationType: "g_allreduce",
      commVolumeBytes: outCommBytes,
      description:
        "Weight matrix W_O is partitioned row-wise. Each rank produces a partial output. The g operator executes an All-Reduce (Sum) across TP ranks to reconstruct the full output.",
      rankSlices: outRankSlices,
    });
  }

  if (layerType === "mlp" || layerType === "transformer_block") {
    const baseStep = steps.length + 1;
    // 4. MLP Gate & Up Projection (Column-Parallel GEMM)
    const mlpColRankSlices = Array.from({ length: tp }, (_, r) => ({
      rank: r,
      weightSlice: `W_1[:, ${r * (dFfn / tp)} : ${(r + 1) * (dFfn / tp)}]`,
      outputSlice: `[${totalTokens}, ${dFfn / tp}]`,
      partialSum: false,
    }));

    steps.push({
      stepNumber: baseStep,
      name: "MLP Gate & Up Projection (Column-Parallel GEMM)",
      component: "mlp_gate_col",
      operation: "X · W_gate and X · W_up",
      equation:
        "H_i = \\sigma(X W_{\\text{gate}}^{(i)}) \\odot (X W_{\\text{up}}^{(i)}), \\quad W_1^{(i)} \\in \\mathbb{R}^{h \\times \\frac{d_{\\text{ffn}}}{TP}}",
      inputShape: `[${totalTokens}, ${h}]`,
      weightShape: `[${h}, ${dFfn / tp}]`,
      outputShape: `[${totalTokens}, ${dFfn / tp}]`,
      communicationType: "f_identity",
      commVolumeBytes: 0,
      description:
        "Input X is fed into column-partitioned intermediate matrices W_gate and W_up. Output is sharded along the hidden intermediate dimension.",
      rankSlices: mlpColRankSlices,
    });

    // 5. Activation Intermediate
    const mlpActRankSlices = Array.from({ length: tp }, (_, r) => ({
      rank: r,
      weightSlice: `None`,
      outputSlice: `[${totalTokens}, ${dFfn / tp}]`,
      partialSum: false,
    }));

    steps.push({
      stepNumber: baseStep + 1,
      name: "Local SwiGLU / GeLU Activation",
      component: "mlp_act",
      operation: "SwiGLU(Gate, Up)",
      equation: "U_i = \\text{SiLU}(Gate_i) \\odot Up_i",
      inputShape: `[${totalTokens}, ${dFfn / tp}]`,
      weightShape: `None`,
      outputShape: `[${totalTokens}, ${dFfn / tp}]`,
      communicationType: "none",
      commVolumeBytes: 0,
      description:
        "Pointwise non-linear activation computed locally on each rank's intermediate partition without inter-rank communication.",
      rankSlices: mlpActRankSlices,
    });

    // 6. MLP Down Projection (Row-Parallel GEMM + g All-Reduce)
    const mlpCommBytes = 2 * ((2 * (tp - 1)) / tp) * totalTokens * h * 2;
    totalCommBytesForward += tp > 1 ? mlpCommBytes / 2 : 0;
    totalCommBytesBackward += tp > 1 ? mlpCommBytes / 2 : 0;

    const mlpDownRankSlices = Array.from({ length: tp }, (_, r) => ({
      rank: r,
      weightSlice: `W_2[${r * (dFfn / tp)} : ${(r + 1) * (dFfn / tp)}, :]`,
      outputSlice: `[${totalTokens}, ${h}] (Partial sum on rank ${r})`,
      partialSum: true,
    }));

    steps.push({
      stepNumber: baseStep + 2,
      name: "MLP Down-Projection & All-Reduce (Row-Parallel GEMM)",
      component: "mlp_down_row",
      operation: "All-Reduce( ∑_i U_i · W_2^{(i)} )",
      equation:
        "Y_{\\text{mlp}} = g\\left( \\sum_{i=0}^{TP-1} U_i W_2^{(i)} \\right) = \\text{All-Reduce-Sum}(Y_i)",
      inputShape: `[${totalTokens}, ${dFfn / tp}]`,
      weightShape: `[${dFfn / tp}, ${h}]`,
      outputShape: `[${totalTokens}, ${h}]`,
      communicationType: "g_allreduce",
      commVolumeBytes: mlpCommBytes,
      description:
        "Weight matrix W_2 is partitioned row-wise. Each rank multiplies local intermediate activation by its row slice, yielding a partial sum. The g operator executes All-Reduce (Sum).",
      rankSlices: mlpDownRankSlices,
    });
  }

  return {
    layerType,
    tpDegree: tp,
    hiddenDim: h,
    intermediateDim: dFfn,
    numHeads,
    headsPerRank,
    steps,
    totalCommBytesForward,
    totalCommBytesBackward,
  };
}

/**
 * Computes Sequence Parallelism memory savings comparison (Megatron SP vs Ulysses vs Ring Attention).
 */
export function computeSequenceParallelSavings(
  hiddenDim: number,
  seqLen: number,
  batchSize: number,
  numLayers: number,
  tpDegree: number,
  withCheckpointing = false,
): SequenceParallelSavingsResult {
  const b = batchSize;
  const s = seqLen;
  const h = hiddenDim;
  const l = numLayers;
  const tp = Math.max(1, tpDegree);
  const bpp = 2; // BF16

  // In standard Megatron TP, LayerNorm & Dropout activations are duplicated on all TP ranks:
  // Standard TP Activation = L * b * s * (10 * h / tp + 4 * h) * bpp
  const standardBytes =
    l * b * s * ((10 * h) / tp + 4 * h) * bpp * (withCheckpointing ? 0.35 : 1.0);

  // In Megatron SP, LayerNorm & Dropout activations are also sharded by TP:
  // Megatron SP Activation = L * b * s * (14 * h / tp) * bpp
  const megatronSpBytes = l * b * s * ((14 * h) / tp) * bpp * (withCheckpointing ? 0.35 : 1.0);

  // DeepSpeed Ulysses converts sequence to head sharding:
  // Memory per GPU = L * (b * (s / tp) * h * 14 * bpp)
  const ulyssesBytes = megatronSpBytes;

  // Ring Attention stores blockwise KV buffer of size (s / tp)
  const ringAttentionBytes = megatronSpBytes * 0.85;

  const toMb = (bytes: number) => bytes / (1024 * 1024);
  const standardTpActivationMb = toMb(standardBytes);
  const megatronSpActivationMb = toMb(megatronSpBytes);
  const deepspeedUlyssesActivationMb = toMb(ulyssesBytes);
  const ringAttentionActivationMb = toMb(ringAttentionBytes);

  const savingsPctVsStandardTp =
    standardTpActivationMb > 0
      ? ((standardTpActivationMb - megatronSpActivationMb) / standardTpActivationMb) * 100
      : 0;

  // Maximum sequence lengths supported on 80GB GPU
  const maxSupportedSeqLenStandard = Math.floor(
    (80 * 1024 * 1024 * 1024) / (l * b * ((10 * h) / tp + 4 * h) * bpp),
  );
  const maxSupportedSeqLenSP = Math.floor(
    (80 * 1024 * 1024 * 1024) / (l * b * ((14 * h) / tp) * bpp),
  );

  return {
    standardTpActivationMb,
    megatronSpActivationMb,
    deepspeedUlyssesActivationMb,
    ringAttentionActivationMb,
    savingsPctVsStandardTp,
    maxSupportedSeqLenStandard,
    maxSupportedSeqLenSP,
  };
}

/**
 * Generates Cartesian DeviceMesh coordinate mapping and rank communication groups.
 */
export function generateDeviceMeshMapping(
  worldSize: number,
  dp: number,
  tp: number,
  pp: number,
  cp = 1,
): DeviceMeshMappingResult {
  const safeDp = Math.max(1, dp);
  const safeTp = Math.max(1, tp);
  const safePp = Math.max(1, pp);
  const safeCp = Math.max(1, cp);

  const totalCalculated = safeDp * safeTp * safePp * safeCp;
  const actualWorldSize = Math.max(worldSize, totalCalculated);

  const ranks: DeviceMeshCoordinate[] = [];

  // Canonical ordering: [dp, pp, cp, tp]
  for (let r = 0; r < actualWorldSize; r++) {
    const tpRank = r % safeTp;
    const cpRank = Math.floor(r / safeTp) % safeCp;
    const ppRank = Math.floor(r / (safeTp * safeCp)) % safePp;
    const dpRank = Math.floor(r / (safeTp * safeCp * safePp)) % safeDp;
    const nodeIndex = Math.floor(r / 8);
    const localGpuIndex = r % 8;

    ranks.push({
      globalRank: r,
      dpRank,
      ppRank,
      cpRank,
      tpRank,
      epRank: dpRank, // by default mapped to DP rank
      nodeIndex,
      localGpuIndex,
    });
  }

  // Generate communication group rank lists
  const tpGroups: number[][] = [];
  const ppGroups: number[][] = [];
  const dpGroups: number[][] = [];
  const cpGroups: number[][] = [];

  // TP groups (same dp, pp, cp, differing in tp)
  for (let d = 0; d < safeDp; d++) {
    for (let p = 0; p < safePp; p++) {
      for (let c = 0; c < safeCp; c++) {
        const group: number[] = [];
        for (let t = 0; t < safeTp; t++) {
          group.push(d * (safePp * safeCp * safeTp) + p * (safeCp * safeTp) + c * safeTp + t);
        }
        tpGroups.push(group);
      }
    }
  }

  // PP groups (same dp, cp, tp, differing in pp)
  for (let d = 0; d < safeDp; d++) {
    for (let c = 0; c < safeCp; c++) {
      for (let t = 0; t < safeTp; t++) {
        const group: number[] = [];
        for (let p = 0; p < safePp; p++) {
          group.push(d * (safePp * safeCp * safeTp) + p * (safeCp * safeTp) + c * safeTp + t);
        }
        ppGroups.push(group);
      }
    }
  }

  // DP groups (same pp, cp, tp, differing in dp)
  for (let p = 0; p < safePp; p++) {
    for (let c = 0; c < safeCp; c++) {
      for (let t = 0; t < safeTp; t++) {
        const group: number[] = [];
        for (let d = 0; d < safeDp; d++) {
          group.push(d * (safePp * safeCp * safeTp) + p * (safeCp * safeTp) + c * safeTp + t);
        }
        dpGroups.push(group);
      }
    }
  }

  // CP groups
  for (let d = 0; d < safeDp; d++) {
    for (let p = 0; p < safePp; p++) {
      for (let t = 0; t < safeTp; t++) {
        const group: number[] = [];
        for (let c = 0; c < safeCp; c++) {
          group.push(d * (safePp * safeCp * safeTp) + p * (safeCp * safeTp) + c * safeTp + t);
        }
        cpGroups.push(group);
      }
    }
  }

  return {
    worldSize: actualWorldSize,
    meshShape: {
      dp: safeDp,
      pp: safePp,
      cp: safeCp,
      tp: safeTp,
    },
    ranks,
    tpGroups,
    ppGroups,
    dpGroups,
    cpGroups,
  };
}

// ============================================================================
// 4. CODE GENERATION EXPORTERS
// ============================================================================

export function generateMegatronLaunchCommand(
  config: ModelArchitectureConfig,
  parallelism: ParallelismConfig,
): string {
  const flags: string[] = [
    `python -m torch.distributed.run \\`,
    `  --nproc_per_node=8 \\`,
    `  --nnodes=${Math.max(1, Math.ceil((parallelism.dp * parallelism.tp * parallelism.pp) / 8))} \\`,
    `  pretrain_gpt.py \\`,
    `  --tensor-model-parallel-size ${parallelism.tp} \\`,
    `  --pipeline-model-parallel-size ${parallelism.pp} \\`,
    parallelism.virtualStages > 1
      ? `  --num-layers-per-virtual-pipeline-stage ${Math.max(1, Math.floor(config.numLayers / (parallelism.pp * parallelism.virtualStages)))} \\`
      : "",
    parallelism.sequenceParallel !== "none" ? `  --sequence-parallel \\` : "",
    parallelism.cp > 1 ? `  --context-parallel-size ${parallelism.cp} \\` : "",
    `  --micro-batch-size ${parallelism.microbatchSize} \\`,
    `  --global-batch-size ${parallelism.globalBatchSize} \\`,
    `  --seq-length ${parallelism.seqLen} \\`,
    `  --max-position-embeddings ${config.maxSeqLen} \\`,
    `  --num-layers ${config.numLayers} \\`,
    `  --hidden-size ${config.hiddenDim} \\`,
    `  --ffn-hidden-size ${config.intermediateDim} \\`,
    `  --num-attention-heads ${config.numAttentionHeads} \\`,
    config.numKvHeads !== config.numAttentionHeads ? `  --group-query-attention \\` : "",
    config.numKvHeads !== config.numAttentionHeads
      ? `  --num-query-groups ${config.numKvHeads} \\`
      : "",
    parallelism.precision === "bf16" ? `  --bf16 \\` : `  --fp16 \\`,
    parallelism.activationCheckpointing !== "none"
      ? `  --recompute-granularity ${parallelism.activationCheckpointing === "full" ? "full" : "selective"} \\`
      : "",
    parallelism.zeroStage !== "none" ? `  --use-distributed-optimizer \\` : "",
    `  --lr 1.5e-4 \\`,
    `  --min-lr 1.5e-5 \\`,
    `  --lr-decay-style cosine \\`,
    `  --weight-decay 0.1 \\`,
    `  --clip-grad 1.0`,
  ].filter(Boolean);

  return flags.join("\n");
}

export function generatePyTorchDeviceMeshCode(
  config: ModelArchitectureConfig,
  parallelism: ParallelismConfig,
): string {
  return `# Model: ${config.name} (${config.totalParamsB}B parameters, ${config.numLayers} layers)
import torch
import torch.nn as nn
from torch.distributed.device_mesh import init_device_mesh
from torch.distributed.tensor.parallel import (
    parallelize_module,
    ColwiseParallel,
    RowwiseParallel,
    SequenceParallel,
)
from torch.distributed.pipelining import Schedule1F1B

def setup_3d_distributed_model(model: nn.Module):
    # 1. Initialize 3D / 4D DeviceMesh
    world_size = int(torch.distributed.get_world_size())
    dp_size = ${parallelism.dp}
    pp_size = ${parallelism.pp}
    tp_size = ${parallelism.tp}
    cp_size = ${parallelism.cp}

    mesh_3d = init_device_mesh(
        "cuda",
        mesh_shape=(dp_size, pp_size, tp_size),
        mesh_dim_names=("dp", "pp", "tp"),
    )
    tp_mesh = mesh_3d["tp"]

    # 2. Parallelize Attention & MLP Blocks (Megatron-LM Slicing)
    tp_parallel_plan = {
        "self_attn.q_proj": ColwiseParallel(),
        "self_attn.k_proj": ColwiseParallel(),
        "self_attn.v_proj": ColwiseParallel(),
        "self_attn.o_proj": RowwiseParallel(),
        "mlp.gate_proj": ColwiseParallel(),
        "mlp.up_proj": ColwiseParallel(),
        "mlp.down_proj": RowwiseParallel(),
    }

    ${
      parallelism.sequenceParallel === "megatron_sp"
        ? `# Enable Megatron Sequence Parallelism (Reduce-Scatter / All-Gather)
    tp_parallel_plan["input_layernorm"] = SequenceParallel()
    tp_parallel_plan["post_attention_layernorm"] = SequenceParallel()`
        : "# Replicated LayerNorm across TP ranks"
    }

    for layer in model.layers:
        parallelize_module(layer, tp_mesh, tp_parallel_plan)

    # 3. Partition Pipeline Stages
    if pp_size > 1:
        pipe_schedule = Schedule1F1B(
            n_microbatches=${Math.max(1, Math.round(parallelism.globalBatchSize / (parallelism.microbatchSize * parallelism.dp)))},
            loss_fn=nn.CrossEntropyLoss(),
        )
        return mesh_3d, pipe_schedule

    return model, mesh_3d
`;
}

export function generateDeepSpeed3DConfig(
  config: ModelArchitectureConfig,
  parallelism: ParallelismConfig,
): string {
  const dsConfig = {
    model_name: config.name,
    train_batch_size: parallelism.globalBatchSize,
    train_micro_batch_size_per_gpu: parallelism.microbatchSize,
    gradient_accumulation_steps: Math.max(
      1,
      Math.round(parallelism.globalBatchSize / (parallelism.microbatchSize * parallelism.dp)),
    ),
    zero_optimization: {
      stage:
        parallelism.zeroStage === "zero3"
          ? 3
          : parallelism.zeroStage === "zero2"
            ? 2
            : parallelism.zeroStage === "zero1"
              ? 1
              : 0,
      allgather_partitions: true,
      allgather_bucket_size: 500000000,
      reduce_scatter: true,
      reduce_bucket_size: 500000000,
      overlap_comm: true,
      contiguous_gradients: true,
    },
    pipeline: {
      stages: parallelism.pp,
      partition: "best",
      seed_layers: true,
      activation_checkpoint_interval: parallelism.activationCheckpointing !== "none" ? 1 : 0,
    },
    tensor_parallel: {
      tp_size: parallelism.tp,
      sequence_parallel: parallelism.sequenceParallel !== "none",
    },
    bf16: {
      enabled: parallelism.precision === "bf16",
    },
    fp16: {
      enabled: parallelism.precision === "fp16",
    },
    wall_clock_breakdown: false,
  };

  return JSON.stringify(dsConfig, null, 2);
}

// ============================================================================
// 5. FORMATTING UTILITIES
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const abs = Math.abs(bytes);
  if (abs >= 1024 * 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)} TB`;
  }
  if (abs >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (abs >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (abs >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes.toFixed(0)} B`;
}

export function formatFLOPs(tflops: number): string {
  if (tflops >= 1000000) {
    return `${(tflops / 1000000).toFixed(2)} EFLOPS`;
  }
  if (tflops >= 1000) {
    return `${(tflops / 1000).toFixed(2)} PFLOPS`;
  }
  return `${tflops.toFixed(1)} TFLOPS`;
}

export function formatTokensPerSec(tps: number): string {
  if (tps >= 1000000) {
    return `${(tps / 1000000).toFixed(2)}M tok/s`;
  }
  if (tps >= 1000) {
    return `${(tps / 1000).toFixed(1)}K tok/s`;
  }
  return `${tps.toFixed(0)} tok/s`;
}

export function formatLatencyMs(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  return `${ms.toFixed(1)} ms`;
}

// ============================================================================
// 6. MAIN REACT INTERACTIVE STUDIO COMPONENT
// ============================================================================

export const PipelineTensorParallelStudio: React.FC<PipelineTensorParallelStudioProps> = ({
  initialPreset = "llama3_70b_64x_h100",
  initialTab = "cluster_planner",
  className = "",
  title = "3D Parallelism & Pipeline Schedules Studio",
}) => {
  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [selectedPresetId, setSelectedPresetId] = useState<ParallelPresetId>(initialPreset);
  const currentPreset = PARALLEL_PRESETS[selectedPresetId] ?? PARALLEL_PRESETS.llama3_70b_64x_h100;

  const [activeTab, setActiveTab] = useState<StudioTabId>(initialTab);

  // Model & Parallelism Configuration
  const [modelConfig, setModelConfig] = useState<ModelArchitectureConfig>(currentPreset.model);
  const [hardware, setHardware] = useState<GpuHardwareSpec>(currentPreset.hardware);
  const [parallelism, setParallelism] = useState<ParallelismConfig>(currentPreset.parallelism);

  // Sync state on preset switch
  const handleSelectPreset = useCallback((presetId: ParallelPresetId) => {
    setSelectedPresetId(presetId);
    const preset = PARALLEL_PRESETS[presetId];
    if (preset) {
      setModelConfig(preset.model);
      setHardware(preset.hardware);
      setParallelism(preset.parallelism);
    }
  }, []);

  // Pipeline Schedule Animated Player State
  const [pipelineType, setPipelineType] = useState<PipelineType>("1f1b");
  const [pipelineMicrobatches, setPipelineMicrobatches] = useState<number>(8);
  const [pipelineStages, setPipelineStages] = useState<number>(4);
  const [pipelineVirtualStages, setPipelineVirtualStages] = useState<number>(1);
  const [isPlayingSchedule, setIsPlayingSchedule] = useState<boolean>(false);
  const [playbackCycle, setPlaybackCycle] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 4x

  // Tensor Parallel GEMM Interactive State
  const [tpLayerType, setTpLayerType] = useState<"mlp" | "attention" | "transformer_block">(
    "transformer_block",
  );
  const [tpStepIndex, setTpStepIndex] = useState<number>(0);

  // Sequence Parallel Interactive State
  const [spSeqLen, setSpSeqLen] = useState<number>(8192);
  const [spTpDegree, setSpTpDegree] = useState<number>(4);

  // Code Export State
  const [codeExportType, setCodeExportType] = useState<"megatron" | "pytorch" | "deepspeed">(
    "megatron",
  );
  const [hasCopiedCode, setHasCopiedCode] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Derived Computational Results (Memoized)
  // --------------------------------------------------------------------------
  const memoryBreakdown = useMemo(() => {
    return calculate3DMemoryBreakdown(modelConfig, hardware, parallelism);
  }, [modelConfig, hardware, parallelism]);

  const commVolumes = useMemo(() => {
    return computeCommunicationVolume(
      modelConfig,
      parallelism,
      parallelism.microbatchSize,
      parallelism.seqLen,
    );
  }, [modelConfig, parallelism]);

  const mfuStats = useMemo(() => {
    return computeMFUAndThroughput(modelConfig, hardware, parallelism, 600);
  }, [modelConfig, hardware, parallelism]);

  const pipelineSchedule = useMemo(() => {
    return generatePipelineSchedule(
      pipelineType,
      pipelineStages,
      pipelineMicrobatches,
      pipelineVirtualStages,
      1,
      2,
      0,
    );
  }, [pipelineType, pipelineStages, pipelineMicrobatches, pipelineVirtualStages]);

  const tpTrace = useMemo(() => {
    return computeTensorParallelGEMMTrace(
      tpLayerType,
      modelConfig.hiddenDim,
      modelConfig.intermediateDim,
      modelConfig.numAttentionHeads,
      parallelism.tp,
      parallelism.seqLen,
      parallelism.microbatchSize,
    );
  }, [tpLayerType, modelConfig, parallelism.tp, parallelism.seqLen, parallelism.microbatchSize]);

  const spSavings = useMemo(() => {
    return computeSequenceParallelSavings(
      modelConfig.hiddenDim,
      spSeqLen,
      parallelism.microbatchSize,
      modelConfig.numLayers,
      spTpDegree,
      parallelism.activationCheckpointing !== "none",
    );
  }, [
    modelConfig,
    spSeqLen,
    parallelism.microbatchSize,
    spTpDegree,
    parallelism.activationCheckpointing,
  ]);

  const totalClusterGpus = parallelism.dp * parallelism.tp * parallelism.pp * parallelism.cp;

  // --------------------------------------------------------------------------
  // Playback Timer for Pipeline Gantt Timeline
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isPlayingSchedule) return;
    const intervalTime = Math.max(100, 600 / playbackSpeed);
    const timer = setInterval(() => {
      setPlaybackCycle((prev) => {
        if (prev >= pipelineSchedule.totalCycles) {
          setIsPlayingSchedule(false);
          return pipelineSchedule.totalCycles;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlayingSchedule, playbackSpeed, pipelineSchedule.totalCycles]);

  const handleCopyCode = useCallback((code: string) => {
    navigator.clipboard.writeText(code);
    setHasCopiedCode(true);
    setTimeout(() => setHasCopiedCode(false), 2000);
  }, []);

  // --------------------------------------------------------------------------
  // Render Tab Content
  // --------------------------------------------------------------------------
  return (
    <div
      className={`w-full max-w-7xl mx-auto rounded-2xl border border-slate-700/60 bg-slate-950 text-slate-100 shadow-2xl overflow-hidden font-sans ${className}`}
    >
      {/* Header Banner */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 px-6 py-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <Workflow className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  {title}
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Tier 3 Studio
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Megatron-LM 3D Parallelism • Pipeline Schedules • Sequence Parallelism • PyTorch
                  DeviceMesh
                </p>
              </div>
            </div>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Preset:</span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PARALLEL_PRESETS) as ParallelPresetId[]).map((presetKey) => {
                const preset = PARALLEL_PRESETS[presetKey];
                const isActive = selectedPresetId === presetKey;
                return (
                  <button
                    key={presetKey}
                    onClick={() => handleSelectPreset(presetKey)}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700/50"
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 border-t border-slate-800/60 pt-4">
          {[
            { id: "cluster_planner" as const, label: "3D Cluster Planner", icon: Server },
            { id: "tensor_parallel" as const, label: "Megatron Tensor Parallelism", icon: Split },
            {
              id: "pipeline_schedules" as const,
              label: "Pipeline Schedules (1F1B / GPipe)",
              icon: Clock,
            },
            { id: "sequence_parallel" as const, label: "Sequence Parallelism", icon: Layers },
            { id: "code_generator" as const, label: "Production Code Generator", icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="p-6">
        {/* ================================================================== */}
        {/* TAB 1: 3D CLUSTER PLANNER                                          */}
        {/* ================================================================== */}
        {activeTab === "cluster_planner" && (
          <div className="space-y-6">
            {/* OOM Warning Alert Banner */}
            {memoryBreakdown.isOOM && (
              <div className="p-4 rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 flex items-start gap-3 shadow-lg">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-bold text-rose-300">
                    Out of Memory (OOM) Detected! Exceeds GPU VRAM by{" "}
                    {memoryBreakdown.oomDeficitGb.toFixed(2)} GB
                  </div>
                  <div className="text-xs text-rose-300/80">
                    Total memory per GPU is {memoryBreakdown.totalGb.toFixed(2)} GB, but hardware{" "}
                    {hardware.name} only provides {hardware.vramGb} GB. Increase TP/PP degree,
                    enable ZeRO-3, or use Full Activation Checkpointing.
                  </div>
                </div>
              </div>
            )}

            {/* Quick KPI Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Total Cluster GPUs</div>
                <div className="text-lg font-bold text-indigo-400 mt-1">
                  {totalClusterGpus} GPUs
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  DP {parallelism.dp} × TP {parallelism.tp} × PP {parallelism.pp}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">VRAM per GPU</div>
                <div
                  className={`text-lg font-bold mt-1 ${
                    memoryBreakdown.isOOM ? "text-rose-400" : "text-emerald-400"
                  }`}
                >
                  {memoryBreakdown.totalGb.toFixed(1)} / {hardware.vramGb} GB
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {memoryBreakdown.freeGb.toFixed(1)} GB free VRAM
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Model FLOPs (MFU)</div>
                <div className="text-lg font-bold text-amber-400 mt-1">
                  {mfuStats.mfuPct.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {mfuStats.achievedTflopsPerGpu.toFixed(0)} TFLOPS / GPU
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Cluster Throughput</div>
                <div className="text-lg font-bold text-cyan-400 mt-1">
                  {formatTokensPerSec(mfuStats.totalClusterTokensPerSec)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {formatTokensPerSec(mfuStats.tokensPerSecPerGpu)} / GPU
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">Pipeline Bubble</div>
                <div className="text-lg font-bold text-violet-400 mt-1">
                  {(pipelineSchedule.bubbleFraction * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {pipelineSchedule.bubbleCyclesPerStage} idle cycles
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[11px] font-medium text-slate-400">TP NVLink Comm</div>
                <div className="text-lg font-bold text-pink-400 mt-1">
                  {formatBytes(commVolumes.tpVolumeBytesPerLayer)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">per layer / step</div>
              </div>
            </div>

            {/* Main Interactive Controls & Memory Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Configuration Sliders (Left Column: 5 cols) */}
              <div className="lg:col-span-5 space-y-4 p-5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    3D Parallelism Tuning Controls
                  </h2>
                  <span className="text-[11px] text-slate-400">Real-time update</span>
                </div>

                {/* Parallelism Degrees */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">
                        Tensor Parallelism (TP):{" "}
                        <span className="text-indigo-400 font-bold">{parallelism.tp}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">Intra-node (NVLink)</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 4, 8].map((tpVal) => (
                        <button
                          key={tpVal}
                          onClick={() => setParallelism((p) => ({ ...p, tp: tpVal }))}
                          className={`flex-1 py-1 text-xs rounded font-medium transition-all ${
                            parallelism.tp === tpVal
                              ? "bg-indigo-600 text-white font-bold"
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          TP={tpVal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">
                        Pipeline Parallelism (PP):{" "}
                        <span className="text-indigo-400 font-bold">{parallelism.pp}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">Inter-node stages</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 4, 8, 16].map((ppVal) => (
                        <button
                          key={ppVal}
                          onClick={() => setParallelism((p) => ({ ...p, pp: ppVal }))}
                          className={`flex-1 py-1 text-xs rounded font-medium transition-all ${
                            parallelism.pp === ppVal
                              ? "bg-indigo-600 text-white font-bold"
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          PP={ppVal}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">
                        Data Parallelism (DP):{" "}
                        <span className="text-indigo-400 font-bold">{parallelism.dp}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">Replicated instances</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 4, 8, 16, 32, 64].map((dpVal) => (
                        <button
                          key={dpVal}
                          onClick={() => setParallelism((p) => ({ ...p, dp: dpVal }))}
                          className={`flex-1 py-1 text-xs rounded font-medium transition-all ${
                            parallelism.dp === dpVal
                              ? "bg-indigo-600 text-white font-bold"
                              : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                          }`}
                        >
                          {dpVal}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optimization Options */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        ZeRO Stage
                      </label>
                      <select
                        value={parallelism.zeroStage}
                        onChange={(e) =>
                          setParallelism((p) => ({ ...p, zeroStage: e.target.value as ZeROStage }))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="none">None (DDP)</option>
                        <option value="zero1">ZeRO-1 (Opt Shard)</option>
                        <option value="zero2">ZeRO-2 (Opt+Grad)</option>
                        <option value="zero3">ZeRO-3 (Full Shard)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        Activation Checkpoint
                      </label>
                      <select
                        value={parallelism.activationCheckpointing}
                        onChange={(e) =>
                          setParallelism((p) => ({
                            ...p,
                            activationCheckpointing: e.target.value as ActivationCheckpointMode,
                          }))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="none">None (Store All)</option>
                        <option value="selective">Selective (SAC 60% saved)</option>
                        <option value="full">Full (Recompute All)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        Sequence Parallelism
                      </label>
                      <select
                        value={parallelism.sequenceParallel}
                        onChange={(e) =>
                          setParallelism((p) => ({
                            ...p,
                            sequenceParallel: e.target.value as SequenceParallelType,
                          }))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        <option value="none">None (Standard TP)</option>
                        <option value="megatron_sp">Megatron SP (RS/AG)</option>
                        <option value="deepspeed_ulysses">DeepSpeed Ulysses</option>
                        <option value="ring_attention">Ring Attention</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-medium block mb-1">
                        GPU Hardware Target
                      </label>
                      <select
                        value={hardware.id}
                        onChange={(e) => {
                          const spec = GPU_HARDWARE_SPECS[e.target.value];
                          if (spec) setHardware(spec);
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      >
                        {Object.values(GPU_HARDWARE_SPECS).map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Batch & Sequence Size */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      Microbatch Size (b): {parallelism.microbatchSize}
                    </span>
                    <span className="text-slate-400">
                      Global Batch (B): {parallelism.globalBatchSize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={parallelism.microbatchSize}
                    onChange={(e) =>
                      setParallelism((p) => ({ ...p, microbatchSize: Number(e.target.value) }))
                    }
                    className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Memory Breakdown Gauges & Charts (Right Column: 7 cols) */}
              <div className="lg:col-span-7 space-y-4 p-5 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    GPU Memory Breakdown per Rank ({hardware.vramGb} GB Max)
                  </h2>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      memoryBreakdown.isOOM
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {memoryBreakdown.isOOM ? "OOM WARNING" : "FITS IN VRAM"}
                  </span>
                </div>

                {/* Color-Coded Memory Stacked Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-8 rounded-xl bg-slate-950 border border-slate-800 flex overflow-hidden p-0.5">
                    <div
                      style={{ width: `${Math.min(100, memoryBreakdown.breakdownPct.weights)}%` }}
                      className="h-full bg-blue-500 transition-all rounded-l"
                      title={`Weights: ${memoryBreakdown.weightsGb.toFixed(2)} GB`}
                    />
                    <div
                      style={{ width: `${Math.min(100, memoryBreakdown.breakdownPct.optimizer)}%` }}
                      className="h-full bg-violet-500 transition-all"
                      title={`Optimizer: ${memoryBreakdown.optimizerGb.toFixed(2)} GB`}
                    />
                    <div
                      style={{ width: `${Math.min(100, memoryBreakdown.breakdownPct.gradients)}%` }}
                      className="h-full bg-amber-500 transition-all"
                      title={`Gradients: ${memoryBreakdown.gradientsGb.toFixed(2)} GB`}
                    />
                    <div
                      style={{
                        width: `${Math.min(100, memoryBreakdown.breakdownPct.activations)}%`,
                      }}
                      className="h-full bg-emerald-500 transition-all"
                      title={`Activations: ${memoryBreakdown.activationsGb.toFixed(2)} GB`}
                    />
                    <div
                      style={{ width: `${Math.min(100, memoryBreakdown.breakdownPct.kvCache)}%` }}
                      className="h-full bg-cyan-500 transition-all"
                      title={`KV Cache: ${memoryBreakdown.kvCacheGb.toFixed(2)} GB`}
                    />
                    <div
                      style={{
                        width: `${Math.min(100, memoryBreakdown.breakdownPct.workingBuffer)}%`,
                      }}
                      className="h-full bg-pink-500 transition-all rounded-r"
                      title={`Buffer: ${memoryBreakdown.workingBufferGb.toFixed(2)} GB`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 px-1">
                    <span>0 GB</span>
                    <span className="font-semibold text-slate-300">
                      Total: {memoryBreakdown.totalGb.toFixed(2)} GB (
                      {((memoryBreakdown.totalGb / hardware.vramGb) * 100).toFixed(0)}% VRAM)
                    </span>
                    <span>{hardware.vramGb} GB Limit</span>
                  </div>
                </div>

                {/* Memory Breakdown Category Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                      Model Weights
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {memoryBreakdown.weightsGb.toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Sharded by TP={parallelism.tp} × PP={parallelism.pp}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-violet-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-sm bg-violet-500" />
                      Optimizer States
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {memoryBreakdown.optimizerGb.toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {parallelism.zeroStage !== "none" ? "ZeRO Sharded" : "Replicated on DP"}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                      Gradients
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {memoryBreakdown.gradientsGb.toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {parallelism.zeroStage === "zero2" || parallelism.zeroStage === "zero3"
                        ? "ZeRO-2 Sharded"
                        : "Standard DP"}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                      Activations
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {memoryBreakdown.activationsGb.toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {parallelism.activationCheckpointing} checkpointing
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                      KV Cache
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {memoryBreakdown.kvCacheGb.toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-slate-500">SeqLen {parallelism.seqLen}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs text-pink-400 font-medium">
                      <div className="w-2.5 h-2.5 rounded-sm bg-pink-500" />
                      Scratch Buffer
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-1">
                      {memoryBreakdown.workingBufferGb.toFixed(2)} GB
                    </div>
                    <div className="text-[10px] text-slate-500">Comm & All-Gather</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: MEGATRON TENSOR PARALLELISM                                 */}
        {/* ================================================================== */}
        {activeTab === "tensor_parallel" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Split className="w-5 h-5 text-indigo-400" />
                  Megatron-LM Tensor Parallelism (1D Slicing)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Column-Parallel GEMM → Local Activation → Row-Parallel GEMM → All-Reduce (Sum)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Layer Type:</span>
                <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {[
                    { id: "transformer_block" as const, label: "Full Block" },
                    { id: "attention" as const, label: "Self-Attention" },
                    { id: "mlp" as const, label: "MLP Block" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTpLayerType(item.id);
                        setTpStepIndex(0);
                      }}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                        tpLayerType === item.id
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {tpTrace.steps.map((step, idx) => {
                const isCurrent = tpStepIndex === idx;
                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => setTpStepIndex(idx)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isCurrent
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400"
                        : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/60 flex items-center justify-center text-[10px]">
                      {step.stepNumber}
                    </span>
                    {step.name}
                  </button>
                );
              })}
            </div>

            {/* Current Step Visualization & Slicing Detail */}
            {tpTrace.steps[tpStepIndex] && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Math Formulation & Slicing Diagram (7 cols) */}
                <div className="lg:col-span-7 space-y-4 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">
                        Step {tpTrace.steps[tpStepIndex].stepNumber}:{" "}
                        {tpTrace.steps[tpStepIndex].name}
                      </h3>
                      <div className="text-xs text-indigo-400 font-mono mt-0.5">
                        Operation: {tpTrace.steps[tpStepIndex].operation}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded font-medium ${
                        tpTrace.steps[tpStepIndex].communicationType === "g_allreduce"
                          ? "bg-pink-500/20 text-pink-300 border border-pink-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {tpTrace.steps[tpStepIndex].communicationType === "g_allreduce"
                        ? "Collective: All-Reduce (Sum)"
                        : "Collective: Zero Comm"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tpTrace.steps[tpStepIndex].description}
                  </p>

                  {/* Matrix Dimension Badges */}
                  <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                    <div>
                      <div className="text-slate-500 text-[10px]">Input Tensor</div>
                      <div className="font-mono text-cyan-400 font-bold mt-0.5">
                        {tpTrace.steps[tpStepIndex].inputShape}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Weight Slice / Kernel</div>
                      <div className="font-mono text-amber-400 font-bold mt-0.5">
                        {tpTrace.steps[tpStepIndex].weightShape}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-[10px]">Output Tensor</div>
                      <div className="font-mono text-emerald-400 font-bold mt-0.5">
                        {tpTrace.steps[tpStepIndex].outputShape}
                      </div>
                    </div>
                  </div>

                  {/* Mathematical Derivation Box */}
                  <div className="p-3.5 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-xs">
                    <div className="text-[11px] font-bold text-indigo-300 mb-1">
                      Mathematical Operator Formulation:
                    </div>
                    <div className="font-mono text-indigo-200">
                      {tpTrace.steps[tpStepIndex].equation}
                    </div>
                  </div>
                </div>

                {/* Per-Rank Slices Table (5 cols) */}
                <div className="lg:col-span-5 space-y-3 p-5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
                    <span>Rank Partition View (TP={parallelism.tp})</span>
                    <span className="text-xs font-normal text-slate-400">
                      All {parallelism.tp} Ranks
                    </span>
                  </h3>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {tpTrace.steps[tpStepIndex].rankSlices.map((slice) => (
                      <div
                        key={slice.rank}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-400">GPU Rank {slice.rank}</span>
                          {slice.partialSum && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Partial Sum
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500">Weight: </span>
                          <span className="font-mono text-amber-300">{slice.weightSlice}</span>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500">Output: </span>
                          <span className="font-mono text-emerald-300">{slice.outputSlice}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: PIPELINE SCHEDULES (GPIPE, 1F1B, 1F1B-INTERLEAVED)          */}
        {/* ================================================================== */}
        {activeTab === "pipeline_schedules" && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  Pipeline Parallelism Gantt Timeline & Bubble Visualizer
                </h2>
                <p className="text-xs text-slate-400">
                  GPipe vs 1F1B vs 1F1B-Interleaved • Idle Bubble Fraction • Peak Activation
                  Tracking
                </p>
              </div>

              {/* Schedule Type Buttons */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {[
                    { id: "1f1b" as const, label: "1F1B Steady-State" },
                    { id: "1f1b_interleaved" as const, label: "1F1B-Interleaved (v=2)" },
                    { id: "gpipe" as const, label: "GPipe (Batch Sync)" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setPipelineType(s.id);
                        if (s.id === "1f1b_interleaved") setPipelineVirtualStages(2);
                        else setPipelineVirtualStages(1);
                        setPlaybackCycle(0);
                        setIsPlayingSchedule(false);
                      }}
                      className={`px-3 py-1.5 text-xs rounded font-medium transition-all ${
                        pipelineType === s.id
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stage, Microbatch & Speed Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-medium">
                  Pipeline Stages (P): {pipelineStages}
                </span>
                <div className="flex gap-1">
                  {[2, 4, 8].map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setPipelineStages(st);
                        setPlaybackCycle(0);
                        setIsPlayingSchedule(false);
                      }}
                      className={`px-2 py-0.5 rounded font-medium ${
                        pipelineStages === st
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-medium">
                  Microbatches (M): {pipelineMicrobatches}
                </span>
                <div className="flex gap-1">
                  {[4, 8, 12, 16].map((mb) => (
                    <button
                      key={mb}
                      onClick={() => {
                        setPipelineMicrobatches(mb);
                        setPlaybackCycle(0);
                        setIsPlayingSchedule(false);
                      }}
                      className={`px-2 py-0.5 rounded font-medium ${
                        pipelineMicrobatches === mb
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {mb}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-medium">Speed: {playbackSpeed}x</span>
                <div className="flex gap-1">
                  {[0.5, 1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={`px-2 py-0.5 rounded font-medium ${
                        playbackSpeed === spd
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Animation Player Bar & Timeline Scrubber */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlayingSchedule(!isPlayingSchedule)}
                  className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 text-xs"
                >
                  {isPlayingSchedule ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlayingSchedule ? "Pause" : "Play"}
                </button>

                <button
                  onClick={() => {
                    setIsPlayingSchedule(false);
                    setPlaybackCycle(0);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="Reset to cycle 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPlaybackCycle((c) => Math.max(0, c - 1))}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="Step back 1 cycle"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setPlaybackCycle((c) => Math.min(pipelineSchedule.totalCycles, c + 1))
                  }
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  title="Step forward 1 cycle"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <div className="text-xs font-mono text-slate-300 ml-2">
                  Cycle <span className="font-bold text-indigo-400">{playbackCycle}</span> /{" "}
                  {pipelineSchedule.totalCycles}
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">
                  Bubble Fraction:{" "}
                  <span className="text-amber-400 font-bold">
                    {(pipelineSchedule.bubbleFraction * 100).toFixed(1)}%
                  </span>
                </span>
                <span className="text-slate-400">
                  Peak Activations:{" "}
                  <span className="text-emerald-400 font-bold">
                    {Math.max(...pipelineSchedule.peakActivationsPerStage)} microbatches
                  </span>
                </span>
              </div>
            </div>

            {/* Timeline Gantt Grid */}
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 overflow-x-auto">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Execution Timeline (GPUs / Stages on Y-Axis, Time Cycles on X-Axis)
              </h3>

              <div className="min-w-[700px] space-y-2">
                {Array.from({ length: pipelineStages }, (_, stageIdx) => {
                  const stageEvents = pipelineSchedule.events.filter((e) => e.stageId === stageIdx);
                  const currentMem =
                    pipelineSchedule.stageMemoryCurves[stageIdx]?.[playbackCycle] ?? 0;

                  return (
                    <div key={stageIdx} className="flex items-center gap-3">
                      <div className="w-28 shrink-0 text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>GPU Stage {stageIdx}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">
                          {currentMem} MB
                        </span>
                      </div>

                      <div className="flex-1 h-9 bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800/80 flex items-center">
                        {stageEvents.map((ev) => {
                          const leftPct = (ev.startCycle / pipelineSchedule.totalCycles) * 100;
                          const widthPct = (ev.duration / pipelineSchedule.totalCycles) * 100;
                          const isActive =
                            playbackCycle >= ev.startCycle && playbackCycle < ev.endCycle;

                          return (
                            <div
                              key={ev.id}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: ev.type === "forward" ? ev.color : `${ev.color}cc`,
                              }}
                              className={`absolute h-7 top-1 rounded text-[10px] font-bold text-white flex items-center justify-center transition-all ${
                                isActive
                                  ? "ring-2 ring-white scale-105 z-10 shadow-lg"
                                  : "opacity-90"
                              }`}
                              title={`${ev.label}: Cycle ${ev.startCycle}..${ev.endCycle}`}
                            >
                              {ev.label}
                            </div>
                          );
                        })}

                        {/* Playhead Vertical Line */}
                        <div
                          style={{
                            left: `${(playbackCycle / pipelineSchedule.totalCycles) * 100}%`,
                          }}
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-md"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cycle Numbers on X-Axis */}
              <div className="min-w-[700px] pl-32 flex justify-between text-[10px] font-mono text-slate-500 pt-1">
                <span>Cycle 0</span>
                <span>Cycle {Math.round(pipelineSchedule.totalCycles / 2)}</span>
                <span>Cycle {pipelineSchedule.totalCycles}</span>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: SEQUENCE PARALLELISM                                        */}
        {/* ================================================================== */}
        {activeTab === "sequence_parallel" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Sequence Parallelism & Long-Context Attention
              </h2>
              <p className="text-xs text-slate-400">
                Megatron SP (Reduce-Scatter / All-Gather) vs DeepSpeed Ulysses vs Ring Attention
              </p>
            </div>

            {/* Sequence Length Controls */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                  Sequence Length:{" "}
                  <span className="text-indigo-400 font-bold">{spSeqLen.toLocaleString()}</span>
                </span>
                <input
                  type="range"
                  min="2048"
                  max="65536"
                  step="2048"
                  value={spSeqLen}
                  onChange={(e) => setSpSeqLen(Number(e.target.value))}
                  className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">TP / SP Degree:</span>
                <div className="flex gap-1">
                  {[2, 4, 8].map((deg) => (
                    <button
                      key={deg}
                      onClick={() => setSpTpDegree(deg)}
                      className={`px-3 py-1 text-xs rounded font-medium ${
                        spTpDegree === deg
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {deg}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Memory Savings Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Standard Megatron TP</div>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {spSavings.standardTpActivationMb.toFixed(0)} MB
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  LayerNorm & Dropout replicated on all TP ranks
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">
                  Megatron Sequence Parallel (SP)
                </div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {spSavings.megatronSpActivationMb.toFixed(0)} MB
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-1">
                  {spSavings.savingsPctVsStandardTp.toFixed(1)}% activation memory saved
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">DeepSpeed Ulysses</div>
                <div className="text-xl font-bold text-cyan-400 mt-1">
                  {spSavings.deepspeedUlyssesActivationMb.toFixed(0)} MB
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  All-to-All sequence ↔ head transformation
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400 font-medium">Ring Attention</div>
                <div className="text-xl font-bold text-violet-400 mt-1">
                  {spSavings.ringAttentionActivationMb.toFixed(0)} MB
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Peer-to-peer overlapping KV ring transfers
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: PRODUCTION CODE GENERATOR                                   */}
        {/* ================================================================== */}
        {activeTab === "code_generator" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="space-y-0.5">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  Production Distributed Launch Code Generator
                </h2>
                <p className="text-xs text-slate-400">
                  Megatron-Core CLI • PyTorch 2.x DeviceMesh • DeepSpeed 3D JSON • Torchrun Launch
                </p>
              </div>

              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {[
                  { id: "megatron" as const, label: "Megatron CLI" },
                  { id: "pytorch" as const, label: "PyTorch DeviceMesh" },
                  { id: "deepspeed" as const, label: "DeepSpeed JSON" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCodeExportType(item.id)}
                    className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                      codeExportType === item.id
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Output Viewer */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>
                    {codeExportType === "megatron" && "megatron_launch.sh"}
                    {codeExportType === "pytorch" && "device_mesh_parallel.py"}
                    {codeExportType === "deepspeed" && "ds_config_3d.json"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const code =
                      codeExportType === "megatron"
                        ? generateMegatronLaunchCommand(modelConfig, parallelism)
                        : codeExportType === "pytorch"
                          ? generatePyTorchDeviceMeshCode(modelConfig, parallelism)
                          : generateDeepSpeed3DConfig(modelConfig, parallelism);
                    handleCopyCode(code);
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
                >
                  {hasCopiedCode ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {hasCopiedCode ? "Copied!" : "Copy Code"}
                </button>
              </div>

              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed max-h-96">
                {codeExportType === "megatron" &&
                  generateMegatronLaunchCommand(modelConfig, parallelism)}
                {codeExportType === "pytorch" &&
                  generatePyTorchDeviceMeshCode(modelConfig, parallelism)}
                {codeExportType === "deepspeed" &&
                  generateDeepSpeed3DConfig(modelConfig, parallelism)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineTensorParallelStudio;
