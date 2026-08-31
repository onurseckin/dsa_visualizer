import { describe, expect, it } from "bun:test";
import React from "react";
import {
  FORMAT_CONFIGS,
  QUANTIZATION_PRESETS,
  QuantizationFormat,
  QuantizationKernelWorkbench,
  bf16UintToFloat,
  computeErrorHistogram,
  computeQuantizationMetrics,
  computeQuantizationScaleZeroPoint,
  floatToBf16Uint,
  floatToBitDecomposition,
  floatToFp16Uint,
  floatToFp8E4M3Uint,
  floatToFp8E5M2Uint,
  fp16UintToFloat,
  fp8E4M3UintToFloat,
  fp8E5M2UintToFloat,
  generateTensorData,
  intToBitDecomposition,
  quantizeAndDequantizeTensor,
  quantizeAndDequantizeValue,
} from "../../components/profiler/QuantizationKernelWorkbench";
import { HARDWARE_TARGETS } from "../performanceProfiler";

describe("Quantization Kernel Workbench Component & Profiler Tests", () => {
  describe("1. Component Instantiation & Props Handling", () => {
    it("should instantiate QuantizationKernelWorkbench with default props", () => {
      const element = React.createElement(QuantizationKernelWorkbench, {});

      expect(element).toBeDefined();
      expect(element.type).toBe(QuantizationKernelWorkbench);
      expect(element.props.initialFormat).toBeUndefined();
      expect(element.props.initialHardwareTarget).toBeUndefined();
    });

    it("should accept custom props for format, target, preset, and title", () => {
      const element = React.createElement(QuantizationKernelWorkbench, {
        initialFormat: "fp8_e4m3",
        initialHardwareTarget: "nvidia_h100_sxm5",
        initialPreset: "fp8_hopper_gemm",
        title: "Custom Hopper FP8 Profiler",
        className: "custom-workbench-class",
      });

      expect(element.props.initialFormat).toBe("fp8_e4m3");
      expect(element.props.initialHardwareTarget).toBe("nvidia_h100_sxm5");
      expect(element.props.initialPreset).toBe("fp8_hopper_gemm");
      expect(element.props.title).toBe("Custom Hopper FP8 Profiler");
      expect(element.props.className).toBe("custom-workbench-class");
    });
  });

  describe("2. Format Configs & Presets Integrity", () => {
    it("should provide valid configurations for all 7 numeric formats", () => {
      const formats: QuantizationFormat[] = [
        "fp32",
        "fp16",
        "bf16",
        "fp8_e4m3",
        "fp8_e5m2",
        "int8",
        "int4",
      ];

      for (const fmt of formats) {
        const cfg = FORMAT_CONFIGS[fmt];
        expect(cfg).toBeDefined();
        expect(cfg.format).toBe(fmt);
        expect(cfg.name.length).toBeGreaterThan(0);
        expect(cfg.bits).toBeGreaterThan(0);
        expect(cfg.bytesPerElement).toBeGreaterThan(0);
        expect(cfg.standardUseCases.length).toBeGreaterThan(0);

        if (cfg.isInteger) {
          expect(cfg.expBits).toBe(0);
          expect(cfg.mantissaBits).toBe(0);
        } else {
          expect(cfg.signBits).toBe(1);
          expect(cfg.expBits).toBeGreaterThan(0);
          expect(cfg.mantissaBits).toBeGreaterThan(0);
          expect(cfg.bits).toBe(cfg.signBits + cfg.expBits + cfg.mantissaBits);
        }
      }
    });

    it("should provide valid presets linking to existing hardware targets", () => {
      const presets = Object.values(QUANTIZATION_PRESETS);
      expect(presets.length).toBeGreaterThanOrEqual(5);

      for (const preset of presets) {
        expect(preset.id.length).toBeGreaterThan(0);
        expect(preset.name.length).toBeGreaterThan(0);
        expect(FORMAT_CONFIGS[preset.format]).toBeDefined();
        expect(HARDWARE_TARGETS[preset.hardwareTargetId]).toBeDefined();
        expect(["symmetric", "asymmetric"]).toContain(preset.scheme);
        expect(["per_tensor", "per_channel", "group_32", "group_64", "group_128"]).toContain(
          preset.granularity,
        );
      }
    });
  });

  describe("3. Floating-Point Bit Conversion & Quantization Math", () => {
    it("FP16: should accurately encode and decode positive, negative, and special numbers", () => {
      const testValues = [0.0, -0.0, 1.0, -1.0, 0.5, 3.140625, 65504.0, 0.0001];

      for (const val of testValues) {
        const u16 = floatToFp16Uint(val);
        const reconstructed = fp16UintToFloat(u16);
        if (Math.abs(val) > 0.001) {
          expect(reconstructed).toBeCloseTo(val, 2);
        }
      }

      // Check overflow clamp to max FP16
      const overflowU16 = floatToFp16Uint(100000.0);
      const overflowVal = fp16UintToFloat(overflowU16);
      expect(overflowVal).toBe(65504);
    });

    it("BF16: should preserve wide dynamic range and round mantissa to 7 bits", () => {
      const testValues = [1.0, -1.0, 10000.0, 1e20, -1e30, 0.125];

      for (const val of testValues) {
        const u16 = floatToBf16Uint(val);
        const reconstructed = bf16UintToFloat(u16);
        const relErr = Math.abs((val - reconstructed) / val);
        expect(relErr).toBeLessThan(0.01); // 7-bit mantissa relative error is < 1/128 ~ 0.0078
      }
    });

    it("FP8 E4M3: should accurately encode Hopper forward weights and clamp at 448", () => {
      const testValues = [0.0, 1.0, -1.0, 2.0, 0.25, 448.0];

      for (const val of testValues) {
        const u8 = floatToFp8E4M3Uint(val);
        const reconstructed = fp8E4M3UintToFloat(u8);
        if (val !== 0) {
          expect(reconstructed).toBeCloseTo(val, 1);
        } else {
          expect(reconstructed).toBe(0);
        }
      }

      // Clamping at 448
      const highU8 = floatToFp8E4M3Uint(999.0);
      expect(fp8E4M3UintToFloat(highU8)).toBe(448);
    });

    it("FP8 E5M2: should support high dynamic range up to 57344 for gradients", () => {
      const testValues = [1.0, -1.0, 100.0, 1024.0, 57344.0];

      for (const val of testValues) {
        const u8 = floatToFp8E5M2Uint(val);
        const reconstructed = fp8E5M2UintToFloat(u8);
        const relErr = Math.abs((val - reconstructed) / val);
        expect(relErr).toBeLessThan(0.2); // 2-bit mantissa has ~12.5% max quantization step
      }
    });
  });

  describe("4. Affine Scale and Zero-Point Calibration", () => {
    it("should compute exact symmetric scale with zero-point = 0", () => {
      const values = [-4.0, 0.0, 2.0, 8.0];
      const qmin = -128;
      const qmax = 127;

      const calib = computeQuantizationScaleZeroPoint(values, qmin, qmax, true);

      expect(calib.zeroPoint).toBe(0);
      expect(calib.scale).toBeCloseTo(8.0 / 128, 6);
    });

    it("should compute exact asymmetric scale and zero-point offset", () => {
      const values = [0.0, 5.0, 10.0];
      const qmin = 0;
      const qmax = 255;

      const calib = computeQuantizationScaleZeroPoint(values, qmin, qmax, false);

      expect(calib.scale).toBeCloseTo(10.0 / 255, 6);
      expect(calib.zeroPoint).toBe(0);

      // Shifted range [-5, 5]
      const valuesShifted = [-5.0, 0.0, 5.0];
      const calibShifted = computeQuantizationScaleZeroPoint(valuesShifted, 0, 255, false);
      expect(calibShifted.scale).toBeCloseTo(10.0 / 255, 6);
      expect(calibShifted.zeroPoint).toBeCloseTo(128, 1);
    });

    it("INT8 & INT4: quantizeAndDequantizeValue should perform accurate rounding and clamping", () => {
      const scale = 0.5;
      const zeroPoint = 0;

      // INT8: x = 1.2 -> round(1.2/0.5) = 2 -> dequant = 2 * 0.5 = 1.0
      const resInt8 = quantizeAndDequantizeValue(1.2, "int8", scale, zeroPoint);
      expect(resInt8.quantizedVal).toBe(2);
      expect(resInt8.dequantizedVal).toBe(1.0);
      expect(resInt8.error).toBeCloseTo(0.2, 5);

      // INT4: x = 10.0 with scale 0.5 -> round(20) -> clamped to qmax=7 -> dequant = 7 * 0.5 = 3.5
      const resInt4 = quantizeAndDequantizeValue(10.0, "int4", scale, zeroPoint);
      expect(resInt4.quantizedVal).toBe(7);
      expect(resInt4.dequantizedVal).toBe(3.5);
    });
  });

  describe("5. Group-Wise vs Per-Tensor Quantization", () => {
    it("should compute independent scales for each block in group-wise mode", () => {
      // Create a tensor of 64 elements with normal values in first 32 and high outlier in second 32
      const tensor = new Array<number>(64);
      for (let i = 0; i < 32; i++) tensor[i] = 1.0;
      for (let i = 32; i < 64; i++) tensor[i] = 100.0;

      const groupRes = quantizeAndDequantizeTensor(tensor, {
        format: "int8",
        scheme: "symmetric",
        granularity: "group_32",
      });

      expect(groupRes.scales.length).toBe(2);
      expect(groupRes.scales[0]).toBeCloseTo(1.0 / 128, 4);
      expect(groupRes.scales[1]).toBeCloseTo(100.0 / 128, 4);

      // Verify that group 0 had very high precision because it was isolated from group 1's outlier
      const group0MaxErr = Math.max(...groupRes.errors.slice(0, 32).map(Math.abs));
      expect(group0MaxErr).toBeLessThan(0.01);
    });

    it("should apply single global scale in per_tensor mode", () => {
      const tensor = [1.0, 2.0, 3.0, 4.0];
      const res = quantizeAndDequantizeTensor(tensor, {
        format: "int8",
        scheme: "symmetric",
        granularity: "per_tensor",
      });

      expect(res.scales.length).toBe(1);
      expect(res.scales[0]).toBeCloseTo(4.0 / 128, 4);
    });
  });

  describe("6. Error Metrics & Histogram Binning", () => {
    it("should compute exact MSE, RMSE, MAE, MaxError, and Cosine Similarity", () => {
      const orig = [1.0, 2.0, 3.0, 4.0];
      const dequant = [1.1, 1.9, 3.0, 4.2]; // errors: -0.1, +0.1, 0, -0.2

      const metrics = computeQuantizationMetrics(orig, dequant, "int8", "nvidia_h100_sxm5");

      // MSE = (0.01 + 0.01 + 0.0 + 0.04) / 4 = 0.06 / 4 = 0.015
      expect(metrics.mse).toBeCloseTo(0.015, 6);
      expect(metrics.rmse).toBeCloseTo(Math.sqrt(0.015), 6);
      // MAE = (0.1 + 0.1 + 0.0 + 0.2) / 4 = 0.4 / 4 = 0.1
      expect(metrics.mae).toBeCloseTo(0.1, 6);
      expect(metrics.maxError).toBeCloseTo(0.2, 6);
      expect(metrics.cosineSim).toBeGreaterThan(0.99);
      expect(metrics.compressionRatio).toBe(4.0);
    });

    it("should return ideal metrics when original equals dequantized", () => {
      const orig = [1.0, 2.0, 3.0];
      const metrics = computeQuantizationMetrics(orig, orig, "fp32", "nvidia_h100_sxm5");

      expect(metrics.mse).toBe(0);
      expect(metrics.rmse).toBe(0);
      expect(metrics.mae).toBe(0);
      expect(metrics.maxError).toBe(0);
      expect(metrics.snrDb).toBe(100.0);
      expect(metrics.cosineSim).toBe(1.0);
    });

    it("should generate balanced histogram bins with percentages summing to 100%", () => {
      const orig = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0];
      const dequant = [1.05, 1.95, 3.0, 3.9, 5.1, 6.0, 7.2, 7.8];

      const bins = computeErrorHistogram(orig, dequant, 10);

      expect(bins.length).toBe(10);
      const totalPct = bins.reduce((acc, b) => acc + b.percentage, 0);
      expect(totalPct).toBeCloseTo(100.0, 1);

      const totalCount = bins.reduce((acc, b) => acc + b.count, 0);
      expect(totalCount).toBe(orig.length);

      const hasZeroBin = bins.some((b) => b.isZeroBin);
      expect(hasZeroBin).toBe(true);
    });
  });

  describe("7. Silicon Hardware Bandwidth & Roofline Multipliers", () => {
    it("should calculate correct bandwidth multipliers for NVIDIA H100 SXM5", () => {
      const h100 = HARDWARE_TARGETS.nvidia_h100_sxm5;
      const baseBandwidth = h100.peakMemoryBandwidthGBs; // 3350 GB/s

      const mInt4 = computeQuantizationMetrics([1, 2], [1, 2], "int4", "nvidia_h100_sxm5");
      expect(mInt4.compressionRatio).toBe(8.0);
      expect(mInt4.effectiveBandwidthGBs).toBeCloseTo(baseBandwidth * 8.0, 1);

      const mInt8 = computeQuantizationMetrics([1, 2], [1, 2], "int8", "nvidia_h100_sxm5");
      expect(mInt8.compressionRatio).toBe(4.0);
      expect(mInt8.effectiveBandwidthGBs).toBeCloseTo(baseBandwidth * 4.0, 1);

      const mFp16 = computeQuantizationMetrics([1, 2], [1, 2], "fp16", "nvidia_h100_sxm5");
      expect(mFp16.compressionRatio).toBe(2.0);
      expect(mFp16.effectiveBandwidthGBs).toBeCloseTo(baseBandwidth * 2.0, 1);
    });

    it("should calculate correct bandwidth multipliers for Apple M3 Max", () => {
      const m3 = HARDWARE_TARGETS.apple_m3_max;
      const baseBandwidth = m3.peakMemoryBandwidthGBs; // 400 GB/s

      const mInt4 = computeQuantizationMetrics([1, 2], [1, 2], "int4", "apple_m3_max");
      expect(mInt4.effectiveBandwidthGBs).toBeCloseTo(baseBandwidth * 8.0, 1);
    });
  });

  describe("8. Bit Decomposition Visualizer Engine", () => {
    it("should decompose FP32 bit fields accurately", () => {
      const decomp = floatToBitDecomposition(1.0, "fp32");
      expect(decomp.sign).toBe(0);
      expect(decomp.exponent).toBe(127); // Bias 127 + 0 = 127 (01111111)
      expect(decomp.mantissa).toBe(0);
      expect(decomp.signBitStr).toBe("0");
      expect(decomp.exponentBitStr).toBe("01111111");
      expect(decomp.mantissaBitStr).toBe("00000000000000000000000");
      expect(decomp.reconstructedValue).toBe(1.0);
    });

    it("should decompose FP16 bit fields accurately", () => {
      const decomp = floatToBitDecomposition(-2.0, "fp16");
      expect(decomp.sign).toBe(1);
      expect(decomp.exponent).toBe(16); // Bias 15 + 1 = 16 (10000)
      expect(decomp.mantissa).toBe(0);
      expect(decomp.signBitStr).toBe("1");
      expect(decomp.exponentBitStr).toBe("10000");
      expect(decomp.fullBitStr.length).toBe(16);
      expect(decomp.reconstructedValue).toBe(-2.0);
    });

    it("should decompose BF16 bit fields accurately", () => {
      const decomp = floatToBitDecomposition(3.5, "bf16");
      expect(decomp.sign).toBe(0);
      expect(decomp.exponent).toBe(128); // Bias 127 + 1 = 128
      expect(decomp.fullBitStr.length).toBe(16);
      expect(decomp.reconstructedValue).toBeCloseTo(3.5, 4);
    });

    it("should decompose INT8 and INT4 two's complement integers", () => {
      const int8Decomp = intToBitDecomposition(-5, 8, true);
      expect(int8Decomp.bits).toBe(8);
      expect(int8Decomp.decimal).toBe(-5);
      expect(int8Decomp.isNegative).toBe(true);
      expect(int8Decomp.signBitStr).toBe("1");
      expect(int8Decomp.bitStr).toBe("11111011"); // 256 - 5 = 251 = 0xFB = 11111011

      const int4Decomp = intToBitDecomposition(3, 4, true);
      expect(int4Decomp.bits).toBe(4);
      expect(int4Decomp.decimal).toBe(3);
      expect(int4Decomp.bitStr).toBe("0011");
    });
  });

  describe("9. Synthetic Tensor Distribution Generator", () => {
    it("should generate Gaussian distribution with expected statistical moments", () => {
      const data = generateTensorData("gaussian", 500, 42);
      expect(data.length).toBe(500);

      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      expect(mean).toBeCloseTo(0.0, 0.5);
    });

    it("should generate Uniform distribution bounded within [-3, 3]", () => {
      const data = generateTensorData("uniform", 200, 42);
      expect(data.length).toBe(200);

      for (const v of data) {
        expect(v).toBeGreaterThanOrEqual(-3.0);
        expect(v).toBeLessThanOrEqual(3.0);
      }
    });

    it("should inject high magnitude spikes in Outlier distribution", () => {
      const data = generateTensorData("outlier", 200, 42, 0.05, 12.0);
      expect(data.length).toBe(200);

      const maxAbs = Math.max(...data.map(Math.abs));
      expect(maxAbs).toBeGreaterThanOrEqual(8.0);
    });

    it("should handle custom vector repetition and slicing", () => {
      const custom = [1.5, -2.5, 3.5];
      const data = generateTensorData("custom", 6, 42, 0.02, 8.0, custom);

      expect(data.length).toBe(6);
      expect(data).toEqual([1.5, -2.5, 3.5, 1.5, -2.5, 3.5]);
    });
  });
});
