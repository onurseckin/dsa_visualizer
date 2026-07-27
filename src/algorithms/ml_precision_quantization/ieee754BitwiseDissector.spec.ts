import { describe, it, expect } from "vitest";
import {
  ieee754BitwiseDissector,
  generateIeee754BitwiseDissectorSteps,
  DEFAULT_IEEE754BITWISEDISSECTOR_INPUT,
} from "./ieee754BitwiseDissector";

describe("Ieee754 Bitwise Dissector", () => {
  it("should have correct metadata", () => {
    expect(ieee754BitwiseDissector.id).toBe("ieee-754-bitwise-dissector");
    expect(ieee754BitwiseDissector.title).toBe("Ieee754 Bitwise Dissector");
    expect(ieee754BitwiseDissector.category).toBe("ml_precision_quantization");
  });

  it("should generate valid steps (>= 20 steps)", () => {
    const steps = generateIeee754BitwiseDissectorSteps(DEFAULT_IEEE754BITWISEDISSECTOR_INPUT);
    expect(steps.length).toBeGreaterThanOrEqual(20);
    expect(steps[0].primarySnapshot.kind).toBe("quantization");
    expect(steps[steps.length - 1].variables).toBeDefined();

    const codeLines = ieee754BitwiseDissector.code.split("\n");
    steps.forEach((step) => {
      expect(step.codeLine).toBeGreaterThanOrEqual(1);
      expect(step.codeLine).toBeLessThanOrEqual(codeLines.length);
    });
  });

  it("should have complete trivia lineExplanations for every code line", () => {
    const codeLines = ieee754BitwiseDissector.code.split("\n");
    const lineExplanations = ieee754BitwiseDissector.trivia?.lineExplanations;
    expect(lineExplanations).toBeDefined();

    for (let lineNum = 1; lineNum <= codeLines.length; lineNum++) {
      expect(lineExplanations?.[lineNum]).toBeDefined();
      expect(typeof lineExplanations?.[lineNum]).toBe("string");
      expect(lineExplanations?.[lineNum].length).toBeGreaterThan(0);
    }
  });

  it("should have exactly 3 examples", () => {
    expect(ieee754BitwiseDissector.examples?.length).toBe(3);
  });
});
