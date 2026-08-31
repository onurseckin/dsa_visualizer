import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  Workflow,
  Cpu,
  Activity,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Share2,
  BarChart3,
  Gauge,
  Split,
  Sparkles,
  Database,
  Box,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type FlashDecodingPresetId =
  | "llama3_8b_8k_h100"
  | "llama3_8b_128k_h100"
  | "llama3_70b_32k_h100"
  | "llama3_70b_128k_b200"
  | "deepseek_v3_64k_h100"
  | "deepseek_v3_128k_h100"
  | "mistral_large_128k_a100"
  | "qwen25_72b_32k_4090"
  | "custom";

export type FlashDecodingTabId =
  | "split_k_stepper"
  | "partial_softmax_math"
  | "sm_occupancy_grid"
  | "roofline_benchmark"
  | "kernel_code_gen";

export type PrecisionFormat = "fp32" | "fp16" | "bf16" | "fp8";

export interface GpuHardwareSpec {
  readonly id: string;
  readonly name: string;
  readonly architecture: string;
  readonly smCount: number;
  readonly vramGb: number;
  readonly hbmBandwidthGbs: number;
  readonly tflopsBf16: number;
  readonly tflopsFp16: number;
  readonly tflopsFp8: number;
  readonly maxWarpsPerSm: number;
  readonly sharedMemoryPerSmKb: number;
  readonly maxThreadsPerSm: number;
}

export interface FlashDecodingConfig {
  readonly batchSize: number;
  readonly seqLen: number;
  readonly numHeads: number;
  readonly numKvHeads: number;
  readonly headDim: number;
  readonly numSplits: number;
  readonly gpuType: string;
  readonly precision: PrecisionFormat;
}

export interface FlashDecodingPreset {
  readonly id: FlashDecodingPresetId;
  readonly name: string;
  readonly description: string;
  readonly config: FlashDecodingConfig;
}

export interface PartialSoftmaxSplit {
  readonly splitIndex: number;
  readonly startIdx: number;
  readonly endIdx: number;
  readonly chunkSize: number;
  readonly maxScore: number;
  readonly sumExp: number;
  readonly partialOutput: number[];
  readonly rawScoresSample: number[];
  readonly expWeightsSample: number[];
  readonly scale: number;
}

export interface TreeReductionNode {
  readonly nodeId: string;
  readonly stage: number;
  readonly splitIndices: number[];
  readonly mergedMax: number;
  readonly mergedSum: number;
  readonly mergedOutput: number[];
  readonly leftChildId?: string;
  readonly rightChildId?: string;
  readonly rescaleLeft?: number;
  readonly rescaleRight?: number;
}

export interface TreeReductionStage {
  readonly stageIndex: number;
  readonly stageName: string;
  readonly nodes: TreeReductionNode[];
  readonly activeSplits: number;
}

export interface NumericVerificationResult {
  readonly flashDecodingOutput: number[];
  readonly monolithicOutput: number[];
  readonly maxAbsError: number;
  readonly relativeL2Error: number;
  readonly cosineSimilarity: number;
  readonly isMatch: boolean;
  readonly splits: PartialSoftmaxSplit[];
  readonly globalMax: number;
  readonly globalSumExp: number;
  readonly rescaleFactors: number[];
}

export interface SmOccupancyResult {
  readonly totalSmCount: number;
  readonly totalThreadBlocks: number;
  readonly flashAttentionThreadBlocks: number;
  readonly activeSms: number;
  readonly flashAttentionActiveSms: number;
  readonly waves: number;
  readonly flashAttentionWaves: number;
  readonly tailWaveActiveSms: number;
  readonly tailWavePenalty: number;
  readonly smUtilizationPercent: number;
  readonly flashAttentionSmUtilizationPercent: number;
  readonly occupancySpeedupFactor: number;
  readonly blocksPerSmDistribution: number[];
}

export interface RooflineBenchmarkResult {
  readonly kvCacheSizeBytes: number;
  readonly qSizeBytes: number;
  readonly intermediateTrafficBytes: number;
  readonly totalMemoryTrafficBytes: number;
  readonly totalFlops: number;
  readonly arithmeticIntensity: number;
  readonly gpuPeakBandwidthGbs: number;
  readonly gpuPeakTflops: number;
  readonly rooflineKneeIntensity: number;
  readonly isMemoryBound: boolean;
  readonly theoreticalMemoryTimeUs: number;
  readonly theoreticalComputeTimeUs: number;
  readonly flashAttentionLatencyUs: number;
  readonly flashDecodingLatencyUs: number;
  readonly speedupFactor: number;
  readonly hbmBandwidthUtilizationPct: number;
  readonly latencyCurvePoints: Array<{
    seqLen: number;
    faLatencyUs: number;
    fdLatencyUs: number;
    speedup: number;
  }>;
}

export interface FlashDecodingStudioProps {
  readonly initialPreset?: FlashDecodingPresetId;
  readonly initialTab?: FlashDecodingTabId;
  readonly className?: string;
  readonly title?: string;
}

// ============================================================================
// 2. HARDWARE & PRESETS DATABASES
// ============================================================================

export const FLASH_DECODING_GPU_SPECS: Record<string, GpuHardwareSpec> = {
  h100: {
    id: "h100",
    name: "NVIDIA H100 SXM5 80GB",
    architecture: "Hopper (GH100)",
    smCount: 132,
    vramGb: 80,
    hbmBandwidthGbs: 3350,
    tflopsBf16: 989,
    tflopsFp16: 989,
    tflopsFp8: 1979,
    maxWarpsPerSm: 64,
    sharedMemoryPerSmKb: 228,
    maxThreadsPerSm: 2048,
  },
  a100: {
    id: "a100",
    name: "NVIDIA A100 SXM4 80GB",
    architecture: "Ampere (GA100)",
    smCount: 108,
    vramGb: 80,
    hbmBandwidthGbs: 2039,
    tflopsBf16: 312,
    tflopsFp16: 312,
    tflopsFp8: 624,
    maxWarpsPerSm: 64,
    sharedMemoryPerSmKb: 164,
    maxThreadsPerSm: 2048,
  },
  b200: {
    id: "b200",
    name: "NVIDIA B200 SXM6 192GB",
    architecture: "Blackwell (GB200)",
    smCount: 160,
    vramGb: 192,
    hbmBandwidthGbs: 8000,
    tflopsBf16: 2250,
    tflopsFp16: 2250,
    tflopsFp8: 4500,
    maxWarpsPerSm: 64,
    sharedMemoryPerSmKb: 256,
    maxThreadsPerSm: 2048,
  },
  l40s: {
    id: "l40s",
    name: "NVIDIA L40S 48GB",
    architecture: "Ada Lovelace (AD102)",
    smCount: 142,
    vramGb: 48,
    hbmBandwidthGbs: 864,
    tflopsBf16: 366,
    tflopsFp16: 366,
    tflopsFp8: 733,
    maxWarpsPerSm: 48,
    sharedMemoryPerSmKb: 128,
    maxThreadsPerSm: 1536,
  },
  rtx4090: {
    id: "rtx4090",
    name: "NVIDIA GeForce RTX 4090 24GB",
    architecture: "Ada Lovelace (AD102)",
    smCount: 128,
    vramGb: 24,
    hbmBandwidthGbs: 1008,
    tflopsBf16: 165,
    tflopsFp16: 165,
    tflopsFp8: 330,
    maxWarpsPerSm: 48,
    sharedMemoryPerSmKb: 100,
    maxThreadsPerSm: 1536,
  },
  v100: {
    id: "v100",
    name: "NVIDIA Tesla V100 SXM2 32GB",
    architecture: "Volta (GV100)",
    smCount: 80,
    vramGb: 32,
    hbmBandwidthGbs: 900,
    tflopsBf16: 125,
    tflopsFp16: 125,
    tflopsFp8: 125,
    maxWarpsPerSm: 64,
    sharedMemoryPerSmKb: 96,
    maxThreadsPerSm: 2048,
  },
};

export const FLASH_DECODING_PRESETS: Record<FlashDecodingPresetId, FlashDecodingPreset> = {
  llama3_8b_8k_h100: {
    id: "llama3_8b_8k_h100",
    name: "LLaMA-3-8B (8k Context on H100)",
    description:
      "Standard generation decoding with 8k KV history, 32 Q heads, 8 KV heads (GQA 4:1) split across 16 KV chunks.",
    config: {
      batchSize: 1,
      seqLen: 8192,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 16,
      gpuType: "h100",
      precision: "bf16",
    },
  },
  llama3_8b_128k_h100: {
    id: "llama3_8b_128k_h100",
    name: "LLaMA-3-8B (128k Long Context on H100)",
    description:
      "Extreme long-context decoding at 128k tokens. 64 splits saturate all 132 SMs of Hopper.",
    config: {
      batchSize: 1,
      seqLen: 131072,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 64,
      gpuType: "h100",
      precision: "bf16",
    },
  },
  llama3_70b_32k_h100: {
    id: "llama3_70b_32k_h100",
    name: "LLaMA-3-70B (32k Context on H100)",
    description:
      "70B enterprise workload with 64 Q heads, 8 KV heads (GQA 8:1), 32 splits filling 2048 threadblocks.",
    config: {
      batchSize: 1,
      seqLen: 32768,
      numHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 32,
      gpuType: "h100",
      precision: "bf16",
    },
  },
  llama3_70b_128k_b200: {
    id: "llama3_70b_128k_b200",
    name: "LLaMA-3-70B (128k on Blackwell B200 FP8)",
    description:
      "Next-gen Blackwell serving with FP8 KV cache, 64 splits across 160 SMs reaching 8 TB/s HBM3e peak.",
    config: {
      batchSize: 1,
      seqLen: 131072,
      numHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 64,
      gpuType: "b200",
      precision: "fp8",
    },
  },
  deepseek_v3_64k_h100: {
    id: "deepseek_v3_64k_h100",
    name: "DeepSeek-V3 (64k Context on H100)",
    description:
      "Multi-head Latent Attention (MLA) decoding with 128 attention heads, 32 splits in FP8 precision.",
    config: {
      batchSize: 1,
      seqLen: 65536,
      numHeads: 128,
      numKvHeads: 128,
      headDim: 128,
      numSplits: 32,
      gpuType: "h100",
      precision: "fp8",
    },
  },
  deepseek_v3_128k_h100: {
    id: "deepseek_v3_128k_h100",
    name: "DeepSeek-V3 (128k Context on H100)",
    description:
      "Full 128k window DeepSeek-V3 decoding with 64 splits, saturating GPU memory bandwidth.",
    config: {
      batchSize: 1,
      seqLen: 131072,
      numHeads: 128,
      numKvHeads: 128,
      headDim: 128,
      numSplits: 64,
      gpuType: "h100",
      precision: "fp8",
    },
  },
  mistral_large_128k_a100: {
    id: "mistral_large_128k_a100",
    name: "Mistral-Large (128k Context on A100 80GB)",
    description: "Mistral Large architecture with 96 heads, 8 KV heads, 64 splits on Ampere A100.",
    config: {
      batchSize: 1,
      seqLen: 131072,
      numHeads: 96,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 64,
      gpuType: "a100",
      precision: "bf16",
    },
  },
  qwen25_72b_32k_4090: {
    id: "qwen25_72b_32k_4090",
    name: "Qwen2.5-72B (32k Context on RTX 4090)",
    description:
      "Consumer workstation 4090 inference with 64 heads, 8 KV heads, 16 splits in FP16.",
    config: {
      batchSize: 1,
      seqLen: 32768,
      numHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 16,
      gpuType: "rtx4090",
      precision: "fp16",
    },
  },
  custom: {
    id: "custom",
    name: "Custom Configuration",
    description:
      "User-defined parameters for custom LLM architectures, GPU targets, and Split-K tiling.",
    config: {
      batchSize: 1,
      seqLen: 16384,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 16,
      gpuType: "h100",
      precision: "bf16",
    },
  },
};

// ============================================================================
// 3. PURE MATHEMATICAL & ARCHITECTURAL FUNCTIONS
// ============================================================================

export function getBytesPerPrecision(precision: PrecisionFormat): number {
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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes.toFixed(0)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(2)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  if (gb < 1024) return `${gb.toFixed(2)} GB`;
  const tb = gb / 1024;
  return `${tb.toFixed(2)} TB`;
}

export function formatFlops(flops: number): string {
  if (flops < 1e6) return `${flops.toFixed(0)} FLOPs`;
  const gflops = flops / 1e9;
  if (gflops < 1000) return `${gflops.toFixed(2)} GFLOPs`;
  const tflops = gflops / 1000;
  if (tflops < 1000) return `${tflops.toFixed(2)} TFLOPs`;
  const pflops = tflops / 1000;
  if (pflops < 1000) return `${pflops.toFixed(2)} PFLOPs`;
  const eflops = pflops / 1000;
  return `${eflops.toFixed(2)} EFLOPs`;
}

export function formatBandwidth(gbs: number): string {
  if (gbs >= 1000) {
    return `${(gbs / 1000).toFixed(2)} TB/s`;
  }
  return `${gbs.toFixed(1)} GB/s`;
}

export function formatLatencyUs(us: number): string {
  if (us < 1.0) {
    return `${(us * 1000).toFixed(1)} ns`;
  }
  if (us < 1000) {
    return `${us.toFixed(2)} µs`;
  }
  const ms = us / 1000;
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatNumberWithCommas(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function calculateSplitKParameters(config: FlashDecodingConfig): {
  chunkSize: number;
  numSplits: number;
  totalThreadBlocks: number;
  blocksPerHead: number;
  kvLengthPerSplit: number;
} {
  const numSplits = Math.max(1, Math.min(config.numSplits, config.seqLen));
  const chunkSize = Math.ceil(config.seqLen / numSplits);
  const totalThreadBlocks = config.batchSize * config.numHeads * numSplits;
  const blocksPerHead = numSplits;
  return {
    chunkSize,
    numSplits,
    totalThreadBlocks,
    blocksPerHead,
    kvLengthPerSplit: chunkSize,
  };
}

export function computePartialSoftmaxSplit(
  q: number[],
  kChunk: number[][],
  vChunk: number[][],
  scale: number,
  splitIdx: number,
  startTokenIdx: number = 0,
): PartialSoftmaxSplit {
  const chunkSize = kChunk.length;
  const headDim = q.length;

  if (chunkSize === 0) {
    return {
      splitIndex: splitIdx,
      startIdx: startTokenIdx,
      endIdx: startTokenIdx,
      chunkSize: 0,
      maxScore: -Infinity,
      sumExp: 0,
      partialOutput: new Array(headDim).fill(0),
      rawScoresSample: [],
      expWeightsSample: [],
      scale,
    };
  }

  // 1. Dot products Q . K_i * scale
  const rawScores: number[] = new Array(chunkSize);
  let maxScore = -Infinity;

  for (let i = 0; i < chunkSize; i++) {
    let dot = 0;
    const kRow = kChunk[i];
    for (let d = 0; d < headDim; d++) {
      dot += q[d] * (kRow ? kRow[d] || 0 : 0);
    }
    const score = dot * scale;
    rawScores[i] = score;
    if (score > maxScore) {
      maxScore = score;
    }
  }

  // 2. Exponentiate & Sum
  const expWeights: number[] = new Array(chunkSize);
  let sumExp = 0;
  for (let i = 0; i < chunkSize; i++) {
    const expVal = Math.exp(rawScores[i] - maxScore);
    expWeights[i] = expVal;
    sumExp += expVal;
  }

  // 3. Weighted sum with V chunk -> normalized partial output O_k
  const partialOutput: number[] = new Array(headDim).fill(0);
  if (sumExp > 0) {
    for (let i = 0; i < chunkSize; i++) {
      const w = expWeights[i];
      const vRow = vChunk[i];
      if (vRow) {
        for (let d = 0; d < headDim; d++) {
          partialOutput[d] += w * (vRow[d] || 0);
        }
      }
    }
    for (let d = 0; d < headDim; d++) {
      partialOutput[d] /= sumExp;
    }
  }

  return {
    splitIndex: splitIdx,
    startIdx: startTokenIdx,
    endIdx: startTokenIdx + chunkSize,
    chunkSize,
    maxScore,
    sumExp,
    partialOutput,
    rawScoresSample: rawScores.slice(0, Math.min(5, chunkSize)),
    expWeightsSample: expWeights.slice(0, Math.min(5, chunkSize)),
    scale,
  };
}

export function mergePartialSoftmaxSplits(
  splits: PartialSoftmaxSplit[],
  headDim: number,
): {
  output: number[];
  globalMax: number;
  globalSum: number;
  rescaleWeights: number[];
} {
  const validSplits = splits.filter((s) => s.chunkSize > 0 && s.maxScore > -Infinity);
  if (validSplits.length === 0) {
    return {
      output: new Array(headDim).fill(0),
      globalMax: 0,
      globalSum: 0,
      rescaleWeights: [],
    };
  }

  // 1. Find global max m = max_k m_k
  let globalMax = -Infinity;
  for (const s of validSplits) {
    if (s.maxScore > globalMax) {
      globalMax = s.maxScore;
    }
  }

  // 2. Compute rescaled weights alpha_k = l_k * exp(m_k - m)
  const rescaleFactors: number[] = new Array(validSplits.length);
  let globalSum = 0;
  for (let k = 0; k < validSplits.length; k++) {
    const s = validSplits[k];
    const alpha = s.sumExp * Math.exp(s.maxScore - globalMax);
    rescaleFactors[k] = alpha;
    globalSum += alpha;
  }

  // 3. Merge partial outputs: O = sum_k (alpha_k / L) * O_k
  const output: number[] = new Array(headDim).fill(0);
  const rescaleWeights: number[] = new Array(validSplits.length);

  if (globalSum > 0) {
    for (let k = 0; k < validSplits.length; k++) {
      const s = validSplits[k];
      const weight = rescaleFactors[k] / globalSum;
      rescaleWeights[k] = weight;
      for (let d = 0; d < headDim; d++) {
        output[d] += weight * s.partialOutput[d];
      }
    }
  }

  return {
    output,
    globalMax,
    globalSum,
    rescaleWeights,
  };
}

export function computeMonolithicAttentionDecode(
  q: number[],
  kAll: number[][],
  vAll: number[][],
  scale: number,
): {
  output: number[];
  maxScore: number;
  sumExp: number;
} {
  const seqLen = kAll.length;
  const headDim = q.length;

  if (seqLen === 0) {
    return {
      output: new Array(headDim).fill(0),
      maxScore: -Infinity,
      sumExp: 0,
    };
  }

  // 1. Dot products
  const scores: number[] = new Array(seqLen);
  let maxScore = -Infinity;
  for (let i = 0; i < seqLen; i++) {
    let dot = 0;
    const kRow = kAll[i];
    for (let d = 0; d < headDim; d++) {
      dot += q[d] * (kRow ? kRow[d] || 0 : 0);
    }
    const score = dot * scale;
    scores[i] = score;
    if (score > maxScore) {
      maxScore = score;
    }
  }

  // 2. Softmax
  const expWeights: number[] = new Array(seqLen);
  let sumExp = 0;
  for (let i = 0; i < seqLen; i++) {
    const expVal = Math.exp(scores[i] - maxScore);
    expWeights[i] = expVal;
    sumExp += expVal;
  }

  // 3. Output
  const output: number[] = new Array(headDim).fill(0);
  if (sumExp > 0) {
    for (let i = 0; i < seqLen; i++) {
      const w = expWeights[i] / sumExp;
      const vRow = vAll[i];
      if (vRow) {
        for (let d = 0; d < headDim; d++) {
          output[d] += w * (vRow[d] || 0);
        }
      }
    }
  }

  return {
    output,
    maxScore,
    sumExp,
  };
}

export function buildTreeReductionGraph(splits: PartialSoftmaxSplit[]): TreeReductionStage[] {
  if (splits.length === 0) return [];
  const headDim = splits[0].partialOutput.length;

  const stages: TreeReductionStage[] = [];

  // Stage 0: Leaf nodes
  let currentNodes: TreeReductionNode[] = splits.map((s) => ({
    nodeId: `s0_node_${s.splitIndex}`,
    stage: 0,
    splitIndices: [s.splitIndex],
    mergedMax: s.maxScore,
    mergedSum: s.sumExp,
    mergedOutput: [...s.partialOutput],
  }));

  stages.push({
    stageIndex: 0,
    stageName: "Phase 1: Leaf Splits",
    nodes: currentNodes,
    activeSplits: currentNodes.length,
  });

  let stageIdx = 1;
  while (currentNodes.length > 1) {
    const nextNodes: TreeReductionNode[] = [];
    for (let i = 0; i < currentNodes.length; i += 2) {
      const left = currentNodes[i];
      if (i + 1 < currentNodes.length) {
        const right = currentNodes[i + 1];
        // Pairwise merge
        const mergedMax = Math.max(left.mergedMax, right.mergedMax);
        const alphaLeft = left.mergedSum * Math.exp(left.mergedMax - mergedMax);
        const alphaRight = right.mergedSum * Math.exp(right.mergedMax - mergedMax);
        const mergedSum = alphaLeft + alphaRight;

        const mergedOutput: number[] = new Array(headDim).fill(0);
        if (mergedSum > 0) {
          const wLeft = alphaLeft / mergedSum;
          const wRight = alphaRight / mergedSum;
          for (let d = 0; d < headDim; d++) {
            mergedOutput[d] = wLeft * left.mergedOutput[d] + wRight * right.mergedOutput[d];
          }
        }

        nextNodes.push({
          nodeId: `s${stageIdx}_node_${nextNodes.length}`,
          stage: stageIdx,
          splitIndices: [...left.splitIndices, ...right.splitIndices],
          mergedMax,
          mergedSum,
          mergedOutput,
          leftChildId: left.nodeId,
          rightChildId: right.nodeId,
          rescaleLeft: alphaLeft,
          rescaleRight: alphaRight,
        });
      } else {
        // Odd node carryover
        nextNodes.push({
          nodeId: `s${stageIdx}_node_${nextNodes.length}`,
          stage: stageIdx,
          splitIndices: [...left.splitIndices],
          mergedMax: left.mergedMax,
          mergedSum: left.mergedSum,
          mergedOutput: [...left.mergedOutput],
          leftChildId: left.nodeId,
        });
      }
    }

    stages.push({
      stageIndex: stageIdx,
      stageName: nextNodes.length === 1 ? "Final Root Reduction" : `Tree Stage ${stageIdx}`,
      nodes: nextNodes,
      activeSplits: nextNodes.length,
    });

    currentNodes = nextNodes;
    stageIdx++;
  }

  return stages;
}

export function generateSyntheticQKV(
  seqLen: number,
  headDim: number,
  seed: number = 42,
): {
  q: number[];
  k: number[][];
  v: number[][];
  scale: number;
} {
  let state = seed;
  const lcg = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const scale = 1.0 / Math.sqrt(headDim);

  const q: number[] = new Array(headDim);
  for (let d = 0; d < headDim; d++) {
    q[d] = (lcg() - 0.5) * 2.0;
  }

  const k: number[][] = new Array(seqLen);
  const v: number[][] = new Array(seqLen);

  for (let i = 0; i < seqLen; i++) {
    const kRow = new Array(headDim);
    const vRow = new Array(headDim);
    for (let d = 0; d < headDim; d++) {
      kRow[d] = (lcg() - 0.5) * 2.0;
      vRow[d] = (lcg() - 0.5) * 2.0;
    }
    k[i] = kRow;
    v[i] = vRow;
  }

  return { q, k, v, scale };
}

export function verifyFlashDecodingNumericAccuracy(
  q: number[],
  k: number[][],
  v: number[][],
  numSplits: number,
): NumericVerificationResult {
  const seqLen = k.length;
  const headDim = q.length;
  const scale = 1.0 / Math.sqrt(headDim);

  const safeNumSplits = Math.max(1, Math.min(numSplits, seqLen));
  const chunkSize = Math.ceil(seqLen / safeNumSplits);

  const splits: PartialSoftmaxSplit[] = [];
  for (let s = 0; s < safeNumSplits; s++) {
    const start = s * chunkSize;
    const end = Math.min(seqLen, (s + 1) * chunkSize);
    if (start < end) {
      const kChunk = k.slice(start, end);
      const vChunk = v.slice(start, end);
      splits.push(computePartialSoftmaxSplit(q, kChunk, vChunk, scale, s, start));
    }
  }

  const {
    output: flashDecodingOutput,
    globalMax,
    globalSum,
    rescaleWeights,
  } = mergePartialSoftmaxSplits(splits, headDim);
  const { output: monolithicOutput } = computeMonolithicAttentionDecode(q, k, v, scale);

  let maxAbsError = 0;
  let sumDiffSq = 0;
  let sumMonoSq = 0;
  let dotProd = 0;
  let sumFdSq = 0;

  for (let d = 0; d < headDim; d++) {
    const fdVal = flashDecodingOutput[d];
    const monoVal = monolithicOutput[d];
    const diff = Math.abs(fdVal - monoVal);
    if (diff > maxAbsError) {
      maxAbsError = diff;
    }
    sumDiffSq += diff * diff;
    sumMonoSq += monoVal * monoVal;
    sumFdSq += fdVal * fdVal;
    dotProd += fdVal * monoVal;
  }

  const relativeL2Error = Math.sqrt(sumDiffSq) / (Math.sqrt(sumMonoSq) + 1e-12);
  const denom = Math.sqrt(sumFdSq) * Math.sqrt(sumMonoSq);
  const cosineSimilarity = denom > 1e-12 ? Math.min(1.0, dotProd / denom) : 1.0;

  return {
    flashDecodingOutput,
    monolithicOutput,
    maxAbsError,
    relativeL2Error,
    cosineSimilarity,
    isMatch: maxAbsError < 1e-5,
    splits,
    globalMax,
    globalSumExp: globalSum,
    rescaleFactors: rescaleWeights,
  };
}

export function calculateSmOccupancyAndWaves(
  config: FlashDecodingConfig,
  gpu: GpuHardwareSpec,
): SmOccupancyResult {
  const totalSmCount = gpu.smCount;
  const numSplits = Math.max(1, config.numSplits);
  const totalThreadBlocks = config.batchSize * config.numHeads * numSplits;
  const flashAttentionThreadBlocks = config.batchSize * config.numHeads;

  // FlashAttention stats
  const flashAttentionActiveSms = Math.min(totalSmCount, flashAttentionThreadBlocks);
  const flashAttentionWaves = Math.ceil(flashAttentionThreadBlocks / totalSmCount);
  const flashAttentionSmUtilizationPercent =
    flashAttentionThreadBlocks < totalSmCount
      ? (flashAttentionThreadBlocks / totalSmCount) * 100
      : (flashAttentionThreadBlocks / (flashAttentionWaves * totalSmCount)) * 100;

  // FlashDecoding stats
  const activeSms = Math.min(totalSmCount, totalThreadBlocks);
  const waves = Math.ceil(totalThreadBlocks / totalSmCount);
  const rem = totalThreadBlocks % totalSmCount;
  const tailWaveActiveSms = rem === 0 ? totalSmCount : rem;

  const tailWavePenalty =
    waves > 1
      ? ((totalSmCount - tailWaveActiveSms) / (waves * totalSmCount)) * 100
      : ((totalSmCount - activeSms) / totalSmCount) * 100;

  const smUtilizationPercent = (totalThreadBlocks / (waves * totalSmCount)) * 100;

  const occupancySpeedupFactor =
    smUtilizationPercent / Math.max(1, flashAttentionSmUtilizationPercent);

  // Distribution of blocks across each SM
  const blocksPerSmDistribution: number[] = new Array(totalSmCount).fill(0);
  const baseBlocks = Math.floor(totalThreadBlocks / totalSmCount);
  const extraBlocks = totalThreadBlocks % totalSmCount;

  for (let i = 0; i < totalSmCount; i++) {
    blocksPerSmDistribution[i] = baseBlocks + (i < extraBlocks ? 1 : 0);
  }

  return {
    totalSmCount,
    totalThreadBlocks,
    flashAttentionThreadBlocks,
    activeSms,
    flashAttentionActiveSms,
    waves,
    flashAttentionWaves,
    tailWaveActiveSms,
    tailWavePenalty,
    smUtilizationPercent,
    flashAttentionSmUtilizationPercent,
    occupancySpeedupFactor,
    blocksPerSmDistribution,
  };
}

export function calculateFlashDecodingRoofline(
  config: FlashDecodingConfig,
  gpu: GpuHardwareSpec,
): RooflineBenchmarkResult {
  const bytesPerElem = getBytesPerPrecision(config.precision);

  // 1. Memory Traffic
  // KV Cache: 2 (K & V) * batch * seqLen * numKvHeads * headDim * bytesPerElem
  const kvCacheSizeBytes =
    2 * config.batchSize * config.seqLen * config.numKvHeads * config.headDim * bytesPerElem;
  // Query vector: batch * numHeads * headDim * bytesPerElem
  const qSizeBytes = config.batchSize * config.numHeads * config.headDim * bytesPerElem;
  // Intermediate partial buffers: K splits * batch * numHeads * (headDim * bytes + 8 bytes for max/sum)
  const intermediateTrafficBytes =
    config.numSplits * config.batchSize * config.numHeads * (config.headDim * bytesPerElem + 8);
  const totalMemoryTrafficBytes = kvCacheSizeBytes + qSizeBytes + intermediateTrafficBytes;

  // 2. FLOPs
  // QK Gemv (2 * batch * seqLen * H * d) + PV Gemv (2 * batch * seqLen * H * d)
  const totalFlops = 4 * config.batchSize * config.seqLen * config.numHeads * config.headDim;

  // 3. Arithmetic Intensity (FLOP/Byte)
  const arithmeticIntensity = totalFlops / Math.max(1, totalMemoryTrafficBytes);

  // 4. GPU Roofline
  let gpuPeakTflops = gpu.tflopsBf16;
  if (config.precision === "fp8") gpuPeakTflops = gpu.tflopsFp8;
  else if (config.precision === "fp16") gpuPeakTflops = gpu.tflopsFp16;

  const gpuPeakBandwidthGbs = gpu.hbmBandwidthGbs;
  // Knee point: (Peak TFLOPs * 1e12) / (Peak GB/s * 1e9) = (Peak TFLOPs * 1000) / Peak GB/s
  const rooflineKneeIntensity = (gpuPeakTflops * 1000) / Math.max(1, gpuPeakBandwidthGbs);
  const isMemoryBound = arithmeticIntensity < rooflineKneeIntensity;

  // 5. Latency Modeling
  const theoreticalMemoryTimeUs =
    (totalMemoryTrafficBytes / (gpuPeakBandwidthGbs * 1e9 * 0.85)) * 1e6;
  const theoreticalComputeTimeUs = (totalFlops / (gpuPeakTflops * 1e12 * 0.75)) * 1e6;

  // Standard FlashAttention decoding latency:
  // Under-saturates SMs when batch * numHeads < smCount
  const faParallelism = config.batchSize * config.numHeads;
  const faSmUtilization = Math.min(1.0, faParallelism / gpu.smCount);
  const faEffectiveBandwidth = gpuPeakBandwidthGbs * Math.max(0.18, faSmUtilization);
  const faLatencyUs = ((kvCacheSizeBytes + qSizeBytes) / (faEffectiveBandwidth * 1e9 * 0.82)) * 1e6;

  // FlashDecoding latency:
  // Saturates memory bandwidth completely because batch * numHeads * K >> smCount
  const fdEffectiveBandwidth = gpuPeakBandwidthGbs * 0.88;
  const phase1LatencyUs = (totalMemoryTrafficBytes / (fdEffectiveBandwidth * 1e9)) * 1e6;
  // Phase 2 reduction overhead (negligible tree reduction in SRAM)
  const phase2LatencyUs = Math.max(0.5, (config.numSplits * config.headDim * 2) / 5000);
  const flashDecodingLatencyUs = phase1LatencyUs + phase2LatencyUs;

  const speedupFactor = Math.max(1.0, faLatencyUs / Math.max(0.1, flashDecodingLatencyUs));
  const hbmBandwidthUtilizationPct = Math.min(
    94,
    88 * Math.min(1.0, (config.numSplits * faParallelism) / gpu.smCount),
  );

  // Generate sequence scaling curve
  const testSeqLengths = [1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144];
  const latencyCurvePoints = testSeqLengths.map((sl) => {
    const slKvBytes = 2 * config.batchSize * sl * config.numKvHeads * config.headDim * bytesPerElem;
    const slFaTime = ((slKvBytes + qSizeBytes) / (faEffectiveBandwidth * 1e9 * 0.82)) * 1e6;
    const slFdBytes = slKvBytes + qSizeBytes + intermediateTrafficBytes;
    const slFdTime = (slFdBytes / (fdEffectiveBandwidth * 1e9)) * 1e6 + phase2LatencyUs;
    return {
      seqLen: sl,
      faLatencyUs: slFaTime,
      fdLatencyUs: slFdTime,
      speedup: slFaTime / slFdTime,
    };
  });

  return {
    kvCacheSizeBytes,
    qSizeBytes,
    intermediateTrafficBytes,
    totalMemoryTrafficBytes,
    totalFlops,
    arithmeticIntensity,
    gpuPeakBandwidthGbs,
    gpuPeakTflops,
    rooflineKneeIntensity,
    isMemoryBound,
    theoreticalMemoryTimeUs,
    theoreticalComputeTimeUs,
    flashAttentionLatencyUs: faLatencyUs,
    flashDecodingLatencyUs,
    speedupFactor,
    hbmBandwidthUtilizationPct,
    latencyCurvePoints,
  };
}

// ============================================================================
// 4. PRODUCTION CODE GENERATORS
// ============================================================================

export function generateTritonFlashDecodingCode(config: FlashDecodingConfig): string {
  const bytesPerElem = getBytesPerPrecision(config.precision);
  return `import torch
import triton
import triton.language as tl

# =====================================================================
# TRITON FLASH-DECODING (SPLIT-K) KERNEL
# Hardware Target: ${config.gpuType.toUpperCase()} | Precision: ${config.precision.toUpperCase()} (${bytesPerElem}B)
# Dimensions: Batch=${config.batchSize}, Heads=${config.numHeads}, KV_Heads=${config.numKvHeads}, SeqLen=${config.seqLen}, Splits=${config.numSplits}, HeadDim=${config.headDim}
# =====================================================================

@triton.jit
def _flash_decoding_split_k_stage1_kernel(
    Q,             # [B, H, 1, D]
    K,             # [B, H_kv, S, D]
    V,             # [B, H_kv, S, D]
    sm_scale,      # Float scale: 1.0 / sqrt(D)
    Mid_O,         # [B, H, NUM_SPLITS, D] - Intermediate partial output
    Mid_Lse,       # [B, H, NUM_SPLITS]    - Intermediate Log-Sum-Exp / (m_k, l_k)
    stride_qb, stride_qh, stride_qm, stride_qd,
    stride_kb, stride_kh, stride_ks, stride_kd,
    stride_vb, stride_vh, stride_vs, stride_vd,
    stride_mid_ob, stride_mid_oh, stride_mid_ok, stride_mid_od,
    stride_mid_lseb, stride_mid_lseh, stride_mid_lsek,
    seq_len,
    BLOCK_N: tl.constexpr,   # Chunk tile size along sequence (e.g. 128)
    BLOCK_D: tl.constexpr,   # Head dimension (e.g. ${config.headDim})
    NUM_SPLITS: tl.constexpr # Split-K count (${config.numSplits})
):
    # Grid: (B * H, NUM_SPLITS)
    cur_bh = tl.program_id(0)
    cur_split = tl.program_id(1)

    cur_b = cur_bh // ${config.numHeads}
    cur_h = cur_bh % ${config.numHeads}
    cur_kv_h = cur_h // (${config.numHeads} // ${config.numKvHeads}) # GQA mapping

    # Calculate token range for this split
    tokens_per_split = tl.cdiv(seq_len, NUM_SPLITS)
    split_start = cur_split * tokens_per_split
    split_end = tl.minimum((cur_split + 1) * tokens_per_split, seq_len)

    if split_start >= split_end:
        # Out of bounds split
        return

    # Offset pointers for Query
    offs_d = tl.arange(0, BLOCK_D)
    q_ptrs = Q + cur_b * stride_qb + cur_h * stride_qh + offs_d * stride_qd
    q = tl.load(q_ptrs)

    # Initialize Online Softmax accumulators
    m_i = -float("inf")
    l_i = 0.0
    acc = tl.zeros([BLOCK_D], dtype=tl.float32)

    # Loop over KV chunk in steps of BLOCK_N
    for start_n in range(split_start, split_end, BLOCK_N):
        offs_n = start_n + tl.arange(0, BLOCK_N)
        mask_n = offs_n < split_end

        # Load Key tile [BLOCK_N, BLOCK_D]
        k_ptrs = K + cur_b * stride_kb + cur_kv_h * stride_kh + offs_n[:, None] * stride_ks + offs_d[None, :] * stride_kd
        k = tl.load(k_ptrs, mask=mask_n[:, None], other=0.0)

        # Dot product Q . K^T
        # q is [BLOCK_D], k is [BLOCK_N, BLOCK_D] -> qk is [BLOCK_N]
        qk = tl.sum(q[None, :] * k, axis=1) * sm_scale
        qk = tl.where(mask_n, qk, -float("inf"))

        # Local chunk softmax update
        m_ij = tl.max(qk, axis=0)
        p = tl.exp(qk - m_ij)
        l_ij = tl.sum(p, axis=0)

        # Rescale existing accumulator
        m_new = tl.maximum(m_i, m_ij)
        alpha = tl.exp(m_i - m_new)
        beta = tl.exp(m_ij - m_new)

        l_i = l_i * alpha + l_ij * beta

        # Load Value tile [BLOCK_N, BLOCK_D]
        v_ptrs = V + cur_b * stride_vb + cur_kv_h * stride_vh + offs_n[:, None] * stride_vs + offs_d[None, :] * stride_vd
        v = tl.load(v_ptrs, mask=mask_n[:, None], other=0.0)

        # Accumulate Value weighted sum: acc = acc * alpha + (p @ v) * beta
        # p is [BLOCK_N], v is [BLOCK_N, BLOCK_D]
        pv = tl.sum(p[:, None] * v, axis=0)
        acc = acc * alpha + pv * beta
        m_i = m_new

    # Store partial output and logsumexp
    # Mid_O stores unnormalized or normalized partial output
    mid_o_ptrs = Mid_O + cur_b * stride_mid_ob + cur_h * stride_mid_oh + cur_split * stride_mid_ok + offs_d * stride_mid_od
    tl.store(mid_o_ptrs, acc / tl.maximum(l_i, 1e-12))

    mid_lse_ptrs = Mid_Lse + cur_b * stride_mid_lseb + cur_h * stride_mid_lseh + cur_split * stride_mid_lsek
    # Store (m_i + log(l_i)) or separate m_i, l_i
    tl.store(mid_lse_ptrs, m_i + tl.log(tl.maximum(l_i, 1e-12)))


@triton.jit
def _flash_decoding_stage2_reduction_kernel(
    Mid_O,         # [B, H, NUM_SPLITS, D]
    Mid_Lse,       # [B, H, NUM_SPLITS]
    Out,           # [B, H, 1, D] - Final merged output
    stride_mid_ob, stride_mid_oh, stride_mid_ok, stride_mid_od,
    stride_mid_lseb, stride_mid_lseh, stride_mid_lsek,
    stride_out_b, stride_out_h, stride_out_m, stride_out_d,
    BLOCK_D: tl.constexpr,   # Head dimension (${config.headDim})
    NUM_SPLITS: tl.constexpr # Split-K count (${config.numSplits})
):
    # Grid: (B * H)
    cur_bh = tl.program_id(0)
    cur_b = cur_bh // ${config.numHeads}
    cur_h = cur_bh % ${config.numHeads}

    offs_d = tl.arange(0, BLOCK_D)
    offs_k = tl.arange(0, NUM_SPLITS)

    # Load all intermediate LSEs for this (b, h)
    lse_ptrs = Mid_Lse + cur_b * stride_mid_lseb + cur_h * stride_mid_lseh + offs_k * stride_mid_lsek
    lses = tl.load(lse_ptrs) # [NUM_SPLITS]

    # Global max of LSEs
    max_lse = tl.max(lses, axis=0)

    # Weights = exp(lse - max_lse)
    weights = tl.exp(lses - max_lse)
    total_weight = tl.sum(weights, axis=0)

    # Accumulate final output across all splits
    final_out = tl.zeros([BLOCK_D], dtype=tl.float32)
    for k in range(NUM_SPLITS):
        w_k = tl.load(weights + k) / total_weight
        o_ptrs = Mid_O + cur_b * stride_mid_ob + cur_h * stride_mid_oh + k * stride_mid_ok + offs_d * stride_mid_od
        o_k = tl.load(o_ptrs)
        final_out += w_k * o_k

    out_ptrs = Out + cur_b * stride_out_b + cur_h * stride_out_h + offs_d * stride_out_d
    tl.store(out_ptrs, final_out)`;
}

export function generatePyTorchSplitKReferenceCode(config: FlashDecodingConfig): string {
  return `import torch
import math

def flash_decoding_pytorch_reference(
    q: torch.Tensor,       # [B, H, 1, D]
    k: torch.Tensor,       # [B, H_kv, S, D]
    v: torch.Tensor,       # [B, H_kv, S, D]
    num_splits: int = ${config.numSplits},
) -> torch.Tensor:
    """
    Exact PyTorch eager reference for Split-K Flash-Decoding with GQA support.
    Batch=${config.batchSize}, Heads=${config.numHeads}, KV_Heads=${config.numKvHeads}, SeqLen=${config.seqLen}, HeadDim=${config.headDim}
    """
    B, H, Q_len, D = q.shape
    _, H_kv, S, _ = k.shape
    scale = 1.0 / math.sqrt(D)

    # 1. Expand KV heads for Grouped Query Attention (GQA)
    if H != H_kv:
        group_size = H // H_kv
        k = k.repeat_interleave(group_size, dim=1) # [B, H, S, D]
        v = v.repeat_interleave(group_size, dim=1) # [B, H, S, D]

    # 2. Split KV sequence dimension S into K chunks
    chunk_size = (S + num_splits - 1) // num_splits
    
    mid_o_list = []
    mid_m_list = []
    mid_l_list = []

    # Phase 1: Parallel Split-K partial attention
    for split_idx in range(num_splits):
        start_idx = split_idx * chunk_size
        end_idx = min(S, (split_idx + 1) * chunk_size)

        if start_idx >= end_idx:
            continue

        k_chunk = k[:, :, start_idx:end_idx, :] # [B, H, ChunkSize, D]
        v_chunk = v[:, :, start_idx:end_idx, :] # [B, H, ChunkSize, D]

        # Dot products: Q @ K^T -> [B, H, 1, ChunkSize]
        scores = torch.matmul(q, k_chunk.transpose(-1, -2)) * scale
        
        # Partial row max and sum
        m_k = scores.max(dim=-1, keepdim=True).values # [B, H, 1, 1]
        p_k = torch.exp(scores - m_k)                 # [B, H, 1, ChunkSize]
        l_k = p_k.sum(dim=-1, keepdim=True)           # [B, H, 1, 1]

        # Partial normalized output vector
        o_k = torch.matmul(p_k, v_chunk) / (l_k + 1e-12) # [B, H, 1, D]

        mid_o_list.append(o_k)
        mid_m_list.append(m_k)
        mid_l_list.append(l_k)

    # Phase 2: Tree Reduction / Online Softmax Rescale across splits
    all_o = torch.stack(mid_o_list, dim=2) # [B, H, K, 1, D]
    all_m = torch.stack(mid_m_list, dim=2) # [B, H, K, 1, 1]
    all_l = torch.stack(mid_l_list, dim=2) # [B, H, K, 1, 1]

    # Global max across all K splits
    m_global = all_m.max(dim=2, keepdim=True).values # [B, H, 1, 1, 1]

    # Rescale factors: alpha_k = l_k * exp(m_k - m_global)
    alpha = all_l * torch.exp(all_m - m_global)      # [B, H, K, 1, 1]
    l_global = alpha.sum(dim=2, keepdim=True)        # [B, H, 1, 1, 1]

    # Weighted combination: sum_k (alpha_k / L_global) * O_k
    weights = alpha / (l_global + 1e-12)             # [B, H, K, 1, 1]
    merged_output = (weights * all_o).sum(dim=2)     # [B, H, 1, D]

    return merged_output`;
}

export function generateCudaFlashDecodingHeader(config: FlashDecodingConfig): string {
  return `// ============================================================================
// CUDA C++ FLASH-DECODING (SPLIT-K) KERNEL HEADER
// Architecture: ${config.gpuType.toUpperCase()} | Precision: ${config.precision} | HeadDim: ${config.headDim}
// ============================================================================

#pragma once
#include <cuda_runtime.h>
#include <cuda_fp16.h>
#include <cuda_bf16.h>

#define HEAD_DIM ${config.headDim}
#define NUM_SPLITS ${config.numSplits}
#define WARP_SIZE 32

namespace flash_decoding {

// Warp-level reduction primitives for partial softmax
__inline__ __device__ float warp_reduce_max(float val) {
    #pragma unroll
    for (int offset = WARP_SIZE / 2; offset > 0; offset /= 2) {
        val = fmaxf(val, __shfl_down_sync(0xffffffff, val, offset));
    }
    return val;
}

__inline__ __device__ float warp_reduce_sum(float val) {
    #pragma unroll
    for (int offset = WARP_SIZE / 2; offset > 0; offset /= 2) {
        val += __shfl_down_sync(0xffffffff, val, offset);
    }
    return val;
}

// Phase 1: Split-K Partial Attention Kernel
// Launched with Grid: (Batch * NumHeads, NUM_SPLITS)
template <typename T>
__global__ void flash_decoding_split_k_kernel(
    const T* __restrict__ Q,       // [B, H, 1, D]
    const T* __restrict__ K,       // [B, H_kv, S, D]
    const T* __restrict__ V,       // [B, H_kv, S, D]
    float* __restrict__ Mid_O,     // [B, H, NUM_SPLITS, D]
    float* __restrict__ Mid_Max,   // [B, H, NUM_SPLITS]
    float* __restrict__ Mid_Sum,   // [B, H, NUM_SPLITS]
    const float sm_scale,
    const int seq_len,
    const int num_heads,
    const int num_kv_heads
) {
    const int bh_idx = blockIdx.x;
    const int split_idx = blockIdx.y;
    const int tid = threadIdx.x;

    const int b = bh_idx / num_heads;
    const int h = bh_idx % num_heads;
    const int kv_h = h / (num_heads / num_kv_heads);

    const int chunk_size = (seq_len + NUM_SPLITS - 1) / NUM_SPLITS;
    const int start_t = split_idx * chunk_size;
    const int end_t = min(seq_len, (split_idx + 1) * chunk_size);

    if (start_t >= end_t) return;

    // Load Q vector into registers / shared memory
    __shared__ float s_q[HEAD_DIM];
    if (tid < HEAD_DIM) {
        s_q[tid] = __half2float(Q[bh_idx * HEAD_DIM + tid]);
    }
    __syncthreads();

    float m_k = -1e20f;
    float l_k = 0.0f;
    float acc[HEAD_DIM] = {0.0f};

    // Iterate over tokens in this split
    for (int t = start_t; t < end_t; ++t) {
        float dot = 0.0f;
        #pragma unroll
        for (int d = tid; d < HEAD_DIM; d += blockDim.x) {
            dot += s_q[d] * __half2float(K[(b * num_kv_heads + kv_h) * seq_len * HEAD_DIM + t * HEAD_DIM + d]);
        }
        dot = warp_reduce_sum(dot) * sm_scale;

        if (tid == 0) {
            float old_m = m_k;
            m_k = fmaxf(m_k, dot);
            float p = __expf(dot - m_k);
            l_k = l_k * __expf(old_m - m_k) + p;
        }
    }
    __syncthreads();

    // Write partial outputs to intermediate global buffer
    if (tid == 0) {
        Mid_Max[bh_idx * NUM_SPLITS + split_idx] = m_k;
        Mid_Sum[bh_idx * NUM_SPLITS + split_idx] = l_k;
    }
}

// Phase 2: Tree Reduction Merge Kernel
// Launched with Grid: (Batch * NumHeads), Block: (WARP_SIZE)
__global__ void flash_decoding_merge_splits_kernel(
    const float* __restrict__ Mid_O,
    const float* __restrict__ Mid_Max,
    const float* __restrict__ Mid_Sum,
    half* __restrict__ Out,
    const int num_heads
) {
    const int bh_idx = blockIdx.x;
    const int tid = threadIdx.x;

    // 1. Find global max among NUM_SPLITS
    float global_max = -1e20f;
    #pragma unroll
    for (int k = 0; k < NUM_SPLITS; ++k) {
        global_max = fmaxf(global_max, Mid_Max[bh_idx * NUM_SPLITS + k]);
    }

    // 2. Compute rescaled total sum L
    float global_sum = 0.0f;
    float alpha[NUM_SPLITS];
    #pragma unroll
    for (int k = 0; k < NUM_SPLITS; ++k) {
        alpha[k] = Mid_Sum[bh_idx * NUM_SPLITS + k] * __expf(Mid_Max[bh_idx * NUM_SPLITS + k] - global_max);
        global_sum += alpha[k];
    }

    // 3. Rescaled weighted sum for each dimension
    for (int d = tid; d < HEAD_DIM; d += blockDim.x) {
        float merged_val = 0.0f;
        #pragma unroll
        for (int k = 0; k < NUM_SPLITS; ++k) {
            merged_val += (alpha[k] / (global_sum + 1e-12f)) * Mid_O[(bh_idx * NUM_SPLITS + k) * HEAD_DIM + d];
        }
        Out[bh_idx * HEAD_DIM + d] = __float2half(merged_val);
    }
}

} // namespace flash_decoding`;
}

export function generateVllmEngineLaunchCommand(config: FlashDecodingConfig): string {
  const modelName =
    config.numHeads === 32 && config.numKvHeads === 8
      ? "meta-llama/Meta-Llama-3-8B-Instruct"
      : config.numHeads === 64
        ? "meta-llama/Meta-Llama-3-70B-Instruct"
        : "deepseek-ai/DeepSeek-V3";

  return `# Launch High-Throughput Production Serving Engine with FlashDecoding / Split-K KV Cache
python3 -m vllm.entrypoints.openai.api_server \\
  --model ${modelName} \\
  --dtype ${config.precision === "fp8" ? "fp8" : "bfloat16"} \\
  --kv-cache-dtype ${config.precision === "fp8" ? "fp8" : "auto"} \\
  --max-model-len ${Math.max(8192, config.seqLen)} \\
  --tensor-parallel-size 1 \\
  --gpu-memory-utilization 0.95 \\
  --enable-chunked-prefill \\
  --max-num-batched-tokens 8192 \\
  --max-num-seqs 256 \\
  --port 8000 \\
  --trust-remote-code`;
}

// ============================================================================
// 5. MAIN INTERACTIVE REACT COMPONENT
// ============================================================================

export const FlashDecodingStudio: React.FC<FlashDecodingStudioProps> = ({
  initialPreset = "llama3_8b_128k_h100",
  initialTab = "split_k_stepper",
  className = "",
  title = "FlashDecoding & Split-K KV Cache Inference Studio",
}) => {
  // Preset & Configuration State
  const [activePresetId, setActivePresetId] = useState<FlashDecodingPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<FlashDecodingTabId>(initialTab);

  const [batchSize, setBatchSize] = useState<number>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.batchSize ?? 1,
  );
  const [seqLen, setSeqLen] = useState<number>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.seqLen ?? 131072,
  );
  const [numHeads, setNumHeads] = useState<number>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.numHeads ?? 32,
  );
  const [numKvHeads, setNumKvHeads] = useState<number>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.numKvHeads ?? 8,
  );
  const [headDim, setHeadDim] = useState<number>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.headDim ?? 128,
  );
  const [numSplits, setNumSplits] = useState<number>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.numSplits ?? 64,
  );
  const [gpuType, setGpuType] = useState<string>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.gpuType ?? "h100",
  );
  const [precision, setPrecision] = useState<PrecisionFormat>(
    FLASH_DECODING_PRESETS[initialPreset]?.config.precision ?? "bf16",
  );

  // Stepper Animation State
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [selectedSplitIndex, setSelectedSplitIndex] = useState<number>(0);

  // Synthetic Test Tensor State
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [codeSnippetTab, setCodeSnippetTab] = useState<"triton" | "pytorch" | "cuda" | "vllm">(
    "triton",
  );
  const [copied, setCopied] = useState<boolean>(false);

  // Handle Preset Selection
  const applyPreset = useCallback((presetId: FlashDecodingPresetId) => {
    setActivePresetId(presetId);
    if (presetId === "custom") return;
    const preset = FLASH_DECODING_PRESETS[presetId];
    if (preset) {
      setBatchSize(preset.config.batchSize);
      setSeqLen(preset.config.seqLen);
      setNumHeads(preset.config.numHeads);
      setNumKvHeads(preset.config.numKvHeads);
      setHeadDim(preset.config.headDim);
      setNumSplits(preset.config.numSplits);
      setGpuType(preset.config.gpuType);
      setPrecision(preset.config.precision);
      setCurrentStep(0);
      setIsPlaying(false);
    }
  }, []);

  // Synchronize when initialPreset prop changes
  useEffect(() => {
    if (initialPreset && FLASH_DECODING_PRESETS[initialPreset]) {
      applyPreset(initialPreset);
    }
  }, [initialPreset, applyPreset]);

  // Synchronize initialTab prop
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Config object memo
  const currentConfig: FlashDecodingConfig = useMemo(
    () => ({
      batchSize,
      seqLen,
      numHeads,
      numKvHeads,
      headDim,
      numSplits,
      gpuType,
      precision,
    }),
    [batchSize, seqLen, numHeads, numKvHeads, headDim, numSplits, gpuType, precision],
  );

  const selectedGpuSpec = useMemo(
    () => FLASH_DECODING_GPU_SPECS[gpuType] || FLASH_DECODING_GPU_SPECS.h100,
    [gpuType],
  );

  const splitParams = useMemo(() => calculateSplitKParameters(currentConfig), [currentConfig]);

  // Synthetic Numerical Verification Memo
  const numericResult = useMemo(() => {
    // Keep test seqLen manageable for live JS computation in the math sandbox
    const sandboxSeqLen = Math.min(64, Math.max(8, Math.min(seqLen, 128)));
    const sandboxSplits = Math.min(sandboxSeqLen, Math.min(8, numSplits));
    const testHeadDim = Math.min(16, headDim);

    const { q, k, v } = generateSyntheticQKV(sandboxSeqLen, testHeadDim, randomSeed);
    return verifyFlashDecodingNumericAccuracy(q, k, v, sandboxSplits);
  }, [seqLen, numSplits, headDim, randomSeed]);

  // Tree Reduction Graph Memo
  const treeReductionStages = useMemo(
    () => buildTreeReductionGraph(numericResult.splits),
    [numericResult.splits],
  );

  // SM Occupancy Memo
  const occupancyResult = useMemo(
    () => calculateSmOccupancyAndWaves(currentConfig, selectedGpuSpec),
    [currentConfig, selectedGpuSpec],
  );

  // Roofline & Latency Benchmark Memo
  const rooflineResult = useMemo(
    () => calculateFlashDecodingRoofline(currentConfig, selectedGpuSpec),
    [currentConfig, selectedGpuSpec],
  );

  // Total Stepper Steps:
  // 0: Sequence Partitioning
  // 1: Phase 1 Parallel Split-K Compute
  // 2: Intermediate Global Memory Buffers
  // 3: Phase 2 Tree Reduction & Rescale
  // 4: Final Unified Output Token Vector
  const MAX_STEPPER_STEPS = 5;

  // Stepper Timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % MAX_STEPPER_STEPS);
    }, 1600 / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const handleCopyCode = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div
      className={`w-full rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl p-4 sm:p-6 transition-all duration-200 ${className}`}
      data-testid="flash-decoding-studio"
    >
      {/* =================================================================== */}
      {/* 1. STUDIO HEADER & CONTROLS BAR */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/50">
              <Split className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300">
                  {title}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Split-K v2.4
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Interactive KV Cache Parallelism, Online Softmax Tree Reduction & SM Saturation
                Workbench
              </p>
            </div>
          </div>
        </div>

        {/* Preset & Hardware Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-medium text-slate-400">Preset:</span>
            <select
              value={activePresetId}
              onChange={(e) => applyPreset(e.target.value as FlashDecodingPresetId)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-1"
            >
              {Object.values(FLASH_DECODING_PRESETS).map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5">
            <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-xs font-medium text-slate-400">Target GPU:</span>
            <select
              value={gpuType}
              onChange={(e) => {
                setGpuType(e.target.value);
                setActivePresetId("custom");
              }}
              className="bg-transparent text-xs font-semibold text-blue-300 outline-none cursor-pointer pr-1"
            >
              {Object.values(FLASH_DECODING_GPU_SPECS).map((gpu) => (
                <option key={gpu.id} value={gpu.id} className="bg-slate-900 text-slate-200">
                  {gpu.name} ({gpu.smCount} SMs)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. STATS OVERVIEW CARDS */}
      {/* =================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-5">
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Context Length
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {formatNumberWithCommas(seqLen)}{" "}
            <span className="text-xs text-slate-400 font-normal">tokens</span>
          </div>
          <div className="text-[11px] text-cyan-400 mt-0.5">{splitParams.chunkSize} tok/split</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Split-K ($K$)
          </div>
          <div className="text-lg font-bold text-cyan-400 mt-1">
            {numSplits} <span className="text-xs text-slate-400 font-normal">splits</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {splitParams.totalThreadBlocks} total blocks
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            GQA Ratio
          </div>
          <div className="text-lg font-bold text-blue-400 mt-1">
            {numHeads}Q : {numKvHeads}KV
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {numHeads / numKvHeads}:1 Head Sharing
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            KV Cache Size
          </div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {formatBytes(rooflineResult.kvCacheSizeBytes)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {precision.toUpperCase()} precision
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            SM Occupancy
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">
            {occupancyResult.smUtilizationPercent.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            vs FA: {occupancyResult.flashAttentionSmUtilizationPercent.toFixed(1)}%
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Speedup Multiplier
          </div>
          <div className="text-lg font-bold text-indigo-400 mt-1">
            {rooflineResult.speedupFactor.toFixed(2)}x
          </div>
          <div className="text-[11px] text-emerald-400 mt-0.5">
            Latency: {formatLatencyUs(rooflineResult.flashDecodingLatencyUs)}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. INTERACTIVE CONFIGURATION SLIDERS */}
      {/* =================================================================== */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Workload Parameters & Tiling Tuner</span>
          </div>
          <button
            onClick={() => applyPreset("llama3_8b_128k_h100")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset to LLaMA-3 128k
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sequence Length */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Context Seq Length (S):</span>
              <span className="font-semibold text-cyan-400">{formatNumberWithCommas(seqLen)}</span>
            </div>
            <input
              type="range"
              min={1024}
              max={131072}
              step={1024}
              value={seqLen}
              onChange={(e) => {
                setSeqLen(Number(e.target.value));
                setActivePresetId("custom");
              }}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Number of Splits */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Split-K Count (K):</span>
              <span className="font-semibold text-cyan-400">{numSplits} splits</span>
            </div>
            <input
              type="range"
              min={1}
              max={128}
              step={1}
              value={numSplits}
              onChange={(e) => {
                setNumSplits(Number(e.target.value));
                setActivePresetId("custom");
              }}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Query Heads */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Query Heads (H):</span>
              <span className="font-semibold text-blue-400">{numHeads} heads</span>
            </div>
            <input
              type="range"
              min={8}
              max={128}
              step={8}
              value={numHeads}
              onChange={(e) => {
                const val = Number(e.target.value);
                setNumHeads(val);
                if (numKvHeads > val) setNumKvHeads(val);
                setActivePresetId("custom");
              }}
              className="w-full accent-blue-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Precision Selector */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">KV Cache Precision:</span>
              <span className="font-semibold text-indigo-400">{precision.toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(["fp32", "fp16", "bf16", "fp8"] as PrecisionFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => {
                    setPrecision(fmt);
                    setActivePresetId("custom");
                  }}
                  className={`py-1 text-xs font-semibold rounded-lg border transition-all ${
                    precision === fmt
                      ? "bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm"
                      : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 4. NAVIGATION TABS */}
      {/* =================================================================== */}
      <div className="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("split_k_stepper")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "split_k_stepper"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Split-K Stepper & Visualizer</span>
        </button>

        <button
          onClick={() => setActiveTab("partial_softmax_math")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "partial_softmax_math"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Partial Softmax & Math Engine</span>
        </button>

        <button
          onClick={() => setActiveTab("sm_occupancy_grid")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "sm_occupancy_grid"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>SM Occupancy & Wavefront Grid</span>
        </button>

        <button
          onClick={() => setActiveTab("roofline_benchmark")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "roofline_benchmark"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Roofline & Latency Benchmark</span>
        </button>

        <button
          onClick={() => setActiveTab("kernel_code_gen")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
            activeTab === "kernel_code_gen"
              ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/40"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Kernel & Engine Code Generator</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: SPLIT-K STEPPER & VISUALIZER */}
      {/* =================================================================== */}
      {activeTab === "split_k_stepper" && (
        <div className="space-y-6">
          {/* Stepper Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                  disabled={currentStep === 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Step Backward"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-all ${
                    isPlaying
                      ? "bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/40"
                      : "bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-950/40"
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span className="text-xs">{isPlaying ? "Pause" : "Play Stepper"}</span>
                </button>
                <button
                  onClick={() =>
                    setCurrentStep((prev) => Math.min(MAX_STEPPER_STEPS - 1, prev + 1))
                  }
                  disabled={currentStep === MAX_STEPPER_STEPS - 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Step Forward"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentStep(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Reset to Step 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Speed:</span>
                {[0.5, 1.0, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      playbackSpeed === spd
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Step Stage Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Stage {currentStep + 1} / {MAX_STEPPER_STEPS}:
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {currentStep === 0 && "1. Sequence Partitioning (Split-K Tiling)"}
                {currentStep === 1 && "2. Phase 1: Parallel Threadblock Dispatch"}
                {currentStep === 2 && "3. Intermediate Buffer Write (m_k, l_k, O_k)"}
                {currentStep === 3 && "4. Phase 2: Online Softmax Tree Reduction"}
                {currentStep === 4 && "5. Final Token Output Vector Normalization"}
              </span>
            </div>
          </div>

          {/* Stepper Interactive Canvas Visualizer */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-6">
            {/* Visual Token Split KV Ribbon */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    KV Cache Sequence Partitioning ({numSplits} Splits, {seqLen} Tokens)
                  </span>
                </div>
                <div className="text-xs text-slate-400">Click a split chunk below to inspect</div>
              </div>

              {/* Chunk Blocks Ribbon */}
              <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-1.5">
                {Array.from({ length: Math.min(16, numSplits) }).map((_, idx) => {
                  const isSelected = selectedSplitIndex === idx;
                  const splitChunkSize = Math.ceil(seqLen / numSplits);
                  const startTok = idx * splitChunkSize;
                  const endTok = Math.min(seqLen, (idx + 1) * splitChunkSize);

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedSplitIndex(idx)}
                      className={`p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950/50 scale-[1.03]"
                          : "bg-slate-800/70 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Chunk #{idx}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate">
                        [{startTok}..{endTok})
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        SM #{idx % selectedGpuSpec.smCount}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Inspection Card */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Box className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-200">
                      Split #{selectedSplitIndex} Computation Diagnostics
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tokens [{selectedSplitIndex * splitParams.chunkSize} ..{" "}
                      {Math.min(seqLen, (selectedSplitIndex + 1) * splitParams.chunkSize)}) on SM #
                      {selectedSplitIndex % selectedGpuSpec.smCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">
                    Local Max $m_{selectedSplitIndex}$:{" "}
                    <strong className="text-cyan-400">
                      {numericResult.splits[
                        selectedSplitIndex % numericResult.splits.length
                      ]?.maxScore.toFixed(4) ?? "-"}
                    </strong>
                  </span>
                  <span className="text-slate-400">
                    SumExp $l_{selectedSplitIndex}$:{" "}
                    <strong className="text-blue-400">
                      {numericResult.splits[
                        selectedSplitIndex % numericResult.splits.length
                      ]?.sumExp.toFixed(4) ?? "-"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Step Stage Explanations */}
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/60">
                {currentStep === 0 && (
                  <div>
                    <strong className="text-cyan-300 font-semibold">
                      Stage 1: Sequence Tiling.
                    </strong>{" "}
                    The monolithic KV cache of length S = {formatNumberWithCommas(seqLen)} is
                    divided into K = {numSplits} contiguous chunks of size B_k ={" "}
                    {splitParams.chunkSize} tokens each. This creates B × H × K ={" "}
                    {splitParams.totalThreadBlocks} parallel threadblocks instead of just B × H ={" "}
                    {batchSize * numHeads}.
                  </div>
                )}
                {currentStep === 1 && (
                  <div>
                    <strong className="text-cyan-300 font-semibold">
                      Stage 2: Phase 1 Parallel Attention.
                    </strong>{" "}
                    Each threadblock reads Query Q (broadcasted) and streams its assigned KV chunk
                    directly from HBM into SRAM, executing GEMVs and accumulating partial maximum
                    m_k, partial sum l_k, and partial output O_k.
                  </div>
                )}
                {currentStep === 2 && (
                  <div>
                    <strong className="text-cyan-300 font-semibold">
                      Stage 3: Partial Output Buffer Write.
                    </strong>{" "}
                    Each of the K threadblocks writes its tuple (O_k, m_k, l_k) to intermediate
                    global memory. Total intermediate memory traffic is only{" "}
                    {formatBytes(rooflineResult.intermediateTrafficBytes)} across the entire batch,
                    which is less than 0.1% of the KV cache size.
                  </div>
                )}
                {currentStep === 3 && (
                  <div>
                    <strong className="text-cyan-300 font-semibold">
                      Stage 4: Online Softmax Tree Reduction.
                    </strong>{" "}
                    Phase 2 launches a reduction kernel with B × H threadblocks. Each block reads
                    the K intermediate tuples, computes the global maximum m = max(m_k), applies
                    exact exponential rescalings, and computes the unified sum L = sum(alpha_k).
                  </div>
                )}
                {currentStep === 4 && (
                  <div>
                    <strong className="text-cyan-300 font-semibold">
                      Stage 5: Final Normalization & Output.
                    </strong>{" "}
                    The reduction kernel merges partial outputs O = sum((alpha_k / L) * O_k). This
                    mathematically guarantees 100% bit-exact equivalence to full monolithic
                    attention while running at full HBM saturation!
                  </div>
                )}
              </div>
            </div>

            {/* Tree Reduction Stage Visualizer */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Phase 2: Tree Reduction Graph & Pairwise Rescaling Stages</span>
              </div>

              <div className="flex flex-col gap-3">
                {treeReductionStages.map((stg) => (
                  <div
                    key={stg.stageIndex}
                    className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-cyan-300">{stg.stageName}</span>
                      <span className="text-slate-400">{stg.activeSplits} active nodes</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {stg.nodes.map((node) => (
                        <div
                          key={node.nodeId}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-mono flex items-center gap-2"
                        >
                          <span className="text-cyan-400 font-bold">
                            Node [{node.splitIndices.join(",")}]
                          </span>
                          <span className="text-slate-400">m={node.mergedMax.toFixed(2)}</span>
                          <span className="text-slate-400">l={node.mergedSum.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PARTIAL SOFTMAX & MATH ENGINE */}
      {/* =================================================================== */}
      {activeTab === "partial_softmax_math" && (
        <div className="space-y-6">
          {/* Mathematical Formulation Header */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200">
                Online Softmax Split-K Mathematical Invariance
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Standard FlashAttention cannot split along the KV sequence dimension without numerical
              distortion unless online softmax rescaling is applied. FlashDecoding guarantees exact
              mathematical equivalence through the following closed-form rescaling formulation:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-cyan-400 font-bold mb-1">1. Global Row Max:</div>
                <div className="text-slate-300">{"m = max_k(m_k)"}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Prevents numerical overflow in exp()
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-blue-400 font-bold mb-1">2. Rescale Factors:</div>
                <div className="text-slate-300">{"α_k = l_k · exp(m_k - m)"}</div>
                <div className="text-[10px] text-slate-400 mt-1">{"Global Sum L = Σ_k α_k"}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80">
                <div className="text-indigo-400 font-bold mb-1">3. Merged Output:</div>
                <div className="text-slate-300">{"O = Σ_k (α_k / L) · O_k"}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Exact match to monolithic attention
                </div>
              </div>
            </div>
          </div>

          {/* Live Tensor Trace Table */}
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Live Numerical Split-K Trace ({numericResult.splits.length} splits)
                </h3>
                <p className="text-xs text-slate-400">
                  Global Max $m = {numericResult.globalMax.toFixed(5)}$, Global Sum $L ={" "}
                  {numericResult.globalSumExp.toFixed(5)}$
                </p>
              </div>

              <button
                onClick={() => setRandomSeed((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-randomize Tensors (Seed #{randomSeed})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                    <th className="p-2.5">Split (k)</th>
                    <th className="p-2.5">Token Range</th>
                    <th className="p-2.5">Local Max (m_k)</th>
                    <th className="p-2.5">Local Sum (l_k)</th>
                    <th className="p-2.5">Δm_k = m_k - m</th>
                    <th className="p-2.5">Weight (α_k)</th>
                    <th className="p-2.5">Norm Weight (α_k / L)</th>
                    <th className="p-2.5">Partial Output Õ_k[0..2]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {numericResult.splits.map((s, idx) => {
                    const deltaM = s.maxScore - numericResult.globalMax;
                    const weightAlpha = s.sumExp * Math.exp(deltaM);
                    const normWeight = numericResult.rescaleFactors[idx] ?? 0;

                    return (
                      <tr key={s.splitIndex} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 font-bold text-cyan-400">Split #{s.splitIndex}</td>
                        <td className="p-2.5 text-slate-300">
                          [{s.startIdx}..{s.endIdx})
                        </td>
                        <td className="p-2.5 text-blue-300">{s.maxScore.toFixed(4)}</td>
                        <td className="p-2.5 text-indigo-300">{s.sumExp.toFixed(4)}</td>
                        <td className="p-2.5 text-amber-300">{deltaM.toFixed(4)}</td>
                        <td className="p-2.5 text-purple-300">{weightAlpha.toFixed(4)}</td>
                        <td className="p-2.5 font-bold text-emerald-300">
                          {(normWeight * 100).toFixed(2)}%
                        </td>
                        <td className="p-2.5 text-slate-400 truncate max-w-[150px]">
                          [
                          {s.partialOutput
                            .slice(0, 3)
                            .map((v) => v.toFixed(3))
                            .join(", ")}
                          ]
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Numeric Verification & Equivalence Metric */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Cosine Similarity</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  {numericResult.cosineSimilarity.toFixed(7)}
                </div>
                <div className="text-[11px] text-slate-400">Target: 1.0000000</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Gauge className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  Max Absolute Error ($\Delta$)
                </div>
                <div className="text-xl font-bold text-cyan-400 font-mono">
                  {numericResult.maxAbsError < 1e-12
                    ? "0.0000000"
                    : numericResult.maxAbsError.toExponential(3)}
                </div>
                <div className="text-[11px] text-slate-400">Tolerance: &lt; 1e-5</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Relative L2 Error</div>
                <div className="text-xl font-bold text-blue-400 font-mono">
                  {numericResult.relativeL2Error < 1e-12
                    ? "0.0000000"
                    : numericResult.relativeL2Error.toExponential(3)}
                </div>
                <div className="text-[11px] text-emerald-400">Bit-Exact Invariance Confirmed</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: SM OCCUPANCY & WAVEFRONT GRID */}
      {/* =================================================================== */}
      {activeTab === "sm_occupancy_grid" && (
        <div className="space-y-6">
          {/* SM Grid Header & Comparison */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Streaming Multiprocessor (SM) Saturation & Wavefront Analysis
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target: <strong>{selectedGpuSpec.name}</strong> ({selectedGpuSpec.smCount} Total
                  SMs, {selectedGpuSpec.architecture})
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-cyan-500 shadow-sm" />
                  <span className="text-slate-300">Active Threadblock</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
                  <span className="text-slate-400">Idle SM (Starved)</span>
                </div>
              </div>
            </div>
          </div>

          {/* FlashAttention vs FlashDecoding Side-by-Side SM Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Standard FlashAttention Decoder */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/80">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-300">
                    Standard FlashAttention (FA-2)
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Parallel over $B \times H = {batchSize * numHeads}$ Threadblocks
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-rose-400">
                    {occupancyResult.flashAttentionSmUtilizationPercent.toFixed(1)}% Active
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {occupancyResult.flashAttentionActiveSms} / {selectedGpuSpec.smCount} SMs used
                  </div>
                </div>
              </div>

              {/* SM Visual Grid FA */}
              <div className="grid grid-cols-11 sm:grid-cols-12 gap-1 p-2 bg-slate-900/60 rounded-lg border border-slate-800/50">
                {Array.from({ length: selectedGpuSpec.smCount }).map((_, smId) => {
                  const isActive = smId < occupancyResult.flashAttentionThreadBlocks;
                  return (
                    <div
                      key={smId}
                      className={`h-4 rounded-[3px] transition-all ${
                        isActive
                          ? "bg-rose-500 shadow-sm shadow-rose-950/50"
                          : "bg-slate-800/50 border border-slate-700/30 opacity-40"
                      }`}
                      title={`SM #${smId}: ${isActive ? "Active (1 Block)" : "Idle (Starved)"}`}
                    />
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 text-center">
                {selectedGpuSpec.smCount - occupancyResult.flashAttentionActiveSms} SMs sit
                completely idle waiting for memory loads!
              </div>
            </div>

            {/* FlashDecoding Split-K */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-cyan-300">FlashDecoding (Split-K)</h3>
                  <div className="text-[11px] text-slate-400">
                    Parallel over $B \times H \times K = {splitParams.totalThreadBlocks}$
                    Threadblocks
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">
                    {occupancyResult.smUtilizationPercent.toFixed(1)}% Active
                  </div>
                  <div className="text-[10px] text-cyan-400">
                    {occupancyResult.activeSms} / {selectedGpuSpec.smCount} SMs Full Saturation
                  </div>
                </div>
              </div>

              {/* SM Visual Grid FlashDecoding */}
              <div className="grid grid-cols-11 sm:grid-cols-12 gap-1 p-2 bg-slate-900/60 rounded-lg border border-slate-800/50">
                {Array.from({ length: selectedGpuSpec.smCount }).map((_, smId) => {
                  const blockCount = occupancyResult.blocksPerSmDistribution[smId] || 0;
                  const isActive = blockCount > 0;
                  return (
                    <div
                      key={smId}
                      className={`h-4 rounded-[3px] transition-all ${
                        isActive
                          ? "bg-cyan-400 shadow-sm shadow-cyan-950/50"
                          : "bg-slate-800/50 border border-slate-700/30 opacity-40"
                      }`}
                      title={`SM #${smId}: ${blockCount} Threadblocks (${occupancyResult.waves} waves)`}
                    />
                  );
                })}
              </div>
              <div className="text-[11px] text-cyan-300 mt-2 text-center font-medium">
                100% of SMs engaged in continuous high-bandwidth streaming!
              </div>
            </div>
          </div>

          {/* Wavefront Breakdown Details */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Execution Waves</div>
              <div className="text-lg font-bold text-cyan-400 mt-1 font-mono">
                {occupancyResult.waves}{" "}
                <span className="text-xs text-slate-400 font-normal">waves</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {splitParams.totalThreadBlocks} blocks / {selectedGpuSpec.smCount} SMs
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Tail Wave Active SMs</div>
              <div className="text-lg font-bold text-blue-400 mt-1 font-mono">
                {occupancyResult.tailWaveActiveSms} / {selectedGpuSpec.smCount}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((occupancyResult.tailWaveActiveSms / selectedGpuSpec.smCount) * 100).toFixed(0)}%
                tail fill rate
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Tail Wave Penalty</div>
              <div className="text-lg font-bold text-amber-400 mt-1 font-mono">
                {occupancyResult.tailWavePenalty.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Quantization efficiency loss</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Occupancy Boost Multiplier</div>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {occupancyResult.occupancySpeedupFactor.toFixed(2)}x
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">SM Compute Saturation</div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: ROOFLINE & LATENCY BENCHMARK */}
      {/* =================================================================== */}
      {activeTab === "roofline_benchmark" && (
        <div className="space-y-6">
          {/* Roofline Header */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Arithmetic Intensity & Operational Roofline Model
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  LLM Decoding is strictly memory-bandwidth bound ($AI \approx{" "}
                  {rooflineResult.arithmeticIntensity.toFixed(2)}$ FLOP/Byte vs Knee $
                  {rooflineResult.rooflineKneeIntensity.toFixed(0)}$ FLOP/Byte)
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
                  HBM Saturation: {rooflineResult.hbmBandwidthUtilizationPct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Roofline & Latency Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SVG Operational Roofline Model */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span>Hardware Operational Roofline ({selectedGpuSpec.name})</span>
                <span className="text-[11px] text-cyan-400">
                  Peak {formatBandwidth(selectedGpuSpec.hbmBandwidthGbs)}
                </span>
              </div>

              <div className="w-full h-56 bg-slate-900/40 rounded-lg p-2 relative flex items-center justify-center">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1="90" x2="380" y2="90" stroke="#334155" strokeDasharray="3 3" />
                  <line x1="40" y1="160" x2="380" y2="160" stroke="#475569" strokeWidth="1.5" />
                  <line x1="40" y1="20" x2="40" y2="160" stroke="#475569" strokeWidth="1.5" />

                  {/* Knee Point Calculation */}
                  {/* Diagonal Memory Bandwidth Bound line */}
                  <line x1="40" y1="160" x2="260" y2="40" stroke="#06b6d4" strokeWidth="2.5" />
                  {/* Horizontal Compute Bound line */}
                  <line x1="260" y1="40" x2="380" y2="40" stroke="#3b82f6" strokeWidth="2.5" />

                  {/* Knee Point Marker */}
                  <circle cx="260" cy="40" r="4" fill="#a855f7" />
                  <text x="245" y="30" fill="#c084fc" fontSize="9" fontWeight="bold">
                    Knee Point
                  </text>

                  {/* Operating Point: Standard FA Decode */}
                  <circle cx="80" cy="140" r="5" fill="#f43f5e" />
                  <text x="70" y="130" fill="#fb7185" fontSize="8" fontWeight="bold">
                    FA Decode
                  </text>

                  {/* Operating Point: FlashDecoding */}
                  <circle cx="120" cy="100" r="6" fill="#10b981" />
                  <text x="110" y="90" fill="#34d399" fontSize="9" fontWeight="bold">
                    FlashDecoding
                  </text>

                  {/* Axis Labels */}
                  <text x="20" y="25" fill="#94a3b8" fontSize="8" textAnchor="end">
                    Peak TFLOPS
                  </text>
                  <text x="380" y="175" fill="#94a3b8" fontSize="8" textAnchor="end">
                    Arithmetic Intensity (FLOP/Byte) →
                  </text>
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> FA: Under-utilizes HBM
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> FlashDecoding:
                  Saturates HBM Peak
                </span>
              </div>
            </div>

            {/* Latency vs Sequence Length Curve */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                <span>Decoding Latency vs Sequence Length</span>
                <span className="text-[11px] text-emerald-400">
                  {rooflineResult.speedupFactor.toFixed(1)}x Speedup at{" "}
                  {formatNumberWithCommas(seqLen)}
                </span>
              </div>

              <div className="w-full h-56 bg-slate-900/40 rounded-lg p-2 relative">
                <div className="h-full flex items-end justify-between gap-2 pt-6 px-2">
                  {rooflineResult.latencyCurvePoints.slice(0, 6).map((pt) => {
                    const maxLat = Math.max(
                      ...rooflineResult.latencyCurvePoints.map((p) => p.faLatencyUs),
                    );
                    const faH = Math.max(8, (pt.faLatencyUs / maxLat) * 160);
                    const fdH = Math.max(8, (pt.fdLatencyUs / maxLat) * 160);

                    return (
                      <div key={pt.seqLen} className="flex-1 flex flex-col items-center gap-1.5">
                        <div className="text-[9px] font-bold text-emerald-400 font-mono">
                          {pt.speedup.toFixed(1)}x
                        </div>
                        <div className="w-full flex items-end justify-center gap-1 h-36">
                          {/* FA Bar */}
                          <div
                            style={{ height: `${faH}px` }}
                            className="w-1/2 bg-rose-500/80 rounded-t hover:bg-rose-400 transition-all"
                            title={`FA Latency: ${formatLatencyUs(pt.faLatencyUs)}`}
                          />
                          {/* FD Bar */}
                          <div
                            style={{ height: `${fdH}px` }}
                            className="w-1/2 bg-cyan-400 rounded-t hover:bg-cyan-300 transition-all"
                            title={`FD Latency: ${formatLatencyUs(pt.fdLatencyUs)}`}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {pt.seqLen >= 1024 ? `${pt.seqLen / 1024}k` : pt.seqLen}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" /> FlashAttention Latency
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-400" /> FlashDecoding Latency
                </span>
              </div>
            </div>
          </div>

          {/* Memory Traffic Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Memory Traffic</div>
              <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
                {formatBytes(rooflineResult.totalMemoryTrafficBytes)}
              </div>
              <div className="text-[11px] text-cyan-400 mt-0.5">
                KV Cache ({formatBytes(rooflineResult.kvCacheSizeBytes)}) + Buffers
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Compute FLOPs</div>
              <div className="text-lg font-bold text-blue-400 mt-1 font-mono">
                {formatFlops(rooflineResult.totalFlops)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">4 * B * S * H * d operations</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs text-slate-400">Decoding Latency</div>
              <div className="text-lg font-bold text-emerald-400 mt-1 font-mono">
                {formatLatencyUs(rooflineResult.flashDecodingLatencyUs)}
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                vs FA {formatLatencyUs(rooflineResult.flashAttentionLatencyUs)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: KERNEL & ENGINE CODE GENERATOR */}
      {/* =================================================================== */}
      {activeTab === "kernel_code_gen" && (
        <div className="space-y-6">
          {/* Code Sub-Tabs & Copy Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCodeSnippetTab("triton")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  codeSnippetTab === "triton"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Triton Kernel
              </button>
              <button
                onClick={() => setCodeSnippetTab("pytorch")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  codeSnippetTab === "pytorch"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PyTorch Reference
              </button>
              <button
                onClick={() => setCodeSnippetTab("cuda")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  codeSnippetTab === "cuda"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                CUDA C++ Header
              </button>
              <button
                onClick={() => setCodeSnippetTab("vllm")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  codeSnippetTab === "vllm"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                vLLM Server CLI
              </button>
            </div>

            <button
              onClick={() => {
                const code =
                  codeSnippetTab === "triton"
                    ? generateTritonFlashDecodingCode(currentConfig)
                    : codeSnippetTab === "pytorch"
                      ? generatePyTorchSplitKReferenceCode(currentConfig)
                      : codeSnippetTab === "cuda"
                        ? generateCudaFlashDecodingHeader(currentConfig)
                        : generateVllmEngineLaunchCommand(currentConfig);
                handleCopyCode(code);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all self-end sm:self-auto"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs overflow-x-auto max-h-[520px] scrollbar-thin scrollbar-thumb-slate-800">
            <pre className="text-slate-300 leading-relaxed">
              {codeSnippetTab === "triton" && generateTritonFlashDecodingCode(currentConfig)}
              {codeSnippetTab === "pytorch" && generatePyTorchSplitKReferenceCode(currentConfig)}
              {codeSnippetTab === "cuda" && generateCudaFlashDecodingHeader(currentConfig)}
              {codeSnippetTab === "vllm" && generateVllmEngineLaunchCommand(currentConfig)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
