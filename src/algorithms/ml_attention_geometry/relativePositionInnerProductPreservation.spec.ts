import { describe, it, expect } from "vitest";
import {
  relativePositionInnerProductPreservation,
  DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT,
  generateRelativePositionInnerProductPreservationSteps,
  RELATIVEPOSITIONINNERPRODUCTPRESERVATION_CODE,
} from "./relativePositionInnerProductPreservation";

describe("relative-position-inner-product-preservation (Relative Position Inner Product Preservation Proof)", () => {
  it("should have correct metadata", () => {
    expect(relativePositionInnerProductPreservation.id).toBe(
      "relative-position-inner-product-preservation",
    );
    expect(
      relativePositionInnerProductPreservation.topicIds.some((topicId) =>
        topicId.startsWith("ml_"),
      ),
    ).toBe(true);
    expect(relativePositionInnerProductPreservation.topicIds).toContain("ml_attention_geometry");
    expect(relativePositionInnerProductPreservation.topicIds).toContain("ml_attention_geometry");
  });

  it("should generate at least 20 algorithm steps with matrix visual snapshots", () => {
    const steps = generateRelativePositionInnerProductPreservationSteps(
      DEFAULT_RELATIVEPOSITIONINNERPRODUCTPRESERVATION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain(
      "Initialize RoPE Relative Inner Product Preservation Engine",
    );
    expect(steps[steps.length - 1].explanation.what).toBe("Execution Complete");

    steps.forEach((step) => {
      expect(step.primarySnapshot.kind).toBe("matrix");
    });
  });

  it("should map every code line in trivia.lineExplanations", () => {
    const codeLines = RELATIVEPOSITIONINNERPRODUCTPRESERVATION_CODE.trim().split("\n");
    const lineExplanations =
      relativePositionInnerProductPreservation.trivia?.lineExplanations || {};

    for (let i = 1; i <= codeLines.length; i++) {
      expect(lineExplanations[i]).toBeDefined();
      expect(lineExplanations[i].length).toBeGreaterThan(0);
    }
  });
});
