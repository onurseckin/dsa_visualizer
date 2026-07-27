import { describe, it, expect } from "vitest";
import { relativePositionInnerProductPreservation, DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT, generateRelativePositionInnerProductPreservationSteps } from "./relativePositionInnerProductPreservation";

describe("relative-position-inner-product-preservation (Relative Position Inner Product Preservation Proof)", () => {
  it("should have correct metadata", () => {
    expect(relativePositionInnerProductPreservation.id).toBe("relative-position-inner-product-preservation");
    expect(relativePositionInnerProductPreservation.isMlInfra).toBe(true);
    expect(relativePositionInnerProductPreservation.mlInfraLevel).toBe(7);
    expect(relativePositionInnerProductPreservation.mlInfraCategory).toBe("ml_attention_geometry");
    expect(relativePositionInnerProductPreservation.categories).toContain("ml_attention_geometry");
  });

  it("should generate valid algorithm steps", () => {
    const steps = generateRelativePositionInnerProductPreservationSteps(DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].explanation.what).toContain("Relative Position Inner Product Preservation Proof");
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");
  });
});
