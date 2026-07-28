import { describe, it, expect } from "vitest";
import {
  strided1dDotProduct,
  DEFAULT_STRIDED1DDOTPRODUCT_INPUT,
  generateStrided1dDotProductSteps,
  STRIDED1DDOTPRODUCT_CODE,
} from "./strided1dDotProduct";

describe("strided-1d-dot-product (Strided 1D Vector Dot Product)", () => {
  it("should have correct metadata and structure", () => {
    expect(strided1dDotProduct.id).toBe("strided-1d-dot-product");
    expect(strided1dDotProduct.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(strided1dDotProduct.topicIds).toContain("ml_tensor_algebra");
    expect(strided1dDotProduct.topicIds).toContain("ml_tensor_algebra");
    expect(strided1dDotProduct.topicGuide?.sections.length).toBe(5);
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const totalLines = STRIDED1DDOTPRODUCT_CODE.split("\n").length;
    const explanations = strided1dDotProduct.trivia?.lineExplanations ?? {};
    for (let line = 1; line <= totalLines; line++) {
      expect(explanations[line], `Line ${line} missing in lineExplanations`).toBeDefined();
      expect(explanations[line].length).toBeGreaterThan(0);
    }
  });

  it("should generate >= 20 steps for default input and use vector snapshot", () => {
    const steps = generateStrided1dDotProductSteps(DEFAULT_STRIDED1DDOTPRODUCT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Strided 1D Vector Dot Product");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Final Dot Product");
    expect(steps[0].primarySnapshot.kind).toBe("vector");
  });

  it("should correctly compute strided dot product", () => {
    const vecA = [1, 2, 3, 4, 5, 6];
    const vecB = [2, 1, 4, 3, 6, 5];
    const steps = generateStrided1dDotProductSteps({
      vecA,
      vecB,
      strideA: 2,
      strideB: 2,
    });
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.dot_sum).toBe(44); // (1*2) + (3*4) + (5*6) = 2 + 12 + 30 = 44
  });
});
