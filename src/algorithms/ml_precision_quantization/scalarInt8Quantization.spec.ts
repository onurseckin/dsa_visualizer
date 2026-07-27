import { describe, it, expect } from "vitest";
import { scalarInt8Quantization, DEFAULT_SCALARINT8QUANTIZATION_INPUT, generateScalarInt8QuantizationSteps } from "./scalarInt8Quantization";

describe("scalar-int8-quantization (Scalar Uniform INT8 Quantizer)", () => {
  it("should have correct metadata", () => {
    expect(scalarInt8Quantization.id).toBe("scalar-int8-quantization");
    expect(scalarInt8Quantization.isMlInfra).toBe(true);
    expect(scalarInt8Quantization.mlInfraLevel).toBe(4);
    expect(scalarInt8Quantization.mlInfraCategory).toBe("ml_precision_quantization");
    expect(scalarInt8Quantization.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateScalarInt8QuantizationSteps(DEFAULT_SCALARINT8QUANTIZATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Scalar Uniform INT8 Quantizer");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
