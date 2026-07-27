import { describe, it, expect } from "vitest";
import {
  scalarInt8Quantization,
  generateScalarInt8QuantizationSteps,
  DEFAULT_SCALARINT8QUANTIZATION_INPUT,
} from "./scalarInt8Quantization";

describe("Scalar Int8 Quantization", () => {
  it("should have correct metadata", () => {
    expect(scalarInt8Quantization.id).toBe("scalar-int8-quantization");
    expect(scalarInt8Quantization.title).toBe("Scalar Int8 Quantization");
    expect(scalarInt8Quantization.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateScalarInt8QuantizationSteps(DEFAULT_SCALARINT8QUANTIZATION_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = scalarInt8Quantization.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = scalarInt8Quantization.code.split("\n");
    const lineExplanations = scalarInt8Quantization.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(scalarInt8Quantization.examples?.length).toBe(3);
  });
});
