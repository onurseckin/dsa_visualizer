import { describe, it, expect } from "vitest";
import {
  vectorInnerProductScaling,
  DEFAULT_VECTORINNERPRODUCTSCALING_INPUT,
  generateVectorInnerProductScalingSteps,
  VECTORINNERPRODUCTSCALING_CODE,
} from "./vectorInnerProductScaling";

describe("vector-inner-product-scaling (Vector Inner Product Scaling)", () => {
  it("should have correct metadata", () => {
    expect(vectorInnerProductScaling.id).toBe("vector-inner-product-scaling");
    expect(vectorInnerProductScaling.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(
      true,
    );
    expect(vectorInnerProductScaling.topicIds).toContain("ml_attention_geometry");
    expect(vectorInnerProductScaling.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateVectorInnerProductScalingSteps(DEFAULT_VECTORINNERPRODUCTSCALING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Initialize Vector Inner Product Scaling");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = VECTORINNERPRODUCTSCALING_CODE.trim().split("\n");
    const lineExplanations = vectorInnerProductScaling.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });

  it("should handle custom short input vector sizes without NaN", () => {
    const steps = generateVectorInnerProductScalingSteps({
      q: [1.0, 2.0, 3.0],
      k: [4.0, 5.0, 6.0],
      scaleFactor: 0.5,
    });
    expect(steps.length).toBeGreaterThan(0);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.scaledScore).toBe(16);
  });
});
