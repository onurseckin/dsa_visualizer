import { describe, expect, it } from "bun:test";
import {
  CLUSTER_TOPOLOGIES,
  MODEL_ARCHITECTURES,
  simulate3DParallelism,
  simulateMoEDispatch,
} from "../distributedSimulator";

describe("Distributed Training Topology & Communication Simulator Tests", () => {
  describe("1. Cluster Topologies & Model Configurations", () => {
    it("should provide valid specifications for canonical cluster topologies", () => {
      const topologies = Object.values(CLUSTER_TOPOLOGIES);
      expect(topologies.length).toBeGreaterThanOrEqual(3);

      for (const cluster of topologies) {
        expect(cluster.totalGpus).toBe(cluster.numNodes * cluster.gpusPerNode);
        expect(cluster.gpuMemoryGB).toBeGreaterThanOrEqual(80);
        expect(cluster.intraNodeBandwidthGBs).toBeGreaterThanOrEqual(600);
        expect(cluster.interNodeBandwidthGBs).toBeGreaterThan(0);
      }
    });

    it("should define authentic foundation model architectures", () => {
      const llama8b = MODEL_ARCHITECTURES.llama3_8b;
      const llama70b = MODEL_ARCHITECTURES.llama3_70b;
      const llama405b = MODEL_ARCHITECTURES.llama3_405b;

      expect(llama8b.numLayers).toBe(32);
      expect(llama70b.numLayers).toBe(80);
      expect(llama405b.numLayers).toBe(126);
      expect(llama405b.numParameters).toBeGreaterThan(400e9);
    });
  });

  describe("2. 3D Parallelism & ZeRO Memory Sharding Simulation", () => {
    it("should reject configurations that exceed physical cluster GPU capacity", () => {
      const llama70b = MODEL_ARCHITECTURES.llama3_70b;
      const cluster = CLUSTER_TOPOLOGIES.h100_cluster_64; // 64 GPUs

      const result = simulate3DParallelism(llama70b, cluster, {
        tpDegree: 8,
        ppDegree: 8,
        dpDegree: 2, // 8 * 8 * 2 = 128 GPUs > 64 GPUs
        numMicrobatches: 16,
        microbatchSize: 1,
        seqLen: 4096,
        zeroStage: 3,
        activationCheckpointing: true,
      });

      expect(result.isValidConfiguration).toBe(false);
      expect(result.validationError).toContain("exceeds cluster capacity");
    });

    it("should accurately model ZeRO-0 to ZeRO-3 memory reduction on Llama-3-8B", () => {
      const llama8b = MODEL_ARCHITECTURES.llama3_8b;
      const cluster = CLUSTER_TOPOLOGIES.h100_cluster_64;

      // Pure DP=8 (TP=1, PP=1, DP=8)
      const baseOptions = {
        tpDegree: 1,
        ppDegree: 1,
        dpDegree: 8,
        numMicrobatches: 8,
        microbatchSize: 1,
        seqLen: 2048,
        activationCheckpointing: true,
      };

      const z0 = simulate3DParallelism(llama8b, cluster, { ...baseOptions, zeroStage: 0 });
      const z1 = simulate3DParallelism(llama8b, cluster, { ...baseOptions, zeroStage: 1 });
      const z2 = simulate3DParallelism(llama8b, cluster, { ...baseOptions, zeroStage: 2 });
      const z3 = simulate3DParallelism(llama8b, cluster, { ...baseOptions, zeroStage: 3 });

      // Model weight is ~ 14.95 GB (8.03e9 * 2 bytes)
      expect(z0.memoryPerGpuGB.weights).toBe(z1.memoryPerGpuGB.weights);
      expect(z0.memoryPerGpuGB.weights).toBe(z2.memoryPerGpuGB.weights);
      // ZeRO-3 shards weights by DP=8
      expect(z3.memoryPerGpuGB.weights).toBeCloseTo(z0.memoryPerGpuGB.weights / 8, 1);

      // ZeRO-1 shards optimizer states (12 bytes/param) by DP=8
      expect(z1.memoryPerGpuGB.optimizerStates).toBeCloseTo(
        z0.memoryPerGpuGB.optimizerStates / 8,
        1,
      );

      // ZeRO-2 shards gradients (2 bytes/param) by DP=8
      expect(z2.memoryPerGpuGB.gradients).toBeCloseTo(z0.memoryPerGpuGB.gradients / 8, 1);

      // ZeRO-3 total static memory should be ~ 8x smaller than ZeRO-0
      expect(z3.memoryPerGpuGB.totalStatic).toBeLessThan(z0.memoryPerGpuGB.totalStatic / 5);
    });

    it("Llama-3-70B 3D Parallelism configuration on 64x H100", () => {
      const llama70b = MODEL_ARCHITECTURES.llama3_70b;
      const cluster = CLUSTER_TOPOLOGIES.h100_cluster_64;

      // 64 GPUs: TP=8 (intra-node), PP=4, DP=2, ZeRO-3
      const result = simulate3DParallelism(llama70b, cluster, {
        tpDegree: 8,
        ppDegree: 4,
        dpDegree: 2,
        numMicrobatches: 16,
        microbatchSize: 1,
        seqLen: 4096,
        zeroStage: 3,
        activationCheckpointing: true,
      });

      expect(result.isValidConfiguration).toBe(true);
      expect(result.totalGpusUsed).toBe(64);
      expect(result.memoryPerGpuGB.fitsInGpuMemory).toBe(true);
      expect(result.memoryPerGpuGB.hbmUtilizationPercent).toBeLessThan(100);

      // Pipeline bubble: (PP-1) / (M + PP - 1) = 3 / (16 + 3) = 3/19 ≈ 15.8%
      expect(result.communication.ppBubbleFraction).toBeCloseTo(15.8, 1);
      expect(result.communication.tpVolumePerStepMB).toBeGreaterThan(0);
      expect(result.communication.dpVolumePerStepMB).toBeGreaterThan(0);
    });

    it("Activation checkpointing should dramatically reduce peak activation memory", () => {
      const llama8b = MODEL_ARCHITECTURES.llama3_8b;
      const cluster = CLUSTER_TOPOLOGIES.h100_cluster_64;

      const withoutCheckpointing = simulate3DParallelism(llama8b, cluster, {
        tpDegree: 1,
        ppDegree: 1,
        dpDegree: 8,
        numMicrobatches: 8,
        microbatchSize: 2,
        seqLen: 4096,
        zeroStage: 3,
        activationCheckpointing: false,
      });

      const withCheckpointing = simulate3DParallelism(llama8b, cluster, {
        tpDegree: 1,
        ppDegree: 1,
        dpDegree: 8,
        numMicrobatches: 8,
        microbatchSize: 2,
        seqLen: 4096,
        zeroStage: 3,
        activationCheckpointing: true,
      });

      expect(withCheckpointing.memoryPerGpuGB.activations).toBeLessThan(
        withoutCheckpointing.memoryPerGpuGB.activations / 10,
      );
    });
  });

  describe("3. Mixture-of-Experts (MoE) All-to-All Dispatch Simulation", () => {
    it("should compute expert capacity and token drop rate under capacity factor constraints", () => {
      const cluster = CLUSTER_TOPOLOGIES.h100_cluster_64;
      // 8192 tokens, 8 experts, top-2 routing, capacity factor 1.0
      const result = simulateMoEDispatch(8192, 8, 2, 1.0, 4096, 8, cluster);

      // Expected tokens per expert = (8192 * 2) / 8 = 2048 tokens
      expect(result.expertCapacity).toBe(2048);
      expect(result.allToAllVolumeMB).toBeGreaterThan(0);
      expect(result.allToAllTimeMs).toBeGreaterThan(0);
      expect(result.droppedTokensCount).toBeGreaterThan(0);
    });

    it("higher capacity factor should eliminate dropped tokens", () => {
      const cluster = CLUSTER_TOPOLOGIES.h100_cluster_64;
      // Capacity factor 2.0 provides 200% headroom
      const result = simulateMoEDispatch(4096, 8, 2, 2.0, 4096, 8, cluster);

      expect(result.droppedTokensCount).toBe(0);
      expect(result.dropRatePercent).toBe(0);
    });
  });
});
