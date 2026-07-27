import { describe, it, expect } from "vitest";
import { rope2dComplexPlaneRotation, DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT, generateRope2dComplexPlaneRotationSteps } from "./rope2dComplexPlaneRotation";

describe("rope-2d-complex-plane-rotation (RoPE 2D Complex Plane Rotation Matrix)", () => {
  it("should have correct metadata", () => {
    expect(rope2dComplexPlaneRotation.id).toBe("rope-2d-complex-plane-rotation");
    expect(rope2dComplexPlaneRotation.isMlInfra).toBe(true);
    expect(rope2dComplexPlaneRotation.mlInfraLevel).toBe(7);
    expect(rope2dComplexPlaneRotation.mlInfraCategory).toBe("ml_attention_geometry");
    expect(rope2dComplexPlaneRotation.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRope2dComplexPlaneRotationSteps(DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("RoPE 2D Complex Plane Rotation Matrix");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
