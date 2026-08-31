import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Cpu,
  Layers,
  Zap,
  Sparkles,
  Activity,
  CheckCircle2,
  Info,
  Flame,
  Grid,
  Copy,
  Check,
  Gauge,
  Code,
} from "lucide-react";

// ============================================================================
// 1. TYPES & DATA CONTRACTS
// ============================================================================

export type GPUArchId =
  | "h100_sxm"
  | "a100_sxm4"
  | "rtx4090"
  | "v100"
  | "l40s"
  | "apple_m3_max"
  | "custom";

export interface GPUArchSpec {
  readonly id: GPUArchId;
  readonly name: string;
  readonly architecture: string;
  readonly peakFP16TFlops: number; // TFLOPS
  readonly peakFP32TFlops: number; // TFLOPS
  readonly peakFP8TFlops: number; // TFLOPS
  readonly memoryBandwidthGBs: number; // GB/s
  readonly l2CacheMB: number; // MB
  readonly smemPerSMKB: number; // KB
  readonly maxSMs: number;
  readonly supportsTMA: boolean;
  readonly registersPerSM: number;
  readonly clockGhz: number;
}

export type DataTypeId = "FP32" | "FP16" | "BF16" | "FP8" | "INT8";

export interface DataTypeSpec {
  readonly id: DataTypeId;
  readonly name: string;
  readonly bytesPerElement: number;
  readonly bits: number;
  readonly isTensorCoreSupported: boolean;
  readonly tflopsMultiplier: number;
}

export interface TilingConfig {
  readonly M: number;
  readonly N: number;
  readonly K: number;
  readonly BM: number;
  readonly BN: number;
  readonly BK: number;
  readonly groupM: number;
  readonly numStages: number;
  readonly numWarps: number;
  readonly stride: number;
  readonly enableSwizzle: boolean;
  readonly swizzleShift: number;
  readonly gpuArch: GPUArchId;
  readonly dataType: DataTypeId;
  readonly customTFlops?: number;
  readonly customBandwidth?: number;
  readonly customL2MB?: number;
}

export type TritonPresetId =
  | "h100_tensor_core_4k"
  | "a100_sram_swizzle_fix"
  | "gemv_memory_bound"
  | "hopper_tma_async_pipeline"
  | "bank_conflict_disaster"
  | "custom_playground";

export interface TritonPreset {
  readonly id: TritonPresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly config: TilingConfig;
  readonly highlightFeatures: readonly string[];
}

export interface BankAccess {
  readonly threadId: number; // 0..31
  readonly byteAddress: number;
  readonly wordAddress: number;
  readonly bankId: number; // 0..31
  readonly originalBankId: number;
  readonly row: number;
  readonly col: number;
  readonly isConflict: boolean;
  readonly conflictWay: number;
}

export interface BankConflictReport {
  readonly accesses: readonly BankAccess[];
  readonly bankHits: readonly number[]; // array of 32 numbers
  readonly maxConflictWay: number; // 1 (conflict-free) to 32
  readonly conflictCount: number; // number of banks with >1 distinct word access
  readonly serializationPenaltyCycles: number; // maxConflictWay - 1
  readonly totalDistinctWords: number;
  readonly isSwizzled: boolean;
  readonly efficiencyPercent: number; // 100 / maxConflictWay
}

export interface PipelineStepStageState {
  readonly stageIndex: number;
  readonly kTileIndex: number;
  readonly bufferIndex: number;
  readonly globalLoadStatus: "idle" | "loading" | "ready" | "done";
  readonly sramBufferStatus: "empty" | "filling" | "filled" | "computing" | "released";
  readonly mmaStatus: "idle" | "computing" | "done";
  readonly progress: number;
  readonly loadCycleStart: number;
  readonly loadCycleEnd: number;
  readonly computeCycleStart: number;
  readonly computeCycleEnd: number;
}

export interface PipelineStepState {
  readonly cycle: number;
  readonly stepIndex: number;
  readonly currentKTile: number;
  readonly stages: readonly PipelineStepStageState[];
  readonly activeLoads: number;
  readonly activeComputes: number;
  readonly isStalled: boolean;
  readonly stallReason?: string;
}

export interface PipelineSimulationResult {
  readonly totalCycles: number;
  readonly computeCycles: number;
  readonly stallCycles: number;
  readonly memoryCycles: number;
  readonly overlapEfficiencyPercent: number;
  readonly latencyHidingPercent: number;
  readonly speedupVsNaive: number;
  readonly timeline: readonly PipelineStepState[];
  readonly numStages: number;
  readonly numKTiles: number;
  readonly hasTMA: boolean;
}

export interface RooflineMetrics {
  readonly operationalIntensityFlopsPerByte: number;
  readonly sramOperationalIntensity: number;
  readonly ridgePointFlopsPerByte: number;
  readonly isMemoryBound: boolean;
  readonly isComputeBound: boolean;
  readonly peakTFlops: number;
  readonly memoryBandwidthTBps: number;
  readonly theoreticalMaxTFlops: number;
  readonly attainableTFlops: number;
  readonly dramTrafficBytes: number;
  readonly totalFlops: number;
  readonly executionTimeMs: number;
  readonly memoryBandwidthUtilizationPercent: number;
  readonly computeUtilizationPercent: number;
  readonly speedupVsNaiveUnTiled: number;
}

export interface TritonKernelTilingStudioProps {
  readonly initialPreset?: TritonPresetId;
  readonly initialConfig?: Partial<TilingConfig>;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly standalone?: boolean;
  readonly title?: string;
  readonly onConfigChange?: (config: TilingConfig) => void;
  readonly onPresetChange?: (presetId: TritonPresetId) => void;
}

// ============================================================================
// 2. HARDWARE PROFILES & DATA SPECS
// ============================================================================

export const GPU_ARCH_PROFILES: Record<GPUArchId, GPUArchSpec> = {
  h100_sxm: {
    id: "h100_sxm",
    name: "NVIDIA H100 SXM5",
    architecture: "Hopper (GH100)",
    peakFP16TFlops: 989.4,
    peakFP32TFlops: 67.0,
    peakFP8TFlops: 1978.9,
    memoryBandwidthGBs: 3350,
    l2CacheMB: 50,
    smemPerSMKB: 228,
    maxSMs: 132,
    supportsTMA: true,
    registersPerSM: 65536,
    clockGhz: 1.83,
  },
  a100_sxm4: {
    id: "a100_sxm4",
    name: "NVIDIA A100 SXM4",
    architecture: "Ampere (GA100)",
    peakFP16TFlops: 312.0,
    peakFP32TFlops: 19.5,
    peakFP8TFlops: 0,
    memoryBandwidthGBs: 2039,
    l2CacheMB: 40,
    smemPerSMKB: 164,
    maxSMs: 108,
    supportsTMA: false,
    registersPerSM: 65536,
    clockGhz: 1.41,
  },
  rtx4090: {
    id: "rtx4090",
    name: "NVIDIA RTX 4090",
    architecture: "Ada Lovelace (AD102)",
    peakFP16TFlops: 330.0,
    peakFP32TFlops: 82.6,
    peakFP8TFlops: 660.0,
    memoryBandwidthGBs: 1008,
    l2CacheMB: 72,
    smemPerSMKB: 100,
    maxSMs: 128,
    supportsTMA: false,
    registersPerSM: 65536,
    clockGhz: 2.52,
  },
  v100: {
    id: "v100",
    name: "NVIDIA Tesla V100",
    architecture: "Volta (GV100)",
    peakFP16TFlops: 125.0,
    peakFP32TFlops: 15.7,
    peakFP8TFlops: 0,
    memoryBandwidthGBs: 900,
    l2CacheMB: 6,
    smemPerSMKB: 96,
    maxSMs: 80,
    supportsTMA: false,
    registersPerSM: 65536,
    clockGhz: 1.53,
  },
  l40s: {
    id: "l40s",
    name: "NVIDIA L40S",
    architecture: "Ada Lovelace (AD102 DC)",
    peakFP16TFlops: 366.0,
    peakFP32TFlops: 91.6,
    peakFP8TFlops: 733.0,
    memoryBandwidthGBs: 864,
    l2CacheMB: 48,
    smemPerSMKB: 100,
    maxSMs: 142,
    supportsTMA: false,
    registersPerSM: 65536,
    clockGhz: 2.52,
  },
  apple_m3_max: {
    id: "apple_m3_max",
    name: "Apple M3 Max (40-Core)",
    architecture: "Apple Silicon G16",
    peakFP16TFlops: 32.0,
    peakFP32TFlops: 16.0,
    peakFP8TFlops: 64.0,
    memoryBandwidthGBs: 400,
    l2CacheMB: 48,
    smemPerSMKB: 32,
    maxSMs: 40,
    supportsTMA: false,
    registersPerSM: 32768,
    clockGhz: 1.4,
  },
  custom: {
    id: "custom",
    name: "Custom Microarchitecture",
    architecture: "User Defined GPU",
    peakFP16TFlops: 500.0,
    peakFP32TFlops: 50.0,
    peakFP8TFlops: 1000.0,
    memoryBandwidthGBs: 1500,
    l2CacheMB: 32,
    smemPerSMKB: 128,
    maxSMs: 64,
    supportsTMA: true,
    registersPerSM: 65536,
    clockGhz: 2.0,
  },
};

export const DATA_TYPE_SPECS: Record<DataTypeId, DataTypeSpec> = {
  FP32: {
    id: "FP32",
    name: "Single Precision (FP32)",
    bytesPerElement: 4,
    bits: 32,
    isTensorCoreSupported: true,
    tflopsMultiplier: 0.1,
  },
  FP16: {
    id: "FP16",
    name: "Half Precision (FP16)",
    bytesPerElement: 2,
    bits: 16,
    isTensorCoreSupported: true,
    tflopsMultiplier: 1.0,
  },
  BF16: {
    id: "BF16",
    name: "Bfloat16 (BF16)",
    bytesPerElement: 2,
    bits: 16,
    isTensorCoreSupported: true,
    tflopsMultiplier: 1.0,
  },
  FP8: {
    id: "FP8",
    name: "8-bit Floating Point (FP8 E4M3/E5M2)",
    bytesPerElement: 1,
    bits: 8,
    isTensorCoreSupported: true,
    tflopsMultiplier: 2.0,
  },
  INT8: {
    id: "INT8",
    name: "8-bit Integer (INT8)",
    bytesPerElement: 1,
    bits: 8,
    isTensorCoreSupported: true,
    tflopsMultiplier: 2.0,
  },
};

export const TRITON_TILING_PRESETS: Record<TritonPresetId, TritonPreset> = {
  h100_tensor_core_4k: {
    id: "h100_tensor_core_4k",
    name: "H100 Tensor Core 4K GEMM (128x256x64)",
    subtitle: "Large Matrix Multiplication with 4-Stage TMA Pipelining & L2 Swizzling",
    description:
      "State-of-the-art GEMM configuration for NVIDIA Hopper H100 with massive block tiling, 4-stage asynchronous memory pipelining, and GROUP_M=8 L2 cache locality.",
    config: {
      M: 4096,
      N: 4096,
      K: 4096,
      BM: 128,
      BN: 256,
      BK: 64,
      groupM: 8,
      numStages: 4,
      numWarps: 8,
      stride: 1,
      enableSwizzle: true,
      swizzleShift: 2,
      gpuArch: "h100_sxm",
      dataType: "FP16",
    },
    highlightFeatures: [
      "4-Stage Hopper TMA Pipelining",
      "GROUP_M=8 L2 Cache Swizzling",
      "989.4 TFLOPS Peak FP16 Compute",
    ],
  },
  a100_sram_swizzle_fix: {
    id: "a100_sram_swizzle_fix",
    name: "A100 SRAM Swizzling & 32-Bank Fix",
    subtitle: "Eliminating Severe Bank Conflicts with XOR Address Swizzling",
    description:
      "Demonstrates how shared memory bank conflicts on Ampere A100 can serialize memory accesses up to 32x, and how XOR address swizzling completely eliminates the penalty.",
    config: {
      M: 2048,
      N: 2048,
      K: 2048,
      BM: 128,
      BN: 128,
      BK: 32,
      groupM: 4,
      numStages: 2,
      numWarps: 4,
      stride: 32,
      enableSwizzle: true,
      swizzleShift: 2,
      gpuArch: "a100_sxm4",
      dataType: "FP16",
    },
    highlightFeatures: [
      "32-Way Conflict Elimination",
      "XOR Bitwise Swizzling (col ^ (row % 32))",
      "2-Stage Double Buffering",
    ],
  },
  gemv_memory_bound: {
    id: "gemv_memory_bound",
    name: "Memory-Bound Small Batch GEMV (16x4096x4096)",
    subtitle: "Low Arithmetic Intensity Inference Workload",
    description:
      "Batch size 16 LLM decoding GEMV kernel showing severe memory bandwidth saturation where operational intensity falls below the ridge point.",
    config: {
      M: 16,
      N: 4096,
      K: 4096,
      BM: 16,
      BN: 64,
      BK: 64,
      groupM: 1,
      numStages: 2,
      numWarps: 4,
      stride: 1,
      enableSwizzle: false,
      swizzleShift: 0,
      gpuArch: "rtx4090",
      dataType: "FP16",
    },
    highlightFeatures: [
      "Operational Intensity < 8 FLOPs/Byte",
      "Memory Bandwidth Bound Regime",
      "LLM Token Generation Decoding Profile",
    ],
  },
  hopper_tma_async_pipeline: {
    id: "hopper_tma_async_pipeline",
    name: "Hopper TMA 4-Stage Async Pipeline",
    subtitle: "Warp-Specialized FP8 Tensor Core MMA",
    description:
      "Hopper hardware Tensor Memory Accelerator async copy pipeline overlapping asynchronous global memory loads with FP8 Tensor Core matrix multiplications.",
    config: {
      M: 8192,
      N: 8192,
      K: 8192,
      BM: 128,
      BN: 256,
      BK: 128,
      groupM: 8,
      numStages: 4,
      numWarps: 8,
      stride: 1,
      enableSwizzle: true,
      swizzleShift: 3,
      gpuArch: "h100_sxm",
      dataType: "FP8",
    },
    highlightFeatures: [
      "1,978.9 TFLOPS FP8 Peak Throughput",
      "TMA Hardware Async Offload",
      "Zero SM Memory Stall Overhead",
    ],
  },
  bank_conflict_disaster: {
    id: "bank_conflict_disaster",
    name: "Bank Conflict Disaster (Stride 32)",
    subtitle: "Worst-Case Shared Memory Serialization",
    description:
      "A pathological stride-32 shared memory access pattern causing full 32-way bank conflict serialization on Volta V100 GPU.",
    config: {
      M: 1024,
      N: 1024,
      K: 1024,
      BM: 64,
      BN: 64,
      BK: 32,
      groupM: 1,
      numStages: 1,
      numWarps: 4,
      stride: 32,
      enableSwizzle: false,
      swizzleShift: 0,
      gpuArch: "v100",
      dataType: "FP32",
    },
    highlightFeatures: [
      "32-Way Max Conflict Serialization",
      "3.125% SRAM Bank Efficiency",
      "31 Cycle Memory Stall Penalty",
    ],
  },
  custom_playground: {
    id: "custom_playground",
    name: "Custom Microarchitecture Playground",
    subtitle: "Fully Configurable GPU Kernel & Hardware Sandbox",
    description:
      "Customizable hardware parameters and tiling dimensions to explore roofline curves, bank conflicts, and asynchronous pipelining across arbitrary architectures.",
    config: {
      M: 2048,
      N: 2048,
      K: 2048,
      BM: 64,
      BN: 64,
      BK: 64,
      groupM: 4,
      numStages: 2,
      numWarps: 4,
      stride: 1,
      enableSwizzle: true,
      swizzleShift: 2,
      gpuArch: "custom",
      dataType: "BF16",
      customTFlops: 500,
      customBandwidth: 1500,
      customL2MB: 32,
    },
    highlightFeatures: [
      "Custom Microarchitecture Parameters",
      "Interactive Roofline Tuning",
      "Multi-Variable Optimization Sandbox",
    ],
  },
};

// ============================================================================
// 3. PURE MATHEMATICAL & MICROARCHITECTURAL HELPER FUNCTIONS
// ============================================================================

/**
 * Computes 2D block tiling grid dimensions, group partitions, and FLOPs.
 */
export function computeTilingGrid(
  M: number,
  N: number,
  K: number,
  BM: number,
  BN: number,
  BK: number,
  groupM: number = 8,
): {
  readonly numPidM: number;
  readonly numPidN: number;
  readonly numKTiles: number;
  readonly totalPrograms: number;
  readonly numPidInGroup: number;
  readonly totalGroups: number;
  readonly flopsPerTile: number;
  readonly totalFlops: number;
} {
  const safeM = Math.max(1, Math.round(M));
  const safeN = Math.max(1, Math.round(N));
  const safeK = Math.max(1, Math.round(K));
  const safeBM = Math.max(1, Math.round(BM));
  const safeBN = Math.max(1, Math.round(BN));
  const safeBK = Math.max(1, Math.round(BK));
  const safeGroupM = Math.max(1, Math.round(groupM));

  const numPidM = Math.ceil(safeM / safeBM);
  const numPidN = Math.ceil(safeN / safeBN);
  const numKTiles = Math.ceil(safeK / safeBK);
  const totalPrograms = numPidM * numPidN;
  const numPidInGroup = safeGroupM * numPidN;
  const totalGroups = Math.ceil(numPidM / safeGroupM);
  const flopsPerTile = 2 * safeBM * safeBN * safeBK;
  const totalFlops = 2 * safeM * safeN * safeK;

  return {
    numPidM,
    numPidN,
    numKTiles,
    totalPrograms,
    numPidInGroup,
    totalGroups,
    flopsPerTile,
    totalFlops,
  };
}

/**
 * Computes Triton's 1D program ID remapping to 2D block coordinates (pid_m, pid_n)
 * with or without GROUP_M L2 cache locality swizzling.
 */
export function computeProgramIdRemapping(
  pid: number,
  numPidM: number,
  numPidN: number,
  groupM: number = 8,
  enableSwizzle: boolean = true,
): {
  readonly pid: number;
  readonly pidM: number;
  readonly pidN: number;
  readonly groupId: number;
  readonly firstPidM: number;
  readonly groupSizeM: number;
  readonly isSwizzled: boolean;
} {
  const safePid = Math.max(0, Math.round(pid));
  const safeNumPidM = Math.max(1, Math.round(numPidM));
  const safeNumPidN = Math.max(1, Math.round(numPidN));
  const safeGroupM = Math.max(1, Math.round(groupM));

  if (!enableSwizzle || safeGroupM <= 1) {
    const pidM = Math.floor(safePid / safeNumPidN);
    const pidN = safePid % safeNumPidN;
    return {
      pid: safePid,
      pidM,
      pidN,
      groupId: 0,
      firstPidM: 0,
      groupSizeM: safeNumPidM,
      isSwizzled: false,
    };
  }

  const numPidInGroup = safeGroupM * safeNumPidN;
  const groupId = Math.floor(safePid / numPidInGroup);
  const firstPidM = groupId * safeGroupM;
  const groupSizeM = Math.min(safeNumPidM - firstPidM, safeGroupM);

  if (groupSizeM <= 0) {
    return {
      pid: safePid,
      pidM: 0,
      pidN: 0,
      groupId,
      firstPidM,
      groupSizeM: 1,
      isSwizzled: true,
    };
  }

  const groupOffset = safePid % numPidInGroup;
  const pidM = firstPidM + (groupOffset % groupSizeM);
  const pidN = Math.floor(groupOffset / groupSizeM);

  return {
    pid: safePid,
    pidM,
    pidN,
    groupId,
    firstPidM,
    groupSizeM,
    isSwizzled: true,
  };
}

/**
 * Models L2 cache hit rate based on tile footprint, working set size, and GROUP_M locality swizzling.
 */
export function calculateL2CacheHitRate(config: TilingConfig, archSpec: GPUArchSpec): number {
  const elemBytes = DATA_TYPE_SPECS[config.dataType]?.bytesPerElement ?? 2;
  const l2Bytes = (config.customL2MB ?? archSpec.l2CacheMB) * 1024 * 1024;

  const totalMatrixBBytes = config.K * config.N * elemBytes;
  const tileABytes = config.BM * config.K * elemBytes;

  const numPidM = Math.ceil(config.M / config.BM);
  const effectiveGroupM = config.enableSwizzle ? Math.max(1, config.groupM) : 1;

  // Linear hit rate model
  const linearCacheRatio = l2Bytes / Math.max(1, totalMatrixBBytes + tileABytes);
  const linearHitRate = Math.max(0.12, Math.min(0.92, linearCacheRatio * 0.65 + 0.15));

  if (!config.enableSwizzle || config.groupM <= 1) {
    return Math.round(linearHitRate * 1000) / 1000;
  }

  // Swizzled hit rate boost from group reuse of Matrix B tiles
  const reuseFactor = Math.min(effectiveGroupM, numPidM);
  const swizzleBoost = (1.0 - 1.0 / Math.pow(Math.max(1, reuseFactor), 0.7)) * 0.82;
  const swizzledHitRate = Math.min(0.96, linearHitRate + (1.0 - linearHitRate) * swizzleBoost);

  return Math.round(swizzledHitRate * 1000) / 1000;
}

/**
 * 2D XOR Swizzling for bank conflict elimination:
 * bank = ((row ^ col) % numCols)
 */
export function applyXORSwizzle(row: number, col: number, numCols: number = 32): number {
  const safeCols = Math.max(1, numCols);
  const swizzled = (Math.abs(Math.round(col)) ^ (Math.abs(Math.round(row)) % safeCols)) % safeCols;
  return ((swizzled % safeCols) + safeCols) % safeCols;
}

/**
 * Bitwise address swizzling for shared memory byte addresses:
 * bank = (word ^ (word >> shift)) % 32
 */
export function applyXorSwizzleAddress(byteAddress: number, shift: number = 2): number {
  const word = Math.floor(Math.max(0, byteAddress) / 4);
  const safeShift = Math.max(0, Math.min(8, shift));
  const swizzled = (word ^ (word >> safeShift)) % 32;
  return ((swizzled % 32) + 32) % 32;
}

/**
 * Calculates 32 warp thread memory bank addresses and physical bank assignments.
 */
export function calculateBankAddresses(
  stride: number,
  elemBytes: number = 2,
  enableSwizzle: boolean = false,
  swizzleShift: number = 2,
  baseByteOffset: number = 0,
  numThreads: number = 32,
): readonly BankAccess[] {
  const safeStride = Math.max(0, stride);
  const safeElemBytes = Math.max(1, elemBytes);
  const accesses: BankAccess[] = [];

  for (let t = 0; t < numThreads; t++) {
    const byteAddress = baseByteOffset + t * safeStride * safeElemBytes;
    const wordAddress = Math.floor(byteAddress / 4);
    const originalBankId = wordAddress % 32;
    const row = Math.floor((t * safeStride) / 32);
    const col = (t * safeStride) % 32;

    const bankId = enableSwizzle
      ? applyXorSwizzleAddress(byteAddress, swizzleShift)
      : originalBankId;

    accesses.push({
      threadId: t,
      byteAddress,
      wordAddress,
      bankId,
      originalBankId,
      row,
      col,
      isConflict: false,
      conflictWay: 1,
    });
  }

  return accesses;
}

/**
 * Analyzes warp bank accesses to detect conflicts, serialization penalties, and efficiency.
 * Broadcast rule: multiple threads accessing the exact same word address do NOT conflict (1 cycle broadcast).
 */
export function detectBankConflicts(
  accessesOrConfig:
    | readonly BankAccess[]
    | {
        stride: number;
        elemBytes: number;
        enableSwizzle?: boolean;
        swizzleShift?: number;
        baseOffset?: number;
      },
): BankConflictReport {
  let rawAccesses: readonly BankAccess[];
  let isSwizzled = false;

  if ("stride" in accessesOrConfig) {
    const {
      stride,
      elemBytes,
      enableSwizzle = false,
      swizzleShift = 2,
      baseOffset = 0,
    } = accessesOrConfig;
    isSwizzled = enableSwizzle;
    rawAccesses = calculateBankAddresses(
      stride,
      elemBytes,
      enableSwizzle,
      swizzleShift,
      baseOffset,
      32,
    );
  } else {
    rawAccesses = accessesOrConfig;
    isSwizzled = rawAccesses.some((a) => a.bankId !== a.originalBankId);
  }

  const bankHits = new Array(32).fill(0);
  const bankWordsMap = new Map<number, Set<number>>();

  for (let b = 0; b < 32; b++) {
    bankWordsMap.set(b, new Set<number>());
  }

  for (const access of rawAccesses) {
    bankHits[access.bankId] = (bankHits[access.bankId] || 0) + 1;
    bankWordsMap.get(access.bankId)?.add(access.wordAddress);
  }

  let maxConflictWay = 1;
  let conflictCount = 0;
  let totalDistinctWords = 0;

  for (let b = 0; b < 32; b++) {
    const uniqueWords = bankWordsMap.get(b)?.size || 0;
    totalDistinctWords += uniqueWords;
    if (uniqueWords > 1) {
      conflictCount++;
      if (uniqueWords > maxConflictWay) {
        maxConflictWay = uniqueWords;
      }
    }
  }

  const serializationPenaltyCycles = maxConflictWay - 1;
  const efficiencyPercent = Math.round((100 / maxConflictWay) * 100) / 100;

  const accesses: BankAccess[] = rawAccesses.map((acc) => {
    const bankDistinctWords = bankWordsMap.get(acc.bankId)?.size || 1;
    const isConflict = bankDistinctWords > 1;
    return {
      ...acc,
      isConflict,
      conflictWay: bankDistinctWords,
    };
  });

  return {
    accesses,
    bankHits,
    maxConflictWay,
    conflictCount,
    serializationPenaltyCycles,
    totalDistinctWords,
    isSwizzled,
    efficiencyPercent,
  };
}

/**
 * Simulates multi-stage asynchronous GEMM pipeline execution (1-stage, 2-stage double buffering, 4-stage TMA).
 */
export function simulateAsyncPipeline(
  config: TilingConfig,
  archSpec: GPUArchSpec,
): PipelineSimulationResult {
  const numStages = Math.max(1, Math.min(4, Math.round(config.numStages)));
  const numKTiles = Math.max(1, Math.ceil(config.K / config.BK));
  const hasTMA = archSpec.supportsTMA && numStages >= 3;

  const loadLatency = hasTMA ? 110 : 220;
  const computeLatency = Math.max(
    28,
    Math.round(((config.BM * config.BN * config.BK) / (128 * 128 * 32)) * 36),
  );
  const sramTransferLatency = 16;

  const timeline: PipelineStepState[] = [];
  let currentCycle = 0;
  let totalStallCycles = 0;
  let totalComputeCycles = 0;
  let totalMemoryCycles = 0;

  if (numStages === 1) {
    // 1-Stage Synchronous Pipeline
    for (let k = 0; k < numKTiles; k++) {
      const loadStart = currentCycle;
      const loadEnd = loadStart + loadLatency + sramTransferLatency;
      const computeStart = loadEnd;
      const computeEnd = computeStart + computeLatency;

      totalMemoryCycles += loadLatency + sramTransferLatency;
      totalStallCycles += loadLatency + sramTransferLatency;
      totalComputeCycles += computeLatency;

      const stageStates: PipelineStepStageState[] = [
        {
          stageIndex: 0,
          kTileIndex: k,
          bufferIndex: 0,
          globalLoadStatus: "done",
          sramBufferStatus: "filled",
          mmaStatus: "computing",
          progress: 100,
          loadCycleStart: loadStart,
          loadCycleEnd: loadEnd,
          computeCycleStart: computeStart,
          computeCycleEnd: computeEnd,
        },
      ];

      timeline.push({
        cycle: computeEnd,
        stepIndex: k,
        currentKTile: k,
        stages: stageStates,
        activeLoads: 0,
        activeComputes: 1,
        isStalled: true,
        stallReason: "Synchronous Global Memory Load Blocking SM",
      });

      currentCycle = computeEnd;
    }
  } else if (numStages === 2) {
    // 2-Stage Double Buffering Pipeline
    const prologueEnd = loadLatency + sramTransferLatency;
    currentCycle = prologueEnd;
    totalMemoryCycles += loadLatency + sramTransferLatency;
    totalStallCycles += prologueEnd;

    for (let k = 0; k < numKTiles; k++) {
      const isLast = k === numKTiles - 1;
      const stepDuration = isLast ? computeLatency : Math.max(computeLatency, loadLatency);
      const stallInStep = isLast ? 0 : Math.max(0, loadLatency - computeLatency);

      totalStallCycles += stallInStep;
      totalComputeCycles += computeLatency;
      totalMemoryCycles += isLast ? 0 : loadLatency;

      const computeStart = currentCycle;
      const computeEnd = computeStart + computeLatency;
      const nextLoadStart = currentCycle;
      const nextLoadEnd = nextLoadStart + loadLatency;

      const stageStates: PipelineStepStageState[] = [
        {
          stageIndex: 0,
          kTileIndex: k,
          bufferIndex: k % 2,
          globalLoadStatus: "done",
          sramBufferStatus: "computing",
          mmaStatus: "computing",
          progress: 100,
          loadCycleStart: computeStart - loadLatency,
          loadCycleEnd: computeStart,
          computeCycleStart: computeStart,
          computeCycleEnd: computeEnd,
        },
        {
          stageIndex: 1,
          kTileIndex: Math.min(numKTiles - 1, k + 1),
          bufferIndex: (k + 1) % 2,
          globalLoadStatus: isLast ? "idle" : "loading",
          sramBufferStatus: isLast ? "empty" : "filling",
          mmaStatus: "idle",
          progress: isLast ? 0 : Math.min(100, Math.round((computeLatency / loadLatency) * 100)),
          loadCycleStart: nextLoadStart,
          loadCycleEnd: nextLoadEnd,
          computeCycleStart: 0,
          computeCycleEnd: 0,
        },
      ];

      timeline.push({
        cycle: currentCycle + stepDuration,
        stepIndex: k,
        currentKTile: k,
        stages: stageStates,
        activeLoads: isLast ? 0 : 1,
        activeComputes: 1,
        isStalled: stallInStep > 0,
        stallReason: stallInStep > 0 ? "Memory Load Slower Than Math Compute" : undefined,
      });

      currentCycle += stepDuration;
    }
  } else {
    // 3-Stage / 4-Stage TMA Async Ring Pipeline
    const prologueStages = numStages - 1;
    const prologueDuration = loadLatency + sramTransferLatency * prologueStages;
    currentCycle = prologueDuration;
    totalMemoryCycles += loadLatency * prologueStages;
    totalStallCycles += Math.round(prologueDuration * 0.35);

    for (let k = 0; k < numKTiles; k++) {
      const stepDuration = computeLatency;
      totalComputeCycles += computeLatency;
      totalMemoryCycles += loadLatency;

      const stageStates: PipelineStepStageState[] = Array.from({ length: numStages }, (_, s) => {
        const targetKTile = k + s;
        const isComputing = s === 0;
        const isLoading = s > 0 && targetKTile < numKTiles;
        return {
          stageIndex: s,
          kTileIndex: Math.min(numKTiles - 1, targetKTile),
          bufferIndex: (k + s) % numStages,
          globalLoadStatus: isLoading ? "loading" : isComputing ? "done" : "idle",
          sramBufferStatus: isComputing ? "computing" : isLoading ? "filling" : "empty",
          mmaStatus: isComputing ? "computing" : "idle",
          progress: isComputing ? 100 : isLoading ? 85 : 0,
          loadCycleStart: currentCycle - s * (loadLatency / numStages),
          loadCycleEnd: currentCycle + loadLatency - s * (loadLatency / numStages),
          computeCycleStart: isComputing ? currentCycle : 0,
          computeCycleEnd: isComputing ? currentCycle + computeLatency : 0,
        };
      });

      timeline.push({
        cycle: currentCycle + stepDuration,
        stepIndex: k,
        currentKTile: k,
        stages: stageStates,
        activeLoads: Math.min(numStages - 1, Math.max(0, numKTiles - 1 - k)),
        activeComputes: 1,
        isStalled: false,
      });

      currentCycle += stepDuration;
    }
  }

  const totalCycles = Math.max(1, currentCycle);
  const overlapEfficiencyPercent =
    numStages === 1
      ? 0
      : Math.round(
          Math.min(
            100,
            Math.max(
              10,
              numStages === 2
                ? (Math.min(computeLatency, loadLatency) / Math.max(computeLatency, loadLatency)) *
                    100
                : 95 + (hasTMA ? 4 : 0),
            ),
          ) * 100,
        ) / 100;

  const latencyHidingPercent =
    numStages === 1
      ? 0
      : Math.round(((totalCycles - totalStallCycles) / totalCycles) * 10000) / 100;

  const naiveTotalCycles = numKTiles * (loadLatency + sramTransferLatency + computeLatency);
  const speedupVsNaive = Math.round((naiveTotalCycles / totalCycles) * 100) / 100;

  return {
    totalCycles,
    computeCycles: totalComputeCycles,
    stallCycles: totalStallCycles,
    memoryCycles: totalMemoryCycles,
    overlapEfficiencyPercent,
    latencyHidingPercent,
    speedupVsNaive,
    timeline,
    numStages,
    numKTiles,
    hasTMA,
  };
}

/**
 * Computes GPU Roofline arithmetic intensity, ridge point, attainable TFLOPS, and bottleneck classification.
 */
export function computeRooflineMetrics(
  config: TilingConfig,
  archSpec: GPUArchSpec,
  pipelineResult?: PipelineSimulationResult,
  conflictReport?: BankConflictReport,
): RooflineMetrics {
  const dataTypeSpec = DATA_TYPE_SPECS[config.dataType] ?? DATA_TYPE_SPECS.FP16;
  const bytesPerElem = dataTypeSpec.bytesPerElement;

  const totalFlops = 2 * config.M * config.N * config.K;

  let peakTFlops = archSpec.peakFP16TFlops;
  if (config.gpuArch === "custom") {
    peakTFlops = config.customTFlops ?? 500;
  } else if (config.dataType === "FP8") {
    peakTFlops = archSpec.peakFP8TFlops || archSpec.peakFP16TFlops * 2;
  } else if (config.dataType === "FP32") {
    peakTFlops = archSpec.peakFP32TFlops;
  } else if (config.dataType === "INT8") {
    peakTFlops = archSpec.peakFP8TFlops || archSpec.peakFP16TFlops * 2;
  }

  const bandwidthGBs =
    config.gpuArch === "custom" ? (config.customBandwidth ?? 1500) : archSpec.memoryBandwidthGBs;
  const memoryBandwidthTBps = bandwidthGBs / 1000;

  const l2HitRate = calculateL2CacheHitRate(config, archSpec);

  const matABytes = config.M * config.K * bytesPerElem;
  const matBBytes = config.K * config.N * bytesPerElem;
  const matCBytes = config.M * config.N * bytesPerElem;
  const dramTrafficBytes = matABytes + matBBytes * (1.0 - l2HitRate) + matCBytes;

  const operationalIntensity = Math.round((totalFlops / Math.max(1, dramTrafficBytes)) * 100) / 100;

  const sramOperationalIntensity =
    Math.round(
      ((2 * config.BM * config.BN) / Math.max(1, (config.BM + config.BN) * bytesPerElem)) * 100,
    ) / 100;

  const ridgePoint = Math.round((peakTFlops / Math.max(0.001, memoryBandwidthTBps)) * 100) / 100;

  const isMemoryBound = operationalIntensity < ridgePoint;
  const isComputeBound = operationalIntensity >= ridgePoint;

  const theoreticalMaxTFlops = Math.min(peakTFlops, operationalIntensity * memoryBandwidthTBps);

  const pipelineEfficiency = (pipelineResult?.overlapEfficiencyPercent ?? 85) / 100;
  const bankEfficiency = 1.0 / (conflictReport?.maxConflictWay ?? 1);
  const tmaBoost = archSpec.supportsTMA && config.numStages >= 4 ? 1.05 : 1.0;

  const attainableTFlops =
    Math.round(
      Math.min(
        peakTFlops,
        theoreticalMaxTFlops * Math.max(0.2, pipelineEfficiency) * bankEfficiency * tmaBoost,
      ) * 10,
    ) / 10;

  const executionTimeMs =
    Math.round((totalFlops / (Math.max(0.1, attainableTFlops) * 1e12)) * 1000 * 1000) / 1000;

  const bandwidthUsedTBps = Math.min(
    memoryBandwidthTBps,
    attainableTFlops / Math.max(0.1, operationalIntensity),
  );
  const memoryBandwidthUtilizationPercent =
    Math.round(Math.min(100, (bandwidthUsedTBps / memoryBandwidthTBps) * 100) * 10) / 10;

  const computeUtilizationPercent =
    Math.round(Math.min(100, (attainableTFlops / peakTFlops) * 100) * 10) / 10;

  const naiveIntensity = Math.round((1.0 / bytesPerElem) * 100) / 100;
  const naiveAttainableTFlops = Math.min(peakTFlops, naiveIntensity * memoryBandwidthTBps) * 0.22;
  const speedupVsNaiveUnTiled =
    Math.round((attainableTFlops / Math.max(0.01, naiveAttainableTFlops)) * 10) / 10;

  return {
    operationalIntensityFlopsPerByte: operationalIntensity,
    sramOperationalIntensity,
    ridgePointFlopsPerByte: ridgePoint,
    isMemoryBound,
    isComputeBound,
    peakTFlops,
    memoryBandwidthTBps,
    theoreticalMaxTFlops: Math.round(theoreticalMaxTFlops * 10) / 10,
    attainableTFlops,
    dramTrafficBytes: Math.round(dramTrafficBytes),
    totalFlops,
    executionTimeMs,
    memoryBandwidthUtilizationPercent,
    computeUtilizationPercent,
    speedupVsNaiveUnTiled,
  };
}

/**
 * Generates live Triton Python JIT kernel code matching the active configuration.
 */
export function generateTritonKernelCode(config: TilingConfig): string {
  const dtypeMap: Record<DataTypeId, string> = {
    FP32: "tl.float32",
    FP16: "tl.float16",
    BF16: "tl.bfloat16",
    FP8: "tl.float8e4nv",
    INT8: "tl.int8",
  };
  const tlDtype = dtypeMap[config.dataType] || "tl.float16";

  return `import triton
import triton.language as tl

@triton.jit
def matmul_kernel(
    # Pointers to Matrices
    a_ptr, b_ptr, c_ptr,
    # Matrix dimensions
    M, N, K,
    # Strides for memory layout
    stride_am, stride_ak,
    stride_bk, stride_bn,
    stride_cm, stride_cn,
    # Meta-parameters (Tile dimensions & L2 locality)
    BLOCK_SIZE_M: tl.constexpr = ${config.BM},
    BLOCK_SIZE_N: tl.constexpr = ${config.BN},
    BLOCK_SIZE_K: tl.constexpr = ${config.BK},
    GROUP_SIZE_M: tl.constexpr = ${config.groupM},
):
    """
    Triton 2D Block-Tiled GEMM Kernel.
    Config: BM=${config.BM}, BN=${config.BN}, BK=${config.BK}, GROUP_M=${config.groupM}, NUM_STAGES=${config.numStages}, NUM_WARPS=${config.numWarps}
    Data Type: ${config.dataType} (${tlDtype})
    """
    # ------------------------------------------------------------------
    # 1. Program ID Grid Mapping & L2 Cache Swizzling
    # ------------------------------------------------------------------
    pid = tl.program_id(axis=0)
    num_pid_m = tl.cdiv(M, BLOCK_SIZE_M)
    num_pid_n = tl.cdiv(N, BLOCK_SIZE_N)
    
    # L2 Cache locality group swizzling
    num_pid_in_group = GROUP_SIZE_M * num_pid_n
    group_id = pid // num_pid_in_group
    first_pid_m = group_id * GROUP_SIZE_M
    group_size_m = min(num_pid_m - first_pid_m, GROUP_SIZE_M)
    
    # 2D Block Tile coordinates
    pid_m = first_pid_m + ((pid % num_pid_in_group) % group_size_m)
    pid_n = (pid % num_pid_in_group) // group_size_m

    # ------------------------------------------------------------------
    # 2. Memory Pointer Offsets & Mask Setup
    # ------------------------------------------------------------------
    offs_am = (pid_m * BLOCK_SIZE_M + tl.arange(0, BLOCK_SIZE_M)) % M
    offs_bn = (pid_n * BLOCK_SIZE_N + tl.arange(0, BLOCK_SIZE_N)) % N
    offs_k = tl.arange(0, BLOCK_SIZE_K)
    
    a_ptrs = a_ptr + (offs_am[:, None] * stride_am + offs_k[None, :] * stride_ak)
    b_ptrs = b_ptr + (offs_k[:, None] * stride_bk + offs_bn[None, :] * stride_bn)

    # ------------------------------------------------------------------
    # 3. K-Loop Reduction & Tensor Core MMA Accumulation
    # ------------------------------------------------------------------
    accumulator = tl.zeros((BLOCK_SIZE_M, BLOCK_SIZE_N), dtype=tl.float32)

    for k in range(0, tl.cdiv(K, BLOCK_SIZE_K)):
        # Asynchronous loads with masking
        a = tl.load(a_ptrs, mask=offs_k[None, :] < K - k * BLOCK_SIZE_K, other=0.0)
        b = tl.load(b_ptrs, mask=offs_k[:, None] < K - k * BLOCK_SIZE_K, other=0.0)
        
        # Tensor Core Matrix Multiply & Accumulate
        accumulator = tl.dot(a, b, accumulator)
        
        # Advance pointers along K dimension
        a_ptrs += BLOCK_SIZE_K * stride_ak
        b_ptrs += BLOCK_SIZE_K * stride_bk

    # ------------------------------------------------------------------
    # 4. Epilogue: Write Tile Result to Global Memory Matrix C
    # ------------------------------------------------------------------
    c = accumulator.to(${tlDtype})
    offs_cm = pid_m * BLOCK_SIZE_M + tl.arange(0, BLOCK_SIZE_M)
    offs_cn = pid_n * BLOCK_SIZE_N + tl.arange(0, BLOCK_SIZE_N)
    c_ptrs = c_ptr + stride_cm * offs_cm[:, None] + stride_cn * offs_cn[None, :]
    c_mask = (offs_cm[:, None] < M) & (offs_cn[None, :] < N)
    tl.store(c_ptrs, c, mask=c_mask)

# Launcher Helper
def launch_matmul(a, b, c, M, N, K):
    grid = lambda META: (
        triton.cdiv(M, META['BLOCK_SIZE_M']) * triton.cdiv(N, META['BLOCK_SIZE_N']),
    )
    matmul_kernel[grid](
        a, b, c,
        M, N, K,
        a.stride(0), a.stride(1),
        b.stride(0), b.stride(1),
        c.stride(0), c.stride(1),
        BLOCK_SIZE_M=${config.BM},
        BLOCK_SIZE_N=${config.BN},
        BLOCK_SIZE_K=${config.BK},
        GROUP_SIZE_M=${config.groupM},
        num_stages=${config.numStages},
        num_warps=${config.numWarps},
    )
`;
}

// ============================================================================
// 4. MAIN REACT COMPONENT IMPLEMENTATION
// ============================================================================

type StudioTab = "tile_grid" | "bank_conflicts" | "async_pipeline" | "roofline" | "code_gen";

export const TritonKernelTilingStudio: React.FC<TritonKernelTilingStudioProps> = ({
  initialPreset = "h100_tensor_core_4k",
  initialConfig,
  width = "100%",
  height = "auto",
  title = "Triton GPU Kernel Tiling & Microarchitecture Studio",
  onConfigChange,
  onPresetChange,
}) => {
  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [activePresetId, setActivePresetId] = useState<TritonPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<StudioTab>("tile_grid");
  const [config, setConfig] = useState<TilingConfig>(() => ({
    ...TRITON_TILING_PRESETS[initialPreset].config,
    ...initialConfig,
  }));

  // Playback & Animation states for Async Pipeline & Tile K-loop
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentKTileStep, setCurrentKTileStep] = useState<number>(0);
  const [selectedPid, setSelectedPid] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Synchronize on external prop changes
  useEffect(() => {
    if (initialPreset && TRITON_TILING_PRESETS[initialPreset]) {
      setActivePresetId(initialPreset);
      setConfig({
        ...TRITON_TILING_PRESETS[initialPreset].config,
        ...initialConfig,
      });
    }
  }, [initialPreset, initialConfig]);

  // Notify parent callbacks
  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const handleSelectPreset = useCallback(
    (presetId: TritonPresetId) => {
      setActivePresetId(presetId);
      const newConfig = { ...TRITON_TILING_PRESETS[presetId].config };
      setConfig(newConfig);
      setCurrentKTileStep(0);
      setSelectedPid(0);
      setIsPlaying(false);
      onPresetChange?.(presetId);
    },
    [onPresetChange],
  );

  const updateConfig = useCallback((patch: Partial<TilingConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  // --------------------------------------------------------------------------
  // Microarchitecture & Computational Computations
  // --------------------------------------------------------------------------
  const archSpec = GPU_ARCH_PROFILES[config.gpuArch] ?? GPU_ARCH_PROFILES.h100_sxm;

  const gridMetrics = useMemo(() => {
    return computeTilingGrid(
      config.M,
      config.N,
      config.K,
      config.BM,
      config.BN,
      config.BK,
      config.groupM,
    );
  }, [config.M, config.N, config.K, config.BM, config.BN, config.BK, config.groupM]);

  const bankReport = useMemo(() => {
    const elemBytes = DATA_TYPE_SPECS[config.dataType]?.bytesPerElement ?? 2;
    return detectBankConflicts({
      stride: config.stride,
      elemBytes,
      enableSwizzle: config.enableSwizzle,
      swizzleShift: config.swizzleShift,
      baseOffset: 0,
    });
  }, [config.stride, config.dataType, config.enableSwizzle, config.swizzleShift]);

  const unswizzledBankReport = useMemo(() => {
    const elemBytes = DATA_TYPE_SPECS[config.dataType]?.bytesPerElement ?? 2;
    return detectBankConflicts({
      stride: config.stride,
      elemBytes,
      enableSwizzle: false,
      swizzleShift: 0,
      baseOffset: 0,
    });
  }, [config.stride, config.dataType]);

  const pipelineResult = useMemo(() => {
    return simulateAsyncPipeline(config, archSpec);
  }, [config, archSpec]);

  const roofline = useMemo(() => {
    return computeRooflineMetrics(config, archSpec, pipelineResult, bankReport);
  }, [config, archSpec, pipelineResult, bankReport]);

  const tritonCode = useMemo(() => {
    return generateTritonKernelCode(config);
  }, [config]);

  const currentProgramInfo = useMemo(() => {
    return computeProgramIdRemapping(
      selectedPid,
      gridMetrics.numPidM,
      gridMetrics.numPidN,
      config.groupM,
      config.enableSwizzle,
    );
  }, [selectedPid, gridMetrics.numPidM, gridMetrics.numPidN, config.groupM, config.enableSwizzle]);

  // --------------------------------------------------------------------------
  // Animation Loop for Stepper / Playback
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, Math.round(1000 / playbackSpeed));
      animationTimerRef.current = setInterval(() => {
        setCurrentKTileStep((prev) => {
          if (prev >= gridMetrics.numKTiles - 1) {
            return 0; // loop around
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, gridMetrics.numKTiles]);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(tritonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const activePreset =
    TRITON_TILING_PRESETS[activePresetId] ?? TRITON_TILING_PRESETS.h100_tensor_core_4k;

  return (
    <div
      data-testid="triton-kernel-tiling-studio"
      className="flex flex-col w-full text-slate-100 bg-[#090d16] rounded-xl border border-emerald-950/40 shadow-2xl overflow-hidden font-sans"
      style={{ width, height: height === "auto" ? undefined : height }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* HEADER BAR */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#06141d]/90 border-b border-emerald-900/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg border border-emerald-500/30 text-emerald-400 shadow-inner">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">{title}</h2>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Triton JIT + CUDA SMEM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              2D Block Tiling • 32-Bank Conflict Swizzling • Hopper TMA Async Copy • Roofline
              FLOPs/Byte
            </p>
          </div>
        </div>

        {/* Global Hardware & DataType Selectors */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">GPU:</span>
            <select
              aria-label="GPU Architecture"
              value={config.gpuArch}
              onChange={(e) => updateConfig({ gpuArch: e.target.value as GPUArchId })}
              className="bg-transparent text-xs text-emerald-300 font-semibold focus:outline-none cursor-pointer"
            >
              {Object.values(GPU_ARCH_PROFILES).map((gpu) => (
                <option key={gpu.id} value={gpu.id} className="bg-slate-900 text-white">
                  {gpu.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400">Precision:</span>
            <select
              aria-label="Data Precision"
              value={config.dataType}
              onChange={(e) => updateConfig({ dataType: e.target.value as DataTypeId })}
              className="bg-transparent text-xs text-teal-300 font-semibold focus:outline-none cursor-pointer"
            >
              {Object.values(DATA_TYPE_SPECS).map((dt) => (
                <option key={dt.id} value={dt.id} className="bg-slate-900 text-white">
                  {dt.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PRESETS STRIP */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto text-xs scrollbar-thin">
        <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets:
        </span>
        {Object.values(TRITON_TILING_PRESETS).map((p) => {
          const isActive = activePresetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`px-3 py-1 rounded-md whitespace-nowrap font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800"
              }`}
            >
              {p.name}
            </button>
          );
        })}
      </div>

      {/* Preset Subtitle Info Banner */}
      <div className="px-5 py-2 bg-emerald-950/10 border-b border-emerald-900/20 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{activePreset.description}</span>
        </div>
        <div className="flex items-center gap-2">
          {activePreset.highlightFeatures.map((feat, idx) => (
            <span
              key={idx}
              className="hidden lg:inline-flex px-2 py-0.5 text-[10px] font-medium bg-slate-800/90 text-teal-300 rounded border border-slate-700/60"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* NAVIGATION TABS */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-1 px-5 pt-2.5 bg-slate-950/40 border-b border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab("tile_grid")}
          className={`flex items-center gap-2 px-3.5 py-2 font-semibold rounded-t-lg transition-all ${
            activeTab === "tile_grid"
              ? "bg-[#0c1622] text-emerald-400 border-t-2 border-emerald-400 border-x border-slate-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Grid className="w-4 h-4" />
          2D Block Tiling & L2 Swizzling
        </button>
        <button
          onClick={() => setActiveTab("bank_conflicts")}
          className={`flex items-center gap-2 px-3.5 py-2 font-semibold rounded-t-lg transition-all ${
            activeTab === "bank_conflicts"
              ? "bg-[#0c1622] text-amber-400 border-t-2 border-amber-400 border-x border-slate-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Flame className="w-4 h-4" />
          32-Bank Conflict Visualizer
        </button>
        <button
          onClick={() => setActiveTab("async_pipeline")}
          className={`flex items-center gap-2 px-3.5 py-2 font-semibold rounded-t-lg transition-all ${
            activeTab === "async_pipeline"
              ? "bg-[#0c1622] text-cyan-400 border-t-2 border-cyan-400 border-x border-slate-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Zap className="w-4 h-4" />
          Multi-Stage Async Pipeline & TMA
        </button>
        <button
          onClick={() => setActiveTab("roofline")}
          className={`flex items-center gap-2 px-3.5 py-2 font-semibold rounded-t-lg transition-all ${
            activeTab === "roofline"
              ? "bg-[#0c1622] text-purple-400 border-t-2 border-purple-400 border-x border-slate-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Gauge className="w-4 h-4" />
          Roofline Model & Throughput
        </button>
        <button
          onClick={() => setActiveTab("code_gen")}
          className={`flex items-center gap-2 px-3.5 py-2 font-semibold rounded-t-lg transition-all ${
            activeTab === "code_gen"
              ? "bg-[#0c1622] text-emerald-400 border-t-2 border-emerald-400 border-x border-slate-800"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Code className="w-4 h-4" />
          Triton Python JIT Kernel
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MAIN TAB CONTENT */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-5 flex-1 overflow-y-auto space-y-5 bg-[#090d16]">
        {/* ================================================================== */}
        {/* TAB 1: 2D BLOCK TILING & L2 SWIZZLING */}
        {/* ================================================================== */}
        {activeTab === "tile_grid" && (
          <div className="space-y-5">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Grid Programs
                </span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {gridMetrics.totalPrograms}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    ({gridMetrics.numPidM} × {gridMetrics.numPidN})
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  K-Loop Iterations
                </span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {gridMetrics.numKTiles}{" "}
                  <span className="text-xs font-normal text-slate-400">tiles (BK={config.BK})</span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  L2 Swizzling Groups
                </span>
                <p className="text-lg font-bold text-teal-400 mt-0.5">
                  {gridMetrics.totalGroups}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    (GROUP_M={config.groupM})
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  L2 Cache Hit Rate
                </span>
                <p className="text-lg font-bold text-cyan-400 mt-0.5">
                  {(calculateL2CacheHitRate(config, archSpec) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  FLOPs per Block
                </span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {(gridMetrics.flopsPerTile / 1e6).toFixed(2)} MFLOP
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Total Workload
                </span>
                <p className="text-lg font-bold text-purple-400 mt-0.5">
                  {(gridMetrics.totalFlops / 1e9).toFixed(2)} GFLOP
                </p>
              </div>
            </div>

            {/* Visual Interactive GEMM Matrices & Swizzling Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: 2D Block Matrix Visualization */}
              <div className="lg:col-span-8 bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">
                      2D Matrix Tile Decomposition (C = A × B)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableSwizzle}
                        onChange={(e) => updateConfig({ enableSwizzle: e.target.checked })}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      Enable GROUP_M Swizzling
                    </label>
                  </div>
                </div>

                {/* SVG Matmul Tiling Diagram */}
                <div className="w-full bg-[#070b12] rounded-lg p-3 border border-slate-900 flex flex-col items-center justify-center min-h-[280px]">
                  <svg viewBox="0 0 680 280" className="w-full max-w-[680px] h-auto select-none">
                    {/* Matrix A Tile */}
                    <g transform="translate(40, 40)">
                      <rect
                        x="0"
                        y="0"
                        width="110"
                        height="160"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1.5"
                        rx="4"
                      />
                      <text
                        x="55"
                        y="-12"
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        Matrix A (M×K)
                      </text>
                      {/* Active Row Tile */}
                      {(() => {
                        const tileH = Math.max(16, Math.min(40, 160 / gridMetrics.numPidM));
                        const tileW = Math.max(16, Math.min(36, 110 / gridMetrics.numKTiles));
                        const topY =
                          (currentProgramInfo.pidM % gridMetrics.numPidM) *
                          (160 / gridMetrics.numPidM);
                        const leftX =
                          (currentKTileStep % gridMetrics.numKTiles) *
                          (110 / gridMetrics.numKTiles);
                        return (
                          <>
                            <rect
                              x="0"
                              y={topY}
                              width="110"
                              height={tileH}
                              fill="rgba(16, 185, 129, 0.15)"
                              stroke="#10b981"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <rect
                              x={leftX}
                              y={topY}
                              width={tileW}
                              height={tileH}
                              fill="#10b981"
                              stroke="#34d399"
                              strokeWidth="1.5"
                              rx="2"
                            />
                            <text
                              x="55"
                              y={topY + tileH / 2 + 3}
                              fill="#ecfdf5"
                              fontSize="9"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              A_tile [{currentProgramInfo.pidM}, {currentKTileStep}]
                            </text>
                          </>
                        );
                      })()}
                    </g>

                    <text
                      x="180"
                      y="125"
                      fill="#64748b"
                      fontSize="18"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      ×
                    </text>

                    {/* Matrix B Tile */}
                    <g transform="translate(210, 40)">
                      <rect
                        x="0"
                        y="0"
                        width="160"
                        height="110"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1.5"
                        rx="4"
                      />
                      <text
                        x="80"
                        y="-12"
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        Matrix B (K×N)
                      </text>
                      {/* Active Column Tile */}
                      {(() => {
                        const tileW = Math.max(16, Math.min(40, 160 / gridMetrics.numPidN));
                        const tileH = Math.max(16, Math.min(36, 110 / gridMetrics.numKTiles));
                        const leftX =
                          (currentProgramInfo.pidN % gridMetrics.numPidN) *
                          (160 / gridMetrics.numPidN);
                        const topY =
                          (currentKTileStep % gridMetrics.numKTiles) *
                          (110 / gridMetrics.numKTiles);
                        return (
                          <>
                            <rect
                              x={leftX}
                              y="0"
                              width={tileW}
                              height="110"
                              fill="rgba(56, 189, 248, 0.15)"
                              stroke="#38bdf8"
                              strokeWidth="1"
                              strokeDasharray="2,2"
                            />
                            <rect
                              x={leftX}
                              y={topY}
                              width={tileW}
                              height={tileH}
                              fill="#0284c7"
                              stroke="#38bdf8"
                              strokeWidth="1.5"
                              rx="2"
                            />
                            <text
                              x={leftX + tileW / 2}
                              y="60"
                              fill="#f0f9ff"
                              fontSize="9"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              B [{currentKTileStep}, {currentProgramInfo.pidN}]
                            </text>
                          </>
                        );
                      })()}
                    </g>

                    <text
                      x="400"
                      y="125"
                      fill="#64748b"
                      fontSize="18"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      =
                    </text>

                    {/* Matrix C Output Tile */}
                    <g transform="translate(430, 40)">
                      <rect
                        x="0"
                        y="0"
                        width="180"
                        height="160"
                        fill="#0f172a"
                        stroke="#334155"
                        strokeWidth="1.5"
                        rx="4"
                      />
                      <text
                        x="90"
                        y="-12"
                        fill="#94a3b8"
                        fontSize="11"
                        textAnchor="middle"
                        fontWeight="bold"
                      >
                        Matrix C Output (M×N)
                      </text>

                      {/* 2D Program ID Grid Heatmap */}
                      {Array.from({ length: Math.min(8, gridMetrics.numPidM) }).map((_, rm) =>
                        Array.from({ length: Math.min(8, gridMetrics.numPidN) }).map((_, cn) => {
                          const cellW = 180 / Math.min(8, gridMetrics.numPidN);
                          const cellH = 160 / Math.min(8, gridMetrics.numPidM);
                          const isSelected =
                            rm === currentProgramInfo.pidM % 8 &&
                            cn === currentProgramInfo.pidN % 8;
                          const groupIdx = Math.floor(rm / Math.max(1, config.groupM));
                          const groupHue = (groupIdx * 60) % 360;

                          return (
                            <rect
                              key={`cell-${rm}-${cn}`}
                              x={cn * cellW}
                              y={rm * cellH}
                              width={cellW - 1}
                              height={cellH - 1}
                              fill={
                                isSelected
                                  ? "#10b981"
                                  : config.enableSwizzle
                                    ? `hsla(${groupHue}, 70%, 45%, 0.25)`
                                    : "#1e293b"
                              }
                              stroke={isSelected ? "#34d399" : "#334155"}
                              strokeWidth={isSelected ? 2 : 0.5}
                              rx="1"
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                const newPid = rm * gridMetrics.numPidN + cn;
                                setSelectedPid(Math.min(gridMetrics.totalPrograms - 1, newPid));
                              }}
                            />
                          );
                        }),
                      )}

                      {/* Active Tile Highlight text */}
                      <text
                        x="90"
                        y="180"
                        fill="#34d399"
                        fontSize="10"
                        textAnchor="middle"
                        fontWeight="semibold"
                      >
                        Active C_tile: [{currentProgramInfo.pidM}, {currentProgramInfo.pidN}] (PID:{" "}
                        {selectedPid})
                      </text>
                    </g>
                  </svg>
                </div>

                {/* K-Loop Stepper Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {isPlaying ? "Pause K-Loop" : "Play K-Loop"}
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentKTileStep((prev) => (prev + 1) % gridMetrics.numKTiles);
                      }}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      title="Step Forward"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentKTileStep(0);
                      }}
                      className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      title="Reset Step"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-slate-400 ml-2">
                      K-Tile Step:{" "}
                      <strong className="text-emerald-400">
                        {currentKTileStep + 1} / {gridMetrics.numKTiles}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Speed:</span>
                    {[0.5, 1, 2, 4].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => setPlaybackSpeed(spd)}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          playbackSpeed === spd
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Sliders & Swizzling Explanation */}
              <div className="lg:col-span-4 space-y-4">
                {/* Sliders Card */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" /> Tiling Parameters
                  </h4>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Matrix Dimensions (M, N, K):</span>
                      <strong className="text-emerald-400">
                        {config.M} × {config.N} × {config.K}
                      </strong>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        min="16"
                        max="16384"
                        step="16"
                        value={config.M}
                        onChange={(e) => updateConfig({ M: Number(e.target.value) || 16 })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-white"
                      />
                      <input
                        type="number"
                        min="16"
                        max="16384"
                        step="16"
                        value={config.N}
                        onChange={(e) => updateConfig({ N: Number(e.target.value) || 16 })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-white"
                      />
                      <input
                        type="number"
                        min="16"
                        max="16384"
                        step="16"
                        value={config.K}
                        onChange={(e) => updateConfig({ K: Number(e.target.value) || 16 })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Block Tile (BM × BN × BK):</span>
                      <strong className="text-teal-400">
                        {config.BM} × {config.BN} × {config.BK}
                      </strong>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        aria-label="Block Size M"
                        value={config.BM}
                        onChange={(e) => updateConfig({ BM: Number(e.target.value) })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-white cursor-pointer"
                      >
                        {[16, 32, 64, 128, 256].map((v) => (
                          <option key={v} value={v}>
                            BM={v}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Block Size N"
                        value={config.BN}
                        onChange={(e) => updateConfig({ BN: Number(e.target.value) })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-white cursor-pointer"
                      >
                        {[16, 32, 64, 128, 256].map((v) => (
                          <option key={v} value={v}>
                            BN={v}
                          </option>
                        ))}
                      </select>
                      <select
                        aria-label="Block Size K"
                        value={config.BK}
                        onChange={(e) => updateConfig({ BK: Number(e.target.value) })}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center text-white cursor-pointer"
                      >
                        {[16, 32, 64, 128].map((v) => (
                          <option key={v} value={v}>
                            BK={v}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>L2 Group Size (GROUP_M):</span>
                      <strong className="text-cyan-400">{config.groupM}</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="32"
                      step="1"
                      value={config.groupM}
                      onChange={(e) => updateConfig({ groupM: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Warp Count (num_warps):</span>
                      <strong className="text-purple-400">
                        {config.numWarps} ({config.numWarps * 32} threads)
                      </strong>
                    </div>
                    <select
                      aria-label="Warp Count"
                      value={config.numWarps}
                      onChange={(e) => updateConfig({ numWarps: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white cursor-pointer"
                    >
                      {[2, 4, 8, 16].map((w) => (
                        <option key={w} value={w}>
                          {w} Warps ({w * 32} threads)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Swizzling Math Deep-Dive Card */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-400" /> L2 Cache Swizzling Math
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    Without swizzling, row-major program scheduling accesses Matrix B tiles across
                    distant memory locations, causing high L2 cache evictions.
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded font-mono text-[11px] text-emerald-300 space-y-1">
                    <div>group_id = pid // (GROUP_M * num_pid_n)</div>
                    <div>first_pid_m = group_id * GROUP_M</div>
                    <div>group_size_m = min(num_pid_m - first_pid_m, GROUP_M)</div>
                    <div>pid_m = first_pid_m + ((pid % in_group) % group_size_m)</div>
                    <div>pid_n = (pid % in_group) // group_size_m</div>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800">
                    <span>
                      Active Selected PID:{" "}
                      <strong className="text-emerald-400">{selectedPid}</strong>
                    </span>
                    <span>
                      Mapped (m, n):{" "}
                      <strong className="text-teal-400">
                        ({currentProgramInfo.pidM}, {currentProgramInfo.pidN})
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 2: 32-BANK SHARED MEMORY CONFLICT VISUALIZER */}
        {/* ================================================================== */}
        {activeTab === "bank_conflicts" && (
          <div className="space-y-5">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Max Conflict Way
                </span>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    bankReport.maxConflictWay === 1
                      ? "text-emerald-400"
                      : bankReport.maxConflictWay <= 4
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {bankReport.maxConflictWay}-Way
                  <span className="text-xs font-normal text-slate-400 ml-1">
                    ({bankReport.maxConflictWay === 1 ? "Conflict-Free" : "Serialized"})
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Serialization Penalty
                </span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  +{bankReport.serializationPenaltyCycles} cycles
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  SRAM Bank Efficiency
                </span>
                <p className="text-lg font-bold text-teal-400 mt-0.5">
                  {bankReport.efficiencyPercent.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Banks with Conflicts
                </span>
                <p className="text-lg font-bold text-purple-400 mt-0.5">
                  {bankReport.conflictCount} / 32
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Unswizzled Penalty
                </span>
                <p className="text-lg font-bold text-red-400 mt-0.5">
                  {unswizzledBankReport.maxConflictWay}-Way (+
                  {unswizzledBankReport.serializationPenaltyCycles}c)
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Swizzle Benefit
                </span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {unswizzledBankReport.maxConflictWay > 1 && bankReport.maxConflictWay === 1
                    ? `${unswizzledBankReport.maxConflictWay}x Faster`
                    : "Optimal"}
                </p>
              </div>
            </div>

            {/* Interactive 32-Bank Visualizer & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: 32-Bank Grid */}
              <div className="lg:col-span-8 bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      32-Bank Shared Memory Access Grid (Warp Threads 0..31)
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 text-slate-300 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.enableSwizzle}
                        onChange={(e) => updateConfig({ enableSwizzle: e.target.checked })}
                        className="rounded accent-emerald-500 cursor-pointer"
                      />
                      XOR Address Swizzling
                    </label>
                  </div>
                </div>

                {/* 32 Banks Layout */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-[#070b12] p-3 rounded-lg border border-slate-900">
                  {Array.from({ length: 32 }).map((_, bankIdx) => {
                    const hits = bankReport.bankHits[bankIdx] || 0;
                    const threadsInBank = bankReport.accesses.filter((a) => a.bankId === bankIdx);
                    const distinctWords = new Set(threadsInBank.map((a) => a.wordAddress)).size;
                    const hasConflict = distinctWords > 1;

                    return (
                      <div
                        key={bankIdx}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-between min-h-[88px] transition-all ${
                          hasConflict
                            ? "bg-red-950/30 border-red-500/50 shadow-inner"
                            : hits > 0
                              ? "bg-emerald-950/30 border-emerald-500/40"
                              : "bg-slate-900/40 border-slate-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full text-[10px] font-mono">
                          <span className="text-slate-400 font-bold">B{bankIdx}</span>
                          <span
                            className={`px-1 rounded text-[9px] font-bold ${
                              hasConflict
                                ? "bg-red-500/20 text-red-300"
                                : hits > 0
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "text-slate-600"
                            }`}
                          >
                            {hits} {hits === 1 ? "hit" : "hits"}
                          </span>
                        </div>

                        {/* Thread Pins */}
                        <div className="flex flex-wrap gap-1 justify-center my-1 w-full max-h-[36px] overflow-hidden">
                          {threadsInBank.map((t) => (
                            <span
                              key={t.threadId}
                              className={`px-1 py-0.5 rounded text-[8px] font-mono font-bold ${
                                hasConflict
                                  ? "bg-red-600 text-white animate-pulse"
                                  : "bg-emerald-600 text-white"
                              }`}
                              title={`Thread ${t.threadId}: Word Addr 0x${t.wordAddress.toString(16)} (Row: ${t.row}, Col: ${t.col})`}
                            >
                              T{t.threadId}
                            </span>
                          ))}
                          {hits === 0 && (
                            <span className="text-[10px] text-slate-600 italic">idle</span>
                          )}
                        </div>

                        {/* Status Footer */}
                        <span className="text-[9px] font-semibold text-slate-400">
                          {hasConflict
                            ? `${distinctWords}-way conflict`
                            : hits > 1
                              ? "broadcast"
                              : "conflict-free"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Bank Hit Histogram SVG */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Warp Bank Hit Distribution
                  </span>
                  <div className="h-16 flex items-end gap-1 pt-2">
                    {bankReport.bankHits.map((hits, bIdx) => {
                      const maxHits = Math.max(1, ...bankReport.bankHits);
                      const heightPercent = Math.max(4, (hits / maxHits) * 100);
                      const isConflicted =
                        new Set(
                          bankReport.accesses
                            .filter((a) => a.bankId === bIdx)
                            .map((a) => a.wordAddress),
                        ).size > 1;

                      return (
                        <div
                          key={bIdx}
                          className="flex-1 flex flex-col items-center gap-1 group relative"
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t transition-all ${
                              isConflicted
                                ? "bg-red-500 group-hover:bg-red-400"
                                : hits > 0
                                  ? "bg-emerald-500 group-hover:bg-emerald-400"
                                  : "bg-slate-800"
                            }`}
                          />
                          <span className="text-[8px] text-slate-500 font-mono hidden sm:inline">
                            {bIdx}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Bank Conflict Parameters & Mathematical Proof */}
              <div className="lg:col-span-4 space-y-4">
                {/* Parameter Controls */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" /> Access Pattern Controls
                  </h4>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Thread Access Stride (Elements):</span>
                      <strong className="text-amber-400">{config.stride} words</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="64"
                        step="1"
                        value={config.stride}
                        onChange={(e) => updateConfig({ stride: Number(e.target.value) })}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <span className="w-10 text-center font-mono font-bold text-white bg-slate-900 py-1 rounded border border-slate-800">
                        {config.stride}
                      </span>
                    </div>
                    {/* Stride quick select pills */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {[1, 2, 4, 8, 16, 32, 33].map((s) => (
                        <button
                          key={s}
                          onClick={() => updateConfig({ stride: s })}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            config.stride === s
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                          }`}
                        >
                          S={s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>XOR Swizzle Shift Bits:</span>
                      <strong className="text-emerald-400">{config.swizzleShift}</strong>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={config.swizzleShift}
                      onChange={(e) => updateConfig({ swizzleShift: Number(e.target.value) })}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Conflict Formula Deep-Dive */}
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-400" /> GPU Shared Memory Bank Theory
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    NVIDIA GPUs partition SRAM into 32 banks of 4-byte width. When multiple warp
                    threads request different 4-byte words in the same bank, the hardware serializes
                    access into <code className="text-amber-300">M</code> sequential cycles.
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded font-mono text-[11px] text-amber-300 space-y-1">
                    <div>bank_id = (byte_address // 4) % 32</div>
                    <div>swizzled = ((word ^ (word &gt;&gt; shift)) % 32)</div>
                    <div>penalty = max_distinct_words_per_bank - 1</div>
                  </div>
                  <div className="p-2.5 bg-emerald-950/30 rounded border border-emerald-900/40 text-[11px] text-emerald-300">
                    <strong>Broadcast Rule:</strong> When all 32 threads request the exact same
                    address, hardware broadcasts data with 0 serialization penalty!
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 3: MULTI-STAGE ASYNC PIPELINE & HOPPER TMA */}
        {/* ================================================================== */}
        {activeTab === "async_pipeline" && (
          <div className="space-y-5">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Pipelining Mode
                </span>
                <p className="text-lg font-bold text-cyan-400 mt-0.5">
                  {config.numStages}-Stage{" "}
                  <span className="text-xs font-normal text-slate-400">
                    {config.numStages === 1
                      ? "Naive"
                      : config.numStages === 2
                        ? "Double Buffer"
                        : "TMA Async"}
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Overlap Efficiency
                </span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {pipelineResult.overlapEfficiencyPercent.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Latency Hiding
                </span>
                <p className="text-lg font-bold text-teal-400 mt-0.5">
                  {pipelineResult.latencyHidingPercent.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Stall Cycles
                </span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {pipelineResult.stallCycles} c{" "}
                  <span className="text-xs font-normal text-slate-400">
                    ({((pipelineResult.stallCycles / pipelineResult.totalCycles) * 100).toFixed(0)}
                    %)
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Speedup vs Naive
                </span>
                <p className="text-lg font-bold text-purple-400 mt-0.5">
                  {pipelineResult.speedupVsNaive.toFixed(2)}x
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Hopper TMA Engine
                </span>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    pipelineResult.hasTMA ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {pipelineResult.hasTMA ? "Hardware DMA" : "SM Copy"}
                </p>
              </div>
            </div>

            {/* Pipeline Stage Timeline Diagram */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white">
                      Asynchronous Memory to Tensor Core MMA Timeline
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((stg) => (
                      <button
                        key={stg}
                        onClick={() => updateConfig({ numStages: stg })}
                        className={`px-2.5 py-1 rounded text-xs font-semibold ${
                          config.numStages === stg
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                        }`}
                      >
                        {stg}-Stage
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Architecture Stage Lanes */}
                <div className="bg-[#070b12] p-4 rounded-lg border border-slate-900 space-y-3">
                  {/* Step Lane: Global Memory */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-32 shrink-0 font-bold text-slate-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-400" /> Global DRAM (HBM)
                    </span>
                    <div className="flex-1 h-7 bg-slate-900 rounded flex items-center p-1 relative overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-blue-600/60 border border-blue-400/80 rounded flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (currentKTileStep / gridMetrics.numKTiles) * 100 + 20)}%`,
                        }}
                      >
                        Tile A/B Async Fetch ({currentKTileStep + 1}/{gridMetrics.numKTiles})
                      </div>
                    </div>
                  </div>

                  {/* Step Lane: Hopper TMA Engine */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-32 shrink-0 font-bold text-slate-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> TMA Engine
                    </span>
                    <div className="flex-1 h-7 bg-slate-900 rounded flex items-center p-1 relative border border-slate-800">
                      {pipelineResult.hasTMA ? (
                        <div className="h-full w-full bg-amber-500/20 border border-amber-500/40 rounded flex items-center justify-between px-3 text-[10px] font-semibold text-amber-300">
                          <span>Warp-Specialized Hardware DMA Offload</span>
                          <span className="px-1.5 py-0.5 bg-amber-500/30 rounded text-[9px]">
                            Active
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 px-3 italic">
                          Standard SM thread-driven copy (no TMA)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Step Lane: Shared Memory Buffers */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-32 shrink-0 font-bold text-slate-300 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" /> SRAM Buffers
                    </span>
                    <div className="flex-1 grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, bufIdx) => {
                        const isAllocated = bufIdx < config.numStages;
                        const isCurrent = bufIdx === currentKTileStep % config.numStages;
                        return (
                          <div
                            key={bufIdx}
                            className={`h-7 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                              !isAllocated
                                ? "bg-slate-950 border-slate-900 text-slate-700"
                                : isCurrent
                                  ? "bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-inner"
                                  : "bg-slate-900/60 border-slate-800 text-slate-400"
                            }`}
                          >
                            Buffer {bufIdx}{" "}
                            {isAllocated && (isCurrent ? "(Computing)" : "(Prefetched)")}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step Lane: Tensor Cores MMA */}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-32 shrink-0 font-bold text-slate-300 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-purple-400" /> Tensor Core MMA
                    </span>
                    <div className="flex-1 h-7 bg-slate-900 rounded flex items-center p-1 relative border border-slate-800">
                      <div className="h-full w-full bg-purple-600/40 border border-purple-400/60 rounded flex items-center justify-between px-3 text-[10px] font-bold text-purple-200">
                        <span>C_tile += tl.dot(A_tile, B_tile)</span>
                        <span>
                          Stage {(currentKTileStep % config.numStages) + 1}/{config.numStages}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overlap & Latency Breakdown Bar */}
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300 font-semibold">
                    <span>Execution Breakdown ({pipelineResult.totalCycles} Total Cycles)</span>
                    <span className="text-emerald-400 font-mono">
                      {pipelineResult.computeCycles}c Compute • {pipelineResult.stallCycles}c Stall
                    </span>
                  </div>
                  <div className="h-4 bg-slate-950 rounded-full flex overflow-hidden border border-slate-800">
                    <div
                      style={{
                        width: `${Math.min(100, (pipelineResult.computeCycles / pipelineResult.totalCycles) * 100)}%`,
                      }}
                      className="bg-emerald-500 transition-all"
                      title="Compute Cycles"
                    />
                    <div
                      style={{
                        width: `${Math.min(100, (pipelineResult.stallCycles / pipelineResult.totalCycles) * 100)}%`,
                      }}
                      className="bg-amber-500 transition-all"
                      title="Memory Stall Cycles"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />{" "}
                      Overlapped Math Compute
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Memory
                      Wait Bubble
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Pipeline Architecture Explanation */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-400" /> Pipeline Stages in Triton
                  </h4>
                  <div className="space-y-2 text-slate-400 leading-relaxed">
                    <p>
                      <strong className="text-slate-200">1-Stage (Synchronous):</strong> SM halts
                      math execution and waits ~200 cycles for each global memory transaction.
                    </p>
                    <p>
                      <strong className="text-slate-200">2-Stage (Double Buffering):</strong>{" "}
                      Ping-pong between 2 SRAM buffers to overlap next tile load with current tile
                      MMA.
                    </p>
                    <p>
                      <strong className="text-slate-200">3/4-Stage (Hopper TMA):</strong> Hardware
                      DMA engine loads multi-tile circular rings asynchronously with mbarrier
                      synchronization.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Warp Specialization
                  </h4>
                  <p className="text-slate-400 leading-relaxed">
                    In Hopper architectures, Producer Warps issue TMA instructions while Consumer
                    Warps run MMA math instructions uninterrupted, eliminating SM register spills.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 4: ROOFLINE PERFORMANCE MODEL & THROUGHPUT */}
        {/* ================================================================== */}
        {activeTab === "roofline" && (
          <div className="space-y-5">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Operational Intensity
                </span>
                <p className="text-lg font-bold text-purple-400 mt-0.5">
                  {roofline.operationalIntensityFlopsPerByte.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">FLOP/B</span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Hardware Ridge Point
                </span>
                <p className="text-lg font-bold text-cyan-400 mt-0.5">
                  {roofline.ridgePointFlopsPerByte.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-400">FLOP/B</span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Attainable TFLOPS
                </span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {roofline.attainableTFlops.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-slate-400">
                    / {roofline.peakTFlops.toFixed(0)}
                  </span>
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Bottleneck Regime
                </span>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    roofline.isComputeBound ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {roofline.isComputeBound ? "Compute Bound" : "Memory Bound"}
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Bandwidth Utilization
                </span>
                <p className="text-lg font-bold text-teal-400 mt-0.5">
                  {roofline.memoryBandwidthUtilizationPercent.toFixed(1)}%
                </p>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Speedup vs Un-tiled
                </span>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  {roofline.speedupVsNaiveUnTiled.toFixed(1)}x
                </p>
              </div>
            </div>

            {/* SVG Roofline Plot & Hardware Spec Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: SVG Roofline Chart */}
              <div className="lg:col-span-8 bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      Roofline Model: Operational Intensity vs Achievable TFLOPS
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    GPU: <strong className="text-purple-300">{archSpec.name}</strong> (
                    {archSpec.memoryBandwidthGBs} GB/s)
                  </span>
                </div>

                {/* SVG Log-Log Roofline Diagram */}
                <div className="w-full bg-[#070b12] rounded-lg p-3 border border-slate-900 flex items-center justify-center">
                  <svg
                    viewBox="0 0 640 320"
                    className="w-full max-w-[640px] h-auto select-none font-sans"
                  >
                    {/* Grid Lines */}
                    <line x1="60" y1="40" x2="60" y2="270" stroke="#1e293b" strokeWidth="1" />
                    <line x1="60" y1="270" x2="600" y2="270" stroke="#1e293b" strokeWidth="1" />
                    <line
                      x1="60"
                      y1="100"
                      x2="600"
                      y2="100"
                      stroke="#1e293b"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <line
                      x1="60"
                      y1="180"
                      x2="600"
                      y2="180"
                      stroke="#1e293b"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />

                    {/* Labels */}
                    <text x="30" y="50" fill="#94a3b8" fontSize="10" fontWeight="bold">
                      TFLOPS
                    </text>
                    <text x="540" y="295" fill="#94a3b8" fontSize="10" fontWeight="bold">
                      Intensity (FLOP/B)
                    </text>

                    {/* Peak Compute Ceiling */}
                    <line x1="280" y1="70" x2="580" y2="70" stroke="#a855f7" strokeWidth="3" />
                    <text
                      x="580"
                      y="62"
                      fill="#c084fc"
                      fontSize="10"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      Compute Ceiling: {roofline.peakTFlops.toFixed(0)} TFLOPS
                    </text>

                    {/* Memory Bandwidth Slope */}
                    <line x1="80" y1="270" x2="280" y2="70" stroke="#06b6d4" strokeWidth="3" />
                    <text
                      x="140"
                      y="160"
                      fill="#22d3ee"
                      fontSize="10"
                      fontWeight="bold"
                      transform="rotate(-45 140 160)"
                    >
                      Bandwidth: {roofline.memoryBandwidthTBps.toFixed(2)} TB/s
                    </text>

                    {/* Ridge Point Indicator */}
                    <circle cx="280" cy="70" r="5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                    <line
                      x1="280"
                      y1="70"
                      x2="280"
                      y2="270"
                      stroke="#f59e0b"
                      strokeDasharray="3,3"
                      strokeWidth="1"
                    />
                    <text
                      x="280"
                      y="285"
                      fill="#f59e0b"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      Ridge: {roofline.ridgePointFlopsPerByte.toFixed(1)} FLOP/B
                    </text>

                    {/* Current Operational Point */}
                    {(() => {
                      // Map intensity to SVG coordinate
                      const opI = roofline.operationalIntensityFlopsPerByte;
                      const ridgeI = roofline.ridgePointFlopsPerByte;
                      const normX = Math.max(
                        80,
                        Math.min(
                          560,
                          opI < ridgeI
                            ? 80 + (opI / ridgeI) * 200
                            : 280 + Math.min(280, (opI - ridgeI) * 1.5),
                        ),
                      );
                      const attainTFlops = roofline.attainableTFlops;
                      const normY = Math.max(
                        70,
                        Math.min(270, 270 - (attainTFlops / roofline.peakTFlops) * 200),
                      );

                      return (
                        <g>
                          <circle
                            cx={normX}
                            cy={normY}
                            r="7"
                            fill="#10b981"
                            stroke="#ecfdf5"
                            strokeWidth="2"
                            className="animate-pulse"
                          />
                          <text
                            x={normX}
                            y={normY - 12}
                            fill="#34d399"
                            fontSize="11"
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            Current Workload: {attainTFlops.toFixed(1)} TFLOPS
                          </text>
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

              {/* Right Column: Hardware Profile & Microarchitecture Table */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-400" /> Hardware GPU Specifications
                  </h4>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Architecture:</span>
                      <strong className="text-white">{archSpec.architecture}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Peak FP16 Tensor Cores:</span>
                      <strong className="text-purple-400">{archSpec.peakFP16TFlops} TFLOPS</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Memory Bandwidth:</span>
                      <strong className="text-cyan-400">{archSpec.memoryBandwidthGBs} GB/s</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">L2 Cache Capacity:</span>
                      <strong className="text-teal-400">{archSpec.l2CacheMB} MB</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">SMEM per Streaming Multiprocessor:</span>
                      <strong className="text-emerald-400">{archSpec.smemPerSMKB} KB</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-400">Multiprocessor Count:</span>
                      <strong className="text-white">{archSpec.maxSMs} SMs</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">TMA Asynchronous Copy:</span>
                      <strong
                        className={archSpec.supportsTMA ? "text-emerald-400" : "text-slate-500"}
                      >
                        {archSpec.supportsTMA ? "Supported (Hopper)" : "Not Supported"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Custom GPU Override inputs if custom is selected */}
                {config.gpuArch === "custom" && (
                  <div className="bg-slate-950/70 p-4 rounded-xl border border-purple-900/40 space-y-3 text-xs">
                    <h4 className="font-bold text-purple-300 text-sm">Custom Hardware Overrides</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-400">Peak TFLOPS:</span>
                        <input
                          type="number"
                          value={config.customTFlops ?? 500}
                          onChange={(e) =>
                            updateConfig({ customTFlops: Number(e.target.value) || 100 })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Bandwidth (GB/s):</span>
                        <input
                          type="number"
                          value={config.customBandwidth ?? 1500}
                          onChange={(e) =>
                            updateConfig({ customBandwidth: Number(e.target.value) || 500 })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 5: TRITON PYTHON JIT CODE GENERATOR */}
        {/* ================================================================== */}
        {activeTab === "code_gen" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Live Generated Triton Python JIT Kernel (@triton.jit)
                </h3>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? "Copied to Clipboard!" : "Copy Python Code"}
              </button>
            </div>

            <div className="p-4 bg-[#05080f] rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 leading-relaxed overflow-x-auto shadow-2xl scrollbar-thin">
              <pre className="whitespace-pre">{tritonCode}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TritonKernelTilingStudio;
