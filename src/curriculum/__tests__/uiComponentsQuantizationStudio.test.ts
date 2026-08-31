import { describe, expect, it } from "bun:test";
import React from "react";
import {
  QuantizationAWQStudio,
  QUANTIZATION_AWQ_PRESETS,
  floatToFP8E4M3,
  fp8E4M3ToFloat,
  floatToFP8E5M2,
  fp8E5M2ToFloat,
  decomposeFP8,
  quantizeINT4Groupwise,
  computeActivationSalience,
  gemmMatrixMultiply,
  searchOptimalAWQAlpha,
  applySmoothQuantTransform,
  computeFrobeniusError,
  computeSQNR,
  computeCosineSimilarity,
  computeMAE,
  computeMaxError,
  estimatePerplexityDelta,
  calculateMemorySavings,
  computeErrorHistogramBins,
  generatePresetMatrices,
  type QuantizationPresetId,
} from "../../components/primitives";

describe("Quantization AWQ Studio Component & Mathematical Engine Tests", () => {
  // ==========================================================================
  // 1. COMPONENT INSTANTIATION & PROPS
  // ==========================================================================
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate QuantizationAWQStudio with default props", () => {
      const element = React.createElement(QuantizationAWQStudio, {});
      expect(element).toBeDefined();
      expect(element.type).toBe(QuantizationAWQStudio);
      expect(element.props.initialPreset).toBeUndefined();
      expect(element.props.initialTab).toBeUndefined();
    });

    it("should accept custom props for preset, tab, standalone, title, and callbacks", () => {
      const onPresetChange = () => {};
      const onTabChange = () => {};

      const element = React.createElement(QuantizationAWQStudio, {
        initialPreset: "mistral_7b_mlp_gate",
        initialTab: "smoothquant",
        standalone: false,
        title: "Custom SwiGLU Quantization Lab",
        onPresetChange,
        onTabChange,
      });

      expect(element.props.initialPreset).toBe("mistral_7b_mlp_gate");
      expect(element.props.initialTab).toBe("smoothquant");
      expect(element.props.standalone).toBe(false);
      expect(element.props.title).toBe("Custom SwiGLU Quantization Lab");
      expect(element.props.onPresetChange).toBe(onPresetChange);
      expect(element.props.onTabChange).toBe(onTabChange);
    });
  });

  // ==========================================================================
  // 2. PRESETS INTEGRITY & DATA CONTRACTS
  // ==========================================================================
  describe("2. Presets Integrity & Data Contracts", () => {
    it("should provide valid configurations for all 7 quantization presets", () => {
      const presetIds: QuantizationPresetId[] = [
        "llama3_8b_attn_proj",
        "mistral_7b_mlp_gate",
        "deepseek_v3_moe_down",
        "outlier_stress_matrix",
        "fp8_dynamic_range_challenge",
        "symmetric_vs_asymmetric",
        "custom",
      ];

      for (const id of presetIds) {
        const preset = QUANTIZATION_AWQ_PRESETS[id];
        expect(preset).toBeDefined();
        expect(preset.id).toBe(id);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(preset.subtitle.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.architectureFamily.length).toBeGreaterThan(0);
        expect(preset.highlightConcepts.length).toBeGreaterThan(0);

        // Data checks
        const { data } = preset;
        expect(data.rows).toBeGreaterThan(0);
        expect(data.cols).toBeGreaterThan(0);
        expect(data.numTokens).toBeGreaterThan(0);
        expect(data.weights.length).toBe(data.rows);
        expect(data.weights[0]?.length).toBe(data.cols);
        expect(data.activations.length).toBe(data.numTokens);
        expect(data.activations[0]?.length).toBe(data.cols);
      }
    });

    it("should generate deterministic preset data via generatePresetMatrices", () => {
      const p1 = generatePresetMatrices("llama3_8b_attn_proj");
      const p2 = generatePresetMatrices("llama3_8b_attn_proj");
      expect(p1.weights[0]?.[0]).toBe(p2.weights[0]?.[0]);
      expect(p1.activations[0]?.[0]).toBe(p2.activations[0]?.[0]);
    });
  });

  // ==========================================================================
  // 3. FP8 E4M3 ENCODING & DECODING
  // ==========================================================================
  describe("3. FP8 E4M3 Bit Conversion & Subnormals", () => {
    it("should accurately encode and decode positive and negative normal floats", () => {
      const exactValues = [1.0, -1.0, 2.0, -2.0, 0.5, -0.5, 1.75, 3.25, 16.0, 128.0];
      for (const val of exactValues) {
        const byte = floatToFP8E4M3(val);
        const reconstructed = fp8E4M3ToFloat(byte);
        expect(reconstructed).toBe(val);
      }

      const arbitraryValues = [3.140625, 7.89, 42.1, 230.5];
      for (const val of arbitraryValues) {
        const byte = floatToFP8E4M3(val);
        const reconstructed = fp8E4M3ToFloat(byte);
        const relErr = Math.abs((val - reconstructed) / val);
        expect(relErr).toBeLessThan(0.08); // 3-bit mantissa has max ~6.25% quantization step
      }
    });

    it("should handle zero and signed zero correctly in E4M3", () => {
      const posZeroByte = floatToFP8E4M3(0.0);
      expect(posZeroByte).toBe(0x00);
      expect(fp8E4M3ToFloat(posZeroByte)).toBe(0.0);

      const negZeroByte = floatToFP8E4M3(-0.0);
      expect(negZeroByte).toBe(0x80);
      expect(Object.is(fp8E4M3ToFloat(negZeroByte), -0.0)).toBe(true);
    });

    it("should clamp floats at max finite normal 448.0 in E4M3", () => {
      const byte448 = floatToFP8E4M3(448.0);
      expect(fp8E4M3ToFloat(byte448)).toBe(448.0);

      const overflowByte = floatToFP8E4M3(1000.0);
      expect(fp8E4M3ToFloat(overflowByte)).toBe(448.0);

      const negOverflowByte = floatToFP8E4M3(-9999.0);
      expect(fp8E4M3ToFloat(negOverflowByte)).toBe(-448.0);
    });

    it("should handle E4M3 subnormal numbers and underflow threshold", () => {
      // Smallest positive subnormal is 2^-9 = 1/512 ~ 0.001953125
      const smallestSubnormal = Math.pow(2, -9);
      const subByte = floatToFP8E4M3(smallestSubnormal);
      expect(subByte).toBe(0x01);
      expect(fp8E4M3ToFloat(subByte)).toBeCloseTo(smallestSubnormal, 6);

      // Underflow threshold (< 2^-10)
      const underflowByte = floatToFP8E4M3(0.0001);
      expect(underflowByte).toBe(0x00);
    });

    it("should handle NaN representations in E4M3", () => {
      const nanByte = floatToFP8E4M3(NaN);
      expect(nanByte).toBe(0x7f);
      expect(Number.isNaN(fp8E4M3ToFloat(nanByte))).toBe(true);
      expect(Number.isNaN(fp8E4M3ToFloat(0xff))).toBe(true);
    });

    it("decomposeFP8: should generate complete bit decomposition for E4M3", () => {
      const decomp = decomposeFP8(1.75, "fp8_e4m3");
      expect(decomp.format).toBe("fp8_e4m3");
      expect(decomp.sign).toBe(0);
      expect(decomp.signBitStr).toBe("0");
      expect(decomp.exponentBiased).toBe(7); // Bias 7 + 0 = 7 (0111)
      expect(decomp.exponentUnbiased).toBe(0);
      expect(decomp.mantissaInt).toBe(6); // 0.75 * 8 = 6 (110)
      expect(decomp.reconstructedValue).toBe(1.75);
      expect(decomp.bitString).toBe("0 0111 110");
      expect(decomp.isSubnormal).toBe(false);
      expect(decomp.isZero).toBe(false);
      expect(decomp.isNaN).toBe(false);
    });
  });

  // ==========================================================================
  // 4. FP8 E5M2 ENCODING & DECODING
  // ==========================================================================
  describe("4. FP8 E5M2 Bit Conversion & High Dynamic Range", () => {
    it("should accurately encode and decode numbers spanning wide range up to 57344.0", () => {
      const testValues = [1.0, -1.0, 100.0, 1024.0, 16384.0, 57344.0];
      for (const val of testValues) {
        const byte = floatToFP8E5M2(val);
        const reconstructed = fp8E5M2ToFloat(byte);
        const relErr = Math.abs((val - reconstructed) / val);
        expect(relErr).toBeLessThan(0.2); // 2-bit mantissa max quantization step ~12.5%
      }
    });

    it("should overflow to Infinity when value exceeds 57344.0 in E5M2", () => {
      const infByte = floatToFP8E5M2(60000.0);
      expect(infByte).toBe(0x7c);
      expect(fp8E5M2ToFloat(infByte)).toBe(Infinity);

      const negInfByte = floatToFP8E5M2(-99999.0);
      expect(negInfByte).toBe(0xfc);
      expect(fp8E5M2ToFloat(negInfByte)).toBe(-Infinity);
    });

    it("should handle E5M2 subnormals and underflow", () => {
      // Smallest positive subnormal is 2^-16 = 1/65536 ~ 1.5258789e-5
      const smallestSubnormal = Math.pow(2, -16);
      const subByte = floatToFP8E5M2(smallestSubnormal);
      expect(subByte).toBe(0x01);
      expect(fp8E5M2ToFloat(subByte)).toBeCloseTo(smallestSubnormal, 8);

      // Underflow threshold (< 2^-17)
      const underflowByte = floatToFP8E5M2(1e-6);
      expect(underflowByte).toBe(0x00);
    });

    it("should handle NaNs and Infinities in E5M2", () => {
      const nanByte = floatToFP8E5M2(NaN);
      expect(nanByte).toBe(0x7f);
      expect(Number.isNaN(fp8E5M2ToFloat(nanByte))).toBe(true);

      const posInf = floatToFP8E5M2(Infinity);
      expect(posInf).toBe(0x7c);
      expect(fp8E5M2ToFloat(posInf)).toBe(Infinity);
    });

    it("decomposeFP8: should generate complete bit decomposition for E5M2", () => {
      const decomp = decomposeFP8(-2.0, "fp8_e5m2");
      expect(decomp.format).toBe("fp8_e5m2");
      expect(decomp.sign).toBe(1);
      expect(decomp.exponentBiased).toBe(16); // Bias 15 + 1 = 16 (10000)
      expect(decomp.exponentUnbiased).toBe(1);
      expect(decomp.mantissaInt).toBe(0);
      expect(decomp.reconstructedValue).toBe(-2.0);
      expect(decomp.isInfinity).toBe(false);
      expect(decomp.isNaN).toBe(false);
    });
  });

  // ==========================================================================
  // 5. INT4 GROUP-WISE QUANTIZATION
  // ==========================================================================
  describe("5. INT4 Group-Wise Quantization (Symmetric vs Asymmetric)", () => {
    it("should accurately perform symmetric INT4 group-wise quantization", () => {
      const tensor = [-3.5, -1.0, 0.0, 1.5, 3.5];
      const res = quantizeINT4Groupwise(tensor, { scheme: "symmetric", groupSize: 32 });

      expect(res.format).toBe("int4");
      expect(res.scheme).toBe("symmetric");
      expect(res.numGroups).toBe(1);
      expect(res.scales[0]).toBeCloseTo(3.5 / 7.0, 5);
      expect(res.zeroPoints[0]).toBe(0);

      // Verify clamped integers are in [-8, 7]
      const qVals = res.groups[0]?.quantizedValues ?? [];
      for (const q of qVals) {
        expect(q).toBeGreaterThanOrEqual(-8);
        expect(q).toBeLessThanOrEqual(7);
      }
    });

    it("should accurately perform asymmetric INT4 affine calibration with zero-point", () => {
      const tensor = [2.0, 4.0, 6.0, 8.0, 10.0];
      const res = quantizeINT4Groupwise(tensor, { scheme: "asymmetric", groupSize: 32 });

      expect(res.scheme).toBe("asymmetric");
      expect(res.numGroups).toBe(1);
      expect(res.scales[0]).toBeCloseTo((10.0 - 2.0) / 15.0, 5);
      expect(res.zeroPoints[0]).toBeGreaterThanOrEqual(0);
      expect(res.zeroPoints[0]).toBeLessThanOrEqual(15);

      // Quantized integers in [0, 15]
      const qVals = res.groups[0]?.quantizedValues ?? [];
      for (const q of qVals) {
        expect(q).toBeGreaterThanOrEqual(0);
        expect(q).toBeLessThanOrEqual(15);
      }
    });

    it("should support various group sizes (16, 32, 64, 128, channel, tensor)", () => {
      const matrix: number[][] = Array.from({ length: 4 }, () =>
        Array.from({ length: 32 }, (_, c) => c * 0.1),
      );

      const res16 = quantizeINT4Groupwise(matrix, { groupSize: 16 });
      expect(res16.numGroups).toBe((4 * 32) / 16);

      const resChannel = quantizeINT4Groupwise(matrix, { groupSize: "channel" });
      expect(resChannel.numGroups).toBe(4);

      const resTensor = quantizeINT4Groupwise(matrix, { groupSize: "tensor" });
      expect(resTensor.numGroups).toBe(1);
    });

    it("should compute accurate compression ratio and bits per weight", () => {
      const tensor = new Array(128).fill(1.0);
      const res = quantizeINT4Groupwise(tensor, { groupSize: 32, scheme: "symmetric" });
      // Overhead is (16 bits * 4 groups) / 128 = 0.5 bits -> total 4.5 bpp
      expect(res.bitsPerWeight).toBeCloseTo(4.5, 2);
      expect(res.compressionRatio).toBeCloseTo(16.0 / 4.5, 2);
    });
  });

  // ==========================================================================
  // 6. AWQ ACTIVATION SALIENCE & ALPHA SEARCH
  // ==========================================================================
  describe("6. AWQ Activation Salience & Alpha Search", () => {
    it("computeActivationSalience: should compute mean absolute activation per channel", () => {
      const activations = [
        [1.0, 10.0, 2.0],
        [3.0, 20.0, 4.0],
      ];
      const salience = computeActivationSalience(activations);
      expect(salience.length).toBe(3);
      expect(salience[0]).toBe(2.0); // (1 + 3) / 2
      expect(salience[1]).toBe(15.0); // (10 + 20) / 2
      expect(salience[2]).toBe(3.0); // (2 + 4) / 2
    });

    it("searchOptimalAWQAlpha: should minimize output loss and improve SQNR", () => {
      const preset = QUANTIZATION_AWQ_PRESETS.outlier_stress_matrix;
      const result = searchOptimalAWQAlpha(
        preset.data.weights as number[][],
        preset.data.activations as number[][],
        { groupSize: 32, alphaMin: 0.0, alphaMax: 1.0, step: 0.1 },
      );

      expect(result.optimalAlpha).toBeGreaterThanOrEqual(0.0);
      expect(result.optimalAlpha).toBeLessThanOrEqual(1.0);
      expect(result.sweepPoints.length).toBeGreaterThan(5);
      expect(result.minLoss).toBeLessThanOrEqual(result.baselineLoss);
      expect(result.optimalSqnr).toBeGreaterThanOrEqual(result.baselineSqnr);
      expect(result.topSalientChannels.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // 7. SMOOTHQUANT SCALE MIGRATION & GEMM INVARIANCE
  // ==========================================================================
  describe("7. SmoothQuant Scale Migration & GEMM Invariance", () => {
    it("applySmoothQuantTransform: should mathematically preserve exact GEMM output", () => {
      const preset = QUANTIZATION_AWQ_PRESETS.mistral_7b_mlp_gate;
      const res = applySmoothQuantTransform(
        preset.data.activations as number[][],
        preset.data.weights as number[][],
        0.5,
      );

      expect(res.isInvariant).toBe(true);
      expect(res.gemmInvarianceError).toBeLessThan(1e-4);
      expect(res.channelScales.length).toBe(preset.data.cols);
    });

    it("applySmoothQuantTransform: should reduce activation dynamic range and improve SQNR", () => {
      const preset = QUANTIZATION_AWQ_PRESETS.outlier_stress_matrix;
      const res = applySmoothQuantTransform(
        preset.data.activations as number[][],
        preset.data.weights as number[][],
        0.7,
      );

      expect(res.actDynamicRangeAfter).toBeLessThan(res.actDynamicRangeBefore);
      expect(res.channelData.length).toBe(preset.data.cols);
      expect(res.smoothQuantSqnr).toBeGreaterThanOrEqual(res.naiveQuantSqnr);
    });
  });

  // ==========================================================================
  // 8. ERROR METRICS & HISTOGRAM BINNING
  // ==========================================================================
  describe("8. Error Metrics & Statistical Calculations", () => {
    it("computeFrobeniusError: should calculate absolute and relative error", () => {
      const a = [1.0, 2.0, 3.0];
      const b = [1.0, 2.0, 3.0];
      const frobExact = computeFrobeniusError(a, b);
      expect(frobExact.absoluteError).toBe(0);
      expect(frobExact.relativeError).toBe(0);

      const noisy = [1.1, 1.9, 3.0]; // diffs: 0.1, -0.1, 0.0 => sumSq = 0.02 => sqrt = 0.14142
      const frobNoisy = computeFrobeniusError(a, noisy);
      expect(frobNoisy.absoluteError).toBeCloseTo(Math.sqrt(0.02), 5);
      expect(frobNoisy.relativeError).toBeGreaterThan(0);
    });

    it("computeSQNR: should return 100 dB for exact signals and correct positive dB for noise", () => {
      const a = [2.0, 4.0, 6.0];
      expect(computeSQNR(a, a)).toBe(100.0);

      const noisy = [2.1, 3.9, 6.0];
      const sqnr = computeSQNR(a, noisy);
      expect(sqnr).toBeGreaterThan(0);
      expect(sqnr).toBeLessThan(100);
    });

    it("computeCosineSimilarity: should calculate directional alignment", () => {
      const a = [1.0, 2.0, 3.0];
      expect(computeCosineSimilarity(a, a)).toBeCloseTo(1.0, 5);

      const inv = [-1.0, -2.0, -3.0];
      expect(computeCosineSimilarity(a, inv)).toBeCloseTo(-1.0, 5);
    });

    it("computeMAE and computeMaxError: should return precise error metrics", () => {
      const a = [1.0, 2.0, 3.0];
      const b = [1.2, 1.9, 3.5]; // errors: 0.2, 0.1, 0.5 => MAE = 0.8/3 = 0.2667, MaxErr = 0.5
      expect(computeMAE(a, b)).toBeCloseTo(0.8 / 3, 4);
      expect(computeMaxError(a, b)).toBeCloseTo(0.5, 4);
    });

    it("gemmMatrixMultiply: should multiply 2D matrices accurately", () => {
      // 2x2 identity test
      const I = [
        [1, 0],
        [0, 1],
      ];
      const A = [
        [3, 4],
        [5, 6],
      ];
      const res = gemmMatrixMultiply(I, A);
      expect(res).toEqual(A);
    });

    it("computeErrorHistogramBins: should generate balanced 15 bins summing to 100%", () => {
      const orig = [1, 2, 3, 4, 5, 6, 7, 8];
      const quant = [1.1, 1.9, 3.0, 3.9, 5.2, 6.0, 7.1, 7.9];
      const bins = computeErrorHistogramBins(orig, quant, 15);

      expect(bins.length).toBe(15);
      const totalPct = bins.reduce((acc, b) => acc + b.percentage, 0);
      expect(totalPct).toBeCloseTo(100.0, 1);
      const totalCount = bins.reduce((acc, b) => acc + b.count, 0);
      expect(totalCount).toBe(orig.length);
      expect(bins.some((b) => b.isZeroBin)).toBe(true);
    });
  });

  // ==========================================================================
  // 9. MEMORY FOOTPRINT & PERPLEXITY ESTIMATION
  // ==========================================================================
  describe("9. Memory Footprint & Perplexity Degradation Estimator", () => {
    it("calculateMemorySavings: should calculate correct VRAM footprints", () => {
      const fp16Mem = calculateMemorySavings(16, 16, "fp16");
      expect(fp16Mem.bitsPerWeight).toBe(16.0);
      expect(fp16Mem.compressionVsFP16).toBe(1.0);

      const fp8Mem = calculateMemorySavings(16, 16, "fp8");
      expect(fp8Mem.bitsPerWeight).toBe(8.0);
      expect(fp8Mem.compressionVsFP16).toBe(2.0);

      const int4Mem = calculateMemorySavings(16, 16, "int4", 32);
      expect(int4Mem.bitsPerWeight).toBeCloseTo(4.5, 2);
      expect(int4Mem.vram70BModelGb).toBeLessThan(fp16Mem.vram70BModelGb);
    });

    it("estimatePerplexityDelta: should classify perplexity impact across SQNR brackets", () => {
      const lossless = estimatePerplexityDelta(42.0, 3.8, true);
      expect(lossless.status).toBe("lossless");
      expect(lossless.deltaPpl).toBeLessThanOrEqual(0.05);

      const negligible = estimatePerplexityDelta(35.0, 3.8, true);
      expect(negligible.status).toBe("negligible");

      const mild = estimatePerplexityDelta(28.0, 3.8, true);
      expect(mild.status).toBe("mild");

      const severe = estimatePerplexityDelta(20.0, 3.8, true);
      expect(severe.status).toBe("severe");

      const catastrophic = estimatePerplexityDelta(12.0, 3.8, false);
      expect(catastrophic.status).toBe("catastrophic");
    });
  });
});
