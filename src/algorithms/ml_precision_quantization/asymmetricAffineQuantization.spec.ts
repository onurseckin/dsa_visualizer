import { describe, it, expect } from "vitest";
import {
  asymmetricAffineQuantization,
  generateAsymmetricAffineQuantizationSteps,
  DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
} from "./asymmetricAffineQuantization";

describe("Asymmetric Affine Quantization", () => {
  it("should have correct metadata", () => {
    expect(asymmetricAffineQuantization.id).toBeDefined();
    expect(asymmetricAffineQuantization.title).toBe("Asymmetric Affine Quantization");
    expect(asymmetricAffineQuantization.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateAsymmetricAffineQuantizationSteps(
      DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(asymmetricAffineQuantization.examples?.length).toBe(3);
  });
});
