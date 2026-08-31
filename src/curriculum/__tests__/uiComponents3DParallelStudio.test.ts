import { describe, expect, it } from "bun:test";
import React from "react";
import {
  PipelineTensorParallelStudio,
  PIPELINE_GPU_HARDWARE_SPECS as GPU_HARDWARE_SPECS,
  PARALLEL_PRESETS,
  getBytesPerElement,
  getPipelineOptimizerBytesPerParam as getOptimizerBytesPerParam,
  calculate3DMemoryBreakdown,
  computeBubbleFraction,
  generatePipelineSchedule,
  computeCommunicationVolume,
  computeMFUAndThroughput,
  computeTensorParallelGEMMTrace,
  computeSequenceParallelSavings,
  generateDeviceMeshMapping,
  generateMegatronLaunchCommand,
  generatePyTorchDeviceMeshCode,
  generateDeepSpeed3DConfig,
  format3DParallelBytes as formatBytes,
  formatFLOPs,
  formatTokensPerSec,
  formatLatencyMs,
  type ParallelPresetId,
  type StudioTabId,
  type PipelineTensorParallelStudioProps,
} from "../../components/primitives";

describe("3D Parallelism & Pipeline Schedules Studio Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS HANDLING
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate PipelineTensorParallelStudio with default props", () => {
      const element = React.createElement(PipelineTensorParallelStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(PipelineTensorParallelStudio);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialTab).toBeUndefined();
    });

    it("should support all 6 presets via initialPreset prop", () => {
      const presets: ParallelPresetId[] = [
        "llama3_8b_8x_h100",
        "llama3_70b_64x_h100",
        "llama3_405b_512x_h100",
        "deepseek_v3_256x_h100",
        "gpt3_175b_64x_a100",
        "custom",
      ];

      for (const preset of presets) {
        const element = React.createElement(PipelineTensorParallelStudio, {
          initialPreset: preset,
        });
        expect(element.props.initialPreset).toBe(preset);
      }
    });

    it("should support all 5 tabs via initialTab prop", () => {
      const tabs: StudioTabId[] = [
        "cluster_planner",
        "tensor_parallel",
        "pipeline_schedules",
        "sequence_parallel",
        "code_generator",
      ];

      for (const tab of tabs) {
        const element = React.createElement(PipelineTensorParallelStudio, {
          initialTab: tab,
        });
        expect(element.props.initialTab).toBe(tab);
      }
    });

    it("should accept custom className and title props", () => {
      const props: PipelineTensorParallelStudioProps = {
        initialPreset: "llama3_405b_512x_h100",
        initialTab: "pipeline_schedules",
        className: "custom-parallel-studio-class",
        title: "Enterprise 3D Parallel Benchmark",
      };

      const element = React.createElement(PipelineTensorParallelStudio, props);
      expect(element.props.initialPreset).toBe("llama3_405b_512x_h100");
      expect(element.props.initialTab).toBe("pipeline_schedules");
      expect(element.props.className).toBe("custom-parallel-studio-class");
      expect(element.props.title).toBe("Enterprise 3D Parallel Benchmark");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & HARDWARE SPECIFICATIONS
  // ==========================================================================
  describe("2. Preset Configurations & Hardware Specifications", () => {
    it("should provide valid configurations for all canonical presets", () => {
      const presetKeys = Object.keys(PARALLEL_PRESETS) as ParallelPresetId[];
      expect(presetKeys.length).toBe(6);

      for (const key of presetKeys) {
        const preset = PARALLEL_PRESETS[key];
        expect(preset.id).toBe(key);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.model.totalParamsB).toBeGreaterThan(0);
        expect(preset.model.numLayers).toBeGreaterThan(0);
        expect(preset.model.hiddenDim).toBeGreaterThan(0);
        expect(preset.model.numAttentionHeads).toBeGreaterThan(0);
        expect(preset.hardware.vramGb).toBeGreaterThanOrEqual(24);
        expect(preset.parallelism.dp).toBeGreaterThanOrEqual(1);
        expect(preset.parallelism.tp).toBeGreaterThanOrEqual(1);
        expect(preset.parallelism.pp).toBeGreaterThanOrEqual(1);
        expect(preset.targetMfu).toBeGreaterThan(0);
        expect(preset.targetMfu).toBeLessThanOrEqual(1.0);
      }
    });

    it("should verify H100 SXM5, A100 SXM4, and B200 hardware specs", () => {
      const h100 = GPU_HARDWARE_SPECS.h100_sxm5;
      expect(h100.vramGb).toBe(80);
      expect(h100.tflopsBf16).toBe(989);
      expect(h100.bandwidthGbs).toBe(3350);
      expect(h100.nvlinkBandwidthGbs).toBe(900);

      const a100 = GPU_HARDWARE_SPECS.a100_sxm4;
      expect(a100.vramGb).toBe(80);
      expect(a100.tflopsBf16).toBe(312);
      expect(a100.bandwidthGbs).toBe(2039);
      expect(a100.nvlinkBandwidthGbs).toBe(600);

      const b200 = GPU_HARDWARE_SPECS.b200_sxm;
      expect(b200.vramGb).toBe(192);
      expect(b200.tflopsBf16).toBe(2250);
      expect(b200.nvlinkBandwidthGbs).toBe(1800);
    });

    it("should verify LLaMA-3-70B 64x H100 3D parallelism architecture", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      expect(preset.model.totalParamsB).toBe(70.6);
      expect(preset.model.numLayers).toBe(80);
      expect(preset.model.hiddenDim).toBe(8192);
      expect(preset.model.intermediateDim).toBe(28672);
      expect(preset.model.numAttentionHeads).toBe(64);
      expect(preset.model.numKvHeads).toBe(8);
      expect(preset.parallelism.tp).toBe(4);
      expect(preset.parallelism.pp).toBe(4);
      expect(preset.parallelism.dp).toBe(4);
      expect(preset.parallelism.sequenceParallel).toBe("megatron_sp");
    });

    it("should verify DeepSeek-V3 MoE preset specifications", () => {
      const preset = PARALLEL_PRESETS.deepseek_v3_256x_h100;
      expect(preset.model.isMoE).toBe(true);
      expect(preset.model.totalParamsB).toBe(671.0);
      expect(preset.model.numExperts).toBe(256);
      expect(preset.model.topKExperts).toBe(8);
      expect(preset.parallelism.ep).toBe(16);
    });
  });

  // ==========================================================================
  // 3. 3D MEMORY BREAKDOWN CALCULATIONS
  // ==========================================================================
  describe("3. 3D Memory Breakdown Calculations", () => {
    it("should compute memory bytes per element correctly", () => {
      expect(getBytesPerElement("fp32")).toBe(4);
      expect(getBytesPerElement("fp16")).toBe(2);
      expect(getBytesPerElement("bf16")).toBe(2);
      expect(getBytesPerElement("fp8")).toBe(1);
    });

    it("should compute optimizer bytes per param correctly", () => {
      expect(getOptimizerBytesPerParam("adamw_fp32")).toBe(12);
      expect(getOptimizerBytesPerParam("adamw_8bit")).toBe(6);
      expect(getOptimizerBytesPerParam("sgd_momentum")).toBe(8);
      expect(getOptimizerBytesPerParam("sgd")).toBe(4);
    });

    it("should compute memory breakdown for single GPU (TP=1, PP=1, DP=1)", () => {
      const preset = PARALLEL_PRESETS.llama3_8b_8x_h100;
      const singleGpuParallelism = {
        ...preset.parallelism,
        dp: 1,
        tp: 1,
        pp: 1,
        activationCheckpointing: "none" as const,
      };

      const mem = calculate3DMemoryBreakdown(preset.model, preset.hardware, singleGpuParallelism);

      // Model weights = 8.03B params * 2 bytes = ~16.06 GB
      expect(mem.weightsGb).toBeGreaterThan(14.0);
      expect(mem.weightsGb).toBeLessThan(18.0);

      // Optimizer states = 8.03B * 12 bytes = ~96.36 GB
      expect(mem.optimizerGb).toBeGreaterThan(85.0);
      expect(mem.optimizerGb).toBeLessThan(105.0);

      // Total memory should exceed 80GB VRAM, triggering OOM
      expect(mem.isOOM).toBe(true);
      expect(mem.oomDeficitGb).toBeGreaterThan(0);
      expect(mem.freeGb).toBe(0);
    });

    it("should shard model weights and optimizer states with TP and PP", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const mem = calculate3DMemoryBreakdown(preset.model, preset.hardware, preset.parallelism);

      // 70.6B params * 2 bytes = 141.2 GB unsharded.
      // With TP=4, PP=4, divisor = 16 -> ~8.8 GB weights per GPU
      expect(mem.weightsGb).toBeGreaterThan(8.0);
      expect(mem.weightsGb).toBeLessThan(10.0);

      // ZeRO-1 shards optimizer across DP=4 -> (70.6B * 12) / (4 * 4 * 4) = ~13.2 GB
      expect(mem.optimizerGb).toBeGreaterThan(11.0);
      expect(mem.optimizerGb).toBeLessThan(16.0);

      // Fits on 80GB H100
      expect(mem.isOOM).toBe(false);
      expect(mem.freeGb).toBeGreaterThan(20.0);
    });

    it("should verify ZeRO-3 sharding reduces weights memory across DP ranks", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const zero3Parallelism = {
        ...preset.parallelism,
        zeroStage: "zero3" as const,
      };

      const memZero3 = calculate3DMemoryBreakdown(preset.model, preset.hardware, zero3Parallelism);
      const memZero1 = calculate3DMemoryBreakdown(
        preset.model,
        preset.hardware,
        preset.parallelism,
      );

      // In ZeRO-3, weights are sharded across DP=4 -> 4x smaller weights stored
      expect(memZero3.weightsGb).toBeCloseTo(memZero1.weightsGb / 4, 1);
    });

    it("should verify activation checkpointing modes (none vs selective vs full)", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;

      const memNone = calculate3DMemoryBreakdown(preset.model, preset.hardware, {
        ...preset.parallelism,
        activationCheckpointing: "none",
      });

      const memSelective = calculate3DMemoryBreakdown(preset.model, preset.hardware, {
        ...preset.parallelism,
        activationCheckpointing: "selective",
      });

      const memFull = calculate3DMemoryBreakdown(preset.model, preset.hardware, {
        ...preset.parallelism,
        activationCheckpointing: "full",
      });

      expect(memNone.activationsGb).toBeGreaterThan(memSelective.activationsGb);
      expect(memSelective.activationsGb).toBeGreaterThan(memFull.activationsGb);
    });

    it("should ensure breakdown percentages sum to 100%", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const mem = calculate3DMemoryBreakdown(preset.model, preset.hardware, preset.parallelism);

      const sumPct =
        mem.breakdownPct.weights +
        mem.breakdownPct.optimizer +
        mem.breakdownPct.gradients +
        mem.breakdownPct.activations +
        mem.breakdownPct.kvCache +
        mem.breakdownPct.workingBuffer;

      expect(sumPct).toBeCloseTo(100.0, 1);
    });
  });

  // ==========================================================================
  // 4. BUBBLE FRACTION CALCULATIONS
  // ==========================================================================
  describe("4. Pipeline Bubble Fraction Calculations", () => {
    it("should return zero bubble for single pipeline stage (PP=1)", () => {
      const bubble = computeBubbleFraction("1f1b", 1, 8, 1, 1, 2);
      expect(bubble.bubbleFraction).toBe(0);
      expect(bubble.bubbleTime).toBe(0);
    });

    it("should compute GPipe bubble fraction for P=4, M=8", () => {
      const bubble = computeBubbleFraction("gpipe", 4, 8, 1, 1, 2);
      // (P - 1) * (tf + tb) = 3 * 3 = 9
      // Ideal = 8 * 3 = 24
      // Total = 33
      // Bubble fraction = 9 / 33 = ~0.2727 (27.3%)
      expect(bubble.bubbleTime).toBe(9);
      expect(bubble.idealExecutionTime).toBe(24);
      expect(bubble.totalExecutionTime).toBe(33);
      expect(bubble.bubbleFraction).toBeCloseTo(9 / 33, 4);
    });

    it("should verify 1F1B-Interleaved reduces bubble fraction by factor of v", () => {
      const bubbleStandard = computeBubbleFraction("1f1b", 8, 16, 1, 1, 2);
      const bubbleInterleaved2 = computeBubbleFraction("1f1b_interleaved", 8, 16, 2, 1, 2);
      const bubbleInterleaved4 = computeBubbleFraction("1f1b_interleaved", 8, 16, 4, 1, 2);

      expect(bubbleInterleaved2.bubbleTime).toBeCloseTo(bubbleStandard.bubbleTime / 2, 2);
      expect(bubbleInterleaved4.bubbleTime).toBeCloseTo(bubbleStandard.bubbleTime / 4, 2);
      expect(bubbleInterleaved4.bubbleFraction).toBeLessThan(bubbleInterleaved2.bubbleFraction);
    });

    it("should handle custom forward and backward execution times", () => {
      const bubble = computeBubbleFraction("1f1b", 4, 8, 1, 2, 4);
      expect(bubble.bubbleTime).toBe(3 * (2 + 4)); // 18
      expect(bubble.idealExecutionTime).toBe(8 * 6); // 48
      expect(bubble.totalExecutionTime).toBe(66);
    });
  });

  // ==========================================================================
  // 5. PIPELINE SCHEDULE GANTT TIMELINE GENERATION
  // ==========================================================================
  describe("5. Pipeline Schedule Gantt Timeline Generation", () => {
    it("should generate valid GPipe schedule events", () => {
      const schedule = generatePipelineSchedule("gpipe", 4, 8, 1, 1, 2, 0);

      expect(schedule.pipelineType).toBe("gpipe");
      expect(schedule.numStages).toBe(4);
      expect(schedule.numMicrobatches).toBe(8);
      expect(schedule.totalCycles).toBeGreaterThan(0);
      expect(schedule.events.length).toBe(4 * 8 * 2); // 4 stages * 8 mb * (forward + backward)

      // Forward events
      const forwardEvents = schedule.events.filter((e) => e.type === "forward");
      expect(forwardEvents.length).toBe(32);

      // Backward events
      const backwardEvents = schedule.events.filter((e) => e.type === "backward");
      expect(backwardEvents.length).toBe(32);

      // Check event ordering
      for (const ev of schedule.events) {
        expect(ev.startCycle).toBeLessThan(ev.endCycle);
        expect(ev.duration).toBeGreaterThan(0);
      }
    });

    it("should generate valid 1F1B schedule events with alternating forwards and backwards", () => {
      const schedule = generatePipelineSchedule("1f1b", 4, 8, 1, 1, 2, 0);

      expect(schedule.pipelineType).toBe("1f1b");
      expect(schedule.events.length).toBeGreaterThan(0);
      expect(schedule.stageMemoryCurves.length).toBe(4);

      // Peak activations should not exceed number of stages P=4
      for (let s = 0; s < 4; s++) {
        expect(schedule.peakActivationsPerStage[s]).toBeLessThanOrEqual(8);
      }
    });

    it("should generate 1F1B-Interleaved schedule with virtual stages (v=2)", () => {
      const schedule = generatePipelineSchedule("1f1b_interleaved", 4, 8, 2, 1, 2, 0);

      expect(schedule.virtualStages).toBe(2);
      expect(schedule.events.length).toBeGreaterThan(0);

      // Check that virtualStageId 0 and 1 exist
      const v0Events = schedule.events.filter((e) => e.virtualStageId === 0);
      const v1Events = schedule.events.filter((e) => e.virtualStageId === 1);
      expect(v0Events.length).toBeGreaterThan(0);
      expect(v1Events.length).toBeGreaterThan(0);
    });

    it("should maintain valid stage memory curves over all cycles", () => {
      const schedule = generatePipelineSchedule("1f1b", 4, 8, 1, 1, 2, 0);

      for (let stage = 0; stage < 4; stage++) {
        const curve = schedule.stageMemoryCurves[stage];
        expect(curve).toBeDefined();
        expect(curve!.length).toBe(schedule.totalCycles + 1);

        // Activations should start at 0
        expect(curve![0]).toBe(0);

        // Activations should never be negative
        for (const val of curve!) {
          expect(val).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  // ==========================================================================
  // 6. COMMUNICATION VOLUME CALCULATIONS
  // ==========================================================================
  describe("6. Communication Volume Calculations", () => {
    it("should return zero communication for single GPU setup (TP=1, PP=1, DP=1)", () => {
      const preset = PARALLEL_PRESETS.llama3_8b_8x_h100;
      const singleParallelism = {
        ...preset.parallelism,
        dp: 1,
        tp: 1,
        pp: 1,
        cp: 1,
        ep: 1,
      };

      const comm = computeCommunicationVolume(preset.model, singleParallelism, 2, 4096);
      expect(comm.tpVolumeBytesPerLayer).toBe(0);
      expect(comm.ppVolumeBytesPerMicrobatch).toBe(0);
      expect(comm.dpVolumeBytesPerStep).toBe(0);
      expect(comm.totalVolumeBytesPerStep).toBe(0);
    });

    it("should compute TP All-Reduce volume per layer for TP=4", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const comm = computeCommunicationVolume(preset.model, preset.parallelism, 1, 8192);

      // TP=4: 4 * (2 * 3/4) * (1 * 8192 * 8192 * 2 bytes) = 6 * 134,217,728 bytes = ~805 MB
      expect(comm.tpVolumeBytesPerLayer).toBeGreaterThan(700 * 1024 * 1024);
      expect(comm.tpVolumeBytesPerLayer).toBeLessThan(900 * 1024 * 1024);
    });

    it("should compute PP point-to-point boundary volume for PP=4", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const comm = computeCommunicationVolume(preset.model, preset.parallelism, 1, 8192);

      // PP: 2 * (1 * 8192 * 8192 * 2) = 268,435,456 bytes = 256 MB per microbatch
      expect(comm.ppVolumeBytesPerMicrobatch).toBe(268435456);
    });

    it("should compute DP gradient synchronization volume for DP=4", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const comm = computeCommunicationVolume(preset.model, preset.parallelism, 1, 8192);

      // DP: (2 * 3/4) * (70.6B / (4 * 4)) * 2 bytes = 1.5 * 4.4125B * 2 = ~13.2 GB
      expect(comm.dpVolumeBytesPerStep).toBeGreaterThan(10 * 1024 * 1024 * 1024);
      expect(comm.dpVolumeBytesPerStep).toBeLessThan(16 * 1024 * 1024 * 1024);
    });
  });

  // ==========================================================================
  // 7. MFU & THROUGHPUT CALCULATIONS
  // ==========================================================================
  describe("7. Model FLOPs Utilization (MFU) & Throughput", () => {
    it("should compute theoretical FLOPs per token (6 * params + 12 * L * h * s)", () => {
      const preset = PARALLEL_PRESETS.llama3_8b_8x_h100;
      const mfu = computeMFUAndThroughput(preset.model, preset.hardware, preset.parallelism, 600);

      // 6 * 8.03B + 12 * 32 * 4096 * 4096
      expect(mfu.flopsPerToken).toBeGreaterThan(4.8e10);
      expect(mfu.totalFlopsPerStep).toBeGreaterThan(0);
      expect(mfu.tokensPerStep).toBe(
        preset.parallelism.globalBatchSize * preset.parallelism.seqLen,
      );
    });

    it("should compute MFU and tokens per second accurately", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const mfu = computeMFUAndThroughput(preset.model, preset.hardware, preset.parallelism, 500);

      expect(mfu.mfuPct).toBeGreaterThan(0);
      expect(mfu.mfuPct).toBeLessThanOrEqual(100);
      expect(mfu.tokensPerSecPerGpu).toBeGreaterThan(0);
      expect(mfu.totalClusterTokensPerSec).toBeCloseTo(mfu.tokensPerSecPerGpu * 64, -1);
    });

    it("should scale HFU higher than MFU when activation checkpointing is enabled", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;

      const mfuSelective = computeMFUAndThroughput(
        preset.model,
        preset.hardware,
        {
          ...preset.parallelism,
          activationCheckpointing: "selective",
        },
        15000,
      );

      const mfuFull = computeMFUAndThroughput(
        preset.model,
        preset.hardware,
        {
          ...preset.parallelism,
          activationCheckpointing: "full",
        },
        15000,
      );

      expect(mfuSelective.hfuPct).toBeGreaterThan(mfuSelective.mfuPct);
      expect(mfuFull.hfuPct).toBeGreaterThan(mfuSelective.hfuPct);
    });
  });

  // ==========================================================================
  // 8. MEGATRON TENSOR PARALLEL GEMM TRACE
  // ==========================================================================
  describe("8. Megatron Tensor Parallel GEMM Slicing Trace", () => {
    it("should generate full MLP block slicing trace", () => {
      const trace = computeTensorParallelGEMMTrace("mlp", 4096, 14336, 32, 4, 2048, 2);

      expect(trace.tpDegree).toBe(4);
      expect(trace.steps.length).toBe(3);

      // Step 1: Column GEMM (Gate & Up)
      const colStep = trace.steps[0];
      expect(colStep.component).toBe("mlp_gate_col");
      expect(colStep.communicationType).toBe("f_identity");
      expect(colStep.rankSlices.length).toBe(4);
      expect(colStep.rankSlices[0].partialSum).toBe(false);

      // Step 2: Activation
      const actStep = trace.steps[1];
      expect(actStep.component).toBe("mlp_act");
      expect(actStep.communicationType).toBe("none");

      // Step 3: Row GEMM (Down projection + All-Reduce)
      const rowStep = trace.steps[2];
      expect(rowStep.component).toBe("mlp_down_row");
      expect(rowStep.communicationType).toBe("g_allreduce");
      expect(rowStep.rankSlices[0].partialSum).toBe(true);
      expect(rowStep.commVolumeBytes).toBeGreaterThan(0);
    });

    it("should generate Self-Attention block slicing trace", () => {
      const trace = computeTensorParallelGEMMTrace("attention", 4096, 14336, 32, 4, 2048, 2);

      expect(trace.steps.length).toBe(3);
      expect(trace.headsPerRank).toBe(8); // 32 heads / 4 TP = 8 heads per GPU

      // Step 1: QKV Column GEMM
      expect(trace.steps[0].component).toBe("qkv_column");
      expect(trace.steps[0].communicationType).toBe("f_identity");

      // Step 2: Local Attention Core
      expect(trace.steps[1].component).toBe("attn_core");
      expect(trace.steps[1].communicationType).toBe("none");

      // Step 3: Out-Projection Row GEMM + All-Reduce
      expect(trace.steps[2].component).toBe("out_row");
      expect(trace.steps[2].communicationType).toBe("g_allreduce");
    });

    it("should generate full Transformer block trace combining Attention and MLP", () => {
      const trace = computeTensorParallelGEMMTrace(
        "transformer_block",
        8192,
        28672,
        64,
        8,
        4096,
        1,
      );

      expect(trace.steps.length).toBe(6);
      expect(trace.totalCommBytesForward).toBeGreaterThan(0);
      expect(trace.totalCommBytesBackward).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 9. SEQUENCE PARALLELISM SAVINGS
  // ==========================================================================
  describe("9. Sequence Parallelism Savings Analysis", () => {
    it("should compute activation memory savings for Megatron SP vs Standard TP", () => {
      const savings = computeSequenceParallelSavings(8192, 8192, 1, 80, 4, false);

      expect(savings.standardTpActivationMb).toBeGreaterThan(savings.megatronSpActivationMb);
      expect(savings.savingsPctVsStandardTp).toBeGreaterThan(0);
      expect(savings.maxSupportedSeqLenSP).toBeGreaterThan(savings.maxSupportedSeqLenStandard);
    });

    it("should scale savings higher at larger TP degrees (TP=8)", () => {
      const savingsTP4 = computeSequenceParallelSavings(8192, 8192, 1, 80, 4, false);
      const savingsTP8 = computeSequenceParallelSavings(8192, 8192, 1, 80, 8, false);

      expect(savingsTP8.savingsPctVsStandardTp).toBeGreaterThan(savingsTP4.savingsPctVsStandardTp);
    });

    it("should evaluate DeepSpeed Ulysses and Ring Attention memory profiles", () => {
      const savings = computeSequenceParallelSavings(8192, 16384, 1, 80, 8, true);

      expect(savings.deepspeedUlyssesActivationMb).toBeCloseTo(savings.megatronSpActivationMb, 1);
      expect(savings.ringAttentionActivationMb).toBeLessThanOrEqual(savings.megatronSpActivationMb);
    });
  });

  // ==========================================================================
  // 10. DEVICEMESH MAPPING & CARTESIAN RANK COORDINATES
  // ==========================================================================
  describe("10. DeviceMesh Mapping & Cartesian Rank Coordinates", () => {
    it("should map 64 GPUs into 3D Cartesian coordinates (DP=4, PP=4, TP=4)", () => {
      const mesh = generateDeviceMeshMapping(64, 4, 4, 4, 1);

      expect(mesh.worldSize).toBe(64);
      expect(mesh.ranks.length).toBe(64);
      expect(mesh.meshShape.dp).toBe(4);
      expect(mesh.meshShape.pp).toBe(4);
      expect(mesh.meshShape.tp).toBe(4);

      // Verify Rank 0 coordinates
      const rank0 = mesh.ranks[0];
      expect(rank0.globalRank).toBe(0);
      expect(rank0.dpRank).toBe(0);
      expect(rank0.ppRank).toBe(0);
      expect(rank0.tpRank).toBe(0);
      expect(rank0.nodeIndex).toBe(0);
      expect(rank0.localGpuIndex).toBe(0);

      // Verify Rank 63 coordinates
      const rank63 = mesh.ranks[63];
      expect(rank63.globalRank).toBe(63);
      expect(rank63.dpRank).toBe(3);
      expect(rank63.ppRank).toBe(3);
      expect(rank63.tpRank).toBe(3);
      expect(rank63.nodeIndex).toBe(7);
      expect(rank63.localGpuIndex).toBe(7);
    });

    it("should generate distinct and valid communication groups", () => {
      const mesh = generateDeviceMeshMapping(16, 2, 2, 4, 1);

      // TP groups (ranks varying in TP): size = 2 * 4 * 1 = 8 groups of size 2
      expect(mesh.tpGroups.length).toBe(8);
      for (const group of mesh.tpGroups) {
        expect(group.length).toBe(2);
      }

      // PP groups (ranks varying in PP): size = 2 * 2 * 1 = 4 groups of size 4
      expect(mesh.ppGroups.length).toBe(4);
      for (const group of mesh.ppGroups) {
        expect(group.length).toBe(4);
      }

      // DP groups (ranks varying in DP): size = 4 * 2 * 1 = 8 groups of size 2
      expect(mesh.dpGroups.length).toBe(8);
      for (const group of mesh.dpGroups) {
        expect(group.length).toBe(2);
      }
    });

    it("should handle single GPU edge case (DP=1, PP=1, TP=1, CP=1)", () => {
      const mesh = generateDeviceMeshMapping(1, 1, 1, 1, 1);
      expect(mesh.worldSize).toBe(1);
      expect(mesh.ranks.length).toBe(1);
      expect(mesh.tpGroups.length).toBe(1);
      expect(mesh.tpGroups[0]).toEqual([0]);
    });
  });

  // ==========================================================================
  // 11. CODE GENERATION EXPORTERS
  // ==========================================================================
  describe("11. Production Code Generation Exporters", () => {
    it("should generate valid Megatron launch command string", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const cmd = generateMegatronLaunchCommand(preset.model, preset.parallelism);

      expect(cmd).toContain("--tensor-model-parallel-size 4");
      expect(cmd).toContain("--pipeline-model-parallel-size 4");
      expect(cmd).toContain("--micro-batch-size 1");
      expect(cmd).toContain("--global-batch-size 128");
      expect(cmd).toContain("--seq-length 8192");
      expect(cmd).toContain("--sequence-parallel");
      expect(cmd).toContain("--bf16");
    });

    it("should generate PyTorch 2.x DeviceMesh script", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const code = generatePyTorchDeviceMeshCode(preset.model, preset.parallelism);

      expect(code).toContain("init_device_mesh");
      expect(code).toContain('mesh_dim_names=("dp", "pp", "tp")');
      expect(code).toContain("ColwiseParallel()");
      expect(code).toContain("RowwiseParallel()");
      expect(code).toContain("parallelize_module");
      expect(code).toContain("Schedule1F1B");
    });

    it("should generate valid parseable DeepSpeed 3D JSON configuration", () => {
      const preset = PARALLEL_PRESETS.llama3_70b_64x_h100;
      const jsonStr = generateDeepSpeed3DConfig(preset.model, preset.parallelism);

      expect(() => JSON.parse(jsonStr)).not.toThrow();
      const parsed = JSON.parse(jsonStr);
      expect(parsed.train_batch_size).toBe(128);
      expect(parsed.train_micro_batch_size_per_gpu).toBe(1);
      expect(parsed.pipeline.stages).toBe(4);
      expect(parsed.tensor_parallel.tp_size).toBe(4);
      expect(parsed.bf16.enabled).toBe(true);
    });
  });

  // ==========================================================================
  // 12. FORMATTING UTILITIES & EXTREME EDGE CASES
  // ==========================================================================
  describe("12. Formatting Utilities & Extreme Edge Cases", () => {
    it("should format bytes accurately across B, KB, MB, GB, TB", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(1024 * 10)).toBe("10.0 KB");
      expect(formatBytes(1024 * 1024 * 256)).toBe("256.0 MB");
      expect(formatBytes(1024 * 1024 * 1024 * 80)).toBe("80.00 GB");
      expect(formatBytes(1024 * 1024 * 1024 * 1024 * 2.5)).toBe("2.50 TB");
    });

    it("should format FLOPs accurately", () => {
      expect(formatFLOPs(500)).toBe("500.0 TFLOPS");
      expect(formatFLOPs(2500)).toBe("2.50 PFLOPS");
      expect(formatFLOPs(1500000)).toBe("1.50 EFLOPS");
    });

    it("should format tokens per second accurately", () => {
      expect(formatTokensPerSec(450)).toBe("450 tok/s");
      expect(formatTokensPerSec(45000)).toBe("45.0K tok/s");
      expect(formatTokensPerSec(1250000)).toBe("1.25M tok/s");
    });

    it("should format latency in ms and seconds", () => {
      expect(formatLatencyMs(45.5)).toBe("45.5 ms");
      expect(formatLatencyMs(1500)).toBe("1.50 s");
    });

    it("should handle extreme cluster sizes (512 GPUs) without numerical instability", () => {
      const preset = PARALLEL_PRESETS.llama3_405b_512x_h100;
      const mem = calculate3DMemoryBreakdown(preset.model, preset.hardware, preset.parallelism);

      expect(mem.totalGb).toBeGreaterThan(0);
      expect(Number.isFinite(mem.totalGb)).toBe(true);

      const schedule = generatePipelineSchedule("1f1b_interleaved", 8, 32, 4, 1, 2, 0);
      expect(schedule.totalCycles).toBeGreaterThan(0);
      expect(Number.isFinite(schedule.bubbleFraction)).toBe(true);
    });
  });
});
