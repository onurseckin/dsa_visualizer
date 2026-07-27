import { describe, it, expect } from "vitest";
import { asymmetricAffineQuantization, DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT, generateAsymmetricAffineQuantizationSteps } from "./asymmetricAffineQuantization";

describe("asymmetric-affine-quantization (Full Affine INT8 Quantize & Dequantize Pipeline)", () => {
  it("should have correct metadata", () => {
    expect(asymmetricAffineQuantization.id).toBe("asymmetric-affine-quantization");
    expect(asymmetricAffineQuantization.isMlInfra).toBe(true);
    expect(asymmetricAffineQuantization.mlInfraLevel).toBe(4);
    expect(asymmetricAffineQuantization.mlInfraCategory).toBe("ml_precision_quantization");
    expect(asymmetricAffineQuantization.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateAsymmetricAffineQuantizationSteps(DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Full Affine INT8 Quantize & Dequantize Pipeline");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
