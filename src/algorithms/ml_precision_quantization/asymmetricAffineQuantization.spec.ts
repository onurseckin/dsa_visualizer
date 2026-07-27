import { describe, it, expect } from "vitest";
import {
  asymmetricAffineQuantization,
  generateAsymmetricAffineQuantizationSteps,
  DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
} from "./asymmetricAffineQuantization";

describe("Asymmetric Affine Quantization", () => {
  it("should have correct metadata", () => {
    expect(asymmetricAffineQuantization.id).toBe("asymmetric-affine-quantization");
    expect(asymmetricAffineQuantization.title).toBe("Asymmetric Affine Quantization");
    expect(asymmetricAffineQuantization.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateAsymmetricAffineQuantizationSteps(
      DEFAULT_ASYMMETRICAFFINEQUANTIZATION_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = asymmetricAffineQuantization.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = asymmetricAffineQuantization.code.split("\n");
    const lineExplanations = asymmetricAffineQuantization.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(asymmetricAffineQuantization.examples?.length).toBe(3);
  });
});
