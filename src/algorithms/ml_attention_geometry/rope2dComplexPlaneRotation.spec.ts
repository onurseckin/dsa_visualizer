import { describe, it, expect } from "vitest";
import {
  rope2dComplexPlaneRotation,
  DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT,
  generateRope2dComplexPlaneRotationSteps,
  ROPE2DCOMPLEXPLANEROTATION_CODE,
} from "./rope2dComplexPlaneRotation";

describe("rope-2d-complex-plane-rotation (RoPE 2D Complex Plane Rotation Matrix)", () => {
  it("should have correct metadata", () => {
    expect(rope2dComplexPlaneRotation.id).toBe("rope-2d-complex-plane-rotation");
    expect(rope2dComplexPlaneRotation.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(rope2dComplexPlaneRotation.topicIds).toContain("ml_attention_geometry");
    expect(rope2dComplexPlaneRotation.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateRope2dComplexPlaneRotationSteps(DEFAULT_ROPE2DCOMPLEXPLANEROTATION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize RoPE 2D Complex Plane Rotation Engine");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = ROPE2DCOMPLEXPLANEROTATION_CODE.trim().split("\n");
    const lineExplanations = rope2dComplexPlaneRotation.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
