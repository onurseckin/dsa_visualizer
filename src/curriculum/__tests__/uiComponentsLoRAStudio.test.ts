import { describe, it, expect, mock } from "bun:test";
import React from "react";
import {
  LoRAGradientCheckpointingStudio,
  NF4_QUANTILES,
  GPU_HARDWARE_SPECS,
  LORA_STUDIO_PRESETS,
  quantizeNF4,
  dequantizeNF4,
  computeDoubleQuantizationSavings,
  computeQuantizationMetrics,
  computeLoRAParameters,
  generateLoRAMatrices,
  computeSVDSpectrum,
  computeFullVsLoRAMemoryBreakdown,
  computeCheckpointingTradeoffs,
  evaluateGpuHardwareFit,
  simulateLoRAForwardBackwardStep,
  generateTrainingPipelineSteps,
} from "../../components/primitives/LoRAGradientCheckpointingStudio";
import type {
  LoRAStudioConfig,
  LoRAPresetId,
} from "../../components/primitives/LoRAGradientCheckpointingStudio";

describe("LoRAGradientCheckpointingStudio & ML Systems Simulation Engine", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate LoRAGradientCheckpointingStudio with default props", () => {
      const element = React.createElement(LoRAGradientCheckpointingStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(LoRAGradientCheckpointingStudio);
      expect(element.props).toEqual({});
    });

    it("should instantiate with custom preset, overrides, and callbacks", () => {
      const onPresetChange = mock((_id: LoRAPresetId) => {});
      const onTabChange = mock((_tab: string) => {});

      const element = React.createElement(LoRAGradientCheckpointingStudio, {
        initialPreset: "mistral_7b_qlora",
        initialConfig: {
          rank: 32,
          alpha: 64,
          checkpointingMode: "full",
        },
        width: 1200,
        height: 800,
        standalone: false,
        onPresetChange,
        onTabChange,
      });

      expect(element).toBeDefined();
      expect(element.props.initialPreset).toBe("mistral_7b_qlora");
      expect(element.props.initialConfig?.rank).toBe(32);
      expect(element.props.width).toBe(1200);
      expect(element.props.standalone).toBe(false);
    });
  });

  // ==========================================================================
  // 2. PRESET CONFIGURATIONS INTEGRITY
  // ==========================================================================
  describe("2. Preset Configurations Integrity", () => {
    it("should contain all 7 production presets", () => {
      const presetIds: LoRAPresetId[] = [
        "llama3_8b_lora",
        "mistral_7b_qlora",
        "deepseek_v3_moe",
        "gpt4_70b_oom_stress",
        "vit_huge_lora",
        "edge_device_1_5b",
        "custom",
      ];

      for (const id of presetIds) {
        expect(LORA_STUDIO_PRESETS[id]).toBeDefined();
        expect(LORA_STUDIO_PRESETS[id].id).toBe(id);
        expect(LORA_STUDIO_PRESETS[id].name.length).toBeGreaterThan(0);
        expect(LORA_STUDIO_PRESETS[id].description.length).toBeGreaterThan(0);
        expect(LORA_STUDIO_PRESETS[id].highlights.length).toBeGreaterThan(0);
      }
    });

    it("every preset should have valid LoRA and architecture configuration parameters", () => {
      for (const preset of Object.values(LORA_STUDIO_PRESETS)) {
        const { config } = preset;
        expect(config.modelName.length).toBeGreaterThan(0);
        expect(config.totalParamsB).toBeGreaterThan(0);
        expect(config.hiddenDim).toBeGreaterThanOrEqual(512);
        expect(config.intermediateDim).toBeGreaterThanOrEqual(1024);
        expect(config.numLayers).toBeGreaterThanOrEqual(4);
        expect(config.numAttentionHeads).toBeGreaterThanOrEqual(1);
        expect(config.numKvHeads).toBeGreaterThanOrEqual(1);
        expect(config.seqLength).toBeGreaterThanOrEqual(512);
        expect(config.batchSize).toBeGreaterThanOrEqual(1);
        expect(config.rank).toBeGreaterThanOrEqual(1);
        expect(config.alpha).toBeGreaterThanOrEqual(1);
        expect(["FP32", "FP16", "BF16", "INT8", "NF4", "INT4"]).toContain(config.basePrecision);
        expect(["none", "full", "sqrt", "selective"]).toContain(config.checkpointingMode);
        expect(config.targetModules.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  // ==========================================================================
  // 3. LoRA LOW-RANK MATRIX FACTORIZATION MATHEMATICS
  // ==========================================================================
  describe("3. LoRA Low-Rank Matrix Factorization Mathematics", () => {
    it("should compute exact parameter counts and reduction percentage", () => {
      const inDim = 4096;
      const outDim = 4096;
      const rank = 16;
      const targetModulesCount = 7;

      const res = computeLoRAParameters(inDim, outDim, rank, targetModulesCount);

      // Base params per module = 4096 * 4096 = 16,777,216
      expect(res.baseParamsPerModule).toBe(16777216);
      // LoRA params per module = 16 * (4096 + 4096) = 16 * 8192 = 131,072
      expect(res.loraParamsPerModule).toBe(131072);
      // Total Base across 7 modules = 16777216 * 7 = 117,440,512
      expect(res.totalBaseParams).toBe(117440512);
      // Total LoRA across 7 modules = 131072 * 7 = 917,504
      expect(res.totalLoRAParams).toBe(917504);

      // Parameter reduction: 1 - (917504 / 117440512) = 1 - 0.0078125 = 99.22%
      expect(res.paramReductionPct).toBeCloseTo(99.22, 1);
    });

    it("should scale LoRA parameters linearly with rank r", () => {
      const inDim = 4096;
      const outDim = 4096;
      const resR8 = computeLoRAParameters(inDim, outDim, 8, 1);
      const resR16 = computeLoRAParameters(inDim, outDim, 16, 1);
      const resR64 = computeLoRAParameters(inDim, outDim, 64, 1);

      expect(resR16.totalLoRAParams).toBe(resR8.totalLoRAParams * 2);
      expect(resR64.totalLoRAParams).toBe(resR16.totalLoRAParams * 4);
    });

    it("should deterministically generate matrices satisfying W_merged = W0 + DeltaW", () => {
      const dOut = 8;
      const dIn = 8;
      const rank = 4;
      const alpha = 8; // scaling alpha/r = 8/4 = 2.0

      const matrices = generateLoRAMatrices(dOut, dIn, rank, alpha, 42);

      expect(matrices.w0.length).toBe(dOut);
      expect(matrices.w0[0]?.length).toBe(dIn);
      expect(matrices.a.length).toBe(rank);
      expect(matrices.a[0]?.length).toBe(dIn);
      expect(matrices.b.length).toBe(dOut);
      expect(matrices.b[0]?.length).toBe(rank);
      expect(matrices.deltaW.length).toBe(dOut);
      expect(matrices.deltaW[0]?.length).toBe(dIn);
      expect(matrices.wMerged.length).toBe(dOut);
      expect(matrices.wMerged[0]?.length).toBe(dIn);

      // Verify W_merged[i][j] == W0[i][j] + DeltaW[i][j] (within roundoff)
      for (let i = 0; i < dOut; i++) {
        for (let j = 0; j < dIn; j++) {
          const expected = (matrices.w0[i]?.[j] ?? 0) + (matrices.deltaW[i]?.[j] ?? 0);
          const actual = matrices.wMerged[i]?.[j] ?? 0;
          expect(actual).toBeCloseTo(expected, 1);
        }
      }

      // Frobenius norms should be positive
      expect(matrices.frobeniusNormW0).toBeGreaterThan(0);
      expect(matrices.frobeniusNormDeltaW).toBeGreaterThan(0);
      expect(matrices.frobeniusNormMerged).toBeGreaterThan(0);
    });

    it("should verify triangle inequality on Frobenius norms: ||W_merged||_F <= ||W0||_F + ||DeltaW||_F", () => {
      const matrices = generateLoRAMatrices(8, 8, 4, 8, 123);
      expect(matrices.frobeniusNormMerged).toBeLessThanOrEqual(
        matrices.frobeniusNormW0 + matrices.frobeniusNormDeltaW + 0.1,
      );
    });
  });

  // ==========================================================================
  // 4. NF4 QUANTIZATION & DOUBLE QUANTIZATION MATHEMATICS
  // ==========================================================================
  describe("4. NF4 Quantization & Double Quantization Mathematics", () => {
    it("should verify NF4_QUANTILES contains exactly 16 strictly monotonic values in [-1, 1]", () => {
      expect(NF4_QUANTILES.length).toBe(16);
      expect(NF4_QUANTILES[0]).toBe(-1.0);
      expect(NF4_QUANTILES[15]).toBe(1.0);
      expect(NF4_QUANTILES.includes(0.0)).toBe(true);

      for (let i = 0; i < NF4_QUANTILES.length - 1; i++) {
        expect((NF4_QUANTILES[i + 1] ?? 0) > (NF4_QUANTILES[i] ?? 0)).toBe(true);
      }
    });

    it("should quantize and dequantize values with high fidelity using NF4", () => {
      // 128 Gaussian-like synthetic values
      const testValues: number[] = [];
      for (let i = 0; i < 128; i++) {
        const z = Math.sin(i * 0.5) * 0.8 + Math.cos(i * 0.3) * 0.4;
        testValues.push(z);
      }

      const { quantizedIndices, scales, blockSize } = quantizeNF4(testValues, 64);

      expect(quantizedIndices.length).toBe(128);
      expect(scales.length).toBe(2); // 128 / 64 = 2 blocks
      expect(blockSize).toBe(64);

      // Quantized indices must all be in [0..15]
      for (const idx of quantizedIndices) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThanOrEqual(15);
      }

      // Dequantize
      const reconstructed = dequantizeNF4(quantizedIndices, scales, 64);
      expect(reconstructed.length).toBe(128);

      const metrics = computeQuantizationMetrics(testValues, reconstructed);
      expect(metrics.mse).toBeLessThan(0.02); // Small MSE
      expect(metrics.snrDb).toBeGreaterThan(15.0); // High SNR
      expect(metrics.cosineSimilarity).toBeGreaterThan(0.98); // High Cosine Similarity
    });

    it("should compute exact Double Quantization bits-per-parameter and savings", () => {
      const totalParams = 65e9; // 65B model
      const b1 = 64;
      const b2 = 256;

      const dq = computeDoubleQuantizationSavings(totalParams, b1, b2);

      // Naive 4-bit = 4 + 32/64 = 4.5 bpp
      expect(dq.naiveBpp).toBe(4.5);
      // Double Quant = 4 + 8/64 + 32/(64*256) = 4 + 0.125 + 0.001953125 = 4.126953125 bpp
      expect(dq.doubleQuantBpp).toBeCloseTo(4.127, 3);
      // Savings = 4.5 - 4.126953125 = 0.373046875 bpp
      expect(dq.bitSavingsBpp).toBeCloseTo(0.373, 3);

      // Memory savings on 65B: (65e9 * 0.373046875) / 8 bytes ~ 3.03 GB
      const expectedBytes = (totalParams * dq.bitSavingsBpp) / 8;
      expect(dq.memoryReductionBytes).toBeCloseTo(expectedBytes, 0);
      expect(dq.memorySavingsPct).toBeCloseTo(8.29, 1);
    });

    it("should handle edge cases in quantization metrics: zero vectors and identical inputs", () => {
      const identical = [0.1, 0.2, 0.3, 0.4];
      const metrics = computeQuantizationMetrics(identical, identical);
      expect(metrics.mse).toBe(0);
      expect(metrics.snrDb).toBe(100);
      expect(metrics.cosineSimilarity).toBe(1.0);
      expect(metrics.maxAbsError).toBe(0);

      const emptyMetrics = computeQuantizationMetrics([], []);
      expect(emptyMetrics.mse).toBe(0);
      expect(emptyMetrics.cosineSimilarity).toBe(1.0);
    });
  });

  // ==========================================================================
  // 5. ACTIVATION CHECKPOINTING & RECOMPUTATION TRADEOFFS
  // ==========================================================================
  describe("5. Activation Checkpointing & Recomputation Engine", () => {
    const numLayers = 32;
    const batchSize = 4;
    const seqLen = 4096;
    const hiddenDim = 4096;

    it("should compute O(L) memory for 'none' mode with 0% FLOPs overhead", () => {
      const tradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "none",
      );
      expect(tradeoff.mode).toBe("none");
      expect(tradeoff.recomputationFlopsRatio).toBe(0.0);
      expect(tradeoff.speedPenaltyPct).toBe(0.0);
      expect(tradeoff.peakActivationMemoryMb).toBeGreaterThan(1000);
    });

    it("should reduce activation memory dramatically in 'full' mode with +33.3% FLOPs overhead", () => {
      const noneTradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "none",
      );
      const fullTradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "full",
      );

      expect(fullTradeoff.mode).toBe("full");
      expect(fullTradeoff.recomputationFlopsRatio).toBeCloseTo(0.333, 2);
      expect(fullTradeoff.speedPenaltyPct).toBeGreaterThan(0);
      // Full checkpointing should save > 80% activation memory
      expect(fullTradeoff.peakActivationMemoryMb).toBeLessThan(
        noneTradeoff.peakActivationMemoryMb * 0.25,
      );
    });

    it("should scale as O(sqrt(L)) in 'sqrt' Griewank segment checkpointing", () => {
      const fullTradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "full",
      );
      const sqrtTradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "sqrt",
      );
      const noneTradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "none",
      );

      expect(sqrtTradeoff.mode).toBe("sqrt");
      expect(sqrtTradeoff.recomputationFlopsRatio).toBeCloseTo(0.333, 2);
      // Peak memory: Full < Sqrt < None
      expect(fullTradeoff.peakActivationMemoryMb).toBeLessThanOrEqual(
        sqrtTradeoff.peakActivationMemoryMb,
      );
      expect(sqrtTradeoff.peakActivationMemoryMb).toBeLessThan(noneTradeoff.peakActivationMemoryMb);
    });

    it("should provide balanced memory and +15% FLOPs overhead in 'selective' mode", () => {
      const selectiveTradeoff = computeCheckpointingTradeoffs(
        numLayers,
        batchSize,
        seqLen,
        hiddenDim,
        "selective",
      );
      expect(selectiveTradeoff.mode).toBe("selective");
      expect(selectiveTradeoff.recomputationFlopsRatio).toBe(0.15);
      expect(selectiveTradeoff.speedPenaltyPct).toBe(10.0);
    });
  });

  // ==========================================================================
  // 6. VRAM MEMORY BUDGET ALLOCATOR CALCULATIONS
  // ==========================================================================
  describe("6. VRAM Memory Budget Allocator Calculations", () => {
    it("should calculate exact memory breakdown for LLaMA-3-8B LoRA configuration", () => {
      const config = LORA_STUDIO_PRESETS.llama3_8b_lora.config;
      const breakdown = computeFullVsLoRAMemoryBreakdown(config);

      // Base weights: ~8.03B params * 2 bytes (BF16) / 1024^3 ~ 14.95 GB
      expect(breakdown.baseWeightsGb).toBeGreaterThan(14.0);
      expect(breakdown.baseWeightsGb).toBeLessThan(16.0);
      expect(breakdown.baseWeightsBpp).toBe(16.0);

      // LoRA Adapters: rank 16 across 32 layers
      expect(breakdown.loraParamsCount).toBeGreaterThan(10e6); // > 10M params
      expect(breakdown.loraParamsCount).toBeLessThan(50e6); // < 50M params
      expect(breakdown.paramReductionPct).toBeGreaterThan(99.0);

      // LoRA gradients should be small (< 100 MB)
      expect(breakdown.gradientsGb).toBeLessThan(0.1);

      // Full fine-tuning total should be massive (> 100 GB)
      expect(breakdown.fullFineTuningVramGb).toBeGreaterThan(100.0);

      // LoRA savings should be > 80%
      expect(breakdown.vramSavingsPct).toBeGreaterThan(80.0);

      // Total VRAM items must match total
      expect(breakdown.breakdownItems.length).toBe(6);
    });

    it("should reflect QLoRA NF4 base weight compression to ~4.127 bpp", () => {
      const config = LORA_STUDIO_PRESETS.mistral_7b_qlora.config;
      const breakdown = computeFullVsLoRAMemoryBreakdown(config);

      expect(breakdown.baseWeightsBpp).toBeCloseTo(4.127, 2);
      // Mistral 7.24B in NF4: 7.24e9 * (4.127 / 8) / 1024^3 ~ 3.48 GB
      expect(breakdown.baseWeightsGb).toBeLessThan(4.5);
      expect(breakdown.totalVramGb).toBeLessThan(12.0); // Easily fits on 16GB / 24GB
    });

    it("should scale base weights according to basePrecision parameter", () => {
      const baseConfig = LORA_STUDIO_PRESETS.llama3_8b_lora.config;

      const fp32 = computeFullVsLoRAMemoryBreakdown({ ...baseConfig, basePrecision: "FP32" });
      const fp16 = computeFullVsLoRAMemoryBreakdown({ ...baseConfig, basePrecision: "FP16" });
      const int8 = computeFullVsLoRAMemoryBreakdown({ ...baseConfig, basePrecision: "INT8" });
      const int4 = computeFullVsLoRAMemoryBreakdown({ ...baseConfig, basePrecision: "INT4" });

      expect(fp32.baseWeightsGb).toBeCloseTo(fp16.baseWeightsGb * 2, 1);
      expect(fp16.baseWeightsGb).toBeCloseTo(int8.baseWeightsGb * 2, 1);
      expect(int8.baseWeightsGb).toBeCloseTo(int4.baseWeightsGb * 2, 1);
    });
  });

  // ==========================================================================
  // 7. SVD SINGULAR VALUE SPECTRUM ENGINE
  // ==========================================================================
  describe("7. SVD Singular Value Spectrum Engine", () => {
    it("should compute descending singular values and cumulative energy for delta matrix", () => {
      const matrices = generateLoRAMatrices(8, 8, 4, 16, 42);
      const svd = computeSVDSpectrum(matrices.deltaW, 8);

      expect(svd.singularValues.length).toBe(8);
      // Singular values must be sorted descending
      for (let i = 0; i < svd.singularValues.length - 1; i++) {
        expect((svd.singularValues[i] ?? 0) >= (svd.singularValues[i + 1] ?? 0)).toBe(true);
      }

      // Energy cumulative must end at 100%
      expect(svd.energyCumulative[svd.energyCumulative.length - 1]).toBe(100);
      expect(svd.effectiveRank90).toBeGreaterThanOrEqual(1);
      expect(svd.effectiveRank90).toBeLessThanOrEqual(8);
    });

    it("should handle empty or degenerate matrix in computeSVDSpectrum", () => {
      const emptySVD = computeSVDSpectrum([], 8);
      expect(emptySVD.singularValues).toEqual([]);
      expect(emptySVD.energyCumulative).toEqual([]);
      expect(emptySVD.effectiveRank90).toBe(0);
    });
  });

  // ==========================================================================
  // 8. GPU HARDWARE COMPATIBILITY MATRIX
  // ==========================================================================
  describe("8. GPU Hardware Compatibility Matrix", () => {
    it("should evaluate compatibility across all 8 GPU specs", () => {
      const evaluations = evaluateGpuHardwareFit(16.5);
      expect(evaluations.length).toBe(GPU_HARDWARE_SPECS.length);

      for (const item of evaluations) {
        expect(item.gpu.vramGb).toBeGreaterThan(0);
        expect(item.utilizationPct).toBeGreaterThan(0);
        expect(["safe", "tight", "oom_danger", "impossible"]).toContain(item.status);
      }
    });

    it("should mark 16.5 GB workload as safe on 80GB A100, safe on 24GB RTX 4090, and impossible on 8GB RTX 4060", () => {
      const evaluations = evaluateGpuHardwareFit(16.5);
      const a100 = evaluations.find((e) => e.gpu.id === "a100_80gb");
      const rtx4090 = evaluations.find((e) => e.gpu.id === "rtx_4090");
      const rtx4060 = evaluations.find((e) => e.gpu.id === "rtx_4060");

      expect(a100?.status).toBe("safe");
      expect(rtx4090?.status).toBe("safe"); // 16.5 / 24 = 68.75% <= 75%
      expect(rtx4060?.status).toBe("impossible"); // 16.5 > 8 -> impossible
      expect(rtx4060?.maxBatchSize).toBe(0);
    });

    it("should mark 19.5 GB workload as tight on 24GB RTX 4090 (81.25% utilization)", () => {
      const evaluations = evaluateGpuHardwareFit(19.5);
      const rtx4090 = evaluations.find((e) => e.gpu.id === "rtx_4090");
      expect(rtx4090?.status).toBe("tight");
    });

    it("should detect OOM Danger when utilization is between 92% and 100%", () => {
      const evaluations = evaluateGpuHardwareFit(23.0); // on 24GB GPU: 23 / 24 = 95.8%
      const rtx4090 = evaluations.find((e) => e.gpu.id === "rtx_4090");
      expect(rtx4090?.status).toBe("oom_danger");
    });
  });

  // ==========================================================================
  // 9. FORWARD-BACKWARD SIMULATION & TRAINING PIPELINE STEPPER
  // ==========================================================================
  describe("9. Forward-Backward Simulation & Pipeline Stepper", () => {
    it("should simulate a full LoRA forward-backward step matching mathematical equations", () => {
      const dIn = 4;
      const dOut = 4;
      const rank = 2;
      const alpha = 4; // scale = alpha / rank = 4 / 2 = 2.0

      const x = [1.0, 0.5, -0.5, 0.0];
      const w0 = [
        [0.5, 0.2, 0.1, -0.1],
        [-0.3, 0.8, 0.0, 0.4],
        [0.1, -0.2, 0.9, 0.3],
        [0.4, 0.1, -0.4, 0.7],
      ];
      const a = [
        [0.2, 0.4, 0.1, 0.0],
        [-0.1, 0.3, 0.5, -0.2],
      ];
      const b = [
        [0.3, -0.2],
        [0.1, 0.4],
        [-0.5, 0.1],
        [0.2, 0.3],
      ];

      const step = simulateLoRAForwardBackwardStep(x, w0, a, b, alpha, rank);

      expect(step.output.length).toBe(dOut);
      expect(step.deltaOutput.length).toBe(dOut);
      expect(step.intermediateH.length).toBe(rank);
      expect(step.gradB.length).toBe(dOut);
      expect(step.gradB[0]?.length).toBe(rank);
      expect(step.gradA.length).toBe(rank);
      expect(step.gradA[0]?.length).toBe(dIn);
      expect(step.gradX.length).toBe(dIn);
      expect(step.lossEstimate).toBeGreaterThanOrEqual(0);
    });

    it("should generate structured training pipeline steps with recomputations for checkpointing", () => {
      const fullSteps = generateTrainingPipelineSteps(4, "full", 10.0, 16);
      const noneSteps = generateTrainingPipelineSteps(4, "none", 10.0, 16);

      expect(fullSteps.length).toBeGreaterThan(noneSteps.length); // Full has recompute steps

      const recomputeSteps = fullSteps.filter((s) => s.phase === "recompute");
      expect(recomputeSteps.length).toBeGreaterThan(0);

      const noneRecomputeSteps = noneSteps.filter((s) => s.phase === "recompute");
      expect(noneRecomputeSteps.length).toBe(0);

      // Verify sequence starts with forward and ends with optimizer
      expect(fullSteps[0]?.phase).toBe("checkpoint");
      expect(fullSteps[fullSteps.length - 1]?.phase).toBe("optimizer");
    });
  });

  // ==========================================================================
  // 10. EDGE CASES & NUMERICAL STABILITY
  // ==========================================================================
  describe("10. Edge Cases & Numerical Stability", () => {
    it("should handle rank r=1 and very small dimensions gracefully", () => {
      const res = computeLoRAParameters(64, 64, 1, 1);
      expect(res.baseParamsPerModule).toBe(4096);
      expect(res.loraParamsPerModule).toBe(128);
      expect(res.paramReductionPct).toBeCloseTo(96.88, 1);

      const matrices = generateLoRAMatrices(2, 2, 1, 1, 99);
      expect(matrices.w0.length).toBe(2);
      expect(matrices.a.length).toBe(1);
      expect(matrices.b.length).toBe(2);
    });

    it("should handle extreme sequence length S=16384 without overflow", () => {
      const config: LoRAStudioConfig = {
        ...LORA_STUDIO_PRESETS.llama3_8b_lora.config,
        seqLength: 16384,
        batchSize: 1,
      };

      const breakdown = computeFullVsLoRAMemoryBreakdown(config);
      expect(breakdown.totalVramGb).toBeGreaterThan(0);
      expect(Number.isFinite(breakdown.totalVramGb)).toBe(true);
      expect(Number.isNaN(breakdown.totalVramGb)).toBe(false);
    });

    it("should handle zero parameter count in Double Quantization savings gracefully", () => {
      const dq = computeDoubleQuantizationSavings(0, 64, 256);
      expect(dq.memoryReductionBytes).toBe(0);
      expect(dq.memorySavingsPct).toBe(0);
    });
  });
});
