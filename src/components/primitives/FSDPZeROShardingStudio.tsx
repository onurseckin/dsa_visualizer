import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Layers,
  Zap,
  Activity,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Sparkles,
  Server,
  Boxes,
  HardDrive,
  Cpu,
  Network,
  AlertTriangle,
  Info,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  Clock,
  Code2,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type ShardingStrategy =
  | "zero0_ddp"
  | "zero1_opt"
  | "zero2_opt_grad"
  | "zero3_full"
  | "hybrid_shard";

export type PrecisionFormat = "fp32" | "fp16" | "bf16" | "fp8";

export type OptimizerType = "adamw_fp32" | "adamw_8bit" | "sgd_momentum" | "sgd";

export type OffloadTarget = "none" | "cpu_optimizer" | "cpu_all" | "nvme_all";

export type InterconnectType =
  | "nvlink_4_900gb"
  | "nvlink_3_600gb"
  | "pcie_gen5_64gb"
  | "pcie_gen4_32gb"
  | "infiniband_800gbps"
  | "infiniband_400gbps"
  | "infiniband_200gbps"
  | "ethernet_100gbps";

export type ActivationCheckpointingMode = "none" | "selective" | "full";

export type FSDPPresetId =
  | "llama3_8b_8x_h100"
  | "llama3_70b_8x_h100"
  | "llama3_70b_32x_a100"
  | "llama3_405b_512x_h100"
  | "deepseek_v3_256x_h100"
  | "mixtral_8x7b_8x_a100"
  | "gpt3_175b_64x_a100"
  | "custom";

export type FSDPStudioTabId =
  | "vram_breakdown"
  | "collective_stepper"
  | "offload_timeline"
  | "scaling_mfu"
  | "code_export";

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
}

export interface InterconnectSpec {
  readonly id: InterconnectType;
  readonly name: string;
  readonly bandwidthGbs: number;
  readonly latencyUs: number;
  readonly category: "intra_node" | "inter_node" | "host_pcie";
}

export interface ModelArchitectureConfig {
  readonly name: string;
  readonly totalParamsB: number; // in billions (e.g. 8.03 for 8B)
  readonly numLayers: number;
  readonly hiddenDim: number;
  readonly numAttentionHeads: number;
  readonly numKvHeads: number;
  readonly intermediateDim: number;
  readonly vocabSize: number;
}

export interface ClusterConfig {
  readonly numGpus: number;
  readonly numNodes: number;
  readonly gpusPerNode: number;
  readonly gpuModelId: string;
  readonly intraNodeInterconnect: InterconnectType;
  readonly interNodeInterconnect: InterconnectType;
  readonly cpuRamPerNodeGb: number;
  readonly nvmeBandwidthGbs: number;
}

export interface TrainingConfig {
  readonly microBatchSize: number;
  readonly seqLength: number;
  readonly modelPrecision: PrecisionFormat;
  readonly optimizerType: OptimizerType;
  readonly activationCheckpointing: ActivationCheckpointingMode;
  readonly useFlashAttention: boolean;
  readonly sequenceParallelSize: number;
  readonly shardingStrategy: ShardingStrategy;
  readonly offloadTarget: OffloadTarget;
  readonly backwardPrefetch: boolean;
  readonly forwardPrefetch: boolean;
  readonly limitAllGathers: boolean;
}

export interface MemoryItem {
  readonly name: string;
  readonly category: "model" | "grad" | "optim" | "act" | "transient" | "overhead";
  readonly sizeGb: number;
  readonly color: string;
  readonly description: string;
}

export interface MemoryBreakdownResult {
  readonly totalModelParamsB: number;
  readonly modelWeightsGb: number;
  readonly gradientsGb: number;
  readonly optimizerStatesGb: number;
  readonly activationsGb: number;
  readonly transientBufferGb: number;
  readonly cudaOverheadGb: number;
  readonly totalGpuVramRequiredGb: number;
  readonly gpuCapacityGb: number;
  readonly gpuHeadroomGb: number;
  readonly gpuUtilizationPct: number;
  readonly isOOM: boolean;
  readonly offloadedCpuRamGb: number;
  readonly offloadedNvmeGb: number;
  readonly totalClusterVramGb: number;
  readonly items: readonly MemoryItem[];
}

export interface CommunicationAnalysisResult {
  readonly forwardCommBytesPerStep: number;
  readonly backwardCommBytesPerStep: number;
  readonly totalCommBytesPerStep: number;
  readonly commMultiplierVsDDP: number;
  readonly intraNodeCommBytes: number;
  readonly interNodeCommBytes: number;
  readonly effectiveBandwidthGbs: number;
  readonly commTimeMs: number;
  readonly computeTimeMs: number;
  readonly exposedCommTimeMs: number;
  readonly offloadTransferTimeMs: number;
  readonly stepTimeMs: number;
  readonly mfuPct: number;
  readonly tokensPerSecPerGpu: number;
  readonly globalTokensPerSec: number;
  readonly tflopsPerGpu: number;
  readonly theoreticalFlopsPerStep: number;
}

export interface StepSimulationState {
  readonly id: string;
  readonly stepNumber: number;
  readonly layerIndex: number;
  readonly phase:
    | "forward_allgather"
    | "forward_compute"
    | "forward_free"
    | "loss"
    | "backward_allgather"
    | "backward_compute"
    | "backward_reducescatter"
    | "backward_free"
    | "optimizer_step";
  readonly activeCollective:
    | "none"
    | "all_gather"
    | "reduce_scatter"
    | "all_reduce"
    | "dtoh_transfer"
    | "htod_transfer";
  readonly layerName: string;
  readonly layerParamCount: number;
  readonly layerParamBytes: number;
  readonly collectiveTransferBytes: number;
  readonly gpuVramAllocations: readonly number[]; // per-GPU active VRAM in GB
  readonly activeLinks: readonly {
    readonly fromGpu: number;
    readonly toGpu: number;
    readonly bytesTransferred: number;
    readonly progress: number;
  }[];
  readonly stepTitle: string;
  readonly stepDescription: string;
  readonly mathFormula: string;
  readonly transientVramGb: number;
}

export interface OffloadingAnalysisResult {
  readonly cpuRamRequiredGb: number;
  readonly nvmeRequiredGb: number;
  readonly transferTimeMs: number;
  readonly computeTimeMs: number;
  readonly overlapEfficiencyPct: number;
  readonly stallBubbleMs: number;
  readonly isHostRamOOM: boolean;
  readonly hostRamHeadroomGb: number;
}

export interface FSDPPreset {
  readonly id: FSDPPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly architectureFamily: string;
  readonly model: ModelArchitectureConfig;
  readonly cluster: ClusterConfig;
  readonly training: TrainingConfig;
  readonly highlights: readonly string[];
}

export interface FSDPZeROShardingStudioProps {
  readonly initialPreset?: FSDPPresetId;
  readonly initialModelConfig?: Partial<ModelArchitectureConfig>;
  readonly initialClusterConfig?: Partial<ClusterConfig>;
  readonly initialTrainingConfig?: Partial<TrainingConfig>;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onPresetChange?: (presetId: FSDPPresetId) => void;
  readonly onTabChange?: (tabId: FSDPStudioTabId) => void;
}

// ============================================================================
// 2. HARDWARE DATABASE & CONSTANTS
// ============================================================================

export const GPU_HARDWARE_SPECS: readonly GpuHardwareSpec[] = [
  {
    id: "h100_80gb",
    name: "NVIDIA H100 SXM5",
    vramGb: 80,
    bandwidthGbs: 3350,
    tflopsBf16: 989,
    tflopsFp8: 1979,
    memoryType: "HBM3",
    architecture: "Hopper",
    tdpWatts: 700,
  },
  {
    id: "h200_141gb",
    name: "NVIDIA H200 SXM",
    vramGb: 141,
    bandwidthGbs: 4800,
    tflopsBf16: 989,
    tflopsFp8: 1979,
    memoryType: "HBM3e",
    architecture: "Hopper",
    tdpWatts: 700,
  },
  {
    id: "b200_192gb",
    name: "NVIDIA B200 SXM",
    vramGb: 192,
    bandwidthGbs: 8000,
    tflopsBf16: 2250,
    tflopsFp8: 4500,
    memoryType: "HBM3e",
    architecture: "Blackwell",
    tdpWatts: 1000,
  },
  {
    id: "a100_80gb",
    name: "NVIDIA A100 SXM4",
    vramGb: 80,
    bandwidthGbs: 2039,
    tflopsBf16: 312,
    tflopsFp8: 312,
    memoryType: "HBM2e",
    architecture: "Ampere",
    tdpWatts: 400,
  },
  {
    id: "a100_40gb",
    name: "NVIDIA A100 PCIe",
    vramGb: 40,
    bandwidthGbs: 1555,
    tflopsBf16: 312,
    tflopsFp8: 312,
    memoryType: "HBM2",
    architecture: "Ampere",
    tdpWatts: 250,
  },
  {
    id: "rtx_4090",
    name: "NVIDIA GeForce RTX 4090",
    vramGb: 24,
    bandwidthGbs: 1008,
    tflopsBf16: 165,
    tflopsFp8: 330,
    memoryType: "GDDR6X",
    architecture: "Ada Lovelace",
    tdpWatts: 450,
  },
  {
    id: "l40s_48gb",
    name: "NVIDIA L40S",
    vramGb: 48,
    bandwidthGbs: 864,
    tflopsBf16: 362,
    tflopsFp8: 733,
    memoryType: "GDDR6",
    architecture: "Ada Lovelace",
    tdpWatts: 350,
  },
];

export const INTERCONNECT_SPECS: Record<InterconnectType, InterconnectSpec> = {
  nvlink_4_900gb: {
    id: "nvlink_4_900gb",
    name: "NVLink 4 (Hopper NVSwitch)",
    bandwidthGbs: 900,
    latencyUs: 0.5,
    category: "intra_node",
  },
  nvlink_3_600gb: {
    id: "nvlink_3_600gb",
    name: "NVLink 3 (Ampere NVSwitch)",
    bandwidthGbs: 600,
    latencyUs: 0.8,
    category: "intra_node",
  },
  pcie_gen5_64gb: {
    id: "pcie_gen5_64gb",
    name: "PCIe Gen5 x16",
    bandwidthGbs: 64,
    latencyUs: 1.5,
    category: "host_pcie",
  },
  pcie_gen4_32gb: {
    id: "pcie_gen4_32gb",
    name: "PCIe Gen4 x16",
    bandwidthGbs: 32,
    latencyUs: 2.0,
    category: "host_pcie",
  },
  infiniband_800gbps: {
    id: "infiniband_800gbps",
    name: "Quantum-2 NDR InfiniBand (800 Gbps)",
    bandwidthGbs: 100, // 800 Gbps = 100 GB/s
    latencyUs: 1.2,
    category: "inter_node",
  },
  infiniband_400gbps: {
    id: "infiniband_400gbps",
    name: "HDR InfiniBand (400 Gbps)",
    bandwidthGbs: 50, // 400 Gbps = 50 GB/s
    latencyUs: 1.8,
    category: "inter_node",
  },
  infiniband_200gbps: {
    id: "infiniband_200gbps",
    name: "HDR InfiniBand (200 Gbps)",
    bandwidthGbs: 25, // 200 Gbps = 25 GB/s
    latencyUs: 2.5,
    category: "inter_node",
  },
  ethernet_100gbps: {
    id: "ethernet_100gbps",
    name: "RoCEv2 Ethernet (100 Gbps)",
    bandwidthGbs: 12.5, // 100 Gbps = 12.5 GB/s
    latencyUs: 5.0,
    category: "inter_node",
  },
};

// ============================================================================
// 3. PURE MATHEMATICAL & UTILITY FUNCTIONS
// ============================================================================

/**
 * Returns byte footprint per element for specified precision format.
 */
export function getPrecisionBytes(precision: PrecisionFormat): number {
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

/**
 * Returns optimizer state byte breakdown per parameter.
 * Standard mixed precision AdamW:
 * - 4B FP32 master weight
 * - 4B FP32 momentum (1st moment)
 * - 4B FP32 variance (2nd moment)
 * Total = 12 bytes per parameter (or 16B if fp32 grad is cached).
 */
export function getOptimizerBytesPerParam(optimizer: OptimizerType): {
  readonly masterWeightBytes: number;
  readonly momentBytes: number;
  readonly totalBytes: number;
} {
  switch (optimizer) {
    case "adamw_fp32":
      return { masterWeightBytes: 4, momentBytes: 8, totalBytes: 12 };
    case "adamw_8bit":
      // 8-bit Adam stores quantized states (1B momentum + 1B variance + 2B quantization constants/master)
      return { masterWeightBytes: 2, momentBytes: 2, totalBytes: 4 };
    case "sgd_momentum":
      return { masterWeightBytes: 4, momentBytes: 4, totalBytes: 8 };
    case "sgd":
      return { masterWeightBytes: 4, momentBytes: 0, totalBytes: 4 };
    default:
      return { masterWeightBytes: 4, momentBytes: 8, totalBytes: 12 };
  }
}

/**
 * Calculates exact parameter count and per-layer parameter count of a transformer model.
 */
export function calculateModelParamCount(config: ModelArchitectureConfig): {
  readonly totalParams: number;
  readonly layerParams: number;
  readonly nonLayerParams: number;
} {
  const totalParams = Math.round(config.totalParamsB * 1e9);
  const vocabParams = config.vocabSize * config.hiddenDim; // Embedding table + lm_head
  const nonLayerParams = vocabParams * 2; // input embeddings + output classifier
  const transformerLayersTotalParams = Math.max(0, totalParams - nonLayerParams);
  const layerParams = config.numLayers > 0 ? transformerLayersTotalParams / config.numLayers : 0;

  return {
    totalParams,
    layerParams,
    nonLayerParams,
  };
}

/**
 * Calculates activation memory in bytes per GPU.
 * Incorporates GQA ratio, SwiGLU MLP dimensions, FlashAttention-2/3 savings,
 * Sequence Parallelism, and Activation Checkpointing modes (none, selective, full).
 */
export function calculateActivationMemory(
  model: ModelArchitectureConfig,
  training: TrainingConfig,
): {
  readonly totalActivationBytes: number;
  readonly perLayerActivationBytes: number;
  readonly attentionBytes: number;
  readonly mlpBytes: number;
  readonly normBytes: number;
  readonly isFlashAttentionSaved: boolean;
  readonly checkpointingSavingsPct: number;
} {
  const bpp = getPrecisionBytes(training.modelPrecision);
  const b = training.microBatchSize;
  const s = training.seqLength;
  const h = model.hiddenDim;
  const l = model.numLayers;
  const a = model.numAttentionHeads;
  const aKv = model.numKvHeads;
  const dFfn = model.intermediateDim;
  const sp = Math.max(1, training.sequenceParallelSize);

  // Per-token activations per layer
  // Norms: RMSNorm at attention input and MLP input (2 * h)
  const normBytesPerToken = 2 * h * bpp;

  // Attention block:
  // Q projection: b * s * h
  // K, V projection with GQA: 2 * b * s * (h * aKv / a)
  // Attention Output projection: b * s * h
  const kvFactor = aKv / Math.max(1, a);
  const qkvBytesPerToken = (1 + 2 * kvFactor + 1) * h * bpp;

  // Attention matrix QK^T: b * a * s^2 (without FlashAttention)
  // With FlashAttention, this O(s^2) matrix is computed in SRAM tile and never written to HBM!
  const attentionMatrixBytesTotal = training.useFlashAttention ? 0 : (b * a * s * s * bpp) / sp;

  // MLP block (SwiGLU):
  // Gate projection: b * s * dFfn
  // Up projection: b * s * dFfn
  // SiLU activation intermediate: b * s * dFfn
  // Down projection: b * s * h
  const mlpBytesPerToken = (3 * dFfn + h) * bpp;

  // Uncheckpointed per-layer activation memory
  const tokensPerGpu = (b * s) / sp;
  const perLayerLinearBytes =
    tokensPerGpu * (normBytesPerToken + qkvBytesPerToken + mlpBytesPerToken);
  const perLayerTotalUncheckpointed =
    perLayerLinearBytes + attentionMatrixBytesTotal / Math.max(1, l);

  let totalActivationBytes = 0;
  let checkpointingSavingsPct = 0;

  switch (training.activationCheckpointing) {
    case "full":
      // Full activation checkpointing: Only store layer input tensor for each transformer block
      // Memory = L * b * s * h * bpp / sp
      totalActivationBytes = l * tokensPerGpu * h * bpp;
      checkpointingSavingsPct = Math.max(
        0,
        100 * (1 - totalActivationBytes / Math.max(1, perLayerTotalUncheckpointed * l)),
      );
      break;

    case "selective":
      // Selective activation checkpointing (SAC): Only store inputs to attention and MLP, recompute cheap ops
      // Saves ~55-65% activation memory without recomputing all GEMMs
      totalActivationBytes = perLayerTotalUncheckpointed * l * 0.4;
      checkpointingSavingsPct = 60.0;
      break;

    case "none":
    default:
      totalActivationBytes = perLayerTotalUncheckpointed * l;
      checkpointingSavingsPct = 0;
      break;
  }

  const perLayerActivationBytes = l > 0 ? totalActivationBytes / l : 0;
  const attentionBytes = tokensPerGpu * qkvBytesPerToken * l + attentionMatrixBytesTotal;
  const mlpBytes = tokensPerGpu * mlpBytesPerToken * l;
  const normBytes = tokensPerGpu * normBytesPerToken * l;

  return {
    totalActivationBytes,
    perLayerActivationBytes,
    attentionBytes,
    mlpBytes,
    normBytes,
    isFlashAttentionSaved: training.useFlashAttention,
    checkpointingSavingsPct,
  };
}

/**
 * Calculates transient working buffer memory needed in ZeRO-3 / FSDP Full Shard.
 * When computing a layer, the full unsharded parameters of that layer are gathered into VRAM.
 * With prefetching enabled, 2 layers of unsharded parameters + working gradient buffer exist concurrently.
 */
export function calculateWorkingTransientBuffer(
  model: ModelArchitectureConfig,
  training: TrainingConfig,
): number {
  if (training.shardingStrategy !== "zero3_full" && training.shardingStrategy !== "hybrid_shard") {
    return 0;
  }

  const { layerParams } = calculateModelParamCount(model);
  const bpp = getPrecisionBytes(training.modelPrecision);
  const layerBytes = layerParams * bpp;

  // Prefetching forward or backward requires holding 2 full layers in transient buffer
  const bufferMultiplier = training.forwardPrefetch || training.backwardPrefetch ? 2 : 1;
  // Also account for unsharded gradient buffer during backward pass
  return bufferMultiplier * layerBytes;
}

/**
 * Calculates comprehensive VRAM breakdown per GPU across all sharding strategies,
 * offloading options, model configurations, and cluster degrees.
 */
export function calculateMemoryBreakdown(
  model: ModelArchitectureConfig,
  cluster: ClusterConfig,
  training: TrainingConfig,
): MemoryBreakdownResult {
  const { totalParams } = calculateModelParamCount(model);
  const bppModel = getPrecisionBytes(training.modelPrecision);
  const optimBytesInfo = getOptimizerBytesPerParam(training.optimizerType);

  const numGpus = Math.max(1, cluster.numGpus);
  const gpusPerNode = Math.max(1, Math.min(cluster.gpusPerNode, numGpus));

  // Determine sharding degree Nd
  let shardingDegree = 1;
  switch (training.shardingStrategy) {
    case "zero0_ddp":
      shardingDegree = 1;
      break;
    case "zero1_opt":
    case "zero2_opt_grad":
    case "zero3_full":
      shardingDegree = numGpus;
      break;
    case "hybrid_shard":
      // Intra-node sharded by gpusPerNode, replicated across nodes
      shardingDegree = gpusPerNode;
      break;
  }

  // Baseline full unsharded sizes in Bytes
  const fullModelWeightsBytes = totalParams * bppModel;
  const fullGradientsBytes = totalParams * bppModel;
  const fullOptimizerBytes = totalParams * optimBytesInfo.totalBytes;

  // GPU Allocations based on ZeRO stage
  let gpuModelWeightsBytes = 0;
  let gpuGradientsBytes = 0;
  let gpuOptimizerBytes = 0;

  switch (training.shardingStrategy) {
    case "zero0_ddp":
      gpuModelWeightsBytes = fullModelWeightsBytes;
      gpuGradientsBytes = fullGradientsBytes;
      gpuOptimizerBytes = fullOptimizerBytes;
      break;

    case "zero1_opt":
      gpuModelWeightsBytes = fullModelWeightsBytes;
      gpuGradientsBytes = fullGradientsBytes;
      gpuOptimizerBytes = fullOptimizerBytes / shardingDegree;
      break;

    case "zero2_opt_grad":
      gpuModelWeightsBytes = fullModelWeightsBytes;
      gpuGradientsBytes = fullGradientsBytes / shardingDegree;
      gpuOptimizerBytes = fullOptimizerBytes / shardingDegree;
      break;

    case "zero3_full":
      gpuModelWeightsBytes = fullModelWeightsBytes / shardingDegree;
      gpuGradientsBytes = fullGradientsBytes / shardingDegree;
      gpuOptimizerBytes = fullOptimizerBytes / shardingDegree;
      break;

    case "hybrid_shard":
      gpuModelWeightsBytes = fullModelWeightsBytes / gpusPerNode;
      gpuGradientsBytes = fullGradientsBytes / gpusPerNode;
      // In hybrid sharding, optimizer can be sharded across entire cluster (numGpus)
      gpuOptimizerBytes = fullOptimizerBytes / numGpus;
      break;
  }

  // Offload adjustments
  let offloadedCpuRamBytes = 0;
  let offloadedNvmeBytes = 0;

  if (training.offloadTarget === "cpu_optimizer") {
    offloadedCpuRamBytes += gpuOptimizerBytes;
    gpuOptimizerBytes = 0;
  } else if (training.offloadTarget === "cpu_all") {
    offloadedCpuRamBytes += gpuOptimizerBytes + gpuModelWeightsBytes;
    gpuOptimizerBytes = 0;
  } else if (training.offloadTarget === "nvme_all") {
    offloadedNvmeBytes += gpuOptimizerBytes + gpuModelWeightsBytes;
    gpuOptimizerBytes = 0;
  }

  // Activation memory
  const actInfo = calculateActivationMemory(model, training);
  const gpuActivationBytes = actInfo.totalActivationBytes;

  // Transient working buffer (unsharded layer weights in ZeRO-3)
  const gpuTransientBytes = calculateWorkingTransientBuffer(model, training);

  // CUDA Runtime & Context Overhead (~1.2 GB fixed)
  const cudaOverheadBytes = 1.2 * 1e9;

  // Convert to Gigabytes (1 GB = 1e9 bytes)
  const modelWeightsGb = gpuModelWeightsBytes / 1e9;
  const gradientsGb = gpuGradientsBytes / 1e9;
  const optimizerStatesGb = gpuOptimizerBytes / 1e9;
  const activationsGb = gpuActivationBytes / 1e9;
  const transientBufferGb = gpuTransientBytes / 1e9;
  const cudaOverheadGb = cudaOverheadBytes / 1e9;

  const totalGpuVramRequiredGb =
    modelWeightsGb +
    gradientsGb +
    optimizerStatesGb +
    activationsGb +
    transientBufferGb +
    cudaOverheadGb;

  const gpuSpec = getGpuSpec(cluster.gpuModelId);
  const gpuCapacityGb = gpuSpec.vramGb;
  const gpuHeadroomGb = gpuCapacityGb - totalGpuVramRequiredGb;
  const gpuUtilizationPct = Math.min(100, (totalGpuVramRequiredGb / gpuCapacityGb) * 100);
  const isOOM = totalGpuVramRequiredGb > gpuCapacityGb;

  const offloadedCpuRamGb = offloadedCpuRamBytes / 1e9;
  const offloadedNvmeGb = offloadedNvmeBytes / 1e9;
  const totalClusterVramGb = totalGpuVramRequiredGb * numGpus;

  const items: readonly MemoryItem[] = [
    {
      name: "Model Weights (Sharded)",
      category: "model",
      sizeGb: modelWeightsGb,
      color: "#38bdf8", // Sky blue
      description: `Model parameter tensor shards (${training.modelPrecision.toUpperCase()})`,
    },
    {
      name: "Gradients (Sharded)",
      category: "grad",
      sizeGb: gradientsGb,
      color: "#818cf8", // Indigo
      description: "Backward activation & weight gradients slice",
    },
    {
      name: "Optimizer States",
      category: "optim",
      sizeGb: optimizerStatesGb,
      color: "#c084fc", // Purple
      description: `${training.optimizerType.toUpperCase()} FP32 master weights, momentum & variance`,
    },
    {
      name: "Activations",
      category: "act",
      sizeGb: activationsGb,
      color: "#34d399", // Emerald
      description: `Forward activation cache (Checkpt: ${training.activationCheckpointing}, FlashAttn: ${
        training.useFlashAttention ? "ON" : "OFF"
      })`,
    },
    {
      name: "Transient Working Buffer",
      category: "transient",
      sizeGb: transientBufferGb,
      color: "#fbbf24", // Amber
      description: "Unsharded layer weights gathered during GEMM execution",
    },
    {
      name: "CUDA & System Context",
      category: "overhead",
      sizeGb: cudaOverheadGb,
      color: "#94a3b8", // Slate
      description: "CUDA runtime context, cuBLAS workspaces, and PyTorch allocator pool",
    },
  ];

  return {
    totalModelParamsB: model.totalParamsB,
    modelWeightsGb,
    gradientsGb,
    optimizerStatesGb,
    activationsGb,
    transientBufferGb,
    cudaOverheadGb,
    totalGpuVramRequiredGb,
    gpuCapacityGb,
    gpuHeadroomGb,
    gpuUtilizationPct,
    isOOM,
    offloadedCpuRamGb,
    offloadedNvmeGb,
    totalClusterVramGb,
    items,
  };
}

/**
 * Returns effective interconnect bandwidth in GB/s for a given interconnect type.
 */
export function getInterconnectBandwidthGbs(type: InterconnectType): number {
  return INTERCONNECT_SPECS[type]?.bandwidthGbs ?? 32;
}

/**
 * Retrieves GPU hardware specifications by ID with fallback.
 */
export function getGpuSpec(gpuId: string): GpuHardwareSpec {
  return GPU_HARDWARE_SPECS.find((g) => g.id === gpuId) ?? GPU_HARDWARE_SPECS[0];
}

/**
 * Calculates collective communication volume, step execution time, MFU, and throughput.
 */
export function calculateCollectiveCommunication(
  model: ModelArchitectureConfig,
  cluster: ClusterConfig,
  training: TrainingConfig,
): CommunicationAnalysisResult {
  const { totalParams } = calculateModelParamCount(model);
  const bpp = getPrecisionBytes(training.modelPrecision);
  const totalModelBytes = totalParams * bpp;
  const numGpus = Math.max(1, cluster.numGpus);
  const gpusPerNode = Math.max(1, Math.min(cluster.gpusPerNode, numGpus));
  const numNodes = Math.max(1, Math.ceil(numGpus / gpusPerNode));

  const intraBw = getInterconnectBandwidthGbs(cluster.intraNodeInterconnect);
  const interBw = getInterconnectBandwidthGbs(cluster.interNodeInterconnect);

  const ringScaleWorld = numGpus > 1 ? (numGpus - 1) / numGpus : 0;
  const ringScaleIntra = gpusPerNode > 1 ? (gpusPerNode - 1) / gpusPerNode : 0;
  const ringScaleInter = numNodes > 1 ? (numNodes - 1) / numNodes : 0;

  let forwardCommBytes = 0;
  let backwardCommBytes = 0;
  let commMultiplierVsDDP = 1.0;
  let intraNodeCommBytes = 0;
  let interNodeCommBytes = 0;

  switch (training.shardingStrategy) {
    case "zero0_ddp":
      forwardCommBytes = 0;
      backwardCommBytes = 2 * ringScaleWorld * totalModelBytes;
      commMultiplierVsDDP = 1.0;
      if (numNodes > 1) {
        interNodeCommBytes = backwardCommBytes;
      } else {
        intraNodeCommBytes = backwardCommBytes;
      }
      break;

    case "zero1_opt":
    case "zero2_opt_grad":
      forwardCommBytes = 0;
      backwardCommBytes = 2 * ringScaleWorld * totalModelBytes;
      commMultiplierVsDDP = 1.0;
      if (numNodes > 1) {
        interNodeCommBytes = backwardCommBytes;
      } else {
        intraNodeCommBytes = backwardCommBytes;
      }
      break;

    case "zero3_full":
      forwardCommBytes = 1 * ringScaleWorld * totalModelBytes;
      backwardCommBytes = 2 * ringScaleWorld * totalModelBytes;
      commMultiplierVsDDP = 1.5;
      if (numNodes > 1) {
        interNodeCommBytes = forwardCommBytes + backwardCommBytes;
      } else {
        intraNodeCommBytes = forwardCommBytes + backwardCommBytes;
      }
      break;

    case "hybrid_shard": {
      const intraZeRO3Bytes = 3 * ringScaleIntra * totalModelBytes;
      const interDdpBytes = numNodes > 1 ? 2 * ringScaleInter * (totalModelBytes / gpusPerNode) : 0;

      intraNodeCommBytes = intraZeRO3Bytes;
      interNodeCommBytes = interDdpBytes;
      forwardCommBytes = 1 * ringScaleIntra * totalModelBytes;
      backwardCommBytes = 2 * ringScaleIntra * totalModelBytes + interDdpBytes;
      commMultiplierVsDDP =
        (intraZeRO3Bytes + interDdpBytes) / Math.max(1, 2 * ringScaleWorld * totalModelBytes);
      break;
    }
  }

  const totalCommBytesPerStep = forwardCommBytes + backwardCommBytes;

  const effectiveBandwidthGbs =
    numNodes > 1
      ? (intraNodeCommBytes * intraBw + interNodeCommBytes * interBw) /
        Math.max(1, intraNodeCommBytes + interNodeCommBytes)
      : intraBw;

  const busEfficiency = 0.85;
  const intraCommTimeMs = (intraNodeCommBytes / (intraBw * 1e9 * busEfficiency)) * 1000;
  const interCommTimeMs =
    numNodes > 1 ? (interNodeCommBytes / (interBw * 1e9 * busEfficiency)) * 1000 : 0;
  const commTimeMs = intraCommTimeMs + interCommTimeMs;

  const flopsPerToken =
    training.activationCheckpointing === "full"
      ? 8 * totalParams
      : training.activationCheckpointing === "selective"
        ? 6.6 * totalParams
        : 6 * totalParams;

  const globalBatchTokens = training.microBatchSize * training.seqLength * numGpus;
  const theoreticalFlopsPerStep = flopsPerToken * globalBatchTokens;

  const gpuSpec = getGpuSpec(cluster.gpuModelId);
  const peakTflopsPerGpu =
    training.modelPrecision === "fp8" ? gpuSpec.tflopsFp8 : gpuSpec.tflopsBf16;
  const totalClusterPeakTflops = peakTflopsPerGpu * numGpus;

  const gemmEfficiency = 0.55;
  const computeTimeMs =
    (theoreticalFlopsPerStep / (totalClusterPeakTflops * 1e12 * gemmEfficiency)) * 1000;

  const overlapFactor = training.forwardPrefetch || training.backwardPrefetch ? 0.75 : 0.2;
  const exposedCommTimeMs = Math.max(0, commTimeMs - computeTimeMs * overlapFactor);

  let offloadTransferTimeMs = 0;
  if (training.offloadTarget !== "none") {
    const offloadAnalysis = calculateOffloadingTimeline(model, cluster, training);
    offloadTransferTimeMs = offloadAnalysis.stallBubbleMs;
  }

  const kernelOverheadMs = 1.5;
  const stepTimeMs = computeTimeMs + exposedCommTimeMs + offloadTransferTimeMs + kernelOverheadMs;

  const achievedFlopsPerSec = theoreticalFlopsPerStep / (stepTimeMs / 1000);
  const mfuPct = Math.min(100, (achievedFlopsPerSec / (totalClusterPeakTflops * 1e12)) * 100);

  const globalTokensPerSec = globalBatchTokens / (stepTimeMs / 1000);
  const tokensPerSecPerGpu = globalTokensPerSec / numGpus;
  const tflopsPerGpu = achievedFlopsPerSec / 1e12 / numGpus;

  return {
    forwardCommBytesPerStep: forwardCommBytes,
    backwardCommBytesPerStep: backwardCommBytes,
    totalCommBytesPerStep,
    commMultiplierVsDDP,
    intraNodeCommBytes,
    interNodeCommBytes,
    effectiveBandwidthGbs,
    commTimeMs,
    computeTimeMs,
    exposedCommTimeMs,
    offloadTransferTimeMs,
    stepTimeMs,
    mfuPct,
    tokensPerSecPerGpu,
    globalTokensPerSec,
    tflopsPerGpu,
    theoreticalFlopsPerStep,
  };
}

/**
 * Calculates CPU / NVMe asynchronous offloading timeline and memory hierarchy.
 */
export function calculateOffloadingTimeline(
  model: ModelArchitectureConfig,
  cluster: ClusterConfig,
  training: TrainingConfig,
): OffloadingAnalysisResult {
  const { totalParams } = calculateModelParamCount(model);
  const bppModel = getPrecisionBytes(training.modelPrecision);
  const optimBytesInfo = getOptimizerBytesPerParam(training.optimizerType);

  let offloadBytes = 0;
  let isNvme = false;

  if (training.offloadTarget === "cpu_optimizer") {
    offloadBytes = (totalParams * optimBytesInfo.totalBytes) / Math.max(1, cluster.numGpus);
  } else if (training.offloadTarget === "cpu_all") {
    offloadBytes =
      (totalParams * (optimBytesInfo.totalBytes + bppModel)) / Math.max(1, cluster.numGpus);
  } else if (training.offloadTarget === "nvme_all") {
    offloadBytes =
      (totalParams * (optimBytesInfo.totalBytes + bppModel)) / Math.max(1, cluster.numGpus);
    isNvme = true;
  }

  const cpuRamRequiredGb = isNvme ? 0 : offloadBytes / 1e9;
  const nvmeRequiredGb = isNvme ? offloadBytes / 1e9 : 0;

  const hostRamHeadroomGb = cluster.cpuRamPerNodeGb - cpuRamRequiredGb * cluster.gpusPerNode;
  const isHostRamOOM = hostRamHeadroomGb < 0;

  const pcieBw = isNvme ? cluster.nvmeBandwidthGbs : 25.0;

  const transferBytesPerStep = offloadBytes * 2;
  const transferTimeMs = (transferBytesPerStep / (pcieBw * 1e9)) * 1000;

  const gpuSpec = getGpuSpec(cluster.gpuModelId);
  const totalFlops = 6 * totalParams * training.microBatchSize * training.seqLength;
  const computeTimeMs = (totalFlops / (gpuSpec.tflopsBf16 * 1e12 * 0.5)) * 1000;

  const overlapEfficiencyPct =
    transferTimeMs <= computeTimeMs
      ? 100
      : Math.max(0, Math.round((computeTimeMs / transferTimeMs) * 100));

  const stallBubbleMs = Math.max(0, transferTimeMs - computeTimeMs);

  return {
    cpuRamRequiredGb,
    nvmeRequiredGb,
    transferTimeMs,
    computeTimeMs,
    overlapEfficiencyPct,
    stallBubbleMs,
    isHostRamOOM,
    hostRamHeadroomGb,
  };
}

/**
 * Generates interactive step simulation timeline for collective communication visualizer.
 */
export function generateTrainingStepperSteps(
  model: ModelArchitectureConfig,
  cluster: ClusterConfig,
  training: TrainingConfig,
  numVisualLayers: number = 4,
): readonly StepSimulationState[] {
  const { layerParams } = calculateModelParamCount(model);
  const bpp = getPrecisionBytes(training.modelPrecision);
  const layerBytes = layerParams * bpp;
  const numGpus = Math.max(1, Math.min(8, cluster.numGpus));
  const memBreakdown = calculateMemoryBreakdown(model, cluster, training);

  const baselineVram =
    memBreakdown.modelWeightsGb +
    memBreakdown.gradientsGb +
    memBreakdown.optimizerStatesGb +
    memBreakdown.cudaOverheadGb;

  const fullLayerVramGb = layerBytes / 1e9;
  const actLayerVramGb = memBreakdown.activationsGb / Math.max(1, numVisualLayers);

  const steps: StepSimulationState[] = [];
  let stepCounter = 1;

  // 1. Forward Pass Layers
  for (let l = 0; l < numVisualLayers; l++) {
    const isZeRO3 =
      training.shardingStrategy === "zero3_full" || training.shardingStrategy === "hybrid_shard";

    if (isZeRO3) {
      const activeLinks = [];
      for (let g = 0; g < numGpus; g++) {
        activeLinks.push({
          fromGpu: g,
          toGpu: (g + 1) % numGpus,
          bytesTransferred: layerBytes / numGpus,
          progress: 0.5,
        });
      }

      steps.push({
        id: `fwd_ag_layer_${l}`,
        stepNumber: stepCounter++,
        layerIndex: l,
        phase: "forward_allgather",
        activeCollective: "all_gather",
        layerName: `Transformer Block ${l}`,
        layerParamCount: layerParams,
        layerParamBytes: layerBytes,
        collectiveTransferBytes: ((numGpus - 1) / numGpus) * layerBytes,
        gpuVramAllocations: Array(numGpus).fill(
          baselineVram + fullLayerVramGb + l * actLayerVramGb,
        ),
        activeLinks,
        stepTitle: `Forward All-Gather: Layer ${l}`,
        stepDescription: `All ${numGpus} GPUs broadcast their 1/${numGpus} shard of Layer ${l} parameters via Ring All-Gather to materialize the full unsharded layer in VRAM.`,
        mathFormula: `W_l = \\text{AllGather}(\\{W_l^{(0)}, W_l^{(1)}, \\dots, W_l^{(N-1)}\\})`,
        transientVramGb: fullLayerVramGb,
      });
    }

    steps.push({
      id: `fwd_compute_layer_${l}`,
      stepNumber: stepCounter++,
      layerIndex: l,
      phase: "forward_compute",
      activeCollective: "none",
      layerName: `Transformer Block ${l}`,
      layerParamCount: layerParams,
      layerParamBytes: layerBytes,
      collectiveTransferBytes: 0,
      gpuVramAllocations: Array(numGpus).fill(
        baselineVram + (isZeRO3 ? fullLayerVramGb : 0) + (l + 1) * actLayerVramGb,
      ),
      activeLinks: [],
      stepTitle: `Forward Compute: Layer ${l}`,
      stepDescription: `Execute Attention and MLP forward GEMMs on local micro-batch. Activations are cached in VRAM for backward pass.`,
      mathFormula: `X_{l+1} = \\text{TransformerLayer}_l(X_l, W_l)`,
      transientVramGb: fullLayerVramGb,
    });

    if (isZeRO3) {
      steps.push({
        id: `fwd_free_layer_${l}`,
        stepNumber: stepCounter++,
        layerIndex: l,
        phase: "forward_free",
        activeCollective: "none",
        layerName: `Transformer Block ${l}`,
        layerParamCount: layerParams,
        layerParamBytes: layerBytes,
        collectiveTransferBytes: 0,
        gpuVramAllocations: Array(numGpus).fill(baselineVram + (l + 1) * actLayerVramGb),
        activeLinks: [],
        stepTitle: `Forward Free Params: Layer ${l}`,
        stepDescription: `Discard the full unsharded parameters of Layer ${l} from VRAM to preserve memory headroom. Only local shard remains.`,
        mathFormula: `\\text{free}(W_l \\setminus W_l^{(rank)})`,
        transientVramGb: 0,
      });
    }
  }

  // 2. Loss & Output Backward
  steps.push({
    id: "loss_computation",
    stepNumber: stepCounter++,
    layerIndex: numVisualLayers - 1,
    phase: "loss",
    activeCollective: "none",
    layerName: "Cross-Entropy Loss & Classifier",
    layerParamCount: 0,
    layerParamBytes: 0,
    collectiveTransferBytes: 0,
    gpuVramAllocations: Array(numGpus).fill(baselineVram + numVisualLayers * actLayerVramGb),
    activeLinks: [],
    stepTitle: "Loss Computation & Backward Seed",
    stepDescription:
      "Compute cross-entropy loss against labels and seed backpropagation with dLoss/dOutput.",
    mathFormula: `\\mathcal{L} = -\\sum y \\log(\\hat{y}), \\quad \\nabla X_{out} = \\frac{\\partial \\mathcal{L}}{\\partial X_{out}}`,
    transientVramGb: 0,
  });

  // 3. Backward Pass Layers
  for (let l = numVisualLayers - 1; l >= 0; l--) {
    const isZeRO3 =
      training.shardingStrategy === "zero3_full" || training.shardingStrategy === "hybrid_shard";

    if (isZeRO3) {
      const activeLinks = [];
      for (let g = 0; g < numGpus; g++) {
        activeLinks.push({
          fromGpu: g,
          toGpu: (g + 1) % numGpus,
          bytesTransferred: layerBytes / numGpus,
          progress: 0.5,
        });
      }

      steps.push({
        id: `bwd_ag_layer_${l}`,
        stepNumber: stepCounter++,
        layerIndex: l,
        phase: "backward_allgather",
        activeCollective: "all_gather",
        layerName: `Transformer Block ${l}`,
        layerParamCount: layerParams,
        layerParamBytes: layerBytes,
        collectiveTransferBytes: ((numGpus - 1) / numGpus) * layerBytes,
        gpuVramAllocations: Array(numGpus).fill(
          baselineVram + fullLayerVramGb + (l + 1) * actLayerVramGb,
        ),
        activeLinks,
        stepTitle: `Backward All-Gather: Layer ${l}`,
        stepDescription: `Re-All-Gather Layer ${l} weights required to compute gradients with respect to layer inputs and parameters.`,
        mathFormula: `W_l = \\text{AllGather}(\\{W_l^{(0)}, \\dots, W_l^{(N-1)}\\})`,
        transientVramGb: fullLayerVramGb,
      });
    }

    steps.push({
      id: `bwd_compute_layer_${l}`,
      stepNumber: stepCounter++,
      layerIndex: l,
      phase: "backward_compute",
      activeCollective: "none",
      layerName: `Transformer Block ${l}`,
      layerParamCount: layerParams,
      layerParamBytes: layerBytes,
      collectiveTransferBytes: 0,
      gpuVramAllocations: Array(numGpus).fill(
        baselineVram + (isZeRO3 ? fullLayerVramGb * 2 : 0) + l * actLayerVramGb,
      ),
      activeLinks: [],
      stepTitle: `Backward Compute: Layer ${l}`,
      stepDescription: `Compute activation gradients dX_l and parameter gradients dW_l. Cached forward activations for this layer are freed.`,
      mathFormula: `\\nabla W_l = X_l^T \\cdot \\nabla Y_l, \\quad \\nabla X_l = \\nabla Y_l \\cdot W_l^T`,
      transientVramGb: fullLayerVramGb * 2,
    });

    const isReduceScatter =
      training.shardingStrategy === "zero2_opt_grad" ||
      training.shardingStrategy === "zero3_full" ||
      training.shardingStrategy === "hybrid_shard";

    const activeLinks = [];
    for (let g = 0; g < numGpus; g++) {
      activeLinks.push({
        fromGpu: g,
        toGpu: (g + 1) % numGpus,
        bytesTransferred: layerBytes / numGpus,
        progress: 0.8,
      });
    }

    steps.push({
      id: `bwd_comm_layer_${l}`,
      stepNumber: stepCounter++,
      layerIndex: l,
      phase: "backward_reducescatter",
      activeCollective: isReduceScatter ? "reduce_scatter" : "all_reduce",
      layerName: `Transformer Block ${l}`,
      layerParamCount: layerParams,
      layerParamBytes: layerBytes,
      collectiveTransferBytes: ((numGpus - 1) / numGpus) * layerBytes,
      gpuVramAllocations: Array(numGpus).fill(baselineVram + l * actLayerVramGb),
      activeLinks,
      stepTitle: isReduceScatter
        ? `Reduce-Scatter Gradients: Layer ${l}`
        : `All-Reduce Gradients: Layer ${l}`,
      stepDescription: isReduceScatter
        ? `Gradients dW_l are averaged and scattered across GPUs so each rank retains only its 1/${numGpus} partition.`
        : `Gradients dW_l are averaged across all GPUs so every rank retains the full gradient tensor.`,
      mathFormula: isReduceScatter
        ? `\\nabla W_l^{(rank)} = \\text{ReduceScatter}(\\nabla W_l)`
        : `\\nabla W_l = \\text{AllReduce}(\\nabla W_l)`,
      transientVramGb: 0,
    });
  }

  // 4. Optimizer Step
  steps.push({
    id: "optimizer_update_step",
    stepNumber: stepCounter++,
    layerIndex: 0,
    phase: "optimizer_step",
    activeCollective: "none",
    layerName: "AdamW Optimizer Step",
    layerParamCount: model.totalParamsB * 1e9,
    layerParamBytes: (model.totalParamsB * 1e9 * bpp) / numGpus,
    collectiveTransferBytes: 0,
    gpuVramAllocations: Array(numGpus).fill(baselineVram),
    activeLinks: [],
    stepTitle: "Local Sharded Optimizer Update",
    stepDescription: `Each GPU independently executes AdamW update on its owned parameter shard: m = beta1*m + (1-beta1)*g, v = beta2*v + (1-beta2)*g^2, w = w - lr * m / (sqrt(v) + eps).`,
    mathFormula: `W^{(rank)} \\leftarrow W^{(rank)} - \\eta \\cdot \\frac{m_t}{\\sqrt{v_t} + \\epsilon} - \\eta \\lambda W^{(rank)}`,
    transientVramGb: 0,
  });

  return steps;
}

/**
 * Calculates maximum possible micro-batch size that fits in GPU VRAM before OOM.
 */
export function calculateMaxBatchSize(
  model: ModelArchitectureConfig,
  cluster: ClusterConfig,
  training: TrainingConfig,
): number {
  let low = 1;
  let high = 128;
  let best = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const testTraining = { ...training, microBatchSize: mid };
    const mem = calculateMemoryBreakdown(model, cluster, testTraining);

    if (!mem.isOOM) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

/**
 * Calculates cluster scaling sweep across multiple GPU counts (1, 2, 4, 8, 16, 32, 64, 128, 256, 512).
 */
export function calculateClusterScalingSweep(
  model: ModelArchitectureConfig,
  baseCluster: ClusterConfig,
  training: TrainingConfig,
  worldSizes: readonly number[] = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512],
): readonly {
  readonly worldSize: number;
  readonly numNodes: number;
  readonly vramPerGpuGb: number;
  readonly commTimeMs: number;
  readonly computeTimeMs: number;
  readonly mfuPct: number;
  readonly isOOM: boolean;
}[] {
  return worldSizes.map((ws) => {
    const gpusPerNode = Math.min(8, ws);
    const numNodes = Math.max(1, Math.ceil(ws / gpusPerNode));
    const clusterConfig: ClusterConfig = {
      ...baseCluster,
      numGpus: ws,
      numNodes,
      gpusPerNode,
    };

    const mem = calculateMemoryBreakdown(model, clusterConfig, training);
    const comm = calculateCollectiveCommunication(model, clusterConfig, training);

    return {
      worldSize: ws,
      numNodes,
      vramPerGpuGb: mem.totalGpuVramRequiredGb,
      commTimeMs: comm.commTimeMs,
      computeTimeMs: comm.computeTimeMs,
      mfuPct: mem.isOOM ? 0 : comm.mfuPct,
      isOOM: mem.isOOM,
    };
  });
}

/**
 * Formats byte values into readable string (B, KB, MB, GB, TB).
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
  const k = 1000;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  const idx = Math.min(sizes.length - 1, Math.max(0, i));
  return `${(bytes / Math.pow(k, idx)).toFixed(decimals)} ${sizes[idx]}`;
}

/**
 * Formats FLOP values into readable string (TFLOPs, PFLOPs, EFLOPs).
 */
export function formatFlops(flops: number, decimals: number = 2): string {
  if (!Number.isFinite(flops) || flops === 0) return "0 FLOPs";
  if (flops >= 1e18) return `${(flops / 1e18).toFixed(decimals)} EFLOPs`;
  if (flops >= 1e15) return `${(flops / 1e15).toFixed(decimals)} PFLOPs`;
  if (flops >= 1e12) return `${(flops / 1e12).toFixed(decimals)} TFLOPs`;
  if (flops >= 1e9) return `${(flops / 1e9).toFixed(decimals)} GFLOPs`;
  return `${flops.toFixed(decimals)} FLOPs`;
}

/**
 * Formats bandwidth into readable string (GB/s or Gbps).
 */
export function formatBandwidth(gbs: number): string {
  if (gbs >= 1000) return `${(gbs / 1000).toFixed(1)} TB/s`;
  return `${gbs.toFixed(1)} GB/s`;
}

/**
 * Generates production-ready PyTorch FSDP code configuration.
 */
export function generatePyTorchFSDPCode(
  _model: ModelArchitectureConfig,
  _cluster: ClusterConfig,
  training: TrainingConfig,
): string {
  let shardingStrategyStr = "ShardingStrategy.FULL_SHARD";
  if (training.shardingStrategy === "zero2_opt_grad") {
    shardingStrategyStr = "ShardingStrategy.SHARD_GRAD_OP";
  } else if (
    training.shardingStrategy === "zero1_opt" ||
    training.shardingStrategy === "zero0_ddp"
  ) {
    shardingStrategyStr = "ShardingStrategy.NO_SHARD";
  } else if (training.shardingStrategy === "hybrid_shard") {
    shardingStrategyStr = "ShardingStrategy.HYBRID_SHARD";
  }

  const mpDtype = training.modelPrecision === "bf16" ? "torch.bfloat16" : "torch.float16";
  const hasOffload = training.offloadTarget !== "none";

  return `import torch
import torch.nn as nn
import torch.distributed as dist
from torch.distributed.fsdp import (
    FullyShardedDataParallel as FSDP,
    ShardingStrategy,
    MixedPrecision,
    BackwardPrefetch,
    CPUOffload,
)
from torch.distributed.fsdp.wrap import (
    transformer_auto_wrap_policy,
    size_based_auto_wrap_policy,
)

# 1. Mixed Precision Policy (${training.modelPrecision.toUpperCase()})
mp_policy = MixedPrecision(
    param_dtype=${mpDtype},
    reduce_dtype=${mpDtype},
    buffer_dtype=${mpDtype},
)

# 2. CPU Offloading Policy
cpu_offload_policy = CPUOffload(offload_params=${hasOffload ? "True" : "False"})

# 3. Model Wrapping with FSDP (${training.shardingStrategy.toUpperCase()})
model = FSDP(
    model,
    sharding_strategy=${shardingStrategyStr},
    mixed_precision=mp_policy,
    cpu_offload=cpu_offload_policy,
    backward_prefetch=${training.backwardPrefetch ? "BackwardPrefetch.BACKWARD_PRE" : "None"},
    forward_prefetch=${training.forwardPrefetch ? "True" : "False"},
    limit_all_gathers=${training.limitAllGathers ? "True" : "False"},
    device_id=torch.cuda.current_device(),
)

# 4. Activation Checkpointing
${
  training.activationCheckpointing !== "none"
    ? `from torch.distributed.algorithms._checkpoint.checkpoint_wrapper import (
    checkpoint_wrapper,
    CheckpointImpl,
    apply_activation_checkpointing,
)
apply_activation_checkpointing(
    model,
    checkpoint_wrapper_fn=lambda module: checkpoint_wrapper(
        module, checkpoint_impl=CheckpointImpl.NO_REENTRANT
    ),
)`
    : "# Activation checkpointing disabled"
}

# 5. Optimizer Configuration
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-4,
    betas=(0.9, 0.95),
    weight_decay=0.1,
    fused=True,
)
`;
}

/**
 * Generates DeepSpeed JSON configuration.
 */
export function generateDeepSpeedConfig(
  model: ModelArchitectureConfig,
  cluster: ClusterConfig,
  training: TrainingConfig,
): string {
  let stage = 3;
  if (training.shardingStrategy === "zero0_ddp") stage = 0;
  if (training.shardingStrategy === "zero1_opt") stage = 1;
  if (training.shardingStrategy === "zero2_opt_grad") stage = 2;
  if (training.shardingStrategy === "zero3_full" || training.shardingStrategy === "hybrid_shard")
    stage = 3;

  const config = {
    train_micro_batch_size_per_gpu: training.microBatchSize,
    gradient_accumulation_steps: 1,
    steps_per_print: 10,
    bf16: {
      enabled: training.modelPrecision === "bf16",
    },
    fp16: {
      enabled: training.modelPrecision === "fp16",
      loss_scale: 0,
      initial_scale_power: 16,
    },
    zero_optimization: {
      stage: stage,
      offload_optimizer: {
        device:
          training.offloadTarget === "cpu_optimizer" || training.offloadTarget === "cpu_all"
            ? "cpu"
            : "none",
        pin_memory: true,
      },
      offload_param: {
        device:
          training.offloadTarget === "cpu_all"
            ? "cpu"
            : training.offloadTarget === "nvme_all"
              ? "nvme"
              : "none",
        nvme_path: training.offloadTarget === "nvme_all" ? "/local_nvme" : undefined,
        pin_memory: true,
      },
      overlap_comm: training.backwardPrefetch,
      contiguous_gradients: true,
      sub_group_size: cluster.gpusPerNode,
      reduce_bucket_size: 500000000,
      stage3_prefetch_bucket_size: 50000000,
      stage3_param_persistence_threshold: 1000000,
      stage3_max_live_parameters: 1000000000,
      stage3_max_reuse_distance: 1000000000,
      stage3_gather_16bit_weights_on_model_save: true,
    },
    activation_checkpointing: {
      partition_activations: training.activationCheckpointing === "full",
      cpu_checkpointing: false,
      contiguous_memory_optimization: true,
      number_checkpoints: training.activationCheckpointing !== "none" ? model.numLayers : undefined,
    },
    wall_clock_breakdown: false,
  };

  return JSON.stringify(config, null, 2);
}

// ============================================================================
// 4. PRODUCTION PRESETS
// ============================================================================

export const FSDP_PRESETS: Record<FSDPPresetId, FSDPPreset> = {
  llama3_8b_8x_h100: {
    id: "llama3_8b_8x_h100",
    name: "LLaMA-3-8B on 8x H100 SXM5",
    subtitle: "Dense 8B | Single Node | High-Throughput FSDP Full Shard",
    description:
      "Meta LLaMA-3 8B trained across 8x H100 SXM5 GPUs interconnected with 900 GB/s NVLink 4. Fits comfortably in VRAM with high MFU and rapid iteration speed.",
    architectureFamily: "LLaMA-3 (Meta AI)",
    model: {
      name: "LLaMA-3-8B",
      totalParamsB: 8.03,
      numLayers: 32,
      hiddenDim: 4096,
      numAttentionHeads: 32,
      numKvHeads: 8,
      intermediateDim: 14336,
      vocabSize: 128256,
    },
    cluster: {
      numGpus: 8,
      numNodes: 1,
      gpusPerNode: 8,
      gpuModelId: "h100_80gb",
      intraNodeInterconnect: "nvlink_4_900gb",
      interNodeInterconnect: "infiniband_800gbps",
      cpuRamPerNodeGb: 1024,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 2,
      seqLength: 4096,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "selective",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "zero3_full",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "Fits in single 8-GPU node with >50 GB VRAM headroom",
      "900 GB/s NVLink 4 completely hides All-Gather latency",
      "GQA (8 KV heads) reduces activation memory by ~40%",
      "Selective checkpointing enables fast iteration without recompute bubbles",
    ],
  },

  llama3_70b_8x_h100: {
    id: "llama3_70b_8x_h100",
    name: "LLaMA-3-70B on 8x H100 SXM5",
    subtitle: "Dense 70B | Single Node ZeRO-3 Memory Pressure Stress",
    description:
      "LLaMA-3 70B sharded across a single 8x H100 node. Pushes VRAM capacity to the limit; demonstrates how ZeRO-3 full sharding enables 70B training without pipeline parallelism.",
    architectureFamily: "LLaMA-3 (Meta AI)",
    model: {
      name: "LLaMA-3-70B",
      totalParamsB: 70.6,
      numLayers: 80,
      hiddenDim: 8192,
      numAttentionHeads: 64,
      numKvHeads: 8,
      intermediateDim: 28672,
      vocabSize: 128256,
    },
    cluster: {
      numGpus: 8,
      numNodes: 1,
      gpusPerNode: 8,
      gpuModelId: "h100_80gb",
      intraNodeInterconnect: "nvlink_4_900gb",
      interNodeInterconnect: "infiniband_800gbps",
      cpuRamPerNodeGb: 1024,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 2,
      seqLength: 4096,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "full",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "zero3_full",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "ZeRO-3 shards 1.13 TB of weights & optimizer states down to 141 GB per GPU cluster slice",
      "Full activation checkpointing keeps activations under 12 GB",
      "NVLink 4 keeps All-Gather communication overhead under 15% of compute time",
    ],
  },

  llama3_70b_32x_a100: {
    id: "llama3_70b_32x_a100",
    name: "LLaMA-3-70B on 32x A100 (Hybrid Shard)",
    subtitle: "Dense 70B | 4 Nodes | Intra-Node ZeRO-3 + Inter-Node DDP",
    description:
      "Multi-node LLaMA-3-70B scaling across 4 nodes (32 GPUs). Uses Hybrid Sharding (HSDP) to avoid slow inter-node All-Gather collectives over InfiniBand.",
    architectureFamily: "LLaMA-3 (Meta AI)",
    model: {
      name: "LLaMA-3-70B",
      totalParamsB: 70.6,
      numLayers: 80,
      hiddenDim: 8192,
      numAttentionHeads: 64,
      numKvHeads: 8,
      intermediateDim: 28672,
      vocabSize: 128256,
    },
    cluster: {
      numGpus: 32,
      numNodes: 4,
      gpusPerNode: 8,
      gpuModelId: "a100_80gb",
      intraNodeInterconnect: "nvlink_3_600gb",
      interNodeInterconnect: "infiniband_400gbps",
      cpuRamPerNodeGb: 1024,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 2,
      seqLength: 4096,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "full",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "hybrid_shard",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "Intra-node ZeRO-3 utilizes 600 GB/s NVLink 3 without touching InfiniBand for weights",
      "Inter-node All-Reduce gradients run over 400 Gbps InfiniBand across 4 nodes",
      "Achieves ~48% MFU on A100 cluster",
    ],
  },

  llama3_405b_512x_h100: {
    id: "llama3_405b_512x_h100",
    name: "LLaMA-3-405B on 512x H100 (64 Nodes)",
    subtitle: "Dense 405B Megamodel | 512 GPUs | Frontier Scale",
    description:
      "Meta's flagship 405B parameter model trained across 64 nodes (512x H100 80GB) using Hybrid Sharding with 8-way intra-node ZeRO-3 and 64-way inter-node DDP replication.",
    architectureFamily: "LLaMA-3 (Meta AI)",
    model: {
      name: "LLaMA-3-405B",
      totalParamsB: 405.0,
      numLayers: 126,
      hiddenDim: 16384,
      numAttentionHeads: 128,
      numKvHeads: 8,
      intermediateDim: 53248,
      vocabSize: 128256,
    },
    cluster: {
      numGpus: 512,
      numNodes: 64,
      gpusPerNode: 8,
      gpuModelId: "h100_80gb",
      intraNodeInterconnect: "nvlink_4_900gb",
      interNodeInterconnect: "infiniband_800gbps",
      cpuRamPerNodeGb: 2048,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 1,
      seqLength: 8192,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "full",
      useFlashAttention: true,
      sequenceParallelSize: 2,
      shardingStrategy: "hybrid_shard",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "Total model state = 6.48 TB sharded efficiently across cluster",
      "Sequence parallelism (SP=2) halves 8k activation footprint",
      "Global batch throughput exceeds 2.1M tokens per second",
    ],
  },

  deepseek_v3_256x_h100: {
    id: "deepseek_v3_256x_h100",
    name: "DeepSeek-V3 671B on 256x H100 (32 Nodes)",
    subtitle: "MoE 671B (37B active) | FP8 Mixed Precision | 256 GPUs",
    description:
      "DeepSeek-V3 671B Mixture-of-Experts architecture utilizing FP8 parameters and DualPipe overlap across 32 nodes of 8x H100.",
    architectureFamily: "DeepSeek-V3 MoE",
    model: {
      name: "DeepSeek-V3-671B",
      totalParamsB: 671.0,
      numLayers: 61,
      hiddenDim: 7168,
      numAttentionHeads: 128,
      numKvHeads: 128,
      intermediateDim: 18432,
      vocabSize: 102400,
    },
    cluster: {
      numGpus: 256,
      numNodes: 32,
      gpusPerNode: 8,
      gpuModelId: "h100_80gb",
      intraNodeInterconnect: "nvlink_4_900gb",
      interNodeInterconnect: "infiniband_800gbps",
      cpuRamPerNodeGb: 2048,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 1,
      seqLength: 4096,
      modelPrecision: "fp8",
      optimizerType: "adamw_8bit",
      activationCheckpointing: "selective",
      useFlashAttention: true,
      sequenceParallelSize: 2,
      shardingStrategy: "hybrid_shard",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "FP8 precision cuts parameter and gradient memory footprint by 50%",
      "8-bit AdamW reduces optimizer state from 12B/param to 4B/param",
      "MoE sparse routing yields 37B active parameters per token",
    ],
  },

  mixtral_8x7b_8x_a100: {
    id: "mixtral_8x7b_8x_a100",
    name: "Mixtral 8x7B on 8x A100 (Single Node)",
    subtitle: "MoE 46.7B (12.9B active) | Single Node ZeRO-3",
    description:
      "Mistral AI Mixtral 8x7B MoE model sharded across an 8x A100 80GB node with ZeRO-3. Demonstrates fast expert routing and memory-constrained execution.",
    architectureFamily: "Mixtral (Mistral AI)",
    model: {
      name: "Mixtral-8x7B",
      totalParamsB: 46.7,
      numLayers: 32,
      hiddenDim: 4096,
      numAttentionHeads: 32,
      numKvHeads: 8,
      intermediateDim: 14336,
      vocabSize: 32000,
    },
    cluster: {
      numGpus: 8,
      numNodes: 1,
      gpusPerNode: 8,
      gpuModelId: "a100_80gb",
      intraNodeInterconnect: "nvlink_3_600gb",
      interNodeInterconnect: "infiniband_400gbps",
      cpuRamPerNodeGb: 1024,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 2,
      seqLength: 4096,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "full",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "zero3_full",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "Shards 46.7B parameters (~93.4 GB BF16) into 11.7 GB per GPU",
      "Fits easily into 80 GB A100 VRAM with micro-batch 2",
      "Sparse compute keeps FLOPs equivalent to a ~13B dense model",
    ],
  },

  gpt3_175b_64x_a100: {
    id: "gpt3_175b_64x_a100",
    name: "GPT-3 175B on 64x A100 (8 Nodes)",
    subtitle: "Classic 175B Architecture | 8 Nodes | Hybrid Shard",
    description:
      "The classic OpenAI GPT-3 175B model scaled across 8 nodes of 8x A100 80GB. Features standard Multi-Head Attention (96 heads) and dense MLP layers.",
    architectureFamily: "GPT-3 (OpenAI)",
    model: {
      name: "GPT-3-175B",
      totalParamsB: 175.0,
      numLayers: 96,
      hiddenDim: 12288,
      numAttentionHeads: 96,
      numKvHeads: 96,
      intermediateDim: 49152,
      vocabSize: 50257,
    },
    cluster: {
      numGpus: 64,
      numNodes: 8,
      gpusPerNode: 8,
      gpuModelId: "a100_80gb",
      intraNodeInterconnect: "nvlink_3_600gb",
      interNodeInterconnect: "infiniband_400gbps",
      cpuRamPerNodeGb: 1024,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 1,
      seqLength: 2048,
      modelPrecision: "fp16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "full",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "hybrid_shard",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "Total training state exceeds 2.8 TB",
      "Hybrid Sharding confines All-Gather to intra-node NVLink",
      "Classic MHA requires full activation checkpointing",
    ],
  },

  custom: {
    id: "custom",
    name: "Custom Cluster & Model Configuration",
    subtitle: "User-Defined Sharding & Memory Topology",
    description:
      "Fully configurable model architecture, cluster nodes, interconnect bandwidths, and FSDP/ZeRO settings. Tweak parameters to explore arbitrary distributed training setups.",
    architectureFamily: "Custom Architecture",
    model: {
      name: "Custom-LLM",
      totalParamsB: 13.0,
      numLayers: 40,
      hiddenDim: 5120,
      numAttentionHeads: 40,
      numKvHeads: 8,
      intermediateDim: 13824,
      vocabSize: 64000,
    },
    cluster: {
      numGpus: 8,
      numNodes: 1,
      gpusPerNode: 8,
      gpuModelId: "h100_80gb",
      intraNodeInterconnect: "nvlink_4_900gb",
      interNodeInterconnect: "infiniband_800gbps",
      cpuRamPerNodeGb: 1024,
      nvmeBandwidthGbs: 7.0,
    },
    training: {
      microBatchSize: 2,
      seqLength: 4096,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "selective",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "zero3_full",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    },
    highlights: [
      "Interactive sliders for parameter count and sequence length",
      "Live OOM threshold detection and headroom gauges",
      "Hardware interconnect bottleneck analysis",
    ],
  },
};

// ============================================================================
// 5. MAIN REACT STUDIO COMPONENT
// ============================================================================

export const FSDPZeROShardingStudio: React.FC<FSDPZeROShardingStudioProps> = ({
  initialPreset = "llama3_8b_8x_h100",
  initialModelConfig,
  initialClusterConfig,
  initialTrainingConfig,
  width = "100%",
  height = "auto",
  standalone = true,
  title = "PyTorch FSDP & DeepSpeed ZeRO-1/2/3 Sharding Studio",
  onPresetChange,
  onTabChange,
}) => {
  // 1. State Management
  const [selectedPresetId, setSelectedPresetId] = useState<FSDPPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<FSDPStudioTabId>("vram_breakdown");

  const [modelConfig, setModelConfig] = useState<ModelArchitectureConfig>(() => ({
    ...FSDP_PRESETS[initialPreset].model,
    ...initialModelConfig,
  }));

  const [clusterConfig, setClusterConfig] = useState<ClusterConfig>(() => ({
    ...FSDP_PRESETS[initialPreset].cluster,
    ...initialClusterConfig,
  }));

  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>(() => ({
    ...FSDP_PRESETS[initialPreset].training,
    ...initialTrainingConfig,
  }));

  // Stepper State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1200);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [codeType, setCodeType] = useState<"pytorch_fsdp" | "deepspeed_json">("pytorch_fsdp");

  // 2. Preset Selection Handler
  const handleSelectPreset = useCallback(
    (presetId: FSDPPresetId) => {
      setSelectedPresetId(presetId);
      const preset = FSDP_PRESETS[presetId];
      setModelConfig(preset.model);
      setClusterConfig(preset.cluster);
      setTrainingConfig(preset.training);
      setCurrentStepIndex(0);
      setIsPlaying(false);
      if (onPresetChange) onPresetChange(presetId);
    },
    [onPresetChange],
  );

  const handleTabChange = useCallback(
    (tabId: FSDPStudioTabId) => {
      setActiveTab(tabId);
      if (onTabChange) onTabChange(tabId);
    },
    [onTabChange],
  );

  // 3. Computed Mathematical Models
  const memBreakdown = useMemo(() => {
    return calculateMemoryBreakdown(modelConfig, clusterConfig, trainingConfig);
  }, [modelConfig, clusterConfig, trainingConfig]);

  const commAnalysis = useMemo(() => {
    return calculateCollectiveCommunication(modelConfig, clusterConfig, trainingConfig);
  }, [modelConfig, clusterConfig, trainingConfig]);

  const offloadAnalysis = useMemo(() => {
    return calculateOffloadingTimeline(modelConfig, clusterConfig, trainingConfig);
  }, [modelConfig, clusterConfig, trainingConfig]);

  const stepperSteps = useMemo(() => {
    return generateTrainingStepperSteps(modelConfig, clusterConfig, trainingConfig, 4);
  }, [modelConfig, clusterConfig, trainingConfig]);

  const maxBatchSize = useMemo(() => {
    return calculateMaxBatchSize(modelConfig, clusterConfig, trainingConfig);
  }, [modelConfig, clusterConfig, trainingConfig]);

  const clusterScalingData = useMemo(() => {
    return calculateClusterScalingSweep(modelConfig, clusterConfig, trainingConfig);
  }, [modelConfig, clusterConfig, trainingConfig]);

  // Current Step Simulation State
  const currentStep = useMemo(() => {
    if (stepperSteps.length === 0) return null;
    const idx = Math.max(0, Math.min(stepperSteps.length - 1, currentStepIndex));
    return stepperSteps[idx];
  }, [stepperSteps, currentStepIndex]);

  // Autoplay Timer Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= stepperSteps.length - 1) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, playbackSpeedMs);

    return () => clearInterval(interval);
  }, [isPlaying, stepperSteps.length, playbackSpeedMs]);

  // Copy Code Handler
  const handleCopyCode = useCallback(() => {
    const code =
      codeType === "pytorch_fsdp"
        ? generatePyTorchFSDPCode(modelConfig, clusterConfig, trainingConfig)
        : generateDeepSpeedConfig(modelConfig, clusterConfig, trainingConfig);

    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  }, [codeType, modelConfig, clusterConfig, trainingConfig]);

  // Active Preset Object
  const currentPreset = FSDP_PRESETS[selectedPresetId] ?? FSDP_PRESETS.llama3_8b_8x_h100;
  const currentGpuSpec = getGpuSpec(clusterConfig.gpuModelId);

  return (
    <div
      style={{ width, minHeight: height }}
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans ${
        standalone ? "p-4 sm:p-6" : ""
      }`}
    >
      {/* ==================================================================== */}
      {/* HEADER BAR & PRESETS SELECTOR */}
      {/* ==================================================================== */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-950/50">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                {title}
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                PyTorch 2.x & DeepSpeed
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Interactive ZeRO-1/2/3 & FSDP Memory Anatomy, Collective Stepper & Cluster Planner
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Presets:
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => handleSelectPreset(e.target.value as FSDPPresetId)}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 hover:border-slate-600 transition"
          >
            {Object.values(FSDP_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Preset Summary Banner */}
      <div className="mt-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">{currentPreset.subtitle}</span>
            <p className="text-slate-400 mt-0.5 leading-relaxed">{currentPreset.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {currentPreset.highlights.slice(0, 2).map((h, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-slate-800/90 text-slate-300 border border-slate-700 text-[11px]"
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* NAVIGATION TABS */}
      {/* ==================================================================== */}
      <nav className="flex items-center gap-1.5 mt-4 p-1 rounded-xl bg-slate-900/90 border border-slate-800 overflow-x-auto scrollbar-none">
        {[
          { id: "vram_breakdown", label: "VRAM Anatomy", icon: Layers },
          { id: "collective_stepper", label: "Collective Stepper", icon: Activity },
          { id: "offload_timeline", label: "CPU/NVMe Offload", icon: HardDrive },
          { id: "scaling_mfu", label: "Cluster Scaling & MFU", icon: TrendingUp },
          { id: "code_export", label: "PyTorch & DeepSpeed Code", icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as FSDPStudioTabId)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-950/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* ==================================================================== */}
      {/* GLOBAL CONTROLS STRIP (SHARDING STRATEGY & QUICK TOGGLES) */}
      {/* ==================================================================== */}
      <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sharding Strategy Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Sharding Strategy
          </label>
          <select
            value={trainingConfig.shardingStrategy}
            onChange={(e) =>
              setTrainingConfig((prev) => ({
                ...prev,
                shardingStrategy: e.target.value as ShardingStrategy,
              }))
            }
            className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="zero0_ddp">ZeRO-0 (DDP - Replicated)</option>
            <option value="zero1_opt">ZeRO-1 (Optimizer States Sharded)</option>
            <option value="zero2_opt_grad">ZeRO-2 (Optimizer + Gradients Sharded)</option>
            <option value="zero3_full">ZeRO-3 (Full Shard / FSDP Full)</option>
            <option value="hybrid_shard">Hybrid Shard (Intra ZeRO-3 + Inter DDP)</option>
          </select>
        </div>

        {/* Model Precision */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Precision Format
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(["fp32", "fp16", "bf16", "fp8"] as PrecisionFormat[]).map((p) => (
              <button
                key={p}
                onClick={() => setTrainingConfig((prev) => ({ ...prev, modelPrecision: p }))}
                className={`py-1.5 text-[11px] font-semibold rounded-lg uppercase transition ${
                  trainingConfig.modelPrecision === p
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Activation Checkpointing */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Activation Checkpointing
          </label>
          <select
            value={trainingConfig.activationCheckpointing}
            onChange={(e) =>
              setTrainingConfig((prev) => ({
                ...prev,
                activationCheckpointing: e.target.value as ActivationCheckpointingMode,
              }))
            }
            className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="none">None (Full Activation Retention)</option>
            <option value="selective">Selective Checkpointing (SAC - ~60% saved)</option>
            <option value="full">Full Recomputation (Layer Input Only)</option>
          </select>
        </div>

        {/* Offloading Target */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Async Memory Offload
          </label>
          <select
            value={trainingConfig.offloadTarget}
            onChange={(e) =>
              setTrainingConfig((prev) => ({
                ...prev,
                offloadTarget: e.target.value as OffloadTarget,
              }))
            }
            className="w-full px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-cyan-500"
          >
            <option value="none">None (Pure GPU VRAM)</option>
            <option value="cpu_optimizer">CPU Optimizer Offload (ZeRO-Offload)</option>
            <option value="cpu_all">CPU Optimizer + Weights Offload</option>
            <option value="nvme_all">NVMe SSD Offload (ZeRO-Infinity)</option>
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB CONTENT AREA */}
      {/* ==================================================================== */}
      <main className="mt-4 flex-1">
        {/* ================================================================== */}
        {/* TAB 1: VRAM BREAKDOWN & MEMORY ANATOMY */}
        {/* ================================================================== */}
        {activeTab === "vram_breakdown" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Interactive Config Sliders & Hardware Settings */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Model & Cluster Controls
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {modelConfig.totalParamsB}B Params
                  </span>
                </div>

                {/* Model Size Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Model Parameters:</span>
                    <span className="font-mono text-cyan-300">{modelConfig.totalParamsB}B</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    step="0.5"
                    value={modelConfig.totalParamsB}
                    onChange={(e) =>
                      setModelConfig((prev) => ({
                        ...prev,
                        totalParamsB: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Micro Batch Size Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Micro Batch Size / GPU:</span>
                    <span className="font-mono text-cyan-300">
                      {trainingConfig.microBatchSize} (Max fit: {maxBatchSize})
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={trainingConfig.microBatchSize}
                    onChange={(e) =>
                      setTrainingConfig((prev) => ({
                        ...prev,
                        microBatchSize: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                {/* Sequence Length */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Sequence Length:</span>
                    <span className="font-mono text-cyan-300">
                      {trainingConfig.seqLength.toLocaleString()} tokens
                    </span>
                  </div>
                  <select
                    value={trainingConfig.seqLength}
                    onChange={(e) =>
                      setTrainingConfig((prev) => ({
                        ...prev,
                        seqLength: parseInt(e.target.value, 10),
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                  >
                    {[1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072].map((s) => (
                      <option key={s} value={s}>
                        {s.toLocaleString()} tokens
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cluster GPU Count */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Total GPU World Size:</span>
                    <span className="font-mono text-cyan-300">
                      {clusterConfig.numGpus} GPUs ({clusterConfig.numNodes} Nodes)
                    </span>
                  </div>
                  <select
                    value={clusterConfig.numGpus}
                    onChange={(e) => {
                      const count = parseInt(e.target.value, 10);
                      const gpn = Math.min(8, count);
                      setClusterConfig((prev) => ({
                        ...prev,
                        numGpus: count,
                        gpusPerNode: gpn,
                        numNodes: Math.max(1, Math.ceil(count / gpn)),
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                  >
                    {[1, 2, 4, 8, 16, 32, 64, 128, 256, 512].map((n) => (
                      <option key={n} value={n}>
                        {n} GPUs ({Math.max(1, Math.ceil(n / 8))} Node{n > 8 ? "s" : ""})
                      </option>
                    ))}
                  </select>
                </div>

                {/* GPU Model Selector */}
                <div>
                  <label className="block text-xs text-slate-300 mb-1">GPU Accelerator</label>
                  <select
                    value={clusterConfig.gpuModelId}
                    onChange={(e) =>
                      setClusterConfig((prev) => ({ ...prev, gpuModelId: e.target.value }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
                  >
                    {GPU_HARDWARE_SPECS.map((gpu) => (
                      <option key={gpu.id} value={gpu.id}>
                        {gpu.name} ({gpu.vramGb}GB {gpu.memoryType})
                      </option>
                    ))}
                  </select>
                </div>

                {/* FlashAttention & Optimization Toggles */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>FlashAttention-2 / 3:</span>
                    <input
                      type="checkbox"
                      checked={trainingConfig.useFlashAttention}
                      onChange={(e) =>
                        setTrainingConfig((prev) => ({
                          ...prev,
                          useFlashAttention: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                    <span>Backward Param Prefetch:</span>
                    <input
                      type="checkbox"
                      checked={trainingConfig.backwardPrefetch}
                      onChange={(e) =>
                        setTrainingConfig((prev) => ({
                          ...prev,
                          backwardPrefetch: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Visual VRAM Stacked Breakdown & Health Cards */}
            <div className="lg:col-span-8 space-y-5">
              {/* OOM / Headroom Health Card */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  memBreakdown.isOOM
                    ? "bg-rose-950/40 border-rose-800 text-rose-200"
                    : memBreakdown.gpuHeadroomGb < 10
                      ? "bg-amber-950/40 border-amber-800 text-amber-200"
                      : "bg-emerald-950/40 border-emerald-800 text-emerald-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {memBreakdown.isOOM ? (
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold">
                      {memBreakdown.isOOM
                        ? "OUT OF MEMORY (OOM) ALERT"
                        : memBreakdown.gpuHeadroomGb < 10
                          ? "TIGHT VRAM BUDGET WARNING"
                          : "VRAM ALLOCATION SAFE"}
                    </h4>
                    <p className="text-xs opacity-80 mt-0.5">
                      {memBreakdown.isOOM
                        ? `Peak VRAM requirement (${memBreakdown.totalGpuVramRequiredGb.toFixed(
                            1,
                          )} GB) exceeds ${currentGpuSpec.name} capacity (${memBreakdown.gpuCapacityGb} GB) by ${(
                            memBreakdown.totalGpuVramRequiredGb - memBreakdown.gpuCapacityGb
                          ).toFixed(1)} GB.`
                        : `Peak allocation: ${memBreakdown.totalGpuVramRequiredGb.toFixed(
                            1,
                          )} GB / ${memBreakdown.gpuCapacityGb} GB (${memBreakdown.gpuUtilizationPct.toFixed(
                            1,
                          )}% utilized, ${memBreakdown.gpuHeadroomGb.toFixed(1)} GB headroom).`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] block uppercase opacity-70">Headroom</span>
                    <span
                      className={`text-lg font-mono font-bold ${
                        memBreakdown.isOOM ? "text-rose-400" : "text-emerald-300"
                      }`}
                    >
                      {memBreakdown.gpuHeadroomGb.toFixed(1)} GB
                    </span>
                  </div>
                </div>
              </div>

              {/* Stacked VRAM Visual Bar */}
              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-cyan-400" />
                    Per-GPU VRAM Allocation ({currentGpuSpec.name} - {currentGpuSpec.vramGb} GB)
                  </span>
                  <span className="font-mono text-slate-400">
                    {memBreakdown.totalGpuVramRequiredGb.toFixed(2)} GB /{" "}
                    {memBreakdown.gpuCapacityGb} GB
                  </span>
                </div>

                {/* Multi-segment Stacked Bar */}
                <div className="h-8 w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex shadow-inner relative">
                  {memBreakdown.items.map((item, idx) => {
                    const widthPct = (item.sizeGb / memBreakdown.gpuCapacityGb) * 100;
                    if (item.sizeGb <= 0.01) return null;
                    return (
                      <div
                        key={idx}
                        style={{
                          width: `${Math.min(100, widthPct)}%`,
                          backgroundColor: item.color,
                        }}
                        title={`${item.name}: ${item.sizeGb.toFixed(2)} GB (${(
                          (item.sizeGb / memBreakdown.totalGpuVramRequiredGb) *
                          100
                        ).toFixed(1)}%)`}
                        className="h-full transition-all duration-300 hover:brightness-110 flex items-center justify-center text-[10px] font-bold text-slate-950 select-none overflow-hidden px-1"
                      >
                        {widthPct > 8 ? `${item.sizeGb.toFixed(1)}G` : ""}
                      </div>
                    );
                  })}
                  {memBreakdown.isOOM && (
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-rose-500 animate-pulse shadow-lg" />
                  )}
                </div>

                {/* Legend & Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 border-t border-slate-800/80">
                  {memBreakdown.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/70 text-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="flex justify-between items-baseline font-mono">
                        <span className="text-sm font-bold text-white">
                          {item.sizeGb.toFixed(2)} GB
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {memBreakdown.totalGpuVramRequiredGb > 0
                            ? `${(
                                (item.sizeGb / memBreakdown.totalGpuVramRequiredGb) *
                                100
                              ).toFixed(0)}%`
                            : "0%"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sharding Strategy Comparison Summary Card */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 mb-2.5 uppercase tracking-wider">
                  ZeRO Stage Memory Scaling vs World Size (N={clusterConfig.numGpus})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">ZeRO-0 (DDP)</span>
                    <span className="text-sm font-bold font-mono text-slate-200 block mt-1">
                      {calculateMemoryBreakdown(modelConfig, clusterConfig, {
                        ...trainingConfig,
                        shardingStrategy: "zero0_ddp",
                      }).totalGpuVramRequiredGb.toFixed(1)}{" "}
                      GB
                    </span>
                    <span className="text-[10px] text-slate-500">1x Replication</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">ZeRO-1 (Opt Shard)</span>
                    <span className="text-sm font-bold font-mono text-cyan-300 block mt-1">
                      {calculateMemoryBreakdown(modelConfig, clusterConfig, {
                        ...trainingConfig,
                        shardingStrategy: "zero1_opt",
                      }).totalGpuVramRequiredGb.toFixed(1)}{" "}
                      GB
                    </span>
                    <span className="text-[10px] text-slate-500">Opt 1/N</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">ZeRO-2 (Opt+Grad)</span>
                    <span className="text-sm font-bold font-mono text-indigo-300 block mt-1">
                      {calculateMemoryBreakdown(modelConfig, clusterConfig, {
                        ...trainingConfig,
                        shardingStrategy: "zero2_opt_grad",
                      }).totalGpuVramRequiredGb.toFixed(1)}{" "}
                      GB
                    </span>
                    <span className="text-[10px] text-slate-500">Opt + Grad 1/N</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-900/60 bg-cyan-950/20">
                    <span className="text-cyan-300 block text-[11px] font-semibold">
                      ZeRO-3 (Full Shard)
                    </span>
                    <span className="text-sm font-bold font-mono text-cyan-400 block mt-1">
                      {calculateMemoryBreakdown(modelConfig, clusterConfig, {
                        ...trainingConfig,
                        shardingStrategy: "zero3_full",
                      }).totalGpuVramRequiredGb.toFixed(1)}{" "}
                      GB
                    </span>
                    <span className="text-[10px] text-cyan-500/80">Weights + Opt + Grad 1/N</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: STEP-BY-STEP COLLECTIVE COMMUNICATION VISUALIZER */}
        {/* ================================================================== */}
        {activeTab === "collective_stepper" && currentStep && (
          <div className="space-y-5">
            {/* Playback Controls & Progress Bar */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-md transition ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 text-white"
                      : "bg-cyan-600 hover:bg-cyan-500 text-white"
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause Simulation" : "Play Pipeline"}
                </button>

                <button
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition"
                  title="Step Backward"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setCurrentStepIndex((prev) => Math.min(stepperSteps.length - 1, prev + 1))
                  }
                  disabled={currentStepIndex >= stepperSteps.length - 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIndex(0);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                  title="Reset to Step 1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Step Counter Badge & Speed */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300">
                  Step {currentStep.stepNumber} of {stepperSteps.length}
                </span>

                <select
                  value={playbackSpeedMs}
                  onChange={(e) => setPlaybackSpeedMs(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300"
                >
                  <option value={2000}>0.5x Speed</option>
                  <option value={1200}>1.0x Speed</option>
                  <option value={600}>2.0x Speed</option>
                  <option value={300}>4.0x Speed</option>
                </select>
              </div>
            </div>

            {/* Stepper Interactive Timeline Ribbon */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 min-w-max">
                {stepperSteps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isPast = idx < currentStepIndex;
                  return (
                    <button
                      key={step.id}
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStepIndex(idx);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                        isCurrent
                          ? "bg-cyan-600 text-white font-bold ring-2 ring-cyan-400 shadow-md"
                          : isPast
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            : "bg-slate-950 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-950/60 text-[10px] flex items-center justify-center font-mono">
                        {step.stepNumber}
                      </span>
                      <span className="truncate max-w-[130px]">{step.stepTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Stage: Step Animation & Multi-GPU Topology Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Interactive Multi-GPU Ring Canvas */}
              <div className="lg:col-span-7 p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Network className="w-4 h-4 text-cyan-400" />
                    GPU Cluster Ring Topology & Communication Flow
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      currentStep.activeCollective === "all_gather"
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-700"
                        : currentStep.activeCollective === "reduce_scatter"
                          ? "bg-amber-950 text-amber-300 border border-amber-700"
                          : currentStep.activeCollective === "all_reduce"
                            ? "bg-purple-950 text-purple-300 border border-purple-700"
                            : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {currentStep.activeCollective.replace("_", " ")}
                  </span>
                </div>

                {/* SVG Ring Visualization */}
                <div className="relative w-full h-64 sm:h-72 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 300">
                    {/* Ring Connection Path */}
                    <circle
                      cx="200"
                      cy="150"
                      r="100"
                      fill="none"
                      stroke="#334155"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    {/* Active Communication Links */}
                    {currentStep.activeLinks.map((link, i) => {
                      const numGpus = currentStep.gpuVramAllocations.length;
                      const angleFrom = (link.fromGpu * 2 * Math.PI) / numGpus - Math.PI / 2;
                      const angleTo = (link.toGpu * 2 * Math.PI) / numGpus - Math.PI / 2;
                      const x1 = 200 + 100 * Math.cos(angleFrom);
                      const y1 = 150 + 100 * Math.sin(angleFrom);
                      const x2 = 200 + 100 * Math.cos(angleTo);
                      const y2 = 150 + 100 * Math.sin(angleTo);

                      return (
                        <g key={i}>
                          <line
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#38bdf8"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            className="animate-pulse"
                          />
                          <circle
                            cx={(x1 + x2) / 2}
                            cy={(y1 + y2) / 2}
                            r="4"
                            fill="#38bdf8"
                            className="animate-ping"
                          />
                        </g>
                      );
                    })}

                    {/* GPU Nodes along the Ring */}
                    {currentStep.gpuVramAllocations.map((vramGb, gpuIdx) => {
                      const numGpus = currentStep.gpuVramAllocations.length;
                      const angle = (gpuIdx * 2 * Math.PI) / numGpus - Math.PI / 2;
                      const cx = 200 + 100 * Math.cos(angle);
                      const cy = 150 + 100 * Math.sin(angle);
                      const isOOM = vramGb > memBreakdown.gpuCapacityGb;

                      return (
                        <g key={gpuIdx} className="transition-all duration-300">
                          <circle
                            cx={cx}
                            cy={cy}
                            r="24"
                            fill="#0f172a"
                            stroke={isOOM ? "#f43f5e" : "#0284c7"}
                            strokeWidth="2.5"
                          />
                          <text
                            x={cx}
                            y={cy - 2}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="#e2e8f0"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            GPU {gpuIdx}
                          </text>
                          <text
                            x={cx}
                            y={cy + 10}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill={isOOM ? "#f43f5e" : "#38bdf8"}
                            fontSize="8"
                            fontFamily="monospace"
                          >
                            {vramGb.toFixed(1)}G
                          </text>
                        </g>
                      );
                    })}

                    {/* Center Info Badge */}
                    <g>
                      <circle
                        cx="200"
                        cy="150"
                        r="38"
                        fill="#020617"
                        stroke="#1e293b"
                        strokeWidth="2"
                      />
                      <text
                        x="200"
                        y="142"
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize="9"
                        fontWeight="bold"
                      >
                        PHASE
                      </text>
                      <text
                        x="200"
                        y="158"
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {currentStep.phase.toUpperCase().replace("_", " ")}
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Communication Transfer Metrics */}
                <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Transfer Volume</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {formatBytes(currentStep.collectiveTransferBytes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Active Interconnect</span>
                    <span className="font-medium text-slate-200">
                      {INTERCONNECT_SPECS[clusterConfig.intraNodeInterconnect]?.name ?? "NVLink"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Transient Buffer</span>
                    <span className="font-mono font-bold text-amber-300">
                      {currentStep.transientVramGb.toFixed(2)} GB
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Step Description & Mathematical Equation Card */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800">
                      <Zap className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-white">{currentStep.stepTitle}</h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentStep.stepDescription}
                  </p>

                  {/* Mathematical Formulation */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-xs text-cyan-300">
                    <span className="text-[10px] text-slate-500 block uppercase mb-1 font-sans font-semibold">
                      Tensor Mathematical Operation
                    </span>
                    <code>{currentStep.mathFormula}</code>
                  </div>

                  {/* Layer Tensor Properties */}
                  <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Target Module:</span>
                      <span className="font-semibold text-slate-200">{currentStep.layerName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Layer Parameters:</span>
                      <span className="font-mono text-slate-200">
                        {currentStep.layerParamCount > 0
                          ? `${(currentStep.layerParamCount / 1e6).toFixed(1)}M params`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Layer Footprint:</span>
                      <span className="font-mono text-cyan-300">
                        {formatBytes(currentStep.layerParamBytes)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: CPU/NVME ASYNCHRONOUS OFFLOADING TIMELINE */}
        {/* ================================================================== */}
        {activeTab === "offload_timeline" && (
          <div className="space-y-5">
            {/* Offload Overview Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Host CPU RAM Required
                </span>
                <span className="text-xl font-bold font-mono text-cyan-300 block mt-1.5">
                  {offloadAnalysis.cpuRamRequiredGb.toFixed(1)} GB / Node
                </span>
                <span className="text-[11px] text-slate-500">
                  Headroom: {offloadAnalysis.hostRamHeadroomGb.toFixed(1)} GB
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  NVMe Flash Storage
                </span>
                <span className="text-xl font-bold font-mono text-purple-300 block mt-1.5">
                  {offloadAnalysis.nvmeRequiredGb.toFixed(1)} GB
                </span>
                <span className="text-[11px] text-slate-500">
                  Bandwidth: {clusterConfig.nvmeBandwidthGbs} GB/s
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Transfer Overlap Efficiency
                </span>
                <span className="text-xl font-bold font-mono text-emerald-300 block mt-1.5">
                  {offloadAnalysis.overlapEfficiencyPct}%
                </span>
                <span className="text-[11px] text-slate-500">
                  {offloadAnalysis.overlapEfficiencyPct === 100
                    ? "Fully Overlapped with Compute"
                    : "Partial Pipeline Bubble"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Stall / Bubble Penalty
                </span>
                <span className="text-xl font-bold font-mono text-amber-300 block mt-1.5">
                  {offloadAnalysis.stallBubbleMs.toFixed(1)} ms / step
                </span>
                <span className="text-[11px] text-slate-500">
                  Transfer: {offloadAnalysis.transferTimeMs.toFixed(1)}ms | Compute:{" "}
                  {offloadAnalysis.computeTimeMs.toFixed(1)}ms
                </span>
              </div>
            </div>

            {/* Asynchronous Timeline Gantt Chart */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-cyan-400" />
                CUDA Compute vs PCIe/NVMe Transfer Asynchronous Overlap Stream
              </h4>

              <div className="space-y-3 pt-2">
                {/* GPU Compute Stream */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-cyan-300">GPU CUDA Compute Stream</span>
                    <span className="font-mono text-slate-400">
                      {offloadAnalysis.computeTimeMs.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="h-7 w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: "100%" }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 flex items-center px-3 text-xs font-semibold text-white truncate"
                    >
                      Forward GEMMs & Backward Autograd
                    </div>
                  </div>
                </div>

                {/* PCIe DtoH / HtoD Stream */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span className="font-semibold text-amber-300">
                      PCIe Gen4/5 DtoH & HtoD Memory Stream
                    </span>
                    <span className="font-mono text-slate-400">
                      {offloadAnalysis.transferTimeMs.toFixed(1)} ms
                    </span>
                  </div>
                  <div className="h-7 w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex shadow-inner relative">
                    <div
                      style={{
                        width: `${Math.min(
                          100,
                          (offloadAnalysis.computeTimeMs /
                            Math.max(1, offloadAnalysis.transferTimeMs)) *
                            100,
                        )}%`,
                      }}
                      className="h-full bg-emerald-600 flex items-center px-3 text-xs font-semibold text-white truncate"
                    >
                      Overlapped Async Transfer
                    </div>
                    {offloadAnalysis.stallBubbleMs > 0 && (
                      <div
                        style={{
                          width: `${(
                            (offloadAnalysis.stallBubbleMs /
                              Math.max(1, offloadAnalysis.transferTimeMs)) *
                            100
                          ).toFixed(1)}%`,
                        }}
                        className="h-full bg-rose-600/80 flex items-center px-3 text-xs font-semibold text-white truncate"
                      >
                        Pipeline Bubble Stall ({offloadAnalysis.stallBubbleMs.toFixed(1)}ms)
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                💡 <strong className="text-slate-200">ZeRO-Offload & ZeRO-Infinity Insight:</strong>{" "}
                When GPU compute time exceeds memory transfer time across PCIe Gen5 (64 GB/s),
                offloading incurs{" "}
                <strong className="text-emerald-400">zero performance penalty</strong> due to
                dual-stream CUDA prefetching. When models are small or batch sizes are tiny, PCIe
                bandwidth becomes the critical bottleneck.
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: CLUSTER SCALING & MFU SIMULATOR */}
        {/* ================================================================== */}
        {activeTab === "scaling_mfu" && (
          <div className="space-y-5">
            {/* Summary Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Model FLOPs Utilization (MFU)</span>
                <span className="text-2xl font-bold font-mono text-cyan-400 block mt-1">
                  {commAnalysis.mfuPct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-slate-500">
                  Cluster Peak: {(commAnalysis.tflopsPerGpu * clusterConfig.numGpus).toFixed(0)}{" "}
                  TFLOPs
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Global Token Throughput</span>
                <span className="text-2xl font-bold font-mono text-emerald-400 block mt-1">
                  {commAnalysis.globalTokensPerSec.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  <span className="text-xs">tok/s</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {commAnalysis.tokensPerSecPerGpu.toFixed(0)} tokens/sec/GPU
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Step Execution Time</span>
                <span className="text-2xl font-bold font-mono text-purple-400 block mt-1">
                  {commAnalysis.stepTimeMs.toFixed(1)} ms
                </span>
                <span className="text-[11px] text-slate-500">
                  Compute: {commAnalysis.computeTimeMs.toFixed(1)}ms | Comm:{" "}
                  {commAnalysis.exposedCommTimeMs.toFixed(1)}ms
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Communication Multiplier</span>
                <span className="text-2xl font-bold font-mono text-amber-400 block mt-1">
                  {commAnalysis.commMultiplierVsDDP.toFixed(2)}x
                </span>
                <span className="text-[11px] text-slate-500">
                  Total Comm: {formatBytes(commAnalysis.totalCommBytesPerStep)}
                </span>
              </div>
            </div>

            {/* Scaling Sweep Grid */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Cluster Scaling Sweep (1 to 512 GPUs)
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">World Size</th>
                      <th className="py-2.5 px-3">Nodes</th>
                      <th className="py-2.5 px-3">VRAM / GPU</th>
                      <th className="py-2.5 px-3">Compute Time</th>
                      <th className="py-2.5 px-3">Comm Time</th>
                      <th className="py-2.5 px-3">MFU %</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {clusterScalingData.map((row) => (
                      <tr
                        key={row.worldSize}
                        className={`hover:bg-slate-800/40 transition ${
                          row.worldSize === clusterConfig.numGpus ? "bg-cyan-950/30 font-bold" : ""
                        }`}
                      >
                        <td className="py-2 px-3 text-cyan-300">{row.worldSize} GPUs</td>
                        <td className="py-2 px-3 text-slate-300">{row.numNodes} Nodes</td>
                        <td className="py-2 px-3 text-slate-200">
                          {row.vramPerGpuGb.toFixed(1)} GB
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {row.computeTimeMs.toFixed(1)} ms
                        </td>
                        <td className="py-2 px-3 text-slate-400">{row.commTimeMs.toFixed(1)} ms</td>
                        <td className="py-2 px-3 text-emerald-400">{row.mfuPct.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right">
                          {row.isOOM ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                              OOM
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                              SAFE
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: CODE EXPORT (PYTORCH FSDP & DEEPSPEED) */}
        {/* ================================================================== */}
        {activeTab === "code_export" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCodeType("pytorch_fsdp")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    codeType === "pytorch_fsdp"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  PyTorch 2.x FSDP (`torch.distributed.fsdp`)
                </button>
                <button
                  onClick={() => setCodeType("deepspeed_json")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                    codeType === "deepspeed_json"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  DeepSpeed `ds_config.json`
                </button>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed shadow-inner max-h-[500px]">
              <code>
                {codeType === "pytorch_fsdp"
                  ? generatePyTorchFSDPCode(modelConfig, clusterConfig, trainingConfig)
                  : generateDeepSpeedConfig(modelConfig, clusterConfig, trainingConfig)}
              </code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
};

export default FSDPZeROShardingStudio;
