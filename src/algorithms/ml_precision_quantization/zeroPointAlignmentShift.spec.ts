import { describe, it, expect } from "vitest";
import {
  zeroPointAlignmentShift,
  generateZeroPointAlignmentShiftSteps,
  DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT,
} from "./zeroPointAlignmentShift";

describe("Zero Point Alignment Shift", () => {
  it("should have correct metadata", () => {
    expect(zeroPointAlignmentShift.id).toBe("zero-point-alignment-shift");
    expect(zeroPointAlignmentShift.title).toBe("Zero Point Alignment Shift");
    expect(zeroPointAlignmentShift.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateZeroPointAlignmentShiftSteps(DEFAULT_ZEROPOINTALIGNMENTSHIFT_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = zeroPointAlignmentShift.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = zeroPointAlignmentShift.code.split("\n");
    const lineExplanations = zeroPointAlignmentShift.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(zeroPointAlignmentShift.examples?.length).toBe(3);
  });
});
