import { describe, expect, it } from "bun:test";
import React from "react";
import {
  FSDPZeROShardingStudio,
  getPrecisionBytes,
  getOptimizerBytesPerParam,
  calculateModelParamCount,
  calculateActivationMemory,
  calculateMemoryBreakdown,
  calculateCollectiveCommunication,
  calculateOffloadingTimeline,
  generateTrainingStepperSteps,
  calculateMaxBatchSize,
  calculateClusterScalingSweep,
  formatFSDPBytes as formatBytes,
  formatFlops,
  formatBandwidth,
  generatePyTorchFSDPCode,
  generateDeepSpeedConfig,
  getInterconnectBandwidthGbs,
  getFSDPGpuSpec as getGpuSpec,
  FSDP_PRESETS,
  type FSDPPresetId,
  type ModelArchitectureConfig,
  type ClusterConfig,
  type TrainingConfig,
} from "../../components/primitives";

describe("FSDPZeROShardingStudio & Distributed Sharding Engine", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props", () => {
    it("should instantiate FSDPZeROShardingStudio with default props", () => {
      const element = React.createElement(FSDPZeROShardingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(FSDPZeROShardingStudio);
    });

    it("should instantiate with custom preset, overrides, and callback handlers", () => {
      const onPresetChangeMock = () => {};
      const onTabChangeMock = () => {};

      const element = React.createElement(FSDPZeROShardingStudio, {
        initialPreset: "llama3_70b_8x_h100",
        initialModelConfig: { totalParamsB: 72.0 },
        initialClusterConfig: { numGpus: 16 },
        initialTrainingConfig: { microBatchSize: 4 },
        width: 1280,
        height: 800,
        standalone: true,
        title: "PyTorch FSDP & DeepSpeed ZeRO Research Workbench",
        onPresetChange: onPresetChangeMock,
        onTabChange: onTabChangeMock,
      });

      expect(element.props.initialPreset).toBe("llama3_70b_8x_h100");
      expect(element.props.initialModelConfig?.totalParamsB).toBe(72.0);
      expect(element.props.initialClusterConfig?.numGpus).toBe(16);
      expect(element.props.initialTrainingConfig?.microBatchSize).toBe(4);
      expect(element.props.width).toBe(1280);
      expect(element.props.height).toBe(800);
      expect(element.props.standalone).toBe(true);
      expect(element.props.title).toBe("PyTorch FSDP & DeepSpeed ZeRO Research Workbench");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & VALIDATION
  // ==========================================================================
  describe("2. Production Presets Integrity", () => {
    const presetIds: FSDPPresetId[] = [
      "llama3_8b_8x_h100",
      "llama3_70b_8x_h100",
      "llama3_70b_32x_a100",
      "llama3_405b_512x_h100",
      "deepseek_v3_256x_h100",
      "mixtral_8x7b_8x_a100",
      "gpt3_175b_64x_a100",
      "custom",
    ];

    it("should contain all 8 production presets with complete metadata", () => {
      for (const id of presetIds) {
        const preset = FSDP_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.architectureFamily.length).toBeGreaterThan(0);
        expect(preset.highlights.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("every preset should have valid model, cluster, and training parameters", () => {
      for (const id of presetIds) {
        const { model, cluster, training } = FSDP_PRESETS[id];

        // Model architecture bounds
        expect(model.totalParamsB).toBeGreaterThan(0);
        expect(model.numLayers).toBeGreaterThan(0);
        expect(model.hiddenDim).toBeGreaterThan(0);
        expect(model.numAttentionHeads).toBeGreaterThan(0);
        expect(model.numKvHeads).toBeGreaterThan(0);
        expect(model.numKvHeads).toBeLessThanOrEqual(model.numAttentionHeads);
        expect(model.intermediateDim).toBeGreaterThan(0);
        expect(model.vocabSize).toBeGreaterThan(0);

        // Cluster bounds
        expect(cluster.numGpus).toBeGreaterThanOrEqual(1);
        expect(cluster.numNodes).toBeGreaterThanOrEqual(1);
        expect(cluster.gpusPerNode).toBeGreaterThanOrEqual(1);
        expect(cluster.cpuRamPerNodeGb).toBeGreaterThanOrEqual(256);
        expect(cluster.nvmeBandwidthGbs).toBeGreaterThan(0);

        // Training bounds
        expect(training.microBatchSize).toBeGreaterThanOrEqual(1);
        expect(training.seqLength).toBeGreaterThanOrEqual(512);
        expect(["fp32", "fp16", "bf16", "fp8"]).toContain(training.modelPrecision);
        expect(["adamw_fp32", "adamw_8bit", "sgd_momentum", "sgd"]).toContain(
          training.optimizerType,
        );
        expect(["none", "selective", "full"]).toContain(training.activationCheckpointing);
        expect([
          "zero0_ddp",
          "zero1_opt",
          "zero2_opt_grad",
          "zero3_full",
          "hybrid_shard",
        ]).toContain(training.shardingStrategy);
      }
    });
  });

  // ==========================================================================
  // 3. PRECISION & OPTIMIZER MEMORY CALCULATIONS
  // ==========================================================================
  describe("3. Precision & Optimizer Memory Math", () => {
    it("should return correct byte size for each precision format", () => {
      expect(getPrecisionBytes("fp32")).toBe(4);
      expect(getPrecisionBytes("fp16")).toBe(2);
      expect(getPrecisionBytes("bf16")).toBe(2);
      expect(getPrecisionBytes("fp8")).toBe(1);
    });

    it("should compute exact optimizer state byte breakdown per parameter", () => {
      // AdamW FP32: 4B master weight + 4B momentum + 4B variance = 12B/param
      const adamwFp32 = getOptimizerBytesPerParam("adamw_fp32");
      expect(adamwFp32.masterWeightBytes).toBe(4);
      expect(adamwFp32.momentBytes).toBe(8);
      expect(adamwFp32.totalBytes).toBe(12);

      // AdamW 8-bit: 2B master + 2B moments = 4B/param
      const adamw8bit = getOptimizerBytesPerParam("adamw_8bit");
      expect(adamw8bit.masterWeightBytes).toBe(2);
      expect(adamw8bit.momentBytes).toBe(2);
      expect(adamw8bit.totalBytes).toBe(4);

      // SGD with Momentum: 4B master + 4B momentum = 8B/param
      const sgdMom = getOptimizerBytesPerParam("sgd_momentum");
      expect(sgdMom.masterWeightBytes).toBe(4);
      expect(sgdMom.momentBytes).toBe(4);
      expect(sgdMom.totalBytes).toBe(8);

      // Pure SGD: 4B master = 4B/param
      const sgdPure = getOptimizerBytesPerParam("sgd");
      expect(sgdPure.masterWeightBytes).toBe(4);
      expect(sgdPure.momentBytes).toBe(0);
      expect(sgdPure.totalBytes).toBe(4);
    });
  });

  // ==========================================================================
  // 4. MODEL PARAMETER & ARCHITECTURE CALCULATIONS
  // ==========================================================================
  describe("4. Model Architecture & Parameter Counts", () => {
    it("should calculate exact parameter count and per-layer parameters for LLaMA-3-8B", () => {
      const model = FSDP_PRESETS.llama3_8b_8x_h100.model;
      const { totalParams, layerParams, nonLayerParams } = calculateModelParamCount(model);

      expect(totalParams).toBe(8.03e9);
      expect(nonLayerParams).toBe(model.vocabSize * model.hiddenDim * 2);
      expect(layerParams).toBeGreaterThan(2e8); // ~218M params per layer
      expect(layerParams * model.numLayers + nonLayerParams).toBeCloseTo(totalParams, -5);
    });
  });

  // ==========================================================================
  // 5. ACTIVATION MEMORY MODELING
  // ==========================================================================
  describe("5. Activation Memory Estimation", () => {
    const testModel: ModelArchitectureConfig = {
      name: "Test-8B",
      totalParamsB: 8.0,
      numLayers: 32,
      hiddenDim: 4096,
      numAttentionHeads: 32,
      numKvHeads: 8,
      intermediateDim: 14336,
      vocabSize: 32000,
    };

    const baseTraining: TrainingConfig = {
      microBatchSize: 2,
      seqLength: 4096,
      modelPrecision: "bf16",
      optimizerType: "adamw_fp32",
      activationCheckpointing: "none",
      useFlashAttention: true,
      sequenceParallelSize: 1,
      shardingStrategy: "zero3_full",
      offloadTarget: "none",
      backwardPrefetch: true,
      forwardPrefetch: true,
      limitAllGathers: true,
    };

    it("should compute uncheckpointed activation memory with FlashAttention", () => {
      const act = calculateActivationMemory(testModel, baseTraining);
      expect(act.totalActivationBytes).toBeGreaterThan(0);
      expect(act.perLayerActivationBytes).toBe(act.totalActivationBytes / testModel.numLayers);
      expect(act.isFlashAttentionSaved).toBe(true);
      expect(act.checkpointingSavingsPct).toBe(0);
    });

    it("should reduce activation memory significantly under Full Checkpointing", () => {
      const noneAct = calculateActivationMemory(testModel, baseTraining);
      const fullAct = calculateActivationMemory(testModel, {
        ...baseTraining,
        activationCheckpointing: "full",
      });

      // Full activation checkpointing stores only layer input per layer: L * b * s * h * bpp
      const expectedFullBytes =
        testModel.numLayers *
        baseTraining.microBatchSize *
        baseTraining.seqLength *
        testModel.hiddenDim *
        getPrecisionBytes(baseTraining.modelPrecision);

      expect(fullAct.totalActivationBytes).toBe(expectedFullBytes);
      expect(fullAct.totalActivationBytes).toBeLessThan(noneAct.totalActivationBytes);
      expect(fullAct.checkpointingSavingsPct).toBeGreaterThan(70);
    });

    it("should reduce activation memory under Selective Activation Checkpointing (SAC)", () => {
      const noneAct = calculateActivationMemory(testModel, baseTraining);
      const sacAct = calculateActivationMemory(testModel, {
        ...baseTraining,
        activationCheckpointing: "selective",
      });

      expect(sacAct.totalActivationBytes).toBeLessThan(noneAct.totalActivationBytes);
      expect(sacAct.checkpointingSavingsPct).toBeCloseTo(60, 0);
    });

    it("should scale inversely with Sequence Parallelism degree (SP)", () => {
      const sp1Act = calculateActivationMemory(testModel, baseTraining);
      const sp2Act = calculateActivationMemory(testModel, {
        ...baseTraining,
        sequenceParallelSize: 2,
      });

      expect(sp2Act.totalActivationBytes).toBeCloseTo(sp1Act.totalActivationBytes / 2, 0);
    });
  });

  // ==========================================================================
  // 6. ZERO-0/1/2/3 & HYBRID SHARD MEMORY BREAKDOWN
  // ==========================================================================
  describe("6. ZeRO Sharding Stages VRAM Breakdown", () => {
    const model = FSDP_PRESETS.llama3_8b_8x_h100.model;
    const cluster = FSDP_PRESETS.llama3_8b_8x_h100.cluster; // 8x H100
    const training = FSDP_PRESETS.llama3_8b_8x_h100.training;

    it("ZeRO-0 (DDP) should keep full weights, full grads, and full optimizer states per GPU", () => {
      const mem = calculateMemoryBreakdown(model, cluster, {
        ...training,
        shardingStrategy: "zero0_ddp",
      });

      // 8.03B params in BF16 = 16.06 GB weights, 16.06 GB grads, 96.36 GB FP32 AdamW optimizer
      expect(mem.modelWeightsGb).toBeCloseTo(16.06, 1);
      expect(mem.gradientsGb).toBeCloseTo(16.06, 1);
      expect(mem.optimizerStatesGb).toBeCloseTo(96.36, 1);
      expect(mem.transientBufferGb).toBe(0);
      expect(mem.totalGpuVramRequiredGb).toBeGreaterThan(120); // Exceeds 80GB H100
      expect(mem.isOOM).toBe(true);
    });

    it("ZeRO-1 should shard optimizer states across 8 GPUs", () => {
      const mem = calculateMemoryBreakdown(model, cluster, {
        ...training,
        shardingStrategy: "zero1_opt",
      });

      expect(mem.modelWeightsGb).toBeCloseTo(16.06, 1);
      expect(mem.gradientsGb).toBeCloseTo(16.06, 1);
      expect(mem.optimizerStatesGb).toBeCloseTo(96.36 / 8, 1); // 12.04 GB
      expect(mem.transientBufferGb).toBe(0);
    });

    it("ZeRO-2 should shard optimizer states and gradients across 8 GPUs", () => {
      const mem = calculateMemoryBreakdown(model, cluster, {
        ...training,
        shardingStrategy: "zero2_opt_grad",
      });

      expect(mem.modelWeightsGb).toBeCloseTo(16.06, 1);
      expect(mem.gradientsGb).toBeCloseTo(16.06 / 8, 1); // 2.01 GB
      expect(mem.optimizerStatesGb).toBeCloseTo(96.36 / 8, 1); // 12.04 GB
      expect(mem.transientBufferGb).toBe(0);
    });

    it("ZeRO-3 (Full Shard) should shard weights, gradients, and optimizer states across 8 GPUs", () => {
      const mem = calculateMemoryBreakdown(model, cluster, {
        ...training,
        shardingStrategy: "zero3_full",
      });

      expect(mem.modelWeightsGb).toBeCloseTo(16.06 / 8, 1); // 2.01 GB
      expect(mem.gradientsGb).toBeCloseTo(16.06 / 8, 1); // 2.01 GB
      expect(mem.optimizerStatesGb).toBeCloseTo(96.36 / 8, 1); // 12.04 GB
      expect(mem.transientBufferGb).toBeGreaterThan(0); // Transient unsharded layer buffer
      expect(mem.isOOM).toBe(false);
      expect(mem.gpuHeadroomGb).toBeGreaterThan(40);
    });

    it("Hybrid Shard should shard weights across intra-node GPUs and replicate across nodes", () => {
      const multiNodeCluster: ClusterConfig = {
        ...cluster,
        numGpus: 32,
        numNodes: 4,
        gpusPerNode: 8,
      };

      const mem = calculateMemoryBreakdown(model, multiNodeCluster, {
        ...training,
        shardingStrategy: "hybrid_shard",
      });

      // Model weights sharded across 8 intra-node GPUs
      expect(mem.modelWeightsGb).toBeCloseTo(16.06 / 8, 1);
      expect(mem.gradientsGb).toBeCloseTo(16.06 / 8, 1);
      // Optimizer states sharded across all 32 GPUs in cluster
      expect(mem.optimizerStatesGb).toBeCloseTo(96.36 / 32, 1);
    });
  });

  // ==========================================================================
  // 7. COLLECTIVE COMMUNICATION VOLUME & MFU
  // ==========================================================================
  describe("7. Collective Communication & Throughput Modeling", () => {
    const model = FSDP_PRESETS.llama3_8b_8x_h100.model;
    const cluster = FSDP_PRESETS.llama3_8b_8x_h100.cluster;
    const training = FSDP_PRESETS.llama3_8b_8x_h100.training;

    it("ZeRO-1 and ZeRO-2 should have 1.0x communication volume multiplier vs DDP", () => {
      const commDdp = calculateCollectiveCommunication(model, cluster, {
        ...training,
        shardingStrategy: "zero0_ddp",
      });
      const commZeRO1 = calculateCollectiveCommunication(model, cluster, {
        ...training,
        shardingStrategy: "zero1_opt",
      });
      const commZeRO2 = calculateCollectiveCommunication(model, cluster, {
        ...training,
        shardingStrategy: "zero2_opt_grad",
      });

      expect(commDdp.commMultiplierVsDDP).toBe(1.0);
      expect(commZeRO1.commMultiplierVsDDP).toBe(1.0);
      expect(commZeRO2.commMultiplierVsDDP).toBe(1.0);
      expect(commZeRO1.totalCommBytesPerStep).toBe(commDdp.totalCommBytesPerStep);
    });

    it("ZeRO-3 (Full Shard) should have exactly 1.5x communication volume vs DDP", () => {
      const commZeRO3 = calculateCollectiveCommunication(model, cluster, {
        ...training,
        shardingStrategy: "zero3_full",
      });

      expect(commZeRO3.commMultiplierVsDDP).toBe(1.5);
      expect(commZeRO3.forwardCommBytesPerStep).toBeGreaterThan(0);
      expect(commZeRO3.backwardCommBytesPerStep).toBeGreaterThan(0);
    });

    it("should compute valid MFU % and token throughput", () => {
      const comm = calculateCollectiveCommunication(model, cluster, training);

      expect(comm.mfuPct).toBeGreaterThan(0);
      expect(comm.mfuPct).toBeLessThanOrEqual(100);
      expect(comm.globalTokensPerSec).toBeGreaterThan(0);
      expect(comm.tokensPerSecPerGpu).toBe(comm.globalTokensPerSec / cluster.numGpus);
      expect(comm.stepTimeMs).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 8. CPU / NVME ASYNCHRONOUS OFFLOADING
  // ==========================================================================
  describe("8. CPU & NVMe Asynchronous Offloading Engine", () => {
    const model = FSDP_PRESETS.llama3_70b_8x_h100.model; // 70.6B
    const cluster = FSDP_PRESETS.llama3_70b_8x_h100.cluster;
    const training = FSDP_PRESETS.llama3_70b_8x_h100.training;

    it("should calculate correct CPU RAM allocation for CPU Optimizer offload", () => {
      const offload = calculateOffloadingTimeline(model, cluster, {
        ...training,
        offloadTarget: "cpu_optimizer",
      });

      // 70.6B * 12B/param = 847.2 GB total / 8 GPUs = ~105.9 GB/GPU
      expect(offload.cpuRamRequiredGb).toBeGreaterThan(100);
      expect(offload.nvmeRequiredGb).toBe(0);
      expect(offload.isHostRamOOM).toBe(false);
    });

    it("should calculate NVMe storage requirement for NVMe offload", () => {
      const offload = calculateOffloadingTimeline(model, cluster, {
        ...training,
        offloadTarget: "nvme_all",
      });

      expect(offload.cpuRamRequiredGb).toBe(0);
      expect(offload.nvmeRequiredGb).toBeGreaterThan(100);
    });

    it("should compute overlap efficiency and stall bubbles", () => {
      const offload = calculateOffloadingTimeline(model, cluster, {
        ...training,
        offloadTarget: "cpu_optimizer",
      });

      expect(offload.transferTimeMs).toBeGreaterThan(0);
      expect(offload.computeTimeMs).toBeGreaterThan(0);
      expect(offload.overlapEfficiencyPct).toBeGreaterThanOrEqual(0);
      expect(offload.overlapEfficiencyPct).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // 9. STEP-BY-STEP SIMULATION STEPPER
  // ==========================================================================
  describe("9. Collective Communication Simulation Stepper", () => {
    const model = FSDP_PRESETS.llama3_8b_8x_h100.model;
    const cluster = FSDP_PRESETS.llama3_8b_8x_h100.cluster;
    const training = FSDP_PRESETS.llama3_8b_8x_h100.training;

    it("should generate a complete training iteration pipeline with 4 visual layers", () => {
      const steps = generateTrainingStepperSteps(model, cluster, training, 4);

      expect(steps.length).toBeGreaterThan(10);

      // Verify presence of all key phases
      const phases = steps.map((s) => s.phase);
      expect(phases).toContain("forward_allgather");
      expect(phases).toContain("forward_compute");
      expect(phases).toContain("forward_free");
      expect(phases).toContain("loss");
      expect(phases).toContain("backward_allgather");
      expect(phases).toContain("backward_compute");
      expect(phases).toContain("backward_reducescatter");
      expect(phases).toContain("optimizer_step");

      // Verify steps have valid non-empty titles, formulas, descriptions, and allocations
      for (const step of steps) {
        expect(step.stepTitle.length).toBeGreaterThan(0);
        expect(step.stepDescription.length).toBeGreaterThan(0);
        expect(step.mathFormula.length).toBeGreaterThan(0);
        expect(step.gpuVramAllocations.length).toBe(cluster.numGpus);
      }
    });
  });

  // ==========================================================================
  // 10. CLUSTER SCALING SWEEP & CODE GENERATORS
  // ==========================================================================
  describe("10. Scaling Sweeps, Code Generators & Utility Helpers", () => {
    const model = FSDP_PRESETS.llama3_8b_8x_h100.model;
    const cluster = FSDP_PRESETS.llama3_8b_8x_h100.cluster;
    const training = FSDP_PRESETS.llama3_8b_8x_h100.training;

    it("should compute cluster scaling sweep across 1 to 512 GPUs", () => {
      const sweep = calculateClusterScalingSweep(
        model,
        cluster,
        training,
        [1, 2, 4, 8, 16, 32, 64],
      );
      expect(sweep.length).toBe(7);

      for (const row of sweep) {
        expect(row.worldSize).toBeGreaterThan(0);
        expect(row.numNodes).toBeGreaterThan(0);
        expect(row.vramPerGpuGb).toBeGreaterThan(0);
        expect(row.computeTimeMs).toBeGreaterThan(0);
        expect(row.commTimeMs).toBeGreaterThanOrEqual(0);
      }
    });

    it("should calculate max batch size without crashing or returning negative", () => {
      const maxBatch = calculateMaxBatchSize(model, cluster, training);
      expect(maxBatch).toBeGreaterThanOrEqual(1);
    });

    it("should generate valid PyTorch FSDP Python script", () => {
      const code = generatePyTorchFSDPCode(model, cluster, training);
      expect(code).toContain("FullyShardedDataParallel as FSDP");
      expect(code).toContain("ShardingStrategy.FULL_SHARD");
      expect(code).toContain("MixedPrecision");
      expect(code).toContain("torch.optim.AdamW");
    });

    it("should generate valid DeepSpeed JSON configuration", () => {
      const dsJson = generateDeepSpeedConfig(model, cluster, training);
      const parsed = JSON.parse(dsJson);
      expect(parsed.train_micro_batch_size_per_gpu).toBe(training.microBatchSize);
      expect(parsed.zero_optimization.stage).toBe(3);
      expect(parsed.bf16.enabled).toBe(true);
    });

    it("should format bytes, flops, and bandwidth human-readably", () => {
      expect(formatBytes(1500)).toBe("1.50 KB");
      expect(formatBytes(2.5e9)).toBe("2.50 GB");
      expect(formatFlops(3.12e14)).toBe("312.00 TFLOPs");
      expect(formatBandwidth(900)).toBe("900.0 GB/s");
      expect(formatBandwidth(1200)).toBe("1.2 TB/s");
    });

    it("should return correct interconnect specs and GPU specs", () => {
      expect(getInterconnectBandwidthGbs("nvlink_4_900gb")).toBe(900);
      expect(getInterconnectBandwidthGbs("infiniband_800gbps")).toBe(100);
      expect(getGpuSpec("h100_80gb").vramGb).toBe(80);
      expect(getGpuSpec("non_existent").vramGb).toBe(80); // Fallback
    });
  });
});
