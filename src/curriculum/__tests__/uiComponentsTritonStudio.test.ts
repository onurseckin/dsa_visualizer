import { describe, expect, it } from "bun:test";
import React from "react";
import {
  TritonKernelTilingStudio,
  computeTilingGrid,
  computeProgramIdRemapping,
  calculateL2CacheHitRate,
  calculateBankAddresses,
  detectBankConflicts,
  applyXORSwizzle,
  applyXorSwizzleAddress,
  simulateAsyncPipeline,
  computeRooflineMetrics,
  generateTritonKernelCode,
  GPU_ARCH_PROFILES,
  DATA_TYPE_SPECS,
  TRITON_TILING_PRESETS,
  type GPUArchId,
  type DataTypeId,
  type TritonPresetId,
  type TilingConfig,
} from "../../components/primitives";

describe("TritonKernelTilingStudio & GPU Microarchitecture Engine Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS CONFIGURATION
  // ==========================================================================
  describe("1. Component Instantiation & Props", () => {
    it("should instantiate TritonKernelTilingStudio with default props", () => {
      const element = React.createElement(TritonKernelTilingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(TritonKernelTilingStudio);
    });

    it("should instantiate with custom preset, config overrides, and callbacks", () => {
      const onConfigChangeMock = () => {};
      const onPresetChangeMock = () => {};

      const element = React.createElement(TritonKernelTilingStudio, {
        initialPreset: "hopper_tma_async_pipeline",
        initialConfig: {
          BM: 128,
          BN: 128,
          BK: 64,
          numStages: 3,
        },
        width: 1200,
        height: 750,
        standalone: true,
        title: "Custom Triton Microarchitecture Lab",
        onConfigChange: onConfigChangeMock,
        onPresetChange: onPresetChangeMock,
      });

      expect(element.props.initialPreset).toBe("hopper_tma_async_pipeline");
      expect(element.props.initialConfig?.BM).toBe(128);
      expect(element.props.initialConfig?.BN).toBe(128);
      expect(element.props.initialConfig?.BK).toBe(64);
      expect(element.props.initialConfig?.numStages).toBe(3);
      expect(element.props.width).toBe(1200);
      expect(element.props.height).toBe(750);
      expect(element.props.title).toBe("Custom Triton Microarchitecture Lab");
    });
  });

  // ==========================================================================
  // 2. PRESET INTEGRITY & VALIDATION
  // ==========================================================================
  describe("2. Preset Configurations Integrity", () => {
    const presetIds: TritonPresetId[] = [
      "h100_tensor_core_4k",
      "a100_sram_swizzle_fix",
      "gemv_memory_bound",
      "hopper_tma_async_pipeline",
      "bank_conflict_disaster",
      "custom_playground",
    ];

    it("should contain all 6 presets with valid metadata", () => {
      for (const id of presetIds) {
        const preset = TRITON_TILING_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.highlightFeatures.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("every preset should have valid tiling config dimensions and constraints", () => {
      for (const id of presetIds) {
        const { config } = TRITON_TILING_PRESETS[id];
        expect(config.M).toBeGreaterThanOrEqual(16);
        expect(config.N).toBeGreaterThanOrEqual(16);
        expect(config.K).toBeGreaterThanOrEqual(16);
        expect(config.BM).toBeGreaterThanOrEqual(16);
        expect(config.BN).toBeGreaterThanOrEqual(16);
        expect(config.BK).toBeGreaterThanOrEqual(16);
        expect(config.groupM).toBeGreaterThanOrEqual(1);
        expect(config.numStages).toBeGreaterThanOrEqual(1);
        expect(config.numStages).toBeLessThanOrEqual(4);
        expect(config.numWarps).toBeGreaterThanOrEqual(2);
        expect(GPU_ARCH_PROFILES[config.gpuArch]).toBeDefined();
        expect(DATA_TYPE_SPECS[config.dataType]).toBeDefined();
      }
    });
  });

  // ==========================================================================
  // 3. HARDWARE GPU SPEC TABLE VALIDATION
  // ==========================================================================
  describe("3. Hardware GPU Profiles & Specifications", () => {
    const archIds: GPUArchId[] = [
      "h100_sxm",
      "a100_sxm4",
      "rtx4090",
      "v100",
      "l40s",
      "apple_m3_max",
      "custom",
    ];

    it("should define valid specs for all GPU architectures", () => {
      for (const id of archIds) {
        const spec = GPU_ARCH_PROFILES[id];
        expect(spec).toBeDefined();
        expect(spec.id).toBe(id);
        expect(spec.name.length).toBeGreaterThan(0);
        expect(spec.architecture.length).toBeGreaterThan(0);
        expect(spec.peakFP16TFlops).toBeGreaterThan(0);
        expect(spec.peakFP32TFlops).toBeGreaterThan(0);
        expect(spec.memoryBandwidthGBs).toBeGreaterThan(0);
        expect(spec.l2CacheMB).toBeGreaterThan(0);
        expect(spec.smemPerSMKB).toBeGreaterThan(0);
        expect(spec.maxSMs).toBeGreaterThan(0);
        expect(spec.registersPerSM).toBeGreaterThan(0);
        expect(spec.clockGhz).toBeGreaterThan(0);
      }
    });

    it("should accurately mark TMA hardware support only on Hopper architectures", () => {
      expect(GPU_ARCH_PROFILES.h100_sxm.supportsTMA).toBe(true);
      expect(GPU_ARCH_PROFILES.a100_sxm4.supportsTMA).toBe(false);
      expect(GPU_ARCH_PROFILES.rtx4090.supportsTMA).toBe(false);
      expect(GPU_ARCH_PROFILES.v100.supportsTMA).toBe(false);
      expect(GPU_ARCH_PROFILES.apple_m3_max.supportsTMA).toBe(false);
    });

    it("should define exact byte sizes and properties for data types", () => {
      const dataTypes: DataTypeId[] = ["FP32", "FP16", "BF16", "FP8", "INT8"];
      for (const dt of dataTypes) {
        const spec = DATA_TYPE_SPECS[dt];
        expect(spec).toBeDefined();
        expect(spec.id).toBe(dt);
        expect(spec.bytesPerElement).toBeGreaterThanOrEqual(1);
        expect(spec.bits).toBe(spec.bytesPerElement * 8);
      }
      expect(DATA_TYPE_SPECS.FP32.bytesPerElement).toBe(4);
      expect(DATA_TYPE_SPECS.FP16.bytesPerElement).toBe(2);
      expect(DATA_TYPE_SPECS.BF16.bytesPerElement).toBe(2);
      expect(DATA_TYPE_SPECS.FP8.bytesPerElement).toBe(1);
      expect(DATA_TYPE_SPECS.INT8.bytesPerElement).toBe(1);
    });
  });

  // ==========================================================================
  // 4. 2D BLOCK TILING & PROGRAM ID SWIZZLING MATHEMATICS
  // ==========================================================================
  describe("4. Tiling Grid & Program ID Mapping", () => {
    it("should correctly compute tiling grid dimensions and FLOPs for divisible shapes", () => {
      const grid = computeTilingGrid(4096, 4096, 4096, 128, 256, 64, 8);
      expect(grid.numPidM).toBe(32); // 4096 / 128
      expect(grid.numPidN).toBe(16); // 4096 / 256
      expect(grid.numKTiles).toBe(64); // 4096 / 64
      expect(grid.totalPrograms).toBe(512); // 32 * 16
      expect(grid.numPidInGroup).toBe(128); // 8 * 16
      expect(grid.totalGroups).toBe(4); // 32 / 8
      expect(grid.flopsPerTile).toBe(2 * 128 * 256 * 64); // 4,194,304 FLOPs
      expect(grid.totalFlops).toBe(2 * 4096 * 4096 * 4096); // 137,438,953,472 FLOPs
    });

    it("should compute naive linear 1D to 2D program ID mapping when swizzling is disabled", () => {
      const numPidM = 4;
      const numPidN = 8;
      const groupM = 4;

      // Without swizzling: pidM = pid // numPidN, pidN = pid % numPidN
      const map0 = computeProgramIdRemapping(0, numPidM, numPidN, groupM, false);
      expect(map0.pidM).toBe(0);
      expect(map0.pidN).toBe(0);
      expect(map0.isSwizzled).toBe(false);

      const map7 = computeProgramIdRemapping(7, numPidM, numPidN, groupM, false);
      expect(map7.pidM).toBe(0);
      expect(map7.pidN).toBe(7);

      const map8 = computeProgramIdRemapping(8, numPidM, numPidN, groupM, false);
      expect(map8.pidM).toBe(1);
      expect(map8.pidN).toBe(0);

      const map31 = computeProgramIdRemapping(31, numPidM, numPidN, groupM, false);
      expect(map31.pidM).toBe(3);
      expect(map31.pidN).toBe(7);
    });

    it("should compute Triton grouped L2 locality swizzling program ID mapping", () => {
      const numPidM = 8;
      const numPidN = 4;
      const groupM = 4;

      // With swizzling: numPidInGroup = 4 * 4 = 16
      // For pid in group 0 (0..15):
      // pid 0: groupOffset = 0 -> pidM = 0 + (0 % 4) = 0, pidN = 0 // 4 = 0
      const map0 = computeProgramIdRemapping(0, numPidM, numPidN, groupM, true);
      expect(map0.pidM).toBe(0);
      expect(map0.pidN).toBe(0);
      expect(map0.groupId).toBe(0);
      expect(map0.isSwizzled).toBe(true);

      // pid 1: groupOffset = 1 -> pidM = 0 + (1 % 4) = 1, pidN = 1 // 4 = 0
      const map1 = computeProgramIdRemapping(1, numPidM, numPidN, groupM, true);
      expect(map1.pidM).toBe(1);
      expect(map1.pidN).toBe(0);

      // pid 2: groupOffset = 2 -> pidM = 2, pidN = 0
      const map2 = computeProgramIdRemapping(2, numPidM, numPidN, groupM, true);
      expect(map2.pidM).toBe(2);
      expect(map2.pidN).toBe(0);

      // pid 3: groupOffset = 3 -> pidM = 3, pidN = 0
      const map3 = computeProgramIdRemapping(3, numPidM, numPidN, groupM, true);
      expect(map3.pidM).toBe(3);
      expect(map3.pidN).toBe(0);

      // pid 4: groupOffset = 4 -> pidM = 4 % 4 = 0, pidN = 4 // 4 = 1
      const map4 = computeProgramIdRemapping(4, numPidM, numPidN, groupM, true);
      expect(map4.pidM).toBe(0);
      expect(map4.pidN).toBe(1);

      // pid 16 (group 1): firstPidM = 1 * 4 = 4
      const map16 = computeProgramIdRemapping(16, numPidM, numPidN, groupM, true);
      expect(map16.groupId).toBe(1);
      expect(map16.pidM).toBe(4);
      expect(map16.pidN).toBe(0);
    });

    it("should handle boundary groups with fewer rows than GROUP_M", () => {
      const numPidM = 6; // 6 rows with GROUP_M=4 -> Group 0 has 4 rows, Group 1 has 2 rows
      const numPidN = 4;
      const groupM = 4;

      // Group 1 starts at firstPidM = 4, groupSizeM = min(6 - 4, 4) = 2
      // pid 16: group 1, offset 0 -> pidM = 4 + (0 % 2) = 4, pidN = 0 // 2 = 0
      const map16 = computeProgramIdRemapping(16, numPidM, numPidN, groupM, true);
      expect(map16.groupId).toBe(1);
      expect(map16.firstPidM).toBe(4);
      expect(map16.groupSizeM).toBe(2);
      expect(map16.pidM).toBe(4);
      expect(map16.pidN).toBe(0);

      // pid 17: group 1, offset 1 -> pidM = 4 + (1 % 2) = 5, pidN = 1 // 2 = 0
      const map17 = computeProgramIdRemapping(17, numPidM, numPidN, groupM, true);
      expect(map17.pidM).toBe(5);
      expect(map17.pidN).toBe(0);

      // pid 18: group 1, offset 2 -> pidM = 4 + (2 % 2) = 4, pidN = 2 // 2 = 1
      const map18 = computeProgramIdRemapping(18, numPidM, numPidN, groupM, true);
      expect(map18.pidM).toBe(4);
      expect(map18.pidN).toBe(1);
    });

    it("should calculate higher L2 hit rate when GROUP_M swizzling is enabled", () => {
      const config: TilingConfig = {
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
      };

      const hitRateSwizzled = calculateL2CacheHitRate(config, GPU_ARCH_PROFILES.h100_sxm);
      const hitRateLinear = calculateL2CacheHitRate(
        { ...config, enableSwizzle: false },
        GPU_ARCH_PROFILES.h100_sxm,
      );

      expect(hitRateSwizzled).toBeGreaterThan(hitRateLinear);
      expect(hitRateSwizzled).toBeLessThanOrEqual(1.0);
      expect(hitRateLinear).toBeGreaterThanOrEqual(0.0);
    });
  });

  // ==========================================================================
  // 5. 32-BANK SHARED MEMORY CONFLICT DETECTION ALGORITHMS
  // ==========================================================================
  describe("5. Shared Memory 32-Bank Conflict Detection", () => {
    it("should be conflict-free (1-way) for sequential Stride 1 accesses with FP32 words", () => {
      const accesses = calculateBankAddresses(1, 4, false, 0, 0, 32);
      expect(accesses.length).toBe(32);

      // Every thread maps to a unique bank 0..31
      for (let t = 0; t < 32; t++) {
        expect(accesses[t].bankId).toBe(t);
        expect(accesses[t].wordAddress).toBe(t);
      }

      const report = detectBankConflicts(accesses);
      expect(report.maxConflictWay).toBe(1);
      expect(report.conflictCount).toBe(0);
      expect(report.serializationPenaltyCycles).toBe(0);
      expect(report.efficiencyPercent).toBe(100);
    });

    it("should detect 2-way bank conflict serialization for Stride 2 accesses", () => {
      // Stride 2 words -> Thread 0: bank 0, Thread 1: bank 2, ..., Thread 16: bank 0
      const accesses = calculateBankAddresses(2, 4, false, 0, 0, 32);
      const report = detectBankConflicts(accesses);

      expect(report.maxConflictWay).toBe(2);
      expect(report.conflictCount).toBe(16); // 16 banks hit with 2 distinct words each
      expect(report.serializationPenaltyCycles).toBe(1); // 2 - 1 = 1 cycle penalty
      expect(report.efficiencyPercent).toBe(50); // 100 / 2 = 50%
    });

    it("should detect 4-way bank conflict serialization for Stride 4 accesses", () => {
      const accesses = calculateBankAddresses(4, 4, false, 0, 0, 32);
      const report = detectBankConflicts(accesses);

      expect(report.maxConflictWay).toBe(4);
      expect(report.conflictCount).toBe(8); // 8 banks hit with 4 distinct words each
      expect(report.serializationPenaltyCycles).toBe(3);
      expect(report.efficiencyPercent).toBe(25);
    });

    it("should detect worst-case 32-way conflict disaster for Stride 32 accesses", () => {
      // Stride 32 words -> All 32 threads request words 0, 32, 64, ..., 992 which all map to Bank 0
      const accesses = calculateBankAddresses(32, 4, false, 0, 0, 32);
      const report = detectBankConflicts(accesses);

      expect(report.maxConflictWay).toBe(32);
      expect(report.conflictCount).toBe(1); // All mapped to bank 0
      expect(report.serializationPenaltyCycles).toBe(31); // 31 penalty cycles
      expect(report.efficiencyPercent).toBe(3.13); // 100 / 32 = 3.125%
      expect(report.bankHits[0]).toBe(32);
    });

    it("should detect broadcast (0 conflict penalty) when all threads access the same address", () => {
      // Stride 0 -> All 32 threads access byteAddress = 0, wordAddress = 0
      const accesses = calculateBankAddresses(0, 4, false, 0, 0, 32);
      const report = detectBankConflicts(accesses);

      expect(report.maxConflictWay).toBe(1); // Broadcast is 1-way
      expect(report.conflictCount).toBe(0);
      expect(report.serializationPenaltyCycles).toBe(0);
      expect(report.efficiencyPercent).toBe(100);
      expect(report.bankHits[0]).toBe(32);
      expect(report.totalDistinctWords).toBe(1);
    });

    it("should detect 8-way and 16-way bank conflict serialization for Strides 8 and 16", () => {
      const report8 = detectBankConflicts({ stride: 8, elemBytes: 4, enableSwizzle: false });
      expect(report8.maxConflictWay).toBe(8);
      expect(report8.serializationPenaltyCycles).toBe(7);
      expect(report8.efficiencyPercent).toBe(12.5);

      const report16 = detectBankConflicts({ stride: 16, elemBytes: 4, enableSwizzle: false });
      expect(report16.maxConflictWay).toBe(16);
      expect(report16.serializationPenaltyCycles).toBe(15);
      expect(report16.efficiencyPercent).toBe(6.25);
    });
  });

  // ==========================================================================
  // 6. XOR ADDRESS SWIZZLING CONFLICT ELIMINATION
  // ==========================================================================
  describe("6. XOR Address Swizzling Algorithms", () => {
    it("should compute correct 2D XOR swizzle indices: bank = ((row ^ col) % 32)", () => {
      expect(applyXORSwizzle(0, 0)).toBe(0);
      expect(applyXORSwizzle(0, 15)).toBe(15);
      expect(applyXORSwizzle(1, 0)).toBe(1); // 1 ^ 0 = 1
      expect(applyXORSwizzle(1, 1)).toBe(0); // 1 ^ 1 = 0
      expect(applyXORSwizzle(7, 3)).toBe(4); // 7 ^ 3 = 4
    });

    it("should compute bitwise word address swizzling: (word ^ (word >> shift)) % 32", () => {
      expect(applyXorSwizzleAddress(0, 2)).toBe(0);
      // Byte address 128 -> word = 32 -> (32 ^ (32 >> 2)) % 32 = (32 ^ 8) % 32 = 40 % 32 = 8
      expect(applyXorSwizzleAddress(128, 2)).toBe(8);
    });

    it("should eliminate 32-way bank conflict down to conflict-free or low-conflict with swizzling", () => {
      // Stride 32 without swizzling: 32-way conflict
      const unswizzledReport = detectBankConflicts({
        stride: 32,
        elemBytes: 2,
        enableSwizzle: false,
      });
      expect(unswizzledReport.maxConflictWay).toBeGreaterThan(1);

      // Stride 32 with bitwise XOR swizzling
      const swizzledReport = detectBankConflicts({
        stride: 32,
        elemBytes: 2,
        enableSwizzle: true,
        swizzleShift: 2,
      });

      expect(swizzledReport.maxConflictWay).toBeLessThan(unswizzledReport.maxConflictWay);
      expect(swizzledReport.serializationPenaltyCycles).toBeLessThan(
        unswizzledReport.serializationPenaltyCycles,
      );
      expect(swizzledReport.efficiencyPercent).toBeGreaterThan(unswizzledReport.efficiencyPercent);
    });
  });

  // ==========================================================================
  // 7. MULTI-STAGE ASYNC PIPELINE SIMULATION
  // ==========================================================================
  describe("7. Multi-Stage Async Pipelining & TMA Simulation", () => {
    const baseConfig: TilingConfig = {
      M: 4096,
      N: 4096,
      K: 4096,
      BM: 128,
      BN: 256,
      BK: 64,
      groupM: 8,
      numStages: 1,
      numWarps: 8,
      stride: 1,
      enableSwizzle: true,
      swizzleShift: 2,
      gpuArch: "h100_sxm",
      dataType: "FP16",
    };

    it("should simulate 1-stage synchronous pipeline with zero overlap", () => {
      const result = simulateAsyncPipeline(
        { ...baseConfig, numStages: 1 },
        GPU_ARCH_PROFILES.h100_sxm,
      );

      expect(result.numStages).toBe(1);
      expect(result.overlapEfficiencyPercent).toBe(0);
      expect(result.stallCycles).toBeGreaterThan(0);
      expect(result.speedupVsNaive).toBe(1.0);
      expect(result.timeline.length).toBe(result.numKTiles);
      expect(result.timeline[0].stages.length).toBe(1);
    });

    it("should simulate 2-stage double buffering pipeline with significant latency overlap", () => {
      const result = simulateAsyncPipeline(
        { ...baseConfig, numStages: 2 },
        GPU_ARCH_PROFILES.a100_sxm4,
      );

      expect(result.numStages).toBe(2);
      expect(result.overlapEfficiencyPercent).toBeGreaterThan(10);
      expect(result.speedupVsNaive).toBeGreaterThan(1.0);
      expect(result.timeline[0].stages.length).toBe(2);
    });

    it("should simulate 3-stage async pipeline", () => {
      const result = simulateAsyncPipeline(
        { ...baseConfig, numStages: 3 },
        GPU_ARCH_PROFILES.a100_sxm4,
      );

      expect(result.numStages).toBe(3);
      expect(result.overlapEfficiencyPercent).toBeGreaterThanOrEqual(90);
      expect(result.speedupVsNaive).toBeGreaterThan(1.5);
      expect(result.timeline[0].stages.length).toBe(3);
    });

    it("should simulate 4-stage Hopper TMA async pipeline with >95% overlap efficiency", () => {
      const result = simulateAsyncPipeline(
        { ...baseConfig, numStages: 4 },
        GPU_ARCH_PROFILES.h100_sxm,
      );

      expect(result.numStages).toBe(4);
      expect(result.hasTMA).toBe(true);
      expect(result.overlapEfficiencyPercent).toBeGreaterThanOrEqual(95);
      expect(result.speedupVsNaive).toBeGreaterThan(1.8);
      expect(result.timeline[0].stages.length).toBe(4);
    });
  });

  // ==========================================================================
  // 8. ROOFLINE ARITHMETIC INTENSITY & THROUGHPUT METER
  // ==========================================================================
  describe("8. Roofline Arithmetic Intensity & Throughput Metrics", () => {
    it("should calculate exact FLOPs = 2MNK and DRAM traffic bytes", () => {
      const config: TilingConfig = {
        M: 2048,
        N: 2048,
        K: 2048,
        BM: 128,
        BN: 128,
        BK: 64,
        groupM: 4,
        numStages: 2,
        numWarps: 4,
        stride: 1,
        enableSwizzle: true,
        swizzleShift: 2,
        gpuArch: "a100_sxm4",
        dataType: "FP16",
      };

      const metrics = computeRooflineMetrics(config, GPU_ARCH_PROFILES.a100_sxm4);

      expect(metrics.totalFlops).toBe(2 * 2048 * 2048 * 2048); // 17.18 GFLOPs
      expect(metrics.operationalIntensityFlopsPerByte).toBeGreaterThan(0);
      expect(metrics.sramOperationalIntensity).toBe(64); // 2 * 128 * 128 / (256 * 2) = 64 FLOP/B
      expect(metrics.ridgePointFlopsPerByte).toBeCloseTo(
        312.0 / (2039 / 1000), // Peak TFLOPS / Bandwidth TB/s
        1,
      );
    });

    it("should correctly classify compute-bound vs memory-bound regimes", () => {
      // Large 4K GEMM -> High operational intensity -> Compute Bound on H100
      const computeBoundConfig: TilingConfig = {
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
      };
      const computeMetrics = computeRooflineMetrics(computeBoundConfig, GPU_ARCH_PROFILES.h100_sxm);
      expect(computeMetrics.operationalIntensityFlopsPerByte).toBeGreaterThan(
        computeMetrics.ridgePointFlopsPerByte,
      );
      expect(computeMetrics.isComputeBound).toBe(true);
      expect(computeMetrics.isMemoryBound).toBe(false);

      // GEMV (M=16, N=4096, K=4096) -> Low operational intensity -> Memory Bound on RTX 4090
      const memoryBoundConfig: TilingConfig = {
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
      };
      const memoryMetrics = computeRooflineMetrics(memoryBoundConfig, GPU_ARCH_PROFILES.rtx4090);
      expect(memoryMetrics.operationalIntensityFlopsPerByte).toBeLessThan(
        memoryMetrics.ridgePointFlopsPerByte,
      );
      expect(memoryMetrics.isMemoryBound).toBe(true);
      expect(memoryMetrics.isComputeBound).toBe(false);
    });

    it("should scale peak TFLOPS for FP8 data precision", () => {
      const configFP8: TilingConfig = {
        M: 4096,
        N: 4096,
        K: 4096,
        BM: 128,
        BN: 256,
        BK: 128,
        groupM: 8,
        numStages: 4,
        numWarps: 8,
        stride: 1,
        enableSwizzle: true,
        swizzleShift: 2,
        gpuArch: "h100_sxm",
        dataType: "FP8",
      };
      const metricsFP8 = computeRooflineMetrics(configFP8, GPU_ARCH_PROFILES.h100_sxm);
      expect(metricsFP8.peakTFlops).toBeCloseTo(1978.9, 0);
    });

    it("should handle FP32 precision lower peak TFLOPS and higher byte footprint", () => {
      const configFP32: TilingConfig = {
        M: 1024,
        N: 1024,
        K: 1024,
        BM: 64,
        BN: 64,
        BK: 32,
        groupM: 1,
        numStages: 1,
        numWarps: 4,
        stride: 1,
        enableSwizzle: false,
        swizzleShift: 0,
        gpuArch: "v100",
        dataType: "FP32",
      };
      const metricsFP32 = computeRooflineMetrics(configFP32, GPU_ARCH_PROFILES.v100);
      expect(metricsFP32.peakTFlops).toBe(15.7);
    });
  });

  // ==========================================================================
  // 9. TRITON PYTHON JIT CODE GENERATOR
  // ==========================================================================
  describe("9. Triton Python Code Generator", () => {
    it("should generate valid @triton.jit kernel with exact block sizes and group_m", () => {
      const config: TilingConfig = {
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
      };

      const code = generateTritonKernelCode(config);

      expect(code).toContain("@triton.jit");
      expect(code).toContain("def matmul_kernel");
      expect(code).toContain("BLOCK_SIZE_M: tl.constexpr = 128");
      expect(code).toContain("BLOCK_SIZE_N: tl.constexpr = 256");
      expect(code).toContain("BLOCK_SIZE_K: tl.constexpr = 64");
      expect(code).toContain("GROUP_SIZE_M: tl.constexpr = 8");
      expect(code).toContain("tl.program_id(axis=0)");
      expect(code).toContain("tl.cdiv(M, BLOCK_SIZE_M)");
      expect(code).toContain("tl.load");
      expect(code).toContain("tl.dot");
      expect(code).toContain("tl.store");
      expect(code).toContain("num_stages=4");
      expect(code).toContain("num_warps=8");
    });

    it("should generate code for FP32, BF16, and FP8 data types", () => {
      const base: TilingConfig = {
        M: 1024,
        N: 1024,
        K: 1024,
        BM: 64,
        BN: 64,
        BK: 32,
        groupM: 4,
        numStages: 2,
        numWarps: 4,
        stride: 1,
        enableSwizzle: true,
        swizzleShift: 2,
        gpuArch: "a100_sxm4",
        dataType: "FP32",
      };

      const codeFP32 = generateTritonKernelCode(base);
      expect(codeFP32).toContain("tl.float32");

      const codeBF16 = generateTritonKernelCode({ ...base, dataType: "BF16" });
      expect(codeBF16).toContain("tl.bfloat16");

      const codeFP8 = generateTritonKernelCode({ ...base, dataType: "FP8" });
      expect(codeFP8).toContain("tl.float8e4nv");
    });
  });

  // ==========================================================================
  // 10. EDGE CASES & NUMERICAL RESILIENCE
  // ==========================================================================
  describe("10. Edge Cases & Boundary Resilience", () => {
    it("should handle non-divisible matrix shapes gracefully", () => {
      const grid = computeTilingGrid(1000, 1000, 1000, 128, 128, 64, 4);
      expect(grid.numPidM).toBe(8); // ceil(1000 / 128) = 8
      expect(grid.numPidN).toBe(8); // ceil(1000 / 128) = 8
      expect(grid.numKTiles).toBe(16); // ceil(1000 / 64) = 16
      expect(grid.totalPrograms).toBe(64);
    });

    it("should handle zero or negative inputs without crashing or NaN", () => {
      const grid = computeTilingGrid(0, -10, 0, 0, -5, 0, 0);
      expect(grid.numPidM).toBeGreaterThanOrEqual(1);
      expect(grid.numPidN).toBeGreaterThanOrEqual(1);
      expect(grid.numKTiles).toBeGreaterThanOrEqual(1);

      const mapping = computeProgramIdRemapping(0, 0, 0, 0, true);
      expect(mapping.pidM).toBeDefined();
      expect(isNaN(mapping.pidM)).toBe(false);

      const swizzle = applyXORSwizzle(-5, -10, 0);
      expect(swizzle).toBeGreaterThanOrEqual(0);
      expect(isNaN(swizzle)).toBe(false);
    });

    it("should handle custom GPU hardware overrides in roofline calculations", () => {
      const customConfig: TilingConfig = {
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
        customTFlops: 800,
        customBandwidth: 2500,
      };

      const metrics = computeRooflineMetrics(customConfig, GPU_ARCH_PROFILES.custom);
      expect(metrics.peakTFlops).toBe(800);
      expect(metrics.memoryBandwidthTBps).toBe(2.5);
    });
  });
});
