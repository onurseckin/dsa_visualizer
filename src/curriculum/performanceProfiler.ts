/**
 * Visual Performance Profiler & Roofline Model Engine
 * High-precision hardware performance modeling for ML Systems and Kernels.
 */

export type PrecisionFormat = "fp8" | "fp16" | "bf16" | "fp32";
export type OperationalRegime = "MEMORY_BOUND" | "COMPUTE_BOUND";

/**
 * Hardware accelerator and compute platform architecture specification.
 */
export interface HardwareTarget {
  id: string;
  name: string;
  vendor: "NVIDIA" | "Apple" | "AMD" | "Intel" | "Generic";
  architecture: string;
  peakTflopsFp8?: number;
  peakTflopsFp16: number;
  peakTflopsBf16: number;
  peakTflopsFp32: number;
  peakMemoryBandwidthGBs: number; // GB/s (HBM / Unified / DDR)
  sramCapacityKB: number; // KB (L2 Cache + Shared Memory / SM)
  interconnectBandwidthGBs?: number; // GB/s (e.g. NVLink / PCIe)
}

/**
 * Catalogue of modern datacenter accelerators, edge silicon, and server CPUs.
 */
export const HARDWARE_TARGETS: Record<string, HardwareTarget> = {
  nvidia_h100_sxm5: {
    id: "nvidia_h100_sxm5",
    name: "NVIDIA H100 SXM5 (Hopper)",
    vendor: "NVIDIA",
    architecture: "Hopper (GH100)",
    peakTflopsFp8: 3958.0,
    peakTflopsFp16: 1979.0,
    peakTflopsBf16: 1979.0,
    peakTflopsFp32: 67.0, // Non-tensor FP32 (Tensor FP32 is 989 TFLOP/s)
    peakMemoryBandwidthGBs: 3350.0, // 3.35 TB/s HBM3
    sramCapacityKB: 50000, // 50 MB L2 Cache + 228 KB SM SRAM
    interconnectBandwidthGBs: 900.0, // NVLink 4 (Bidirectional)
  },
  nvidia_a100_sxm4_80gb: {
    id: "nvidia_a100_sxm4_80gb",
    name: "NVIDIA A100 SXM4 80GB (Ampere)",
    vendor: "NVIDIA",
    architecture: "Ampere (GA100)",
    peakTflopsFp8: undefined,
    peakTflopsFp16: 312.0,
    peakTflopsBf16: 312.0,
    peakTflopsFp32: 19.5, // Standard FP32 (TF32 Tensor is 156 TFLOP/s)
    peakMemoryBandwidthGBs: 2039.0, // 2.039 TB/s HBM2e
    sramCapacityKB: 40000, // 40 MB L2 Cache
    interconnectBandwidthGBs: 600.0, // NVLink 3
  },
  apple_m3_max: {
    id: "apple_m3_max",
    name: "Apple M3 Max (40-core GPU)",
    vendor: "Apple",
    architecture: "Apple Silicon (M3)",
    peakTflopsFp8: undefined,
    peakTflopsFp16: 104.0,
    peakTflopsBf16: 104.0,
    peakTflopsFp32: 52.0,
    peakMemoryBandwidthGBs: 400.0, // 400 GB/s Unified Memory
    sramCapacityKB: 16000, // System Level Cache
    interconnectBandwidthGBs: undefined,
  },
  server_cpu_epyc_xeon: {
    id: "server_cpu_epyc_xeon",
    name: "Server CPU (64-Core AVX-512 / AMX)",
    vendor: "Intel",
    architecture: "x86-64 (Emerald Rapids / Genoa)",
    peakTflopsFp8: undefined,
    peakTflopsFp16: 8.0,
    peakTflopsBf16: 8.0,
    peakTflopsFp32: 4.0,
    peakMemoryBandwidthGBs: 307.2, // 8-channel DDR5-4800
    sramCapacityKB: 320000, // 320 MB L3 Cache
    interconnectBandwidthGBs: 64.0, // PCIe Gen5 x16
  },
};

/**
 * Result of Williams et al. Roofline Model performance analysis.
 */
export interface RooflineProfile {
  targetId: string;
  targetName: string;
  precision: PrecisionFormat;
  flops: number;
  bytesTransferred: number;
  arithmeticIntensity: number; // FLOP / Byte
  ridgePoint: number; // FLOP / Byte
  operationalRegime: OperationalRegime;
  peakComputeTflops: number;
  peakBandwidthGBs: number;
  attainablePerformanceTflops: number;
  executionTimeSeconds: number;
  computeUtilizationPercent: number;
  bandwidthUtilizationPercent: number;
  memoryTrafficSeconds: number;
  computeTimeSeconds: number;
}

/**
 * Computes Williams et al. Roofline Model metrics for an arbitrary workload and target.
 */
export function computeRooflineProfile(
  flops: number,
  bytesTransferred: number,
  target: HardwareTarget,
  precision: PrecisionFormat = "fp16",
): RooflineProfile {
  let peakComputeTflops: number;
  if (precision === "fp8") {
    peakComputeTflops = target.peakTflopsFp8 || target.peakTflopsFp16 * 2;
  } else if (precision === "fp16") {
    peakComputeTflops = target.peakTflopsFp16;
  } else if (precision === "bf16") {
    peakComputeTflops = target.peakTflopsBf16;
  } else {
    peakComputeTflops = target.peakTflopsFp32;
  }

  const peakBandwidthGBs = target.peakMemoryBandwidthGBs;
  const safeBytes = Math.max(1, bytesTransferred);
  const arithmeticIntensity = flops / safeBytes;

  // Ridge Point = Peak Compute (FLOP/s) / Peak Bandwidth (Bytes/s)
  // (peakComputeTflops * 1e12) / (peakBandwidthGBs * 1e9) = peakComputeTflops * 1000 / peakBandwidthGBs
  const ridgePoint = (peakComputeTflops * 1000) / peakBandwidthGBs;

  const operationalRegime: OperationalRegime =
    arithmeticIntensity < ridgePoint ? "MEMORY_BOUND" : "COMPUTE_BOUND";

  // Attainable Performance = min(Peak Compute, Intensity * Peak Bandwidth)
  const attainableFromBandwidth = (arithmeticIntensity * peakBandwidthGBs) / 1000;
  const attainablePerformanceTflops = Math.min(peakComputeTflops, attainableFromBandwidth);

  // Time components
  const computeTimeSeconds = flops / (peakComputeTflops * 1e12);
  const memoryTrafficSeconds = bytesTransferred / (peakBandwidthGBs * 1e9);
  const executionTimeSeconds = Math.max(computeTimeSeconds, memoryTrafficSeconds);

  const computeUtilizationPercent =
    executionTimeSeconds > 0
      ? Math.min(100, Math.max(0, (computeTimeSeconds / executionTimeSeconds) * 100))
      : 0;

  const bandwidthUtilizationPercent =
    executionTimeSeconds > 0
      ? Math.min(100, Math.max(0, (memoryTrafficSeconds / executionTimeSeconds) * 100))
      : 0;

  return {
    targetId: target.id,
    targetName: target.name,
    precision,
    flops,
    bytesTransferred,
    arithmeticIntensity,
    ridgePoint,
    operationalRegime,
    peakComputeTflops,
    peakBandwidthGBs,
    attainablePerformanceTflops,
    executionTimeSeconds,
    computeUtilizationPercent,
    bandwidthUtilizationPercent,
    memoryTrafficSeconds,
    computeTimeSeconds,
  };
}

/**
 * Signature algorithm workload profiles for ML Systems.
 */
export interface WorkloadComparison {
  workloadName: string;
  description: string;
  naiveProfile: RooflineProfile;
  optimizedProfile: RooflineProfile;
  speedup: number;
  memoryTrafficReductionRatio: number;
  insights: string[];
}

/**
 * Analytical profiler for core ML Systems algorithms and kernels.
 */
export function profileTopicWorkload(
  topicKey:
    | "flash_attention_vs_standard"
    | "prefill_vs_decode"
    | "dense_gemm_tiling"
    | "ring_allreduce"
    | "paged_attention_vllm",
  target: HardwareTarget = HARDWARE_TARGETS.nvidia_h100_sxm5,
): WorkloadComparison {
  if (topicKey === "flash_attention_vs_standard") {
    // Sequence N = 4096, d = 128, FP16 (2 bytes per elem)
    const N = 4096;
    const d = 128;
    const bytesPerElem = 2;

    // FLOPs: 2 * N^2 * d (QK^T) + 2 * N^2 * d (PV) = 4 N^2 d
    const flops = 4 * N * N * d;

    // Standard Attention: writes N^2 attention matrix S to HBM, reads S for Softmax, writes P to HBM, reads P for PV
    // Q, K, V = 3 * N * d * bytesPerElem
    // S write + S read + P write + P read = 4 * N^2 * bytesPerElem
    // Output O = N * d * bytesPerElem
    const standardBytes = (4 * N * d + 4 * N * N) * bytesPerElem;

    // FlashAttention-2: Q, K, V read from HBM + O write to HBM. Attention matrix stays in SRAM!
    // Memory traffic = (3 * N * d + N * d) * bytesPerElem = 4 N d * bytesPerElem
    const flashBytes = 4 * N * d * bytesPerElem;

    const naiveProfile = computeRooflineProfile(flops, standardBytes, target, "fp16");
    const optimizedProfile = computeRooflineProfile(flops, flashBytes, target, "fp16");
    const speedup = naiveProfile.executionTimeSeconds / optimizedProfile.executionTimeSeconds;
    const memoryTrafficReductionRatio = standardBytes / flashBytes;

    return {
      workloadName: "FlashAttention-2 vs Standard Attention",
      description: `Attention forward pass for sequence length N=${N}, head dimension d=${d} in FP16.`,
      naiveProfile,
      optimizedProfile,
      speedup: Math.round(speedup * 100) / 100,
      memoryTrafficReductionRatio: Math.round(memoryTrafficReductionRatio * 10) / 10,
      insights: [
        `Standard attention is strictly ${naiveProfile.operationalRegime} (I = ${naiveProfile.arithmeticIntensity.toFixed(2)} FLOP/byte vs Ridge = ${naiveProfile.ridgePoint.toFixed(1)}).`,
        `FlashAttention-2 eliminates the O(N^2) HBM roundtrips by fusing QK^T, Online Softmax, and PV inside SRAM tiles.`,
        `Memory traffic is reduced by ${memoryTrafficReductionRatio.toFixed(1)}x, transitioning execution into the ${optimizedProfile.operationalRegime} regime.`,
      ],
    };
  }

  if (topicKey === "prefill_vs_decode") {
    // Hidden dimension D = 4096, Layers = 32, FP16
    const D = 4096;
    const bytesPerElem = 2;

    // Prefill: Prompt length S = 2048 (GEMM compute bound)
    const S_prefill = 2048;
    const prefillFlops = 2 * S_prefill * D * D;
    const prefillBytes = (S_prefill * D + D * D + S_prefill * D) * bytesPerElem;

    // Decode: Batch size 1, 1 token generation (GEMV memory bound)
    const decodeFlops = 2 * 1 * D * D;
    const decodeBytes = (1 * D + D * D + 1 * D) * bytesPerElem;

    const naiveProfile = computeRooflineProfile(decodeFlops, decodeBytes, target, "fp16");
    const optimizedProfile = computeRooflineProfile(prefillFlops, prefillBytes, target, "fp16");
    const speedup =
      optimizedProfile.attainablePerformanceTflops / naiveProfile.attainablePerformanceTflops;

    return {
      workloadName: "LLM Prefill (GEMM) vs Decode (GEMV) Phase",
      description: `Single layer projection for hidden dimension D=${D}: S=${S_prefill} prefill vs S=1 decode.`,
      naiveProfile, // Decode
      optimizedProfile, // Prefill
      speedup: Math.round(speedup * 10) / 10,
      memoryTrafficReductionRatio: 1.0,
      insights: [
        `Decode phase (GEMV) achieves only ${naiveProfile.attainablePerformanceTflops.toFixed(1)} TFLOP/s because it transfers the full weight matrix for a single token (I = ${naiveProfile.arithmeticIntensity.toFixed(2)} FLOP/byte).`,
        `Prefill phase (GEMM) reuses weights across ${S_prefill} tokens, reaching ${optimizedProfile.attainablePerformanceTflops.toFixed(1)} TFLOP/s in the ${optimizedProfile.operationalRegime} regime.`,
        `Continuous batching and Speculative Decoding are required to amortize weight bandwidth during decode generation.`,
      ],
    };
  }

  if (topicKey === "dense_gemm_tiling") {
    // M = N = K = 4096, FP16
    const M = 4096;
    const N = 4096;
    const K = 4096;
    const bytesPerElem = 2;

    const flops = 2 * M * N * K;

    // Naive GEMM: for each output element, read row of A and col of B from DRAM = 2 * M * N * K * bytesPerElem
    const naiveBytes = 2 * M * N * K * bytesPerElem;

    // Block-Tiled GEMM (Tile size B = 128): SRAM reuse reduces DRAM traffic to (M*K + K*N + M*N) * (K / B) * bytesPerElem
    const tileSize = 128;
    const tiledBytes = ((M * K) / tileSize + (K * N) / tileSize + M * N) * bytesPerElem;

    const naiveProfile = computeRooflineProfile(flops, naiveBytes, target, "fp16");
    const optimizedProfile = computeRooflineProfile(flops, tiledBytes, target, "fp16");
    const speedup = naiveProfile.executionTimeSeconds / optimizedProfile.executionTimeSeconds;
    const memoryTrafficReductionRatio = naiveBytes / tiledBytes;

    return {
      workloadName: "Naive vs Block-Tiled GEMM (4096 x 4096)",
      description: `Matrix multiplication A (${M}x${K}) @ B (${K}x${N}) in FP16 with tile size ${tileSize}.`,
      naiveProfile,
      optimizedProfile,
      speedup: Math.round(speedup * 100) / 100,
      memoryTrafficReductionRatio: Math.round(memoryTrafficReductionRatio * 10) / 10,
      insights: [
        `Naive GEMM makes redundant DRAM reads, bottlenecking the kernel at ${naiveProfile.attainablePerformanceTflops.toFixed(1)} TFLOP/s.`,
        `Hierarchical SRAM tiling with register tiles boosts Arithmetic Intensity from ${naiveProfile.arithmeticIntensity.toFixed(2)} to ${optimizedProfile.arithmeticIntensity.toFixed(1)} FLOP/byte.`,
        `Tiled GEMM fully saturates the accelerator Tensor Cores at ${optimizedProfile.attainablePerformanceTflops.toFixed(1)} TFLOP/s.`,
      ],
    };
  }

  if (topicKey === "ring_allreduce") {
    // P = 8 GPUs, Parameter size S = 1 GB (1e9 bytes), NVLink Interconnect
    const P = 8;
    const messageBytes = 1e9;
    const nvlinkBw = target.interconnectBandwidthGBs || 900.0;

    // FLOPs: Elementwise addition in Scatter-Reduce = ((P-1)/P) * (messageBytes / 2) FLOPs (FP16)
    const flops = ((P - 1) / P) * (messageBytes / 2);

    // Naive Parameter Server: Central server receives (P-1)*S and sends (P-1)*S -> Total 2(P-1)S over single link
    const psTraffic = 2 * (P - 1) * messageBytes;

    // Ring-AllReduce: Exactly 2 * ((P-1)/P) * S transferred per GPU
    const ringTraffic = 2 * ((P - 1) / P) * messageBytes;

    // Custom network target for interconnect
    const networkTarget: HardwareTarget = {
      ...target,
      peakMemoryBandwidthGBs: nvlinkBw,
    };

    const naiveProfile = computeRooflineProfile(flops, psTraffic, networkTarget, "fp16");
    const optimizedProfile = computeRooflineProfile(flops, ringTraffic, networkTarget, "fp16");
    const speedup = naiveProfile.executionTimeSeconds / optimizedProfile.executionTimeSeconds;
    const memoryTrafficReductionRatio = psTraffic / ringTraffic;

    return {
      workloadName: "Parameter Server vs Ring-AllReduce Collective",
      description: `Gradient synchronization across P=${P} ranks for 1 GB model weights over ${nvlinkBw} GB/s NVLink.`,
      naiveProfile,
      optimizedProfile,
      speedup: Math.round(speedup * 100) / 100,
      memoryTrafficReductionRatio: Math.round(memoryTrafficReductionRatio * 10) / 10,
      insights: [
        `Parameter Server creates a centralized bottleneck scaling linearly with worker count P: traffic = 2(P-1)S.`,
        `Ring-AllReduce splits tensors into P chunks, achieving constant bandwidth 2(P-1)/P * S independent of rank count.`,
        `Bandwidth efficiency reaches ${(((P - 1) / P) * 100).toFixed(1)}% of theoretical physical peak interconnect bandwidth.`,
      ],
    };
  }

  // default: paged_attention_vllm
  const seqLen = 8192;
  const numSeqs = 64;
  const hiddenSize = 4096;
  const bytesPerElem = 2;

  const totalKvCacheBytes = 2 * 32 * seqLen * hiddenSize * bytesPerElem; // 32 layers
  const contiguousWastedBytes = totalKvCacheBytes * 0.7; // ~70% internal fragmentation reserved for max seq_len
  const pagedWastedBytes = totalKvCacheBytes * 0.03; // <3% waste (last block only)

  const flops = 4 * numSeqs * seqLen * hiddenSize;
  const naiveProfile = computeRooflineProfile(
    flops,
    totalKvCacheBytes + contiguousWastedBytes,
    target,
    "fp16",
  );
  const optimizedProfile = computeRooflineProfile(
    flops,
    totalKvCacheBytes + pagedWastedBytes,
    target,
    "fp16",
  );

  return {
    workloadName: "Contiguous KV-Cache Allocation vs PagedAttention",
    description: `Memory footprint for ${numSeqs} concurrent requests of length ${seqLen} on 32-layer LLM.`,
    naiveProfile,
    optimizedProfile,
    speedup:
      Math.round(
        (naiveProfile.executionTimeSeconds / optimizedProfile.executionTimeSeconds) * 100,
      ) / 100,
    memoryTrafficReductionRatio:
      Math.round(
        ((totalKvCacheBytes + contiguousWastedBytes) / (totalKvCacheBytes + pagedWastedBytes)) * 10,
      ) / 10,
    insights: [
      `Contiguous pre-allocation suffers from 60-80% memory fragmentation due to over-reserving max_seq_len slots.`,
      `PagedAttention dynamically pages KV-cache blocks of size 16 into non-contiguous virtual tables, reducing waste to <4%.`,
      `The freed memory capacity enables 2-4x higher serving concurrency on identical HBM hardware.`,
    ],
  };
}
