import { describe, it, expect } from "vitest";
import { vectorInnerProductScaling, DEFAULT_VECTORINNERPRODUCTSCALING_INPUT, generateVectorInnerProductScalingSteps } from "./vectorInnerProductScaling";

describe("vector-inner-product-scaling (Vector Inner Product Scaling)", () => {
  it("should have correct metadata", () => {
    expect(vectorInnerProductScaling.id).toBe("vector-inner-product-scaling");
    expect(vectorInnerProductScaling.isMlInfra).toBe(true);
    expect(vectorInnerProductScaling.mlInfraLevel).toBe(7);
    expect(vectorInnerProductScaling.mlInfraCategory).toBe("ml_attention_geometry");
    expect(vectorInnerProductScaling.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateVectorInnerProductScalingSteps(DEFAULT_VECTORINNERPRODUCTSCALING_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Vector Inner Product Scaling");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
