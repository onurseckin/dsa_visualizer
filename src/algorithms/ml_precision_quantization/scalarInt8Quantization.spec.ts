import { describe, it, expect } from "vitest";
import {
  scalarInt8Quantization,
  generateScalarInt8QuantizationSteps,
  DEFAULT_SCALARINT8QUANTIZATION_INPUT,
} from "./scalarInt8Quantization";

describe("Scalar Int8 Quantization", () => {
  it("should have correct metadata", () => {
    expect(scalarInt8Quantization.id).toBeDefined();
    expect(scalarInt8Quantization.title).toBe("Scalar Int8 Quantization");
    expect(scalarInt8Quantization.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateScalarInt8QuantizationSteps(DEFAULT_SCALARINT8QUANTIZATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(scalarInt8Quantization.examples?.length).toBe(3);
  });
});
