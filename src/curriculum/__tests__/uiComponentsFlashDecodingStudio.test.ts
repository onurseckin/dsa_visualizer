import { describe, expect, it } from "bun:test";
import React from "react";
import {
  FlashDecodingStudio,
  FLASH_DECODING_GPU_SPECS,
  FLASH_DECODING_PRESETS,
  getBytesPerPrecision,
  formatBytes,
  formatFlops,
  formatBandwidth,
  formatLatencyUs,
  formatNumberWithCommas,
  calculateSplitKParameters,
  computePartialSoftmaxSplit,
  mergePartialSoftmaxSplits,
  buildTreeReductionGraph,
  generateSyntheticQKV,
  verifyFlashDecodingNumericAccuracy,
  calculateSmOccupancyAndWaves,
  calculateFlashDecodingRoofline,
  generateTritonFlashDecodingCode,
  generatePyTorchSplitKReferenceCode,
  generateCudaFlashDecodingHeader,
  generateVllmEngineLaunchCommand,
  type FlashDecodingPresetId,
  type FlashDecodingTabId,
  type FlashDecodingStudioProps,
  type FlashDecodingConfig,
  type PrecisionFormat,
  type PartialSoftmaxSplit,
} from "../../components/primitives/FlashDecodingStudio";

describe("FlashDecoding & Split-K KV Cache Inference Studio Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS HANDLING
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate FlashDecodingStudio with default props", () => {
      const element = React.createElement(FlashDecodingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(FlashDecodingStudio);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialTab).toBeUndefined();
    });

    it("should support all 9 presets via initialPreset prop", () => {
      const presets: FlashDecodingPresetId[] = [
        "llama3_8b_8k_h100",
        "llama3_8b_128k_h100",
        "llama3_70b_32k_h100",
        "llama3_70b_128k_b200",
        "deepseek_v3_64k_h100",
        "deepseek_v3_128k_h100",
        "mistral_large_128k_a100",
        "qwen25_72b_32k_4090",
        "custom",
      ];

      for (const preset of presets) {
        const element = React.createElement(FlashDecodingStudio, {
          initialPreset: preset,
        });
        expect(element.props.initialPreset).toBe(preset);
      }
    });

    it("should support all 5 tabs via initialTab prop", () => {
      const tabs: FlashDecodingTabId[] = [
        "split_k_stepper",
        "partial_softmax_math",
        "sm_occupancy_grid",
        "roofline_benchmark",
        "kernel_code_gen",
      ];

      for (const tab of tabs) {
        const element = React.createElement(FlashDecodingStudio, {
          initialTab: tab,
        });
        expect(element.props.initialTab).toBe(tab);
      }
    });

    it("should accept custom className and title props", () => {
      const props: FlashDecodingStudioProps = {
        initialPreset: "llama3_70b_128k_b200",
        initialTab: "roofline_benchmark",
        className: "custom-flash-decoding-class",
        title: "Enterprise Split-K Inference Profiler",
      };

      const element = React.createElement(FlashDecodingStudio, props);
      expect(element.props.initialPreset).toBe("llama3_70b_128k_b200");
      expect(element.props.initialTab).toBe("roofline_benchmark");
      expect(element.props.className).toBe("custom-flash-decoding-class");
      expect(element.props.title).toBe("Enterprise Split-K Inference Profiler");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & HARDWARE SPECIFICATIONS
  // ==========================================================================
  describe("2. Preset Configurations & Hardware Specifications", () => {
    it("should provide valid configurations for all canonical presets", () => {
      const presetKeys = Object.keys(FLASH_DECODING_PRESETS) as FlashDecodingPresetId[];
      expect(presetKeys.length).toBeGreaterThanOrEqual(9);

      for (const key of presetKeys) {
        const preset = FLASH_DECODING_PRESETS[key];
        expect(preset.id).toBe(key);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);

        const { config } = preset;
        expect(config.batchSize).toBeGreaterThanOrEqual(1);
        expect(config.seqLen).toBeGreaterThanOrEqual(1024);
        expect(config.numHeads).toBeGreaterThanOrEqual(8);
        expect(config.numKvHeads).toBeGreaterThanOrEqual(1);
        expect(config.numHeads % config.numKvHeads).toBe(0); // Valid GQA ratio
        expect(config.headDim).toBeGreaterThanOrEqual(64);
        expect(config.numSplits).toBeGreaterThanOrEqual(1);
        expect(FLASH_DECODING_GPU_SPECS[config.gpuType]).toBeDefined();
        expect(["fp32", "fp16", "bf16", "fp8"]).toContain(config.precision);
      }
    });

    it("should verify H100, A100, B200, L40S, RTX 4090, and V100 GPU specs", () => {
      const gpus = ["h100", "a100", "b200", "l40s", "rtx4090", "v100"];

      for (const gpuId of gpus) {
        const spec = FLASH_DECODING_GPU_SPECS[gpuId];
        expect(spec).toBeDefined();
        expect(spec.smCount).toBeGreaterThan(0);
        expect(spec.vramGb).toBeGreaterThan(0);
        expect(spec.hbmBandwidthGbs).toBeGreaterThan(0);
        expect(spec.tflopsBf16).toBeGreaterThan(0);
        expect(spec.tflopsFp16).toBeGreaterThan(0);
        expect(spec.maxWarpsPerSm).toBeGreaterThanOrEqual(32);
        expect(spec.sharedMemoryPerSmKb).toBeGreaterThanOrEqual(64);
        expect(spec.maxThreadsPerSm).toBeGreaterThanOrEqual(1024);
      }

      // Exact hardware verification
      expect(FLASH_DECODING_GPU_SPECS.h100.smCount).toBe(132);
      expect(FLASH_DECODING_GPU_SPECS.h100.hbmBandwidthGbs).toBe(3350);
      expect(FLASH_DECODING_GPU_SPECS.b200.smCount).toBe(160);
      expect(FLASH_DECODING_GPU_SPECS.b200.hbmBandwidthGbs).toBe(8000);
      expect(FLASH_DECODING_GPU_SPECS.a100.smCount).toBe(108);
      expect(FLASH_DECODING_GPU_SPECS.rtx4090.smCount).toBe(128);
    });

    it("should calculate precision byte sizes accurately", () => {
      expect(getBytesPerPrecision("fp32")).toBe(4);
      expect(getBytesPerPrecision("fp16")).toBe(2);
      expect(getBytesPerPrecision("bf16")).toBe(2);
      expect(getBytesPerPrecision("fp8")).toBe(1);
    });
  });

  // ==========================================================================
  // 3. SPLIT-K TILING PARAMETER CALCULATIONS
  // ==========================================================================
  describe("3. Split-K Tiling Parameter Calculations", () => {
    it("should calculate parameters for evenly divisible sequence lengths", () => {
      const config: FlashDecodingConfig = {
        batchSize: 2,
        seqLen: 8192,
        numHeads: 32,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 16,
        gpuType: "h100",
        precision: "bf16",
      };

      const params = calculateSplitKParameters(config);
      expect(params.numSplits).toBe(16);
      expect(params.chunkSize).toBe(512);
      expect(params.totalThreadBlocks).toBe(2 * 32 * 16); // 1024 threadblocks
      expect(params.blocksPerHead).toBe(16);
      expect(params.kvLengthPerSplit).toBe(512);
    });

    it("should handle uneven division with ceiling chunk size", () => {
      const config: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 1000,
        numHeads: 16,
        numKvHeads: 4,
        headDim: 64,
        numSplits: 16,
        gpuType: "a100",
        precision: "fp16",
      };

      const params = calculateSplitKParameters(config);
      expect(params.numSplits).toBe(16);
      expect(params.chunkSize).toBe(63); // ceil(1000 / 16) = 63
      expect(params.totalThreadBlocks).toBe(1 * 16 * 16);
    });

    it("should clamp numSplits when greater than seqLen", () => {
      const config: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 8,
        numHeads: 4,
        numKvHeads: 2,
        headDim: 32,
        numSplits: 64,
        gpuType: "h100",
        precision: "bf16",
      };

      const params = calculateSplitKParameters(config);
      expect(params.numSplits).toBe(8);
      expect(params.chunkSize).toBe(1);
    });
  });

  // ==========================================================================
  // 4. PURE MATHEMATICAL PARTIAL SOFTMAX & NUMERICAL VERIFICATION
  // ==========================================================================
  describe("4. Online Softmax Mathematics & Verification Engine", () => {
    it("should compute partial softmax for a single chunk correctly", () => {
      const q = [1.0, 0.0, 0.0, 0.0];
      const kChunk = [
        [1.0, 0.0, 0.0, 0.0],
        [2.0, 0.0, 0.0, 0.0],
      ];
      const vChunk = [
        [10.0, 1.0, 0.0, 0.0],
        [20.0, 2.0, 0.0, 0.0],
      ];
      const scale = 1.0;

      const split = computePartialSoftmaxSplit(q, kChunk, vChunk, scale, 0, 0);

      expect(split.splitIndex).toBe(0);
      expect(split.chunkSize).toBe(2);
      expect(split.maxScore).toBeCloseTo(2.0, 5);

      // Score 0 = 1.0, Score 1 = 2.0
      // p0 = exp(1 - 2) = exp(-1) = 0.367879
      // p1 = exp(2 - 2) = exp(0) = 1.0
      // sumExp = 1 + exp(-1) = 1.367879
      expect(split.sumExp).toBeCloseTo(1 + Math.exp(-1), 5);

      const expectedO0 = (Math.exp(-1) * 10.0 + 1.0 * 20.0) / (1 + Math.exp(-1));
      const expectedO1 = (Math.exp(-1) * 1.0 + 1.0 * 2.0) / (1 + Math.exp(-1));
      expect(split.partialOutput[0]).toBeCloseTo(expectedO0, 5);
      expect(split.partialOutput[1]).toBeCloseTo(expectedO1, 5);
    });

    it("should handle empty chunk gracefully", () => {
      const q = [1.0, 2.0];
      const emptyK: number[][] = [];
      const emptyV: number[][] = [];

      const split = computePartialSoftmaxSplit(q, emptyK, emptyV, 1.0, 3, 100);
      expect(split.splitIndex).toBe(3);
      expect(split.chunkSize).toBe(0);
      expect(split.maxScore).toBe(-Infinity);
      expect(split.sumExp).toBe(0);
      expect(split.partialOutput).toEqual([0, 0]);
    });

    it("should merge two splits with exact online softmax rescaling", () => {
      const headDim = 2;
      const split0: PartialSoftmaxSplit = {
        splitIndex: 0,
        startIdx: 0,
        endIdx: 2,
        chunkSize: 2,
        maxScore: 1.0,
        sumExp: 2.0,
        partialOutput: [5.0, 10.0],
        rawScoresSample: [0.5, 1.0],
        expWeightsSample: [Math.exp(-0.5), 1.0],
        scale: 1.0,
      };

      const split1: PartialSoftmaxSplit = {
        splitIndex: 1,
        startIdx: 2,
        endIdx: 4,
        chunkSize: 2,
        maxScore: 3.0,
        sumExp: 4.0,
        partialOutput: [15.0, 30.0],
        rawScoresSample: [2.5, 3.0],
        expWeightsSample: [Math.exp(-0.5), 1.0],
        scale: 1.0,
      };

      const merged = mergePartialSoftmaxSplits([split0, split1], headDim);

      expect(merged.globalMax).toBe(3.0);

      // alpha0 = 2.0 * exp(1.0 - 3.0) = 2.0 * exp(-2)
      // alpha1 = 4.0 * exp(3.0 - 3.0) = 4.0
      const alpha0 = 2.0 * Math.exp(-2.0);
      const alpha1 = 4.0;
      const totalSum = alpha0 + alpha1;

      expect(merged.globalSum).toBeCloseTo(totalSum, 6);

      const w0 = alpha0 / totalSum;
      const w1 = alpha1 / totalSum;
      const expectedO0 = w0 * 5.0 + w1 * 15.0;
      const expectedO1 = w0 * 10.0 + w1 * 30.0;

      expect(merged.output[0]).toBeCloseTo(expectedO0, 6);
      expect(merged.output[1]).toBeCloseTo(expectedO1, 6);
    });

    it("should verify FlashDecoding matches Monolithic Attention with < 1e-5 error and cosine similarity >= 0.999999", () => {
      const seqLen = 64;
      const headDim = 16;
      const numSplits = 8;

      const { q, k, v } = generateSyntheticQKV(seqLen, headDim, 12345);
      const result = verifyFlashDecodingNumericAccuracy(q, k, v, numSplits);

      expect(result.isMatch).toBe(true);
      expect(result.maxAbsError).toBeLessThan(1e-5);
      expect(result.relativeL2Error).toBeLessThan(1e-5);
      expect(result.cosineSimilarity).toBeGreaterThanOrEqual(0.999999);
      expect(result.splits.length).toBe(numSplits);
    });

    it("should verify single split K=1 is identical to monolithic attention", () => {
      const seqLen = 32;
      const headDim = 8;
      const { q, k, v } = generateSyntheticQKV(seqLen, headDim, 777);

      const result = verifyFlashDecodingNumericAccuracy(q, k, v, 1);
      expect(result.isMatch).toBe(true);
      expect(result.maxAbsError).toBeLessThan(1e-9);
      expect(result.cosineSimilarity).toBeCloseTo(1.0, 7);
    });

    it("should maintain stability across large score differences (high Delta m_k)", () => {
      const q = [10.0, 20.0, 30.0, 40.0];
      const k = [
        [-5.0, -10.0, -15.0, -20.0],
        [5.0, 10.0, 15.0, 20.0],
        [-2.0, -4.0, -6.0, -8.0],
        [4.0, 8.0, 12.0, 16.0],
      ];
      const v = [
        [1.0, 2.0, 3.0, 4.0],
        [10.0, 20.0, 30.0, 40.0],
        [5.0, 6.0, 7.0, 8.0],
        [50.0, 60.0, 70.0, 80.0],
      ];

      const result = verifyFlashDecodingNumericAccuracy(q, k, v, 2);
      expect(result.isMatch).toBe(true);
      expect(result.maxAbsError).toBeLessThan(1e-5);
      expect(result.cosineSimilarity).toBeGreaterThanOrEqual(0.999999);
    });
  });

  // ==========================================================================
  // 5. TREE REDUCTION GRAPH CONSTRUCTION & EVALUATION
  // ==========================================================================
  describe("5. Tree Reduction Graph Construction", () => {
    it("should build multi-stage reduction tree for power of 2 splits (K=8)", () => {
      const seqLen = 64;
      const headDim = 8;
      const { q, k, v } = generateSyntheticQKV(seqLen, headDim, 999);
      const verification = verifyFlashDecodingNumericAccuracy(q, k, v, 8);

      const stages = buildTreeReductionGraph(verification.splits);

      // K=8 -> Stage 0 (8 leaves) -> Stage 1 (4 nodes) -> Stage 2 (2 nodes) -> Stage 3 (1 root)
      expect(stages.length).toBe(4);
      expect(stages[0].nodes.length).toBe(8);
      expect(stages[1].nodes.length).toBe(4);
      expect(stages[2].nodes.length).toBe(2);
      expect(stages[3].nodes.length).toBe(1);

      // Final root output in tree reduction must match merged output
      const rootNode = stages[3].nodes[0];
      expect(rootNode.splitIndices.length).toBe(8);

      for (let d = 0; d < headDim; d++) {
        expect(rootNode.mergedOutput[d]).toBeCloseTo(verification.flashDecodingOutput[d], 5);
      }
    });

    it("should handle odd number of splits with carry-over (K=5)", () => {
      const seqLen = 50;
      const headDim = 8;
      const { q, k, v } = generateSyntheticQKV(seqLen, headDim, 101);
      const verification = verifyFlashDecodingNumericAccuracy(q, k, v, 5);

      const stages = buildTreeReductionGraph(verification.splits);

      // K=5 -> Stage 0 (5 nodes) -> Stage 1 (3 nodes) -> Stage 2 (2 nodes) -> Stage 3 (1 root)
      expect(stages.length).toBe(4);
      expect(stages[0].nodes.length).toBe(5);
      expect(stages[1].nodes.length).toBe(3);
      expect(stages[2].nodes.length).toBe(2);
      expect(stages[3].nodes.length).toBe(1);

      const rootNode = stages[3].nodes[0];
      for (let d = 0; d < headDim; d++) {
        expect(rootNode.mergedOutput[d]).toBeCloseTo(verification.flashDecodingOutput[d], 5);
      }
    });

    it("should handle empty splits array gracefully", () => {
      const stages = buildTreeReductionGraph([]);
      expect(stages).toEqual([]);
    });
  });

  // ==========================================================================
  // 6. SM OCCUPANCY & WAVEFRONT GRID CALCULATIONS
  // ==========================================================================
  describe("6. SM Occupancy & Wavefront Grid Modeling", () => {
    it("should demonstrate massive SM occupancy gain on H100 (132 SMs)", () => {
      const config: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 131072,
        numHeads: 32,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 64,
        gpuType: "h100",
        precision: "bf16",
      };
      const h100Spec = FLASH_DECODING_GPU_SPECS.h100;

      const occupancy = calculateSmOccupancyAndWaves(config, h100Spec);

      // FA: 1 * 32 = 32 blocks on 132 SMs -> 32/132 = 24.24%
      expect(occupancy.flashAttentionThreadBlocks).toBe(32);
      expect(occupancy.flashAttentionActiveSms).toBe(32);
      expect(occupancy.flashAttentionSmUtilizationPercent).toBeCloseTo((32 / 132) * 100, 1);

      // FlashDecoding: 1 * 32 * 64 = 2048 blocks on 132 SMs -> 16 waves
      expect(occupancy.totalThreadBlocks).toBe(2048);
      expect(occupancy.activeSms).toBe(132); // All SMs saturated!
      expect(occupancy.waves).toBe(Math.ceil(2048 / 132)); // 16 waves
      expect(occupancy.smUtilizationPercent).toBeGreaterThan(95.0);
      expect(occupancy.occupancySpeedupFactor).toBeGreaterThan(3.5);

      // Threadblocks per SM distribution length
      expect(occupancy.blocksPerSmDistribution.length).toBe(132);
      const totalAllocatedBlocks = occupancy.blocksPerSmDistribution.reduce((a, b) => a + b, 0);
      expect(totalAllocatedBlocks).toBe(2048);
    });

    it("should accurately model tail wave penalty when blocks do not divide SM count evenly", () => {
      const config: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 8192,
        numHeads: 32,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 5,
        gpuType: "a100",
        precision: "bf16",
      };
      const a100Spec = FLASH_DECODING_GPU_SPECS.a100; // 108 SMs

      // Total blocks = 1 * 32 * 5 = 160 blocks
      // Waves = ceil(160 / 108) = 2 waves
      // Wave 1: 108 blocks across 108 SMs
      // Wave 2: 52 blocks across 52 SMs (56 idle SMs in wave 2)
      const occupancy = calculateSmOccupancyAndWaves(config, a100Spec);

      expect(occupancy.totalThreadBlocks).toBe(160);
      expect(occupancy.waves).toBe(2);
      expect(occupancy.tailWaveActiveSms).toBe(52);
      expect(occupancy.tailWavePenalty).toBeCloseTo(((108 - 52) / (2 * 108)) * 100, 1);
    });
  });

  // ==========================================================================
  // 7. ROOFLINE MODEL & LATENCY PROFILER
  // ==========================================================================
  describe("7. Roofline Model & Latency Profiler", () => {
    it("should verify LLM decoding is memory-bandwidth bound ($AI \\ll Knee$)", () => {
      const config: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 32768,
        numHeads: 32,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 32,
        gpuType: "h100",
        precision: "bf16",
      };
      const h100Spec = FLASH_DECODING_GPU_SPECS.h100;

      const roofline = calculateFlashDecodingRoofline(config, h100Spec);

      expect(roofline.isMemoryBound).toBe(true);
      expect(roofline.arithmeticIntensity).toBeLessThan(10.0); // Typically 0.5 - 2.0 FLOP/Byte
      expect(roofline.rooflineKneeIntensity).toBeGreaterThan(100.0); // ~295 FLOP/Byte on Hopper
      expect(roofline.speedupFactor).toBeGreaterThan(1.0);
      expect(roofline.flashDecodingLatencyUs).toBeLessThan(roofline.flashAttentionLatencyUs);
    });

    it("should compute exact KV cache sizes across precisions", () => {
      const baseConfig: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 16384,
        numHeads: 32,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 16,
        gpuType: "h100",
        precision: "bf16",
      };
      const h100Spec = FLASH_DECODING_GPU_SPECS.h100;

      // BF16 = 2 Bytes
      // 2 * 1 * 16384 * 8 * 128 * 2 = 67,108,864 Bytes = 64 MB
      const rooflineBf16 = calculateFlashDecodingRoofline(baseConfig, h100Spec);
      expect(rooflineBf16.kvCacheSizeBytes).toBe(2 * 1 * 16384 * 8 * 128 * 2);

      // FP8 = 1 Byte
      const configFp8 = { ...baseConfig, precision: "fp8" as PrecisionFormat };
      const rooflineFp8 = calculateFlashDecodingRoofline(configFp8, h100Spec);
      expect(rooflineFp8.kvCacheSizeBytes).toBe(2 * 1 * 16384 * 8 * 128 * 1);
      expect(rooflineFp8.kvCacheSizeBytes).toBe(rooflineBf16.kvCacheSizeBytes / 2);
    });

    it("should generate valid sequence scaling points", () => {
      const config: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 131072,
        numHeads: 32,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 64,
        gpuType: "h100",
        precision: "bf16",
      };
      const h100Spec = FLASH_DECODING_GPU_SPECS.h100;

      const roofline = calculateFlashDecodingRoofline(config, h100Spec);
      expect(roofline.latencyCurvePoints.length).toBe(9);

      // Speedup should increase as sequence length grows
      const firstPt = roofline.latencyCurvePoints[0]; // 1024
      const lastPt = roofline.latencyCurvePoints[roofline.latencyCurvePoints.length - 1]; // 262144

      expect(lastPt.faLatencyUs).toBeGreaterThan(firstPt.faLatencyUs);
      expect(lastPt.fdLatencyUs).toBeGreaterThan(firstPt.fdLatencyUs);
      expect(lastPt.speedup).toBeGreaterThan(firstPt.speedup);
    });
  });

  // ==========================================================================
  // 8. CODE GENERATORS
  // ==========================================================================
  describe("8. Production Code Generators", () => {
    const testConfig: FlashDecodingConfig = {
      batchSize: 1,
      seqLen: 131072,
      numHeads: 32,
      numKvHeads: 8,
      headDim: 128,
      numSplits: 64,
      gpuType: "h100",
      precision: "bf16",
    };

    it("should generate Triton FlashDecoding Split-K kernel code", () => {
      const code = generateTritonFlashDecodingCode(testConfig);
      expect(code).toContain("@triton.jit");
      expect(code).toContain("_flash_decoding_split_k_stage1_kernel");
      expect(code).toContain("_flash_decoding_stage2_reduction_kernel");
      expect(code).toContain("tl.exp(qk - m_ij)");
      expect(code).toContain("NUM_SPLITS: tl.constexpr");
    });

    it("should generate PyTorch Split-K eager reference code", () => {
      const code = generatePyTorchSplitKReferenceCode(testConfig);
      expect(code).toContain("def flash_decoding_pytorch_reference");
      expect(code).toContain("repeat_interleave");
      expect(code).toContain("torch.matmul");
      expect(code).toContain("torch.stack");
      expect(code).toContain("alpha = all_l * torch.exp(all_m - m_global)");
    });

    it("should generate CUDA C++ FlashDecoding Header code", () => {
      const code = generateCudaFlashDecodingHeader(testConfig);
      expect(code).toContain("#pragma once");
      expect(code).toContain("warp_reduce_max");
      expect(code).toContain("warp_reduce_sum");
      expect(code).toContain("__global__ void flash_decoding_split_k_kernel");
      expect(code).toContain("__global__ void flash_decoding_merge_splits_kernel");
    });

    it("should generate vLLM server launch CLI command", () => {
      const code = generateVllmEngineLaunchCommand(testConfig);
      expect(code).toContain("python3 -m vllm.entrypoints.openai.api_server");
      expect(code).toContain("--enable-chunked-prefill");
      expect(code).toContain("--max-model-len");
      expect(code).toContain("Meta-Llama-3-8B-Instruct");
    });
  });

  // ==========================================================================
  // 9. FORMATTING HELPERS & EXTREME EDGE CASES
  // ==========================================================================
  describe("9. Formatting Helpers & Extreme Edge Cases", () => {
    it("should format bytes accurately across B, KB, MB, GB, TB", () => {
      expect(formatBytes(512)).toBe("512 B");
      expect(formatBytes(2048)).toBe("2.00 KB");
      expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
      expect(formatBytes(16 * 1024 * 1024 * 1024)).toBe("16.00 GB");
      expect(formatBytes(2 * 1024 * 1024 * 1024 * 1024)).toBe("2.00 TB");
    });

    it("should format FLOPs across scales", () => {
      expect(formatFlops(500)).toBe("500 FLOPs");
      expect(formatFlops(2.5e9)).toBe("2.50 GFLOPs");
      expect(formatFlops(10e12)).toBe("10.00 TFLOPs");
      expect(formatFlops(4.5e15)).toBe("4.50 PFLOPs");
      expect(formatFlops(1.2e18)).toBe("1.20 EFLOPs");
    });

    it("should format bandwidth and latency strings", () => {
      expect(formatBandwidth(864)).toBe("864.0 GB/s");
      expect(formatBandwidth(3350)).toBe("3.35 TB/s");

      expect(formatLatencyUs(0.05)).toBe("50.0 ns");
      expect(formatLatencyUs(12.34)).toBe("12.34 µs");
      expect(formatLatencyUs(5432.1)).toBe("5.43 ms");
      expect(formatLatencyUs(2500000)).toBe("2.50 s");
    });

    it("should format numbers with standard commas", () => {
      expect(formatNumberWithCommas(1234567)).toBe("1,234,567");
      expect(formatNumberWithCommas(131072)).toBe("131,072");
    });

    it("should handle extreme 1 Million context length on B200 without overflow", () => {
      const extremeConfig: FlashDecodingConfig = {
        batchSize: 1,
        seqLen: 1048576, // 1M tokens
        numHeads: 64,
        numKvHeads: 8,
        headDim: 128,
        numSplits: 128,
        gpuType: "b200",
        precision: "fp8",
      };
      const b200Spec = FLASH_DECODING_GPU_SPECS.b200;

      const roofline = calculateFlashDecodingRoofline(extremeConfig, b200Spec);
      expect(roofline.totalMemoryTrafficBytes).toBeGreaterThan(0);
      expect(Number.isFinite(roofline.flashDecodingLatencyUs)).toBe(true);
      expect(Number.isFinite(roofline.speedupFactor)).toBe(true);
    });
  });
});
