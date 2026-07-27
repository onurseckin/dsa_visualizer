import { describe, it, expect } from "vitest";
import { basicSymmetricInt8Scale, DEFAULT_BASICSYMMETRICINT8SCALE_INPUT, generateBasicSymmetricInt8ScaleSteps } from "./basicSymmetricInt8Scale";

describe("basic-symmetric-int8-scale (Symmetric INT8 Scale Factor Calculator)", () => {
  it("should have correct metadata", () => {
    expect(basicSymmetricInt8Scale.id).toBe("basic-symmetric-int8-scale");
    expect(basicSymmetricInt8Scale.isMlInfra).toBe(true);
    expect(basicSymmetricInt8Scale.mlInfraLevel).toBe(4);
    expect(basicSymmetricInt8Scale.mlInfraCategory).toBe("ml_precision_quantization");
    expect(basicSymmetricInt8Scale.categories).toContain("ml_precision_quantization");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateBasicSymmetricInt8ScaleSteps(DEFAULT_BASICSYMMETRICINT8SCALE_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Symmetric INT8 Scale Factor Calculator");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
