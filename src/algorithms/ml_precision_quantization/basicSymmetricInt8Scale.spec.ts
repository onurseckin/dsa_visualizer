import { describe, it, expect } from "vitest";
import {
  basicSymmetricInt8Scale,
  generateBasicSymmetricInt8ScaleSteps,
  DEFAULT_BASICSYMMETRICINT8SCALE_INPUT,
} from "./basicSymmetricInt8Scale";

describe("Basic Symmetric Int8 Scale", () => {
  it("should have correct metadata", () => {
    expect(basicSymmetricInt8Scale.id).toBe("basic-symmetric-int8-scale");
    expect(basicSymmetricInt8Scale.title).toBe("Basic Symmetric Int8 Scale");
    expect(basicSymmetricInt8Scale.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateBasicSymmetricInt8ScaleSteps(DEFAULT_BASICSYMMETRICINT8SCALE_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = basicSymmetricInt8Scale.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = basicSymmetricInt8Scale.code.split("\n");
    const lineExplanations = basicSymmetricInt8Scale.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(basicSymmetricInt8Scale.examples?.length).toBe(3);
  });
});
