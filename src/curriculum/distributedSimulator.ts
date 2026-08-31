/**
 * Distributed Training Topology & Communication Simulator
 * Systems-grade modeling for 3D Parallelism (TP, PP, DP), ZeRO Memory Sharding, and MoE All-to-All Collectives.
 */

export type ZeROStage = 0 | 1 | 2 | 3;

/**
 * Cluster interconnect and node topology configuration.
 */
export interface ClusterTopology {
  id: string;
  name: string;
  numNodes: number;
  gpusPerNode: number;
  totalGpus: number;
  gpuMemoryGB: number;
  intraNodeBandwidthGBs: number; // e.g. NVLink 4 (900 GB/s)
  interNodeBandwidthGbps: number; // e.g. InfiniBand 400 Gbps (50 GB/s)
  interNodeBandwidthGBs: number; // Converted to GB/s
}

/**
 * Canonical cluster hardware configurations.
 */
export const CLUSTER_TOPOLOGIES: Record<string, ClusterTopology> = {
  h100_cluster_64: {
    id: "h100_cluster_64",
    name: "64x H100 SXM5 Cluster (8 Nodes x 8 GPUs)",
    numNodes: 8,
    gpusPerNode: 8,
    totalGpus: 64,
    gpuMemoryGB: 80.0,
    intraNodeBandwidthGBs: 900.0,
    interNodeBandwidthGbps: 400.0,
    interNodeBandwidthGBs: 50.0, // 400 Gbps / 8
  },
  h100_superpod_512: {
    id: "h100_superpod_512",
    name: "512x H100 SuperPOD (64 Nodes x 8 GPUs)",
    numNodes: 64,
    gpusPerNode: 8,
    totalGpus: 512,
    gpuMemoryGB: 80.0,
    intraNodeBandwidthGBs: 900.0,
    interNodeBandwidthGbps: 800.0,
    interNodeBandwidthGBs: 100.0, // 800 Gbps NDR200
  },
  a100_cluster_32: {
    id: "a100_cluster_32",
    name: "32x A100 80GB Cluster (4 Nodes x 8 GPUs)",
    numNodes: 4,
    gpusPerNode: 8,
    totalGpus: 32,
    gpuMemoryGB: 80.0,
    intraNodeBandwidthGBs: 600.0,
    interNodeBandwidthGbps: 200.0,
    interNodeBandwidthGBs: 25.0, // 200 Gbps HDR
  },
};

/**
 * Dense & MoE Transformer Architecture configuration.
 */
export interface ModelArchitectureConfig {
  id: string;
  name: string;
  numParameters: number; // Total parameter count Phi
  numLayers: number;
  hiddenDimension: number;
  numAttentionHeads: number;
  numKvHeads: number;
  vocabSize: number;
  isMoE?: boolean;
  numExperts?: number;
  topKExperts?: number;
}

/**
 * Standard open foundation model configurations.
 */
export const MODEL_ARCHITECTURES: Record<string, ModelArchitectureConfig> = {
  llama3_8b: {
    id: "llama3_8b",
    name: "Llama-3-8B",
    numParameters: 8.03e9,
    numLayers: 32,
    hiddenDimension: 4096,
    numAttentionHeads: 32,
    numKvHeads: 8,
    vocabSize: 128256,
  },
  llama3_70b: {
    id: "llama3_70b",
    name: "Llama-3-70B",
    numParameters: 70.6e9,
    numLayers: 80,
    hiddenDimension: 8192,
    numAttentionHeads: 64,
    numKvHeads: 8,
    vocabSize: 128256,
  },
  llama3_405b: {
    id: "llama3_405b",
    name: "Llama-3-405B",
    numParameters: 405.0e9,
    numLayers: 126,
    hiddenDimension: 16384,
    numAttentionHeads: 128,
    numKvHeads: 16,
    vocabSize: 128256,
  },
  mixtral_8x7b: {
    id: "mixtral_8x7b",
    name: "Mixtral-8x7B (MoE)",
    numParameters: 46.7e9,
    numLayers: 32,
    hiddenDimension: 4096,
    numAttentionHeads: 32,
    numKvHeads: 8,
    vocabSize: 32000,
    isMoE: true,
    numExperts: 8,
    topKExperts: 2,
  },
};

/**
 * Detailed memory and communication profile for a 3D Parallelism configuration.
 */
export interface ParallelismSimulationResult {
  modelId: string;
  clusterId: string;
  tpDegree: number;
  ppDegree: number;
  dpDegree: number;
  zeroStage: ZeROStage;
  totalGpusUsed: number;
  isValidConfiguration: boolean;
  validationError?: string;

  // Memory breakdown per GPU (in GB)
  memoryPerGpuGB: {
    weights: number;
    gradients: number;
    optimizerStates: number;
    activations: number;
    totalStatic: number;
    totalPeak: number;
    fitsInGpuMemory: boolean;
    hbmUtilizationPercent: number;
  };

  // Communication volume and latency metrics
  communication: {
    tpVolumePerStepMB: number;
    tpTimePerStepMs: number;
    ppVolumePerStepMB: number;
    ppTimePerStepMs: number;
    ppBubbleFraction: number;
    dpVolumePerStepMB: number;
    dpTimePerStepMs: number;
    totalCommTimePerStepMs: number;
  };

  // Systems insights and recommendations
  insights: string[];
}

/**
 * Simulates 3D Parallelism (TP, PP, DP) and ZeRO memory partitioning across a cluster.
 */
export function simulate3DParallelism(
  model: ModelArchitectureConfig,
  cluster: ClusterTopology,
  options: {
    tpDegree: number;
    ppDegree: number;
    dpDegree: number;
    numMicrobatches: number;
    microbatchSize: number;
    seqLen: number;
    zeroStage: ZeROStage;
    activationCheckpointing: boolean;
  },
): ParallelismSimulationResult {
  const {
    tpDegree,
    ppDegree,
    dpDegree,
    numMicrobatches,
    microbatchSize,
    seqLen,
    zeroStage,
    activationCheckpointing,
  } = options;

  const totalGpusUsed = tpDegree * ppDegree * dpDegree;
  const Phi = model.numParameters;
  const layers = model.numLayers;
  const H = model.hiddenDimension;

  // Validation
  if (totalGpusUsed > cluster.totalGpus) {
    return {
      modelId: model.id,
      clusterId: cluster.id,
      tpDegree,
      ppDegree,
      dpDegree,
      zeroStage,
      totalGpusUsed,
      isValidConfiguration: false,
      validationError: `Required GPUs (${totalGpusUsed}) exceeds cluster capacity (${cluster.totalGpus}).`,
      memoryPerGpuGB: {
        weights: 0,
        gradients: 0,
        optimizerStates: 0,
        activations: 0,
        totalStatic: 0,
        totalPeak: 0,
        fitsInGpuMemory: false,
        hbmUtilizationPercent: 0,
      },
      communication: {
        tpVolumePerStepMB: 0,
        tpTimePerStepMs: 0,
        ppVolumePerStepMB: 0,
        ppTimePerStepMs: 0,
        ppBubbleFraction: 0,
        dpVolumePerStepMB: 0,
        dpTimePerStepMs: 0,
        totalCommTimePerStepMs: 0,
      },
      insights: ["Configuration exceeds physical GPU resources."],
    };
  }

  // 1. Memory Accounting (in Bytes)
  // Base FP16 weight per GPU = 2 bytes * Phi / (TP * PP)
  const tpPpDivisor = tpDegree * ppDegree;

  let weightsBytes: number;
  let gradientsBytes: number;
  let optimizerBytes: number;

  if (zeroStage === 0) {
    // ZeRO-None / ZeRO-0: Full replication across DP
    weightsBytes = (2 * Phi) / tpPpDivisor;
    gradientsBytes = (2 * Phi) / tpPpDivisor;
    optimizerBytes = (12 * Phi) / tpPpDivisor; // 4B master weights + 4B momentum + 4B variance
  } else if (zeroStage === 1) {
    // ZeRO-1: Optimizer states partitioned across DP
    weightsBytes = (2 * Phi) / tpPpDivisor;
    gradientsBytes = (2 * Phi) / tpPpDivisor;
    optimizerBytes = (12 * Phi) / (tpPpDivisor * dpDegree);
  } else if (zeroStage === 2) {
    // ZeRO-2: Gradients + Optimizer states partitioned across DP
    weightsBytes = (2 * Phi) / tpPpDivisor;
    gradientsBytes = (2 * Phi) / (tpPpDivisor * dpDegree);
    optimizerBytes = (12 * Phi) / (tpPpDivisor * dpDegree);
  } else {
    // ZeRO-3: Weights + Gradients + Optimizer states partitioned across DP
    weightsBytes = (2 * Phi) / (tpPpDivisor * dpDegree);
    gradientsBytes = (2 * Phi) / (tpPpDivisor * dpDegree);
    optimizerBytes = (12 * Phi) / (tpPpDivisor * dpDegree);
  }

  // 2. Activation Memory Accounting (Bytes per GPU)
  const layersPerGpu = Math.ceil(layers / ppDegree);
  // Full activations per layer without checkpointing: ~ 34 * b * s * h bytes (for attention + MLP)
  let activationBytesPerLayer: number;
  if (activationCheckpointing) {
    // Recomputation stores only layer input activations: 2 * b * s * h bytes
    activationBytesPerLayer = (2 * microbatchSize * seqLen * H * 2) / tpDegree;
  } else {
    // Full intermediate storage: ~ (34 * b * s * h) / TP
    activationBytesPerLayer = (34 * microbatchSize * seqLen * H * 2) / tpDegree;
  }
  const activationBytes = activationBytesPerLayer * layersPerGpu * (ppDegree > 1 ? ppDegree : 1);

  const bytesToGB = (b: number) => Math.round((b / (1024 * 1024 * 1024)) * 100) / 100;
  const weightsGB = bytesToGB(weightsBytes);
  const gradientsGB = bytesToGB(gradientsBytes);
  const optimizerGB = bytesToGB(optimizerBytes);
  const activationsGB = bytesToGB(activationBytes);

  const totalStaticGB = Math.round((weightsGB + gradientsGB + optimizerGB) * 100) / 100;
  const totalPeakGB = Math.round((totalStaticGB + activationsGB) * 100) / 100;
  const fitsInGpuMemory = totalPeakGB <= cluster.gpuMemoryGB;
  const hbmUtilizationPercent = Math.round((totalPeakGB / cluster.gpuMemoryGB) * 1000) / 10;

  // 3. Communication Breakdown
  // TP All-Reduce: 2 * layers * 2 * (TP-1)/TP * (b * s * h * 2) over intra-node NVLink per microbatch
  const tpAllReduceBytesPerMicrobatch =
    tpDegree > 1
      ? 2 * layers * 2 * ((tpDegree - 1) / tpDegree) * (microbatchSize * seqLen * H * 2)
      : 0;
  const tpVolumeTotalMB =
    Math.round(((tpAllReduceBytesPerMicrobatch * numMicrobatches) / (1024 * 1024)) * 10) / 10;
  const tpTimeMs =
    tpDegree > 1
      ? Math.round(
          ((tpAllReduceBytesPerMicrobatch * numMicrobatches) /
            (cluster.intraNodeBandwidthGBs * 1e9)) *
            1000 *
            10,
        ) / 10
      : 0;

  // PP P2P Transfer: 2 * b * s * h * 2 bytes per microbatch across stages
  const ppP2PBytesPerMicrobatch = ppDegree > 1 ? microbatchSize * seqLen * H * 2 : 0;
  const ppVolumeTotalMB =
    Math.round(((ppP2PBytesPerMicrobatch * numMicrobatches) / (1024 * 1024)) * 10) / 10;
  const ppTimeMs =
    ppDegree > 1
      ? Math.round(
          ((ppP2PBytesPerMicrobatch * numMicrobatches) / (cluster.interNodeBandwidthGBs * 1e9)) *
            1000 *
            10,
        ) / 10
      : 0;
  const ppBubbleFraction =
    ppDegree > 1 ? Math.round(((ppDegree - 1) / (numMicrobatches + ppDegree - 1)) * 1000) / 10 : 0;

  // DP Gradient All-Reduce (or ZeRO-3 All-Gather): 2 * (DP-1)/DP * (2 * Phi / (TP * PP)) bytes over inter-node
  const dpCollectiveBytes =
    dpDegree > 1 ? 2 * ((dpDegree - 1) / dpDegree) * ((2 * Phi) / tpPpDivisor) : 0;
  const dpVolumeTotalMB = Math.round((dpCollectiveBytes / (1024 * 1024)) * 10) / 10;
  const dpTimeMs =
    dpDegree > 1
      ? Math.round((dpCollectiveBytes / (cluster.interNodeBandwidthGBs * 1e9)) * 1000 * 10) / 10
      : 0;

  const totalCommTimeMs = Math.round((tpTimeMs + ppTimeMs + dpTimeMs) * 10) / 10;

  // 4. Insights Generation
  const insights: string[] = [];
  if (!fitsInGpuMemory) {
    insights.push(
      `🚨 Out of Memory (OOM): Required memory (${totalPeakGB} GB) exceeds ${cluster.gpuMemoryGB} GB GPU capacity. Increase ZeRO stage, TP degree, or enable activation checkpointing.`,
    );
  } else {
    insights.push(
      `✅ Memory Valid: Peak allocation is ${totalPeakGB} GB (${hbmUtilizationPercent}% HBM capacity).`,
    );
  }

  if (tpDegree > cluster.gpusPerNode) {
    insights.push(
      `⚠️ Cross-Node Tensor Parallelism: TP=${tpDegree} exceeds intra-node GPU count (${cluster.gpusPerNode}), forcing high-frequency TP All-Reduces over slower inter-node interconnect.`,
    );
  }

  if (ppBubbleFraction > 20) {
    insights.push(
      `⚠️ High Pipeline Bubble: Bubble fraction is ${ppBubbleFraction}%. Increase microbatch count (M=${numMicrobatches}) to improve 1F1B efficiency.`,
    );
  }

  if (zeroStage === 3) {
    insights.push(
      `💡 ZeRO-3 Parameter Sharding reduces model memory footprint by ${dpDegree}x across DP ranks, replacing backward All-Reduce with forward & backward parameter All-Gathers.`,
    );
  }

  return {
    modelId: model.id,
    clusterId: cluster.id,
    tpDegree,
    ppDegree,
    dpDegree,
    zeroStage,
    totalGpusUsed,
    isValidConfiguration: true,
    memoryPerGpuGB: {
      weights: weightsGB,
      gradients: gradientsGB,
      optimizerStates: optimizerGB,
      activations: activationsGB,
      totalStatic: totalStaticGB,
      totalPeak: totalPeakGB,
      fitsInGpuMemory,
      hbmUtilizationPercent,
    },
    communication: {
      tpVolumePerStepMB: tpVolumeTotalMB,
      tpTimePerStepMs: tpTimeMs,
      ppVolumePerStepMB: ppVolumeTotalMB,
      ppTimePerStepMs: ppTimeMs,
      ppBubbleFraction,
      dpVolumePerStepMB: dpVolumeTotalMB,
      dpTimePerStepMs: dpTimeMs,
      totalCommTimePerStepMs: totalCommTimeMs,
    },
    insights,
  };
}

/**
 * Mixture-of-Experts (MoE) All-to-All Dispatch Simulation Result.
 */
export interface MoEDispatchResult {
  totalTokens: number;
  numExperts: number;
  topK: number;
  capacityFactor: number;
  expertCapacity: number;
  expertParallelDegree: number;
  droppedTokensCount: number;
  dropRatePercent: number;
  allToAllVolumeMB: number;
  allToAllTimeMs: number;
  insights: string[];
}

/**
 * Simulates MoE token dispatch, expert buffer capacity overflows, and All-to-All collective latency.
 */
export function simulateMoEDispatch(
  totalTokens: number,
  numExperts: number,
  topK: number,
  capacityFactor: number,
  hiddenDimension: number,
  expertParallelDegree: number,
  cluster: ClusterTopology,
): MoEDispatchResult {
  // Average tokens expected per expert = (totalTokens * topK) / numExperts
  const expectedTokensPerExpert = (totalTokens * topK) / numExperts;
  const expertCapacity = Math.ceil(expectedTokensPerExpert * capacityFactor);

  // Simulated Poisson / Zipf load imbalance: peak expert receives ~ 1.6x average tokens
  const peakTokensAssigned = Math.round(expectedTokensPerExpert * 1.6);
  const droppedPerOverloadedExpert = Math.max(0, peakTokensAssigned - expertCapacity);
  // Estimate 2 out of E experts get overloaded in skewed routing
  const droppedTokensCount = droppedPerOverloadedExpert * Math.min(2, Math.floor(numExperts / 4));
  const dropRatePercent = Math.round((droppedTokensCount / (totalTokens * topK)) * 1000) / 10;

  // All-to-All Collective Volume: 2 (dispatch + combine) * tokens * hidden_dim * 2 bytes * (EP-1)/EP
  const epDivisor = Math.max(1, expertParallelDegree);
  const allToAllBytes =
    epDivisor > 1
      ? 2 * totalTokens * topK * hiddenDimension * 2 * ((epDivisor - 1) / epDivisor)
      : 0;

  const allToAllVolumeMB = Math.round((allToAllBytes / (1024 * 1024)) * 10) / 10;
  const bandwidth =
    epDivisor <= cluster.gpusPerNode
      ? cluster.intraNodeBandwidthGBs
      : cluster.interNodeBandwidthGBs;
  const allToAllTimeMs =
    epDivisor > 1 ? Math.round((allToAllBytes / (bandwidth * 1e9)) * 1000 * 10) / 10 : 0;

  const insights: string[] = [
    `Expert buffer capacity per expert: ${expertCapacity} tokens (Capacity Factor = ${capacityFactor}).`,
    `Token drop rate due to expert imbalance: ${dropRatePercent}% (${droppedTokensCount} tokens dropped).`,
    `All-to-All communication volume: ${allToAllVolumeMB} MB per layer across EP=${expertParallelDegree} ranks (${allToAllTimeMs} ms over ${bandwidth} GB/s bus).`,
  ];

  if (dropRatePercent > 5.0) {
    insights.push(
      `🚨 High Token Drop Rate: Capacity factor (${capacityFactor}) is too low for skewed routing logits. Increase capacity factor to 1.5 or apply auxiliary load balancing loss.`,
    );
  }

  return {
    totalTokens,
    numExperts,
    topK,
    capacityFactor,
    expertCapacity,
    expertParallelDegree,
    droppedTokensCount,
    dropRatePercent,
    allToAllVolumeMB,
    allToAllTimeMs,
    insights,
  };
}
