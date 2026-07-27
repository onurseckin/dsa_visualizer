import { describe, it, expect } from "vitest";
import {
  minMaxRangeClipping,
  generateMinMaxRangeClippingSteps,
  DEFAULT_MINMAXRANGECLIPPING_INPUT,
} from "./minMaxRangeClipping";

describe("Min Max Range Clipping", () => {
  it("should have correct metadata", () => {
    expect(minMaxRangeClipping.id).toBe("min-max-range-clipping");
    expect(minMaxRangeClipping.title).toBe("Min Max Range Clipping");
    expect(minMaxRangeClipping.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateMinMaxRangeClippingSteps(DEFAULT_MINMAXRANGECLIPPING_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = minMaxRangeClipping.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = minMaxRangeClipping.code.split("\n");
    const lineExplanations = minMaxRangeClipping.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(minMaxRangeClipping.examples?.length).toBe(3);
  });
});
