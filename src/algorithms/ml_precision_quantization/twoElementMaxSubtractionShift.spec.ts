import { describe, it, expect } from "vitest";
import {
  twoElementMaxSubtractionShift,
  generateTwoElementMaxSubtractionShiftSteps,
  DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT,
} from "./twoElementMaxSubtractionShift";

describe("Two Element Max Subtraction Shift", () => {
  it("should have correct metadata", () => {
    expect(twoElementMaxSubtractionShift.id).toBe("two-element-max-subtraction-shift");
    expect(twoElementMaxSubtractionShift.title).toBe("Two Element Max Subtraction Shift");
    expect(twoElementMaxSubtractionShift.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateTwoElementMaxSubtractionShiftSteps(
      DEFAULT_TWOELEMENTMAXSUBTRACTIONSHIFT_INPUT,
    );
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = twoElementMaxSubtractionShift.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = twoElementMaxSubtractionShift.code.split("\n");
    const lineExplanations = twoElementMaxSubtractionShift.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(twoElementMaxSubtractionShift.examples?.length).toBe(3);
  });
});
