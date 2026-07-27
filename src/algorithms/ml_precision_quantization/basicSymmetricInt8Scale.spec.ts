import { describe, it, expect } from "vitest";
import {
  basicSymmetricInt8Scale,
  generateBasicSymmetricInt8ScaleSteps,
  DEFAULT_BASICSYMMETRICINT8SCALE_INPUT,
} from "./basicSymmetricInt8Scale";

describe("Basic Symmetric Int8 Scale", () => {
  it("should have correct metadata", () => {
    expect(basicSymmetricInt8Scale.id).toBeDefined();
    expect(basicSymmetricInt8Scale.title).toBe("Basic Symmetric Int8 Scale");
    expect(basicSymmetricInt8Scale.category).toBe("ml_precision_quantization");
  });

  it("should generate steps successfully", () => {
    const steps = generateBasicSymmetricInt8ScaleSteps(DEFAULT_BASICSYMMETRICINT8SCALE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].primarySnapshot.kind).toBe("array");
    if (steps.length > 0) {
      expect(steps[steps.length - 1].variables).toBeDefined();
    }
  });

  it("should have exactly 3 examples", () => {
    expect(basicSymmetricInt8Scale.examples?.length).toBe(3);
  });
});
