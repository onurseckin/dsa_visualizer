import { describe, expect, it } from "vitest";
import {
  affineQuantizationSq8,
  DEFAULT_AFFINE_QUANTIZATION_INPUT,
  generateAffineQuantizationSq8Steps,
} from "../affineQuantizationSq8";

describe("affineQuantizationSq8 algorithm definition", () => {
  it("has valid metadata and ML Infra markers", () => {
    expect(affineQuantizationSq8.id).toBe("affine-quantization-sq8");
    expect(affineQuantizationSq8.category).toBe("ml_precision_quantization");
    expect(affineQuantizationSq8.isMlInfra).toBe(true);
    expect(affineQuantizationSq8.mlInfraLevel).toBe(3);
    expect(affineQuantizationSq8.sources?.[0].type).toBe("ml_infra");
  });

  it("quantizes basic FP32 vector into INT8 correctly", () => {
    const steps = generateAffineQuantizationSq8Steps(DEFAULT_AFFINE_QUANTIZATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.zero_point).toBe(-43);
    expect(lastStep.variables.scale).toBeCloseTo(0.029412, 4);
  });

  it("handles UINT8 unsigned range [0, 255]", () => {
    const steps = generateAffineQuantizationSq8Steps({
      values: [-10.0, 0.0, 15.0, 30.0],
      qmin: 0,
      qmax: 255,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.zero_point).toBe(64);
  });

  it("handles empty values vector gracefully", () => {
    const steps = generateAffineQuantizationSq8Steps({
      values: [],
      qmin: -128,
      qmax: 127,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.scale).toBe(1.0);
    expect(lastStep.variables.zero_point).toBe(0);
  });
});
