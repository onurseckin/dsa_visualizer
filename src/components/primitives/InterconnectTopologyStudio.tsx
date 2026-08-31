import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ============================================================================
// 1. TYPES & INTERFACES
// ============================================================================

export type TopologyType = "fat_tree" | "nvlink_mesh" | "nvswitch" | "torus_3d" | "dragonfly_plus";

export type LinkTechId =
  | "nvlink_4"
  | "nvswitch_3"
  | "infiniband_ndr_400"
  | "rocev2_400"
  | "pcie_gen5";

export type CollectiveAlgorithmId =
  | "ring_allreduce"
  | "tree_allreduce"
  | "recursive_halving_allreduce"
  | "all_to_all"
  | "allgather"
  | "reduce_scatter"
  | "broadcast";

export type ChunkStatus = "initial" | "sending" | "receiving" | "reduced" | "complete";

export interface LinkTechnology {
  id: LinkTechId;
  name: string;
  category: "intra_node" | "inter_node" | "bus";
  bandwidthGBs: number; // Bandwidth in GB/s per port/endpoint
  bandwidthGbps: number; // Bandwidth in Gbps
  latencyMicroseconds: number; // Hardware base latency alpha in µs
  bidirectional: boolean;
  description: string;
  typicalUse: string;
}

export interface TopologyConfig {
  type: TopologyType;
  name: string;
  shortName: string;
  description: string;
  oversubscriptionRatio?: number;
  gpusPerNode?: number;
  dimensions?: [number, number, number];
  numGroups?: number;
}

export interface CollectiveAlgorithmConfig {
  id: CollectiveAlgorithmId;
  name: string;
  shortName: string;
  description: string;
  communicationPattern: string;
  stepsFormulaDescription: string;
  volumeFormulaDescription: string;
  isBandwidthOptimal: boolean;
  isLatencyOptimal: boolean;
}

export interface HockneyLatencyBreakdown {
  totalLatencyMs: number;
  startupLatencyMs: number; // Alpha component
  transferLatencyMs: number; // Beta component
  startupLatencyMicroseconds: number;
  transferLatencyMicroseconds: number;
  alphaFraction: number; // 0.0 to 1.0
  betaFraction: number; // 0.0 to 1.0
  effectiveBandwidthGBs: number; // Algorithmic volume / total time
  theoreticalMinLatencyMs: number;
  scalingEfficiency: number; // 0 to 100 (%)
  numSteps: number;
  totalBytesTransferred: number;
  transferredPerRankBytes: number;
  averageHopCount: number;
  networkDiameter: number;
  bisectionBandwidthGBs: number;
  bisectionBandwidthTBps: number;
  isBisectionBottlenecked: boolean;
}

export interface CollectivePacketTransfer {
  fromRank: number;
  toRank: number;
  chunkIndex: number;
  chunkLabel: string;
  color: string;
}

export interface RankChunkState {
  chunkId: number;
  status: ChunkStatus;
  valueLabel: string;
  color: string;
}

export interface RankState {
  rank: number;
  gpuId: number;
  nodeId: number;
  chunks: RankChunkState[];
}

export interface CollectiveStep {
  stepIndex: number;
  phase: string;
  phaseType:
    | "scatter_reduce"
    | "allgather"
    | "direct_exchange"
    | "halving"
    | "doubling"
    | "broadcast"
    | "idle"
    | "initial"
    | "completed";
  description: string;
  formulaSnippet: string;
  transfers: CollectivePacketTransfer[];
  rankStates: RankState[];
}

export interface PresetConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  topologyType: TopologyType;
  linkTechId: LinkTechId;
  collectiveId: CollectiveAlgorithmId;
  numGpus: number;
  gpusPerNode: number;
  payloadBytes: number;
  oversubscriptionRatio: number;
  dimensions?: [number, number, number];
}

export interface InterconnectTopologyStudioProps {
  initialPreset?: string;
  initialTopology?: TopologyType;
  initialLinkTech?: LinkTechId;
  initialCollective?: CollectiveAlgorithmId;
  initialGpus?: number;
  initialPayloadMB?: number;
  title?: string;
  className?: string;
}

// ============================================================================
// 2. CONSTANTS & SPECIFICATIONS
// ============================================================================

export const LINK_TECHNOLOGIES: Record<LinkTechId, LinkTechnology> = {
  nvlink_4: {
    id: "nvlink_4",
    name: "NVLink 4 (SXM5)",
    category: "intra_node",
    bandwidthGBs: 900.0,
    bandwidthGbps: 7200.0,
    latencyMicroseconds: 0.8,
    bidirectional: true,
    description: "900 GB/s bidirectional interconnect per GPU. 18 NVLink-4 links per H100 GPU.",
    typicalUse: "Intra-node GPU-to-GPU mesh and NVSwitch links on DGX/HGX H100 systems.",
  },
  nvswitch_3: {
    id: "nvswitch_3",
    name: "NVSwitch 3 Fabric",
    category: "intra_node",
    bandwidthGBs: 900.0,
    bandwidthGbps: 7200.0,
    latencyMicroseconds: 0.5,
    bidirectional: true,
    description:
      "3.2 TB/s aggregate bidirectional switching per NVSwitch chip (900 GB/s per GPU endpoint).",
    typicalUse: "Full-crossbar intra-node non-blocking fabric connecting 8 SXM5 GPUs.",
  },
  infiniband_ndr_400: {
    id: "infiniband_ndr_400",
    name: "InfiniBand NDR 400G",
    category: "inter_node",
    bandwidthGBs: 50.0,
    bandwidthGbps: 400.0,
    latencyMicroseconds: 1.5,
    bidirectional: true,
    description: "400 Gbps (50 GB/s) per port with hardware SHARP v3 in-network tree reduction.",
    typicalUse: "Rail-optimized inter-node fabric in AI supercomputers and SuperPOD clusters.",
  },
  rocev2_400: {
    id: "rocev2_400",
    name: "RoCEv2 400GbE",
    category: "inter_node",
    bandwidthGBs: 50.0,
    bandwidthGbps: 400.0,
    latencyMicroseconds: 2.2,
    bidirectional: true,
    description: "400 Gbps RDMA over Converged Ethernet v2 with PFC and ECN congestion management.",
    typicalUse: "Hyperscale cloud clusters, 3D Torus HPC fabrics, and multi-tenant AI backbones.",
  },
  pcie_gen5: {
    id: "pcie_gen5",
    name: "PCIe Gen5 x16",
    category: "bus",
    bandwidthGBs: 64.0,
    bandwidthGbps: 512.0,
    latencyMicroseconds: 2.5,
    bidirectional: true,
    description:
      "64 GB/s unidirectional / 128 GB/s bidirectional peak host-to-device and peer-to-peer bus.",
    typicalUse: "PCIe-based GPU servers and CPU-GPU gradient offloading.",
  },
};

export const COLLECTIVE_ALGORITHMS: Record<CollectiveAlgorithmId, CollectiveAlgorithmConfig> = {
  ring_allreduce: {
    id: "ring_allreduce",
    name: "Ring AllReduce",
    shortName: "Ring AR",
    description:
      "Two-phase ring collective: 1) Scatter-Reduce and 2) AllGather across a logical 1D ring. Optimal for large tensor payloads.",
    communicationPattern:
      "Nearest neighbor ring pipeline: rank r sends to (r+1) % P and receives from (r-1+P) % P.",
    stepsFormulaDescription: "2 · (P - 1)",
    volumeFormulaDescription: "2 · (P - 1)/P · S",
    isBandwidthOptimal: true,
    isLatencyOptimal: false,
  },
  tree_allreduce: {
    id: "tree_allreduce",
    name: "Binomial Tree AllReduce",
    shortName: "Tree AR",
    description:
      "Hierarchical binary/binomial reduction tree followed by broadcast tree. Optimal for small tensors or latency-sensitive barriers.",
    communicationPattern:
      "Logarithmic binomial tree hierarchy with distance doubling at each step.",
    stepsFormulaDescription: "2 · ⌈log₂(P)⌉",
    volumeFormulaDescription: "2 · ⌈log₂(P)⌉ · S",
    isBandwidthOptimal: false,
    isLatencyOptimal: true,
  },
  recursive_halving_allreduce: {
    id: "recursive_halving_allreduce",
    name: "Recursive Halving & Doubling",
    shortName: "Rabenseifner AR",
    description:
      "Rabenseifner's algorithm: Distance-doubling ReduceScatter followed by distance-halving AllGather. Combines logarithmic steps with minimal data volume.",
    communicationPattern: "Hypercube partner exchanges with halved chunk sizes at each step.",
    stepsFormulaDescription: "2 · ⌈log₂(P)⌉",
    volumeFormulaDescription: "2 · (P - 1)/P · S",
    isBandwidthOptimal: true,
    isLatencyOptimal: true,
  },
  all_to_all: {
    id: "all_to_all",
    name: "All-to-All Personalized",
    shortName: "All-to-All",
    description:
      "Every rank transmits a distinct, unique partition to every other rank. Crucial for Mixture-of-Experts (MoE) token dispatch and tensor transposition.",
    communicationPattern: "Pairwise shift permutation or full-mesh all-to-all exchange.",
    stepsFormulaDescription: "P - 1",
    volumeFormulaDescription: "(P - 1)/P · S",
    isBandwidthOptimal: true,
    isLatencyOptimal: false,
  },
  allgather: {
    id: "allgather",
    name: "AllGather",
    shortName: "AllGather",
    description:
      "Gathers localized chunks from all ranks so that every rank reconstructs the concatenated full payload. Core collective for FSDP / ZeRO-3 forward pass.",
    communicationPattern: "Ring or bucket gathering pipeline where each chunk traverses P-1 hops.",
    stepsFormulaDescription: "P - 1",
    volumeFormulaDescription: "(P - 1)/P · S",
    isBandwidthOptimal: true,
    isLatencyOptimal: false,
  },
  reduce_scatter: {
    id: "reduce_scatter",
    name: "ReduceScatter",
    shortName: "ReduceScatter",
    description:
      "Reduces elementwise inputs across all ranks and scatters the result so each rank retains 1/P of the reduced tensor. Core collective for FSDP / ZeRO-2 backward pass.",
    communicationPattern: "Ring reduction pipeline where each rank sums arriving chunks.",
    stepsFormulaDescription: "P - 1",
    volumeFormulaDescription: "(P - 1)/P · S",
    isBandwidthOptimal: true,
    isLatencyOptimal: false,
  },
  broadcast: {
    id: "broadcast",
    name: "Broadcast",
    shortName: "Broadcast",
    description: "Root rank 0 replicates its entire tensor payload to all P-1 participating ranks.",
    communicationPattern: "Binomial tree distribution or pipelined ring dissemination.",
    stepsFormulaDescription: "⌈log₂(P)⌉",
    volumeFormulaDescription: "S",
    isBandwidthOptimal: false,
    isLatencyOptimal: true,
  },
};

export const TOPOLOGY_PRESETS: Record<string, PresetConfig> = {
  h100_superpod_512: {
    id: "h100_superpod_512",
    name: "H100 SuperPOD (512 GPUs)",
    subtitle: "64 Nodes × 8 H100 SXM5 with 2-Tier NDR 400G InfiniBand Clos Fabric",
    description:
      "Industry-standard hyperscale training topology. Features 8x NVLink-4 inside each node (900 GB/s) and 8x NDR 400G rail-optimized InfiniBand adapters per node for non-blocking leaf-spine inter-node fabric.",
    topologyType: "fat_tree",
    linkTechId: "infiniband_ndr_400",
    collectiveId: "ring_allreduce",
    numGpus: 512,
    gpusPerNode: 8,
    payloadBytes: 4 * 1024 * 1024 * 1024, // 4 GB (typical gradient bucket for 70B+ LLM)
    oversubscriptionRatio: 1.0,
  },
  dgx_cluster_64: {
    id: "dgx_cluster_64",
    name: "DGX H100 Cluster (64 GPUs)",
    subtitle: "8 Nodes × 8 GPUs with Full NVLink & InfiniBand NDR Backbone",
    description:
      "Mid-sized distributed cluster. Excellent for 3D parallelism (TP=8 intra-node, PP=2, DP=4 inter-node) and ZeRO-3 optimizer sharding.",
    topologyType: "fat_tree",
    linkTechId: "infiniband_ndr_400",
    collectiveId: "ring_allreduce",
    numGpus: 64,
    gpusPerNode: 8,
    payloadBytes: 1024 * 1024 * 1024, // 1 GB
    oversubscriptionRatio: 1.0,
  },
  nvlink_mesh_hgx_8: {
    id: "nvlink_mesh_hgx_8",
    name: "HGX H100 NVLink Mesh (8 GPUs)",
    subtitle: "8 × H100 SXM5 GPUs in Direct All-to-All NVLink Mesh",
    description:
      "Ultra-high-throughput intra-node topology. Each SXM5 GPU provides 18 NVLink-4 connections directly linked across all neighbor GPUs for 900 GB/s bandwidth with sub-microsecond latency.",
    topologyType: "nvlink_mesh",
    linkTechId: "nvlink_4",
    collectiveId: "ring_allreduce",
    numGpus: 8,
    gpusPerNode: 8,
    payloadBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    oversubscriptionRatio: 1.0,
  },
  nvswitch_fabric_64: {
    id: "nvswitch_fabric_64",
    name: "DGX SuperPOD NVSwitch Fabric (64 GPUs)",
    subtitle: "8 DGX Nodes Interconnected via External NVSwitch Spine Fabric",
    description:
      "Full hardware crossbar interconnect scaling up to 64 GPUs. Every GPU communicates with any other GPU across the fabric at full 900 GB/s NVLink speed in uniform 2 hops.",
    topologyType: "nvswitch",
    linkTechId: "nvswitch_3",
    collectiveId: "recursive_halving_allreduce",
    numGpus: 64,
    gpusPerNode: 8,
    payloadBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    oversubscriptionRatio: 1.0,
  },
  torus_3d_256: {
    id: "torus_3d_256",
    name: "3D Torus HPC (256 GPUs)",
    subtitle: "8 × 8 × 4 Toroidal Mesh with Wrap-Around Direct Interconnects",
    description:
      "Direct-network topology without dedicated spine switches. Packets route in X, Y, and Z coordinate dimensions with wrap-around boundaries. High local bisection with low cabling overhead.",
    topologyType: "torus_3d",
    linkTechId: "rocev2_400",
    collectiveId: "tree_allreduce",
    numGpus: 256,
    gpusPerNode: 4,
    payloadBytes: 2 * 1024 * 1024 * 1024, // 2 GB
    oversubscriptionRatio: 1.0,
    dimensions: [8, 8, 4],
  },
  dragonfly_hyperscale_512: {
    id: "dragonfly_hyperscale_512",
    name: "Dragonfly+ Hyperscale (512 GPUs)",
    subtitle: "16 Autonomous Groups × 32 GPUs with High-Radix Optical Trunks",
    description:
      "Hierarchical direct topology featuring 2-tier intra-group routers connected via all-to-all global optical links across groups. Extremely cost-effective for multi-rack hyperscale clusters.",
    topologyType: "dragonfly_plus",
    linkTechId: "infiniband_ndr_400",
    collectiveId: "allgather",
    numGpus: 512,
    gpusPerNode: 8,
    payloadBytes: 1024 * 1024 * 1024, // 1 GB
    oversubscriptionRatio: 1.0,
    dimensions: [16, 4, 8],
  },
  moe_ep_64: {
    id: "moe_ep_64",
    name: "MoE EP All-to-All (64 GPUs)",
    subtitle: "Mixture-of-Experts Token Dispatch & Combine Routing Cluster",
    description:
      "High-stress collective benchmarking for Expert Parallelism (EP). Evaluates non-blocking bisection throughput for all-to-all token routing across 64 GPUs.",
    topologyType: "fat_tree",
    linkTechId: "nvlink_4",
    collectiveId: "all_to_all",
    numGpus: 64,
    gpusPerNode: 8,
    payloadBytes: 512 * 1024 * 1024, // 512 MB
    oversubscriptionRatio: 1.0,
  },
};

// ============================================================================
// 3. CORE MATHEMATICAL & TOPOLOGICAL FUNCTIONS
// ============================================================================

/**
 * Computes network bisection bandwidth in GB/s for different topologies.
 */
export function computeBisectionBandwidth(
  topology: TopologyType,
  numGpus: number,
  linkBandwidthGBs: number,
  options?: {
    oversubscription?: number;
    dimensions?: [number, number, number];
    numGroups?: number;
  },
): number {
  if (numGpus <= 1) return 0;
  const oversubscription = Math.max(1.0, options?.oversubscription ?? 1.0);

  switch (topology) {
    case "fat_tree": {
      // In a non-blocking fat-tree, bisection bandwidth is (N / 2) * LinkBandwidth
      // Oversubscription reduces the bisection capacity proportionally
      const rawBisection = (numGpus / 2) * linkBandwidthGBs;
      return rawBisection / oversubscription;
    }
    case "nvlink_mesh": {
      // Direct point-to-point mesh / hybrid ring-mesh interconnect
      // For an N-GPU direct mesh, bisection cuts across direct links: (N / 2) * LinkBW * 0.75
      const rawBisection = (numGpus / 2) * linkBandwidthGBs * 0.75;
      return rawBisection / oversubscription;
    }
    case "nvswitch": {
      // Non-blocking centralized crossbar NVSwitch fabric: (N / 2) * LinkBandwidth
      const rawBisection = (numGpus / 2) * linkBandwidthGBs;
      return rawBisection / oversubscription;
    }
    case "torus_3d": {
      // For a 3D Torus of dimensions [Dx, Dy, Dz], cutting across the minimum plane
      // severs 2 * min(Dx*Dy, Dy*Dz, Dx*Dz) bidirectional links (with wrap-around)
      let dims: [number, number, number] = options?.dimensions ?? [
        Math.round(Math.cbrt(numGpus)),
        Math.round(Math.cbrt(numGpus)),
        Math.max(1, Math.round(numGpus / (Math.cbrt(numGpus) * Math.cbrt(numGpus)))),
      ];
      // Adjust if product doesn't match
      if (dims[0] * dims[1] * dims[2] !== numGpus) {
        const d = Math.max(2, Math.round(Math.cbrt(numGpus)));
        dims = [d, d, Math.max(1, Math.round(numGpus / (d * d)))];
      }
      const [dx, dy, dz] = dims;
      const minCrossSection = Math.min(dx * dy, dy * dz, dx * dz);
      // In a torus with bidirectional channels, a bisection cut severs 2 * minCrossSection links in each direction
      const rawBisection = 2 * minCrossSection * 2 * linkBandwidthGBs;
      return rawBisection / oversubscription;
    }
    case "dragonfly_plus": {
      // Balanced Dragonfly+ bisection is proportional to group count g and inter-group global channels
      return (numGpus / 4) * linkBandwidthGBs * (1 / oversubscription);
    }
    default:
      return (numGpus / 2) * linkBandwidthGBs;
  }
}

/**
 * Computes average hop count and network diameter for a topology.
 */
export function computeTopologyHopCount(
  topology: TopologyType,
  numGpus: number,
  options?: {
    gpusPerNode?: number;
    dimensions?: [number, number, number];
    numGroups?: number;
  },
): { averageHopCount: number; diameter: number } {
  if (numGpus <= 1) {
    return { averageHopCount: 0, diameter: 0 };
  }

  const gpusPerNode = options?.gpusPerNode ?? 8;

  switch (topology) {
    case "fat_tree": {
      // 2-tier (Leaf + Spine) for <= 256 GPUs, 3-tier (Leaf + Spine + Core) for larger
      const is3Tier = numGpus > 256;
      const diameter = is3Tier ? 6 : 4;

      // Fraction of traffic that stays within the same leaf node vs going through spine/core
      const pLocal = Math.max(0, (gpusPerNode - 1) / (numGpus - 1));
      const pInter = 1.0 - pLocal;

      // Intra-node: 1-2 hops. Spine: 4 hops. Core: 6 hops.
      let avgHops = 0;
      if (!is3Tier) {
        avgHops = 2 * pLocal + 4 * pInter;
      } else {
        const pSpinePod = pInter * 0.35;
        const pCore = pInter * 0.65;
        avgHops = 2 * pLocal + 4 * pSpinePod + 6 * pCore;
      }
      return { averageHopCount: Number(avgHops.toFixed(2)), diameter };
    }
    case "nvlink_mesh": {
      // Direct NVLink mesh between GPUs
      // For 8 GPUs in HGX: direct mesh has 1 hop direct or 2 hops via neighbor
      const diameter = numGpus <= 8 ? 2 : 3;
      const avgHops =
        numGpus <= 8 ? 1.35 : Number(Math.max(1.2, Math.log2(numGpus) * 0.5).toFixed(2));
      return { averageHopCount: avgHops, diameter };
    }
    case "nvswitch": {
      // Centralized NVSwitch Crossbar: Every GPU reaches every other GPU in uniform 2 hops (GPU -> Switch -> GPU)
      return { averageHopCount: 2.0, diameter: 2 };
    }
    case "torus_3d": {
      let [dx, dy, dz] = options?.dimensions ?? [
        Math.round(Math.cbrt(numGpus)),
        Math.round(Math.cbrt(numGpus)),
        Math.max(1, Math.round(numGpus / (Math.cbrt(numGpus) * Math.cbrt(numGpus)))),
      ];
      if (dx * dy * dz !== numGpus) {
        const d = Math.max(2, Math.round(Math.cbrt(numGpus)));
        dx = d;
        dy = d;
        dz = Math.max(1, Math.round(numGpus / (d * d)));
      }
      // In a torus with wrap-around, max hops along dimension D is floor(D / 2), average hops is D / 4
      const avgHops = dx / 4 + dy / 4 + dz / 4;
      const diameter = Math.floor(dx / 2) + Math.floor(dy / 2) + Math.floor(dz / 2);
      return { averageHopCount: Number(avgHops.toFixed(2)), diameter };
    }
    case "dragonfly_plus": {
      // Dragonfly+ with minimal routing has diameter 3 (Leaf -> Spine -> Remote Spine -> Remote Leaf)
      // With non-minimal UGAL/Valiant routing, diameter is 5
      const avgHops = numGpus <= 64 ? 3.1 : 3.85;
      return { averageHopCount: avgHops, diameter: 5 };
    }
    default:
      return { averageHopCount: 3.0, diameter: 4 };
  }
}

/**
 * Computes Hockney alpha-beta latency breakdown: T = alpha_total + beta * S_effective
 */
export function computeHockneyLatency(params: {
  algorithm: CollectiveAlgorithmId;
  numRanks: number;
  payloadBytes: number;
  linkBandwidthGBs: number;
  alphaLatencyMicroseconds: number;
  hopCount?: number;
  bisectionBandwidthGBs?: number;
  oversubscriptionRatio?: number;
}): HockneyLatencyBreakdown {
  const {
    algorithm,
    numRanks,
    payloadBytes,
    linkBandwidthGBs,
    alphaLatencyMicroseconds,
    hopCount = 3.0,
    oversubscriptionRatio = 1.0,
  } = params;

  if (numRanks <= 1 || payloadBytes <= 0) {
    return {
      totalLatencyMs: 0,
      startupLatencyMs: 0,
      transferLatencyMs: 0,
      startupLatencyMicroseconds: 0,
      transferLatencyMicroseconds: 0,
      alphaFraction: 0,
      betaFraction: 0,
      effectiveBandwidthGBs: 0,
      theoreticalMinLatencyMs: 0,
      scalingEfficiency: 100,
      numSteps: 0,
      totalBytesTransferred: 0,
      transferredPerRankBytes: 0,
      averageHopCount: hopCount,
      networkDiameter: 0,
      bisectionBandwidthGBs: 0,
      bisectionBandwidthTBps: 0,
      isBisectionBottlenecked: false,
    };
  }

  const P = numRanks;
  const S = payloadBytes;
  const B_bytesPerSec = linkBandwidthGBs * 1e9; // Bandwidth in bytes/second
  const beta_secPerByte = 1.0 / B_bytesPerSec; // Seconds per byte
  const alpha_sec = alphaLatencyMicroseconds * 1e-6 * Math.max(1.0, hopCount / 2.0); // Hop-scaled alpha

  let numSteps = 0;
  let transferredPerRankBytes = 0;
  let algorithmicDataVolume = S; // Volume representing meaningful output
  let startupLatencySec = 0;
  let transferLatencySec = 0;

  switch (algorithm) {
    case "ring_allreduce": {
      // Ring AllReduce: 2*(P-1) steps, transferred data per rank = 2 * (P-1)/P * S
      numSteps = 2 * (P - 1);
      transferredPerRankBytes = ((2 * (P - 1)) / P) * S;
      algorithmicDataVolume = ((2 * (P - 1)) / P) * S;
      startupLatencySec = 2 * (P - 1) * alpha_sec;
      transferLatencySec = transferredPerRankBytes * beta_secPerByte;
      break;
    }
    case "tree_allreduce": {
      // Binomial Tree AllReduce: 2 * ceil(log2(P)) steps, full vector S sent at each step
      const treeDepth = Math.ceil(Math.log2(P));
      numSteps = 2 * treeDepth;
      transferredPerRankBytes = numSteps * S;
      algorithmicDataVolume = ((2 * (P - 1)) / P) * S;
      startupLatencySec = numSteps * alpha_sec;
      transferLatencySec = transferredPerRankBytes * beta_secPerByte;
      break;
    }
    case "recursive_halving_allreduce": {
      // Rabenseifner's Algorithm: 2 * ceil(log2(P)) steps, minimal data volume 2 * (P-1)/P * S
      const logP = Math.ceil(Math.log2(P));
      numSteps = 2 * logP;
      transferredPerRankBytes = ((2 * (P - 1)) / P) * S;
      algorithmicDataVolume = ((2 * (P - 1)) / P) * S;
      startupLatencySec = numSteps * alpha_sec;
      transferLatencySec = transferredPerRankBytes * beta_secPerByte;
      break;
    }
    case "all_to_all": {
      // All-to-All Personalized: (P-1) steps, each sends (P-1)/P * S bytes
      numSteps = P - 1;
      transferredPerRankBytes = ((P - 1) / P) * S;
      algorithmicDataVolume = ((P - 1) / P) * S;
      startupLatencySec = numSteps * alpha_sec;
      // All-to-all is heavily sensitive to bisection oversubscription
      const congestionFactor = Math.max(1.0, oversubscriptionRatio);
      transferLatencySec = transferredPerRankBytes * beta_secPerByte * congestionFactor;
      break;
    }
    case "allgather": {
      // AllGather: (P-1) steps, each sends (P-1)/P * S bytes
      numSteps = P - 1;
      transferredPerRankBytes = ((P - 1) / P) * S;
      algorithmicDataVolume = ((P - 1) / P) * S;
      startupLatencySec = numSteps * alpha_sec;
      transferLatencySec = transferredPerRankBytes * beta_secPerByte;
      break;
    }
    case "reduce_scatter": {
      // ReduceScatter: (P-1) steps, each sends (P-1)/P * S bytes
      numSteps = P - 1;
      transferredPerRankBytes = ((P - 1) / P) * S;
      algorithmicDataVolume = ((P - 1) / P) * S;
      startupLatencySec = numSteps * alpha_sec;
      transferLatencySec = transferredPerRankBytes * beta_secPerByte;
      break;
    }
    case "broadcast": {
      // Tree Broadcast: ceil(log2(P)) steps, S bytes
      const logP = Math.ceil(Math.log2(P));
      numSteps = logP;
      transferredPerRankBytes = S;
      algorithmicDataVolume = S;
      startupLatencySec = logP * alpha_sec;
      transferLatencySec = logP * S * beta_secPerByte;
      break;
    }
    default: {
      numSteps = 2 * (P - 1);
      transferredPerRankBytes = 2 * S;
      startupLatencySec = numSteps * alpha_sec;
      transferLatencySec = transferredPerRankBytes * beta_secPerByte;
    }
  }

  const totalLatencySec = startupLatencySec + transferLatencySec;
  const totalLatencyMs = totalLatencySec * 1000.0;
  const startupLatencyMs = startupLatencySec * 1000.0;
  const transferLatencyMs = transferLatencySec * 1000.0;
  const startupLatencyMicroseconds = startupLatencySec * 1e6;
  const transferLatencyMicroseconds = transferLatencySec * 1e6;

  const alphaFraction = totalLatencySec > 0 ? startupLatencySec / totalLatencySec : 0;
  const betaFraction = totalLatencySec > 0 ? transferLatencySec / totalLatencySec : 0;

  // Effective Bandwidth (GB/s): Algorithmic volume divided by total time
  const effectiveBandwidthGBs =
    totalLatencySec > 0 ? algorithmicDataVolume / 1e9 / totalLatencySec : 0;

  // Theoretical minimum latency (pure bandwidth limit with 0 startup latency)
  const theoreticalMinSec = algorithmicDataVolume * beta_secPerByte;
  const theoreticalMinLatencyMs = theoreticalMinSec * 1000.0;

  // Scaling efficiency (%)
  const scalingEfficiency =
    totalLatencySec > 0
      ? Math.min(100, Math.max(0, (theoreticalMinSec / totalLatencySec) * 100))
      : 100;

  const bisectionGBs = params.bisectionBandwidthGBs ?? (P / 2) * linkBandwidthGBs;
  const isBisectionBottlenecked = algorithm === "all_to_all" && oversubscriptionRatio > 1.2;

  return {
    totalLatencyMs: Number(totalLatencyMs.toFixed(4)),
    startupLatencyMs: Number(startupLatencyMs.toFixed(4)),
    transferLatencyMs: Number(transferLatencyMs.toFixed(4)),
    startupLatencyMicroseconds: Number(startupLatencyMicroseconds.toFixed(2)),
    transferLatencyMicroseconds: Number(transferLatencyMicroseconds.toFixed(2)),
    alphaFraction: Number(alphaFraction.toFixed(4)),
    betaFraction: Number(betaFraction.toFixed(4)),
    effectiveBandwidthGBs: Number(effectiveBandwidthGBs.toFixed(2)),
    theoreticalMinLatencyMs: Number(theoreticalMinLatencyMs.toFixed(4)),
    scalingEfficiency: Number(scalingEfficiency.toFixed(2)),
    numSteps,
    totalBytesTransferred: transferredPerRankBytes * P,
    transferredPerRankBytes,
    averageHopCount: hopCount,
    networkDiameter: Math.ceil(hopCount * 1.5),
    bisectionBandwidthGBs: bisectionGBs,
    bisectionBandwidthTBps: Number((bisectionGBs / 1000.0).toFixed(2)),
    isBisectionBottlenecked,
  };
}

/**
 * Calculates comparative latency and throughput across all collective algorithms.
 */
export function calculateAlgorithmComparison(
  numRanks: number,
  payloadBytes: number,
  linkBandwidthGBs: number,
  alphaLatencyMicroseconds: number,
  hopCount: number,
): Array<{
  algorithm: CollectiveAlgorithmConfig;
  latencyMs: number;
  startupLatencyMs: number;
  transferLatencyMs: number;
  effectiveBandwidthGBs: number;
  numSteps: number;
  scalingEfficiency: number;
}> {
  const algoKeys = Object.keys(COLLECTIVE_ALGORITHMS) as CollectiveAlgorithmId[];
  return algoKeys.map((algoId) => {
    const config = COLLECTIVE_ALGORITHMS[algoId];
    const metrics = computeHockneyLatency({
      algorithm: algoId,
      numRanks,
      payloadBytes,
      linkBandwidthGBs,
      alphaLatencyMicroseconds,
      hopCount,
    });
    return {
      algorithm: config,
      latencyMs: metrics.totalLatencyMs,
      startupLatencyMs: metrics.startupLatencyMs,
      transferLatencyMs: metrics.transferLatencyMs,
      effectiveBandwidthGBs: metrics.effectiveBandwidthGBs,
      numSteps: metrics.numSteps,
      scalingEfficiency: metrics.scalingEfficiency,
    };
  });
}

/**
 * Generates interactive step-by-step state machine for packet animations.
 * Supports visual rank counts (e.g. 4 or 8 ranks) for clean UI rendering.
 */
export function generateCollectiveSteps(
  algorithm: CollectiveAlgorithmId,
  numVisualRanks: number = 8,
  payloadBytes: number = 1024 * 1024 * 1024,
): CollectiveStep[] {
  const P = Math.min(16, Math.max(2, numVisualRanks));
  const steps: CollectiveStep[] = [];

  // Color palette for chunks
  const CHUNK_COLORS = [
    "#38bdf8", // Sky blue
    "#a855f7", // Purple
    "#34d399", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#84cc16", // Lime
    "#f97316", // Orange
  ];

  // Helper to create initial rank states
  const createInitialRankStates = (): RankState[] => {
    return Array.from({ length: P }, (_, r) => ({
      rank: r,
      gpuId: r,
      nodeId: Math.floor(r / 4),
      chunks: Array.from({ length: P }, (_, c) => ({
        chunkId: c,
        status: "initial" as ChunkStatus,
        valueLabel: `R${r}[C${c}]`,
        color: CHUNK_COLORS[c % CHUNK_COLORS.length],
      })),
    }));
  };

  // Step 0: Initial State
  steps.push({
    stepIndex: 0,
    phase: "Initial State",
    phaseType: "initial",
    description: `All ${P} GPU ranks initialized with local unsharded tensor memory buffers (Payload: ${formatBytes(payloadBytes)}).`,
    formulaSnippet: "T = 0",
    transfers: [],
    rankStates: createInitialRankStates(),
  });

  if (algorithm === "ring_allreduce") {
    // -------------------------------------------------------------
    // Phase 1: Scatter-Reduce (Steps 1 to P-1)
    // -------------------------------------------------------------
    const currentStates = createInitialRankStates();

    for (let s = 1; s < P; s++) {
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < P; r++) {
        const sendChunkIdx = (r - s + 1 + P) % P;
        const targetRank = (r + 1) % P;

        transfers.push({
          fromRank: r,
          toRank: targetRank,
          chunkIndex: sendChunkIdx,
          chunkLabel: `C${sendChunkIdx}`,
          color: CHUNK_COLORS[sendChunkIdx % CHUNK_COLORS.length],
        });

        // Update visual status
        updatedStates[r].chunks[sendChunkIdx].status = "sending";
        updatedStates[targetRank].chunks[sendChunkIdx].status =
          s === P - 1 ? "reduced" : "receiving";
        updatedStates[targetRank].chunks[sendChunkIdx].valueLabel =
          `Σ(R0..R${s})[C${sendChunkIdx}]`;
      }

      steps.push({
        stepIndex: s,
        phase: `Scatter-Reduce (Step ${s}/${P - 1})`,
        phaseType: "scatter_reduce",
        description: `Step ${s}: Each rank r sends chunk C[(r - ${s} + 1 + ${P}) % ${P}] to neighbor (r + 1) % ${P} and sums into its local chunk buffer.`,
        formulaSnippet: `T_sr = ${s} · α + ${s} · (S/${P}) · β`,
        transfers,
        rankStates: updatedStates,
      });

      // Commit state for next iteration
      for (let r = 0; r < P; r++) {
        for (let c = 0; c < P; c++) {
          if (updatedStates[r].chunks[c].status === "sending") {
            updatedStates[r].chunks[c].status = "initial";
          }
          if (updatedStates[r].chunks[c].status === "receiving") {
            updatedStates[r].chunks[c].status = "reduced";
          }
        }
      }
      currentStates.splice(0, currentStates.length, ...updatedStates);
    }

    // -------------------------------------------------------------
    // Phase 2: AllGather (Steps P to 2P-2)
    // -------------------------------------------------------------
    for (let s = 1; s < P; s++) {
      const stepNumber = P - 1 + s;
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < P; r++) {
        const sendChunkIdx = (r - s + 2 + P) % P;
        const targetRank = (r + 1) % P;

        transfers.push({
          fromRank: r,
          toRank: targetRank,
          chunkIndex: sendChunkIdx,
          chunkLabel: `ΣC${sendChunkIdx}`,
          color: CHUNK_COLORS[sendChunkIdx % CHUNK_COLORS.length],
        });

        updatedStates[r].chunks[sendChunkIdx].status = "sending";
        updatedStates[targetRank].chunks[sendChunkIdx].status = "complete";
        updatedStates[targetRank].chunks[sendChunkIdx].valueLabel = `★ ΣAll[C${sendChunkIdx}]`;
      }

      steps.push({
        stepIndex: stepNumber,
        phase: `AllGather (Step ${s}/${P - 1})`,
        phaseType: "allgather",
        description: `Step ${s}: Fully reduced chunk ΣC is ring-shifted to neighbor ranks to replicate complete gradient across all GPUs.`,
        formulaSnippet: `T_ag = (${P - 1} + ${s}) · α + (${P - 1} + ${s}) · (S/${P}) · β`,
        transfers,
        rankStates: updatedStates,
      });

      for (let r = 0; r < P; r++) {
        for (let c = 0; c < P; c++) {
          if (updatedStates[r].chunks[c].status === "sending") {
            updatedStates[r].chunks[c].status = "complete";
          }
        }
      }
      currentStates.splice(0, currentStates.length, ...updatedStates);
    }
  } else if (algorithm === "tree_allreduce" || algorithm === "recursive_halving_allreduce") {
    // Tree AllReduce / Recursive Halving step generation
    const logP = Math.ceil(Math.log2(P));
    const currentStates = createInitialRankStates();

    // ReduceScatter Halving phase
    for (let d = 0; d < logP; d++) {
      const distance = 1 << d;
      const stepIdx = d + 1;
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < P; r++) {
        const partner = r ^ distance;
        if (partner < P) {
          const chunkIdx = r % P;
          transfers.push({
            fromRank: r,
            toRank: partner,
            chunkIndex: chunkIdx,
            chunkLabel: `D${distance}`,
            color: CHUNK_COLORS[chunkIdx % CHUNK_COLORS.length],
          });
          updatedStates[r].chunks[chunkIdx].status = "sending";
          updatedStates[partner].chunks[chunkIdx].status = d === logP - 1 ? "reduced" : "receiving";
          updatedStates[partner].chunks[chunkIdx].valueLabel = `TreeΣ[${r}⊕${partner}]`;
        }
      }

      steps.push({
        stepIndex: stepIdx,
        phase: `Tree Reduction (Hop Distance: ${distance})`,
        phaseType: "halving",
        description: `Step ${stepIdx}: Bitwise distance-${distance} hypercube partner exchange and partial reduction.`,
        formulaSnippet: `T_tree = ${stepIdx} · α + ${stepIdx} · (S/${1 << (d + 1)}) · β`,
        transfers,
        rankStates: updatedStates,
      });

      for (let r = 0; r < P; r++) {
        for (let c = 0; c < P; c++) {
          if (
            updatedStates[r].chunks[c].status === "receiving" ||
            updatedStates[r].chunks[c].status === "sending"
          ) {
            updatedStates[r].chunks[c].status = "reduced";
          }
        }
      }
      currentStates.splice(0, currentStates.length, ...updatedStates);
    }

    // AllGather Doubling phase
    for (let d = logP - 1; d >= 0; d--) {
      const distance = 1 << d;
      const stepIdx = logP + (logP - d);
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < P; r++) {
        const partner = r ^ distance;
        if (partner < P) {
          const chunkIdx = partner % P;
          transfers.push({
            fromRank: r,
            toRank: partner,
            chunkIndex: chunkIdx,
            chunkLabel: `ΣAll`,
            color: CHUNK_COLORS[chunkIdx % CHUNK_COLORS.length],
          });
          updatedStates[r].chunks[chunkIdx].status = "complete";
          updatedStates[partner].chunks[chunkIdx].status = "complete";
          updatedStates[partner].chunks[chunkIdx].valueLabel = `★ Complete`;
        }
      }

      steps.push({
        stepIndex: stepIdx,
        phase: `Tree Broadcast (Hop Distance: ${distance})`,
        phaseType: "doubling",
        description: `Step ${stepIdx}: Bitwise distance-${distance} hypercube partner broadcast of aggregated results.`,
        formulaSnippet: `T_doubling = ${stepIdx} · α + ${stepIdx} · (S/2) · β`,
        transfers,
        rankStates: updatedStates,
      });

      currentStates.splice(0, currentStates.length, ...updatedStates);
    }
  } else if (algorithm === "all_to_all") {
    // All-to-All Personalized Exchange (P-1 steps)
    const currentStates = createInitialRankStates();

    for (let s = 1; s < P; s++) {
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < P; r++) {
        const destRank = (r + s) % P;
        const chunkToSend = destRank;

        transfers.push({
          fromRank: r,
          toRank: destRank,
          chunkIndex: chunkToSend,
          chunkLabel: `R${r}→R${destRank}`,
          color: CHUNK_COLORS[chunkToSend % CHUNK_COLORS.length],
        });

        updatedStates[r].chunks[chunkToSend].status = "sending";
        updatedStates[destRank].chunks[r].status = "complete";
        updatedStates[destRank].chunks[r].valueLabel = `Token[R${r}]`;
      }

      steps.push({
        stepIndex: s,
        phase: `All-to-All Shift Permutation (Step ${s}/${P - 1})`,
        phaseType: "direct_exchange",
        description: `Step ${s}: Ranks perform pairwise shift exchanges with partner (r + ${s}) % ${P} (MoE Expert Dispatch).`,
        formulaSnippet: `T_a2a = ${s} · α + ${s} · (S/${P}) · β`,
        transfers,
        rankStates: updatedStates,
      });

      for (let r = 0; r < P; r++) {
        for (let c = 0; c < P; c++) {
          if (updatedStates[r].chunks[c].status === "sending") {
            updatedStates[r].chunks[c].status = "initial";
          }
        }
      }
      currentStates.splice(0, currentStates.length, ...updatedStates);
    }
  } else if (algorithm === "allgather" || algorithm === "reduce_scatter") {
    // Simple Ring Gather or Reduce-Scatter
    const isGather = algorithm === "allgather";
    const currentStates = createInitialRankStates();

    for (let s = 1; s < P; s++) {
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < P; r++) {
        const chunkIdx = (r - s + 1 + P) % P;
        const targetRank = (r + 1) % P;

        transfers.push({
          fromRank: r,
          toRank: targetRank,
          chunkIndex: chunkIdx,
          chunkLabel: `C${chunkIdx}`,
          color: CHUNK_COLORS[chunkIdx % CHUNK_COLORS.length],
        });

        updatedStates[r].chunks[chunkIdx].status = "sending";
        updatedStates[targetRank].chunks[chunkIdx].status = isGather ? "complete" : "reduced";
        updatedStates[targetRank].chunks[chunkIdx].valueLabel = isGather
          ? `★ Gathered`
          : `Σ Sliced`;
      }

      steps.push({
        stepIndex: s,
        phase: `${isGather ? "AllGather" : "ReduceScatter"} Ring Step (${s}/${P - 1})`,
        phaseType: isGather ? "allgather" : "scatter_reduce",
        description: `Step ${s}: Shift partition C[(r - ${s} + 1 + ${P}) % ${P}] along the ring to next neighboring GPU rank.`,
        formulaSnippet: `T = ${s} · α + ${s} · (S/${P}) · β`,
        transfers,
        rankStates: updatedStates,
      });

      for (let r = 0; r < P; r++) {
        for (let c = 0; c < P; c++) {
          if (updatedStates[r].chunks[c].status === "sending") {
            updatedStates[r].chunks[c].status = isGather ? "complete" : "initial";
          }
        }
      }
      currentStates.splice(0, currentStates.length, ...updatedStates);
    }
  } else {
    // Broadcast from Rank 0
    const logP = Math.ceil(Math.log2(P));
    const currentStates = createInitialRankStates();

    for (let d = 0; d < logP; d++) {
      const distance = 1 << d;
      const stepIdx = d + 1;
      const transfers: CollectivePacketTransfer[] = [];
      const updatedStates: RankState[] = currentStates.map((r) => ({
        ...r,
        chunks: r.chunks.map((c) => ({ ...c })),
      }));

      for (let r = 0; r < distance; r++) {
        const target = r + distance;
        if (target < P) {
          transfers.push({
            fromRank: r,
            toRank: target,
            chunkIndex: 0,
            chunkLabel: `Root Bcast`,
            color: CHUNK_COLORS[0],
          });
          for (let c = 0; c < P; c++) {
            updatedStates[target].chunks[c].status = "complete";
            updatedStates[target].chunks[c].valueLabel = `Bcast[R0]`;
          }
        }
      }

      steps.push({
        stepIndex: stepIdx,
        phase: `Broadcast Doubling (Step ${stepIdx}/${logP})`,
        phaseType: "broadcast",
        description: `Step ${stepIdx}: Replicating root tensor to ranks in distance range [${distance} .. ${Math.min(P - 1, 2 * distance - 1)}].`,
        formulaSnippet: `T_bcast = ${stepIdx} · α + ${stepIdx} · S · β`,
        transfers,
        rankStates: updatedStates,
      });

      currentStates.splice(0, currentStates.length, ...updatedStates);
    }
  }

  // Final Step: Completion
  const finalStates: RankState[] = Array.from({ length: P }, (_, r) => ({
    rank: r,
    gpuId: r,
    nodeId: Math.floor(r / 4),
    chunks: Array.from({ length: P }, (_, c) => ({
      chunkId: c,
      status: "complete" as ChunkStatus,
      valueLabel: `★ Final`,
      color: CHUNK_COLORS[c % CHUNK_COLORS.length],
    })),
  }));

  steps.push({
    stepIndex: steps.length,
    phase: "Collective Completed",
    phaseType: "completed",
    description: `All ${P} participating ranks synchronized with fully coherent tensor buffers across interconnect fabric.`,
    formulaSnippet: `T_total = ${formatTime(computeHockneyLatency({ algorithm, numRanks: P, payloadBytes, linkBandwidthGBs: 50, alphaLatencyMicroseconds: 1.5 }).totalLatencyMs)}`,
    transfers: [],
    rankStates: finalStates,
  });

  return steps;
}

// ============================================================================
// 4. FORMATTING UTILITIES
// ============================================================================

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

export function formatTime(ms: number): string {
  if (ms <= 0) return "0.00 ms";
  if (ms < 0.001) {
    return `${(ms * 1000).toFixed(2)} µs`;
  }
  if (ms < 1.0) {
    return `${ms.toFixed(3)} ms`;
  }
  if (ms < 1000.0) {
    return `${ms.toFixed(2)} ms`;
  }
  return `${(ms / 1000.0).toFixed(2)} s`;
}

export function formatBandwidth(gbs: number): string {
  if (gbs >= 1000) {
    return `${(gbs / 1000).toFixed(2)} TB/s`;
  }
  return `${gbs.toFixed(1)} GB/s`;
}

// ============================================================================
// 5. SVG TOPOLOGY DIAGRAM COMPONENT (All 5 Topologies)
// ============================================================================

interface TopologySvgViewProps {
  topology: TopologyType;
  numGpus: number;
  activeTransfers: CollectivePacketTransfer[];
  selectedRank: number | null;
  onSelectRank: (rank: number) => void;
}

const TopologySvgView: React.FC<TopologySvgViewProps> = ({
  topology,
  numGpus,
  activeTransfers,
  selectedRank,
  onSelectRank,
}) => {
  const visualRanks = Math.min(8, numGpus);
  const activeSendingRanks = useMemo(
    () => new Set(activeTransfers.map((t) => t.fromRank % visualRanks)),
    [activeTransfers, visualRanks],
  );
  const activeReceivingRanks = useMemo(
    () => new Set(activeTransfers.map((t) => t.toRank % visualRanks)),
    [activeTransfers, visualRanks],
  );

  // 1. FAT-TREE TOPOLOGY VIEW
  if (topology === "fat_tree") {
    // 2-Tier Leaf-Spine diagram with 4 Spine switches, 2 Leaf switches, and 8 GPU ranks
    const spines = [
      { id: 0, x: 120, y: 35, name: "Spine SW 0" },
      { id: 1, x: 280, y: 35, name: "Spine SW 1" },
      { id: 2, x: 440, y: 35, name: "Spine SW 2" },
      { id: 3, x: 600, y: 35, name: "Spine SW 3" },
    ];
    const leaves = [
      { id: 0, x: 200, y: 125, name: "Leaf SW 0 (Pod A)", nodeRange: "Ranks 0..3" },
      { id: 1, x: 520, y: 125, name: "Leaf SW 1 (Pod B)", nodeRange: "Ranks 4..7" },
    ];
    const gpuNodes = Array.from({ length: visualRanks }, (_, i) => {
      const leafIdx = i < visualRanks / 2 ? 0 : 1;
      const offsetInLeaf = i % (visualRanks / 2);
      const xBase = leafIdx === 0 ? 60 : 380;
      const x = xBase + offsetInLeaf * 80;
      return { id: i, x, y: 220, leafIdx };
    });

    return (
      <svg
        viewBox="0 0 720 280"
        style={{ width: "100%", height: "280px", overflow: "visible" }}
        data-testid="topology-svg-fat-tree"
      >
        <defs>
          <linearGradient id="spineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Uplinks: Leaf to Spine */}
        {leaves.map((leaf) =>
          spines.map((spine) => (
            <line
              key={`uplink-${leaf.id}-${spine.id}`}
              x1={leaf.x + 40}
              y1={leaf.y}
              x2={spine.x + 35}
              y2={spine.y + 25}
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="1.5"
            />
          )),
        )}

        {/* Downlinks: Leaf to GPUs */}
        {gpuNodes.map((gpu) => {
          const leaf = leaves[gpu.leafIdx];
          const isTransferring = activeSendingRanks.has(gpu.id) || activeReceivingRanks.has(gpu.id);
          return (
            <line
              key={`downlink-${gpu.id}`}
              x1={gpu.x + 30}
              y1={gpu.y}
              x2={leaf.x + 40}
              y2={leaf.y + 25}
              stroke={isTransferring ? "#f59e0b" : "rgba(148, 163, 184, 0.25)"}
              strokeWidth={isTransferring ? 2.5 : 1.5}
              strokeDasharray={isTransferring ? "4 3" : undefined}
              filter={isTransferring ? "url(#glowEffect)" : undefined}
            />
          );
        })}

        {/* Spine Switch Boxes */}
        {spines.map((spine) => (
          <g key={`spine-box-${spine.id}`} transform={`translate(${spine.x}, ${spine.y})`}>
            <rect
              width="70"
              height="25"
              rx="4"
              fill="url(#spineGrad)"
              stroke="#60a5fa"
              strokeWidth="1"
            />
            <text
              x="35"
              y="16"
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {spine.name}
            </text>
          </g>
        ))}

        {/* Leaf Switch Boxes */}
        {leaves.map((leaf) => (
          <g key={`leaf-box-${leaf.id}`} transform={`translate(${leaf.x}, ${leaf.y})`}>
            <rect
              width="80"
              height="26"
              rx="5"
              fill="url(#leafGrad)"
              stroke="#c084fc"
              strokeWidth="1"
            />
            <text
              x="40"
              y="17"
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Leaf {leaf.id}
            </text>
          </g>
        ))}

        {/* GPU Node Cards */}
        {gpuNodes.map((gpu) => {
          const isSending = activeSendingRanks.has(gpu.id);
          const isReceiving = activeReceivingRanks.has(gpu.id);
          const isSelected = selectedRank === gpu.id;

          let cardStroke = "rgba(56, 189, 248, 0.4)";
          let cardFill = "#0f172a";
          if (isSending) {
            cardStroke = "#f59e0b";
            cardFill = "rgba(245, 158, 11, 0.15)";
          } else if (isReceiving) {
            cardStroke = "#34d399";
            cardFill = "rgba(52, 211, 153, 0.15)";
          } else if (isSelected) {
            cardStroke = "#a855f7";
            cardFill = "rgba(168, 85, 247, 0.2)";
          }

          return (
            <g
              key={`gpu-card-${gpu.id}`}
              transform={`translate(${gpu.x}, ${gpu.y})`}
              onClick={() => onSelectRank(gpu.id)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width="60"
                height="46"
                rx="6"
                fill={cardFill}
                stroke={cardStroke}
                strokeWidth={isSelected || isSending || isReceiving ? 2 : 1}
                filter={isSending || isReceiving ? "url(#glowEffect)" : undefined}
              />
              <text
                x="30"
                y="18"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                GPU {gpu.id}
              </text>
              <text
                x="30"
                y="34"
                fill={isSending ? "#f59e0b" : isReceiving ? "#34d399" : "#94a3b8"}
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {isSending ? "TX »" : isReceiving ? "« RX" : `Rank ${gpu.id}`}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 2. NVLINK MESH TOPOLOGY VIEW
  if (topology === "nvlink_mesh") {
    // 8 GPUs in a 2x4 planar mesh arrangement with direct multi-dimensional NVLink interconnects
    const meshNodes = [
      { id: 0, x: 100, y: 50 },
      { id: 1, x: 260, y: 50 },
      { id: 2, x: 420, y: 50 },
      { id: 3, x: 580, y: 50 },
      { id: 4, x: 100, y: 180 },
      { id: 5, x: 260, y: 180 },
      { id: 6, x: 420, y: 180 },
      { id: 7, x: 580, y: 180 },
    ];

    // Mesh links between adjacent GPUs
    const meshLinks = [
      // Horizontal
      [0, 1],
      [1, 2],
      [2, 3],
      [4, 5],
      [5, 6],
      [6, 7],
      // Vertical
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
      // Diagonal NVLink cross-links
      [0, 5],
      [1, 4],
      [1, 6],
      [2, 5],
      [2, 7],
      [3, 6],
    ];

    return (
      <svg
        viewBox="0 0 720 280"
        style={{ width: "100%", height: "280px", overflow: "visible" }}
        data-testid="topology-svg-nvlink-mesh"
      >
        <defs>
          <linearGradient id="nvlinkGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glowEffectMesh" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* NVLink Mesh Interconnect Links */}
        {meshLinks.map(([src, dst], idx) => {
          const n1 = meshNodes[src];
          const n2 = meshNodes[dst];
          const isTransferring =
            (activeSendingRanks.has(src) && activeReceivingRanks.has(dst)) ||
            (activeSendingRanks.has(dst) && activeReceivingRanks.has(src));

          return (
            <line
              key={`mesh-link-${idx}`}
              x1={n1.x + 35}
              y1={n1.y + 25}
              x2={n2.x + 35}
              y2={n2.y + 25}
              stroke={isTransferring ? "#f59e0b" : "rgba(16, 185, 129, 0.3)"}
              strokeWidth={isTransferring ? 3 : 1.5}
              strokeDasharray={isTransferring ? "4 2" : undefined}
              filter={isTransferring ? "url(#glowEffectMesh)" : undefined}
            />
          );
        })}

        {/* GPU Node Cards */}
        {meshNodes.map((n) => {
          const isSending = activeSendingRanks.has(n.id);
          const isReceiving = activeReceivingRanks.has(n.id);
          const isSelected = selectedRank === n.id;

          let cardStroke = "rgba(16, 185, 129, 0.4)";
          let cardFill = "#0f172a";
          if (isSending) {
            cardStroke = "#f59e0b";
            cardFill = "rgba(245, 158, 11, 0.2)";
          } else if (isReceiving) {
            cardStroke = "#34d399";
            cardFill = "rgba(52, 211, 153, 0.2)";
          } else if (isSelected) {
            cardStroke = "#a855f7";
            cardFill = "rgba(168, 85, 247, 0.2)";
          }

          return (
            <g
              key={`mesh-node-${n.id}`}
              transform={`translate(${n.x}, ${n.y})`}
              onClick={() => onSelectRank(n.id)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width="70"
                height="50"
                rx="6"
                fill={cardFill}
                stroke={cardStroke}
                strokeWidth={isSelected || isSending || isReceiving ? 2.5 : 1.5}
                filter={isSending || isReceiving ? "url(#glowEffectMesh)" : undefined}
              />
              <text
                x="35"
                y="20"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                GPU {n.id}
              </text>
              <text
                x="35"
                y="36"
                fill={isSending ? "#f59e0b" : isReceiving ? "#34d399" : "#10b981"}
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {isSending ? "TX »" : isReceiving ? "« RX" : "18× NVLink"}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 3. NVSWITCH FABRIC TOPOLOGY VIEW
  if (topology === "nvswitch") {
    // Centralized NVSwitch Fabric Crossbar in center, 8 GPUs arranged symmetrically (4 top, 4 bottom)
    const nvswitches = [
      { id: 0, x: 190, y: 115, name: "NVSwitch 0" },
      { id: 1, x: 300, y: 115, name: "NVSwitch 1" },
      { id: 2, x: 410, y: 115, name: "NVSwitch 2" },
      { id: 3, x: 520, y: 115, name: "NVSwitch 3" },
    ];

    const topGpus = [
      { id: 0, x: 110, y: 25 },
      { id: 1, x: 250, y: 25 },
      { id: 2, x: 430, y: 25 },
      { id: 3, x: 570, y: 25 },
    ];
    const bottomGpus = [
      { id: 4, x: 110, y: 205 },
      { id: 5, x: 250, y: 205 },
      { id: 6, x: 430, y: 205 },
      { id: 7, x: 570, y: 205 },
    ];
    const allGpus = [...topGpus, ...bottomGpus];

    return (
      <svg
        viewBox="0 0 720 280"
        style={{ width: "100%", height: "280px", overflow: "visible" }}
        data-testid="topology-svg-nvswitch"
      >
        <defs>
          <linearGradient id="nvswitchGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glowEffectSwitch" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Fabric Boundary Outline Box */}
        <rect
          x="160"
          y="100"
          width="460"
          height="65"
          rx="10"
          fill="rgba(30, 27, 75, 0.4)"
          stroke="rgba(99, 102, 241, 0.35)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <text x="170" y="114" fill="#a5b4fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
          HGX/DGX NVSwitch Full-Crossbar Fabric (3.2 TB/s Non-Blocking)
        </text>

        {/* Traces from GPUs to NVSwitch chips */}
        {allGpus.map((gpu) =>
          nvswitches.map((sw) => {
            const isTransferring =
              activeSendingRanks.has(gpu.id) || activeReceivingRanks.has(gpu.id);
            return (
              <line
                key={`nvswitch-trace-${gpu.id}-${sw.id}`}
                x1={gpu.x + 30}
                y1={gpu.y > 100 ? gpu.y : gpu.y + 45}
                x2={sw.x + 40}
                y2={sw.y + 15}
                stroke={isTransferring ? "#f59e0b" : "rgba(99, 102, 241, 0.2)"}
                strokeWidth={isTransferring ? 2 : 1}
                strokeDasharray={isTransferring ? "3 2" : undefined}
                filter={isTransferring ? "url(#glowEffectSwitch)" : undefined}
              />
            );
          }),
        )}

        {/* NVSwitch Central Switch Chips */}
        {nvswitches.map((sw) => (
          <g key={`nvswitch-chip-${sw.id}`} transform={`translate(${sw.x}, ${sw.y})`}>
            <rect
              width="80"
              height="30"
              rx="5"
              fill="url(#nvswitchGrad)"
              stroke="#818cf8"
              strokeWidth="1.2"
            />
            <text
              x="40"
              y="19"
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {sw.name}
            </text>
          </g>
        ))}

        {/* GPU Node Cards */}
        {allGpus.map((gpu) => {
          const isSending = activeSendingRanks.has(gpu.id);
          const isReceiving = activeReceivingRanks.has(gpu.id);
          const isSelected = selectedRank === gpu.id;

          let cardStroke = "rgba(56, 189, 248, 0.4)";
          let cardFill = "#0f172a";
          if (isSending) {
            cardStroke = "#f59e0b";
            cardFill = "rgba(245, 158, 11, 0.2)";
          } else if (isReceiving) {
            cardStroke = "#34d399";
            cardFill = "rgba(52, 211, 153, 0.2)";
          } else if (isSelected) {
            cardStroke = "#a855f7";
            cardFill = "rgba(168, 85, 247, 0.2)";
          }

          return (
            <g
              key={`nvswitch-gpu-${gpu.id}`}
              transform={`translate(${gpu.x}, ${gpu.y})`}
              onClick={() => onSelectRank(gpu.id)}
              style={{ cursor: "pointer" }}
            >
              <rect
                width="60"
                height="45"
                rx="6"
                fill={cardFill}
                stroke={cardStroke}
                strokeWidth={isSelected || isSending || isReceiving ? 2 : 1}
                filter={isSending || isReceiving ? "url(#glowEffectSwitch)" : undefined}
              />
              <text
                x="30"
                y="18"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                GPU {gpu.id}
              </text>
              <text
                x="30"
                y="34"
                fill={isSending ? "#f59e0b" : isReceiving ? "#34d399" : "#38bdf8"}
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {isSending ? "TX »" : isReceiving ? "« RX" : "900 GB/s"}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 4. 3D TORUS TOPOLOGY VIEW
  if (topology === "torus_3d") {
    // 3D Torus Layout: 8 Ranks in a 2x2x2 Toroidal Cube layout with wrap-around links
    const torusNodes = [
      { id: 0, x: 120, y: 70, label: "(0,0,0)" },
      { id: 1, x: 260, y: 70, label: "(1,0,0)" },
      { id: 2, x: 120, y: 190, label: "(0,1,0)" },
      { id: 3, x: 260, y: 190, label: "(1,1,0)" },
      { id: 4, x: 420, y: 40, label: "(0,0,1)" },
      { id: 5, x: 560, y: 40, label: "(1,0,1)" },
      { id: 6, x: 420, y: 160, label: "(0,1,1)" },
      { id: 7, x: 560, y: 160, label: "(1,1,1)" },
    ];

    return (
      <svg
        viewBox="0 0 720 280"
        style={{ width: "100%", height: "280px", overflow: "visible" }}
        data-testid="topology-svg-3d-torus"
      >
        <defs>
          <filter id="glowEffectTorus" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Torus direct coordinate links */}
        {/* Front plane links */}
        <line x1="150" y1="90" x2="260" y2="90" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />
        <line
          x1="150"
          y1="210"
          x2="260"
          y2="210"
          stroke="rgba(56, 189, 248, 0.4)"
          strokeWidth="2"
        />
        <line x1="150" y1="90" x2="150" y2="210" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />
        <line x1="290" y1="90" x2="290" y2="210" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />

        {/* Back plane links */}
        <line x1="450" y1="60" x2="560" y2="60" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" />
        <line
          x1="450"
          y1="180"
          x2="560"
          y2="180"
          stroke="rgba(168, 85, 247, 0.4)"
          strokeWidth="2"
        />
        <line x1="450" y1="60" x2="450" y2="180" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" />
        <line x1="590" y1="60" x2="590" y2="180" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" />

        {/* Cross-plane Z links */}
        <line
          x1="150"
          y1="90"
          x2="450"
          y2="60"
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <line
          x1="290"
          y1="90"
          x2="590"
          y2="60"
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <line
          x1="150"
          y1="210"
          x2="450"
          y2="180"
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />
        <line
          x1="290"
          y1="210"
          x2="590"
          y2="180"
          stroke="rgba(52, 211, 153, 0.4)"
          strokeWidth="2"
          strokeDasharray="3 3"
        />

        {/* Torus Wrap-Around Curved Arcs */}
        <path
          d="M 120 90 Q 60 140 120 210"
          fill="none"
          stroke="rgba(245, 158, 11, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <path
          d="M 320 90 Q 380 140 320 210"
          fill="none"
          stroke="rgba(245, 158, 11, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <path
          d="M 150 65 Q 220 20 290 65"
          fill="none"
          stroke="rgba(245, 158, 11, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />

        {/* Node Points */}
        {torusNodes.map((n) => {
          const isSending = activeSendingRanks.has(n.id);
          const isReceiving = activeReceivingRanks.has(n.id);
          const isSelected = selectedRank === n.id;

          let ringColor = "#38bdf8";
          if (isSending) ringColor = "#f59e0b";
          if (isReceiving) ringColor = "#34d399";
          if (isSelected) ringColor = "#c084fc";

          return (
            <g
              key={`torus-node-${n.id}`}
              transform={`translate(${n.x}, ${n.y})`}
              onClick={() => onSelectRank(n.id)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx="30"
                cy="20"
                r="22"
                fill="#0f172a"
                stroke={ringColor}
                strokeWidth={isSelected || isSending || isReceiving ? 2.5 : 1.5}
                filter={isSending || isReceiving ? "url(#glowEffectTorus)" : undefined}
              />
              <text
                x="30"
                y="18"
                fill="#f8fafc"
                fontSize="11"
                fontWeight="bold"
                textAnchor="middle"
                fontFamily="monospace"
              >
                R{n.id}
              </text>
              <text
                x="30"
                y="30"
                fill={ringColor}
                fontSize="8"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // 5. DRAGONFLY+ TOPOLOGY VIEW
  const groups = [
    { id: 0, x: 70, y: 40, ranks: [0, 1] },
    { id: 1, x: 410, y: 40, ranks: [2, 3] },
    { id: 2, x: 70, y: 155, ranks: [4, 5] },
    { id: 3, x: 410, y: 155, ranks: [6, 7] },
  ];

  return (
    <svg
      viewBox="0 0 720 280"
      style={{ width: "100%", height: "280px", overflow: "visible" }}
      data-testid="topology-svg-dragonfly"
    >
      <defs>
        <filter id="glowEffectDf" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Inter-Group Global Optical Trunks */}
      <line x1="200" y1="85" x2="410" y2="85" stroke="rgba(236, 72, 153, 0.45)" strokeWidth="2.5" />
      <line
        x1="200"
        y1="200"
        x2="410"
        y2="200"
        stroke="rgba(236, 72, 153, 0.45)"
        strokeWidth="2.5"
      />
      <line
        x1="140"
        y1="130"
        x2="140"
        y2="155"
        stroke="rgba(236, 72, 153, 0.45)"
        strokeWidth="2.5"
      />
      <line
        x1="480"
        y1="130"
        x2="480"
        y2="155"
        stroke="rgba(236, 72, 153, 0.45)"
        strokeWidth="2.5"
      />
      <line
        x1="200"
        y1="85"
        x2="410"
        y2="200"
        stroke="rgba(236, 72, 153, 0.3)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />

      {/* Group Clusters */}
      {groups.map((grp) => (
        <g key={`group-${grp.id}`} transform={`translate(${grp.x}, ${grp.y})`}>
          {/* Group boundary card */}
          <rect
            width="240"
            height="95"
            rx="8"
            fill="rgba(15, 23, 42, 0.75)"
            stroke="rgba(99, 102, 241, 0.35)"
            strokeWidth="1.2"
          />
          <text x="12" y="18" fill="#a5b4fc" fontSize="10" fontWeight="bold" fontFamily="monospace">
            Dragonfly Group {grp.id}
          </text>

          {/* Group Internal Router */}
          <rect
            x="85"
            y="28"
            width="70"
            height="22"
            rx="4"
            fill="#312e81"
            stroke="#818cf8"
            strokeWidth="1"
          />
          <text
            x="120"
            y="43"
            fill="#e0e7ff"
            fontSize="9"
            fontWeight="bold"
            textAnchor="middle"
            fontFamily="monospace"
          >
            Router {grp.id}
          </text>

          {/* GPU Nodes in this group */}
          {grp.ranks.map((rId, idx) => {
            const isSending = activeSendingRanks.has(rId);
            const isReceiving = activeReceivingRanks.has(rId);
            const isSelected = selectedRank === rId;
            const xNode = 15 + idx * 115;
            const yNode = 55;

            let strokeColor = "rgba(56, 189, 248, 0.35)";
            if (isSending) strokeColor = "#f59e0b";
            if (isReceiving) strokeColor = "#34d399";
            if (isSelected) strokeColor = "#c084fc";

            return (
              <g
                key={`df-rank-${rId}`}
                transform={`translate(${xNode}, ${yNode})`}
                onClick={() => onSelectRank(rId)}
                style={{ cursor: "pointer" }}
              >
                <rect
                  width="95"
                  height="30"
                  rx="5"
                  fill="#0b0f19"
                  stroke={strokeColor}
                  strokeWidth={isSending || isReceiving || isSelected ? 2 : 1}
                  filter={isSending || isReceiving ? "url(#glowEffectDf)" : undefined}
                />
                <text
                  x="47"
                  y="20"
                  fill="#f8fafc"
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  GPU Rank {rId}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
};

// ============================================================================
// 6. MAIN REACT COMPONENT
// ============================================================================

export const InterconnectTopologyStudio: React.FC<InterconnectTopologyStudioProps> = ({
  initialPreset = "h100_superpod_512",
  initialTopology,
  initialLinkTech,
  initialCollective,
  initialGpus,
  initialPayloadMB,
  title = "Interconnect Topology & Collective Communication Studio",
  className = "",
}) => {
  // Preset or custom state
  const defaultPreset = TOPOLOGY_PRESETS[initialPreset] || TOPOLOGY_PRESETS.h100_superpod_512;

  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset);
  const [topologyType, setTopologyType] = useState<TopologyType>(
    initialTopology ?? defaultPreset.topologyType,
  );
  const [linkTechId, setLinkTechId] = useState<LinkTechId>(
    initialLinkTech ?? defaultPreset.linkTechId,
  );
  const [collectiveId, setCollectiveId] = useState<CollectiveAlgorithmId>(
    initialCollective ?? defaultPreset.collectiveId,
  );
  const [numGpus, setNumGpus] = useState<number>(initialGpus ?? defaultPreset.numGpus);
  const [gpusPerNode, setGpusPerNode] = useState<number>(defaultPreset.gpusPerNode);
  const [payloadMB, setPayloadMB] = useState<number>(
    initialPayloadMB ?? Math.round(defaultPreset.payloadBytes / (1024 * 1024)),
  );
  const [oversubscription, setOversubscription] = useState<number>(
    defaultPreset.oversubscriptionRatio,
  );

  // Active step & playback state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1.0); // 0.5x, 1x, 2x, 4x
  const [selectedRank, setSelectedRank] = useState<number | null>(0);

  // Link specs & payload in bytes
  const linkTech = LINK_TECHNOLOGIES[linkTechId] || LINK_TECHNOLOGIES.infiniband_ndr_400;
  const payloadBytes = payloadMB * 1024 * 1024;

  // Topological calculations
  const hopData = useMemo(() => {
    return computeTopologyHopCount(topologyType, numGpus, {
      gpusPerNode,
    });
  }, [topologyType, numGpus, gpusPerNode]);

  const bisectionBandwidthGBs = useMemo(() => {
    return computeBisectionBandwidth(topologyType, numGpus, linkTech.bandwidthGBs, {
      oversubscription,
    });
  }, [topologyType, numGpus, linkTech.bandwidthGBs, oversubscription]);

  // Hockney Latency Modeling
  const hockneyMetrics = useMemo(() => {
    return computeHockneyLatency({
      algorithm: collectiveId,
      numRanks: numGpus,
      payloadBytes,
      linkBandwidthGBs: linkTech.bandwidthGBs,
      alphaLatencyMicroseconds: linkTech.latencyMicroseconds,
      hopCount: hopData.averageHopCount,
      bisectionBandwidthGBs,
      oversubscriptionRatio: oversubscription,
    });
  }, [
    collectiveId,
    numGpus,
    payloadBytes,
    linkTech,
    hopData.averageHopCount,
    bisectionBandwidthGBs,
    oversubscription,
  ]);

  // Comparison across all collective algorithms
  const algorithmComparisons = useMemo(() => {
    return calculateAlgorithmComparison(
      numGpus,
      payloadBytes,
      linkTech.bandwidthGBs,
      linkTech.latencyMicroseconds,
      hopData.averageHopCount,
    );
  }, [numGpus, payloadBytes, linkTech, hopData.averageHopCount]);

  // Visual simulation steps (uses 8 visual ranks for clean UI display)
  const visualRanksCount = useMemo(() => Math.min(8, numGpus), [numGpus]);
  const simSteps = useMemo(() => {
    return generateCollectiveSteps(collectiveId, visualRanksCount, payloadBytes);
  }, [collectiveId, visualRanksCount, payloadBytes]);

  const totalSteps = simSteps.length - 1;
  const safeStepIndex = Math.min(currentStepIndex, totalSteps);
  const activeStep = simSteps[safeStepIndex] || simSteps[0];

  // Handle Preset Switching
  const handleApplyPreset = useCallback((presetId: string) => {
    const preset = TOPOLOGY_PRESETS[presetId];
    if (!preset) return;
    setSelectedPresetId(presetId);
    setTopologyType(preset.topologyType);
    setLinkTechId(preset.linkTechId);
    setCollectiveId(preset.collectiveId);
    setNumGpus(preset.numGpus);
    setGpusPerNode(preset.gpusPerNode);
    setPayloadMB(Math.round(preset.payloadBytes / (1024 * 1024)));
    setOversubscription(preset.oversubscriptionRatio);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, []);

  // Animation Playback Interval
  const playTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const stepDurationMs = 1200 / playSpeed;
      playTimerRef.current = window.setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= totalSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, stepDurationMs);
    } else {
      if (playTimerRef.current !== null) {
        clearInterval(playTimerRef.current);
        playTimerRef.current = null;
      }
    }

    return () => {
      if (playTimerRef.current !== null) {
        clearInterval(playTimerRef.current);
      }
    };
  }, [isPlaying, playSpeed, totalSteps]);

  return (
    <div
      data-testid="interconnect-topology-studio"
      className={`interconnect-topology-studio ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        background: "#080c14",
        color: "#f8fafc",
        borderRadius: "16px",
        border: "1px solid rgba(168, 85, 247, 0.25)",
        overflow: "hidden",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, sans-serif",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* ------------------------------------------------------------- */}
      {/* HEADER & PRESET SELECTOR */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          padding: "20px 24px",
          background:
            "linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 15, 26, 0.95) 100%)",
          borderBottom: "1px solid rgba(168, 85, 247, 0.2)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#38bdf8",
                boxShadow: "0 0 10px #38bdf8",
              }}
            />
            <h2
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                background: "linear-gradient(135deg, #c084fc 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {title}
            </h2>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
            Hockney Alpha-Beta Modeling (T = α · hops + β · volume), Multi-Hop Routing, &amp;
            Collective Packet Profiling
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>
            Topology Preset:
          </span>
          <select
            data-testid="preset-selector"
            value={selectedPresetId}
            onChange={(e) => handleApplyPreset(e.target.value)}
            style={{
              background: "#1e293b",
              color: "#f8fafc",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              outline: "none",
            }}
          >
            {Object.values(TOPOLOGY_PRESETS).map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE CONFIGURATION CONTROLS */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
          padding: "16px 24px",
          background: "rgba(15, 23, 42, 0.6)",
          borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
        }}
      >
        {/* 1. Topology Architecture */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              color: "#cbd5e1",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Network Topology
          </label>
          <select
            data-testid="topology-selector"
            value={topologyType}
            onChange={(e) => setTopologyType(e.target.value as TopologyType)}
            style={{
              background: "#0f172a",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "6px",
              padding: "7px 10px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <option value="fat_tree">Fat-Tree Clos (Leaf/Spine)</option>
            <option value="nvlink_mesh">NVLink Mesh (Direct GPU)</option>
            <option value="nvswitch">NVSwitch Fabric (Crossbar)</option>
            <option value="torus_3d">3D Torus (Wrap-Around Mesh)</option>
            <option value="dragonfly_plus">Dragonfly+ (Direct Optical)</option>
          </select>
        </div>

        {/* 2. Link Technology */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              color: "#cbd5e1",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Link Technology
          </label>
          <select
            data-testid="link-tech-selector"
            value={linkTechId}
            onChange={(e) => setLinkTechId(e.target.value as LinkTechId)}
            style={{
              background: "#0f172a",
              color: "#34d399",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "6px",
              padding: "7px 10px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {Object.values(LINK_TECHNOLOGIES).map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.name} ({tech.bandwidthGBs} GB/s, {tech.latencyMicroseconds} µs)
              </option>
            ))}
          </select>
        </div>

        {/* 3. Collective Communication Algorithm */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label
            style={{
              fontSize: "11px",
              color: "#cbd5e1",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Collective Algorithm
          </label>
          <select
            data-testid="collective-selector"
            value={collectiveId}
            onChange={(e) => {
              setCollectiveId(e.target.value as CollectiveAlgorithmId);
              setCurrentStepIndex(0);
              setIsPlaying(false);
            }}
            style={{
              background: "#0f172a",
              color: "#c084fc",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: "6px",
              padding: "7px 10px",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            {Object.values(COLLECTIVE_ALGORITHMS).map((algo) => (
              <option key={algo.id} value={algo.id}>
                {algo.name} ({algo.shortName})
              </option>
            ))}
          </select>
        </div>

        {/* 4. GPU Cluster Size (P) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label
              style={{
                fontSize: "11px",
                color: "#cbd5e1",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Total GPUs (P)
            </label>
            <span style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700 }}>
              {numGpus} GPUs
            </span>
          </div>
          <input
            data-testid="gpu-count-slider"
            type="range"
            min={2}
            max={1024}
            step={2}
            value={numGpus}
            onChange={(e) => {
              const val = Number(e.target.value);
              setNumGpus(val);
              setCurrentStepIndex(0);
            }}
            style={{ accentColor: "#38bdf8", cursor: "pointer" }}
          />
        </div>

        {/* 5. Payload Size (S) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label
              style={{
                fontSize: "11px",
                color: "#cbd5e1",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Tensor Payload (S)
            </label>
            <span style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 700 }}>
              {formatBytes(payloadBytes)}
            </span>
          </div>
          <input
            data-testid="payload-slider"
            type="range"
            min={1}
            max={16384}
            step={1}
            value={payloadMB}
            onChange={(e) => setPayloadMB(Number(e.target.value))}
            style={{ accentColor: "#f59e0b", cursor: "pointer" }}
          />
        </div>

        {/* 6. Oversubscription Ratio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label
              style={{
                fontSize: "11px",
                color: "#cbd5e1",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Oversubscription
            </label>
            <span
              style={{
                fontSize: "12px",
                color: oversubscription > 1.2 ? "#f59e0b" : "#34d399",
                fontWeight: 700,
              }}
            >
              {oversubscription.toFixed(1)}:1
            </span>
          </div>
          <input
            data-testid="oversubscription-slider"
            type="range"
            min={1.0}
            max={4.0}
            step={0.1}
            value={oversubscription}
            onChange={(e) => setOversubscription(Number(e.target.value))}
            style={{
              accentColor: oversubscription > 1.2 ? "#f59e0b" : "#34d399",
              cursor: "pointer",
            }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ANALYTICAL METRICS GRID */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
          padding: "18px 24px",
          background: "rgba(10, 15, 26, 0.8)",
        }}
      >
        {/* Total Latency */}
        <div
          data-testid="metric-total-latency"
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(56, 189, 248, 0.25)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Total Hockney Latency
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#38bdf8", marginTop: "4px" }}>
            {formatTime(hockneyMetrics.totalLatencyMs)}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
            {hockneyMetrics.numSteps} steps · {hockneyMetrics.scalingEfficiency}% efficiency
          </div>
        </div>

        {/* Startup Alpha vs Transfer Beta */}
        <div
          data-testid="metric-alpha-beta"
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(168, 85, 247, 0.25)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Startup α vs Transfer β
          </div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#c084fc", marginTop: "6px" }}>
            α: {formatTime(hockneyMetrics.startupLatencyMs)} | β:{" "}
            {formatTime(hockneyMetrics.transferLatencyMs)}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
            α fraction: {(hockneyMetrics.alphaFraction * 100).toFixed(1)}% | β:{" "}
            {(hockneyMetrics.betaFraction * 100).toFixed(1)}%
          </div>
        </div>

        {/* Effective Bandwidth */}
        <div
          data-testid="metric-effective-throughput"
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(52, 211, 153, 0.25)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Effective Throughput
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#34d399", marginTop: "4px" }}>
            {formatBandwidth(hockneyMetrics.effectiveBandwidthGBs)}
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
            Raw Link: {formatBandwidth(linkTech.bandwidthGBs)}
          </div>
        </div>

        {/* Bisection Bandwidth */}
        <div
          data-testid="metric-bisection-bandwidth"
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(245, 158, 11, 0.25)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Bisection Bandwidth
          </div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "#f59e0b", marginTop: "4px" }}>
            {hockneyMetrics.bisectionBandwidthTBps} TB/s
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
            Oversubscription: {oversubscription.toFixed(1)}:1
          </div>
        </div>

        {/* Network Hop Counts */}
        <div
          data-testid="metric-hop-count"
          style={{
            background: "#0f172a",
            padding: "12px 14px",
            borderRadius: "10px",
            border: "1px solid rgba(236, 72, 153, 0.25)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Network Topology Routing
          </div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#ec4899", marginTop: "4px" }}>
            Avg: {hopData.averageHopCount} hops
          </div>
          <div style={{ fontSize: "10px", color: "#64748b", marginTop: "3px" }}>
            Diameter: {hopData.diameter} hops
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LATENCY BREAKDOWN STACKED BAR */}
      {/* ------------------------------------------------------------- */}
      <div style={{ padding: "0 24px 16px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "#c084fc", fontWeight: 700 }}>
            ■ Startup Alpha Overhead: {(hockneyMetrics.alphaFraction * 100).toFixed(1)}% (
            {formatTime(hockneyMetrics.startupLatencyMs)})
          </span>
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>
            ■ Data Transfer Beta: {(hockneyMetrics.betaFraction * 100).toFixed(1)}% (
            {formatTime(hockneyMetrics.transferLatencyMs)})
          </span>
        </div>
        <div
          style={{
            display: "flex",
            height: "14px",
            width: "100%",
            borderRadius: "7px",
            overflow: "hidden",
            background: "#1e293b",
          }}
        >
          <div
            style={{
              width: `${Math.max(1, hockneyMetrics.alphaFraction * 100)}%`,
              background: "linear-gradient(90deg, #a855f7 0%, #c084fc 100%)",
              transition: "width 0.3s ease",
            }}
          />
          <div
            style={{
              width: `${Math.max(1, hockneyMetrics.betaFraction * 100)}%`,
              background: "linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VISUAL COLLECTIVE SIMULATOR & STEP CONTROLLER */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          margin: "0 24px 20px 24px",
          background: "#0f172a",
          borderRadius: "12px",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Step Control Toolbar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            padding: "12px 18px",
            background: "rgba(30, 41, 59, 0.75)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
          }}
        >
          {/* Step Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              data-testid="step-back-btn"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentStepIndex === 0}
              style={{
                background: currentStepIndex === 0 ? "#1e293b" : "#334155",
                color: currentStepIndex === 0 ? "#64748b" : "#f8fafc",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: currentStepIndex === 0 ? "not-allowed" : "pointer",
              }}
            >
              ◀ Back
            </button>

            <button
              data-testid="play-pause-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              style={{
                background: isPlaying ? "#ef4444" : "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: isPlaying
                  ? "0 0 10px rgba(239, 68, 68, 0.5)"
                  : "0 0 10px rgba(16, 185, 129, 0.5)",
              }}
            >
              {isPlaying ? "❚❚ Pause" : "▶ Play"}
            </button>

            <button
              data-testid="step-forward-btn"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex((prev) => Math.min(totalSteps, prev + 1));
              }}
              disabled={currentStepIndex >= totalSteps}
              style={{
                background: currentStepIndex >= totalSteps ? "#1e293b" : "#334155",
                color: currentStepIndex >= totalSteps ? "#64748b" : "#f8fafc",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: currentStepIndex >= totalSteps ? "not-allowed" : "pointer",
              }}
            >
              Next ▶
            </button>

            <button
              data-testid="reset-btn"
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              style={{
                background: "#1e293b",
                color: "#94a3b8",
                border: "1px solid rgba(148, 163, 184, 0.2)",
                borderRadius: "6px",
                padding: "6px 10px",
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              ↺ Reset
            </button>
          </div>

          {/* Scrubber Slider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flex: 1,
              minWidth: "180px",
              maxWidth: "400px",
            }}
          >
            <span style={{ fontSize: "11px", color: "#94a3b8", minWidth: "50px" }}>
              Step {currentStepIndex}/{totalSteps}
            </span>
            <input
              data-testid="step-scrubber"
              type="range"
              min={0}
              max={totalSteps}
              value={currentStepIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentStepIndex(Number(e.target.value));
              }}
              style={{ width: "100%", accentColor: "#c084fc", cursor: "pointer" }}
            />
          </div>

          {/* Speed Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Speed:</span>
            {[0.5, 1.0, 2.0, 4.0].map((spd) => (
              <button
                key={spd}
                data-testid={`speed-btn-${spd}`}
                onClick={() => setPlaySpeed(spd)}
                style={{
                  background: playSpeed === spd ? "#c084fc" : "#1e293b",
                  color: playSpeed === spd ? "#090d16" : "#cbd5e1",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 7px",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Step Explanation Banner */}
        <div
          data-testid="step-info-banner"
          style={{
            padding: "12px 18px",
            background: "rgba(15, 23, 42, 0.9)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#f8fafc" }}>
              {activeStep.phase}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>
              {activeStep.description}
            </div>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              fontSize: "11px",
              color: "#38bdf8",
              fontWeight: 700,
            }}
          >
            {activeStep.formulaSnippet}
          </div>
        </div>

        {/* Topology Diagram SVG */}
        <div style={{ padding: "16px 20px", background: "#090d16" }}>
          <TopologySvgView
            topology={topologyType}
            numGpus={visualRanksCount}
            activeTransfers={activeStep.transfers}
            selectedRank={selectedRank}
            onSelectRank={(r) => setSelectedRank(r)}
          />
        </div>

        {/* Rank Buffer Matrix */}
        <div
          data-testid="rank-buffer-matrix"
          style={{
            padding: "16px 20px",
            background: "#0f172a",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
          }}
        >
          <div
            style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1", marginBottom: "10px" }}
          >
            GPU Rank Chunk Buffer Matrix ({visualRanksCount} Simulated Ranks)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {activeStep.rankStates.map((rankState) => {
              const isSelected = selectedRank === rankState.rank;
              return (
                <div
                  key={`rank-row-${rankState.rank}`}
                  onClick={() => setSelectedRank(rankState.rank)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: isSelected ? "rgba(168, 85, 247, 0.15)" : "transparent",
                    border: isSelected
                      ? "1px solid rgba(168, 85, 247, 0.4)"
                      : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isSelected ? "#c084fc" : "#94a3b8",
                      width: "60px",
                    }}
                  >
                    Rank {rankState.rank}:
                  </span>
                  <div style={{ display: "flex", gap: "6px", flex: 1, flexWrap: "wrap" }}>
                    {rankState.chunks.map((chunk) => {
                      let bgColor = "#1e293b";
                      let textColor = "#94a3b8";
                      let borderColor = "rgba(148, 163, 184, 0.2)";

                      if (chunk.status === "sending") {
                        bgColor = "rgba(245, 158, 11, 0.25)";
                        textColor = "#f59e0b";
                        borderColor = "#f59e0b";
                      } else if (chunk.status === "receiving") {
                        bgColor = "rgba(168, 85, 247, 0.25)";
                        textColor = "#c084fc";
                        borderColor = "#c084fc";
                      } else if (chunk.status === "reduced") {
                        bgColor = "rgba(52, 211, 153, 0.2)";
                        textColor = "#34d399";
                        borderColor = "#34d399";
                      } else if (chunk.status === "complete") {
                        bgColor = "rgba(56, 189, 248, 0.25)";
                        textColor = "#38bdf8";
                        borderColor = "#38bdf8";
                      }

                      return (
                        <div
                          key={`chunk-${chunk.chunkId}`}
                          style={{
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: bgColor,
                            color: textColor,
                            border: `1px solid ${borderColor}`,
                            fontSize: "10px",
                            fontWeight: 600,
                          }}
                        >
                          C{chunk.chunkId}: {chunk.valueLabel}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* COMPARATIVE ALGORITHM BENCHMARK TABLE */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          padding: "20px 24px",
          background: "rgba(10, 15, 26, 0.9)",
          borderTop: "1px solid rgba(148, 163, 184, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#f8fafc" }}>
              Collective Algorithm Scalability & Throughput Comparison
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#94a3b8" }}>
              Evaluated for {numGpus} GPUs with {formatBytes(payloadBytes)} payload over{" "}
              {linkTech.name}
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            data-testid="algorithm-comparison-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "11px",
              textAlign: "left",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.2)", color: "#cbd5e1" }}>
                <th style={{ padding: "8px 10px" }}>Algorithm</th>
                <th style={{ padding: "8px 10px" }}>Steps Formula</th>
                <th style={{ padding: "8px 10px" }}>Steps (P={numGpus})</th>
                <th style={{ padding: "8px 10px" }}>Startup α (ms)</th>
                <th style={{ padding: "8px 10px" }}>Transfer β (ms)</th>
                <th style={{ padding: "8px 10px" }}>Total Latency</th>
                <th style={{ padding: "8px 10px" }}>Effective BW</th>
                <th style={{ padding: "8px 10px" }}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {algorithmComparisons.map((row) => {
                const isCurrent = row.algorithm.id === collectiveId;
                return (
                  <tr
                    key={row.algorithm.id}
                    onClick={() => {
                      setCollectiveId(row.algorithm.id);
                      setCurrentStepIndex(0);
                    }}
                    style={{
                      borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                      background: isCurrent ? "rgba(168, 85, 247, 0.15)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 700,
                        color: isCurrent ? "#c084fc" : "#f8fafc",
                      }}
                    >
                      {row.algorithm.name} {isCurrent && "★"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#94a3b8" }}>
                      {row.algorithm.stepsFormulaDescription}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#e2e8f0" }}>{row.numSteps}</td>
                    <td style={{ padding: "8px 10px", color: "#c084fc" }}>
                      {formatTime(row.startupLatencyMs)}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#38bdf8" }}>
                      {formatTime(row.transferLatencyMs)}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        fontWeight: 700,
                        color: isCurrent ? "#34d399" : "#f8fafc",
                      }}
                    >
                      {formatTime(row.latencyMs)}
                    </td>
                    <td style={{ padding: "8px 10px", fontWeight: 700, color: "#34d399" }}>
                      {formatBandwidth(row.effectiveBandwidthGBs)}
                    </td>
                    <td
                      style={{
                        padding: "8px 10px",
                        color: row.scalingEfficiency > 80 ? "#34d399" : "#f59e0b",
                      }}
                    >
                      {row.scalingEfficiency.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InterconnectTopologyStudio;
