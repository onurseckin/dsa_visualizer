import { describe, it, expect } from "vitest";
import {
  vectorDotProductMac,
  DEFAULT_VECTORDOTPRODUCTMAC_INPUT,
  generateVectorDotProductMacSteps,
  VECTORDOTPRODUCTMAC_CODE,
} from "./vectorDotProductMac";

describe("vector-dot-product-mac (Vector Multiply-Accumulate (MAC) Engine)", () => {
  it("should have correct metadata", () => {
    expect(vectorDotProductMac.id).toBe("vector-dot-product-mac");
    expect(vectorDotProductMac.topicIds.some((topicId) => topicId.startsWith("ml_"))).toBe(true);
    expect(vectorDotProductMac.topicIds).toContain("ml_gemm_roofline");
    expect(vectorDotProductMac.topicIds).toContain("ml_gemm_roofline");
  });

  it("should generate at least 20 steps with matrix snapshot for default input", () => {
    const steps = generateVectorDotProductMacSteps(DEFAULT_VECTORDOTPRODUCTMAC_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].explanation.what).toContain("Vector Multiply-Accumulate (MAC) Engine");
    expect(steps[0].primarySnapshot.kind).toBe("matrix");
    expect(steps[steps.length - 1].explanation.what).toContain("Return Final MAC Result");
  });

  it("should map every line of CODE in trivia.lineExplanations", () => {
    const codeLines = VECTORDOTPRODUCTMAC_CODE.split("\n");
    const totalLines = codeLines.length;

    expect(vectorDotProductMac.trivia).toBeDefined();
    if (vectorDotProductMac.trivia?.lineExplanations) {
      for (let line = 1; line <= totalLines; line++) {
        expect(vectorDotProductMac.trivia.lineExplanations[line]).toBeDefined();
        expect(typeof vectorDotProductMac.trivia.lineExplanations[line]).toBe("string");
        expect(vectorDotProductMac.trivia.lineExplanations[line].length).toBeGreaterThan(0);
      }
    }
  });

  it("should correctly compute dot product plus bias", () => {
    const input = {
      vec_a: [3, 5],
      vec_b: [2, 4],
      bias: 10,
    };
    const steps = generateVectorDotProductMacSteps(input);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.variables.accumulator).toBe(36); // 10 + (3*2 + 5*4) = 10 + 26 = 36
  });
});
