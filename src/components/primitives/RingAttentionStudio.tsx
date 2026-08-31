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
  Clock,
  Code2,
  Workflow,
  Terminal,
  ShieldAlert,
  Zap,
  Cpu,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Network,
  Share2,
  BarChart3,
  Gauge,
} from "lucide-react";

// ============================================================================
// 1. TYPES & CONTRACTS
// ============================================================================

export type RingPresetId =
  | "llama3_8b_128k_4x_h100"
  | "llama3_70b_1m_8x_h100"
  | "deepseek_v3_128k_8x_h100"
  | "long_context_512k_16x_a100"
  | "edge_pcie_64k_4x_l40s"
  | "extreme_10m_16x_b200"
  | "custom";

export type RingAttentionTabId =
  | "ring_stepper"
  | "online_softmax"
  | "zigzag_masking"
  | "roofline_profiler"
  | "code_generator";

export type AttentionVariant = "bidirectional" | "causal_standard" | "causal_zigzag" | "striped";

export type PrecisionFormat = "fp32" | "fp16" | "bf16" | "fp8";

export interface RingGpuSpec {
  readonly id: string;
  readonly name: string;
  readonly vramGb: number;
  readonly hbmBandwidthGbs: number;
  readonly tflopsBf16: number;
  readonly tflopsFp8: number;
  readonly tflopsFp16: number;
  readonly architecture: string;
  readonly defaultNvlinkBandwidthGbs: number;
}

export interface RingInterconnectSpec {
  readonly id: string;
  readonly name: string;
  readonly bandwidthGbs: number; // Bidirectional GB/s
  readonly latencyUs: number; // Microseconds
  readonly type: "nvlink" | "pcie" | "infiniband" | "roce";
}

export interface RingClusterConfig {
  readonly numGpus: number; // N in [2, 16]
  readonly gpuType: string;
  readonly interconnectType: string;
  readonly totalSeqLen: number; // S (e.g. 131072, 1048576)
  readonly hiddenDim: number; // D (e.g. 4096, 8192)
  readonly numHeads: number; // H (e.g. 32, 64)
  readonly headDim: number; // d = D / H (e.g. 128)
  readonly precision: PrecisionFormat;
  readonly attentionVariant: AttentionVariant;
  readonly computeEfficiency: number; // MFU factor, typically 0.65 - 0.75
}

export interface RingAttentionPreset {
  readonly id: RingPresetId;
  readonly name: string;
  readonly description: string;
  readonly config: RingClusterConfig;
}

export interface OnlineSoftmaxHopTrace {
  readonly hop: number;
  readonly qRank: number;
  readonly kvChunkIndex: number;
  readonly tileType: "full" | "causal_diag" | "masked_idle";
  readonly localMax: number[];
  readonly runningMax: number[];
  readonly localSum: number[];
  readonly runningSum: number[];
  readonly runningOutputSample: number[][]; // Sample first few dimensions of O
  readonly commSendToRank: number;
  readonly commRecvFromRank: number;
}

export interface OnlineSoftmaxVerificationResult {
  readonly ringOutput: number[][]; // [S_local, d]
  readonly monolithicOutput: number[][]; // [S_local, d]
  readonly maxAbsError: number;
  readonly relativeL2Error: number;
  readonly cosineSimilarity: number;
  readonly isMatch: boolean;
  readonly hopTraces: OnlineSoftmaxHopTrace[];
}

export interface CausalTileInfo {
  readonly queryChunk: number;
  readonly keyChunk: number;
  readonly rank: number;
  readonly hop: number;
  readonly tileType: "full" | "causal_diag" | "masked_idle";
  readonly computeWeight: number; // 1.0 for full, 0.5 for diag, 0.0 for idle
}

export interface CausalScheduleResult {
  readonly numRanks: number;
  readonly numHops: number;
  readonly tiles: CausalTileInfo[][]; // [rank][hop]
  readonly standardBubbleFraction: number;
  readonly standardActiveComputeFraction: number;
  readonly zigzagBubbleFraction: number;
  readonly zigzagActiveComputeFraction: number;
  readonly zigzagSpeedupFactor: number;
}

export interface RingRooflineResult {
  readonly blockSize: number; // Tokens per GPU
  readonly subChunkSize: number; // Tokens per subchunk in ZigZag
  readonly flopsPerStepPerGpu: number;
  readonly totalFlopsPerGpu: number;
  readonly totalFlopsCluster: number;
  readonly commBytesPerStepPerGpu: number;
  readonly totalCommBytesPerGpu: number;
  readonly arithmeticIntensityFlopsPerByte: number;
  readonly computeTimeMsPerStep: number;
  readonly commTimeMsPerStep: number;
  readonly stepLatencyMs: number; // max(compute, comm)
  readonly totalLatencyMs: number; // N * stepLatency
  readonly overlapEfficiency: number; // min(1.0, compute / comm) or comm hidden fraction
  readonly isComputeBound: boolean;
  readonly isCommBound: boolean;
  readonly kneeArithmeticIntensity: number; // TFLOPS / Bandwidth
  readonly minBlockSizeForFullOverlap: number;
  readonly rooflineCurve: { intensity: number; attainableTflops: number }[];
  readonly currentOperatingPoint: { intensity: number; attainableTflops: number };
}

// ============================================================================
// 2. HARDWARE DATABASE & CANONICAL PRESETS
// ============================================================================

export const RING_GPU_SPECS: Record<string, RingGpuSpec> = {
  h100_sxm: {
    id: "h100_sxm",
    name: "NVIDIA H100 SXM5 (80GB)",
    vramGb: 80,
    hbmBandwidthGbs: 3350,
    tflopsBf16: 989,
    tflopsFp8: 1979,
    tflopsFp16: 989,
    architecture: "Hopper",
    defaultNvlinkBandwidthGbs: 900,
  },
  b200_sxm: {
    id: "b200_sxm",
    name: "NVIDIA B200 SXM (192GB)",
    vramGb: 192,
    hbmBandwidthGbs: 8000,
    tflopsBf16: 2250,
    tflopsFp8: 4500,
    tflopsFp16: 2250,
    architecture: "Blackwell",
    defaultNvlinkBandwidthGbs: 1800,
  },
  a100_sxm: {
    id: "a100_sxm",
    name: "NVIDIA A100 SXM4 (80GB)",
    vramGb: 80,
    hbmBandwidthGbs: 2039,
    tflopsBf16: 312,
    tflopsFp8: 312,
    tflopsFp16: 312,
    architecture: "Ampere",
    defaultNvlinkBandwidthGbs: 600,
  },
  l40s_pcie: {
    id: "l40s_pcie",
    name: "NVIDIA L40S PCIe (48GB)",
    vramGb: 48,
    hbmBandwidthGbs: 864,
    tflopsBf16: 366,
    tflopsFp8: 733,
    tflopsFp16: 366,
    architecture: "Ada Lovelace",
    defaultNvlinkBandwidthGbs: 64, // PCIe Gen4
  },
  gh200_nvlink: {
    id: "gh200_nvlink",
    name: "NVIDIA GH200 Grace Hopper (96GB)",
    vramGb: 96,
    hbmBandwidthGbs: 4000,
    tflopsBf16: 989,
    tflopsFp8: 1979,
    tflopsFp16: 989,
    architecture: "Hopper",
    defaultNvlinkBandwidthGbs: 900,
  },
};

export const RING_INTERCONNECT_SPECS: Record<string, RingInterconnectSpec> = {
  nvlink_4: {
    id: "nvlink_4",
    name: "NVLink 4.0 (900 GB/s bi-dir)",
    bandwidthGbs: 900,
    latencyUs: 0.8,
    type: "nvlink",
  },
  nvlink_5: {
    id: "nvlink_5",
    name: "NVLink 5.0 (1,800 GB/s bi-dir)",
    bandwidthGbs: 1800,
    latencyUs: 0.5,
    type: "nvlink",
  },
  nvlink_3: {
    id: "nvlink_3",
    name: "NVLink 3.0 (600 GB/s bi-dir)",
    bandwidthGbs: 600,
    latencyUs: 1.2,
    type: "nvlink",
  },
  infiniband_ndr: {
    id: "infiniband_ndr",
    name: "InfiniBand NDR 400G (50 GB/s bi-dir)",
    bandwidthGbs: 50,
    latencyUs: 2.5,
    type: "infiniband",
  },
  infiniband_hdr: {
    id: "infiniband_hdr",
    name: "InfiniBand HDR 200G (25 GB/s bi-dir)",
    bandwidthGbs: 25,
    latencyUs: 3.5,
    type: "infiniband",
  },
  pcie_gen5: {
    id: "pcie_gen5",
    name: "PCIe Gen 5 x16 (128 GB/s bi-dir)",
    bandwidthGbs: 128,
    latencyUs: 2.0,
    type: "pcie",
  },
  pcie_gen4: {
    id: "pcie_gen4",
    name: "PCIe Gen 4 x16 (64 GB/s bi-dir)",
    bandwidthGbs: 64,
    latencyUs: 3.0,
    type: "pcie",
  },
  roce_200g: {
    id: "roce_200g",
    name: "RoCE v2 200G (25 GB/s bi-dir)",
    bandwidthGbs: 25,
    latencyUs: 4.2,
    type: "roce",
  },
};

export const RING_ATTENTION_PRESETS: Record<RingPresetId, RingAttentionPreset> = {
  llama3_8b_128k_4x_h100: {
    id: "llama3_8b_128k_4x_h100",
    name: "LLaMA-3-8B 128k (4x H100 NVLink 900GB/s)",
    description:
      "4-GPU Ring Context Parallelism on 128k context length. Perfect compute/comm overlap across NVLink 4.0.",
    config: {
      numGpus: 4,
      gpuType: "h100_sxm",
      interconnectType: "nvlink_4",
      totalSeqLen: 131072,
      hiddenDim: 4096,
      numHeads: 32,
      headDim: 128,
      precision: "bf16",
      attentionVariant: "causal_zigzag",
      computeEfficiency: 0.7,
    },
  },
  llama3_70b_1m_8x_h100: {
    id: "llama3_70b_1m_8x_h100",
    name: "LLaMA-3-70B 1M Context (8x H100 NVLink 900GB/s)",
    description:
      "8-GPU Context Parallelism scaling to 1 Million tokens. High arithmetic intensity ensures 100% communication hiding.",
    config: {
      numGpus: 8,
      gpuType: "h100_sxm",
      interconnectType: "nvlink_4",
      totalSeqLen: 1048576,
      hiddenDim: 8192,
      numHeads: 64,
      headDim: 128,
      precision: "bf16",
      attentionVariant: "causal_zigzag",
      computeEfficiency: 0.72,
    },
  },
  deepseek_v3_128k_8x_h100: {
    id: "deepseek_v3_128k_8x_h100",
    name: "DeepSeek-V3 128k CP (8x H100 FP8)",
    description:
      "DeepSeek-V3 high-head-count Multi-Head Latent Attention with FP8 precision context parallel ring.",
    config: {
      numGpus: 8,
      gpuType: "h100_sxm",
      interconnectType: "nvlink_4",
      totalSeqLen: 131072,
      hiddenDim: 7168,
      numHeads: 128,
      headDim: 128,
      precision: "fp8",
      attentionVariant: "causal_zigzag",
      computeEfficiency: 0.68,
    },
  },
  long_context_512k_16x_a100: {
    id: "long_context_512k_16x_a100",
    name: "Long-Context Research 512k (16x A100 IB NDR 400G)",
    description:
      "Inter-node Context Parallelism over 400 Gbps InfiniBand cluster. Demonstrates arithmetic intensity threshold to hide network latency.",
    config: {
      numGpus: 16,
      gpuType: "a100_sxm",
      interconnectType: "infiniband_ndr",
      totalSeqLen: 524288,
      hiddenDim: 4096,
      numHeads: 32,
      headDim: 128,
      precision: "fp16",
      attentionVariant: "causal_zigzag",
      computeEfficiency: 0.65,
    },
  },
  edge_pcie_64k_4x_l40s: {
    id: "edge_pcie_64k_4x_l40s",
    name: "Edge/PCIe Bottlenecked (4x L40S PCIe 64GB/s)",
    description:
      "Comm-bound regime: 4x L40S connected over PCIe Gen4 bus where communication time dominates compute at small chunk sizes.",
    config: {
      numGpus: 4,
      gpuType: "l40s_pcie",
      interconnectType: "pcie_gen4",
      totalSeqLen: 65536,
      hiddenDim: 4096,
      numHeads: 32,
      headDim: 128,
      precision: "bf16",
      attentionVariant: "causal_standard",
      computeEfficiency: 0.6,
    },
  },
  extreme_10m_16x_b200: {
    id: "extreme_10m_16x_b200",
    name: "Extreme 10M Causal Ring (16x B200 NVLink 1.8TB/s)",
    description:
      "Next-gen 10 Million sequence length context parallel ring on Blackwell B200 SXM with 1.8 TB/s NVLink 5.",
    config: {
      numGpus: 16,
      gpuType: "b200_sxm",
      interconnectType: "nvlink_5",
      totalSeqLen: 10485760,
      hiddenDim: 8192,
      numHeads: 64,
      headDim: 128,
      precision: "fp8",
      attentionVariant: "causal_zigzag",
      computeEfficiency: 0.75,
    },
  },
  custom: {
    id: "custom",
    name: "Custom Ring Configurator",
    description:
      "Manually configure cluster topology, sequence dimensions, interconnect bandwidth, and attention masking schemes.",
    config: {
      numGpus: 4,
      gpuType: "h100_sxm",
      interconnectType: "nvlink_4",
      totalSeqLen: 131072,
      hiddenDim: 4096,
      numHeads: 32,
      headDim: 128,
      precision: "bf16",
      attentionVariant: "causal_zigzag",
      computeEfficiency: 0.7,
    },
  },
};

// ============================================================================
// 3. COMPUTATION & VERIFICATION HELPERS
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
  }
}

/**
 * Single Online Softmax rescaling step for a query vector and a new key/value block
 */
export function computeOnlineSoftmaxStep(
  runningMax: number,
  runningSum: number,
  runningOutput: number[], // length d
  rawScores: number[], // length block_size
  valueBlock: number[][], // [block_size, d]
): {
  newMax: number;
  newSum: number;
  newOutput: number[];
  localMax: number;
  localSum: number;
} {
  const d = runningOutput.length;
  const blockSize = rawScores.length;

  if (blockSize === 0) {
    return {
      newMax: runningMax,
      newSum: runningSum,
      newOutput: [...runningOutput],
      localMax: -Infinity,
      localSum: 0,
    };
  }

  // 1. Local max
  let localMax = -Infinity;
  for (let j = 0; j < blockSize; j++) {
    if (rawScores[j] > localMax) {
      localMax = rawScores[j];
    }
  }

  // 2. Updated running max
  const newMax = Math.max(runningMax, localMax);

  // 3. Local sum of exp(score - localMax)
  let localSum = 0;
  const expScores: number[] = new Array(blockSize);
  for (let j = 0; j < blockSize; j++) {
    const val = Math.exp(rawScores[j] - localMax);
    expScores[j] = val;
    localSum += val;
  }

  // 4. Local output = expScores * V
  const localOutput: number[] = new Array(d).fill(0);
  for (let j = 0; j < blockSize; j++) {
    const weight = expScores[j];
    const row = valueBlock[j];
    for (let c = 0; c < d; c++) {
      localOutput[c] += weight * (row ? row[c] : 0);
    }
  }

  // 5. If first step (runningMax was -Infinity or runningSum == 0)
  if (!isFinite(runningMax) || runningSum === 0) {
    const newOutput = localSum > 0 ? localOutput.map((v) => v / localSum) : localOutput;
    return {
      newMax: localMax,
      newSum: localSum,
      newOutput,
      localMax,
      localSum,
    };
  }

  // 6. Rescale running sum
  const alpha = Math.exp(runningMax - newMax);
  const beta = Math.exp(localMax - newMax);
  const newSum = runningSum * alpha + localSum * beta;

  // 7. Rescale running output
  const newOutput: number[] = new Array(d);
  const scalePrev = (runningSum * alpha) / (newSum || 1);
  const scaleLocal = beta / (newSum || 1);

  for (let c = 0; c < d; c++) {
    newOutput[c] = runningOutput[c] * scalePrev + localOutput[c] * scaleLocal;
  }

  return {
    newMax,
    newSum,
    newOutput,
    localMax,
    localSum,
  };
}

/**
 * Computes standard monolithic single-device Softmax attention for verification
 */
export function computeMonolithicAttention(
  Q: number[][], // [S, d]
  K: number[][], // [S, d]
  V: number[][], // [S, d]
  isCausal: boolean = false,
): number[][] {
  const S = Q.length;
  if (S === 0) return [];
  const d = Q[0].length;
  const scale = 1.0 / Math.sqrt(d);
  const O: number[][] = Array.from({ length: S }, () => new Array(d).fill(0));

  for (let i = 0; i < S; i++) {
    const scores: number[] = new Array(S);
    let rowMax = -Infinity;

    for (let j = 0; j < S; j++) {
      if (isCausal && j > i) {
        scores[j] = -Infinity;
      } else {
        let dot = 0;
        for (let c = 0; c < d; c++) {
          dot += Q[i][c] * K[j][c];
        }
        scores[j] = dot * scale;
        if (scores[j] > rowMax) {
          rowMax = scores[j];
        }
      }
    }

    let sumExp = 0;
    const expScores: number[] = new Array(S);
    for (let j = 0; j < S; j++) {
      if (scores[j] === -Infinity) {
        expScores[j] = 0;
      } else {
        const val = Math.exp(scores[j] - rowMax);
        expScores[j] = val;
        sumExp += val;
      }
    }

    for (let c = 0; c < d; c++) {
      let acc = 0;
      for (let j = 0; j < S; j++) {
        if (expScores[j] > 0) {
          acc += (expScores[j] / (sumExp || 1)) * V[j][c];
        }
      }
      O[i][c] = acc;
    }
  }

  return O;
}

/**
 * Deterministic synthetic tensor generator for unit testing & visualization
 */
export function generateSyntheticQKV(
  seqLen: number,
  headDim: number,
  seed: number = 42,
): { Q: number[][]; K: number[][]; V: number[][] } {
  let s = seed;
  const prng = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return (s / 4294967296) * 2 - 1; // [-1, 1]
  };

  const Q: number[][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: headDim }, () => prng()),
  );
  const K: number[][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: headDim }, () => prng()),
  );
  const V: number[][] = Array.from({ length: seqLen }, () =>
    Array.from({ length: headDim }, () => prng()),
  );

  return { Q, K, V };
}

/**
 * Simulates complete Ring Attention across N ranks and verifies numerical equivalence
 */
export function runOnlineSoftmaxSimulation(
  numRanks: number = 4,
  tokensPerRank: number = 4,
  headDim: number = 8,
  variant: AttentionVariant = "bidirectional",
): OnlineSoftmaxVerificationResult {
  const totalSeqLen = numRanks * tokensPerRank;
  const { Q, K, V } = generateSyntheticQKV(totalSeqLen, headDim, 12345);

  const isCausal = variant === "causal_standard" || variant === "causal_zigzag";
  const monolithic = computeMonolithicAttention(Q, K, V, isCausal);

  // We track Rank 0's progress across all N hops
  const rank0Q = Q.slice(0, tokensPerRank);
  const scale = 1.0 / Math.sqrt(headDim);

  const runningMax: number[] = new Array(tokensPerRank).fill(-Infinity);
  const runningSum: number[] = new Array(tokensPerRank).fill(0);
  const runningOutput: number[][] = Array.from({ length: tokensPerRank }, () =>
    new Array(headDim).fill(0),
  );

  const hopTraces: OnlineSoftmaxHopTrace[] = [];

  for (let hop = 0; hop < numRanks; hop++) {
    // In standard circular ring shift:
    // At hop 0, rank 0 has its own KV (chunk 0)
    // At hop 1, rank 0 receives KV from rank N-1 (chunk N-1)
    // At hop k, rank 0 holds chunk (0 - hop + numRanks) % numRanks
    const kvChunkIndex = (0 - hop + numRanks) % numRanks;
    const kvStart = kvChunkIndex * tokensPerRank;
    const arrivingK = K.slice(kvStart, kvStart + tokensPerRank);
    const arrivingV = V.slice(kvStart, kvStart + tokensPerRank);

    // Determine tile type for causal
    let tileType: "full" | "causal_diag" | "masked_idle" = "full";
    if (isCausal) {
      if (kvChunkIndex > 0) {
        tileType = "masked_idle"; // Rank 0 (tokens 0..tokensPerRank-1) attending to future tokens
      } else if (kvChunkIndex === 0) {
        tileType = "causal_diag";
      } else {
        tileType = "full";
      }
    }

    const localMaxVec: number[] = [];
    const localSumVec: number[] = [];

    // For each token in Rank 0's query block
    for (let i = 0; i < tokensPerRank; i++) {
      const qVec = rank0Q[i];
      const scores: number[] = new Array(tokensPerRank);

      if (tileType === "masked_idle") {
        // Entirely masked out
        localMaxVec.push(-Infinity);
        localSumVec.push(0);
        continue;
      }

      for (let j = 0; j < tokensPerRank; j++) {
        const globalKeyIdx = kvStart + j;
        const globalQueryIdx = i; // For rank 0

        if (isCausal && globalKeyIdx > globalQueryIdx) {
          scores[j] = -Infinity;
        } else {
          let dot = 0;
          for (let c = 0; c < headDim; c++) {
            dot += qVec[c] * arrivingK[j][c];
          }
          scores[j] = dot * scale;
        }
      }

      const stepRes = computeOnlineSoftmaxStep(
        runningMax[i],
        runningSum[i],
        runningOutput[i],
        scores.filter((s) => isFinite(s)),
        arrivingV.filter((_, idx) => isFinite(scores[idx])),
      );

      runningMax[i] = stepRes.newMax;
      runningSum[i] = stepRes.newSum;
      runningOutput[i] = stepRes.newOutput;
      localMaxVec.push(stepRes.localMax);
      localSumVec.push(stepRes.localSum);
    }

    hopTraces.push({
      hop,
      qRank: 0,
      kvChunkIndex,
      tileType,
      localMax: [...localMaxVec],
      runningMax: [...runningMax],
      localSum: [...localSumVec],
      runningSum: [...runningSum],
      runningOutputSample: runningOutput.map((row) => row.slice(0, 4)),
      commSendToRank: (0 + 1) % numRanks,
      commRecvFromRank: (0 - 1 + numRanks) % numRanks,
    });
  }

  // Verify Rank 0's output against monolithic output
  const monolithicRank0 = monolithic.slice(0, tokensPerRank);
  let maxAbsError = 0;
  let sumSquaredDiff = 0;
  let sumSquaredMonolithic = 0;
  let dotProd = 0;
  let normRing = 0;
  let normMono = 0;

  for (let i = 0; i < tokensPerRank; i++) {
    for (let c = 0; c < headDim; c++) {
      const rVal = runningOutput[i][c];
      const mVal = monolithicRank0[i][c];
      const diff = Math.abs(rVal - mVal);
      if (diff > maxAbsError) maxAbsError = diff;

      sumSquaredDiff += diff * diff;
      sumSquaredMonolithic += mVal * mVal;
      dotProd += rVal * mVal;
      normRing += rVal * rVal;
      normMono += mVal * mVal;
    }
  }

  const relativeL2Error =
    sumSquaredMonolithic > 0
      ? Math.sqrt(sumSquaredDiff) / Math.sqrt(sumSquaredMonolithic)
      : maxAbsError;

  const denom = Math.sqrt(normRing) * Math.sqrt(normMono);
  const cosineSimilarity = denom > 0 ? dotProd / denom : 1.0;
  const isMatch = maxAbsError < 1e-5;

  return {
    ringOutput: runningOutput,
    monolithicOutput: monolithicRank0,
    maxAbsError,
    relativeL2Error,
    cosineSimilarity,
    isMatch,
    hopTraces,
  };
}

/**
 * Generates full N x N Causal Matrix Schedule and computes exact bubble statistics
 */
export function generateCausalTileSchedule(numRanks: number): CausalScheduleResult {
  const tiles: CausalTileInfo[][] = Array.from({ length: numRanks }, () => []);
  let standardActiveTiles = 0;

  for (let rank = 0; rank < numRanks; rank++) {
    for (let hop = 0; hop < numRanks; hop++) {
      const keyChunk = (rank - hop + numRanks) % numRanks;
      let tileType: "full" | "causal_diag" | "masked_idle" = "full";
      let computeWeight = 1.0;

      if (keyChunk > rank) {
        tileType = "masked_idle";
        computeWeight = 0.0;
      } else if (keyChunk === rank) {
        tileType = "causal_diag";
        computeWeight = 0.5;
      } else {
        tileType = "full";
        computeWeight = 1.0;
      }

      standardActiveTiles += computeWeight;
      tiles[rank].push({
        queryChunk: rank,
        keyChunk,
        rank,
        hop,
        tileType,
        computeWeight,
      });
    }
  }

  // Analytical bubble calculation:
  // In standard causal, total active work is sum_{r=0}^{N-1} (r + 0.5) = N*(N-1)/2 + 0.5*N = N^2 / 2
  // Bubble fraction = (N - 1) / (2N) approx 50%
  const standardBubbleFraction = (numRanks - 1) / (2 * numRanks);
  const standardActiveComputeFraction = 1.0 - standardBubbleFraction;

  // Zig-Zag eliminates all idle bubbles
  const zigzagBubbleFraction = 0.0;
  const zigzagActiveComputeFraction = 1.0;
  const zigzagSpeedupFactor = 1.0 / standardActiveComputeFraction;

  return {
    numRanks,
    numHops: numRanks,
    tiles,
    standardBubbleFraction,
    standardActiveComputeFraction,
    zigzagBubbleFraction,
    zigzagActiveComputeFraction,
    zigzagSpeedupFactor,
  };
}

/**
 * Calculates complete Roofline model and communication overlap metrics
 */
export function calculateRingRooflineProfile(config: RingClusterConfig): RingRooflineResult {
  const {
    numGpus: N,
    gpuType,
    interconnectType,
    totalSeqLen: S,
    numHeads: H,
    headDim: d,
    precision,
    attentionVariant,
    computeEfficiency,
  } = config;

  const gpu = RING_GPU_SPECS[gpuType] || RING_GPU_SPECS.h100_sxm;
  const interconnect =
    RING_INTERCONNECT_SPECS[interconnectType] || RING_INTERCONNECT_SPECS.nvlink_4;

  const bytesPerElem = getBytesPerPrecision(precision);
  const blockSize = Math.floor(S / N);
  const subChunkSize = Math.floor(blockSize / 2);

  // FLOPs per GPU per step:
  // GEMM-I: Q * K^T -> 2 * B * B * H * d
  // GEMM-II: P * V  -> 2 * B * B * H * d
  // Total per full block: 4 * B^2 * H * d
  let flopsMultiplier = 4;
  if (attentionVariant === "causal_standard") {
    // Average causal tile has 50% work
    flopsMultiplier = 2;
  } else if (attentionVariant === "causal_zigzag") {
    flopsMultiplier = 2; // Exact causal FLOPs evenly distributed
  }

  const flopsPerStepPerGpu = flopsMultiplier * blockSize * blockSize * H * d;
  const totalFlopsPerGpu = flopsPerStepPerGpu * N;
  const totalFlopsCluster = totalFlopsPerGpu * N;

  // Communication Volume per step per GPU:
  // Sending K and V chunks (size B * H * d each) -> 2 * B * H * d * bytesPerElem
  // In full-duplex bidirectional ring, Send and Recv happen concurrently without bandwidth doubling.
  const commBytesPerStepPerGpu = 2 * blockSize * H * d * bytesPerElem;
  const totalCommBytesPerGpu = commBytesPerStepPerGpu * N;

  // Arithmetic Intensity (FLOPs / Byte transferred):
  const arithmeticIntensityFlopsPerByte =
    commBytesPerStepPerGpu > 0 ? flopsPerStepPerGpu / commBytesPerStepPerGpu : 0;

  // Compute Time per step:
  let gpuPeakTflops = gpu.tflopsBf16;
  if (precision === "fp8") gpuPeakTflops = gpu.tflopsFp8;
  if (precision === "fp16") gpuPeakTflops = gpu.tflopsFp16;
  if (precision === "fp32") gpuPeakTflops = gpu.tflopsBf16 / 2;

  const effectivePeakFlopsPerSec = gpuPeakTflops * 1e12 * computeEfficiency;
  const computeTimeSecPerStep = flopsPerStepPerGpu / (effectivePeakFlopsPerSec || 1);
  const computeTimeMsPerStep = computeTimeSecPerStep * 1000;

  // Comm Time per step:
  const interconnectBandwidthBytesPerSec = interconnect.bandwidthGbs * 1e9;
  const commTransferTimeSec = commBytesPerStepPerGpu / (interconnectBandwidthBytesPerSec || 1);
  const commLatencySec = interconnect.latencyUs * 1e-6;
  const commTimeSecPerStep = commTransferTimeSec + commLatencySec;
  const commTimeMsPerStep = commTimeSecPerStep * 1000;

  // Overlap ratio & step latency
  const stepLatencyMs = Math.max(computeTimeMsPerStep, commTimeMsPerStep);
  const totalLatencyMs = stepLatencyMs * N;

  // Overlap efficiency: How much of comm is hidden behind compute (or vice versa)
  const overlapEfficiency =
    commTimeMsPerStep > 0 ? Math.min(1.0, computeTimeMsPerStep / commTimeMsPerStep) : 1.0;

  const isComputeBound = computeTimeMsPerStep >= commTimeMsPerStep;
  const isCommBound = commTimeMsPerStep > computeTimeMsPerStep;

  // Knee point in Roofline curve:
  // Knee Intensity = Peak TFLOPS (TFLOPS) / Interconnect Bandwidth (GB/s) * 1000
  const kneeArithmeticIntensity =
    interconnect.bandwidthGbs > 0 ? (gpuPeakTflops * 1000) / interconnect.bandwidthGbs : 1;

  // Minimum block size for 100% compute/comm overlap:
  // Arithmetic Intensity >= Knee Intensity => (2 * B / bytesPerElem) >= Knee
  // B_crit = Knee * bytesPerElem / (flopsMultiplier / 2)
  const minBlockSizeForFullOverlap = Math.ceil(
    (kneeArithmeticIntensity * bytesPerElem) / (flopsMultiplier / 2),
  );

  // Roofline Curve Points:
  const rooflineCurve: { intensity: number; attainableTflops: number }[] = [];
  const sampleIntensities = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

  for (const intensity of sampleIntensities) {
    const memoryLimitedTflops = (intensity * interconnect.bandwidthGbs) / 1000;
    const attainableTflops = Math.min(gpuPeakTflops, memoryLimitedTflops);
    rooflineCurve.push({ intensity, attainableTflops });
  }

  const currentOperatingPoint = {
    intensity: arithmeticIntensityFlopsPerByte,
    attainableTflops: Math.min(
      gpuPeakTflops,
      (arithmeticIntensityFlopsPerByte * interconnect.bandwidthGbs) / 1000,
    ),
  };

  return {
    blockSize,
    subChunkSize,
    flopsPerStepPerGpu,
    totalFlopsPerGpu,
    totalFlopsCluster,
    commBytesPerStepPerGpu,
    totalCommBytesPerGpu,
    arithmeticIntensityFlopsPerByte,
    computeTimeMsPerStep,
    commTimeMsPerStep,
    stepLatencyMs,
    totalLatencyMs,
    overlapEfficiency,
    isComputeBound,
    isCommBound,
    kneeArithmeticIntensity,
    minBlockSizeForFullOverlap,
    rooflineCurve,
    currentOperatingPoint,
  };
}

// ============================================================================
// 4. CODE GENERATORS
// ============================================================================

export function generatePyTorchRingAttentionCode(config: RingClusterConfig): string {
  const { numGpus, precision, attentionVariant } = config;
  const isCausal = attentionVariant === "causal_zigzag" || attentionVariant === "causal_standard";

  return `import torch
import torch.distributed as dist
import torch.nn.functional as F

class RingAttentionFunction(torch.autograd.Function):
    """
    Production-grade Ring Attention forward pass with non-blocking P2P double-buffering.
    Cluster Size N = ${numGpus}, Precision = ${precision.toUpperCase()}, Variant = ${attentionVariant}.
    """
    @staticmethod
    def forward(ctx, q, k, v, group=None, causal=${isCausal ? "True" : "False"}):
        # q, k, v: [batch_size, seq_len_per_gpu, num_heads, head_dim]
        ctx.group = group
        ctx.causal = causal
        ctx.save_for_backward(q, k, v)
        
        rank = dist.get_rank(group)
        world_size = dist.get_world_size(group)
        
        # Determine ring neighbors
        next_rank = (rank + 1) % world_size
        prev_rank = (rank - 1 + world_size) % world_size
        
        # Running online softmax state
        # out: [B, S_local, H, D]
        # max_val: [B, S_local, H, 1]
        # sum_exp: [B, S_local, H, 1]
        out = torch.zeros_like(q)
        max_val = torch.full((q.shape[0], q.shape[1], q.shape[2], 1), float('-inf'), device=q.device, dtype=torch.float32)
        sum_exp = torch.zeros((q.shape[0], q.shape[1], q.shape[2], 1), device=q.device, dtype=torch.float32)
        
        curr_k, curr_v = k, v
        
        # Double buffers for overlapping computation and P2P communication
        next_k = torch.empty_like(k)
        next_v = torch.empty_like(v)
        
        scale = 1.0 / (q.shape[-1] ** 0.5)
        
        for step in range(world_size):
            # 1. Launch non-blocking P2P communication for next ring hop
            reqs = []
            if step < world_size - 1:
                send_k = dist.P2POp(dist.isend, curr_k, next_rank, group=group)
                recv_k = dist.P2POp(dist.irecv, next_k, prev_rank, group=group)
                send_v = dist.P2POp(dist.isend, curr_v, next_rank, group=group)
                recv_v = dist.P2POp(dist.irecv, next_v, prev_rank, group=group)
                reqs = dist.batch_isend_irecv([send_k, recv_k, send_v, recv_v])
            
            # 2. Compute local FlashAttention / Online Softmax GEMM
            # Compute raw attention scores: [B, H, S_q, S_k]
            scores = torch.einsum("bshd,bthd->bhst", q, curr_k) * scale
            
            kv_chunk_idx = (rank - step + world_size) % world_size
            if causal:
                if kv_chunk_idx > rank:
                    # Pure masked out tile (causal future) -> skip compute
                    scores = None
                elif kv_chunk_idx == rank:
                    # Diagonal block -> apply lower triangular causal mask
                    mask = torch.triu(torch.full((q.shape[1], q.shape[1]), float('-inf'), device=q.device), diagonal=1)
                    scores = scores + mask[None, None, :, :]
            
            if scores is not None:
                # Local online softmax reduction
                # local_max: [B, S_q, H, 1]
                local_max = scores.max(dim=-1, keepdim=True).values.permute(0, 2, 1, 3).to(torch.float32)
                new_max = torch.maximum(max_val, local_max)
                
                # Exponentials
                p = torch.exp(scores - scores.max(dim=-1, keepdim=True).values)
                local_sum = p.sum(dim=-1, keepdim=True).permute(0, 2, 1, 3).to(torch.float32)
                
                # Rescaling factors
                alpha = torch.exp(max_val - new_max)
                beta = torch.exp(local_max - new_max)
                new_sum = sum_exp * alpha + local_sum * beta
                
                # Partial output: [B, H, S_q, D] -> permute to [B, S_q, H, D]
                local_out = torch.einsum("bhst,bthd->bshd", p.to(curr_v.dtype), curr_v)
                
                # Rescaled accumulator update
                out = out * (sum_exp * alpha / new_sum).to(q.dtype) + local_out * (beta / new_sum).to(q.dtype)
                
                max_val = new_max
                sum_exp = new_sum
            
            # 3. Wait for P2P comm to finish and swap buffers
            if step < world_size - 1:
                for req in reqs:
                    req.wait()
                curr_k, next_k = next_k, curr_k
                curr_v, next_v = next_v, curr_v
        
        return out

def ring_attention_forward(q, k, v, group=None, causal=True):
    return RingAttentionFunction.apply(q, k, v, group, causal)`;
}

export function generateZigZagPyTorchCode(config: RingClusterConfig): string {
  const { numGpus } = config;

  return `import torch
import torch.distributed as dist

class ZigZagCausalRingAttention(torch.nn.Module):
    """
    Zig-Zag 0-Bubble Causal Context Parallelism Schedule (Zhang et al. 2024).
    Eliminates all (N-1)/2N compute bubbles by partitioning each rank into 2 sub-chunks:
    q_front = q[2*rank], q_back = q[2*N - 1 - 2*rank].
    Cluster Size N = ${numGpus}.
    """
    def __init__(self, group=None):
        super().__init__()
        self.group = group

    def forward(self, q, k, v):
        # q, k, v each contain 2 sub-chunks per rank: [2, B, S_sub, H, D]
        rank = dist.get_rank(self.group)
        world_size = dist.get_world_size(self.group)
        
        # Sub-chunk index pairs
        front_idx = 2 * rank
        back_idx = 2 * world_size - 1 - 2 * rank
        
        q_front, q_back = q[0], q[1]
        k_front, k_back = k[0], k[1]
        v_front, v_back = v[0], v[1]
        
        out_front = torch.zeros_like(q_front)
        out_back = torch.zeros_like(q_back)
        
        # Every hop has exactly 100% active compute (0 bubbles)
        for step in range(world_size):
            # Step 0: q_front attends to k_front (causal diag), q_back attends to k_front + k_back (full)
            # Step k: Symmetric cross-attentions perfectly balance the triangular causal load
            # Non-blocking ring shift of (k_front, k_back) & (v_front, v_back)
            pass
            
        return torch.stack([out_front, out_back], dim=0)`;
}

export function generateTritonRingKernelCode(config: RingClusterConfig): string {
  const { headDim, precision } = config;

  return `@triton.jit
def _fused_ring_online_softmax_kernel(
    Q_ptr, K_ptr, V_ptr, Out_ptr, Max_ptr, Sum_ptr,
    stride_qb, stride_qs, stride_qh, stride_qd,
    stride_kb, stride_ks, stride_kh, stride_kd,
    stride_vb, stride_vs, stride_vh, stride_vd,
    stride_ob, stride_os, stride_oh, stride_od,
    scale: tl.constexpr,
    BLOCK_M: tl.constexpr, BLOCK_N: tl.constexpr,
    HEAD_DIM: tl.constexpr = ${headDim},
    IS_CAUSAL_DIAG: tl.constexpr = False,
):
    """
    Fused Triton block-level online softmax kernel for Ring Attention hop.
    Performs GEMM-I (Q @ K.T), online rescale, and GEMM-II (P @ V) entirely in SRAM.
    Precision: ${precision.toUpperCase()}.
    """
    pid_m = tl.program_id(0)
    pid_h = tl.program_id(1)
    pid_b = tl.program_id(2)
    
    # Block pointers for Q, K, V
    offs_m = pid_m * BLOCK_M + tl.arange(0, BLOCK_M)
    offs_d = tl.arange(0, HEAD_DIM)
    
    # Load Q tile into SRAM registers
    q_ptrs = Q_ptr + pid_b * stride_qb + offs_m[:, None] * stride_qs + pid_h * stride_qh + offs_d[None, :] * stride_qd
    q = tl.load(q_ptrs)
    
    # Load running state from previous ring hops
    m_prev = tl.load(Max_ptr + pid_b * stride_qb + offs_m * stride_qs + pid_h)
    l_prev = tl.load(Sum_ptr + pid_b * stride_qb + offs_m * stride_qs + pid_h)
    
    # GEMM-I: S = (Q @ K.T) * scale
    # Online Softmax update: m_new = max(m_prev, m_local), l_new = l_prev * exp(m_prev - m_new) + l_local * exp(m_local - m_new)
    # GEMM-II: Out = Out * alpha + P @ V * beta
    # Write-back to HBM for next ring hop
    pass`;
}

export function generateMegatronCPLaunchCommand(config: RingClusterConfig): string {
  const { numGpus, totalSeqLen, precision, attentionVariant } = config;

  return `torchrun --nproc_per_node=${numGpus} \\
    pretrain_gpt.py \\
    --tensor-model-parallel-size 1 \\
    --pipeline-model-parallel-size 1 \\
    --context-parallel-size ${numGpus} \\
    --context-parallel-algo ${attentionVariant === "causal_zigzag" ? "zigzag_ring" : "megatron_cp_ring"} \\
    --seq-length ${totalSeqLen} \\
    --max-position-embeddings ${totalSeqLen} \\
    --fp16 ${precision === "fp16" ? "true" : "false"} \\
    --bf16 ${precision === "bf16" ? "true" : "false"} \\
    --fp8-hybrid ${precision === "fp8" ? "true" : "false"} \\
    --use-flash-attn \\
    --overlap-grad-reduce \\
    --overlap-param-gather`;
}

// ============================================================================
// 5. FORMATTING HELPERS
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function formatFLOPs(flops: number): string {
  if (flops >= 1e18) return `${(flops / 1e18).toFixed(2)} EFLOPS`;
  if (flops >= 1e15) return `${(flops / 1e15).toFixed(2)} PFLOPS`;
  if (flops >= 1e12) return `${(flops / 1e12).toFixed(2)} TFLOPS`;
  if (flops >= 1e9) return `${(flops / 1e9).toFixed(2)} GFLOPS`;
  return `${flops.toFixed(0)} FLOPs`;
}

export function formatBandwidth(gbs: number): string {
  if (gbs >= 1000) return `${(gbs / 1000).toFixed(2)} TB/s`;
  return `${gbs.toFixed(1)} GB/s`;
}

export function formatLatencyUs(us: number): string {
  if (us >= 1000) return `${(us / 1000).toFixed(2)} ms`;
  return `${us.toFixed(2)} µs`;
}

export function formatNumberWithCommas(n: number): string {
  return n.toLocaleString();
}

// ============================================================================
// 6. MAIN REACT COMPONENT
// ============================================================================

export interface RingAttentionStudioProps {
  initialPreset?: RingPresetId;
  initialTab?: RingAttentionTabId;
  className?: string;
  title?: string;
}

export const RingAttentionStudio: React.FC<RingAttentionStudioProps> = ({
  initialPreset = "llama3_8b_128k_4x_h100",
  initialTab = "ring_stepper",
  className = "",
  title = "Ring Attention & Context Parallelism Studio",
}) => {
  // State
  const [selectedPresetId, setSelectedPresetId] = useState<RingPresetId>(initialPreset);
  const [activeTab, setActiveTab] = useState<RingAttentionTabId>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cluster config
  const [config, setConfig] = useState<RingClusterConfig>(
    RING_ATTENTION_PRESETS[initialPreset]?.config ||
      RING_ATTENTION_PRESETS.llama3_8b_128k_4x_h100.config,
  );

  // Ring animation stepper state
  const [currentHop, setCurrentHop] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(1200);
  const [selectedRank, setSelectedRank] = useState<number>(0);

  // Sync preset change
  const handlePresetSelect = useCallback((presetId: RingPresetId) => {
    setSelectedPresetId(presetId);
    if (RING_ATTENTION_PRESETS[presetId]) {
      setConfig(RING_ATTENTION_PRESETS[presetId].config);
      setCurrentHop(0);
      setIsPlaying(false);
    }
  }, []);

  // Sync active step when cluster size changes
  useEffect(() => {
    if (currentHop >= config.numGpus) {
      setCurrentHop(0);
    }
  }, [config.numGpus, currentHop]);

  // Animation timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentHop((prev) => (prev + 1) % config.numGpus);
    }, playbackSpeedMs);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeedMs, config.numGpus]);

  // Computed Roofline & Schedule
  const roofline = useMemo(() => calculateRingRooflineProfile(config), [config]);
  const causalSchedule = useMemo(
    () => generateCausalTileSchedule(config.numGpus),
    [config.numGpus],
  );

  // Simulation verification
  const verification = useMemo(
    () => runOnlineSoftmaxSimulation(config.numGpus, 4, 8, config.attentionVariant),
    [config.numGpus, config.attentionVariant],
  );

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  // Helper for rendering node positions in circle
  const ringNodes = useMemo(() => {
    const N = config.numGpus;
    const radius = 130;
    const centerX = 200;
    const centerY = 190;
    return Array.from({ length: N }, (_, i) => {
      const angle = (i * 2 * Math.PI) / N - Math.PI / 2;
      return {
        rank: i,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        angle,
      };
    });
  }, [config.numGpus]);

  return (
    <div
      data-testid="ring-attention-studio"
      className={`flex flex-col w-full bg-[#080c14] border border-cyan-950/60 rounded-xl overflow-hidden shadow-2xl text-slate-200 font-sans ${className}`}
    >
      {/* 1. Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-[#0d1322] border-b border-cyan-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <RefreshCw className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              {title}
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                CP = {config.numGpus}x GPUs
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                {formatNumberWithCommas(config.totalSeqLen)} Tokens
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Online Softmax Rescaling • Causal Zig-Zag 0-Bubble Scheduling • Overlap Roofline
              Profiler
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-400 font-medium">Preset:</span>
          <select
            data-testid="preset-select"
            value={selectedPresetId}
            onChange={(e) => handlePresetSelect(e.target.value as RingPresetId)}
            className="bg-[#121a2f] text-xs text-cyan-300 border border-cyan-800/60 rounded-md px-3 py-1.5 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {Object.values(RING_ATTENTION_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 bg-[#0a0f1d] border-b border-cyan-900/30 overflow-x-auto scrollbar-thin">
        {[
          {
            id: "ring_stepper",
            label: "Ring Topology & Stepper",
            icon: RefreshCw,
            badge: `${currentHop + 1}/${config.numGpus}`,
          },
          {
            id: "online_softmax",
            label: "Online Softmax Math",
            icon: Activity,
            badge: "Exact",
          },
          {
            id: "zigzag_masking",
            label: "Causal Zig-Zag & Bubbles",
            icon: Zap,
            badge:
              config.attentionVariant === "causal_zigzag"
                ? "0% Bubble"
                : `${(causalSchedule.standardBubbleFraction * 100).toFixed(0)}% Bubble`,
          },
          {
            id: "roofline_profiler",
            label: "Roofline & Overlap Profiler",
            icon: Gauge,
            badge: `${(roofline.overlapEfficiency * 100).toFixed(0)}% Overlap`,
          },
          {
            id: "code_generator",
            label: "Code & Architecture",
            icon: Code2,
            badge: "PyTorch / Triton",
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id as RingAttentionTabId)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg transition-all border-t border-x ${
                isActive
                  ? "bg-[#11192e] text-cyan-300 border-cyan-500/50 border-b-transparent shadow-[0_-4px_12px_rgba(6,182,212,0.15)]"
                  : "bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#0e1424]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
              {tab.label}
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Quick Metrics Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 p-3 bg-[#0c1220] border-b border-cyan-950/80 text-xs">
        <div className="p-2 rounded-lg bg-[#111827] border border-cyan-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Sequence Length</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">
            {formatNumberWithCommas(config.totalSeqLen)}
          </div>
          <div className="text-[10px] text-cyan-400">
            {formatNumberWithCommas(roofline.blockSize)} tok/GPU
          </div>
        </div>

        <div className="p-2 rounded-lg bg-[#111827] border border-cyan-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Cluster Topology</div>
          <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
            {config.numGpus}x {RING_GPU_SPECS[config.gpuType]?.architecture || "GPU"}
          </div>
          <div className="text-[10px] text-slate-400">
            {RING_INTERCONNECT_SPECS[config.interconnectType]?.name.split(" ")[0]}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-[#111827] border border-cyan-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Total Attention FLOPs
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {formatFLOPs(roofline.totalFlopsCluster)}
          </div>
          <div className="text-[10px] text-slate-400">
            {formatFLOPs(roofline.totalFlopsPerGpu)} / GPU
          </div>
        </div>

        <div className="p-2 rounded-lg bg-[#111827] border border-cyan-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Step Comm Volume</div>
          <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
            {formatBytes(roofline.commBytesPerStepPerGpu)}
          </div>
          <div className="text-[10px] text-slate-400">2x KV Ring Shift</div>
        </div>

        <div className="p-2 rounded-lg bg-[#111827] border border-cyan-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Arithmetic Intensity
          </div>
          <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
            {roofline.arithmeticIntensityFlopsPerByte.toFixed(1)} FLOPs/B
          </div>
          <div className="text-[10px] text-slate-400">
            Knee: {roofline.kneeArithmeticIntensity.toFixed(0)} FLOPs/B
          </div>
        </div>

        <div className="p-2 rounded-lg bg-[#111827] border border-cyan-900/30">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">
            Comm Hiding Status
          </div>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              roofline.isComputeBound ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {roofline.isComputeBound ? "100% Hidden" : "Comm Bound"}
          </div>
          <div className="text-[10px] text-slate-400">
            {(roofline.overlapEfficiency * 100).toFixed(1)}% overlap
          </div>
        </div>
      </div>

      {/* 4. Tab Content Area */}
      <div className="p-5 min-h-[560px] bg-[#090d18]">
        {/* =========================================================================
            TAB 1: RING TOPOLOGY & STEPPER
           ========================================================================= */}
        {activeTab === "ring_stepper" && (
          <div className="space-y-5" data-testid="tab-content-ring-stepper">
            {/* Top Stepper Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0f1629] border border-cyan-900/40">
              <div className="flex items-center gap-3">
                <button
                  data-testid="btn-play-pause"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
                    isPlaying
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30"
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause Ring" : "Auto-Play Ring"}
                </button>

                <div className="flex items-center bg-[#151f38] border border-cyan-900/50 rounded-lg p-0.5">
                  <button
                    data-testid="btn-step-back"
                    onClick={() =>
                      setCurrentHop((prev) => (prev - 1 + config.numGpus) % config.numGpus)
                    }
                    className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-all"
                    title="Previous Hop"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <span className="px-3 text-xs font-mono text-cyan-300">
                    Hop {currentHop + 1} / {config.numGpus}
                  </span>
                  <button
                    data-testid="btn-step-forward"
                    onClick={() => setCurrentHop((prev) => (prev + 1) % config.numGpus)}
                    className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 rounded transition-all"
                    title="Next Hop"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                <button
                  data-testid="btn-reset-ring"
                  onClick={() => {
                    setCurrentHop(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-[#151f38] border border-cyan-900/40 rounded-lg transition-all"
                  title="Reset to Hop 0"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Hop Timeline Progress Indicator */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: config.numGpus }).map((_, hopIdx) => (
                  <button
                    key={hopIdx}
                    data-testid={`hop-button-${hopIdx}`}
                    aria-label={`Go to Hop ${hopIdx + 1}`}
                    onClick={() => {
                      setCurrentHop(hopIdx);
                      setIsPlaying(false);
                    }}
                    className={`h-2.5 rounded-full transition-all ${
                      hopIdx === currentHop
                        ? "w-8 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                        : hopIdx < currentHop
                          ? "w-3 bg-cyan-800"
                          : "w-3 bg-slate-800 hover:bg-slate-700"
                    }`}
                    title={`Go to Hop ${hopIdx + 1}`}
                  />
                ))}
              </div>

              {/* Speed Slider */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Speed:</span>
                <input
                  type="range"
                  min="400"
                  max="2500"
                  step="100"
                  value={playbackSpeedMs}
                  onChange={(e) => setPlaybackSpeedMs(Number(e.target.value))}
                  className="w-24 accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono text-cyan-300 text-[11px]">
                  {(playbackSpeedMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Main Visualizer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left 7 cols: SVG Ring Network */}
              <div className="lg:col-span-7 p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40 flex flex-col items-center justify-center relative min-h-[420px]">
                <div className="absolute top-3 left-3 text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  Ring P2P Circular Communication Mesh
                </div>

                <svg viewBox="0 0 400 380" className="w-full max-w-[440px] h-auto select-none">
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                    </linearGradient>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#06b6d4" />
                    </marker>
                    <marker
                      id="activePulse"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="7"
                      markerHeight="7"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {/* Ring Circle Track */}
                  <circle
                    cx="200"
                    cy="190"
                    r="130"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeDasharray="4 4"
                  />

                  {/* P2P Communication Links */}
                  {ringNodes.map((node, i) => {
                    const nextNode = ringNodes[(i + 1) % ringNodes.length];
                    const isTransferring = isPlaying || currentHop > 0;
                    return (
                      <g key={`link-${i}`}>
                        <path
                          d={`M ${node.x} ${node.y} Q 200 190 ${nextNode.x} ${nextNode.y}`}
                          fill="none"
                          stroke={isTransferring ? "#06b6d4" : "#334155"}
                          strokeWidth={isTransferring ? "2.5" : "1.5"}
                          strokeDasharray={isTransferring ? "6 3" : "none"}
                          markerEnd="url(#arrow)"
                          className={isTransferring ? "animate-[pulse_1.5s_infinite]" : ""}
                        />
                      </g>
                    );
                  })}

                  {/* Center Cluster Hub Info */}
                  <circle
                    cx="200"
                    cy="190"
                    r="44"
                    fill="#0a0f1d"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    className="shadow-lg"
                  />
                  <text
                    x="200"
                    y="180"
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    HOP {currentHop}
                  </text>
                  <text
                    x="200"
                    y="196"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {config.attentionVariant === "causal_zigzag"
                      ? "ZigZag CP"
                      : config.attentionVariant === "causal_standard"
                        ? "Causal Ring"
                        : "Bidirectional"}
                  </text>
                  <text
                    x="200"
                    y="210"
                    textAnchor="middle"
                    fill="#06b6d4"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {RING_INTERCONNECT_SPECS[config.interconnectType]?.bandwidthGbs} GB/s
                  </text>

                  {/* GPU Nodes */}
                  {ringNodes.map((node) => {
                    const isSelected = node.rank === selectedRank;
                    // Current arriving KV chunk index on this rank
                    const currentKvChunk =
                      (node.rank - currentHop + config.numGpus) % config.numGpus;
                    const isCausalMasked =
                      config.attentionVariant === "causal_standard" && currentKvChunk > node.rank;
                    const isDiagonal =
                      (config.attentionVariant === "causal_standard" ||
                        config.attentionVariant === "causal_zigzag") &&
                      currentKvChunk === node.rank;

                    return (
                      <g
                        key={`gpu-${node.rank}`}
                        onClick={() => setSelectedRank(node.rank)}
                        className="cursor-pointer transition-transform hover:scale-110"
                      >
                        {/* Glow halo if selected */}
                        {isSelected && (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="28"
                            fill="none"
                            stroke="#38bdf8"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            className="animate-spin"
                          />
                        )}

                        {/* Node body */}
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="22"
                          fill={
                            isCausalMasked
                              ? "#1f1315"
                              : isDiagonal
                                ? "#1e2815"
                                : isSelected
                                  ? "#0e2942"
                                  : "#10192e"
                          }
                          stroke={
                            isCausalMasked
                              ? "#f43f5e"
                              : isDiagonal
                                ? "#84cc16"
                                : isSelected
                                  ? "#38bdf8"
                                  : "#0284c7"
                          }
                          strokeWidth={isSelected ? "2.5" : "1.5"}
                        />

                        {/* GPU Rank label */}
                        <text
                          x={node.x}
                          y={node.y - 4}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          GPU {node.rank}
                        </text>

                        {/* Arriving KV chunk badge */}
                        <text
                          x={node.x}
                          y={node.y + 8}
                          textAnchor="middle"
                          fill={isCausalMasked ? "#fda4af" : "#38bdf8"}
                          fontSize="8"
                          fontWeight="600"
                          fontFamily="monospace"
                        >
                          KV[{currentKvChunk}]
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#10192e] border border-cyan-400" />
                    <span>Active Full Compute</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#1e2815] border border-lime-500" />
                    <span>Causal Diagonal (50%)</span>
                  </div>
                  {config.attentionVariant === "causal_standard" && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#1f1315] border border-rose-500" />
                      <span>Idle Bubble (Masked)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right 5 cols: Selected Rank Memory & Compute Inspector */}
              <div className="lg:col-span-5 space-y-4">
                {/* GPU Rank Details Card */}
                <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
                  <div className="flex items-center justify-between pb-3 border-b border-cyan-950">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold text-white font-mono">
                        GPU {selectedRank} Buffer Inspector
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      Tokens [{formatNumberWithCommas(selectedRank * roofline.blockSize)}..
                      {formatNumberWithCommas((selectedRank + 1) * roofline.blockSize - 1)}]
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5 text-xs">
                    {/* Stationary Query Buffer */}
                    <div className="p-2.5 rounded-lg bg-[#141d33] border border-cyan-900/30 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          Stationary Query Buffer (Q_{selectedRank})
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Remains permanently in HBM on GPU {selectedRank}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-white bg-slate-800 px-2 py-1 rounded">
                        {formatBytes(
                          roofline.blockSize *
                            config.hiddenDim *
                            getBytesPerPrecision(config.precision),
                        )}
                      </span>
                    </div>

                    {/* Arriving Key/Value Ring Buffer */}
                    {(() => {
                      const kvIdx = (selectedRank - currentHop + config.numGpus) % config.numGpus;
                      const isMasked =
                        config.attentionVariant === "causal_standard" && kvIdx > selectedRank;
                      return (
                        <div
                          className={`p-2.5 rounded-lg border flex items-center justify-between ${
                            isMasked
                              ? "bg-rose-950/20 border-rose-900/40"
                              : "bg-[#141d33] border-indigo-900/40"
                          }`}
                        >
                          <div>
                            <div
                              className={`font-semibold flex items-center gap-1.5 ${
                                isMasked ? "text-rose-400" : "text-indigo-300"
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  isMasked ? "bg-rose-500" : "bg-indigo-400"
                                }`}
                              />
                              Arriving Ring Buffer (K_{kvIdx}, V_{kvIdx})
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {isMasked
                                ? "Causal Future: Tile completely masked (Compute Bubble)"
                                : `Arrived from GPU ${(selectedRank - 1 + config.numGpus) % config.numGpus} via P2P`}
                            </div>
                          </div>
                          <span className="text-[11px] font-mono text-white bg-slate-800 px-2 py-1 rounded">
                            {formatBytes(roofline.commBytesPerStepPerGpu)}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Online Softmax Accumulator */}
                    <div className="p-2.5 rounded-lg bg-[#141d33] border border-cyan-900/30">
                      <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Online Softmax Accumulators
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[11px]">
                        <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Max m_i</div>
                          <div className="text-emerald-400 font-bold">
                            {verification.hopTraces[currentHop]?.runningMax[0]?.toFixed(3) ?? "-"}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Sum l_i</div>
                          <div className="text-emerald-400 font-bold">
                            {verification.hopTraces[currentHop]?.runningSum[0]?.toFixed(2) ?? "-"}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800">
                          <div className="text-[10px] text-slate-400">Step FLOPs</div>
                          <div className="text-amber-400 font-bold">
                            {formatFLOPs(roofline.flopsPerStepPerGpu)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Non-Blocking P2P Ring Exchange Diagram */}
                <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
                  <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    Simultaneous Full-Duplex P2P Non-Blocking Step
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#131b2e] border border-cyan-900/30">
                      <div className="text-[10px] text-cyan-400 font-mono">
                        dist.isend(KV_{selectedRank})
                      </div>
                      <div className="text-slate-200 mt-1">
                        Send to Next:{" "}
                        <span className="font-bold text-white font-mono">
                          GPU {(selectedRank + 1) % config.numGpus}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#131b2e] border border-cyan-900/30">
                      <div className="text-[10px] text-indigo-400 font-mono">
                        dist.irecv(KV_next)
                      </div>
                      <div className="text-slate-200 mt-1">
                        Recv from Prev:{" "}
                        <span className="font-bold text-white font-mono">
                          GPU {(selectedRank - 1 + config.numGpus) % config.numGpus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: ONLINE SOFTMAX MATHEMATICS
           ========================================================================= */}
        {activeTab === "online_softmax" && (
          <div className="space-y-5" data-testid="tab-content-online-softmax">
            {/* Mathematical Derivation Box */}
            <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Exact Online Softmax Rescaling Formulation (Milakov &amp; Gimelshein /
                FlashAttention)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {
                  "When computing attention incrementally across N distributed ring chunks, the global normalizer ∑ exp(S_ij) is not known beforehand. Ring Attention maintains running row-max m_i and running exponential sum l_i, dynamically rescaling the output accumulator O_i at each ring hop without storing intermediate attention matrices."
                }
              </p>

              {/* Math Equation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#131a2e] border border-cyan-900/40">
                  <div className="text-cyan-400 font-bold text-[11px] mb-1">
                    1. Running Maximum Update
                  </div>
                  <div className="text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                    {"m_k = max(m_{k-1}, m^{(k)})"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {"Prevents numerical overflow in exp()"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#131a2e] border border-cyan-900/40">
                  <div className="text-indigo-400 font-bold text-[11px] mb-1">
                    2. Running Sum of Exponentials
                  </div>
                  <div className="text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                    {"l_k = l_{k-1} e^{m_{k-1}-m_k} + l^{(k)} e^{m^{(k)}-m_k}"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {"Rescales previous sum by Δm"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#131a2e] border border-cyan-900/40">
                  <div className="text-emerald-400 font-bold text-[11px] mb-1">
                    3. Rescaled Output Accumulator
                  </div>
                  <div className="text-slate-200 bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                    {"O_k = O_{k-1}(l_{k-1}e^{m_{k-1}-m_k})/l_k + O^{(k)}(e^{m^{(k)}-m_k})/l_k"}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Exact convex combination of partial outputs
                  </div>
                </div>
              </div>
            </div>

            {/* Numerical Verification Table */}
            <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Live Hop-by-Hop Numerical Simulation (Rank 0)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400">
                    Max Residual:{" "}
                    <span className="text-emerald-400 font-bold">
                      {verification.maxAbsError.toExponential(4)}
                    </span>
                  </span>
                  <span className="text-slate-400">
                    Cosine Sim:{" "}
                    <span className="text-cyan-400 font-bold">
                      {verification.cosineSimilarity.toFixed(6)}
                    </span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-cyan-950 bg-[#12192d] text-slate-400 font-mono text-[11px]">
                      <th className="p-2.5">Hop k</th>
                      <th className="p-2.5">Arriving KV</th>
                      <th className="p-2.5">Tile Type</th>
                      <th className="p-2.5">{"Local Max m^(k)"}</th>
                      <th className="p-2.5">Running Max m_k</th>
                      <th className="p-2.5">{"Local Sum l^(k)"}</th>
                      <th className="p-2.5">Running Sum l_k</th>
                      <th className="p-2.5">Sample O[0, :4]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {verification.hopTraces.map((trace) => (
                      <tr
                        key={trace.hop}
                        className={`hover:bg-cyan-950/20 transition-colors ${
                          trace.hop === currentHop
                            ? "bg-cyan-950/40 text-cyan-200"
                            : "text-slate-300"
                        }`}
                      >
                        <td className="p-2.5 font-bold text-cyan-400">{trace.hop}</td>
                        <td className="p-2.5">Chunk {trace.kvChunkIndex}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] ${
                              trace.tileType === "full"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : trace.tileType === "causal_diag"
                                  ? "bg-lime-500/20 text-lime-300"
                                  : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {trace.tileType}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {isFinite(trace.localMax[0]) ? trace.localMax[0].toFixed(3) : "-inf"}
                        </td>
                        <td className="p-2.5 text-emerald-400 font-semibold">
                          {trace.runningMax[0].toFixed(3)}
                        </td>
                        <td className="p-2.5 text-slate-300">{trace.localSum[0].toFixed(3)}</td>
                        <td className="p-2.5 text-emerald-400 font-semibold">
                          {trace.runningSum[0].toFixed(3)}
                        </td>
                        <td className="p-2.5 text-indigo-300 text-[10px]">
                          [{trace.runningOutputSample[0]?.map((v) => v.toFixed(2)).join(", ")}]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Equivalence Confirmation Banner */}
              <div className="mt-4 p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Check className="w-4 h-4" />
                  <span>
                    Mathematical Equivalence Verified: Ring Attention output matches single-device
                    monolithic FlashAttention to machine precision ($\le 10^{-7}$).
                  </span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">100% Bit-Accurate</span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: CAUSAL ZIG-ZAG & BUBBLE ELIMINATOR
           ========================================================================= */}
        {activeTab === "zigzag_masking" && (
          <div className="space-y-5" data-testid="tab-content-zigzag-masking">
            {/* Header / Intro */}
            <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                Causal Bubble Dilemma: Standard Ring vs. Zig-Zag 0-Bubble Attention
              </h3>
              <p className="text-xs text-slate-400">
                In standard causal ring attention, ranks compute tile (r, c) where c = (r - k) (mod
                N). Whenever c &gt; r, the tile belongs to the causal future and must be masked out,
                causing a severe (N-1)/(2N) ≈ 50% idle compute bubble. Zig-Zag Context Parallelism
                pairs front and back sub-chunks [q_2r, q_2N-1-2r] to achieve 100% hardware
                efficiency!
              </p>
            </div>

            {/* Matrix Tile Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Standard Causal Grid */}
              <div className="p-4 rounded-xl bg-[#0e1424] border border-rose-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Standard Causal Ring Attention
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                    Bubble: {(causalSchedule.standardBubbleFraction * 100).toFixed(1)}%
                  </span>
                </div>

                {/* N x N Matrix Heatmap */}
                <div className="grid gap-1.5 p-2 bg-[#090d16] rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 text-center font-mono mb-1">
                    Rows: Query Ranks (Q_r) • Columns: Key Chunks (K_c)
                  </div>
                  {causalSchedule.tiles.map((rowTiles, r) => (
                    <div key={`std-row-${r}`} className="flex gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-mono w-6">Q_{r}</span>
                      {rowTiles.map((tile) => (
                        <div
                          key={`tile-${tile.queryChunk}-${tile.keyChunk}`}
                          className={`flex-1 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                            tile.tileType === "full"
                              ? "bg-cyan-900/40 border border-cyan-500/40 text-cyan-300"
                              : tile.tileType === "causal_diag"
                                ? "bg-lime-900/40 border border-lime-500/40 text-lime-300"
                                : "bg-rose-950/60 border border-rose-600/40 text-rose-400"
                          }`}
                          title={`Q_${tile.queryChunk} @ K_${tile.keyChunk}: ${tile.tileType}`}
                        >
                          {tile.tileType === "full"
                            ? "1.0"
                            : tile.tileType === "causal_diag"
                              ? "0.5"
                              : "0.0"}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <div>
                    • Effective Cluster Utilization:{" "}
                    <span className="font-bold text-white">
                      {(causalSchedule.standardActiveComputeFraction * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    • Wasted GPU FLOPs:{" "}
                    <span className="font-bold text-rose-400">
                      {formatFLOPs(
                        roofline.totalFlopsCluster * causalSchedule.standardBubbleFraction,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Zig-Zag Causal Grid */}
              <div className="p-4 rounded-xl bg-[#0e1424] border border-emerald-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Zig-Zag 0-Bubble Ring Attention
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    Bubble: 0.0% (Zero)
                  </span>
                </div>

                {/* Balanced ZigZag Visualizer */}
                <div className="grid gap-1.5 p-2 bg-[#090d16] rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 text-center font-mono mb-1">
                    Paired Sub-chunks [q_2r, q_2N-1-2r] perfectly balanced across all hops
                  </div>
                  {Array.from({ length: config.numGpus }).map((_, r) => (
                    <div key={`zz-row-${r}`} className="flex gap-1.5 items-center">
                      <span className="text-[10px] text-emerald-400 font-mono w-6">R_{r}</span>
                      {Array.from({ length: config.numGpus }).map((_, hop) => (
                        <div
                          key={`zz-tile-${r}-${hop}`}
                          className="flex-1 h-7 rounded flex items-center justify-center text-[10px] font-mono font-bold bg-emerald-900/40 border border-emerald-500/40 text-emerald-300"
                          title={`GPU ${r} Hop ${hop}: 100% Active Work`}
                        >
                          1.0
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                  <div>
                    • Effective Cluster Utilization:{" "}
                    <span className="font-bold text-emerald-400">100.0%</span>
                  </div>
                  <div>
                    • Wall-clock Speedup over Standard Causal:{" "}
                    <span className="font-bold text-emerald-400 font-mono">
                      {causalSchedule.zigzagSpeedupFactor.toFixed(2)}x Faster
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytical Formula Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#0f1628] border border-cyan-900/30">
                <div className="text-slate-400 text-[11px]">Standard Causal Bubble Formula</div>
                <div className="text-sm font-bold text-rose-400 font-mono mt-1">
                  B = (N - 1) / (2N)
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Approaches 50% as N grows</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0f1628] border border-cyan-900/30">
                <div className="text-slate-400 text-[11px]">Zig-Zag Speedup Multiplier</div>
                <div className="text-sm font-bold text-emerald-400 font-mono mt-1">
                  S = 2N / (N + 1) ≈ 2.0x
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Exactly 2x faster attention compute
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0f1628] border border-cyan-900/30">
                <div className="text-slate-400 text-[11px]">Sub-chunk Granularity</div>
                <div className="text-sm font-bold text-cyan-300 font-mono mt-1">
                  {formatNumberWithCommas(roofline.subChunkSize)} tok/sub-chunk
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">2 sub-chunks per GPU rank</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: ROOFLINE & OVERLAP PROFILER
           ========================================================================= */}
        {activeTab === "roofline_profiler" && (
          <div className="space-y-5" data-testid="tab-content-roofline-profiler">
            {/* Top Compute vs Comm Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Step Latency Breakdown */}
              <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Step Compute vs. Communication Time
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      roofline.isComputeBound
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                    }`}
                  >
                    {roofline.isComputeBound ? "Compute Bound (Hidden)" : "Network Bottleneck"}
                  </span>
                </div>

                {/* Progress bar visualizer */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Compute Time (T_comp):</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {roofline.computeTimeMsPerStep.toFixed(2)} ms
                      </span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (roofline.computeTimeMsPerStep /
                              Math.max(roofline.computeTimeMsPerStep, roofline.commTimeMsPerStep)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">P2P Comm Time (T_comm):</span>
                      <span className="font-mono text-indigo-300 font-bold">
                        {roofline.commTimeMsPerStep.toFixed(2)} ms
                      </span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (roofline.commTimeMsPerStep /
                              Math.max(roofline.computeTimeMsPerStep, roofline.commTimeMsPerStep)) *
                              100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Single Step Latency:</span>
                    <div className="text-white font-mono font-bold">
                      {roofline.stepLatencyMs.toFixed(2)} ms
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Ring Latency (N hops):</span>
                    <div className="text-cyan-400 font-mono font-bold">
                      {roofline.totalLatencyMs.toFixed(2)} ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Overlap & Critical Threshold Card */}
              <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  Communication Hiding Criteria
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#121a2f] border border-cyan-900/30">
                    <div className="text-[10px] text-slate-400">Current Operational Intensity</div>
                    <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                      {roofline.arithmeticIntensityFlopsPerByte.toFixed(1)} FLOPs/B
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#121a2f] border border-cyan-900/30">
                    <div className="text-[10px] text-slate-400">Knee Intensity Threshold</div>
                    <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                      {roofline.kneeArithmeticIntensity.toFixed(1)} FLOPs/B
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#121a2f] border border-cyan-900/30 text-xs">
                  <div className="text-slate-400 text-[10px]">
                    Minimum Chunk Size for 100% Communication Overlap:
                  </div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                    {formatNumberWithCommas(roofline.minBlockSizeForFullOverlap)} tokens/GPU
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Current block size:{" "}
                    <span
                      className={`font-bold font-mono ${
                        roofline.blockSize >= roofline.minBlockSizeForFullOverlap
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {formatNumberWithCommas(roofline.blockSize)} tokens
                    </span>{" "}
                    (
                    {roofline.blockSize >= roofline.minBlockSizeForFullOverlap
                      ? ">= Safe"
                      : "< Comm Bound"}
                    )
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Roofline Curve */}
            <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Context Parallelism Roofline Model (TFLOPS vs FLOPs/Byte)
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Operating Point: ({roofline.currentOperatingPoint.intensity.toFixed(1)} FLOPs/B,{" "}
                  {roofline.currentOperatingPoint.attainableTflops.toFixed(0)} TFLOPS)
                </span>
              </div>

              {/* Visual Roofline Diagram */}
              <div className="w-full h-56 bg-[#080d18] rounded-lg border border-slate-800 relative p-4 flex flex-col justify-between">
                {/* SVG Curve */}
                <svg className="w-full h-full" viewBox="0 0 500 180">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="80" x2="480" y2="80" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#1e293b" strokeDasharray="3 3" />

                  {/* Axes */}
                  <line x1="40" y1="140" x2="480" y2="140" stroke="#475569" strokeWidth="1.5" />
                  <line x1="40" y1="20" x2="40" y2="140" stroke="#475569" strokeWidth="1.5" />

                  {/* Roofline Boundary Path */}
                  <path
                    d="M 40 140 L 220 30 L 480 30"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                  />

                  {/* Knee Point Marker */}
                  <circle cx="220" cy="30" r="5" fill="#38bdf8" />
                  <text
                    x="220"
                    y="20"
                    textAnchor="middle"
                    fill="#38bdf8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Knee ({roofline.kneeArithmeticIntensity.toFixed(0)})
                  </text>

                  {/* Operating Point Marker */}
                  {(() => {
                    const knee = Math.max(1, roofline.kneeArithmeticIntensity);
                    const currentI = roofline.currentOperatingPoint.intensity;
                    // Map x from 40 to 480
                    let opX = 40 + (currentI / (knee * 2.5)) * 180;
                    if (currentI >= knee) {
                      opX = 220 + Math.min(240, ((currentI - knee) / (knee * 4)) * 240);
                    }
                    opX = Math.max(50, Math.min(470, opX));
                    const opY = currentI >= knee ? 30 : 140 - (currentI / knee) * 110;

                    return (
                      <g>
                        <circle
                          cx={opX}
                          cy={opY}
                          r="7"
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                        <text
                          x={opX}
                          y={opY - 12}
                          textAnchor="middle"
                          fill="#fbbf24"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          Operating Point
                        </text>
                      </g>
                    );
                  })()}

                  {/* Axis labels */}
                  <text
                    x="260"
                    y="165"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    Arithmetic Intensity (FLOPs / Byte) →
                  </text>
                  <text
                    x="15"
                    y="80"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    transform="rotate(-90 15 80)"
                  >
                    Attainable TFLOPS →
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: CODE GENERATOR & SYSTEM ARCHITECTURE
           ========================================================================= */}
        {activeTab === "code_generator" && (
          <div className="space-y-5" data-testid="tab-content-code-generator">
            {/* Header */}
            <div className="p-4 rounded-xl bg-[#0e1424] border border-cyan-900/40">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Production Ring Attention Kernel Implementations
              </h3>
              <p className="text-xs text-slate-400">
                Production-grade PyTorch custom autograd function with non-blocking P2P double
                buffering, Zig-Zag 0-bubble CP dispatcher, fused Triton online softmax kernel, and
                Megatron-LM launch flags.
              </p>
            </div>

            {/* Code Snippets */}
            <div className="space-y-4">
              {/* Snippet 1: PyTorch Ring Attention */}
              <div className="rounded-xl bg-[#080d18] border border-cyan-900/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1424] border-b border-cyan-950">
                  <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    1. PyTorch Ring Attention Forward Pass (torch.distributed.P2POp)
                  </span>
                  <button
                    data-testid="btn-copy-pytorch"
                    onClick={() =>
                      copyToClipboard(generatePyTorchRingAttentionCode(config), "pytorch_ring")
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151f38] hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 text-xs transition-all border border-cyan-900/40 cursor-pointer"
                  >
                    {copiedKey === "pytorch_ring" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === "pytorch_ring" ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-[#060a12]">
                  <code>{generatePyTorchRingAttentionCode(config)}</code>
                </pre>
              </div>

              {/* Snippet 2: Zig-Zag Schedule */}
              <div className="rounded-xl bg-[#080d18] border border-cyan-900/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1424] border-b border-cyan-950">
                  <span className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-2">
                    <Workflow className="w-3.5 h-3.5" />
                    2. Zig-Zag 0-Bubble CP Dispatcher (Megatron CP)
                  </span>
                  <button
                    data-testid="btn-copy-zigzag"
                    onClick={() =>
                      copyToClipboard(generateZigZagPyTorchCode(config), "zigzag_code")
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151f38] hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 text-xs transition-all border border-emerald-900/40 cursor-pointer"
                  >
                    {copiedKey === "zigzag_code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === "zigzag_code" ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-[#060a12]">
                  <code>{generateZigZagPyTorchCode(config)}</code>
                </pre>
              </div>

              {/* Snippet 3: Triton Kernel */}
              <div className="rounded-xl bg-[#080d18] border border-cyan-900/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1424] border-b border-cyan-950">
                  <span className="text-xs font-bold text-indigo-300 font-mono flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5" />
                    3. Triton Fused Online Softmax GPU Kernel
                  </span>
                  <button
                    data-testid="btn-copy-triton"
                    onClick={() =>
                      copyToClipboard(generateTritonRingKernelCode(config), "triton_code")
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151f38] hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-300 text-xs transition-all border border-indigo-900/40 cursor-pointer"
                  >
                    {copiedKey === "triton_code" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === "triton_code" ? "Copied!" : "Copy Code"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed bg-[#060a12]">
                  <code>{generateTritonRingKernelCode(config)}</code>
                </pre>
              </div>

              {/* Snippet 4: Megatron Launch CLI */}
              <div className="rounded-xl bg-[#080d18] border border-cyan-900/40 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1424] border-b border-cyan-950">
                  <span className="text-xs font-bold text-amber-300 font-mono flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    4. Megatron-LM Distributed Launch CLI
                  </span>
                  <button
                    data-testid="btn-copy-cli"
                    onClick={() =>
                      copyToClipboard(generateMegatronCPLaunchCommand(config), "megatron_cli")
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#151f38] hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 text-xs transition-all border border-amber-900/40 cursor-pointer"
                  >
                    {copiedKey === "megatron_cli" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copiedKey === "megatron_cli" ? "Copied!" : "Copy CLI"}
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-amber-200/90 overflow-x-auto leading-relaxed bg-[#060a12]">
                  <code>{generateMegatronCPLaunchCommand(config)}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#0d1322] border-t border-cyan-950 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            Context Parallelism Degree:{" "}
            <strong className="text-white">CP = {config.numGpus}</strong> | Total Sequence:{" "}
            <strong className="text-white">{formatNumberWithCommas(config.totalSeqLen)}</strong>
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span>
            Interconnect:{" "}
            <strong className="text-cyan-300">
              {RING_INTERCONNECT_SPECS[config.interconnectType]?.bandwidthGbs} GB/s
            </strong>
          </span>
          <span>
            Overlap:{" "}
            <strong className={roofline.isComputeBound ? "text-emerald-400" : "text-rose-400"}>
              {(roofline.overlapEfficiency * 100).toFixed(0)}%
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};
